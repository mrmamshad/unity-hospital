import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'patient') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { data: notifications, error } = await supabase
    .from('medislot_notifications')
    .select('id, message, is_read, created_at')
    .eq('user_id', session.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications.' }, { status: 500 });
  }

  const { count, error: countError } = await supabase
    .from('medislot_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.id)
    .eq('is_read', false);

  if (countError) {
    console.error('Error counting unread notifications:', countError);
  }

  return NextResponse.json({
    unread: count || 0,
    notifications: notifications || [],
  });
}
