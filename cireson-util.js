const httpntlm = require('httpntlm');
const { randomUUID } = require('crypto');
const config = require('./config');

function createUserPayload(firstName, lastName, Email) {
    const userPayload = {
        ClassTypeId: "10a7f898-e672-ccf3-8881-360bfb6a8f9a",
        Domain: "SMInternal",
        DistinguishedName: "NOTSET",
        TimeAdded: "0001-01-01T00:00:00.000Z",
        FirstName: firstName,
        Initials: "",
        LastName: lastName,
        DisplayName: `${lastName},${firstName}`,
        UserName: randomUUID(),
        UPN: Email,
        StreetAddress: "N/A",
        City: "N/A",
        State: "N/A",
        ZIP: "00000",
        Country: "N/A",
        BusinessPhone: "N/A",
        Title: "N/A",
        Department: "N/A",
        Office: "N/A",
        Company: "N/A"
    };

    const createPayload = {
        formJSON: {
            current: userPayload,
            original: null
        },
    };
    return createPayload;
}

function getCiresonAPIToken() {
    return new Promise((resolve, reject) => {
        httpntlm.post({
            url: `${config.ciresonPortalUrl}/api/V3/Authorization/GetToken`,
            username: config.ciresonUsername,
            password: config.ciresonPassword,
            domain: config.ciresonDomain,
            body: JSON.stringify({
                UserName: `${config.ciresonDomain}\\${config.ciresonUsername}`,
                Password: config.ciresonPassword,
                LanguageCode: 'ENU'
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }, (err, res) => {
            if (err) return reject(err);
            resolve(res.body.replace(/"/g, ''));
        });
    });
}

async function createPortalUser(firstName, lastName, email) {
    
    const token = await getCiresonAPIToken();
    const payload = createUserPayload(firstName, lastName, email);
    const response = await fetch(`${config.ciresonPortalUrl}/api/V3/Projection/Commit`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
  
    const result = await response.json();
    return result;
  }

module.exports = {createPortalUser};