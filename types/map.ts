export type StandStatus = "available" | "rented" | "reserved" | "blocked";

export type StandType = 
  | "MAQUINARIA" 
  | "ISLA" 
  | "PREFERENCIAL" 
  | "ESTANDAR" 
  | "INSTITUCIONAL" 
  | "CORESHACK";

export interface Stand {
  id: string;
  label: string;
  name?: string;
  company?: string;
  type: StandType;
  status: StandStatus;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  size?: string;
  description?: string;
}

export const STAND_TYPE_CONFIG: Record<StandType, { color: string; label: string }> = {
  MAQUINARIA: { color: "#ef4444", label: "Exhibición Maquinaria" },
  ISLA: { color: "#10b981", label: "Isla" },
  PREFERENCIAL: { color: "#f97316", label: "Preferencial" },
  ESTANDAR: { color: "#eab308", label: "Estándar" },
  INSTITUCIONAL: { color: "#a855f7", label: "Institucional" },
  CORESHACK: { color: "#475569", label: "Coreshack" },
};
