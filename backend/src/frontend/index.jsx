import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { invoke } from '@forge/bridge';
import { Button, Text } from '@forge/ui';

export default function App() {
  const [status, setStatus] = useState('');

  const handleTest = async () => {
    setStatus('Processing...');
    const res = await invoke('simulate-voicemail-ai', {});
    if (res.success) {
      setStatus(`✅ Created ticket ${res.issueKey}`);
    } else {
      setStatus('❌ Failed: ' + JSON.stringify(res.error));
    }
  };

  return (
    <div style={{ padding: 20, minHeight: 500 }}>
      <Text>🎧 Test AI Voicemail → Jira Ticket</Text>
      <Button text="Run AI Test" onClick={handleTest}>Run AI Test</Button>
      <Text>{status}</Text>
    </div>
  );
}


// ... existing ReactDOM logic ...
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
