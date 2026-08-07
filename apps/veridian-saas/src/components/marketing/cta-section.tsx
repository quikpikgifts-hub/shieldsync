import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function CtaSection() {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground sm:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(37,99,235,0.35),transparent_70%)]" />
        <div className="relative">
          <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Your next report shouldn&apos;t take an afternoon.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-base text-primary-foreground/75">
            Join security, fleet, and compliance teams generating professional documentation in minutes with Veridian AI.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Generate My First Report <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/25 text-primary-foreground hover:border-primary-foreground hover:text-primary-foreground">
              <Link href="/contact">Book a Demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
