import { BookOpen, LifeBuoy, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/components/marketing/contact-form";
import { FaqSection } from "@/components/marketing/faq-section";
import Link from "next/link";

const CHANNELS = [
  { icon: MessageCircle, title: "Live chat", description: "Chat with our support team, 9am–7pm ET.", cta: "Start chat" },
  { icon: BookOpen, title: "Documentation", description: "Guides for setup, templates, and the API.", cta: "Browse docs", href: "/docs" },
  { icon: LifeBuoy, title: "Priority support", description: "Available on Business and Enterprise plans.", cta: "Upgrade plan", href: "/pricing" },
];

export default function SupportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground">Get help from our team or browse the knowledge base.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map((channel) => (
          <Card key={channel.title}>
            <CardContent className="flex flex-col gap-3 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <channel.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{channel.title}</h3>
              <p className="flex-1 text-sm text-muted-foreground">{channel.description}</p>
              <Link href={channel.href ?? "#"} className="text-sm font-semibold text-accent hover:underline">
                {channel.cta}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact support</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Frequently asked questions</CardTitle>
          </CardHeader>
          <CardContent>
            <FaqSection />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
