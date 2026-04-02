const pool = require("../db/db");
const bcrypt = require("bcrypt");

const signup = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required." });
    }

    const existingUser = await pool.query(
      "SELECT * FROM Users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Username or email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === "admin" ? "admin" : "customer";

    const newUser = await pool.query(
      `INSERT INTO Users (username, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, username, email, role`,
      [username, email, hashedPassword, userRole]
    );

    // create empty cart for user
    await pool.query(
      `INSERT INTO Cart (user_id) VALUES ($1)`,
      [newUser.rows[0].user_id]
    );

    res.status(201).json({
      message: "User created successfully",
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error during signup." });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const result = await pool.query(
      "SELECT * FROM Users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    res.json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login." });
  }
};

module.exports = {
  signup,
  login
};