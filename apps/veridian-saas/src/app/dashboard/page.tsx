import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { recentReports, recentActivity } from "@/data/dashboard";
import { reportTypes } from "@/data/site";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Good morning, Jordan</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Reports this month" value="61" change="+18% vs last month" trend="up" icon={FileText} />
        <StatCard label="Avg. generation time" value="41s" change="-12% vs last month" trend="up" icon={TrendingUp} />
        <StatCard label="Active team members" value="14" change="+2 this month" trend="up" icon={Users} />
        <StatCard label="Templates used" value="9 / 12" icon={Sparkles} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden bg-primary text-primary-foreground lg:col-span-1">
          <CardContent className="flex h-full flex-col p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-xl font-semibold">Generate a new report</h2>
            <p className="mt-2 flex-1 text-sm text-primary-foreground/70">
              Answer a short guided interview and get a finished, formatted report in under a minute.
            </p>
            <Button asChild variant="outline" className="mt-6 w-full border-white/20 bg-white text-primary hover:bg-white/90">
              <Link href="/dashboard/generate">
                Start generating <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Reports generated</CardTitle>
              <p className="text-sm text-muted-foreground">Last 6 months across your workspace</p>
            </div>
          </CardHeader>
          <CardContent>
            <UsageChart />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent reports</CardTitle>
            <Link href="/dashboard/reports" className="text-sm font-medium text-accent hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <tbody>
                  {recentReports.slice(0, 5).map((report) => (
                    <tr key={report.id} className="border-t border-border first:border-t-0">
                      <td className="px-6 py-3.5">
                        <div className="font-medium">{report.title}</div>
                        <div className="text-xs text-muted-foreground">{report.type}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right text-xs text-muted-foreground">{report.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage this month</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reports generated</span>
                <span className="font-medium">61 / Unlimited</span>
              </div>
              <Progress value={61} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Team seats used</span>
                <span className="font-medium">14 / 20</span>
              </div>
              <Progress value={70} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Storage</span>
                <span className="font-medium">2.1 GB / 50 GB</span>
              </div>
              <Progress value={4} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Saved templates</CardTitle>
            <Link href="/dashboard/templates" className="text-sm font-medium text-accent hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {reportTypes.slice(0, 4).map((template) => (
              <Link
                key={template.id}
                href={`/dashboard/generate?report=${template.id}`}
                className="flex items-start gap-3 rounded-xl border border-border p-4 transition hover:border-accent/40 hover:bg-secondary/40"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{template.label}</div>
                  <div className="text-xs text-muted-foreground">{template.category}</div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 text-sm">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <div>
                  <span className="font-medium">{item.actor}</span>{" "}
                  <span className="text-muted-foreground">{item.action}</span>{" "}
                  <span className="font-medium">{item.target}</span>
                  <div className="text-xs text-muted-foreground">{item.time}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
