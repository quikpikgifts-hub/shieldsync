"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ContactForm() {
  const [status, setStatus] = React.useState<"idle" | "submitting" | "sent">("idle");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    window.setTimeout(() => setStatus("sent"), 900);
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-success/30 bg-success-soft p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <h3 className="font-display text-lg font-semibold">Request received</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          A Veridian AI advisor will reach out within one business day to schedule your demo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required placeholder="Jordan Smith" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" required placeholder="jordan@company.com" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="company" required placeholder="Acme Security Group" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="team-size">Team size</Label>
        <Select name="team-size" defaultValue="1-10">
          <SelectTrigger id="team-size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-10">1–10 employees</SelectItem>
            <SelectItem value="11-50">11–50 employees</SelectItem>
            <SelectItem value="51-200">51–200 employees</SelectItem>
            <SelectItem value="200+">200+ employees</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="message">What are you hoping to solve?</Label>
        <Textarea id="message" name="message" placeholder="Tell us about your current reporting process..." />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status === "submitting"}>
          {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "submitting" ? "Sending..." : "Request a Demo"}
        </Button>
      </div>
    </form>
  );
}
