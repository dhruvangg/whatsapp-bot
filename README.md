[![CI Status](https://github.com/dhruvangg/whatsapp-bot/actions/workflows/node.js.yml/badge.svg)]()

### **Step-by-Step Guide to Create a WhatsApp Bot with Interactive Buttons Using WhatsApp Cloud API**

This guide will walk you through setting up a WhatsApp bot with interactive buttons. The bot will ask users predefined questions and handle responses dynamically.

---

### **Step 1: Set Up a Meta (Facebook) App**
1. **Go to the Meta Developer Portal**:
   - [Meta for Developers](https://developers.facebook.com/)
2. **Create a New App**:
   - Choose "Business" as the app type.
   - Fill in the details and click "Create App."
3. **Add WhatsApp to Your App**:
   - In the App Dashboard, click **Add Product** and select **WhatsApp**.

---

### **Step 2: Set Up WhatsApp Business API**
1. **Register a Business Account**:
   - Go to the [Business Manager](https://business.facebook.com/) and create a business account.
2. **Get a WhatsApp Business Phone Number**:
   - Add and verify your phone number for WhatsApp Business.
3. **Generate an API Key**:
   - Navigate to **WhatsApp > Getting Started** in the Meta Developer Portal.
   - Generate a temporary access token (valid for 24 hours) or create a permanent access token using a system user.

   📄 **Documentation**: [Getting Started with WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/get-started)

---

### **Step 3: Install Node.js and Required Libraries**
1. **Initialize a Node.js Project**:
   ```bash
   mkdir whatsapp-bot
   cd whatsapp-bot
   npm init -y
   ```
2. **Install Dependencies**:
   ```bash
   npm install express body-parser axios
   ```
   - **`express`**: Web framework for the webhook endpoint.
   - **`body-parser`**: Parses incoming request bodies.
   - **`axios`**: Makes API requests.

---

### **Step 4: Create the Webhook Server**
1. **Set Up a Webhook Server**:

    > Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples

   Create a file called `index.js` and include the following code:
   ```javascript
   const express = require('express');
   const bodyParser = require('body-parser');
   const axios = require('axios');

   const app = express();
   app.use(bodyParser.json());

   const phoneNumberId = 'YOUR_PHONE_NUMBER_ID'; // Replace with your WhatsApp phone number ID
   const accessToken = 'YOUR_ACCESS_TOKEN'; // Replace with your access token

   // Webhook endpoint
   app.post('/webhook', (req, res) => {
       const body = req.body;

       if (body.object === 'whatsapp_business_account') {
           body.entry.forEach((entry) => {
               entry.changes.forEach((change) => {
                   const value = change.value;
                   if (value.messages && value.messages.length > 0) {
                       const message = value.messages[0];
                       const from = message.from;
                       const type = message.type;
                       let userInput = null;

                       if (type === 'text') {
                           userInput = message.text.body;
                       } else if (type === 'interactive') {
                           const interactiveType = message.interactive.type;
                           if (interactiveType === 'button_reply') {
                               userInput = message.interactive.button_reply.title;
                           }
                       }

                       if (userInput) {
                           handleIncomingMessage(from, userInput);
                       }
                   }
               });
           });
           res.sendStatus(200);
       } else {
           res.sendStatus(404);
       }
   });

   // Start the server
   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => {
       console.log(`Server is running on port ${PORT}`);
   });
   ```

2. **Create a Helper Function for Sending Buttons**:
   ```javascript
   async function sendButtons(to, text, buttons) {
       const formattedButtons = buttons.slice(0, 3).map((button, index) => ({
           type: 'reply',
           reply: { id: `button_${index + 1}`, title: button },
       }));

       try {
           await axios.post(
               `https://graph.facebook.com/v16.0/${phoneNumberId}/messages`,
               {
                   messaging_product: 'whatsapp',
                   to,
                   type: 'interactive',
                   interactive: {
                       type: 'button',
                       body: { text },
                       action: { buttons: formattedButtons },
                   },
               },
               {
                   headers: {
                       Authorization: `Bearer ${accessToken}`,
                       'Content-Type': 'application/json',
                   },
               }
           );
       } catch (error) {
           console.error('Error sending buttons:', error.response?.data || error.message);
       }
   }
   ```

3. **Create a Helper Function for Sending Text Messages**:
   ```javascript
   async function sendMessage(to, text) {
       try {
           await axios.post(
               `https://graph.facebook.com/v16.0/${phoneNumberId}/messages`,
               {
                   messaging_product: 'whatsapp',
                   to,
                   type: 'text',
                   text: { body: text },
               },
               {
                   headers: {
                       Authorization: `Bearer ${accessToken}`,
                       'Content-Type': 'application/json',
                   },
               }
           );
       } catch (error) {
           console.error('Error sending message:', error.response?.data || error.message);
       }
   }
   ```

4. **Define the Logic for Handling Messages**:
   ```javascript
   const userStates = {}; // Keeps track of user conversation states

   async function handleIncomingMessage(from, text) {
       if (!userStates[from]) {
           userStates[from] = { step: 0, orderItem: null, quantity: null };
       }

       const userState = userStates[from];

       if (userState.step === 0) {
           await sendButtons(from, 'What would you like to order?', [
               'Bournvita',
               'Tea',
               'Coffee',
               'Bread Slice',
           ]);
           userState.step = 1;
       } else if (userState.step === 1) {
           if (['Bournvita', 'Tea', 'Coffee', 'Bread Slice'].includes(text)) {
               userState.orderItem = text;
               const question =
                   text === 'Bread Slice'
                       ? 'How many slices do you want?'
                       : 'How many cups do you want?';
               await sendButtons(from, question, ['1', '2', '3', '4', '5']);
               userState.step = 2;
           } else {
               await sendButtons(from, 'Please select a valid option.', [
                   'Bournvita',
                   'Tea',
                   'Coffee',
                   'Bread Slice',
               ]);
           }
       } else if (userState.step === 2) {
           if (['1', '2', '3', '4', '5'].includes(text)) {
               userState.quantity = text;
               const confirmationMessage = `Thank you for your order. ${userState.quantity} ${
                   userState.orderItem === 'Bread Slice' ? 'slice(s)' : 'cup(s)'
               } of ${userState.orderItem} will be ready in 10 minutes.`;
               await sendMessage(from, confirmationMessage);
               delete userStates[from];
           } else {
               await sendButtons(from, 'Please select a valid quantity.', [
                   '1',
                   '2',
                   '3',
                   '4',
                   '5',
               ]);
           }
       }
   }
   ```

---

### **Step 5: Set Up the Webhook**
1. **Expose Your Local Server**:
   Use a tool like [ngrok](https://ngrok.com/) to expose your local server to the internet:
   ```bash
   ngrok http 3000
   ```
   Copy the generated public URL.

2. **Set the Webhook URL**:
   - Go to **WhatsApp > Configuration** in the Meta Developer Portal.
   - Add the webhook URL (e.g., `https://<your-ngrok-url>/webhook`) and verify it.

---

### **Step 6: Test Your Bot**
1. Send a message to your WhatsApp Business number.
2. Interact with the bot by selecting buttons.
3. Verify the dynamic conversation flow.

---

### **Useful Documentation**
- [WhatsApp Cloud API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Setting Up Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/)
- [Interactive Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-buttons)

