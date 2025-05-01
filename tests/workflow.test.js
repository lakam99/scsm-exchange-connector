// __tests__/workflow.unit.test.js
jest.mock('fs');
jest.mock('../mail-service.js');
jest.mock('../scsm-actions.js');

const fs                  = require('fs');
const { getEmails, deleteEmail, sendEmail } = require('../mail-service.js');
const {
  getUser, createUser,
  getTicketsByEmailId,
  createTicket, updateTicketEmailAndAddComment
} = require('../scsm-actions.js');
const { processWorkflow } = require('../workflow.js');
const config              = require('../workflow-config.js');

describe('processWorkflow()', () => {
  const wf = {
    name: 'Test',
    email: 'me',
    newTicketTemplate: 'TEMPLATE'
  };

  const fakeEmail = {
    id: 'EMAIL123',
    subject: 'Hi',
    body: { content: 'body' },
    mime: Buffer.from('raw'),
    from: { emailAddress: { name: 'Bob', address: 'bob@ex.com' } }
  };

  beforeEach(() => {
    jest.resetAllMocks();
    getEmails.mockResolvedValue({ value: [fakeEmail] });
    getUser.mockResolvedValue({});
    createUser.mockResolvedValue(true);
    getTicketsByEmailId.mockResolvedValue([]);
    createTicket.mockResolvedValue({ ticketId: 'SRQ1' });
    deleteEmail.mockResolvedValue(true);
    sendEmail.mockResolvedValue(true);
  });

  it('writes email, creates user + ticket + deletes + notifies + cleans up', async () => {
    await processWorkflow(wf);

    // wrote the .eml
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/tmp[\/\\]EMAIL123\.eml$/),
      fakeEmail.mime
    );

    // created a user
    expect(createUser).toHaveBeenCalledWith('Bob', 'bob@ex.com');

    // created a ticket
    expect(createTicket).toHaveBeenCalledWith(expect.objectContaining({
      title:       'Hi',
      description: 'body',
      emailId:     'EMAIL123'
    }));

    // then deleted and notified
    expect(deleteEmail).toHaveBeenCalledWith('me', fakeEmail);
    expect(sendEmail).toHaveBeenCalledWith(
      'me',
      'bob@ex.com',
      'Re: Hi',
      expect.stringContaining('Your message "Hi" has been logged')
    );

    // and cleaned up the tmp file
    expect(fs.unlinkSync).toHaveBeenCalledWith(
      expect.stringMatching(/tmp[\/\\]EMAIL123\.eml$/)
    );
  });
});
