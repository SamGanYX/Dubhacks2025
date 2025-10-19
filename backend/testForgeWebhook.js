// testForgeWebhook.js
import fetch from "node-fetch";

const FORGE_TRIGGER_URL = "https://9a4bfc04-8f72-4469-a4a9-ceee6ce926ec.hello.atlassian-dev.net/x1/coy3tySQKaC5v8AunRJNZzsIuOM";
const WEBHOOK_SECRET = "s3cureTw1l1o123!";

// Example test transcript
const testTranscript = `
Hi, I need urgent help, I lost my credit card!
Please assist ASAP.
`;

async function testWebhook() {
  console.log("Sending test transcript to Forge webhook...");
  console.log("Transcript:", testTranscript.trim());

  try {
    const res = await fetch(FORGE_TRIGGER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WEBHOOK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript: testTranscript }),
    });

    // Try parsing as JSON
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      console.log("\nForge webhook JSON response:", JSON.stringify(data, null, 2));
    } catch {
      console.log("\nForge webhook response (non-JSON):", text);
    }

    // HTTP status
    console.log("\nHTTP status code:", res.status);
  } catch (err) {
    console.error("Error calling webhook:", err);
  }
}

// Run the test
testWebhook();
