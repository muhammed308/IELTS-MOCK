import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const SECTION_ORDER = ['listening', 'reading', 'writing'];

export async function POST(req: NextRequest) {
  const candidateId = (await cookies()).get('candidateId')?.value;

  if (!candidateId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { section, answers } = await req.json();

  if (typeof section !== 'string' || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  if (!SECTION_ORDER.includes(section)) {
    return NextResponse.json({ error: 'invalid_section' }, { status: 400 });
  }

  const db = supabaseServer();

  const { data: attempt, error: attemptError } = await db
    .from('test_attempts')
    .select('id, mock_test_id, current_section')
    .eq('candidate_id', candidateId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'no_attempt' }, { status: 404 });
  }

  if (attempt.current_section !== section) {
    return NextResponse.json({ error: 'wrong_section' }, { status: 409 });
  }

  let questionIdMap: Record<number, string> = {};

  if (section === 'listening') {
    const { data: parts } = await db
      .from('listening_parts')
      .select('id')
      .eq('mock_test_id', attempt.mock_test_id);

    const { data: questions } = await db
      .from('listening_questions')
      .select('id, order_index')
      .in('listening_part_id', (parts ?? []).map((p) => p.id));

    for (const q of questions ?? []) {
      questionIdMap[q.order_index] = q.id;
    }
  } else if (section === 'reading') {
    const { data: passages } = await db
      .from('reading_passages')
      .select('id')
      .eq('mock_test_id', attempt.mock_test_id);

    const { data: questions } = await db
      .from('reading_questions')
      .select('id, order_index')
      .in('reading_passage_id', (passages ?? []).map((p) => p.id));

    for (const q of questions ?? []) {
      questionIdMap[q.order_index] = q.id;
    }
  }

  const rows = answers
    .filter((a: any) => typeof a.orderIndex === 'number' && questionIdMap[a.orderIndex])
    .map((a: any) => ({
      attempt_id: attempt.id,
      section,
      question_id: questionIdMap[a.orderIndex],
      answer_text: typeof a.answerText === 'string' ? a.answerText : '',
    }));

  if (rows.length > 0) {
    const { error: insertError } = await db
      .from('candidate_answers')
      .upsert(rows, { onConflict: 'attempt_id,question_id' });

    if (insertError) {
      console.error('ANSWER SAVE ERROR:', insertError);
      return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    }
  }

  const currentIndex = SECTION_ORDER.indexOf(section);
  const nextSection = SECTION_ORDER[currentIndex + 1] ?? 'submitted';

  const updateData: any = { current_section: nextSection };
  if (nextSection === 'submitted') {
    updateData.submitted_at = new Date().toISOString();
  }

  const { error: updateError } = await db
    .from('test_attempts')
    .update(updateData)
    .eq('id', attempt.id);

  if (updateError) {
    console.error('SECTION ADVANCE ERROR:', updateError);
    return NextResponse.json({ error: 'advance_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, nextSection });
}