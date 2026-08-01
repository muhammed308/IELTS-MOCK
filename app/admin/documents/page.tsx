'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import Link from 'next/link';

// --- SVG Icons (Zero external dependencies) ---
const IconListening = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
const IconReading = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>;
const IconWriting = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IconUpload = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IconCheck = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconError = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconLoader = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;

type SectionId = 'listening' | 'reading' | 'writing';
type StatusType = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

interface SectionConfig {
  id: SectionId;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}

const SECTIONS: SectionConfig[] = [
  { id: 'listening', title: 'Listening', desc: 'Audio transcripts & test files', icon: <IconListening />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'reading', title: 'Reading', desc: 'Passages & comprehension questions', icon: <IconReading />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'writing', title: 'Writing', desc: 'Prompts & grading rubrics', icon: <IconWriting />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
];

interface StatusState {
  type: StatusType;
  message: string;
  fileName?: string;
}

export default function DocumentsPage() {
  const [statuses, setStatuses] = useState<Record<SectionId, StatusState>>({
    listening: { type: 'idle', message: '' },
    reading: { type: 'idle', message: '' },
    writing: { type: 'idle', message: '' },
  });
  const [activeDrag, setActiveDrag] = useState<SectionId | null>(null);

  // Refs to programmatically trigger file inputs and clear them
  const inputRefs = useRef<Record<SectionId, HTMLInputElement | null>>({
    listening: null,
    reading: null,
    writing: null,
  });

  async function handleFile(section: SectionId, file: File) {
    if (!file.name.endsWith('.html')) {
      setStatuses((s) => ({ ...s, [section]: { type: 'error', message: 'Invalid file type. Must be .html' } }));
      return;
    }

    setStatuses((s) => ({ ...s, [section]: { type: 'uploading', message: 'Processing document...' } }));

    try {
      const htmlContent = await file.text();
      const res = await fetch('/api/admin/test-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, htmlContent }),
      });

      if (res.ok) {
        setStatuses((s) => ({ ...s, [section]: { type: 'success', message: 'Successfully saved', fileName: file.name } }));
      } else {
        const data = await res.json();
        setStatuses((s) => ({ ...s, [section]: { type: 'error', message: data.error || 'Upload failed' } }));
      }
    } catch (e) {
      setStatuses((s) => ({ ...s, [section]: { type: 'error', message: 'Network error. Please try again.' } }));
    }
  }

  function handleDrop(e: React.DragEvent, section: SectionId) {
    e.preventDefault();
    setActiveDrag(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(section, file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>, section: SectionId) {
    const file = e.target.files?.[0];
    if (file) handleFile(section, file);
  }

  // Keyboard accessibility for the drop zone
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>, section: SectionId) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRefs.current[section]?.click();
    }
  }

  // Reset state and clear the hidden file input
  function handleRemove(section: SectionId) {
    setStatuses((s) => ({ ...s, [section]: { type: 'idle', message: '' } }));
    if (inputRefs.current[section]) {
      inputRefs.current[section].value = '';
    }
  }

  return (
    <main className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      {/* Top Nav */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold text-lg tracking-tight">IELTS</span>
            <span className="text-gray-400 text-sm">Admin</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/admin"
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Candidates
            </Link>
            <span className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg">
              Documents
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 md:p-10">

        {/* Dashboard Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Test Documents
          </h1>
          <p className="mt-2 text-gray-500 max-w-2xl leading-relaxed">
            Manage and upload HTML files for each exam section. Changes will reflect immediately in the live test environment.
          </p>
        </header>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECTIONS.map((section) => {
            const isDragging = activeDrag === section.id;
            const status = statuses[section.id];

            return (
              <div
                key={section.id}
                className={`
                  relative bg-white rounded-2xl border border-gray-200 p-6 
                  transition-all duration-200 ease-in-out
                  ${isDragging ? 'ring-2 ring-offset-2 ring-' + section.color.split('-')[1] + '-400 shadow-lg scale-[1.02]' : 'shadow-sm hover:shadow-md'}
                `}
              >
                {/* Card Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl ${section.bg} ${section.color} flex items-center justify-center`}>
                    {section.icon}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{section.title}</h2>
                    <p className="text-xs text-gray-500">{section.desc}</p>
                  </div>
                </div>

                {/* SUCCESS STATE: Transforms the dropzone into an action card */}
                {status.type === 'success' ? (
                  <div className="flex flex-col items-center justify-center p-6 bg-green-50/50 border-2 border-green-200 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                      <IconCheck />
                    </div>
                    <p className="font-semibold text-green-900 mb-1">Upload Successful</p>
                    <p className="text-sm text-green-700 mb-4 truncate max-w-full px-2 text-center">{status.fileName}</p>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleRemove(section.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                      >
                        <IconTrash /> Remove
                      </button>
                      <button
                        onClick={() => inputRefs.current[section.id]?.click()}
                        className="flex-1 px-3 py-2 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 border border-green-200 rounded-lg transition-colors"
                      >
                        Replace File
                      </button>
                    </div>
                  </div>
                ) : (
                  /* INTERACTIVE DROP ZONE */
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Upload ${section.title} HTML file`}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setActiveDrag(section.id); }}
                    onDragLeave={() => setActiveDrag(null)}
                    onDrop={(e) => handleDrop(e, section.id)}
                    onKeyDown={(e) => handleKeyDown(e, section.id)}
                    onClick={() => inputRefs.current[section.id]?.click()}
                    className={`
                      group relative flex flex-col items-center justify-center p-8 
                      border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
                      ${isDragging 
                        ? `${section.bg} ${section.border} scale-[1.02]` 
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors duration-200
                      ${isDragging ? `${section.bg} ${section.color}` : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500'}
                    `}>
                      <IconUpload />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {isDragging ? 'Drop file here' : 'Drag & drop or click to browse'}
                    </p>
                    <p className="text-xs text-gray-400">HTML files only (.html)</p>

                    <input
                      ref={(el) => { inputRefs.current[section.id] = el; }}
                      type="file"
                      accept=".html"
                      className="hidden"
                      onChange={(e) => handleFileInput(e, section.id)}
                    />
                  </div>
                )}

                {/* ERROR / UPLOADING BADGES (Only show when not in success state) */}
                {status.type !== 'success' && status.type !== 'idle' && (
                  <div className={`
                    mt-4 flex items-center gap-2 p-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200
                    ${status.type === 'uploading' ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-700 border border-red-100'}
                  `}>
                    {status.type === 'uploading' && <IconLoader />}
                    {status.type === 'error' && <IconError />}
                    <span className="truncate">{status.message}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}