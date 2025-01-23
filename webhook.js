require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const { handleIncomingMessage } = require('./interactiveFlow');

const app = express();
app.use(bodyParser.json());

// Verify webhook
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        body.entry.forEach((entry) => {
            entry.changes.forEach((change) => {
                const value = change.value;

                // Check if there are messages
                if (value.messages && value.messages.length > 0) {
                    const message = value.messages[0];
                    const from = message.from; // Sender's phone number
                    const type = message.type; // Type of message (e.g., text, interactive)
                    let userInput = null;

                    // Handle text messages
                    if (type === 'text') {
                        userInput = message.text.body;
                    }

                    // Handle interactive button replies
                    if (type === 'interactive') {
                        const interactiveType = message.interactive.type;

                        if (interactiveType === 'button_reply') {
                            userInput = message.interactive.button_reply.title; // Text of the selected button
                        }
                    }

                    if (userInput) {
                        console.log(`Message received from ${from}: ${userInput}`);

                        // Call your handler function
                        handleIncomingMessage(from, userInput);
                    } else {
                        console.log(`Unsupported message type from ${from}: ${type}`);
                    }
                } else {
                    console.log('No messages in this webhook event');
                }
            });
        });
        res.sendStatus(200); // Acknowledge the webhook event
    } else {
        res.sendStatus(404); // Not a WhatsApp event
    }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
