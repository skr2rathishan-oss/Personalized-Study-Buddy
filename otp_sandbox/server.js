// server.js (Notification Listener Mode)
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// === MIDDLEWARE ===
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve UI

// === STORAGE ===
const notifications = [];

// === ROUTES ===

// 1. Serve Dashboard
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// 2. Subscription Notification (Webhook from mSpace)
app.post("/subscription-notification", (req, res) => {
    console.log(`[${new Date().toISOString()}] Webhook Received`);
    console.log(JSON.stringify(req.body, null, 2));

    const notif = {
        ...req.body,
        receivedAt: new Date().toISOString()
    };
    notifications.unshift(notif);

    if (notifications.length > 50) notifications.pop();

    res.json({ status: "Received", timestamp: new Date() });
});

// 3. Get Notifications API (For Dashboard)
app.get("/notifications", (req, res) => {
    res.json(notifications);
});

// === START SERVER ===
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n-----------------------------------------------------------`);
    console.log(`🚀 Notification Listener running at: http://0.0.0.0:${PORT}`);
    console.log(`👉 View Dashboard: http://20.244.40.57:${PORT}/`);
    console.log(`-----------------------------------------------------------\n`);
});
