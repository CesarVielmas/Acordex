import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientItem } from '../../../core/models/admin.models';
import { money } from '../../finances/finance-metrics';
import { getTierBadgeClass, getSegmentBadgeClass } from '../client-metrics';

/**
 * Pestaña 2: Ranking & Segmentación de Clientes Top.
 */
@Component({
  selector: 'app-clients-tab-ranking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg">
              leaderboard
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Ranking de Clientes Top & Volumen de Contratación</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Empresarios, promotores y familias ordenados por inversión total y recurrencia</p>
        </div>
      </div>

      <!-- TABLA DE RANKING -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4 overflow-x-auto">
        <table class="w-full text-left text-xs min-w-[700px]">
          <thead>
            <tr class="border-b border-outline-variant/30 text-outline text-[10px] uppercase font-bold tracking-wider">
              <th class="pb-3 px-3">Lugar</th>
              <th class="pb-3 px-3">Cliente / Empresa</th>
              <th class="pb-3 px-3">Segmento</th>
              <th class="pb-3 px-3">Nivel</th>
              <th class="pb-3 px-3 text-center">Fechas</th>
              <th class="pb-3 px-3 text-right">Inversión Acumulada</th>
              <th class="pb-3 px-3 text-right">Ticket Promedio</th>
              <th class="pb-3 px-3 text-center">Rating</th>
              <th class="pb-3 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/20">
            @for (cli of rankedClients(); track cli.id; let i = $index) {
              <tr class="hover:bg-surface-container-high/60 transition-colors">

                <!-- Posición -->
                <td class="py-4 px-3 font-mono font-black text-sm">
                  @if (i === 0) {
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40">🥇</span>
                  } @else if (i === 1) {
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-300/20 text-slate-200 border border-slate-300/40">🥈</span>
                  } @else if (i === 2) {
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-600/20 text-amber-500 border border-amber-600/40">🥉</span>
                  } @else {
                    <span class="text-outline">#{{ i + 1 }}</span>
                  }
                </td>

                <!-- Cliente y Empresa -->
                <td class="py-4 px-3">
                  <div class="min-w-0">
                    <span class="font-bold text-on-surface block">{{ cli.name }}</span>
                    <span class="text-[11px] text-outline truncate">{{ cli.company }}</span>
                  </div>
                </td>

                <!-- Segmento -->
                <td class="py-4 px-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold border" [class]="getSegmentBadgeClass(cli.segment)">
                    {{ cli.segment || 'General' }}
                  </span>
                </td>

                <!-- Tier -->
                <td class="py-4 px-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-black border" [class]="getTierBadgeClass(cli.tier)">
                    {{ cli.tier || 'Plata' }}
                  </span>
                </td>

                <!-- Eventos -->
                <td class="py-4 px-3 text-center font-mono font-bold text-on-surface">
                  {{ cli.totalEvents }}
                </td>

                <!-- Inversión Total -->
                <td class="py-4 px-3 text-right font-mono font-black text-emerald-300 text-sm">
                  {{ money(cli.totalSpent) }}
                </td>

                <!-- Ticket Promedio -->
                <td class="py-4 px-3 text-right font-mono text-outline">
                  {{ money(cli.averageTicket || (cli.totalEvents > 0 ? cli.totalSpent / cli.totalEvents : 0)) }}
                </td>

                <!-- Rating -->
                <td class="py-4 px-3 text-center">
                  <span class="inline-flex items-center gap-0.5 text-amber-400 font-bold">
                    <span class="material-symbols-outlined text-xs">star</span>
                    {{ cli.rating || 5 }}.0
                  </span>
                </td>

                <!-- Acción -->
                <td class="py-4 px-3 text-right">
                  <button
                    type="button"
                    (click)="openDetail.emit(cli)"
                    class="px-3 py-1.5 rounded-xl bg-surface-container-highest hover:bg-primary hover:text-on-primary font-bold text-xs transition-all cursor-pointer"
                  >
                    Expediente
                  </button>
                </td>

              </tr>
            }
          </tbody>
        </table>
      </div>

    </div>
  `
})
export class ClientsTabRankingComponent {
  clients = input<ClientItem[]>([]);
  openDetail = output<ClientItem>();

  rankedClients(): ClientItem[] {
    return [...this.clients()].sort((a, b) => b.totalSpent - a.totalSpent);
  }

  money = money;
  getTierBadgeClass = getTierBadgeClass;
  getSegmentBadgeClass = getSegmentBadgeClass;
}
