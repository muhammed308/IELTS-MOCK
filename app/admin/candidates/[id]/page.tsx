import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const isAdmin = (await cookies()).get('adminSession')?.value === 'true';
  if (!isAdmin) {
    redirect('/');
  }

  const { id } = await params;
  const db = supabaseServer();

  const { data: candidate } = await db
    .from('candidates')
    .select('id, name, age, first_seen_at')
    .eq('id', id)
    .maybeSingle();

  if (!candidate) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-800">Candidate not found</h1>
          <p className="mt-2 text-slate-500">The requested candidate does not exist.</p>
        </div>
      </main>
    );
  }

  const { data: attempt } = await db
    .from('test_attempts')
    .select('id, mock_test_id, current_section, submitted_at, started_at')
    .eq('candidate_id', id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!attempt) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Header candidate={candidate} />
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
            <p className="text-slate-500 text-lg">No test attempt found for this candidate.</p>
          </div>
        </div>
      </main>
    );
  }

  // --- Data fetching (same as before) ---
  const { data: rawAnswers } = await db
    .from('candidate_answers')
    .select('section, question_id, answer_text')
    .eq('attempt_id', attempt.id);

  const { data: listeningParts } = await db
    .from('listening_parts')
    .select('id')
    .eq('mock_test_id', attempt.mock_test_id);

  const { data: listeningQuestions } = await db
    .from('listening_questions')
    .select('id, order_index, question_text, correct_answer')
    .in('listening_part_id', (listeningParts ?? []).map((p) => p.id))
    .order('order_index');

  const { data: readingPassages } = await db
    .from('reading_passages')
    .select('id')
    .eq('mock_test_id', attempt.mock_test_id);

  const { data: readingQuestions } = await db
    .from('reading_questions')
    .select('id, order_index, question_text, correct_answer')
    .in('reading_passage_id', (readingPassages ?? []).map((p) => p.id))
    .order('order_index');

  const { data: writingResponses } = await db
    .from('writing_responses')
    .select('task_number, response_text, word_count')
    .eq('attempt_id', attempt.id)
    .order('task_number');

  const answerMap = new Map(
    (rawAnswers ?? []).map((a) => [a.question_id, a.answer_text])
  );

  // --- Score calculation ---
  function calcScore(questions: any[] | null) {
    if (!questions || questions.length === 0) return { correct: 0, total: 0, pct: 0 };
    let correct = 0;
    questions.forEach((q) => {
      const given = (answerMap.get(q.id) ?? '').trim().toLowerCase();
      const expected = (q.correct_answer ?? '').trim().toLowerCase();
      if (given && given === expected) correct++;
    });
    return {
      correct,
      total: questions.length,
      pct: Math.round((correct / questions.length) * 100),
    };
  }

  const listeningScore = calcScore(listeningQuestions);
  const readingScore = calcScore(readingQuestions);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <Header candidate={candidate} attempt={attempt} />

        {/* Summary Cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            label="Listening"
            value={`${listeningScore.correct}/${listeningScore.total}`}
            sub={`${listeningScore.pct}% correct`}
            accent="blue"
          />
          <StatCard
            label="Reading"
            value={`${readingScore.correct}/${readingScore.total}`}
            sub={`${readingScore.pct}% correct`}
            accent="emerald"
          />
          <StatCard
            label="Writing"
            value={(writingResponses ?? []).length.toString()}
            sub="tasks submitted"
            accent="violet"
          />
        </div>

        {/* Sections */}
        <div className="mt-12 space-y-12">
          <Section title="Listening" score={listeningScore}>
            <QuestionsTable questions={listeningQuestions} answerMap={answerMap} />
          </Section>

          <Section title="Reading" score={readingScore}>
            <QuestionsTable questions={readingQuestions} answerMap={answerMap} />
          </Section>

          <Section title="Writing">
            {(writingResponses ?? []).length === 0 ? (
              <EmptyState text="No writing responses found." />
            ) : (
              <div className="space-y-6">
                {(writingResponses ?? []).map((w) => (
                  <div
                    key={w.task_number}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-800">
                        Task {w.task_number}
                      </h3>
                      <span className="text-sm font-medium text-slate-500">
                        {w.word_count} words
                      </span>
                    </div>
                    <div className="px-6 py-5">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {w.response_text || (
                          <span className="text-slate-400 italic">(blank)</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </main>
  );
}

/* ---------- Small presentational components ---------- */

function Header({
  candidate,
  attempt,
}: {
  candidate: { name: string; id: string; age: number };
  attempt?: { current_section: string; submitted_at: string | null };
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
          Candidate Detail
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 tracking-tight">
          {candidate.name}
        </h1>
        <p className="mt-1.5 text-slate-500">
          ID: <span className="font-mono text-slate-700">{candidate.id}</span>
          <span className="mx-2">·</span>
          Age {candidate.age}
        </p>
      </div>

      {attempt && (
        <div className="flex items-center gap-3">
          <StatusBadge section={attempt.current_section} />
          <span className="text-sm text-slate-500">
            {attempt.submitted_at
              ? `Submitted ${new Date(attempt.submitted_at).toLocaleString()}`
              : 'In progress'}
          </span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ section }: { section: string }) {
  const isSubmitted = section === 'submitted' || section === 'completed';
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        isSubmitted
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
      }`}
    >
      {isSubmitted ? 'Submitted' : section}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: 'blue' | 'emerald' | 'violet';
}) {
  const colors = {
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-700',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-700',
    violet: 'from-violet-500/10 to-violet-500/5 text-violet-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight bg-gradient-to-br ${colors[accent]} bg-clip-text text-transparent`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500">{sub}</p>
    </div>
  );
}

function Section({
  title,
  score,
  children,
}: {
  title: string;
  score?: { correct: number; total: number; pct: number };
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {score && score.total > 0 && (
          <span className="text-sm font-medium text-slate-500">
            {score.correct}/{score.total} · {score.pct}%
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function QuestionsTable({
  questions,
  answerMap,
}: {
  questions: any[] | null;
  answerMap: Map<string, string>;
}) {
  if (!questions || questions.length === 0) {
    return <EmptyState text="No questions found for this section." />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-500 border-b border-slate-200">
            <th className="px-5 py-3.5 font-medium w-12">#</th>
            <th className="px-5 py-3.5 font-medium">Question</th>
            <th className="px-5 py-3.5 font-medium">Candidate</th>
            <th className="px-5 py-3.5 font-medium">Correct</th>
            <th className="px-5 py-3.5 font-medium w-20 text-center">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {questions.map((q) => {
            const given = answerMap.get(q.id) ?? '';
            const isCorrect =
              given.trim().toLowerCase() ===
              (q.correct_answer ?? '').trim().toLowerCase();
            const isBlank = !given.trim();

            return (
              <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">
                  {q.order_index}
                </td>
                <td className="px-5 py-3.5 text-slate-700 max-w-xs">
                  {q.question_text}
                </td>
                <td
                  className={`px-5 py-3.5 font-medium ${
                    isBlank
                      ? 'text-slate-400'
                      : isCorrect
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}
                >
                  {given || '—'}
                </td>
                <td className="px-5 py-3.5 text-slate-500">{q.correct_answer}</td>
                <td className="px-5 py-3.5 text-center">
                  {isBlank ? (
                    <span className="inline-block w-2 h-2 rounded-full bg-slate-300" />
                  ) : isCorrect ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      ✓
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                      ✕
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
      <p className="text-slate-500">{text}</p>
    </div>
  );
}