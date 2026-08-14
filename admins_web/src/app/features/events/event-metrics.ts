import {
  EventItem,
  EventLineupSlot,
  GroupSoundCheck,
  EventApproval,
  EventCounterOffer,
  EventManagerAgreement,
  EventProductionItem,
  EventProductionResponsibility,
  EventPublicProfile,
  EventReviewRound,
  EventState,
  LineupEngagementKind,
  ProductionCategory,
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

// La retícula de butacas de cada categoría (`rowLabels` × `seatsPerRow`) vivía
// aquí junto con su validador de "cuadra / no cuadra". Ya no existe: la
// butaquería la define el croquis y los lugares de cada categoría se cuentan del
// plano, así que no hay dos números que puedan descuadrar. Lo que se contaba
// aquí ahora se cuenta en `croquis/croquis-metrics.ts`.

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

/**
 * Vía por la que entró un grupo al cartel.
 *
 * Los eventos capturados antes de que la vía se guardara en el slot no traen
 * `engagementKind`; para esos se reconstruye como se hacía entonces: un grupo
 * ajeno cuyo manager tiene acuerdo en el evento entró co-organizando, y
 * cualquier otro por cotización directa.
 */
export function slotEngagement(e: EventItem, slot: EventLineupSlot): LineupEngagementKind {
  if (slot.engagementKind) return slot.engagementKind;
  if (!slot.isExternal) return 'propio';
  const coorganiza = (e.managerAgreements || []).some(
    a => a.role === 'coorganizador' && a.managerName === slot.managerName
  );
  return coorganiza ? 'coorganizacion' : 'cotizacion';
}

export function isQuoteSlot(e: EventItem, slot: EventLineupSlot): boolean {
  return slotEngagement(e, slot) === 'cotizacion';
}

export function isCoOrganizedSlot(e: EventItem, slot: EventLineupSlot): boolean {
  return slotEngagement(e, slot) === 'coorganizacion';
}

/**
 * Importe con el que sale la oferta al dueño del grupo: la contraoferta si el
 * organizador hizo una, y si no, la tarifa que el dueño tiene publicada por las
 * horas contratadas. Una contraoferta rechazada no cuenta — se vuelve a ofrecer
 * la tarifa publicada.
 */
export function slotOfferAmount(slot: EventLineupSlot): number {
  if (activeCounterOffer(slot)) return slotProposedFee(slot);
  // Sin tarifa publicada el grupo no tiene precio de lista: se ofrece lo que
  // sale de su desglose, que es lo mismo que ya cuesta en el cartel.
  if (typeof slot.publishedFee !== 'number') return slotCost(slot);
  return externalSlotFee(slot);
}

// ─── Lo que todavía no sale del borrador ──────────────────────────────────────

/**
 * Solicitudes de grupos ajenos que siguen sin enviarse.
 *
 * Existen porque el borrador no manda nada: el organizador arma el cartel
 * completo, decide precios y contraofertas, y todo eso sale de golpe al enviar
 * el evento a revisión.
 */
export function unsentLineupRequests(e: EventItem): EventLineupSlot[] {
  return lineup(e).filter(s => s.isExternal && s.approval === 'Sin Enviar');
}

/** Invitaciones a co-organizar que todavía no le llegan a su manager. */
export function unsentManagerInvites(e: EventItem): EventManagerAgreement[] {
  return (e.managerAgreements || []).filter(a => a.status === 'Sin Enviar');
}

/** Cuántos avisos saldrán del evento en cuanto se envíe a revisión. */
export function pendingOutboundCount(e: EventItem): number {
  return unsentLineupRequests(e).length
    + unsentManagerInvites(e).length
    + unsentResponsibilities(e).length;
}

/** Costo propuesto por el dueño de un grupo, sumando su desglose. */
export function slotCost(slot: EventLineupSlot): number {
  if (typeof slot.agreedTotal === 'number') return slot.agreedTotal;

  // Grupo externo con tarifa publicada: el costo no se teclea, se deriva de las
  // horas contratadas. Una contraoferta solo manda cuando el dueño la aceptó;
  // mientras siga pendiente, lo pactado sigue siendo la tarifa publicada.
  if (slot.isExternal && typeof slot.publishedFee === 'number') {
    if (slot.counterOffer?.status === 'Aceptada') return slotProposedFee(slot);
    return externalSlotFee(slot);
  }

  return (slot.costItems || []).reduce((sum, c) => sum + (c.amount || 0), 0);
}

/** Contraoferta que sigue viva; una rechazada ya no cuenta para nada. */
export function activeCounterOffer(slot: EventLineupSlot): EventCounterOffer | null {
  const co = slot.counterOffer;
  return co && co.status !== 'Rechazada' ? co : null;
}

/**
 * Lo que el organizador está proponiendo pagar por este grupo, ya escalado a las
 * horas del evento.
 *
 * Cuando hay contraoferta viva, ella pasa a ser la tarifa base: se propuso un
 * importe por unas horas, así que pedir más horas sube el total en la misma
 * proporción — igual que con la tarifa publicada, pero partiendo de la cifra
 * negociada y no de la de lista. Es lo que de verdad se va a pagar si el dueño
 * acepta, y por eso es lo que manda en la captura de horas y totales.
 */
export function slotProposedFee(slot: EventLineupSlot): number {
  const co = activeCounterOffer(slot);
  if (!co) return externalSlotFee(slot);

  // Sin horas de referencia la contraoferta es un importe cerrado, no una tarifa
  // por hora: escalarla ahí multiplicaría el total por las horas del evento y
  // daría una cifra absurda.
  const baseHours = co.hours ?? slot.minimumHours ?? 0;
  if (baseHours <= 0) return co.amount;

  const hours = slot.contractedHours || baseHours;
  if (hours <= baseHours) return co.amount;
  return Math.round(co.amount * (hours / baseHours));
}

/**
 * Lo que costaría el grupo a su tarifa de lista por esas mismas horas. Es la
 * referencia contra la que se mide la contraoferta.
 */
export function slotPublishedTotal(slot: EventLineupSlot): number {
  return typeof slot.publishedFee === 'number' ? externalSlotFee(slot) : slotCost(slot);
}

/** Cuánto se ahorra con la contraoferta; negativo si se está pagando de más. */
export function counterOfferSavings(slot: EventLineupSlot): number {
  return slotPublishedTotal(slot) - slotProposedFee(slot);
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

// ─── Desglose de producción ───────────────────────────────────────────────────

export function productionItems(e: EventItem): EventProductionItem[] {
  return e.productionItems || [];
}

/** Lo capturado en el desglose de producción, sin el cartel ni el audio. */
export function productionItemsCost(e: EventItem): number {
  return productionItems(e).reduce((sum, i) => sum + (i.amount || 0), 0);
}

/**
 * Gasto de producción por rubro, de mayor a menor.
 *
 * Ordenado por importe y no por el orden del catálogo porque la pregunta que
 * responde es "¿en qué se nos fue el dinero?", y esa se contesta leyendo el
 * primer renglón.
 */
export function productionCostByCategory(e: EventItem): { category: ProductionCategory; amount: number; count: number }[] {
  const totals = new Map<ProductionCategory, { amount: number; count: number }>();
  for (const item of productionItems(e)) {
    const acc = totals.get(item.category) ?? { amount: 0, count: 0 };
    totals.set(item.category, { amount: acc.amount + (item.amount || 0), count: acc.count + 1 });
  }
  return [...totals.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Cuánto de lo desglosado ya es un compromiso firme.
 *
 * Un total lleno de partidas 'Estimado' es un presupuesto de servilleta; el
 * mismo total en 'Contratado' es dinero que ya se debe. Distinguirlos evita la
 * sorpresa de que el evento "salga caro de repente".
 */
export function productionCommittedCost(e: EventItem): number {
  return productionItems(e)
    .filter(i => i.status === 'Contratado' || i.status === 'Pagado')
    .reduce((sum, i) => sum + (i.amount || 0), 0);
}

export function productionPaidCost(e: EventItem): number {
  return productionItems(e)
    .filter(i => i.status === 'Pagado')
    .reduce((sum, i) => sum + (i.amount || 0), 0);
}

/** Costo total del evento: cartel + equipo de audio + desglose de producción. */
export function productionCost(e: EventItem): number {
  return lineupTotalCost(e) + (e.sound?.cost || 0) + productionItemsCost(e);
}

// ─── Reparto de rubros entre managers ─────────────────────────────────────────

export function productionResponsibilities(e: EventItem): EventProductionResponsibility[] {
  return e.productionResponsibilities || [];
}

/** Encargo de un rubro, si es que se le pasó a alguien. */
export function responsibilityFor(e: EventItem, category: ProductionCategory): EventProductionResponsibility | null {
  return productionResponsibilities(e).find(r => r.category === category) ?? null;
}

/** Encargos decididos en el borrador que todavía no le llegan a su manager. */
export function unsentResponsibilities(e: EventItem): EventProductionResponsibility[] {
  return productionResponsibilities(e).filter(r => r.status === 'Sin Enviar');
}

/** Quién arma el evento y responde por él. */
export function groupSoundChecks(e: EventItem): GroupSoundCheck[] {
  return e.soundChecks || [];
}

export function organizerName(e: EventItem): string {
  return e.ownerManagerName || e.createdBy || 'Organizador';
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

// ─── Publicación & Validación Integral ────────────────────────────────────────

export function isScheduledToPublish(e: EventItem): boolean {
  return e.state === 'Próximo a Publicar' && !!e.publication?.scheduledAt;
}

/** Horas que faltan para la publicación automática; null si no está programada. */
export function hoursUntilPublish(e: EventItem): number | null {
  return hoursUntil(e.publication?.scheduledAt);
}

/** True si todas las solicitudes de aprobación de grupos externos están resueltas (sin pendientes). */
export function allReviewApprovalsResolved(e: EventItem): boolean {
  const list = approvals(e);
  if (!list.length) return true;
  return list.every(a => a.status === 'Aprobado' || a.status === 'Rechazado');
}

/** True si todas las invitaciones a managers co-organizadores fueron resueltas. */
export function allAgreementsResolved(e: EventItem): boolean {
  const agrs = e.managerAgreements || [];
  return !agrs.some(a => a.status === 'Pendiente' || a.status === 'Sin Enviar');
}

/** True si todos los encargos de producción fueron resueltos. */
export function allResponsibilitiesResolved(e: EventItem): boolean {
  const resps = e.productionResponsibilities || [];
  return !resps.some(r => r.status === 'Pendiente' || r.status === 'Sin Enviar');
}

/** True si no hay transferencias de tareas pendientes de respuesta. */
export function allTaskTransfersResolved(e: EventItem): boolean {
  return !(e.tasks || []).some(t => t.pendingTransfer?.status === 'pendiente');
}

/** True si no hay propuestas de cambio pendientes sobre ningún campo. */
export function allFieldProposalsResolved(e: EventItem): boolean {
  return !(e.tasks || []).some(t => (t.changeProposals || []).some(p => p.status === 'pendiente'));
}

export interface PublishReadiness {
  canPublish: boolean;
  missingRequirements: string[];
  pendingRequestsCount: number;
}

/**
 * Valida si un evento en revisión cumple con todas las condiciones para poder publicarse:
 * 1. Todos los 33 puntos obligatorios del checklist capturados.
 * 2. Todas las solicitudes (grupos, invitaciones, tareas, propuestas) resueltas (aceptadas o rechazadas).
 */
export function evaluatePublishReadiness(e: EventItem, missingRequiredCount: number): PublishReadiness {
  const missingRequirements: string[] = [];

  if (missingRequiredCount > 0) {
    missingRequirements.push(`Faltan ${missingRequiredCount} punto(s) obligatorios del expediente por capturar.`);
  }

  const pendingApprovalsCount = pendingApprovals(e).length;
  if (pendingApprovalsCount > 0) {
    missingRequirements.push(`${pendingApprovalsCount} solicitud(es) de aprobación de grupo siguen pendientes de respuesta.`);
  }

  const pendingAgreementsCount = (e.managerAgreements || []).filter(a => a.status === 'Pendiente' || a.status === 'Sin Enviar').length;
  if (pendingAgreementsCount > 0) {
    missingRequirements.push(`${pendingAgreementsCount} invitación(es) a co-organizar siguen sin respuesta o por enviar.`);
  }

  const pendingResponsibilitiesCount = (e.productionResponsibilities || []).filter(r => r.status === 'Pendiente' || r.status === 'Sin Enviar').length;
  if (pendingResponsibilitiesCount > 0) {
    missingRequirements.push(`${pendingResponsibilitiesCount} encargo(s) de producción siguen pendientes de respuesta.`);
  }

  const pendingTransfersCount = (e.tasks || []).filter(t => t.pendingTransfer?.status === 'pendiente').length;
  if (pendingTransfersCount > 0) {
    missingRequirements.push(`${pendingTransfersCount} transferencia(s) de tareas esperan respuesta de su destinatario.`);
  }

  const pendingProposalsCount = (e.tasks || []).reduce(
    (sum, t) => sum + (t.changeProposals || []).filter(p => p.status === 'pendiente').length,
    0
  );
  if (pendingProposalsCount > 0) {
    missingRequirements.push(`${pendingProposalsCount} propuesta(s) de cambio en campos siguen por decidir.`);
  }

  const totalPending = pendingApprovalsCount + pendingAgreementsCount + pendingResponsibilitiesCount + pendingTransfersCount + pendingProposalsCount;

  return {
    canPublish: missingRequiredCount === 0 && totalPending === 0,
    missingRequirements,
    pendingRequestsCount: totalPending
  };
}

// ─── Cierre & Confirmación de Managers ────────────────────────────────────────

export function participatingManagers(e: EventItem): string[] {
  const agrs = (e.managerAgreements || []).map(a => a.managerName).filter(Boolean);
  const owner = organizerName(e);
  const set = new Set<string>(agrs);
  if (owner) set.add(owner);
  return Array.from(set);
}

/**
 * True si todos los managers involucrados en el evento han firmado/confirmado el finiquito de cierre.
 * Si es 1 solo manager (organizador único), se confirma de inmediato.
 */
/**
 * Si el expediente ya puede sellarse.
 *
 * Con varias disqueras hace falta la firma de todas: el cierre reparte dinero y
 * nadie puede darlo por bueno en nombre de otro. Con una sola no hay a quién
 * esperar, y exigirle además el reporte de cierre convertía "puede cerrar cuando
 * quiera" en "puede cerrar cuando termine el papeleo" — que es justo lo que la
 * regla quería evitar para el organizador que va solo.
 */
export function allManagersConfirmedClosure(e: EventItem): boolean {
  const managers = participatingManagers(e);
  if (managers.length <= 1) {
    return true;
  }

  const confirmations = e.closure?.managerConfirmations || [];
  const confirmedSet = new Set(confirmations.map(c => c.managerName));
  return managers.every(m => confirmedSet.has(m)) && isClosureComplete(e);
}

/** Verifica si quien mira es el creador original / organizador del evento. */
export function isEventCreator(e: EventItem, actorNameOrManager?: string): boolean {
  if (!actorNameOrManager) return false;
  const owner = organizerName(e);
  if (owner && owner.toLowerCase() === actorNameOrManager.toLowerCase()) return true;
  if (e.createdBy && e.createdBy.toLowerCase() === actorNameOrManager.toLowerCase()) return true;
  return false;
}

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

// ─── El calendario contra el estado ───────────────────────────────────────────

/**
 * Si la venta anticipada ya cerró.
 *
 * `salesCloseDaysBefore` es un punto obligatorio del expediente y hasta ahora su
 * valor solo servía para pintar una frase: nadie lo comparaba nunca con el
 * calendario. Un evento con "la venta cierra 3 días antes" seguía figurando como
 * si vendiera la víspera del show, y el encargado no tenía cómo saber que la
 * taquilla en línea ya estaba muerta.
 */
export function salesAreClosed(e: EventItem, today = new Date()): boolean {
  if (e.state !== 'Publicado' && e.state !== 'En Venta') return false;

  const days = publicProfile(e).salesCloseDaysBefore;
  if (days == null || !e.date) return false;

  const corte = new Date(e.date + 'T00:00:00');
  if (isNaN(corte.getTime())) return false;
  corte.setDate(corte.getDate() - days);

  return today.getTime() >= corte.getTime();
}

/**
 * Un evento al que se le pasó la fecha sin llegar a publicarse.
 *
 * No se concluye solo —nunca ocurrió— ni se cancela —nadie lo decidió—, así que
 * se queda flotando en su fase para siempre. Es la peor forma de perder un
 * evento: no aparece en ninguna alarma porque técnicamente todo está en orden.
 */
export function isStaleUnpublished(e: EventItem, today = new Date()): boolean {
  const vivos: EventState[] = ['Borrador', 'En Revisión', 'Próximo a Publicar'];
  if (!vivos.includes(e.state) || !e.date) return false;

  const dia = new Date(e.date + 'T00:00:00');
  if (isNaN(dia.getTime())) return false;
  return today.getTime() >= new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1).getTime();
}
