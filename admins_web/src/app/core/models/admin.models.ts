export type Role = 'encargado' | 'administrador' | 'usuario';

export type QuoteState = 
  | 'En revisión' 
  | 'Propuesta enviada' 
  | 'Negociación' 
  | 'Aceptada' 
  | 'Contrato firmado' 
  | 'Pago pendiente' 
  | 'Pago confirmado' 
  | 'Evento realizado' 
  | 'Finalizada' 
  | 'Cancelada';

export type PaymentStatus = 'Pendiente' | 'Anticipo 50%' | 'Pago Confirmado 100%';

export type DisqueraContractType = 'Firmado Exclusivo' | 'Co-gestionado' | 'Independiente / Por Evento';

export type TaskPrivacy = 'Pública' | 'Delicada' | 'Privada';

export interface TicketTier {
  name: string;
  price: number;
  totalSeats: number;
  soldSeats: number;
  color: string;
}

export interface CroquisZone {
  id: string;
  name: string;
  capacity: number;
  occupancyPercent: number;
  color: string;
}

export interface EventEvidence {
  id: string;
  type: 'photo' | 'video';
  url: string;
  caption: string;
  uploaderName: string;
  uploaderRole: Role;
  uploadedAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  venue: string;
  groupName: string;
  disqueraId: string; // Active label ID e.g. 'acordex-records'
  status: 'Publicado' | 'Borrador' | 'Próximo' | 'Pasado';
  flyerUrl: string;
  ticketTiers: TicketTier[];
  croquisZones: CroquisZone[];
  isCoProduction: boolean;
  coProductionPartner?: string;
  coProductionStatus?: 'approved' | 'pending_review' | 'rejected';
  pendingChanges?: {
    proposedBy: string;
    proposedDate?: string;
    proposedVenue?: string;
    proposedSplitPercent?: number;
    reason: string;
  };
  evidenceMedia: EventEvidence[];
}

export interface Quote {
  id: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  groupName: string;
  disqueraId: string; // 'acordex-records'
  proposedDate: string;
  venue: string;
  city: string;
  totalAmount: number;
  marginAmount: number;
  state: QuoteState;
  paymentStatus: PaymentStatus;
  terms: string;
  contractPdfUrl?: string;
  dateCreated: string;
}

export interface GroupItem {
  id: string;
  name: string;
  disqueraType: DisqueraContractType;
  disqueraId: string; // 'acordex-records'
  disqueraName: string;
  genre: string;
  rating: number;
  image: string;
  membersCount: number;
  // Metrics isolated for current label:
  labelQuotesCount: number;
  labelActiveEventsCount: number;
  labelRevenueAcordex: number;
  // Global metrics for display reference:
  globalTotalEventsCount: number;
  description: string;
}

export interface PressEvent {
  id: string;
  title: string;
  type: 'Firma de Autógrafos' | 'Rueda de Prensa';
  date: string;
  location: string;
  groupName: string;
  operatingExpenses: number;
  mediaCount: number;
  accreditedJournalists: string[];
  pressKitUrl: string;
  status: 'Programado' | 'En Curso' | 'Finalizado';
  summary: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedRole: Role;
  priority: 'Alta' | 'Media' | 'Baja';
  privacy: TaskPrivacy;
  status: 'Pendiente' | 'En Proceso' | 'Completada';
  dueDate: string;
  eventName?: string;
}

export interface ClientItem {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  totalEvents: number;
  totalSpent: number;
  status: 'Frecuente' | 'Activo' | 'Inactivo';
  lastQuoteDate: string;
  notes: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  status: 'Activo' | 'Inactivo';
  lastAccess: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  role: Role;
  action: string;
  targetModule: string;
  details: string;
}

export interface FileItem {
  id: string;
  fileName: string;
  groupName: string;
  category: 'Fotos' | 'Videos' | 'Contratos' | 'Press Kits';
  size: string;
  uploadDate: string;
  url: string;
}

export interface CorporateSettings {
  agencyName: string;
  legalId: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  autoSaveMock: boolean;
}
