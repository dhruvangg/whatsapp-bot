require('dotenv').config()
const axios = require('axios');

// Your WhatsApp Cloud API credentials
const accessToken = process.env.TOKEN;
const phoneNumberId = process.env.PHONE_ID; // Found in your app dashboard
const recipientNumber = 919328215855; // Include the country code, e.g., 14151234567

// Send a text message
// Store user conversation states
const userStates = {};

// Helper function to send interactive buttons
async function sendButtons(to, text, buttons) {
    if(buttons.length === 0 || !text || !to) return
    // WhatsApp supports only 1-3 buttons, so we slice the buttons array if needed
    const formattedButtons = buttons.slice(0, 3).map((button, index) => ({
        type: 'reply',
        reply: {
            id: `button_${index + 1}`,
            title: button,
        },
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
                    body: {
                        text,
                    },
                    action: {
                        buttons: formattedButtons,
                    },
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
        console.log(`Message sent to ${to}: ${text}`);
    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
    }
}


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
        return;
    }

    if (userState.step === 1) {
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
        return;
    }

    if (userState.step === 2) {
        if (['1', '2', '3', '4', '5'].includes(text)) {
            userState.quantity = text;

            const confirmationMessage = `Thank you for your order. ${userState.quantity} ${
                userState.orderItem === 'Bread Slice' ? 'slice(s)' : 'cup(s)'
            } of ${userState.orderItem} will be right there in 10 minutes.`;

            await sendMessage(from, confirmationMessage);
            delete userStates[from]; // Reset state after order
        } else {
            await sendButtons(from, 'Please select a valid quantity.', ['1', '2', '3', '4', '5']);
        }
        return;
    }
}


module.exports = { handleIncomingMessage, sendButtons, sendMessage };