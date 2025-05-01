// workflow.js DRY and KISS it: TODO
const fs = require('fs');
const path = require('path');
const { getEmails, deleteEmail, sendEmail } = require('./mail-service.js');
const {
  getUser,
  createUser,
  getTicketsByEmailId,
  createTicket,
  updateTicketEmailAndAddComment
} = require('./scsm-actions.js');
const config = require('./workflow-config.js');

(async () => {
  for (const wf of config.workflows) {
    try {
      // Pull new messages
      const { value: emails } = await getEmails(wf.email);

      for (const email of emails) {
        // 1) dump the MIME blob to disk
        const emailPath = path.join(__dirname, 'tmp', `${email.id}.eml`);
        fs.writeFileSync(emailPath, email.mime);

        // 2) ensure we have an SCSM user
        let user = await getUser(email.from.emailAddress.name, email.from.emailAddress.address);
        if (!user || !user.Id) {
          const created = await createUser(email.from.emailAddress.name, email.from.emailAddress.address);
          if (!created) {
            throw new Error(`Could not create user ${email.from.emailAddress.address}`);
          }
          user = await getUser(email.from.emailAddress.name, email.from.emailAddress.address);
        }

        // 3) see if we’ve already got a ticket on this conversation
        const tickets = await getTicketsByEmailId(email.id);

        if (tickets && tickets.length > 0) {
          const ticket = tickets[0];
          if (ticket.Status === 'Closed' || ticket.Status === 'Completed') {
            // closed → open a fresh SRQ
            await createTicket({
              title: email.subject,
              description: email.body.content,
              affectedUserId: user.Id,
              templateName: wf.newTicketTemplate,
              emailSubject: email.subject,
              emailPath,
              emailFrom: email.from.emailAddress.address,
              emailId: email.id
            });
          } else {
            // still open → append comment + attachment
            await updateTicketEmailAndAddComment(ticket.Id, emailPath);
          }
        } else {
          // brand-new conversation → create it
          await createTicket({
            title: email.subject,
            description: email.body.content,
            affectedUserId: user.Id,
            templateName: wf.newTicketTemplate,
            emailSubject: email.subject,
            emailPath,
            emailFrom: email.from.emailAddress.address,
            emailId: email.id
          });
        }

        // 4) clean up: delete from inbox
        await deleteEmail('me', email);

        // 5) notify the sender
        const notification = `
Hello ${email.from.emailAddress.name},

Your message "${email.subject}" has been logged under reference ID ${email.id}. We will follow up shortly.

— The Support Team
        `.trim();
        await sendEmail('me', email.from.emailAddress.address, `Re: ${email.subject}`, notification);

        // 6) remove temp file
        fs.unlinkSync(emailPath);
      }
    } catch (err) {
      console.error(`Error in workflow "${wf.name}":`, err);
    }
  }
})();
module.exports = {
    getUser,
    createUser,
    createTicket,
    getTicketsByEmailId,
    updateTicketEmailAndAddComment,
    getComment
  };