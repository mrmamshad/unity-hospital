import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'assistant') {
    return NextResponse.json({ error: 'Not authorized. Assistant access only.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') || 'pending';

  let query = supabase
    .from('medislot_appointments')
    .select(`
      id,
      status,
      reason,
      created_at,
      patient:medislot_users(name, email),
      doctor:medislot_doctors(name, specialization),
      time_slot:medislot_time_slots(slot_date, slot_time)
    `)
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all' && ['pending', 'confirmed', 'cancelled'].includes(statusFilter)) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching assistant appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments.' }, { status: 500 });
  }

  const formatted = (data || []).map((row: any) => ({
    id: row.id,
    status: row.status,
    reason: row.reason,
    created_at: row.created_at,
    patient_name: row.patient?.name || 'Unknown Patient',
    patient_email: row.patient?.email || '',
    doctor_name: row.doctor?.name || 'Unknown Doctor',
    specialization: row.doctor?.specialization || '',
    slot_date: row.time_slot?.slot_date || '',
    slot_time: row.time_slot?.slot_time || '',
  }));

  return NextResponse.json(formatted);
}
