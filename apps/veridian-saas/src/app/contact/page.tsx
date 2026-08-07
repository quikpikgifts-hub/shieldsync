import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { ContactForm } from "@/components/marketing/contact-form";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the Veridian AI team or request a personalized demo for your organization.",
};

const CONTACT_METHODS = [
  { icon: Mail, title: "Email us", value: "hello@veridian.ai", description: "General questions & partnerships" },
  { icon: MessageCircle, title: "Sales", value: "sales@veridian.ai", description: "Enterprise & custom pricing" },
  { icon: MapPin, title: "Headquarters", value: "Austin, Texas", description: "Remote-first, serving customers nationwide" },
];

export default function ContactPage() {
  return (
    <section className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1fr_1.3fr] lg:px-8">
      <div>
        <SectionHeading
          align="left"
          eyebrow="Contact"
          title="Let's talk about your reporting workflow"
          description="Book a personalized walkthrough, or reach out with questions about pricing, security, or implementation."
        />
        <div className="mt-10 flex flex-col gap-4">
          {CONTACT_METHODS.map((method) => (
            <div key={method.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <method.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{method.title}</div>
                <div className="text-sm text-accent">{method.value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{method.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Reveal>
        <Card className="p-8">
          <h2 className="font-display text-xl font-semibold">Request a demo</h2>
          <p className="mt-1 text-sm text-muted-foreground">We typically respond within one business day.</p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </Card>
      </Reveal>
    </section>
  );
}
