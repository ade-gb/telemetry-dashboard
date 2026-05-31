"use client";

import { BatteryFull, Compass, Gauge, MapPin, Radio, Thermometer, Wind } from "lucide-react";
import type { TelemetryPoint } from "@/lib/telemetry";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";

type TelemetryPanelProps = {
  telemetry: TelemetryPoint;
};

export function TelemetryPanel({ telemetry }: TelemetryPanelProps) {
  return (
    <Panel title="Live Telemetry" eyebrow="Flight Core">
      <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 xl:grid-cols-2">
        <MetricCard icon={Compass} label="Altitude" value={telemetry.altitude.toString()} unit="m" />
        <MetricCard icon={Gauge} label="Speed" value={telemetry.speed.toString()} unit="km/h" tone="mint" />
        <MetricCard
          icon={BatteryFull}
          label="Battery"
          value={telemetry.battery.toFixed(1)}
          unit="%"
          tone={telemetry.battery < 24 ? "red" : "mint"}
        />
        <MetricCard
          icon={Radio}
          label="Signal"
          value={telemetry.signal.toString()}
          unit="%"
          tone={telemetry.signal < 60 ? "amber" : "cyan"}
        />
        <MetricCard icon={Thermometer} label="Temp" value={telemetry.temperature.toString()} unit="C" tone="amber" />
        <MetricCard icon={Wind} label="Wind" value={telemetry.wind.toString()} unit="kt" tone={telemetry.wind > 28 ? "red" : "cyan"} />
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-cyanGlow/20 bg-cyanGlow/10 p-3">
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-cyanGlow" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">GPS Coordinates</p>
              <p className="mt-1 font-mono text-sm text-white">
                {telemetry.latitude.toFixed(5)}, {telemetry.longitude.toFixed(5)}
              </p>
            </div>
          </div>
          <div className="rounded-[6px] border border-mint/30 bg-mint/10 px-3 py-2 font-mono text-xs font-bold text-mint">
            {telemetry.flightMode}
          </div>
        </div>
      </div>
    </Panel>
  );
}
