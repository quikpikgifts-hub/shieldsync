import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-bold tracking-tight", className)}>
      <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path
            d="M12 2 L21 6 V12 C21 17 17.5 20.5 12 22 C6.5 20.5 3 17 3 12 V6 Z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <path
            d="M12 2 L21 6 V12 C21 17 17.5 20.5 12 22 C6.5 20.5 3 17 3 12 V6 Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M8.5 12.2 L11 14.7 L15.7 9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      Veridian AI
    </span>
  );
}
