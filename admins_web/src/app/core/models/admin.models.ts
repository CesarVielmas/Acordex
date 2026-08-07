export type Role = 'encargado' | 'administrador' | 'usuario';

export type QuoteState =
  | 'En revisión'
  | 'Propuesta enviada'
  | 'Negociación'
  | 'Aceptada'
  | 'Contrato en espera de firma'
  | 'Contrato firmado'
  | 'Finalizada'
  | 'Cancelada con Imprevisto'
  | 'Imprevisto Enviado'
  | 'Cancelada';

export type PaymentStatus = 'Pendiente' | 'Anticipo 50%' | 'Pago Confirmado 100%';

export type DisqueraContractType = 'Firmado Exclusivo' | 'Co-gestionado' | 'Independiente / Por Evento';

export type TaskPrivacy = 'Pública' | 'Delicada' | 'Privada';

/**
 * El evento y todo lo que cuelga de él (cartel, sonido, boletaje, croquis,
 * aprobaciones, venta y cierre) vive en `event.models.ts`, que es un modelo
 * demasiado grande para tenerlo mezclado aquí.
 */
export type {
  EventState,
  LegacyEventStatus,
  TicketTier,
  CroquisZone,
  EventEvidence,
  EventItem,
  EventLineupSlot,
  EventSoundSetup,
  EventSchedule,
  EventApproval,
  EventReviewRound,
  EventPublication,
  EventSalesSnapshot,
  EventClosureReport,
  EventTimelineStep
} from './event.models';

// Interfaz para Hitos / Parcialidades de Pago Programadas con Soporte de Cargos Moratorios y Control Tesorería
export interface PaymentMilestone {
  id: string;
  label: string;                   // Concepto (ej. "Pago intermedio 30 días antes", "Segunda parcialidad 25%")
  percentageOrAmount: number;     // Valor numérico (ej. 25 o 15000)
  type: 'percentage' | 'fixed';    // Tipo ('percentage' % o 'fixed' $)
  dueDateOrTimeframe: string;     // Fecha u horizonte de pago (ej. "2026-08-01" o "30 días antes del evento")
  
  // Estado y Cobranza Tesorería
  status?: 'Pagado' | 'Pendiente' | 'Vencido' | 'Moratorio';
  amountCalculated?: number;        // Monto base calculado en MXN
  paidAmount?: number;             // Monto efectivamente pagado
  paidAt?: string;                 // Fecha de registro de pago
  paymentReceiptUrl?: string;      // Comprobante de pago cargado
  receiptReference?: string;       // Folio o clave de rastreo bancario
  manualPaymentReason?: string;    // Explicación obligatoria para pagos manuales por error de sistema
  
  // Cargos Moratorios (Ajustables por % o Monto Fijo MXN)
  hasMoratorio?: boolean;
  moratorioType?: 'percentage' | 'fixed';
  moratorioValue?: number;         // e.g. 5% o $2,500 MXN
  moratorioAmountCalculated?: number; // Monto adicionado en MXN por mora
  moratorioReason?: string;        // Justificación del cargo por atraso
  appliedAt?: string;              // Fecha/hora de aplicación de la mora
}

// Interfaz para Tarjeta / Cuenta Receptora simulada
export interface ReceivingCard {
  id: string;
  bankName: string;
  accountHolder: string;
  cardNumber: string; // e.g. '**** **** **** 4921'
  clabe: string;
  cardType: 'Débito' | 'Crédito' | 'Empresarial';
  isDefault?: boolean;
}

// Notificación / Aviso Independiente a Cliente o Grupo Musical (Bitácoras)
export interface NoticeItem {
  id: string;
  target: 'Cliente' | 'Grupo Musical';
  title: string;
  message: string;
  sentBy: string;
  sentRole: Role;
  sentAt: string;
  channels: ('Email' | 'WhatsApp' | 'Platform')[];
  priority: 'Alta' | 'Normal' | 'Urgente';
  read?: boolean;
  relatedMilestoneId?: string;
}

// Chat Interactivo Cruzado entre Cliente, Grupo Musical y Administración
export interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: 'Cliente' | 'Grupo Musical' | 'Admin';
  avatar?: string;
  message: string;
  timestamp: string;
  incidentTag?: string;
  attachmentUrl?: string;
}

// Módulo de Excepciones e Imprevistos Operativos
export interface QuoteIncident {
  id: string;
  type: 'client_cancel' | 'group_cancel' | 'imprevisto_tecnico' | 'otro';
  initiatedBy: 'Cliente' | 'Grupo Musical' | 'Disquera';
  reason: string;
  resolutionType?: 'reschedule' | 'group_change' | 'refund' | 'apology_discount' | 'substitute_group';
  resolutionNotes?: string;
  clientMessage?: string;           // Mensaje formal enviado al cliente contratante
  newProposedDate?: string;
  newGroupName?: string;
  refundAmount?: number;
  discountApplied?: number;
  formalApologySent?: boolean;
  substituteGroupAssigned?: string;
  status: 'Activo' | 'Resuelto' | 'Imprevisto Grave';
  registeredAt: string;
  resolvedAt?: string;
  countdownTimer?: string; // Temporizador de cuenta regresiva (ej. '47:59:12')
  canClientRevert?: boolean;
}

// Ronda de propuesta de resolución para un imprevisto (analogo a NegotiationEntry pero
// para el flujo de Cancelada con Imprevisto -> Imprevisto Enviado)
export interface IncidentNegotiationEntry {
  id: string;
  round: number;
  resolutionType: 'reschedule' | 'group_change' | 'refund' | 'apology_discount' | 'substitute_group';
  proposedDate?: string;             // Si resolutionType === 'reschedule'
  newGroupName?: string;             // Si resolutionType === 'group_change' | 'substitute_group'
  refundAmount?: number;             // Si resolutionType === 'refund'
  discountApplied?: number;          // Si resolutionType === 'apology_discount'
  adminMessage: string;              // Mensaje formal enviado al cliente con la propuesta
  sentAt: string;
  sentBy: string;
  status: 'Enviada' | 'Aceptada' | 'Rechazada';
  clientRespondedAt?: string;
  clientRejectionReason?: string;
}

// Hito de Trazabilidad Histórica de Auditoría (Solo Lectura)
export interface TimelineStep {
  id: string;
  phaseNumber: number;
  phaseName: string; // 'Revisión', 'Propuesta enviada', 'Negociación', 'Aceptada', 'Contrato en espera de firma', 'Contrato firmado', 'Finalizada'
  state: QuoteState;
  completedAt: string;
  actorName: string;
  summaryNote: string;
  snapshotData?: {
    totalAmount?: number;
    contractHash?: string;
    negotiationRounds?: number;
    paymentMilestonesCount?: number;
    signedByClientAt?: string;
    signedByAdminAt?: string;
    clientEmail?: string;
    venue?: string;
  };
}

// Registro de cada ronda de negociación comercial
export interface NegotiationEntry {
  round: number;                     // Número de ronda (1, 2, 3...)
  clientRejectionMessage: string;    // Motivo de rechazo del cliente para esa ronda
  clientRejectedAt?: string;         // Fecha/hora en que el cliente rechazó esta ronda
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

  // Condiciones de Pago por Ronda
  advancePaymentType?: 'percentage' | 'fixed'; // 'percentage' (%) o 'fixed' ($)
  advancePaymentValue?: number;                // Valor de anticipo (ej. 50% o $25,000 MXN)
  paymentDueDate?: string;                     // Fecha límite de pago para liquidación total
  receivingCardId?: string;                    // Tarjeta/cuenta receptora seleccionada
  paymentMilestones?: PaymentMilestone[];      // Hitos de pago programados en esta ronda
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

  // Condiciones de Pago y Tarjeta Receptora (Vigentes)
  advancePaymentType?: 'percentage' | 'fixed'; // 'percentage' (%) o 'fixed' ($)
  advancePaymentValue?: number;                // Valor de anticipo (ej. 50% o $25,000 MXN)
  paymentDueDate?: string;                     // Fecha límite de pago para liquidación total
  receivingCardId?: string;                    // Tarjeta/cuenta receptora seleccionada
  paymentMilestones?: PaymentMilestone[];      // Hitos de pago programados vigentes
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

  // Fase 6 & Gestión de Tesorería, Avisos, Imprevistos y Trazabilidad
  maxAllowedDelays?: number;                  // Límite máximo de retrasos configurado (def: 2)
  isDeferred?: boolean;                       // Cotización en estado de pagos aplazados
  deferredReason?: string;
  deferredAt?: string;
  artistName?: string;                        // Alias para el nombre de la agrupación
  clientNotices?: NoticeItem[];               // Bitácora de avisos independientes al cliente
  groupNotices?: NoticeItem[];                // Bitácora de avisos independientes al grupo musical
  notices?: NoticeItem[];                     // Bitácora general de avisos
  chatHistory?: ChatMessage[];               // Chat interactivo cruzado (Cliente <-> Grupo <-> Admin)
  incidents?: QuoteIncident[];               // Módulo de excepciones e imprevistos
  incidentNegotiations?: IncidentNegotiationEntry[]; // Rondas de propuesta de resolución del imprevisto
  incidentStatus?: 'Ninguno' | 'En Proceso' | 'Resuelto' | 'Imprevisto';
  traceabilityTimeline?: TimelineStep[];      // Línea de tiempo de auditoría histórica inmutable
  isCycleSealed?: boolean;                    // Cierre definitivo de ciclo (sellado inmutable)
  sealedAt?: string;
  sealedBy?: string;
  finalClosureSummary?: string;
}

export type GroupAgendaStatus = 'Totalmente Libre' | 'Parcialmente Ocupado' | 'Agenda Llena';

export interface GroupDailyMetric {
  date: string;
  dayLabel: string;
  quotes: number;
  events: number;
  revenue: number;
}

export interface GroupItem {
  id: string;
  name: string;
  disqueraType: DisqueraContractType | 'Pendiente de Firma';
  disqueraId: string; // 'acordex-records'
  disqueraName: string;
  genre: string;
  rating: number;
  publicApprovalPercent: number; // e.g. 98%
  image: string;
  membersCount: number;
  // Metrics isolated for current label:
  labelQuotesCount: number;
  pendingQuotesCount: number;
  completedQuotesCount: number;
  labelActiveEventsCount: number;
  monthlyEventsCount: number;
  monthlyQuotesCount: number;
  labelRevenueAcordex: number;
  artistFeeBase: number; // Cobro directo del grupo (honorarios sin comisión)
  /**
   * Horas de show que cubre `artistFeeBase`. Es el piso que el grupo cobra
   * aunque el evento sea más corto; a partir de aquí, cada hora extra sube el
   * costo de forma proporcional.
   */
  minimumHours?: number;
  estimatedMonthlyEarnings: number; // Proyección de ganancias para rol Encargado
  agendaStatus: GroupAgendaStatus;
  followersCount: string; // e.g. '1.4M'
  isPlatformRegistered: boolean; // true = Alta en plataforma, false = Viene de fuera
  isExclusive: boolean; // true = Solo esta disquera, false = Varias / Co-gestionado
  pendingLabelContract: boolean; // true = Pendiente por firmar
  // Encargado del Grupo / Líder (Diferente a la disquera)
  groupLeaderName: string;
  groupLeaderRole: string;
  groupLeaderPhone?: string;
  groupLeaderEmail?: string;

  // Última Actividad en Acordex & Conexión en Línea
  lastActivityText?: string;
  lastActivityTime?: string;
  isOnline?: boolean;
  lastConnectionText?: string;

  globalTotalEventsCount: number;
  description: string;
  dailyMetrics?: GroupDailyMetric[];
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
