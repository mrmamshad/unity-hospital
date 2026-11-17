import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'assistant') {
    return NextResponse.json({ error: 'Not authorized. Assistant access only.' }, { status: 403 });
  }

  try {
    const { appointment_id } = await request.json();
    const appointmentId = parseInt(appointment_id, 10);

    if (!appointmentId) {
      return NextResponse.json({ error: 'Invalid appointment ID.' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('medislot_cancel_appointment', {
      p_appointment_id: appointmentId,
    });

    if (error) {
      console.error('Cancel RPC error:', error);
      return NextResponse.json({ error: 'Failed to cancel appointment.' }, { status: 500 });
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled. The slot is free again and the patient has been notified.',
    });
  } catch (err: unknown) {
    console.error('Cancel error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
