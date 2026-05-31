"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { AlertState } from "@/lib/telemetry";
import { Panel } from "@/components/ui/Panel";

type AlertsPanelProps = {
  alerts: AlertState[];
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <Panel title="Alerts" eyebrow="Risk Monitor">
      <div className="space-y-3 p-3">
        <AnimatePresence initial={false}>
          {alerts.length === 0 ? (
            <motion.div
              key="clear"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 rounded-[8px] border border-mint/20 bg-mint/10 p-3"
            >
              <ShieldCheck size={18} className="text-mint" />
              <div>
                <p className="text-sm font-semibold text-white">Systems nominal</p>
                <p className="mt-0.5 text-xs text-slate-400">No active telemetry warnings.</p>
              </div>
            </motion.div>
          ) : (
            alerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                className={`rounded-[8px] border p-3 ${
                  alert.level === "critical"
                    ? "border-redAlert/30 bg-redAlert/[0.12]"
                    : "border-amberWarn/30 bg-amberWarn/[0.12]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={18}
                    className={alert.level === "critical" ? "text-redAlert" : "text-amberWarn"}
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{alert.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{alert.detail}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Panel>
  );
}
