import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="August 1, 2026"
      sections={[
        {
          heading: "Overview",
          body: "This is placeholder legal content for demonstration purposes. Veridian AI's actual terms of service will govern use of the platform, subscription billing, and acceptable use.",
        },
        {
          heading: "Accounts",
          body: "You are responsible for maintaining the security of your account credentials and for all activity under your workspace.",
        },
        {
          heading: "Subscriptions & billing",
          body: "Paid plans are billed monthly or annually in advance. You may cancel at any time; access continues through the end of the current billing period.",
        },
        {
          heading: "Contact",
          body: "Questions about these terms can be directed to legal@veridian.ai.",
        },
      ]}
    />
  );
}
