const { getEmails, sendEmail } = require('../mail-service.js');
const config = require('../config.js');

jest.setTimeout(15000);

describe('Mail Service (Integration)', () => {
  test('getEmails fetches email data', async () => {
    const result = await getEmails();
    expect(Array.isArray(result.value)).toBe(true);
  });

  test('sendEmail sends an email', async () => {
    const result = await sendEmail(
      config.testRecipient,
      `Test from Jest at ${new Date().toISOString()}`,
      'Live test email using Microsoft Graph API'
    );
    expect(result).toBe(true);
  });
});
