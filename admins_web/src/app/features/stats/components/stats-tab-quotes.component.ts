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
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center material-symbols-outlined text-lg">
              funnel
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Embudo de Cotizaciones & Contrataciones</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Tasa de conversión de solicitudes, contratos cerrados y tipos de eventos privados</p>
        </div>
      </div>

      <!-- ─── 1. EMBUDO DE CONVERSIÓN DE COTIZACIONES ─── -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-5">
        <h3 class="text-sm font-black text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-base">filter_alt</span>
          Embudo de Conversión de Cotizaciones (De Solicitud a Firma)
        </h3>

        <div class="space-y-3">
          @for (step of funnel(); track step.stepName; let idx = $index) {
            <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-2">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 rounded-xl bg-surface-container text-primary font-mono font-black text-xs flex items-center justify-center border border-outline-variant/30">
                    #{{ idx + 1 }}
                  </span>
                  <div>
                    <h4 class="text-xs font-black text-on-surface">{{ step.stepName }}</h4>
                    <p class="text-[10px] text-outline">{{ step.description }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-4 text-xs font-mono self-end sm:self-auto">
                  <span class="font-black text-on-surface text-sm">{{ step.count }} Contratos</span>
                  <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
                    {{ step.percentFromTotal }}% del total
                  </span>
                </div>
              </div>

              <!-- Barra de progreso del embudo -->
              <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-purple-500 via-primary to-emerald-400 rounded-full transition-all duration-700"
                  [style.width.%]="step.percentFromTotal"
                ></div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ─── 2. TIPOS DE CELEBRACIÓN PRIVADA MÁS SOLICITADOS ─── -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-5">
        <h3 class="text-sm font-black text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined text-purple-400 text-base">celebration</span>
          Tipos de Fiestas y Eventos Privados
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (item of eventTypes(); track item.eventType) {
            <div class="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/20 hover:border-purple-500/40 transition-all space-y-3">
              <div class="flex items-center justify-between gap-2">
                <span class="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-300 flex items-center justify-center material-symbols-outlined text-xl">
                  {{ item.icon }}
                </span>
                <span class="text-xs font-mono font-black text-purple-300">{{ item.percentShare }}%</span>
              </div>

              <div>
                <h4 class="text-xs font-black text-on-surface">{{ item.eventType }}</h4>
                <p class="text-[10px] text-outline">{{ item.count }} fechas cerradas</p>
              </div>

              <div class="pt-2 border-t border-outline-variant/20 text-xs font-mono">
                <div class="flex justify-between text-[11px]">
                  <span class="text-outline font-sans">Ticket Promedio:</span>
                  <span class="font-bold text-on-surface">{{ money(item.avgAmount) }}</span>
                </div>
                <div class="flex justify-between text-[11px] pt-0.5">
                  <span class="text-outline font-sans">Facturado Total:</span>
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
