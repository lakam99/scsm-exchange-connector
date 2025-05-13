const { getUser, createUser, createTicket } = require('../scsm-actions.js');
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
  });

  describe('Integration test: createUserjs (Cireson API)', () => {

    // TODO : Dynamically generate the test user data to work with the creation & already exists test
    // You want to be able to determine a user that already exists (and has been asserted to exist) cannot be recreated using createUser
    // TODO: Add afterAll -> deleteUsers created

    let testUserData = {
      Name: `Integration12 Tester`,
      Email: `itester12@nserc.ca`,
    };

    afterAll(() => {
      // TODO: Clean up the test user
      // Clean up the test user after the tests
      // This is just a placeholder. You should implement the actual deletion logic.
      console.log('Cleaning up test user...');
      // await deleteUser(testUserData.Email);
    })

    it('creates a new user successfully', async () => {
      console.time("createUserjs");
      const result = await createUser(testUserData.Name, testUserData.Email);
      console.timeEnd("createUserjs");

      expect(result.success).toBe(true);
      expect(result.UPN).toBe(testUserData.Email);
      expect(result.Id).toBeDefined();
      expect(result.created).toBe(true);
      expect(result.existing).toBe(false);
    }, 30000); // Extend timeout just in case

    it('checks if the user attempting to be created already exists', async () => {
      console.time("createUserjs");
      //const testUserData = getUser("user that exsists");
      //expect(!!testUserData).toBe(true); //add assertiom user already exists
      const result = await createUser(testUserData.Name, testUserData.Email); 
      console.timeEnd("createUserjs");

      expect(result.success).toBe(true);
      expect(result.UPN).toBe(testUserData.Email);
      expect(result.Id).toBeDefined();
      expect(result.existing).toBe(true);
      expect(result.created).toBe(false);
    }, 30000); // Extend timeout just in case
  });
});
