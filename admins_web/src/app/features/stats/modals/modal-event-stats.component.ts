import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventStatsDetail } from '../../../core/models/stats.models';
import { formatNumber } from '../stats-metrics';
import { money } from '../../finances/finance-metrics';

/**
 * Modal de Detalle Estadístico por Evento Masivo.
 */
@Component({
  selector: 'app-modal-event-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-2xl rounded-3xl bg-surface-container border border-outline-variant/30 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div class="space-y-0.5">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 uppercase">
              Analítica de Taquilla
            </span>
            <h3 class="text-base font-black text-on-surface">{{ event().title }}</h3>
            <p class="text-xs text-outline">{{ event().venueName }} · {{ event().city }}, {{ event().state }}</p>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-all"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Métricas Principales -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <span class="text-[9px] text-outline uppercase block font-sans">Capacidad Total</span>
            <span class="text-sm font-black text-on-surface">{{ formatNumber(event().capacity) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
            <span class="text-[9px] text-emerald-400 uppercase block font-sans font-bold">Boletos Vendidos</span>
            <span class="text-sm font-black text-emerald-300">{{ formatNumber(event().ticketsSold) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <span class="text-[9px] text-outline uppercase block font-sans">Ocupación</span>
            <span class="text-sm font-black text-primary">{{ event().occupancyPercent }}%</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <span class="text-[9px] text-outline uppercase block font-sans">Ingreso Bruto</span>
            <span class="text-sm font-black text-cyan-300">{{ money(event().grossRevenue) }}</span>
          </div>
        </div>

        <!-- Desglose de Zonas -->
        <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
          <h4 class="text-xs font-bold text-on-surface">Desglose Detallado de Zonas:</h4>
          <div class="space-y-2.5 text-xs">
            @for (z of event().zoneBreakdown; track z.zoneName) {
              <div class="space-y-1">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-on-surface">{{ z.zoneName }} ({{ money(z.price) }}/boleto)</span>
                  <div class="flex items-center gap-2 font-mono">
                    <span class="text-outline">{{ formatNumber(z.sold) }}/{{ formatNumber(z.capacity) }}</span>
                    <span class="font-bold text-primary">{{ z.occupancyPercent }}%</span>
                  </div>
                </div>
                <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                    [style.width.%]="z.occupancyPercent"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Comportamiento de Compra -->
        <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2 text-xs">
          <h4 class="text-xs font-bold text-on-surface">Comportamiento del Público</h4>
          <div class="flex justify-between text-outline">
            <span>Hora Pico de Venta:</span>
            <span class="font-bold text-on-surface">{{ event().peakSalesHour }}</span>
          </div>
          <div class="flex justify-between text-outline">
            <span>Grupo de Edad Dominante:</span>
            <span class="font-bold text-on-surface">{{ event().demographicDominantAge }}</span>
          </div>
          @if (event().daysToSellOut) {
            <div class="flex justify-between text-outline">
              <span>Tiempo de Agotamiento de VIP:</span>
              <span class="font-bold text-emerald-300 font-mono">{{ event().daysToSellOut }} días tras lanzamiento</span>
            </div>
          }
        </div>

        <!-- Botón de Cerrar -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-black hover:bg-primary-hover transition-all"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalEventStatsComponent {
  event = input.required<EventStatsDetail>();
  closed = output<void>();

  formatNumber = formatNumber;
  money = money;
}
