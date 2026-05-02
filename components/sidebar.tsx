"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  BarChart3,
  Wallet,
  Tag,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rdo", label: "RDO", icon: FileText },
  { href: "/obras", label: "Obras", icon: Building2 },
  { href: "/cuadrillas", label: "Cuadrillas", icon: Users },
  { href: "/resumen", label: "Resumen", icon: BarChart3 },
  { href: "/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/precios", label: "Precios", icon: Tag },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-2 border-b bg-background px-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Navegación</SheetTitle>
            <div className="px-5 py-4 border-b">
              <span className="font-semibold tracking-tight">ObraTrack</span>
            </div>
            <NavLinks onClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-semibold tracking-tight">ObraTrack</span>
        <ThemeToggle />
      </header>

      <aside className="hidden md:flex flex-col h-screen w-56 border-r bg-card sticky top-0">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <span className="font-semibold tracking-tight text-lg">ObraTrack</span>
          <ThemeToggle />
        </div>
        <NavLinks />
        <div className="mt-auto p-4 text-xs text-muted-foreground border-t">
          Demo · datos simulados
        </div>
      </aside>
    </>
  );
}
