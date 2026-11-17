'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle,
  Clock,
} from '@phosphor-icons/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationItem } from '@/types';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setUnread(data.unread || 0);
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && unread > 0) {
      try {
        await fetch('/api/notifications/read', { method: 'POST' });
        setUnread(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          <Bell className="size-4" weight={unread > 0 ? 'fill' : 'regular'} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-status-cancelled px-1 font-mono text-[9.5px] font-semibold leading-[18px] text-white ring-2 ring-background">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[336px] gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="font-display text-[16px] leading-none">Notifications</p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              {unread > 0 ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'You are all caught up'}
            </p>
          </div>
          <span className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground">
            <CheckCircle className="size-3.5" weight="duotone" />
          </span>
        </div>

        <div className="scroll-thin max-h-[320px] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/60" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto size-6 text-muted-foreground/40" weight="duotone" />
              <p className="mt-2 text-[12px] font-medium text-foreground">No notifications yet</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Status updates about your appointments appear here.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`border-b border-border/60 px-4 py-3 text-[11.5px] last:border-0 ${
                  item.is_read ? 'bg-card' : 'bg-accent/60'
                }`}
              >
                <p className="leading-relaxed text-foreground/85">
                  {item.message.replace(/\b(MediSlot|Terafab)\b/gi, 'Unity Hospital')}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Clock className="size-2.5" />
                  <span className="font-mono tabular">
                    {new Date(item.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
