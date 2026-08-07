"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    window.setTimeout(() => router.push("/dashboard"), 600);
  }

  return (
    <div className="flex flex-col gap-5">
      <Button type="button" variant="outline" className="w-full" onClick={() => setLoading(true)}>
        <GoogleIcon /> Continue with Google
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" required placeholder="you@company.com" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-xs font-medium text-accent hover:underline">
              Forgot password?
            </a>
          </div>
          <Input id="password" type="password" required placeholder="••••••••" />
        </div>
        <Button type="submit" className="mt-1 w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.6 5.6 0 0 1-2.4 3.63v3h3.86c2.26-2.09 3.56-5.17 3.56-8.87z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.86l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.33a7.2 7.2 0 0 1 0-4.66V6.58H1.29a12 12 0 0 0 0 10.84z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.58l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}
