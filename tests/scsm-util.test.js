const {
    ensureUser,
    createNewTicket,
    updateExistingTicket,
    createOrUpdateTicketFromEmail
  } = require('../scsm-util');
  const {
    getUser,
    createUser,
    getTicketsByEmailId,
    updateTicketEmailAndAddComment,
    createTicket
  } = require('../scsm-actions');
  
  jest.mock('../scsm-actions', () => ({
    getUser: jest.fn(),
    createUser: jest.fn(),
    getTicketsByEmailId: jest.fn(),
    updateTicketEmailAndAddComment: jest.fn(),
    createTicket: jest.fn()
  }));
  
  describe('scsm-util', () => {
    const email = {
      id: 'email1',
      subject: 'Test Subject',
      from: { emailAddress: { name: 'Test User', address: 'test@example.com' } },
      body: { content: 'Body content' }
    };
  
    const user = { Id: 'user1' };
    const profile = { newTicketNotificationTemplatePath: 'template.html' };
    const emailPath = '/tmp/email.eml';
    const ticket = { Id: 'ticket1', Status: 'Active' };
  
    beforeEach(() => jest.clearAllMocks());
  
    test('ensureUser returns existing user', async () => {
      getUser.mockResolvedValue(user);
      const result = await ensureUser(email);
      expect(getUser).toHaveBeenCalled();
      expect(result).toEqual(user);
    });
  
    test('ensureUser creates and returns user if not found', async () => {
      getUser.mockResolvedValueOnce({}).mockResolvedValueOnce(user);
      createUser.mockResolvedValue(true);
      const result = await ensureUser(email);
      expect(createUser).toHaveBeenCalledWith(email.from.emailAddress.name, email.from.emailAddress.address);
      expect(result).toEqual(user);
    });
  
    test('createNewTicket creates ticket', async () => {
      createTicket.mockResolvedValue(ticket);
      const result = await createNewTicket(email, user, profile, emailPath);
      expect(createTicket).toHaveBeenCalled();
      expect(result).toEqual(ticket);
    });
  
    test('updateExistingTicket updates ticket', async () => {
      updateTicketEmailAndAddComment.mockResolvedValue(ticket);
      const result = await updateExistingTicket(ticket, emailPath);
      expect(updateTicketEmailAndAddComment).toHaveBeenCalled();
      expect(result).toEqual(ticket);
    });
  
    test('createOrUpdateTicketFromEmail updates existing ticket', async () => {
      getTicketsByEmailId.mockResolvedValue([{ Id: 'ticket1', Status: 'Active' }]);
      updateTicketEmailAndAddComment.mockResolvedValue(ticket);
      const result = await createOrUpdateTicketFromEmail(email, user, profile, emailPath);
      expect(updateTicketEmailAndAddComment).toHaveBeenCalled();
      expect(result).toEqual(ticket);
    });
  
    test('createOrUpdateTicketFromEmail creates new ticket when none found', async () => {
      getTicketsByEmailId.mockResolvedValue([]);
      createTicket.mockResolvedValue(ticket);
      const result = await createOrUpdateTicketFromEmail(email, user, profile, emailPath);
      expect(createTicket).toHaveBeenCalled();
      expect(result).toEqual(ticket);
    });
  });
  