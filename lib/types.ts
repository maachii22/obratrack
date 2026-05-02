export type Cuadrilla = "Adrian" | "Mario" | "Tyson" | "Matias";
export const CUADRILLAS: Cuadrilla[] = ["Adrian", "Mario", "Tyson", "Matias"];

export type TipoTrabajo = "Baldosas" | "Hormigon";

export type Materiales = {
  caños: number;
  bolson: number;
  volquetes: number;
  palletBaldosas: number;
  arena: number;
  cal: number;
  cemento: number;
  mlPlantera: number;
  protectorPluvial: number;
  tapasCamaraPluvial: number;
  cordon: number;
};

export const MATERIALES_KEYS: (keyof Materiales)[] = [
  "caños",
  "bolson",
  "volquetes",
  "palletBaldosas",
  "arena",
  "cal",
  "cemento",
  "mlPlantera",
  "protectorPluvial",
  "tapasCamaraPluvial",
  "cordon",
];

export type RDO = {
  id: string;
  fecha: string;
  frente: string;
  cuadrilla: string;
  m2: number;
  trabajo: TipoTrabajo;
  materiales: Materiales;
  notas?: string;
  fotoUrl?: string;
};

export type PrecioCuadrilla = {
  cuadrilla: Cuadrilla;
  vigenciaDesde: string;
  precioM2: number;
};

export type PrecioMaterial = {
  material: string;
  vigenciaDesde: string;
  precio: number;
  unidad: "m²" | "u";
};

export type EgresoLinea = {
  concepto: string;
  vencimiento?: string | null;
  monto: number;
};

export type EgresoMensual = {
  mes: string;
  impuestos: EgresoLinea[];
  planesPago: EgresoLinea[];
  costosFijos: EgresoLinea[];
  costosVariablesEstimados: number;
};

export type Frente = {
  direccion: string;
  lat: number;
  lng: number;
  barrio?: string;
};
