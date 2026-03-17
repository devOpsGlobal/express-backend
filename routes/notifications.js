const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');

// Send order update via GET (e.g., ?orderId=123&status=ready)
router.get('/order-update', notificationsController.sendOrderUpdate);

module.exports = router;
