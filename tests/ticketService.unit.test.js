// __tests__/update-and-get-comment.unit.test.js
const path = require('path');
const child_process = require('child_process');

// mock out execFile
jest.mock('child_process', () => ({
    execFile: jest.fn()
}));
const execFile = child_process.execFile;

// import the two functions under test
const {
    updateTicketEmailAndAddComment,
    getComment
} = require('../scsm-actions.js');

describe('updateTicketEmailAndAddComment()', () => {
    beforeEach(() => {
        execFile.mockReset();
    });

    //TODO: Move to scsm-util.test.js
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
