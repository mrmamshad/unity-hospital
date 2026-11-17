'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarBlank,
  Check,
  CheckCircle,
  Clock,
  ListChecks,
  MagnifyingGlass,
  WarningCircle,
  X,
  XCircle,
} from '@phosphor-icons/react';
import { AppShell, type NavSection } from '@/components/shell/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  LivePill,
  Panel,
  PersonAvatar,
  SectionHeading,
  SegmentedControl,
  StatCard,
  StatusPill,
  type AppointmentStatus,
} from '@/components/portal/kit';
import { SessionUser } from '@/types';
import { displayDoctor, fmtDate, fmtTime } from '@/lib/utils';

interface AssistantAppointment {
  id: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  reason: string | null;
  created_at: string;
  patient_name: string;
  patient_email: string;
  doctor_name: string;
  specialization: string;
  slot_date: string;
  slot_time: string;
}

interface Props {
  user: SessionUser;
  initialFilter?: string;
}

type Filter = 'pending' | 'all' | 'confirmed' | 'cancelled';

export default function AssistantPortal({ user, initialFilter = 'pending' }: Props) {
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>(
    ['pending', 'all', 'confirmed', 'cancelled'].includes(initialFilter) ? (initialFilter as Filter) : 'pending'
  );
  const [appointments, setAppointments] = useState<AssistantAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [flashMsg, setFlashMsg] = useState<string>('');
  const [flashErr, setFlashErr] = useState<string>('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assistant/appointments?status=all');
      if (res.ok) {
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
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
        setFlashMsg(data.message || 'Appointment confirmed. Patient notified.');
        fetchAppointments();
      }
    } catch {
      setFlashErr('An unexpected error occurred.');
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
        setFlashMsg(data.message || 'Appointment cancelled. Slot freed and patient notified.');
        fetchAppointments();
      }
    } catch {
      setFlashErr('An unexpected error occurred.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const counts = useMemo(
    () => ({
      pending: appointments.filter((a) => a.status === 'pending').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
      total: appointments.length,
    }),
    [appointments]
  );

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return appointments.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!q) return true;
      return (
        item.patient_name.toLowerCase().includes(q) ||
        item.patient_email.toLowerCase().includes(q) ||
        item.doctor_name.toLowerCase().includes(q) ||
        (item.reason && item.reason.toLowerCase().includes(q))
      );
    });
  }, [appointments, filter, searchQuery]);

  const navigation: NavSection[] = useMemo(
    () => [
      {
        label: 'Triage desk',
        items: [
          { id: 'queue', label: 'Work queue', icon: ListChecks, count: counts.pending },
          { id: 'all', label: 'All requests', icon: CalendarBlank, hint: `${counts.total}` },
          { id: 'confirmed', label: 'Confirmed', icon: CheckCircle, hint: `${counts.confirmed}` },
          { id: 'cancelled', label: 'Cancelled', icon: XCircle, hint: `${counts.cancelled}` },
        ],
      },
    ],
    [counts]
  );

  const activeNav = filter === 'pending' ? 'queue' : filter;

  return (
    <AppShell
      workspace="Triage desk"
      navigation={navigation}
      active={activeNav}
      onNavigate={(id) => setFilter(id === 'queue' ? 'pending' : (id as Filter))}
      user={{ name: user.name, role: 'Front-desk assistant', email: user.email }}
      onLogout={handleLogout}
      eyebrow="Front desk / appointment queue"
      title="Appointment queue"
      description="Confirm requests to lock a consultation slot, or decline with the patient notified instantly."
      onRefresh={fetchAppointments}
      refreshing={loading}
      statusLabel="Queue connected"
      actions={<LivePill label="Live" className="hidden sm:inline-flex" />}
    >
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
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

        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Today at a glance"
            title="Requests needing action"
          />
          <p className="hidden font-mono text-[10.5px] text-muted-foreground sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Awaiting decision"
            value={counts.pending}
            icon={Clock}
            tone="pending"
            note="Requests that still need a confirm or decline"
          />
          <StatCard
            label="Confirmed visits"
            value={counts.confirmed}
            icon={CheckCircle}
            tone="confirmed"
            note="Slots locked for scheduled patients"
          />
          <StatCard
            label="Declined"
            value={counts.cancelled}
            icon={XCircle}
            note="Slots released back into the pool"
          />
        </div>

        <Panel className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-[21px] leading-none">Request desk</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground tabular">
                  {filteredList.length}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Patient contact, assigned specialist and the requested slot in one row.
              </p>
            </div>

            <SegmentedControl
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'pending', label: 'Pending', count: counts.pending },
                { value: 'all', label: 'All', count: counts.total },
                { value: 'confirmed', label: 'Confirmed', count: counts.confirmed },
                { value: 'cancelled', label: 'Cancelled', count: counts.cancelled },
              ]}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/35 px-4 py-2.5">
            <div className="relative w-full sm:w-[300px]">
              <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, email, doctor or reason…"
                className="h-9 border-border bg-card pl-8 text-[12px]"
              />
            </div>
            <span className="ml-auto hidden font-mono text-[10.5px] text-muted-foreground/80 sm:inline">
              {loading ? 'syncing…' : `${filteredList.length} of ${appointments.length} requests`}
            </span>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <Empty className="border-0 py-16">
              <EmptyHeader>
                <EmptyMedia
                  variant="icon"
                  className="size-12 rounded-full bg-status-confirmed-soft text-status-confirmed"
                >
                  <CheckCircle className="size-6" weight="duotone" />
                </EmptyMedia>
                <EmptyTitle className="font-display text-[20px] font-normal">
                  {filter === 'pending' ? 'Inbox zero' : 'No requests in this view'}
                </EmptyTitle>
                <EmptyDescription className="text-[12px]">
                  {filter === 'pending'
                    ? 'Every pending appointment has been reviewed. New requests will appear here automatically.'
                    : searchQuery
                      ? 'No requests match that search — try a different name or doctor.'
                      : 'Nothing matches the selected status yet.'}
                </EmptyDescription>
              </EmptyHeader>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="h-8 text-[11.5px]">
                  Clear search
                </Button>
              )}
            </Empty>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    {['Patient', 'Specialist & slot', 'Reason', 'Status', 'Actions'].map((label) => (
                      <TableHead
                        key={label}
                        className={`h-9 bg-muted/40 text-[9.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase ${
                          label === 'Patient' ? 'pl-5' : ''
                        } ${label === 'Actions' ? 'pr-5 text-right' : ''}`}
                      >
                        {label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((appt) => {
                    const isActing = actionLoadingId === appt.id;
                    return (
                      <TableRow key={appt.id} className="border-border/70">
                        <TableCell className="py-3.5 pl-5 align-top">
                          <div className="flex items-center gap-2.5">
                            <PersonAvatar name={appt.patient_name} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] font-semibold text-foreground">
                                {appt.patient_name}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">{appt.patient_email}</p>
                              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                                Req. {new Date(appt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
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
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <CalendarBlank className="size-3" />
                            {fmtDate(appt.slot_date)}
                            <span className="text-muted-foreground/40">·</span>
                            <span className="font-mono text-[10.5px] tabular">{fmtTime(appt.slot_time)}</span>
                          </p>
                        </TableCell>

                        <TableCell className="max-w-[240px] py-3.5 align-top">
                          <p className="line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
                            {appt.reason || 'No reason provided'}
                          </p>
                        </TableCell>

                        <TableCell className="py-3.5 align-top">
                          <StatusPill status={appt.status as AppointmentStatus} short />
                        </TableCell>

                        <TableCell className="py-3.5 pr-5 text-right align-top">
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
                                  Cancel
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
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t border-border px-5 py-2.5 text-[10.5px] text-muted-foreground">
                <span>
                  Showing <span className="font-mono tabular">{filteredList.length}</span> of{' '}
                  <span className="font-mono tabular">{appointments.length}</span> requests
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-status-confirmed" />
                  Queue connected
                </span>
              </div>
            </>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
