const axios = require('axios');
const { sendButtons } = require('../interactiveFlow');

const accessToken = process.env.TOKEN;
const phoneNumberId = process.env.PHONE_ID; 

jest.mock('axios');

describe('sendButtons function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send interactive buttons with valid input', async () => {
    const to = '1234567890';
    const text = 'Hello';
    const buttons = ['Button 1', 'Button 2', 'Button 3'];

    axios.post.mockResolvedValueOnce({ data: {} });

    await sendButtons(to, text, buttons);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      `https://graph.facebook.com/v16.0/${phoneNumberId}/messages`,
      expect.objectContaining({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: expect.objectContaining({
          type: 'button',
          body: expect.objectContaining({ text }),
          action: expect.objectContaining({
            buttons: expect.arrayContaining([
              expect.objectContaining({ type: 'reply', reply: expect.objectContaining({ id: 'button_1', title: 'Button 1' }) }),
              expect.objectContaining({ type: 'reply', reply: expect.objectContaining({ id: 'button_2', title: 'Button 2' }) }),
              expect.objectContaining({ type: 'reply', reply: expect.objectContaining({ id: 'button_3', title: 'Button 3' }) }),
            ]),
          }),
        }),
      }), 
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should slice buttons array to 3 if more than 3 buttons are provided', async () => {
    const to = '1234567890';
    const text = 'Hello';
    const phoneNumberId = 1234567890;
    const buttons = ['Button 1', 'Button 2', 'Button 3', 'Button 4', 'Button 5'];

    axios.post.mockResolvedValueOnce({ data: {} });

    await sendButtons(to, text, buttons);

    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('should not send interactive buttons with empty buttons array', async () => {
    const to = '1234567890';
    const text = 'Hello';
    const buttons = [];

    axios.post.mockResolvedValueOnce({ data: {} });

    await sendButtons(to, text, buttons);

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should not send interactive buttons with null or undefined input', async () => {
    const to = null;
    const text = undefined;
    const buttons = ['Button 1', 'Button 2', 'Button 3'];

    axios.post.mockResolvedValueOnce({ data: {} });

    await sendButtons(to, text, buttons);

    expect(axios.post).not.toHaveBeenCalled();
  });
});