import { Injectable, signal, computed } from '@angular/core';
import {
  GroupCommissionItem,
  TrafficAnalyticsData,
  SystemTelemetryData,
  AuditLogItem,
  FeatureFlag,
  PlatformOwnerSummary,
  ManagerItem,
  SupportTicketItem,
  SupportTicketMessage
} from '../models/vielais.models';

const STORAGE_FEATURE_FLAGS = 'acordex_vielais_feature_flags_v1';
const STORAGE_COMMISSION_RATE = 'acordex_vielais_global_commission_rate';
const STORAGE_MANAGERS = 'acordex_vielais_managers_v1';
const STORAGE_TICKETS = 'acordex_vielais_tickets_v1';

@Injectable({
  providedIn: 'root'
})
export class MetricsEngineService {
  // Global Commission Rate adjustable by Vielais (Default 10%)
  readonly globalTakeRatePercent = signal<number>(10);

  // Real-time developer simulated active live users
  readonly activeLiveUsers = signal<number>(142);

  // Managers Directory
  readonly managers = signal<ManagerItem[]>([
    {
      id: 'mgr-1',
      fullName: 'Don Pedro Reyes',
      agencyName: 'Reyes Music Entertainment',
      email: 'pedro@reyesmusic.mx',
      phone: '+52 33 1234 5678',
      clabe: '012180001234567890',
      rfc: 'REME850412H88',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
      assignedGroups: ['Banda Los Reyes'],
      commissionSplitPercent: 15,
      status: 'Activo',
      joinedDate: '2025-11-10',
      totalGmvManaged: 8400000,
      totalCommissionsGenerated: 840000,
      openTicketsCount: 1
    },
    {
      id: 'mgr-2',
      fullName: 'Lic. Roberto Mendoza',
      agencyName: 'Mendoza Representaciones Artísticas',
      email: 'roberto@mendozarep.com',
      phone: '+52 55 9876 5432',
      clabe: '002180009876543210',
      rfc: 'MENR780915KP1',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400',
      assignedGroups: ['Mariachi Imperial de México'],
      commissionSplitPercent: 20,
      status: 'Activo',
      joinedDate: '2025-12-04',
      totalGmvManaged: 5760000,
      totalCommissionsGenerated: 576000,
      openTicketsCount: 0
    },
    {
      id: 'mgr-3',
      fullName: 'Carlos Villalobos',
      agencyName: 'Sinaloa Talento & Management',
      email: 'carlos@sinaloatalento.com',
      phone: '+52 667 445 8899',
      clabe: '014180004455667788',
      rfc: 'VICA910220TX4',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=400',
      assignedGroups: ['Grupo Firmeza Sinaloense'],
      commissionSplitPercent: 15,
      status: 'Activo',
      joinedDate: '2026-02-18',
      totalGmvManaged: 4180000,
      totalCommissionsGenerated: 418000,
      openTicketsCount: 1
    },
    {
      id: 'mgr-4',
      fullName: 'Arturo Benítez',
      agencyName: 'Sureste Booking Group',
      email: 'arturo@surestebooking.com',
      phone: '+52 999 123 4567',
      clabe: '072180001122334455',
      rfc: 'BEAR830704M19',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
      assignedGroups: ['Sonora Dinamita del Sureste'],
      commissionSplitPercent: 12,
      status: 'Activo',
      joinedDate: '2026-03-01',
      totalGmvManaged: 2860000,
      totalCommissionsGenerated: 286000,
      openTicketsCount: 0
    },
    {
      id: 'mgr-5',
      fullName: 'Don Aurelio Garza',
      agencyName: 'Norteño Clásico Promociones',
      email: 'aurelio@garzapromo.com',
      phone: '+52 81 8345 6789',
      clabe: '012180008899001122',
      rfc: 'GAAL700101AA3',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400',
      assignedGroups: ['Los Cadetes de la Sierra'],
      commissionSplitPercent: 15,
      status: 'Activo',
      joinedDate: '2026-04-12',
      totalGmvManaged: 1680000,
      totalCommissionsGenerated: 168000,
      openTicketsCount: 0
    }
  ]);

  // Support Tickets from Managers
  readonly tickets = signal<SupportTicketItem[]>([
    {
      id: 'tck-1',
      folio: 'TCK-8921',
      managerId: 'mgr-1',
      managerName: 'Don Pedro Reyes',
      managerAgency: 'Reyes Music Entertainment',
      managerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
      groupId: 'banda-los-reyes',
      groupName: 'Banda Los Reyes',
      category: 'Dispersión de Escrow',
      priority: 'Alta',
      status: 'Abierto',
      subject: 'Solicitud de anticipo acelerado para concierto en Palenque Texcoco',
      description: 'Estimado Vielais, el cliente del folio Q-9021 ya liquidó el 50% de anticipo ($175k). Requerimos la dispersión del anticipo el día de hoy para gastos de transportación y viáticos del staff de 18 músicos.',
      createdAt: 'Hoy 11:30 AM',
      updatedAt: 'Hoy 11:30 AM',
      messages: [
        {
          id: 'msg-1',
          sender: 'Manager',
          senderName: 'Don Pedro Reyes',
          message: 'Hola Vielais, te comparto que ya tenemos los boletos de avión listos y necesitamos la dispersión de los $157,500 MXN netos tras la comisión de Acordex.',
          timestamp: '11:30 AM'
        }
      ],
      internalDevNotes: 'Verificado: El pago en Stripe/SPEI del cliente está conciliado. Se puede liberar el webhook de dispersión directa.'
    },
    {
      id: 'tck-2',
      folio: 'TCK-8922',
      managerId: 'mgr-3',
      managerName: 'Carlos Villalobos',
      managerAgency: 'Sinaloa Talento & Management',
      managerAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=400',
      groupId: 'grupo-firmeza-sinaloense',
      groupName: 'Grupo Firmeza Sinaloense',
      category: 'Petición de Feature',
      priority: 'Media',
      status: 'En Revisión',
      subject: 'Posibilidad de adjuntar archivos de audio FLAC y videos en vivo en cotizaciones',
      description: 'Nos gustaría poder enviar a los clientes que piden corridos personalizados muestras directas de audio en formato de alta fidelidad desde la pantalla de chat.',
      createdAt: 'Ayer 16:45 PM',
      updatedAt: 'Ayer 18:20 PM',
      messages: [
        {
          id: 'msg-2',
          sender: 'Manager',
          senderName: 'Carlos Villalobos',
          message: '¿Qué tal Vielais? Los clientes corporativos nos piden muestras en FLAC o video MP4 antes de cerrar los contratos de más de $300k.',
          timestamp: 'Ayer 16:45 PM'
        },
        {
          id: 'msg-3',
          sender: 'Vielais (Root)',
          senderName: 'Vielais',
          message: 'Hola Carlos, ya tenemos el flag ENABLE_LIVE_AUDIO_PREVIEWS listo en el backend. Lo habilitaremos en la siguiente actualización.',
          timestamp: 'Ayer 18:20 PM'
        }
      ],
      internalDevNotes: 'Feature Flag ff-3 ya cubre esta petición. Probar con transcoder HLS.'
    },
    {
      id: 'tck-3',
      folio: 'TCK-8850',
      managerId: 'mgr-2',
      managerName: 'Lic. Roberto Mendoza',
      managerAgency: 'Mendoza Representaciones Artísticas',
      managerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400',
      groupId: 'mariachi-imperial-mexico',
      groupName: 'Mariachi Imperial de México',
      category: 'Cambio de CLABE / Fiscal',
      priority: 'Baja',
      status: 'Resuelto',
      subject: 'Actualización de Constancia de Situación Fiscal (CSF 2026)',
      description: 'Adjunto la nueva CSF actualizada con el régimen simplificado de confianza para la emisión de facturas CFDI 4.0.',
      createdAt: '12 Ago 2026',
      updatedAt: '13 Ago 2026',
      messages: [
        {
          id: 'msg-4',
          sender: 'Manager',
          senderName: 'Lic. Roberto Mendoza',
          message: 'CSF actualizada enviada para revisión fiscal.',
          timestamp: '12 Ago 2026'
        },
        {
          id: 'msg-5',
          sender: 'Vielais (Root)',
          senderName: 'Vielais',
          message: 'Validada con el SAT. Datos actualizados en el padrón de managers de Acordex.',
          timestamp: '13 Ago 2026'
        }
      ]
    }
  ]);

  // Open Tickets Count Computed
  readonly openTicketsCount = computed<number>(() => {
    return this.tickets().filter(t => t.status === 'Abierto' || t.status === 'En Revisión').length;
  });

  // Group Commissions Catalog
  readonly groupCommissions = signal<GroupCommissionItem[]>([
    {
      groupId: 'banda-los-reyes',
      groupName: 'Banda Los Reyes',
      avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600',
      genre: 'Banda Sinaloense',
      managerName: 'Don Pedro Reyes',
      managerPhone: '+52 33 1234 5678',
      totalBookings: 28,
      completedBookings: 24,
      grossMerchandiseValue: 8400000,
      commissionRatePercent: 10,
      commissionEarnedNet: 840000,
      escrowPending: 700000,
      paidOutToGroup: 6860000,
      averageTicket: 300000,
      trendGrowthPercent: 24.5,
      disputeRate: 0.0,
      status: 'Top Producer'
    },
    {
      groupId: 'mariachi-imperial-mexico',
      groupName: 'Mariachi Imperial de México',
      avatarUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600',
      genre: 'Mariachi Tradicional',
      managerName: 'Lic. Roberto Mendoza',
      managerPhone: '+52 55 9876 5432',
      totalBookings: 36,
      completedBookings: 32,
      grossMerchandiseValue: 5760000,
      commissionRatePercent: 10,
      commissionEarnedNet: 576000,
      escrowPending: 480000,
      paidOutToGroup: 4704000,
      averageTicket: 160000,
      trendGrowthPercent: 18.2,
      disputeRate: 0.5,
      status: 'Top Producer'
    },
    {
      groupId: 'grupo-firmeza-sinaloense',
      groupName: 'Grupo Firmeza Sinaloense',
      avatarUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600',
      genre: 'Norteño-Banda / Corridos',
      managerName: 'Carlos Villalobos',
      managerPhone: '+52 667 445 8899',
      totalBookings: 19,
      completedBookings: 16,
      grossMerchandiseValue: 4180000,
      commissionRatePercent: 10,
      commissionEarnedNet: 418000,
      escrowPending: 380000,
      paidOutToGroup: 3382000,
      averageTicket: 220000,
      trendGrowthPercent: 32.8,
      status: 'Crecimiento Rápido',
      disputeRate: 1.0
    },
    {
      groupId: 'sonora-dinamita-legado',
      groupName: 'Sonora Dinamita del Sureste',
      avatarUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=600',
      genre: 'Cumbia & Tropical',
      managerName: 'Arturo Benítez',
      managerPhone: '+52 999 123 4567',
      totalBookings: 22,
      completedBookings: 20,
      grossMerchandiseValue: 2860000,
      commissionRatePercent: 10,
      commissionEarnedNet: 286000,
      escrowPending: 260000,
      paidOutToGroup: 2314000,
      averageTicket: 130000,
      trendGrowthPercent: 12.0,
      disputeRate: 0.0,
      status: 'Estable'
    },
    {
      groupId: 'los-cadetes-sierra',
      groupName: 'Los Cadetes de la Sierra',
      avatarUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600',
      genre: 'Norteño Clásico',
      managerName: 'Don Aurelio Garza',
      managerPhone: '+52 81 8345 6789',
      totalBookings: 14,
      completedBookings: 12,
      grossMerchandiseValue: 1680000,
      commissionRatePercent: 10,
      commissionEarnedNet: 168000,
      escrowPending: 180000,
      paidOutToGroup: 1332000,
      averageTicket: 120000,
      trendGrowthPercent: 5.4,
      disputeRate: 0.0,
      status: 'Estable'
    }
  ]);

  // Traffic & Analytics
  readonly trafficAnalytics = signal<TrafficAnalyticsData>({
    todayVisitors: 3842,
    todayPageviews: 18920,
    activeLiveUsers: 142,
    avgSessionDurationSeconds: 264, // 4m 24s
    bounceRatePercent: 28.4,
    mobileSharePercent: 74.2,
    desktopSharePercent: 25.8,
    channels: [
      { channel: 'Redes Sociales (TikTok/IG)', visitors: 1680, sharePercent: 43.7, conversionRate: 8.4, icon: 'campaign' },
      { channel: 'Tráfico Directo / Compartido', visitors: 1120, sharePercent: 29.1, conversionRate: 14.2, icon: 'qr_code_2' },
      { channel: 'Búsqueda Orgánica', visitors: 690, sharePercent: 18.0, conversionRate: 6.8, icon: 'search' },
      { channel: 'Referidos / Promotores', visitors: 352, sharePercent: 9.2, conversionRate: 19.5, icon: 'handshake' }
    ],
    geoBreakdown: [
      { region: 'Sinaloa (Mazatlán / Culiacán)', country: 'México', sessions: 6200, commissionGenerated: 890000 },
      { region: 'Jalisco (Guadalajara / Zapopan)', country: 'México', sessions: 4800, commissionGenerated: 640000 },
      { region: 'Nuevo León (Monterrey)', country: 'México', sessions: 3400, commissionGenerated: 420000 },
      { region: 'Ciudad de México & EdoMex', country: 'México', sessions: 2800, commissionGenerated: 310000 },
      { region: 'Texas / California (USA)', country: 'Estados Unidos', sessions: 1720, commissionGenerated: 280000 }
    ],
    funnel: [
      { stepIndex: 1, label: '1. Visitas al Portal', description: 'Usuarios navegando en clients_web', count: 3842, conversionPercent: 100, dropoffPercent: 0, icon: 'visibility' },
      { stepIndex: 2, label: '2. Perfil de Agrupación', description: 'Visitaron /grupo/:id y escucharon canciones', count: 2650, conversionPercent: 68.9, dropoffPercent: 31.1, icon: 'person' },
      { stepIndex: 3, label: '3. Cotización Iniciada', description: 'Completaron el formulario de cotización', count: 480, conversionPercent: 12.5, dropoffPercent: 56.4, icon: 'request_quote' },
      { stepIndex: 4, label: '4. Cotización Aceptada', description: 'Grupo aceptó y abrió chat directo', count: 210, conversionPercent: 5.4, dropoffPercent: 7.1, icon: 'forum' },
      { stepIndex: 5, label: '5. Contrato Cerrado & Comisión', description: 'Anticipo cobrado en Acordex (GMV)', count: 119, conversionPercent: 3.1, dropoffPercent: 2.3, icon: 'payments' }
    ],
    hourlyTraffic: [
      { hour: '00:00', visitors: 42, quotes: 1 },
      { hour: '02:00', visitors: 18, quotes: 0 },
      { hour: '04:00', visitors: 12, quotes: 0 },
      { hour: '06:00', visitors: 45, quotes: 2 },
      { hour: '08:00', visitors: 130, quotes: 8 },
      { hour: '10:00', visitors: 280, quotes: 24 },
      { hour: '12:00', visitors: 410, quotes: 42 },
      { hour: '14:00', visitors: 390, quotes: 38 },
      { hour: '16:00', visitors: 460, quotes: 52 },
      { hour: '18:00', visitors: 580, quotes: 68 },
      { hour: '20:00', visitors: 740, quotes: 89 },
      { hour: '22:00', visitors: 620, quotes: 56 }
    ]
  });

  // System Telemetry & Health
  readonly systemTelemetry = signal<SystemTelemetryData>({
    apiLatencyP50Ms: 18,
    apiLatencyP95Ms: 42,
    activeWebSocketTunnels: 38,
    databaseStorageMb: 142.5,
    memoryUsageMb: 384,
    uptimePercent: 99.98,
    errorRatePercent: 0.02,
    backgroundQueuePending: 3,
    services: [
      { serviceName: 'API Gateway & GraphQL Core', status: 'Operational', latencyMs: 14, uptimePercent: 99.99, instancesCount: 4, icon: 'dns' },
      { serviceName: 'Escrow & Payments Webhook (Stripe/SPEI)', status: 'Operational', latencyMs: 22, uptimePercent: 100.0, instancesCount: 3, icon: 'account_balance' },
      { serviceName: 'WebSocket Live Chat & Quotes', status: 'Operational', latencyMs: 9, uptimePercent: 99.98, instancesCount: 6, icon: 'speed' },
      { serviceName: 'HLS Video & Audio Transcoder', status: 'Operational', latencyMs: 38, uptimePercent: 99.95, instancesCount: 2, icon: 'video_file' },
      { serviceName: 'Push Notification & SMS Dispatcher', status: 'Operational', latencyMs: 18, uptimePercent: 99.97, instancesCount: 2, icon: 'notifications_active' }
    ]
  });

  // Feature Flags
  readonly featureFlags = signal<FeatureFlag[]>([
    {
      id: 'ff-1',
      key: 'ENABLE_INSTANT_ESCROW_PAYOUTS',
      name: 'Dispersión Inmediata de Anticipos SPEI',
      description: 'Habilita la transferencia bancaria automática a los grupos al recibir el 50% de anticipo del cliente.',
      category: 'Monetización',
      enabled: true,
      requiresRestart: false
    },
    {
      id: 'ff-2',
      key: 'AI_DYNAMIC_PRICE_RECOMMENDER',
      name: 'Recomendador Inteligente de Tarifas por Temporada',
      description: 'Sugiere precios dinámicos a las agrupaciones según la alta demanda (Diciembre, Mayo, Palenques).',
      category: 'IA & Algoritmos',
      enabled: true,
      requiresRestart: false
    },
    {
      id: 'ff-3',
      key: 'ENABLE_LIVE_AUDIO_PREVIEWS',
      name: 'Streaming de Audio en Alta Fidelidad (FLAC/AAC)',
      description: 'Permite a los clientes reproducir los temas de los grupos con compresión lossless.',
      category: 'UX & Experimental',
      enabled: true,
      requiresRestart: false
    },
    {
      id: 'ff-4',
      key: 'STRICT_FRAUD_PREVENTION_ESCROW',
      name: 'Filtro Anti-Fraude & Retención Preventiva',
      description: 'Bloquea liberaciones de fondos si se detecta discrepancia en RFC o contrato no firmado digitalmente.',
      category: 'Seguridad',
      enabled: true,
      requiresRestart: false
    }
  ]);

  // Audit Logs
  readonly auditLogs = signal<AuditLogItem[]>([
    {
      id: 'log-1',
      timestamp: 'Hoy 14:18:22',
      level: 'SUCCESS',
      source: 'clients_web',
      action: 'Cotización Pagada & Comisión Acreditada',
      details: 'Cliente liquidó anticipo de $175,000 MXN para Banda Los Reyes. Comisión neta de $17,500 MXN acreditada a Vielais.',
      amount: 17500
    },
    {
      id: 'log-2',
      timestamp: 'Hoy 13:45:10',
      level: 'INFO',
      source: 'group_web',
      action: 'Perfil Público Sincronizado',
      details: 'Mariachi Imperial de México actualizó rider técnico y catálogo de temas.',
      clientIp: '189.204.12.88'
    },
    {
      id: 'log-3',
      timestamp: 'Hoy 12:30:00',
      level: 'SUCCESS',
      source: 'admins_web',
      action: 'Dispersión de Honorarios Aprobada',
      details: 'Administración liberó $144,000 MXN a Sonora Dinamita tras finalizar concierto verificado.',
      amount: 144000
    },
    {
      id: 'log-4',
      timestamp: 'Hoy 11:15:44',
      level: 'WARN',
      source: 'api_gateway',
      action: 'Pico de Tráfico Detectado',
      details: 'Aumento del 240% en reproducciones del video mix de Grupo Firmeza Sinaloense desde TikTok.',
      clientIp: '187.190.55.102'
    }
  ]);

  // Platform Owner Computed Financial Summary
  readonly ownerSummary = computed<PlatformOwnerSummary>(() => {
    const list = this.groupCommissions();
    const gmv = list.reduce((acc, g) => acc + g.grossMerchandiseValue, 0);
    const net = list.reduce((acc, g) => acc + g.commissionEarnedNet, 0);
    const escrow = list.reduce((acc, g) => acc + g.escrowPending, 0);
    const shows = list.reduce((acc, g) => acc + g.totalBookings, 0);

    return {
      grossMerchandiseValueTotal: gmv,
      netCommissionsTotal: net,
      averageTakeRatePercent: this.globalTakeRatePercent(),
      escrowBalanceTotal: escrow,
      totalQuotesGenerated: 480,
      totalConfirmedShows: shows,
      activeBandsCount: list.length,
      projectedMonthlyCommissions: Math.round(net * 0.35),
      projectedAnnualCommissions: Math.round(net * 4.2),
      globalConversionRatePercent: 3.1
    };
  });

  constructor() {
    this.initRealtimeData();
    this.startLiveTrafficOscillator();
  }

  private initRealtimeData(): void {
    try {
      const savedRate = localStorage.getItem(STORAGE_COMMISSION_RATE);
      if (savedRate) {
        this.globalTakeRatePercent.set(+savedRate);
      }

      const savedFlags = localStorage.getItem(STORAGE_FEATURE_FLAGS);
      if (savedFlags) {
        this.featureFlags.set(JSON.parse(savedFlags));
      }

      const savedManagers = localStorage.getItem(STORAGE_MANAGERS);
      if (savedManagers) {
        this.managers.set(JSON.parse(savedManagers));
      }

      const savedTickets = localStorage.getItem(STORAGE_TICKETS);
      if (savedTickets) {
        this.tickets.set(JSON.parse(savedTickets));
      }
    } catch (e) {
      console.warn('Storage read error in MetricsEngineService', e);
    }
  }

  private startLiveTrafficOscillator(): void {
    setInterval(() => {
      this.activeLiveUsers.update(v => {
        const delta = Math.floor(Math.random() * 7) - 3;
        return Math.max(90, Math.min(300, v + delta));
      });
    }, 4000);
  }

  // ================= MANAGER MUTATIONS =================
  registerManager(manager: Omit<ManagerItem, 'id' | 'joinedDate' | 'totalGmvManaged' | 'totalCommissionsGenerated' | 'openTicketsCount'>): ManagerItem {
    const newMgr: ManagerItem = {
      ...manager,
      id: `mgr-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
      totalGmvManaged: 0,
      totalCommissionsGenerated: 0,
      openTicketsCount: 0
    };

    this.managers.update(list => {
      const updated = [newMgr, ...list];
      try {
        localStorage.setItem(STORAGE_MANAGERS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: 'Justo ahora',
      level: 'SUCCESS',
      source: 'api_gateway',
      action: 'Manager Registrado en Plataforma',
      details: `Se dio de alta al manager ${newMgr.fullName} (${newMgr.agencyName}) para administrar: ${newMgr.assignedGroups.join(', ') || 'Sin grupos asignados aún'}.`
    };
    this.auditLogs.update(logs => [newLog, ...logs]);

    return newMgr;
  }

  updateManagerStatus(managerId: string, status: ManagerItem['status']): void {
    this.managers.update(list => {
      const updated = list.map(m => m.id === managerId ? { ...m, status } : m);
      try {
        localStorage.setItem(STORAGE_MANAGERS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }

  // ================= TICKET MUTATIONS =================
  replyToTicket(ticketId: string, replyText: string): void {
    if (!replyText?.trim()) return;

    const newMsg: SupportTicketMessage = {
      id: `msg-${Date.now()}`,
      sender: 'Vielais (Root)',
      senderName: 'Vielais',
      message: replyText.trim(),
      timestamp: 'Justo ahora'
    };

    this.tickets.update(list => {
      const updated = list.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'En Revisión' as const,
            updatedAt: 'Justo ahora',
            messages: [...t.messages, newMsg]
          };
        }
        return t;
      });
      try {
        localStorage.setItem(STORAGE_TICKETS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: 'Justo ahora',
      level: 'INFO',
      source: 'api_gateway',
      action: 'Respuesta a Ticket de Manager',
      details: `Vielais respondió al ticket ${ticketId}.`
    };
    this.auditLogs.update(logs => [newLog, ...logs]);
  }

  updateTicketStatus(ticketId: string, status: SupportTicketItem['status'], devNotes?: string): void {
    this.tickets.update(list => {
      const updated = list.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status,
            updatedAt: 'Justo ahora',
            ...(devNotes !== undefined ? { internalDevNotes: devNotes } : {})
          };
        }
        return t;
      });
      try {
        localStorage.setItem(STORAGE_TICKETS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }

  createTicket(ticket: Omit<SupportTicketItem, 'id' | 'folio' | 'createdAt' | 'updatedAt' | 'messages'>): void {
    const newTck: SupportTicketItem = {
      ...ticket,
      id: `tck-${Date.now()}`,
      folio: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: 'Justo ahora',
      updatedAt: 'Justo ahora',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'Manager',
          senderName: ticket.managerName,
          message: ticket.description,
          timestamp: 'Justo ahora'
        }
      ]
    };

    this.tickets.update(list => {
      const updated = [newTck, ...list];
      try {
        localStorage.setItem(STORAGE_TICKETS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }

  setGlobalTakeRate(rate: number): void {
    const validRate = Math.max(1, Math.min(30, rate));
    this.globalTakeRatePercent.set(validRate);
    try {
      localStorage.setItem(STORAGE_COMMISSION_RATE, String(validRate));
    } catch (e) {}

    this.groupCommissions.update(list => {
      return list.map(g => {
        const net = (g.grossMerchandiseValue * validRate) / 100;
        return {
          ...g,
          commissionRatePercent: validRate,
          commissionEarnedNet: net,
          paidOutToGroup: g.grossMerchandiseValue - net
        };
      });
    });
  }

  toggleFeatureFlag(flagId: string): void {
    this.featureFlags.update(flags => {
      const updated = flags.map(f => f.id === flagId ? { ...f, enabled: !f.enabled } : f);
      try {
        localStorage.setItem(STORAGE_FEATURE_FLAGS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }

  simulateLiveBooking(groupName: string, amount: number): void {
    const commission = (amount * this.globalTakeRatePercent()) / 100;
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: 'Justo ahora',
      level: 'SUCCESS',
      source: 'clients_web',
      action: 'Simulación de Reserva Exitosa',
      details: `Reserva de prueba generada para ${groupName} por $${amount.toLocaleString()} MXN. Comisión de $${commission.toLocaleString()} MXN acreditada.`,
      amount: commission
    };

    this.auditLogs.update(logs => [newLog, ...logs]);
  }
}
