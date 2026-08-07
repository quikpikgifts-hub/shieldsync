export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
      <div className="mt-10 flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="font-display text-lg font-semibold">{section.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
