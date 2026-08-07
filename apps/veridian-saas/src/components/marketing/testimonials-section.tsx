import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { testimonials } from "@/data/site";
import { Reveal } from "@/components/marketing/reveal";

export function TestimonialsSection({ limit }: { limit?: number }) {
  const items = limit ? testimonials.slice(0, limit) : testimonials;
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((t, i) => (
        <Reveal key={t.name} delay={i * 0.05}>
          <Card className="flex h-full flex-col p-7">
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/85">“{t.quote}”</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                {t.initials}
              </div>
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.role} · {t.org}
                </div>
              </div>
            </div>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}
