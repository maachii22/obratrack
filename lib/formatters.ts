const ARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const ARS_2 = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
const NUM = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
const PCT = new Intl.NumberFormat("es-AR", { style: "percent", maximumFractionDigits: 1 });

export const fmtARS = (v: number) => ARS.format(v);
export const fmtARS2 = (v: number) => ARS_2.format(v);
export const fmtNum = (v: number) => NUM.format(v);
export const fmtM2 = (v: number) => `${NUM.format(v)} m²`;
export const fmtPct = (v: number) => PCT.format(v);

export function fmtFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtMes(mes: string): string {
  const [y, m] = mes.split("-");
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
}

export function mesActual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
