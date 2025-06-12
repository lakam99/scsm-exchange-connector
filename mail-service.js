const config = require('./config.js');

function getAccessToken() {
    return config.accessToken;
}

function getHeaders() {
    return {
        'Authorization': `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json'
    }
}

/**
 * @typedef {Object} EmailAddress
 * @property {string} name - The display name of the sender/recipient.
 * @property {string} address - The email address.
 */

/**
 * @typedef {Object} EmailMessage
 * @property {string} id
 * @property {string} subject
 * @property {string} bodyPreview
 * @property {string} createdDateTime
 * @property {string} receivedDateTime
 * @property {string} sentDateTime
 * @property {boolean} hasAttachments
 * @property {Object} body
 * @property {string} body.contentType
 * @property {string} body.content
 * @property {{ emailAddress: EmailAddress }} sender
 * @property {{ emailAddress: EmailAddress }} from
 * @property {{ emailAddress: EmailAddress }[]} toRecipients
 * @property {{ emailAddress: EmailAddress }[]} ccRecipients
 * @property {{ emailAddress: EmailAddress }[]} bccRecipients
 * @property {{ emailAddress: EmailAddress }[]} replyTo
 * @property {string} webLink
 * @property {string} inferenceClassification
 * @property {string} importance
 * @property {Object} flag
 * @property {string} flag.flagStatus
 */

/**
 * @typedef {Object} GetEmailsResponse
 * @property {string} "@odata.context"
 * @property {EmailMessage[]} value
 */

/**
 * Fetches emails from the user's inbox.
 * 
 * @param {string} [user='me'] - The user ID or 'me' for the current authenticated user.
 * @returns {Promise<GetEmailsResponse>} - A promise that resolves to the email messages.
 */
async function getEmails(user='me') {
    const response = await fetch(`https://graph.microsoft.com/v1.0/${user}/mailFolders('${config.folderName}')/messages`, {
        headers: getHeaders()
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching emails: ${response.status} ${response.statusText}\n${errorText}`);
    }

    return await response.json();
}

/**
 * * Sends an email using the Microsoft Graph API.
 * @param {Object} options - The email options.
 * @param {string} [options.user='me'] - The user ID or 'me' for the current authenticated user.
 * @param {string} options.to - The recipient's email address.
 * @param {string} options.subject - The subject of the email.
 */
async function sendEmail({user = 'me', to, subject, body} = options) {
    const payload = {
        message: {
            subject,
            body: {
                contentType: 'HTML',
                content: body
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: to
                    }
                }
            ]
        },
        saveToSentItems: 'true'
    };

    const response = await fetch(`https://graph.microsoft.com/v1.0/${user}/sendMail`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error sending email: ${response.status} ${response.statusText}\n${errorText}`);
    }

    return true;
}

/**
 * * Fetches the raw MIME content of an email message.
 * * @param {Object} options - The email options.
 * * @param {string} [options.user='me'] - The user ID or 'me' for the current authenticated user.
 * * @param {string} options.messageId - The ID of the email message.
 * * @returns {Promise<Buffer>} - A promise that resolves to the raw MIME content of the email.
 */
async function getEmail(user='me', messageId) {
    const url = `https://graph.microsoft.com/v1.0/${user}/messages/${messageId}/$value`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Accept': 'application/octet-stream'
        }
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch email: ${response.status} ${response.statusText}\n${errText}`);
    }

    const buffer = await response.arrayBuffer(); // MIME format
    return Buffer.from(buffer); // Return as Buffer for writing to disk or base64 encoding
}

async function deleteEmail({user='me', emailObj} = options) {
    const messageId = emailObj.id;

    const payload = {
        destinationId: 'deleteditems' // This is the well-known folder ID for "Deleted Items"
    };

    const response = await fetch(`https://graph.microsoft.com/v1.0/${user}/messages/${messageId}/move`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error deleting email (moving to Deleted Items): ${response.status} ${response.statusText}\n${errorText}`);
    }

    return await response.json(); // returns the moved message object
}

async function getEmailsFromDeleted(user='me') {
    const response = await fetch(`https://graph.microsoft.com/v1.0/${user}/mailFolders/deleteditems/messages`, {
        headers: getHeaders()
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching deleted emails: ${response.status} ${response.statusText}\n${errorText}`);
    }

    return await response.json();
}

module.exports = {
    getEmails,
    sendEmail,
    deleteEmail,
    getEmailsFromDeleted,
    getEmail
};
