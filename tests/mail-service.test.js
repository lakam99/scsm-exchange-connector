const { getEmails, sendEmail, getEmail } = require('../mail-service.js');

// Manually stub config instead of using jest.mock
jest.mock('../config.js', () => ({
  accessToken: 'fake-token',
  folderName: 'Inbox',
  testRecipient: 'test@mail.com'
}));

// Mock global fetch for Node >=18
global.fetch = jest.fn();

describe('Mail Service (Unit)', () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  test('getEmails returns email data on success', async () => {
    const mockEmailData = { value: [{ subject: 'Hello' }] };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmailData
    });

    const emails = await getEmails();

    expect(fetch).toHaveBeenCalledWith(
      'https://graph.microsoft.com/v1.0/me/mailFolders(\'Inbox\')/messages',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer fake-token`
        })
      })
    );

    expect(emails).toEqual(mockEmailData);
  });

  test('sendEmail sends mail successfully', async () => {
    fetch.mockResolvedValueOnce({ ok: true });

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      body: 'Test Body'
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://graph.microsoft.com/v1.0/test@example.com/sendMail',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer fake-token`,
          'Content-Type': 'application/json'
        }),
        body: expect.any(String)
      })
    );

    expect(result).toBe(true);
  });

  test('getEmails throws error on failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid token'
    });

    await expect(getEmails()).rejects.toThrow(/Error fetching emails: 401 Unauthorized/);
  });

  test('sendEmail throws error on failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => 'Invalid request body'
    });

    await expect(sendEmail({to: 'a@b.com', subject: 'sub', body: 'body'})).rejects.toThrow(/Error sending email: 400 Bad Request/);
  });

  it('should fetch and return the .eml buffer of an email', async () => {
    const fakeBuffer = Buffer.from('Raw email content');
    fetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(fakeBuffer)
    });

    const messageId = 'test@example.com';
    const result = await getEmail('me',messageId);

    expect(fetch).toHaveBeenCalledWith(
      `https://graph.microsoft.com/v1.0/me/messages/${messageId}/$value`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': expect.any(String),
          'Accept': 'application/octet-stream'
        })
      })
    );

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe('Raw email content');
  });

});
