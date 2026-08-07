import {
  EventItem,
  EventLineupSlot,
  EventApproval,
  EventPublicProfile,
  EventReviewRound,
  TicketTier,
  emptyPublicProfile
} from '../../core/models/event.models';

/**
 * Derivaciones puras sobre un evento.
 *
 * Vive aparte de las tarjetas, los filtros y las métricas del panel porque las
 * tres necesitan exactamente los mismos cálculos: si cada una los repitiera,
 * terminarían contradiciéndose entre sí (que es justo lo que le pasó al módulo
 * de cotizaciones antes de centralizarlos).
 */

// ─── Fechas ───────────────────────────────────────────────────────────────────

/** Días entre hoy y la fecha del evento; negativo si ya pasó. */
export function daysUntilEvent(e: EventItem): number {
  const target = new Date(e.date + 'T00:00:00');
  if (isNaN(target.getTime())) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** Días transcurridos desde una fecha ISO; null si no es una fecha válida. */
export function daysSince(iso?: string): number | null {
  if (!iso) return null;
  const from = new Date(iso.length > 10 ? iso : iso + 'T00:00:00');
  if (isNaN(from.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - from.getTime()) / 86400000));
}

/** Horas que faltan para una fecha/hora ISO; null si no es válida. */
export function hoursUntil(iso?: string): number | null {
  if (!iso) return null;
  const target = new Date(iso);
  if (isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - Date.now()) / 3600000);
}

export function isPastEvent(e: EventItem): boolean {
  return daysUntilEvent(e) < 0;
}

// ─── Boletaje y aforo ─────────────────────────────────────────────────────────

/** Lugares a la venta, sumando todas las categorías de boleto. */
export function totalSeats(e: EventItem): number {
  return (e.ticketTiers || []).reduce((sum, t) => sum + (t.totalSeats || 0), 0);
}

export function soldSeats(e: EventItem): number {
  if (e.sales?.ticketsSold) return e.sales.ticketsSold;
  return (e.ticketTiers || []).reduce((sum, t) => sum + (t.soldSeats || 0), 0);
}

export function availableSeats(e: EventItem): number {
  return Math.max(0, totalSeats(e) - soldSeats(e));
}

export function occupancyPercent(e: EventItem): number {
  const total = totalSeats(e);
  if (total <= 0) return 0;
  return Math.min(100, (soldSeats(e) / total) * 100);
}

/** Ingreso ya cobrado en taquilla. */
export function grossTicketRevenue(e: EventItem): number {
  if (e.sales?.grossRevenue) return e.sales.grossRevenue;
  return (e.ticketTiers || []).reduce((sum, t) => sum + (t.soldSeats || 0) * (t.price || 0), 0);
}

/** Ingreso máximo si se agotara todo el boletaje. */
export function potentialTicketRevenue(e: EventItem): number {
  return (e.ticketTiers || []).reduce((sum, t) => sum + (t.totalSeats || 0) * (t.price || 0), 0);
}

export function hasAnySale(e: EventItem): boolean {
  return soldSeats(e) > 0;
}

export function isSoldOut(e: EventItem): boolean {
  return totalSeats(e) > 0 && availableSeats(e) === 0;
}

/** Precio más barato del boletaje, que es el que se anuncia en la cartelera. */
export function lowestTicketPrice(e: EventItem): number {
  const prices = (e.ticketTiers || []).map(t => t.price || 0).filter(p => p > 0);
  return prices.length ? Math.min(...prices) : 0;
}

export function highestTicketPrice(e: EventItem): number {
  const prices = (e.ticketTiers || []).map(t => t.price || 0);
  return prices.length ? Math.max(...prices) : 0;
}

// ─── Ficha pública ────────────────────────────────────────────────────────────

/**
 * Ficha pública del evento, siempre resuelta. Los borradores nacen sin ella,
 * así que devolver el objeto vacío en vez de `undefined` evita que cada
 * pantalla tenga que preguntarse si existe.
 */
export function publicProfile(e: EventItem): EventPublicProfile {
  return { ...emptyPublicProfile(), ...(e.publicProfile || {}) };
}

/** Cargo por servicio que la taquilla suma a cada asiento. */
export function serviceFee(e: EventItem): number {
  return publicProfile(e).serviceFeePerSeat ?? 45;
}

/** Lugares que genera el mapa de asientos de una categoría (filas × butacas). */
export function seatMapSeats(tier: TicketTier): number {
  const rows = tier.rowLabels?.length || 0;
  return rows * (tier.seatsPerRow || 0);
}

/** True cuando la categoría no puede sentarse: le falta la retícula de butacas. */
export function lacksSeatMap(tier: TicketTier): boolean {
  return seatMapSeats(tier) <= 0;
}

/**
 * Categorías cuyo mapa de asientos no cuadra con los lugares a la venta. El
 * cliente elige butaca sobre esa retícula, así que un descuadre significa
 * vender un boleto sin asiento que darle.
 */
export function tiersWithSeatMismatch(e: EventItem): TicketTier[] {
  return (e.ticketTiers || []).filter(t => seatMapSeats(t) > 0 && seatMapSeats(t) !== t.totalSeats);
}

/** Grupos del cartel a los que les falta algún dato que el portal muestra. */
export function slotsMissingPublicData(e: EventItem): EventLineupSlot[] {
  return lineup(e).filter(s => !s.genre?.trim() || !s.imageUrl?.trim() || !s.profileSlug?.trim() || !s.rating);
}

/**
 * Slug de perfil público sugerido a partir del nombre del grupo. Replica el
 * mismo algoritmo que usa el portal del cliente para construir `/grupo/:slug`,
 * de modo que el enlace del line-up caiga siempre en el perfil correcto.
 */
export function slugify(name: string): string {
  const COMBINING_MARKS = /[̀-ͯ]/gu;
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Cartel ───────────────────────────────────────────────────────────────────

export function lineup(e: EventItem): EventLineupSlot[] {
  return [...(e.lineup || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function headliner(e: EventItem): EventLineupSlot | null {
  const list = lineup(e);
  return list.find(s => s.isHeadliner) || list[list.length - 1] || null;
}

/** Grupos que no dependen del encargado del evento y por lo tanto deben aprobar. */
export function externalSlots(e: EventItem): EventLineupSlot[] {
  return lineup(e).filter(s => s.isExternal);
}

/** Costo propuesto por el dueño de un grupo, sumando su desglose. */
export function slotCost(slot: EventLineupSlot): number {
  if (typeof slot.agreedTotal === 'number') return slot.agreedTotal;

  // Grupo externo con tarifa publicada: el costo no se teclea, se deriva de las
  // horas contratadas. Una contraoferta solo manda cuando el dueño la aceptó;
  // mientras siga pendiente, lo pactado sigue siendo la tarifa publicada.
  if (slot.isExternal && typeof slot.publishedFee === 'number') {
    if (slot.counterOffer?.status === 'Aceptada') return slot.counterOffer.amount;
    return externalSlotFee(slot);
  }

  return (slot.costItems || []).reduce((sum, c) => sum + (c.amount || 0), 0);
}

/**
 * Tarifa de un grupo externo según las horas contratadas.
 *
 * Las horas mínimas son un piso, no un tramo proporcional: pedir menos horas de
 * las mínimas no abarata al grupo. Por encima del mínimo, cada hora extra se
 * cobra al mismo precio por hora que sale de la tarifa base.
 */
export function externalSlotFee(slot: EventLineupSlot): number {
  const base = slot.publishedFee || 0;
  const min = Math.max(1, slot.minimumHours || 1);
  const hours = slot.contractedHours || min;
  if (hours <= min) return base;
  return Math.round(base * (hours / min));
}

/** Lo que cuesta el cartel completo. */
export function lineupTotalCost(e: EventItem): number {
  return lineup(e).reduce((sum, s) => sum + slotCost(s), 0);
}

/** Costo del cartel más el equipo de sonido: el piso de gasto del evento. */
export function productionCost(e: EventItem): number {
  return lineupTotalCost(e) + (e.sound?.cost || 0);
}

/** True si a algún grupo del cartel le falta su hora de entrada. */
export function hasIncompleteSetTimes(e: EventItem): boolean {
  return lineup(e).some(s => !s.setStartTime || !s.setEndTime);
}

/** True si a algún grupo del cartel le falta el desglose de su costo. */
export function hasMissingCosts(e: EventItem): boolean {
  return lineup(e).some(s => slotCost(s) <= 0);
}

// ─── Revisión y aprobaciones ──────────────────────────────────────────────────

export function currentReviewRound(e: EventItem): EventReviewRound | null {
  const rounds = e.reviewRounds || [];
  return rounds[rounds.length - 1] || null;
}

export function reviewRoundNumber(e: EventItem): number {
  return currentReviewRound(e)?.round ?? 0;
}

export function approvals(e: EventItem): EventApproval[] {
  return currentReviewRound(e)?.approvals || [];
}

export function approvedCount(e: EventItem): number {
  return approvals(e).filter(a => a.status === 'Aprobado').length;
}

export function pendingApprovals(e: EventItem): EventApproval[] {
  return approvals(e).filter(a => a.status === 'Pendiente');
}

export function rejectedApprovals(e: EventItem): EventApproval[] {
  return approvals(e).filter(a => a.status === 'Rechazado');
}

export function hasRejection(e: EventItem): boolean {
  return rejectedApprovals(e).length > 0;
}

/** % de encargados que ya aprobaron en la ronda vigente. */
export function approvalPercent(e: EventItem): number {
  const list = approvals(e);
  if (!list.length) return 0;
  return (approvedCount(e) / list.length) * 100;
}

/** True cuando ya no falta ningún visto bueno. */
export function isFullyApproved(e: EventItem): boolean {
  const list = approvals(e);
  return list.length > 0 && list.every(a => a.status === 'Aprobado');
}

/** Todos los cambios que pidieron los encargados que rechazaron. */
export function requestedChanges(e: EventItem): string[] {
  return rejectedApprovals(e).flatMap(a => a.requestedChanges || []);
}

// ─── Publicación ──────────────────────────────────────────────────────────────

export function isScheduledToPublish(e: EventItem): boolean {
  return e.state === 'Próximo a Publicar' && !!e.publication?.scheduledAt;
}

/** Horas que faltan para la publicación automática; null si no está programada. */
export function hoursUntilPublish(e: EventItem): number | null {
  return hoursUntil(e.publication?.scheduledAt);
}

// ─── Cierre ───────────────────────────────────────────────────────────────────

export function totalExpenses(e: EventItem): number {
  return (e.closure?.expenses || []).reduce((sum, x) => sum + (x.amount || 0), 0);
}

export function totalPayouts(e: EventItem): number {
  return (e.closure?.payouts || []).reduce((sum, p) => sum + (p.agreedTotal || 0), 0);
}

export function paidPayouts(e: EventItem): number {
  return (e.closure?.payouts || []).reduce((sum, p) => sum + (p.paidAmount || 0), 0);
}

export function pendingPayoutsCount(e: EventItem): number {
  return (e.closure?.payouts || []).filter(p => p.status !== 'Pagado').length;
}

/** Utilidad del evento: taquilla menos gastos de producción y pagos a grupos. */
export function netResult(e: EventItem): number {
  const income = e.closure?.grossRevenue ?? grossTicketRevenue(e);
  return income - totalExpenses(e) - totalPayouts(e);
}

/** True cuando el reporte de cierre ya tiene lo mínimo para poder sellarse. */
export function isClosureComplete(e: EventItem): boolean {
  const c = e.closure;
  if (!c) return false;
  return typeof c.attendance === 'number'
    && typeof c.grossRevenue === 'number'
    && c.payouts.length > 0
    && pendingPayoutsCount(e) === 0;
}

export function isSealed(e: EventItem): boolean {
  return !!e.closure?.isSealed;
}

// ─── Formato ──────────────────────────────────────────────────────────────────

export function money(amount: number): string {
  return '$' + Math.round(amount || 0).toLocaleString('es-MX') + ' MXN';
}

/** "En 12 días" / "Hoy" / "Hace 3 días". */
export function relativeDays(days: number): string {
  if (!isFinite(days)) return 'Sin fecha';
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days === -1) return 'Ayer';
  if (days > 0) return 'En ' + days + ' días';
  return 'Hace ' + Math.abs(days) + ' días';
}

export function plural(n: number, singular: string, pluralWord: string): string {
  return n + ' ' + (n === 1 ? singular : pluralWord);
}

/** '2026-08-15' → '15 Ago 2026'. */
export function shortDate(iso?: string): string {
  if (!iso) return 'Sin fecha';
  const d = new Date(iso.length > 10 ? iso : iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** '2026-08-15T18:00' → '15 Ago, 18:00'. */
export function dateTimeLabel(iso?: string): string {
  if (!iso) return 'Sin definir';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) +
    ', ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}
