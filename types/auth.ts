export type VoucherStatus = "PENDIENTE" | "CANCELADO" | "GRATUITO";

export const VOUCHER_STATUS = {
  PENDIENTE: "PENDIENTE",
  CANCELADO: "CANCELADO",
  GRATUITO: "GRATUITO",
} as const;

export const VOUCHER_STATUS_CONFIG: Record<
  VoucherStatus,
  { label: string; color: string }
> = {
  [VOUCHER_STATUS.PENDIENTE]: {
    label: "Pendiente",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  [VOUCHER_STATUS.CANCELADO]: {
    label: "Cancelado",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  [VOUCHER_STATUS.GRATUITO]: {
    label: "Gratuito",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

export interface Comprobante {
  fechaEmision: string;
  numero: string;
  serie: string;
  razonSocial: string;
  estado: string;
  monto: string;
  moneda: string;
  codigo?: string;
  impreso?: string;
}

export interface QRData {
  vertical: string;
  codigo: string;
}

export interface Cupon {
  obs: string[];
  vertical: string;
  codigo: string;
  status: "A" | "I";
}

export interface User {
  email: string;
  telefono?: string;
  celular?: string; // Legacy support
  cargo?: string;
  qr?: QRData[];
  nombres: string;
  apellidoMaterno?: string;
  apellidoPaterno?: string;
  comprobantes: Comprobante[];
  cupon?: Cupon[];
  // Optional/Legacy fields from previous iterations if they might still come in
  nu_documento?: string;
  picture?: string;
  bio?: string;
  empresa?: string;
  ubicacionOficina?: string;
  visPerfil?: boolean;
  visWhatsapp?: boolean;
  notificacion01?: boolean;
  notificacion02?: boolean;
  siecode?: string; // Identifier from Genexus API
  tipo_participante?: string;
  documentType?: string; // Document type ID (1=DNI, 4=Pasaporte, 7=CE)
  documentNumber?: string; // Document number used for login
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface LoginRequest {
  event: string;
  type: string;
  document: string;
  password: string;
}

export interface RecoveryRequest {
  event: string;
  email: string;
}

export interface RecoveryResponse {
  message: string;
  success: boolean;
}

export interface ResetPasswordRequest {
  event: string;
  type: string;
  document: string;
  password: string;
  newpassword: string;
}

export interface RecoveryPasswordRequest {
  event: string;
  email: string;
}

export interface SaveDataRequest {
  event: string;
  siecode: string;
  nombreCompleto: string;
  numeroTelefono: string;
  cargoProfesional: string;
  empresa: string;
  ubicacionOficina: string;
  correoElectronico: string;
  bioProfesional: string;
  curriculumVitae: string;
  picture?: string;
  visPerfil: number;
  visWhatsapp: number;
  notificacion01: number;
  notificacion02: number;
}
