import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { Icon } from "@/components/icon";
import { industries } from "@/data/site";

export const metadata: Metadata = {
  title: "Industries",
  description: "How security companies, fleets, schools, churches, and government agencies use Veridian AI.",
};

export default function IndustriesPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-20 lg:px-8">
        <SectionHeading
          eyebrow="Industries"
          title="Purpose-built templates for how your industry documents risk"
          description="Every industry on Veridian AI gets templates matched to its regulatory and operational reality — not a one-size-fits-all form."
        />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <RevealItem key={industry.slug}>
              <div
                id={industry.slug}
                className="flex h-full scroll-mt-24 flex-col gap-4 rounded-2xl border border-border bg-card p-7 transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon name={industry.icon} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{industry.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{industry.description}</p>
                </div>
                <Link
                  href="/signup"
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                >
                  Get started <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="border-y border-border bg-secondary/30 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading eyebrow="Proof" title="Trusted across every kind of operation" />
          <div className="mt-14">
            <TestimonialsSection />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <CtaSection />
      </section>
    </>
  );
}
