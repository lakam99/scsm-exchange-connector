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
    const result = await sendEmail(
      config.testRecipient,
      `Test from Jest at ${new Date().toISOString()}`,
      'Live test email using Microsoft Graph API'
    );
    expect(result).toBe(true);
  });

  test('deleteEmail moves an email to Deleted Items', async () => {
    // Step 1: Get emails from the configured folder
    const emails = await getEmails();
    expect(emails.value.length).toBeGreaterThan(0);

    // Step 2: Pick the first email to delete
    const emailToDelete = emails.value[0];

    // Step 3: Call deleteEmail
    const deletedEmail = await deleteEmail(emailToDelete);

    // Step 4: Check that the returned object has the new parent folder ID
    expect(deletedEmail).toHaveProperty('id');
    expect(deletedEmail.parentFolderId).not.toBe(emailToDelete.parentFolderId);

    const deleteditem = await getEmailsFromDeleted();
    const found = deleteditem.value.find(e => e.id === deletedEmail.id);
    expect(found).toBeDefined(); // Email should exist in Deleted Items
  });

  test('should download and save the email as .eml', async () => {
    const messageId = config.testMessageId;
    const outputPath = path.join(__dirname, 'downloaded-test.eml');

    const emlBuffer = await getEmail(messageId);
    expect(emlBuffer).toBeInstanceOf(Buffer);
    expect(emlBuffer.length).toBeGreaterThan(0);

    fs.writeFileSync(outputPath, emlBuffer);
    expect(fs.existsSync(outputPath)).toBe(true);
  });
  
});
