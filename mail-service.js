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

async function getEmails() {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders('${config.folderName}')/messages`, {
        headers: getHeaders()
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching emails: ${response.status} ${response.statusText}\n${errorText}`);
    }

    return await response.json();
}

async function sendEmail(to, subject, body) {
    const payload = {
        message: {
            subject,
            body: {
                contentType: 'Text',
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

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
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

async function deleteEmail(emailObj) {

}

module.exports = {
    getEmails,
    sendEmail
};
