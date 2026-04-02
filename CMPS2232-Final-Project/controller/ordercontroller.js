const pool = require("../db/db");

const addToCart = async (req, res) => {
  try {
    const { user_id, item_id, quantity } = req.body;

    if (!user_id || !item_id || !quantity) {
      return res.status(400).json({ error: "user_id, item_id, and quantity are required." });
    }

    const cartResult = await pool.query(
      "SELECT cart_id FROM Cart WHERE user_id = $1",
      [user_id]
    );

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: "Cart not found for user." });
    }

    const cart_id = cartResult.rows[0].cart_id;

    const existingItem = await pool.query(
      "SELECT * FROM CartItems WHERE cart_id = $1 AND item_id = $2",
      [cart_id, item_id]
    );

    if (existingItem.rows.length > 0) {
      await pool.query(
        `UPDATE CartItems
         SET quantity = quantity + $1
         WHERE cart_id = $2 AND item_id = $3`,
        [quantity, cart_id, item_id]
      );
    } else {
      await pool.query(
        `INSERT INTO CartItems (cart_id, item_id, quantity)
         VALUES ($1, $2, $3)`,
        [cart_id, item_id, quantity]
      );
    }

    res.json({ message: "Cart updated successfully." });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ error: "Failed to add item to cart." });
  }
};

const getCart = async (req, res) => {
  try {
    const { user_id } = req.params;

    const cartResult = await pool.query(
      "SELECT cart_id FROM Cart WHERE user_id = $1",
      [user_id]
    );

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: "Cart not found." });
    }

    const cart_id = cartResult.rows[0].cart_id;

    const itemsResult = await pool.query(
      `SELECT 
          ci.cart_item_id,
          ci.item_id,
          m.name,
          m.price,
          ci.quantity,
          (m.price * ci.quantity) AS subtotal
       FROM CartItems ci
       JOIN MenuItems m ON ci.item_id = m.item_id
       WHERE ci.cart_id = $1
       ORDER BY ci.cart_item_id ASC`,
      [cart_id]
    );

    const total = itemsResult.rows.reduce((sum, item) => sum + Number(item.subtotal), 0);

    res.json({
      cart_id,
      items: itemsResult.rows,
      total
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ error: "Failed to fetch cart." });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { cart_item_id } = req.params;

    const result = await pool.query(
      "DELETE FROM CartItems WHERE cart_item_id = $1 RETURNING *",
      [cart_item_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cart item not found." });
    }

    res.json({ message: "Item removed from cart." });
  } catch (error) {
    console.error("Remove cart item error:", error);
    res.status(500).json({ error: "Failed to remove item from cart." });
  }
};

const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, order_type, address, payment_method } = req.body;

    if (!user_id || !order_type) {
      return res.status(400).json({ error: "user_id and order_type are required." });
    }

    await client.query("BEGIN");

    // get cart
    const cartResult = await client.query(
      "SELECT cart_id FROM Cart WHERE user_id = $1",
      [user_id]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Cart not found." });
    }

    const cart_id = cartResult.rows[0].cart_id;

    // get cart items
    const cartItemsResult = await client.query(
      `SELECT 
          ci.item_id,
          ci.quantity,
          m.price
       FROM CartItems ci
       JOIN MenuItems m ON ci.item_id = m.item_id
       WHERE ci.cart_id = $1`,
      [cart_id]
    );

    if (cartItemsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart is empty." });
    }

    // calculate total
    let totalPrice = 0;
    for (const item of cartItemsResult.rows) {
      totalPrice += Number(item.price) * Number(item.quantity);
    }

    let deliveryFee = 0;
    if (order_type === "delivery") {
      deliveryFee = 5.0;
      totalPrice += deliveryFee;
    }

    // create order
    const orderResult = await client.query(
      `INSERT INTO Orders (user_id, order_type, status, total_price)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [user_id, order_type, totalPrice]
    );

    const order = orderResult.rows[0];

    // save order items
    for (const item of cartItemsResult.rows) {
      await client.query(
        `INSERT INTO OrderItems (order_id, item_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [order.order_id, item.item_id, item.quantity, item.price]
      );
    }

    // delivery details
    if (order_type === "delivery") {
      if (!address) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Address is required for delivery orders." });
      }

      await client.query(
        `INSERT INTO DeliveryDetails (order_id, address, delivery_fee)
         VALUES ($1, $2, $3)`,
        [order.order_id, address, deliveryFee]
      );
    }

    // payment
    const finalPaymentMethod =
      payment_method ||
      (order_type === "delivery" ? "cash_on_delivery" : "pickup_payment");

    await client.query(
      `INSERT INTO Payments (order_id, method, payment_status)
       VALUES ($1, $2, 'pending')`,
      [order.order_id, finalPaymentMethod]
    );

    // clear cart
    await client.query(
      "DELETE FROM CartItems WHERE cart_id = $1",
      [cart_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Order placed successfully",
      order_id: order.order_id,
      total_price: order.total_price
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create order." });
  } finally {
    client.release();
  }
};

const getOrdersByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM Orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.username
       FROM Orders o
       JOIN Users u ON o.user_id = u.user_id
       ORDER BY o.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ error: "Failed to fetch all orders." });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid order status." });
    }

    const result = await pool.query(
      `UPDATE Orders
       SET status = $1
       WHERE order_id = $2
       RETURNING *`,
      [status, order_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({
      message: "Order status updated successfully",
      order: result.rows[0]
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Failed to update order status." });
  }
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  createOrder,
  getOrdersByUser,
  getAllOrders,
  updateOrderStatus
};