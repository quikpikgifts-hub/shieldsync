import Link from "next/link";
import { cn } from "@/lib/utils";
import { docsNav } from "@/data/content";
import type { ReactNode } from "react";

export function DocsShell({ activeSlug, children }: { activeSlug?: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[240px_1fr] lg:px-8 lg:py-16">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <nav className="flex flex-col gap-6">
          {docsNav.map((section) => (
            <div key={section.slug}>
              <div className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </div>
              <div className="mt-2 flex flex-col gap-0.5">
                {section.pages.map((page) => (
                  <Link
                    key={page.slug}
                    href={`/docs/${page.slug}`}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm transition",
                      activeSlug === page.slug
                        ? "bg-accent-soft font-medium text-accent"
                        : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {page.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
