export type Role = 'encargado' | 'administrador' | 'usuario';

export type QuoteState = 
  | 'En revisión' 
  | 'Propuesta enviada' 
  | 'Negociación' 
  | 'Aceptada' 
  | 'Contrato en espera de firma'
  | 'Contrato firmado' 
  | 'Pago pendiente' 
  | 'Anticipo 50% recibido'
  | 'Logística & Soundcheck'
  | 'Pago confirmado' 
  | 'En presentación'
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

// Registro de cada ronda de negociación comercial
export interface NegotiationEntry {
  round: number;                     // Número de ronda (1, 2, 3...)
  clientRejectionMessage: string;    // Motivo de rechazo del cliente para esa ronda
  adminProposalNote?: string;        // Nota/mensaje de negociación del admin para esa ronda
  totalOffered: number;              // Monto total ofertado en esa ronda
  artistFee: number;                 // Honorarios propuestos en esa ronda
  viaticosCost: number;              // Viáticos propuestos en esa ronda
  soundCost: number;                 // Equipo de audio propuesto en esa ronda
  soundOption?: 'cliente' | 'proveedor'; // Si la disquera provee el audio o el cliente lo trae
  marginPercent: number;             // % Margen disquera en esa ronda
  timestamp?: string;                // Fecha/hora del re-envío
  // Horario propuesto en esa ronda
  proposedDate?: string;             // Fecha del evento propuesta en esa ronda
  scheduleMode?: 'continuo' | 'tandas'; // Modo de horario en esa ronda
  startTime?: string;                // Hora de inicio (modo continuo)
  endTime?: string;                  // Hora de fin calculada (modo continuo)
  durationHours?: number;            // Duración en horas (modo continuo)
  showBlocks?: { id: string; label: string; date?: string; startTime: string; endTime: string; }[]; // Tandas
  totalShowHours?: number;           // Total de horas de show (cualquier modo)
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

  // Fields from Public Booking Wizard & Commercial Proposal Builder:
  eventType?: 'Boda' | 'XV Años' | 'Concierto' | 'Fiesta' | 'Otro' | string;
  durationHours?: number;
  eventAddress?: string;
  representativeName?: string;
  representativePhone?: string;
  genre?: string;
  rating?: number;
  artistImage?: string;
  notes?: string;
  soundOption?: 'cliente' | 'proveedor';
  soundCost?: number;
  viaticosCost?: number;
  artistFee?: number;
  includeIva?: boolean;

  // Negociación multi-ronda
  negotiationRound?: number;           // 0 = primera propuesta sin negociar, 1+ = en negociación activa
  negotiationHistory?: NegotiationEntry[]; // Historial de todas las rondas de negociación
  scheduleMode?: 'continuo' | 'tandas';
  showBlocks?: { id: string; label: string; date?: string; startTime: string; endTime: string; }[];

  // Fase 3 ("Aceptada") - Contratos, notificaciones al grupo y cupón de compensación opcional
  contractFileName?: string;
  contractFileUrl?: string;
  contractStatus?: 'Pendiente' | 'Generado' | 'Subido' | 'Firmado';
  artistNotified?: boolean;
  artistNotifiedTime?: string;
  compensationCoupon?: {
    code: string;
    discountValue: number;
    type: 'percentage' | 'fixed';
    note: string;
    generatedAt: string;
  };
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
