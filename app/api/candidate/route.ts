import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { value, name, age } = await req.json();

    if (typeof value !== 'string' || value.trim().length === 0) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const trimmed = value.trim();

  if (trimmed === process.env.ADMIN_PASSPHRASE) {
  (await cookies()).set('adminSession', 'true', { httpOnly: true, path: '/' });
  return NextResponse.json({ redirect: '/admin' });
}
    if (!/^\d+$/.test(trimmed)) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const db = supabaseServer();
    const candidateId = trimmed;

    const { data: activeTest, error: testError } = await db
      .from('mock_tests')
      .select('id')
      .eq('is_active', true)
      .single();

    if (testError || !activeTest) {
      console.error('ACTIVE TEST ERROR:', testError);
      return NextResponse.json({ error: 'no_active_test' }, { status: 500 });
    }

    await db.from('candidates').upsert(
  { id: candidateId, name, age: Number(age) },
  { onConflict: 'id' }
);

    const { data: existingAttempt } = await db
      .from('test_attempts')
      .select('id, current_section')
      .eq('candidate_id', candidateId)
      .eq('mock_test_id', activeTest.id)
      .maybeSingle();

    if (existingAttempt) {
      (await cookies()).set('candidateId', candidateId, { httpOnly: true, path: '/' });
      return NextResponse.json({
        redirect: `/test/${existingAttempt.current_section}`,
        candidateId,
      });
    }

    const { error: insertError } = await db.from('test_attempts').insert({
      candidate_id: candidateId,
      mock_test_id: activeTest.id,
      current_section: 'listening',
      listening_started_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('INSERT ATTEMPT ERROR:', insertError);
      return NextResponse.json({ error: 'attempt_creation_failed' }, { status: 500 });
    }

    (await cookies()).set('candidateId', candidateId, { httpOnly: true, path: '/' });
    return NextResponse.json({ redirect: '/test/listening', candidateId });
  } catch (err) {
    console.error('CANDIDATE ROUTE CRASH:', err);
    return NextResponse.json({ error: 'server_crash' }, { status: 500 });
  }
}