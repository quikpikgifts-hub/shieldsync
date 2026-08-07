import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";

const HIGHLIGHTS = [
  "Generate a professional report in under a minute",
  "120+ templates across security, fleet, HR, and compliance",
  "Trusted by 400+ safety and operations teams",
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_10%,rgba(37,99,235,0.35),transparent_60%)]" />
        <Link href="/" className="relative">
          <Logo className="text-primary-foreground" />
        </Link>
        <div className="relative">
          <p className="text-balance font-display text-3xl font-semibold leading-tight">
            Professional documentation, generated in minutes.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-primary-foreground/80">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/50">© {new Date().getFullYear()} Veridian AI, Inc.</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
        <Link href="/" className="mb-10 lg:hidden">
          <Logo />
        </Link>
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>
    </div>
  );
}
