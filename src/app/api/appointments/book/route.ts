import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'patient') {
    return NextResponse.json({ error: 'Not authorized. Patient access only.' }, { status: 403 });
  }

  try {
    const { doctor_id, slot_id, reason } = await request.json();
    const doctorId = parseInt(doctor_id, 10);
    const slotId = parseInt(slot_id, 10);
    const cleanReason = (reason || '').trim().slice(0, 500);

    if (!doctorId || !slotId) {
      return NextResponse.json(
        { error: 'Please choose a doctor, a date and a free time slot first.' },
        { status: 400 }
      );
    }

    // Call atomic stored function
    const { data, error } = await supabase.rpc('medislot_book_appointment', {
      p_patient_id: session.id,
      p_doctor_id: doctorId,
      p_slot_id: slotId,
      p_reason: cleanReason || null,
    });

    if (error) {
      console.error('RPC medislot_book_appointment error:', error);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      appointment_id: data.appointment_id,
      slot_date: data.slot_date,
      doctor_id: data.doctor_id,
    });
  } catch (err: unknown) {
    console.error('Booking error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
