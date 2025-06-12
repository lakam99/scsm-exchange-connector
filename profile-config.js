const config = {
    profiles: [
        {
            name: "Reconciliations",
            email: "me", // /users/{id} is the alternative
            newTicketTemplate: "Post Awards Reconciliation Template SRQ",
            area: "Reconciliations",
            updatedTicketTemplate: "Default Service Request",
            newTicketNotificationTemplatePath: "templates/default-notification-template.html",
            completedTicketNotificationTemplatePath: "templates/default-completion-notification-template.html",
            primaryInbox: "Inbox",
            pollRate: "15" // in seconds
        },
        {
            name: "Support Central Workflow",
            email: "me", // /users/{id} is the alternative
            newTicketTemplate: "Default Service Request",
            area: "Reconciliations",
            updatedTicketTemplate: "Default Service Request",
            newTicketNotificationTemplatePath: "templates/default-notification-template.html",
            completedTicketNotificationTemplatePath: "templates/default-completion-notification-template.html",
            primaryInbox: "Inbox",
            pollRate: "15" // in seconds
        },
        {
            name: "Use grants funds",
            email: "usegrantfunds@nserc-crsng.gc.ca ", // /users/{id} is the alternative
            newTicketTemplate: "Post Awards Use of Grants Funds SRQ",
            area: "Use of Grants Funds",
            updatedTicketTemplate: "Post Awards Use of Grants Funds SRQ",
            newTicketNotificationTemplatePath: "templates/default-notification-template.html",
            completedTicketNotificationTemplatePath: "templates/default-completion-notification-template.html",
            primaryInbox: "Inbox",
            pollRate: "15" // in seconds
        },
        {
            name: "Grants Administration",
            email: "grantsadministration@nserc-crsng.gc.ca ", // /users/{id} is the alternative
            newTicketTemplate: "Post Award Grants SRQ",
            area: "Finance Post Award Grants",
            updatedTicketTemplate: "Post Award Grants SRQ",
            newTicketNotificationTemplatePath: "templates/default-notification-template.html",
            completedTicketNotificationTemplatePath: "templates/default-completion-notification-template.html",
            primaryInbox: "Inbox",
            pollRate: "15" // in seconds
        },
        {
            name: "Scholorships",
            email: "scholarshipsadministration@nserc-crsng.gc.ca", // /users/{id} is the alternative
            newTicketTemplate: "Post Award Scholarships SRQ",
            area: "Finance Post Award Scholarships",
            updatedTicketTemplate: "Post Award Scholarships SRQ",
            newTicketNotificationTemplatePath: "templates/default-notification-template.html",
            completedTicketNotificationTemplatePath: "templates/default-completion-notification-template.html",
            primaryInbox: "Inbox",
            pollRate: "15" // in seconds
        }
    ]
}

module.exports = config;