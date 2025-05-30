const { execFile } = require('child_process');
const path = require('path');
// Required libraries
const fetch = require('node-fetch');
const {createPortalUser} = require('./cireson-util.js');
// keep only name and email and put the rest in the config file
async function createUser(Name, Email) {
  const firstName = Name.includes(' ') ? Name.substring(0, Name.lastIndexOf(' ')).trim() : Name;
  const lastName = Name.includes(' ') ? Name.substring(Name.lastIndexOf(' ') + 1).trim() : 'Unknown';

  const existingUser = await getUser(Name, Email);
  if (Object.values(existingUser).length) {
    return {
      success: true,
      existing: true,
      created: false,
      DisplayName: existingUser.DisplayName,
      Id: existingUser.Id,
      UPN: existingUser.UPN
    };
  } else {
    const result = createPortalUser(firstName, lastName, Email); //Only returns a baseId
    return {
      success: true,
      created: true,
      existing: false,
      Id: result.BaseId,
      UPN: Email // dangerous, we're assuming the user was created with the email successfully. The user could be created, but the UPN could be blank.
    };
  }
}

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


// 3rd create new account in graph, grant it all permissions for mail 4th replace the token in config.js 5th test workflow . it test

/**
 * Represents a simplified user object returned from SCSM.
 * 
 * @typedef {Object} ScsmUser
 * @property {string} Id - The GUID of the user.
 * @property {string} DisplayName - The display name of the user.
 * @property {string} UPN - The User Principal Name (email) of the user.
 */

/**
 * Fetches a user from SCSM (System Center Service Manager) by name and email.
 *
 * @param {string} name - The name of the user to search for (not directly used in filtering).
 * @param {string} email - The email address (UPN) to match the user.
 * @returns {Promise<ScsmUser|{}>} A promise resolving to the matched user object, or an empty object if no user is found.
 */
async function getUser(name, email) {
  const script = path.join(__dirname, 'scripts/get-user.ps1');
  // Pass the parameters without extra quotes
  return await runPowerShell(script, ['-Name', name, '-Email', email]);
}

/**
 * 
 * @param {string} emailId 
 * @returns {Array<{Id: string, Status: string, CreatedDate: string}>}
 */

// 2nd powershell and unit test and it
async function getTicketsByEmailId(srqtitle) {
  const script = path.join(__dirname, 'scripts/get-tickets-by-emailid.ps1');
  const result = await runPowerShell(script, ['-srqtitle', srqtitle]);
  return result.success;
}
/**
 * * Updates a ticket's email and adds a comment by invoking a PowerShell script.
 * @param {string} ticketId - The ID of the ticket to update.
 * @param {string} pathToNewEmail - The full path to the new email MIME file. 
 * @returns {Promise<WorkItem>}
 */

async function updateTicketEmailAndAddComment(ticketId, pathToNewEmail) {
  const script = path.join(__dirname, 'scripts/update-ticket-email.ps1');
  const result = await runPowerShell(script, ['-TicketId', ticketId, '-EmailMimePath', pathToNewEmail]);
  return result.success;
}

async function getComment(ticketId) {
  const script = path.join(__dirname, 'scripts/get-comment.ps1');
  const result = await runPowerShell(script, ['-TicketId', ticketId]);
  return result.success;
}

async function deleteUser(email) {
  const script = path.join(__dirname, 'scripts/delete-user.ps1');
  const result = await runPowerShell(script, ['-Email', email]);
  return result.success;
    
}


/**
 * Options for creating a support ticket.
 * 
 * @typedef {Object} CreateTicketOptions
 * @property {string} title - The title of the support ticket.
 * @property {string} description - A detailed description of the issue.
 * @property {string} affectedUserId - The ID of the user affected by the issue.
 * @property {string} [templateName="Post Awards Reconciliation Template SRQ"] - The name of the ticket template to use.
 * @property {string} emailSubject - The subject line for the email.
 * @property {string} emailPath - The full path to the email MIME file.
 * @property {string} emailFrom - The sender address of the email.
 * @property {string} emailId - The ID or conversation ID of the related email.
 */

/**
 * Work Item type definition.
 * 
 * @typedef {Object} WorkItem
 * @property {string} Id - The ID of the work item.
 * @property {string} title - The title of the support ticket.
 */

/**
 * Creates a support ticket by invoking a PowerShell script with provided options.
 * 
 * @param {CreateTicketOptions} options - The configuration and data for the new ticket.
 * @returns {Promise<WorkItem>} - A promise resolving to the result of the ticket creation (usually JSON).
 * @throws {Error} - Throws if the PowerShell script fails to execute.
 */
async function createTicket(options) {
  const {
    title,
    description,
    affectedUserId,
    templateName,
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
  createTicket,
  getTicketsByEmailId,
  updateTicketEmailAndAddComment,
  getComment,
  deleteUser,
};
