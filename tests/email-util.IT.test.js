const fs = require('fs');
const path = require('path');
const { fetchEmails, saveEmailToDisk, cleanUp } = require('../email-util.js');
const { sendEmail } = require('../mail-service.js');
const config = require('../config.js');
const profileConfig = require('../profile-config.js');

describe('email-util integration tests', () => {
  const TMP_DIR = path.join(__dirname, '..', 'tests\\resources');
  const fakeEmail = {
    id: 'EMAIL-IT-TEST',
    mime: 'This is a test MIME content'
  };

  beforeAll(() => {
    if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true, force: true });
    fs.mkdirSync(TMP_DIR, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true, force: true });
  });

  test('saveEmailToDisk writes file and cleanUp deletes it', () => {

    // temporarily patch __dirname in saveEmailToDisk to point to TMP_DIR
    const originalJoin = path.join;
    path.join = (...args) => {
      if (args[0] === __dirname && args[1] === 'tmp') return TMP_DIR;
      return originalJoin.apply(path, args);
    };

    const emailPath = saveEmailToDisk(fakeEmail, 'tests/resources');
    expect(emailPath).toBeDefined();
    expect(fs.existsSync(emailPath)).toBe(true);
    const fileContent = fs.readFileSync(emailPath, 'utf8');
    expect(fileContent).toBe(fakeEmail.mime);

    cleanUp(emailPath);
    expect(fs.existsSync(emailPath)).toBe(false);

    // restore path.join
    path.join = originalJoin;
  });

  test('fetchEmails retrieves real inbox emails', async () => {
    const profile = profileConfig.profiles[0];
    const subject = `[TEST-${Date.now()}] fetchEmails IT test`;
    const bodyContent = 'Integration test message for fetchEmails';

    // Send a real test email
    await sendEmail({
      to: config.testInboxEmail,
      subject,
      text: bodyContent,
      html: `<p>${bodyContent}</p>`
    }, profile).catch(err => {
      console.error('Error sending test email:', err);
      throw err;
    });

    // Give some time for delivery
    await new Promise(resolve => setTimeout(resolve, 8000));

    const emails = await fetchEmails(profile);
    const found = emails.find(e => e.subject === subject);
    expect(found).toBeDefined();
    expect(found.subject).toBe(subject);
    console.log('✅ fetchEmails pulled the test email from inbox');
  }, 20000);
});
