const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool - UPDATE THESE WITH YOUR CREDENTIALS
const pool = new Pool({
    user: 'postgres',     // Change to your PostgreSQL username
    host: 'localhost',
    database: 'restaurant_OOP',  // Change to your database name
    password: 'akeylah',  // Change to your PostgreSQL password
    port: 5432,
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to database:', err.stack);
    } else {
        console.log('✅ Connected to PostgreSQL database');
        release();
    }
});

// ============ AUTHENTICATION ROUTES ============

// Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        // Check if user exists
        const userCheck = await pool.query(
            'SELECT * FROM Users WHERE username = $1 OR email = $2',
            [username, email]
        );
        
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user
        const result = await pool.query(
            'INSERT INTO Users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, role',
            [username, email, hashedPassword, role || 'customer']
        );
        
        // Create cart for new user
        await pool.query(
            'INSERT INTO Cart (user_id) VALUES ($1)',
            [result.rows[0].user_id]
        );
        
        res.json({ message: 'Signup successful', user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const result = await pool.query(
            'SELECT * FROM Users WHERE username = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Remove password from response
        delete user.password;
        
        res.json({ message: 'Login successful', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============ MENU ROUTES ============

// Get all menu items
app.get('/api/menu', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM MenuItems ORDER BY item_id');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

// ============ CART ROUTES ============

// Helper function to ensure user has a cart
async function ensureCart(userId) {
    let cartResult = await pool.query(
        'SELECT cart_id FROM Cart WHERE user_id = $1',
        [userId]
    );
    
    if (cartResult.rows.length === 0) {
        const newCart = await pool.query(
            'INSERT INTO Cart (user_id) VALUES ($1) RETURNING cart_id',
            [userId]
        );
        return newCart.rows[0].cart_id;
    }
    return cartResult.rows[0].cart_id;
}

// Get user's cart
app.get('/api/orders/cart/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get or create cart
        const cartId = await ensureCart(userId);
        
        // Get cart items with details
        const cartItems = await pool.query(
            `SELECT ci.cart_item_id, ci.item_id, ci.quantity, mi.name, mi.price, 
                    (ci.quantity * mi.price) as subtotal
             FROM CartItems ci
             JOIN MenuItems mi ON ci.item_id = mi.item_id
             WHERE ci.cart_id = $1`,
            [cartId]
        );
        
        const total = cartItems.rows.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        
        res.json({ items: cartItems.rows, total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Add item to cart
app.post('/api/orders/cart/add', async (req, res) => {
    try {
        const { user_id, item_id, quantity } = req.body;
        
        // Get or create cart
        const cartId = await ensureCart(user_id);
        
        // Check if item already in cart
        const existing = await pool.query(
            'SELECT * FROM CartItems WHERE cart_id = $1 AND item_id = $2',
            [cartId, item_id]
        );
        
        if (existing.rows.length > 0) {
            // Update quantity
            await pool.query(
                'UPDATE CartItems SET quantity = quantity + $1 WHERE cart_id = $2 AND item_id = $3',
                [quantity, cartId, item_id]
            );
        } else {
            // Insert new cart item
            await pool.query(
                'INSERT INTO CartItems (cart_id, item_id, quantity) VALUES ($1, $2, $3)',
                [cartId, item_id, quantity]
            );
        }
        
        res.json({ message: 'Item added to cart' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Remove item from cart
app.delete('/api/orders/cart/item/:cartItemId', async (req, res) => {
    try {
        const { cartItemId } = req.params;
        await pool.query('DELETE FROM CartItems WHERE cart_item_id = $1', [cartItemId]);
        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

// ============ ORDER ROUTES ============

// Create order
app.post('/api/orders/create', async (req, res) => {
    const client = await pool.connect();
    try {
        const { user_id, order_type, address, payment_method } = req.body;
        
        await client.query('BEGIN');
        
        // Get cart
        const cartResult = await client.query(
            'SELECT cart_id FROM Cart WHERE user_id = $1',
            [user_id]
        );
        
        if (cartResult.rows.length === 0) {
            throw new Error('No cart found for user');
        }
        
        const cartId = cartResult.rows[0].cart_id;
        
        // Get cart items
        const cartItems = await client.query(
            `SELECT ci.item_id, ci.quantity, mi.price
             FROM CartItems ci
             JOIN MenuItems mi ON ci.item_id = mi.item_id
             WHERE ci.cart_id = $1`,
            [cartId]
        );
        
        if (cartItems.rows.length === 0) {
            throw new Error('Cart is empty');
        }
        
        // Calculate total
        const total_price = cartItems.rows.reduce(
            (sum, item) => sum + (parseFloat(item.price) * item.quantity), 0
        );
        
        // Create order
        const orderResult = await client.query(
            `INSERT INTO Orders (user_id, order_type, total_price, status)
             VALUES ($1, $2, $3, 'pending')
             RETURNING order_id`,
            [user_id, order_type, total_price]
        );
        
        const orderId = orderResult.rows[0].order_id;
        
        // Add order items
        for (const item of cartItems.rows) {
            await client.query(
                `INSERT INTO OrderItems (order_id, item_id, quantity, price)
                 VALUES ($1, $2, $3, $4)`,
                [orderId, item.item_id, item.quantity, item.price]
            );
        }
        
        // Add delivery details if applicable
        if (order_type === 'delivery' && address) {
            await client.query(
                `INSERT INTO DeliveryDetails (order_id, address, delivery_fee)
                 VALUES ($1, $2, 5.00)`,
                [orderId, address]
            );
        }
        
        // Add payment record
        await client.query(
            `INSERT INTO Payments (order_id, method, payment_status)
             VALUES ($1, $2, 'pending')`,
            [orderId, payment_method]
        );
        
        // Clear cart
        await client.query('DELETE FROM CartItems WHERE cart_id = $1', [cartId]);
        
        await client.query('COMMIT');
        
        res.json({ message: 'Order created successfully', order_id: orderId, total_price });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Get user orders
app.get('/api/orders/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT o.*, 
                    COALESCE(d.address, 'Pickup order') as delivery_address
             FROM Orders o
             LEFT JOIN DeliveryDetails d ON o.order_id = d.order_id
             WHERE o.user_id = $1 
             ORDER BY o.created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// ============ ADMIN ROUTES ============

// Get all orders (admin)
app.get('/api/admin/orders', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*, u.username, 
                    COALESCE(d.address, 'Pickup') as delivery_address
             FROM Orders o
             JOIN Users u ON o.user_id = u.user_id
             LEFT JOIN DeliveryDetails d ON o.order_id = d.order_id
             ORDER BY o.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Update order status (admin)
app.put('/api/admin/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        const result = await pool.query(
            'UPDATE Orders SET status = $1 WHERE order_id = $2 RETURNING order_id',
            [status, orderId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});