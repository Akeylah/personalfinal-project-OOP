const express = require("express");
const router = express.Router();
const {
  getAllMenuItems,
  getMenuItemById,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require("../controller/menucontroller");

router.get("/", getAllMenuItems);
router.get("/:id", getMenuItemById);

// admin-style menu management
router.post("/", addMenuItem);
router.put("/:id", updateMenuItem);
router.delete("/:id", deleteMenuItem);

module.exports = router;