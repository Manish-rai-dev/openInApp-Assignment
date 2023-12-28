const { google } = require('googleapis');
const { getOAuthClient } = require('./auth');

/**
 * Function to list messages in the user's inbox.
 * @returns {Object[]} Array of message objects.
 */
const listMessages = async () => {
  const auth = await getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
    });
    return response.data.messages || [];
  } catch (error) {
    throw new Error(`Error listing messages: ${error.message}`);
  }
}

/**
 * Function to send an auto-reply for a given message ID.
 * @param {string} messageId - The ID of the message to reply to.
 */
const sendAutoReply = async (messageId) => {
  const auth = await getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
    });

    // Extract information from the original message
    const headers = message.data.payload.headers;
    const originalSenderHeader = headers.find((header) => header.name === 'From');
    const originalSender = originalSenderHeader ? originalSenderHeader.value : undefined;
    const subjectHeader = headers.find(header => header.name === 'Subject');
    const subject = subjectHeader ? subjectHeader.value : undefined;

    // Check if originalSender exists
    if (!originalSender) {
      throw new Error('Sender email address not found in the message headers.');
    }

    // Skip auto-reply for certain email addresses
    if (originalSender.toLowerCase().includes('noreply') || originalSender.toLowerCase().includes('no-reply')) {
      console.log(`Skipping auto-reply for email with 'noreply' or 'no-reply' address: ${originalSender}`);
      return;
    }

    // Compose and send auto-reply
    const autoReply = `This is an auto reply mail currently I am busy with my entreprenuer skills will revert you back soon .`;

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(
          `From: "Manish Kumar Rai" <raimanishkumar0320@gmail.com>\r\n` +
          `To: ${originalSender}\r\n` +
          `Subject: Re: ${subject}\r\n` +
          `\r\n` +
          `${autoReply}`
        ).toString('base64'),
      },
    });
  } catch (error) {
    throw new Error(`Error sending auto-reply: ${error.message}`);
  }
}

/**
 * Function to fetch information about a Gmail thread given its ID.
 * @param {string} threadId - The ID of the thread to fetch information for.
 * @returns {Object} Thread information object.
 */
const fetchThreadInfo = async (threadId) => {
  const auth = await getOAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    const response = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching thread information: ${error.message}`);
  }
}

/**
 * Function to add a label to a Gmail message.
 * @param {string} messageId - The ID of the message to label.
 * @param {string} labelName - The name of the label to add.
 */
const addLabel = async (messageId, labelName) => {
  try {
    const auth = await getOAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    // Check existing labels
    const existingLabels = await gmail.users.labels.list({
      userId: 'me',
    });

    // Check if the label exists
    const label = existingLabels.data.labels.find((l) => l.name === labelName);

    // Create the label if it doesn't exist
    if (!label) {
      const createdLabel = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: labelName,
        },
      });
      labelName = createdLabel.data.id;
    } else {
      labelName = label.id;
    }

    // Apply the label and move the message to the related label
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: [labelName],
      },
    });
  } catch (error) {
    throw new Error(`Error in labeling: ${error.message}`);
  }
};

module.exports = { listMessages, sendAutoReply, addLabel, fetchThreadInfo };
