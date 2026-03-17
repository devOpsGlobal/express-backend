const WebSocket = require('ws');
const config = require('../configs/config');

let wss;

const initWebSocket = () => {
  wss = new WebSocket.Server({ 
    port: config.wsPort,
    host: '192.168.8.181'  // allows access from same wifi network
  });

  wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to server' }));

    ws.on('message', (msg) => {
      console.log('Received:', msg.toString());
    });

    ws.on('close', () => console.log('Client disconnected'));
  });

  console.log(`☑️  WebSocket running on ws://http://192.168.8.181:${config.wsPort}`);
  return wss;
};

const sendToClients = (data) => {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

module.exports = { initWebSocket, sendToClients };
