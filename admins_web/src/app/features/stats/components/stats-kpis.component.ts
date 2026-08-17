import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalStatsSummary } from '../../../core/models/stats.models';
import { formatNumber, compactNumber } from '../stats-metrics';

/**
 * Barra superior de KPIs de Estadísticas & Audiencia de Acordex.
 *
 * Muestra en tarjetas limpias e intuitivas:
 * 1. Boletos Vendidos Totales
 * 2. Asistencia Real en Conciertos
 * 3. Contrataciones Privadas Concluidas
 * 4. Oyentes & Seguidores en Redes
 * 5. Ocupación Promedio de Recintos
 */
@Component({
  selector: 'app-stats-kpis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

      <!-- 1. BOLETOS VENDIDOS -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-primary/30 shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
        <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-primary uppercase tracking-widest font-['Epilogue']">Boletería Colocada</span>
          <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
            confirmation_number
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-xl sm:text-2xl font-black text-on-surface font-mono tracking-tight">{{ formatNumber(summary()?.totalTicketsSold || 0) }}</p>
          <div class="flex items-center gap-1 text-[11px] text-emerald-400 font-bold font-['Epilogue']">
            <span class="material-symbols-outlined text-sm">trending_up</span>
            <span>{{ summary()?.totalMassiveEvents || 0 }} espectáculos masivos</span>
          </div>
        </div>
      </div>

      <!-- 2. ASISTENCIA EN VIVO -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-cyan-500/30 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all duration-300">
        <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-cyan-400 uppercase tracking-widest font-['Epilogue']">Aforo & Asistencia en Vivo</span>
          <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
            groups
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-xl sm:text-2xl font-black text-on-surface font-mono tracking-tight">{{ formatNumber(summary()?.totalLiveAttendance || 0) }}</p>
          <div class="flex items-center gap-1 text-[11px] text-cyan-300 font-['Epilogue']">
            <span>Audiencia en recintos y palenques</span>
          </div>
        </div>
      </div>

      <!-- 3. CONTRATACIONES PRIVADAS -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-purple-500/30 shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
        <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-purple-300 uppercase tracking-widest font-['Epilogue']">Contrataciones Privadas</span>
          <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
            celebration
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-xl sm:text-2xl font-black text-purple-300 font-mono tracking-tight">{{ summary()?.totalPrivateBookings || 0 }} Fechas</p>
          <div class="flex items-center gap-1 text-[11px] text-purple-200 font-['Epilogue']">
            <span>{{ summary()?.conversionRatePercent || 0 }}% tasa de conversión</span>
          </div>
        </div>
      </div>

      <!-- 4. AUDIENCIA DIGITAL (REDES + SPOTIFY) -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-emerald-500/30 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
        <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-['Epilogue']">Audiencia Digital</span>
          <span class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
            cell_tower
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">{{ compactNumber(summary()?.combinedDigitalAudience || 0) }}</p>
          <div class="flex items-center gap-1 text-[11px] text-emerald-400 font-['Epilogue']">
            <span>Spotify + TikTok + YouTube</span>
          </div>
        </div>
      </div>

      <!-- 5. OCUPACIÓN MEDIA -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-amber-500/30 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
        <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest font-['Epilogue']">Ocupación Media</span>
          <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
            pie_chart
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight">{{ summary()?.avgOccupancyPercent || 0 }}%</p>
          <div class="flex items-center gap-1 text-[11px] text-amber-200 font-['Epilogue']">
            <span>Aforo promedio en cartelera</span>
          </div>
        </div>
      </div>

    </div>
  `
})
export class StatsKpisComponent {
  summary = input<GlobalStatsSummary>();
  formatNumber = formatNumber;
  compactNumber = compactNumber;
}
