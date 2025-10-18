import fetch from "node-fetch";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// --- 1️⃣ Transcribe MP3 ---
export async function transcribeMp3(mp3Url) {
  const audioResponse = await fetch(mp3Url);
  const buffer = await audioResponse.arrayBuffer();
  const blob = new Blob([buffer], { type: "audio/mp3" });

  const formData = new FormData();
  formData.append("model", "whisper-1");
  formData.append("file", blob, "voicemail.mp3");
  formData.append("language", "en");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) throw data;
  return data.text;
}

// --- 2️⃣ Summarize transcript ---
export async function summarizeTranscript(transcript) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize customer voicemails for Jira ticket creation." },
        { role: "user", content: `Summarize this voicemail in one sentence:\n${transcript}` }
      ],
      max_tokens: 80
    })
  });

  const data = await response.json();
  if (!response.ok) throw data;
  return data.choices[0].message.content.trim();
}

// --- 3️⃣ Pick request type ---
export async function pickRequestType(summary, requestTypes) {
  const prompt = `
You are an AI Jira router. Given a voicemail summary, pick the most appropriate Jira Service Request Type.

Available request types:
${requestTypes.map(t => `- ${t.name} (id: ${t.id})`).join('\n')}

Respond ONLY with valid JSON:
{"name": "<name>", "id": "<id>"}

Summary: "${summary}"
  `;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    }),
  });

  const data = await res.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return requestTypes[0]; // fallback
  }
}

// --- 4️⃣ Generate field values intelligently for ALL fields ---
export async function generateFieldValues(transcript, summary, requestTypeFields) {
  const fieldsPrompt = requestTypeFields.map(f => {
    return `- ${f.name} (id: ${f.fieldId}, required: ${f.required})`;
  }).join("\n");

  const systemPrompt = `
You are an AI assistant that fills Jira Service Request fields based on a voicemail transcript.
Given the voicemail transcript and summary, provide intelligent values for ALL fields, both required and optional.
Output ONLY valid JSON in the format:
{"fieldId1": "value1", "fieldId2": "value2", ... }
Do NOT leave any field as "N/A" or blank. Make each value meaningful based on the transcript.
`;

  const userPrompt = `
Voicemail transcript:
${transcript}

Summary:
${summary}

Fields to fill:
${fieldsPrompt}
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.warn("⚠️ Failed to parse AI field values, falling back to summary/description", err);
    // fallback: fill summary & description only
    const fallback = {};
    for (const f of requestTypeFields) {
      if (f.fieldId === "summary") fallback.summary = `AI Voicemail: ${summary}`;
      else if (f.fieldId === "description") fallback.description = transcript;
    }
    return fallback;
  }
}
