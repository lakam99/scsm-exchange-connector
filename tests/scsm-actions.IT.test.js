const { getUser, createTicket } = require('../scsm-actions.js');
const fs = require('fs');
const path = require('path');

jest.setTimeout(20000); // Allow more time for PowerShell execution

describe('SCSM Actions (Integration)', () => {
  test('getUser retrieves a valid user by email', async () => {
    const name = 'scsmService'; // Update with a known test user
    const email = 'scsmservice@nserc.ca'; // Replace with a real test account

    const user = await getUser(name, email);

    expect(user).toBeDefined();
    expect(typeof user).toBe('object');
    expect(user.UPN).toBe(email);
    expect(user.DisplayName).toMatch(name);
  });
});

test('createTicket creates a new service request successfully', async () => {
  const title = `Test Ticket - ${new Date().toISOString()}`;
  const description = 'This is a test ticket created from automated integration test.';
  
  // Retrieve affected user (must exist in SCSM)
  const name = 'scsmService';
  const email = 'scsmservice@nserc.ca';
  const user = await getUser(name, email);

  // Write temporary email.eml file
  const mimeContent = `Subject: Sample Test Email\r\nFrom: test@example.com\r\n\r\nThis is a test email content.`; // Simulated .eml content
  const emailPath = path.join(__dirname, 'temp', `test-${Date.now()}.eml`);
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
