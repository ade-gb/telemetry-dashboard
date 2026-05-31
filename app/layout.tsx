import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "AstraOps Drone Telemetry",
  description: "Real-time futuristic drone telemetry dashboard"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-abyss text-slate-100 antialiased">{children}</body>
    </html>
  );
}
