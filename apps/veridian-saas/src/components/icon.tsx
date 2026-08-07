import { icons, type LucideProps } from "lucide-react";

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = icons[name as keyof typeof icons];
  if (!Cmp) return null;
  return <Cmp {...props} />;
}
