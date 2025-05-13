// __tests__/ticketService.it.test.js
const path = require('path');
const {
  updateTicketEmailAndAddComment,
  getComment
} = require('../scsm-actions.js');

describe('ticketService (integration)', () => {
  const TEST_TICKET_ID = 'SRQ130667';                 // replace with a real SRQ
  const TEST_EMAIL_PATH = path.join(__dirname, '..', 'tests', 'temp', 'test-1744750233801.eml')

  //TODO: Move to scsm-util.IT.test.js
  test('round-trip: updateTicketEmailAndAddComment → getComment', async () => {
    // 1) push a new email + comment into the ticket
    const added = await updateTicketEmailAndAddComment(TEST_TICKET_ID, TEST_EMAIL_PATH);
    expect(added).toBe(true);

    // 2) now retrieve it back
    const hasComment = await getComment(TEST_TICKET_ID);
    expect(hasComment).toBe(true);
  });
});
