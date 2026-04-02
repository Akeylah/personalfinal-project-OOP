const pool = require("../db/db");

const getAllMenuItems = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM MenuItems ORDER BY item_id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Get menu error:", error);
    res.status(500).json({ error: "Failed to fetch menu items." });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM MenuItems WHERE item_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get menu item error:", error);
    res.status(500).json({ error: "Failed to fetch menu item." });
  }
};

const addMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image_url } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ error: "Name and price are required." });
    }

    const result = await pool.query(
      `INSERT INTO MenuItems (name, description, price, category, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description || "", price, category || "", image_url || ""]
    );

    res.status(201).json({
      message: "Menu item added successfully",
      item: result.rows[0]
    });
  } catch (error) {
    console.error("Add menu item error:", error);
    res.status(500).json({ error: "Failed to add menu item." });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url } = req.body;

    const result = await pool.query(
      `UPDATE MenuItems
       SET name = $1, description = $2, price = $3, category = $4, image_url = $5
       WHERE item_id = $6
       RETURNING *`,
      [name, description, price, category, image_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }

    res.json({
      message: "Menu item updated successfully",
      item: result.rows[0]
    });
  } catch (error) {
    console.error("Update menu item error:", error);
    res.status(500).json({ error: "Failed to update menu item." });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM MenuItems WHERE item_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }

    res.json({
      message: "Menu item deleted successfully",
      item: result.rows[0]
    });
  } catch (error) {
    console.error("Delete menu item error:", error);
    res.status(500).json({ error: "Failed to delete menu item." });
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
};