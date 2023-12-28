const { google } = require('googleapis');
const { promisify } = require('util');
const fs = require('fs');
const readline = require('readline');

// Promisify file-related functions for asynchronous usage
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

/**
 * Function to get OAuth2 client for Gmail API.
 * Reads client credentials from 'credentials.json' and retrieves the stored token from 'token.json'.
 * If token is not found, initiates the process to get a new access token.
 * @returns {Promise<google.auth.OAuth2>} The OAuth2 client.
 */
const getOAuthClient = async () => {
  // Read client credentials from 'credentials.json'
  const credentials = await readFileAsync('./credentials.json');
  const { client_secret, client_id, redirect_uris } = JSON.parse(credentials).web;

  // Create OAuth2 client
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    // Attempt to read the stored token from 'token.json'
    const token = await readFileAsync('./token.json');

    // Set the credentials if token exists
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (error) {
    // If token is not found, initiate the process to get a new access token
    return getAccessToken(oAuth2Client);
  }
};

/**
 * Function to obtain access token by generating auth URL and handling user input.
 * Prompts the user to authorize the app by visiting the generated auth URL and entering the code.
 * @param {google.auth.OAuth2} oAuth2Client - The OAuth2 client.
 * @returns {Promise<google.auth.OAuth2>} The OAuth2 client with updated credentials.
 */
const getAccessToken = async (oAuth2Client) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify'],
  });

  console.log('Authorize this app by visiting this URL:', authUrl);

  // Create a readline interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Return a Promise to handle user input asynchronously
  return new Promise((resolve, reject) => {
    rl.question('Enter the authorization code from the URL:', async (code) => {
      rl.close();
      try {
        // Get the access token using the entered code
        const { tokens } = await oAuth2Client.getToken(code);

        // Set the credentials and store the token for future use
        oAuth2Client.setCredentials(tokens);
        await writeFileAsync('./token.json', JSON.stringify(tokens));
        
        // Resolve with the updated OAuth2 client
        resolve(oAuth2Client);
      } catch (error) {
        // Reject with an error message if there's an issue getting the access token
        reject(new Error(`Error getting access token: ${error.message}`));
      }
    });
  });
}

module.exports = { getOAuthClient };
