import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="font-display text-sm font-semibold text-accent">404</span>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">
          Back to home <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
