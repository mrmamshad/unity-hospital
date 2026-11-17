import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { Doctor } from '@/types';
import AdminPortal from '@/components/AdminPortal';

export const dynamic = 'force-dynamic';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; msg?: string; err?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login?portal=admin');
  }

  if (session.role !== 'assistant') {
    redirect('/patient');
  }

  const resolvedParams = await searchParams;
  const initialFilter = resolvedParams.status || 'pending';

  const { data: doctorsData } = await supabase
    .from('medislot_doctors')
    .select('*')
    .order('name');

  const doctors: Doctor[] = doctorsData || [];

  return <AdminPortal user={session} initialFilter={initialFilter} doctors={doctors} />;
}
