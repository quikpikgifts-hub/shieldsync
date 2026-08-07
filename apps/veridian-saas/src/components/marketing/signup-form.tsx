"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    window.setTimeout(() => router.push("/dashboard"), 600);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="first-name">First name</Label>
          <Input id="first-name" required placeholder="Jordan" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="last-name">Last name</Label>
          <Input id="last-name" required placeholder="Smith" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="company">Company</Label>
        <Input id="company" required placeholder="Acme Security Group" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" type="email" required placeholder="you@company.com" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required minLength={8} placeholder="At least 8 characters" />
      </div>
      <Button type="submit" className="mt-1 w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Creating account..." : "Create free account"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        By signing up, you agree to our{" "}
        <a href="/legal/terms" className="underline hover:text-accent">
          Terms
        </a>{" "}
        and{" "}
        <a href="/legal/privacy" className="underline hover:text-accent">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
