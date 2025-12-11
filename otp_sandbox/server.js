require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Serve the test page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

const MSPACE_URL = "https://api.mspace.lk/otp/request";
const MSPACE_VERIFY_URL = "https://api.mspace.lk/otp/verify";

function getHeaders() {
    return {
        'Content-Type': 'application/json'
    };
}

/**
 * Endpoint to Send OTP
 * Payload constructed exactly as requested.
 */
app.post('/api/send-otp', async (req, res) => {
    try {
        const { subscriberId } = req.body;

        if (!subscriberId) {
            return res.status(400).json({ error: "Subscriber ID (phone number) is required" });
        }

        // 1. Prepare Payload
        // Using environment variables for credentials as requested
        const payload = {
            applicationId: process.env.MSPACE_APP_ID,
            password: process.env.MSPACE_PASSWORD,
            subscriberId: subscriberId, // Expected format: "tel:947XXXXXXXX"
            applicationHash: "abcdefgh", // Optional hash from example
            applicationMetaData: {
                client: "MOBILEAPP",
                device: "Samsung S10",
                os: "android 8",
                appCode: "https://play.google.com/store/apps/details?id=lk"
            }
        };

        console.log("Sending OTP Request:", JSON.stringify(payload, null, 2));

        // 2. Call mSpace API
        const response = await axios.post(MSPACE_URL, payload, { headers: getHeaders() });

        console.log("mSpace Response:", response.data);
        res.json(response.data);

    } catch (error) {
        console.error("Error sending OTP:", error.response ? error.response.data : error.message);
        res.status(500).json({
            error: "Failed to send OTP",
            details: error.response ? error.response.data : error.message
        });
    }
});

/**
 * Endpoint to Verify OTP
 * Needed to complete the flow
 */
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { referenceNo, otp } = req.body;

        const payload = {
            applicationId: process.env.MSPACE_APP_ID,
            password: process.env.MSPACE_PASSWORD,
            referenceNo: referenceNo,
            otp: otp
        };

        console.log("Verifying OTP:", JSON.stringify(payload, null, 2));

        const response = await axios.post(MSPACE_VERIFY_URL, payload, { headers: getHeaders() });

        console.log("Verification Response:", response.data);
        res.json(response.data);

    } catch (error) {
        console.error("Error verifying OTP:", error.response ? error.response.data : error.message);
        res.status(500).json({
            error: "Failed to verify OTP",
            details: error.response ? error.response.data : error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 OTP Proxy Server running on http://localhost:${PORT}`);
    console.log(`👉 Open http://localhost:${PORT} to test`);
});
