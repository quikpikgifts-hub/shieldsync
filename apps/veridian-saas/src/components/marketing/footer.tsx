"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { chromelessRoutes, footerNav } from "@/data/site";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Footer() {
  const pathname = usePathname();
  if (chromelessRoutes.some((route) => pathname?.startsWith(route))) return null;

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-6">
          <div className="col-span-2">
            <Logo className="text-foreground" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Professional safety. Smarter operations. Powered by AI.
            </p>
            <form className="mt-6 flex max-w-xs gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input type="email" required placeholder="Work email" aria-label="Email for newsletter" />
              <Button type="submit" size="sm" className="shrink-0">
                Subscribe
              </Button>
            </form>
          </div>

          <FooterCol title="Product" items={footerNav.product} />
          <FooterCol title="Resources" items={footerNav.resources} />
          <FooterCol title="Company" items={footerNav.company} />
          <FooterCol title="Legal" items={footerNav.legal} />
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Veridian AI, Inc. All rights reserved.</p>
          <p>SOC 2 Type II in progress · GDPR ready · Built for regulated operations</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-sm text-foreground/75 transition hover:text-accent">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
