'use client';

import { useState } from 'react';

export default function AdminListeningPage() {
  const [partNumber, setPartNumber] = useState(1);
  const [audioUrl, setAudioUrl] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus('');

    const res = await fetch('/api/admin/listening-part', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partNumber, audioUrl }),
    });

    if (res.ok) {
      setStatus(`Part ${partNumber} saved.`);
      setAudioUrl('');
    } else {
      const data = await res.json();
      setStatus(`Error: ${data.error}`);
    }

    setSaving(false);
  }

  return (
    <main style={{ padding: '40px', maxWidth: '480px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
        Listening Parts
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label>
          Part Number
          <select
            value={partNumber}
            onChange={(e) => setPartNumber(Number(e.target.value))}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}
          >
            <option value={1}>Part 1</option>
            <option value={2}>Part 2</option>
            <option value={3}>Part 3</option>
            <option value={4}>Part 4</option>
          </select>
        </label>

        <label>
          Audio URL
          <input
            type="text"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="https://pub-....r2.dev/part1.mp3"
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}
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
          {saving ? 'Saving...' : 'Save Part'}
        </button>

        {status && <div>{status}</div>}
      </form>
    </main>
  );
}