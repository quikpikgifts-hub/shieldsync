"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { chromelessRoutes, mainNav, solutionsNav } from "@/data/site";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [solutionsOpen, setSolutionsOpen] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close mobile menu on route change
    setOpen(false);
  }, [pathname]);

  if (chromelessRoutes.some((route) => pathname?.startsWith(route))) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <Logo className="text-foreground" />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <button
              className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-secondary hover:text-foreground cursor-pointer"
              aria-expanded={solutionsOpen}
            >
              Solutions
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", solutionsOpen && "rotate-180")} />
            </button>
            {solutionsOpen && (
              <div className="absolute left-1/2 top-full w-[420px] -translate-x-1/2 pt-3">
                <div className="grid gap-1 rounded-2xl border border-border bg-popover p-3 shadow-xl">
                  {solutionsNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-xl p-3 transition hover:bg-secondary"
                    >
                      <div className="text-sm font-semibold text-foreground">{item.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{item.description}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {mainNav.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-secondary hover:text-foreground",
                pathname === item.href && "text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition hover:bg-secondary hover:text-foreground">
            Log in
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">
              Generate My First Report <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border cursor-pointer"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/85 hover:bg-secondary">
                {item.label}
              </Link>
            ))}
            <div className="my-2 border-t border-border" />
            <div className="grid grid-cols-1 gap-1">
              {solutionsNav.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">
                  <Icon name="ArrowRight" className="h-3 w-3" /> {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Button asChild variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Generate My First Report</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
