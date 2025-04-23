const config = {
    workflows: [
        {
            name: "Test Workflow",
            email: "me", // /users/{id} is the alternative
            newTicketTemplate: "Post Awards Reconciliation Template SRQ",
            updatedTicketTemplate: "",
            newTicketNotificationTemplatePath: "templates/default-notification-template.html",
            completedTicketNotificationTemplatePath: "templates/default-completion-notification-template.html",
            primaryInbox: "Inbox",
            pollRate: "15" // in seconds
        },
        {
            name: "Support Central Workflow",
            email: "me", // /users/{id} is the alternative
            newTicketTemplate: "NEW Service Request",
            updatedTicketTemplate: "",
            newTicketNotificationTemplatePath: "templates/default-notification-template.html",
            completedTicketNotificationTemplatePath: "templates/default-completion-notification-template.html",
            primaryInbox: "Inbox",
            pollRate: "15" // in seconds
        }
    ]
}

module.exports = config;