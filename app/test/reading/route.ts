import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  const candidateId = (await cookies()).get('candidateId')?.value;

  if (!candidateId) {
    return NextResponse.redirect(new URL('/', 'http://localhost:3000'));
  }

  const db = supabaseServer();

  const { data: attempt } = await db
    .from('test_attempts')
    .select('current_section, mock_test_id')
    .eq('candidate_id', candidateId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!attempt) {
    return NextResponse.redirect(new URL('/', 'http://localhost:3000'));
  }

  if (attempt.current_section !== 'reading') {
    return NextResponse.redirect(
      new URL(`/test/${attempt.current_section}`, 'http://localhost:3000')
    );
  }

  const { data: doc } = await db
    .from('test_documents')
    .select('html_content')
    .eq('mock_test_id', attempt.mock_test_id)
    .eq('section', 'reading')
    .maybeSingle();

  if (!doc) {
    return new NextResponse('No reading document uploaded yet.', { status: 404 });
  }

  return new NextResponse(doc.html_content, {
    headers: { 'Content-Type': 'text/html' },
  });
}