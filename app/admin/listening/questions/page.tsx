import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import QuestionsForm from './QuestionsForm';
import BulkImport from './BulkImport';

export default async function ListeningQuestionsPage() {
  const isAdmin = (await cookies()).get('adminSession')?.value === 'true';
  if (!isAdmin) {
    redirect('/');
  }

  const db = supabaseServer();

  const { data: parts } = await db
    .from('listening_parts')
    .select('id, part_number')
    .order('part_number', { ascending: true });

  return (
    <main style={{ padding: '40px', maxWidth: '600px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
        Listening Questions
      </h1>
      <QuestionsForm parts={parts ?? []} />
<BulkImport parts={parts ?? []} />
    </main>
  );
}