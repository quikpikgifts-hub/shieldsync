import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { Reveal } from "@/components/marketing/reveal";
import { pricingTiers } from "@/data/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for security, fleet, HR, and compliance teams of every size.",
};

const COMPARISON_ROWS: { label: string; values: (boolean | string)[] }[] = [
  { label: "Reports per month", values: ["2", "Unlimited", "Unlimited", "Unlimited"] },
  { label: "AI report generator", values: [true, true, true, true] },
  { label: "PDF export", values: [true, true, true, true] },
  { label: "Cloud storage", values: [false, true, true, true] },
  { label: "Team accounts & roles", values: [false, false, true, true] },
  { label: "Custom branding", values: [false, false, true, true] },
  { label: "Analytics dashboard", values: [false, false, true, true] },
  { label: "Workflow automation", values: [false, false, true, true] },
  { label: "API access", values: [false, false, false, true] },
  { label: "Custom AI models", values: [false, false, false, true] },
  { label: "Dedicated support & SLA", values: [false, false, false, true] },
];

export default function PricingPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-20 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Plans built for one officer or one thousand"
          description="Every plan includes the full AI report generator. Upgrade for volume, collaboration, and enterprise controls."
        />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PricingSection />
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8">
        <Reveal>
          <h2 className="text-center font-display text-2xl font-semibold">Compare plans</h2>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="p-4 text-left font-semibold">Feature</th>
                  {pricingTiers.map((tier) => (
                    <th key={tier.name} className="p-4 text-left font-semibold">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                    <td className="p-4 text-muted-foreground">{row.label}</td>
                    {row.values.map((value, idx) => (
                      <td key={idx} className="p-4">
                        {typeof value === "string" ? (
                          <span className="font-medium">{value}</span>
                        ) : value ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Minus className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      <section className="border-y border-border bg-secondary/30 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />
          <div className="mt-14">
            <FaqSection />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <CtaSection />
      </section>
    </>
  );
}
