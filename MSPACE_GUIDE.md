# mSpace Integration Guide

## Overview
This guide details the integration of the Mobitel mSpace Subscription API into the Study Buddy application. The integration enables mobile number verification and recurring charging for premium features.

## Prerequisites
1.  **mSpace Account**: You must have an active Service Provider account on the mSpace portal.
2.  **Public Host**: Your application backend must be publicly accessible (e.g., via Cloudflare Tunnel or VPS) to receive callbacks.

## Workflow

### 1. mSpace Portal Configuration
Before running the code, configure your app in the mSpace portal:
1.  **Create App**: Log in -> "Inspire Module" -> "Create New App".
2.  **Host Address**: Add your public IP or Hostname (e.g., `https://your-tunnel-url.trycloudflare.com`). **Note:** For dynamic tunnels, update this every session.
3.  **API Config**:
    *   **SMS API**: Set "Mobile Originated URL" and "Default Send Address" (e.g., `StudyBuddy`).
    *   **Cash API (Charging)**: Set "Charging Notification URL" to `[YOUR_HOST]/api/mspace/callback`.
    *   **Subscription API**: Configure "Subscription Response Message" (e.g., "Welcome to Study Buddy Premium!").
4.  **Approval**: Submit for approval. Once 'Active', get your `Application ID` and `Password` (via email).

### 2. Application Configuration
Update `backend/.env` with your credentials:
```env
MSPACE_APP_ID=your_actual_app_id
MSPACE_PASSWORD=your_received_password
MSPACE_API_URL=https://api.mspace.lk # Check portal for exact base URL
```

### 3. User Flow
1.  **Register/Login**: User enters their phone number.
2.  **OTP Request**: App sends phone number to Backend -> Backend requests OTP from mSpace (Action Code '1').
3.  **User Verification**: User receives SMS OTP and enters it in the app.
4.  **Confirmation**: App sends OTP + Phone to Backend -> Backend forwards to mSpace for verification (Action Code '2').
5.  **Subscription**: If OTP matches, mSpace registers the user for the subscription.
6.  **Charging**: mSpace attempts to charge the user.
7.  **Callback**: mSpace sends a POST request to `/api/mspace/callback` with the charging status.
    *   **Success**: Application grants Premium access.
    *   **Failure**: Application notifies user or restricts access.

### 4. Code Implementation Status
- [x] **Frontend**: OTP Entry UI (`OtpVerification.tsx`) connected to Backend.
- [x] **Backend**: `/auth/otp/send` and `/auth/otp/verify` endpoints updated with mSpace logic placeholders.
- [x] **Callback**: `/api/mspace/callback` endpoint created to handle notifications.

## Testing
- **Local Dev**: Use `python share_app_cf.py` to get a public URL. Update mSpace portal with this URL.
- **Numbers**: Use Whitelisted numbers configured in the mSpace portal for testing initially.
