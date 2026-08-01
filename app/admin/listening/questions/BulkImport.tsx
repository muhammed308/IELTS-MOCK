'use client';

import { useState } from 'react';

interface Part {
  id: string;
  part_number: number;
}

export default function BulkImport({ parts }: { parts: Part[] }) {
  const [listeningPartId, setListeningPartId] = useState(parts[0]?.id ?? '');
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus('');

    let questions;
    try {
      questions = JSON.parse(jsonText);
    } catch {
      setStatus('Error: invalid JSON.');
      setSaving(false);
      return;
    }

    const res = await fetch('/api/admin/listening-questions-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listeningPartId, questions }),
    });

    const data = await res.json();

    if (res.ok) {
      setStatus(`Saved ${data.count} questions.`);
      setJsonText('');
    } else {
      setStatus(`Error: ${data.error} ${data.detail ? JSON.stringify(data.detail) : ''}`);
    }

    setSaving(false);
  }

  return (
    <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #ddd' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
        Bulk Import
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label>
          Part
          <select
            value={listeningPartId}
            onChange={(e) => setListeningPartId(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}
          >
            {parts.map((p) => (
              <option key={p.id} value={p.id}>
                Part {p.part_number}
              </option>
            ))}
          </select>
        </label>

        <label>
          Questions JSON
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
            placeholder={`[
  {
    "orderIndex": 1,
    "questionType": "short_answer",
    "questionText": "Current occupation:",
    "correctAnswer": "salesman"
  }
]`}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px',
              marginTop: '4px',
              fontFamily: 'monospace',
              fontSize: '13px',
            }}
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '10px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {saving ? 'Importing...' : 'Import Questions'}
        </button>

        {status && <div>{status}</div>}
      </form>
    </div>
  );
}