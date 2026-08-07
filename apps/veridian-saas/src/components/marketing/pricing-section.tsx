import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pricingTiers } from "@/data/site";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/reveal";

export function PricingSection() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {pricingTiers.map((tier, i) => (
        <Reveal key={tier.name} delay={i * 0.06}>
          <Card
            className={cn(
              "flex h-full flex-col p-7",
              tier.highlighted && "border-accent/60 shadow-[0_0_0_1px_var(--accent)] ring-1 ring-accent/20"
            )}
          >
            {tier.highlighted && (
              <span className="mb-4 inline-flex w-fit rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                Most popular
              </span>
            )}
            <h3 className="font-display text-lg font-semibold">{tier.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold tracking-tight">{tier.price}</span>
              {tier.period && <span className="text-sm text-muted-foreground">{tier.period}</span>}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>
            <ul className="mt-6 flex flex-1 flex-col gap-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-foreground/85">{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8" variant={tier.highlighted ? "default" : "outline"}>
              <Link href={tier.href}>{tier.cta}</Link>
            </Button>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}
