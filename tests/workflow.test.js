const fs = require('fs').promises;
const { sendEmail, deleteEmail } = require('../mail-service');
const { saveEmailToDisk, fetchEmails, cleanUp } = require('../email-util');
const { ensureUser, createOrUpdateTicketFromEmail } = require('../scsm-util');
const workflow = require('../workflow');

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  }
}));

jest.mock('../mail-service', () => ({
  sendEmail: jest.fn(),
  deleteEmail: jest.fn()
}));

jest.mock('../email-util', () => ({
  saveEmailToDisk: jest.fn(() => '/tmp/email.eml'),
  fetchEmails: jest.fn(),
  cleanUp: jest.fn()
}));

jest.mock('../scsm-util', () => ({
  ensureUser: jest.fn(),
  createOrUpdateTicketFromEmail: jest.fn()
}));

//TODO: Fix me,after you do the todos, generate new ms graph explere token and run all tests and they be green
describe('workflow module', () => {
  const fakeEmail = {
    id: 'email123',
    subject: 'Test Subject',
    from: { emailAddress: { name: 'Test User', address: 'test@example.com' } },
    body: { content: 'Hello' }
  };

  const fakeTicket = { Id: 'ticket123', Title: 'Test Ticket' };
  const fakeProfile = {
    newTicketNotificationTemplatePath: 'path/to/template.html',
    email: 'me'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('notifySender sends templated email', async () => {
    fs.readFile.mockResolvedValue('Hello {{ticketId}}');
    await workflow.notifySender(fakeEmail, fakeTicket, fakeProfile);
    expect(fs.readFile).toHaveBeenCalledWith('path/to/template.html', 'utf8');
    expect(sendEmail).toHaveBeenCalledWith(
      'me',
      'test@example.com',
      'Re: Test Subject',
      expect.stringContaining('ticket123')
    );
  });

  test('processEmail runs full flow and cleans up', async () => {
    ensureUser.mockResolvedValue({ Id: 'user123' });
    createOrUpdateTicketFromEmail.mockResolvedValue(fakeTicket);
    fs.readFile.mockResolvedValue('template');
    sendEmail.mockResolvedValue();
    deleteEmail.mockResolvedValue();

    await workflow.processEmail(fakeEmail, fakeProfile);

    expect(saveEmailToDisk).toHaveBeenCalledWith(fakeEmail);
    expect(ensureUser).toHaveBeenCalledWith(fakeEmail);
    expect(createOrUpdateTicketFromEmail).toHaveBeenCalledWith(fakeEmail, { Id: 'user123' }, fakeProfile, '/tmp/email.eml');
    expect(sendEmail).toHaveBeenCalled();
    expect(deleteEmail).toHaveBeenCalledWith('me', fakeEmail);
    expect(cleanUp).toHaveBeenCalledWith('/tmp/email.eml');
  });

  test('processProfile processes all emails', async () => {
    fetchEmails.mockResolvedValue([fakeEmail]);
    ensureUser.mockResolvedValue({ Id: 'user123' });
    createOrUpdateTicketFromEmail.mockResolvedValue(fakeTicket);
    fs.readFile.mockResolvedValue('template');

    await workflow.processProfile(fakeProfile);

    expect(fetchEmails).toHaveBeenCalledWith(fakeProfile);
    expect(saveEmailToDisk).toHaveBeenCalledWith(fakeEmail);
    expect(ensureUser).toHaveBeenCalledWith(fakeEmail);
  });
});
