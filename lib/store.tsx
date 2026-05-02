"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { RDO } from "./types";
import rdosSeed from "@/data/rdos.json";

type Store = {
  rdos: RDO[];
  addRDO: (r: RDO) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [rdos, setRdos] = useState<RDO[]>(rdosSeed as RDO[]);
  const value = useMemo<Store>(
    () => ({
      rdos,
      addRDO: (r) => setRdos((prev) => [r, ...prev]),
    }),
    [rdos]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore fuera de StoreProvider");
  return v;
}
