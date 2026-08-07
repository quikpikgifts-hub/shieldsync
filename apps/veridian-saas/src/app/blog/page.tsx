import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";
import { RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { blogPosts } from "@/data/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Research, best practices, and product updates from the Veridian AI team.",
};

export default function BlogIndexPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
      <SectionHeading
        eyebrow="Blog"
        title="Notes on safety, compliance, and operations"
        description="Research and best practices from the Veridian AI team and the operators we work with."
      />

      <RevealGroup className="mt-14 grid gap-8 lg:grid-cols-2">
        {blogPosts.map((post) => (
          <RevealItem key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-7 transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
            >
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-accent">
                <span>{post.category}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-muted-foreground">{post.readTime}</span>
              </div>
              <h2 className="mt-3 font-display text-xl font-semibold leading-snug">{post.title}</h2>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                    {post.author.initials}
                  </div>
                  <div>
                    <div className="text-xs font-medium">{post.author.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent" />
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
