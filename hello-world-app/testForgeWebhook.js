import fetch from "node-fetch";

const FORGE_TRIGGER_URL = "https://9a4bfc04-8f72-4469-a4a9-ceee6ce926ec.hello.atlassian-dev.net/x1/5BAyTYohjBiWZYj-CNRjuNg3u70";
const WEBHOOK_SECRET = "s3cureTw1l1o123!";

// Example transcript
const testTranscript = `
Hi, I need Urgent help your service lost me $1000!
`;

async function testWebhook() {
  try {
    const res = await fetch(FORGE_TRIGGER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WEBHOOK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript: testTranscript }),
    });

    // Parse only if JSON
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      console.log("Forge webhook response:", data);
    } catch {
      console.log("Forge webhook response (non-JSON):", text);
    }
  } catch (err) {
    console.error("Error calling webhook:", err);
  }
}

testWebhook();
