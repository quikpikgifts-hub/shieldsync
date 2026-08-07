import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CtaSection } from "@/components/marketing/cta-section";
import { blogPosts } from "@/data/content";
import { site } from "@/data/site";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article" },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author.name },
    publisher: { "@type": "Organization", name: site.name },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
        </Link>

        <div className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-accent">
          <span>{post.category}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="text-muted-foreground">{post.readTime}</span>
        </div>
        <h1 className="mt-4 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-6 flex items-center gap-3 border-b border-border pb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
            {post.author.initials}
          </div>
          <div>
            <div className="text-sm font-medium">{post.author.name}</div>
            <div className="text-xs text-muted-foreground">
              {post.author.role} ·{" "}
              {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6">
          {post.body.map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-foreground/85">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <CtaSection />
      </section>
    </>
  );
}
