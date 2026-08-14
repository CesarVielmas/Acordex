import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientsSummaryKPIs } from '../../../core/models/client.models';
import { money } from '../../finances/finance-metrics';

/**
 * Barra superior de KPIs de Clientes & CRM.
 */
@Component({
  selector: 'app-clients-kpis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

      <!-- 1. TOTAL CLIENTES -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-primary/30 shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Cartera CRM</span>
          <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg">
            contacts
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-2xl font-black text-on-surface font-mono tracking-tight">{{ kpis()?.totalClients || 0 }}</p>
          <p class="text-[11px] text-outline">{{ kpis()?.frequentClientsCount || 0 }} clientes recurrentes</p>
        </div>
      </div>

      <!-- 2. CLIENTES DIAMANTE -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-cyan-500/30 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Tier Diamante</span>
          <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center material-symbols-outlined text-lg">
            diamond
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-2xl font-black text-cyan-300 font-mono tracking-tight">{{ kpis()?.diamondTierCount || 0 }}</p>
          <p class="text-[11px] text-cyan-200">Palenques y ferias clave</p>
        </div>
      </div>

      <!-- 3. FACTURACIÓN HISTÓRICA -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-emerald-500/30 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Facturación Total</span>
          <span class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center material-symbols-outlined text-lg">
            payments
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">{{ money(kpis()?.totalRevenueGenerated || 0) }}</p>
          <p class="text-[11px] text-emerald-400">Generado en contrataciones</p>
        </div>
      </div>

      <!-- 4. TICKET PROMEDIO -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-purple-500/30 shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition-all">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-purple-300 uppercase tracking-widest">Ticket Promedio</span>
          <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center material-symbols-outlined text-lg">
            receipt_long
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-xl sm:text-2xl font-black text-purple-300 font-mono tracking-tight">{{ money(kpis()?.averageTicketGlobal || 0) }}</p>
          <p class="text-[11px] text-purple-200">Por evento contratado</p>
        </div>
      </div>

      <!-- 5. TASA DE RECURRENCIA -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-amber-500/30 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest">Recurrencia</span>
          <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center material-symbols-outlined text-lg">
            repeat
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-2xl font-black text-amber-300 font-mono tracking-tight">{{ kpis()?.repeatBookingRatePercent || 0 }}%</p>
          <p class="text-[11px] text-amber-200">Vuelven a contratar</p>
        </div>
      </div>

    </div>
  `
})
export class ClientsKpisComponent {
  kpis = input<ClientsSummaryKPIs>();
  money = money;
}
