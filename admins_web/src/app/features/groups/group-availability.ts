import { EventItem, EventLineupSlot } from '../../core/models/event.models';
import { PressEventItem } from '../../core/models/press.models';

/**
 * Si un grupo está libre un día, y con qué choca si no lo está.
 *
 * La agenda no se captura: **se deriva**. Un grupo está ocupado el 22 de agosto
 * porque ese día ya está en el cartel de otro evento o en una firma, no porque
 * alguien se haya acordado de marcarlo en un calendario aparte. Una agenda que
 * hay que mantener a mano se desincroniza el primer día, y a partir de ahí dice
 * que hay hueco donde no lo hay —que es exactamente el error que se paga con el
 * grupo llegando a dos sitios a la vez—.
 *
 * Los eventos cancelados no ocupan nada: se cayeron, y la fecha volvió a quedar
 * libre. Los pospuestos ocupan su fecha **nueva**, que es la que el modelo ya
 * guarda en `date`.
 */

export type CommitmentKind = 'evento' | 'firma' | 'rueda';

export interface GroupCommitment {
  /** Fecha en ISO corto ('2026-08-22'). */
  date: string;
  kind: CommitmentKind;
  /** Id del expediente que ocupa el día. */
  sourceId: string;
  title: string;
  venue: string;
  location: string;
  /** Hora de la tanda o del evento, si se capturó. */
  time?: string;
  /** Fase en la que está ese expediente. */
  state: string;
  /** True cuando el compromiso todavía no está confirmado por su dueño. */
  tentative: boolean;
}

/** Fases que ya no ocupan la agenda: el compromiso se cayó. */
const FASES_MUERTAS = ['Cancelado'];

/**
 * Todos los días que este grupo ya tiene comprometidos.
 *
 * `excludeId` deja fuera el expediente que se está armando: al buscar un grupo
 * para el evento X, que el propio X aparezca como conflicto es ruido.
 */
export function groupCommitments(
  groupId: string,
  events: EventItem[],
  pressEvents: PressEventItem[],
  excludeId?: string
): GroupCommitment[] {
  const out: GroupCommitment[] = [];

  for (const e of events) {
    if (e.id === excludeId || FASES_MUERTAS.includes(e.state)) continue;
    const slot = (e.lineup || []).find(s => s.groupId === groupId);
    if (!slot || !e.date) continue;

    out.push({
      date: e.date,
      kind: 'evento',
      sourceId: e.id,
      title: e.title,
      venue: e.venue,
      location: e.location,
      time: slotTime(slot),
      state: e.state,
      // Un grupo ajeno cuyo dueño todavía no aprobó no bloquea del todo: está
      // apartado, no comprometido. Decir lo contrario esconde una fecha que en
      // realidad sigue negociándose.
      tentative: slot.isExternal && slot.approval !== 'Aprobado'
    });
  }

  for (const p of pressEvents) {
    if (p.id === excludeId || FASES_MUERTAS.includes(p.state)) continue;
    if (!(p.lineup || []).some(s => s.groupId === groupId) || !p.date) continue;

    out.push({
      date: p.date,
      kind: p.pressType === 'Firma de Autógrafos' ? 'firma' : 'rueda',
      sourceId: p.id,
      title: p.title,
      venue: p.venue,
      location: p.location,
      time: p.startTime,
      state: p.state,
      tentative: p.state === 'Borrador'
    });
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

function slotTime(slot: EventLineupSlot): string | undefined {
  if (slot.setStartTime && slot.setEndTime) return `${slot.setStartTime} – ${slot.setEndTime}`;
  return slot.setStartTime || slot.arrivalTime;
}

export type AvailabilityLevel = 'libre' | 'apartado' | 'ocupado' | 'sin-fecha';

export interface DayAvailability {
  level: AvailabilityLevel;
  /** Lo que ya tiene ese día, si tiene algo. */
  conflicts: GroupCommitment[];
  /** Cómo se le cuenta a quien está eligiendo. */
  label: string;
}

/**
 * Cómo está el grupo el día del evento.
 *
 * Distingue **ocupado** de **apartado** a propósito: un grupo que ya está
 * confirmado en otro cartel es un no; uno que está en un borrador ajeno o
 * esperando la aprobación de su dueño todavía es un quizá, y esa diferencia es
 * la que decide si vale la pena preguntar.
 */
export function availabilityOn(
  groupId: string,
  date: string | undefined,
  events: EventItem[],
  pressEvents: PressEventItem[],
  excludeId?: string
): DayAvailability {
  if (!date) {
    return { level: 'sin-fecha', conflicts: [], label: 'El evento no tiene fecha todavía' };
  }

  const delDia = groupCommitments(groupId, events, pressEvents, excludeId).filter(c => c.date === date);
  if (!delDia.length) {
    return { level: 'libre', conflicts: [], label: 'Libre ese día' };
  }

  const firmes = delDia.filter(c => !c.tentative);
  if (firmes.length) {
    return {
      level: 'ocupado',
      conflicts: delDia,
      label: `Ocupado: ${firmes[0].title}`
    };
  }

  return {
    level: 'apartado',
    conflicts: delDia,
    label: `Apartado sin confirmar: ${delDia[0].title}`
  };
}

/** Cuántos días del mes de esta fecha tiene ocupados el grupo. */
export function monthLoad(
  groupId: string,
  date: string | undefined,
  events: EventItem[],
  pressEvents: PressEventItem[],
  excludeId?: string
): { busyDays: number; totalDays: number; percent: number } {
  const base = date ? new Date(date + 'T00:00:00') : new Date();
  if (isNaN(base.getTime())) return { busyDays: 0, totalDays: 30, percent: 0 };

  const year = base.getFullYear();
  const month = base.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prefijo = `${year}-${String(month + 1).padStart(2, '0')}`;

  const dias = new Set(
    groupCommitments(groupId, events, pressEvents, excludeId)
      .filter(c => c.date.startsWith(prefijo))
      .map(c => c.date)
  );

  return { busyDays: dias.size, totalDays, percent: Math.round((dias.size / totalDays) * 100) };
}

export interface CalendarDay {
  day: number;
  date: string;
  level: AvailabilityLevel;
  commitments: GroupCommitment[];
  /** El día del evento que se está armando. */
  isTarget: boolean;
}

/**
 * El mes de la fecha del evento, día por día.
 *
 * Es lo que convierte «está ocupado» en una decisión: enseña si el choque es un
 * día suelto en un mes vacío —se negocia— o si el grupo tiene la semana entera
 * tomada, que es cuando conviene buscar a otro.
 */
export function availabilityCalendar(
  groupId: string,
  date: string | undefined,
  events: EventItem[],
  pressEvents: PressEventItem[],
  excludeId?: string
): CalendarDay[] {
  const base = date ? new Date(date + 'T00:00:00') : new Date();
  if (isNaN(base.getTime())) return [];

  const year = base.getFullYear();
  const month = base.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todos = groupCommitments(groupId, events, pressEvents, excludeId);

  const dias: CalendarDay[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const delDia = todos.filter(c => c.date === iso);
    const firmes = delDia.some(c => !c.tentative);

    dias.push({
      day: d,
      date: iso,
      level: !delDia.length ? 'libre' : (firmes ? 'ocupado' : 'apartado'),
      commitments: delDia,
      isTarget: iso === date
    });
  }
  return dias;
}

/** Cuántas celdas vacías van antes del día 1 para que caiga en su columna. */
export function calendarLeadingBlanks(date: string | undefined): number {
  const base = date ? new Date(date + 'T00:00:00') : new Date();
  if (isNaN(base.getTime())) return 0;
  // La semana empieza en lunes, que es como se lee una agenda de trabajo.
  return (new Date(base.getFullYear(), base.getMonth(), 1).getDay() + 6) % 7;
}

export const AVAILABILITY_META: Record<AvailabilityLevel, { label: string; badge: string; dot: string; icon: string }> = {
  'libre': {
    label: 'Libre',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    dot: 'bg-emerald-400',
    icon: 'event_available'
  },
  'apartado': {
    label: 'Apartado',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    dot: 'bg-amber-400',
    icon: 'schedule'
  },
  'ocupado': {
    label: 'Ocupado',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
    dot: 'bg-rose-400',
    icon: 'event_busy'
  },
  'sin-fecha': {
    label: 'Sin fecha',
    badge: 'bg-white/5 text-outline border-white/12',
    dot: 'bg-outline',
    icon: 'help'
  }
};
