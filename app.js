const express = require('express');
const app = express();
const { listMessages, sendAutoReply, addLabel, fetchThreadInfo } = require('./gmail');

const PORT = process.env.PORT || 3000;

// Use a separate function to start the server and initialize the application
const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startApp();
  });
};

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.get('/', async (req, res) => {
  try {
    const messages = await listMessages();

    for (const message of messages) {
      const messageId = message.id;

      if (!(await hasReplies(messageId))) {
        // Sending an auto-reply and adding a 'Snooze' label
        await sendAutoReply(messageId);
        await addLabel(messageId, 'Snooze');
      }
    }

    res.send('Processing completed.');
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Function to check if a message has replies
const hasReplies = async (messageId) => {
  // Fetching thread information and checking labels
  const threadId = (await listMessages(messageId))[0].threadId;
  const thread = await fetchThreadInfo(threadId);

  if (Array.isArray(thread.messages) && thread.messages.length > 0) {
    const firstMessage = thread.messages[0];

    if (firstMessage.labelIds.includes('SENT') || firstMessage.labelIds.includes('Snooze')) {
      return true;
    }
  }

  return false;
};

// Use setInterval within startApp function to periodically list messages
const startApp = async () => {
  setInterval(async () => {
    await listMessages();
  }, 60000);

  // Start the server after initializing the application
  startServer();
};
