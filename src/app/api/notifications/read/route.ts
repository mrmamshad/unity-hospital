import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== 'patient') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { error } = await supabase
    .from('medislot_notifications')
    .update({ is_read: true })
    .eq('user_id', session.id)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ error: 'Failed to update notifications.' }, { status: 500 });
  }

  return NextResponse.json({ unread: 0 });
}
