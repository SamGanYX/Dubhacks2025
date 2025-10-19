import fetch from "node-fetch";
import { summarizeTranscript, pickRequestType, generateFieldValues } from "./ai.js";
// import { JIRA_BASE, JIRA_EMAIL, JIRA_API_TOKEN, SERVICE_DESK_ID } from "./config.js";

import dotenv from 'dotenv';
dotenv.config();


const JIRA_BASE = process.env.JIRA_BASE;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const SERVICE_DESK_ID = process.env.SERVICE_DESK_ID || "2";

export function extractTranscript(event) {
  if (!event?.data?.transcript || !Array.isArray(event.data.transcript) || event.data.transcript.length === 0) {
    throw new Error("Empty or invalid transcript");
  }
  const simplified = event.data.transcript.map(t => ({ role: t.role, message: t.message }));
  const transcriptString = simplified.map(t => `${t.role}: ${t.message}`).join("\n");
  return { simplified, transcriptString };
}

export async function summarizeTranscriptSafe(transcriptString) {
  try {
    return await summarizeTranscript(transcriptString);
  } catch {
    console.warn("⚠️ Summarization failed, using raw transcript");
    return transcriptString.slice(0, 1000);
  }
}

export async function pickRequestTypeSafe(summary, requestTypes) {
  try {
    const pick = await pickRequestType(summary, requestTypes);
    if (pick?.id) return requestTypes.find(r => String(r.id) === String(pick.id)) || requestTypes[0];
  } catch (err) {
    console.warn("⚠️ pickRequestType failed, using fallback:", err);
  }
  return requestTypes[0];
}

export async function generateFieldValuesSafe(transcriptString, summary, requestTypeFields) {
  try {
    const values = await generateFieldValues(transcriptString, summary, requestTypeFields);
    const formatted = {};
    for (const f of requestTypeFields) {
      const val = values[f.fieldId];
      formatted[f.fieldId] = f.schema?.type === "array" ? (Array.isArray(val) ? val : [val]) : val;
    }
    return formatted;
  } catch {
    return {
      summary: `AI Voicemail: ${summary}`,
      description: transcriptString
    };
  }
}

export async function createOrUpdateJiraTicket(issueKey, fieldValues, chosenType, username, db) {
  if (!JIRA_BASE || !JIRA_EMAIL || !JIRA_API_TOKEN) return null;

  const basicAuth = "Basic " + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");

  if (issueKey) {
    // --- Update existing Jira ticket ---
    try {
      // Only use fields that exist in Jira Core API
      await fetch(`${JIRA_BASE}/rest/api/3/issue/${issueKey}`, {
        method: "PUT",
        headers: {
          Authorization: basicAuth,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            summary: fieldValues.summary,
            description: fieldValues.description
          }
        })
      });
      console.log(`📝 Jira updated: ${issueKey}`);
    } catch (err) {
      console.error(`Failed updating Jira ticket ${issueKey}:`, err);
    }
  } else {
    try {
      const createRes = await fetch(`${JIRA_BASE}/rest/servicedeskapi/request`, {
        method: "POST",
        headers: { Authorization: basicAuth, "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceDeskId: SERVICE_DESK_ID,
          requestTypeId: chosenType.id,
          requestFieldValues: fieldValues
        })
      });
      const createJson = await createRes.json();
      if (createRes.ok && createJson.issueKey) issueKey = createJson.issueKey;
      console.log("📝 Jira created:", createJson);
    } catch (err) {
      console.error("Failed creating Jira ticket:", err);
    }
  }

  if (issueKey) {
    const row = await db.get('SELECT requests FROM user_requests WHERE username = ?', username);
    let requests = row ? JSON.parse(row.requests) : [];
    if (!requests.includes(issueKey)) requests.push(issueKey);
    await db.run(
      `INSERT INTO user_requests (username, requests)
       VALUES (?, ?)
       ON CONFLICT(username) DO UPDATE SET requests=excluded.requests`,
      username,
      JSON.stringify(requests)
    );
    console.log(`📥 Recorded request ${issueKey} for user ${username}`);
  }

  return issueKey;
}
