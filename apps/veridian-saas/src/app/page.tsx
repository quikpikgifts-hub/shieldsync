import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AiDemo } from "@/components/marketing/ai-demo";
import { LogoCloud } from "@/components/marketing/logo-cloud";
import { SectionHeading } from "@/components/marketing/section-heading";
import { PricingSection } from "@/components/marketing/pricing-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { Icon } from "@/components/icon";
import { featureGroups, industries } from "@/data/site";

const HOW_IT_WORKS = [
  { step: "01", title: "Choose your report", description: "Pick from 120+ security, fleet, HR, and compliance templates." },
  { step: "02", title: "Answer a short interview", description: "Five to ten guided questions replace a blank page." },
  { step: "03", title: "AI drafts your document", description: "Findings, structure, and recommendations, generated in under a minute." },
  { step: "04", title: "Review the preview", description: "Edit any section before it's finalized — nothing ships unreviewed." },
  { step: "05", title: "Export & share", description: "Download as PDF, email it directly, or store it in your workspace." },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-8 lg:py-28">
          <div className="flex flex-col items-start gap-6">
            <Badge>Trusted by 400+ safety &amp; operations teams</Badge>
            <h1 className="text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
              AI-Powered Safety &amp; Operations Platform
            </h1>
            <p className="text-balance max-w-xl text-lg leading-relaxed text-muted-foreground">
              Generate professional security, HR, fleet, emergency management, and operational reports in
              minutes—not days.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Generate My First Report <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">
                  <PlayCircle className="h-4 w-4" /> Book a Demo
                </Link>
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-6 text-xs text-muted-foreground">
              <span>No credit card required</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>2 free reports every month</span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <AiDemo />
          </div>
        </div>
      </section>

      <LogoCloud />

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <SectionHeading
          eyebrow="Platform"
          title="Every operational document, one AI workflow"
          description="Veridian AI replaces a folder of stale Word templates with a single guided generator your whole organization can trust."
        />
        <div className="mt-16 flex flex-col gap-16">
          {featureGroups.map((group) => (
            <div key={group.title}>
              <Reveal className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold">{group.title}</h3>
                  <p className="mt-1 max-w-lg text-sm text-muted-foreground">{group.blurb}</p>
                </div>
              </Reveal>
              <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <RevealItem key={item.title}>
                    <div className="group h-full rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-accent-foreground">
                        <Icon name={item.icon} className="h-5 w-5" />
                      </div>
                      <h4 className="mt-4 font-semibold">{item.title}</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            eyebrow="How it works"
            title="From blank page to finished report in five steps"
            description="No prompt engineering, no formatting. Just answer questions about what happened, and Veridian AI structures the rest."
          />
          <div className="mt-16 grid gap-6 lg:grid-cols-5">
            {HOW_IT_WORKS.map((item, i) => (
              <Reveal key={item.step} delay={i * 0.06}>
                <div className="relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-6">
                  <span className="font-display text-3xl font-bold text-accent/30">{item.step}</span>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <SectionHeading
          eyebrow="Industries"
          title="Built for every team that answers for safety"
          description="From single-site guard companies to multi-state fleets, Veridian AI adapts its templates to how your industry actually documents risk."
        />
        <RevealGroup className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {industries.map((industry) => (
            <RevealItem key={industry.slug}>
              <Link
                href={`/industries#${industry.slug}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon name={industry.icon} className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{industry.name}</div>
                  <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{industry.description}</div>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
        <div className="mt-8 flex justify-center">
          <Button asChild variant="ghost">
            <Link href="/industries">
              View all industries <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading eyebrow="Customers" title="Operators trust Veridian with their name on the report" />
          <div className="mt-14">
            <TestimonialsSection limit={3} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple plans that scale with your operation"
          description="Start free. Upgrade when your team needs unlimited reports, branding, or enterprise controls."
        />
        <div className="mt-14">
          <PricingSection />
        </div>
        <div className="mt-8 flex justify-center">
          <Button asChild variant="ghost">
            <Link href="/pricing">
              Compare all plans <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <CtaSection />
      </section>
    </>
  );
}
