const express = require("express");
const router = express.Router();
const {
  getAllOrders,
  updateOrderStatus
} = require("../controller/ordercontroller");

router.get("/orders", getAllOrders);
router.put("/orders/:order_id/status", updateOrderStatus);

module.exports = router;