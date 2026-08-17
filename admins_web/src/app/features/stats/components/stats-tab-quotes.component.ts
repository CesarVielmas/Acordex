import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoteConversionFunnel, PrivateEventTypeStat } from '../../../core/models/stats.models';
import { formatNumber } from '../stats-metrics';
import { money } from '../../finances/finance-metrics';

/**
 * Pestaña 3: Estadísticas de Cotizaciones & Contrataciones Privadas.
 *
 * Muestra el embudo de conversión de clientes, los tipos de
 * eventos sociales más solicitados y los tickets promedio.
 */
@Component({
  selector: 'app-stats-tab-quotes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
              filter_alt
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface font-['Epilogue']">Embudo de Conversión Comercial (Pipeline)</h2>
          </div>
          <p class="text-xs text-outline mt-0.5 font-['Epilogue']">Tasa de conversión por etapas de negociación, contrataciones formalizadas y segmentación por ocasión social</p>
        </div>
      </div>

      <!-- ─── 1. EMBUDO DE CONVERSIÓN DE COTIZACIONES ─── -->
      <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-5">
        <h3 class="text-sm font-black text-on-surface flex items-center gap-2 font-['Epilogue']">
          <span class="material-symbols-outlined text-primary text-base">filter_alt</span>
          Etapas del Embudo de Negociación (Prospección a Cierre de Contrato)
        </h3>

        <div class="space-y-3">
          @for (step of funnel(); track step.stepName; let idx = $index) {
            <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-2">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 rounded-xl bg-[#202020] text-primary font-mono font-black text-xs flex items-center justify-center border border-white/10 shadow-sm">
                    #{{ idx + 1 }}
                  </span>
                  <div>
                    <h4 class="text-xs font-black text-on-surface font-['Epilogue']">{{ step.stepName }}</h4>
                    <p class="text-[10px] text-outline font-['Epilogue']">{{ step.description }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-4 text-xs font-mono self-end sm:self-auto">
                  <span class="font-black text-on-surface text-sm">{{ step.count }} Contratos</span>
                  <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 shadow-sm">
                    {{ step.percentFromTotal }}% conversión
                  </span>
                </div>
              </div>

              <!-- Barra de progreso del embudo -->
              <div class="w-full h-2.5 bg-[#202020] rounded-full overflow-hidden border border-white/5">
                <div
                  class="h-full bg-gradient-to-r from-purple-500 via-primary to-emerald-400 rounded-full transition-all duration-700 shadow-sm"
                  [style.width.%]="step.percentFromTotal"
                ></div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ─── 2. TIPOS DE CELEBRACIÓN PRIVADA MÁS SOLICITADOS ─── -->
      <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-5">
        <h3 class="text-sm font-black text-on-surface flex items-center gap-2 font-['Epilogue']">
          <span class="material-symbols-outlined text-purple-400 text-base">celebration</span>
          Segmentación de Contrataciones Privadas por Ocasión
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (item of eventTypes(); track item.eventType) {
            <div class="p-5 rounded-3xl bg-[#141414] border border-white/5 hover:border-purple-500/40 transition-all space-y-3 shadow-inner">
              <div class="flex items-center justify-between gap-2">
                <span class="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-300 flex items-center justify-center material-symbols-outlined text-xl shadow-inner">
                  {{ item.icon }}
                </span>
                <span class="text-xs font-mono font-black text-purple-300">{{ item.percentShare }}%</span>
              </div>

              <div>
                <h4 class="text-xs font-black text-on-surface font-['Epilogue']">{{ item.eventType }}</h4>
                <p class="text-[10px] text-outline font-['Epilogue']">{{ item.count }} fechas formalizadas</p>
              </div>

              <div class="pt-2 border-t border-white/10 text-xs font-mono">
                <div class="flex justify-between text-[11px]">
                  <span class="text-outline font-['Epilogue']">Caché Promedio:</span>
                  <span class="font-bold text-on-surface">{{ money(item.avgAmount) }}</span>
                </div>
                <div class="flex justify-between text-[11px] pt-0.5">
                  <span class="text-outline font-['Epilogue']">Facturación Total:</span>
                  <span class="font-bold text-emerald-300">{{ money(item.totalRevenue) }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class StatsTabQuotesComponent {
  funnel = input<QuoteConversionFunnel[]>([]);
  eventTypes = input<PrivateEventTypeStat[]>([]);

  formatNumber = formatNumber;
  money = money;
}
