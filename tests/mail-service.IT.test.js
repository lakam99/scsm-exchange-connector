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

  test('getEmail fetches raw MIME content and saves to disk', async () => {
    const emails = await getEmails();
    expect(emails.value.length).toBeGreaterThan(0);
  
    const email = emails.value[0];
  
    const mimeBuffer = await getEmail('me', email.id);
    expect(Buffer.isBuffer(mimeBuffer)).toBe(true);
    expect(mimeBuffer.length).toBeGreaterThan(0);
  
    const TMP_DIR = path.join(__dirname, '..', 'tests', 'resources');
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
  
    const filePath = path.join(TMP_DIR, `${email.id}.eml`);
    fs.writeFileSync(filePath, mimeBuffer);
  
    expect(fs.existsSync(filePath)).toBe(true);
    const fileStats = fs.statSync(filePath);
    expect(fileStats.size).toBeGreaterThan(0);
  
    // Cleanup: remove the file
    fs.unlinkSync(filePath);
    expect(fs.existsSync(filePath)).toBe(false);
  
    console.log(`✅ getEmail saved MIME content for email ID ${email.id}`);
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
