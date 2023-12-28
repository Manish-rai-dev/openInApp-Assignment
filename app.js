
const express = require('express');
const app = express();
const { listMessages, sendAutoReply, addLabel, fetchThreadInfo } = require('./gmail');

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startApp();
});


app.get('/', async (req, res) => {
  try {
    const messages = await listMessages();
    for (const message of messages) {
      const messageId = message.id;
      if (await hasNoReplies(messageId) === false) {
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

// Function to check if a message has no replies
const hasNoReplies = async (messageId) => {
  // Fetching thread information and checking labels
  const threadId = (await listMessages(messageId))[0].threadId;
  const thread = await fetchThreadInfo(threadId);


  if (Array.isArray(thread.messages) && thread.messages.length > 0) {
    if (thread.messages[0].labelIds.includes('SENT') || thread.messages[0].labelIds.includes('Snooze')) {
      return true;
    }
  }

  return false;
}


const startApp = async () => {
  setInterval(async () => {
    await listMessages();
  }, 60000);
}
