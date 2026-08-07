// Solo el tipo: `admin.models` reexporta este módulo, así que un import de
// valor cerraría un ciclo real. Con `import type` el ciclo se borra al compilar.
import type { Role } from './admin.models';

/**
 * Modelo de dominio de un evento público de Acordex.
 *
 * Un evento no es una cotización. La cotización es una contratación privada de
 * un cliente a un grupo; el evento es un espectáculo propio de la disquera que
 * se publica en cartelera y del que se venden boletos al público. Por eso tiene
 * su propio ciclo de vida, su propio protocolo de aprobación entre encargados y
 * su propio expediente de cierre.
 *
 * El ciclo de vida es intencionalmente estricto: cada estado bloquea más cosas
 * que el anterior. Un error de precio en 'Borrador' se corrige escribiendo
 * encima; el mismo error en 'En Venta' ya tiene clientes con asiento asignado y
 * obliga a reembolsar. Todo lo que aquí se modela existe para que el error se
 * detecte antes de esa frontera.
 */

// ─── Ciclo de vida ────────────────────────────────────────────────────────────

export type EventState =
  /** Se está armando. La información puede estar incompleta. */
  | 'Borrador'
  /** Enviado a los encargados de los grupos incluidos para que aprueben. */
  | 'En Revisión'
  /** Aprobado y agendado para publicarse automáticamente en una fecha. */
  | 'Próximo a Publicar'
  /** Visible en la cartelera pública, con boletos disponibles y sin ventas aún. */
  | 'Publicado'
  /** Ya hay al menos un boleto vendido. A partir de aquí cancelar cuesta dinero. */
  | 'En Venta'
  /** El evento ya ocurrió; se capturan los datos finales. */
  | 'Finalizada'
  /** Expediente sellado. Solo lectura y trazabilidad. */
  | 'Cerrado'
  /** Excepcional: cancelado en cualquier punto del ciclo. */
  | 'Cancelado';

/**
 * Estado del modelo anterior, cuando el evento solo tenía cuatro etiquetas sin
 * flujo detrás. Se conserva únicamente para migrar lo que quedó en
 * localStorage; ninguna pantalla debe leerlo.
 */
export type LegacyEventStatus = 'Publicado' | 'Borrador' | 'Próximo' | 'Pasado';

// ─── Cartelera pública ────────────────────────────────────────────────────────

/**
 * Categoría con la que el evento se anuncia al público. Es la etiqueta que el
 * portal del cliente pinta sobre la portada y usa para agrupar la cartelera.
 */
export type EventCategory =
  | 'Concierto'
  | 'Festival'
  | 'Baile'
  | 'Palenque'
  | 'Firma de Autógrafos'
  | 'Rueda de Prensa';

/** Video de saludo o invitación que un grupo graba para el evento. */
export interface EventInvitationVideo {
  id: string;
  title: string;
  url: string;
  /** `local` es un MP4 subido; `youtube` es una URL de inserción. */
  type: 'local' | 'youtube';
}

/** Una regla del apartado "Reglas e Información Adicional" del portal. */
export interface EventRule {
  id: string;
  text: string;
}

/**
 * Todo lo que el portal del cliente muestra de un evento y que no se puede
 * deducir de la operación interna.
 *
 * Existe como bloque aparte a propósito: la ficha pública
 * (`/events/comprar-boletos?id=…`) pide datos que a la disquera no le sirven
 * para producir el evento —una portada panorámica, un cartel vertical para la
 * lupa, un texto largo de presentación, el teléfono de compra— y sin ellos la
 * página del cliente sale incompleta aunque internamente todo esté listo. Al
 * tenerlos juntos, el checklist del borrador puede exigirlos como un grupo.
 */
/**
 * Video de saludo que graba un grupo del cartel para invitar al público.
 * En la ficha pública salen bajo "Saludos y Mensajes de los Artistas".
 */
export interface ArtistGreetingVideo {
  id: string;
  /** Grupo que graba el saludo; se muestra sobre el título del video. */
  bandName: string;
  title: string;
  url: string;
  /**
   * 'local' es un MP4 subido a la plataforma y 'youtube' un enlace incrustado.
   * El reproductor del cliente es distinto en cada caso, así que el tipo tiene
   * que viajar con el dato y no adivinarse desde la URL.
   */
  type: 'local' | 'youtube';
}

export interface EventPublicProfile {
  /** Portada panorámica del encabezado de la ficha pública. */
  coverUrl: string;
  /**
   * Cartel oficial vertical (3:4), el que se amplía con la lupa. Es la única
   * otra imagen que ve el público: la ficha muestra portada y cartel, nada más.
   */
  posterUrl: string;
  /** Saludos en video de los grupos del cartel. */
  greetingVideos: ArtistGreetingVideo[];
  /**
   * Cuántos días antes del evento deja de venderse el boletaje. Se guarda
   * relativo y no como fecha fija para que mover la fecha del evento no deje
   * un cierre de venta incoherente detrás.
   */
  salesCloseDaysBefore?: number;
  category: EventCategory;
  /** Frase corta bajo el título, en la portada. */
  tagline: string;
  /** Texto largo del bloque "Información del Evento". */
  about: string;
  /** Reglas y avisos que se listan al pie de la ficha. */
  rules: EventRule[];
  /** Restricción de edad tal como se le comunica al público. */
  minimumAge?: string;
  /** Cargo por servicio que la taquilla suma a cada asiento. */
  serviceFeePerSeat?: number;
  /** Teléfono de compra y soporte que aparece en la ficha. */
  supportPhone?: string;
  supportWhatsApp?: string;
  /** Texto con el que se busca el recinto en el mapa; por defecto, el recinto. */
  mapsQuery?: string;
  /** Sello de garantía mostrado en la ficha (ej. "Acordex VIP"). */
  guaranteeLabel?: string;
}

export function emptyPublicProfile(): EventPublicProfile {
  return {
    coverUrl: '',
    posterUrl: '',
    greetingVideos: [],
    salesCloseDaysBefore: 1,
    category: 'Concierto',
    tagline: '',
    about: '',
    rules: [],
    serviceFeePerSeat: 45,
    guaranteeLabel: 'Acordex VIP'
  };
}

// ─── Boletaje y croquis ───────────────────────────────────────────────────────

export interface TicketTier {
  id?: string;
  name: string;
  price: number;
  totalSeats: number;
  soldSeats: number;
  color: string;
  /** Zona del croquis a la que pertenece esta categoría de boleto. */
  zoneId?: string;
  /** Boletos apartados que no salen a la venta (prensa, cortesías, invitados). */
  heldSeats?: number;
  saleStartsAt?: string;
  saleEndsAt?: string;
  isActive?: boolean;
  /** Qué incluye la categoría; el portal lo muestra bajo el precio. */
  description?: string;
  /** Ícono de Material Symbols con el que el portal pinta la categoría. */
  icon?: string;
  /**
   * Filas que ocupa esta categoría en el mapa de asientos ('A', 'B', 'C'...).
   * El selector de asientos del cliente genera la butaquería con estas filas y
   * `seatsPerRow`: sin ellas, la categoría no se puede sentar.
   */
  rowLabels?: string[];
  seatsPerRow?: number;
}

export interface CroquisZone {
  id: string;
  name: string;
  capacity: number;
  occupancyPercent: number;
  color: string;
  /** Numerada obliga a elegir asiento; general es entrada libre dentro de la zona. */
  seatingType?: 'Numerada' | 'General' | 'De Pie';
  rows?: number;
  seatsPerRow?: number;
  accessNotes?: string;
}

export interface EventEvidence {
  id: string;
  type: 'photo' | 'video';
  url: string;
  caption: string;
  uploaderName: string;
  uploaderRole: Role;
  uploadedAt: string;
  /** Momento del evento al que corresponde la evidencia. */
  stage?: 'Montaje' | 'Prueba de Sonido' | 'Show' | 'Desmontaje' | 'Otro';
}

// ─── Cartel: grupos, orden de entradas y costos ───────────────────────────────

export type LineupApprovalStatus = 'No Requiere' | 'Pendiente' | 'Aprobado' | 'Rechazado';

/**
 * Contraoferta que el organizador manda al dueño de un grupo externo.
 *
 * El dueño publicó una tarifa; el organizador puede proponer otra cifra y el
 * dueño decide. Mientras la contraoferta esté `Pendiente`, el costo que manda
 * sigue siendo el publicado: una propuesta no es un acuerdo.
 */
export interface EventCounterOffer {
  /** Importe propuesto por el organizador, ya por el total de horas. */
  amount: number;
  /** Horas sobre las que se hizo la propuesta. */
  hours?: number;
  note?: string;
  proposedBy: string;
  proposedAt: string;
  status: 'Pendiente' | 'Aceptada' | 'Rechazada';
}

/** Un concepto del costo que cobra un grupo, desglosado por el dueño del grupo. */
export interface EventCostItem {
  id: string;
  concept: string;
  category: 'Honorarios' | 'Viáticos' | 'Transporte' | 'Hospedaje' | 'Alimentos' | 'Otro';
  amount: number;
  notes?: string;
}

/**
 * Un grupo dentro del cartel, con su lugar en el orden de entradas, sus horas y
 * el costo que propuso su dueño.
 *
 * `isExternal` es el campo que dispara todo el protocolo de revisión: cuando el
 * grupo no está bajo el mando de quien arma el evento, su encargado tiene que
 * aprobar la fecha, el horario y el costo antes de que el evento pueda
 * publicarse.
 */
export interface EventLineupSlot {
  id: string;
  groupId: string;
  groupName: string;
  imageUrl?: string;

  // --- Lo que el portal del cliente muestra de este grupo en el line-up ---
  /** Género con el que se anuncia al grupo en la ficha pública. */
  genre?: string;
  /** Calificación pública del grupo (0-5). */
  rating?: number;
  /** Slug del perfil público, para enlazar a `/grupo/:slug`. */
  profileSlug?: string;
  /** Videos de saludo o invitación que el grupo grabó para este evento. */
  invitationVideos?: EventInvitationVideo[];

  /** True si el grupo pertenece a otro encargado y por lo tanto requiere su visto bueno. */
  isExternal: boolean;
  /** Encargado dueño del grupo (quien aprueba o rechaza en la fase de revisión). */
  managerName: string;
  managerEmail?: string;
  managerPhone?: string;
  /** Orden de entrada a tocar. 1 = abre el evento. */
  order: number;
  /** Cabeza de cartel; se muestra como grupo principal en la cartelera. */
  isHeadliner?: boolean;
  /** Hora de inicio de su tanda, en formato 24h ('20:30'). */
  setStartTime?: string;
  setEndTime?: string;
  durationMinutes?: number;
  /** Hora en la que el grupo debe estar en el recinto. */
  arrivalTime?: string;
  /** Su turno de prueba de sonido. */
  soundCheckTime?: string;
  /**
   * Tarifa que el dueño del grupo tiene publicada, congelada al momento de
   * agregarlo al cartel. Se guarda en el slot y no se lee del catálogo para que
   * un cambio de tarifa posterior no altere un evento ya armado.
   */
  publishedFee?: number;
  /** Horas que cubre `publishedFee`; por debajo de esto no se cobra menos. */
  minimumHours?: number;
  /** Horas de show contratadas para este evento. */
  contractedHours?: number;
  /**
   * Contraoferta enviada al dueño del grupo. Solo aplica a grupos externos:
   * los propios no se negocian, se les asigna presupuesto y ya.
   */
  counterOffer?: EventCounterOffer;
  /** Desglose del costo propuesto por el dueño del grupo. */
  costItems: EventCostItem[];
  /** Quién propuso ese costo. */
  costProposedBy?: string;
  /** Total pactado tras la revisión; mientras no exista, manda la suma del desglose. */
  agreedTotal?: number;
  approval: LineupApprovalStatus;
  notes?: string;
}

// ─── Acuerdos entre managers ──────────────────────────────────────────────────

/**
 * Cómo cobra un manager su parte del evento.
 *
 * - `porcentaje`: se lleva un % de las ganancias totales. La plataforma lo
 *   liquida sola al cerrar el evento, porque el total ya se conoce.
 * - `fijo`: cobra un monto pactado de antemano. Se liquida a mano al cierre,
 *   ya que no depende de cómo haya salido la taquilla.
 *
 * Se puede mezclar: un manager por porcentaje y otro por monto fijo en el mismo
 * evento es un caso válido, no un error de captura.
 */
export type EventSettlementKind = 'porcentaje' | 'fijo';

export type EventAgreementStatus = 'Aceptado' | 'Pendiente' | 'Rechazado';

/**
 * Manager que co-organiza el evento.
 *
 * Un co-organizador ayuda a armar el evento (precios, horarios, cartel), pero
 * los costos de SUS grupos no son visibles para los demás: lo único que se
 * comparte entre managers es la ganancia total del evento. El desglose de quién
 * paga qué lo calcula la plataforma por detrás y no se expone en el expediente.
 */
export interface EventManagerAgreement {
  id: string;
  managerName: string;
  /** Quién creó el evento manda; el resto entra invitado. */
  role: 'organizador' | 'coorganizador';
  settlementKind: EventSettlementKind;
  /** Solo con `porcentaje`: parte de las ganancias totales. */
  percent?: number;
  /** Solo con `fijo`: monto pactado, liquidado manualmente al cierre. */
  fixedAmount?: number;
  status: EventAgreementStatus;
  invitedAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  notes?: string;
}

// ─── Producción: sonido y horarios generales ──────────────────────────────────

export type SoundProviderType =
  | 'Por Definir'
  | 'Equipo Propio de un Grupo'
  | 'Proveedor Externo'
  | 'Equipo del Recinto';

export interface RiderCheckItem {
  id: string;
  label: string;
  done: boolean;
  responsible?: string;
}

/** Qué equipo de audio lleva el evento y quién responde por él. */
export interface EventSoundSetup {
  providerType: SoundProviderType;
  providerName?: string;
  engineerName?: string;
  engineerPhone?: string;
  consoleModel?: string;
  speakersSetup?: string;
  monitorsSetup?: string;
  /** Hora de descarga y montaje del equipo. */
  loadInTime?: string;
  soundCheckStart?: string;
  soundCheckEnd?: string;
  cost?: number;
  riderChecklist?: RiderCheckItem[];
  notes?: string;
}

/** Corrida general del día del evento. */
export interface EventSchedule {
  /** Llamado de staff y producción. */
  crewCallAt?: string;
  loadInAt?: string;
  soundCheckAt?: string;
  doorsOpenAt?: string;
  showStartAt?: string;
  /** Hora límite de cierre marcada por el recinto o la autoridad. */
  curfewAt?: string;
  notes?: string;
}

// ─── Protocolo de revisión entre encargados ───────────────────────────────────

export interface EventApproval {
  id: string;
  groupId: string;
  groupName: string;
  managerName: string;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  respondedAt?: string;
  /** Obligatorio cuando rechaza: por qué no aprueba. */
  reason?: string;
  /** Qué pide que se cambie para poder aprobar. */
  requestedChanges?: string[];
}

/**
 * Una vuelta completa de revisión. Cada vez que el evento se reenvía tras un
 * rechazo se abre una ronda nueva, para que quede el rastro de qué se pidió y
 * qué se corrigió.
 */
export interface EventReviewRound {
  round: number;
  sentAt: string;
  sentBy: string;
  note?: string;
  approvals: EventApproval[];
  closedAt?: string;
  outcome?: 'Aprobada' | 'Con Cambios Solicitados';
}

// ─── Publicación ──────────────────────────────────────────────────────────────

export interface EventPublication {
  /** Fecha y hora en que se publicará solo ('Próximo a Publicar'). */
  scheduledAt?: string;
  publishedAt?: string;
  publishedBy?: string;
  publicUrl?: string;
  channels?: ('Cartelera Acordex' | 'Redes Sociales' | 'Taquilla Física' | 'Prensa')[];
  /** Quién autorizó cruzar el punto de no retorno. */
  authorizedBy?: string;
}

// ─── Venta de boletos ─────────────────────────────────────────────────────────

export interface EventDailySale {
  date: string;
  dayLabel: string;
  tickets: number;
  revenue: number;
}

export interface EventSalesSnapshot {
  firstSaleAt?: string;
  lastSaleAt?: string;
  ordersCount: number;
  ticketsSold: number;
  grossRevenue: number;
  refundsCount?: number;
  refundedAmount?: number;
  dailySales?: EventDailySale[];
}

// ─── Cierre del evento ────────────────────────────────────────────────────────

export interface EventExpense {
  id: string;
  concept: string;
  category: 'Sonido' | 'Recinto' | 'Staff' | 'Publicidad' | 'Logística' | 'Seguridad' | 'Otro';
  amount: number;
  notes?: string;
}

/** Lo que se le termina pagando a cada grupo del cartel. */
export interface EventPayout {
  groupId: string;
  groupName: string;
  agreedTotal: number;
  paidAmount: number;
  status: 'Pendiente' | 'Parcial' | 'Pagado';
  paidAt?: string;
  receiptReference?: string;
  notes?: string;
}

/**
 * Datos finales del evento. Se capturan en 'Finalizada' y quedan congelados al
 * pasar a 'Cerrado'.
 */
export interface EventClosureReport {
  attendance?: number;
  ticketsSold?: number;
  grossRevenue?: number;
  expenses: EventExpense[];
  payouts: EventPayout[];
  mediaUploadedCount?: number;
  incidents?: string[];
  summary?: string;
  closedAt?: string;
  closedBy?: string;
  /** Sellado inmutable: ya no admite ninguna edición. */
  isSealed?: boolean;
  sealedAt?: string;
  sealedBy?: string;
}

// ─── Trazabilidad ─────────────────────────────────────────────────────────────

export interface EventTimelineStep {
  id: string;
  phaseNumber: number;
  state: EventState;
  phaseName: string;
  completedAt: string;
  actorName: string;
  summaryNote: string;
  snapshot?: {
    lineupCount?: number;
    approvalsCount?: number;
    ticketsSold?: number;
    grossRevenue?: number;
    totalCapacity?: number;
    lineupCost?: number;
  };
}

// ─── Cancelación ──────────────────────────────────────────────────────────────

export interface EventCancellation {
  reason: string;
  at: string;
  by: string;
  /** Estado en el que se encontraba el evento al cancelarse. */
  cancelledFromState: EventState;
  refundsIssued?: number;
  refundedAmount?: number;
  clientMessage?: string;
}

// ─── Evento ───────────────────────────────────────────────────────────────────

export interface EventItem {
  id: string;
  title: string;
  /** Fecha del evento en ISO corto ('2026-08-15'). */
  date: string;
  location: string;
  venue: string;
  venueAddress?: string;
  /**
   * Cabeza de cartel. Es un dato derivado del `lineup`, pero se guarda porque
   * el dashboard, la cartelera pública y las tarjetas lo muestran sin abrir el
   * expediente.
   */
  groupName: string;
  artistName?: string;
  disqueraId: string;
  state: EventState;
  /**
   * Imagen de la tarjeta en el panel administrativo. La portada y el cartel
   * que ve el público viven en `publicProfile`, que es lo que consume el portal.
   */
  flyerUrl: string;
  description?: string;

  /**
   * Ficha pública del evento. Es opcional en el tipo porque los borradores
   * nacen sin ella, pero el checklist la exige completa antes de publicar:
   * publicar sin esto deja la página del cliente a medias.
   */
  publicProfile?: EventPublicProfile;

  createdBy: string;
  createdAt: string;
  /** Encargado responsable del evento (quien lo arma y lo envía a revisión). */
  ownerManagerName?: string;

  /** Aforo total del recinto; el vendible sale de las zonas y categorías. */
  capacity?: number;

  ticketTiers: TicketTier[];
  croquisZones: CroquisZone[];
  lineup: EventLineupSlot[];
  sound: EventSoundSetup;
  schedule: EventSchedule;

  reviewRounds: EventReviewRound[];
  publication?: EventPublication;
  sales?: EventSalesSnapshot;
  closure?: EventClosureReport;
  cancellation?: EventCancellation;

  timeline: EventTimelineStep[];
  evidenceMedia: EventEvidence[];

  /**
   * Co-producción con otra disquera. Es distinto de un grupo externo en el
   * cartel: aquí se comparte la utilidad del evento completo.
   */
  isCoProduction: boolean;
  coProductionPartner?: string;
  coProductionSplitPercent?: number;

  /**
   * Managers que arman el evento entre varios y cómo cobra cada uno. Opcional:
   * un evento de un solo manager no necesita acuerdos y no debe obligar a
   * capturarlos.
   */
  managerAgreements?: EventManagerAgreement[];
}

/**
 * Lo mínimo para dar de alta un evento. Todo lo demás se captura después en el
 * expediente: un evento nace en 'Borrador' precisamente porque todavía no
 * tiene cartel, producción ni boletaje.
 */
export interface NewEventDraft {
  title: string;
  date: string;
  location: string;
  venue: string;
  venueAddress?: string;
  groupName?: string;
  flyerUrl?: string;
  description?: string;
  capacity?: number;
  isCoProduction?: boolean;
  coProductionPartner?: string;
}
