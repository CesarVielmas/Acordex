/**
 * Funciones de cálculo y derivación analítica para el módulo de Clientes & CRM.
 */

import { ClientItem } from '../../core/models/admin.models';
import {
  ClientsSummaryKPIs,
  ClientSegment,
  ClientTier,
  ClientStatus
} from '../../core/models/client.models';

export function calculateClientsKPIs(clients: ClientItem[]): ClientsSummaryKPIs {
  const totalClients = clients.length;
  const frequentClientsCount = clients.filter(c => c.status === 'Frecuente').length;
  const diamondTierCount = clients.filter(c => c.tier === 'Diamante').length;

  const totalRevenueGenerated = clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalEvents = clients.reduce((sum, c) => sum + (c.totalEvents || 0), 0);

  const averageTicketGlobal = totalEvents > 0 ? Math.round(totalRevenueGenerated / totalEvents) : 0;
  const repeatBookingRatePercent = totalClients > 0
    ? Math.round((clients.filter(c => (c.totalEvents || 0) > 1).length / totalClients) * 100)
    : 0;

  return {
    totalClients,
    frequentClientsCount,
    diamondTierCount,
    totalRevenueGenerated,
    averageTicketGlobal,
    repeatBookingRatePercent
  };
}

export function getTierBadgeClass(tier?: string): string {
  switch (tier) {
    case 'Diamante': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm';
    case 'Oro': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'Plata': return 'bg-slate-400/20 text-slate-200 border-slate-400/40';
    case 'Prospecto': return 'bg-surface-container-highest text-outline border-outline-variant/30';
    default: return 'bg-surface-container-highest text-outline border-outline-variant/30';
  }
}

export function getSegmentBadgeClass(segment?: string): string {
  switch (segment) {
    case 'Empresario de Palenque / Feria': return 'bg-primary/20 text-primary border-primary/40';
    case 'Promotor de Bailes': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    case 'Particular (Boda/XV)': return 'bg-pink-500/20 text-pink-300 border-pink-500/40';
    case 'Corporativo / Empresa': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'Gobierno / Municipio': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    default: return 'bg-surface-container-highest text-outline border-outline-variant/30';
  }
}

export function getClientStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Frecuente': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'Activo': return 'bg-primary/20 text-primary border-primary/40';
    case 'Prospecto': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'Inactivo': return 'bg-surface-container-highest text-outline border-outline-variant/30';
    case 'Lista Negra': return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
    default: return 'bg-surface-container-highest text-outline border-outline-variant/30';
  }
}
