import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/marketing/auth-shell";
import { SignupForm } from "@/components/marketing/signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your free account"
      subtitle="2 free reports every month. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
