The **`/webhook` endpoint** is the publicly accessible URL where Meta sends all incoming messages or events related to your WhatsApp Business API account. To make it work, you need to configure the webhook in the Meta (Facebook) Developers dashboard. Here’s how it works:

### **Step 1: Configure Webhook in Meta Dashboard**

1. Go to the [Meta for Developers dashboard](https://developers.facebook.com/).
2. Select your app and navigate to **WhatsApp > Configuration**.
3. Under **Webhook**:
   - Click **Edit Callback URL**.
   - Enter your public URL (e.g., `https://abc123.ngrok.io/webhook`).
   - Add a **Verify Token** (e.g., `my-verify-token`).
4. Meta will send a verification request to your webhook. The `/webhook` endpoint in your code will handle this verification by responding with the challenge sent by Meta.

---

### **Step 3: Meta Verification in `/webhook` Endpoint**

In your code, the `/webhook` endpoint should handle the verification process. Here's how it works:

1. When you add the webhook URL, Meta sends a `GET` request to your server with the following query parameters:

   - `hub.mode`
   - `hub.verify_token`
   - `hub.challenge`
2. Your server must respond with the `hub.challenge` if the `hub.verify_token` matches the one you configured.

Here’s the code for handling webhook verification:

```javascript
app.get('/webhook', (req, res) => {
    ...
    ...
});
```

---

### **Summary Workflow**

1. **Meta sends verification request** → `/webhook` verifies the token and responds with `hub.challenge`.
2. **User sends a message on WhatsApp** → Meta forwards the message to your `/webhook` endpoint.
3. **Your bot processes the message** → Responds using the Cloud API.

---

> The WhatsApp Cloud API does not support using localhost as a webhook URL directly. The webhook URL must be a publicly accessible URL over HTTPS. This is because Meta's servers need to send requests to your webhook, and they cannot reach your local machine.

The **access token** used to authenticate with the WhatsApp Cloud API has expired. The common issue with short-lived access tokens, which are valid only for a limited time (usually 24 hours).

---

### **How to Resolve:**

#### **Option 1: Generate a New Access Token**

1. **Go to the Meta Developers Dashboard** :
   * Navigate to your app in the[Meta for Developers dashboard](https://developers.facebook.com/).
2. **Generate a New Access Token** :
   * Go to**WhatsApp > API Setup** or**WhatsApp > Configuration** .
   * Under**Access Tokens** , generate a new token.
3. **Replace the Expired Token in Your Code** :
   * Update the`accessToken` variable in your code with the new token.

#### **Option 2: Use a Long-Lived Access Token**

To avoid frequently regenerating tokens, create a long-lived access token.

1. **Step 1: Get a Permanent Page Access Token**
   Use the following steps:
   * Go to**Tools > Access Token Debugger** in the Meta Developers dashboard.
   * Debug your current token.
   * Extend it into a long-lived token.
   * Reference:[Meta Token Generation Guide](https://developers.facebook.com/docs/pages/access-tokens).
2. **Step 2: Replace Short-Lived Token**
   Update your application to use the long-lived token.

---

### **Programmatically Handle Expired Tokens**

To improve the reliability of your bot, implement automatic token renewal or error handling.

#### Example:

1. **Check for Expired Tokens** :
   ```javascript
   async function sendMessageWithRetry(to, message) {
       try {
           await axios.post(
               `https://graph.facebook.com/v16.0/${phoneNumberId}/messages`,
               {
                   messaging_product: 'whatsapp',
                   to,
                   type: 'text',
                   text: { body: message },
               },
               {
                   headers: {
                       Authorization: `Bearer ${accessToken}`,
                       'Content-Type': 'application/json',
                   },
               }
           );
       } catch (error) {
           if (error.response?.data?.error?.code === 190) {
               console.error('Access token expired. Please refresh the token.');
               // Optionally trigger a token refresh workflow
           } else {
               console.error('Failed to send message:', error);
           }
       }
   }
   ```
2. **Refresh Token Workflow** :
   Use a background process or CRON job to periodically renew tokens and keep them up to date.

---

### **Additional Notes**

* Short-lived tokens are fine for testing, but for production, always use long-lived tokens.
* Avoid hardcoding tokens in your source code. Store them in environment variables or a secure secret management tool.
