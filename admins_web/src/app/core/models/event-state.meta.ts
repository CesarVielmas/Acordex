import { EventState } from './event.models';

/**
 * Metadatos visuales y descriptivos de cada estado de un evento.
 *
 * Mismo patrón que `quote-state.meta.ts`: una sola fuente de verdad para el
 * color, el ícono y el significado de cada fase, de modo que las tarjetas, el
 * tablero, los badges y el expediente no puedan desincronizarse entre sí.
 */
export interface EventStateMeta {
  icon: string;
  /** Nombre de la fase en el tablero. */
  phaseTitle: string;
  /** Nombre corto, para badges y chips. */
  shortLabel: string;
  /** Qué significa que un evento esté aquí. */
  meaning: string;
  /** Qué se espera que haga el encargado durante esta fase. */
  actionDescription: string;
  textColor: string;
  /**
   * Borde izquierdo del color del estado. Se escribe literal (y no derivado de
   * `textColor`) porque Tailwind solo genera el CSS de las clases que encuentra
   * escritas en el código.
   */
  borderLeftClass: string;
  /** Fondo + texto + borde, para badges y chips en reposo. */
  badgeClass: string;
  /** Variante saturada del badge, para cuando el chip está seleccionado. */
  chipActiveClass: string;
  /** Borde y sombra del contenedor del expediente. */
  modalBorderClass: string;
  /**
   * Cuánto se puede tocar el evento en esta fase. Es la regla que hace que un
   * error de precio sea trivial en 'Borrador' y carísimo en 'En Venta'.
   */
  lockLevel: EventLockLevel;
}

/**
 * - `libre`: todo es editable, no hay nadie afectado todavía.
 * - `acordado`: hay terceros que ya aprobaron; cambiar obliga a re-aprobar.
 * - `publico`: el evento ya es visible; cambiar afecta lo que el público vio.
 * - `vendido`: hay dinero de clientes de por medio; cambiar obliga a reembolsar.
 * - `sellado`: solo lectura.
 */
export type EventLockLevel = 'libre' | 'acordado' | 'publico' | 'vendido' | 'sellado';

/**
 * Estados del ciclo lineal, en orden. Son los únicos sobre los que tiene
 * sentido hablar de "avanzar" y "retroceder".
 */
export const EVENT_PIPELINE_STATES: readonly EventState[] = [
  'Borrador',
  'En Revisión',
  'Próximo a Publicar',
  'Publicado',
  'En Venta',
  'Finalizada',
  'Cerrado'
];

/** Estados excepcionales: se puede caer en ellos desde cualquier fase. */
export const EVENT_NON_LINEAR_STATES: readonly EventState[] = ['Cancelado'];

/** Todos los estados, en el orden en que se muestran en el tablero. */
export const EVENT_ALL_STATES: readonly EventState[] = [
  ...EVENT_PIPELINE_STATES,
  ...EVENT_NON_LINEAR_STATES
];

export const EVENT_STATE_META: Record<EventState, EventStateMeta> = {
  'Borrador': {
    icon: 'edit_document',
    phaseTitle: 'Fase 1: Armado del Evento & Captura de Información',
    shortLabel: 'Borrador',
    meaning: 'El evento se está armando. Puede tener información incompleta y nadie fuera del equipo lo ha visto.',
    actionDescription: 'Completar cartel, orden de entradas, equipo de sonido, horarios, costos y boletaje antes de enviarlo a revisión',
    textColor: 'text-slate-300',
    borderLeftClass: '!border-l-slate-300',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    chipActiveClass: 'bg-slate-500/40 text-slate-100 border-slate-400/60 shadow-sm',
    modalBorderClass: 'border-slate-500/50 shadow-slate-500/10',
    lockLevel: 'libre'
  },
  'En Revisión': {
    icon: 'rate_review',
    phaseTitle: 'Fase 2: Revisión & Aprobación de los Encargados Involucrados',
    shortLabel: 'En Revisión',
    meaning: 'Los encargados de cada grupo del cartel que no depende de ti tienen que aprobar fecha, horarios y costos.',
    actionDescription: 'Dar seguimiento a las aprobaciones y atender los cambios que pidan los encargados que rechazaron',
    textColor: 'text-amber-400',
    borderLeftClass: '!border-l-amber-400',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    chipActiveClass: 'bg-amber-500/30 text-amber-200 border-amber-400/60 shadow-sm',
    modalBorderClass: 'border-amber-500/50 shadow-amber-500/10',
    lockLevel: 'acordado'
  },
  'Próximo a Publicar': {
    icon: 'schedule_send',
    phaseTitle: 'Fase 3: Aprobado & Programado para Publicación Automática',
    shortLabel: 'Programado',
    meaning: 'Todos aprobaron y el evento tiene fecha y hora de publicación automática en la cartelera.',
    actionDescription: 'Verificar por última vez precios, croquis y horarios: al publicarse el evento queda a la vista del público',
    textColor: 'text-cyan-400',
    borderLeftClass: '!border-l-cyan-400',
    badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    chipActiveClass: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/60 shadow-sm',
    modalBorderClass: 'border-cyan-500/50 shadow-cyan-500/10',
    lockLevel: 'acordado'
  },
  'Publicado': {
    icon: 'campaign',
    phaseTitle: 'Fase 4: Publicado en Cartelera & Boletos Disponibles',
    shortLabel: 'Publicado',
    meaning: 'El evento ya es público y los boletos están disponibles, pero todavía nadie ha comprado.',
    actionDescription: 'Empujar la venta y corregir cualquier detalle mientras todavía no hay boletos vendidos',
    textColor: 'text-blue-400',
    borderLeftClass: '!border-l-blue-400',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    chipActiveClass: 'bg-blue-500/30 text-blue-200 border-blue-400/60 shadow-sm',
    modalBorderClass: 'border-blue-500/50 shadow-blue-500/10',
    lockLevel: 'publico'
  },
  'En Venta': {
    icon: 'confirmation_number',
    phaseTitle: 'Fase 5: En Venta con Clientes y Asientos Asignados',
    shortLabel: 'En Venta',
    meaning: 'Hay clientes con boleto y asiento. Precios y croquis quedan bloqueados: cambiarlos obliga a reembolsar.',
    actionDescription: 'Vigilar ocupación por zona y ritmo de venta; cualquier corrección crítica pasa por reembolso al cliente',
    textColor: 'text-emerald-400',
    borderLeftClass: '!border-l-emerald-400',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    chipActiveClass: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/60 shadow-sm',
    modalBorderClass: 'border-emerald-500/50 shadow-emerald-500/10',
    lockLevel: 'vendido'
  },
  'Finalizada': {
    icon: 'event_available',
    phaseTitle: 'Fase 6: Evento Realizado & Captura de Resultados Finales',
    shortLabel: 'Finalizada',
    meaning: 'El evento ya ocurrió y la venta cerró. Faltan los números finales: aforo, gastos, pagos a grupos y material.',
    actionDescription: 'Capturar aforo real, ingresos, gastos de producción, pagos a cada grupo y material multimedia del evento',
    textColor: 'text-purple-300',
    borderLeftClass: '!border-l-purple-300',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    chipActiveClass: 'bg-purple-500/30 text-purple-200 border-purple-400/60 shadow-sm',
    modalBorderClass: 'border-purple-500/50 shadow-purple-500/10',
    lockLevel: 'publico'
  },
  'Cerrado': {
    icon: 'lock',
    phaseTitle: 'Fase 7: Expediente Cerrado & Trazabilidad Histórica',
    shortLabel: 'Cerrado',
    meaning: 'Expediente sellado. Solo queda la información y la trazabilidad completa de todo lo que pasó.',
    actionDescription: 'Consultar el histórico del evento; el expediente ya no admite ninguna modificación',
    textColor: 'text-zinc-400',
    borderLeftClass: '!border-l-zinc-400',
    badgeClass: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    chipActiveClass: 'bg-zinc-500/40 text-zinc-100 border-zinc-400/60 shadow-sm',
    modalBorderClass: 'border-zinc-500/50 shadow-zinc-500/10',
    lockLevel: 'sellado'
  },
  'Cancelado': {
    icon: 'cancel',
    phaseTitle: 'Fase Excepcional: Evento Cancelado',
    shortLabel: 'Cancelado',
    meaning: 'El evento no se realizará. Si ya había venta, arrastra reembolsos y avisos a los clientes.',
    actionDescription: 'Cerrar reembolsos, avisar a clientes y grupos, y liberar la fecha del recinto',
    textColor: 'text-rose-400',
    borderLeftClass: '!border-l-rose-400',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    chipActiveClass: 'bg-rose-500/30 text-rose-200 border-rose-400/60 shadow-sm',
    modalBorderClass: 'border-rose-600/50 shadow-rose-600/10',
    lockLevel: 'sellado'
  }
};

const FALLBACK_META: EventStateMeta = {
  icon: 'event',
  phaseTitle: 'Expediente de Evento',
  shortLabel: 'Evento',
  meaning: 'Estado no reconocido.',
  actionDescription: 'Revisar el expediente del evento',
  textColor: 'text-primary',
  borderLeftClass: '!border-l-primary',
  badgeClass: 'bg-primary/20 text-primary border-primary/30',
  chipActiveClass: 'bg-primary text-on-primary border-primary shadow-sm',
  modalBorderClass: 'border-outline-variant/40',
  lockLevel: 'libre'
};

export function eventStateMeta(state: EventState | null | undefined): EventStateMeta {
  return (state && EVENT_STATE_META[state]) || FALLBACK_META;
}

/** Posición del estado en el ciclo lineal; -1 para los excepcionales. */
export function eventStateIndex(state: EventState): number {
  return EVENT_PIPELINE_STATES.indexOf(state);
}

export function isNonLinearEventState(state: EventState): boolean {
  return EVENT_NON_LINEAR_STATES.includes(state);
}

/**
 * True a partir de 'Publicado': el evento ya es visible para el público, así
 * que cualquier corrección deja de ser un trámite interno.
 */
export function isPublicEventState(state: EventState): boolean {
  return state === 'Publicado' || state === 'En Venta' || state === 'Finalizada' || state === 'Cerrado';
}

/** True cuando el expediente ya no admite ninguna edición. */
export function isSealedEventState(state: EventState): boolean {
  return eventStateMeta(state).lockLevel === 'sellado';
}

/**
 * Qué se puede editar en cada fase.
 *
 * Es la traducción operativa del `lockLevel`: qué bloques del expediente siguen
 * abiertos y cuáles ya comprometieron a alguien. La regla que manda es la de
 * 'En Venta': ahí hay clientes con asiento asignado, así que precios, zonas y
 * butacas dejan de ser editables — los textos de la ficha pública sí, porque
 * corregir una falta de ortografía no le mueve el asiento a nadie.
 */
export interface EventEditPolicy {
  /** Nombre, fecha, recinto y datos base. */
  identity: boolean;
  /** Ficha pública: portada, cartel, textos, reglas, contacto. */
  publicProfile: boolean;
  /** Cartel: grupos, orden de entradas, horarios y costos. */
  lineup: boolean;
  /** Producción: equipo de sonido y corrida del día. */
  production: boolean;
  /** Boletaje, zonas y mapa de butacas. */
  tickets: boolean;
  /** Reporte de cierre. */
  closure: boolean;
  /** Aviso que debe verse antes de tocar algo en esta fase, si aplica. */
  warning?: string;
}

export function eventEditPolicy(state: EventState): EventEditPolicy {
  switch (eventStateMeta(state).lockLevel) {
    case 'libre':
      return { identity: true, publicProfile: true, lineup: true, production: true, tickets: true, closure: false };

    case 'acordado':
      return {
        identity: true, publicProfile: true, lineup: true, production: true, tickets: true, closure: false,
        warning: 'Los encargados ya revisaron este cartel. Si cambias horarios o costos, tendrás que volver a pedir su aprobación.'
      };

    case 'publico':
      return {
        identity: false, publicProfile: true, lineup: true, production: true, tickets: true, closure: state === 'Finalizada',
        warning: state === 'Finalizada'
          ? 'El evento ya ocurrió: lo que se captura aquí son los resultados finales.'
          : 'El evento ya es visible para el público. Todo cambio se refleja de inmediato en la cartelera.'
      };

    case 'vendido':
      return {
        identity: false, publicProfile: true, lineup: false, production: true, tickets: false, closure: false,
        warning: 'Hay clientes con asiento asignado. Precios, zonas y butacas están bloqueados: modificarlos obliga a reembolsar y reasignar uno por uno.'
      };

    default:
      return {
        identity: false, publicProfile: false, lineup: false, production: false, tickets: false, closure: false,
        warning: 'Expediente sellado: solo lectura.'
      };
  }
}
