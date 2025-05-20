const { getUser, createUser, createTicket, updateTicketEmailAndAddComment,
  getComment} = require('../scsm-actions.js');

// Mock child_process.execFile so that no real PowerShell runs.
const { execFile } = require('child_process');
jest.mock('child_process', () => ({
  execFile: jest.fn()
}));

const path = require('path');
const child_process = require('child_process');

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

  describe('createUser', () => {
    test('should return true when script returns success true', async () => {
      const fakeOutput = '{}';
      
      // Simulate a successful PowerShell call by calling the callback with (null, stdout, '')
      execFile.mockImplementation((cmd, args, callback) => {
        callback(null, fakeOutput, '');
      });

      const testUserData = {
        Name: `Test User 120`,
        Email: `testuser120@example.com`,
      };
      const result = await createUser(testUserData.Name, testUserData.Email);
      expect(result.created).toBe(true);

    });

    test('should return false when script returns success false', async () => {
      const fakeOutput = '{"success": false}';
      execFile.mockImplementation((cmd, args, callback) => {
        callback(null, fakeOutput, '');
      });
      
      const result = await createUser('TestUser', 'testuser1@example.com');
      expect(result.created).toBe(false);
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

// Unit tests for GetComment and UpdateTicketEmailAndAddComment
describe('updateTicketEmailAndAddComment()', () => {
  beforeEach(() => {
      execFile.mockReset();
  });

  it('resolves to true when the PS script returns success:true', async () => {
      // simulate PowerShell stdout = '{"success":true}', stderr=''
      execFile.mockImplementation((exe, args, cb) => {
          cb(null, JSON.stringify({ success: true }), '');
      });

      const ticketId = 'SRQ130667';
      const emailPath = 'C:\Users\scsmAdmin\Documents\scsm-exchange-connector\tests\temp\test-1744751354915.eml';
      const ok = await updateTicketEmailAndAddComment(ticketId, emailPath);

      expect(ok).toBe(true);

      // verify we called the right script + params
      expect(execFile).toHaveBeenCalledWith(
          'powershell.exe',
          expect.arrayContaining([
              '-File',
              path.join(__dirname, '../scripts/update-ticket-email.ps1'),
              '-TicketId', ticketId,
              '-EmailMimePath', emailPath
          ]),
          expect.any(Function)
      );
  });

  it('resolves to false when the PS script returns success:false', async () => {
      execFile.mockImplementation((exe, args, cb) => {
          cb(null, JSON.stringify({ success: false }), '');
      });

      const ok = await updateTicketEmailAndAddComment('SRQ130667', 'C:\Users\scsmAdmin\Documents\scsm-exchange-connector\tests\temp\test-1744751354915.eml');
      expect(ok).toBe(false);
  });

  it('rejects when execFile reports an error', async () => {
      execFile.mockImplementation((exe, args, cb) => {
          cb(new Error('PS Failed'), '', '');
      });
      await expect(updateTicketEmailAndAddComment('X', 'Y')).rejects.toThrow('PS Failed');
  });
});

describe('getComment()', () => {
  beforeEach(() => {
      execFile.mockReset();
  });

  it('resolves to true when the PS script returns success:true', async () => {
      execFile.mockImplementation((exe, args, cb) => {
          cb(null, JSON.stringify({ success: true }), '');
      });

      const ok = await getComment('SRQ130667');
      expect(ok).toBe(true);

      expect(execFile).toHaveBeenCalledWith(
          'powershell.exe',
          expect.arrayContaining([
              '-File',
              path.join(__dirname, '../scripts/get-comment.ps1'),
              '-TicketId', 'SRQ130667'
          ]),
          expect.any(Function)
      );
  });

  it('resolves to false when the PS script returns success:false', async () => {
      execFile.mockImplementation((exe, args, cb) => {
          cb(null, JSON.stringify({ success: false }), '');
      });

      const ok = await getComment('SRQ130667');
      expect(ok).toBe(false);
  });

  it('rejects when execFile reports an error', async () => {
      execFile.mockImplementation((exe, args, cb) => {
          cb(new Error('No PS'), '', '');
      });
      await expect(getComment('X')).rejects.toThrow('No PS');
  });
});

});
