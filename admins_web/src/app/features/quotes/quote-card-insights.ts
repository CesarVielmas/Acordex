import { Quote, QuoteState } from '../../core/models/admin.models';
import {
  daysUntilEvent,
  hasAdvancePaid,
  hasContractDocument,
  hasOverdueMilestone,
  isQuoteFullyPaid,
  paidAmount,
  paidAmountPercent,
  paidMilestonesCount,
  totalMilestonesCount,
  refundDue,
  lastIncident,
  hasActiveIncident
} from './quote-filter-catalog';

/**
 * Qué información describe de verdad a una cotización en cada fase.
 *
 * Antes, tanto las tarjetas del Kanban como el encabezado de cada columna
 * mostraban siempre lo mismo: "Monto Propuesto" y "Subtotal del Estado". Eso es
 * engañoso en las fases tempranas, porque en 'En revisión' o 'Propuesta enviada'
 * todavía no hay un costo pactado — la cifra existe, pero no significa nada
 * firme. El monto solo pasa a ser un dato real a partir de 'Aceptada'.
 *
 * Este módulo decide, por estado, cuál es el dato que importa: días para el
 * evento mientras se evalúa, rondas mientras se negocia, avance de cobranza una
 * vez firmado, monto a reembolsar cuando se cancela. Es un módulo puro, como
 * `quote-filter-catalog.ts`, y reutiliza sus mismos predicados para que los
 * tags, los filtros y las métricas nunca se contradigan entre sí.
 */

export type QuoteTagTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface QuoteTag {
  label: string;
  icon: string;
  tone: QuoteTagTone;
}

export interface QuoteHighlight {
  /** Qué se está midiendo. */
  caption: string;
  /** El valor, ya formateado. */
  value: string;
  /** Matiz opcional bajo el valor. */
  hint?: string;
  /**
   * True cuando el valor todavía no es un compromiso firme (por ejemplo, el
   * monto de una propuesta que el cliente aún no acepta). La tarjeta lo marca
   * visualmente para no dar una cifra por definitiva.
   */
  tentative?: boolean;
}

// ─── Utilidades de formato ───────────────────────────────────────────────────

function money(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('es-MX') + ' MXN';
}

/** "en 12 días" / "hoy" / "hace 3 días". */
function relativeDays(days: number): string {
  if (!isFinite(days)) return 'Sin fecha';
  if (days === 0) return 'Hoy';
  if (days > 0) return 'En ' + days + (days === 1 ? ' día' : ' días');
  const past = Math.abs(days);
  return 'Hace ' + past + (past === 1 ? ' día' : ' días');
}

function plural(n: number, singular: string, pluralWord: string): string {
  return n + ' ' + (n === 1 ? singular : pluralWord);
}

/** Días transcurridos desde una fecha ISO; null si no hay fecha válida. */
function daysSince(iso?: string): number | null {
  if (!iso) return null;
  const from = new Date(iso.length > 10 ? iso : iso + 'T00:00:00');
  if (isNaN(from.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - from.getTime()) / 86400000));
}

// ─── Dato principal de la tarjeta ────────────────────────────────────────────

/**
 * El dato que mejor describe a esta cotización según su fase.
 * `canViewFinances` en false devuelve la variante no financiera, igual que hacía
 * la tarjeta antes con el aforo proyectado.
 */
export function cardHighlight(q: Quote, canViewFinances: boolean): QuoteHighlight {
  const days = daysUntilEvent(q);

  switch (q.state) {
    case 'En revisión':
      return {
        caption: 'Evento solicitado',
        value: relativeDays(days),
        hint: q.proposedDate + (days >= 0 && days <= 30 ? ' · requiere atención pronta' : '')
      };

    case 'Propuesta enviada': {
      const waiting = daysSince(q.dateCreated);
      const hint = (q.negotiationRound ?? 0) > 0
        ? 'El cliente respondió: ronda #' + q.negotiationRound
        : (waiting !== null ? 'Sin respuesta desde hace ' + plural(waiting, 'día', 'días') : 'En espera de respuesta');
      if (!canViewFinances) {
        return { caption: 'Propuesta enviada', value: relativeDays(days), hint };
      }
      return { caption: 'Monto propuesto', value: money(q.totalAmount || 0), hint, tentative: true };
    }

    case 'Negociación': {
      const round = q.negotiationRound ?? 0;
      const history = q.negotiationHistory || [];
      const first = history[0]?.totalOffered;
      const gap = first && q.totalAmount ? q.totalAmount - first : 0;
      const hint = canViewFinances && gap !== 0
        ? (gap > 0 ? 'Subió ' : 'Bajó ') + money(Math.abs(gap)) + ' vs. la primera oferta'
        : 'Ajustando condiciones con el cliente';
      return { caption: 'Negociación en curso', value: 'Ronda #' + (round || 1), hint };
    }

    case 'Aceptada': {
      const hint = hasContractDocument(q) ? 'Contrato generado, listo para firma' : 'Falta generar el contrato';
      if (!canViewFinances) {
        return { caption: 'Cotización aceptada', value: relativeDays(days), hint };
      }
      return { caption: 'Monto acordado', value: money(q.totalAmount || 0), hint };
    }

    case 'Contrato en espera de firma': {
      const waiting = daysSince(q.dateCreated);
      return {
        caption: 'Esperando firma',
        value: waiting !== null ? plural(waiting, 'día', 'días') : 'En espera',
        hint: q.contractStatus === 'Firmado' ? 'Firmado por el cliente' : 'Documento enviado, sin firmar'
      };
    }

    case 'Contrato firmado': {
      const percent = Math.round(paidAmountPercent(q));
      if (!canViewFinances) {
        return { caption: 'Contrato firmado', value: relativeDays(days), hint: 'Evento confirmado en agenda' };
      }
      return {
        caption: 'Cobrado',
        value: percent + '% de ' + money(q.totalAmount || 0),
        hint: hasAdvancePaid(q) ? 'Anticipo recibido' : 'Anticipo pendiente'
      };
    }

    case 'Finalizada': {
      const paid = paidMilestonesCount(q);
      const total = totalMilestonesCount(q);
      const hint = isQuoteFullyPaid(q)
        ? 'Totalmente liquidada'
        : (hasOverdueMilestone(q) ? 'Con pagos vencidos' : Math.round(paidAmountPercent(q)) + '% cobrado');
      return {
        caption: 'Hitos de pago',
        value: total > 0 ? paid + ' de ' + total + ' pagados' : 'Sin hitos registrados',
        hint
      };
    }

    case 'Cancelada con Imprevisto': {
      const incident = lastIncident(q);
      const rounds = q.incidentNegotiations?.length ?? 0;
      return {
        caption: 'Imprevisto activo',
        value: incident?.initiatedBy ? 'Originado por ' + incident.initiatedBy : 'Registrado',
        hint: rounds === 0 ? 'Sin propuesta de resolución enviada' : plural(rounds, 'propuesta enviada', 'propuestas enviadas')
      };
    }

    case 'Imprevisto Enviado': {
      const pending = (q.incidentNegotiations || [])[(q.incidentNegotiations?.length ?? 1) - 1];
      return {
        caption: 'Propuesta enviada',
        value: pending ? resolutionLabel(pending.resolutionType) : 'En espera',
        hint: 'Esperando la decisión del cliente'
      };
    }

    case 'Cancelada': {
      const refund = refundDue(q);
      if (!canViewFinances) {
        return { caption: 'Expediente cancelado', value: 'Cerrado', hint: 'Fecha liberada en agenda' };
      }
      return {
        caption: 'Monto a reembolsar',
        value: refund > 0 ? money(refund) : 'Sin saldo a favor',
        hint: refund > 0 ? 'Descontando la separación no reembolsable' : 'La separación cubre lo pagado'
      };
    }

    default:
      return { caption: 'Evento', value: relativeDays(days), hint: q.proposedDate };
  }
}

function resolutionLabel(type: string): string {
  switch (type) {
    case 'reschedule': return 'Cambio de fecha';
    case 'group_change': return 'Cambio de grupo';
    case 'substitute_group': return 'Grupo sustituto';
    case 'apology_discount': return 'Disculpa + descuento';
    case 'refund': return 'Devolución';
    default: return 'Propuesta';
  }
}

// ─── Tags contextuales ───────────────────────────────────────────────────────

/**
 * Señales que conviene ver sin abrir el modal. Solo se emiten las que aplican,
 * y se limitan a cuatro para que la tarjeta no se sature.
 */
export function cardTags(q: Quote): QuoteTag[] {
  const tags: QuoteTag[] = [];
  const days = daysUntilEvent(q);
  const isClosed = q.state === 'Finalizada' || q.state === 'Cancelada';

  if (!isClosed && days >= 0 && days <= 30) {
    tags.push({ label: 'Evento urgente', icon: 'bolt', tone: 'danger' });
  }

  if (hasOverdueMilestone(q)) {
    tags.push({ label: 'Pago atrasado', icon: 'warning', tone: 'danger' });
  }

  if (hasActiveIncident(q)) {
    tags.push({ label: 'Imprevisto activo', icon: 'report_problem', tone: 'danger' });
  }

  switch (q.state) {
    case 'Propuesta enviada':
      if ((q.negotiationRound ?? 0) === 0) {
        tags.push({ label: 'Sin respuesta', icon: 'schedule_send', tone: 'info' });
      } else {
        tags.push({ label: 'Ronda #' + q.negotiationRound, icon: 'handshake', tone: 'warning' });
      }
      break;

    case 'Negociación':
      if ((q.negotiationRound ?? 0) >= 3) {
        tags.push({ label: 'Negociación extendida', icon: 'priority_high', tone: 'warning' });
      }
      break;

    case 'Aceptada':
      tags.push(hasContractDocument(q)
        ? { label: 'Contrato generado', icon: 'description', tone: 'success' }
        : { label: 'Contrato pendiente', icon: 'pending', tone: 'warning' });
      if (!q.artistNotified) {
        tags.push({ label: 'Grupo sin notificar', icon: 'notifications_off', tone: 'warning' });
      }
      break;

    case 'Contrato en espera de firma':
      tags.push(q.contractStatus === 'Firmado'
        ? { label: 'Firmado por el cliente', icon: 'draw', tone: 'success' }
        : { label: 'Sin firmar', icon: 'hourglass_top', tone: 'warning' });
      break;

    case 'Contrato firmado':
      tags.push(hasAdvancePaid(q)
        ? { label: 'Anticipo recibido', icon: 'savings', tone: 'success' }
        : { label: 'Anticipo pendiente', icon: 'hourglass_empty', tone: 'warning' });
      break;

    case 'Finalizada':
      if (isQuoteFullyPaid(q)) {
        tags.push({ label: 'Liquidada', icon: 'task_alt', tone: 'success' });
      }
      if (q.isCycleSealed) {
        tags.push({ label: 'Expediente sellado', icon: 'lock', tone: 'neutral' });
      }
      break;

    case 'Cancelada con Imprevisto':
      if (lastIncident(q)?.status === 'Imprevisto Grave') {
        tags.push({ label: 'Imprevisto grave', icon: 'crisis_alert', tone: 'danger' });
      }
      if ((q.incidentNegotiations?.length ?? 0) === 0) {
        tags.push({ label: 'Sin propuesta', icon: 'outgoing_mail', tone: 'warning' });
      }
      break;

    case 'Imprevisto Enviado':
      if ((q.incidentNegotiations || []).some(n => n.status === 'Rechazada')) {
        tags.push({ label: 'Con rechazo previo', icon: 'thumb_down', tone: 'danger' });
      }
      break;

    case 'Cancelada':
      if (refundDue(q) > 0) {
        tags.push({ label: 'Reembolso pendiente', icon: 'currency_exchange', tone: 'warning' });
      }
      break;
  }

  return tags.slice(0, 4);
}

// ─── Resumen del encabezado de cada columna ──────────────────────────────────

/**
 * Lo que resume mejor a un grupo de cotizaciones en esa fase. Reemplaza al
 * "Subtotal del Estado", que solo tenía sentido donde el monto ya es firme.
 */
export function stateSummary(state: QuoteState, quotes: Quote[], canViewFinances: boolean): string {
  const n = quotes.length;
  if (n === 0) return 'Sin cotizaciones';

  const sum = (fn: (q: Quote) => number) => quotes.reduce((acc, q) => acc + fn(q), 0);
  const count = (fn: (q: Quote) => boolean) => quotes.filter(fn).length;

  switch (state) {
    case 'En revisión': {
      const urgent = count(q => daysUntilEvent(q) >= 0 && daysUntilEvent(q) <= 30);
      return plural(n, 'solicitud por evaluar', 'solicitudes por evaluar') +
        (urgent > 0 ? ' · ' + urgent + ' con fecha urgente' : '');
    }

    case 'Propuesta enviada': {
      const silent = count(q => (q.negotiationRound ?? 0) === 0);
      return plural(n, 'propuesta enviada', 'propuestas enviadas') + ' · ' + silent + ' sin respuesta';
    }

    case 'Negociación': {
      const avg = sum(q => q.negotiationRound ?? 0) / n;
      const extended = count(q => (q.negotiationRound ?? 0) >= 3);
      return 'Ronda promedio: ' + avg.toFixed(1) +
        (extended > 0 ? ' · ' + extended + ' en ronda 3 o más' : '');
    }

    case 'Aceptada':
      return canViewFinances
        ? 'Valor aceptado: ' + money(sum(q => q.totalAmount || 0))
        : plural(n, 'cotización aceptada', 'cotizaciones aceptadas');

    case 'Contrato en espera de firma': {
      const signed = count(q => q.contractStatus === 'Firmado');
      return plural(n - signed, 'contrato esperando firma', 'contratos esperando firma') +
        (signed > 0 ? ' · ' + signed + ' ya firmado(s)' : '');
    }

    case 'Contrato firmado': {
      if (!canViewFinances) return plural(n, 'contrato firmado', 'contratos firmados');
      const total = sum(q => q.totalAmount || 0);
      const collected = sum(q => paidAmount(q));
      const pct = total > 0 ? Math.round((collected / total) * 100) : 0;
      return 'Contratado ' + money(total) + ' · Cobrado ' + money(collected) + ' (' + pct + '%)';
    }

    case 'Finalizada': {
      if (!canViewFinances) return plural(n, 'contratación cerrada', 'contrataciones cerradas');
      const total = sum(q => q.totalAmount || 0);
      const collected = sum(q => paidAmount(q));
      return 'Cerrado ' + money(total) + ' · Cobrado ' + money(collected);
    }

    case 'Cancelada con Imprevisto': {
      const withoutProposal = count(q => (q.incidentNegotiations?.length ?? 0) === 0);
      return plural(n, 'imprevisto activo', 'imprevistos activos') +
        (withoutProposal > 0 ? ' · ' + withoutProposal + ' sin propuesta' : '');
    }

    case 'Imprevisto Enviado':
      return plural(n, 'propuesta esperando respuesta', 'propuestas esperando respuesta');

    case 'Cancelada': {
      if (!canViewFinances) return plural(n, 'expediente cancelado', 'expedientes cancelados');
      const refunds = sum(q => refundDue(q));
      return refunds > 0
        ? 'Reembolsos pendientes: ' + money(refunds)
        : plural(n, 'expediente cancelado', 'expedientes cancelados') + ' · sin reembolsos';
    }

    default:
      return plural(n, 'cotización', 'cotizaciones');
  }
}
