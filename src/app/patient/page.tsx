import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { Doctor } from '@/types';
import PatientPortal from '@/components/PatientPortal';

export const dynamic = 'force-dynamic';

export default async function PatientPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string; date?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (session.role === 'assistant') {
    redirect('/assistant');
  }

  const resolvedParams = await searchParams;

  // Fetch doctors
  const { data: doctorsData } = await supabase
    .from('medislot_doctors')
    .select('*')
    .order('name');

  const doctors: Doctor[] = doctorsData || [];

  // Distinct specializations
  const specializations = Array.from(new Set(doctors.map((d) => d.specialization))).sort();

  // Slot dates grouped by doctor_id
  const { data: slotRows } = await supabase
    .from('medislot_time_slots')
    .select('doctor_id, slot_date')
    .order('slot_date');

  const doctorDatesMap: Record<number, string[]> = {};
  (slotRows || []).forEach((row) => {
    if (!doctorDatesMap[row.doctor_id]) {
      doctorDatesMap[row.doctor_id] = [];
    }
    if (!doctorDatesMap[row.doctor_id].includes(row.slot_date)) {
      doctorDatesMap[row.doctor_id].push(row.slot_date);
    }
  });

  const initialDoctorId = resolvedParams.doctor ? parseInt(resolvedParams.doctor, 10) : (doctors[0]?.id || 0);
  const initialDate = resolvedParams.date || (doctorDatesMap[initialDoctorId]?.[0] || '');

  return (
    <PatientPortal
      user={session}
      doctors={doctors}
      specializations={specializations}
      initialDoctorId={initialDoctorId}
      initialDate={initialDate}
      doctorDatesMap={doctorDatesMap}
    />
  );
}
