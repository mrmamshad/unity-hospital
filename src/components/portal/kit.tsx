'use client';

import type { ComponentProps, ReactNode } from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { cn, initialsOf } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; icon: PhosphorIcon; pill: string }
> = {
  pending: {
    label: 'Pending review',
    icon: Clock,
    pill: 'bg-status-pending-soft text-status-pending ring-1 ring-status-pending/20',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    pill: 'bg-status-confirmed-soft text-status-confirmed ring-1 ring-status-confirmed/20',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    pill: 'bg-status-cancelled-soft text-status-cancelled ring-1 ring-status-cancelled/20',
  },
};

export function StatusPill({
  status,
  className,
  short = false,
}: {
  status: AppointmentStatus;
  className?: string;
  short?: boolean;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge
      variant="secondary"
      className={cn(
        'h-auto gap-1.5 rounded-full border-0 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide uppercase',
        meta.pill,
        className
      )}
    >
      <Icon className="size-3" weight="fill" />
      {short ? status : meta.label}
    </Badge>
  );
}

export function PersonAvatar({
  name,
  photoUrl,
  size = 'md',
  className,
}: {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'size-7 text-[10px]',
    md: 'size-9 text-[11px]',
    lg: 'size-12 text-sm',
  };

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={cn('shrink-0 rounded-full object-cover ring-1 ring-border', sizes[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-secondary font-semibold text-secondary-foreground ring-1 ring-border',
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initialsOf(name)}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p>
        )}
        <h2 className="mt-1 font-display text-[22px] leading-tight text-foreground sm:text-[25px]">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-[12.5px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = 'neutral',
  className,
  children,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  icon?: PhosphorIcon;
  tone?: 'neutral' | 'confirmed' | 'pending' | 'clay';
  className?: string;
  children?: ReactNode;
}) {
  const tones = {
    neutral: 'bg-secondary text-secondary-foreground',
    confirmed: 'bg-status-confirmed-soft text-status-confirmed',
    pending: 'bg-status-pending-soft text-status-pending',
    clay: 'bg-white/10 text-white/70',
  };

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 shadow-card', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
        {Icon && (
          <span className={cn('grid size-7 place-items-center rounded-lg', tones[tone])}>
            <Icon className="size-3.5" weight="duotone" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-[34px] leading-none text-foreground tabular">{value}</p>
      {note && <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground">{note}</p>}
      {children}
    </div>
  );
}

export function Ring({
  value,
  size = 52,
  stroke = 4,
  className,
  trackClassName,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  trackClassName?: string;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={cn('stroke-border/70', trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('stroke-current transition-[stroke-dashoffset] duration-700 ease-out', className)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function MetaList({ items, className }: { items: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn('divide-y divide-border/70', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-[11.5px] text-muted-foreground">{item.label}</dt>
          <dd className="text-right text-[12px] font-medium text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LivePill({ label = 'Live', className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-status-confirmed/20 bg-status-confirmed-soft px-2.5 py-1 text-[10px] font-semibold tracking-wide text-status-confirmed uppercase',
        className
      )}
    >
      <span className="live-dot size-1.5 rounded-full bg-status-confirmed" />
      {label}
    </span>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  className?: string;
}) {
  return (
    <div
      className={cn('inline-flex items-center gap-0.5 rounded-lg bg-muted p-1', className)}
      role="tablist"
      aria-label="Filter"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-all',
              active
                ? 'bg-card text-foreground shadow-[0_1px_2px_rgba(19,31,27,0.08)] ring-1 ring-border/60'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
            {typeof option.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-px font-mono text-[10px] tabular',
                  active ? 'bg-secondary text-secondary-foreground' : 'bg-foreground/5 text-muted-foreground'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function FieldLabel({ children, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase"
      {...props}
    >
      {children}
    </span>
  );
}

export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('rounded-2xl border border-border bg-card shadow-card', className)}
      {...props}
    />
  );
}
