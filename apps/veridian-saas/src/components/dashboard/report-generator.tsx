"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Mail,
  Save,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stepper } from "@/components/dashboard/stepper";
import { reportTypes, type ReportType } from "@/data/site";
import { interviewFields, analysisSteps } from "@/data/generator";

const STEPS = ["Choose Report", "Answer Questions", "AI Processing", "Preview", "Download"];

export function ReportGenerator() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("report");

  const [step, setStep] = React.useState(0);
  const [selectedReport, setSelectedReport] = React.useState<ReportType | null>(
    reportTypes.find((r) => r.id === preselected) ?? null
  );
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [progress, setProgress] = React.useState(0);
  const [analysisIndex, setAnalysisIndex] = React.useState(0);
  const [query, setQuery] = React.useState("");

  const filteredReports = reportTypes.filter((r) => r.label.toLowerCase().includes(query.toLowerCase()));

  const setAnswer = (id: string, value: string) => setAnswers((prev) => ({ ...prev, [id]: value }));

  React.useEffect(() => {
    if (step !== 2) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset before starting the interval below
    setProgress(0);
    setAnalysisIndex(0);
    const start = Date.now();
    const duration = 3200;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      setAnalysisIndex(Math.min(analysisSteps.length - 1, Math.floor((pct / 100) * analysisSteps.length)));
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep(3), 400);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [step]);

  function goNext() {
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }
  function reset() {
    setSelectedReport(null);
    setAnswers({});
    setStep(0);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Generate a report</h1>
        <p className="text-sm text-muted-foreground">Five steps from a blank page to a finished document.</p>
      </div>

      <Stepper steps={STEPS} current={step} />

      {step === 0 && (
        <div className="flex flex-col gap-5">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search report types..." className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`flex flex-col gap-2 rounded-2xl border p-5 text-left transition cursor-pointer ${
                  selectedReport?.id === report.id ? "border-accent bg-accent-soft" : "border-border bg-card hover:border-accent/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <FileText className={selectedReport?.id === report.id ? "h-4 w-4 text-accent" : "h-4 w-4 text-muted-foreground"} />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{report.category}</span>
                </div>
                <div className="text-sm font-semibold">{report.label}</div>
                <p className="text-xs text-muted-foreground">{report.summary}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button disabled={!selectedReport} onClick={goNext}>
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 1 && selectedReport && (
        <Card className="p-7">
          <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            Generating: <span className="font-semibold text-foreground">{selectedReport.label}</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {interviewFields.map((field) => (
              <div key={field.id} className={`flex flex-col gap-2 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>
                <Label htmlFor={field.id}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.id}
                    placeholder={field.placeholder}
                    value={answers[field.id] ?? ""}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                  />
                ) : field.type === "select" ? (
                  <Select value={answers[field.id]} onValueChange={(v) => setAnswer(field.id, v)}>
                    <SelectTrigger id={field.id}>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={answers[field.id] ?? ""}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={goNext}>
              <Sparkles className="h-4 w-4" /> Generate report
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && selectedReport && (
        <Card className="mx-auto flex max-w-lg flex-col items-center gap-6 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Generating your {selectedReport.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">This normally takes 30–60 seconds</p>
          </div>
          <Progress value={progress} className="w-full" />
          <div className="flex w-full flex-col gap-3 text-left">
            {analysisSteps.map((s, idx) => (
              <div key={s} className="flex items-center gap-2.5 text-sm">
                {idx < analysisIndex ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : idx === analysisIndex ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                )}
                <span className={idx <= analysisIndex ? "text-foreground" : "text-muted-foreground"}>{s}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {step === 3 && selectedReport && (
        <div className="flex flex-col gap-5">
          <Card className="mx-auto w-full max-w-3xl p-8">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-accent">{selectedReport.category}</div>
                <h2 className="mt-1 font-display text-xl font-semibold">{selectedReport.label}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {answers.site || "Site not specified"} · {answers.date || "Date not specified"}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">Draft</span>
            </div>

            <div className="mt-6 flex flex-col gap-6">
              <PreviewSection
                title="Summary"
                value={answers.summary || "No summary provided. Add detail in the previous step for a stronger draft."}
              />
              <PreviewSection
                title="People Involved"
                value={answers.peopleInvolved || "No individuals listed."}
              />
              <PreviewSection
                title="Actions Taken"
                value={answers.actionsTaken || "No actions documented yet."}
              />
              <PreviewSection
                title="Recommendations"
                value={
                  answers.recommendations ||
                  "Veridian AI recommends a follow-up review within 30 days and confirmation that all involved parties received a copy of this report."
                }
              />
            </div>
          </Card>
          <div className="mx-auto flex w-full max-w-3xl justify-between">
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="h-4 w-4" /> Back to questions
            </Button>
            <Button onClick={goNext}>
              Looks good, continue <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 4 && selectedReport && (
        <Card className="mx-auto flex max-w-lg flex-col items-center gap-5 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Your report is ready</p>
            <p className="mt-1 text-sm text-muted-foreground">{selectedReport.label} · generated just now</p>
          </div>
          <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/50 p-3 text-left">
            <FileText className="h-8 w-8 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{selectedReport.label}.pdf</p>
              <p className="text-xs text-muted-foreground">Saved to your workspace</p>
            </div>
          </div>
          <div className="grid w-full grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <Download className="h-4 w-4" />
              <span className="text-xs">Download</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <Mail className="h-4 w-4" />
              <span className="text-xs">Email</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
              <Save className="h-4 w-4" />
              <span className="text-xs">Save</span>
            </Button>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button onClick={reset} className="font-medium text-muted-foreground underline-offset-2 hover:text-accent hover:underline cursor-pointer">
              Generate another report
            </button>
            <Link href="/dashboard/reports" className="font-medium text-accent hover:underline">
              View all reports
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function PreviewSection({ title, value }: { title: string; value: string }) {
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(value);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button
          onClick={() => setEditing((v) => !v)}
          className="text-xs font-medium text-accent hover:underline cursor-pointer"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      {editing ? (
        <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[100px]" />
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
      )}
    </div>
  );
}
