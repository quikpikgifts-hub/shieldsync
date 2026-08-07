import type { Metadata } from "next";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CtaSection } from "@/components/marketing/cta-section";
import { RevealGroup, RevealItem, Reveal } from "@/components/marketing/reveal";
import { Icon } from "@/components/icon";
import { AiDemo } from "@/components/marketing/ai-demo";
import { featureGroups } from "@/data/site";

export const metadata: Metadata = {
  title: "Features",
  description: "The complete Veridian AI feature set: report generation, templates, workflow automation, and enterprise controls.",
};

export default function FeaturesPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-20 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to run documentation like a system, not a scramble"
          description="From the AI report generator to audit logs, every feature exists to make your organization's paperwork consistent, fast, and defensible."
        />
      </section>

      <section id="report-generator" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-12 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-accent">AI Report Generator</div>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                Answer a few questions. Get a finished report.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Veridian AI turns a five-step guided interview into a fully structured document — findings,
                recommendations, and formatting included. Every draft is generated against a vetted template for
                your report type, so nothing is invented from a blank prompt.
              </p>
              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {["Guided interview, not a blank editor", "Editable preview before export", "PDF, email, and save to workspace", "Consistent formatting every time"].map(
                  (item) => (
                    <li key={item} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="flex justify-center">
            <AiDemo />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="flex flex-col gap-16">
          {featureGroups.map((group) => (
            <div key={group.title}>
              <Reveal className="mb-8">
                <h3 className="font-display text-xl font-semibold">{group.title}</h3>
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">{group.blurb}</p>
              </Reveal>
              <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <RevealItem key={item.title}>
                    <div className="h-full rounded-2xl border border-border bg-card p-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
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

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <CtaSection />
      </section>
    </>
  );
}
