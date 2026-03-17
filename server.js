const path = require("path");
const config = require("./configs/config");
const app = require("./app");
const { initWebSocket } = require("./ws/websocket");
const express = require("express");

app.use(express.static(path.join(__dirname, "..", "client", "dist")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "dist", "index.html"));
});

initWebSocket();

app.listen(config.port || 8000, "0.0.0.0", () => {
    console.log(`☑️ Server running at http://localhost:${config.port || 8000}`);
    console.log(`☑️  Public Server running at http://192.0.0.0:${config.port || 8000}`);
});
