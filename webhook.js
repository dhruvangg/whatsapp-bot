require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const { handleIncomingMessage } = require('./interactiveFlow');

const app = express();
app.use(bodyParser.json());

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
                
                if (value.messages && value.messages.length > 0) {
                    const message = value.messages[0];
                    const from = message.from; 
                    const type = message.type; 
                    let userInput = null;

                    if (type === 'text') {
                        userInput = message.text.body;
                    }

                    if (type === 'interactive') {
                        const interactiveType = message.interactive.type;

                        if (interactiveType === 'button_reply') {
                            userInput = message.interactive.button_reply.title; 
                        }
                    }

                    if (userInput) {
                        console.log(`Message received from ${from}: ${userInput}`);
                        handleIncomingMessage(from, userInput);
                    } else {
                        console.log(`Unsupported message type from ${from}: ${type}`);
                    }
                } 
            });
        });
        res.sendStatus(200); 
    } else {
        res.sendStatus(404); 
    }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
