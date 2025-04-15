const { getUser, createTicket } = require('../scsm-actions.js');
const fs = require('fs');
const path = require('path');

jest.setTimeout(20000); // Allow more time for PowerShell execution

describe('SCSM Actions (Integration)', () => {
  test('getUser retrieves a valid user by email', async () => {
    const name = 'scsmService'; // Update with a known test user in your SCSM environment
    const email = 'scsmservice@nserc.ca'; // Replace with a valid test account

    const user = await getUser(name, email);

    expect(user).toBeDefined();
    expect(typeof user).toBe('object');
    expect(user.UPN).toBe(email);
    expect(user.DisplayName).toMatch(new RegExp(name, 'i'));
  });

  test('createTicket creates a new service request successfully', async () => {
    // Generate a unique title for the ticket
    const title = `Test Ticket - ${new Date().toISOString()}`;
    const description = 'This is a test ticket created from automated integration test.';

    // Retrieve an affected user (must exist in SCSM)
    const name = 'scsmService';
    const email = 'scsmservice@nserc.ca';
    const user = await getUser(name, email);

    // Create a temporary .eml file to simulate email MIME content
    const mimeContent = `Subject: Sample Test Email\r\nFrom: test@example.com\r\n\r\nThis is a test email content.`;
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    const emailPath = path.join(tempDir, `test-${Date.now()}.eml`);
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

    // Optionally, delete the temporary file after test
    fs.unlinkSync(emailPath);
  });
});
