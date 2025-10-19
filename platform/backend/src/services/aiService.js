import fetch from 'node-fetch';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Process voicemail transcript with AI and create Jira ticket
 * This integrates with the existing AI logic from the Forge app
 */
export async function processVoicemailWithAI(transcript, company) {
  try {
    console.log(`🤖 Processing voicemail with AI for company: ${company.name}`);

    // 1️⃣ Summarize the transcript
    const summary = await summarizeTranscript(transcript);
    console.log(`📝 Summary: ${summary}`);

    // 2️⃣ Pick the best request type based on company's configuration
    const chosenRequestType = await pickRequestType(summary, company.serviceDeskConfig.requestTypes);
    console.log(`🎯 Selected request type: ${chosenRequestType.name}`);

    // 3️⃣ Generate field values for the selected work type
    const workType = company.serviceDeskConfig.workTypes.find(wt => 
      wt.name.toLowerCase().includes(chosenRequestType.category.toLowerCase())
    ) || company.serviceDeskConfig.workTypes[0];

    const fieldValues = await generateFieldValues(transcript, summary, workType.fields);

    // 4️⃣ Determine priority based on content analysis
    const priority = await determinePriority(transcript, summary);

    // 5️⃣ Create the service request (mock for now)
    const issueKey = `SD-${Date.now()}`;
    
    console.log(`✅ Created ticket ${issueKey} with priority ${priority}`);

    return {
      issueKey,
      summary: `AI Voicemail: ${summary}`,
      description: transcript,
      requestType: chosenRequestType.name,
      priority,
      fieldValues,
      workType: workType.name
    };

  } catch (error) {
    console.error('❌ AI processing error:', error);
    throw error;
  }
}

/**
 * Summarize transcript using OpenAI
 * Reused from existing Forge app logic
 */
async function summarizeTranscript(transcript) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "Summarize customer voicemails for Jira ticket creation. Focus on the main issue and urgency." 
        },
        { 
          role: "user", 
          content: `Summarize this voicemail in one sentence:\n${transcript}` 
        }
      ],
      max_tokens: 80
    })
  });

  const data = await response.json();
  if (!response.ok) throw data;
  return data.choices[0].message.content.trim();
}

/**
 * Pick the best request type based on company's configuration
 * Adapted from existing Forge app logic
 */
async function pickRequestType(summary, requestTypes) {
  const prompt = `
You are an AI Jira router. Given a voicemail summary, pick the most appropriate Jira Service Request Type.

Available request types:
${requestTypes.map(t => `- ${t.name} (category: ${t.category})`).join('\n')}

Respond ONLY with valid JSON:
{"name": "<name>", "category": "<category>"}

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
    const selected = JSON.parse(data.choices[0].message.content);
    // Find the actual request type object
    return requestTypes.find(rt => rt.name === selected.name) || requestTypes[0];
  } catch {
    return requestTypes[0]; // fallback
  }
}

/**
 * Generate field values for work type fields
 * Adapted from existing Forge app logic
 */
async function generateFieldValues(transcript, summary, fields) {
  if (!fields || fields.length === 0) {
    return {};
  }

  const fieldsPrompt = fields.map(f => {
    return `- ${f.name} (type: ${f.type}, required: ${f.required})`;
  }).join("\n");

  const systemPrompt = `
You are an AI assistant that fills Jira Service Request fields based on a voicemail transcript.
Given the voicemail transcript and summary, provide intelligent values for ALL fields, both required and optional.
Output ONLY valid JSON in the format:
{"fieldName1": "value1", "fieldName2": "value2", ... }
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
    console.warn("⚠️ Failed to parse AI field values, using fallback", err);
    // fallback: fill basic fields
    const fallback = {};
    for (const f of fields) {
      if (f.name.toLowerCase().includes('summary')) {
        fallback[f.name] = `AI Voicemail: ${summary}`;
      } else if (f.name.toLowerCase().includes('description')) {
        fallback[f.name] = transcript;
      } else if (f.required) {
        fallback[f.name] = 'See description';
      }
    }
    return fallback;
  }
}

/**
 * Determine priority based on voicemail content
 * New functionality for intelligent priority assignment
 */
async function determinePriority(transcript, summary) {
  const urgencyKeywords = [
    'urgent', 'asap', 'critical', 'emergency', 'immediately', 
    'broken', 'down', 'not working', 'failed', 'error'
  ];

  const lowPriorityKeywords = [
    'question', 'inquiry', 'information', 'when', 'how', 
    'general', 'feedback', 'suggestion'
  ];

  const text = (transcript + ' ' + summary).toLowerCase();
  
  // Check for urgency indicators
  const hasUrgency = urgencyKeywords.some(keyword => text.includes(keyword));
  const hasLowPriority = lowPriorityKeywords.some(keyword => text.includes(keyword));

  if (hasUrgency) {
    return 'High';
  } else if (hasLowPriority) {
    return 'Low';
  } else {
    // Use AI to determine priority
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Determine the priority level for a customer service request. Respond with only one word: Low, Medium, or High."
          },
          {
            role: "user",
            content: `Voicemail: ${transcript}\nSummary: ${summary}`
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      }),
    });

    const data = await response.json();
    if (response.ok) {
      const priority = data.choices[0].message.content.trim();
      if (['Low', 'Medium', 'High'].includes(priority)) {
        return priority;
      }
    }
  }

  return 'Medium'; // default
}

/**
 * Transcribe audio file (for future use)
 * Reused from existing Forge app logic
 */
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
