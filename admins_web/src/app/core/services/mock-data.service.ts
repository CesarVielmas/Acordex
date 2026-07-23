import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { RoleService } from './role.service';
import {
  Quote,
  QuoteState,
  PaymentStatus,
  GroupItem,
  EventItem,
  PressEvent,
  TaskItem,
  ClientItem,
  AdminUserItem,
  AuditLog,
  FileItem,
  CorporateSettings,
  EventEvidence,
  Role
} from '../models/admin.models';

const ACTIVE_DISQUERA_ID = 'acordex-records';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private storage = inject(StorageService);
  private roleService = inject(RoleService);

  // --- SEED DATA DEFINITIONS ---

  private readonly INITIAL_GROUPS: GroupItem[] = [
    {
      id: 'grp-1',
      name: 'Los Elegantes del Norte',
      disqueraType: 'Firmado Exclusivo',
      disqueraId: ACTIVE_DISQUERA_ID,
      disqueraName: 'Acordex Records',
      genre: 'Norteño Sax',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      membersCount: 5,
      labelQuotesCount: 14,
      labelActiveEventsCount: 5,
      labelRevenueAcordex: 450000,
      globalTotalEventsCount: 28,
      description: 'Banda estelar en exclusiva con Acordex Records. Máximos exponentes del género Norteño Sax.'
    },
    {
      id: 'grp-2',
      name: 'Grupo Dinastía Real',
      disqueraType: 'Co-gestionado',
      disqueraId: ACTIVE_DISQUERA_ID,
      disqueraName: 'Acordex Records / Fonovisa',
      genre: 'Corridos Tumbados / Sierreño',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
      membersCount: 4,
      labelQuotesCount: 8,
      labelActiveEventsCount: 3,
      labelRevenueAcordex: 280000, // Isolated revenue for Acordex
      globalTotalEventsCount: 45, // Includes other label events
      description: 'Grupo en alianza estratégica entre Acordex Records y disqueras afiliadas. Los datos mostrados corresponden a la participación de Acordex.'
    },
    {
      id: 'grp-3',
      name: 'Banda La Imperial',
      disqueraType: 'Firmado Exclusivo',
      disqueraId: ACTIVE_DISQUERA_ID,
      disqueraName: 'Acordex Records',
      genre: 'Banda Sinaloense',
      rating: 4.95,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      membersCount: 16,
      labelQuotesCount: 22,
      labelActiveEventsCount: 8,
      labelRevenueAcordex: 920000,
      globalTotalEventsCount: 32,
      description: 'Orquesta de banda sinaloense con presencia estelar en palenques y ferias nacionales.'
    },
    {
      id: 'grp-4',
      name: 'Valentina & Los De La Sierra',
      disqueraType: 'Independiente / Por Evento',
      disqueraId: ACTIVE_DISQUERA_ID,
      disqueraName: 'Independiente (Representado por Acordex)',
      genre: 'Campirano / Acústico',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
      membersCount: 3,
      labelQuotesCount: 5,
      labelActiveEventsCount: 2,
      labelRevenueAcordex: 110000, // Only Acordex contract revenue
      globalTotalEventsCount: 19,
      description: 'Talento independiente con acuerdos de representación y booking por fecha a través de Acordex.'
    }
  ];

  private readonly INITIAL_QUOTES: Quote[] = [
    {
      id: 'COT-8901',
      clientName: 'Roberto Gómez',
      clientCompany: 'Promociones del Norte SA',
      clientEmail: 'rgomez@promonorte.com',
      groupName: 'Los Elegantes del Norte',
      disqueraId: ACTIVE_DISQUERA_ID,
      proposedDate: '2026-08-15',
      venue: 'Arena Monterrey',
      city: 'Monterrey, NL',
      totalAmount: 350000,
      marginAmount: 87500,
      state: 'Contrato firmado',
      paymentStatus: 'Anticipo 50%',
      terms: '50% de anticipo al firmar, 50% el día de la prueba de sonido. Hospedaje y camerino VIP incluidos.',
      contractPdfUrl: 'contrato_COT-8901_firmado.pdf',
      dateCreated: '2026-07-10'
    },
    {
      id: 'COT-8902',
      clientName: 'Lorena Mendoza',
      clientCompany: 'Patronato Feria San Marcos',
      clientEmail: 'lmendoza@feriasanmarcos.org',
      groupName: 'Banda La Imperial',
      disqueraId: ACTIVE_DISQUERA_ID,
      proposedDate: '2026-09-02',
      venue: 'Palenque de la Feria',
      city: 'Aguascalientes, AGS',
      totalAmount: 580000,
      marginAmount: 145000,
      state: 'Negociación',
      paymentStatus: 'Pendiente',
      terms: 'Presentación estelar de 2.5 horas. Escenografía completa e iluminación robótica.',
      dateCreated: '2026-07-18'
    },
    {
      id: 'COT-8903',
      clientName: 'Carlos Villarreal',
      clientCompany: 'Empresa Tapatía de Espectáculos',
      clientEmail: 'carlos@tapatiaesp.mx',
      groupName: 'Grupo Dinastía Real',
      disqueraId: ACTIVE_DISQUERA_ID,
      proposedDate: '2026-08-28',
      venue: 'Auditorio Telmex',
      city: 'Zapopan, JAL',
      totalAmount: 240000,
      marginAmount: 60000,
      state: 'Propuesta enviada',
      paymentStatus: 'Pendiente',
      terms: 'Evento co-producido con Fonovisa. Reparto de utilidades 60/40.',
      dateCreated: '2026-07-20'
    },
    {
      id: 'COT-8904',
      clientName: 'Marisol Treviño',
      clientCompany: 'Eventos Privados Treviño',
      clientEmail: 'marisol@trevinoeventos.com',
      groupName: 'Valentina & Los De La Sierra',
      disqueraId: ACTIVE_DISQUERA_ID,
      proposedDate: '2026-10-12',
      venue: 'Hacienda Los Morales',
      city: 'Ciudad de México',
      totalAmount: 110000,
      marginAmount: 27500,
      state: 'Pago confirmado',
      paymentStatus: 'Pago Confirmado 100%',
      terms: 'Boda privada. 3 tandas de 45 minutos. Equipo de sonido propio.',
      dateCreated: '2026-07-01'
    },
    {
      id: 'COT-8905',
      clientName: 'Fernando Garza',
      clientCompany: 'Feria Regional Saltillo',
      clientEmail: 'fgarza@saltillo.gob.mx',
      groupName: 'Los Elegantes del Norte',
      disqueraId: ACTIVE_DISQUERA_ID,
      proposedDate: '2026-08-05',
      venue: 'Teatro del Pueblo',
      city: 'Saltillo, COAH',
      totalAmount: 320000,
      marginAmount: 80000,
      state: 'Aceptada',
      paymentStatus: 'Anticipo 50%',
      terms: 'Aceptación formal recibida por correo. En espera de firma de contrato.',
      dateCreated: '2026-07-22'
    },
    {
      id: 'COT-8906',
      clientName: 'Javier Solís',
      clientCompany: 'Cervecería de la Sierra',
      clientEmail: 'jsolis@cerveceriasierra.com',
      groupName: 'Banda La Imperial',
      disqueraId: ACTIVE_DISQUERA_ID,
      proposedDate: '2026-11-20',
      venue: 'Estadio Revolución',
      city: 'Torreón, COAH',
      totalAmount: 620000,
      marginAmount: 155000,
      state: 'En revisión',
      paymentStatus: 'Pendiente',
      terms: 'Revisión de rider técnico y logística de transporte de instrumentos masivo.',
      dateCreated: '2026-07-23'
    }
  ];

  private readonly INITIAL_EVENTS: EventItem[] = [
    {
      id: 'EVT-101',
      title: 'Noche de Gala Norteña 2026',
      date: '2026-08-15',
      location: 'Monterrey, NL',
      venue: 'Arena Monterrey',
      groupName: 'Los Elegantes del Norte',
      disqueraId: ACTIVE_DISQUERA_ID,
      status: 'Publicado',
      flyerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
      isCoProduction: true,
      coProductionPartner: 'Representaciones Madero',
      coProductionStatus: 'pending_review',
      pendingChanges: {
        proposedBy: 'Representaciones Madero',
        proposedDate: '2026-08-16',
        proposedVenue: 'Arena Monterrey (Sala Principal B)',
        proposedSplitPercent: 50,
        reason: 'Ajuste de fecha por empalme con torneo de boxeo y aumento de capacidad a 15,000 asistentes.'
      },
      ticketTiers: [
        { name: 'VIP Diamante', price: 2500, totalSeats: 500, soldSeats: 420, color: '#f2ca50' },
        { name: 'Preferente Oro', price: 1400, totalSeats: 2000, soldSeats: 1650, color: '#d4af37' },
        { name: 'General', price: 650, totalSeats: 8000, soldSeats: 5900, color: '#99907c' }
      ],
      croquisZones: [
        { id: 'z1', name: 'Ruedo VIP Frontal', capacity: 500, occupancyPercent: 84, color: '#f2ca50' },
        { id: 'z2', name: 'Palcos Laterales', capacity: 2000, occupancyPercent: 82.5, color: '#d4af37' },
        { id: 'z3', name: 'Graderías Generales', capacity: 8000, occupancyPercent: 73.7, color: '#99907c' }
      ],
      evidenceMedia: [
        {
          id: 'ev-1',
          type: 'photo',
          url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
          caption: 'Ensayo general y prueba de luces',
          uploaderName: 'Carlos Staff',
          uploaderRole: 'usuario',
          uploadedAt: '2026-07-22 18:30'
        }
      ]
    },
    {
      id: 'EVT-102',
      title: 'Gran Palenque San Marcos - Banda La Imperial',
      date: '2026-09-02',
      location: 'Aguascalientes, AGS',
      venue: 'Palenque San Marcos',
      groupName: 'Banda La Imperial',
      disqueraId: ACTIVE_DISQUERA_ID,
      status: 'Próximo',
      flyerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
      isCoProduction: false,
      ticketTiers: [
        { name: 'VIP Palenque', price: 3200, totalSeats: 800, soldSeats: 600, color: '#f2ca50' },
        { name: 'Platea', price: 1800, totalSeats: 2500, soldSeats: 1200, color: '#d4af37' },
        { name: 'Grada Alta', price: 800, totalSeats: 4000, soldSeats: 1500, color: '#99907c' }
      ],
      croquisZones: [
        { id: 'pz1', name: 'Anillo Dorado VIP', capacity: 800, occupancyPercent: 75, color: '#f2ca50' },
        { id: 'pz2', name: 'Zona Platea Media', capacity: 2500, occupancyPercent: 48, color: '#d4af37' },
        { id: 'pz3', name: 'Gradas Superiores', capacity: 4000, occupancyPercent: 37.5, color: '#99907c' }
      ],
      evidenceMedia: []
    },
    {
      id: 'EVT-103',
      title: 'Festival Tumbado Zapopan',
      date: '2026-08-28',
      location: 'Zapopan, JAL',
      venue: 'Auditorio Telmex',
      groupName: 'Grupo Dinastía Real',
      disqueraId: ACTIVE_DISQUERA_ID,
      status: 'Borrador',
      flyerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
      isCoProduction: true,
      coProductionPartner: 'Fonavisa Music',
      coProductionStatus: 'approved',
      ticketTiers: [
        { name: 'Zona Tumbada VIP', price: 2100, totalSeats: 600, soldSeats: 0, color: '#f2ca50' },
        { name: 'General A', price: 1100, totalSeats: 3000, soldSeats: 0, color: '#d4af37' }
      ],
      croquisZones: [
        { id: 'tz1', name: 'Poso VIP Frontal', capacity: 600, occupancyPercent: 0, color: '#f2ca50' },
        { id: 'tz2', name: 'Zona General de Pie', capacity: 3000, occupancyPercent: 0, color: '#d4af37' }
      ],
      evidenceMedia: []
    }
  ];

  private readonly INITIAL_PRESS: PressEvent[] = [
    {
      id: 'PRS-301',
      title: 'Firma de Autógrafos y Lanzamiento de Disco',
      type: 'Firma de Autógrafos',
      date: '2026-08-01',
      location: 'Plaza Fiesta San Agustín, Monterrey',
      groupName: 'Los Elegantes del Norte',
      operatingExpenses: 45000,
      mediaCount: 18,
      accreditedJournalists: ['El Norte (Sección Gente)', 'Televisa Monterrey', 'Multimedios Radio', 'La Mejor FM'],
      pressKitUrl: 'presskit_elegantes_2026.pdf',
      status: 'Programado',
      summary: 'Firma masiva de 1,000 autógrafos con pase de fotografía exclusivo para fans con boleto de la Arena Monterrey.'
    },
    {
      id: 'PRS-302',
      title: 'Rueda de Prensa Conexión Guadalajara',
      type: 'Rueda de Prensa',
      date: '2026-08-10',
      location: 'Hotel Fiesta Americana Minerva',
      groupName: 'Grupo Dinastía Real',
      operatingExpenses: 28000,
      mediaCount: 24,
      accreditedJournalists: ['Milenio Jalisco', 'El Informador', 'Exa FM Guadalajara', 'Bandamax'],
      pressKitUrl: 'presskit_dinastias_gdl.pdf',
      status: 'Programado',
      summary: 'Conferencia para anunciar el lanzamiento del álbum en co-producción con Fonovisa y la gira 2026.'
    }
  ];

  private readonly INITIAL_TASKS: TaskItem[] = [
    {
      id: 'TSK-01',
      title: 'Revisión y firma de adenda bancaria para Arena Monterrey',
      description: 'Validar transferencia de anticipo del 50% con departamento legal y contabilidad.',
      assignedTo: 'Lic. Claudia Morales',
      assignedRole: 'encargado',
      priority: 'Alta',
      privacy: 'Privada',
      status: 'En Proceso',
      dueDate: '2026-07-28',
      eventName: 'Noche de Gala Norteña 2026'
    },
    {
      id: 'TSK-02',
      title: 'Ajuste de margen de ganancias co-producción Fonovisa',
      description: 'Negociar comisión por venta de boletos digitales en el Auditorio Telmex.',
      assignedTo: 'Ing. Mateo Rivas',
      assignedRole: 'encargado',
      priority: 'Alta',
      privacy: 'Delicada',
      status: 'Pendiente',
      dueDate: '2026-07-30',
      eventName: 'Festival Tumbado Zapopan'
    },
    {
      id: 'TSK-03',
      title: 'Verificación de catering y camerinos VIP',
      description: 'Coordinar con el proveedor de alimentos requerimientos del rider para Los Elegantes del Norte.',
      assignedTo: 'Jorge Técnico',
      assignedRole: 'usuario',
      priority: 'Media',
      privacy: 'Pública',
      status: 'Pendiente',
      dueDate: '2026-08-14',
      eventName: 'Noche de Gala Norteña 2026'
    },
    {
      id: 'TSK-04',
      title: 'Subida de fotografías de inspección del escenario',
      description: 'Cargar evidencia fotográfica de las estructuras de iluminación en el estadio.',
      assignedTo: 'Mariana Staff',
      assignedRole: 'usuario',
      priority: 'Media',
      privacy: 'Pública',
      status: 'Completada',
      dueDate: '2026-07-20',
      eventName: 'Gran Palenque San Marcos'
    }
  ];

  private readonly INITIAL_CLIENTS: ClientItem[] = [
    {
      id: 'CLI-501',
      name: 'Roberto Gómez',
      company: 'Promociones del Norte SA',
      email: 'rgomez@promonorte.com',
      phone: '+52 81 8392 1029',
      totalEvents: 8,
      totalSpent: 2850000,
      status: 'Frecuente',
      lastQuoteDate: '2026-07-10',
      notes: 'Cliente preferencial. Solicita siempre fechas en fines de semana en Monterrey y Saltillo.'
    },
    {
      id: 'CLI-502',
      name: 'Lorena Mendoza',
      company: 'Patronato Feria San Marcos',
      email: 'lmendoza@feriasanmarcos.org',
      phone: '+52 449 910 2030',
      totalEvents: 4,
      totalSpent: 1940000,
      status: 'Frecuente',
      lastQuoteDate: '2026-07-18',
      notes: 'Organizador gubernamental. Requiere facturas con 30 días de crédito y fianza.'
    },
    {
      id: 'CLI-503',
      name: 'Carlos Villarreal',
      company: 'Empresa Tapatía de Espectáculos',
      email: 'carlos@tapatiaesp.mx',
      phone: '+52 33 3615 9022',
      totalEvents: 2,
      totalSpent: 480000,
      status: 'Activo',
      lastQuoteDate: '2026-07-20',
      notes: 'Enfocado en público joven en Guadalajara.'
    }
  ];

  private readonly INITIAL_USERS: AdminUserItem[] = [
    {
      id: 'USR-01',
      name: 'Lic. Claudia Morales',
      email: 'cmorales@acordex.com',
      role: 'encargado',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      status: 'Activo',
      lastAccess: 'Hoy 14:22'
    },
    {
      id: 'USR-02',
      name: 'Ing. Mateo Rivas',
      email: 'mrivas@acordex.com',
      role: 'administrador',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      status: 'Activo',
      lastAccess: 'Hoy 11:05'
    },
    {
      id: 'USR-03',
      name: 'Jorge Staff Ruiz',
      email: 'jstaff@acordex.com',
      role: 'usuario',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'Activo',
      lastAccess: 'Ayer 18:40'
    }
  ];

  private readonly INITIAL_AUDIT_LOGS: AuditLog[] = [
    {
      id: 'LOG-901',
      timestamp: '2026-07-23 14:15',
      userName: 'Lic. Claudia Morales',
      role: 'encargado',
      action: 'Aprobación de Contrato',
      targetModule: 'Cotizaciones',
      details: 'Aprobó cotización COT-8901 por $350,000 MXN para Los Elegantes del Norte'
    },
    {
      id: 'LOG-902',
      timestamp: '2026-07-23 11:02',
      userName: 'Ing. Mateo Rivas',
      role: 'administrador',
      action: 'Creación de Evento',
      targetModule: 'Eventos',
      details: 'Creó el borrador del evento Festival Tumbado Zapopan'
    },
    {
      id: 'LOG-903',
      timestamp: '2026-07-22 18:32',
      userName: 'Jorge Staff Ruiz',
      role: 'usuario',
      action: 'Carga de Evidencia',
      targetModule: 'Eventos',
      details: 'Subió 1 fotografía de ensayo en Arena Monterrey'
    }
  ];

  private readonly INITIAL_FILES: FileItem[] = [
    {
      id: 'FIL-01',
      fileName: 'Contrato_Exclusividad_Elegantes_2026.pdf',
      groupName: 'Los Elegantes del Norte',
      category: 'Contratos',
      size: '2.4 MB',
      uploadDate: '2026-01-15',
      url: '#'
    },
    {
      id: 'FIL-02',
      fileName: 'PressKit_Oficial_Banda_La_Imperial.pdf',
      groupName: 'Banda La Imperial',
      category: 'Press Kits',
      size: '8.1 MB',
      uploadDate: '2026-03-10',
      url: '#'
    },
    {
      id: 'FIL-03',
      fileName: 'Galeria_Fotografica_Ensayo_Gala.zip',
      groupName: 'Los Elegantes del Norte',
      category: 'Fotos',
      size: '45.8 MB',
      uploadDate: '2026-07-20',
      url: '#'
    },
    {
      id: 'FIL-04',
      fileName: 'Video_Promo_Arena_Monterrey.mp4',
      groupName: 'Los Elegantes del Norte',
      category: 'Videos',
      size: '120.5 MB',
      uploadDate: '2026-07-21',
      url: '#'
    }
  ];

  private readonly INITIAL_SETTINGS: CorporateSettings = {
    agencyName: 'ACORDEX Music & Entertainment Group',
    legalId: 'AME-920310-KX9',
    logoUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7edc?w=200&auto=format&fit=crop&q=80',
    contactEmail: 'contacto@acordexrecords.com',
    contactPhone: '+52 81 8000 9000',
    address: 'Av. Constitución 2000, Piso 14, San Pedro Garza García, NL',
    currency: 'MXN ($)',
    autoSaveMock: true
  };

  // --- SIGNALS STATE PERSISTED IN LOCALSTORAGE ---

  readonly groups = signal<GroupItem[]>(
    this.storage.getItem('acordex_groups', this.INITIAL_GROUPS)
  );

  readonly quotes = signal<Quote[]>(
    this.storage.getItem('acordex_quotes', this.INITIAL_QUOTES)
  );

  readonly events = signal<EventItem[]>(
    this.storage.getItem('acordex_events', this.INITIAL_EVENTS)
  );

  readonly pressEvents = signal<PressEvent[]>(
    this.storage.getItem('acordex_press', this.INITIAL_PRESS)
  );

  readonly tasks = signal<TaskItem[]>(
    this.storage.getItem('acordex_tasks', this.INITIAL_TASKS)
  );

  readonly clients = signal<ClientItem[]>(
    this.storage.getItem('acordex_clients', this.INITIAL_CLIENTS)
  );

  readonly users = signal<AdminUserItem[]>(
    this.storage.getItem('acordex_users', this.INITIAL_USERS)
  );

  readonly auditLogs = signal<AuditLog[]>(
    this.storage.getItem('acordex_audit', this.INITIAL_AUDIT_LOGS)
  );

  readonly files = signal<FileItem[]>(
    this.storage.getItem('acordex_files', this.INITIAL_FILES)
  );

  readonly settings = signal<CorporateSettings>(
    this.storage.getItem('acordex_settings', this.INITIAL_SETTINGS)
  );

  // --- COMPUTED SIGNALS BY ROLE & ISOLATION ---

  // Filter tasks according to role permissions
  readonly filteredTasks = computed(() => {
    const role = this.roleService.activeRole();
    const all = this.tasks();

    if (role === 'encargado') {
      return all; // Sees Public, Delicate, Private
    } else if (role === 'administrador') {
      return all.filter(t => t.privacy !== 'Privada'); // Sees Public and Delicate
    } else {
      // 'usuario' sees only Public tasks
      return all.filter(t => t.privacy === 'Pública');
    }
  });

  // Filtered groups: returns groups with data isolated to Acordex Records active session
  readonly isolatedGroups = computed(() => {
    return this.groups().map(g => {
      if (g.disqueraType === 'Co-gestionado' || g.disqueraType === 'Independiente / Por Evento') {
        // Ensure displayed revenue and event count only reflects Acordex partnership
        return {
          ...g,
          notesIsolated: `(Mostrando únicamente métricas y cotizaciones en convenio con Acordex Records)`
        };
      }
      return g;
    });
  });

  // Financial KPIs (Exclusive for Encargado)
  readonly financialKpis = computed(() => {
    const qList = this.quotes();
    const confirmedQuotes = qList.filter(q => q.paymentStatus === 'Pago Confirmado 100%' || q.paymentStatus === 'Anticipo 50%');
    const totalGrossRevenue = confirmedQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
    const totalNetProfit = confirmedQuotes.reduce((sum, q) => sum + q.marginAmount, 0);
    const pendingQuotesAmount = qList.filter(q => q.paymentStatus === 'Pendiente').reduce((sum, q) => sum + q.totalAmount, 0);

    return {
      totalGrossRevenue,
      totalNetProfit,
      pendingQuotesAmount,
      confirmedCount: confirmedQuotes.length
    };
  });

  // --- MUTATION METHODS (WITH PERSISTENCE & AUDIT LOGGING) ---

  private addAudit(action: string, targetModule: string, details: string): void {
    const currentRole = this.roleService.activeRole();
    const userName = currentRole === 'encargado' 
      ? 'Lic. Claudia Morales' 
      : currentRole === 'administrador' 
        ? 'Ing. Mateo Rivas' 
        : 'Jorge Staff Ruiz';

    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      userName,
      role: currentRole,
      action,
      targetModule,
      details
    };

    const updated = [newLog, ...this.auditLogs()];
    this.auditLogs.set(updated);
    this.storage.setItem('acordex_audit', updated);
  }

  // --- QUOTES OPERATIONS ---

  updateQuoteState(quoteId: string, newState: QuoteState): void {
    const updated = this.quotes().map(q => {
      if (q.id === quoteId) {
        return { ...q, state: newState };
      }
      return q;
    });
    this.quotes.set(updated);
    this.storage.setItem('acordex_quotes', updated);
    this.addAudit('Transición de Estado', 'Cotizaciones', `Cambió estado de ${quoteId} a "${newState}"`);
  }

  updateQuotePaymentStatus(quoteId: string, newPaymentStatus: PaymentStatus): void {
    const updated = this.quotes().map(q => {
      if (q.id === quoteId) {
        return { ...q, paymentStatus: newPaymentStatus };
      }
      return q;
    });
    this.quotes.set(updated);
    this.storage.setItem('acordex_quotes', updated);
    this.addAudit('Actualización de Pago', 'Cotizaciones', `Cambió estado de pago de ${quoteId} a "${newPaymentStatus}"`);
  }

  addQuote(newQuote: Omit<Quote, 'id' | 'dateCreated' | 'disqueraId'>): void {
    const created: Quote = {
      ...newQuote,
      id: `COT-${Math.floor(1000 + Math.random() * 9000)}`,
      disqueraId: ACTIVE_DISQUERA_ID,
      dateCreated: new Date().toISOString().slice(0, 10)
    };
    const updated = [created, ...this.quotes()];
    this.quotes.set(updated);
    this.storage.setItem('acordex_quotes', updated);
    this.addAudit('Creación de Cotización', 'Cotizaciones', `Creó la cotización ${created.id} para ${created.groupName}`);
  }

  // --- CO-PRODUCTION APPROVAL/REJECTION IN EVENTS ---

  respondCoProductionChanges(eventId: string, approve: boolean): void {
    const updated = this.events().map(ev => {
      if (ev.id === eventId && ev.pendingChanges) {
        if (approve) {
          return {
            ...ev,
            date: ev.pendingChanges.proposedDate || ev.date,
            venue: ev.pendingChanges.proposedVenue || ev.venue,
            coProductionStatus: 'approved' as const,
            pendingChanges: undefined
          };
        } else {
          return {
            ...ev,
            coProductionStatus: 'rejected' as const,
            pendingChanges: undefined
          };
        }
      }
      return ev;
    });
    this.events.set(updated);
    this.storage.setItem('acordex_events', updated);
    const actionText = approve ? 'Aprobó' : 'Rechazó';
    this.addAudit(`Co-producción ${actionText}`, 'Eventos', `${actionText} cambios propuestos para evento ${eventId}`);
  }

  // --- EVIDENCE UPLOAD FOR USUARIO ROLE IN EVENTS ---

  uploadEventEvidence(eventId: string, type: 'photo' | 'video', caption: string, url: string): void {
    const currentRole = this.roleService.activeRole();
    const uploaderName = currentRole === 'usuario' ? 'Jorge Staff Ruiz' : 'Administrador Acordex';

    const evidence: EventEvidence = {
      id: `ev-${Date.now()}`,
      type,
      url: url || (type === 'photo' 
        ? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80' 
        : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80'),
      caption,
      uploaderName,
      uploaderRole: currentRole,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const updated = this.events().map(ev => {
      if (ev.id === eventId) {
        return {
          ...ev,
          evidenceMedia: [evidence, ...(ev.evidenceMedia || [])]
        };
      }
      return ev;
    });

    this.events.set(updated);
    this.storage.setItem('acordex_events', updated);
    this.addAudit('Carga de Evidencia', 'Eventos', `Subió evidencia multimedia para evento ${eventId}`);
  }

  addEvent(newEvent: Omit<EventItem, 'id' | 'disqueraId' | 'evidenceMedia'>): void {
    const created: EventItem = {
      ...newEvent,
      id: `EVT-${Math.floor(100 + Math.random() * 900)}`,
      disqueraId: ACTIVE_DISQUERA_ID,
      evidenceMedia: []
    };
    const updated = [created, ...this.events()];
    this.events.set(updated);
    this.storage.setItem('acordex_events', updated);
    this.addAudit('Nuevo Evento', 'Eventos', `Registró el evento ${created.title}`);
  }

  // --- TASKS OPERATIONS ---

  updateTaskStatus(taskId: string, newStatus: 'Pendiente' | 'En Proceso' | 'Completada'): void {
    const updated = this.tasks().map(t => {
      if (t.id === taskId) {
        return { ...t, status: newStatus };
      }
      return t;
    });
    this.tasks.set(updated);
    this.storage.setItem('acordex_tasks', updated);
    this.addAudit('Estado de Tarea', 'Tareas', `Actualizó tarea ${taskId} a "${newStatus}"`);
  }

  addTask(newTask: Omit<TaskItem, 'id'>): void {
    const created: TaskItem = {
      ...newTask,
      id: `TSK-${Math.floor(10 + Math.random() * 90)}`
    };
    const updated = [created, ...this.tasks()];
    this.tasks.set(updated);
    this.storage.setItem('acordex_tasks', updated);
    this.addAudit('Nueva Tarea', 'Tareas', `Creó tarea "${created.title}" [Privacidad: ${created.privacy}]`);
  }

  // --- CLIENTS CRM OPERATIONS ---

  sendSpecialOfferToClient(clientId: string, discountPercent: number, offerDetails: string): void {
    this.addAudit('Despacho de Oferta', 'Clientes CRM', `Envió propuesta especial con ${discountPercent}% desc. al cliente ${clientId}: ${offerDetails}`);
  }

  // --- USERS MANAGEMENT ---

  updateUserRole(userId: string, newRole: Role): void {
    const updated = this.users().map(u => {
      if (u.id === userId) {
        return { ...u, role: newRole };
      }
      return u;
    });
    this.users.set(updated);
    this.storage.setItem('acordex_users', updated);
    this.addAudit('Cambio de Rol de Usuario', 'Usuarios', `Asignó el rol "${newRole}" al usuario ${userId}`);
  }

  // --- FILES OPERATIONS ---

  uploadFile(file: Omit<FileItem, 'id' | 'uploadDate'>): void {
    const created: FileItem = {
      ...file,
      id: `FIL-${Math.floor(10 + Math.random() * 90)}`,
      uploadDate: new Date().toISOString().slice(0, 10)
    };
    const updated = [created, ...this.files()];
    this.files.set(updated);
    this.storage.setItem('acordex_files', updated);
    this.addAudit('Carga de Archivo', 'Archivos', `Cargó archivo "${created.fileName}" para ${created.groupName}`);
  }

  deleteFile(fileId: string): void {
    const target = this.files().find(f => f.id === fileId);
    const updated = this.files().filter(f => f.id !== fileId);
    this.files.set(updated);
    this.storage.setItem('acordex_files', updated);
    this.addAudit('Eliminación de Archivo', 'Archivos', `Eliminó archivo "${target?.fileName || fileId}"`);
  }

  // --- SETTINGS OPERATION ---

  updateSettings(newSettings: CorporateSettings): void {
    this.settings.set(newSettings);
    this.storage.setItem('acordex_settings', newSettings);
    this.addAudit('Actualización Configuración', 'Configuración', 'Actualizó perfil corporativo de la disquera');
  }
}
