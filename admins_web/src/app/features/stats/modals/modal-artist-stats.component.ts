import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtistStatsDetail } from '../../../core/models/stats.models';
import { formatNumber, compactNumber } from '../stats-metrics';

/**
 * Modal de Ficha de Audiencia & Redes Sociales del Artista.
 */
@Component({
  selector: 'app-modal-artist-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-2xl rounded-3xl bg-[#1A1A1A] border border-white/10 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-3">
            <img
              [src]="artist().image"
              [alt]="artist().groupName"
              class="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-md"
            />
            <div>
              <h3 class="text-base font-black text-on-surface font-['Epilogue']">{{ artist().groupName }}</h3>
              <p class="text-xs text-outline font-['Epilogue']">{{ artist().genre }} · {{ artist().disqueraType }}</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-[#222222] text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Métricas Digitales -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
          <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/5 shadow-inner">
            <span class="text-[9px] text-outline uppercase block font-['Epilogue'] font-bold">Spotify Oyentes</span>
            <span class="text-sm font-black text-emerald-400">{{ compactNumber(artist().spotifyMonthlyListeners) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/5 shadow-inner">
            <span class="text-[9px] text-outline uppercase block font-['Epilogue'] font-bold">TikTok Fans</span>
            <span class="text-sm font-black text-purple-300">{{ compactNumber(artist().tikTokFollowers) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/5 shadow-inner">
            <span class="text-[9px] text-outline uppercase block font-['Epilogue'] font-bold">YouTube Vistas</span>
            <span class="text-sm font-black text-rose-400">{{ compactNumber(artist().youtubeViewsMonthly) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-primary/15 border border-primary/30 shadow-inner">
            <span class="text-[9px] text-primary uppercase block font-['Epilogue'] font-black">Engagement</span>
            <span class="text-sm font-black text-primary">{{ artist().engagementRatePercent }}%</span>
          </div>
        </div>

        <!-- Canciones Más Escuchadas (Top Tracks) -->
        <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-2 text-xs">
          <h4 class="text-xs font-bold text-on-surface flex items-center gap-1.5 font-['Epilogue']">
            <span class="material-symbols-outlined text-emerald-400 text-sm">equalizer</span>
            Repertorio Musical con Mayor Tracción en Plataformas
          </h4>

          <div class="space-y-2">
            @for (song of artist().topSongs; track song.title; let idx = $index) {
              <div class="p-2.5 rounded-xl bg-[#181818] border border-white/5 flex items-center justify-between gap-2 shadow-sm">
                <div class="flex items-center gap-2">
                  <span class="text-outline font-mono font-bold">{{ idx + 1 }}.</span>
                  <span class="font-bold text-on-surface font-['Epilogue']">{{ song.title }}</span>
                </div>
                <span class="text-xs font-mono font-black text-emerald-300">{{ formatNumber(song.streams) }} reproducciones</span>
              </div>
            }
          </div>
        </div>

        <!-- Resumen de Conciertos -->
        <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-2 text-xs font-['Epilogue']">
          <h4 class="text-xs font-bold text-on-surface">Historial de Convocatoria en Escenario</h4>
          <div class="flex justify-between text-outline">
            <span>Presentaciones Masivas y Privadas:</span>
            <span class="font-bold text-on-surface">{{ artist().totalShows }} fechas auditadas</span>
          </div>
          <div class="flex justify-between text-outline">
            <span>Aforo Acumulado Atendido:</span>
            <span class="font-bold font-mono text-cyan-300">{{ formatNumber(artist().totalAudienceAttended) }} asistentes</span>
          </div>
          <div class="flex justify-between text-outline">
            <span>Calificación y NPS de Promotores:</span>
            <span class="font-bold text-amber-300 font-mono">{{ artist().publicRating }}★ ({{ artist().satisfactionPercent }}% índice de aprobación)</span>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-[#222222] text-outline text-xs font-bold hover:text-on-surface cursor-pointer font-['Epilogue']"
          >
            Cerrar
          </button>
          <button
            type="button"
            (click)="printArtistSheet()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-sm">print</span>
            Imprimir Ficha Ejecutiva
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalArtistStatsComponent {
  artist = input.required<ArtistStatsDetail>();
  closed = output<void>();

  formatNumber = formatNumber;
  compactNumber = compactNumber;

  printArtistSheet(): void {
    window.print();
  }
}
