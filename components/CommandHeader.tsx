"use client";

import { Clock3, Cpu, Satellite } from "lucide-react";
import type { TelemetryPoint } from "@/lib/telemetry";

type CommandHeaderProps = {
  telemetry: TelemetryPoint;
};

export function CommandHeader({ telemetry }: CommandHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-white/10 bg-black/20 px-4 py-4 backdrop-blur-2xl md:flex-row md:items-center md:justify-between lg:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyanGlow/70">AstraOps Tactical Console</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal text-white md:text-3xl">Drone Telemetry Dashboard</h1>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <HeaderChip icon={Satellite} label="Uplink" value={`${telemetry.signal}%`} />
        <HeaderChip icon={Cpu} label="Mode" value={telemetry.flightMode} />
        <HeaderChip icon={Clock3} label="Sync" value={telemetry.timestamp} />
      </div>
    </header>
  );
}

function HeaderChip({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Satellite;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.045] px-3 py-2">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={14} className="shrink-0 text-cyanGlow" />
        <span className="truncate uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-1 truncate font-mono text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
