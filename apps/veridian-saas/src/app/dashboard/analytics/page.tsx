import { Clock, FileCheck2, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Trends across report volume, categories, and turnaround time.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total reports (YTD)" value="353" change="+24% YoY" trend="up" icon={FileText} />
        <StatCard label="Approval rate" value="96%" change="+3pts" trend="up" icon={FileCheck2} />
        <StatCard label="Avg. time to approval" value="4.2h" change="-31% vs last quarter" trend="up" icon={Clock} />
        <StatCard label="Active contributors" value="14" icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reports generated</CardTitle>
          </CardHeader>
          <CardContent>
            <UsageChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reports by category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
