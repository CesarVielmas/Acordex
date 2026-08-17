import type {
  ActorRef,
  EventActivity,
  EventCancellation,
  EventEvidence,
  EventLineupSlot,
  EventManagerAgreement,
  EventPostponement,
  EventProductionItem,
  EventProductionResponsibility,
  EventPublicProfile,
  EventTask
} from './event.models';

/**
 * Firmas de autógrafos y ruedas de prensa.
 *
 * Un evento de prensa **es** un evento: tiene fecha, recinto, un grupo que se
 * presenta, gastos, responsables y un ciclo que va de "lo estoy armando" a "ya
 * ocurrió y hay que cerrar". Por eso reusa casi toda la maquinaria de Eventos —la
 * ficha pública, el cartel, el desglose de producción, las tareas obligatorias y
 * la bitácora son literalmente los mismos tipos—.
 *
 * Lo que lo cambia todo son tres diferencias:
 *
 *   1. **No hay ingresos.** No se venden boletos, no hay taquilla, no hay croquis
 *      ni aforo de pago. Solo se lleva control de gasto, y al cerrar no se compara
 *      ingreso contra costo sino gasto contra cobertura.
 *   2. **En lugar de compradores hay acreditados.** Los medios y creadores piden
 *      entrar y el panel decide quién sí y quién no. Esa aprobación es la
 *      operación central del apartado, no una pestaña más.
 *   3. **Casi siempre es de una sola disquera.** La colaboración entre managers
 *      funciona igual que en Eventos, pero es la excepción: la interfaz del caso
 *      normal no debe hablar de reparto cuando no hay con quién repartir.
 */

// ─── Ciclo de vida ────────────────────────────────────────────────────────────

export type PressState =
  /** Se está armando. Nadie fuera del equipo lo ha visto. */
  | 'Borrador'
  /** Se completa lo que falte y se resuelven las solicitudes pendientes. */
  | 'En Revisión'
  /** Visible en el portal y con la acreditación abierta. */
  | 'Convocado'
  /** Ya ocurrió: se captura asistencia real, fotografías y gasto final. */
  | 'Realizado'
  /** Expediente sellado. Solo consulta y trazabilidad. */
  | 'Cerrado'
  /** Cambió de fecha; las acreditaciones siguen siendo válidas. */
  | 'Pospuesto'
  /** No se hace. Sin reembolsos —no hubo cobro— pero sí explicación. */
  | 'Cancelado';

/**
 * Qué clase de evento de prensa es.
 *
 * No es una etiqueta decorativa: decide qué puntos del checklist son
 * obligatorios. Una firma necesita control de fila y reglas de acceso para fans;
 * una rueda necesita templete, vocero y kit de prensa. Exigir lo de una en la
 * otra llena el expediente de pendientes que nadie va a cumplir porque no
 * aplican.
 */
export type PressEventType = 'Firma de Autógrafos' | 'Rueda de Prensa';

// ─── Acreditaciones ───────────────────────────────────────────────────────────

/**
 * Los tres estados que el portal del cliente ya sabe pintar. Deliberadamente no
 * hay un cuarto para "revocada": el solicitante tiene una sola pantalla de
 * rechazo con motivo, y una revocación es exactamente eso desde su lado. Lo que
 * la distingue por dentro vive en `revocation`.
 */
export type AccreditationStatus = 'pending' | 'approved' | 'rejected';

export type AccreditationKind = 'media' | 'independent';

/**
 * Tipos de cobertura tal como los ofrece el formulario del portal. La lista está
 * cerrada porque es la que el cliente elige y la que sale impresa en el gafete.
 */
export type CoverageType =
  | 'Prensa Escrita'
  | 'Televisión / Video'
  | 'Prensa Digital / Creador'
  | 'Fotografía Oficial';

export const COVERAGE_TYPES: readonly CoverageType[] = [
  'Prensa Escrita',
  'Televisión / Video',
  'Prensa Digital / Creador',
  'Fotografía Oficial'
];

/** Cómo se lee cada tipo de cobertura en el panel. */
export const COVERAGE_LABELS: Record<CoverageType, string> = {
  'Prensa Escrita': 'Prensa Escrita / Diario',
  'Televisión / Video': 'Televisión / Video',
  'Prensa Digital / Creador': 'Creador Digital / Web',
  'Fotografía Oficial': 'Fotografía'
};

/**
 * Se aprobó y después se le retiró el gafete.
 *
 * Es distinto de borrar la solicitud, y por eso se guarda en vez de dejar solo
 * el estado: borrar hace desaparecer a alguien que ya tenía pase confirmado y
 * que muy probablemente ya apartó su agenda, y al día del evento nadie puede
 * explicar por qué llegó con un gafete que el sistema no reconoce.
 */
export interface AccreditationRevocation {
  at: string;
  by: ActorRef;
  reason: string;
  /** El gafete que traía. Sirve para reconocerlo si se presenta en la puerta. */
  badgeId?: string;
}

/**
 * Una solicitud de cobertura, tal como llega del portal y como la resuelve el
 * panel.
 *
 * Los campos hasta `status`/`rejectionReason` son el contrato que el portal ya
 * consume (`PressAccreditation` en `clients_web`). Lo demás es lo que el panel
 * añade para poder decidir y para poder operar la puerta el día del evento.
 */
export interface PressAccreditationRequest {
  id: string;
  eventId: string;
  applicantType: AccreditationKind;
  /** Vacío o "Creador Independiente" cuando es un creador. */
  mediumName: string;
  journalistName: string;
  email: string;
  phone?: string;
  /** Identificación con la que se presenta: credencial, INE, folio del medio. */
  cardId: string;
  accredType: CoverageType;
  /** Cuánta gente trae: reportero + camarógrafo + fotógrafo. */
  crewSize?: number;
  /** Equipo que va a meter; importa para el control de acceso. */
  equipmentNotes?: string;

  status: AccreditationStatus;
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: ActorRef;
  /** Obligatorio al rechazar: es lo que el portal le muestra al solicitante. */
  rejectionReason?: string;

  /** Se asigna al aprobar: es lo que sale impreso en el gafete. */
  badgeId?: string;
  /** Zonas a las que ese gafete da acceso. Vacío = todas las del evento. */
  zones?: string[];

  revocation?: AccreditationRevocation;

  /** Se marca el día del evento. Es lo que alimenta la cobertura real. */
  attended?: boolean;
  checkedInAt?: string;
  /** Notas del organizador sobre el solicitante, no visibles para él. */
  internalNotes?: string;
}

/** Una zona del recinto y qué permite hacer en ella. */
export interface PressZone {
  id: string;
  name: string;
  /** Qué da: "acceso a la mesa de firmas durante los primeros 10 minutos". */
  description?: string;
  /** Cuántos gafetes caben en la zona, si está limitada. */
  capacity?: number;
}

/**
 * Cómo se abre y se cierra el registro de prensa.
 *
 * `closesAt` no es un adorno: pasada esa fecha el panel deja de admitir altas
 * manuales y marca como tardías las solicitudes que lleguen después. Un cierre
 * de registro que solo pinta una frase es peor que no tenerlo, porque el
 * encargado cree que el trámite está cerrado y no lo está.
 */
export interface PressAccreditationConfig {
  opensAt?: string;
  closesAt?: string;
  /** Cuántos acreditados caben. Al llegar al tope se avisa, no se bloquea. */
  capacity?: number;
  zones: PressZone[];
  /** Kit de prensa que se le entrega al acreditado. */
  pressKitUrl?: string;
  pressKitName?: string;
  /** Texto de acceso impreso en el gafete de quien tiene todas las zonas. */
  allAccessLabel?: string;
  notes?: string;
}

export function emptyAccreditationConfig(): PressAccreditationConfig {
  return { zones: [], allAccessLabel: 'ALL ACCESS' };
}

// ─── Reglas de acceso que el portal pinta ─────────────────────────────────────

/**
 * Qué se puede hacer con las cámaras.
 *
 * El portal tiene una tarjeta de "Fotografías" bajo la descripción y hasta ahora
 * decía **Permitido** escrito a mano en la plantilla. Una firma donde el grupo no
 * quiere fotos y una donde sí se veían idénticas para el que iba a asistir.
 */
export type PhotoPolicy = 'Permitido' | 'Sin flash' | 'Solo prensa acreditada' | 'No permitido';

/**
 * Quién puede entrar además de la prensa.
 *
 * La otra tarjeta fija del portal: decía **Solo Acreditados** siempre. En una
 * firma de autógrafos eso es justo lo contrario de lo normal —los fans son el
 * evento— y el dato es el que decide si hay fila que controlar.
 */
export type FanAccessPolicy =
  | 'Solo Acreditados'
  | 'Entrada Libre'
  | 'Con Boleto del Concierto'
  | 'Con Registro Previo';

// ─── Compromiso del talento ───────────────────────────────────────────────────

/**
 * Lo que **un grupo concreto** se compromete a dar en este evento.
 *
 * Va por grupo y no en un solo bloque para todo el evento, que es como estaba y
 * era una simplificación falsa: a una rueda de prensa vienen dos o tres grupos y
 * cada uno llega a su hora, manda a su propio vocero y tiene sus propios temas
 * que no va a tocar. Un único «hora de llegada» para todos obliga a elegir la de
 * alguien y a apuntar las otras dos en una nota que nadie lee.
 */
export interface PressGroupCommitment {
  /** El grupo del `lineup` al que pertenece este compromiso. */
  slotId: string;
  groupId: string;
  groupName: string;
  /** Hora a la que **este** grupo debe estar en el recinto. */
  arrivalTime?: string;
  /** Hora a la que se retira, si tiene otro compromiso después. */
  departureTime?: string;
  /** Quién habla por él. Sin vocero designado contesta quien se anime. */
  spokespersonName?: string;
  spokespersonRole?: string;
  /** Minutos que se compromete a dar de atención a prensa o de firma. */
  committedMinutes?: number;
  /** Su «no preguntar por». Cada grupo trae el suyo. */
  bannedTopics: string[];
  notes?: string;
}

export function emptyCommitment(slotId: string, groupId: string, groupName: string): PressGroupCommitment {
  return { slotId, groupId, groupName, bannedTopics: [] };
}

// ─── Convocatoria y cierre ────────────────────────────────────────────────────

export interface PressConvocation {
  /** Fecha y hora en que el evento sale solo al portal. */
  scheduledAt?: string;
  convokedAt?: string;
  convokedBy?: string;
  publicUrl?: string;
  /** Quién autorizó abrir la acreditación al público. */
  authorizedBy?: string;
  /**
   * Por qué la convocatoria programada no pudo salir cuando le tocaba.
   *
   * Existe para que el fallo se vea. Una transición automática que se salta su
   * turno en silencio deja el expediente diciendo "programado" para siempre, y
   * el encargado no tiene ningún motivo para volver a mirarlo.
   */
  blockedReason?: string;
  blockedAt?: string;
}

/**
 * Cómo salió el evento.
 *
 * Aquí no se compara ingreso contra costo —no hubo ingreso— sino gasto contra
 * impacto: cuánto costó y cuánta cobertura salió. La cifra que de verdad importa
 * es la diferencia entre acreditados y asistentes.
 */
export interface PressClosureReport {
  /** Medios que de verdad se presentaron; se cuenta de los check-in. */
  attendedCount?: number;
  /** Notas, reportajes o videos publicados tras el evento. */
  publishedPieces?: number;
  /** Alcance estimado de esa cobertura, en personas. */
  estimatedReach?: number;
  photosUploaded?: number;
  /** Gasto real, contra el estimado del desglose de producción. */
  finalSpend?: number;
  incidents?: string[];
  summary?: string;
  closedAt?: string;
  closedBy?: string;
  isSealed?: boolean;
  sealedAt?: string;
  sealedBy?: string;
}

// ─── Trazabilidad ─────────────────────────────────────────────────────────────

export interface PressTimelineStep {
  id: string;
  phaseNumber: number;
  state: PressState;
  phaseName: string;
  completedAt: string;
  actorName: string;
  summaryNote: string;
  snapshot?: {
    requestsCount?: number;
    approvedCount?: number;
    attendedCount?: number;
    spend?: number;
  };
}

// ─── Expediente ───────────────────────────────────────────────────────────────

export interface PressEventItem {
  id: string;
  /**
   * Discriminante del expediente. Es lo que hace que la maquinaria compartida
   * —tareas, intervenciones, propuestas— sepa qué checklist medir sin que Prensa
   * tenga que duplicarla.
   */
  kind: 'prensa';
  title: string;
  pressType: PressEventType;
  /** Fecha del evento en ISO corto ('2026-08-15'). */
  date: string;
  /** Hora de inicio en 24h ('16:00'). El portal la muestra en la portada. */
  startTime?: string;
  /** Hora a la que se cierra el acceso. */
  endTime?: string;

  /**
   * Las dos tarjetas que el portal pinta bajo la descripción y que hasta ahora
   * estaban escritas a mano en la plantilla del cliente. Se capturan aquí porque
   * son lo primero que mira quien decide si va: si puede llevar cámara y si
   * puede entrar sin ser prensa.
   */
  photoPolicy?: PhotoPolicy;
  fanAccess?: FanAccessPolicy;
  /** Cuántos fans caben, cuando el acceso no es solo para prensa. */
  fanCapacity?: number;
  /** Ciudad y estado. */
  location: string;
  venue: string;
  venueAddress?: string;
  /** Cabeza del evento; derivado del `lineup` pero guardado para las tarjetas. */
  groupName: string;
  disqueraId: string;
  state: PressState;
  /** Imagen de la tarjeta en el panel. La fotografía oficial vive en la ficha. */
  flyerUrl: string;
  description?: string;

  /**
   * Ficha pública. Es el mismo tipo que el de un evento con boletaje a
   * propósito: el portal lee los mismos campos (portada, textos, saludos en
   * video, teléfono y WhatsApp de dudas, mapa) y duplicar el tipo solo
   * garantizaba que uno de los dos se quedara atrás. Los campos de taquilla
   * —cargo por servicio, cierre de venta— simplemente no se piden aquí.
   */
  publicProfile?: EventPublicProfile;

  createdBy: string;
  createdAt: string;
  /** Encargado responsable: quien lo arma y el único que puede cancelarlo. */
  ownerManagerName?: string;

  /** Grupos que se presentan, con su ficha pública y su enlace al perfil. */
  lineup: EventLineupSlot[];

  accreditation: PressAccreditationConfig;
  accreditationRequests: PressAccreditationRequest[];

  /**
   * Lo que se compromete cada grupo que viene, uno por uno.
   */
  talentCommitments: PressGroupCommitment[];

  /**
   * Desglose de gasto: **el corazón del expediente**.
   *
   * Todo lo que se monta vive aquí y no en campos sueltos —el sonido, el
   * templete, el backdrop, el control de fila, la seguridad, el café—. Tenerlo
   * partido en dos sitios era el error: los mismos conceptos se capturaban una
   * vez como «datos del montaje» y otra como partidas, y ninguna de las dos
   * versiones era la buena. Aquí no entra dinero, así que este desglose es el
   * único número del expediente y es lo que después se compara con la cobertura.
   */
  productionItems?: EventProductionItem[];
  productionResponsibilities?: EventProductionResponsibility[];

  /** Solo cuando de verdad hay más de una disquera involucrada. */
  managerAgreements?: EventManagerAgreement[];

  convocation?: PressConvocation;
  closure?: PressClosureReport;
  cancellation?: EventCancellation;
  activePostponement?: EventPostponement;
  postponementHistory?: EventPostponement[];

  timeline: PressTimelineStep[];
  activity?: EventActivity[];
  tasks?: EventTask[];
  /** Fotografías del evento: galería del portal y evidencia del cierre. */
  evidenceMedia: EventEvidence[];
}

/**
 * Lo mínimo para dar de alta una firma o rueda de prensa. Todo lo demás se
 * captura en el expediente: nace en 'Borrador' precisamente porque todavía no
 * tiene ficha pública, montaje ni acreditación.
 */
export interface NewPressDraft {
  title: string;
  pressType: PressEventType;
  date: string;
  startTime?: string;
  location: string;
  venue: string;
  venueAddress?: string;
  groupName?: string;
  flyerUrl?: string;
  description?: string;
  capacity?: number;
}
