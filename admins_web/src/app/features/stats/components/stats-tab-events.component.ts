import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventStatsDetail } from '../../../core/models/stats.models';
import { formatNumber } from '../stats-metrics';
import { money } from '../../finances/finance-metrics';

/**
 * Pestaña 2: Estadísticas de Eventos Masivos & Taquilla.
 *
 * Muestra el desempeño de cada palenque, festival y baile masivo,
 * con aforos, boletos por zona y ritmo de venta.
 */
@Component({
  selector: 'app-stats-tab-events',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg">
              confirmation_number
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Eventos Masivos & Ocupación de Taquilla</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Control de aforo, venta de localidades VIP/General y ritmo de boletaje</p>
        </div>
      </div>

      <!-- LISTA DE EVENTOS -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        @for (item of events(); track item.eventId) {
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-5 relative overflow-hidden transition-all hover:border-primary/50">

            <!-- Encabezado del Evento -->
            <div class="flex items-start justify-between gap-3 border-b border-outline-variant/20 pb-4">
              <div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container-highest text-outline border border-outline-variant/30">
                  {{ item.date }} · {{ item.city }}
                </span>
                <h3 class="text-base font-black text-on-surface mt-1">{{ item.title }}</h3>
                <p class="text-xs text-outline">{{ item.venueName }}</p>
              </div>

              <div class="text-right font-mono">
                <span class="text-lg font-black text-primary block">{{ item.occupancyPercent }}%</span>
                <span class="text-[10px] text-outline font-sans">Ocupación Recinto</span>
              </div>
            </div>

            <!-- Métricas Clave -->
            <div class="grid grid-cols-3 gap-3 font-mono text-center">
              <div class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20">
                <span class="text-[9px] font-sans font-bold text-outline uppercase block">Capacidad</span>
                <span class="text-xs font-black text-on-surface">{{ formatNumber(item.capacity) }}</span>
              </div>
              <div class="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                <span class="text-[9px] font-sans font-bold text-emerald-400 uppercase block">Boletos Vendidos</span>
                <span class="text-xs font-black text-emerald-300">{{ formatNumber(item.ticketsSold) }}</span>
              </div>
              <div class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20">
                <span class="text-[9px] font-sans font-bold text-outline uppercase block">Facturado</span>
                <span class="text-xs font-black text-on-surface">{{ money(item.grossRevenue) }}</span>
              </div>
            </div>

            <!-- Desglose de Zonas -->
            <div class="space-y-2">
              <h4 class="text-xs font-bold text-on-surface">Venta por Zonas y Localidades:</h4>
              <div class="space-y-2 text-xs">
                @for (z of item.zoneBreakdown; track z.zoneName) {
                  <div class="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="font-bold text-on-surface truncate">{{ z.zoneName }}</span>
                      @if (z.soldOut) {
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                          Sold Out
                        </span>
                      }
                    </div>
                    <div class="flex items-center gap-3 font-mono shrink-0">
                      <span class="text-outline text-[11px]">{{ formatNumber(z.sold) }}/{{ formatNumber(z.capacity) }}</span>
                      <span class="font-bold text-primary">{{ z.occupancyPercent }}%</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Botón de Detalle Estadístico -->
            <div class="pt-2 border-t border-outline-variant/20 flex justify-end">
              <button
                type="button"
                (click)="selectEvent.emit(item)"
                class="px-4 py-2 rounded-xl bg-surface-container-highest hover:bg-primary hover:text-on-primary text-on-surface text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-base">analytics</span>
                Ver Detalle & Horas Pico
              </button>
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class StatsTabEventsComponent {
  events = input<EventStatsDetail[]>([]);
  selectEvent = output<EventStatsDetail>();

  formatNumber = formatNumber;
  money = money;
}
