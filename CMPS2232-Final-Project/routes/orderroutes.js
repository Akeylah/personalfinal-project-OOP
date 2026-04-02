const express = require("express");
const router = express.Router();
const {
  addToCart,
  getCart,
  removeFromCart,
  createOrder,
  getOrdersByUser
} = require("../controller/ordercontroller");

// cart routes
router.post("/cart/add", addToCart);
router.get("/cart/:user_id", getCart);
router.delete("/cart/item/:cart_item_id", removeFromCart);

// order routes
router.post("/create", createOrder);
router.get("/user/:user_id", getOrdersByUser);

module.exports = router;