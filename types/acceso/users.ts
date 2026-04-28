export interface GenexusSiecodeUser {
  nombres: string;
  tipo_doc: string;
  nro_doc: string;
  siecod: string;
}

export interface PortalRecipientUser {
  id: string;
  siecod: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  source: 'genexus';
}

export interface GenexusSiecodeListResponse {
  siecodelist: GenexusSiecodeUser[];
  success: boolean;
  message: string;
}

export interface UsersSearchResponse {
  items: PortalRecipientUser[];
  total: number;
  limit: number;
  query: string;
  success: boolean;
  message?: string;
}
