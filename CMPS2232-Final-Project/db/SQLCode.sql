DROP TABLE IF EXISTS Payments CASCADE;
DROP TABLE IF EXISTS DeliveryDetails CASCADE;
DROP TABLE IF EXISTS OrderItems CASCADE;
DROP TABLE IF EXISTS Orders CASCADE;
DROP TABLE IF EXISTS CartItems CASCADE;
DROP TABLE IF EXISTS Cart CASCADE;
DROP TABLE IF EXISTS MenuItems CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

DROP TYPE IF EXISTS Users_role_enum CASCADE;
DROP TYPE IF EXISTS Orders_order_type_enum CASCADE;
DROP TYPE IF EXISTS Orders_status_enum CASCADE;
DROP TYPE IF EXISTS Payments_method_enum CASCADE;
DROP TYPE IF EXISTS Payments_payment_status_enum CASCADE;

CREATE TYPE Users_role_enum AS ENUM ('customer', 'admin');

CREATE TYPE Orders_order_type_enum AS ENUM ('pickup', 'delivery');

CREATE TYPE Orders_status_enum AS ENUM (
    'pending',
    'preparing',
    'ready',
    'completed',
    'cancelled'
);

CREATE TYPE Payments_method_enum AS ENUM (
    'cash_on_delivery',
    'pickup_payment'
);

CREATE TYPE Payments_payment_status_enum AS ENUM (
    'pending',
    'paid'
);

CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role Users_role_enum NOT NULL DEFAULT 'customer'
);

CREATE TABLE MenuItems (
    item_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(255)
);

CREATE TABLE Cart (
    cart_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE CartItems (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    FOREIGN KEY (cart_id) REFERENCES Cart(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES MenuItems(item_id) ON DELETE CASCADE,
    UNIQUE (cart_id, item_id)
);

CREATE TABLE Orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    order_type Orders_order_type_enum NOT NULL,
    status Orders_status_enum DEFAULT 'pending',
    total_price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE OrderItems (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES MenuItems(item_id) ON DELETE CASCADE
);

CREATE TABLE DeliveryDetails (
    delivery_id SERIAL PRIMARY KEY,
    order_id INT UNIQUE NOT NULL,
    address VARCHAR(255) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE
);

CREATE TABLE Payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    method Payments_method_enum NOT NULL,
    payment_status Payments_payment_status_enum DEFAULT 'pending',
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE
);

-- Sample menu data
INSERT INTO MenuItems (name, description, price, category, image_url) VALUES
('Burger', 'Juicy beef burger with cheese', 10.99, 'Main', 'burger.jpg'),
('Fries', 'Crispy golden fries', 4.99, 'Side', 'fries.jpg'),
('Pizza', 'Pepperoni pizza slice', 12.50, 'Main', 'pizza.jpg'),
('Salad', 'Fresh garden salad', 7.25, 'Healthy', 'salad.jpg'),
('Soda', 'Cold soft drink', 2.50, 'Drink', 'soda.jpg');