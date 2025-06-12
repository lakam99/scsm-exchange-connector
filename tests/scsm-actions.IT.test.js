const { getUser, createUser, createTicket, updateTicketEmailAndAddComment,
  getComment, deleteUser, getCompletedTickets } = require('../scsm-actions.js');
const fs = require('fs');
const path = require('path');

const fetch = require('node-fetch');

describe('SCSM Actions (Integration)', () => {
  test('getUser retrieves a valid user by email', async () => {
    const name = 'scsmService';
    const email = 'scsmservice@nserc.ca';

    const user = await getUser(name, email);

    expect(user).toBeDefined();
    expect(typeof user).toBe('object');
    expect(user.UPN).toBe(email);
    expect(user.DisplayName).toMatch(name);
  });


  test('getCompletedTickets returns completed tickets for matching area', async () => {
    const profile = {
      area: 'Reconciliations' // This should match the SRQ title or area logic used in your PS script
    };

    const tickets = await getCompletedTickets(profile);

    expect(Array.isArray(tickets)).toBe(true);

    // If you expect at least one completed ticket, add:
    expect(tickets.length).toBeGreaterThanOrEqual(0); // Change to > 0 if your env guarantees data

    for (const ticket of tickets) {
      expect(ticket).toHaveProperty('Id');
      expect(ticket).toHaveProperty('Title');
      expect(ticket).toHaveProperty('Status');
      expect(ticket.Status.toLowerCase()).toContain('completed');
    }
  }, 50000);

  test('createTicket creates a new service request successfully', async () => {
    const title = `Test Ticket - ${new Date().toISOString()}`;
    const description = 'This is a test ticket created from automated integration test.';
    
    const name = 'scsmService';
    const email = 'scsmservice@nserc.ca';
    const user = await getUser(name, email);

    const mimeContent = `Subject: Sample Test Email\r\nFrom: test@example.com\r\n\r\nThis is a test email content.`;
    const emailPath = path.join(__dirname, 'temp', `test-${Date.now()}.eml`);
    fs.mkdirSync(path.dirname(emailPath), { recursive: true });
    fs.writeFileSync(emailPath, mimeContent);

    const result = await createTicket({
      title,
      description,
      affectedUserId: user.Id,
      templateName: 'Post Awards Reconciliation Template SRQ',
      emailSubject: 'Sample Test Email',
      emailPath: emailPath,
      emailFrom: 'test@example.com',
      emailId: 'TEST-CONVERSATION-ID-1234'
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result.Id).toBeDefined();
  }, 50000);

  describe('Integration test: createUserjs (Cireson API)', () => {
  const timestamp = Date.now();
  const testUserData = {
    Name: `Integration Tester1 ${timestamp}`,
    Email: `itest${timestamp}@nserc.ca`,
  };

  afterAll(async () => {
    console.log(`Cleaning up test user: ${testUserData.Email}`);
    if (typeof deleteUser === 'function') {
      await deleteUser(testUserData.Email);
    } else {
      console.warn("deleteUser function not implemented.");
    }
  });

  it('creates a new user successfully', async () => {
    console.time("createUserjs - first call");
    const result = await createUser(testUserData.Name, testUserData.Email);
    console.timeEnd("createUserjs - first call");

    expect(result.success).toBe(true);
    expect(result.UPN).toBe(testUserData.Email);
    //expect(result.Id).toBeDefined();
    expect(result.created).toBe(true);
    expect(result.existing).toBe(false);
  }, 30000);

  it('should recognize the user already exists on second creation attempt', async () => {
    console.time("createUserjs - second call");
    const result = await createUser(testUserData.Name, testUserData.Email);
    console.timeEnd("createUserjs - second call");

    expect(result.success).toBe(true);
    expect(result.UPN).toBe(testUserData.Email);
    //expect(result.Id).toBeDefined();
    expect(result.created).toBe(false);
    expect(result.existing).toBe(true);
  }, 30000);
});


// IT test for updateTicketEmailAndAddComment
  describe('ticketService (integration)', () => {
    const TEST_TICKET_ID = 'SRQ130667';                 // replace with a real SRQ
    const TEST_EMAIL_PATH = path.join(__dirname, '..', 'tests', 'temp', 'test-1744751354915.eml')
  
    test('round-trip: updateTicketEmailAndAddComment → getComment', async () => {
      // 1) push a new email + comment into the ticket
      const added = await updateTicketEmailAndAddComment(TEST_TICKET_ID, TEST_EMAIL_PATH);
      expect(added).toBe(true);
  
      // 2) now retrieve it back
      const hasComment = await getComment(TEST_TICKET_ID);
      expect(hasComment).toBe(true);
    });
  });



});
