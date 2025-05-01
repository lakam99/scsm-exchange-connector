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
        const created = await createUser(email.from.emailAddress.name, email.from.emailAddress.address);
        if (!created) {
            throw new Error(`Could not create user ${email.from.emailAddress.address}`);
        }
        user = await getUser(email.from.emailAddress.name, email.from.emailAddress.address);
    }
    return user;
}

/**
* Creates a new ticket in the system.
* @return {Promise<WorkItem>}
*/
async function createNewTicket(email, user, profile, emailPath) {
    return await createTicket({
        title: email.subject,
        description: email.body.content,
        affectedUserId: user.Id,
        templateName: profile.newTicketNotificationTemplatePath,
        emailSubject: email.subject,
        emailPath,
        emailFrom: email.from.emailAddress.address,
        emailId: email.id
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
    const tickets = await getTicketsByEmailId(email.id);

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