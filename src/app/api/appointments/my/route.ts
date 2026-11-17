import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'patient') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('medislot_appointments')
    .select(`
      id,
      status,
      reason,
      created_at,
      doctor:medislot_doctors(name, specialization),
      time_slot:medislot_time_slots(slot_date, slot_time)
    `)
    .eq('patient_id', session.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments.' }, { status: 500 });
  }

  // Format response matching original PHP fields
  const formatted = (data || []).map((row: any) => ({
    id: row.id,
    status: row.status,
    reason: row.reason,
    created_at: row.created_at,
    doctor_name: row.doctor?.name || 'Unknown',
    specialization: row.doctor?.specialization || '',
    slot_date: row.time_slot?.slot_date || '',
    slot_time: row.time_slot?.slot_time || '',
  }));

  return NextResponse.json(formatted);
}
