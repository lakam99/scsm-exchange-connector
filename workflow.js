const { getEmails } = require('./mail-service');
const { getTicketsByEmailId, createTicket, getUser, updateTicketEmailAndAddComment } = require('./scsm-actions');
const config = require('./workflow-config');
const fs = require('fs');

config.workflows.forEach(async (workflow) => {
    // workflow.email
    const emails = (await getEmails(workflow.email)).value;
    emails.forEach(async (email) => {
        const existingTickets = await getTicketsByEmailId(email.id);
        if (existingTickets.length) {
            if (existingTickets.length === 1) {
                const ticket = existingTickets[0];
                if (ticket.Status === 'Closed' || ticket.Status === 'Completed') {
                    createTicket({
                        "title": email.subject,
                        "description": email.body,
                        "templateName": workflow.newTicketTemplate,
                        "affectedUserId": user.Id,
                        "emailId": email.id
                    })
                } else {
                    await updateTicketEmailAndAddComment(ticket.Id, /**TODO: Add path */);
                }
            }
        } else {
            const user = await getUser(email.from.emailAddress.name, email.from.emailAddress.address);
            createTicket({
                "title": email.subject,
                "description": email.body,
                "templateName": workflow.newTicketTemplate,
                "affectedUserId": user.Id,
                "emailId": email.id
            })
        }
    })
    //get inbox
    //for email in inbox
    //is there a FileAttachment object in SCSM with this email id?
        //yes: pull up the related ticket(s)
            //iterate through list of tickets:
                //is ticket the only ticket?
                    //yes: 
                        // is it closed?
                            //yes: create a new ticket using that email id
                            //no: update the FileAttachment object in scsm with the new content & add a comment to the ticket
                    //no: 
                        // find the ticket that is still open, if there is more than one, pick the one created the earliest
                        // then, update the FileAttachment object in scsm with the new content & add a comment to the ticket
                    


})