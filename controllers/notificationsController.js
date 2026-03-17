const { sendToClients } = require('../ws/websocket');

exports.sendOrderUpdate = (req, res) => {
  const { orderId, status } = req.query;

  sendToClients({ type: 'order-update', orderId, status });

  res.json({ success: true, message: `Order ${orderId} status sent as ${status}` });
};
