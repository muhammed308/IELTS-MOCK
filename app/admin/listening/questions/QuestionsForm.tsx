'use client';

import { useState } from 'react';

interface Part {
  id: string;
  part_number: number;
}

export default function QuestionsForm({ parts }: { parts: Part[] }) {
  const [listeningPartId, setListeningPartId] = useState(parts[0]?.id ?? '');
  const [orderIndex, setOrderIndex] = useState(1);
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [questionText, setQuestionText] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus('');

    let options: string[] | null = null;
    if (questionType === 'multiple_choice' || questionType === 'matching') {
      options = optionsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    }

    const res = await fetch('/api/admin/listening-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listeningPartId,
        orderIndex,
        questionType,
        questionText,
        options,
        correctAnswer,
      }),
    });

    if (res.ok) {
      setStatus(`Question ${orderIndex} saved.`);
      setQuestionText('');
      setOptionsText('');
      setCorrectAnswer('');
      setOrderIndex((n) => n + 1);
    } else {
      const data = await res.json();
      setStatus(`Error: ${data.error}`);
    }

    setSaving(false);
  }

  return (
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
        Order Index
        <input
          type="number"
          value={orderIndex}
          onChange={(e) => setOrderIndex(Number(e.target.value))}
          style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}
        />
      </label>

      <label>
        Question Type
        <select
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="short_answer">Short Answer</option>
          <option value="matching">Matching</option>
        </select>
      </label>

      <label>
        Question Text
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}
        />
      </label>

      {(questionType === 'multiple_choice' || questionType === 'matching') && (
        <label>
          Options (one per line)
          <textarea
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            rows={4}
            placeholder={
              questionType === 'multiple_choice'
                ? 'A. First option\nB. Second option\nC. Third option'
                : 'Item 1 = Match A\nItem 2 = Match B'
            }
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </label>
      )}

      <label>
        Correct Answer
        <input
          type="text"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
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
        {saving ? 'Saving...' : 'Save Question'}
      </button>

      {status && <div>{status}</div>}
    </form>
  );
}