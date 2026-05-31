"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createInitialTelemetry,
  createNextTelemetry,
  getTelemetryAlerts,
  type TelemetryPoint
} from "@/lib/telemetry";

const HISTORY_LIMIT = 34;

export function useTelemetry() {
  const [tick, setTick] = useState(1);
  const [history, setHistory] = useState<TelemetryPoint[]>([createInitialTelemetry()]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHistory((current) => {
        const next = createNextTelemetry(current[current.length - 1], tick);
        return [...current.slice(-(HISTORY_LIMIT - 1)), next];
      });
      setTick((value) => value + 1);
    }, 1350);

    return () => window.clearInterval(interval);
  }, [tick]);

  const current = history[history.length - 1];
  const alerts = useMemo(() => getTelemetryAlerts(current), [current]);

  return {
    alerts,
    current,
    history,
    path: history.map((point) => [point.latitude, point.longitude] as [number, number])
  };
}
