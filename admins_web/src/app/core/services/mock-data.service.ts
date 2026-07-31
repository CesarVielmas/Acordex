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

const ACTIVE_DISQUERA_ID = 'acordex-records';

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
      state: 'Pago confirmado',
      paymentStatus: 'Pago Confirmado 100%',
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
    const list = this.storage.getItem<Quote[]>('acordex_quotes_v7', this.INITIAL_QUOTES);
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
