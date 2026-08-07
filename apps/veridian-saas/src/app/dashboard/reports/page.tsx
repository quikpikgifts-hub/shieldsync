"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { recentReports } from "@/data/dashboard";

const FILTERS = ["All", "Completed", "In Review", "Draft"] as const;

export default function ReportsPage() {
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = React.useState("");

  const filtered = recentReports.filter((r) => {
    const matchesFilter = filter === "All" || r.status === filter;
    const matchesQuery = r.title.toLowerCase().includes(query.toLowerCase()) || r.site.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Every report generated across your workspace.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/generate">
            <Sparkles className="h-4 w-4" /> Generate Report
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as (typeof FILTERS)[number])}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f} value={f}>
                {f}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Report</th>
                  <th className="px-6 py-3 font-medium">Site</th>
                  <th className="px-6 py-3 font-medium">Author</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((report) => (
                  <tr key={report.id} className="border-b border-border last:border-b-0 hover:bg-secondary/30">
                    <td className="px-6 py-4">
                      <div className="font-medium">{report.title}</div>
                      <div className="text-xs text-muted-foreground">{report.type}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{report.site}</td>
                    <td className="px-6 py-4 text-muted-foreground">{report.author}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-muted-foreground">{report.updated}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      No reports match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
