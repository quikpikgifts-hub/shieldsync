import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, FileText, Newspaper, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { blogPosts, caseStudies, whitePapers } from "@/data/content";

export const metadata: Metadata = {
  title: "Resources",
  description: "Case studies, white papers, blog posts, and documentation for Veridian AI.",
};

const HUBS = [
  { icon: Newspaper, title: "Blog", description: "Research and best practices for safety and compliance teams.", href: "/blog" },
  { icon: BookOpen, title: "Documentation", description: "Setup guides, API reference, and integration docs.", href: "/docs" },
  { icon: FileText, title: "Case Studies", description: "How real operations teams use Veridian AI.", href: "#case-studies" },
  { icon: ShieldCheck, title: "Security & Trust", href: "#trust", description: "How Veridian AI protects your data." },
];

export default function ResourcesPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-20 lg:px-8">
        <SectionHeading
          eyebrow="Resources"
          title="Everything to help your team get more from Veridian AI"
          description="Case studies, white papers, product documentation, and research from our team and the operators we work with."
        />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HUBS.map((hub) => (
            <RevealItem key={hub.title}>
              <Link
                href={hub.href}
                className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <hub.icon className="h-5 w-5" />
                </div>
                <div className="font-semibold">{hub.title}</div>
                <p className="text-sm text-muted-foreground">{hub.description}</p>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section id="case-studies" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16 lg:px-8">
        <SectionHeading align="left" eyebrow="Case studies" title="Results from real operations teams" />
        <RevealGroup className="mt-10 grid gap-5 lg:grid-cols-3">
          {caseStudies.map((cs) => (
            <RevealItem key={cs.slug}>
              <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-6">
                <div className="w-fit rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                  {cs.result}
                </div>
                <h3 className="font-semibold leading-snug">{cs.title}</h3>
                <p className="mt-auto text-sm text-muted-foreground">{cs.org}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section id="white-papers" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16 lg:px-8">
        <SectionHeading align="left" eyebrow="White papers" title="In-depth research and frameworks" />
        <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2">
          {whitePapers.map((wp) => (
            <RevealItem key={wp.slug}>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6">
                <div>
                  <h3 className="font-semibold">{wp.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{wp.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <SectionHeading align="left" eyebrow="From the blog" title="Latest articles" />
        <RevealGroup className="mt-10 grid gap-5 lg:grid-cols-2">
          {blogPosts.slice(0, 4).map((post) => (
            <RevealItem key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-accent">{post.category}</div>
                  <div className="mt-1 text-sm font-semibold">{post.title}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section id="trust" className="border-y border-border bg-secondary/30 py-20">
        <div className="mx-auto max-w-4xl scroll-mt-24 px-6 text-center lg:px-8">
          <SectionHeading
            eyebrow="Security & trust"
            title="Enterprise-grade security by default"
            description="Role-based access control, full audit logging, and encryption in transit and at rest ship on every plan. Enterprise customers add SSO, custom data retention, and a signed DPA."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Common questions" />
        <div className="mt-14">
          <FaqSection />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <CtaSection />
      </section>
    </>
  );
}
