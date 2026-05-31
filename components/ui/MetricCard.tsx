"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  tone?: "cyan" | "mint" | "amber" | "red";
};

const toneClass = {
  cyan: "text-cyanGlow shadow-[0_0_18px_rgba(32,246,255,0.35)]",
  mint: "text-mint shadow-[0_0_18px_rgba(66,255,191,0.30)]",
  amber: "text-amberWarn shadow-[0_0_18px_rgba(255,176,32,0.30)]",
  red: "text-redAlert shadow-[0_0_18px_rgba(255,65,95,0.30)]"
};

export function MetricCard({ icon: Icon, label, value, unit, tone = "cyan" }: MetricCardProps) {
  return (
    <motion.div
      layout
      className="rounded-[8px] border border-white/10 bg-white/[0.045] p-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <span className={`grid h-8 w-8 place-items-center rounded-[6px] bg-white/5 ${toneClass[tone]}`}>
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>
      <div className="mt-4 flex items-end gap-1">
        <span className="font-mono text-2xl font-semibold leading-none text-white">{value}</span>
        {unit && <span className="pb-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{unit}</span>}
      </div>
    </motion.div>
  );
}
