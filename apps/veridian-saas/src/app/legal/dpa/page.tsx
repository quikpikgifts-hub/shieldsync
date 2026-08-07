import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Data Processing Addendum" };

export default function DpaPage() {
  return (
    <LegalPage
      title="Data Processing Addendum"
      updated="August 1, 2026"
      sections={[
        {
          heading: "Overview",
          body: "This is placeholder legal content for demonstration purposes. Enterprise customers can request a signed Data Processing Addendum (DPA) covering data handling, subprocessors, and international transfer mechanisms.",
        },
        {
          heading: "Requesting a signed DPA",
          body: "Contact your account team or legal@veridian.ai to request an executed DPA for your organization.",
        },
      ]}
    />
  );
}
