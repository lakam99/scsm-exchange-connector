const { execFile } = require('child_process');
const path = require('path');

function runPowerShell(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    // Use "powershell.exe" on Windows. Adjust if needed (e.g. "pwsh" if using PowerShell Core)
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args], (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr) return reject(new Error(stderr));
      try {
        // Attempt to parse the output as JSON
        const json = JSON.parse(stdout);
        resolve(json);
      } catch (err) {
        reject(new Error(`Failed to parse JSON output: ${stdout}`));
      }
    });
  });
}

async function getUser(name, email) {
  const script = path.join(__dirname, 'scripts/get-user.ps1');
  // Pass the parameters without extra quotes
  return await runPowerShell(script, ['-Name', name, '-Email', email]);
}

async function createUser(name, email) {
  const script = path.join(__dirname, 'scripts/create-user.ps1');
  const result = await runPowerShell(script, ['-Name', name, '-Email', email]);
  return result.success === true;
}

async function createTicket(options) {
  const {
    title,
    description,
    affectedUserId,
    templateName = "Post Awards Reconciliation Template SRQ",
    emailSubject,
    emailPath,
    emailFrom,
    emailId
   } = options;

  const scriptPath = path.join(__dirname, 'scripts', 'create-ticket.ps1');
  
  const args = [
    '-Title', title,
    '-Description', description,
    '-affectedUserId', affectedUserId,
    '-templateName', templateName,
    '-EmailSubject', emailSubject,
    '-EmailMimePath', emailPath,
    '-EmailFrom', emailFrom,
    '-ConversationId', emailId
  ]

  try {
    const result = await runPowerShell(scriptPath, args);
    return result; // assuming your script returns compressed JSON
  } catch (err) {
    throw new Error(`Failed to create ticket: ${err.message}`);
  }
}

module.exports = {
  getUser,
  createUser,
  createTicket
};
