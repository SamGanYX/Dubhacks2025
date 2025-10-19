import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { summarizeTranscript, pickRequestType, generateFieldValues } from "./ai.js";

dotenv.config();

const app = express();
// Need raw body for HMAC validation (if you add it back later)
app.use(bodyParser.json({ limit: '10mb' }));

const FORGE_TRIGGER_URL = process.env.FORGE_TRIGGER_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const JIRA_BASE = process.env.JIRA_BASE;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const SERVICE_DESK_ID = process.env.SERVICE_DESK_ID || "2";
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const ELEVEN_SUBAGENT_ID = process.env.ELEVEN_SUBAGENT_ID;

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

app.post("/create-subagent", express.json({ limit: "10mb" }), async (req, res) => {
  try {
    console.log("called /create-subagent (context update only)");

    const { transcript } = req.body;
    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "Missing or invalid transcript" });
    }

    // --- 1️⃣ Summarize transcript ---
    let summary = "";
    try {
      summary = await summarizeTranscript(transcript);
      console.log("🧾 Transcript summary:", summary);
    } catch (err) {
      console.warn("⚠️ summarizeTranscript failed, using raw transcript", err);
      summary = transcript.slice(0, 1000);
    }

    // --- 2️⃣ Determine request type ---
    let requestTypes = [
      { name: "General Inquiry", id: "GEN" },
      { name: "Billing", id: "BILL" },
      { name: "Technical Support", id: "TECH" },
    ];

    if (JIRA_BASE && JIRA_EMAIL && JIRA_API_TOKEN) {
      try {
        const rtRes = await fetch(
          `${JIRA_BASE}/rest/servicedeskapi/servicedesk/${SERVICE_DESK_ID}/requesttype`,
          {
            method: "GET",
            headers: {
              Authorization:
                "Basic " + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64"),
              Accept: "application/json",
            },
          }
        );
        if (rtRes.ok) {
          const rtJson = await rtRes.json();
          if (Array.isArray(rtJson.values)) {
            requestTypes = rtJson.values.map((v) => ({ name: v.name, id: v.id }));
          }
        }
      } catch (err) {
        console.warn("⚠️ Error fetching Jira request types:", err);
      }
    }

    let chosenRequestType = requestTypes[0];
    try {
      const pick = await pickRequestType(summary, requestTypes);
      if (pick && pick.id) {
        const found = requestTypes.find((r) => String(r.id) === String(pick.id));
        chosenRequestType = found || { name: pick.name || pick, id: pick.id || pick };
      }
    } catch (err) {
      console.warn("⚠️ pickRequestType failed, using fallback:", err);
    }

    // --- 3️⃣ Generate field values ---
    let fieldValues = {};
    const requestTypeFields = [
      { fieldId: "summary", name: "Summary", required: true },
      { fieldId: "description", name: "Description", required: false },
    ];

    try {
      fieldValues = await generateFieldValues(transcript, summary, requestTypeFields);
      console.log("🧠 Generated field values:", fieldValues);
    } catch (err) {
      console.warn("⚠️ generateFieldValues failed, fallback:", err);
      fieldValues = {
        summary: `AI Voicemail: ${summary}`,
        description: transcript,
      };
    }

    // --- 4️⃣ Return context to main agent ---
    return res.status(200).json({
      success: true,
      summary,
      fieldValues,
      requestType: chosenRequestType,
    });
  } catch (err) {
    console.error("🔥 Error in create-subagent endpoint:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});