import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const isAdmin = (await cookies()).get('adminSession')?.value === 'true';
  if (!isAdmin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { listeningPartId, questions } = await req.json();

  if (typeof listeningPartId !== 'string' || !Array.isArray(questions)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const validTypes = ['multiple_choice', 'short_answer', 'matching'];

  const rows = [];
  for (const q of questions) {
    if (
      typeof q.orderIndex !== 'number' ||
      typeof q.questionType !== 'string' ||
      !validTypes.includes(q.questionType) ||
      typeof q.questionText !== 'string' ||
      !q.questionText.trim() ||
      typeof q.correctAnswer !== 'string' ||
      !q.correctAnswer.trim()
    ) {
      return NextResponse.json(
        { error: 'invalid_question', detail: q },
        { status: 400 }
      );
    }

    rows.push({
      listening_part_id: listeningPartId,
      order_index: q.orderIndex,
      question_type: q.questionType,
      question_text: q.questionText.trim(),
      options: q.options ?? null,
      correct_answer: q.correctAnswer.trim(),
    });
  }

  const db = supabaseServer();
  const { error: insertError } = await db.from('listening_questions').insert(rows);

  if (insertError) {
    console.error('BULK INSERT ERROR:', insertError);
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: rows.length });
}