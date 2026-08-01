import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(req: NextRequest) {
  const candidateId = (await cookies()).get('candidateId')?.value;

  if (!candidateId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { task1Text, task2Text } = await req.json();

  if (typeof task1Text !== 'string' || typeof task2Text !== 'string') {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const db = supabaseServer();

  const { data: attempt, error: attemptError } = await db
    .from('test_attempts')
    .select('id, current_section')
    .eq('candidate_id', candidateId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'no_attempt' }, { status: 404 });
  }

  if (attempt.current_section !== 'writing') {
    return NextResponse.json({ error: 'wrong_section' }, { status: 409 });
  }

  const rows = [
    { attempt_id: attempt.id, task_number: 1, response_text: task1Text, word_count: countWords(task1Text) },
    { attempt_id: attempt.id, task_number: 2, response_text: task2Text, word_count: countWords(task2Text) },
  ];

  const { error: insertError } = await db
    .from('writing_responses')
    .upsert(rows, { onConflict: 'attempt_id,task_number' });

  if (insertError) {
    console.error('WRITING SAVE ERROR:', insertError);
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  const { error: updateError } = await db
    .from('test_attempts')
    .update({ current_section: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', attempt.id);

  if (updateError) {
    console.error('SECTION ADVANCE ERROR:', updateError);
    return NextResponse.json({ error: 'advance_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}