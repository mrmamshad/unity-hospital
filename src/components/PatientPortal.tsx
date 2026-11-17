'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Baby,
  Brain,
  CalendarBlank,
  CalendarPlus,
  CaretRight,
  Check,
  CheckCircle,
  Clock,
  FirstAid,
  GraduationCap,
  Heart,
  MagnifyingGlass,
  MapPin,
  Medal,
  NotePencil,
  PaperPlaneTilt,
  Sparkle,
  Ticket,
  Tooth,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { AppShell, type NavSection } from '@/components/shell/app-shell';
import NotificationBell from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  MetaList,
  Panel,
  PersonAvatar,
  SectionHeading,
  SegmentedControl,
  StatusPill,
  type AppointmentStatus,
} from '@/components/portal/kit';
import { Doctor, SessionUser } from '@/types';
import { displayDoctor, fmtDate, fmtTime, initialsOf, shiftOf, todayLabel } from '@/lib/utils';

interface SlotData {
  id: number;
  slot_time: string;
  is_booked: boolean;
}

interface MyAppointmentItem {
  id: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  reason: string | null;
  created_at: string;
  doctor_name: string;
  specialization: string;
  slot_date: string;
  slot_time: string;
}

interface Props {
  user: SessionUser;
  doctors: Doctor[];
  specializations: string[];
  initialDoctorId: number;
  initialDate: string;
  doctorDatesMap: Record<number, string[]>;
}

const QUICK_REASONS = [
  'Routine Health Checkup',
  'Follow-up Consultation',
  'Flu / Fever Symptoms',
  'Chest / Cardiac Discomfort',
  'Prescription Refill',
  'Lab Report Review',
];

const SHIFT_ORDER: Array<'Morning' | 'Afternoon' | 'Evening'> = ['Morning', 'Afternoon', 'Evening'];

function specIcon(spec: string) {
  const s = spec.toLowerCase();
  if (s.includes('cardio')) return Heart;
  if (s.includes('pedia')) return Baby;
  if (s.includes('dent')) return Tooth;
  if (s.includes('neuro')) return Brain;
  return Sparkle;
}

function StepRail({ step }: { step: number }) {
  const steps = ['Specialist', 'Time', 'Confirm'];
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2 backdrop-blur">
      {steps.map((label, index) => {
        const number = index + 1;
        const done = step > number;
        const current = step === number;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`grid size-5 place-items-center rounded-full text-[10px] font-semibold ${
                done
                  ? 'bg-primary text-primary-foreground'
                  : current
                    ? 'border border-primary text-primary'
                    : 'border border-border text-muted-foreground'
              }`}
            >
              {done ? <Check className="size-3" weight="bold" /> : number}
            </span>
            <span
              className={`text-[10.5px] font-medium ${
                current ? 'text-foreground' : 'text-muted-foreground'
              } ${index === 2 ? 'hidden sm:inline' : ''}`}
            >
              {label}
            </span>
            {index < steps.length - 1 && <span className="h-px w-3 bg-border sm:w-5" />}
          </div>
        );
      })}
    </div>
  );
}

export default function PatientPortal({
  user,
  doctors,
  specializations,
  initialDoctorId,
  initialDate,
  doctorDatesMap,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'book' | 'my-appointments'>('book');
  const [greeting, setGreeting] = useState('Welcome back');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('All');

  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(initialDoctorId || (doctors[0]?.id ?? 0));
  const availableDates = doctorDatesMap[selectedDoctorId] || [];
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate && availableDates.includes(initialDate) ? initialDate : availableDates[0] || ''
  );
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [myAppointments, setMyAppointments] = useState<MyAppointmentItem[]>([]);
  const [myAppointmentsLoading, setMyAppointmentsLoading] = useState(false);
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [viewingApptModal, setViewingApptModal] = useState<MyAppointmentItem | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening');
  }, []);

  useEffect(() => {
    const dates = doctorDatesMap[selectedDoctorId] || [];
    if (!dates.includes(selectedDate)) {
      setSelectedDate(dates[0] || '');
    }
    setSelectedSlotId(null);
  }, [selectedDoctorId, doctorDatesMap]);

  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setSlots([]);
      return;
    }

    let isMounted = true;
    setSlotsLoading(true);
    setSelectedSlotId(null);

    fetch(`/api/slots?doctor_id=${selectedDoctorId}&date=${encodeURIComponent(selectedDate)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (Array.isArray(data)) {
            setSlots(data);
          } else {
            setSlots([]);
          }
          setSlotsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setSlots([]);
          setSlotsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDoctorId, selectedDate]);

  const loadMyAppointments = async () => {
    setMyAppointmentsLoading(true);
    try {
      const res = await fetch('/api/appointments/my');
      if (res.ok) {
        const data = await res.json();
        setMyAppointments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMyAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-appointments') {
      loadMyAppointments();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login?portal=patient');
    router.refresh();
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess(false);

    if (!selectedDoctorId || !selectedSlotId) {
      setBookingError('Please choose a specialist doctor, a date, and a free time slot.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: selectedDoctorId,
          slot_id: selectedSlotId,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || 'Failed to book appointment.');
        setSubmitting(false);
        return;
      }

      setBookingSuccess(true);
      setReason('');
      setSelectedSlotId(null);

      const slotsRes = await fetch(
        `/api/slots?doctor_id=${selectedDoctorId}&date=${encodeURIComponent(selectedDate)}`
      );
      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        if (Array.isArray(slotsData)) setSlots(slotsData);
      }
    } catch {
      setBookingError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchSpec = selectedSpec === 'All' || doc.specialization.toLowerCase() === selectedSpec.toLowerCase();
    const matchSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSpec && matchSearch;
  });

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const filteredAppointments = myAppointments.filter((item) => {
    if (appointmentFilter === 'all') return true;
    return item.status === appointmentFilter;
  });

  const slotsByShift = useMemo(() => {
    const groups: Record<'Morning' | 'Afternoon' | 'Evening', SlotData[]> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
    };
    slots.forEach((slot) => groups[shiftOf(slot.slot_time)].push(slot));
    return SHIFT_ORDER.map((shift) => ({ shift, slots: groups[shift] })).filter((g) => g.slots.length > 0);
  }, [slots]);

  const navigation: NavSection[] = [
    {
      label: 'My care',
      items: [
        { id: 'book', label: 'Book a visit', icon: CalendarPlus },
        { id: 'my-appointments', label: 'My visits', icon: Ticket },
      ],
    },
  ];

  const step = selectedSlotId ? 3 : selectedDoctorId ? 2 : 1;
  const firstName = user.name.split(' ')[0];

  return (
    <AppShell
      workspace="Patient portal"
      navigation={navigation}
      active={activeTab}
      onNavigate={(id) => {
        setActiveTab(id as 'book' | 'my-appointments');
        setBookingSuccess(false);
      }}
      user={{ name: user.name, role: 'Patient account', email: user.email }}
      onLogout={handleLogout}
      eyebrow={activeTab === 'book' ? 'Care / new request' : 'Care / history'}
      title={activeTab === 'book' ? 'Book a visit' : 'My visits'}
      description={
        activeTab === 'book'
          ? 'Choose a specialist and a time that suits you — the front desk confirms your request.'
          : 'Track the live status of every request you have sent to the hospital.'
      }
      actions={<NotificationBell />}
      statusLabel="Hospital online"
      searchLabel="Quick jump"
    >
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        {activeTab === 'book' && (
          <>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-5 py-6 shadow-card sm:px-7 sm:py-7">
              <div className="pointer-events-none absolute inset-0 canvas-grid opacity-60" />
              <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-accent blur-3xl" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    {todayLabel()} · Unity Hospital
                  </p>
                  <h2 className="mt-2 font-display text-[32px] leading-[1.05] text-foreground sm:text-[40px]">
                    Good {greeting}, {firstName}.
                  </h2>
                  <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                    Pick a specialist, choose one of the published slots and describe what brings you in. Your request
                    goes straight to the hospital front desk for confirmation.
                  </p>
                </div>
                <StepRail step={step} />
              </div>
            </div>

            {bookingSuccess && (
              <div className="flex flex-col gap-3 rounded-xl border border-status-confirmed/20 bg-status-confirmed-soft p-4 sm:flex-row sm:items-start">
                <CheckCircle className="mt-0.5 size-5 shrink-0 text-status-confirmed" weight="fill" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-status-confirmed">Appointment request submitted</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-status-confirmed/85">
                    Your request is <strong className="font-semibold">pending confirmation</strong> by the hospital
                    front desk. You will receive a notification here as soon as it is confirmed.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('my-appointments')}
                  className="h-8 shrink-0 border-status-confirmed/25 bg-transparent text-[11.5px] text-status-confirmed hover:bg-status-confirmed/10"
                >
                  View status
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            )}

            {bookingError && (
              <div className="flex items-start gap-3 rounded-xl border border-status-cancelled/20 bg-status-cancelled-soft p-4">
                <WarningCircle className="mt-0.5 size-5 shrink-0 text-status-cancelled" weight="fill" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-status-cancelled">Booking issue</p>
                  <p className="mt-0.5 text-[12px] text-status-cancelled/85">{bookingError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingError('')}
                  className="text-status-cancelled/70 hover:text-status-cancelled"
                  aria-label="Dismiss error"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* ——— Step 1: specialists ——— */}
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    Step 01
                  </p>
                  <h3 className="mt-1 font-display text-[22px] leading-tight">
                    Choose your specialist
                    <span className="ml-2 align-middle font-sans text-[11px] font-medium text-muted-foreground">
                      {filteredDoctors.length} available
                    </span>
                  </h3>
                </div>
                <div className="relative w-full sm:w-[260px]">
                  <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search specialists…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 border-border bg-card pl-8 text-[12px]"
                  />
                </div>
              </div>

              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedSpec('All')}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11.5px] font-medium transition-colors ${
                    selectedSpec === 'All'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  <Sparkle className="size-3.5" weight={selectedSpec === 'All' ? 'fill' : 'regular'} />
                  All specialists
                </button>
                {specializations.map((spec) => {
                  const Icon = specIcon(spec);
                  const active = selectedSpec === spec;
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setSelectedSpec(spec)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11.5px] font-medium transition-colors ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      }`}
                    >
                      <Icon className="size-3.5" weight={active ? 'fill' : 'regular'} />
                      {spec}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredDoctors.map((doc) => {
                  const isSelected = doc.id === selectedDoctorId;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        setSelectedDoctorId(doc.id);
                        setBookingSuccess(false);
                        setBookingError('');
                      }}
                      className={`group relative flex flex-col rounded-2xl border bg-card p-4 text-left transition-all ${
                        isSelected
                          ? 'border-primary/60 shadow-card ring-2 ring-primary/10'
                          : 'border-border hover:border-primary/25 hover:shadow-card'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3" weight="bold" />
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        {doc.photo_url ? (
                          <PersonAvatar name={doc.name} photoUrl={doc.photo_url} size="lg" />
                        ) : (
                          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-[13px] font-semibold text-secondary-foreground ring-1 ring-border">
                            {initialsOf(doc.name)}
                          </span>
                        )}
                        <div className="min-w-0 pr-6">
                          <h4 className="truncate font-display text-[18px] leading-tight text-foreground">
                            {displayDoctor(doc.name)}
                          </h4>
                          <span className="mt-1 inline-block rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                            {doc.specialization}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3.5 space-y-1.5 text-[11.5px] text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <Medal className="size-3.5 shrink-0 text-muted-foreground/70" />
                          {doc.experience_years} years clinical experience
                        </p>
                        <p className="flex items-start gap-1.5">
                          <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70" />
                          <span className="line-clamp-1">{doc.education}</span>
                        </p>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between border-t border-border/70 pt-2.5 text-[11px] font-medium">
                        <span className={isSelected ? 'text-primary' : 'text-muted-foreground'}>
                          {isSelected ? 'Selected specialist' : 'Select specialist'}
                        </span>
                        <CaretRight
                          className={`size-3.5 transition-transform group-hover:translate-x-0.5 ${
                            isSelected ? 'text-primary' : 'text-muted-foreground/50'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}

                {filteredDoctors.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/60 py-14">
                    <Empty className="border-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon" className="size-11 rounded-full">
                          <MagnifyingGlass className="size-5" weight="duotone" />
                        </EmptyMedia>
                        <EmptyTitle className="font-display text-[19px] font-normal">
                          No specialists match
                        </EmptyTitle>
                        <EmptyDescription className="text-[12px]">
                          Try another department or clear the search to see the full roster.
                        </EmptyDescription>
                      </EmptyHeader>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedSpec('All');
                        }}
                        className="h-8 text-[11.5px]"
                      >
                        Clear filters
                      </Button>
                    </Empty>
                  </div>
                )}
              </div>
            </section>

            {/* ——— Step 2 + 3: schedule and summary ——— */}
            {selectedDoctor && (
              <form onSubmit={handleBook} className="grid gap-5 lg:grid-cols-12">
                <Panel className="p-5 lg:col-span-8">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        Step 02 · Schedule
                      </p>
                      <h3 className="mt-1 font-display text-[22px] leading-tight">
                        {displayDoctor(selectedDoctor.name)}
                      </h3>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {selectedDoctor.specialization} · Department of Clinical Medicine
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-[10.5px] font-medium text-muted-foreground">
                      <MapPin className="size-3.5 text-primary" />
                      Unity Hospital, Main Campus
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                        Select a date
                      </p>
                      <span className="text-[10.5px] text-muted-foreground">{fmtDate(selectedDate)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
                      {availableDates.map((dateStr) => {
                        const isSelected = selectedDate === dateStr;
                        const d = new Date(dateStr + 'T00:00:00');
                        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                        const dayNum = d.toLocaleDateString('en-US', { day: 'numeric' });
                        const month = d.toLocaleDateString('en-US', { month: 'short' });
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => setSelectedDate(dateStr)}
                            className={`flex flex-col items-center gap-0.5 rounded-xl border px-1 py-2.5 transition-all ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground shadow-card'
                                : 'border-border bg-muted/30 text-foreground hover:border-primary/30 hover:bg-card'
                            }`}
                          >
                            <span
                              className={`text-[9px] font-semibold tracking-[0.1em] uppercase ${
                                isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}
                            >
                              {dayName}
                            </span>
                            <span className="font-display text-[20px] leading-none tabular">{dayNum}</span>
                            <span
                              className={`text-[9px] ${
                                isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}
                            >
                              {month}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                        Available slots
                      </p>
                      <div className="flex items-center gap-3 text-[10.5px]">
                        <span className="flex items-center gap-1.5 font-medium text-status-confirmed">
                          <span className="size-1.5 rounded-full bg-status-confirmed" /> Free
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-muted-foreground/40" /> Booked
                        </span>
                      </div>
                    </div>

                    {slotsLoading ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="h-[52px] animate-pulse rounded-xl bg-muted/60" />
                        ))}
                      </div>
                    ) : slotsByShift.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
                        <Clock className="mx-auto size-5 text-muted-foreground/50" weight="duotone" />
                        <p className="mt-2 text-[12px] font-medium">No slots published for this date</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Try another date from the strip above.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {slotsByShift.map(({ shift, slots: shiftSlots }) => {
                          const free = shiftSlots.filter((s) => !s.is_booked).length;
                          return (
                            <div key={shift}>
                              <div className="mb-1.5 flex items-center gap-2">
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                  {shift}
                                </p>
                                <span className="h-px flex-1 bg-border/70" />
                                <span className="font-mono text-[9.5px] text-muted-foreground tabular">
                                  {free} open
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                {shiftSlots.map((slot) => {
                                  const isSelected = selectedSlotId === slot.id;
                                  if (slot.is_booked) {
                                    return (
                                      <button
                                        key={slot.id}
                                        type="button"
                                        disabled
                                        className="flex cursor-not-allowed flex-col items-center gap-0.5 rounded-xl border border-border/60 bg-muted/40 px-2 py-2 text-muted-foreground/50"
                                      >
                                        <span className="font-mono text-[11.5px] tabular line-through">
                                          {fmtTime(slot.slot_time)}
                                        </span>
                                        <span className="text-[8.5px] font-semibold tracking-wider uppercase">
                                          Booked
                                        </span>
                                      </button>
                                    );
                                  }
                                  return (
                                    <button
                                      key={slot.id}
                                      type="button"
                                      onClick={() => setSelectedSlotId(slot.id)}
                                      className={`flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2 transition-all ${
                                        isSelected
                                          ? 'border-primary bg-primary text-primary-foreground shadow-card'
                                          : 'border-border bg-muted/30 text-foreground hover:border-primary/40 hover:bg-card'
                                      }`}
                                    >
                                      <span className="font-mono text-[11.5px] font-medium tabular">
                                        {fmtTime(slot.slot_time)}
                                      </span>
                                      <span
                                        className={`text-[8.5px] font-semibold tracking-wider uppercase ${
                                          isSelected ? 'text-primary-foreground/70' : 'text-status-confirmed'
                                        }`}
                                      >
                                        {isSelected ? 'Selected' : 'Free'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-border pt-5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="visit-reason"
                        className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase"
                      >
                        Reason for consultation
                      </label>
                      <span className="font-mono text-[10px] text-muted-foreground/70 tabular">
                        {reason.length}/500
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {QUICK_REASONS.map((preset) => {
                        const active = reason === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setReason(preset)}
                            className={`rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition-colors ${
                              active
                                ? 'border-primary/30 bg-accent text-accent-foreground'
                                : 'border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground'
                            }`}
                          >
                            {active && <Check className="mr-1 inline size-2.5" weight="bold" />}
                            {preset}
                          </button>
                        );
                      })}
                    </div>

                    <div className="relative mt-2.5">
                      <NotePencil className="pointer-events-none absolute left-3 top-3 size-3.5 text-muted-foreground/60" />
                      <Textarea
                        id="visit-reason"
                        rows={3}
                        maxLength={500}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Describe your symptoms or the purpose of this visit…"
                        className="min-h-[84px] resize-none border-border bg-muted/25 py-2.5 pl-9 text-[12px]"
                      />
                    </div>
                  </div>
                </Panel>

                <div className="lg:col-span-4">
                  <Panel className="p-5 lg:sticky lg:top-[104px]">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        Request summary
                      </p>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Draft
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                      <PersonAvatar name={selectedDoctor.name} photoUrl={selectedDoctor.photo_url} size="lg" />
                      <div className="min-w-0">
                        <p className="truncate font-display text-[17px] leading-tight">
                          {displayDoctor(selectedDoctor.name)}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-muted-foreground">{selectedDoctor.specialization}</p>
                      </div>
                    </div>

                    <MetaList
                      className="mt-3"
                      items={[
                        { label: 'Date', value: selectedDate ? fmtDate(selectedDate) : 'Not selected' },
                        {
                          label: 'Time',
                          value: selectedSlot ? fmtTime(selectedSlot.slot_time) : 'Not selected',
                        },
                        { label: 'Location', value: 'Main campus · Wing B' },
                        {
                          label: 'Status',
                          value: <span className="text-status-pending">Awaiting review</span>,
                        },
                      ]}
                    />

                    <div className="mt-4 rounded-xl border border-dashed border-border p-3">
                      <p className="text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                        Your note
                      </p>
                      <p className="mt-1 line-clamp-3 text-[11.5px] leading-relaxed text-foreground/80">
                        {reason || 'No reason added yet — you can add one before submitting.'}
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting || !selectedSlotId}
                      className="mt-4 h-10 w-full gap-2 bg-primary text-[12.5px] font-semibold hover:bg-primary/90"
                    >
                      {submitting ? (
                        <>
                          <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                          Submitting request…
                        </>
                      ) : (
                        <>
                          <PaperPlaneTilt className="size-4" weight="fill" />
                          Confirm appointment request
                        </>
                      )}
                    </Button>

                    <p className="mt-2.5 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted-foreground">
                      <FirstAid className="mt-0.5 size-3 shrink-0" />
                      Your request is sent to the front desk. The slot is not locked until they confirm it.
                    </p>
                  </Panel>
                </div>
              </form>
            )}
          </>
        )}

        {activeTab === 'my-appointments' && (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Consultation history"
              title="Your visits"
              description="Live status and history of every appointment request you have sent."
              actions={
                <SegmentedControl
                  value={appointmentFilter}
                  onChange={setAppointmentFilter}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                />
              }
            />

            <Panel className="overflow-hidden">
              {myAppointmentsLoading ? (
                <div className="space-y-3 p-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/60" />
                  ))}
                </div>
              ) : filteredAppointments.length === 0 ? (
                <Empty className="border-0 py-16">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="size-12 rounded-full">
                      <CalendarBlank className="size-6" weight="duotone" />
                    </EmptyMedia>
                    <EmptyTitle className="font-display text-[20px] font-normal">No visits found</EmptyTitle>
                    <EmptyDescription className="text-[12px]">
                      {appointmentFilter === 'all'
                        ? "You haven't booked any doctor appointments yet."
                        : `You have no appointments marked "${appointmentFilter}".`}
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('book')}
                    className="h-8 gap-1.5 bg-primary text-[11.5px]"
                  >
                    <CalendarPlus className="size-3.5" />
                    Book an appointment
                  </Button>
                </Empty>
              ) : (
                <div className="divide-y divide-border/70">
                  {filteredAppointments.map((appt) => {
                    const accent =
                      appt.status === 'confirmed'
                        ? 'bg-status-confirmed'
                        : appt.status === 'cancelled'
                          ? 'bg-status-cancelled'
                          : 'bg-status-pending';
                    return (
                      <div
                        key={appt.id}
                        className="relative flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-full ${accent}`} />
                        <div className="flex items-start gap-3">
                          <PersonAvatar name={appt.doctor_name} size="lg" />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-[18px] leading-tight">
                                {displayDoctor(appt.doctor_name)}
                              </h3>
                              <StatusPill status={appt.status as AppointmentStatus} short />
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted-foreground">
                              <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                                {appt.specialization}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarBlank className="size-3" />
                                {fmtDate(appt.slot_date)}
                              </span>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="flex items-center gap-1 font-mono tabular">
                                <Clock className="size-3" />
                                {fmtTime(appt.slot_time)}
                              </span>
                            </div>
                            {appt.reason && (
                              <p className="mt-1.5 line-clamp-1 max-w-lg text-[11.5px] text-muted-foreground/85">
                                <span className="font-medium text-foreground/70">Reason:</span> {appt.reason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingApptModal(appt)}
                            className="h-8 gap-1.5 border-border text-[11.5px]"
                          >
                            <Ticket className="size-3.5" />
                            View slip
                          </Button>
                          <span className="text-[10px] text-muted-foreground">
                            Booked{' '}
                            {new Date(appt.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>
        )}
      </div>

      {/* ——— Appointment slip ——— */}
      <Dialog open={!!viewingApptModal} onOpenChange={(open) => !open && setViewingApptModal(null)}>
        <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-[430px]">
          {viewingApptModal && (
            <>
              <DialogTitle className="sr-only">Unity Hospital appointment slip</DialogTitle>
              <DialogDescription className="sr-only">
                Appointment details for {displayDoctor(viewingApptModal.doctor_name)}
              </DialogDescription>

              <div className="relative overflow-hidden bg-primary px-5 py-4 text-primary-foreground">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.16)_1px,transparent_0)] bg-[length:18px_18px] opacity-60" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="font-display text-[21px] leading-none">Unity Hospital</p>
                    <p className="mt-1 text-[9.5px] font-semibold tracking-[0.18em] uppercase opacity-70">
                      Appointment slip
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] opacity-70">TOKEN</p>
                    <p className="font-mono text-[13px] font-semibold tabular">
                      #APT-{String(viewingApptModal.id).padStart(4, '0')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                      Consultant
                    </p>
                    <p className="mt-0.5 font-display text-[21px] leading-tight">
                      {displayDoctor(viewingApptModal.doctor_name)}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">{viewingApptModal.specialization}</p>
                  </div>
                  <StatusPill status={viewingApptModal.status as AppointmentStatus} short />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Date</p>
                    <p className="mt-1 text-[12px] font-medium">{fmtDate(viewingApptModal.slot_date)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Time</p>
                    <p className="mt-1 font-mono text-[12px] font-semibold tabular">
                      {fmtTime(viewingApptModal.slot_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Venue</p>
                    <p className="mt-1 flex items-center gap-1 text-[11.5px]">
                      <MapPin className="size-3 text-primary" />
                      Main campus · Wing B
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      Requested
                    </p>
                    <p className="mt-1 text-[11.5px]">
                      {new Date(viewingApptModal.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-dashed border-border pt-3.5">
                  <p className="text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Reason / notes
                  </p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-foreground/80">
                    {viewingApptModal.reason || 'No reason provided for this visit.'}
                  </p>
                </div>

                <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-[10.5px] leading-relaxed text-muted-foreground">
                  {viewingApptModal.status === 'confirmed'
                    ? 'Your slot is confirmed and locked. Please arrive 10 minutes early with a valid ID.'
                    : viewingApptModal.status === 'cancelled'
                      ? 'This request was cancelled and the slot has been released.'
                      : 'The front desk is reviewing this request. You will be notified once it is confirmed.'}
                </p>
              </div>

              <div className="flex justify-end border-t border-border bg-muted/30 px-5 py-3">
                <Button
                  size="sm"
                  onClick={() => setViewingApptModal(null)}
                  className="h-8 bg-primary text-[11.5px]"
                >
                  Close slip
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
