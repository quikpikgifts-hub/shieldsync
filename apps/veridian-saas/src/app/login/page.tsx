import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/marketing/auth-shell";
import { LoginForm } from "@/components/marketing/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to generate and manage your reports."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-accent hover:underline">
            Sign up for free
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
