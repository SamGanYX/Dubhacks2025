import Resolver from "@forge/resolver";
import api, { route } from "@forge/api";
import { summarizeTranscript, pickRequestType, generateFieldValues } from "./ai.js";

const resolver = new Resolver();

// --- Core function for handling a transcript ---
export async function handleTranscript(transcript) {
  try {
    console.log("🔹 Received transcript:", transcript);

    // 1️⃣ Summarize
    const summary = await summarizeTranscript(transcript);

    // 2️⃣ Get Jira Service Desk request types
    const serviceDeskId = "2";
    const requestResponse = await api.asApp().requestJira(
      route`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype`
    );
    const requestData = await requestResponse.json();
    if (!requestResponse.ok) throw requestData;

    // 3️⃣ Pick best request type
    const chosen = await pickRequestType(summary, requestData.values);
    // 4️⃣ Get request type fields
    const fieldsResponse = await api.asApp().requestJira(
      route`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype/${chosen.id}/field`
    );
    const fieldsData = await fieldsResponse.json();
    if (!fieldsResponse.ok) throw fieldsData;
    console.log("chosen");

    // 5️⃣ Generate request field values
    const requestFieldValues = await generateFieldValues(transcript, summary, fieldsData.requestTypeFields);

    // 6️⃣ Create Jira ticket
    const createResponse = await api.asApp().requestJira(
      route`/rest/servicedeskapi/request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceDeskId,
          requestTypeId: chosen.id,
          requestFieldValues,
        }),
      }
    );
    const createData = await createResponse.json();
    if (!createResponse.ok) throw createData;

    return { success: true, issueKey: createData.issueKey };
  } catch (err) {
    console.error("❌ handleTranscript error:", err);
    return { success: false, error: err.message || err };
  }
}

// --- Resolver definition ---
resolver.define("simulate-voicemail-ai", async ({ transcript }) => {
  return await handleTranscript(transcript);
});

// --- Webhook ---
export const webhook = async (event) => {
  try {
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      body = Object.fromEntries(new URLSearchParams(event.body || ""));
    }

    const authHeader = event.headers?.authorization?.[0];
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return { statusCode: 401, body: `Unauthorized ${process.env.WEBHOOK_SECRET}` };
    }

    const transcript = body.transcript;
    if (!transcript) return { statusCode: 400, body: "Missing transcript" };

    // Call the core function directly instead of resolver.call()
    const result = await handleTranscript(transcript);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};

export const handler = resolver.getDefinitions();
