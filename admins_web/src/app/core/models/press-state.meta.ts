import { PressState } from './press.models';

/**
 * Metadatos visuales y descriptivos de cada fase de una firma o rueda de prensa.
 *
 * Mismo patrón que `event-state.meta.ts`: una sola fuente de verdad para el
 * color, el ícono y el significado de cada fase, de modo que las tarjetas, el
 * tablero, los badges y el expediente no puedan desincronizarse entre sí.
 *
 * El ciclo es más corto que el de un evento con boletaje, y no por descuido: las
 * dos fases que faltan —'Próximo a Publicar' y 'En Venta'— existen allá porque
 * hay dinero de clientes de por medio. Aquí no se cobra nada, así que no hay
 * ninguna frontera que justifique sellar el expediente antes de tiempo.
 */
export interface PressStateMeta {
  icon: string;
  /** Nombre de la fase en el tablero. */
  phaseTitle: string;
  /** Nombre corto, para badges y chips. */
  shortLabel: string;
  /** Qué significa que un evento de prensa esté aquí. */
  meaning: string;
  /** Qué se espera que haga el encargado durante esta fase. */
  actionDescription: string;
  textColor: string;
  /**
   * Borde izquierdo del color de la fase. Se escribe literal (y no derivado de
   * `textColor`) porque Tailwind solo genera el CSS de las clases que encuentra
   * escritas en el código.
   */
  borderLeftClass: string;
  badgeClass: string;
  chipActiveClass: string;
  modalBorderClass: string;
  lockLevel: PressLockLevel;
}

/**
 * - `libre`: todo es editable, no hay nadie afectado todavía.
 * - `convocado`: hay medios que ya apartaron su agenda; se añade y se sustituye,
 *   pero no se le quita el pase a quien ya lo tiene confirmado.
 * - `sellado`: solo lectura.
 */
export type PressLockLevel = 'libre' | 'convocado' | 'sellado';

/** Fases del ciclo lineal, en orden. */
export const PRESS_PIPELINE_STATES: readonly PressState[] = [
  'Borrador',
  'En Revisión',
  'Convocado',
  'Realizado',
  'Cerrado'
];

/** Fases excepcionales: se puede caer en ellas desde cualquier punto del ciclo. */
export const PRESS_NON_LINEAR_STATES: readonly PressState[] = ['Pospuesto', 'Cancelado'];

/** Todas las fases, en el orden en que se muestran en el tablero. */
export const PRESS_ALL_STATES: readonly PressState[] = [
  ...PRESS_PIPELINE_STATES,
  ...PRESS_NON_LINEAR_STATES
];

export const PRESS_STATE_META: Record<PressState, PressStateMeta> = {
  'Borrador': {
    icon: 'edit_document',
    phaseTitle: 'Fase 1: Armado del Evento de Prensa',
    shortLabel: 'Borrador',
    meaning: 'Se está armando. Puede tener información incompleta y nadie fuera del equipo lo ha visto.',
    actionDescription: 'Capturar fecha, recinto, grupo, montaje y las reglas de acreditación antes de mandarlo a revisión',
    textColor: 'text-slate-300',
    borderLeftClass: '!border-l-slate-300',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    chipActiveClass: 'bg-slate-500/40 text-slate-100 border-slate-400/60 shadow-sm',
    modalBorderClass: 'border-slate-500/50 shadow-slate-500/10',
    lockLevel: 'libre'
  },
  'En Revisión': {
    icon: 'rate_review',
    phaseTitle: 'Fase 2: Revisión del Expediente & Solicitudes',
    shortLabel: 'En Revisión',
    meaning: 'Se completa lo que falte y se resuelven las solicitudes que hayan llegado antes de abrir al público.',
    actionDescription: 'Cerrar los puntos obligatorios y contestar cada solicitud de acreditación pendiente',
    textColor: 'text-amber-400',
    borderLeftClass: '!border-l-amber-400',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    chipActiveClass: 'bg-amber-500/30 text-amber-200 border-amber-400/60 shadow-sm',
    modalBorderClass: 'border-amber-500/50 shadow-amber-500/10',
    lockLevel: 'libre'
  },
  'Convocado': {
    icon: 'campaign',
    phaseTitle: 'Fase 3: Convocado en el Portal & Acreditación Abierta',
    shortLabel: 'Convocado',
    meaning: 'El evento ya es visible y los medios pueden solicitar su gafete. Hay gente que apartó su agenda.',
    actionDescription: 'Aprobar y rechazar solicitudes, asignar gafetes y zonas, y vigilar el cupo',
    textColor: 'text-blue-400',
    borderLeftClass: '!border-l-blue-400',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    chipActiveClass: 'bg-blue-500/30 text-blue-200 border-blue-400/60 shadow-sm',
    modalBorderClass: 'border-blue-500/50 shadow-blue-500/10',
    lockLevel: 'convocado'
  },
  'Realizado': {
    icon: 'event_available',
    phaseTitle: 'Fase 4: Evento Realizado & Captura de Cobertura',
    shortLabel: 'Realizado',
    meaning: 'El evento ya ocurrió. Falta lo único que dice si valió la pena: quién asistió de verdad y qué se publicó.',
    actionDescription: 'Marcar asistencia real, subir fotografías, capturar cobertura publicada y el gasto final',
    textColor: 'text-purple-300',
    borderLeftClass: '!border-l-purple-300',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    chipActiveClass: 'bg-purple-500/30 text-purple-200 border-purple-400/60 shadow-sm',
    modalBorderClass: 'border-purple-500/50 shadow-purple-500/10',
    lockLevel: 'convocado'
  },
  'Cerrado': {
    icon: 'lock',
    phaseTitle: 'Fase 5: Expediente Cerrado & Trazabilidad Histórica',
    shortLabel: 'Cerrado',
    meaning: 'Expediente sellado. Solo queda la información y la trazabilidad de todo lo que pasó.',
    actionDescription: 'Consultar el histórico; el expediente ya no admite ninguna modificación',
    textColor: 'text-zinc-400',
    borderLeftClass: '!border-l-zinc-400',
    badgeClass: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    chipActiveClass: 'bg-zinc-500/40 text-zinc-100 border-zinc-400/60 shadow-sm',
    modalBorderClass: 'border-zinc-500/50 shadow-zinc-500/10',
    lockLevel: 'sellado'
  },
  'Pospuesto': {
    icon: 'event_repeat',
    phaseTitle: 'Fase Excepcional: Evento Pospuesto',
    shortLabel: 'Pospuesto',
    meaning: 'Cambió de fecha. Las acreditaciones ya emitidas siguen siendo válidas; lo que cambia es cuándo se usan.',
    actionDescription: 'Avisar a los acreditados con motivo y material, y confirmar la nueva fecha',
    textColor: 'text-orange-300',
    borderLeftClass: '!border-l-orange-300',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    chipActiveClass: 'bg-orange-500/30 text-orange-200 border-orange-400/60 shadow-sm',
    modalBorderClass: 'border-orange-500/50 shadow-orange-500/10',
    lockLevel: 'convocado'
  },
  'Cancelado': {
    icon: 'cancel',
    phaseTitle: 'Fase Excepcional: Evento Cancelado',
    shortLabel: 'Cancelado',
    meaning: 'No se hace. No hay nada que reembolsar —nunca se cobró— pero sí medios que apartaron su agenda.',
    actionDescription: 'Avisar a los acreditados con el motivo y liberar la fecha del recinto',
    textColor: 'text-rose-400',
    borderLeftClass: '!border-l-rose-400',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    chipActiveClass: 'bg-rose-500/30 text-rose-200 border-rose-400/60 shadow-sm',
    modalBorderClass: 'border-rose-600/50 shadow-rose-600/10',
    lockLevel: 'sellado'
  }
};

const FALLBACK_META: PressStateMeta = {
  icon: 'newspaper',
  phaseTitle: 'Expediente de Prensa',
  shortLabel: 'Prensa',
  meaning: 'Estado no reconocido.',
  actionDescription: 'Revisar el expediente de prensa',
  textColor: 'text-primary',
  borderLeftClass: '!border-l-primary',
  badgeClass: 'bg-primary/20 text-primary border-primary/30',
  chipActiveClass: 'bg-primary text-on-primary border-primary shadow-sm',
  modalBorderClass: 'border-outline-variant/40',
  lockLevel: 'libre'
};

export function pressStateMeta(state: PressState | null | undefined): PressStateMeta {
  return (state && PRESS_STATE_META[state]) || FALLBACK_META;
}

/** Posición de la fase en el ciclo lineal; -1 para las excepcionales. */
export function pressStateIndex(state: PressState): number {
  return PRESS_PIPELINE_STATES.indexOf(state);
}

export function isNonLinearPressState(state: PressState): boolean {
  return PRESS_NON_LINEAR_STATES.includes(state);
}

/** True a partir de 'Convocado': el evento ya es visible en el portal. */
export function isPublicPressState(state: PressState): boolean {
  return state === 'Convocado' || state === 'Realizado' || state === 'Cerrado'
    || state === 'Pospuesto';
}

/** True cuando el expediente ya no admite ninguna edición. */
export function isSealedPressState(state: PressState): boolean {
  return pressStateMeta(state).lockLevel === 'sellado';
}

/**
 * Qué se puede editar en cada fase.
 *
 * Es la traducción operativa del `lockLevel`. La regla que manda es la de
 * 'Convocado': ahí hay medios con gafete confirmado, así que se puede añadir y
 * sustituir —acreditar a otro medio, cambiar de vocero, abrir una zona más— pero
 * no retirarle el pase a nadie de un plumazo. Para eso está la revocación con
 * motivo, que deja rastro.
 */
export interface PressEditPolicy {
  /** Nombre, tipo, fecha, hora, recinto y grupo. */
  identity: boolean;
  /** Ficha pública: fotografía oficial, textos, mapa, contacto, reglas de fans. */
  publicProfile: boolean;
  /** Grupos que se presentan. */
  lineup: boolean;
  /** Reglas de acreditación: ventana de registro, cupo, zonas, kit de prensa. */
  accreditation: boolean;
  /** Aprobar, rechazar y revocar solicitudes. */
  decisions: boolean;
  /** Marcar quién se presentó de verdad. */
  attendance: boolean;
  /** Montaje, sonido, backdrop, control de fila, seguridad y desglose de gasto. */
  production: boolean;
  /** Compromiso del talento: llegada, vocero, duración, temas vetados. */
  talent: boolean;
  /** Reporte de cierre. */
  closure: boolean;
  /**
   * En esta fase solo se puede **añadir y sustituir**, nunca quitar lo ya
   * comprometido. El guardián va en la operación, no en el aviso: un aviso se
   * ignora, un filtro no.
   */
  additiveOnly?: boolean;
  /** Aviso que debe verse antes de tocar algo en esta fase, si aplica. */
  warning?: string;
}

export function pressEditPolicy(state: PressState): PressEditPolicy {
  switch (state) {
    case 'Borrador':
      return {
        identity: true, publicProfile: true, lineup: true,
        accreditation: true, decisions: true, attendance: false,
        production: true, talent: true, closure: false
      };

    case 'En Revisión':
      return {
        identity: true, publicProfile: true, lineup: true,
        accreditation: true, decisions: true, attendance: false,
        production: true, talent: true, closure: false,
        warning: 'En Revisión se completa lo que falte y se contesta cada solicitud pendiente. '
          + 'Convocar queda bloqueado hasta que no quede ningún punto obligatorio ni ninguna solicitud sin respuesta.'
      };

    case 'Convocado':
      return {
        identity: false, publicProfile: true, lineup: true,
        accreditation: true, decisions: true, attendance: true,
        production: true, talent: true, closure: false,
        additiveOnly: true,
        warning: 'El evento ya es público y hay medios acreditados. Puedes acreditar a más, abrir otra zona '
          + 'o sustituir al vocero, pero no retirarle el pase a quien ya lo tiene: eso se revoca con motivo. '
          + 'Para mover la fecha, usa Posponer.'
      };

    case 'Realizado':
      return {
        identity: false, publicProfile: false, lineup: false,
        accreditation: false, decisions: false, attendance: true,
        production: true, talent: false, closure: true,
        warning: 'El evento concluyó. El expediente queda en solo lectura: aquí se marca quién asistió de verdad, '
          + 'se suben las fotografías y se captura la cobertura publicada y el gasto final.'
      };

    case 'Cerrado':
      return {
        identity: false, publicProfile: false, lineup: false,
        accreditation: false, decisions: false, attendance: false,
        production: false, talent: false, closure: false,
        warning: 'Expediente cerrado y sellado: solo lectura y consulta histórica.'
      };

    case 'Pospuesto':
      return {
        identity: false, publicProfile: true, lineup: true,
        accreditation: true, decisions: true, attendance: false,
        production: true, talent: true, closure: false,
        additiveOnly: true,
        warning: 'El evento cambió de fecha y las acreditaciones emitidas siguen siendo válidas. '
          + 'Avisa a los acreditados con el motivo y el material nuevo antes de volver a convocar.'
      };

    default:
      // Cancelado.
      return {
        identity: false, publicProfile: false, lineup: false,
        accreditation: false, decisions: false, attendance: false,
        production: false, talent: false, closure: false,
        warning: 'Evento cancelado: registro histórico del motivo y del aviso enviado a los acreditados.'
      };
  }
}

/**
 * Qué se puede hacer con las tareas en cada fase.
 *
 * Va aparte de `PressEditPolicy` porque las tareas no siguen la suerte del
 * expediente. Con el evento ya convocado la información se sella, pero la
 * operación sigue viva —falta contratar el templete, pagar el café— y bloquear
 * las dos cosas juntas deja al equipo sin dónde anotar lo que está haciendo.
 */
export interface PressTaskPolicy {
  /** Encargar un punto del expediente a otra disquera. */
  assignMandatory: boolean;
  /** Crear encargos operativos nuevos. */
  createOptional: boolean;
  /** Confirmar encargos, delegarlos, transferirlos y desglosar su gasto. */
  workOptional: boolean;
  /** Aceptar o rechazar cambios propuestos sobre datos obligatorios. */
  decideProposals: boolean;
  /** Motivo del bloqueo, cuando algo está cerrado. */
  notice?: string;
}

export function pressTaskPolicy(state: PressState): PressTaskPolicy {
  switch (state) {
    case 'Borrador':
    case 'En Revisión':
    case 'Convocado':
    case 'Pospuesto':
      return { assignMandatory: true, createOptional: true, workOptional: true, decideProposals: true };

    case 'Realizado':
      return {
        assignMandatory: false, createOptional: true, workOptional: true, decideProposals: false,
        notice: 'El evento ya ocurrió: los puntos del expediente quedan sellados. Aquí solo se cierran '
          + 'los encargos operativos que todavía tengan gasto por capturar.'
      };

    default:
      // Cerrado y Cancelado: expediente histórico.
      return {
        assignMandatory: false, createOptional: false, workOptional: false, decideProposals: false,
        notice: 'Expediente en solo lectura: las tareas se consultan, no se modifican.'
      };
  }
}
