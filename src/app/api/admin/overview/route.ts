import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'assistant') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  // 1. Fetch appointments
  const { data: appointments, error: apptErr } = await supabase
    .from('medislot_appointments')
    .select(`
      id,
      status,
      reason,
      created_at,
      patient:medislot_users(id, name, email),
      doctor:medislot_doctors(id, name, specialization),
      time_slot:medislot_time_slots(id, slot_date, slot_time, is_booked)
    `)
    .order('created_at', { ascending: false });

  if (apptErr) {
    console.error('Error fetching appointments for admin overview:', apptErr);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }

  // 2. Fetch doctors
  const { data: doctors } = await supabase
    .from('medislot_doctors')
    .select('*')
    .order('name');

  // 3. Fetch time slots
  const { data: slots } = await supabase
    .from('medislot_time_slots')
    .select('id, doctor_id, slot_date, slot_time, is_booked')
    .order('slot_date');

  // 4. Fetch registered patients
  const { data: patients } = await supabase
    .from('medislot_users')
    .select('id, name, email, created_at')
    .eq('role', 'patient')
    .order('created_at', { ascending: false });

  const apptList = (appointments || []).map((row: any) => ({
    id: row.id,
    status: row.status,
    reason: row.reason,
    created_at: row.created_at,
    patient_id: row.patient?.id || '',
    patient_name: row.patient?.name || 'Unknown Patient',
    patient_email: row.patient?.email || '',
    doctor_id: row.doctor?.id || 0,
    doctor_name: row.doctor?.name || 'Unknown Doctor',
    specialization: row.doctor?.specialization || '',
    slot_id: row.time_slot?.id || 0,
    slot_date: row.time_slot?.slot_date || '',
    slot_time: row.time_slot?.slot_time || '',
    is_booked: row.time_slot?.is_booked || false,
  }));

  // Calculate KPIs
  const totalAppointments = apptList.length;
  const pendingCount = apptList.filter((a) => a.status === 'pending').length;
  const confirmedCount = apptList.filter((a) => a.status === 'confirmed').length;
  const cancelledCount = apptList.filter((a) => a.status === 'cancelled').length;

  const totalSlotsCount = (slots || []).length;
  const bookedSlotsCount = (slots || []).filter((s) => s.is_booked).length;
  const occupancyRate = totalSlotsCount > 0 ? Math.round((bookedSlotsCount / totalSlotsCount) * 100) : 0;

  // Doctor roster with capacity calculation
  const doctorsCapacity = (doctors || []).map((doc) => {
    const docSlots = (slots || []).filter((s) => s.doctor_id === doc.id);
    const booked = docSlots.filter((s) => s.is_booked).length;
    const total = docSlots.length;
    const rate = total > 0 ? Math.round((booked / total) * 100) : 0;
    return {
      ...doc,
      totalSlots: total,
      bookedSlots: booked,
      freeSlots: total - booked,
      occupancyRate: rate,
      slots: docSlots,
    };
  });

  // Trend data by date (for charts)
  const dateCounts: Record<string, { date: string; pending: number; confirmed: number; cancelled: number; total: number }> = {};
  apptList.forEach((a) => {
    const d = a.slot_date || a.created_at.split('T')[0];
    if (!dateCounts[d]) {
      dateCounts[d] = { date: d, pending: 0, confirmed: 0, cancelled: 0, total: 0 };
    }
    dateCounts[d].total += 1;
    if (a.status === 'pending') dateCounts[d].pending += 1;
    if (a.status === 'confirmed') dateCounts[d].confirmed += 1;
    if (a.status === 'cancelled') dateCounts[d].cancelled += 1;
  });

  const datesTrend = Object.values(dateCounts).sort((a, b) => a.date.localeCompare(b.date));

  // Specialty distribution
  const specCounts: Record<string, number> = {};
  apptList.forEach((a) => {
    const spec = a.specialization || 'General';
    specCounts[spec] = (specCounts[spec] || 0) + 1;
  });
  const specialtyDistribution = Object.entries(specCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Patient directory with booking counts
  const patientDirectory = (patients || []).map((p) => {
    const userAppts = apptList.filter((a) => a.patient_id === p.id || a.patient_email === p.email);
    return {
      id: p.id,
      name: p.name,
      email: p.email,
      registeredAt: p.created_at,
      totalBookings: userAppts.length,
      confirmedBookings: userAppts.filter((a) => a.status === 'confirmed').length,
      lastVisit: userAppts[0]?.slot_date || null,
    };
  });

  return NextResponse.json({
    kpis: {
      totalAppointments,
      pendingCount,
      confirmedCount,
      cancelledCount,
      totalSlotsCount,
      bookedSlotsCount,
      occupancyRate,
      activeDoctorsCount: (doctors || []).length,
      totalPatientsCount: (patients || []).length,
    },
    appointments: apptList,
    doctors: doctorsCapacity,
    analytics: {
      datesTrend,
      specialtyDistribution,
    },
    patients: patientDirectory,
  });
}
