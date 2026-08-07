import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DocsShell } from "@/components/docs/docs-shell";
import { docsNav } from "@/data/content";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Technical documentation for the Veridian AI platform and API.",
};

export default function DocsIndexPage() {
  return (
    <DocsShell>
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Documentation</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Everything you need to set up a workspace, understand how report generation works, and integrate
          Veridian AI with your existing systems.
        </p>
        <Link
          href="/docs/quickstart"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
        >
          Start the quickstart guide <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {docsNav.map((section) => (
          <div key={section.slug} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">{section.title}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {section.pages.map((page) => (
                <li key={page.slug}>
                  <Link href={`/docs/${page.slug}`} className="text-sm text-foreground/75 hover:text-accent">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </DocsShell>
  );
}
