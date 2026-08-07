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
  Role,
  ReceivingCard
} from '../models/admin.models';
import {
  EventReviewRound,
  EventTimelineStep,
  NewEventDraft
} from '../models/event.models';

const ACTIVE_DISQUERA_ID = 'acordex-records';

/**
 * Etiquetas de fila para el mapa de butacas ('A', 'B', … 'Z', 'AA', 'AB'…).
 *
 * El selector de asientos del portal del cliente arma la butaquería a partir de
 * las filas y las butacas por fila de cada categoría, así que `startAt` sirve
 * para que dos categorías del mismo recinto no compartan letra de fila.
 */
function seatRows(count: number, startAt = 0): string[] {
  const label = (index: number): string => {
    let n = index;
    let out = '';
    do {
      out = String.fromCharCode(65 + (n % 26)) + out;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return out;
  };
  return Array.from({ length: count }, (_, i) => label(startAt + i));
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private storage = inject(StorageService);
  private roleService = inject(RoleService);

  // --- SEED DATA DEFINITIONS ---

  public readonly INITIAL_RECEIVING_CARDS: ReceivingCard[] = [
    {
      id: 'card-bbva-01',
      bankName: 'BBVA México',
      accountHolder: 'Acordex Entertainment S.A. de C.V.',
      cardNumber: '**** **** **** 4921',
      clabe: '012180001234567890',
      cardType: 'Empresarial',
      isDefault: true
    },
    {
      id: 'card-banamex-02',
      bankName: 'Citibanamex',
      accountHolder: 'Acordex Records Corporativo',
      cardNumber: '**** **** **** 8812',
      clabe: '002180009876543210',
      cardType: 'Empresarial',
      isDefault: false
    },
    {
      id: 'card-banorte-03',
      bankName: 'Banorte',
      accountHolder: 'Acordex Representaciones Musicales',
      cardNumber: '**** **** **** 1042',
      clabe: '072180004567890123',
      cardType: 'Débito',
      isDefault: false
    }
  ];

  private readonly INITIAL_GROUPS: GroupItem[] = [
    {
      id: 'grp-1',
      name: 'Los Elegantes del Norte',
      disqueraType: 'Firmado Exclusivo',
      disqueraId: ACTIVE_DISQUERA_ID,
      disqueraName: 'Acordex Records',
      genre: 'Norteño Sax',
      rating: 4.9,
      publicApprovalPercent: 98,
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      membersCount: 5,
      labelQuotesCount: 14,
      pendingQuotesCount: 4,
      completedQuotesCount: 10,
      labelActiveEventsCount: 5,
      monthlyEventsCount: 8,
      monthlyQuotesCount: 12,
      labelRevenueAcordex: 450000,
      artistFeeBase: 320000,
      estimatedMonthlyEarnings: 680000,
      agendaStatus: 'Parcialmente Ocupado',
      followersCount: '1.4M',
      isPlatformRegistered: true,
      isExclusive: true,
      pendingLabelContract: false,
      groupLeaderName: 'Don Raúl Treviño',
      groupLeaderRole: 'Director Musical & Vocalista',
      groupLeaderPhone: '+52 81 9928 1120',
      groupLeaderEmail: 'raul.trevino@elegantes.com',
      lastActivityText: 'Publicó nuevo video de ensayo en la Arena Monterrey',
      lastActivityTime: 'Hace 35 min',
      isOnline: true,
      lastConnectionText: 'En línea ahora',
      globalTotalEventsCount: 28,
      description: 'Banda estelar en exclusiva con Acordex Records. Máximos exponentes del género Norteño Sax.',
      dailyMetrics: [
        { date: '2026-07-30', dayLabel: 'Jue', quotes: 2, events: 1, revenue: 85000 },
        { date: '2026-07-31', dayLabel: 'Vie', quotes: 4, events: 2, revenue: 160000 },
        { date: '2026-08-01', dayLabel: 'Sáb', quotes: 5, events: 3, revenue: 240000 },
        { date: '2026-08-02', dayLabel: 'Dom', quotes: 3, events: 1, revenue: 90000 },
        { date: '2026-08-03', dayLabel: 'Lun', quotes: 1, events: 0, revenue: 0 },
        { date: '2026-08-04', dayLabel: 'Mar', quotes: 2, events: 0, revenue: 0 },
        { date: '2026-08-05', dayLabel: 'Mié', quotes: 3, events: 1, revenue: 105000 }
      ]
    },
    {
      id: 'grp-2',
      name: 'Grupo Dinastía Real',
      disqueraType: 'Co-gestionado',
      disqueraId: ACTIVE_DISQUERA_ID,
      disqueraName: 'Acordex Records / Fonovisa',
      genre: 'Corridos Tumbados / Sierreño',
      rating: 4.8,
      publicApprovalPercent: 94,
      image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
      membersCount: 4,
      labelQuotesCount: 8,
      pendingQuotesCount: 3,
      completedQuotesCount: 5,
      labelActiveEventsCount: 3,
      monthlyEventsCount: 6,
      monthlyQuotesCount: 9,
      labelRevenueAcordex: 280000,
      artistFeeBase: 210000,
      estimatedMonthlyEarnings: 420000,
      agendaStatus: 'Agenda Llena',
      followersCount: '2.8M',
      isPlatformRegistered: true,
      isExclusive: false,
      pendingLabelContract: false,
      groupLeaderName: 'Mateo "El Güero" Rivas',
      groupLeaderRole: 'Primera Guitarra & Representante',
      groupLeaderPhone: '+52 33 1044 8839',
      groupLeaderEmail: 'mrivas@dinastiareal.com',
      lastActivityText: 'Actualizó su rider técnico de sonido para palenques',
      lastActivityTime: 'Hace 2 horas',
      isOnline: true,
      lastConnectionText: 'En línea ahora',
      globalTotalEventsCount: 45,
      description: 'Grupo en alianza estratégica entre Acordex Records y disqueras afiliadas. Los datos mostrados corresponden a la participación de Acordex.',
      dailyMetrics: [
        { date: '2026-07-30', dayLabel: 'Jue', quotes: 1, events: 0, revenue: 0 },
        { date: '2026-07-31', dayLabel: 'Vie', quotes: 3, events: 1, revenue: 110000 },
        { date: '2026-08-01', dayLabel: 'Sáb', quotes: 4, events: 2, revenue: 220000 },
        { date: '2026-08-02', dayLabel: 'Dom', quotes: 2, events: 1, revenue: 95000 },
        { date: '2026-08-03', dayLabel: 'Lun', quotes: 0, events: 0, revenue: 0 },
        { date: '2026-08-04', dayLabel: 'Mar', quotes: 1, events: 1, revenue: 80000 },
        { date: '2026-08-05', dayLabel: 'Mié', quotes: 2, events: 1, revenue: 120000 }
      ]
    },
    {
      id: 'grp-3',
      name: 'Banda La Imperial',
      disqueraType: 'Firmado Exclusivo',
      disqueraId: ACTIVE_DISQUERA_ID,
      disqueraName: 'Acordex Records',
      genre: 'Banda Sinaloense',
      rating: 4.95,
      publicApprovalPercent: 99,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      membersCount: 16,
      labelQuotesCount: 22,
      pendingQuotesCount: 6,
      completedQuotesCount: 16,
      labelActiveEventsCount: 8,
      monthlyEventsCount: 14,
      monthlyQuotesCount: 18,
      labelRevenueAcordex: 920000,
      artistFeeBase: 650000,
      estimatedMonthlyEarnings: 1350000,
      agendaStatus: 'Agenda Llena',
      followersCount: '4.1M',
      isPlatformRegistered: true,
      isExclusive: true,
      pendingLabelContract: false,
      groupLeaderName: 'Maestro Fernando Castillo',
      groupLeaderRole: 'Director General & Tubero',
      groupLeaderPhone: '+52 66 7182 9901',
      groupLeaderEmail: 'fcastillo@laimperial.mx',
      lastActivityText: 'Publicó comunicado oficial de gira 2026 en Acordex Feed',
      lastActivityTime: 'Hace 5 horas',
      isOnline: false,
      lastConnectionText: 'Hace 45 min',
      globalTotalEventsCount: 32,
      description: 'Orquesta de banda sinaloense con presencia estelar en palenques y ferias nacionales.',
      dailyMetrics: [
        { date: '2026-07-30', dayLabel: 'Jue', quotes: 3, events: 1, revenue: 180000 },
        { date: '2026-07-31', dayLabel: 'Vie', quotes: 5, events: 3, revenue: 450000 },
        { date: '2026-08-01', dayLabel: 'Sáb', quotes: 6, events: 4, revenue: 600000 },
        { date: '2026-08-02', dayLabel: 'Dom', quotes: 4, events: 2, revenue: 300000 },
        { date: '2026-08-03', dayLabel: 'Lun', quotes: 2, events: 1, revenue: 150000 },
        { date: '2026-08-04', dayLabel: 'Mar', quotes: 3, events: 1, revenue: 150000 },
        { date: '2026-08-05', dayLabel: 'Mié', quotes: 4, events: 2, revenue: 280000 }
      ]
    },
    {
      id: 'grp-4',
      name: 'Valentina & Los De La Sierra',
      disqueraType: 'Independiente / Por Evento',
      disqueraId: ACTIVE_DISQUERA_ID,
      disqueraName: 'Independiente (Representado por Acordex)',
      genre: 'Campirano / Acústico',
      rating: 4.7,
      publicApprovalPercent: 91,
      image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
      membersCount: 3,
      labelQuotesCount: 5,
      pendingQuotesCount: 2,
      completedQuotesCount: 3,
      labelActiveEventsCount: 2,
      monthlyEventsCount: 4,
      monthlyQuotesCount: 5,
      labelRevenueAcordex: 110000,
      artistFeeBase: 85000,
      estimatedMonthlyEarnings: 180000,
      agendaStatus: 'Totalmente Libre',
      followersCount: '620K',
      isPlatformRegistered: false,
      isExclusive: false,
      pendingLabelContract: false,
      groupLeaderName: 'Valentina Morales',
      groupLeaderRole: 'Cantautora & Guitarra Quinta',
      groupLeaderPhone: '+52 81 2293 4011',
      groupLeaderEmail: 'valen@delasierra.com',
      lastActivityText: 'Confirmó disponibilidad para evento privado en CDMX',
      lastActivityTime: 'Ayer',
      isOnline: false,
      lastConnectionText: 'Hace 3 horas',
      globalTotalEventsCount: 19,
      description: 'Talento independiente con acuerdos de representación y booking por fecha a través de Acordex.',
      dailyMetrics: [
        { date: '2026-07-30', dayLabel: 'Jue', quotes: 0, events: 0, revenue: 0 },
        { date: '2026-07-31', dayLabel: 'Vie', quotes: 1, events: 1, revenue: 45000 },
        { date: '2026-08-01', dayLabel: 'Sáb', quotes: 2, events: 1, revenue: 55000 },
        { date: '2026-08-02', dayLabel: 'Dom', quotes: 1, events: 0, revenue: 0 },
        { date: '2026-08-03', dayLabel: 'Lun', quotes: 0, events: 0, revenue: 0 },
        { date: '2026-08-04', dayLabel: 'Mar', quotes: 1, events: 0, revenue: 0 },
        { date: '2026-08-05', dayLabel: 'Mié', quotes: 1, events: 1, revenue: 40000 }
      ]
    },
    {
      id: 'grp-5',
      name: 'Los Herederos del Regio',
      disqueraType: 'Pendiente de Firma',
      disqueraId: ACTIVE_DISQUERA_ID,
      disqueraName: 'Acordex Records (En Negociación)',
      genre: 'Norteño Clásico / Acordeón',
      rating: 4.6,
      publicApprovalPercent: 88,
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
      membersCount: 4,
      labelQuotesCount: 3,
      pendingQuotesCount: 3,
      completedQuotesCount: 0,
      labelActiveEventsCount: 1,
      monthlyEventsCount: 2,
      monthlyQuotesCount: 4,
      labelRevenueAcordex: 60000,
      artistFeeBase: 50000,
      estimatedMonthlyEarnings: 120000,
      agendaStatus: 'Totalmente Libre',
      followersCount: '340K',
      isPlatformRegistered: false,
      isExclusive: false,
      pendingLabelContract: true,
      groupLeaderName: 'Lic. Gonzalo Garza',
      groupLeaderRole: 'Manager & Acordeonista',
      groupLeaderPhone: '+52 81 4402 1199',
      groupLeaderEmail: 'gonzalo@herederosregio.com',
      lastActivityText: 'Cargó borrador de contrato para revisión legal',
      lastActivityTime: 'Hace 1 día',
      isOnline: false,
      lastConnectionText: 'Hace 1 día',
      globalTotalEventsCount: 12,
      description: 'Grupo emergente con propuesta de contrato en revisión para unirse al catálogo exclusivo de Acordex Records.',
      dailyMetrics: [
        { date: '2026-07-30', dayLabel: 'Jue', quotes: 1, events: 0, revenue: 0 },
        { date: '2026-07-31', dayLabel: 'Vie', quotes: 1, events: 0, revenue: 0 },
        { date: '2026-08-01', dayLabel: 'Sáb', quotes: 1, events: 1, revenue: 35000 },
        { date: '2026-08-02', dayLabel: 'Dom', quotes: 0, events: 0, revenue: 0 },
        { date: '2026-08-03', dayLabel: 'Lun', quotes: 0, events: 0, revenue: 0 },
        { date: '2026-08-04', dayLabel: 'Mar', quotes: 1, events: 0, revenue: 0 },
        { date: '2026-08-05', dayLabel: 'Mié', quotes: 0, events: 0, revenue: 0 }
      ]
    },
    {
      id: 'grp-6',
      name: 'Sonido Dinamita Urbano',
      disqueraType: 'Co-gestionado',
      disqueraId: ACTIVE_DISQUERA_ID,
      disqueraName: 'Acordex Records / Discos América',
      genre: 'Cumbia Sonidera / Fusión',
      rating: 4.85,
      publicApprovalPercent: 96,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      membersCount: 8,
      labelQuotesCount: 11,
      pendingQuotesCount: 3,
      completedQuotesCount: 8,
      labelActiveEventsCount: 4,
      monthlyEventsCount: 9,
      monthlyQuotesCount: 14,
      labelRevenueAcordex: 390000,
      artistFeeBase: 280000,
      estimatedMonthlyEarnings: 560000,
      agendaStatus: 'Parcialmente Ocupado',
      followersCount: '1.9M',
      isPlatformRegistered: true,
      isExclusive: false,
      pendingLabelContract: false,
      groupLeaderName: 'DJ & Mtro. Samuel Vargas',
      groupLeaderRole: 'Líder & Percusionista',
      groupLeaderPhone: '+52 55 8190 4422',
      groupLeaderEmail: 'samuel@sonidodinamita.com',
      lastActivityText: 'Publicó nueva muestra de audio de cumbia sonidera en Acordex Feed',
      lastActivityTime: 'Hace 10 min',
      isOnline: true,
      lastConnectionText: 'En línea ahora',
      globalTotalEventsCount: 38,
      description: 'Orquesta tropical urbana co-gestionada para eventos masivos, festivales y fiestas privadas en todo el país.',
      dailyMetrics: [
        { date: '2026-07-30', dayLabel: 'Jue', quotes: 2, events: 1, revenue: 60000 },
        { date: '2026-07-31', dayLabel: 'Vie', quotes: 3, events: 2, revenue: 130000 },
        { date: '2026-08-01', dayLabel: 'Sáb', quotes: 4, events: 2, revenue: 140000 },
        { date: '2026-08-02', dayLabel: 'Dom', quotes: 2, events: 1, revenue: 60000 },
        { date: '2026-08-03', dayLabel: 'Lun', quotes: 1, events: 0, revenue: 0 },
        { date: '2026-08-04', dayLabel: 'Mar', quotes: 1, events: 0, revenue: 0 },
        { date: '2026-08-05', dayLabel: 'Mié', quotes: 2, events: 1, revenue: 70000 }
      ]
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
      state: 'Finalizada',
      paymentStatus: 'Pago Confirmado 100%',
      isCycleSealed: true,
      sealedAt: '2026-07-28 18:00',
      sealedBy: 'Lic. Sofía Ramírez (Admin)',
      finalClosureSummary: 'Expediente COT-8901 finalizado y sellado inmutablemente tras cumplir con las obligaciones contractuales y cobranza tesorería.',
      terms: '50% de anticipo al firmar, 50% el día de la prueba de sonido. Hospedaje y camerino VIP incluidos.',
      contractPdfUrl: 'contrato_COT-8901_firmado.pdf',
      dateCreated: '2026-07-10',
      eventType: 'Concierto',
      durationHours: 3,
      eventAddress: 'Av. Fundidora #501, Col. Obrera, Monterrey, N.L.',
      representativeName: 'Ing. Luis Donaldo',
      representativePhone: '+52 81 1234 5678',
      genre: 'Norteño Sax',
      rating: 4.8,
      artistImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
      advancePaymentType: 'percentage',
      advancePaymentValue: 50,
      paymentDueDate: '2026-08-15',
      receivingCardId: 'card-bbva-01',
      maxAllowedDelays: 2,
      paymentMilestones: [
        { 
          id: 'm1_8901', 
          label: '50% Anticipo de Reserva al Firmar', 
          percentageOrAmount: 50, 
          type: 'percentage', 
          dueDateOrTimeframe: '2026-07-16',
          status: 'Pagado',
          amountCalculated: 175000,
          paidAmount: 175000,
          paidAt: '2026-07-16 10:15 AM',
          paymentReceiptUrl: 'comprobante_anticipo_COT8901.pdf',
          receiptReference: 'SPEI-99382104'
        },
        { 
          id: 'm2_8901', 
          label: '25% Segundo Pago Intermedio (Soundcheck)', 
          percentageOrAmount: 25, 
          type: 'percentage', 
          dueDateOrTimeframe: '2026-08-01',
          status: 'Pagado',
          amountCalculated: 87500,
          paidAmount: 87500,
          paidAt: '2026-08-01 11:00 AM',
          receiptReference: 'SPEI-44912093'
        },
        { 
          id: 'm3_8901', 
          label: '25% Finiquito Final Día del Evento', 
          percentageOrAmount: 25, 
          type: 'percentage', 
          dueDateOrTimeframe: '2026-08-15',
          status: 'Pagado',
          amountCalculated: 87500,
          paidAmount: 87500,
          paidAt: '2026-08-15 09:30 PM',
          receiptReference: 'SPEI-55102948'
        }
      ],
      clientNotices: [
        {
          id: 'n_cli_1',
          target: 'Cliente',
          title: 'Confirmación de Firma y Recepción de Anticipo',
          message: 'Se ha verificado el pago del 50% de anticipo ($175,000 MXN). El contrato digital ha entrado en vigor legal vinculante.',
          sentBy: 'Lic. Sofía Ramírez',
          sentRole: 'administrador',
          sentAt: '2026-07-16 10:30 AM',
          channels: ['Email', 'WhatsApp'],
          priority: 'Normal'
        }
      ],
      groupNotices: [
        {
          id: 'n_grp_1',
          target: 'Grupo Musical',
          title: 'Notificación de Fecha Bloqueada y Prueba de Sonido',
          message: 'Atención Manager: La fecha del 15 de Agosto en Arena Monterrey ha sido confirmada y firmada. El horario de soundcheck se fijó a las 17:00 hrs.',
          sentBy: 'Lic. Sofía Ramírez',
          sentRole: 'administrador',
          sentAt: '2026-07-16 10:35 AM',
          channels: ['WhatsApp', 'Platform'],
          priority: 'Alta'
        }
      ],
      chatHistory: [
        {
          id: 'c1',
          senderName: 'Roberto Gómez (Cliente)',
          senderRole: 'Cliente',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          message: 'Buenas tardes. Confirmando que ya enviamos el comprobante del primer anticipo SPEI por $175,000 MXN. ¿A qué hora requerirán el acceso para el equipo técnico?',
          timestamp: '2026-07-16 10:18 AM'
        },
        {
          id: 'c2',
          senderName: 'Manager Los Elegantes del Norte',
          senderRole: 'Grupo Musical',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          message: 'Excelente noticia. Nuestro tráiler con equipo de audio e iluminación llegará a las 15:00 hrs para montaje.',
          timestamp: '2026-07-16 10:25 AM'
        },
        {
          id: 'c3',
          senderName: 'Lic. Sofía Ramírez (Disquera)',
          senderRole: 'Admin',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          message: 'Comprobante recibido y validado por la tesorería de Acordex. Todo en orden para la presentación.',
          timestamp: '2026-07-16 10:32 AM'
        }
      ],
      incidents: [],
      incidentStatus: 'Ninguno',
      traceabilityTimeline: [
        {
          id: 'ts_1',
          phaseNumber: 1,
          phaseName: 'Revisión Solicitud',
          state: 'En revisión',
          completedAt: '2026-07-10 09:00 AM',
          actorName: 'Roberto Gómez (Cliente)',
          summaryNote: 'Solicitud enviada a través del portal de contrataciones para 3 horas de show.',
          snapshotData: { totalAmount: 420000, clientEmail: 'rgomez@promonorte.com', venue: 'Arena Monterrey' }
        },
        {
          id: 'ts_2',
          phaseNumber: 2,
          phaseName: 'Propuesta & Negociación',
          state: 'Negociación',
          completedAt: '2026-07-15 04:45 PM',
          actorName: 'Lic. Sofía Ramírez (Admin)',
          summaryNote: 'Cierre de negociación comercial en Ronda #2 por $350,000 MXN con 50% anticipo.',
          snapshotData: { totalAmount: 350000, negotiationRounds: 2 }
        },
        {
          id: 'ts_3',
          phaseNumber: 3,
          phaseName: 'Cotización Aceptada',
          state: 'Aceptada',
          completedAt: '2026-07-15 05:30 PM',
          actorName: 'Roberto Gómez (Cliente)',
          summaryNote: 'El cliente aceptó formalmente la propuesta comercial ajustada.',
          snapshotData: { totalAmount: 350000 }
        },
        {
          id: 'ts_4',
          phaseNumber: 4,
          phaseName: 'Contrato en Espera de Firma',
          state: 'Contrato en espera de firma',
          completedAt: '2026-07-15 06:00 PM',
          actorName: 'Sistema de Contratos Acordex',
          summaryNote: 'Borrador de contrato privado de prestación de servicios musicales generado.',
          snapshotData: { contractHash: '0x8f7a...3b9e' }
        },
        {
          id: 'ts_5',
          phaseNumber: 5,
          phaseName: 'Contrato Firmado por Ambas Partes',
          state: 'Contrato firmado',
          completedAt: '2026-07-16 10:15 AM',
          actorName: 'Roberto Gómez & Disquera Acordex',
          summaryNote: 'Firma digital completada con SHA-256 inmutable y anticipo 50% recibido.',
          snapshotData: { signedByClientAt: '2026-07-16 10:15 AM', signedByAdminAt: '2026-07-16 10:16 AM', contractHash: '0x8f7a...3b9e', paymentMilestonesCount: 3 }
        }
      ],
      negotiationRound: 2,
      negotiationHistory: [
        {
          round: 1,
          clientRejectionMessage: 'El presupuesto inicial de $420,000 MXN excede el límite autorizado del comité. Solicitamos evaluar descuento por pago anticipado.',
          adminProposalNote: 'Se redujo la tarifa de honorarios en un 12% y se ajustaron viáticos para cerrar en $380,000 MXN.',
          totalOffered: 380000,
          artistFee: 260000,
          viaticosCost: 50000,
          soundCost: 70000,
          marginPercent: 20,
          timestamp: '2026-07-12 11:30 AM',
          proposedDate: '2026-08-15',
          scheduleMode: 'continuo',
          startTime: '21:00',
          endTime: '00:00',
          durationHours: 3,
          soundOption: 'proveedor',
          advancePaymentType: 'percentage',
          advancePaymentValue: 50,
          paymentDueDate: '2026-08-01'
        },
        {
          round: 2,
          clientRejectionMessage: 'Requerimos un ajuste adicional en la comisión de audio ya que la empresa contratante cuenta con su propio personal técnico.',
          adminProposalNote: 'Acuerdo comercial definitivo alcanzado a $350,000 MXN con 50% de anticipo y 3 parcialidades.',
          totalOffered: 350000,
          artistFee: 240000,
          viaticosCost: 45000,
          soundCost: 65000,
          marginPercent: 18,
          timestamp: '2026-07-15 04:45 PM',
          proposedDate: '2026-08-15',
          scheduleMode: 'continuo',
          startTime: '21:00',
          endTime: '00:00',
          durationHours: 3,
          soundOption: 'proveedor',
          advancePaymentType: 'percentage',
          advancePaymentValue: 50,
          paymentDueDate: '2026-08-15'
        }
      ]
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
      dateCreated: '2026-07-18',
      eventType: 'Concierto',
      durationHours: 4,
      eventAddress: 'Explanada del Palenque, San Marcos, Aguascalientes, AGS.',
      representativeName: 'Ing. Luis Donaldo',
      representativePhone: '+52 81 1234 5678',
      genre: 'Banda Sinaloense',
      rating: 4.9,
      artistImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
      negotiationRound: 2,
      negotiationHistory: [
        {
          round: 1,
          clientRejectionMessage: 'El monto original de $620,000 MXN supera el tope presupuestal autorizado del patronato para esta fecha estelar.',
          adminProposalNote: 'Rebajamos honorarios principales y margen comercial al 18% para ajustar a $580,000 MXN.',
          totalOffered: 580000,
          artistFee: 420000,
          viaticosCost: 80000,
          soundCost: 80000,
          marginPercent: 18,
          timestamp: '2026-07-20 02:15 PM',
          proposedDate: '2026-09-02',
          scheduleMode: 'continuo',
          startTime: '22:00',
          endTime: '01:00',
          durationHours: 3,
          totalShowHours: 3,
          advancePaymentType: 'percentage',
          advancePaymentValue: 50,
          paymentDueDate: '2026-08-25',
          receivingCardId: 'card-bbva-01',
          paymentMilestones: [
            { id: 'm1_r1', label: '50% Anticipo de Reserva', percentageOrAmount: 50, type: 'percentage', dueDateOrTimeframe: '2026-08-01' },
            { id: 'm2_r1', label: '25% Segundo Pago Intermedio', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-15' },
            { id: 'm3_r1', label: '25% Finiquito Final', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-25' }
          ]
        },
        {
          round: 2,
          clientRejectionMessage: 'El patronato pide una última rebaja comercial a $540,000 MXN y que el grupo incluya 30 minutos extras de mariachi al cierre del palenque.',
          adminProposalNote: 'Analizando la posibilidad de subsidiar viáticos de transporte y ajustar la comisión de la disquera al 15%.',
          totalOffered: 540000,
          artistFee: 400000,
          viaticosCost: 70000,
          soundCost: 70000,
          marginPercent: 15,
          timestamp: '2026-07-23 11:30 AM',
          proposedDate: '2026-09-02',
          scheduleMode: 'continuo',
          startTime: '22:30',
          endTime: '02:00',
          durationHours: 3.5,
          totalShowHours: 3.5,
          advancePaymentType: 'percentage',
          advancePaymentValue: 50,
          paymentDueDate: '2026-08-25',
          receivingCardId: 'card-bbva-01',
          paymentMilestones: [
            { id: 'm1_r2', label: '50% Anticipo de Reserva', percentageOrAmount: 50, type: 'percentage', dueDateOrTimeframe: '2026-08-01' },
            { id: 'm2_r2', label: '25% Segundo Pago Intermedio', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-15' },
            { id: 'm3_r2', label: '25% Finiquito Final', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-25' }
          ]
        }
      ]
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
      totalAmount: 200000,
      marginAmount: 26000,
      artistFee: 140000,
      viaticosCost: 32000,
      soundCost: 28000,
      advancePaymentType: 'percentage',
      advancePaymentValue: 50,
      paymentDueDate: '2026-08-25',
      receivingCardId: 'card-bbva-01',
      paymentMilestones: [
        { id: 'm1', label: '50% Anticipo de Reserva', percentageOrAmount: 50, type: 'percentage', dueDateOrTimeframe: '2026-08-01' },
        { id: 'm2', label: '25% Segundo Pago Intermedio', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-15' },
        { id: 'm3', label: '25% Finiquito Final', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-25' }
      ],
      state: 'Propuesta enviada',
      paymentStatus: 'Pendiente',
      terms: 'Evento co-producido con Fonovisa. Reparto de utilidades 60/40.',
      dateCreated: '2026-07-20',
      eventType: 'Concierto',
      durationHours: 3,
      eventAddress: 'Obreros de Cananea #747, Col. Los Belenes, Zapopan, JAL.',
      representativeName: 'Ing. Luis Donaldo',
      representativePhone: '+52 81 1234 5678',
      genre: 'Mariachi / Regional',
      rating: 4.6,
      artistImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
      negotiationRound: 5,
      negotiationHistory: [
        {
          round: 1,
          clientRejectionMessage: 'El presupuesto inicial de $240,000 MXN supera el límite autorizado de $220k para este recinto. Solicitamos reducir costos de honorarios o ajustar el margen comercial de la disquera.',
          clientRejectedAt: '2026-07-23 09:30 AM',
          adminProposalNote: 'Se redujo la comisión de la disquera del 20% al 18% y se ofreció un ajuste comercial en viáticos.',
          totalOffered: 230000,
          artistFee: 160000,
          viaticosCost: 38000,
          soundCost: 32000,
          marginPercent: 18,
          timestamp: '2026-07-22 10:15 AM',
          proposedDate: '2026-08-28',
          scheduleMode: 'continuo',
          startTime: '20:00',
          endTime: '23:00',
          durationHours: 3,
          totalShowHours: 3,
          advancePaymentType: 'percentage',
          advancePaymentValue: 50,
          paymentDueDate: '2026-08-25',
          receivingCardId: 'card-bbva-01',
          paymentMilestones: [
            { id: 'm1_8903_r1', label: '50% Anticipo de Reserva', percentageOrAmount: 50, type: 'percentage', dueDateOrTimeframe: '2026-08-01' },
            { id: 'm2_8903_r1', label: '25% Segundo Pago Intermedio', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-15' },
            { id: 'm3_8903_r1', label: '25% Finiquito Final', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-25' }
          ]
        },
        {
          round: 2,
          clientRejectionMessage: 'Sigue estando elevado ($230k). Además requerimos cambiar la fecha al 29 de agosto y dividir el concierto en 2 tandas (Set 1: 21:00 a 22:30 y Set 2: 23:00 a 00:30).',
          clientRejectedAt: '2026-07-25 10:15 AM',
          adminProposalNote: 'Se aceptó el cambio de fecha al 29 de agosto y el formato de 2 tandas. Redujimos el margen de disquera al 16%.',
          totalOffered: 220000,
          artistFee: 155000,
          viaticosCost: 36000,
          soundCost: 29000,
          marginPercent: 16,
          timestamp: '2026-07-24 04:30 PM',
          proposedDate: '2026-08-29',
          scheduleMode: 'tandas',
          showBlocks: [
            { id: 'b1', label: 'Tanda 1: Set Apertura', date: '2026-08-29', startTime: '21:00', endTime: '22:30' },
            { id: 'b2', label: 'Tanda 2: Set Cierre', date: '2026-08-29', startTime: '23:00', endTime: '00:30' }
          ],
          totalShowHours: 3,
          advancePaymentType: 'percentage',
          advancePaymentValue: 50,
          paymentDueDate: '2026-08-25',
          receivingCardId: 'card-bbva-01',
          paymentMilestones: [
            { id: 'm1_8903_r2', label: '50% Anticipo de Reserva', percentageOrAmount: 50, type: 'percentage', dueDateOrTimeframe: '2026-08-01' },
            { id: 'm2_8903_r2', label: '25% Segundo Pago Intermedio', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-15' },
            { id: 'm3_8903_r2', label: '25% Finiquito Final', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-25' }
          ]
        },
        {
          round: 3,
          clientRejectionMessage: 'El patronato aprobó $215,000 MXN pero solicita que la disquera absorba la planta de luz y el transporte local.',
          clientRejectedAt: '2026-07-26 01:45 PM',
          adminProposalNote: 'Se absorbió el costo de planta de luz y ajustamos viáticos a $35,000 MXN con un margen de disquera del 15%.',
          totalOffered: 215000,
          artistFee: 150000,
          viaticosCost: 35000,
          soundCost: 30000,
          marginPercent: 15,
          timestamp: '2026-07-25 11:00 AM',
          proposedDate: '2026-08-29',
          scheduleMode: 'tandas',
          showBlocks: [
            { id: 'b1', label: 'Tanda 1: Set Apertura', date: '2026-08-29', startTime: '21:00', endTime: '22:30' },
            { id: 'b2', label: 'Tanda 2: Set Cierre', date: '2026-08-29', startTime: '23:00', endTime: '00:30' }
          ],
          totalShowHours: 3,
          advancePaymentType: 'percentage',
          advancePaymentValue: 50,
          paymentDueDate: '2026-08-25',
          receivingCardId: 'card-bbva-01',
          paymentMilestones: [
            { id: 'm1_8903_r3', label: '50% Anticipo de Reserva', percentageOrAmount: 50, type: 'percentage', dueDateOrTimeframe: '2026-08-01' },
            { id: 'm2_8903_r3', label: '25% Segundo Pago Intermedio', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-15' },
            { id: 'm3_8903_r3', label: '25% Finiquito Final', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-25' }
          ]
        },
        {
          round: 4,
          clientRejectionMessage: 'El cliente propone $205,000 MXN si se realiza el contrato hoy y se efectúa la transferencia inmediata del 50% de anticipo.',
          clientRejectedAt: '2026-07-27 11:10 AM',
          adminProposalNote: 'Ofrecemos $205,000 MXN ajustando el margen comercial al 14% para acelerar el depósito de anticipo.',
          totalOffered: 205000,
          artistFee: 145000,
          viaticosCost: 33000,
          soundCost: 27000,
          marginPercent: 14,
          timestamp: '2026-07-26 03:20 PM',
          proposedDate: '2026-08-30',
          scheduleMode: 'tandas',
          showBlocks: [
            { id: 'b1', label: 'Tanda 1: Set Noche 1', date: '2026-08-30', startTime: '21:30', endTime: '23:00' },
            { id: 'b2', label: 'Tanda 2: Set Madrugada', date: '2026-08-31', startTime: '00:00', endTime: '01:30' }
          ],
          totalShowHours: 3,
          advancePaymentType: 'percentage',
          advancePaymentValue: 50,
          paymentDueDate: '2026-08-25',
          receivingCardId: 'card-bbva-01',
          paymentMilestones: [
            { id: 'm1_8903_r4', label: '50% Anticipo de Reserva', percentageOrAmount: 50, type: 'percentage', dueDateOrTimeframe: '2026-08-01' },
            { id: 'm2_8903_r4', label: '25% Segundo Pago Intermedio', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-15' },
            { id: 'm3_8903_r4', label: '25% Finiquito Final', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-25' }
          ]
        },
        {
          round: 5,
          clientRejectionMessage: 'Acuerdo comercial final: $200,000 MXN netos con horarios confirmados de 21:30 a 01:30 hrs en 2 tandas.',
          adminProposalNote: 'Propuesta final negociada enviada por $200,000 MXN con 13% de margen de disquera para firma inmediata.',
          totalOffered: 200000,
          artistFee: 140000,
          viaticosCost: 32000,
          soundCost: 28000,
          marginPercent: 13,
          timestamp: '2026-07-28 09:45 AM',
          proposedDate: '2026-08-30',
          scheduleMode: 'tandas',
          showBlocks: [
            { id: 'b1', label: 'Tanda 1: Set Noche 1', date: '2026-08-30', startTime: '21:30', endTime: '23:00' },
            { id: 'b2', label: 'Tanda 2: Set Madrugada', date: '2026-08-31', startTime: '00:00', endTime: '01:30' }
          ],
          totalShowHours: 3,
          advancePaymentType: 'percentage',
          advancePaymentValue: 50,
          paymentDueDate: '2026-08-25',
          receivingCardId: 'card-bbva-01',
          paymentMilestones: [
            { id: 'm1_8903_r5', label: '50% Anticipo de Reserva', percentageOrAmount: 50, type: 'percentage', dueDateOrTimeframe: '2026-08-01' },
            { id: 'm2_8903_r5', label: '25% Segundo Pago Intermedio', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-15' },
            { id: 'm3_8903_r5', label: '25% Finiquito Final', percentageOrAmount: 25, type: 'percentage', dueDateOrTimeframe: '2026-08-25' }
          ]
        }
      ]
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
      state: 'Contrato firmado',
      paymentStatus: 'Pago Confirmado 100%',
      contractStatus: 'Firmado',
      terms: 'Boda privada. 3 tandas de 45 minutos. Equipo de sonido propio.',
      dateCreated: '2026-07-01',
      eventType: 'Boda',
      durationHours: 3,
      eventAddress: 'Vázquez de Mella #525, Polanco, Miguel Hidalgo, CDMX.',
      representativeName: 'Ing. Luis Donaldo',
      representativePhone: '+52 81 1234 5678',
      genre: 'Campirano / Acústico',
      rating: 4.7,
      artistImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80'
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
      marginAmount: 48000,
      artistFee: 220000,
      viaticosCost: 32000,
      soundCost: 20000,
      state: 'Aceptada',
      paymentStatus: 'Anticipo 50%',
      terms: 'Aceptación formal recibida del cliente. Contrato listo para firma.',
      dateCreated: '2026-07-22',
      eventType: 'Fiesta',
      durationHours: 3,
      eventAddress: 'Blvd. Nazario Ortiz Garza #2000, Saltillo, COAH.',
      representativeName: 'Ing. Luis Donaldo',
      representativePhone: '+52 81 1234 5678',
      genre: 'Norteño Sax',
      rating: 4.8,
      artistImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
      contractFileName: 'Borrador_Contrato_COT-8905.pdf',
      contractFileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      contractStatus: 'Generado',
      artistNotified: true,
      artistNotifiedTime: '2026-07-28 10:15 AM',
      negotiationRound: 2,
      negotiationHistory: [
        {
          round: 1,
          clientRejectionMessage: 'El presupuesto inicial de $360,000 MXN supera nuestro tope autorizado para la feria regional.',
          adminProposalNote: 'Rebajamos el margen de disquera del 20% al 17% para ofrecer $340,000 MXN.',
          totalOffered: 340000,
          artistFee: 240000,
          viaticosCost: 35000,
          soundCost: 22000,
          soundOption: 'proveedor',
          marginPercent: 17,
          timestamp: '2026-07-24 11:00 AM',
          proposedDate: '2026-08-05',
          scheduleMode: 'continuo',
          startTime: '21:00',
          endTime: '00:00',
          durationHours: 3,
          totalShowHours: 3
        },
        {
          round: 2,
          clientRejectionMessage: 'Aceptamos $320,000 MXN si se divide el show en 2 tandas y la disquera incluye planta de luz.',
          adminProposalNote: 'Propuesta aceptada por $320,000 MXN con 15% de margen y formato de 2 tandas.',
          totalOffered: 320000,
          artistFee: 220000,
          viaticosCost: 32000,
          soundCost: 20000,
          soundOption: 'proveedor',
          marginPercent: 15,
          timestamp: '2026-07-26 04:30 PM',
          proposedDate: '2026-08-05',
          scheduleMode: 'tandas',
          showBlocks: [
            { id: 'b1', label: 'Tanda 1: Set 1', date: '2026-08-05', startTime: '21:00', endTime: '22:30' },
            { id: 'b2', label: 'Tanda 2: Set 2', date: '2026-08-05', startTime: '23:00', endTime: '00:30' }
          ],
          totalShowHours: 3
        }
      ]
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
      dateCreated: '2026-07-23',
      eventType: 'Concierto',
      durationHours: 4,
      eventAddress: 'Av. Juárez #2500, Centro, Torreón, COAH.',
      representativeName: 'Ing. Luis Donaldo',
      representativePhone: '+52 81 1234 5678',
      genre: 'Banda Sinaloense',
      rating: 4.9,
      artistImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'COT-8907',
      clientName: 'Alejandra Ríos',
      clientCompany: 'Grupo Empresarial Bajío',
      clientEmail: 'arios@empresarialbajio.com',
      groupName: 'Grupo Dinastía Real',
      disqueraId: ACTIVE_DISQUERA_ID,
      proposedDate: '2026-09-10',
      venue: 'Centro de Convenciones',
      city: 'Celaya, GTO',
      totalAmount: 340000,
      marginAmount: 61200,
      state: 'Cancelada con Imprevisto',
      paymentStatus: 'Anticipo 50%',
      terms: 'Presentación de 3 horas con tarima estándar e iluminación de la disquera.',
      contractPdfUrl: 'contrato_COT-8907_firmado.pdf',
      dateCreated: '2026-07-14',
      eventType: 'Fiesta',
      durationHours: 3,
      eventAddress: 'Blvd. Adolfo López Mateos #1200, Celaya, GTO.',
      representativeName: 'Ing. Luis Donaldo',
      representativePhone: '+52 81 1234 5678',
      genre: 'Corridos Tumbados / Sierreño',
      rating: 4.8,
      artistImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
      advancePaymentType: 'percentage',
      advancePaymentValue: 50,
      paymentDueDate: '2026-09-05',
      receivingCardId: 'card-bbva-01',
      maxAllowedDelays: 2,
      paymentMilestones: [
        {
          id: 'm1_8907',
          label: '50% Anticipo de Reserva al Firmar',
          percentageOrAmount: 50,
          type: 'percentage',
          dueDateOrTimeframe: '2026-07-20',
          status: 'Pagado',
          amountCalculated: 170000,
          paidAmount: 170000,
          paidAt: '2026-07-20 12:10 PM',
          receiptReference: 'SPEI-70012384'
        },
        {
          id: 'm2_8907',
          label: '50% Finiquito Final Día del Evento',
          percentageOrAmount: 50,
          type: 'percentage',
          dueDateOrTimeframe: '2026-09-10',
          status: 'Pendiente'
        }
      ],
      clientNotices: [
        {
          id: 'n_cli_8907_1',
          target: 'Cliente',
          title: 'Notificación Oficial de Imprevisto de la Agrupación Musical',
          message: 'Estimada Alejandra, le informamos que el vocalista principal de Grupo Dinastía Real sufrió una lesión de voz que le impide presentarse en la fecha pactada. Estamos preparando alternativas comerciales para resolver su evento.',
          sentBy: 'Lic. Sofía Ramírez (Administración Disquera)',
          sentRole: 'administrador',
          sentAt: '2026-07-30 09:20 AM',
          channels: ['Email', 'WhatsApp', 'Platform'],
          priority: 'Urgente'
        }
      ],
      incidents: [
        {
          id: 'inc_8907_1',
          type: 'group_cancel',
          initiatedBy: 'Grupo Musical',
          reason: 'El vocalista principal presentó una lesión de cuerdas vocales diagnosticada por especialista, con reposo absoluto indicado por al menos 3 semanas, lo que imposibilita la presentación en la fecha pactada.',
          resolutionNotes: 'Pendiente de definir con administración: reprogramación, grupo sustituto o reembolso.',
          clientMessage: 'Estimada Alejandra, le informamos que el vocalista principal de Grupo Dinastía Real sufrió una lesión de voz que le impide presentarse en la fecha pactada. Estamos preparando alternativas comerciales para resolver su evento.',
          status: 'Imprevisto Grave',
          registeredAt: '2026-07-30 09:15 AM'
        }
      ],
      incidentNegotiations: [],
      incidentStatus: 'Imprevisto',
      negotiationRound: 1,
      negotiationHistory: [
        {
          round: 1,
          clientRejectionMessage: 'El monto inicial de $390,000 MXN excede el presupuesto autorizado por el comité empresarial.',
          adminProposalNote: 'Se ajustaron honorarios y logística para cerrar en $340,000 MXN con anticipo del 50%.',
          totalOffered: 340000,
          artistFee: 220000,
          viaticosCost: 45000,
          soundCost: 40000,
          marginPercent: 18,
          timestamp: '2026-07-13 05:00 PM',
          proposedDate: '2026-09-10',
          scheduleMode: 'continuo',
          startTime: '21:00',
          endTime: '00:00',
          durationHours: 3,
          soundOption: 'proveedor',
          advancePaymentType: 'percentage',
          advancePaymentValue: 50,
          paymentDueDate: '2026-09-05'
        }
      ]
    },
    {
      id: 'COT-8908',
      clientName: 'Fernando Castillo',
      clientCompany: 'Salón Los Pinos Eventos',
      clientEmail: 'fcastillo@salonlospinos.com',
      groupName: 'Los Elegantes del Norte',
      disqueraId: ACTIVE_DISQUERA_ID,
      proposedDate: '2026-09-18',
      venue: 'Salón Los Pinos',
      city: 'Saltillo, COAH',
      totalAmount: 300000,
      marginAmount: 54000,
      state: 'Imprevisto Enviado',
      paymentStatus: 'Anticipo 50%',
      terms: 'Presentación de 3 horas para XV años, incluye equipo de audio de la disquera.',
      contractPdfUrl: 'contrato_COT-8908_firmado.pdf',
      dateCreated: '2026-07-08',
      eventType: 'XV Años',
      durationHours: 3,
      eventAddress: 'Calz. Fundadores #880, Saltillo, COAH.',
      representativeName: 'Ing. Luis Donaldo',
      representativePhone: '+52 81 1234 5678',
      genre: 'Norteño Sax',
      rating: 4.8,
      artistImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
      advancePaymentType: 'percentage',
      advancePaymentValue: 50,
      paymentDueDate: '2026-09-12',
      receivingCardId: 'card-bbva-01',
      maxAllowedDelays: 2,
      paymentMilestones: [
        {
          id: 'm1_8908',
          label: '50% Anticipo de Reserva al Firmar',
          percentageOrAmount: 50,
          type: 'percentage',
          dueDateOrTimeframe: '2026-07-14',
          status: 'Pagado',
          amountCalculated: 150000,
          paidAmount: 150000,
          paidAt: '2026-07-14 01:40 PM',
          receiptReference: 'SPEI-61129045'
        },
        {
          id: 'm2_8908',
          label: '50% Finiquito Final Día del Evento',
          percentageOrAmount: 50,
          type: 'percentage',
          dueDateOrTimeframe: '2026-09-18',
          status: 'Pendiente'
        }
      ],
      clientNotices: [
        {
          id: 'n_cli_8908_1',
          target: 'Cliente',
          title: 'Propuesta de Resolución para Imprevisto — Ronda #1',
          message: 'Estimado Fernando, ante el imprevisto con Los Elegantes del Norte, le proponemos como solución la reasignación de Banda La Imperial para su evento del 18 de septiembre, manteniendo las mismas condiciones económicas y el horario pactado.',
          sentBy: 'Lic. Sofía Ramírez (Administración Disquera)',
          sentRole: 'administrador',
          sentAt: '2026-07-26 11:00 AM',
          channels: ['Email', 'WhatsApp', 'Platform'],
          priority: 'Urgente'
        }
      ],
      incidents: [
        {
          id: 'inc_8908_1',
          type: 'group_cancel',
          initiatedBy: 'Grupo Musical',
          reason: 'Dos integrantes clave de Los Elegantes del Norte presentaron un accidente de tránsito en carretera camino a un evento previo, con incapacidad médica de 15 días.',
          resolutionNotes: 'Propuesta enviada al cliente: reasignación de grupo sustituto (Banda La Imperial).',
          clientMessage: 'Estimado Fernando, ante el imprevisto con Los Elegantes del Norte, le proponemos como solución la reasignación de Banda La Imperial para su evento del 18 de septiembre, manteniendo las mismas condiciones económicas y el horario pactado.',
          status: 'Imprevisto Grave',
          registeredAt: '2026-07-25 08:40 AM'
        }
      ],
      incidentNegotiations: [
        {
          id: 'inc_neg_8908_1',
          round: 1,
          resolutionType: 'substitute_group',
          newGroupName: 'Banda La Imperial',
          adminMessage: 'Estimado Fernando, ante el imprevisto con Los Elegantes del Norte, le proponemos como solución la reasignación de Banda La Imperial para su evento del 18 de septiembre, manteniendo las mismas condiciones económicas y el horario pactado.',
          sentAt: '2026-07-26 11:00 AM',
          sentBy: 'Lic. Sofía Ramírez (Administración Disquera)',
          status: 'Enviada'
        }
      ],
      incidentStatus: 'Imprevisto',
      negotiationRound: 1,
      negotiationHistory: [
        {
          round: 1,
          clientRejectionMessage: 'El monto de $340,000 MXN es superior a lo cotizado por otros proveedores para el mismo formato de evento.',
          adminProposalNote: 'Se ajustó a $300,000 MXN con equipo de audio incluido y anticipo del 50%.',
          totalOffered: 300000,
          artistFee: 190000,
          viaticosCost: 35000,
          soundCost: 38000,
          marginPercent: 18,
          timestamp: '2026-07-07 06:15 PM',
          proposedDate: '2026-09-18',
          scheduleMode: 'continuo',
          startTime: '20:00',
          endTime: '23:00',
          durationHours: 3,
          soundOption: 'proveedor',
          advancePaymentType: 'percentage',
          advancePaymentValue: 50,
          paymentDueDate: '2026-09-12'
        }
      ]
    },
    {
      id: 'COT-8909',
      clientName: 'Marco Villagómez',
      clientCompany: 'Rancho Eventos Villagómez',
      clientEmail: 'mvillagomez@ranchoeventos.mx',
      groupName: 'Valentina & Los De La Sierra',
      disqueraId: ACTIVE_DISQUERA_ID,
      proposedDate: '2026-08-22',
      venue: 'Rancho Eventos Villagómez',
      city: 'Zapopan, JAL',
      totalAmount: 400000,
      marginAmount: 72000,
      state: 'Cancelada',
      paymentStatus: 'Anticipo 50%',
      terms: 'Presentación acústica de 2.5 horas para evento privado familiar.',
      contractPdfUrl: 'contrato_COT-8909_firmado.pdf',
      dateCreated: '2026-06-20',
      eventType: 'Fiesta',
      durationHours: 2.5,
      eventAddress: 'Camino a Nextipac Km 4.5, Zapopan, JAL.',
      representativeName: 'Ing. Luis Donaldo',
      representativePhone: '+52 81 1234 5678',
      genre: 'Campirano / Acústico',
      rating: 4.7,
      artistImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
      advancePaymentType: 'percentage',
      advancePaymentValue: 50,
      paymentDueDate: '2026-08-15',
      receivingCardId: 'card-bbva-01',
      maxAllowedDelays: 2,
      isCycleSealed: true,
      sealedAt: '2026-07-29 17:40',
      sealedBy: 'Lic. Sofía Ramírez (Admin)',
      finalClosureSummary: 'Expediente COT-8909 cerrado definitivamente tras el rechazo de dos propuestas de resolución del imprevisto. Se procesó reembolso parcial de $100,000 MXN al cliente; el anticipo de separación ($200,000 MXN) se retuvo conforme a términos y condiciones.',
      paymentMilestones: [
        {
          id: 'm1_8909',
          label: '50% Anticipo de Reserva al Firmar',
          percentageOrAmount: 50,
          type: 'percentage',
          dueDateOrTimeframe: '2026-06-26',
          status: 'Pagado',
          amountCalculated: 200000,
          paidAmount: 200000,
          paidAt: '2026-06-26 10:00 AM',
          receiptReference: 'SPEI-30219876'
        },
        {
          id: 'm2_8909',
          label: '25% Segundo Pago Intermedio',
          percentageOrAmount: 25,
          type: 'percentage',
          dueDateOrTimeframe: '2026-07-25',
          status: 'Pagado',
          amountCalculated: 100000,
          paidAmount: 100000,
          paidAt: '2026-07-25 09:30 AM',
          receiptReference: 'SPEI-30298214'
        },
        {
          id: 'm3_8909',
          label: '25% Finiquito Final Día del Evento',
          percentageOrAmount: 25,
          type: 'percentage',
          dueDateOrTimeframe: '2026-08-22',
          status: 'Pendiente'
        }
      ],
      incidents: [
        {
          id: 'inc_8909_1',
          type: 'group_cancel',
          initiatedBy: 'Grupo Musical',
          reason: 'El integrante principal de Valentina & Los De La Sierra sufrió una lesión que impide su presentación, sin posibilidad de recuperación antes de la fecha del evento.',
          resolutionNotes: 'Dos propuestas de resolución fueron rechazadas por el cliente; se procedió a la cancelación definitiva con reembolso parcial.',
          clientMessage: 'Estimado Marco, lamentamos informarle que, tras evaluar las alternativas propuestas, procedemos con la cancelación definitiva de su evento y el reembolso correspondiente conforme a los términos y condiciones.',
          status: 'Resuelto',
          registeredAt: '2026-07-10 10:00 AM',
          resolvedAt: '2026-07-29 17:40'
        }
      ],
      incidentNegotiations: [
        {
          id: 'inc_neg_8909_1',
          round: 1,
          resolutionType: 'reschedule',
          proposedDate: '2026-10-15',
          adminMessage: 'Estimado Marco, le proponemos reprogramar su evento para el 15 de octubre de 2026 con el mismo grupo, una vez concluida su recuperación.',
          sentAt: '2026-07-14 12:00 PM',
          sentBy: 'Lic. Sofía Ramírez (Administración Disquera)',
          status: 'Rechazada',
          clientRespondedAt: '2026-07-16 09:00 AM',
          clientRejectionReason: 'La fecha de octubre no es viable para nuestra familia por compromisos previos ya agendados.'
        },
        {
          id: 'inc_neg_8909_2',
          round: 2,
          resolutionType: 'substitute_group',
          newGroupName: 'Banda La Imperial',
          adminMessage: 'Como segunda alternativa, le proponemos la reasignación de Banda La Imperial para conservar la fecha original del 22 de agosto.',
          sentAt: '2026-07-20 10:30 AM',
          sentBy: 'Lic. Sofía Ramírez (Administración Disquera)',
          status: 'Rechazada',
          clientRespondedAt: '2026-07-22 08:15 AM',
          clientRejectionReason: 'La familia solicitó específicamente el estilo campirano/acústico del grupo original; no aceptamos un cambio de género musical.'
        }
      ],
      incidentStatus: 'Imprevisto',
      traceabilityTimeline: [
        {
          id: 'ts_8909_1',
          phaseNumber: 1,
          phaseName: 'Revisión Solicitud',
          state: 'En revisión',
          completedAt: '2026-06-20 09:00 AM',
          actorName: 'Marco Villagómez (Cliente)',
          summaryNote: 'Solicitud recibida para evento privado familiar en Zapopan, JAL.',
          snapshotData: { totalAmount: 400000, clientEmail: 'mvillagomez@ranchoeventos.mx', venue: 'Rancho Eventos Villagómez' }
        },
        {
          id: 'ts_8909_2',
          phaseNumber: 3,
          phaseName: 'Cotización Aceptada',
          state: 'Aceptada',
          completedAt: '2026-06-24 06:00 PM',
          actorName: 'Marco Villagómez (Cliente)',
          summaryNote: 'Aceptación comercial confirmada por $400,000 MXN.',
          snapshotData: { totalAmount: 400000 }
        },
        {
          id: 'ts_8909_3',
          phaseNumber: 5,
          phaseName: 'Contrato Firmado por Ambas Partes',
          state: 'Contrato firmado',
          completedAt: '2026-06-26 10:00 AM',
          actorName: 'Marco Villagómez & Disquera Acordex',
          summaryNote: 'Firma digital completada y primer anticipo del 50% recibido.',
          snapshotData: { signedByClientAt: '2026-06-26 10:00 AM', totalAmount: 400000 }
        },
        {
          id: 'ts_8909_4',
          phaseNumber: 6,
          phaseName: 'Imprevisto Registrado por el Grupo Musical',
          state: 'Cancelada con Imprevisto',
          completedAt: '2026-07-10 10:00 AM',
          actorName: 'Administración Disquera',
          summaryNote: 'Se registró imprevisto grave: lesión del integrante principal de Valentina & Los De La Sierra.',
          snapshotData: { totalAmount: 400000 }
        },
        {
          id: 'ts_8909_5',
          phaseNumber: 6,
          phaseName: 'Propuesta de Resolución Rechazada — Ronda #1',
          state: 'Imprevisto Enviado',
          completedAt: '2026-07-16 09:00 AM',
          actorName: 'Marco Villagómez (Cliente)',
          summaryNote: 'El cliente rechazó la propuesta de reprogramación de fecha.',
          snapshotData: { totalAmount: 400000 }
        },
        {
          id: 'ts_8909_6',
          phaseNumber: 6,
          phaseName: 'Propuesta de Resolución Rechazada — Ronda #2',
          state: 'Imprevisto Enviado',
          completedAt: '2026-07-22 08:15 AM',
          actorName: 'Marco Villagómez (Cliente)',
          summaryNote: 'El cliente rechazó la propuesta de reasignación de grupo sustituto. Se procede a evaluar cancelación definitiva.',
          snapshotData: { totalAmount: 400000 }
        },
        {
          id: 'ts_8909_7',
          phaseNumber: 7,
          phaseName: 'Cancelación Definitiva y Reembolso Parcial',
          state: 'Cancelada',
          completedAt: '2026-07-29 17:40',
          actorName: 'Lic. Sofía Ramírez (Admin Tesorería)',
          summaryNote: 'Expediente cancelado definitivamente. Reembolso parcial de $100,000 MXN procesado; anticipo de separación de $200,000 MXN retenido conforme a términos y condiciones.',
          snapshotData: { totalAmount: 400000 }
        }
      ]
    }
  ];

  /**
   * Un evento por cada fase del ciclo de vida, para que el tablero, los filtros
   * y las tarjetas se puedan ver funcionando de punta a punta:
   *
   *  101 Borrador incompleto · 102 Borrador listo para enviar ·
   *  103 En Revisión con pendientes · 104 En Revisión con rechazo (ronda 2) ·
   *  105 Próximo a Publicar · 106 Publicado sin ventas · 107 En Venta ·
   *  108 Finalizada con cierre incompleto · 109 Cerrado y sellado ·
   *  110 Cancelado con reembolsos.
   */
  private readonly INITIAL_EVENTS: EventItem[] = [
    // ─── 101 · BORRADOR INCOMPLETO ────────────────────────────────────────────
    {
      id: 'EVT-101',
      title: 'Noche de Gala Norteña 2026',
      date: '2026-11-14',
      location: 'Monterrey, NL',
      venue: 'Arena Monterrey',
      venueAddress: 'Av. Francisco I. Madero s/n, Central, Monterrey, N.L.',
      groupName: 'Los Elegantes del Norte',
      disqueraId: ACTIVE_DISQUERA_ID,
      state: 'Borrador',
      flyerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
      description: 'Gran gala anual del norteño sax con invitados especiales.',
      createdBy: 'Encargado Acordex',
      createdAt: '2026-07-26T11:20',
      ownerManagerName: 'Encargado Acordex',
      capacity: 12000,
      isCoProduction: false,
      lineup: [
        {
          id: 'ln-101-1',
          groupId: 'grp-5',
          groupName: 'Los Herederos del Regio',
          isExternal: true,
          managerName: 'Lic. Gonzalo Garza',
          managerEmail: 'gonzalo@herederosregio.mx',
          order: 1,
          setStartTime: '20:30',
          setEndTime: '21:30',
          durationMinutes: 60,
          costItems: [
            { id: 'c-101-1', concept: 'Honorarios de presentación', category: 'Honorarios', amount: 85000 }
          ],
          costProposedBy: 'Lic. Gonzalo Garza',
          approval: 'Pendiente'
        },
        {
          id: 'ln-101-2',
          groupId: 'grp-1',
          groupName: 'Los Elegantes del Norte',
          isExternal: false,
          managerName: 'Don Raúl Treviño',
          order: 2,
          isHeadliner: true,
          costItems: [],
          approval: 'No Requiere'
        }
      ],
      sound: { providerType: 'Por Definir' },
      schedule: {},
      reviewRounds: [],
      ticketTiers: [
        { id: 'tt-101-1', name: 'VIP Diamante', price: 2500, totalSeats: 500, soldSeats: 0, color: '#f2ca50' },
        { id: 'tt-101-2', name: 'General', price: 650, totalSeats: 8000, soldSeats: 0, color: '#99907c' }
      ],
      croquisZones: [
        { id: 'z1', name: 'Ruedo VIP Frontal', capacity: 500, occupancyPercent: 0, color: '#f2ca50', seatingType: 'Numerada' },
        { id: 'z2', name: 'Graderías Generales', capacity: 8000, occupancyPercent: 0, color: '#99907c', seatingType: 'General' }
      ],
      timeline: [
        {
          id: 'tl-101-1',
          phaseNumber: 1,
          state: 'Borrador',
          phaseName: 'Armado del Evento',
          completedAt: '2026-07-26T11:20',
          actorName: 'Encargado Acordex',
          summaryNote: 'Se creó el borrador del evento con recinto y fecha tentativa.'
        }
      ],
      evidenceMedia: []
    },

    // ─── 102 · BORRADOR COMPLETO, LISTO PARA ENVIAR ───────────────────────────
    {
      id: 'EVT-102',
      title: 'Fiesta Sinaloense Guadalajara',
      date: '2026-10-03',
      location: 'Zapopan, JAL',
      venue: 'Auditorio Telmex',
      venueAddress: 'Obreros de Cananea #747, Col. Los Belenes, Zapopan, JAL.',
      groupName: 'Banda La Imperial',
      disqueraId: ACTIVE_DISQUERA_ID,
      state: 'Borrador',
      flyerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
      description: 'Noche de banda sinaloense con la mejor tambora del país y cumbia sonidera de cierre.',
      createdBy: 'Encargado Acordex',
      createdAt: '2026-07-30T09:40',
      ownerManagerName: 'Encargado Acordex',
      capacity: 9800,
      isCoProduction: false,
      publicProfile: {
        coverUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?w=1400&auto=format&fit=crop&q=80',
        posterUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&auto=format&fit=crop&q=80',
        category: 'Baile',
        tagline: 'La tambora más potente del país, una sola noche en Guadalajara.',
        about: 'Una noche dedicada a la banda sinaloense en el Auditorio Telmex, con la cumbia sonidera de Sonido Dinamita Urbano abriendo la velada. Contamos con accesos controlados, zona de alimentos, estacionamiento vigilado y accesibilidad para silla de ruedas en todas las zonas.',
        rules: [
          { id: 'r-102-1', text: 'No se permite el ingreso de alimentos ni bebidas ajenas al recinto.' },
          { id: 'r-102-2', text: 'Las puertas abren una hora antes del inicio del espectáculo.' },
          { id: 'r-102-3', text: 'Menores de 15 años deben ingresar acompañados de un adulto.' },
          { id: 'r-102-4', text: 'Conserva tu boleto digital o físico durante todo el evento.' }
        ],
        minimumAge: 'Recomendado para mayores de 15 años',
        serviceFeePerSeat: 45,
        supportPhone: '+52 (81) 1234 5678',
        supportWhatsApp: '528112345678',
        mapsQuery: 'Auditorio Telmex Zapopan',
        guaranteeLabel: 'Acordex VIP'
      },
      lineup: [
        {
          id: 'ln-102-1',
          groupId: 'grp-6',
          groupName: 'Sonido Dinamita Urbano',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          genre: 'Cumbia Sonidera / Fusión',
          rating: 4.85,
          profileSlug: 'sonido-dinamita-urbano',
          invitationVideos: [
            {
              id: 'vid-102-1',
              title: 'Invitación Especial (Video Oficial del Grupo)',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
              type: 'local'
            }
          ],
          isExternal: true,
          managerName: 'DJ & Mtro. Samuel Vargas',
          managerEmail: 'samuel@dinamitaurbano.mx',
          managerPhone: '+52 33 1188 4400',
          order: 1,
          setStartTime: '20:00',
          setEndTime: '21:00',
          durationMinutes: 60,
          arrivalTime: '17:00',
          soundCheckTime: '17:30',
          costItems: [
            { id: 'c-102-1', concept: 'Honorarios de presentación', category: 'Honorarios', amount: 62000 },
            { id: 'c-102-2', concept: 'Traslado de equipo y personal', category: 'Transporte', amount: 9500 }
          ],
          costProposedBy: 'DJ & Mtro. Samuel Vargas',
          approval: 'Pendiente'
        },
        {
          id: 'ln-102-2',
          groupId: 'grp-3',
          groupName: 'Banda La Imperial',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          genre: 'Banda Sinaloense',
          rating: 4.95,
          profileSlug: 'banda-la-imperial',
          invitationVideos: [
            {
              id: 'vid-102-2',
              title: 'Video de Promoción (Enlace a Redes Sociales)',
              url: 'https://www.youtube.com/embed/F77FwZq-7gE',
              type: 'youtube'
            }
          ],
          isExternal: false,
          managerName: 'Maestro Fernando Castillo',
          order: 2,
          isHeadliner: true,
          setStartTime: '21:30',
          setEndTime: '23:30',
          durationMinutes: 120,
          arrivalTime: '18:00',
          soundCheckTime: '18:30',
          costItems: [
            { id: 'c-102-3', concept: 'Honorarios de presentación', category: 'Honorarios', amount: 180000 },
            { id: 'c-102-4', concept: 'Viáticos de 16 integrantes', category: 'Viáticos', amount: 24000 },
            { id: 'c-102-5', concept: 'Hospedaje una noche', category: 'Hospedaje', amount: 18000 }
          ],
          costProposedBy: 'Maestro Fernando Castillo',
          approval: 'No Requiere'
        }
      ],
      sound: {
        providerType: 'Proveedor Externo',
        providerName: 'Audio Profesional del Bajío',
        engineerName: 'Ing. Ricardo Peña',
        engineerPhone: '+52 33 2044 7788',
        consoleModel: 'DiGiCo SD10',
        speakersSetup: 'Line array L-Acoustics K2 · 24 cajas',
        monitorsSetup: '12 monitores de piso + 6 IEM',
        loadInTime: '12:00',
        soundCheckStart: '17:30',
        soundCheckEnd: '19:00',
        cost: 145000,
        riderChecklist: [
          { id: 'r-102-1', label: 'Planta de luz de respaldo', done: true, responsible: 'Recinto' },
          { id: 'r-102-2', label: 'Backline de batería y percusiones', done: true, responsible: 'Proveedor' },
          { id: 'r-102-3', label: 'Camerinos con aire acondicionado', done: false, responsible: 'Recinto' }
        ]
      },
      schedule: {
        crewCallAt: '2026-10-03T11:00',
        loadInAt: '2026-10-03T12:00',
        soundCheckAt: '2026-10-03T17:30',
        doorsOpenAt: '2026-10-03T19:00',
        showStartAt: '2026-10-03T20:00',
        curfewAt: '2026-10-04T00:30'
      },
      reviewRounds: [],
      ticketTiers: [
        {
          id: 'tt-102-1', name: 'Palco VIP', price: 2800, totalSeats: 400, soldSeats: 0, color: '#f2ca50', zoneId: 'gz1',
          icon: 'workspace_premium', description: 'Palco privado, acceso prioritario y servicio de bebidas en mesa.',
          rowLabels: seatRows(10), seatsPerRow: 40
        },
        {
          id: 'tt-102-2', name: 'Preferente', price: 1500, totalSeats: 2400, soldSeats: 0, color: '#d4af37', zoneId: 'gz2',
          icon: 'star', description: 'Luneta central con asientos numerados y vista directa al escenario.',
          rowLabels: seatRows(40, 10), seatsPerRow: 60
        },
        {
          id: 'tt-102-3', name: 'General', price: 780, totalSeats: 5200, soldSeats: 0, color: '#99907c', zoneId: 'gz3',
          icon: 'groups', description: 'Gradas generales con excelente acústica y acceso por puerta norte.',
          rowLabels: seatRows(65, 50), seatsPerRow: 80
        }
      ],
      croquisZones: [
        { id: 'gz1', name: 'Palcos Preferentes', capacity: 400, occupancyPercent: 0, color: '#f2ca50', seatingType: 'Numerada', rows: 10, seatsPerRow: 40 },
        { id: 'gz2', name: 'Luneta Central', capacity: 2400, occupancyPercent: 0, color: '#d4af37', seatingType: 'Numerada' },
        { id: 'gz3', name: 'Gradas Generales', capacity: 5200, occupancyPercent: 0, color: '#99907c', seatingType: 'General' }
      ],
      timeline: [
        {
          id: 'tl-102-1',
          phaseNumber: 1,
          state: 'Borrador',
          phaseName: 'Armado del Evento',
          completedAt: '2026-07-30T09:40',
          actorName: 'Encargado Acordex',
          summaryNote: 'Borrador capturado en su totalidad: cartel, sonido, corrida y boletaje.',
          snapshot: { lineupCount: 2, totalCapacity: 8000, lineupCost: 293500 }
        }
      ],
      evidenceMedia: []
    },

    // ─── 103 · EN REVISIÓN, CON APROBACIONES PENDIENTES ───────────────────────
    {
      id: 'EVT-103',
      title: 'Festival Tumbado Zapopan',
      date: '2026-09-19',
      location: 'Zapopan, JAL',
      venue: 'Explanada Vallarta',
      venueAddress: 'Av. Vallarta #6503, Zapopan, JAL.',
      groupName: 'Grupo Dinastía Real',
      disqueraId: ACTIVE_DISQUERA_ID,
      state: 'En Revisión',
      flyerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
      description: 'Festival de corridos tumbados con tres agrupaciones y cierre acústico.',
      createdBy: 'Encargado Acordex',
      createdAt: '2026-07-18T16:05',
      ownerManagerName: 'Encargado Acordex',
      capacity: 6500,
      isCoProduction: true,
      coProductionPartner: 'Fonovisa Music',
      coProductionSplitPercent: 60,
      publicProfile: {
        coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&auto=format&fit=crop&q=80',
        posterUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=900&auto=format&fit=crop&q=80',
        category: 'Festival',
        tagline: 'Tres agrupaciones, una explanada y la nueva ola del corrido tumbado.',
        about: 'El Festival Tumbado llega a la Explanada Vallarta con tres agrupaciones en un solo cartel: apertura acústica, cumbia sonidera y el cierre estelar de Grupo Dinastía Real. Explanada techada, zona de alimentos, hidratación gratuita y accesos independientes por zona.',
        rules: [
          { id: 'r-103-1', text: 'Zona general de pie: no se permiten sillas ni banquitos.' },
          { id: 'r-103-2', text: 'Puertas abren una hora antes del inicio del festival.' },
          { id: 'r-103-3', text: 'Prohibido el ingreso con cámaras profesionales sin acreditación.' }
        ],
        minimumAge: 'Acceso libre; menores de 12 años con adulto',
        serviceFeePerSeat: 45,
        supportPhone: '+52 (81) 1234 5678',
        supportWhatsApp: '528112345678',
        mapsQuery: 'Explanada Vallarta Zapopan',
        guaranteeLabel: 'Acordex VIP'
      },
      lineup: [
        {
          id: 'ln-103-1',
          groupId: 'grp-4',
          groupName: 'Valentina & Los De La Sierra',
          imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
          genre: 'Campirano / Acústico',
          rating: 4.7,
          profileSlug: 'valentina-los-de-la-sierra',
          isExternal: true,
          managerName: 'Valentina Morales',
          managerEmail: 'valentina@sierraacustica.mx',
          order: 1,
          setStartTime: '19:30',
          setEndTime: '20:20',
          durationMinutes: 50,
          arrivalTime: '16:30',
          soundCheckTime: '17:00',
          costItems: [
            { id: 'c-103-1', concept: 'Honorarios acústicos', category: 'Honorarios', amount: 48000 },
            { id: 'c-103-2', concept: 'Viáticos', category: 'Viáticos', amount: 6500 }
          ],
          costProposedBy: 'Valentina Morales',
          approval: 'Aprobado'
        },
        {
          id: 'ln-103-2',
          groupId: 'grp-6',
          groupName: 'Sonido Dinamita Urbano',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          genre: 'Cumbia Sonidera / Fusión',
          rating: 4.85,
          profileSlug: 'sonido-dinamita-urbano',
          isExternal: true,
          managerName: 'DJ & Mtro. Samuel Vargas',
          managerEmail: 'samuel@dinamitaurbano.mx',
          order: 2,
          setStartTime: '20:40',
          setEndTime: '21:40',
          durationMinutes: 60,
          arrivalTime: '17:00',
          soundCheckTime: '17:40',
          costItems: [
            { id: 'c-103-3', concept: 'Honorarios de presentación', category: 'Honorarios', amount: 62000 }
          ],
          costProposedBy: 'DJ & Mtro. Samuel Vargas',
          approval: 'Pendiente'
        },
        {
          id: 'ln-103-3',
          groupId: 'grp-2',
          groupName: 'Grupo Dinastía Real',
          imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
          genre: 'Corridos Tumbados / Sierreño',
          rating: 4.8,
          profileSlug: 'grupo-dinastia-real',
          invitationVideos: [
            {
              id: 'vid-103-1',
              title: 'Saludo de Grupo Dinastía Real para el Festival',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
              type: 'local'
            }
          ],
          isExternal: false,
          managerName: 'Mateo "El Güero" Rivas',
          order: 3,
          isHeadliner: true,
          setStartTime: '22:00',
          setEndTime: '23:45',
          durationMinutes: 105,
          arrivalTime: '18:00',
          soundCheckTime: '18:20',
          costItems: [
            { id: 'c-103-4', concept: 'Honorarios de presentación', category: 'Honorarios', amount: 210000 },
            { id: 'c-103-5', concept: 'Viáticos y alimentos', category: 'Alimentos', amount: 15000 }
          ],
          costProposedBy: 'Mateo "El Güero" Rivas',
          approval: 'No Requiere'
        }
      ],
      sound: {
        providerType: 'Equipo Propio de un Grupo',
        providerName: 'Equipo de Grupo Dinastía Real',
        engineerName: 'Ing. Omar Zepeda',
        engineerPhone: '+52 33 1745 9021',
        consoleModel: 'Allen & Heath dLive S7000',
        speakersSetup: 'Line array JBL VTX A12 · 16 cajas',
        monitorsSetup: '8 monitores de piso',
        loadInTime: '11:30',
        soundCheckStart: '17:00',
        soundCheckEnd: '18:45',
        cost: 92000,
        riderChecklist: [
          { id: 'r-103-1', label: 'Suministro eléctrico trifásico', done: true, responsible: 'Recinto' },
          { id: 'r-103-2', label: 'Vallado de foso de seguridad', done: true, responsible: 'Producción' }
        ]
      },
      schedule: {
        crewCallAt: '2026-09-19T10:30',
        loadInAt: '2026-09-19T11:30',
        soundCheckAt: '2026-09-19T17:00',
        doorsOpenAt: '2026-09-19T18:30',
        showStartAt: '2026-09-19T19:30',
        curfewAt: '2026-09-20T00:00'
      },
      reviewRounds: [
        {
          round: 1,
          sentAt: '2026-07-29T10:15',
          sentBy: 'Encargado Acordex',
          note: 'Se envía el cartel completo con horarios y costos desglosados para su visto bueno.',
          approvals: [
            {
              id: 'ap-103-1',
              groupId: 'grp-4',
              groupName: 'Valentina & Los De La Sierra',
              managerName: 'Valentina Morales',
              status: 'Aprobado',
              respondedAt: '2026-07-30T12:40'
            },
            {
              id: 'ap-103-2',
              groupId: 'grp-6',
              groupName: 'Sonido Dinamita Urbano',
              managerName: 'DJ & Mtro. Samuel Vargas',
              status: 'Pendiente'
            }
          ]
        }
      ],
      ticketTiers: [
        {
          id: 'tt-103-1', name: 'Zona Tumbada VIP', price: 2100, totalSeats: 600, soldSeats: 0, color: '#f2ca50', zoneId: 'tz1',
          icon: 'workspace_premium', description: 'Foso frente al escenario con barra exclusiva y acceso preferente.',
          rowLabels: seatRows(15), seatsPerRow: 40
        },
        {
          id: 'tt-103-2', name: 'General A', price: 1100, totalSeats: 3000, soldSeats: 0, color: '#d4af37', zoneId: 'tz2',
          icon: 'groups', description: 'De pie frente al escenario, el mejor ambiente del festival.',
          rowLabels: seatRows(50, 15), seatsPerRow: 60
        },
        {
          id: 'tt-103-3', name: 'General B', price: 700, totalSeats: 2500, soldSeats: 0, color: '#99907c', zoneId: 'tz3',
          icon: 'event_seat', description: 'Explanada posterior con pantallas gigantes y zona de alimentos.',
          rowLabels: seatRows(50, 65), seatsPerRow: 50
        }
      ],
      croquisZones: [
        { id: 'tz1', name: 'Foso VIP Frontal', capacity: 600, occupancyPercent: 0, color: '#f2ca50', seatingType: 'De Pie' },
        { id: 'tz2', name: 'Zona General de Pie', capacity: 3000, occupancyPercent: 0, color: '#d4af37', seatingType: 'De Pie' },
        { id: 'tz3', name: 'Explanada Posterior', capacity: 2900, occupancyPercent: 0, color: '#99907c', seatingType: 'General' }
      ],
      timeline: [
        {
          id: 'tl-103-1',
          phaseNumber: 1,
          state: 'Borrador',
          phaseName: 'Armado del Evento',
          completedAt: '2026-07-18T16:05',
          actorName: 'Encargado Acordex',
          summaryNote: 'Borrador creado con tres agrupaciones, dos de ellas de otros encargados.'
        },
        {
          id: 'tl-103-2',
          phaseNumber: 2,
          state: 'En Revisión',
          phaseName: 'Revisión de Encargados',
          completedAt: '2026-07-29T10:15',
          actorName: 'Encargado Acordex',
          summaryNote: 'Enviado a revisión: 2 encargados externos deben aprobar horarios y costos.',
          snapshot: { lineupCount: 3, approvalsCount: 2, lineupCost: 341500 }
        }
      ],
      evidenceMedia: []
    },

    // ─── 104 · EN REVISIÓN, CON RECHAZO EN RONDA 2 ────────────────────────────
    {
      id: 'EVT-104',
      title: 'Palenque de la Feria de Aguascalientes',
      date: '2026-09-05',
      location: 'Aguascalientes, AGS',
      venue: 'Palenque San Marcos',
      venueAddress: 'Explanada del Palenque, San Marcos, Aguascalientes, AGS.',
      groupName: 'Los Elegantes del Norte',
      disqueraId: ACTIVE_DISQUERA_ID,
      state: 'En Revisión',
      flyerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
      description: 'Noche de palenque con doble cartel norteño.',
      createdBy: 'Administrador Operativo',
      createdAt: '2026-07-10T13:00',
      ownerManagerName: 'Administrador Operativo',
      capacity: 7300,
      isCoProduction: false,
      publicProfile: {
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1400&auto=format&fit=crop&q=80',
        posterUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&auto=format&fit=crop&q=80',
        category: 'Palenque',
        tagline: 'Doble cartel norteño en el palenque más famoso de la feria.',
        about: 'El Palenque San Marcos recibe una noche de norteño clásico y sax con dos agrupaciones de casa. Acceso por anillo dorado, servicio de mesa en zona VIP y venta de alimentos dentro del recinto durante toda la función.',
        rules: [
          { id: 'r-104-1', text: 'El boleto de palenque no incluye consumo de alimentos ni bebidas.' },
          { id: 'r-104-2', text: 'Las puertas abren una hora antes del inicio del espectáculo.' },
          { id: 'r-104-3', text: 'No se permite el acceso a menores de 12 años al anillo VIP.' }
        ],
        minimumAge: 'Mayores de 12 años en zona VIP',
        serviceFeePerSeat: 45,
        supportPhone: '+52 (81) 1234 5678',
        supportWhatsApp: '528112345678',
        mapsQuery: 'Palenque San Marcos Aguascalientes',
        guaranteeLabel: 'Acordex VIP'
      },
      lineup: [
        {
          id: 'ln-104-1',
          groupId: 'grp-5',
          groupName: 'Los Herederos del Regio',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
          genre: 'Norteño Clásico / Acordeón',
          rating: 4.6,
          profileSlug: 'los-herederos-del-regio',
          isExternal: true,
          managerName: 'Lic. Gonzalo Garza',
          managerEmail: 'gonzalo@herederosregio.mx',
          order: 1,
          setStartTime: '21:00',
          setEndTime: '22:00',
          durationMinutes: 60,
          arrivalTime: '18:00',
          soundCheckTime: '18:30',
          costItems: [
            { id: 'c-104-1', concept: 'Honorarios de presentación', category: 'Honorarios', amount: 95000 },
            { id: 'c-104-2', concept: 'Viáticos y traslado', category: 'Viáticos', amount: 14000 }
          ],
          costProposedBy: 'Lic. Gonzalo Garza',
          approval: 'Rechazado'
        },
        {
          id: 'ln-104-2',
          groupId: 'grp-1',
          groupName: 'Los Elegantes del Norte',
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          genre: 'Norteño Sax',
          rating: 4.9,
          profileSlug: 'los-elegantes-del-norte',
          isExternal: true,
          managerName: 'Don Raúl Treviño',
          managerEmail: 'raul@elegantesdelnorte.mx',
          order: 2,
          isHeadliner: true,
          setStartTime: '22:30',
          setEndTime: '00:30',
          durationMinutes: 120,
          arrivalTime: '19:00',
          soundCheckTime: '19:30',
          costItems: [
            { id: 'c-104-3', concept: 'Honorarios de presentación', category: 'Honorarios', amount: 240000 },
            { id: 'c-104-4', concept: 'Viáticos de 5 integrantes', category: 'Viáticos', amount: 18000 }
          ],
          costProposedBy: 'Don Raúl Treviño',
          approval: 'Aprobado'
        }
      ],
      sound: {
        providerType: 'Equipo del Recinto',
        providerName: 'Palenque San Marcos — Audio Casa',
        engineerName: 'Ing. Beto Ramírez',
        engineerPhone: '+52 449 310 5522',
        consoleModel: 'Yamaha CL5',
        speakersSetup: 'Sistema fijo del palenque · 20 cajas',
        loadInTime: '13:00',
        soundCheckStart: '18:30',
        soundCheckEnd: '20:00',
        cost: 60000
      },
      schedule: {
        crewCallAt: '2026-09-05T12:00',
        loadInAt: '2026-09-05T13:00',
        soundCheckAt: '2026-09-05T18:30',
        doorsOpenAt: '2026-09-05T20:00',
        showStartAt: '2026-09-05T21:00',
        curfewAt: '2026-09-06T01:30'
      },
      reviewRounds: [
        {
          round: 1,
          sentAt: '2026-07-14T09:00',
          sentBy: 'Administrador Operativo',
          note: 'Primer envío del cartel para el palenque.',
          approvals: [
            {
              id: 'ap-104-1',
              groupId: 'grp-5',
              groupName: 'Los Herederos del Regio',
              managerName: 'Lic. Gonzalo Garza',
              status: 'Rechazado',
              respondedAt: '2026-07-16T18:20',
              reason: 'El grupo abre a las 21:00 pero el traslado desde Monterrey no permite llegar antes de las 19:30.',
              requestedChanges: ['Recorrer la entrada 30 minutos', 'Cubrir hospedaje de la noche anterior']
            },
            {
              id: 'ap-104-2',
              groupId: 'grp-1',
              groupName: 'Los Elegantes del Norte',
              managerName: 'Don Raúl Treviño',
              status: 'Aprobado',
              respondedAt: '2026-07-15T11:05'
            }
          ],
          closedAt: '2026-07-16T18:20',
          outcome: 'Con Cambios Solicitados'
        },
        {
          round: 2,
          sentAt: '2026-08-01T10:30',
          sentBy: 'Administrador Operativo',
          note: 'Se recorrió la entrada y se agregó hospedaje. Se reenvía para su aprobación.',
          approvals: [
            {
              id: 'ap-104-3',
              groupId: 'grp-5',
              groupName: 'Los Herederos del Regio',
              managerName: 'Lic. Gonzalo Garza',
              status: 'Rechazado',
              respondedAt: '2026-08-04T17:45',
              reason: 'El hospedaje quedó cubierto, pero el desglose de viáticos sigue $6,000 por debajo de lo acordado.',
              requestedChanges: ['Ajustar viáticos a $20,000']
            },
            {
              id: 'ap-104-4',
              groupId: 'grp-1',
              groupName: 'Los Elegantes del Norte',
              managerName: 'Don Raúl Treviño',
              status: 'Aprobado',
              respondedAt: '2026-08-02T09:15'
            }
          ]
        }
      ],
      ticketTiers: [
        {
          id: 'tt-104-1', name: 'VIP Palenque', price: 3200, totalSeats: 800, soldSeats: 0, color: '#f2ca50', zoneId: 'pz1',
          icon: 'workspace_premium', description: 'Anillo dorado a pie de ruedo con servicio de mesa incluido.',
          rowLabels: seatRows(20), seatsPerRow: 40
        },
        {
          id: 'tt-104-2', name: 'Platea', price: 1800, totalSeats: 2500, soldSeats: 0, color: '#d4af37', zoneId: 'pz2',
          icon: 'star', description: 'Zona media con asiento numerado y vista completa del ruedo.',
          rowLabels: seatRows(50, 20), seatsPerRow: 50
        },
        {
          id: 'tt-104-3', name: 'Grada Alta', price: 800, totalSeats: 4000, soldSeats: 0, color: '#99907c', zoneId: 'pz3',
          icon: 'event_seat', description: 'Gradas superiores techadas con acceso por puerta poniente.',
          rowLabels: seatRows(50, 70), seatsPerRow: 80
        }
      ],
      croquisZones: [
        { id: 'pz1', name: 'Anillo Dorado VIP', capacity: 800, occupancyPercent: 0, color: '#f2ca50', seatingType: 'Numerada' },
        { id: 'pz2', name: 'Zona Platea Media', capacity: 2500, occupancyPercent: 0, color: '#d4af37', seatingType: 'Numerada' },
        { id: 'pz3', name: 'Gradas Superiores', capacity: 4000, occupancyPercent: 0, color: '#99907c', seatingType: 'General' }
      ],
      timeline: [
        {
          id: 'tl-104-1',
          phaseNumber: 1,
          state: 'Borrador',
          phaseName: 'Armado del Evento',
          completedAt: '2026-07-10T13:00',
          actorName: 'Administrador Operativo',
          summaryNote: 'Borrador creado para la feria de Aguascalientes.'
        },
        {
          id: 'tl-104-2',
          phaseNumber: 2,
          state: 'En Revisión',
          phaseName: 'Revisión de Encargados (Ronda 1)',
          completedAt: '2026-07-16T18:20',
          actorName: 'Lic. Gonzalo Garza',
          summaryNote: 'Rechazo por horario de entrada incompatible con el traslado del grupo.',
          snapshot: { lineupCount: 2, approvalsCount: 2 }
        },
        {
          id: 'tl-104-3',
          phaseNumber: 2,
          state: 'En Revisión',
          phaseName: 'Revisión de Encargados (Ronda 2)',
          completedAt: '2026-08-01T10:30',
          actorName: 'Administrador Operativo',
          summaryNote: 'Reenviado con horario recorrido y hospedaje incluido.',
          snapshot: { lineupCount: 2, approvalsCount: 2, lineupCost: 367000 }
        }
      ],
      evidenceMedia: []
    },

    // ─── 105 · PRÓXIMO A PUBLICAR ─────────────────────────────────────────────
    {
      id: 'EVT-105',
      title: 'Gran Baile del Recuerdo — Saltillo',
      date: '2026-10-24',
      location: 'Saltillo, COAH',
      venue: 'Expo Arena Coahuila',
      venueAddress: 'Blvd. Nazario Ortiz Garza #2000, Saltillo, COAH.',
      groupName: 'Los Herederos del Regio',
      disqueraId: ACTIVE_DISQUERA_ID,
      state: 'Próximo a Publicar',
      flyerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      description: 'Baile masivo con norteño clásico de acordeón y cumbia sonidera.',
      createdBy: 'Encargado Acordex',
      createdAt: '2026-06-28T10:00',
      ownerManagerName: 'Encargado Acordex',
      capacity: 8500,
      isCoProduction: false,
      publicProfile: {
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1400&auto=format&fit=crop&q=80',
        posterUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&auto=format&fit=crop&q=80',
        category: 'Baile',
        tagline: 'El baile del recuerdo vuelve a Saltillo con acordeón y cumbia.',
        about: 'Gran baile masivo en la Expo Arena Coahuila con mesas VIP en pista, zona preferente y pista general de pie. Servicio de bar en todas las zonas, estacionamiento vigilado y transporte seguro coordinado a la salida.',
        rules: [
          { id: 'r-105-1', text: 'Las mesas VIP son para cuatro personas y no son divisibles.' },
          { id: 'r-105-2', text: 'Evento exclusivo para mayores de 18 años con identificación oficial.' },
          { id: 'r-105-3', text: 'Puertas abren una hora antes del inicio del baile.' }
        ],
        minimumAge: 'Solo mayores de 18 años',
        serviceFeePerSeat: 45,
        supportPhone: '+52 (81) 1234 5678',
        supportWhatsApp: '528112345678',
        mapsQuery: 'Expo Arena Coahuila Saltillo',
        guaranteeLabel: 'Acordex VIP'
      },
      lineup: [
        {
          id: 'ln-105-1',
          groupId: 'grp-6',
          groupName: 'Sonido Dinamita Urbano',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          genre: 'Cumbia Sonidera / Fusión',
          rating: 4.85,
          profileSlug: 'sonido-dinamita-urbano',
          isExternal: true,
          managerName: 'DJ & Mtro. Samuel Vargas',
          order: 1,
          setStartTime: '20:00',
          setEndTime: '21:15',
          durationMinutes: 75,
          arrivalTime: '17:30',
          soundCheckTime: '18:00',
          costItems: [{ id: 'c-105-1', concept: 'Honorarios de presentación', category: 'Honorarios', amount: 58000 }],
          agreedTotal: 58000,
          approval: 'Aprobado'
        },
        {
          id: 'ln-105-2',
          groupId: 'grp-5',
          groupName: 'Los Herederos del Regio',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
          genre: 'Norteño Clásico / Acordeón',
          rating: 4.6,
          profileSlug: 'los-herederos-del-regio',
          invitationVideos: [
            {
              id: 'vid-105-1',
              title: 'Los Herederos del Regio te invitan al Gran Baile',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
              type: 'local'
            }
          ],
          isExternal: false,
          managerName: 'Lic. Gonzalo Garza',
          order: 2,
          isHeadliner: true,
          setStartTime: '21:45',
          setEndTime: '23:45',
          durationMinutes: 120,
          arrivalTime: '18:30',
          soundCheckTime: '19:00',
          costItems: [
            { id: 'c-105-2', concept: 'Honorarios de presentación', category: 'Honorarios', amount: 130000 },
            { id: 'c-105-3', concept: 'Viáticos', category: 'Viáticos', amount: 12000 }
          ],
          agreedTotal: 142000,
          approval: 'No Requiere'
        }
      ],
      sound: {
        providerType: 'Proveedor Externo',
        providerName: 'Audio Norte Producciones',
        engineerName: 'Ing. Ricardo Peña',
        engineerPhone: '+52 844 122 9080',
        consoleModel: 'Midas M32',
        speakersSetup: 'Line array RCF HDL 30-A · 18 cajas',
        monitorsSetup: '10 monitores de piso',
        loadInTime: '12:00',
        soundCheckStart: '18:00',
        soundCheckEnd: '19:30',
        cost: 110000
      },
      schedule: {
        crewCallAt: '2026-10-24T11:00',
        loadInAt: '2026-10-24T12:00',
        soundCheckAt: '2026-10-24T18:00',
        doorsOpenAt: '2026-10-24T19:00',
        showStartAt: '2026-10-24T20:00',
        curfewAt: '2026-10-25T00:30'
      },
      reviewRounds: [
        {
          round: 1,
          sentAt: '2026-07-05T11:00',
          sentBy: 'Encargado Acordex',
          approvals: [
            {
              id: 'ap-105-1',
              groupId: 'grp-6',
              groupName: 'Sonido Dinamita Urbano',
              managerName: 'DJ & Mtro. Samuel Vargas',
              status: 'Aprobado',
              respondedAt: '2026-07-07T14:10'
            }
          ],
          closedAt: '2026-07-07T14:10',
          outcome: 'Aprobada'
        }
      ],
      publication: {
        scheduledAt: '2026-08-08T09:00',
        channels: ['Cartelera Acordex', 'Redes Sociales'],
        authorizedBy: 'Encargado Acordex'
      },
      ticketTiers: [
        {
          id: 'tt-105-1', name: 'Mesa VIP (4 personas)', price: 6000, totalSeats: 250, soldSeats: 0, color: '#f2ca50', zoneId: 'sz1',
          icon: 'workspace_premium', description: 'Mesa en pista para cuatro personas con servicio de bar dedicado.',
          rowLabels: seatRows(25), seatsPerRow: 10
        },
        {
          id: 'tt-105-2', name: 'Preferente', price: 1200, totalSeats: 2200, soldSeats: 0, color: '#d4af37', zoneId: 'sz2',
          icon: 'star', description: 'Zona preferente elevada con vista frontal y acceso rápido a barras.',
          rowLabels: seatRows(44, 25), seatsPerRow: 50
        },
        {
          id: 'tt-105-3', name: 'General', price: 550, totalSeats: 5500, soldSeats: 0, color: '#99907c', zoneId: 'sz3',
          icon: 'groups', description: 'Pista general de pie, el corazón del baile frente al escenario.',
          rowLabels: seatRows(55, 69), seatsPerRow: 100
        }
      ],
      croquisZones: [
        { id: 'sz1', name: 'Mesas VIP Pista', capacity: 250, occupancyPercent: 0, color: '#f2ca50', seatingType: 'Numerada' },
        { id: 'sz2', name: 'Zona Preferente', capacity: 2200, occupancyPercent: 0, color: '#d4af37', seatingType: 'General' },
        { id: 'sz3', name: 'Pista General', capacity: 6050, occupancyPercent: 0, color: '#99907c', seatingType: 'De Pie' }
      ],
      timeline: [
        {
          id: 'tl-105-1',
          phaseNumber: 1,
          state: 'Borrador',
          phaseName: 'Armado del Evento',
          completedAt: '2026-06-28T10:00',
          actorName: 'Encargado Acordex',
          summaryNote: 'Borrador creado para el baile de octubre.'
        },
        {
          id: 'tl-105-2',
          phaseNumber: 2,
          state: 'En Revisión',
          phaseName: 'Revisión de Encargados',
          completedAt: '2026-07-07T14:10',
          actorName: 'DJ & Mtro. Samuel Vargas',
          summaryNote: 'Aprobado por el único encargado externo del cartel.',
          snapshot: { lineupCount: 2, approvalsCount: 1 }
        },
        {
          id: 'tl-105-3',
          phaseNumber: 3,
          state: 'Próximo a Publicar',
          phaseName: 'Programación de Publicación',
          completedAt: '2026-07-08T09:30',
          actorName: 'Encargado Acordex',
          summaryNote: 'Publicación automática programada para el 8 de agosto a las 09:00.',
          snapshot: { totalCapacity: 7950, lineupCost: 200000 }
        }
      ],
      evidenceMedia: []
    },

    // ─── 106 · PUBLICADO, AÚN SIN VENTAS ──────────────────────────────────────
    {
      id: 'EVT-106',
      title: 'Noche de Acordeón — Torreón',
      date: '2026-11-07',
      location: 'Torreón, COAH',
      venue: 'Coliseo Centenario',
      venueAddress: 'Av. Juárez #2500, Centro, Torreón, COAH.',
      groupName: 'Los Elegantes del Norte',
      disqueraId: ACTIVE_DISQUERA_ID,
      state: 'Publicado',
      flyerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      description: 'Una noche dedicada al acordeón norteño con dos agrupaciones de casa.',
      createdBy: 'Encargado Acordex',
      createdAt: '2026-06-15T08:45',
      ownerManagerName: 'Encargado Acordex',
      capacity: 5200,
      isCoProduction: false,
      publicProfile: {
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1400&auto=format&fit=crop&q=80',
        posterUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&auto=format&fit=crop&q=80',
        category: 'Concierto',
        tagline: 'Una noche entera dedicada al acordeón norteño en Torreón.',
        about: 'Los Elegantes del Norte presentan dos horas de acordeón y sax en el Coliseo Centenario, repasando sus discos más queridos. Recinto techado con butaca numerada en zona preferente y gradas generales con excelente visibilidad.',
        rules: [
          { id: 'r-106-1', text: 'No se permite el ingreso de alimentos ni bebidas ajenas al recinto.' },
          { id: 'r-106-2', text: 'Las puertas abren una hora antes del inicio del concierto.' },
          { id: 'r-106-3', text: 'Menores de 15 años deben ingresar acompañados de un adulto.' }
        ],
        minimumAge: 'Recomendado para mayores de 15 años',
        serviceFeePerSeat: 45,
        supportPhone: '+52 (81) 1234 5678',
        supportWhatsApp: '528112345678',
        mapsQuery: 'Coliseo Centenario Torreón',
        guaranteeLabel: 'Acordex VIP'
      },
      lineup: [
        {
          id: 'ln-106-1',
          groupId: 'grp-1',
          groupName: 'Los Elegantes del Norte',
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          genre: 'Norteño Sax',
          rating: 4.9,
          profileSlug: 'los-elegantes-del-norte',
          invitationVideos: [
            {
              id: 'vid-106-1',
              title: 'Invitación Especial (Video Oficial del Grupo)',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
              type: 'local'
            },
            {
              id: 'vid-106-2',
              title: 'Video de Promoción (Enlace a Redes Sociales)',
              url: 'https://www.youtube.com/embed/F77FwZq-7gE',
              type: 'youtube'
            }
          ],
          isExternal: false,
          managerName: 'Don Raúl Treviño',
          order: 1,
          isHeadliner: true,
          setStartTime: '21:00',
          setEndTime: '23:00',
          durationMinutes: 120,
          arrivalTime: '18:00',
          soundCheckTime: '18:30',
          costItems: [{ id: 'c-106-1', concept: 'Honorarios de presentación', category: 'Honorarios', amount: 220000 }],
          agreedTotal: 220000,
          approval: 'No Requiere'
        }
      ],
      sound: {
        providerType: 'Equipo del Recinto',
        providerName: 'Coliseo Centenario — Audio Casa',
        engineerName: 'Ing. Beto Ramírez',
        engineerPhone: '+52 871 455 3300',
        consoleModel: 'Behringer X32',
        loadInTime: '14:00',
        soundCheckStart: '18:30',
        soundCheckEnd: '19:45',
        cost: 48000
      },
      schedule: {
        crewCallAt: '2026-11-07T13:00',
        loadInAt: '2026-11-07T14:00',
        soundCheckAt: '2026-11-07T18:30',
        doorsOpenAt: '2026-11-07T20:00',
        showStartAt: '2026-11-07T21:00',
        curfewAt: '2026-11-08T00:00'
      },
      reviewRounds: [],
      publication: {
        publishedAt: '2026-07-28T10:00',
        publishedBy: 'Encargado Acordex',
        publicUrl: '/cartelera/EVT-106',
        channels: ['Cartelera Acordex', 'Redes Sociales', 'Taquilla Física']
      },
      sales: { ordersCount: 0, ticketsSold: 0, grossRevenue: 0 },
      ticketTiers: [
        {
          id: 'tt-106-1', name: 'Preferente', price: 1300, totalSeats: 1200, soldSeats: 0, color: '#d4af37', zoneId: 'cz1',
          icon: 'star', description: 'Butaca numerada a pie de escenario con acceso prioritario.',
          rowLabels: seatRows(30), seatsPerRow: 40
        },
        {
          id: 'tt-106-2', name: 'General', price: 620, totalSeats: 3800, soldSeats: 0, color: '#99907c', zoneId: 'cz2',
          icon: 'event_seat', description: 'Gradas generales techadas con vista completa del escenario.',
          rowLabels: seatRows(38, 30), seatsPerRow: 100
        }
      ],
      croquisZones: [
        { id: 'cz1', name: 'Ring Side Preferente', capacity: 1200, occupancyPercent: 0, color: '#d4af37', seatingType: 'Numerada' },
        { id: 'cz2', name: 'Gradas Generales', capacity: 4000, occupancyPercent: 0, color: '#99907c', seatingType: 'General' }
      ],
      timeline: [
        {
          id: 'tl-106-1',
          phaseNumber: 4,
          state: 'Publicado',
          phaseName: 'Publicación en Cartelera',
          completedAt: '2026-07-28T10:00',
          actorName: 'Encargado Acordex',
          summaryNote: 'Evento publicado en cartelera con boletos disponibles en los tres canales.',
          snapshot: { totalCapacity: 5000, lineupCost: 220000 }
        }
      ],
      evidenceMedia: []
    },

    // ─── 107 · EN VENTA ───────────────────────────────────────────────────────
    {
      id: 'EVT-107',
      title: 'Gran Palenque San Marcos — Banda La Imperial',
      date: '2026-09-02',
      location: 'Aguascalientes, AGS',
      venue: 'Palenque San Marcos',
      venueAddress: 'Explanada del Palenque, San Marcos, Aguascalientes, AGS.',
      groupName: 'Banda La Imperial',
      disqueraId: ACTIVE_DISQUERA_ID,
      state: 'En Venta',
      flyerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
      description: 'La tambora más potente del país en el palenque más famoso de la feria.',
      createdBy: 'Encargado Acordex',
      createdAt: '2026-05-12T09:15',
      ownerManagerName: 'Encargado Acordex',
      capacity: 7300,
      isCoProduction: false,
      publicProfile: {
        coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1400&auto=format&fit=crop&q=80',
        posterUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=900&auto=format&fit=crop&q=80',
        category: 'Palenque',
        tagline: 'Dos horas y media de tambora en el palenque de la feria.',
        about: 'Banda La Imperial cierra la Feria de San Marcos con dos horas y media de tambora en el palenque más famoso del país. Servicio de mesa en el anillo dorado, alimentos dentro del recinto y acceso escalonado por zona para evitar filas.',
        rules: [
          { id: 'r-107-1', text: 'El boleto de palenque no incluye consumo de alimentos ni bebidas.' },
          { id: 'r-107-2', text: 'Las puertas abren hora y media antes del inicio.' },
          { id: 'r-107-3', text: 'No se permite el acceso con cámaras profesionales sin acreditación.' },
          { id: 'r-107-4', text: 'Conserva tu boleto digital o físico durante todo el evento.' }
        ],
        minimumAge: 'Mayores de 12 años en zona VIP',
        serviceFeePerSeat: 45,
        supportPhone: '+52 (81) 1234 5678',
        supportWhatsApp: '528112345678',
        mapsQuery: 'Palenque San Marcos Aguascalientes',
        guaranteeLabel: 'Acordex VIP'
      },
      lineup: [
        {
          id: 'ln-107-1',
          groupId: 'grp-3',
          groupName: 'Banda La Imperial',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          genre: 'Banda Sinaloense',
          rating: 4.95,
          profileSlug: 'banda-la-imperial',
          invitationVideos: [
            {
              id: 'vid-107-1',
              title: 'Banda La Imperial te espera en el Palenque',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
              type: 'local'
            },
            {
              id: 'vid-107-2',
              title: 'Video de Promoción (Enlace a Redes Sociales)',
              url: 'https://www.youtube.com/embed/F77FwZq-7gE',
              type: 'youtube'
            }
          ],
          isExternal: false,
          managerName: 'Maestro Fernando Castillo',
          order: 1,
          isHeadliner: true,
          setStartTime: '22:00',
          setEndTime: '00:30',
          durationMinutes: 150,
          arrivalTime: '18:30',
          soundCheckTime: '19:00',
          costItems: [
            { id: 'c-107-1', concept: 'Honorarios de presentación', category: 'Honorarios', amount: 320000 },
            { id: 'c-107-2', concept: 'Viáticos de 16 integrantes', category: 'Viáticos', amount: 28000 },
            { id: 'c-107-3', concept: 'Hospedaje', category: 'Hospedaje', amount: 22000 }
          ],
          agreedTotal: 370000,
          approval: 'No Requiere'
        }
      ],
      sound: {
        providerType: 'Equipo del Recinto',
        providerName: 'Palenque San Marcos — Audio Casa',
        engineerName: 'Ing. Beto Ramírez',
        engineerPhone: '+52 449 310 5522',
        consoleModel: 'Yamaha CL5',
        loadInTime: '13:00',
        soundCheckStart: '19:00',
        soundCheckEnd: '20:30',
        cost: 60000
      },
      schedule: {
        crewCallAt: '2026-09-02T12:00',
        loadInAt: '2026-09-02T13:00',
        soundCheckAt: '2026-09-02T19:00',
        doorsOpenAt: '2026-09-02T20:30',
        showStartAt: '2026-09-02T22:00',
        curfewAt: '2026-09-03T02:00'
      },
      reviewRounds: [],
      publication: {
        publishedAt: '2026-06-01T09:00',
        publishedBy: 'Encargado Acordex',
        publicUrl: '/cartelera/EVT-107',
        channels: ['Cartelera Acordex', 'Redes Sociales', 'Taquilla Física', 'Prensa']
      },
      sales: {
        firstSaleAt: '2026-06-01T11:42',
        lastSaleAt: '2026-08-06T20:11',
        ordersCount: 1980,
        ticketsSold: 3300,
        grossRevenue: 6_020_000,
        refundsCount: 12,
        refundedAmount: 21600,
        dailySales: [
          { date: '2026-07-31', dayLabel: 'Vie', tickets: 128, revenue: 214000 },
          { date: '2026-08-01', dayLabel: 'Sáb', tickets: 190, revenue: 331000 },
          { date: '2026-08-02', dayLabel: 'Dom', tickets: 142, revenue: 246000 },
          { date: '2026-08-03', dayLabel: 'Lun', tickets: 64, revenue: 98000 },
          { date: '2026-08-04', dayLabel: 'Mar', tickets: 71, revenue: 112000 },
          { date: '2026-08-05', dayLabel: 'Mié', tickets: 88, revenue: 141000 },
          { date: '2026-08-06', dayLabel: 'Jue', tickets: 96, revenue: 158000 }
        ]
      },
      ticketTiers: [
        {
          id: 'tt-107-1', name: 'VIP Palenque', price: 3200, totalSeats: 800, soldSeats: 720, color: '#f2ca50', zoneId: 'pz1',
          icon: 'workspace_premium', description: 'Anillo dorado a pie de ruedo con servicio de mesa incluido.',
          rowLabels: seatRows(20), seatsPerRow: 40
        },
        {
          id: 'tt-107-2', name: 'Platea', price: 1800, totalSeats: 2500, soldSeats: 1580, color: '#d4af37', zoneId: 'pz2',
          icon: 'star', description: 'Zona media con asiento numerado y vista completa del ruedo.',
          rowLabels: seatRows(50, 20), seatsPerRow: 50
        },
        {
          id: 'tt-107-3', name: 'Grada Alta', price: 800, totalSeats: 4000, soldSeats: 1000, color: '#99907c', zoneId: 'pz3',
          icon: 'event_seat', description: 'Gradas superiores techadas con acceso por puerta poniente.',
          rowLabels: seatRows(50, 70), seatsPerRow: 80
        }
      ],
      croquisZones: [
        { id: 'pz1', name: 'Anillo Dorado VIP', capacity: 800, occupancyPercent: 90, color: '#f2ca50', seatingType: 'Numerada' },
        { id: 'pz2', name: 'Zona Platea Media', capacity: 2500, occupancyPercent: 63.2, color: '#d4af37', seatingType: 'Numerada' },
        { id: 'pz3', name: 'Gradas Superiores', capacity: 4000, occupancyPercent: 25, color: '#99907c', seatingType: 'General' }
      ],
      timeline: [
        {
          id: 'tl-107-1',
          phaseNumber: 4,
          state: 'Publicado',
          phaseName: 'Publicación en Cartelera',
          completedAt: '2026-06-01T09:00',
          actorName: 'Encargado Acordex',
          summaryNote: 'Publicado en los cuatro canales para el arranque de la feria.'
        },
        {
          id: 'tl-107-2',
          phaseNumber: 5,
          state: 'En Venta',
          phaseName: 'Inicio de Venta de Boletos',
          completedAt: '2026-06-01T11:42',
          actorName: 'Sistema de Taquilla',
          summaryNote: 'Primera venta registrada: el evento queda bloqueado para cambios de precio y croquis.',
          snapshot: { ticketsSold: 1, grossRevenue: 3200 }
        }
      ],
      evidenceMedia: [
        {
          id: 'ev-107-1',
          type: 'photo',
          url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
          caption: 'Montaje del escenario y prueba de luces',
          uploaderName: 'Jorge Staff Ruiz',
          uploaderRole: 'usuario',
          uploadedAt: '2026-08-05 18:30',
          stage: 'Montaje'
        }
      ]
    },

    // ─── 108 · FINALIZADA, CIERRE INCOMPLETO ──────────────────────────────────
    {
      id: 'EVT-108',
      title: 'Explosión Norteña — Chihuahua',
      date: '2026-07-25',
      location: 'Chihuahua, CHIH',
      venue: 'Expo Chihuahua',
      venueAddress: 'Av. Tecnológico #4700, Chihuahua, CHIH.',
      groupName: 'Grupo Dinastía Real',
      disqueraId: ACTIVE_DISQUERA_ID,
      state: 'Finalizada',
      flyerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
      description: 'Doble cartel de corridos tumbados y norteño sax.',
      createdBy: 'Encargado Acordex',
      createdAt: '2026-04-02T10:30',
      ownerManagerName: 'Encargado Acordex',
      capacity: 6000,
      isCoProduction: false,
      publicProfile: {
        coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1400&auto=format&fit=crop&q=80',
        posterUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&auto=format&fit=crop&q=80',
        category: 'Concierto',
        tagline: 'Corridos tumbados y sierreño acústico en una sola noche.',
        about: 'Explosión Norteña reunió en Expo Chihuahua el sierreño acústico de Valentina & Los De La Sierra con el cierre estelar de Grupo Dinastía Real. Recinto con zona preferente numerada y pista general de pie frente al escenario.',
        rules: [
          { id: 'r-108-1', text: 'No se permite el ingreso de alimentos ni bebidas ajenas al recinto.' },
          { id: 'r-108-2', text: 'Las puertas abren una hora antes del inicio.' },
          { id: 'r-108-3', text: 'Menores de 15 años deben ingresar acompañados de un adulto.' }
        ],
        minimumAge: 'Recomendado para mayores de 15 años',
        serviceFeePerSeat: 45,
        supportPhone: '+52 (81) 1234 5678',
        supportWhatsApp: '528112345678',
        mapsQuery: 'Expo Chihuahua',
        guaranteeLabel: 'Acordex VIP'
      },
      lineup: [
        {
          id: 'ln-108-1',
          groupId: 'grp-4',
          groupName: 'Valentina & Los De La Sierra',
          imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
          genre: 'Campirano / Acústico',
          rating: 4.7,
          profileSlug: 'valentina-los-de-la-sierra',
          isExternal: true,
          managerName: 'Valentina Morales',
          order: 1,
          setStartTime: '20:00',
          setEndTime: '20:50',
          durationMinutes: 50,
          arrivalTime: '17:00',
          costItems: [{ id: 'c-108-1', concept: 'Honorarios acústicos', category: 'Honorarios', amount: 52000 }],
          agreedTotal: 52000,
          approval: 'Aprobado'
        },
        {
          id: 'ln-108-2',
          groupId: 'grp-2',
          groupName: 'Grupo Dinastía Real',
          imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
          genre: 'Corridos Tumbados / Sierreño',
          rating: 4.8,
          profileSlug: 'grupo-dinastia-real',
          isExternal: false,
          managerName: 'Mateo "El Güero" Rivas',
          order: 2,
          isHeadliner: true,
          setStartTime: '21:15',
          setEndTime: '23:15',
          durationMinutes: 120,
          arrivalTime: '18:00',
          costItems: [{ id: 'c-108-2', concept: 'Honorarios de presentación', category: 'Honorarios', amount: 195000 }],
          agreedTotal: 195000,
          approval: 'No Requiere'
        }
      ],
      sound: {
        providerType: 'Proveedor Externo',
        providerName: 'Audio Norte Producciones',
        engineerName: 'Ing. Omar Zepeda',
        engineerPhone: '+52 614 288 1199',
        consoleModel: 'Allen & Heath dLive S5000',
        cost: 98000
      },
      schedule: {
        soundCheckAt: '2026-07-25T17:30',
        doorsOpenAt: '2026-07-25T19:00',
        showStartAt: '2026-07-25T20:00'
      },
      reviewRounds: [],
      publication: {
        publishedAt: '2026-04-20T09:00',
        publishedBy: 'Encargado Acordex',
        channels: ['Cartelera Acordex', 'Redes Sociales']
      },
      sales: {
        firstSaleAt: '2026-04-20T13:05',
        lastSaleAt: '2026-07-25T18:40',
        ordersCount: 2450,
        ticketsSold: 4180,
        grossRevenue: 4_310_000
      },
      closure: {
        attendance: 4020,
        ticketsSold: 4180,
        grossRevenue: 4_310_000,
        expenses: [
          { id: 'ex-108-1', concept: 'Renta del recinto', category: 'Recinto', amount: 380000 },
          { id: 'ex-108-2', concept: 'Equipo de sonido e iluminación', category: 'Sonido', amount: 98000 },
          { id: 'ex-108-3', concept: 'Seguridad y control de accesos', category: 'Seguridad', amount: 64000 },
          { id: 'ex-108-4', concept: 'Campaña de difusión', category: 'Publicidad', amount: 120000 }
        ],
        payouts: [
          {
            groupId: 'grp-4',
            groupName: 'Valentina & Los De La Sierra',
            agreedTotal: 52000,
            paidAmount: 52000,
            status: 'Pagado',
            paidAt: '2026-07-28',
            receiptReference: 'TRF-99120'
          },
          {
            groupId: 'grp-2',
            groupName: 'Grupo Dinastía Real',
            agreedTotal: 195000,
            paidAmount: 100000,
            status: 'Parcial',
            paidAt: '2026-07-29',
            notes: 'Falta liquidar el 50% restante contra factura.'
          }
        ],
        mediaUploadedCount: 2,
        summary: 'Evento realizado sin incidentes. Falta liquidar a Grupo Dinastía Real y capturar el material final.'
      },
      ticketTiers: [
        {
          id: 'tt-108-1', name: 'Preferente', price: 1400, totalSeats: 1500, soldSeats: 1380, color: '#d4af37', zoneId: 'chz1',
          icon: 'star', description: 'Butaca numerada frente al escenario con acceso preferente.',
          rowLabels: seatRows(30), seatsPerRow: 50
        },
        {
          id: 'tt-108-2', name: 'General', price: 780, totalSeats: 3500, soldSeats: 2800, color: '#99907c', zoneId: 'chz2',
          icon: 'groups', description: 'Pista general de pie con barras de servicio a los costados.',
          rowLabels: seatRows(35, 30), seatsPerRow: 100
        }
      ],
      croquisZones: [
        { id: 'chz1', name: 'Zona Preferente', capacity: 1500, occupancyPercent: 92, color: '#d4af37', seatingType: 'Numerada' },
        { id: 'chz2', name: 'Pista General', capacity: 4500, occupancyPercent: 62.2, color: '#99907c', seatingType: 'De Pie' }
      ],
      timeline: [
        {
          id: 'tl-108-1',
          phaseNumber: 5,
          state: 'En Venta',
          phaseName: 'Venta de Boletos',
          completedAt: '2026-04-20T13:05',
          actorName: 'Sistema de Taquilla',
          summaryNote: 'Venta abierta durante 96 días.'
        },
        {
          id: 'tl-108-2',
          phaseNumber: 6,
          state: 'Finalizada',
          phaseName: 'Evento Realizado',
          completedAt: '2026-07-26T02:10',
          actorName: 'Encargado Acordex',
          summaryNote: 'Evento concluido con 4,020 asistentes. Inicia captura de resultados finales.',
          snapshot: { ticketsSold: 4180, grossRevenue: 4310000 }
        }
      ],
      evidenceMedia: [
        {
          id: 'ev-108-1',
          type: 'video',
          url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
          caption: 'Cierre del show con pirotecnia fría',
          uploaderName: 'Jorge Staff Ruiz',
          uploaderRole: 'usuario',
          uploadedAt: '2026-07-25 23:20',
          stage: 'Show'
        },
        {
          id: 'ev-108-2',
          type: 'photo',
          url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          caption: 'Aforo lleno en zona preferente',
          uploaderName: 'Jorge Staff Ruiz',
          uploaderRole: 'usuario',
          uploadedAt: '2026-07-25 21:40',
          stage: 'Show'
        }
      ]
    },

    // ─── 109 · CERRADO Y SELLADO ──────────────────────────────────────────────
    {
      id: 'EVT-109',
      title: 'Aniversario Acordex 2026',
      date: '2026-06-13',
      location: 'Monterrey, NL',
      venue: 'Arena Monterrey',
      venueAddress: 'Av. Francisco I. Madero s/n, Central, Monterrey, N.L.',
      groupName: 'Los Elegantes del Norte',
      disqueraId: ACTIVE_DISQUERA_ID,
      state: 'Cerrado',
      flyerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
      description: 'Concierto aniversario con cuatro agrupaciones de la casa.',
      createdBy: 'Encargado Acordex',
      createdAt: '2026-02-10T08:00',
      ownerManagerName: 'Encargado Acordex',
      capacity: 12000,
      isCoProduction: true,
      coProductionPartner: 'Representaciones Madero',
      coProductionSplitPercent: 60,
      publicProfile: {
        coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1400&auto=format&fit=crop&q=80',
        posterUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=900&auto=format&fit=crop&q=80',
        category: 'Festival',
        tagline: 'Tres agrupaciones de casa celebrando el aniversario de Acordex.',
        about: 'El Aniversario Acordex reunió en la Arena Monterrey a tres agrupaciones de la casa en una noche de más de cuatro horas de música. Producción completa de audio, video e iluminación, con accesos escalonados y zona de alimentos en los tres niveles.',
        rules: [
          { id: 'r-109-1', text: 'No se permite el ingreso de alimentos ni bebidas ajenas al recinto.' },
          { id: 'r-109-2', text: 'Las puertas abren dos horas antes del inicio del espectáculo.' },
          { id: 'r-109-3', text: 'Menores de 15 años deben ingresar acompañados de un adulto.' },
          { id: 'r-109-4', text: 'Conserva tu boleto digital o físico durante todo el evento.' }
        ],
        minimumAge: 'Recomendado para mayores de 15 años',
        serviceFeePerSeat: 45,
        supportPhone: '+52 (81) 1234 5678',
        supportWhatsApp: '528112345678',
        mapsQuery: 'Arena Monterrey',
        guaranteeLabel: 'Acordex VIP'
      },
      lineup: [
        {
          id: 'ln-109-1',
          groupId: 'grp-6',
          groupName: 'Sonido Dinamita Urbano',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          genre: 'Cumbia Sonidera / Fusión',
          rating: 4.85,
          profileSlug: 'sonido-dinamita-urbano',
          isExternal: true,
          managerName: 'DJ & Mtro. Samuel Vargas',
          order: 1,
          setStartTime: '19:30',
          setEndTime: '20:20',
          arrivalTime: '16:00',
          costItems: [{ id: 'c-109-1', concept: 'Honorarios', category: 'Honorarios', amount: 55000 }],
          agreedTotal: 55000,
          approval: 'Aprobado'
        },
        {
          id: 'ln-109-2',
          groupId: 'grp-3',
          groupName: 'Banda La Imperial',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          genre: 'Banda Sinaloense',
          rating: 4.95,
          profileSlug: 'banda-la-imperial',
          isExternal: false,
          managerName: 'Maestro Fernando Castillo',
          order: 2,
          setStartTime: '20:40',
          setEndTime: '21:50',
          arrivalTime: '17:00',
          costItems: [{ id: 'c-109-2', concept: 'Honorarios', category: 'Honorarios', amount: 175000 }],
          agreedTotal: 175000,
          approval: 'No Requiere'
        },
        {
          id: 'ln-109-3',
          groupId: 'grp-1',
          groupName: 'Los Elegantes del Norte',
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          genre: 'Norteño Sax',
          rating: 4.9,
          profileSlug: 'los-elegantes-del-norte',
          invitationVideos: [
            {
              id: 'vid-109-1',
              title: 'Los Elegantes del Norte agradecen el aniversario',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
              type: 'local'
            }
          ],
          isExternal: false,
          managerName: 'Don Raúl Treviño',
          order: 3,
          isHeadliner: true,
          setStartTime: '22:10',
          setEndTime: '00:10',
          arrivalTime: '18:00',
          costItems: [{ id: 'c-109-3', concept: 'Honorarios', category: 'Honorarios', amount: 260000 }],
          agreedTotal: 260000,
          approval: 'No Requiere'
        }
      ],
      sound: {
        providerType: 'Proveedor Externo',
        providerName: 'Audio Profesional del Bajío',
        engineerName: 'Ing. Ricardo Peña',
        engineerPhone: '+52 81 8400 2211',
        consoleModel: 'DiGiCo SD10',
        cost: 210000
      },
      schedule: {
        soundCheckAt: '2026-06-13T16:30',
        doorsOpenAt: '2026-06-13T18:30',
        showStartAt: '2026-06-13T19:30'
      },
      reviewRounds: [],
      publication: {
        publishedAt: '2026-03-01T09:00',
        publishedBy: 'Encargado Acordex',
        channels: ['Cartelera Acordex', 'Redes Sociales', 'Prensa']
      },
      sales: {
        firstSaleAt: '2026-03-01T09:22',
        lastSaleAt: '2026-06-13T18:00',
        ordersCount: 6100,
        ticketsSold: 10500,
        grossRevenue: 11_940_000
      },
      closure: {
        attendance: 10120,
        ticketsSold: 10500,
        grossRevenue: 11_940_000,
        expenses: [
          { id: 'ex-109-1', concept: 'Renta de la arena', category: 'Recinto', amount: 1_450_000 },
          { id: 'ex-109-2', concept: 'Audio, video e iluminación', category: 'Sonido', amount: 210000 },
          { id: 'ex-109-3', concept: 'Staff y seguridad', category: 'Staff', amount: 320000 },
          { id: 'ex-109-4', concept: 'Campaña nacional de difusión', category: 'Publicidad', amount: 480000 }
        ],
        payouts: [
          { groupId: 'grp-6', groupName: 'Sonido Dinamita Urbano', agreedTotal: 55000, paidAmount: 55000, status: 'Pagado', paidAt: '2026-06-18', receiptReference: 'TRF-88011' },
          { groupId: 'grp-3', groupName: 'Banda La Imperial', agreedTotal: 175000, paidAmount: 175000, status: 'Pagado', paidAt: '2026-06-18', receiptReference: 'TRF-88012' },
          { groupId: 'grp-1', groupName: 'Los Elegantes del Norte', agreedTotal: 260000, paidAmount: 260000, status: 'Pagado', paidAt: '2026-06-19', receiptReference: 'TRF-88015' }
        ],
        mediaUploadedCount: 1,
        incidents: ['Retraso de 25 minutos en apertura de puertas por revisión de seguridad.'],
        summary: 'Aniversario cerrado con 10,120 asistentes y utilidad positiva. Todos los grupos liquidados.',
        closedAt: '2026-06-30T17:00',
        closedBy: 'Encargado Acordex',
        isSealed: true,
        sealedAt: '2026-07-02T10:00',
        sealedBy: 'Encargado Acordex'
      },
      ticketTiers: [
        {
          id: 'tt-109-1', name: 'VIP Diamante', price: 2500, totalSeats: 500, soldSeats: 500, color: '#f2ca50', zoneId: 'az1',
          icon: 'workspace_premium', description: 'Primeras filas, acceso prioritario y bebida de cortesía.',
          rowLabels: seatRows(25), seatsPerRow: 20
        },
        {
          id: 'tt-109-2', name: 'Preferente Oro', price: 1400, totalSeats: 2000, soldSeats: 2000, color: '#d4af37', zoneId: 'az2',
          icon: 'star', description: 'Palcos laterales con butaca numerada y vista central.',
          rowLabels: seatRows(40, 25), seatsPerRow: 50
        },
        {
          id: 'tt-109-3', name: 'General', price: 650, totalSeats: 8000, soldSeats: 8000, color: '#99907c', zoneId: 'az3',
          icon: 'groups', description: 'Graderías generales con pantallas y sonido envolvente.',
          rowLabels: seatRows(80, 65), seatsPerRow: 100
        }
      ],
      croquisZones: [
        { id: 'az1', name: 'Ruedo VIP Frontal', capacity: 500, occupancyPercent: 100, color: '#f2ca50', seatingType: 'Numerada' },
        { id: 'az2', name: 'Palcos Laterales', capacity: 2000, occupancyPercent: 100, color: '#d4af37', seatingType: 'Numerada' },
        { id: 'az3', name: 'Graderías Generales', capacity: 9500, occupancyPercent: 84.2, color: '#99907c', seatingType: 'General' }
      ],
      timeline: [
        {
          id: 'tl-109-1',
          phaseNumber: 4,
          state: 'Publicado',
          phaseName: 'Publicación en Cartelera',
          completedAt: '2026-03-01T09:00',
          actorName: 'Encargado Acordex',
          summaryNote: 'Publicado con tres meses de anticipación.'
        },
        {
          id: 'tl-109-2',
          phaseNumber: 5,
          state: 'En Venta',
          phaseName: 'Venta de Boletos',
          completedAt: '2026-03-01T09:22',
          actorName: 'Sistema de Taquilla',
          summaryNote: 'Agotado en las tres categorías antes del día del evento.',
          snapshot: { ticketsSold: 10500, grossRevenue: 11940000 }
        },
        {
          id: 'tl-109-3',
          phaseNumber: 6,
          state: 'Finalizada',
          phaseName: 'Evento Realizado',
          completedAt: '2026-06-14T01:30',
          actorName: 'Encargado Acordex',
          summaryNote: 'Evento concluido con 10,120 asistentes.'
        },
        {
          id: 'tl-109-4',
          phaseNumber: 7,
          state: 'Cerrado',
          phaseName: 'Expediente Sellado',
          completedAt: '2026-07-02T10:00',
          actorName: 'Encargado Acordex',
          summaryNote: 'Expediente sellado: gastos, pagos y material multimedia capturados en su totalidad.',
          snapshot: { ticketsSold: 10500, grossRevenue: 11940000, lineupCost: 490000 }
        }
      ],
      evidenceMedia: [
        {
          id: 'ev-109-1',
          type: 'photo',
          url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
          caption: 'Arena llena en el cierre del aniversario',
          uploaderName: 'Jorge Staff Ruiz',
          uploaderRole: 'usuario',
          uploadedAt: '2026-06-13 23:55',
          stage: 'Show'
        }
      ]
    },

    // ─── 110 · CANCELADO CON REEMBOLSOS ───────────────────────────────────────
    {
      id: 'EVT-110',
      title: 'Serenata de Primavera — Culiacán',
      date: '2026-08-29',
      location: 'Culiacán, SIN',
      venue: 'Teatro Pablo de Villavicencio',
      venueAddress: 'Blvd. Alfonso Zaragoza #2478, Culiacán, SIN.',
      groupName: 'Valentina & Los De La Sierra',
      disqueraId: ACTIVE_DISQUERA_ID,
      state: 'Cancelado',
      flyerUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
      description: 'Concierto acústico de temporada.',
      createdBy: 'Administrador Operativo',
      createdAt: '2026-05-20T11:00',
      ownerManagerName: 'Administrador Operativo',
      capacity: 1200,
      isCoProduction: false,
      publicProfile: {
        coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1400&auto=format&fit=crop&q=80',
        posterUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&auto=format&fit=crop&q=80',
        category: 'Concierto',
        tagline: 'Un concierto acústico e íntimo en el corazón de Culiacán.',
        about: 'Serenata de Primavera proponía una velada acústica en el Teatro Pablo de Villavicencio, con luneta y balcón numerados y un formato íntimo de dos horas. El evento fue cancelado por causa de fuerza mayor y todos los boletos fueron reembolsados.',
        rules: [
          { id: 'r-110-1', text: 'Acceso permitido hasta quince minutos después del inicio.' },
          { id: 'r-110-2', text: 'No se permite el ingreso de alimentos ni bebidas a la sala.' },
          { id: 'r-110-3', text: 'Menores de 8 años no tienen acceso a la sala.' }
        ],
        minimumAge: 'Mayores de 8 años',
        serviceFeePerSeat: 45,
        supportPhone: '+52 (81) 1234 5678',
        supportWhatsApp: '528112345678',
        mapsQuery: 'Teatro Pablo de Villavicencio Culiacán',
        guaranteeLabel: 'Acordex VIP'
      },
      lineup: [
        {
          id: 'ln-110-1',
          groupId: 'grp-4',
          groupName: 'Valentina & Los De La Sierra',
          imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
          genre: 'Campirano / Acústico',
          rating: 4.7,
          profileSlug: 'valentina-los-de-la-sierra',
          isExternal: true,
          managerName: 'Valentina Morales',
          order: 1,
          isHeadliner: true,
          setStartTime: '20:00',
          setEndTime: '22:00',
          arrivalTime: '17:00',
          costItems: [{ id: 'c-110-1', concept: 'Honorarios acústicos', category: 'Honorarios', amount: 60000 }],
          agreedTotal: 60000,
          approval: 'Aprobado'
        }
      ],
      sound: {
        providerType: 'Equipo del Recinto',
        providerName: 'Teatro Pablo de Villavicencio',
        engineerName: 'Ing. Beto Ramírez',
        engineerPhone: '+52 667 712 3344',
        cost: 32000
      },
      schedule: {
        soundCheckAt: '2026-08-29T17:30',
        doorsOpenAt: '2026-08-29T19:00',
        showStartAt: '2026-08-29T20:00'
      },
      reviewRounds: [],
      publication: {
        publishedAt: '2026-06-05T10:00',
        publishedBy: 'Administrador Operativo',
        channels: ['Cartelera Acordex']
      },
      sales: {
        firstSaleAt: '2026-06-05T15:30',
        lastSaleAt: '2026-07-20T19:00',
        ordersCount: 210,
        ticketsSold: 340,
        grossRevenue: 306000,
        refundsCount: 340,
        refundedAmount: 306000
      },
      cancellation: {
        reason: 'Lesión de la vocalista principal con incapacidad médica de 30 días, sin posibilidad de reprogramar en la temporada.',
        at: '2026-07-22T12:00',
        by: 'Administrador Operativo',
        cancelledFromState: 'En Venta',
        refundsIssued: 340,
        refundedAmount: 306000,
        clientMessage: 'Lamentamos informarle que el concierto fue cancelado por causa de fuerza mayor. El reembolso íntegro se procesó al método de pago original.'
      },
      ticketTiers: [
        {
          id: 'tt-110-1', name: 'Luneta', price: 1200, totalSeats: 400, soldSeats: 190, color: '#d4af37', zoneId: 'clz1',
          icon: 'star', description: 'Butaca numerada en planta baja, a pocos metros del escenario.',
          rowLabels: seatRows(20), seatsPerRow: 20
        },
        {
          id: 'tt-110-2', name: 'Balcón', price: 700, totalSeats: 800, soldSeats: 150, color: '#99907c', zoneId: 'clz2',
          icon: 'event_seat', description: 'Balcón superior numerado con vista panorámica de la sala.',
          rowLabels: seatRows(20, 20), seatsPerRow: 40
        }
      ],
      croquisZones: [
        { id: 'clz1', name: 'Luneta', capacity: 400, occupancyPercent: 47.5, color: '#d4af37', seatingType: 'Numerada' },
        { id: 'clz2', name: 'Balcón', capacity: 800, occupancyPercent: 18.8, color: '#99907c', seatingType: 'Numerada' }
      ],
      timeline: [
        {
          id: 'tl-110-1',
          phaseNumber: 5,
          state: 'En Venta',
          phaseName: 'Venta de Boletos',
          completedAt: '2026-06-05T15:30',
          actorName: 'Sistema de Taquilla',
          summaryNote: '340 boletos vendidos antes de la cancelación.'
        },
        {
          id: 'tl-110-2',
          phaseNumber: 0,
          state: 'Cancelado',
          phaseName: 'Cancelación del Evento',
          completedAt: '2026-07-22T12:00',
          actorName: 'Administrador Operativo',
          summaryNote: 'Cancelado por lesión de la vocalista. Se reembolsaron los 340 boletos vendidos.',
          snapshot: { ticketsSold: 340, grossRevenue: 306000 }
        }
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
    },
    {
      id: 'LOG-904',
      timestamp: '2026-07-22 16:45',
      userName: 'Mariana Staff López',
      role: 'usuario',
      action: 'Checklist de Montaje Completado',
      targetModule: 'Tareas',
      details: 'Completó la verificación de cableado de iluminación y accesos VIP'
    },
    {
      id: 'LOG-905',
      timestamp: '2026-07-21 09:15',
      userName: 'Carlos Staff Pérez',
      role: 'usuario',
      action: 'Acreditación de Medios',
      targetModule: 'Prensa',
      details: 'Verificó gafetes y entregó 35 kits de prensa en hotel sede'
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

  readonly receivingCards = signal<ReceivingCard[]>(
    this.storage.getItem('acordex_receiving_cards', this.INITIAL_RECEIVING_CARDS)
  );

  getReceivingCards(): ReceivingCard[] {
    return this.receivingCards();
  }

  getReceivingCardById(id?: string): ReceivingCard {
    const list = this.receivingCards();
    if (!id) return list.find(c => c.isDefault) || list[0];
    return list.find(c => c.id === id) || list[0];
  }

  readonly quotes = signal<Quote[]>(
    this.loadQuotesWithFreshMocks()
  );

  private loadQuotesWithFreshMocks(): Quote[] {
    const list = this.normalizeLegacyStates(
      this.storage.getItem<Quote[]>('acordex_quotes_v7', this.INITIAL_QUOTES)
    );
    for (const qId of ['COT-8901', 'COT-8902', 'COT-8903', 'COT-8905']) {
      const fresh = this.INITIAL_QUOTES.find(q => q.id === qId);
      if (fresh) {
        const idx = list.findIndex(q => q.id === qId);
        if (idx !== -1) {
          list[idx] = fresh;
        } else {
          list.push(fresh);
        }
      }
    }
    return list;
  }

  /**
   * 'Pago confirmado' se eliminó del pipeline porque la confirmación de pago ya
   * vive en `paymentStatus` y en los hitos de `paymentMilestones`. Las cotizaciones
   * que quedaron persistidas en localStorage con ese estado se reubican en
   * 'Contrato firmado', que es la fase real en la que se encuentran.
   */
  private normalizeLegacyStates(list: Quote[]): Quote[] {
    return list.map(q =>
      (q.state as string) === 'Pago confirmado'
        ? { ...q, state: 'Contrato firmado' as QuoteState }
        : q
    );
  }

  /**
   * Clave versionada: el modelo de evento cambió por completo (de cuatro
   * etiquetas sueltas a un ciclo de siete fases con cartel, producción,
   * aprobaciones, venta y cierre). Lo que quedó guardado con la forma anterior
   * ya no es interpretable, así que se parte de los mocks nuevos en vez de
   * intentar migrar un dato que no tiene los campos que ahora se necesitan.
   */
  readonly events = signal<EventItem[]>(
    this.storage.getItem('acordex_events_v2', this.INITIAL_EVENTS)
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

  // KPI Card 1: Grupo con mayor aprobación
  readonly topApprovedGroup = computed(() => {
    const list = this.groups();
    if (!list.length) return null;
    return [...list].sort((a, b) => b.rating - a.rating)[0];
  });

  // KPI Card 2: Cantidad de grupos pendientes por firmar con la disquera
  readonly pendingContractGroupsCount = computed(() => {
    return this.groups().filter(g => g.pendingLabelContract || g.disqueraType === 'Pendiente de Firma').length;
  });

  // KPI Card 3: Cantidad de grupos que no son exclusivamente de la disquera / por fuera de plataforma
  readonly externalOrNonExclusiveCount = computed(() => {
    return this.groups().filter(g => !g.isExclusive || !g.isPlatformRegistered || g.disqueraType !== 'Firmado Exclusivo').length;
  });

  // KPI Card 4: Eventos totales efectuados mensualmente de todos los grupos y grupo que más efectuó
  readonly monthlyEventsStats = computed(() => {
    const list = this.groups();
    const totalEvents = list.reduce((sum, g) => sum + (g.monthlyEventsCount || 0), 0);
    const sorted = [...list].sort((a, b) => (b.monthlyEventsCount || 0) - (a.monthlyEventsCount || 0));
    const topGroup = sorted.length ? sorted[0] : null;
    return {
      totalEvents,
      topGroup
    };
  });

  // KPI Card 5: Cotizaciones totales efectuadas mensualmente de todos los grupos y grupo que más efectuó
  readonly monthlyQuotesStats = computed(() => {
    const list = this.groups();
    const totalQuotes = list.reduce((sum, g) => sum + (g.monthlyQuotesCount || 0), 0);
    const sorted = [...list].sort((a, b) => (b.monthlyQuotesCount || 0) - (a.monthlyQuotesCount || 0));
    const topGroup = sorted.length ? sorted[0] : null;
    return {
      totalQuotes,
      topGroup
    };
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

  addAudit(action: string, targetModule: string, details: string): void {
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
    this.storage.setItem('acordex_quotes_v6', updated);
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
    this.storage.setItem('acordex_quotes_v6', updated);
    this.addAudit('Actualización de Pago', 'Cotizaciones', `Cambió estado de pago de ${quoteId} a "${newPaymentStatus}"`);
  }

  updateQuoteDetails(quoteId: string, updates: Partial<Quote>): void {
    const updated = this.quotes().map(q => {
      if (q.id === quoteId) {
        return { ...q, ...updates };
      }
      return q;
    });
    this.quotes.set(updated);
    this.storage.setItem('acordex_quotes_v6', updated);
    this.addAudit('Actualización de Cotización', 'Cotizaciones', `Se actualizaron los detalles y propuesta comercial de ${quoteId}`);
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
    this.storage.setItem('acordex_quotes_v6', updated);
    this.addAudit('Creación de Cotización', 'Cotizaciones', `Creó la cotización ${created.id} para ${created.groupName}`);
  }

  // --- CICLO DE VIDA DEL EVENTO ---

  /** Escribe un evento ya modificado y lo persiste. */
  private commitEvents(updated: EventItem[]): void {
    this.events.set(updated);
    this.storage.setItem('acordex_events_v2', updated);
  }

  /** Aplica una transformación a un solo evento. */
  private patchEvent(eventId: string, patch: (ev: EventItem) => EventItem): void {
    this.commitEvents(this.events().map(ev => (ev.id === eventId ? patch(ev) : ev)));
  }

  /** Nombre con el que queda firmada la acción en la trazabilidad. */
  private currentActorName(): string {
    switch (this.roleService.activeRole()) {
      case 'encargado': return 'Encargado Acordex';
      case 'administrador': return 'Administrador Operativo';
      default: return 'Jorge Staff Ruiz';
    }
  }

  private nowStamp(): string {
    return new Date().toISOString().slice(0, 16);
  }

  /** Agrega un hito a la línea de tiempo del evento. */
  private appendTimeline(ev: EventItem, step: Omit<EventTimelineStep, 'id' | 'completedAt' | 'actorName'>): EventItem {
    const entry: EventTimelineStep = {
      ...step,
      id: `tl-${ev.id}-${(ev.timeline?.length || 0) + 1}`,
      completedAt: this.nowStamp(),
      actorName: this.currentActorName()
    };
    return { ...ev, timeline: [...(ev.timeline || []), entry] };
  }

  updateEventDetails(eventId: string, updates: Partial<EventItem>): void {
    this.patchEvent(eventId, ev => ({ ...ev, ...updates }));
    this.addAudit('Edición de Evento', 'Eventos', `Actualizó el expediente del evento ${eventId}`);
  }

  /**
   * Envía un borrador a revisión y abre la ronda de aprobación.
   *
   * La ronda se arma con un renglón por cada grupo del cartel que pertenece a
   * otro encargado: son ellos, y solo ellos, quienes tienen que dar el visto
   * bueno a la fecha, el horario y el costo antes de que el evento pueda
   * publicarse. Si el cartel es todo propio, no hay a quién preguntarle y el
   * evento queda aprobado de una vez.
   */
  submitEventForReview(eventId: string, note?: string): void {
    this.patchEvent(eventId, ev => {
      const externals = (ev.lineup || []).filter(s => s.isExternal);
      const round = (ev.reviewRounds?.length || 0) + 1;
      const sentAt = this.nowStamp();

      const newRound: EventReviewRound = {
        round,
        sentAt,
        sentBy: this.currentActorName(),
        note,
        approvals: externals.map((slot, i) => ({
          id: `ap-${ev.id}-${round}-${i + 1}`,
          groupId: slot.groupId,
          groupName: slot.groupName,
          managerName: slot.managerName,
          status: 'Pendiente' as const
        }))
      };

      const withRound: EventItem = {
        ...ev,
        state: 'En Revisión',
        reviewRounds: [...(ev.reviewRounds || []), newRound],
        lineup: (ev.lineup || []).map(s => (s.isExternal ? { ...s, approval: 'Pendiente' as const } : s))
      };

      return this.appendTimeline(withRound, {
        phaseNumber: 2,
        state: 'En Revisión',
        phaseName: `Revisión de Encargados (Ronda ${round})`,
        summaryNote: externals.length > 0
          ? `Enviado a revisión: ${externals.length} encargado(s) externo(s) deben aprobar horarios y costos.`
          : 'Enviado a revisión. El cartel es propio, así que no requiere aprobaciones externas.',
        snapshot: { lineupCount: ev.lineup?.length || 0, approvalsCount: externals.length }
      });
    });

    this.addAudit('Envío a Revisión', 'Eventos', `Envió el evento ${eventId} a revisión de los encargados involucrados`);
  }

  /**
   * Respuesta de un encargado a la ronda vigente. El rechazo exige motivo: sin
   * él, quien armó el evento no tiene forma de saber qué corregir.
   */
  respondEventApproval(
    eventId: string,
    approvalId: string,
    approve: boolean,
    reason?: string,
    requestedChanges: string[] = []
  ): void {
    this.patchEvent(eventId, ev => {
      const rounds = [...(ev.reviewRounds || [])];
      if (!rounds.length) return ev;

      const lastIndex = rounds.length - 1;
      const current = rounds[lastIndex];
      const approvals = current.approvals.map(a =>
        a.id === approvalId
          ? {
              ...a,
              status: (approve ? 'Aprobado' : 'Rechazado') as 'Aprobado' | 'Rechazado',
              respondedAt: this.nowStamp(),
              reason: approve ? undefined : reason,
              requestedChanges: approve ? undefined : requestedChanges
            }
          : a
      );

      const responded = approvals.find(a => a.id === approvalId);
      const allApproved = approvals.every(a => a.status === 'Aprobado');
      const anyRejected = approvals.some(a => a.status === 'Rechazado');

      rounds[lastIndex] = {
        ...current,
        approvals,
        closedAt: allApproved || anyRejected ? this.nowStamp() : current.closedAt,
        outcome: allApproved ? 'Aprobada' : (anyRejected ? 'Con Cambios Solicitados' : current.outcome)
      };

      const updated: EventItem = {
        ...ev,
        reviewRounds: rounds,
        lineup: (ev.lineup || []).map(s =>
          responded && s.groupId === responded.groupId
            ? { ...s, approval: (approve ? 'Aprobado' : 'Rechazado') as 'Aprobado' | 'Rechazado' }
            : s
        )
      };

      return this.appendTimeline(updated, {
        phaseNumber: 2,
        state: 'En Revisión',
        phaseName: `Revisión de Encargados (Ronda ${current.round})`,
        summaryNote: approve
          ? `${responded?.managerName || 'El encargado'} aprobó la participación de ${responded?.groupName || 'su grupo'}.`
          : `${responded?.managerName || 'El encargado'} rechazó: ${reason || 'sin motivo capturado'}`
      });
    });

    this.addAudit(
      approve ? 'Aprobación de Evento' : 'Rechazo de Evento',
      'Eventos',
      `${approve ? 'Aprobó' : 'Rechazó'} su participación en el evento ${eventId}`
    );
  }

  /**
   * Publica el evento, ya sea de inmediato o programado.
   *
   * Es el punto de no retorno: a partir de aquí el evento es visible para el
   * público y cualquier corrección deja de ser un trámite interno.
   */
  publishEvent(eventId: string, scheduledAt?: string): void {
    const immediate = !scheduledAt;

    this.patchEvent(eventId, ev => {
      const updated: EventItem = {
        ...ev,
        state: immediate ? 'Publicado' : 'Próximo a Publicar',
        publication: {
          ...(ev.publication || {}),
          scheduledAt: immediate ? undefined : scheduledAt,
          publishedAt: immediate ? this.nowStamp() : undefined,
          publishedBy: immediate ? this.currentActorName() : undefined,
          publicUrl: immediate ? `/cartelera/${ev.id}` : ev.publication?.publicUrl,
          authorizedBy: this.currentActorName()
        }
      };

      return this.appendTimeline(updated, {
        phaseNumber: immediate ? 4 : 3,
        state: immediate ? 'Publicado' : 'Próximo a Publicar',
        phaseName: immediate ? 'Publicación en Cartelera' : 'Programación de Publicación',
        summaryNote: immediate
          ? 'Evento publicado en cartelera con boletos disponibles al público.'
          : `Publicación automática programada para ${scheduledAt}.`,
        snapshot: { totalCapacity: (ev.ticketTiers || []).reduce((s, t) => s + (t.totalSeats || 0), 0) }
      });
    });

    this.addAudit(
      immediate ? 'Publicación de Evento' : 'Programación de Publicación',
      'Eventos',
      immediate ? `Publicó el evento ${eventId} en cartelera` : `Programó la publicación del evento ${eventId}`
    );
  }

  /**
   * Cierra y sella el expediente: pasa a 'Cerrado' y congela el reporte.
   *
   * Es la única transición irreversible del ciclo, así que se firma con quién
   * y cuándo: a partir de aquí el evento solo se consulta.
   */
  sealEventClosure(eventId: string): void {
    this.patchEvent(eventId, ev => {
      const updated: EventItem = {
        ...ev,
        state: 'Cerrado',
        closure: {
          expenses: [],
          payouts: [],
          ...(ev.closure || {}),
          closedAt: ev.closure?.closedAt || this.nowStamp(),
          closedBy: ev.closure?.closedBy || this.currentActorName(),
          isSealed: true,
          sealedAt: this.nowStamp(),
          sealedBy: this.currentActorName()
        }
      };

      return this.appendTimeline(updated, {
        phaseNumber: 7,
        state: 'Cerrado',
        phaseName: 'Expediente Sellado',
        summaryNote: 'Expediente cerrado y sellado: gastos, pagos a grupos y resultados capturados en su totalidad.',
        snapshot: {
          ticketsSold: ev.closure?.ticketsSold,
          grossRevenue: ev.closure?.grossRevenue,
          lineupCount: ev.lineup?.length || 0
        }
      });
    });

    this.addAudit('Cierre de Evento', 'Eventos', `Selló el expediente del evento ${eventId}`);
  }

  /** Cancela el evento. Si ya había venta, el motivo y los reembolsos quedan registrados. */
  cancelEvent(eventId: string, reason: string, refundsIssued = 0, refundedAmount = 0): void {
    this.patchEvent(eventId, ev => {
      const updated: EventItem = {
        ...ev,
        state: 'Cancelado',
        cancellation: {
          reason,
          at: this.nowStamp(),
          by: this.currentActorName(),
          cancelledFromState: ev.state,
          refundsIssued,
          refundedAmount
        }
      };

      return this.appendTimeline(updated, {
        phaseNumber: 0,
        state: 'Cancelado',
        phaseName: 'Cancelación del Evento',
        summaryNote: `Cancelado desde ${ev.state}: ${reason}`,
        snapshot: { ticketsSold: refundsIssued, grossRevenue: refundedAmount }
      });
    });

    this.addAudit('Cancelación de Evento', 'Eventos', `Canceló el evento ${eventId}: ${reason}`);
  }

  // --- EVIDENCE UPLOAD FOR USUARIO ROLE IN EVENTS ---

  uploadEventEvidence(eventId: string, type: 'photo' | 'video', caption: string, url: string, stage?: string): void {
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
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      stage: (stage as EventEvidence['stage']) || 'Otro'
    };

    this.patchEvent(eventId, ev => ({
      ...ev,
      evidenceMedia: [evidence, ...(ev.evidenceMedia || [])]
    }));
    this.addAudit('Carga de Evidencia', 'Eventos', `Subió evidencia multimedia para evento ${eventId}`);
  }

  /**
   * Alta de un evento. Solo pide lo mínimo para poder identificarlo; todo lo
   * demás —cartel, producción, boletaje— se captura después en el expediente,
   * que es justo lo que significa que nazca en 'Borrador'.
   */
  addEvent(draft: NewEventDraft): void {
    const created: EventItem = {
      id: `EVT-${Math.floor(100 + Math.random() * 900)}`,
      title: draft.title,
      date: draft.date,
      location: draft.location,
      venue: draft.venue,
      venueAddress: draft.venueAddress,
      groupName: draft.groupName || 'Por definir',
      disqueraId: ACTIVE_DISQUERA_ID,
      state: 'Borrador',
      flyerUrl: draft.flyerUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
      description: draft.description,
      createdBy: this.currentActorName(),
      createdAt: this.nowStamp(),
      ownerManagerName: this.currentActorName(),
      capacity: draft.capacity,
      isCoProduction: !!draft.isCoProduction,
      coProductionPartner: draft.coProductionPartner,
      lineup: [],
      sound: { providerType: 'Por Definir' },
      schedule: {},
      reviewRounds: [],
      ticketTiers: [],
      croquisZones: [],
      timeline: [
        {
          id: 'tl-new-1',
          phaseNumber: 1,
          state: 'Borrador',
          phaseName: 'Armado del Evento',
          completedAt: this.nowStamp(),
          actorName: this.currentActorName(),
          summaryNote: 'Se creó el borrador del evento.'
        }
      ],
      evidenceMedia: []
    };

    this.commitEvents([created, ...this.events()]);
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
