jest.mock('../mail-service', () => ({
  sendEmail: jest.fn(() => Promise.resolve(true))
}));
jest.mock('../scsm-actions', () => ({
  getCompletedTickets: jest.fn(() => Promise.resolve([
    {
      Id: 'SRQ123456',
      Title: 'Test Completed Ticket',
      AffectedUser: 'Test User',
      AffectedUserEmail: 'test@example.com'
    }
  ]))
}));

const { monitorCompletedTickets } = require('../workflow');
const config = require('../profile-config');
const { sendEmail } = require('../mail-service');

describe('monitorCompletedTickets (unit)', () => {
  test('should call sendEmail with correct parameters', async () => {
    const profile = config.profiles[0];
    await monitorCompletedTickets(profile);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@example.com',
      subject: expect.stringContaining('has been completed')
    }));
  });
});

