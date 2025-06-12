const {
    getUser,
    createUser,
    getTicketsByEmailId,
    createTicket,
    updateTicketEmailAndAddComment
} = require('./scsm-actions.js');

async function ensureUser(email) {
    let user = await getUser(email.from.emailAddress.name, email.from.emailAddress.address);
    if (!user || !user.Id) {
        const created = await createUser(email.from.emailAddress.name, email.from.emailAddress.address); //TODO: This fails always
        if (!created) {
            throw new Error(`Could not create user ${email.from.emailAddress.address}`);
        }
        return created;
        //user = await getUser(email.from.emailAddress.name, email.from.emailAddress.address);
    }
    return user;
}

function truncate(text, max) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max - 3) + '...' : text;
  }
  
  function stripHtml(html) {
    return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }
  
/**
* Creates a new ticket in the system.
* @return {Promise<WorkItem>}
*/
async function createNewTicket(email, user, profile, emailPath) {
    // process html to make lines befoire cleaning
    const safeDescription = truncate(stripHtml(email.body?.content), 4000);
    return await createTicket({
        title: email.subject,
        description: safeDescription,
        affectedUserId: user.Id,
        templateName: profile.newTicketTemplate,
        emailSubject: email.subject,
        emailPath,
        emailFrom: email.from.emailAddress.address,
        emailId: email.conversationId
    });
}

/**
* Updates an existing ticket with the email information.
* @param {WorkItem} ticket - The existing ticket to update.
* @param {string} emailPath - The path to the email file.
* @return {Promise<WorkItem>}
*/
async function updateExistingTicket(ticket, emailPath) {
    return await updateTicketEmailAndAddComment(ticket.Id, emailPath);
}

/**
* Handles the ticket creation or update process based on the email information.
* @param {Email} email - The email object containing the email information.
* @param {User} user - The user object associated with the email sender.
* @param {Profile} profile - The profile object containing the configuration for the email processing.
* @param {string} emailPath - The path to the email file.
* @return {Promise<WorkItem>}
*/
async function createOrUpdateTicketFromEmail(email, user, profile, emailPath) {
    const tickets = await getTicketsByEmailId(email.conversationId, email.subject);

    if (tickets && tickets.length > 0) {
        const ticket = tickets[0];
        if (ticket.Status === 'Closed' || ticket.Status === 'Completed') {
            await createNewTicket(email, user, profile, emailPath);
        } else {
            return await updateExistingTicket(ticket, emailPath);
        }
    } else {
        return await createNewTicket(email, user, profile, emailPath);
    }
}

module.exports = {
    ensureUser,
    createNewTicket,
    updateExistingTicket,
    createOrUpdateTicketFromEmail
};