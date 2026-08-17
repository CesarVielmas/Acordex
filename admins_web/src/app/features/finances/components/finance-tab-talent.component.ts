import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupFinancialPerformance } from '../../../core/models/finance.models';
import { money } from '../finance-metrics';

/**
 * Pestaña de Rentabilidad por Grupo Musical / Talento.
 *
 * Analiza el volumen de ingresos, costos directos y margen neto
 * que cada agrupación del catálogo de Acordex aporta a la empresa.
 */
@Component({
  selector: 'app-finance-tab-talent',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">

      <!-- ENCABEZADO EXPLICATIVO -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
              stars
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface font-['Epilogue'] tracking-tight">Rentabilidad & Desempeño Contable por Talento</h2>
          </div>
          <p class="text-xs text-outline mt-0.5 font-['Epilogue']">Margen neto institucional, retorno sobre inversión (ROI) por actuación y volumen facturado consolidado</p>
        </div>
      </div>

      <!-- CARDS DE TALENTO -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (item of performance(); track item.groupId; let i = $index) {
          <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-4 relative overflow-hidden transition-all duration-300 hover:border-purple-500/50">

            <!-- Encabezado con Foto y Ranking -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="relative shrink-0">
                  <img
                    [src]="item.image"
                    [alt]="item.groupName"
                    class="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 shadow-md"
                  />
                  <span class="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#202020] text-primary border border-white/10 flex items-center justify-center text-[10px] font-black font-mono shadow-sm">
                    #{{ i + 1 }}
                  </span>
                </div>

                <div class="min-w-0">
                  <h4 class="text-sm font-black text-on-surface truncate font-['Epilogue']">{{ item.groupName }}</h4>
                  <p class="text-xs text-outline">{{ item.genre }}</p>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-block mt-0.5 font-mono">
                    {{ item.disqueraType }}
                  </span>
                </div>
              </div>

              <!-- Utilidad Neta para Acordex -->
              <div class="text-right shrink-0">
                <span class="text-[10px] text-emerald-400 uppercase font-bold block font-['Epilogue']">Margen Neto Acordex</span>
                <span class="text-lg font-black text-emerald-300 font-mono tracking-tight">{{ money(item.netDisqueraProfit) }}</span>
                <span class="text-[10px] text-outline block font-mono">{{ item.profitMarginPercent }}% margen operativo</span>
              </div>
            </div>

            <!-- Matriz de Métricas Financieras -->
            <div class="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#141414] border border-white/5 text-center font-mono">
              <div>
                <span class="text-[9px] text-outline uppercase block font-sans font-['Epilogue']">Facturado</span>
                <span class="text-xs font-bold text-on-surface">{{ money(item.grossRevenueGenerated) }}</span>
              </div>
              <div>
                <span class="text-[9px] text-outline uppercase block font-sans font-['Epilogue']">Cachés Pagados</span>
                <span class="text-xs font-bold text-rose-400">{{ money(item.artistFeesReceived) }}</span>
              </div>
              <div>
                <span class="text-[9px] text-outline uppercase block font-sans font-['Epilogue']">ROI Directo</span>
                <span class="text-xs font-bold text-cyan-400">{{ item.roiPercent }}%</span>
              </div>
            </div>

            <!-- Resumen de Shows y Acciones -->
            <div class="flex items-center justify-between pt-2 text-xs border-t border-white/10">
              <span class="text-outline font-medium font-['Epilogue']">
                🎯 {{ item.totalShows }} actuaciones ({{ item.privateQuotesCount }} privadas · {{ item.massiveEventsCount }} masivas)
              </span>

              <button
                type="button"
                (click)="selectTalent.emit(item)"
                class="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-black border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer font-['Epilogue']"
              >
                <span class="material-symbols-outlined text-sm">receipt</span>
                Estado de Cuenta
              </button>
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class FinanceTabTalentComponent {
  performance = input.required<GroupFinancialPerformance[]>();
  selectTalent = output<GroupFinancialPerformance>();

  money = money;
}
