
const fs = require('fs');
const path = require('path');
const { getEmails } = require('./mail-service.js');
const { v4 } = require('uuid');

async function fetchEmails(profile) {
    return (await getEmails(profile.email)).value;
  }
  
  function saveEmailToDisk(email, dir='temp') {
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