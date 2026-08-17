import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenreDistribution, MonthlyAttendancePeak, CityPerformance } from '../../../core/models/stats.models';
import { formatNumber, compactNumber } from '../stats-metrics';

/**
 * Pestaña 1: Resumen Global de Estadísticas.
 *
 * Muestra las tendencias anuales de asistencia, la distribución
 * por género musical del catálogo y el rendimiento por plaza/ciudad.
 */
@Component({
  selector: 'app-stats-tab-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ─── 1. GRÁFICA DE ASISTENCIA MENSUAL & TEMPORADAS PICO ─── -->
      <div class="p-6 sm:p-7 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h3 class="text-base font-black text-on-surface flex items-center gap-2 font-['Epilogue']">
              <span class="material-symbols-outlined text-primary text-xl">bar_chart</span>
              Concurrencia Mensual de Audiencia & Estacionalidad (Ciclo 2026)
            </h3>
            <p class="text-xs text-outline mt-0.5 font-['Epilogue']">Aforo auditado en palenques, estadios, festivales y recintos de gira</p>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold font-['Epilogue']">
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Temporadas de Alta Demanda
            </span>
          </div>
        </div>

        <!-- Barras de Gráfica Mensual -->
        <div class="grid grid-cols-12 gap-1.5 sm:gap-3 items-end h-64 sm:h-72 pt-8 pb-2 px-2">
          @for (m of monthly(); track m.month) {
            <div class="flex flex-col items-center gap-2 h-full justify-end group relative">

              <!-- Tooltip en hover -->
              <div class="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[10px] font-mono px-2.5 py-1.5 rounded-xl pointer-events-none whitespace-nowrap shadow-2xl z-20 border border-white/20">
                <span class="font-bold block font-['Epilogue']">{{ m.monthFullName }}</span>
                <span>{{ formatNumber(m.attendance) }} asistentes</span>
                @if (m.seasonLabel) {
                  <span class="text-amber-300 block font-sans font-bold">{{ m.seasonLabel }}</span>
                }
              </div>

              <!-- Etiqueta de cantidad arriba de la barra -->
              <span class="text-[9px] sm:text-[10px] font-mono font-bold text-outline group-hover:text-on-surface transition-colors">
                {{ compactNumber(m.attendance) }}
              </span>

              <!-- Barra -->
              <div class="w-full max-w-[36px] bg-[#141414] rounded-t-xl overflow-hidden flex flex-col justify-end transition-all group-hover:scale-105 h-full max-h-[180px] border border-white/5">
                <div
                  class="w-full rounded-t-xl transition-all duration-700"
                  [class]="m.isPeakSeason ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-lg shadow-amber-500/20' : 'bg-gradient-to-t from-primary/80 to-primary group-hover:from-primary group-hover:to-primary-hover'"
                  [style.height.%]="(m.attendance / 60000) * 100"
                ></div>
              </div>

              <!-- Nombre del Mes -->
              <span class="text-[10px] sm:text-xs font-bold uppercase transition-colors font-mono" [class]="m.isPeakSeason ? 'text-amber-300' : 'text-outline'">
                {{ m.month }}
              </span>
            </div>
          }
        </div>
      </div>

      <!-- ─── 2. DOS COLUMNAS: GÉNEROS Y PLAZAS PRINCIPALES ─── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- 2.1 DISTRIBUCIÓN POR GÉNERO MUSICAL -->
        <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-5">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
                music_note
              </span>
              <div>
                <h3 class="text-sm font-black text-on-surface font-['Epilogue']">Participación de Mercado por Género</h3>
                <p class="text-[11px] text-outline font-['Epilogue']">Distribución porcentual de convocatoria por vertiente musical</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            @for (g of genres(); track g.genre) {
              <div class="space-y-1.5">
                <div class="flex justify-between items-center text-xs">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full" [class]="g.colorClass"></span>
                    <span class="font-bold text-on-surface font-['Epilogue']">{{ g.genre }}</span>
                  </div>
                  <div class="flex items-center gap-3 font-mono">
                    <span class="text-outline text-[11px]">{{ formatNumber(g.totalAudience) }} asistentes</span>
                    <span class="font-bold text-primary">{{ g.percentShare }}%</span>
                  </div>
                </div>

                <div class="w-full h-2.5 bg-[#141414] rounded-full overflow-hidden border border-white/5">
                  <div
                    class="h-full rounded-full transition-all duration-700"
                    [class]="g.colorClass"
                    [style.width.%]="g.percentShare"
                  ></div>
                </div>

                <div class="flex items-center justify-between text-[10px] text-outline font-['Epilogue']">
                  <span>{{ g.eventsCount }} conciertos masivos</span>
                  <span>{{ g.quotesCount }} contrataciones privadas</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- 2.2 TOP PLAZAS / CIUDADES CON MÁS CONVOCATORIA -->
        <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-5">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
                location_city
              </span>
              <div>
                <h3 class="text-sm font-black text-on-surface font-['Epilogue']">Plazas Regionales Estratégicas</h3>
                <p class="text-[11px] text-outline font-['Epilogue']">Ciudades con mayor volumen de taquilla y contratación</p>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            @for (c of cities(); track c.city; let i = $index) {
              <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/5 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-7 h-7 rounded-xl bg-[#202020] text-primary font-black text-xs font-mono flex items-center justify-center border border-white/10 shrink-0 shadow-sm">
                    #{{ i + 1 }}
                  </span>
                  <div class="min-w-0">
                    <h4 class="text-xs font-black text-on-surface truncate font-['Epilogue']">{{ c.city }}, {{ c.state }}</h4>
                    <p class="text-[10px] text-outline font-['Epilogue']">{{ c.eventsCount }} masivos · {{ c.privateQuotesCount }} privadas</p>
                  </div>
                </div>

                <div class="text-right font-mono shrink-0">
                  <span class="text-xs font-black text-cyan-300 block">{{ formatNumber(c.totalAudience) }} asistentes</span>
                  <span class="text-[10px] text-emerald-400 font-sans font-bold font-mono">+{{ c.growthPercent }}% YoY</span>
                </div>
              </div>
            }
          </div>
        </div>

      </div>

    </div>
  `
})
export class StatsTabOverviewComponent {
  genres = input<GenreDistribution[]>([]);
  monthly = input<MonthlyAttendancePeak[]>([]);
  cities = input<CityPerformance[]>([]);

  formatNumber = formatNumber;
  compactNumber = compactNumber;
}
