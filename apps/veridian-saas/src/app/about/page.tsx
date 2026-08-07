import type { Metadata } from "next";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CtaSection } from "@/components/marketing/cta-section";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { Icon } from "@/components/icon";

export const metadata: Metadata = {
  title: "About",
  description: "Veridian AI's mission is to help organizations create professional safety and operations documentation in minutes.",
};

const VALUES = [
  { icon: "ShieldCheck", title: "Documentation you can defend", description: "Every report is generated against vetted, industry-reviewed templates — never a raw, unstructured model output." },
  { icon: "Users", title: "Built for the people who write these reports", description: "We design around shift supervisors, drivers, and HR staff — not just the administrators who buy the software." },
  { icon: "Lock", title: "Enterprise-grade by default", description: "Role-based access, audit logs, and encryption are standard on every plan, not an enterprise-only upsell." },
];

const TIMELINE = [
  { year: "2023", title: "Founded", description: "Started by former security operators frustrated by inconsistent, slow incident reporting." },
  { year: "2024", title: "First 100 customers", description: "Security companies and regional fleets adopt Veridian AI to standardize reporting across sites." },
  { year: "2025", title: "Compliance & HR expansion", description: "OSHA reporting, HR investigations, and business continuity planning join the platform." },
  { year: "2026", title: "Enterprise & API", description: "SSO, custom AI models, and API access ship for multi-site and government customers." },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 pb-8 pt-20 text-center lg:px-8">
        <SectionHeading
          eyebrow="About Veridian AI"
          title="We think safety documentation deserves better than a blank Word doc"
          description="Veridian AI was built by people who've filled out these reports themselves — on a clipboard, at 2am, after an incident nobody wanted to write about."
        />
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <Reveal>
          <div className="rounded-3xl border border-border bg-secondary/30 p-10 text-center">
            <p className="text-balance font-display text-2xl font-medium leading-relaxed sm:text-3xl">
              &ldquo;Our mission is to empower organizations to create professional safety, security, HR, fleet,
              and compliance documentation in minutes using AI.&rdquo;
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <SectionHeading eyebrow="What we believe" title="Principles behind the product" />
        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {VALUES.map((value) => (
            <RevealItem key={value.title}>
              <div className="h-full rounded-2xl border border-border bg-card p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon name={value.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="border-y border-border bg-secondary/30 py-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <SectionHeading eyebrow="Our story" title="From a clipboard problem to a platform" />
          <div className="mt-14 flex flex-col gap-8">
            {TIMELINE.map((item, i) => (
              <Reveal key={item.year} delay={i * 0.05}>
                <div className="flex gap-6">
                  <div className="w-16 shrink-0 font-display text-lg font-bold text-accent">{item.year}</div>
                  <div className="border-l border-border pl-6">
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="careers" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-24 text-center lg:px-8">
        <SectionHeading
          eyebrow="Careers"
          title="We're hiring across engineering, sales, and customer success"
          description="Veridian AI is a remote-first team building for operators in security, fleet, and compliance. Open roles are posted as our next hiring round begins."
        />
        <a
          href="mailto:careers@veridian.ai"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
        >
          careers@veridian.ai
        </a>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <CtaSection />
      </section>
    </>
  );
}
