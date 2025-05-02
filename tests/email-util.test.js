const fs = require('fs');
const { saveEmailToDisk, cleanUp, fetchEmails } = require('../email-util');
const { getEmails } = require('../mail-service');

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn()
}));

jest.mock('../mail-service', () => ({
  getEmails: jest.fn()
}));

describe('email-util', () => {
  const fakeEmail = { id: 'email1', mime: 'MIME CONTENT' };
  const fakeProfile = { email: 'me' };

  beforeEach(() => jest.clearAllMocks());

  test('saveEmailToDisk writes file and returns path', () => {
    const result = saveEmailToDisk(fakeEmail);
    expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining(fakeEmail.id), fakeEmail.mime);
    expect(result).toContain(fakeEmail.id);
  });

  test('cleanUp removes file', () => {
    cleanUp('/tmp/email.eml');
    expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/email.eml');
  });

  test('fetchEmails calls getEmails and returns values', async () => {
    getEmails.mockResolvedValue({ value: [fakeEmail] });
    const result = await fetchEmails(fakeProfile);
    expect(getEmails).toHaveBeenCalledWith(fakeProfile.email);
    expect(result).toEqual([fakeEmail]);
  });
});
