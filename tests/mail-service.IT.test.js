const { getEmails, sendEmail, deleteEmail, getEmailsFromDeleted, getEmail } = require('../mail-service.js');
const config = require('../config.js');
const path = require('path');
const fs = require('fs');

jest.setTimeout(15000);

describe('Mail Service (Integration)', () => {
  test('getEmails fetches email data', async () => {
    const result = await getEmails();
    expect(Array.isArray(result.value)).toBe(true);
  });

  test('sendEmail sends an email', async () => {
    const result = await sendEmail({
      to: config.testRecipient,
      subject: `Test from Jest at ${new Date().toISOString()}`,
      body: 'Live test email using Microsoft Graph API',
    });
    expect(result).toBe(true);
  });

  test('deleteEmail moves an email to Deleted Items', async () => {
    // Step 1: Get emails from the configured folder
    const emails = await getEmails();
    expect(emails.value.length).toBeGreaterThan(0);

    // Step 2: Pick the first email to delete
    const emailToDelete = emails.value[0];

    // Step 3: Call deleteEmail
    const deletedEmail = await deleteEmail({emailObj: emailToDelete});

    // Step 4: Check that the returned object has the new parent folder ID
    expect(deletedEmail).toHaveProperty('conversationId');
    expect(deletedEmail.parentFolderId).not.toBe(emailToDelete.parentFolderId);

    const deleteditem = await getEmailsFromDeleted();
    const found = deleteditem.value.find(e => e.conversationId === deletedEmail.conversationId);
    expect(found).toBeDefined(); // Email should exist in Deleted Items
  });  
});
