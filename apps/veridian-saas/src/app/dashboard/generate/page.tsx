import { Suspense } from "react";
import { ReportGenerator } from "@/components/dashboard/report-generator";

export default function GenerateReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportGenerator />
    </Suspense>
  );
}
