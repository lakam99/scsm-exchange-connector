const config = require('./workflow-config');

config.workflows.forEach((workflow) => {
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