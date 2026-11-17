import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const doctorId = parseInt(searchParams.get('doctor_id') || '0', 10);
  const date = searchParams.get('date') || '';

  if (doctorId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'doctor_id and a valid date (YYYY-MM-DD) are required.' },
      { status: 400 }
    );
  }

  const { data: slots, error } = await supabase
    .from('medislot_time_slots')
    .select('id, slot_time, is_booked')
    .eq('doctor_id', doctorId)
    .eq('slot_date', date)
    .order('slot_time', { ascending: true });

  if (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots.' }, { status: 500 });
  }

  return NextResponse.json(slots || []);
}
