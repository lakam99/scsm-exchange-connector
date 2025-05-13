const { getUser, createUser, createTicket } = require('../scsm-actions.js');

// Mock child_process.execFile so that no real PowerShell runs.
const { execFile } = require('child_process');
jest.mock('child_process', () => ({
  execFile: jest.fn()
}));

describe('scsm-actions module (Unit Tests)', () => {
  beforeEach(() => {
    execFile.mockReset();
  });

  describe('getUser', () => {
    test('should parse output and return user object', async () => {
      const fakeOutput = '{"UPN":"scsmservice@nserc.ca","DisplayName":"scsmService","Id":"123e4567-e89b-12d3-a456-426614174000"}';
      
      // Simulate a successful PowerShell call by calling the callback with (null, stdout, '')
      execFile.mockImplementation((cmd, args, callback) => {
        callback(null, fakeOutput, '');
      });
      
      const user = await getUser('SCSMService', 'scsmservice@nserc.ca');
      expect(user).toEqual({
        UPN: 'scsmservice@nserc.ca',
        DisplayName: 'scsmService',
        Id: '123e4567-e89b-12d3-a456-426614174000'
      });
    });

    test('should reject if execFile returns an error', async () => {
      execFile.mockImplementation((cmd, args, callback) => {
        callback(new Error('Test error'), '', '');
      });
      
      await expect(getUser('TestUser', 'test@nserc.ca')).rejects.toThrow('Test error');
    });

    test('should reject if stderr is returned', async () => {
      execFile.mockImplementation((cmd, args, callback) => {
        callback(null, '', 'PowerShell error');
      });
      
      await expect(getUser('TestUser', 'test@nserc.ca')).rejects.toThrow('PowerShell error');
    });

    test('should reject if stdout is not valid JSON', async () => {
      execFile.mockImplementation((cmd, args, callback) => {
        callback(null, 'Not a JSON', '');
      });
      
      await expect(getUser('TestUser', 'test@nserc.ca')).rejects.toThrow('Failed to parse JSON output');
    });
  });

  //TODO: Fixme
  describe('createUser', () => {
    test('should return true when script returns success true', async () => {
      const fakeOutput = '{"success": true}';
      execFile.mockImplementation((cmd, args, callback) => {
        callback(null, fakeOutput, '');
      });
      
      const result = await createUser('TestUser', 'testuser@example.com');
      expect(result).toBe(true);
    });

    test('should return false when script returns success false', async () => {
      const fakeOutput = '{"success": false}';
      execFile.mockImplementation((cmd, args, callback) => {
        callback(null, fakeOutput, '');
      });
      
      const result = await createUser('TestUser', 'testuser@example.com');
      expect(result).toBe(false);
    });
  });

  describe('createTicket', () => {
    test('should return ticket object from script output', async () => {
      const fakeOutput = '{"ticketId": "TICKET123", "status": "created"}';
      execFile.mockImplementation((cmd, args, callback) => {
        callback(null, fakeOutput, '');
      });
      
      const options = {
        title: 'Test Ticket',
        description: 'Test Description',
        affectedUserId: 'User123',
        templateName: 'Post Awards Reconciliation Template SRQ',
        emailSubject: 'Test Subject',
        emailPath: 'TestEmailMimePath',
        emailFrom: 'from@example.com',
        emailId: 'Email123'
      };
      const result = await createTicket(options);
      expect(result).toEqual({
        ticketId: 'TICKET123',
        status: 'created'
      });
    });

    test('should throw an error if execFile returns an error', async () => {
      execFile.mockImplementation((cmd, args, callback) => {
        callback(new Error('Ticket error'), '', '');
      });
      
      const options = {
        title: 'Test Ticket',
        description: 'Test Description',
        affectedUserId: 'User123',
        emailSubject: 'Test Subject',
        emailPath: 'TestEmailMimePath',
        emailFrom: 'from@example.com',
        emailId: 'Email123'
      };
      await expect(createTicket(options)).rejects.toThrow('Ticket error');
    });
  });
});
