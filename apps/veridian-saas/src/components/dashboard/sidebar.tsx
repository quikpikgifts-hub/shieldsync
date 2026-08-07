"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
];

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
      </div>

      <div className="px-4">
        <Button asChild className="w-full">
          <Link href="/dashboard/generate" onClick={onNavigate}>
            <Sparkles className="h-4 w-4" /> Generate Report
          </Link>
        </Button>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-accent-soft text-accent" : "text-sidebar-foreground/70 hover:bg-secondary/60 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-xl border border-sidebar-border bg-secondary/30 p-4">
          <div className="text-xs font-semibold">Professional plan</div>
          <div className="mt-1 text-xs text-muted-foreground">Unlimited reports · Cloud storage</div>
          <Link href="/pricing" className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">
            Manage plan
          </Link>
        </div>
      </div>
    </div>
  );
}
