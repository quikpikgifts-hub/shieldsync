const LOGO_LABELS = [
  "Sentinel Security Group",
  "Metro PD",
  "Apex Fleet Logistics",
  "Harborview Properties",
  "Cascade Manufacturing",
  "Union County Schools",
  "Gracepoint Churches Network",
  "Northline Transit Authority",
];

export function LogoCloud() {
  return (
    <div className="border-y border-border bg-secondary/30 py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Trusted by security, fleet, and compliance teams nationwide
        </p>
        <div className="mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee items-center gap-14">
            {[...LOGO_LABELS, ...LOGO_LABELS].map((label, i) => (
              <span
                key={i}
                className="shrink-0 font-display text-lg font-semibold tracking-tight text-foreground/35"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
