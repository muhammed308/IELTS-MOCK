import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';

// --- Helper Functions ---

function getInitials(name: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Submitted') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Submitted
      </span>
    );
  }
  if (status.startsWith('In progress')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
      No attempt
    </span>
  );
}

// --- Main Component ---

export default async function AdminPage() {
  const isAdmin = (await cookies()).get('adminSession')?.value === 'true';

  if (!isAdmin) {
    redirect('/');
  }

  const db = supabaseServer();

  const { data: candidates } = await db
    .from('candidates')
    .select('id, name, age, first_seen_at')
    .order('first_seen_at', { ascending: false });

  const { data: attempts } = await db
    .from('test_attempts')
    .select('candidate_id, current_section, submitted_at, started_at');

  const attemptMap = new Map(
    (attempts ?? []).map((a) => [a.candidate_id, a])
  );

  const candidateList = candidates ?? [];

  return (
    <main className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      {/* Top Nav */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold text-lg tracking-tight">IELTS</span>
            <span className="text-gray-400 text-sm">Admin</span>
          </div>
          <nav className="flex items-center gap-1">
            <span className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg">
              Candidates
            </span>
            <Link
              href="/admin/documents"
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Documents
            </Link>
          </nav>
        </div>
      </div>

      <div className="p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                Candidates
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and monitor test-taker progress and submissions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</span>
                <p className="text-xl font-bold text-gray-900">{candidateList.length}</p>
              </div>
            </div>
          </div>

          {/* Data Table Container */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {candidateList.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No candidates found</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                  There are currently no candidates in the system. They will appear here once they start their first session.
                </p>
              </div>
            ) : (
              // Populated Table
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Candidate</th>
                      <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Age</th>
                      <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">Status</th>
                      <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">First Seen</th>
                      <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {candidateList.map((c) => {
                      const attempt = attemptMap.get(c.id);
                      const status = !attempt
                        ? 'No attempt'
                        : attempt.submitted_at
                        ? 'Submitted'
                        : `In progress — ${attempt.current_section}`;

                      return (
                        <tr
                          key={c.id}
                          className="group transition-colors duration-150 hover:bg-red-50/40"
                        >
                          {/* Name & Avatar Column */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm">
                                {getInitials(c.name)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">
                                  {c.name ?? 'Unknown Candidate'}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">
                                  ID: {c.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Age Column */}
                          <td className="px-6 py-4 text-gray-600">
                            {c.age ?? <span className="text-gray-400 italic">Not provided</span>}
                          </td>

                          {/* Status Column */}
                          <td className="px-6 py-4">
                            <StatusBadge status={status} />
                          </td>

                          {/* Date Column */}
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                            {formatDate(c.first_seen_at)}
                          </td>

                          {/* Actions Column */}
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/admin/candidates/${c.id}`}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              View Details
                              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer */}
            {candidateList.length > 0 && (
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing <span className="font-medium text-gray-900">{candidateList.length}</span> candidates
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}