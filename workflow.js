const { getEmails } = require('./mail-service');
const { getTicketsByEmailId, createTicket, getUser, updateTicketEmailAndAddComment, createUser} = require('./scsm-actions');
const config = require('./workflow-config');
const fs = require('fs');

//TODO: DRY KISS
config.workflows.forEach(async (workflow) => {
    // workflow.email
    const emails = (await getEmails(workflow.email)).value;
    emails.forEach(async (email) => {
        const email_path = `/tmp/${email.id}.eml`;
        fs.writeFileSync(email_path, email.mime);
        const existingTickets = await getTicketsByEmailId(email.id);
        if (existingTickets.length) {
            if (existingTickets.length === 1) {
                const ticket = existingTickets[0];
                if (ticket.Status === 'Closed' || ticket.Status === 'Completed') {
                    createTicket({
                        "title": email.subject,
                        "description": email.body,
                        "templateName": config.workflows[1].newTicketTemplate,
                        "affectedUserId": user.Id,
                        "emailId": email.id
                    })
                } else {
                    await updateTicketEmailAndAddComment(ticket.Id, email_path);
                }
            }
        } else {
            
            let user = await getUser(email.from.emailAddress.name, email.from.emailAddress.address);
            
            if(!user){
                user = await createUser(email.from.emailAddress.name, email.from.emailAddress.address)
            }
            createTicket({
                "title": email.subject,
                "description": email.body,
                "templateName": workflow.newTicketTemplate,
                "affectedUserId": user.Id,
                "emailId": email.id
            })
        }
        fs.unlinkSync(email_path);
//3rd

        // call mail-service deleteEmail to delete emails 
        // call mail-service sendEmail to notify end user ticket is ready


        //4th drykiss it 5th unit and 6th it test
    });              
})