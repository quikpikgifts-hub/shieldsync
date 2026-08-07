import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && <Badge>{eyebrow}</Badge>}
      <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {description && (
        <p className={cn("text-balance text-base leading-relaxed text-muted-foreground sm:text-lg", align === "center" ? "max-w-2xl" : "max-w-xl")}>
          {description}
        </p>
      )}
    </div>
  );
}
