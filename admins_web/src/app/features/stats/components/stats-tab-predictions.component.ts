import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrendPrediction } from '../../../core/models/stats.models';

/**
 * Pestaña 6: Tendencias & Predicciones Inteligentes.
 *
 * Ofrece análisis predictivo para fechas clave, detección de
 * agrupaciones en auge y recomendaciones de comercialización.
 */
@Component({
  selector: 'app-stats-tab-predictions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
              auto_awesome
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface font-['Epilogue']">Modelado Predictivo de Demanda & Oportunidades de Gira</h2>
          </div>
          <p class="text-xs text-outline mt-0.5 font-['Epilogue']">Detección de patrones de absorción de taquilla, proyección de plazas de alta rentabilidad y recomendaciones ejecutivas</p>
        </div>

        <button
          type="button"
          (click)="printReport()"
          class="px-4 py-2 rounded-2xl bg-[#222222] hover:bg-[#282828] border border-white/10 text-xs font-bold text-outline hover:text-on-surface transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer font-['Epilogue']"
        >
          <span class="material-symbols-outlined text-base">print</span>
          Imprimir Dictamen
        </button>
      </div>

      <!-- TARJETAS DE PREDICCIONES -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (item of predictions(); track item.id) {
          <div class="p-6 rounded-3xl bg-[#181818] border shadow-xl space-y-4 relative overflow-hidden transition-all hover:scale-[1.01]"
            [class]="item.impactLevel === 'alto' ? 'border-primary/40' : (item.impactLevel === 'oportunidad' ? 'border-emerald-500/40' : 'border-white/10')">

            <!-- Encabezado con Categoría e Impacto -->
            <div class="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div class="space-y-1">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono"
                  [class]="item.impactLevel === 'alto' ? 'bg-primary/15 text-primary border border-primary/30' : (item.impactLevel === 'oportunidad' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/15 text-purple-300 border border-purple-500/30')">
                  Impacto {{ item.impactLevel | uppercase }}
                </span>
                <h3 class="text-sm font-black text-on-surface font-['Epilogue']">{{ item.title }}</h3>
              </div>

              <span class="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-[#141414] border border-white/10 text-cyan-300 shrink-0 shadow-sm">
                {{ item.expectedGrowth }}
              </span>
            </div>

            <!-- Diagnóstico -->
            <p class="text-xs text-outline leading-relaxed font-['Epilogue']">
              {{ item.predictionText }}
            </p>

            <!-- Acción recomendada -->
            <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/5 space-y-1 shadow-inner">
              <span class="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1 font-['Epilogue']">
                <span class="material-symbols-outlined text-sm">lightbulb</span> Dictamen Estratégico Recomendado
              </span>
              <p class="text-xs font-bold text-on-surface font-['Epilogue']">
                {{ item.recommendedAction }}
              </p>
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class StatsTabPredictionsComponent {
  predictions = input<TrendPrediction[]>([]);

  printReport(): void {
    window.print();
  }
}
