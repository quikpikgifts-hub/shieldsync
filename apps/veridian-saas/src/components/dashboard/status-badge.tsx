import { Badge } from "@/components/ui/badge";

const VARIANT: Record<string, "success" | "default" | "outline"> = {
  Completed: "success",
  "In Review": "default",
  Draft: "outline",
  Active: "success",
  Trial: "default",
  Paid: "success",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANT[status] ?? "outline"}>{status}</Badge>;
}
