// Solo el tipo: `admin.models` reexporta este módulo, así que un import de
// valor cerraría un ciclo real. Con `import type` el ciclo se borra al compilar.
import type { Role } from './admin.models';
import type { CroquisPlan } from './croquis.models';
import type { ActorRef, OrgRank } from './org.models';

export type { ActorRef, OrgRank };

export type {
  CroquisPlan,
  CroquisArea,
  CroquisRow,
  CroquisSeat,
  CroquisElement,
  CroquisElementKind
} from './croquis.models';

// ─── Trazabilidad y Bitácora ──────────────────────────────────────────────────

export type ActivityChannel =
  | 'evento' | 'cartelera' | 'cartel' | 'produccion' | 'boletaje'
  | 'croquis' | 'acuerdos' | 'tareas' | 'revision'
  | 'venta' | 'cierre';

export type ActivityKind =
  | 'creacion' | 'edicion' | 'alta' | 'baja'
  | 'invitacion' | 'respuesta' | 'asignacion' | 'delegacion'
  | 'completada' | 'reapertura' | 'estado' | 'archivo';

export interface ActivityChange {
  /** Ruta técnica: 'publicProfile.tagline', 'ticketTiers[VIP].price'. */
  field: string;
  /** Cómo se llama para quien lo lee: 'Frase de portada'. */
  label: string;
  before?: string;
  after?: string;
}

export interface EventActivity {
  id: string;
  at: string;                // ISO con hora y minuto
  actor: ActorRef;
  channel: ActivityChannel;
  kind: ActivityKind;
  /** Frase ya redactada: "Subió el precio de VIP Oro de $1,800 a $2,200". */
  summary: string;
  changes?: ActivityChange[];
  /** A qué apunta: id de tarea, de acuerdo, de grupo. */
  targetId?: string;
  targetLabel?: string;
  /** Cuántos movimientos se agruparon en esta entrada. */
  mergedCount?: number;
}

// ─── Tareas del Evento ────────────────────────────────────────────────────────

export type CompletenessGroup = 'Identidad' | 'Cartelera Pública' | 'Cartel' | 'Producción' | 'Boletaje';

export type EventTaskKind = 'sistema' | 'externa';

/**
 * `sin-enviar` es la asignación decidida en el borrador que el otro manager
 * todavía no recibe: sale al enviar el evento a revisión, igual que las
 * invitaciones y las cotizaciones.
 */
export type EventTaskStatus =
  | 'abierta'       // existe, nadie la tiene
  | 'sin-enviar'    // asignada dentro del borrador
  | 'asignada'      // el manager ya la recibió
  | 'aceptada'      // se hizo cargo
  | 'completada'
  | 'rechazada'
  | 'pendiente-aprobacion'; // transferencia a otro manager pendiente de respuesta

export interface EventTaskTransfer {
  id: string;
  fromManager: string;
  toManager: string;
  reason: string;
  requestedAt: string;
  status: 'pendiente' | 'aceptada' | 'rechazada';
  respondedAt?: string;
  rejectionReason?: string;
}

/**
 * Un cambio que un manager ajeno propone sobre un dato obligatorio ya capturado.
 *
 * Existe porque el dato obligatorio tiene dueño. Cuando el encargado de un punto
 * ya lo llenó, que cualquier otro manager pueda sobrescribirlo de un teclazo
 * convierte el reparto de responsabilidades en un adorno: nadie responde por un
 * dato que cualquiera cambia sin avisar. Así que el cambio no se aplica, se
 * propone, y el encargado decide.
 *
 * La propuesta es por **campo** y no por punto del checklist. Un punto como
 * "identidad" cubre el nombre, la fecha, el aforo, el recinto, la ciudad y la
 * dirección; si un manager propone otro recinto y otro propone otra fecha no se
 * están contradiciendo, y colgarlas del punto obligaba a elegir entre dos cosas
 * que no compiten. Compiten las que tocan el mismo campo, y solo entre esas hay
 * que escoger una.
 */
export interface EventFieldProposal {
  id: string;
  /** Punto del checklist al que pertenece el campo tocado. */
  checklistItemId: string;
  /**
   * Qué campo se propone cambiar. Es la llave con la que se decide qué
   * propuestas compiten entre sí: dos sobre `venue` son excluyentes, una sobre
   * `venue` y otra sobre `date` no.
   */
  fieldKey: string;
  /** Nombre del campo tal como se lee en pantalla. */
  fieldLabel: string;

  /** El parche que se aplicaría al expediente si se acepta. */
  proposedChanges: Record<string, any>;
  /** El valor propuesto ya legible, para pintarlo sin volver a derivarlo. */
  proposedLabel: string;
  /** Lo que decía el campo cuando se propuso, para enseñar el antes y el después. */
  previousLabel: string;

  proposedBy: ActorRef;
  proposedAt: string;

  status: 'pendiente' | 'aceptada' | 'rechazada';
  respondedAt?: string;
  respondedBy?: ActorRef;
  rejectionReason?: string;
  /**
   * Se rechazó sola al aceptarse otra sobre el mismo campo. Se distingue del
   * rechazo a mano porque no es un juicio sobre esta propuesta: es la
   * consecuencia de haber elegido otra.
   */
  supersededBy?: string;
}

/** @deprecated Sustituida por `EventFieldProposal`; se lee para no perder lo guardado. */
export interface EventTaskChangeProposal {
  id: string;
  proposedBy: ActorRef;
  proposedAt: string;
  fieldLabel: string;
  proposedChanges: Record<string, any>;
  previousValues: Record<string, any>;
  status: 'pendiente' | 'aceptada' | 'rechazada';
  respondedAt?: string;
  rejectionReason?: string;
}

export interface EventTask {
  id: string;
  kind: EventTaskKind;
  title: string;
  detail?: string;

  /** Solo en 'sistema': el punto del checklist que la cierra. */
  checklistItemId?: string;
  group?: CompletenessGroup;

  /** A qué disquera se le encargó. La responsabilidad es suya. */
  assignedManager?: string;
  /** Quién la ejecuta dentro de esa disquera, si se delegó. */
  delegate?: { name: string; rank: OrgRank };

  status: EventTaskStatus;
  priority: 'Alta' | 'Media' | 'Baja';
  dueDate?: string;

  /**
   * Liga con el desglose de gastos, en los croquis viejos de una sola partida.
   *
   * La liga viva es la de enfrente: `EventProductionItem.taskId`. Una tarea como
   * "contratar el audio" casi nunca es un solo gasto —es la consola, las bocinas
   * y el operador— y con el apuntador de este lado solo cabía uno, así que el
   * segundo desglose no tenía dónde colgarse. Esto se queda para no perder las
   * tareas que ya se guardaron con una partida; `resolveTasks` las junta con las
   * que apuntan hacia acá y devuelve la lista completa.
   */
  productionItemId?: string;
  productionCategory?: string;
  /** Lo que se calculó que iba a costar, antes de contratar nada. */
  estimatedCost?: number;
  /** Se cuenta del desglose. Solo se guarda cuando no hay partidas que sumar. */
  finalCost?: number;

  /** Transferencia de tarea entre Managers pendiente de aprobación */
  pendingTransfer?: EventTaskTransfer;
  /**
   * Cambios que otros managers proponen sobre los datos de esta tarea.
   *
   * Viven aquí y no sueltas en el evento porque el que decide es el encargado
   * del punto, y el punto es la tarea. Se guardan las resueltas junto a las
   * pendientes: "se rechazó la propuesta de fulano" es exactamente el rastro que
   * hace falta cuando alguien pregunta por qué el dato dice lo que dice.
   */
  changeProposals?: EventFieldProposal[];
  /** @deprecated Propuesta única del modelo viejo; `resolveTasks` la migra. */
  pendingChangeProposal?: EventTaskChangeProposal;
  /** Historial de transferencias de la tarea */
  transferHistory?: EventTaskTransfer[];
  /** Referencia del campo/sección del formulario vinculado */
  formSectionRef?: string;

  createdBy: ActorRef;
  createdAt: string;
  assignedAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  completedBy?: ActorRef;
  /**
   * Manager ajeno que se metió a resolver este punto.
   *
   * Se sella al intervenir y no dice que la tarea esté hecha: la cierra el
   * checklist cuando el dato aparece. Es el rastro de que el encargado no fue
   * quien lo llenó, que es lo que hay que poder explicar después.
   */
  intervenedBy?: ActorRef;
  intervenedAt?: string;
  /** Obligatoria en las externas: es la única prueba de que se hizo. */
  completionNote?: string;
  rejectedReason?: string;
  /** True cuando la cerró el sistema al detectar el dato. */
  autoCompleted?: boolean;
}

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
  /** @deprecated Zona del modelo anterior; hoy el área del croquis apunta a la categoría. */
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
   * Retícula de butacas del modelo anterior: filas ('A', 'B', 'C'…) y butacas
   * por fila. Se conserva para leer expedientes viejos —de aquí sale el ancho
   * de fila al migrarlos a un croquis— pero ya no manda: la butaquería la define
   * el plano, butaca por butaca, y `totalSeats` se cuenta de ahí.
   *
   * @deprecated Usa `EventItem.croquisPlans`.
   */
  rowLabels?: string[];
  /** @deprecated Ver `rowLabels`. */
  seatsPerRow?: number;
}

/**
 * Zona del modelo anterior al editor de croquis.
 *
 * Describía el recinto con puros números —capacidad, filas, butacas por fila— y
 * eso deja fuera lo único que importa al comprar: dónde queda el lugar. Se
 * conserva porque hay expedientes capturados así; al abrirlos, `croquisPlans`
 * se genera a partir de estas zonas y a partir de ahí el plano es el que manda.
 *
 * @deprecated Usa `EventItem.croquisPlans`.
 */
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

/**
 * Estado de la solicitud que se le manda al dueño de un grupo ajeno.
 *
 * `Sin Enviar` es la clave del borrador: mientras el evento se está armando, el
 * grupo ya está en el cartel pero su dueño todavía no sabe nada. Pedirle una
 * cotización a alguien por un evento que quizá ni se arme sería quemar la
 * relación en cada intento; la solicitud sale una sola vez, al enviar el evento
 * a revisión.
 */
export type LineupApprovalStatus =
  | 'No Requiere'
  | 'Sin Enviar'
  | 'Pendiente'
  | 'Aprobado'
  | 'Rechazado';

/**
 * Por qué vía entra un grupo al cartel. Es una decisión del organizador, no algo
 * que se deduzca de quién es el dueño del grupo: el mismo grupo ajeno se puede
 * traer de las dos maneras y cada una implica cosas muy distintas.
 *
 * - `propio`: el grupo es del organizador. No hay nada que negociar.
 * - `cotizacion`: contratación directa. Se le paga al dueño del grupo una tarifa
 *   por unas horas y ahí termina su participación: no entra al evento, no ve
 *   boletaje ni ganancias y solo recibe lugar, hora de llegada, prueba de sonido
 *   y duración. Es lo que permite al organizador ganar sin exponer sus números.
 * - `coorganizacion`: el dueño del grupo entra al evento como co-organizador.
 *   Ve casi todo (boletaje, precios, avance de venta) menos lo que ganan los
 *   grupos del otro manager, y puede sugerir grupos — pero quien decide si
 *   entran sigue siendo el organizador.
 */
export type LineupEngagementKind = 'propio' | 'cotizacion' | 'coorganizacion';

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
  /**
   * `Sin Enviar` mientras el evento sigue en borrador: la contraoferta ya está
   * decidida pero el dueño del grupo no la ha recibido. Viaja junto con la
   * solicitud al enviar el evento a revisión.
   */
  status: 'Sin Enviar' | 'Pendiente' | 'Aceptada' | 'Rechazada';
  /** Cuándo salió de verdad hacia el dueño del grupo. */
  sentAt?: string;
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
  /**
   * Vía por la que entra el grupo. Se guarda explícitamente porque es una
   * elección del organizador: al mismo grupo ajeno se le puede pagar una
   * cotización directa o traerlo invitando a su manager a co-organizar, y de
   * quién sea el grupo no se puede deducir cuál de las dos eligió.
   */
  engagementKind?: LineupEngagementKind;
  /** Cuándo salió la solicitud al dueño del grupo (al enviar a revisión). */
  requestSentAt?: string;
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

/**
 * `Sin Enviar` es la invitación ya decidida dentro del borrador pero que el otro
 * manager todavía no ha recibido: sale al enviar el evento a revisión, igual que
 * las solicitudes de cotización directa.
 */
export type EventAgreementStatus = 'Sin Enviar' | 'Aceptado' | 'Pendiente' | 'Rechazado';

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

export interface GroupSoundCheck {
  id: string;
  groupId: string;
  groupName: string;
  arrivalDateTime?: string;
  startTime?: string;
  endTime?: string;
  departureTime?: string;
  notes?: string;
}

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

// ─── Desglose de gastos de producción ────────────────────────────────────────

/**
 * Rubros en los que se va el dinero de un evento, además del cartel.
 *
 * La lista sale de lo que de verdad se contrata para montar un baile, un
 * palenque o un concierto en México. Está cerrada a propósito: si cada evento
 * inventara sus propias etiquetas, comparar dos eventos —o saber en qué se va
 * siempre el dinero— sería imposible, que es justo para lo que existe este
 * desglose. Lo que no encaje va a 'Otros' con su concepto escrito.
 */
export type ProductionCategory =
  | 'Recinto'
  | 'Audio'
  | 'Iluminación'
  | 'Video y Pantallas'
  | 'Escenario y Estructuras'
  | 'Energía'
  | 'Backline'
  | 'Mobiliario'
  | 'Personal y Staff'
  | 'Seguridad'
  | 'Servicios Médicos'
  | 'Permisos y Licencias'
  | 'Seguros'
  | 'Limpieza y Sanitarios'
  | 'Transporte y Logística'
  | 'Hospitalidad'
  | 'Hospedaje'
  | 'Publicidad'
  | 'Boletaje'
  | 'Otros';

/**
 * En qué punto está una partida.
 *
 * Importa para leer el total: un evento con todo 'Estimado' tiene un presupuesto
 * de servilleta, y uno con todo 'Contratado' tiene un compromiso real. Sumar
 * ambos como si fueran lo mismo es lo que hace que un evento "salga caro de
 * repente".
 */
export type ProductionItemStatus = 'Estimado' | 'Cotizado' | 'Contratado' | 'Pagado';

/**
 * Estado de una tarea encargada a otro manager.
 *
 * Sigue la misma regla que el resto del expediente: lo que se decide en el
 * borrador no sale hasta que el evento se manda a revisión.
 */
export type ProductionAssignmentStatus = 'Sin Enviar' | 'Pendiente' | 'Aceptada' | 'Rechazada';

/**
 * Una partida del desglose de producción: una cosa que se paga, cuánto cuesta y
 * a quién se le paga.
 *
 * Todo el desglose es opcional. Existe para responder "¿en qué se nos fue el
 * dinero?" al cerrar el evento, no para obligar a nadie a capturar: un evento
 * puede publicarse con el desglose vacío y el checklist no lo exige.
 */
export interface EventProductionItem {
  id: string;
  category: ProductionCategory;
  concept: string;
  /** Detalle libre: modelo, especificación, alcance de lo contratado. */
  detail?: string;
  /** A quién se le paga. */
  supplier?: string;
  quantity?: number;
  /** 'pieza', 'jornada', 'día', 'servicio', 'persona'… */
  unit?: string;
  unitCost?: number;
  /** Importe total de la partida; manda sobre cantidad × unitario. */
  amount: number;
  status: ProductionItemStatus;
  /** Manager que se hace cargo de esta partida, si se repartió el trabajo. */
  assignedTo?: string;
  notes?: string;
  createdBy?: string;
  /**
   * La tarea opcional de la que salió este gasto.
   *
   * Es la liga que convierte "se gastaron 92,000 en audio" en "a Valentina se le
   * encargó el audio y esto es lo que contrató". Varias partidas pueden apuntar a
   * la misma tarea —la consola, las bocinas y el operador son tres gastos de un
   * solo encargo— y por eso la liga vive aquí y no del lado de la tarea: del otro
   * lado solo cabría una.
   */
  taskId?: string;
}

/**
 * Un rubro completo encargado a otro manager.
 *
 * Es el reparto de trabajo entre managers: "tú ves el sonido, yo veo el
 * recinto". El encargado puede aceptar o rechazar, y una vez que acepta puede
 * desglosar sus partidas o no hacerlo — muchas veces el acuerdo real se cierra
 * por teléfono y aquí solo interesa que quede constancia de quién respondía por
 * ese rubro y por cuánto.
 */
export interface EventProductionResponsibility {
  id: string;
  category: ProductionCategory;
  managerName: string;
  status: ProductionAssignmentStatus;
  /** Tope de gasto pactado para el rubro, si se pactó alguno. */
  budgetCap?: number;
  /** Qué se le está pidiendo exactamente. */
  brief?: string;
  assignedAt?: string;
  respondedAt?: string;
  /** Obligatorio al rechazar: por qué no se hace cargo. */
  reason?: string;
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

export interface EventManagerClosureConfirmation {
  managerName: string;
  confirmedAt: string;
  confirmedBy?: string;
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
  /** Confirmaciones de finiquito firmadas por cada manager co-organizador. */
  managerConfirmations?: EventManagerClosureConfirmation[];
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

// ─── Postergación del evento ──────────────────────────────────────────────────

export interface EventPostponement {
  id: string;
  previousDate: string;
  newDate: string;
  reason: string;
  clientNotice?: string;
  videoUrl?: string;
  flyerUrl?: string;
  postponedAt: string;
  postponedBy: string;
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

  /**
   * Croquis del evento, uno por zona física.
   *
   * Es la fuente de verdad del boletaje: los lugares a la venta de cada
   * categoría se cuentan del plano, no se capturan. Un evento con tres
   * escenarios simultáneos lleva tres croquis y el cliente cambia entre ellos.
   */
  croquisPlans?: CroquisPlan[];

  /** @deprecated Zonas del modelo anterior; se migran a `croquisPlans` al abrir. */
  croquisZones: CroquisZone[];

  lineup: EventLineupSlot[];
  sound: EventSoundSetup;
  soundChecks?: GroupSoundCheck[];
  schedule: EventSchedule;

  /**
   * Desglose de gastos de producción. Opcional a propósito: sirve para saber en
   * qué se fue el dinero, no para bloquear la publicación de un evento.
   */
  productionItems?: EventProductionItem[];
  /** Rubros de producción repartidos entre los managers del evento. */
  productionResponsibilities?: EventProductionResponsibility[];

  reviewRounds: EventReviewRound[];
  publication?: EventPublication;
  sales?: EventSalesSnapshot;
  closure?: EventClosureReport;
  cancellation?: EventCancellation;
  /** Información de postergación de fecha si el evento fue reprogramado. */
  activePostponement?: EventPostponement;
  postponementHistory?: EventPostponement[];

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

  /** Bitácora fina de trazabilidad del evento. */
  activity?: EventActivity[];

  /** Tareas y encargas del evento (sistema y externas). */
  tasks?: EventTask[];
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
