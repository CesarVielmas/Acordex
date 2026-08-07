import { EventItem } from '../../core/models/event.models';
import { KpiColorVariant } from '../../shared/ui/kpi-card/kpi-card.component';
import { canSubmitForReview } from './event-completeness';
import {
  daysUntilEvent,
  grossTicketRevenue,
  isClosureComplete,
  lineupTotalCost,
  netResult,
  occupancyPercent,
  pendingApprovals,
  pendingPayoutsCount,
  potentialTicketRevenue,
  shortDate,
  soldSeats,
  totalSeats
} from './event-metrics';

/**
 * Tira de métricas del panel de eventos. Igual que en cotizaciones, el
 * contenido cambia por rol a propósito: al Encargado le importa la taquilla y
 * lo comprometido con los grupos; al Administrador, la operación — qué falta
 * aprobar, qué está por publicarse y cómo va el aforo.
 */
export interface PanelMetric {
  label: string;
  value: string;
  unit?: string;
  icon: string;
  trend?: string;
  trendIcon?: string;
  colorVariant: KpiColorVariant;
  /** true cuando el valor es un nombre propio y no una cifra (se pinta más chico). */
  dense?: boolean;
}

const MXN = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-MX');
const EMPTY = 'Sin datos';

/** Eventos que todavía se están moviendo: excluye cerrados y cancelados. */
function liveEvents(events: EventItem[]): EventItem[] {
  return events.filter(e => e.state !== 'Cerrado' && e.state !== 'Cancelado');
}

/** Eventos ya visibles al público con boletos a la venta. */
function onSaleEvents(events: EventItem[]): EventItem[] {
  return events.filter(e => e.state === 'Publicado' || e.state === 'En Venta');
}

/** El evento vivo más próximo en el calendario. */
function nextEvent(events: EventItem[]): EventItem | null {
  return liveEvents(events)
    .filter(e => daysUntilEvent(e) >= 0)
    .sort((a, b) => daysUntilEvent(a) - daysUntilEvent(b))[0] || null;
}

/**
 * Métricas para el rol **Encargado**: manda el dinero. Cuánto se lleva
 * cobrado, cuánto falta por vender, qué tanto está comprometido con los grupos
 * y qué dejaron los eventos que ya cerraron.
 */
export function encargadoMetrics(events: EventItem[]): PanelMetric[] {
  const onSale = onSaleEvents(events);
  const collected = onSale.reduce((s, e) => s + grossTicketRevenue(e), 0);
  const potential = onSale.reduce((s, e) => s + potentialTicketRevenue(e), 0);
  const pending = Math.max(0, potential - collected);

  const committed = liveEvents(events).reduce((s, e) => s + lineupTotalCost(e), 0);
  const withExternals = liveEvents(events).filter(e => e.lineup?.some(s => s.isExternal)).length;

  const closed = events.filter(e => e.state === 'Cerrado' || e.state === 'Finalizada');
  const closedResult = closed.reduce((s, e) => s + netResult(e), 0);

  const upcoming = nextEvent(events);

  return [
    {
      label: 'Taquilla Cobrada',
      value: MXN(collected),
      icon: 'confirmation_number',
      trend: onSale.length ? `${onSale.length} evento(s) con boletos a la venta` : 'Sin eventos en venta',
      trendIcon: 'point_of_sale',
      colorVariant: 'success'
    },
    {
      label: 'Taquilla por Vender',
      value: MXN(pending),
      icon: 'sell',
      trend: potential > 0 ? `${Math.round((collected / potential) * 100)}% del potencial ya cobrado` : 'Sin boletaje configurado',
      trendIcon: 'trending_up',
      colorVariant: 'secondary'
    },
    {
      label: 'Comprometido con Grupos',
      value: MXN(committed),
      icon: 'groups',
      trend: withExternals > 0 ? `${withExternals} evento(s) con grupos de otros encargados` : 'Todo el cartel es propio',
      trendIcon: 'diversity_3',
      colorVariant: 'warning'
    },
    {
      label: 'Resultado de Eventos Cerrados',
      value: MXN(closedResult),
      icon: 'account_balance',
      trend: upcoming ? `Siguiente: ${upcoming.title}` : 'Sin eventos próximos',
      trendIcon: 'event_upcoming',
      colorVariant: 'primary'
    }
  ];
}

/**
 * Métricas para el rol **Administrador**: manda la operación. Qué está atorado
 * esperando aprobación, qué está por salir a cartelera, cómo va el aforo y qué
 * evento es el siguiente. Sin cifras de dinero.
 */
export function administradorMetrics(events: EventItem[]): PanelMetric[] {
  const drafts = events.filter(e => e.state === 'Borrador');
  const readyDrafts = drafts.filter(e => canSubmitForReview(e)).length;

  const inReview = events.filter(e => e.state === 'En Revisión');
  const pendingApprovalsCount = inReview.reduce((s, e) => s + pendingApprovals(e).length, 0);

  const onSale = onSaleEvents(events);
  const seats = onSale.reduce((s, e) => s + totalSeats(e), 0);
  const sold = onSale.reduce((s, e) => s + soldSeats(e), 0);
  const avgOccupancy = onSale.length
    ? Math.round(onSale.reduce((s, e) => s + occupancyPercent(e), 0) / onSale.length)
    : 0;

  const toClose = events.filter(e => e.state === 'Finalizada');
  const incompleteClosures = toClose.filter(e => !isClosureComplete(e) || pendingPayoutsCount(e) > 0).length;

  const upcoming = nextEvent(events);

  return [
    {
      label: 'Aprobaciones Pendientes',
      value: String(pendingApprovalsCount),
      unit: 'encargados',
      icon: 'rate_review',
      trend: inReview.length ? `${inReview.length} evento(s) en revisión` : 'Nada en revisión',
      trendIcon: 'hourglass_top',
      colorVariant: pendingApprovalsCount > 0 ? 'warning' : 'success'
    },
    {
      label: 'Borradores Listos para Enviar',
      value: `${readyDrafts} de ${drafts.length}`,
      icon: 'checklist',
      trend: drafts.length - readyDrafts > 0
        ? `${drafts.length - readyDrafts} con información incompleta`
        : 'Todos los borradores están completos',
      trendIcon: 'edit_document',
      colorVariant: 'info'
    },
    {
      label: 'Ocupación Promedio en Venta',
      value: `${avgOccupancy}%`,
      icon: 'event_seat',
      trend: seats > 0 ? `${sold.toLocaleString('es-MX')} de ${seats.toLocaleString('es-MX')} lugares vendidos` : 'Sin boletaje a la venta',
      trendIcon: 'groups',
      colorVariant: avgOccupancy >= 60 ? 'success' : 'warning'
    },
    upcoming
      ? {
          label: 'Siguiente Evento',
          value: upcoming.title,
          dense: true,
          icon: 'event_upcoming',
          trend: `${shortDate(upcoming.date)} · ${upcoming.venue}`,
          trendIcon: 'location_on',
          colorVariant: 'primary' as const
        }
      : {
          label: 'Cierres por Completar',
          value: String(incompleteClosures),
          unit: 'expedientes',
          icon: 'pending_actions',
          trend: incompleteClosures > 0 ? 'Faltan datos finales o pagos a grupos' : 'Todos los cierres al día',
          trendIcon: 'fact_check',
          colorVariant: 'warning' as const
        }
  ];
}

export function panelMetrics(events: EventItem[], canViewFinances: boolean): PanelMetric[] {
  return canViewFinances ? encargadoMetrics(events) : administradorMetrics(events);
}

/** Métrica de respaldo cuando no hay ningún evento cargado. */
export const NO_DATA_LABEL = EMPTY;
