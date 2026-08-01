'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EntryScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim() || !age.trim() || !value.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setSubmitting(true);

    const res = await fetch('/api/candidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, name, age }),
    });
    const data = await res.json();

    if (data.redirect) {
      router.push(data.redirect);
    } else {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white font-sans">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-8 w-full max-w-xs px-6"
      >
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-red-600 text-5xl font-bold tracking-wide">
            IELTS
          </div>
          <div className="text-blue-600 text-sm font-medium tracking-wide">
          Mock
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3 w-full">
          <input
            autoFocus
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 text-center text-gray-800 text-[15px] border border-gray-300 rounded-lg
                       placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500
                       transition-colors"
          />

          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-2.5 text-center text-gray-800 text-[15px] border border-gray-300 rounded-lg
                       placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500
                       transition-colors
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <input
            type="text"
            placeholder="ID"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-2.5 text-center text-gray-800 text-[15px] border border-gray-300 rounded-lg
                       placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500
                       transition-colors"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-600 text-[13px] -mt-2 text-center">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 text-[15px] font-medium text-white bg-blue-600 rounded-lg
                     hover:bg-blue-700 active:bg-blue-800
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition-colors"
        >
          {submitting ? 'Please wait…' : 'Enter'}
        </button>
      </form>
    </main>
  );
}