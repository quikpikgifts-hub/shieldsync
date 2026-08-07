import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CtaSection } from "@/components/marketing/cta-section";
import { Reveal } from "@/components/marketing/reveal";
import { Icon } from "@/components/icon";

export const metadata: Metadata = {
  title: "Solutions",
  description: "AI-generated security, fleet, HR, and compliance documentation for every operational team.",
};

const SOLUTIONS = [
  {
    id: "security",
    icon: "ShieldAlert",
    name: "Security Operations",
    summary: "Standardize incident reports, risk assessments, and patrol documentation across every site and shift.",
    points: [
      "Security risk assessments with prioritized mitigations",
      "Incident reports with timeline reconstruction",
      "Post orders and site security plans",
      "Church and school security plans",
    ],
  },
  {
    id: "fleet",
    icon: "Truck",
    name: "Fleet & Transportation",
    summary: "Keep every vehicle, driver, and route audit-ready with consistent inspection and incident reporting.",
    points: [
      "Vehicle inspection reports, pre- and post-trip",
      "Fleet safety reports across driver pools",
      "DOT-ready incident documentation",
      "Route and terminal risk assessments",
    ],
  },
  {
    id: "emergency",
    icon: "Siren",
    name: "Emergency Management",
    summary: "Turn emergency planning from a static PDF into a living, easy-to-update operational document.",
    points: [
      "Emergency action plans with role assignments",
      "Evacuation routes and communication trees",
      "Business continuity and recovery plans",
      "Drill logs and after-action reports",
    ],
  },
  {
    id: "hr",
    icon: "Users",
    name: "HR & Compliance",
    summary: "Give HR and compliance teams defensible, consistent documentation without a legal-writing background.",
    points: [
      "Employee investigation reports",
      "Corrective action documentation",
      "OSHA-mapped compliance reports",
      "Property and portfolio risk assessments",
    ],
  },
];

export default function SolutionsPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-20 lg:px-8">
        <SectionHeading
          eyebrow="Solutions"
          title="One AI platform, every operational document your team writes"
          description="Veridian AI organizes its templates around how security, fleet, emergency management, and HR teams actually work — not a generic form builder."
        />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-20">
          {SOLUTIONS.map((solution, i) => (
            <Reveal key={solution.id}>
              <div id={solution.id} className="grid scroll-mt-24 gap-10 lg:grid-cols-2 lg:items-center">
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <Icon name={solution.icon} className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 font-display text-2xl font-semibold sm:text-3xl">{solution.name}</h2>
                  <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">{solution.summary}</p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {solution.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-8">
                    <Link href="/signup">
                      Try {solution.name} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary/40 p-8">
                    <Badge className="mb-4">{solution.name}</Badge>
                    <div className="space-y-3">
                      {solution.points.map((point, idx) => (
                        <div
                          key={point}
                          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                          style={{ opacity: 1 - idx * 0.08 }}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
                            {idx + 1}
                          </span>
                          <span className="truncate text-sm">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <CtaSection />
      </section>
    </>
  );
}
