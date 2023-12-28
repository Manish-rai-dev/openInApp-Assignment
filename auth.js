
const { google } = require('googleapis');
const { promisify } = require('util');
const fs = require('fs');
const readline = require('readline');


const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Function to get OAuth2 client for Gmail API
const getOAuthClient = async () => {
  const credentials = await readFileAsync('./credentials.json');

  // Parsing client credentials and creating OAuth2 client
  const { client_secret, client_id, redirect_uris } = JSON.parse(credentials).web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = await readFileAsync('./token.json');
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (error) {

    return getAccessToken(oAuth2Client);
  }
};

// Function to obtain access token by generating auth URL and handling user input
const getAccessToken = async (oAuth2Client) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify'],
  });

  console.log('Authorize this app by visiting this URL:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Returning a Promise to handle user input asynchronously
  return new Promise((resolve, reject) => {
    rl.question('Enter the authorization code from the URL:', async (code) => {
      rl.close();
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        await writeFileAsync('./token.json', JSON.stringify(tokens));
        resolve(oAuth2Client);
      } catch (error) {
        reject(new Error(`Error getting access token: ${error.message}`));
      }
    });
  });
}

module.exports = { getOAuthClient };