"use client";

import { useStore } from "@/lib/store";
import { RdoTable } from "@/components/rdo-table";
import { RdoForm } from "@/components/rdo-form";

export default function RDOPage() {
  const { rdos } = useStore();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Reportes diarios de obra
          </h1>
          <p className="text-sm text-muted-foreground">
            El RDO es el origen de toda la trazabilidad: m² ejecutados, materiales y
            mano de obra.
          </p>
        </div>
        <RdoForm />
      </div>
      <RdoTable rdos={rdos} />
    </div>
  );
}
