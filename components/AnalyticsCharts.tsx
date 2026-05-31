"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { TelemetryPoint } from "@/lib/telemetry";
import { Panel } from "@/components/ui/Panel";

type AnalyticsChartsProps = {
  history: TelemetryPoint[];
};

const tooltipStyle = {
  background: "rgba(2, 6, 23, 0.92)",
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: "8px",
  color: "#e2e8f0"
};

function ChartFrame({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{title}</p>
      <div className="h-[138px]">{children}</div>
    </div>
  );
}

export function AnalyticsCharts({ history }: AnalyticsChartsProps) {
  return (
    <Panel title="Flight Analytics" eyebrow="Streaming Graphs" className="min-h-full">
      <div className="grid gap-3 p-3 md:grid-cols-2">
        <ChartFrame title="Battery Usage">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="batteryFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#42ffbf" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#42ffbf" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="timestamp" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#94a3b8" }} />
              <Area dataKey="battery" stroke="#42ffbf" fill="url(#batteryFill)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Altitude Graph">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="timestamp" hide />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#94a3b8" }} />
              <Line type="monotone" dataKey="altitude" stroke="#20f6ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Speed Graph">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="timestamp" hide />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#94a3b8" }} />
              <Line type="monotone" dataKey="speed" stroke="#ffb020" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame title="Signal Quality">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="signalFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#20f6ff" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#20f6ff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="timestamp" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#94a3b8" }} />
              <Area dataKey="signal" stroke="#20f6ff" fill="url(#signalFill)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>
    </Panel>
  );
}
