'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { Icon } from '@phosphor-icons/react';
import {
  ArrowRight,
  CaretLineLeft,
  CaretLineRight,
  Command as CommandIcon,
  MagnifyingGlass,
  SignOut,
  List,
  X,
} from '@phosphor-icons/react';
import { cn, initialsOf } from '@/lib/utils';
import { UnityMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Kbd } from '@/components/ui/kbd';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type NavItem = {
  id: string;
  label: string;
  icon: Icon;
  count?: number;
  hint?: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export type ShellUser = {
  name: string;
  role: string;
  email?: string;
};

type AppShellProps = {
  workspace: string;
  navigation: NavSection[];
  active: string;
  onNavigate: (id: string) => void;
  user: ShellUser;
  onLogout: () => void;
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  children: ReactNode;
  contentClassName?: string;
  statusLabel?: string;
  searchLabel?: string;
};

function SidebarNav({
  navigation,
  active,
  collapsed,
  onNavigate,
}: {
  navigation: NavSection[];
  active: string;
  collapsed: boolean;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav className="flex flex-col gap-6 px-3">
      {navigation.map((section) => (
        <div key={section.label}>
          {!collapsed ? (
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-sidebar-foreground/35 uppercase">
              {section.label}
            </p>
          ) : (
            <div className="mx-auto mb-3 h-px w-6 bg-sidebar-border" />
          )}
          <div className="flex flex-col gap-1">
            {section.items.map((item) => {
              const isActive = item.id === active;
              const button = (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-lg py-2.5 text-[13px] font-medium transition-colors duration-150',
                    collapsed ? 'justify-center px-0' : 'px-3',
                    isActive
                      ? 'bg-sidebar-accent text-white'
                      : 'text-sidebar-foreground/65 hover:bg-white/[0.045] hover:text-sidebar-foreground'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                  )}
                  <item.icon
                    weight={isActive ? 'duotone' : 'regular'}
                    className={cn(
                      'size-[18px] shrink-0 transition-colors',
                      isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {typeof item.count === 'number' && item.count > 0 && (
                        <span className="min-w-5 rounded-full bg-sidebar-primary/15 px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold text-sidebar-primary tabular">
                          {item.count}
                        </span>
                      )}
                      {item.hint && !item.count ? (
                        <span className="font-mono text-[10px] tracking-wide text-sidebar-foreground/30">
                          {item.hint}
                        </span>
                      ) : null}
                    </>
                  )}
                  {collapsed && typeof item.count === 'number' && item.count > 0 && (
                    <span className="absolute right-2 top-2 size-1.5 rounded-full bg-sidebar-primary" />
                  )}
                </button>
              );

              if (!collapsed) return button;

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.label}
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className="font-mono text-[10px] opacity-70">{item.count}</span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({
  workspace,
  navigation,
  active,
  onNavigate,
  user,
  onLogout,
  eyebrow,
  title,
  description,
  actions,
  onRefresh,
  refreshing,
  children,
  contentClassName,
  statusLabel = 'All systems synced',
  searchLabel = 'Search console',
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const flatNav = useMemo(() => navigation.flatMap((section) => section.items), [navigation]);

  const navigate = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
    setPaletteOpen(false);
  };

  return (
    <div className="flex min-h-svh bg-canvas">
      {/* ——— Desktop sidebar ——— */}
      <aside
        className={cn(
          'sidebar-noise sticky top-0 z-40 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out lg:flex',
          collapsed ? 'w-[86px]' : 'w-[272px]'
        )}
      >
        <div className={cn('flex h-[76px] items-center border-b border-sidebar-border/70', collapsed ? 'justify-center px-3' : 'gap-3 px-5')}>
          <Link
            href="/"
            className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-white text-black shadow-[0_10px_24px_-14px_rgba(0,0,0,0.9)]"
            aria-label="Unity Hospital home"
          >
            <UnityMark className="size-5" />
          </Link>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-medium leading-none tracking-[0.24em] text-white uppercase">Unity</p>
              <p className="mt-1.5 truncate text-[9px] font-medium tracking-[0.2em] text-sidebar-foreground/40 uppercase">
                Hospital
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="grid size-7 place-items-center rounded-md text-sidebar-foreground/35 transition-colors hover:bg-white/5 hover:text-sidebar-foreground"
              aria-label="Collapse sidebar"
            >
              <CaretLineLeft className="size-4" />
            </button>
          )}
        </div>

        <div className="scroll-thin flex-1 overflow-y-auto py-6">
          <SidebarNav navigation={navigation} active={active} collapsed={collapsed} onNavigate={navigate} />
        </div>

        <div className="border-t border-sidebar-border/70 p-3">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="grid size-8 place-items-center rounded-md text-sidebar-foreground/40 hover:bg-white/5 hover:text-sidebar-foreground"
                aria-label="Expand sidebar"
              >
                <CaretLineRight className="size-4" />
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="grid size-9 place-items-center rounded-full bg-white/8 text-[11px] font-semibold text-sidebar-foreground ring-1 ring-white/10"
                  >
                    {initialsOf(user.name)}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{user.name} · Sign out</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.035] p-2.5 ring-1 ring-white/[0.06]">
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-sidebar-accent text-[11px] font-semibold text-sidebar-primary">
                  {initialsOf(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-white">{user.name}</p>
                  <p className="truncate text-[10.5px] text-sidebar-foreground/45">{user.role}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="grid size-7 place-items-center rounded-md text-sidebar-foreground/40 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <SignOut className="size-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between px-1.5">
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-sidebar-foreground/35">
                  <span className="live-dot size-1.5 rounded-full bg-emerald-400" />
                  {statusLabel}
                </span>
                <span className="font-mono text-[9.5px] tracking-wide text-sidebar-foreground/25">v2.4</span>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* ——— Mobile drawer ——— */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[296px] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Switch between {workspace} workspaces</SheetDescription>
          <div className="flex h-[76px] items-center gap-3 border-b border-sidebar-border/70 px-5">
            <div className="grid size-10 place-items-center rounded-[11px] bg-white text-black">
              <UnityMark className="size-5" />
            </div>
            <div>
              <p className="text-[16px] font-medium leading-none tracking-[0.24em] text-white uppercase">Unity</p>
              <p className="mt-1.5 text-[9px] font-medium tracking-[0.2em] text-sidebar-foreground/40 uppercase">
                Hospital
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="ml-auto grid size-8 place-items-center rounded-md text-sidebar-foreground/50 hover:bg-white/5 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="scroll-thin flex-1 overflow-y-auto py-6">
            <SidebarNav navigation={navigation} active={active} collapsed={false} onNavigate={navigate} />
          </div>
          <div className="border-t border-sidebar-border/70 p-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.035] p-2.5 ring-1 ring-white/[0.06]">
              <div className="grid size-9 place-items-center rounded-full bg-sidebar-accent text-[11px] font-semibold text-sidebar-primary">
                {initialsOf(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-white">{user.name}</p>
                <p className="truncate text-[10.5px] text-sidebar-foreground/45">{user.role}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                aria-label="Sign out"
                className="grid size-7 place-items-center rounded-md text-sidebar-foreground/40 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <SignOut className="size-4" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ——— Main column ——— */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-md">
          <div className="flex h-[76px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid size-9 place-items-center rounded-lg text-muted-foreground ring-1 ring-border transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Open navigation"
            >
              <List className="size-4.5" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/80 uppercase">
                <span className="hidden sm:inline">{workspace}</span>
                <span className="hidden h-px w-4 bg-border sm:inline" />
                <span className="truncate">{eyebrow}</span>
              </p>
              <h1 className="mt-0.5 truncate font-display text-[23px] leading-tight text-foreground sm:text-[26px]">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[12px] text-muted-foreground shadow-[0_1px_0_rgba(19,31,27,0.03)] transition-colors hover:border-foreground/20 hover:text-foreground md:flex"
              >
                <MagnifyingGlass className="size-3.5" />
                <span className="pr-6">{searchLabel}</span>
                <Kbd className="h-5 border-border bg-muted px-1.5 font-mono text-[10px]">⌘K</Kbd>
              </button>

              {onRefresh && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onRefresh}
                      className="size-9 rounded-lg border-border bg-card"
                      aria-label="Refresh data"
                    >
                      <ArrowRight
                        className={cn('size-4 rotate-[-90deg]', refreshing && 'animate-spin')}
                        weight="bold"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh data</TooltipContent>
                </Tooltip>
              )}

              {actions}

              <div className="mx-0.5 hidden h-6 w-px bg-border sm:block" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-muted sm:pr-2"
                  >
                    <span className="grid size-8 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground ring-1 ring-border">
                      {initialsOf(user.name)}
                    </span>
                    <span className="hidden text-left sm:block">
                      <span className="block max-w-[132px] truncate text-[12px] font-semibold leading-tight">
                        {user.name}
                      </span>
                      <span className="block text-[10px] leading-tight text-muted-foreground">{user.role}</span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-[12px] font-semibold">{user.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{user.email || user.role}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onLogout} className="gap-2 text-[12.5px]">
                    <SignOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {description && (
            <p className="-mt-0.5 hidden border-t border-border/60 px-4 py-2.5 text-[12px] text-muted-foreground sm:block sm:px-6 lg:px-8">
              {description}
            </p>
          )}
        </header>

        <main className={cn('flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8', contentClassName)}>{children}</main>

        <footer className="mt-auto flex items-center justify-between border-t border-border/70 px-4 py-3 text-[10.5px] text-muted-foreground/70 sm:px-6 lg:px-8">
          <span>Unity Hospital · Main Campus</span>
          <span className="font-mono tracking-wide">EST. 2011</span>
        </footer>
      </div>

      {/* ——— Command palette ——— */}
      <CommandDialog
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        title="Console search"
        description="Jump to a workspace or run a quick action"
        className="sm:max-w-[520px]"
      >
        <Command>
          <CommandInput placeholder="Jump to a workspace or run a command..." />
          <CommandList className="max-h-[360px]">
            <CommandEmpty>No matching workspace.</CommandEmpty>
            <CommandGroup heading="Workspaces">
              {flatNav.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.id}`}
                  onSelect={() => navigate(item.id)}
                  className="gap-2.5 py-2"
                >
                  <item.icon className="size-4 text-muted-foreground" />
                  <span>{item.label}</span>
                  {item.id === active && <CommandShortcut>current</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              {onRefresh && (
                <CommandItem
                  value="refresh reload data"
                  onSelect={() => {
                    onRefresh();
                    setPaletteOpen(false);
                  }}
                  className="gap-2.5 py-2"
                >
                  <ArrowRight className="size-4 rotate-[-90deg] text-muted-foreground" />
                  <span>Refresh live data</span>
                </CommandItem>
              )}
              <CommandItem value="sign out logout" onSelect={onLogout} className="gap-2.5 py-2">
                <SignOut className="size-4 text-muted-foreground" />
                <span>Sign out</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
          <div className="flex items-center gap-2 border-t border-border px-3 py-2 text-[10.5px] text-muted-foreground">
            <CommandIcon className="size-3.5" />
            <span>Tip: press</span>
            <Kbd className="h-5 px-1.5 font-mono text-[10px]">⌘K</Kbd>
            <span>anywhere to reopen</span>
          </div>
        </Command>
      </CommandDialog>
    </div>
  );
}
