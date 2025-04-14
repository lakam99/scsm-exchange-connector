# SCSM Exchange Connector (Microsoft Graph Edition)

A custom-built Exchange Connector for **System Center Service Manager (SCSM) 2019**, powered by the **Microsoft Graph API**.

This project allows SCSM environments to interact with Microsoft 365 mailboxes to:
- 📥 Read emails from specific folders
- 📤 Send emails programmatically
- 🧪 Test connectivity via unit and integration tests
- 🧱 Extend functionality for ticket creation and mail automation

---

## 🚀 Features

- Connects to Microsoft Graph using **OAuth2** access tokens
- Fetches emails from a specific mailbox folder
- Sends emails using the `/sendMail` endpoint
- Built using **vanilla Node.js** (`require` syntax)
- Includes unit tests with mocked Graph responses
- Integration tests for live Graph API interaction

---

## 🔧 Prerequisites

- Node.js **v18+** (for built-in `fetch`)
- Microsoft 365 mailbox
- Azure AD App Registration with the following:
  - **Application permissions** for:
    - `Mail.ReadWrite`
    - `Mail.Send`
  - **Client Secret** (for production use)
  - **Access Token** (manually acquired for local tests)

---

## 📁 Project Structure

```
scsm-exchange-connector/
├── config.js                # Configuration file with accessToken, folderName, etc.
├── mail-service.js          # Core logic for interacting with Microsoft Graph
├── tests/
│   ├── mail-service.test.js     # Unit tests (mocked)
│   └── mail-service.IT.test.js  # Integration tests (live Graph API)
├── package.json
├── README.md
```

---

## 🛠️ Configuration

### `config.js`:
```js
exports.config = {
  accessToken: 'YOUR_GRAPH_ACCESS_TOKEN',
  folderName: 'Inbox',
  testRecipient: 'you@domain.com'
};
```

> 🔐 In production, consider using client credentials and dynamically refreshing access tokens.

---

## 🧪 Running Tests

### Install dependencies:
```bash
npm install
```

### Run all tests:
```bash
npm run test
```

### Run unit tests only:
```bash
node_modules/.bin/jest tests/mail-service.test.js
```

### Run integration tests (requires valid token):
```bash
node_modules/.bin/jest tests/mail-service.IT.test.js
```

---

## 🧱 Future Plans

- 💡 Automatically ingest emails as SCSM work items
- 🔄 Poll mailboxes on a schedule
- 🔐 Implement client credentials auth flow
- 📬 Support attachments and HTML parsing

---

## 🧑‍💻 Authors

**Arkam Mazrui** – arkam.mazrui@nserc-crsng.gc.ca  
**Yaseen Choukri** – yaseen.choukri@nserc-crsng.gc.ca

---

## 📜 License

MIT License. Use freely and improve it if you can.
