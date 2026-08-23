"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { PrintReport, printAuditReport } from "./print-report";
import type { AuditResult } from "@/lib/types";
import { useAppStore } from "@/lib/store";

/**
 * Mounts the print report into a portal when a print event is fired.
 * Listens for the "ufuq-print-report" CustomEvent.
 */
export function PrintReportPortal() {
  const [report, setReport] = React.useState<{
    audit: AuditResult;
    agencyName?: string;
    clientName?: string;
    brandColor?: string;
    templateId?: string;
  } | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setReport(detail);
      // Wait a tick for render, then print
      setTimeout(() => {
        window.print();
        // Clean up after print dialog closes (next tick)
        setTimeout(() => setReport(null), 500);
      }, 100);
    };
    window.addEventListener("ufuq-print-report", handler);
    return () => window.removeEventListener("ufuq-print-report", handler);
  }, []);

  // Also expose a helper to trigger print via the global event
  React.useEffect(() => {
    (window as any).ufuqPrint = printAuditReport;
  }, []);

  if (!mounted || !report) return null;

  return createPortal(
    <PrintReport {...report} />,
    document.body
  );
}
