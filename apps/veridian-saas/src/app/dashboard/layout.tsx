"use client";

import * as React from "react";
import { X } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <div className="fixed h-screen w-64">
          <DashboardSidebar />
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <DashboardSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <div className="sticky top-0 z-30">
          <DashboardTopbar onMenuClick={() => setMobileOpen(true)} />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
