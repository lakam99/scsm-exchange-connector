const { monitorCompletedTickets } = require('../completed-workflow');
const config = require('../profile-config');

describe('Completed Ticket Monitor', () => {
  test('should notify affected user for completed tickets', async () => {
    const profile = config.profiles[0]; // recon template

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await monitorCompletedTickets(profile);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📬 Notified'));
    consoleSpy.mockRestore();
  }, 30000);
});
