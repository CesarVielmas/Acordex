import { Quote } from '../../core/models/admin.models';
import { KpiColorVariant } from '../../shared/ui/kpi-card/kpi-card.component';
import { QUOTE_NON_LINEAR_STATES } from '../../core/models/quote-state.meta';

/**
 * Una tarjeta de la tira de métricas del panel de cotizaciones,
 * ya resuelta y lista para pintar.
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

const MXN = (n: number) => '$' + Math.round(n).toLocaleString('es-MX');

/** Cotizaciones vivas: excluye el protocolo de imprevistos y las canceladas. */
function activeQuotes(quotes: Quote[]): Quote[] {
  return quotes.filter(q => !QUOTE_NON_LINEAR_STATES.includes(q.state));
}

/** Cotizaciones que llegaron al cierre con la cobranza completa. */
function closedQuotes(quotes: Quote[]): Quote[] {
  return quotes.filter(q => q.state === 'Finalizada');
}

/**
 * Agrupa por una clave y devuelve la entrada con mayor peso.
 * `weight` decide si el ranking es por dinero o por número de cotizaciones.
 */
function topEntry(
  quotes: Quote[],
  key: (q: Quote) => string | undefined,
  weight: (q: Quote) => number
): { name: string; total: number; count: number } | null {
  const acc = new Map<string, { total: number; count: number }>();
  for (const q of quotes) {
    const k = (key(q) || '').trim();
    if (!k) continue;
    const prev = acc.get(k) || { total: 0, count: 0 };
    acc.set(k, { total: prev.total + weight(q), count: prev.count + 1 });
  }
  let best: { name: string; total: number; count: number } | null = null;
  for (const [name, v] of acc) {
    if (!best || v.total > best.total) best = { name, total: v.total, count: v.count };
  }
  return best;
}

/** Texto de respaldo cuando todavía no hay datos suficientes para la métrica. */
const EMPTY = 'Sin datos';

/**
 * Métricas para el rol **Encargado**: manda el dinero. Qué vale el pipeline,
 * cuánto entra por contrato, y qué talento y qué cliente sostienen la facturación.
 */
export function encargadoMetrics(quotes: Quote[]): PanelMetric[] {
  const active = activeQuotes(quotes);
  const pipelineValue = active.reduce((s, q) => s + q.totalAmount, 0);
  const avgTicket = active.length ? pipelineValue / active.length : 0;

  const topGroup = topEntry(quotes, q => q.groupName, q => q.totalAmount);
  const topClient = topEntry(quotes, q => q.clientName, q => q.totalAmount);

  const closed = closedQuotes(quotes);
  const closedValue = closed.reduce((s, q) => s + q.totalAmount, 0);

  return [
    {
      label: 'Valuación Pipeline Activo',
      value: MXN(pipelineValue),
      icon: 'payments',
      trend: `${active.length} cotizaciones en curso`,
      trendIcon: 'trending_up',
      colorVariant: 'secondary'
    },
    {
      label: 'Ticket Promedio',
      value: MXN(avgTicket),
      icon: 'sell',
      trend: closed.length ? `${MXN(closedValue)} ya facturado` : 'Aún sin cierres',
      trendIcon: 'account_balance_wallet',
      colorVariant: 'success'
    },
    {
      label: 'Grupo de Mayor Facturación',
      value: topGroup?.name || EMPTY,
      dense: true,
      icon: 'workspace_premium',
      trend: topGroup ? `${MXN(topGroup.total)} en ${topGroup.count} cotización(es)` : '',
      trendIcon: 'music_note',
      colorVariant: 'primary'
    },
    {
      label: 'Cliente de Mayor Valor',
      value: topClient?.name || EMPTY,
      dense: true,
      icon: 'diamond',
      trend: topClient ? `${MXN(topClient.total)} contratados` : '',
      trendIcon: 'handshake',
      colorVariant: 'warning'
    }
  ];
}

/**
 * Métricas para el rol **Administrador**: manda la demanda y la operación.
 * Qué talento piden más, quién repite, en qué plaza hay tracción y cuánta
 * carga real hay sobre la mesa. Sin cifras de dinero.
 */
export function administradorMetrics(quotes: Quote[]): PanelMetric[] {
  const active = activeQuotes(quotes);

  // Aquí el ranking es por número de solicitudes, no por importe.
  const one = () => 1;
  const topGroup = topEntry(quotes, q => q.groupName, one);
  const topClient = topEntry(quotes, q => q.clientName, one);
  const topCity = topEntry(quotes, q => q.city, one);
  const topEventType = topEntry(quotes, q => q.eventType, one);
  const uniqueClients = new Set(quotes.map(q => (q.clientName || '').trim()).filter(Boolean)).size;

  return [
    {
      label: 'Grupo Más Solicitado',
      value: topGroup?.name || EMPTY,
      dense: true,
      icon: 'local_fire_department',
      trend: topGroup ? `${topGroup.count} de ${quotes.length} solicitudes` : '',
      trendIcon: 'music_note',
      colorVariant: 'primary'
    },
    // Un "más frecuente" con una sola solicitud no es recurrencia: mientras
    // nadie repita, decirlo es más útil que coronar a un cliente al azar.
    (topClient && topClient.count > 1)
      ? {
          label: 'Cliente Más Frecuente',
          value: topClient.name,
          dense: true,
          icon: 'repeat',
          trend: `${topClient.count} contrataciones`,
          trendIcon: 'badge',
          colorVariant: 'info' as const
        }
      : {
          label: 'Clientes Recurrentes',
          value: 'Sin recurrencia aún',
          dense: true,
          icon: 'repeat',
          trend: `${uniqueClients} cliente(s) distinto(s), ninguno repite`,
          trendIcon: 'badge',
          colorVariant: 'info' as const
        },
    {
      label: 'Plaza con Más Demanda',
      value: topCity?.name || EMPTY,
      dense: true,
      icon: 'location_city',
      trend: topCity ? `${topCity.count} evento(s) solicitados` : '',
      trendIcon: 'location_on',
      colorVariant: 'success'
    },
    {
      label: 'Carga Operativa Activa',
      value: String(active.length),
      unit: 'expedientes',
      icon: 'inventory',
      trend: topEventType ? `Predomina: ${topEventType.name}` : 'Sin tipo predominante',
      trendIcon: 'category',
      colorVariant: 'warning'
    }
  ];
}

/** Devuelve la tira de métricas que corresponde al rol activo. */
export function panelMetrics(quotes: Quote[], canViewFinances: boolean): PanelMetric[] {
  return canViewFinances ? encargadoMetrics(quotes) : administradorMetrics(quotes);
}
