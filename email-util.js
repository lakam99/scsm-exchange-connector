const fs = require('fs');
const path = require('path');
const { getEmails } = require('./mail-service.js');
const { v4 } = require('uuid');
const config = require('./config.js');

async function fetchEmails(profile) {
    return (await getEmails(profile.email)).value;
}

function saveEmailToDisk(email, dir = config.tempDirectory || 'temp') {
    if (!email.mime) {
        throw new Error('Email object is missing "mime" content');
    }
    const emailPath = path.join(__dirname, dir, `${v4()}.eml`);
    fs.writeFileSync(emailPath, email.mime);
    return emailPath;
}

function cleanUp(emailPath) {
    fs.unlinkSync(emailPath);
}

module.exports = {
    fetchEmails,
    saveEmailToDisk,
    cleanUp
};
