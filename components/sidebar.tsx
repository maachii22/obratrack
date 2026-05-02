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
  HardHat,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const operacion = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rdo", label: "RDO", icon: FileText },
  { href: "/obras", label: "Obras", icon: Building2 },
  { href: "/cuadrillas", label: "Cuadrillas", icon: Users },
];

const gestion = [
  { href: "/resumen", label: "Resumen mensual", icon: BarChart3 },
  { href: "/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/precios", label: "Precios", icon: Tag },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
        <HardHat className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <div className="font-semibold tracking-tight text-[15px]">ObraTrack</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Obra civil
        </div>
      </div>
    </div>
  );
}

function NavSection({
  title,
  items,
  onClick,
  pathname,
}: {
  title: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
  onClick?: () => void;
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
        {title}
      </p>
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
              active
                ? "bg-primary text-primary-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-5 p-3">
      <NavSection title="Operación" items={operacion} onClick={onClick} pathname={pathname} />
      <NavSection title="Gestión" items={gestion} onClick={onClick} pathname={pathname} />
    </nav>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-2 border-b bg-background/80 backdrop-blur-md px-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Navegación</SheetTitle>
            <div className="px-4 py-4 border-b">
              <Brand />
            </div>
            <NavLinks onClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Brand />
        <ThemeToggle />
      </header>

      <aside className="hidden md:flex flex-col h-screen w-60 border-r bg-card sticky top-0">
        <div className="px-4 py-4 border-b flex items-center justify-between">
          <Brand />
          <ThemeToggle />
        </div>
        <NavLinks />
        <div className="mt-auto p-3 border-t">
          <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground leading-tight">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
              Modo demo · datos simulados
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
