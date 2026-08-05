import { QuoteState } from './admin.models';

/**
 * Metadatos visuales y descriptivos de cada estado de cotización.
 *
 * Antes esta información vivía duplicada textualmente en seis `switch` dentro de
 * `quotes.component.ts` y otros seis dentro de `quote-detail-modal.component.ts`,
 * lo que provocó que ambas copias se desincronizaran (la del modal se quedó sin
 * los estados de imprevisto) y que la Vista Tabla terminara pintando todos los
 * estados del mismo color. Este módulo es ahora la única fuente de verdad:
 * agregar o quitar un estado se hace en un solo lugar.
 */
export interface QuoteStateMeta {
  /** Ícono de Material Symbols que representa la fase. */
  icon: string;
  /** Título de la fase tal como se nombra en el tablero de cotizaciones. */
  phaseTitle: string;
  /**
   * Título de la fase dentro del modal de detalle. Es intencionalmente distinto
   * al del tablero: ahí se numeran las fases con más detalle operativo.
   */
  modalPhaseTitle: string;
  /** Color de texto del estado (`text-*`). */
  textColor: string;
  /**
   * Borde izquierdo con el color del estado, para las filas y tarjetas de la
   * Tabla. Se escribe literal (y no derivado de `textColor`) porque Tailwind
   * sólo genera el CSS de las clases que encuentra escritas en el código: una
   * clase construida en tiempo de ejecución se aplicaría al elemento pero
   * quedaría sin estilo.
   */
  borderLeftClass: string;
  /** Fondo + texto + borde, para badges y chips en reposo. */
  badgeClass: string;
  /** Borde y sombra del contenedor del modal. */
  modalBorderClass: string;
  /** Variante saturada del badge, para cuando el chip está seleccionado. */
  chipActiveClass: string;
  /** Qué se espera que haga el administrador durante esta fase. */
  actionDescription: string;
}

/**
 * Estados que forman el pipeline comercial lineal, en orden. Son los únicos
 * sobre los que tiene sentido "Avanzar" y "Retroceder".
 */
export const QUOTE_PIPELINE_STATES: readonly QuoteState[] = [
  'En revisión',
  'Propuesta enviada',
  'Negociación',
  'Aceptada',
  'Contrato en espera de firma',
  'Contrato firmado',
  'Finalizada'
];

/**
 * Estados del protocolo de imprevistos. No son lineales: pueden ir y volver
 * entre sí según la decisión del cliente, así que la transición se hace desde
 * las acciones dedicadas del modal y no con los botones del Kanban.
 */
export const QUOTE_NON_LINEAR_STATES: readonly QuoteState[] = [
  'Cancelada con Imprevisto',
  'Imprevisto Enviado',
  'Cancelada'
];

/** Todos los estados, en el orden en que se muestran en el Kanban y la Tabla. */
export const QUOTE_ALL_STATES: readonly QuoteState[] = [
  ...QUOTE_PIPELINE_STATES,
  ...QUOTE_NON_LINEAR_STATES
];

export const QUOTE_STATE_META: Record<QuoteState, QuoteStateMeta> = {
  'En revisión': {
    icon: 'history_edu',
    phaseTitle: 'Fase 1: Evaluación Inicial & Revisión de Solicitud Pública',
    modalPhaseTitle: 'Fase 1: Evaluación Inicial & Revisión de Solicitud',
    textColor: 'text-blue-400',
    borderLeftClass: '!border-l-blue-400',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    modalBorderClass: 'border-blue-500/50 shadow-blue-500/10',
    chipActiveClass: 'bg-blue-500/30 text-blue-200 border-blue-400/60 shadow-sm',
    actionDescription: 'Revisar datos de solicitud y verificar fecha en la agenda exclusiva del artista'
  },
  'Propuesta enviada': {
    icon: 'send',
    phaseTitle: 'Fase 1: Propuesta Comercial Enviada al Cliente',
    modalPhaseTitle: 'Fase 2: Propuesta Comercial Enviada al Cliente',
    textColor: 'text-cyan-400',
    borderLeftClass: '!border-l-cyan-400',
    badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    modalBorderClass: 'border-cyan-500/50 shadow-cyan-500/10',
    chipActiveClass: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60 shadow-sm',
    actionDescription: 'Hacer seguimiento a la lectura del correo con la propuesta comercial'
  },
  'Negociación': {
    icon: 'handshake',
    phaseTitle: 'Fase 2: Negociación Comercial & Ajuste de Cláusulas',
    modalPhaseTitle: 'Fase 2.5: Mesa de Negociación & Re-estructuración Comercial',
    textColor: 'text-amber-400',
    borderLeftClass: '!border-l-amber-400',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    modalBorderClass: 'border-amber-500/50 shadow-amber-500/10',
    chipActiveClass: 'bg-amber-500/30 text-amber-200 border-amber-400/60 shadow-sm',
    actionDescription: 'Ajustar cláusulas u honorarios según los acuerdos comercialmente pactados'
  },
  'Aceptada': {
    icon: 'check_circle',
    phaseTitle: 'Fase 2: Cotización Aceptada por el Cliente',
    modalPhaseTitle: 'Fase 3: Cotización Aceptada por el Cliente',
    textColor: 'text-emerald-400',
    borderLeftClass: '!border-l-emerald-400',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    modalBorderClass: 'border-emerald-500/50 shadow-emerald-500/10',
    chipActiveClass: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/60 shadow-sm',
    actionDescription: 'Confirmar aceptación y redactar borrador preliminar de contrato'
  },
  'Contrato en espera de firma': {
    icon: 'edit_note',
    phaseTitle: 'Fase 2: Contrato Enviado en Espera de Firma Digital del Cliente',
    modalPhaseTitle: 'Fase 4: Contrato Enviado en Espera de Firma Digital',
    textColor: 'text-purple-300',
    borderLeftClass: '!border-l-purple-300',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    modalBorderClass: 'border-purple-400/50 shadow-purple-400/10',
    chipActiveClass: 'bg-purple-500/30 text-purple-200 border-purple-400/60 shadow-sm',
    actionDescription: 'Revisar cláusulas legales y solicitar firma digital de las partes'
  },
  'Contrato firmado': {
    icon: 'draw',
    phaseTitle: 'Fase 4.5: Contrato Privado Firmado Digitalmente',
    modalPhaseTitle: 'Fase 4.5: Contrato Privado Firmado Digitalmente',
    textColor: 'text-purple-300',
    borderLeftClass: '!border-l-purple-300',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    modalBorderClass: 'border-purple-500/50 shadow-purple-500/10',
    chipActiveClass: 'bg-purple-500/30 text-purple-200 border-purple-400/60 shadow-sm',
    actionDescription: 'Verificar firma de ambas partes y solicitar comprobante de anticipo'
  },
  'Finalizada': {
    icon: 'task_alt',
    phaseTitle: 'Fase 6: Cierre Definitivo de Cotización & Archivo Histórico',
    modalPhaseTitle: 'Fase 5: Contratación Finalizada y Archivada en Histórico',
    textColor: 'text-slate-300',
    borderLeftClass: '!border-l-slate-300',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    modalBorderClass: 'border-slate-500/50 shadow-slate-500/10',
    chipActiveClass: 'bg-slate-500/40 text-slate-100 border-slate-400/60 shadow-sm',
    actionDescription: 'Expediente histórico archivado y encuesta de satisfacción concluida'
  },
  'Cancelada con Imprevisto': {
    icon: 'report_problem',
    phaseTitle: 'Fase Excepcional: Cancelación por Imprevisto Grave',
    modalPhaseTitle: 'Imprevisto Activo: En Espera de Propuesta de Resolución',
    textColor: 'text-rose-400',
    borderLeftClass: '!border-l-rose-400',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    modalBorderClass: 'border-rose-600/50 shadow-rose-600/10',
    chipActiveClass: 'bg-rose-500/30 text-rose-200 border-rose-400/60 shadow-sm',
    actionDescription: 'Expediente cerrado con protocolo de imprevisto grave u opción de reembolso'
  },
  'Imprevisto Enviado': {
    icon: 'hourglass_top',
    phaseTitle: 'Imprevisto: Propuesta de Resolución Enviada al Cliente',
    modalPhaseTitle: 'Imprevisto: Propuesta de Resolución Enviada al Cliente',
    textColor: 'text-cyan-400',
    borderLeftClass: '!border-l-cyan-300',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    modalBorderClass: 'border-cyan-500/50 shadow-cyan-500/10',
    chipActiveClass: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60 shadow-sm',
    actionDescription: 'Dar seguimiento a la propuesta de resolución enviada, en espera de la decisión del cliente'
  },
  'Cancelada': {
    icon: 'cancel',
    phaseTitle: 'Cotización Cancelada o Inactiva',
    modalPhaseTitle: 'Expediente Cancelado: Fecha Liberada en Calendario',
    textColor: 'text-red-400',
    borderLeftClass: '!border-l-red-400',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    modalBorderClass: 'border-red-500/50 shadow-red-500/10',
    chipActiveClass: 'bg-red-500/30 text-red-200 border-red-400/60 shadow-sm',
    actionDescription: 'Liberar fecha en el calendario disquera y verificar reembolsos'
  }
};

/** Fallback neutro para cuando el estado es nulo o desconocido. */
const FALLBACK_META: QuoteStateMeta = {
  icon: 'bookmark',
  phaseTitle: 'Detalles de Cotización',
  modalPhaseTitle: 'Expediente de Cotización',
  textColor: 'text-primary',
  borderLeftClass: '!border-l-primary',
  badgeClass: 'bg-primary/20 text-primary border-primary/30',
  modalBorderClass: 'border-outline-variant/40',
  chipActiveClass: 'bg-primary text-on-primary border-primary shadow-sm',
  actionDescription: 'Transicionar la cotización al siguiente paso del flujo comercial'
};

export function quoteStateMeta(state: QuoteState | null | undefined): QuoteStateMeta {
  return (state && QUOTE_STATE_META[state]) || FALLBACK_META;
}

/**
 * True para los estados del protocolo de imprevistos, que no avanzan de forma
 * lineal y por lo tanto no admiten los botones Avanzar/Retroceder del Kanban.
 */
export function isNonLinearQuoteState(state: QuoteState): boolean {
  return QUOTE_NON_LINEAR_STATES.includes(state);
}
