const fs = require('fs').promises;
const path = require('path');
const mustache = require('mustache');
const { getEmails, deleteEmail, sendEmail } = require('./mail-service.js');
const {
  getUser,
  createUser,
  getTicketsByEmailId,
  createTicket,
  updateTicketEmailAndAddComment,
  ensureUser,
  createOrUpdateTicketFromEmail,
  createNewTicket,
  updateExistingTicket,
  cleanUp,
} = require('./scsm-actions.js');
const { saveEmailToDisk, fetchEmails } = require('./email-util.js');
const config = require('./profile-config.js');

async function notifySender(email, ticket, profile) {
  const templatePath = profile.newTicketNotificationTemplatePath;
  const template = await fs.readFile(templatePath, 'utf8');
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
    console.log(`Processed and deleted email: ${email.subject}`);
  } catch (err) {
    console.error(`Error processing email "${email.subject}":`, err);
  } finally {
    cleanUp(emailPath);
  }
}

async function processProfile(profile) {
  try {
    const emails = await fetchEmails(profile);
    await Promise.all(emails.map(email => processEmail(email, profile)));
  } catch (err) {
    console.error(`Error in profile "${profile.name}":`, err);
  }
}

(async () => {
  await Promise.all(config.profiles.map(processProfile));
})();

module.exports = {
  fetchEmails,
  saveEmailToDisk,
  ensureUser,
  handleTickets: createOrUpdateTicketFromEmail,
  createNewTicket,
  updateExistingTicket,
  notifySender,
  cleanUp,
  processEmail,
  processProfile,
};
