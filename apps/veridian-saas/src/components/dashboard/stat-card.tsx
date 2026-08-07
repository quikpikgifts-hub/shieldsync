import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  change,
  trend,
  icon: IconCmp,
}: {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  icon: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <IconCmp className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 font-display text-2xl font-semibold">{value}</div>
      {change && (
        <div
          className={cn(
            "mt-1.5 flex items-center gap-1 text-xs font-medium",
            trend === "down" ? "text-destructive" : "text-success"
          )}
        >
          {trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
          {change}
        </div>
      )}
    </Card>
  );
}
