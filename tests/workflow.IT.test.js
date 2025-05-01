// __tests__/workflow.IT.test.js
const fs   = require('fs');
const path = require('path');

jest.mock('../mail-service.js');
jest.mock('../scsm-actions.js');

const { getEmails, deleteEmail, sendEmail } = require('../mail-service.js');
const {
  getUser,    createUser,
  getTicketsByEmailId,
  createTicket, updateTicketEmailAndAddComment
} = require('../scsm-actions.js');

// point our workflow at a real temp dir under the project
process.env.WORKFLOW_TMP_DIR = path.join(__dirname, '..', 'tmp-integration');
const runWorkflows = require('../workflow.js');

describe('workflow integration (with sequence validation)', () => {
  const TMP = process.env.WORKFLOW_TMP_DIR;
  const fakeEmail = {
    id:   'EMAIL-ABC',
    mime: Buffer.from("THIS IS MIME;"),
    subject: 'Test',
    body:    { content: 'Hello world' },
    from:    { emailAddress: { name: 'Alice', address: 'alice@example.com' } }
  };

  beforeAll(() => {
    // clean out and recreate TMP
    if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true });
    fs.mkdirSync(TMP, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true });
  });

  beforeEach(() => {
    jest.resetAllMocks();

    // feed a single new email
    getEmails.mockResolvedValue({ value: [ fakeEmail ] });

    // pretend no ticket exists yet
    getTicketsByEmailId.mockResolvedValue([]);

    // pretend we never find the user in SCSM
    getUser.mockResolvedValue(null);
    createUser.mockResolvedValue({ Id: 'USER-123' });

    // spy on creating a ticket
    createTicket.mockResolvedValue({ ticketId: 'SRQ-999' });

    // spy on deleting and notifying
    deleteEmail.mockResolvedValue({});
    sendEmail.mockResolvedValue(true);
  });

  it('writes a .eml, creates a ticket, deletes the email, then notifies (in order)', async () => {
    await runWorkflows();

    // 1) The temp file was written then removed:
    const emlPath = path.join(TMP, fakeEmail.id + '.eml');
    expect(fs.existsSync(emlPath)).toBe(false);

    // 2) All the SCSM steps happened:
    expect(getTicketsByEmailId).toHaveBeenCalledWith(fakeEmail.id);
    expect(getUser).toHaveBeenCalledWith(
      fakeEmail.from.emailAddress.name,
      fakeEmail.from.emailAddress.address
    );
    expect(createUser).toHaveBeenCalledWith(
      fakeEmail.from.emailAddress.name,
      fakeEmail.from.emailAddress.address
    );
    expect(createTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        title:       fakeEmail.subject,
        description: fakeEmail.body.content,
        emailId:     fakeEmail.id
      })
    );

    // 3) Mail‐service deleteEmail + sendEmail were called:
    expect(deleteEmail).toHaveBeenCalledWith('me', fakeEmail);
    expect(sendEmail).toHaveBeenCalledWith(
      'me',
      fakeEmail.from.emailAddress.address,
      expect.any(String),   // notification subject
      expect.any(String)    // notification body
    );

    // 4) And finally – they were called in the correct *sequence*:
    const seq = [
      getEmails.mock.invocationCallOrder[0],
      getUser.mock.invocationCallOrder[0],
      createUser.mock.invocationCallOrder[0],
      getTicketsByEmailId.mock.invocationCallOrder[0],
      createTicket.mock.invocationCallOrder[0],
      deleteEmail.mock.invocationCallOrder[0],
      sendEmail.mock.invocationCallOrder[0]
    ];
    expect(seq).toEqual(seq.slice().sort((a,b) => a - b));
  });
});
