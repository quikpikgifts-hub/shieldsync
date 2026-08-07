import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="August 1, 2026"
      sections={[
        {
          heading: "Overview",
          body: "This is placeholder legal content for demonstration purposes. Veridian AI's actual privacy policy will describe what data we collect, how it's used, and the rights available to you under applicable law.",
        },
        {
          heading: "Data we collect",
          body: "Account information, workspace content you generate, and usage analytics used to operate and improve the platform.",
        },
        {
          heading: "How we use data",
          body: "To provide the service, secure your account, and — only with your consent — to communicate product updates.",
        },
        {
          heading: "Contact",
          body: "Questions about this policy can be directed to privacy@veridian.ai.",
        },
      ]}
    />
  );
}
