export interface GroupCommissionItem {
  groupId: string;
  groupName: string;
  avatarUrl: string;
  genre: string;
  managerName: string;
  managerPhone: string;
  totalBookings: number;
  completedBookings: number;
  grossMerchandiseValue: number; // GMV total contratado
  commissionRatePercent: number; // Ej: 10%
  commissionEarnedNet: number;   // Ganancia neta para Vielais/Acordex
  escrowPending: number;        // Fondos retenidos en garantía
  paidOutToGroup: number;       // Dispersado a la cuenta del grupo
  averageTicket: number;        // Ticket promedio por presentación
  trendGrowthPercent: number;   // Crecimiento mensual %
  disputeRate: number;          // Tasa de incidencias %
  status: 'Top Producer' | 'Crecimiento Rápido' | 'Estable' | 'Baja Actividad';
}

export interface ManagerItem {
  id: string;
  fullName: string;
  agencyName: string;
  email: string;
  phone: string;
  clabe: string;
  rfc: string;
  avatarUrl: string;
  assignedGroups: string[];
  commissionSplitPercent: number; // e.g. 15%
  status: 'Activo' | 'Invitación Pendiente' | 'Suspendido';
  joinedDate: string;
  totalGmvManaged: number;
  totalCommissionsGenerated: number;
  openTicketsCount: number;
}

export interface SupportTicketMessage {
  id: string;
  sender: 'Manager' | 'Vielais (Root)';
  senderName: string;
  message: string;
  timestamp: string;
  attachmentUrl?: string;
}

export interface SupportTicketItem {
  id: string;
  folio: string; // e.g. 'TCK-8092'
  managerId: string;
  managerName: string;
  managerAgency: string;
  managerAvatar: string;
  groupId?: string;
  groupName?: string;
  category: 'Dispersión de Escrow' | 'Límites de Cotización' | 'Soporte Técnico / Bug' | 'Cambio de CLABE / Fiscal' | 'Petición de Feature' | 'Incidencia con Cliente';
  priority: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  status: 'Abierto' | 'En Revisión' | 'Resuelto' | 'Cerrado';
  subject: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportTicketMessage[];
  internalDevNotes?: string;
}

export interface FunnelStep {
  stepIndex: number;
  label: string;
  description: string;
  count: number;
  conversionPercent: number;
  dropoffPercent: number;
  icon: string;
}

export interface TrafficChannel {
  channel: string;
  visitors: number;
  sharePercent: number;
  conversionRate: number;
  icon: string;
}

export interface GeoTraffic {
  region: string;
  country: string;
  sessions: number;
  commissionGenerated: number;
}

export interface TrafficAnalyticsData {
  todayVisitors: number;
  todayPageviews: number;
  activeLiveUsers: number;
  avgSessionDurationSeconds: number;
  bounceRatePercent: number;
  mobileSharePercent: number;
  desktopSharePercent: number;
  channels: TrafficChannel[];
  geoBreakdown: GeoTraffic[];
  funnel: FunnelStep[];
  hourlyTraffic: { hour: string; visitors: number; quotes: number }[];
}

export interface SystemServiceHealth {
  serviceName: string;
  status: 'Operational' | 'Degraded' | 'Down';
  latencyMs: number;
  uptimePercent: number;
  instancesCount: number;
  icon: string;
}

export interface SystemTelemetryData {
  apiLatencyP50Ms: number;
  apiLatencyP95Ms: number;
  activeWebSocketTunnels: number;
  databaseStorageMb: number;
  memoryUsageMb: number;
  uptimePercent: number;
  errorRatePercent: number;
  backgroundQueuePending: number;
  services: SystemServiceHealth[];
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  source: 'clients_web' | 'admins_web' | 'group_web' | 'api_gateway';
  action: string;
  details: string;
  clientIp?: string;
  amount?: number;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'Monetización' | 'IA & Algoritmos' | 'Seguridad' | 'UX & Experimental';
  enabled: boolean;
  requiresRestart: boolean;
}

export interface PlatformOwnerSummary {
  grossMerchandiseValueTotal: number; // GMV Total de la plataforma
  netCommissionsTotal: number;        // Ganancia Neta de Vielais
  averageTakeRatePercent: number;     // Comisión promedio (10%)
  escrowBalanceTotal: number;         // Fondos en garantía
  totalQuotesGenerated: number;       // Cotizaciones totales
  totalConfirmedShows: number;        // Shows confirmados
  activeBandsCount: number;           // Grupos activos
  projectedMonthlyCommissions: number; // Forecast 30 días
  projectedAnnualCommissions: number;  // Forecast 12 meses
  globalConversionRatePercent: number;
}
