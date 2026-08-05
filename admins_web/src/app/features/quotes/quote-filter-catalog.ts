import { Quote, QuoteState, PaymentMilestone } from '../../core/models/admin.models';

/**
 * Catálogo de filtros del módulo de cotizaciones.
 *
 * Módulo puro (sin inyección de dependencias) para que las definiciones de
 * filtros y sus predicados vivan separados de la plantilla y se puedan probar
 * de forma aislada.
 *
 * Hay dos familias de filtros, y cada vista usa la que le corresponde:
 *
 * - **Contextuales por estado**: dependen de la fase concreta del pipeline
 *   ("¿ya firmó?", "¿en qué ronda va?"). Los usa el Kanban en cada columna y la
 *   Tabla cuando hay un estado seleccionado.
 * - **Transversales**: cruzan todos los estados ("¿hay algo urgente?", "¿quién
 *   debe dinero?"). Los usa la Tabla cuando se ven todos los estados juntos,
 *   donde un filtro por fase no tendría sentido.
 */
export interface QuoteFilterOption {
  value: string;
  label: string;
  icon: string;
  /** Clases Tailwind aplicadas cuando el chip está activo. */
  activeClass: string;
  match: (q: Quote) => boolean;
}

// ─── Predicados de apoyo ──────────────────────────────────────────────────────

function milestones(q: Quote): PaymentMilestone[] {
  return q.paymentMilestones || [];
}

/** Días entre hoy y la fecha del evento (negativo si ya pasó). */
export function daysUntilEvent(q: Quote): number {
  const target = new Date(q.proposedDate + 'T00:00:00');
  if (isNaN(target.getTime())) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function paidMilestonesCount(q: Quote): number {
  return milestones(q).filter(m => m.status === 'Pagado').length;
}

export function totalMilestonesCount(q: Quote): number {
  return milestones(q).length;
}

/**
 * Monto ya cobrado. Cuando la cotización no tiene hitos itemizados se recurre a
 * `paymentStatus`, igual que hacen `paidAmountPercent` e `isQuoteFullyPaid`: sin
 * ese respaldo, una cotización marcada como liquidada al 100% pero sin hitos
 * (por ejemplo COT-8904) reportaría cero cobrado y contradiría al resto de la UI.
 */
export function paidAmount(q: Quote): number {
  const list = milestones(q);
  if (list.length === 0) {
    if (q.paymentStatus === 'Pago Confirmado 100%') return q.totalAmount || 0;
    if (q.paymentStatus === 'Anticipo 50%') return (q.totalAmount || 0) * 0.5;
    return 0;
  }
  return list
    .filter(m => m.status === 'Pagado')
    .reduce((sum, m) => sum + (m.paidAmount ?? m.amountCalculated ?? 0), 0);
}

export function paidAmountPercent(q: Quote): number {
  const list = milestones(q);
  if (!q.totalAmount || list.length === 0) {
    return q.paymentStatus === 'Pago Confirmado 100%' ? 100 : 0;
  }
  return Math.min(100, (paidAmount(q) / q.totalAmount) * 100);
}

export function isQuoteFullyPaid(q: Quote): boolean {
  const list = milestones(q);
  if (list.length === 0) return q.paymentStatus === 'Pago Confirmado 100%';
  return list.every(m => m.status === 'Pagado');
}

export function hasOverdueMilestone(q: Quote): boolean {
  return milestones(q).some(m => m.status === 'Vencido' || m.status === 'Moratorio') || !!q.isDeferred;
}

export function overdueMilestonesCount(q: Quote): number {
  return milestones(q).filter(m => m.status === 'Vencido' || m.status === 'Moratorio').length;
}

export function hasContractDocument(q: Quote): boolean {
  return q.contractStatus === 'Generado' || q.contractStatus === 'Subido' || q.contractStatus === 'Firmado' || !!q.contractFileUrl || !!q.contractPdfUrl;
}

export function hasAdvancePaid(q: Quote): boolean {
  return q.paymentStatus !== 'Pendiente' || paidMilestonesCount(q) > 0;
}

export function lastIncident(q: Quote) {
  const list = q.incidents || [];
  return list[list.length - 1] || null;
}

export function hasActiveIncident(q: Quote): boolean {
  return (q.incidents || []).some(i => i.status !== 'Resuelto');
}

function isSevereIncident(q: Quote): boolean {
  return lastIncident(q)?.status === 'Imprevisto Grave';
}

function isAwaitingIncidentReply(q: Quote): boolean {
  const list = q.incidentNegotiations || [];
  return list[list.length - 1]?.status === 'Enviada';
}

/** Monto que quedaría por reembolsar (pagado menos el anticipo de separación retenido). */
export function refundDue(q: Quote): number {
  const type = q.advancePaymentType || 'percentage';
  const val = q.advancePaymentValue ?? 50;
  const retained = type === 'percentage' ? (q.totalAmount || 0) * (val / 100) : val;
  return Math.max(0, paidAmount(q) - retained);
}

// ─── Filtros contextuales por estado ─────────────────────────────────────────

const TODAS: QuoteFilterOption = {
  value: 'todas',
  label: 'Todas',
  icon: 'apps',
  activeClass: 'bg-primary text-on-primary border-primary shadow-sm',
  match: () => true
};

const EMERALD = 'bg-emerald-500/25 text-emerald-300 border-emerald-400/60 shadow-sm';
const AMBER = 'bg-amber-500/25 text-amber-300 border-amber-400/60 shadow-sm';
const ROSE = 'bg-rose-500/25 text-rose-300 border-rose-400/60 shadow-sm';
const CYAN = 'bg-cyan-500/25 text-cyan-300 border-cyan-400/60 shadow-sm';
const PURPLE = 'bg-purple-500/25 text-purple-300 border-purple-400/60 shadow-sm';
const ORANGE = 'bg-orange-500/25 text-orange-300 border-orange-400/60 shadow-sm';
const SLATE = 'bg-slate-500/30 text-slate-200 border-slate-400/60 shadow-sm';

/** Título de la barra de filtros, nombrando la dimensión que se filtra en esa fase. */
export function stateFilterLabel(state: QuoteState): string {
  switch (state) {
    case 'En revisión': return 'Filtrar por Urgencia:';
    case 'Propuesta enviada': return 'Filtrar por Respuesta:';
    case 'Negociación': return 'Filtrar por Ronda:';
    case 'Aceptada': return 'Filtrar por Contrato:';
    case 'Contrato en espera de firma': return 'Filtrar por Firma:';
    case 'Contrato firmado': return 'Filtrar por Cobranza:';
    case 'Finalizada': return 'Filtrar por Cobranza:';
    case 'Cancelada con Imprevisto': return 'Filtrar por Imprevisto:';
    case 'Imprevisto Enviado': return 'Filtrar por Resolución:';
    case 'Cancelada': return 'Filtrar por Reembolso:';
    default: return 'Filtrar por:';
  }
}

/** Filtros que de verdad importan en cada fase. La primera opción siempre es "Todas". */
export function stateFilterOptions(state: QuoteState): QuoteFilterOption[] {
  switch (state) {
    case 'En revisión':
      return [TODAS,
        { value: 'urgente', label: 'Fecha Urgente (≤30 días)', icon: 'bolt', activeClass: ROSE, match: q => daysUntilEvent(q) <= 30 },
        { value: 'holgura', label: 'Con Holgura', icon: 'event_available', activeClass: CYAN, match: q => daysUntilEvent(q) > 30 }
      ];

    case 'Propuesta enviada':
      return [TODAS,
        { value: 'sin_respuesta', label: 'Sin Respuesta del Cliente', icon: 'schedule_send', activeClass: CYAN, match: q => (q.negotiationRound ?? 0) === 0 },
        { value: 'negociando', label: 'En Negociación', icon: 'handshake', activeClass: AMBER, match: q => (q.negotiationRound ?? 0) > 0 }
      ];

    case 'Negociación':
      return [TODAS,
        { value: 'inicial', label: 'Ronda Inicial (≤2)', icon: 'handshake', activeClass: EMERALD, match: q => (q.negotiationRound ?? 0) <= 2 },
        { value: 'extendida', label: 'Negociación Extendida (≥3)', icon: 'warning', activeClass: ROSE, match: q => (q.negotiationRound ?? 0) >= 3 }
      ];

    case 'Aceptada':
      return [TODAS,
        { value: 'contrato_listo', label: 'Contrato Generado', icon: 'description', activeClass: EMERALD, match: q => hasContractDocument(q) },
        { value: 'contrato_pendiente', label: 'Contrato Pendiente', icon: 'pending', activeClass: AMBER, match: q => !hasContractDocument(q) },
        { value: 'grupo_sin_avisar', label: 'Grupo Sin Notificar', icon: 'notifications_off', activeClass: ORANGE, match: q => !q.artistNotified }
      ];

    case 'Contrato en espera de firma':
      return [TODAS,
        { value: 'firmado', label: 'Firmado por el Cliente', icon: 'draw', activeClass: EMERALD, match: q => q.contractStatus === 'Firmado' },
        { value: 'sin_firmar', label: 'En Espera de Firma', icon: 'hourglass_top', activeClass: AMBER, match: q => q.contractStatus !== 'Firmado' }
      ];

    // Absorbe los filtros que antes vivían en 'Pago confirmado': ahora que ese
    // estado no existe, la liquidación y la cercanía del evento se consultan aquí.
    case 'Contrato firmado':
      return [TODAS,
        { value: 'anticipo_ok', label: 'Anticipo Recibido', icon: 'savings', activeClass: EMERALD, match: q => hasAdvancePaid(q) },
        { value: 'anticipo_pendiente', label: 'Anticipo Pendiente', icon: 'hourglass_empty', activeClass: AMBER, match: q => !hasAdvancePaid(q) },
        { value: 'liquidado', label: 'Liquidado al 100%', icon: 'verified', activeClass: EMERALD, match: q => isQuoteFullyPaid(q) },
        { value: 'evento_proximo', label: 'Evento Próximo (≤30 días)', icon: 'event_upcoming', activeClass: CYAN, match: q => daysUntilEvent(q) <= 30 }
      ];

    case 'Finalizada':
      return [TODAS,
        { value: 'finalizada', label: 'Totalmente Finalizada', icon: 'task_alt', activeClass: EMERALD, match: q => isQuoteFullyPaid(q) },
        { value: 'pendiente', label: 'Pago Pendiente', icon: 'hourglass_top', activeClass: AMBER, match: q => !isQuoteFullyPaid(q) && !hasOverdueMilestone(q) },
        { value: 'atrasada', label: 'Pago Atrasado', icon: 'warning', activeClass: ROSE, match: q => hasOverdueMilestone(q) }
      ];

    case 'Cancelada con Imprevisto':
      return [TODAS,
        { value: 'grave', label: 'Imprevisto Grave', icon: 'report_problem', activeClass: ROSE, match: q => isSevereIncident(q) },
        { value: 'sin_propuesta', label: 'Sin Propuesta Enviada', icon: 'outgoing_mail', activeClass: AMBER, match: q => (q.incidentNegotiations?.length ?? 0) === 0 },
        { value: 'por_grupo', label: 'Originado por el Grupo', icon: 'music_note', activeClass: PURPLE, match: q => lastIncident(q)?.initiatedBy === 'Grupo Musical' }
      ];

    case 'Imprevisto Enviado':
      return [TODAS,
        { value: 'esperando', label: 'Esperando Respuesta', icon: 'hourglass_top', activeClass: CYAN, match: q => isAwaitingIncidentReply(q) },
        { value: 'con_rechazo', label: 'Con Rechazo Previo', icon: 'thumb_down', activeClass: ROSE, match: q => (q.incidentNegotiations || []).some(n => n.status === 'Rechazada') }
      ];

    case 'Cancelada':
      return [TODAS,
        { value: 'reembolso', label: 'Con Reembolso Pendiente', icon: 'currency_exchange', activeClass: EMERALD, match: q => refundDue(q) > 0 },
        { value: 'sin_reembolso', label: 'Sin Saldo a Favor', icon: 'money_off', activeClass: SLATE, match: q => refundDue(q) <= 0 },
        { value: 'sellada', label: 'Expediente Sellado', icon: 'lock', activeClass: PURPLE, match: q => !!q.isCycleSealed }
      ];

    default:
      return [TODAS];
  }
}

// ─── Filtros transversales (Vista Tabla con todos los estados) ───────────────

/**
 * Filtros que aplican sin importar la fase. En la Tabla, donde las cotizaciones
 * se ven todas juntas, un filtro por fase no aplicaría; lo que interesa ahí es
 * detectar de un golpe qué expedientes necesitan atención.
 */
export function transversalFilterOptions(): QuoteFilterOption[] {
  return [TODAS,
    { value: 'urgente', label: 'Evento Urgente (≤30 días)', icon: 'bolt', activeClass: ROSE, match: q => daysUntilEvent(q) >= 0 && daysUntilEvent(q) <= 30 },
    { value: 'pago_atrasado', label: 'Pago Atrasado', icon: 'warning', activeClass: ROSE, match: q => hasOverdueMilestone(q) },
    { value: 'anticipo_pendiente', label: 'Anticipo Pendiente', icon: 'hourglass_empty', activeClass: AMBER, match: q => !hasAdvancePaid(q) },
    { value: 'contrato_sin_firmar', label: 'Contrato Sin Firmar', icon: 'draw', activeClass: ORANGE, match: q => q.contractStatus !== 'Firmado' },
    { value: 'imprevisto_activo', label: 'Con Imprevisto Activo', icon: 'report_problem', activeClass: PURPLE, match: q => hasActiveIncident(q) },
    { value: 'grupo_sin_notificar', label: 'Sin Notificar al Grupo', icon: 'notifications_off', activeClass: CYAN, match: q => !q.artistNotified }
  ];
}

export const TRANSVERSAL_FILTER_LABEL = 'Filtrar por Atención Requerida:';
