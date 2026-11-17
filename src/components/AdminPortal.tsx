'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  CalendarBlank,
  CalendarDots,
  CaretRight,
  ChartLineUp,
  Check,
  CheckCircle,
  Clock,
  ListChecks,
  MagnifyingGlass,
  Pulse,
  Stethoscope,
  TrendUp,
  UsersThree,
  WarningCircle,
  X,
  XCircle,
} from '@phosphor-icons/react';
import { AppShell, type NavSection } from '@/components/shell/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  LivePill,
  MetaList,
  Panel,
  PersonAvatar,
  Ring,
  SectionHeading,
  SegmentedControl,
  StatCard,
  StatusPill,
  type AppointmentStatus,
} from '@/components/portal/kit';
import { Doctor, SessionUser } from '@/types';
import { displayDoctor, fmtDate, fmtDateShort, fmtTime } from '@/lib/utils';

interface AdminAppointment {
  id: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  reason: string | null;
  created_at: string;
  patient_id?: string;
  patient_name: string;
  patient_email: string;
  doctor_id?: number;
  doctor_name: string;
  specialization: string;
  slot_id?: number;
  slot_date: string;
  slot_time: string;
  is_booked?: boolean;
}

interface DoctorWithCapacity extends Doctor {
  totalSlots: number;
  bookedSlots: number;
  freeSlots: number;
  occupancyRate: number;
  slots?: { id: number; slot_date: string; slot_time: string; is_booked: boolean }[];
}

interface PatientRecord {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  totalBookings: number;
  confirmedBookings: number;
  lastVisit: string | null;
}

interface Props {
  user: SessionUser;
  initialFilter?: string;
  doctors: Doctor[];
}

type Tab = 'queue' | 'roster' | 'analytics' | 'patients';

function timeAgo(iso: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '';
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TAB_META: Record<Tab, { eyebrow: string; title: string; description: string }> = {
  queue: {
    eyebrow: 'Triage / live queue',
    title: 'Appointment triage',
    description: 'Review incoming requests, confirm a slot or decline with a reason — patients are notified instantly.',
  },
  roster: {
    eyebrow: 'Staffing / shifts',
    title: 'Doctor shifts & capacity',
    description: 'Consultation capacity across every specialist for the current seven-day cycle.',
  },
  patients: {
    eyebrow: 'Records / directory',
    title: 'Patient directory',
    description: 'Registered accounts, booking history and last confirmed visit.',
  },
  analytics: {
    eyebrow: 'Insight / capacity',
    title: 'Capacity & demand',
    description: 'Where appointment demand is concentrating this cycle and how much of the hospital is booked.',
  },
};

function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string;
  labelFormatter?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[150px] rounded-xl border border-border bg-popover px-3 py-2.5 shadow-float">
      <p className="mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {labelFormatter && label ? labelFormatter(label) : label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <span className="size-1.5 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-mono text-[11.5px] font-semibold text-foreground tabular">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPortal({ user, initialFilter = 'pending' }: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('queue');

  const [statusFilter, setStatusFilter] = useState<'pending' | 'all' | 'confirmed' | 'cancelled'>(
    ['pending', 'all', 'confirmed', 'cancelled'].includes(initialFilter)
      ? (initialFilter as 'pending' | 'all' | 'confirmed' | 'cancelled')
      : 'pending'
  );

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [doctorRoster, setDoctorRoster] = useState<DoctorWithCapacity[]>([]);
  const [patientDirectory, setPatientDirectory] = useState<PatientRecord[]>([]);
  const [analyticsData, setAnalyticsData] = useState<{
    datesTrend: { date: string; pending: number; confirmed: number; cancelled: number; total: number }[];
    specialtyDistribution: { name: string; count: number }[];
  }>({ datesTrend: [], specialtyDistribution: [] });

  const [kpis, setKpis] = useState({
    totalAppointments: 0,
    pendingCount: 0,
    confirmedCount: 0,
    cancelledCount: 0,
    totalSlotsCount: 0,
    bookedSlotsCount: 0,
    occupancyRate: 0,
    activeDoctorsCount: 0,
    totalPatientsCount: 0,
  });

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [flashMsg, setFlashMsg] = useState<string>('');
  const [flashErr, setFlashErr] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  const [activeDrawerAppt, setActiveDrawerAppt] = useState<AdminAppointment | null>(null);
  const [inspectingDoctor, setInspectingDoctor] = useState<DoctorWithCapacity | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
        setDoctorRoster(data.doctors || []);
        setPatientDirectory(data.patients || []);
        setAnalyticsData(data.analytics || { datesTrend: [], specialtyDistribution: [] });
        if (data.kpis) setKpis(data.kpis);
      }
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login?portal=admin');
    router.refresh();
  };

  const handleConfirm = async (appointmentId: number) => {
    setFlashMsg('');
    setFlashErr('');
    setActionLoadingId(appointmentId);

    try {
      const res = await fetch('/api/assistant/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointmentId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFlashErr(data.error || 'Failed to confirm appointment.');
      } else {
        setFlashMsg(data.message || 'Appointment confirmed. Patient notified via SMS & notification.');
        await fetchOverview();
        if (activeDrawerAppt && activeDrawerAppt.id === appointmentId) {
          setActiveDrawerAppt((prev) => (prev ? { ...prev, status: 'confirmed' } : null));
        }
      }
    } catch {
      setFlashErr('An unexpected server error occurred.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    setFlashMsg('');
    setFlashErr('');
    setActionLoadingId(appointmentId);

    try {
      const res = await fetch('/api/assistant/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointmentId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFlashErr(data.error || 'Failed to cancel appointment.');
      } else {
        setFlashMsg(data.message || 'Appointment cancelled. Slot unlocked and patient notified.');
        await fetchOverview();
        if (activeDrawerAppt && activeDrawerAppt.id === appointmentId) {
          setActiveDrawerAppt((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
        }
      }
    } catch {
      setFlashErr('An unexpected server error occurred.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredQueue = useMemo(() => {
    return appointments.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (selectedDoctorFilter !== 'all' && item.doctor_name !== selectedDoctorFilter) return false;
      if (selectedDateFilter !== 'all' && item.slot_date !== selectedDateFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.patient_name.toLowerCase().includes(q) ||
          item.patient_email.toLowerCase().includes(q) ||
          item.doctor_name.toLowerCase().includes(q) ||
          item.specialization.toLowerCase().includes(q) ||
          (item.reason && item.reason.toLowerCase().includes(q)) ||
          String(item.id).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [appointments, statusFilter, selectedDoctorFilter, selectedDateFilter, searchQuery]);

  const uniqueDates = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => {
      if (a.slot_date) set.add(a.slot_date);
    });
    return Array.from(set).sort();
  }, [appointments]);

  const oldestPending = useMemo(
    () =>
      [...appointments]
        .filter((a) => a.status === 'pending')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0] || null,
    [appointments]
  );

  const peakSpecialty = useMemo(
    () =>
      [...analyticsData.specialtyDistribution].sort((a, b) => b.count - a.count)[0] || null,
    [analyticsData.specialtyDistribution]
  );

  const busiestDate = useMemo(
    () => [...analyticsData.datesTrend].sort((a, b) => b.total - a.total)[0] || null,
    [analyticsData.datesTrend]
  );

  const groupedSlots = useMemo(() => {
    const groups = new Map<string, { id: number; slot_date: string; slot_time: string; is_booked: boolean }[]>();
    (inspectingDoctor?.slots || []).forEach((slot) => {
      const list = groups.get(slot.slot_date) || [];
      list.push(slot);
      groups.set(slot.slot_date, list);
    });
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, list]) => [date, [...list].sort((a, b) => a.slot_time.localeCompare(b.slot_time))] as const);
  }, [inspectingDoctor]);

  const navigation: NavSection[] = useMemo(
    () => [
      {
        label: 'Clinical operations',
        items: [
          { id: 'queue', label: 'Triage queue', icon: ListChecks, count: kpis.pendingCount },
          { id: 'roster', label: 'Doctor shifts', icon: CalendarDots, hint: `${kpis.activeDoctorsCount}` },
          { id: 'patients', label: 'Patient directory', icon: UsersThree, hint: `${patientDirectory.length}` },
        ],
      },
      {
        label: 'Intelligence',
        items: [{ id: 'analytics', label: 'Capacity & demand', icon: ChartLineUp }],
      },
    ],
    [kpis.pendingCount, kpis.activeDoctorsCount, patientDirectory.length]
  );

  const meta = TAB_META[activeTab];
  const occupancyLabel =
    kpis.bookedSlotsCount > 0 && kpis.occupancyRate === 0 ? '<1%' : `${kpis.occupancyRate}%`;
  const hasActiveFilters =
    selectedDoctorFilter !== 'all' || selectedDateFilter !== 'all' || searchQuery.trim().length > 0;

  const clearFilters = () => {
    setSelectedDoctorFilter('all');
    setSelectedDateFilter('all');
    setSearchQuery('');
  };

  return (
    <AppShell
      workspace="Hospital console"
      navigation={navigation}
      active={activeTab}
      onNavigate={(id) => setActiveTab(id as Tab)}
      user={{ name: user.name, role: 'Hospital administrator', email: user.email }}
      onLogout={handleLogout}
      eyebrow={meta.eyebrow}
      title={meta.title}
      description={meta.description}
      onRefresh={fetchOverview}
      refreshing={loading}
      statusLabel="Live database"
      actions={
        <LivePill label={loading ? 'Syncing' : 'Synced'} className="hidden sm:inline-flex" />
      }
    >
      <div className="mx-auto w-full max-w-[1320px] space-y-6">
        {(flashMsg || flashErr) && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-xl border p-3.5 text-[12.5px] ${
              flashErr
                ? 'border-status-cancelled/20 bg-status-cancelled-soft text-status-cancelled'
                : 'border-status-confirmed/20 bg-status-confirmed-soft text-status-confirmed'
            }`}
          >
            {flashErr ? (
              <WarningCircle className="mt-0.5 size-4 shrink-0" weight="fill" />
            ) : (
              <CheckCircle className="mt-0.5 size-4 shrink-0" weight="fill" />
            )}
            <span className="flex-1 leading-relaxed">{flashErr || flashMsg}</span>
            <button
              type="button"
              onClick={() => {
                setFlashMsg('');
                setFlashErr('');
              }}
              className="grid size-5 place-items-center rounded opacity-70 transition-opacity hover:opacity-100"
              aria-label="Dismiss message"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {activeTab === 'queue' && (
          <>
            {/* ——— Overview band ——— */}
            <div className="grid gap-4 lg:grid-cols-12">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('pending');
                  setActiveTab('queue');
                }}
                className="group relative overflow-hidden rounded-2xl bg-white p-5 text-left text-black shadow-float lg:col-span-5"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.12)_1px,transparent_0)] bg-[length:20px_20px] opacity-50" />
                <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-black/5 blur-3xl" />

                <div className="relative flex items-center gap-2">
                  <HourglassIcon />
                  <span className="text-[10px] font-semibold tracking-[0.16em] uppercase opacity-80">
                    Awaiting triage
                  </span>
                </div>

                <div className="relative mt-3 flex items-end gap-3">
                  {loading && appointments.length === 0 ? (
                    <span className="mb-1 inline-block h-[54px] w-16 animate-pulse rounded-lg bg-black/10" />
                  ) : (
                    <span className="font-display text-[64px] leading-[0.9] tabular">{kpis.pendingCount}</span>
                  )}
                  <span className="mb-1.5 text-[12px] leading-tight opacity-75">
                    appointment
                    <br />
                    {kpis.pendingCount === 1 ? 'request' : 'requests'}
                  </span>
                </div>

                <div className="relative mt-5 flex items-center justify-between border-t border-black/10 pt-3">
                  <span className="text-[11px] opacity-75">
                    {oldestPending
                      ? `Oldest · #APT-${String(oldestPending.id).padStart(4, '0')} · ${timeAgo(oldestPending.created_at)}`
                      : 'Queue clear — nothing waiting'}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold">
                    Review
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>

              <div className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
                <StatCard
                  label="Confirmed"
                  value={
                    loading && appointments.length === 0 ? (
                      <span className="inline-block h-8 w-10 animate-pulse rounded bg-muted" />
                    ) : (
                      kpis.confirmedCount
                    )
                  }
                  icon={CheckCircle}
                  tone="confirmed"
                  note={`${kpis.totalAppointments} all-time requests`}
                />
                <StatCard
                  label="Occupancy"
                  value={
                    loading && appointments.length === 0 ? (
                      <span className="inline-block h-8 w-14 animate-pulse rounded bg-muted" />
                    ) : (
                      occupancyLabel
                    )
                  }
                  icon={TrendUp}
                  tone="clay"
                  note={`${kpis.bookedSlotsCount} of ${kpis.totalSlotsCount} slots locked`}
                >
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${Math.max(kpis.occupancyRate, 2)}%` }}
                    />
                  </div>
                </StatCard>
                <StatCard
                  label="Specialists"
                  value={
                    loading && appointments.length === 0 ? (
                      <span className="inline-block h-8 w-8 animate-pulse rounded bg-muted" />
                    ) : (
                      kpis.activeDoctorsCount
                    )
                  }
                  icon={Stethoscope}
                  note="On duty across the hospital"
                />
              </div>
            </div>

            {/* ——— Queue ——— */}
            <Panel className="overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display text-[21px] leading-none text-foreground">Triage queue</h2>
                    <Badge
                      variant="secondary"
                      className="h-5 rounded-full bg-muted px-2 font-mono text-[10px] font-semibold text-muted-foreground tabular"
                    >
                      {filteredQueue.length}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Sorted newest first · click any row to open the encounter record.
                  </p>
                </div>

                <SegmentedControl
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'pending', label: 'Pending', count: kpis.pendingCount },
                    { value: 'all', label: 'All', count: kpis.totalAppointments },
                    { value: 'confirmed', label: 'Confirmed', count: kpis.confirmedCount },
                    { value: 'cancelled', label: 'Cancelled', count: kpis.cancelledCount },
                  ]}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/35 px-4 py-2.5">
                <div className="relative w-full sm:w-[260px]">
                  <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Patient, email, doctor or token…"
                    className="h-9 border-border bg-card pl-8 text-[12px]"
                  />
                </div>

                <Select value={selectedDoctorFilter} onValueChange={setSelectedDoctorFilter}>
                  <SelectTrigger className="h-9 w-full border-border bg-card text-[12px] sm:w-[186px]">
                    <SelectValue placeholder="All specialists" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All specialists</SelectItem>
                    {doctorRoster.map((d) => (
                      <SelectItem key={d.id} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
                  <SelectTrigger className="h-9 w-full border-border bg-card text-[12px] sm:w-[168px]">
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All dates</SelectItem>
                    {uniqueDates.map((d) => (
                      <SelectItem key={d} value={d}>
                        {fmtDate(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 gap-1 text-[11.5px] text-muted-foreground"
                  >
                    <X className="size-3" />
                    Clear
                  </Button>
                )}

                <span className="ml-auto hidden font-mono text-[10.5px] text-muted-foreground/80 sm:inline">
                  {loading ? 'syncing…' : `${filteredQueue.length} of ${appointments.length} requests`}
                </span>
              </div>

              {loading ? (
                <div className="space-y-2 p-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />
                  ))}
                </div>
              ) : filteredQueue.length === 0 ? (
                <Empty className="border-0 py-16">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="size-12 rounded-full bg-status-confirmed-soft text-status-confirmed">
                      <CheckCircle className="size-6" weight="duotone" />
                    </EmptyMedia>
                    <EmptyTitle className="font-display text-[20px] font-normal">
                      {statusFilter === 'pending' ? 'Queue is clear' : 'Nothing matches these filters'}
                    </EmptyTitle>
                    <EmptyDescription className="text-[12px]">
                      {statusFilter === 'pending'
                        ? 'No appointment requests are waiting for review right now.'
                        : 'Try a different status, specialist or date — or clear the search.'}
                    </EmptyDescription>
                  </EmptyHeader>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="h-8 text-[11.5px]">
                      Clear filters
                    </Button>
                  )}
                </Empty>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="h-9 bg-muted/40 pl-5 text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Token
                        </TableHead>
                        <TableHead className="h-9 bg-muted/40 text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Patient
                        </TableHead>
                        <TableHead className="h-9 bg-muted/40 text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Specialist
                        </TableHead>
                        <TableHead className="h-9 bg-muted/40 text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Slot
                        </TableHead>
                        <TableHead className="hidden h-9 bg-muted/40 text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase xl:table-cell">
                          Complaint
                        </TableHead>
                        <TableHead className="h-9 bg-muted/40 text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Status
                        </TableHead>
                        <TableHead className="h-9 bg-muted/40 pr-5 text-right text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQueue.map((appt) => {
                        const isActing = actionLoadingId === appt.id;
                        return (
                          <TableRow
                            key={appt.id}
                            onClick={() => setActiveDrawerAppt(appt)}
                            className="cursor-pointer border-border/70 transition-colors hover:bg-primary/[0.035]"
                          >
                            <TableCell className="py-3.5 pl-5 align-top">
                              <span className="font-mono text-[11.5px] font-semibold text-foreground tabular">
                                #APT-{String(appt.id).padStart(4, '0')}
                              </span>
                              <span className="mt-1 block text-[10.5px] text-muted-foreground">
                                {timeAgo(appt.created_at)}
                              </span>
                            </TableCell>

                            <TableCell className="py-3.5 align-top">
                              <div className="flex items-center gap-2.5">
                                <PersonAvatar name={appt.patient_name} size="sm" />
                                <div className="min-w-0">
                                  <p className="truncate text-[12.5px] font-semibold text-foreground">
                                    {appt.patient_name}
                                  </p>
                                  <p className="truncate text-[11px] text-muted-foreground">{appt.patient_email}</p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-3.5 align-top">
                              <p className="text-[12.5px] font-medium text-foreground">
                                {displayDoctor(appt.doctor_name)}
                              </p>
                              <span className="mt-0.5 inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                                {appt.specialization}
                              </span>
                            </TableCell>

                            <TableCell className="py-3.5 align-top">
                              <p className="text-[12px] font-medium text-foreground">{fmtDateShort(appt.slot_date)}</p>
                              <p className="mt-0.5 font-mono text-[11px] text-muted-foreground tabular">
                                {fmtTime(appt.slot_time)}
                              </p>
                            </TableCell>

                            <TableCell className="hidden max-w-[220px] py-3.5 align-top xl:table-cell">
                              <p className="line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
                                {appt.reason || 'General consultation'}
                              </p>
                            </TableCell>

                            <TableCell className="py-3.5 align-top">
                              <StatusPill status={appt.status as AppointmentStatus} short />
                            </TableCell>

                            <TableCell
                              className="py-3.5 pr-5 text-right align-top"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center gap-1.5">
                                {appt.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      disabled={isActing}
                                      onClick={() => handleConfirm(appt.id)}
                                      className="h-7 gap-1 bg-primary px-2.5 text-[11px] hover:bg-primary/90"
                                    >
                                      <Check className="size-3" weight="bold" />
                                      Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={isActing}
                                      onClick={() => handleCancel(appt.id)}
                                      className="h-7 gap-1 border-border px-2 text-[11px] text-status-cancelled hover:bg-status-cancelled-soft"
                                    >
                                      <X className="size-3" weight="bold" />
                                      Decline
                                    </Button>
                                  </>
                                )}

                                {appt.status === 'confirmed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isActing}
                                    onClick={() => handleCancel(appt.id)}
                                    className="h-7 gap-1 border-border px-2 text-[11px] text-muted-foreground hover:bg-status-cancelled-soft hover:text-status-cancelled"
                                  >
                                    <X className="size-3" />
                                    Cancel
                                  </Button>
                                )}

                                {appt.status === 'cancelled' && (
                                  <span className="text-[11px] text-muted-foreground/70">Archived</span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setActiveDrawerAppt(appt)}
                                  className="grid size-7 place-items-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                                  aria-label="Open encounter record"
                                >
                                  <CaretRight className="size-3.5" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between border-t border-border px-5 py-2.5 text-[10.5px] text-muted-foreground">
                    <span>
                      Showing <span className="font-mono tabular">{filteredQueue.length}</span> of{' '}
                      <span className="font-mono tabular">{appointments.length}</span> requests
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-status-confirmed" />
                      Live from Supabase
                    </span>
                  </div>
                </>
              )}
            </Panel>

            {/* ——— Queue context band ——— */}
            <div className="grid gap-4 lg:grid-cols-12">
              <Panel className="overflow-hidden lg:col-span-7">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                  <div>
                    <h3 className="font-display text-[18px] leading-none">Latest activity</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">Newest requests across the hospital</p>
                  </div>
                  <span className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-wider text-muted-foreground uppercase">
                    <span className="live-dot size-1.5 rounded-full bg-status-confirmed" />
                    Live
                  </span>
                </div>
                {appointments.length === 0 ? (
                  <p className="px-5 py-10 text-center text-[12px] text-muted-foreground">
                    No appointment activity yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border/60">
                    {appointments.slice(0, 4).map((appt) => (
                      <button
                        key={appt.id}
                        type="button"
                        onClick={() => setActiveDrawerAppt(appt)}
                        className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/30"
                      >
                        <PersonAvatar name={appt.patient_name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px]">
                            <span className="font-semibold text-foreground">{appt.patient_name}</span>{' '}
                            <span className="text-muted-foreground">requested {appt.specialization.toLowerCase()}</span>
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground tabular">
                            #APT-{String(appt.id).padStart(4, '0')} · {timeAgo(appt.created_at)}
                          </p>
                        </div>
                        <StatusPill status={appt.status as AppointmentStatus} short />
                      </button>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel className="p-5 lg:col-span-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-[18px] leading-none">Queue composition</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">Status split across all requests</p>
                  </div>
                  <span className="font-mono text-[10.5px] text-muted-foreground tabular">
                    {kpis.totalAppointments} total
                  </span>
                </div>

                <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-muted">
                  {kpis.totalAppointments > 0 && (
                    <>
                      <div
                        className="h-full bg-status-pending"
                        style={{ width: `${(kpis.pendingCount / kpis.totalAppointments) * 100}%` }}
                      />
                      <div
                        className="h-full bg-status-confirmed"
                        style={{ width: `${(kpis.confirmedCount / kpis.totalAppointments) * 100}%` }}
                      />
                      <div
                        className="h-full bg-status-cancelled/70"
                        style={{ width: `${(kpis.cancelledCount / kpis.totalAppointments) * 100}%` }}
                      />
                    </>
                  )}
                </div>

                <div className="mt-4 space-y-2.5">
                  {[
                    { label: 'Pending review', value: kpis.pendingCount, dot: 'bg-status-pending' },
                    { label: 'Confirmed', value: kpis.confirmedCount, dot: 'bg-status-confirmed' },
                    { label: 'Cancelled', value: kpis.cancelledCount, dot: 'bg-status-cancelled/70' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-2 text-[11.5px]">
                      <span className={`size-1.5 rounded-full ${row.dot}`} />
                      <span className="flex-1 text-muted-foreground">{row.label}</span>
                      <span className="font-mono font-medium text-foreground tabular">{row.value}</span>
                      <span className="w-9 text-right font-mono text-[10px] text-muted-foreground tabular">
                        {kpis.totalAppointments
                          ? `${Math.round((row.value / kpis.totalAppointments) * 100)}%`
                          : '—'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-lg bg-muted/55 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  {oldestPending ? (
                    <>
                      Longest wait is{' '}
                      <strong className="font-semibold text-foreground">
                        {timeAgo(oldestPending.created_at)}
                      </strong>{' '}
                      for <strong className="font-semibold text-foreground">{oldestPending.patient_name}</strong>.
                    </>
                  ) : (
                    <>Nothing is waiting for review. New requests will surface here instantly.</>
                  )}
                </div>
              </Panel>
            </div>
          </>
        )}

        {activeTab === 'roster' && (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Seven-day cycle"
              title="Hospital medical staff"
              actions={
                <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-2.5 shadow-card">
                  <div>
                    <p className="text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      Capacity
                    </p>
                    <p className="font-display text-[22px] leading-none tabular">{kpis.totalSlotsCount}</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <p className="text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      Booked
                    </p>
                    <p className="font-display text-[22px] leading-none text-status-confirmed tabular">
                      {kpis.bookedSlotsCount}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <p className="text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      Free
                    </p>
                    <p className="font-display text-[22px] leading-none tabular">
                      {Math.max(kpis.totalSlotsCount - kpis.bookedSlotsCount, 0)}
                    </p>
                  </div>
                </div>
              }
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {doctorRoster.map((doc) => (
                <article
                  key={doc.id}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <PersonAvatar name={doc.name} photoUrl={doc.photo_url} size="lg" />
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-[18px] leading-tight text-foreground">
                          {displayDoctor(doc.name)}
                        </h3>
                        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{doc.specialization}</p>
                      </div>
                    </div>
                    <Ring
                      value={doc.occupancyRate}
                      size={54}
                      stroke={4}
                      className={
                        doc.occupancyRate >= 85
                          ? 'text-status-cancelled'
                          : doc.occupancyRate >= 60
                            ? 'text-status-pending'
                            : 'text-status-confirmed'
                      }
                    >
                      <span className="font-mono text-[11px] font-semibold tabular">{doc.occupancyRate}%</span>
                    </Ring>
                  </div>

                  <MetaList
                    className="mt-4"
                    items={[
                      { label: 'Experience', value: `${doc.experience_years} years` },
                      {
                        label: 'Qualifications',
                        value: <span className="block max-w-[190px] truncate">{doc.education}</span>,
                      },
                      {
                        label: 'Booked',
                        value: (
                          <span className="font-mono tabular">
                            {doc.bookedSlots} / {doc.totalSlots}
                          </span>
                        ),
                      },
                    ]}
                  />

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3.5">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span
                        className={`size-1.5 rounded-full ${
                          doc.freeSlots > 0 ? 'bg-status-confirmed' : 'bg-status-cancelled'
                        }`}
                      />
                      {doc.freeSlots > 0 ? `${doc.freeSlots} free slots` : 'Fully booked'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectingDoctor(doc)}
                      className="h-7 gap-1 border-border px-2.5 text-[11px]"
                    >
                      <CalendarBlank className="size-3.5" />
                      View slots
                    </Button>
                  </div>
                </article>
              ))}

              {doctorRoster.length === 0 && !loading && (
                <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/60 py-16">
                  <Empty className="border-0">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="size-11 rounded-full">
                        <Stethoscope className="size-5" weight="duotone" />
                      </EmptyMedia>
                      <EmptyTitle className="font-display text-[19px] font-normal">No specialists on file</EmptyTitle>
                      <EmptyDescription className="text-[12px]">
                        Doctor records will appear here once they are added to the hospital directory.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Current cycle"
              title="Hospital demand & utilisation"
              actions={<LivePill label="Live" />}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                      Volume
                    </p>
                    <h3 className="mt-1 font-display text-[20px] leading-tight">Consultations by date</h3>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      Appointments booked across the seven-day window
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground">
                    <span className="size-2 rounded-full bg-primary" />
                    Total
                  </span>
                </div>
                <div className="mt-4 h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.datesTrend} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="rgba(255,255,255,0.08)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value: string) => fmtDateShort(value)}
                        tick={{ fontSize: 10, fill: '#8c8c8c' }}
                        axisLine={false}
                        tickLine={false}
                        dy={6}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#8c8c8c' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        width={38}
                      />
                      <RechartsTooltip
                        cursor={{ stroke: '#ffffff', strokeDasharray: '3 3', strokeOpacity: 0.35 }}
                        content={<ChartTooltip labelFormatter={(label) => fmtDate(label)} />}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Appointments"
                        stroke="#ffffff"
                        strokeWidth={2}
                        fill="url(#volumeFill)"
                        activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                      Distribution
                    </p>
                    <h3 className="mt-1 font-display text-[20px] leading-tight">Department workload</h3>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      Patient demand split across clinical specialisations
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground">
                    <span className="size-2 rounded-full bg-chart-2" />
                    Requests
                  </span>
                </div>
                <div className="mt-4 h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.specialtyDistribution}
                      margin={{ top: 8, right: 6, left: -18, bottom: 0 }}
                      barCategoryGap="32%"
                    >
                      <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="rgba(255,255,255,0.08)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#8c8c8c' }}
                        axisLine={false}
                        tickLine={false}
                        dy={6}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#8c8c8c' }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        width={38}
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(14,86,72,0.06)' }}
                        content={<ChartTooltip />}
                      />
                      <Bar dataKey="count" name="Requests" fill="#a3a3a3" radius={[5, 5, 0, 0]} maxBarSize={44} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <Panel className="p-5 lg:col-span-7">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[19px]">Department mix</h3>
                  <span className="font-mono text-[10.5px] text-muted-foreground tabular">
                    {analyticsData.specialtyDistribution.length} departments
                  </span>
                </div>
                <div className="mt-4 space-y-3.5">
                  {[...analyticsData.specialtyDistribution]
                    .sort((a, b) => b.count - a.count)
                    .map((spec, index) => {
                      const max = Math.max(...analyticsData.specialtyDistribution.map((s) => s.count), 1);
                      const width = Math.max(Math.round((spec.count / max) * 100), 4);
                      return (
                        <div key={spec.name}>
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                              <span className="font-mono text-[10px] text-muted-foreground tabular">
                                {String(index + 1).padStart(2, '0')}
                              </span>
                              {spec.name}
                            </span>
                            <span className="font-mono text-[11.5px] text-muted-foreground tabular">
                              {spec.count}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary/80 transition-all duration-700"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  {analyticsData.specialtyDistribution.length === 0 && (
                    <p className="py-8 text-center text-[12px] text-muted-foreground">
                      No appointment data in this cycle yet.
                    </p>
                  )}
                </div>
              </Panel>

              <Panel className="p-5 lg:col-span-5">
                <div className="flex items-center gap-2">
                  <Pulse className="size-4 text-primary" weight="duotone" />
                  <h3 className="font-display text-[19px]">Reading the numbers</h3>
                </div>
                <MetaList
                  className="mt-3"
                  items={[
                    {
                      label: 'Busiest schedule date',
                      value: busiestDate ? `${fmtDateShort(busiestDate.date)} · ${busiestDate.total}` : '—',
                    },
                    {
                      label: 'Peak department',
                      value: peakSpecialty ? `${peakSpecialty.name} · ${peakSpecialty.count}` : '—',
                    },
                    {
                      label: 'Confirmed share',
                      value: kpis.totalAppointments
                        ? `${Math.round((kpis.confirmedCount / kpis.totalAppointments) * 100)}%`
                        : '—',
                    },
                    {
                      label: 'Slot utilisation',
                      value: occupancyLabel,
                    },
                  ]}
                />
                <div className="mt-4 rounded-xl bg-muted/60 p-3.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  {kpis.pendingCount > 0 ? (
                    <>
                      <strong className="font-semibold text-foreground">
                        {kpis.pendingCount} {kpis.pendingCount === 1 ? 'request' : 'requests'}
                      </strong>{' '}
                      {kpis.pendingCount === 1 ? 'is' : 'are'} still awaiting review. Confirming locks the slot and
                      notifies the patient immediately.
                    </>
                  ) : (
                    <>
                      All requests are triaged. Occupancy is currently{' '}
                      <strong className="font-semibold text-foreground">{kpis.occupancyRate}%</strong> across{' '}
                      {kpis.totalSlotsCount} available slots.
                    </>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Registered accounts"
              title="Accounts & visit history"
              actions={
                <div className="relative w-full sm:w-[260px]">
                  <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or email…"
                    className="h-9 border-border bg-card pl-8 text-[12px]"
                  />
                </div>
              }
            />

            <Panel className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-mono tabular">{patientDirectory.length}</span> registered patients
                </p>
                <Badge
                  variant="secondary"
                  className="h-5 gap-1 rounded-full bg-muted px-2 text-[10px] font-semibold text-muted-foreground"
                >
                  <CheckCircle className="size-3" weight="fill" />
                  Verified accounts
                </Badge>
              </div>

              {patientDirectory.length === 0 ? (
                <Empty className="border-0 py-16">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="size-11 rounded-full">
                      <UsersThree className="size-5" weight="duotone" />
                    </EmptyMedia>
                    <EmptyTitle className="font-display text-[19px] font-normal">No patients registered</EmptyTitle>
                    <EmptyDescription className="text-[12px]">
                      Patient accounts appear here as soon as they register.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      {['Patient', 'Contact', 'Registered', 'Bookings', 'Confirmed visits', 'Last visit'].map(
                        (label) => (
                          <TableHead
                            key={label}
                            className={`h-9 bg-muted/40 text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase ${
                              label === 'Patient' ? 'pl-5' : ''
                            } ${label === 'Last visit' ? 'pr-5 text-right' : ''}`}
                          >
                            {label}
                          </TableHead>
                        )
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientDirectory
                      .filter((p) => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase();
                        return p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
                      })
                      .map((p) => (
                        <TableRow key={p.id} className="border-border/70">
                          <TableCell className="py-3 pl-5">
                            <div className="flex items-center gap-2.5">
                              <PersonAvatar name={p.name} size="sm" />
                              <span className="text-[12.5px] font-semibold text-foreground">{p.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 font-mono text-[11px] text-muted-foreground">{p.email}</TableCell>
                          <TableCell className="py-3 text-[11.5px] text-muted-foreground">
                            {new Date(p.registeredAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="py-3 font-mono text-[12px] font-medium text-foreground tabular">
                            {p.totalBookings}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="secondary"
                              className={`h-5 rounded-full border-0 px-2 text-[10px] font-semibold ${
                                p.confirmedBookings > 0
                                  ? 'bg-status-confirmed-soft text-status-confirmed'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {p.confirmedBookings} {p.confirmedBookings === 1 ? 'visit' : 'visits'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 pr-5 text-right text-[11.5px] text-muted-foreground">
                            {p.lastVisit ? fmtDate(p.lastVisit) : 'None'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </Panel>
          </div>
        )}
      </div>

      {/* ——— Encounter drawer ——— */}
      <Sheet open={!!activeDrawerAppt} onOpenChange={(open) => !open && setActiveDrawerAppt(null)}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[500px]">
          {activeDrawerAppt && (
            <>
              <SheetTitle className="sr-only">Encounter record</SheetTitle>
              <SheetDescription className="sr-only">
                Appointment request details and triage actions
              </SheetDescription>

              <div className="border-b border-border px-5 py-4 pr-12">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10.5px] font-semibold text-muted-foreground tabular">
                    #APT-{String(activeDrawerAppt.id).padStart(4, '0')}
                  </span>
                  <StatusPill status={activeDrawerAppt.status as AppointmentStatus} short />
                </div>
                <h2 className="mt-2 font-display text-[24px] leading-tight">Encounter record</h2>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                  Requested {timeAgo(activeDrawerAppt.created_at)} ·{' '}
                  {new Date(activeDrawerAppt.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="scroll-thin flex-1 space-y-5 overflow-y-auto px-5 py-5">
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-[9.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    Patient
                  </p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <PersonAvatar name={activeDrawerAppt.patient_name} size="lg" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-foreground">{activeDrawerAppt.patient_name}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {activeDrawerAppt.patient_email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <p className="text-[9.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    Assigned specialist
                  </p>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">
                        {displayDoctor(activeDrawerAppt.doctor_name)}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {activeDrawerAppt.specialization} department
                      </p>
                    </div>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                      Wing B
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/70 pt-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Date</p>
                      <p className="mt-0.5 text-[12px] font-medium">{fmtDate(activeDrawerAppt.slot_date)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Time</p>
                      <p className="mt-0.5 font-mono text-[12px] font-medium tabular">
                        {fmtTime(activeDrawerAppt.slot_time)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[9.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    Chief complaint
                  </p>
                  <blockquote className="mt-2 rounded-xl border-l-2 border-primary/40 bg-muted/40 px-4 py-3 text-[12px] leading-relaxed text-foreground/85">
                    {activeDrawerAppt.reason || 'No specific symptoms described. Routine clinical consult.'}
                  </blockquote>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <MetaList
                    items={[
                      {
                        label: 'Slot lock',
                        value:
                          activeDrawerAppt.status === 'confirmed' ? (
                            <span className="font-medium text-status-confirmed">Locked</span>
                          ) : (
                            <span className="font-medium text-muted-foreground">Not locked</span>
                          ),
                      },
                      { label: 'Patient ID', value: <span className="font-mono text-[11px]">{activeDrawerAppt.patient_id || '—'}</span> },
                      {
                        label: 'Slot ID',
                        value: <span className="font-mono text-[11px]">{activeDrawerAppt.slot_id || '—'}</span>,
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="border-t border-border bg-muted/30 px-5 py-3.5">
                <p className="mb-2 text-[10.5px] text-muted-foreground">
                  {activeDrawerAppt.status === 'pending'
                    ? 'Patient is waiting for a decision.'
                    : activeDrawerAppt.status === 'confirmed'
                      ? 'Slot is locked and the patient is notified.'
                      : 'Slot has been released back to the pool.'}
                </p>
                <div className="flex items-center justify-end gap-2">
                  {activeDrawerAppt.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoadingId === activeDrawerAppt.id}
                        onClick={() => handleCancel(activeDrawerAppt.id)}
                        className="h-8 border-border text-[11.5px] text-status-cancelled hover:bg-status-cancelled-soft"
                      >
                        <XCircle className="size-3.5" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        disabled={actionLoadingId === activeDrawerAppt.id}
                        onClick={() => handleConfirm(activeDrawerAppt.id)}
                        className="h-8 gap-1.5 bg-primary text-[11.5px] hover:bg-primary/90"
                      >
                        <Check className="size-3.5" weight="bold" />
                        Confirm & lock
                      </Button>
                    </>
                  )}

                  {activeDrawerAppt.status === 'confirmed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === activeDrawerAppt.id}
                      onClick={() => handleCancel(activeDrawerAppt.id)}
                      className="h-8 border-border text-[11.5px] text-status-cancelled hover:bg-status-cancelled-soft"
                    >
                      <XCircle className="size-3.5" />
                      Cancel & unlock
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveDrawerAppt(null)}
                    className="h-8 text-[11.5px] text-muted-foreground"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ——— Doctor slot matrix ——— */}
      <Dialog open={!!inspectingDoctor} onOpenChange={(open) => !open && setInspectingDoctor(null)}>
        <DialogContent className="max-h-[86svh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
          {inspectingDoctor && (
            <>
              <div className="border-b border-border px-5 py-4 pr-12">
                <p className="text-[9.5px] font-semibold tracking-[0.16em] text-primary uppercase">
                  Seven-day slot matrix
                </p>
                <DialogTitle className="mt-1 font-display text-[22px] leading-tight">
                  {displayDoctor(inspectingDoctor.name)} · {inspectingDoctor.specialization}
                </DialogTitle>
                <DialogDescription className="mt-1 text-[11.5px] text-muted-foreground">
                  {inspectingDoctor.bookedSlots} of {inspectingDoctor.totalSlots} slots booked ·{' '}
                  {inspectingDoctor.freeSlots} available
                </DialogDescription>
              </div>

              <div className="scroll-thin max-h-[58svh] space-y-5 overflow-y-auto px-5 py-5">
                {groupedSlots.length === 0 && (
                  <p className="py-10 text-center text-[12px] text-muted-foreground">
                    No slots are published for this specialist yet.
                  </p>
                )}

                {groupedSlots.map(([date, slots]) => {
                  const free = slots.filter((s) => !s.is_booked).length;
                  return (
                    <div key={date}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[11.5px] font-semibold text-foreground">{fmtDate(date)}</p>
                        <span className="font-mono text-[10px] text-muted-foreground tabular">
                          {free} free / {slots.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {slots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`flex items-center justify-between gap-1 rounded-lg border px-2.5 py-2 ${
                              slot.is_booked
                                ? 'border-status-cancelled/15 bg-status-cancelled-soft/60'
                                : 'border-status-confirmed/15 bg-status-confirmed-soft/60'
                            }`}
                          >
                            <span
                              className={`font-mono text-[11px] font-medium tabular ${
                                slot.is_booked ? 'text-status-cancelled' : 'text-status-confirmed'
                              }`}
                            >
                              {fmtTime(slot.slot_time)}
                            </span>
                            <span
                              className={`text-[8.5px] font-semibold tracking-wider uppercase ${
                                slot.is_booked ? 'text-status-cancelled/80' : 'text-status-confirmed/80'
                              }`}
                            >
                              {slot.is_booked ? 'Booked' : 'Free'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
                <span className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-status-confirmed" /> Free
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-status-cancelled" /> Booked
                  </span>
                </span>
                <Button size="sm" onClick={() => setInspectingDoctor(null)} className="h-8 bg-primary text-[11.5px]">
                  Close schedule
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function HourglassIcon() {
  return (
    <span className="grid size-6 place-items-center rounded-md bg-black/5">
      <Clock className="size-3.5" weight="duotone" />
    </span>
  );
}
