//7th 

const path = require('path');
// In workflow.js
const fs = require('fs').promises;
const mustache = require('mustache');
const config = require('./profile-config');
const fconfig = require('./config.js');
const { sendEmail } = require('./mail-service');
const { getCompletedTickets, attachEmailToCompletedTickets } = require('./scsm-actions');
// At top of file
const notifiedTicketIds = new Set(); // reset on restart


async function notifyCompletion(profile, ticket) {
  const template = await fs.readFile(profile.completedTicketNotificationTemplatePath, 'utf8');
  const body = mustache.render(template, {
    ticketId: ticket.Id,
    ticketTitle: ticket.Title,
    affectedUser: ticket.AffectedUser,
  });

  await sendEmail({
    user: 'me',
    to: ticket.AffectedUserEmail,
    subject: `Your ticket "${ticket.Title}" has been completed`,
    body
  });

  const fileName = `CompletedNotification-${ticket.Id}.eml`;
  const filePath = path.join(fconfig.tempDirectory, fileName);
  await fs.writeFile(filePath, body); // Save rendered email content as .eml

  await attachEmailToCompletedTickets(ticket.Id, filePath);

  console.log(`📬 Notified ${ticket.AffectedUser} <${ticket.AffectedUserEmail}> for ${ticket.Id}`);
}


async function monitorCompletedTickets(profile) {
  const completed = await getCompletedTickets(profile);

  for (const ticket of completed) {
    if (ticket.HasCompletedNotification) continue;

    await notifyCompletion(profile, ticket);
    notifiedTicketIds.add(ticket.Id); // mark as notified
  }
}

function startCompletionMonitor() {
  setInterval(async () => {
    for (const profile of config.profiles) {
      await monitorCompletedTickets(profile);
    }
  }, 15000); // every 15 seconds
}

module.exports = {
  monitorCompletedTickets,
  startCompletionMonitor,
};



//1st
//polling: 
// make something happen every x seconds
// setInterval(() => {
//     const completedTickets = scsm-actions getCompletedTickets()
//     do stuff
//    }}
//}, 100000 <- poll rate in miliseconds)


//2nd
//subscriber route:
// monitorCompletedTickets((ticket) => {
 //   if ticket.email == email.id ? do stuff
//})