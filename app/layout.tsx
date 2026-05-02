import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ObraTrack",
  description: "Gestión de obra civil y veredas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
