"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { notifications } from "@/data/dashboard";
import { cn } from "@/lib/utils";

export function DashboardTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [notifOpen, setNotifOpen] = React.useState(false);
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border lg:hidden cursor-pointer"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search reports, clients, templates..." className="pl-10" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-2xl border border-border bg-popover p-2 shadow-xl">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notifications
              </div>
              <div className="flex max-h-80 flex-col overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={cn("rounded-xl px-3 py-2.5", n.unread && "bg-accent-soft/50")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{n.time}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <Link
          href="/dashboard/settings"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent"
        >
          JS
        </Link>
      </div>
    </header>
  );
}
