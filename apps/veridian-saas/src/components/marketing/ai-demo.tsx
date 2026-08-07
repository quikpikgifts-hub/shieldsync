"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Download, FileText, Loader2, Mail, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { reportTypes } from "@/data/site";

const DEMO_REPORTS = reportTypes.slice(0, 4);

const ANALYSIS_STEPS = [
  "Reading site and interview details",
  "Cross-referencing risk factors",
  "Drafting findings and recommendations",
  "Formatting professional document",
];

type Stage = "idle" | "analyzing" | "ready";

export function AiDemo() {
  const [selected, setSelected] = React.useState(DEMO_REPORTS[0].id);
  const [stage, setStage] = React.useState<Stage>("idle");
  const [progress, setProgress] = React.useState(0);
  const [stepIndex, setStepIndex] = React.useState(0);

  const selectedReport = DEMO_REPORTS.find((r) => r.id === selected) ?? DEMO_REPORTS[0];

  React.useEffect(() => {
    if (stage !== "analyzing") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset before starting the interval below
    setProgress(0);
    setStepIndex(0);
    const start = Date.now();
    const duration = 2600;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      setStepIndex(Math.min(ANALYSIS_STEPS.length - 1, Math.floor((pct / 100) * ANALYSIS_STEPS.length)));
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => setStage("ready"), 350);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [stage]);

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card/80 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="text-sm font-semibold">AI Report Generator</div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live demo
        </span>
      </div>

      <div className="min-h-[340px] p-5">
        <AnimatePresence mode="wait">
          {stage === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step 1 — Choose a report
              </p>
              <div className="grid grid-cols-1 gap-2">
                {DEMO_REPORTS.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelected(report.id)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition cursor-pointer ${
                      selected === report.id
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <span className="font-medium">{report.label}</span>
                    <span className="text-xs text-muted-foreground">{report.category}</span>
                  </button>
                ))}
              </div>
              <Button className="mt-2 w-full" onClick={() => setStage("analyzing")}>
                <Sparkles className="h-4 w-4" /> Generate {selectedReport.label}
              </Button>
            </motion.div>
          )}

          {stage === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6 py-4"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <p className="text-sm font-semibold">Generating your {selectedReport.label}</p>
                <p className="text-xs text-muted-foreground">This normally takes 30–60 seconds</p>
              </div>
              <Progress value={progress} />
              <div className="flex flex-col gap-2.5">
                {ANALYSIS_STEPS.map((step, idx) => (
                  <div key={step} className="flex items-center gap-2.5 text-sm">
                    {idx < stepIndex ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : idx === stepIndex ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                    )}
                    <span className={idx <= stepIndex ? "text-foreground" : "text-muted-foreground"}>{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {stage === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-5 py-2 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold">Your report is ready</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedReport.label} · 8 pages · generated in 38s</p>
              </div>
              <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/50 p-3 text-left">
                <FileText className="h-8 w-8 shrink-0 text-accent" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{selectedReport.label}.pdf</p>
                  <p className="text-xs text-muted-foreground">Ready to download or share</p>
                </div>
              </div>
              <div className="grid w-full grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="flex-col gap-1 h-auto py-3">
                  <Download className="h-4 w-4" />
                  <span className="text-xs">Download</span>
                </Button>
                <Button variant="outline" size="sm" className="flex-col gap-1 h-auto py-3">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs">Email</span>
                </Button>
                <Button variant="outline" size="sm" className="flex-col gap-1 h-auto py-3">
                  <Share2 className="h-4 w-4" />
                  <span className="text-xs">Share</span>
                </Button>
              </div>
              <button
                onClick={() => setStage("idle")}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-accent hover:underline cursor-pointer"
              >
                Generate another report
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
