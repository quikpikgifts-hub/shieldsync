"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { reportTypes } from "@/data/site";

const CATEGORIES = ["All", ...Array.from(new Set(reportTypes.map((r) => r.category)))];

export default function TemplatesPage() {
  const [category, setCategory] = React.useState("All");
  const filtered = category === "All" ? reportTypes : reportTypes.filter((r) => r.category === category);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">Every report template available in your workspace.</p>
      </div>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="flex-wrap">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c}>
              {c}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <Link
            key={template.id}
            href={`/dashboard/generate?report=${template.id}`}
            className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-accent">{template.category}</div>
              <h3 className="mt-1 font-semibold">{template.label}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{template.summary}</p>
            </div>
            <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-accent">
              Use template <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
