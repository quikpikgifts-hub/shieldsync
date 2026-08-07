import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsShell } from "@/components/docs/docs-shell";
import { docsContent } from "@/data/content";

export function generateStaticParams() {
  return Object.keys(docsContent).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = docsContent[slug];
  if (!doc) return {};
  return { title: doc.title, description: doc.description };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = docsContent[slug];
  if (!doc) notFound();

  return (
    <DocsShell activeSlug={slug}>
      <article className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{doc.title}</h1>
        <p className="mt-3 text-base text-muted-foreground">{doc.description}</p>
        <div className="mt-10 flex flex-col gap-8">
          {doc.body.map((section) => (
            <div key={section.heading}>
              <h2 className="font-display text-xl font-semibold">{section.heading}</h2>
              <div className="mt-3 flex flex-col gap-3">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>
    </DocsShell>
  );
}
