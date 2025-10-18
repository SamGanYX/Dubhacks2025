import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
// Need raw body for HMAC validation (if you add it back later)
app.use(bodyParser.json({ limit: '10mb' }));

const FORGE_TRIGGER_URL = process.env.FORGE_TRIGGER_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.post('/elevenlabs-webhook', async (req, res) => {
  const event = req.body;

  console.log('📥 Incoming webhook payload:');
  console.log(JSON.stringify(event, null, 2));

  if (event.type === 'post_call_transcription') {
    console.log('✅ Conversation ended!');

    // Extract simplified transcript: only role and message
    const simplifiedTranscript = event.data.transcript.map(turn => ({
      role: turn.role,
      message: turn.message
    }));

    console.log('Extracted transcript:', simplifiedTranscript);

    // Convert to string to send
    const transcriptString = simplifiedTranscript
      .map(t => `${t.role}: ${t.message}`)
      .join('\n');

    try {
      const resForge = await fetch(FORGE_TRIGGER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WEBHOOK_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcriptString }),
      });

      const text = await resForge.text();
      try {
        const data = JSON.parse(text);
        console.log('Forge webhook response:', data);
      } catch {
        console.log('Forge webhook response (non-JSON):', text);
      }
    } catch (err) {
      console.error('Error calling Forge webhook:', err);
    }
  } else {
    console.log('ℹ️ Received event of type:', event.type);
  }

  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
