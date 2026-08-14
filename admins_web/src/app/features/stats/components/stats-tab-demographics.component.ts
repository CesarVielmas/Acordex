import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudienceDemographics } from '../../../core/models/stats.models';
import { formatNumber } from '../stats-metrics';

/**
 * Pestaña 5: Demografía de Fans & Canales de Compra.
 *
 * Muestra la composición de la audiencia por edad, género,
 * y los canales de compra preferidos por el público de Acordex.
 */
@Component({
  selector: 'app-stats-tab-demographics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg">
              demography
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Demografía de la Fanbase & Canales de Venta</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Perfil de los asistentes a conciertos, rangos de edad y métodos de compra de boletos</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- 1. RANGOS DE EDAD -->
        <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-5 lg:col-span-2">
          <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-lg">group</span>
              <h3 class="text-sm font-black text-on-surface">Distribución por Rangos de Edad</h3>
            </div>
            <span class="text-xs text-outline font-mono">100% de la muestra</span>
          </div>

          <div class="space-y-4">
            @for (age of demographics()?.ageRanges; track age.label) {
              <div class="space-y-1.5 p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20">
                <div class="flex justify-between items-center text-xs">
                  <div>
                    <span class="font-black text-on-surface">{{ age.label }}</span>
                    <span class="text-outline text-[11px] ml-2 font-sans">Prefieren: <b class="text-primary">{{ age.favoriteGenre }}</b></span>
                  </div>
                  <span class="font-mono font-black text-sm text-cyan-300">{{ age.percent }}%</span>
                </div>

                <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-700"
                    [class]="age.colorClass"
                    [style.width.%]="age.percent"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- 2. GÉNERO DE AUDIENCIA -->
        <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-5">
          <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-purple-400 text-lg">wc</span>
              <h3 class="text-sm font-black text-on-surface">Género del Público</h3>
            </div>
          </div>

          <div class="space-y-3">
            @for (gen of demographics()?.genderDistribution; track gen.gender) {
              <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center material-symbols-outlined text-base">
                    {{ gen.icon }}
                  </span>
                  <span class="text-xs font-bold text-on-surface">{{ gen.gender }}</span>
                </div>
                <span class="text-sm font-mono font-black text-purple-300">{{ gen.percent }}%</span>
              </div>
            }
          </div>
        </div>

      </div>

      <!-- 3. CANALES DE COMPRA DE BOLETOS -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-5">
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-emerald-400 text-lg">point_of_sale</span>
            <h3 class="text-sm font-black text-on-surface">Canales de Compra de Boletos Preferidos</h3>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          @for (ch of demographics()?.purchaseChannels; track ch.channel) {
            <div class="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/20 hover:border-emerald-500/40 transition-all space-y-3">
              <div class="flex items-center justify-between gap-2">
                <span class="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center material-symbols-outlined text-xl">
                  {{ ch.icon }}
                </span>
                <span class="text-lg font-mono font-black text-emerald-300">{{ ch.percent }}%</span>
              </div>

              <div>
                <h4 class="text-xs font-black text-on-surface">{{ ch.channel }}</h4>
                <p class="text-[11px] text-outline font-mono mt-0.5">{{ formatNumber(ch.ticketsCount) }} boletos adquiridos</p>
              </div>

              <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  [style.width.%]="ch.percent"
                ></div>
              </div>
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class StatsTabDemographicsComponent {
  demographics = input<AudienceDemographics>();
  formatNumber = formatNumber;
}
