// __tests__/workflow.unit.test.js
const fs = require('fs');
const path = require('path');
const mustache = require('mustache');
const {
  fetchEmails,
  saveEmailToDisk,
  ensureUser,
  handleTickets,
  createNewTicket,
  updateExistingTicket,
  notifySender,
  cleanUp,
  processEmail,
  processProfile,
} = require('../workflow.js');
const { sendEmail, deleteEmail } = require('../mail-service.js');
const { getUser, createUser, getTicketsByEmailId, createTicket, updateTicketEmailAndAddComment } = require('../scsm-actions.js');
const { profiles } = require('../profile-config.js');

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));
jest.mock('path');
jest.mock('mustache');
jest.mock('../mail-service.js', () => ({
  getEmails: jest.fn(),
  deleteEmail: jest.fn(),
  sendEmail: jest.fn(),
}));
jest.mock('../scsm-actions.js', () => ({
  getUser: jest.fn(),
  createUser: jest.fn(),
  getTicketsByEmailId: jest.fn(),
  createTicket: jest.fn(),
  updateTicketEmailAndAddComment: jest.fn(),
}));
jest.mock('../profile-config.js', () => ({
  profiles: [
    {
      name: 'Test Profile',
      email: 'test@example.com',
      newTicketTemplate: 'Test Template',
      newTicketNotificationTemplatePath: 'templates/test-notification-template.html',
    },
  ],
}));
jest.mock('../email-util.js', () => ({
  saveEmailToDisk: jest.fn(),
  fetchEmails: jest.fn(),
}));

const { saveEmailToDisk, fetchEmails } = require('../email-util.js');
const { deleteEmail, sendEmail } = require('../mail-service.js');
const {
  getUser,
  createUser,
  getTicketsByEmailId,
  createTicket,
  updateTicketEmailAndAddComment,
} = require('../scsm-actions.js');

describe('workflow.js', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('fetchEmails should call getEmails and return email values', async () => {
    const { getEmails } = require('../mail-service.js');
    getEmails.mockResolvedValue({ value: ['email1', 'email2'] });

    const profile = { email: 'test@example.com' };
    const emails = await fetchEmails(profile);

    expect(getEmails).toHaveBeenCalledWith(profile.email);
    expect(emails).toEqual(['email1', 'email2']);
  });

  test('saveEmailToDisk should save email to disk and return the file path', () => {
    const email = { id: '123', mime: 'test content' };
    const emailPath = '/tmp/123.eml';
    path.join.mockReturnValue(emailPath);

    const result = saveEmailToDisk(email);

    expect(fs.writeFileSync).toHaveBeenCalledWith(emailPath, email.mime);
    expect(result).toBe(emailPath);
  });

  test('ensureUser should create a user if not found', async () => {
    const { getUser, createUser } = require('../scsm-actions.js');
    getUser.mockResolvedValueOnce(null);
    createUser.mockResolvedValueOnce(true);
    getUser.mockResolvedValueOnce({ Id: '123' });

    const email = { from: { emailAddress: { name: 'Test User', address: 'test@example.com' } } };
    const user = await ensureUser(email);

    expect(getUser).toHaveBeenCalledTimes(2);
    expect(createUser).toHaveBeenCalledWith('Test User', 'test@example.com');
    expect(user).toEqual({ Id: '123' });
  });

  test('handleTickets should call createNewTicket if no tickets exist', async () => {
    const { getTicketsByEmailId } = require('../scsm-actions.js');
    getTicketsByEmailId.mockResolvedValue([]);
    createNewTicket.mockResolvedValue(true);

    const email = { id: '123' };
    const user = { Id: '456' };
    const profile = {};
    const emailPath = '/tmp/123.eml';

    await handleTickets(email, user, profile, emailPath);

    expect(getTicketsByEmailId).toHaveBeenCalledWith(email.id);
    expect(createNewTicket).toHaveBeenCalledWith(email, user, profile, emailPath);
  });

  test('notifySender should render the template and send an email', async () => {
    const email = { subject: 'Test Subject', from: { emailAddress: { name: 'Test User', address: 'test@example.com' } } };
    const ticket = { Id: '123', Title: 'Test Ticket' };
    const profile = { newTicketNotificationTemplatePath: 'templates/test-notification-template.html' };
    const template = '<p>{{ticketId}} - {{ticketTitle}}</p>';
    const renderedTemplate = '<p>123 - Test Ticket</p>';

    fs.readFileSync.mockReturnValue(template);
    mustache.render.mockReturnValue(renderedTemplate);

    await notifySender(email, ticket, profile);

    expect(fs.readFileSync).toHaveBeenCalledWith(profile.newTicketNotificationTemplatePath, 'utf8');
    expect(mustache.render).toHaveBeenCalledWith(template, {
      ticketId: ticket.Id,
      ticketTitle: ticket.Title,
      emailSubject: email.subject,
      emailFrom: email.from.emailAddress.name,
    });
    expect(sendEmail).toHaveBeenCalledWith('me', email.from.emailAddress.address, `Re: ${email.subject}`, renderedTemplate);
  });

  test('cleanUp should delete the email file', () => {
    const emailPath = '/tmp/123.eml';
    cleanUp(emailPath);
    expect(fs.unlinkSync).toHaveBeenCalledWith(emailPath);
  });

  test('processEmail should call all necessary functions in sequence', async () => {
    const email = { id: '123', mime: '🤡', subject: 'Test Subject', from: { emailAddress: { name: 'Test User', address: 'test@example.com' } }, body: { content: 'this is content of the body' } };
    const profile = { email: 'test@example.com', newTicketNotificationTemplatePath: 'templates/test-notification-template.html' };
    const emailPath = '/tmp/123.eml';
    const user = { Id: '456' };

    saveEmailToDisk.mockReturnValue(emailPath);
    ensureUser.mockResolvedValue(user);
    handleTickets.mockResolvedValue(true);
    deleteEmail.mockResolvedValue(true);
    cleanUp.mockResolvedValue(true);

    await processEmail(email, profile);

    expect(saveEmailToDisk).toHaveBeenCalledWith(email);
    expect(ensureUser).toHaveBeenCalledWith(email);
    expect(handleTickets).toHaveBeenCalledWith(email, user, profile, emailPath);
    expect(deleteEmail).toHaveBeenCalledWith(profile.email, email);
    expect(cleanUp).toHaveBeenCalledWith(emailPath);
  });

  test('processProfile should process all emails for a profile', async () => {
    const profile = { email: 'test@example.com' };
    const emails = [{ id: '123' }, { id: '456' }];

    getEmails.mockResolvedValue(emails);

    await processProfile(profile);
    expect(getEmails).toHaveBeenCalledWith(profile.email);
  });

  describe('processEmail', () => {
    test('should process an email end-to-end', async () => {
      const email = {
        id: '123',
        mime: 'test content',
        subject: 'Test Subject',
        from: { emailAddress: { name: 'Test User', address: 'test@example.com' } },
        body: { content: 'This is the email body' },
      };
      const profile = {
        email: 'test@example.com',
        newTicketNotificationTemplatePath: 'templates/test-notification-template.html',
      };
      const emailPath = '/tmp/123.eml';
      const user = { Id: '456' };
      const ticket = { Id: '789', Title: 'Test Ticket' };

      // Mock dependencies
      saveEmailToDisk.mockReturnValue(emailPath);
      getUser.mockResolvedValue(user);
      createTicket.mockResolvedValue(ticket);
      deleteEmail.mockResolvedValue(true);
      sendEmail.mockResolvedValue(true);
      fs.unlinkSync.mockResolvedValue(true);

      // Call the function
      await processEmail(email, profile);

      // Assertions
      expect(saveEmailToDisk).toHaveBeenCalledWith(email);
      expect(getUser).toHaveBeenCalledWith(email.from.emailAddress.name, email.from.emailAddress.address);
      expect(createTicket).toHaveBeenCalledWith({
        title: email.subject,
        description: email.body.content,
        affectedUserId: user.Id,
        templateName: profile.newTicketNotificationTemplatePath,
        emailSubject: email.subject,
        emailPath,
        emailFrom: email.from.emailAddress.address,
        emailId: email.id,
      });
      expect(deleteEmail).toHaveBeenCalledWith(profile.email, email);
      expect(sendEmail).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalledWith(emailPath);
    });
  });

  describe('processProfile', () => {
    test('should process all emails for a profile', async () => {
      const profile = {
        email: 'test@example.com',
        newTicketNotificationTemplatePath: 'templates/test-notification-template.html',
      };
      const emails = [
        { id: '123', subject: 'Email 1' },
        { id: '456', subject: 'Email 2' },
      ];

      // Mock dependencies
      fetchEmails.mockResolvedValue(emails);
      processEmail.mockResolvedValue(true);

      // Call the function
      await processProfile(profile);

      // Assertions
      expect(fetchEmails).toHaveBeenCalledWith(profile);
      expect(processEmail).toHaveBeenCalledTimes(emails.length);
      expect(processEmail).toHaveBeenCalledWith(emails[0], profile);
      expect(processEmail).toHaveBeenCalledWith(emails[1], profile);
    });
  });
});
