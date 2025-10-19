import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { summarizeTranscript, pickRequestType, generateFieldValues } from "./ai.js";
import db from './db.js';
import * as helpers from './helper.js';


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
  try {
    const event = req.body;

    console.log('📥 Incoming webhook payload:');
    console.log(JSON.stringify(event, null, 2));

    if (event.type !== 'post_call_transcription') {
      console.log('ℹ️ Received event of type:', event.type);
      return res.status(200).send('OK');
    }

    console.log('✅ Conversation ended!');

    // Extract simplified transcript: only role and message
    const simplifiedTranscript = event.data.transcript.map(turn => ({
      role: turn.role,
      message: turn.message
    }));

    console.log('Extracted transcript:', simplifiedTranscript);

    // Convert to string for Jira
    const transcriptString = simplifiedTranscript
      .map(t => `${t.role}: ${t.message}`)
      .join('\n');

    // --- Summarize transcript using AI ---
    let summary = '';
    try {
      summary = await summarizeTranscript(transcriptString);
    } catch {
      summary = transcriptString.slice(0, 1000);
    }

    // --- Fetch request types from Jira ---
    let requestTypes = [
      { name: "General Inquiry", id: "GEN" },
      { name: "Billing", id: "BILL" },
      { name: "Technical Support", id: "TECH" },
    ];

    if (JIRA_BASE && JIRA_EMAIL && JIRA_API_TOKEN) {
      try {
        const rtRes = await fetch(`${JIRA_BASE}/rest/servicedeskapi/servicedesk/${SERVICE_DESK_ID}/requesttype`, {
          headers: {
            Authorization: "Basic " + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64"),
            Accept: "application/json"
          }
        });
        if (rtRes.ok) {
          const rtJson = await rtRes.json();
          if (Array.isArray(rtJson.values)) {
            requestTypes = rtJson.values.map(v => ({ name: v.name, id: v.id }));
          }
        }
      } catch (err) { console.warn("⚠️ Error fetching Jira request types:", err); }
    }

    // --- Pick request type ---
    let chosenRequestType = requestTypes[0];
    try {
      const pick = await pickRequestType(summary, requestTypes);
      if (pick && pick.id) {
        chosenRequestType = requestTypes.find(r => String(r.id) === String(pick.id)) || chosenRequestType;
      }
    } catch (err) { console.warn("⚠️ pickRequestType failed, using fallback:", err); }

    // --- Generate field values ---
    const requestTypeFields = [
      { fieldId: "summary", name: "Summary", required: true, schema: { type: "string" } },
      { fieldId: "description", name: "Description", required: false, schema: { type: "string" } },
    ];

    let fieldValues = {};
    try {
      fieldValues = await generateFieldValues(transcriptString, summary, requestTypeFields);
    } catch {
      fieldValues = { summary: `AI Voicemail: ${summary}`, description: transcriptString };
    }

    const formattedFieldValues = {};
    for (const f of requestTypeFields) {
      const val = fieldValues[f.fieldId];
      formattedFieldValues[f.fieldId] = f.schema?.type === 'array' ? (Array.isArray(val) ? val : [val]) : val;
    }

    // --- Create Jira ticket ---
    let issueKey = null;
    if (JIRA_BASE && JIRA_EMAIL && JIRA_API_TOKEN) {
      const basicAuth = "Basic " + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
      try {
        const createRes = await fetch(`${JIRA_BASE}/rest/servicedeskapi/request`, {
          method: "POST",
          headers: {
            Authorization: basicAuth,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            serviceDeskId: SERVICE_DESK_ID,
            requestTypeId: chosenRequestType.id,
            requestFieldValues: formattedFieldValues
          })
        });

        const createJson = await createRes.json();
        if (createRes.ok && createJson.issueKey) issueKey = createJson.issueKey;
        console.log("📝 Jira create response:", createJson);
      } catch (err) { console.error("Failed creating Jira ticket:", err); }
    }

    // --- Save to SQLite ---
    if (issueKey) {
      const username = event.data.username || 'unknown_user';
      const row = await db.get('SELECT requests FROM user_requests WHERE username = ?', username);
      let requests = row ? JSON.parse(row.requests) : [];
      requests.push(issueKey);

      await db.run(
        `INSERT INTO user_requests (username, requests)
         VALUES (?, ?)
         ON CONFLICT(username) DO UPDATE SET requests=excluded.requests`,
        username,
        JSON.stringify(requests)
      );

      console.log(`📥 Added request ${issueKey} for user ${username}`);
    }

    res.status(200).json({ success: true, summary, fieldValues, requestType: chosenRequestType, issueKey });
  } catch (err) {
    console.error('🔥 Error in /elevenlabs-webhook:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
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

// --- Helper: fetch Jira issue details ---
async function fetchIssueDetails(issueKey) {
  const basicAuth = "Basic " + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
  try {
    const issueRes = await fetch(`${JIRA_BASE}/rest/api/3/issue/${issueKey}?fields=summary,status,assignee,description`, {
      headers: { Authorization: basicAuth, Accept: "application/json" },
    });
    if (!issueRes.ok) return { id: issueKey, error: "Failed to fetch issue" };
    const issueJson = await issueRes.json();

    const commentsRes = await fetch(`${JIRA_BASE}/rest/api/3/issue/${issueKey}/comment`, {
      headers: { Authorization: basicAuth, Accept: "application/json" },
    });
    const commentsJson = commentsRes.ok ? await commentsRes.json() : { comments: [] };

    return {
      id: issueKey,
      summary: issueJson.fields.summary,
      description: issueJson.fields.description,
      status: issueJson.fields.status?.name,
      assignee: issueJson.fields.assignee?.displayName || null,
      comments: commentsJson.comments || [],
    };
  } catch (err) {
    console.error(`Failed fetching issue ${issueKey}:`, err);
    return { id: issueKey, error: String(err) };
  }
}

// --- Get all requests for a user ---
app.get("/user-requests/:username", (req, res) => {
  const { username } = req.params;
  db.get("SELECT requests FROM user_requests WHERE username = ?", [username], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "User not found" });

    const requestIds = JSON.parse(row.requests);
    const fullRequestData = [];
    for (const issueKey of requestIds) {
      fullRequestData.push(await fetchIssueDetails(issueKey));
    }
    res.json({ username, requests: fullRequestData });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});