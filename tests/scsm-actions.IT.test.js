const { getUser, createTicket } = require('../scsm-actions.js');

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
  
  // Reuse getUser for affected user
  const name = 'scsmService'; // Update if needed
  const email = 'scsmservice@nserc.ca';
  const user = await getUser(name, email);
  
  const templateName = 'Post Awards Reconciliation Template SRQ'; // Must match the actual template name in SCSM

  const result = await createTicket(title, description, user.Id, templateName);

  expect(result).toBeDefined();
  expect(typeof result).toBe('object');
  expect(result.Id).toBeDefined();
});