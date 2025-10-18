import Resolver from "@forge/resolver";
import api, { route } from "@forge/api";
import { transcribeMp3, summarizeTranscript, pickRequestType, generateFieldValues } from "./ai.js";

const resolver = new Resolver();

resolver.define("simulate-voicemail-ai", async () => {
  console.error("❌ Error:", err);
  return { success: false, error: err };
});

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
      console.log("❌ Authorization failed!", authHeader);
      return { statusCode: 401, body: "Unauthorized" };
    }

    const transcript = body.transcript;
    if (!transcript) return { statusCode: 400, body: "Missing transcript" };

    const result = await handleTranscript(transcript);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error("❌ Webtrigger error:", err);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};

export async function handleTranscript(transcript) {
  try {
    // 1️⃣ Summarize
    const summary = await summarizeTranscript(transcript);

    // 2️⃣ Get request types
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
      route`/rest/servicedeskapi/requesttype/${chosen.id}/field`
    );
    const fieldsData = await fieldsResponse.json();
    if (!fieldsResponse.ok) throw fieldsData;

    // 5️⃣ Generate field values intelligently for all fields
    const requestFieldValues = await generateFieldValues(transcript, summary, fieldsData.requestTypeFields);

    // 6️⃣ Create Jira ticket
    const createResponse = await api.asApp().requestJira(route`/rest/servicedeskapi/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceDeskId,
        requestTypeId: chosen.id,
        requestFieldValues,
      }),
    });

    const data = await createResponse.json();
    if (!createResponse.ok) throw data;

    return { success: true, issueKey: data.issueKey };
  } catch (err) {
    console.error("❌ handleTranscript error:", err);
    return { success: false, error: err.message || err };
  }
}

export const handler = resolver.getDefinitions();
