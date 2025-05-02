const fs = require('fs').promises;
const mustache = require('mustache');
const { sendEmail, deleteEmail } = require('./mail-service.js');
const { saveEmailToDisk, fetchEmails, cleanUp } = require('./email-util.js');
const {
  ensureUser,
  createOrUpdateTicketFromEmail,
} = require('./scsm-util.js');
const config = require('./profile-config.js');

async function notifySender(email, ticket, profile) {
  const template = await fs.readFile(profile.newTicketNotificationTemplatePath, 'utf8');
  const notification = mustache.render(template, {
    ticketId: ticket.Id,
    ticketTitle: ticket.Title,
    emailSubject: email.subject,
    emailFrom: email.from.emailAddress.name,
  });

  await sendEmail('me', email.from.emailAddress.address, `Re: ${email.subject}`, notification);
}

async function processEmail(email, profile) {
  const emailPath = saveEmailToDisk(email);
  try {
    const user = await ensureUser(email);
    const ticket = await createOrUpdateTicketFromEmail(email, user, profile, emailPath);
    await notifySender(email, ticket, profile);
    await deleteEmail(profile.email, email);
    console.log(`[✔] Processed email: "${email.subject}"`);
  } catch (err) {
    console.error(`[✖] Error processing "${email.subject}":`, err);
  } finally {
    cleanUp(emailPath);
  }
}

async function processProfile(profile) {
  try {
    const emails = await fetchEmails(profile);
    await Promise.all(emails.map(email => processEmail(email, profile)));
  } catch (err) {
    console.error(`[✖] Error in profile "${profile.name}":`, err);
  }
}

async function main() {
  await Promise.all(config.profiles.map(processProfile));
}

module.exports = {
  notifySender,
  processEmail,
  processProfile,
  main
};
