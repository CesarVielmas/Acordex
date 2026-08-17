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
      <div class="w-full max-w-2xl rounded-3xl bg-[#1A1A1A] border border-white/10 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="space-y-0.5">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 uppercase font-mono shadow-sm">
              Auditoría de Taquilla & Aforo
            </span>
            <h3 class="text-base font-black text-on-surface font-['Epilogue']">{{ event().title }}</h3>
            <p class="text-xs text-outline font-['Epilogue']">{{ event().venueName }} · {{ event().city }}, {{ event().state }}</p>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-[#222222] text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Métricas Principales -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
          <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/5 shadow-inner">
            <span class="text-[9px] text-outline uppercase block font-['Epilogue'] font-bold">Capacidad Instalada</span>
            <span class="text-sm font-black text-on-surface">{{ formatNumber(event().capacity) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 shadow-inner">
            <span class="text-[9px] text-emerald-400 uppercase block font-['Epilogue'] font-black">Boletos Colocados</span>
            <span class="text-sm font-black text-emerald-300">{{ formatNumber(event().ticketsSold) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/5 shadow-inner">
            <span class="text-[9px] text-outline uppercase block font-['Epilogue'] font-bold">Ocupación Recinto</span>
            <span class="text-sm font-black text-primary">{{ event().occupancyPercent }}%</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/5 shadow-inner">
            <span class="text-[9px] text-outline uppercase block font-['Epilogue'] font-bold">Facturación Bruta</span>
            <span class="text-sm font-black text-cyan-300">{{ money(event().grossRevenue) }}</span>
          </div>
        </div>

        <!-- Desglose de Zonas -->
        <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-3">
          <h4 class="text-xs font-bold text-on-surface font-['Epilogue']">Desglose de Absorción por Localidad:</h4>
          <div class="space-y-2.5 text-xs">
            @for (z of event().zoneBreakdown; track z.zoneName) {
              <div class="space-y-1">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-on-surface font-['Epilogue']">{{ z.zoneName }} ({{ money(z.price) }}/boleto)</span>
                  <div class="flex items-center gap-2 font-mono">
                    <span class="text-outline">{{ formatNumber(z.sold) }}/{{ formatNumber(z.capacity) }}</span>
                    <span class="font-bold text-primary">{{ z.occupancyPercent }}%</span>
                  </div>
                </div>
                <div class="w-full h-2 bg-[#202020] rounded-full overflow-hidden border border-white/5">
                  <div
                    class="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full shadow-sm"
                    [style.width.%]="z.occupancyPercent"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Comportamiento de Compra -->
        <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-2 text-xs font-['Epilogue']">
          <h4 class="text-xs font-bold text-on-surface">Patrones Comerciales & Demografía</h4>
          <div class="flex justify-between text-outline">
            <span>Ventana / Hora Pico de Compra:</span>
            <span class="font-bold text-on-surface">{{ event().peakSalesHour }}</span>
          </div>
          <div class="flex justify-between text-outline">
            <span>Segmento Demográfico Predominante:</span>
            <span class="font-bold text-on-surface">{{ event().demographicDominantAge }}</span>
          </div>
          @if (event().daysToSellOut) {
            <div class="flex justify-between text-outline">
              <span>Velocidad de Absorción Localidades VIP:</span>
              <span class="font-bold text-emerald-300 font-mono">{{ event().daysToSellOut }} días tras apertura</span>
            </div>
          }
        </div>

        <!-- Botón de Cerrar -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-on-primary text-xs font-black shadow-lg shadow-primary/20 hover:opacity-95 transition-all cursor-pointer font-['Epilogue']"
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
