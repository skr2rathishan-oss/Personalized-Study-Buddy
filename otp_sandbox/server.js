const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve Static Files
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

// --- API PROXY ---
const API_URL_REQUEST = "https://api.mspace.lk/otp/request";
const API_URL_VERIFY = "https://api.mspace.lk/otp/verify";

app.post('/api/send-otp', async (req, res) => {
    const { app_id, password, phone } = req.body;

    // Format Phone
    const subscriberId = phone.startsWith('tel:') ? phone : `tel:${phone}`;

    const payload = {
        applicationId: app_id,
        password: password,
        subscriberId: subscriberId,
        applicationMetaData: {
            client: "WEB_TESTER",
            device: "Browser",
            os: "Web",
            appCode: "WEB_TESTER"
        }
    };

    try {
        console.log(`Sending OTP to ${subscriberId}...`);
        const response = await axios.post(API_URL_REQUEST, payload);
        res.json(response.data);
    } catch (error) {
        console.error("Error from mSpace:", error.response?.data || error.message);
        res.status(500).json(error.response?.data || { error: error.message });
    }
});

app.post('/api/verify-otp', async (req, res) => {
    const { app_id, password, ref_no, otp } = req.body;

    const payload = {
        applicationId: app_id,
        password: password,
        referenceNo: ref_no,
        otp: otp
    };

    try {
        console.log(`Verifying OTP Ref: ${ref_no}...`);
        const response = await axios.post(API_URL_VERIFY, payload);
        res.json(response.data);
    } catch (error) {
        console.error("Error from mSpace:", error.response?.data || error.message);
        res.status(500).json(error.response?.data || { error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 OTP Server running at http://localhost:${PORT}`);
    console.log(`👉 Test Page: http://localhost:${PORT}/test.html`);
    console.log(`👉 Main App:  http://localhost:${PORT}/app.html\n`);
});
