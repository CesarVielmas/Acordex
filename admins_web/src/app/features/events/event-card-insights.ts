import { EventItem, EventState } from '../../core/models/event.models';
import { eventCompleteness } from './event-completeness';
import {
  approvalPercent,
  approvedCount,
  approvals,
  availableSeats,
  daysSince,
  daysUntilEvent,
  externalSlots,
  grossTicketRevenue,
  hasRejection,
  hoursUntilPublish,
  isClosureComplete,
  isSoldOut,
  lineup,
  lineupTotalCost,
  money,
  netResult,
  occupancyPercent,
  pendingApprovals,
  pendingPayoutsCount,
  plural,
  potentialTicketRevenue,
  relativeDays,
  shortDate,
  soldSeats,
  totalSeats
} from './event-metrics';

/**
 * Qué información describe de verdad a un evento en cada fase.
 *
 * La tarjeta anterior mostraba siempre lo mismo —flyer, fecha, recinto y las
 * zonas con su precio— sin importar el estado. Eso deja fuera justo lo que uno
 * necesita saber de un vistazo: en 'Borrador' importa qué falta capturar; en
 * 'En Revisión', quién no ha aprobado; en 'En Venta', cuánto se ha vendido; en
 * 'Finalizada', si el cierre ya cuadra.
 *
 * Mismo patrón que `quote-card-insights.ts`, y por el mismo motivo: que la
 * tarjeta, el encabezado de la columna y los filtros hablen del mismo dato.
 */

export type EventTagTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface EventTag {
  label: string;
  icon: string;
  tone: EventTagTone;
}

export interface EventHighlight {
  /** Qué se está midiendo. */
  caption: string;
  /** El valor, ya formateado. */
  value: string;
  /** Matiz opcional bajo el valor. */
  hint?: string;
  /** Barra de avance de 0 a 100, cuando la fase tiene un progreso que mostrar. */
  progressPercent?: number;
  progressTone?: 'primary' | 'success' | 'warning' | 'error';
  /**
   * True cuando el valor todavía no es un compromiso firme (una taquilla
   * proyectada, un costo que nadie ha aprobado). La tarjeta lo marca para no
   * dar la cifra por definitiva.
   */
  tentative?: boolean;
}

// ─── Dato principal de la tarjeta ────────────────────────────────────────────

export function cardHighlight(e: EventItem, canViewFinances: boolean): EventHighlight {
  const days = daysUntilEvent(e);

  switch (e.state) {
    case 'Borrador': {
      const report = eventCompleteness(e);
      const missing = report.missingRequired.length;
      return {
        caption: 'Avance de captura',
        value: report.percent + '% completado',
        hint: missing === 0
          ? 'Listo para enviarse a revisión'
          : plural(missing, 'punto obligatorio pendiente', 'puntos obligatorios pendientes'),
        progressPercent: report.percent,
        progressTone: missing === 0 ? 'success' : (report.percent >= 60 ? 'warning' : 'error')
      };
    }

    case 'En Revisión': {
      const total = approvals(e).length;
      const ok = approvedCount(e);
      const pending = pendingApprovals(e);
      const hint = hasRejection(e)
        ? 'Hay un rechazo con cambios solicitados'
        : (pending.length > 0
          ? 'Falta ' + pending.map(a => a.managerName).slice(0, 2).join(', ') + (pending.length > 2 ? ' y ' + (pending.length - 2) + ' más' : '')
          : 'Todos aprobaron: listo para publicar');
      return {
        caption: 'Aprobaciones de encargados',
        value: total > 0 ? ok + ' de ' + total + ' aprobadas' : 'Sin encargados por aprobar',
        hint,
        progressPercent: approvalPercent(e),
        progressTone: hasRejection(e) ? 'error' : (ok === total && total > 0 ? 'success' : 'warning')
      };
    }

    case 'Próximo a Publicar': {
      const hours = hoursUntilPublish(e);
      const value = hours === null
        ? 'Sin fecha programada'
        : (hours <= 0 ? 'Publicando…' : (hours < 24 ? 'En ' + hours + ' h' : 'En ' + Math.round(hours / 24) + ' días'));
      return {
        caption: 'Publicación automática',
        value,
        hint: e.publication?.scheduledAt
          ? 'Programado para ' + shortDate(e.publication.scheduledAt.slice(0, 10))
          : 'Define cuándo debe salir a cartelera'
      };
    }

    case 'Publicado': {
      const seats = totalSeats(e);
      if (!canViewFinances) {
        return {
          caption: 'En cartelera',
          value: relativeDays(days),
          hint: seats > 0 ? seats.toLocaleString('es-MX') + ' lugares disponibles' : 'Sin boletaje configurado'
        };
      }
      return {
        caption: 'Taquilla potencial',
        value: money(potentialTicketRevenue(e)),
        hint: 'Aún sin boletos vendidos · ' + relativeDays(days),
        tentative: true
      };
    }

    case 'En Venta': {
      const pct = Math.round(occupancyPercent(e));
      if (!canViewFinances) {
        return {
          caption: 'Ocupación vendida',
          value: pct + '% del aforo',
          hint: soldSeats(e).toLocaleString('es-MX') + ' de ' + totalSeats(e).toLocaleString('es-MX') + ' lugares',
          progressPercent: pct,
          progressTone: pct >= 70 ? 'success' : (pct >= 35 ? 'primary' : 'warning')
        };
      }
      return {
        caption: 'Taquilla cobrada',
        value: money(grossTicketRevenue(e)),
        hint: pct + '% del aforo · ' + availableSeats(e).toLocaleString('es-MX') + ' lugares por vender',
        progressPercent: pct,
        progressTone: pct >= 70 ? 'success' : (pct >= 35 ? 'primary' : 'warning')
      };
    }

    case 'Finalizada': {
      const pending = pendingPayoutsCount(e);
      if (!canViewFinances) {
        return {
          caption: 'Evento realizado',
          value: (e.closure?.attendance ?? soldSeats(e)).toLocaleString('es-MX') + ' asistentes',
          hint: isClosureComplete(e) ? 'Cierre completo, listo para sellar' : 'Faltan datos del cierre'
        };
      }
      return {
        caption: 'Resultado del evento',
        value: money(netResult(e)),
        hint: pending > 0
          ? plural(pending, 'pago a grupo pendiente', 'pagos a grupos pendientes')
          : 'Todos los grupos pagados'
      };
    }

    case 'Cerrado': {
      if (!canViewFinances) {
        return {
          caption: 'Expediente cerrado',
          value: (e.closure?.attendance ?? soldSeats(e)).toLocaleString('es-MX') + ' asistentes',
          hint: e.closure?.closedAt ? 'Cerrado el ' + shortDate(e.closure.closedAt.slice(0, 10)) : 'Histórico sellado'
        };
      }
      return {
        caption: 'Resultado final',
        value: money(netResult(e)),
        hint: 'Taquilla ' + money(e.closure?.grossRevenue ?? grossTicketRevenue(e)) + ' · Expediente sellado'
      };
    }

    case 'Cancelado': {
      const refunds = e.cancellation?.refundsIssued ?? 0;
      if (!canViewFinances) {
        return {
          caption: 'Evento cancelado',
          value: e.cancellation?.cancelledFromState ? 'Cancelado en ' + e.cancellation.cancelledFromState : 'Cancelado',
          hint: e.cancellation?.reason || 'Fecha liberada en el recinto'
        };
      }
      return {
        caption: 'Reembolsos',
        value: refunds > 0 ? money(e.cancellation?.refundedAmount || 0) : 'Sin boletos vendidos',
        hint: refunds > 0 ? plural(refunds, 'boleto reembolsado', 'boletos reembolsados') : 'Cancelado antes de la venta'
      };
    }

    default:
      return { caption: 'Evento', value: relativeDays(days), hint: shortDate(e.date) };
  }
}

// ─── Tags contextuales ───────────────────────────────────────────────────────

/**
 * Señales que conviene ver sin abrir el expediente. Se limitan a cuatro para
 * que la tarjeta no se sature.
 */
export function cardTags(e: EventItem): EventTag[] {
  const tags: EventTag[] = [];
  const days = daysUntilEvent(e);
  const isClosed = e.state === 'Cerrado' || e.state === 'Cancelado';

  if (!isClosed && days >= 0 && days <= 15) {
    tags.push({ label: days === 0 ? 'Es hoy' : 'Evento en ' + days + ' días', icon: 'bolt', tone: 'danger' });
  }

  if (e.isCoProduction) {
    tags.push({ label: 'Co-producción', icon: 'handshake', tone: 'info' });
  }

  const externals = externalSlots(e).length;
  if (externals > 0 && (e.state === 'Borrador' || e.state === 'En Revisión')) {
    tags.push({ label: plural(externals, 'grupo externo', 'grupos externos'), icon: 'diversity_3', tone: 'warning' });
  }

  switch (e.state) {
    case 'Borrador': {
      const report = eventCompleteness(e);
      tags.push(report.canSubmitForReview
        ? { label: 'Listo para revisión', icon: 'task_alt', tone: 'success' }
        : { label: report.missingRequired.length + ' pendientes', icon: 'checklist', tone: 'warning' });
      break;
    }

    case 'En Revisión':
      if (hasRejection(e)) {
        tags.push({ label: 'Con rechazo', icon: 'thumb_down', tone: 'danger' });
      } else if (pendingApprovals(e).length === 0) {
        tags.push({ label: 'Aprobado por todos', icon: 'verified', tone: 'success' });
      } else {
        tags.push({ label: plural(pendingApprovals(e).length, 'aprobación pendiente', 'aprobaciones pendientes'), icon: 'hourglass_top', tone: 'warning' });
      }
      break;

    case 'Próximo a Publicar': {
      const hours = hoursUntilPublish(e);
      if (hours !== null && hours <= 24) {
        tags.push({ label: 'Publica en menos de 24 h', icon: 'schedule_send', tone: 'info' });
      }
      break;
    }

    case 'Publicado':
      tags.push({ label: 'Sin ventas aún', icon: 'shopping_cart_off', tone: 'neutral' });
      break;

    case 'En Venta': {
      if (isSoldOut(e)) {
        tags.push({ label: 'Agotado', icon: 'local_fire_department', tone: 'success' });
      } else if (occupancyPercent(e) < 25 && days >= 0 && days <= 30) {
        tags.push({ label: 'Venta lenta', icon: 'trending_down', tone: 'danger' });
      }
      tags.push({ label: 'Cambios con reembolso', icon: 'lock', tone: 'warning' });
      break;
    }

    case 'Finalizada':
      tags.push(isClosureComplete(e)
        ? { label: 'Cierre completo', icon: 'fact_check', tone: 'success' }
        : { label: 'Cierre incompleto', icon: 'pending_actions', tone: 'warning' });
      if (pendingPayoutsCount(e) > 0) {
        tags.push({ label: 'Pagos pendientes', icon: 'payments', tone: 'warning' });
      }
      break;

    case 'Cerrado':
      tags.push({ label: 'Expediente sellado', icon: 'lock', tone: 'neutral' });
      break;

    case 'Cancelado':
      if ((e.cancellation?.refundsIssued ?? 0) > 0) {
        tags.push({ label: 'Con reembolsos', icon: 'currency_exchange', tone: 'danger' });
      }
      break;
  }

  return tags.slice(0, 4);
}

// ─── Resumen del encabezado de cada columna ──────────────────────────────────

export function stateSummary(state: EventState, events: EventItem[], canViewFinances: boolean): string {
  const n = events.length;
  if (n === 0) return 'Sin eventos';

  const sum = (fn: (e: EventItem) => number) => events.reduce((acc, e) => acc + fn(e), 0);
  const count = (fn: (e: EventItem) => boolean) => events.filter(fn).length;

  switch (state) {
    case 'Borrador': {
      const ready = count(e => eventCompleteness(e).canSubmitForReview);
      return plural(n, 'evento en armado', 'eventos en armado') +
        (ready > 0 ? ' · ' + ready + ' listo(s) para revisión' : ' · ninguno listo aún');
    }

    case 'En Revisión': {
      const rejected = count(e => hasRejection(e));
      const pending = sum(e => pendingApprovals(e).length);
      return plural(pending, 'aprobación pendiente', 'aprobaciones pendientes') +
        (rejected > 0 ? ' · ' + rejected + ' con rechazo' : '');
    }

    case 'Próximo a Publicar': {
      const soon = count(e => (hoursUntilPublish(e) ?? 999) <= 24);
      return plural(n, 'evento programado', 'eventos programados') +
        (soon > 0 ? ' · ' + soon + ' publica(n) en menos de 24 h' : '');
    }

    case 'Publicado': {
      if (!canViewFinances) {
        return plural(n, 'evento en cartelera', 'eventos en cartelera') +
          ' · ' + sum(e => totalSeats(e)).toLocaleString('es-MX') + ' lugares disponibles';
      }
      return plural(n, 'evento en cartelera', 'eventos en cartelera') +
        ' · Taquilla potencial ' + money(sum(e => potentialTicketRevenue(e)));
    }

    case 'En Venta': {
      const sold = sum(e => soldSeats(e));
      const seats = sum(e => totalSeats(e));
      const pct = seats > 0 ? Math.round((sold / seats) * 100) : 0;
      if (!canViewFinances) {
        return sold.toLocaleString('es-MX') + ' de ' + seats.toLocaleString('es-MX') + ' lugares vendidos (' + pct + '%)';
      }
      return 'Vendido ' + money(sum(e => grossTicketRevenue(e))) + ' · ' + pct + '% del aforo';
    }

    case 'Finalizada': {
      const incomplete = count(e => !isClosureComplete(e));
      if (!canViewFinances) {
        return plural(n, 'evento realizado', 'eventos realizados') +
          (incomplete > 0 ? ' · ' + incomplete + ' sin cerrar datos' : ' · datos completos');
      }
      return 'Resultado ' + money(sum(e => netResult(e))) +
        (incomplete > 0 ? ' · ' + incomplete + ' cierre(s) incompleto(s)' : '');
    }

    case 'Cerrado': {
      if (!canViewFinances) {
        return plural(n, 'expediente sellado', 'expedientes sellados') +
          ' · ' + sum(e => e.closure?.attendance ?? soldSeats(e)).toLocaleString('es-MX') + ' asistentes';
      }
      return plural(n, 'expediente sellado', 'expedientes sellados') +
        ' · Resultado histórico ' + money(sum(e => netResult(e)));
    }

    case 'Cancelado': {
      const withRefunds = count(e => (e.cancellation?.refundsIssued ?? 0) > 0);
      if (!canViewFinances) {
        return plural(n, 'evento cancelado', 'eventos cancelados') +
          (withRefunds > 0 ? ' · ' + withRefunds + ' con reembolsos' : ' · sin venta afectada');
      }
      return plural(n, 'evento cancelado', 'eventos cancelados') +
        ' · Reembolsado ' + money(sum(e => e.cancellation?.refundedAmount || 0));
    }

    default:
      return plural(n, 'evento', 'eventos');
  }
}

// ─── Datos de apoyo de la tarjeta ────────────────────────────────────────────

/** Línea corta de cartel: "3 grupos · Abre Los Elegantes del Norte". */
export function lineupSummary(e: EventItem): string {
  const slots = lineup(e);
  if (!slots.length) return 'Cartel sin definir';
  const opener = slots[0];
  return plural(slots.length, 'grupo', 'grupos') + ' · Abre ' + opener.groupName;
}

/** Costo del cartel, solo para quien puede ver cifras. */
export function lineupCostLabel(e: EventItem): string {
  const cost = lineupTotalCost(e);
  return cost > 0 ? money(cost) : 'Por definir';
}

/** Cuánto lleva el evento sin moverse de fase. */
export function stalledLabel(e: EventItem): string | null {
  const reference = e.state === 'En Revisión'
    ? e.reviewRounds?.[e.reviewRounds.length - 1]?.sentAt
    : e.createdAt;
  const days = daysSince(reference?.slice(0, 10));
  if (days === null || days < 5) return null;
  return 'Sin avanzar desde hace ' + plural(days, 'día', 'días');
}
