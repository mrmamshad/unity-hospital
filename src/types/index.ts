export type UserRole = 'patient' | 'assistant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  experience_years: number;
  education: string;
  photo_url: string | null;
}

export interface TimeSlot {
  id: number;
  doctor_id: number;
  slot_date: string; // YYYY-MM-DD
  slot_time: string; // HH:mm:ss
  is_booked: boolean;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Appointment {
  id: number;
  patient_id: string;
  doctor_id: number;
  slot_id: number;
  reason: string | null;
  status: AppointmentStatus;
  created_at: string;
  doctor_name?: string;
  doctor?: Doctor;
  slot_date?: string;
  slot_time?: string;
  patient_name?: string;
  patient_email?: string;
}

export interface NotificationItem {
  id: number;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
