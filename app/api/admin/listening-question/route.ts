import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const isAdmin = (await cookies()).get('adminSession')?.value === 'true';
  if (!isAdmin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { listeningPartId, orderIndex, questionType, questionText, options, correctAnswer } =
    await req.json();

  if (
    typeof listeningPartId !== 'string' ||
    typeof orderIndex !== 'number' ||
    typeof questionType !== 'string' ||
    typeof questionText !== 'string' ||
    !questionText.trim() ||
    typeof correctAnswer !== 'string' ||
    !correctAnswer.trim()
  ) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const validTypes = ['multiple_choice', 'short_answer', 'matching'];
  if (!validTypes.includes(questionType)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }

  const db = supabaseServer();

  const { error: insertError } = await db.from('listening_questions').insert({
    listening_part_id: listeningPartId,
    order_index: orderIndex,
    question_type: questionType,
    question_text: questionText.trim(),
    options: options ?? null,
    correct_answer: correctAnswer.trim(),
  });

  if (insertError) {
    console.error('LISTENING QUESTION INSERT ERROR:', insertError);
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}