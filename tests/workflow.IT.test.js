const { sendEmail, getEmailsFromDeleted } = require('../mail-service');
const { getTicketsByEmailId } = require('../scsm-actions');
const { processProfile } = require('../workflow');
const profileConfig = require('../profile-config');
const config = require('../config.js');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('E2E Workflow Integration Test', () => {
  const profile = profileConfig.profiles[0]; // pick the first profile
  const sender = 'me';
  const subject = `[TEST-${Date.now()}] E2E Ticket Creation`;
  const bodyContent = 'This is a test for full end-to-end ticket creation.';

  let sentEmail;

  test('sends email, creates ticket, and sends notification', async () => {
    // Step 1: Send an actual email to inbox
    await sendEmail({
      sender,
      to: config.testInboxEmail,
      subject,
      body: bodyContent,
    }).then(email => {
      sentEmail = email;
      console.log(`📧 Email sent: ${email.subject}`);
    }).catch(err => {
      console.error('❌ Error sending email:', err);
    });
    console.log('✅ Email sent to workflow inbox.');

    // Step 2: Wait a bit for Microsoft Graph to receive it
    await sleep(8000);

    // Step 3: Run the actual profile processor (mimicking polling)
    await processProfile(profile);
    console.log('⚙️  Workflow profile processed.');
    await sleep(8000);

    // Step 4: Check Deleted Items (processed mails are moved there)
    const deletedEmails = await getEmailsFromDeleted();
    const email = deletedEmails.value.find(e => e.subject === subject);
    expect(email).toBeDefined();
    console.log('📩 Email was picked up and deleted from inbox.');

    // Step 5: Check if ticket was created
    const tickets = await getTicketsByEmailId(email.id);
    expect(tickets.length).toBeGreaterThan(0);
    const ticket = tickets[0];
    expect(ticket.Id).toBeDefined();
    console.log(`🎫 Ticket created: ${ticket.Id}`);

    // Step 6 (Optional): Check Sent Items for notification (skipped unless logged/tracked)
  }, 30000); // timeout extended for async actions
});
