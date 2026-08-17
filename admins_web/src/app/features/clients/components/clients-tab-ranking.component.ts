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
      <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
              leaderboard
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface font-['Epilogue']">Ranking de Facturación Top Clientes & Volumen Acumulado</h2>
          </div>
          <p class="text-xs text-outline mt-0.5 font-['Epilogue']">Cuentas corporativas, empresarios de palenques y promotores clasificados por volumen transaccional</p>
        </div>
      </div>

      <!-- TABLA DE RANKING -->
      <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-4 overflow-x-auto">
        <table class="w-full text-left text-xs min-w-[700px]">
          <thead>
            <tr class="border-b border-white/10 text-outline text-[10px] uppercase font-bold tracking-wider font-['Epilogue']">
              <th class="pb-3 px-3">Lugar</th>
              <th class="pb-3 px-3">Cliente / Razón Social</th>
              <th class="pb-3 px-3">Segmento Comercial</th>
              <th class="pb-3 px-3">Tier</th>
              <th class="pb-3 px-3 text-center">Contrataciones</th>
              <th class="pb-3 px-3 text-right">Facturación Bruta</th>
              <th class="pb-3 px-3 text-right">Ticket Promedio</th>
              <th class="pb-3 px-3 text-center">Score</th>
              <th class="pb-3 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            @for (cli of rankedClients(); track cli.id; let i = $index) {
              <tr class="hover:bg-white/5 transition-colors">

                <!-- Posición -->
                <td class="py-4 px-3 font-mono font-black text-sm">
                  @if (i === 0) {
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm">🥇</span>
                  } @else if (i === 1) {
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-300/20 text-slate-200 border border-slate-300/40 shadow-sm">🥈</span>
                  } @else if (i === 2) {
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-600/20 text-amber-500 border border-amber-600/40 shadow-sm">🥉</span>
                  } @else {
                    <span class="text-outline">#{{ i + 1 }}</span>
                  }
                </td>

                <!-- Cliente y Empresa -->
                <td class="py-4 px-3">
                  <div class="min-w-0">
                    <span class="font-bold text-on-surface block font-['Epilogue']">{{ cli.name }}</span>
                    <span class="text-[11px] text-outline truncate font-['Epilogue']">{{ cli.company }}</span>
                  </div>
                </td>

                <!-- Segmento -->
                <td class="py-4 px-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold border font-['Epilogue']" [class]="getSegmentBadgeClass(cli.segment)">
                    {{ cli.segment || 'General' }}
                  </span>
                </td>

                <!-- Tier -->
                <td class="py-4 px-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-black border font-mono" [class]="getTierBadgeClass(cli.tier)">
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
                <td class="py-4 px-3 text-center font-mono">
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
                    class="px-3.5 py-1.5 rounded-xl bg-[#222222] hover:bg-primary hover:text-on-primary font-bold text-xs transition-all cursor-pointer font-['Epilogue']"
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
