import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const isAdmin = (await cookies()).get('adminSession')?.value === 'true';
  if (!isAdmin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { partNumber, audioUrl } = await req.json();

  if (
    typeof partNumber !== 'number' ||
    partNumber < 1 ||
    partNumber > 4 ||
    typeof audioUrl !== 'string' ||
    !audioUrl.trim()
  ) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const db = supabaseServer();

  const { data: activeTest, error: testError } = await db
    .from('mock_tests')
    .select('id')
    .eq('is_active', true)
    .single();

  if (testError || !activeTest) {
    return NextResponse.json({ error: 'no_active_test' }, { status: 500 });
  }

  const { error: upsertError } = await db.from('listening_parts').upsert(
    {
      mock_test_id: activeTest.id,
      part_number: partNumber,
      audio_url: audioUrl.trim(),
    },
    { onConflict: 'mock_test_id,part_number' }
  );

  if (upsertError) {
    console.error('LISTENING PART UPSERT ERROR:', upsertError);
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}