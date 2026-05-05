"use client";

import { useStore } from "@/lib/store";
import { RdoTable } from "@/components/rdo-table";
import { RdoForm } from "@/components/rdo-form";

export default function RDOPage() {
  const { rdos } = useStore();
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-2 border-b">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Operación · {rdos.length} reportes en el sistema
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Reportes diarios de obra
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            El RDO es el origen de toda la trazabilidad: m² ejecutados, materiales y
            mano de obra.
          </p>
        </div>
        <div className="flex sm:block">
          <RdoForm />
        </div>
      </div>
      <RdoTable rdos={rdos} />
    </div>
  );
}
