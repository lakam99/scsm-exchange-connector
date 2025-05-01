
const fs = require('fs');
const { getEmails, deleteEmail, sendEmail } = require('./mail-service.js');

async function fetchEmails(profile) {
    return (await getEmails(profile.email)).value;
  }
  
  function saveEmailToDisk(email) {
    const emailPath = path.join(__dirname, 'tmp', `${email.id}.eml`);
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