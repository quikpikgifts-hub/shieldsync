import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition",
                i < current
                  ? "border-accent bg-accent text-accent-foreground"
                  : i === current
                    ? "border-accent text-accent"
                    : "border-border text-muted-foreground"
              )}
            >
              {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn("hidden text-xs font-medium sm:block", i <= current ? "text-foreground" : "text-muted-foreground")}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("mx-2 h-px flex-1 transition sm:mx-3", i < current ? "bg-accent" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}
