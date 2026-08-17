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
      <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
              confirmation_number
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface font-['Epilogue']">Boletería, Aforos & Rendimiento de Taquilla</h2>
          </div>
          <p class="text-xs text-outline mt-0.5 font-['Epilogue']">Control de capacidad instalada, absorción de localidades VIP/General y ritmo comercial de venta</p>
        </div>
      </div>

      <!-- LISTA DE EVENTOS -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        @for (item of events(); track item.eventId) {
          <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-5 relative overflow-hidden transition-all hover:border-primary/50">

            <!-- Encabezado del Evento -->
            <div class="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#141414] text-outline border border-white/10 font-mono">
                  {{ item.date }} · {{ item.city }}
                </span>
                <h3 class="text-base font-black text-on-surface mt-1 font-['Epilogue']">{{ item.title }}</h3>
                <p class="text-xs text-outline font-['Epilogue']">{{ item.venueName }}</p>
              </div>

              <div class="text-right font-mono">
                <span class="text-lg font-black text-primary block">{{ item.occupancyPercent }}%</span>
                <span class="text-[10px] text-outline font-['Epilogue']">Ocupación Recinto</span>
              </div>
            </div>

            <!-- Métricas Clave -->
            <div class="grid grid-cols-3 gap-3 font-mono text-center">
              <div class="p-3 rounded-2xl bg-[#141414] border border-white/5">
                <span class="text-[9px] font-['Epilogue'] font-bold text-outline uppercase block">Aforo Total</span>
                <span class="text-xs font-black text-on-surface">{{ formatNumber(item.capacity) }}</span>
              </div>
              <div class="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                <span class="text-[9px] font-['Epilogue'] font-bold text-emerald-400 uppercase block">Boletos Vendidos</span>
                <span class="text-xs font-black text-emerald-300">{{ formatNumber(item.ticketsSold) }}</span>
              </div>
              <div class="p-3 rounded-2xl bg-[#141414] border border-white/5">
                <span class="text-[9px] font-['Epilogue'] font-bold text-outline uppercase block">Facturación Bruta</span>
                <span class="text-xs font-black text-on-surface">{{ money(item.grossRevenue) }}</span>
              </div>
            </div>

            <!-- Desglose de Zonas -->
            <div class="space-y-2">
              <h4 class="text-xs font-bold text-on-surface font-['Epilogue']">Desglose de Absorción por Localidad:</h4>
              <div class="space-y-2 text-xs">
                @for (z of item.zoneBreakdown; track z.zoneName) {
                  <div class="p-2.5 rounded-xl bg-[#141414] border border-white/5 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="font-bold text-on-surface truncate font-['Epilogue']">{{ z.zoneName }}</span>
                      @if (z.soldOut) {
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase font-mono">
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
            <div class="pt-2 border-t border-white/10 flex justify-end">
              <button
                type="button"
                (click)="selectEvent.emit(item)"
                class="px-4 py-2 rounded-xl bg-[#222222] hover:bg-primary hover:text-black text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-['Epilogue']"
              >
                <span class="material-symbols-outlined text-base">analytics</span>
                Auditoría de Taquilla & Accesos
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
