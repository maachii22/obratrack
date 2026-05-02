import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ObraTrack — Gestión de obra civil",
  description:
    "Software de gestión para empresas constructoras de veredas y obra civil menor.",
  openGraph: {
    title: "ObraTrack — Gestión de obra civil",
    description:
      "Reemplazá el Excel por un sistema profesional de gestión de obra: RDO, costos, cuadrillas, finanzas.",
    type: "website",
    locale: "es_AR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
