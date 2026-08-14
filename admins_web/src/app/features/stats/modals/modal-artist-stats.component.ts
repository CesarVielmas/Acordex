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
      <div class="w-full max-w-2xl rounded-3xl bg-surface-container border border-outline-variant/30 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-3">
            <img
              [src]="artist().image"
              [alt]="artist().groupName"
              class="w-12 h-12 rounded-2xl object-cover border border-outline-variant/40"
            />
            <div>
              <h3 class="text-base font-black text-on-surface">{{ artist().groupName }}</h3>
              <p class="text-xs text-outline">{{ artist().genre }} · {{ artist().disqueraType }}</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-all"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Métricas Digitales -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <span class="text-[9px] text-outline uppercase block font-sans">Spotify Oyentes</span>
            <span class="text-sm font-black text-emerald-400">{{ compactNumber(artist().spotifyMonthlyListeners) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <span class="text-[9px] text-outline uppercase block font-sans">TikTok Fans</span>
            <span class="text-sm font-black text-purple-300">{{ compactNumber(artist().tikTokFollowers) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <span class="text-[9px] text-outline uppercase block font-sans">YouTube Vistas</span>
            <span class="text-sm font-black text-rose-400">{{ compactNumber(artist().youtubeViewsMonthly) }}</span>
          </div>
          <div class="p-3.5 rounded-2xl bg-primary/15 border border-primary/30">
            <span class="text-[9px] text-primary uppercase block font-sans font-bold">Engagement</span>
            <span class="text-sm font-black text-primary">{{ artist().engagementRatePercent }}%</span>
          </div>
        </div>

        <!-- Canciones Más Escuchadas (Top Tracks) -->
        <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2 text-xs">
          <h4 class="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <span class="material-symbols-outlined text-emerald-400 text-sm">equalizer</span>
            Canciones Más Reproducidas en Plataformas
          </h4>

          <div class="space-y-2">
            @for (song of artist().topSongs; track song.title; let idx = $index) {
              <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-outline font-mono font-bold">{{ idx + 1 }}.</span>
                  <span class="font-bold text-on-surface">{{ song.title }}</span>
                </div>
                <span class="text-xs font-mono font-black text-emerald-300">{{ formatNumber(song.streams) }} streams</span>
              </div>
            }
          </div>
        </div>

        <!-- Resumen de Conciertos -->
        <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2 text-xs">
          <h4 class="text-xs font-bold text-on-surface">Historial en Vivo</h4>
          <div class="flex justify-between text-outline">
            <span>Total de Conciertos Realizados:</span>
            <span class="font-bold text-on-surface">{{ artist().totalShows }} fechas</span>
          </div>
          <div class="flex justify-between text-outline">
            <span>Público Total en Conciertos:</span>
            <span class="font-bold font-mono text-cyan-300">{{ formatNumber(artist().totalAudienceAttended) }} asistentes</span>
          </div>
          <div class="flex justify-between text-outline">
            <span>Aprobación del Público:</span>
            <span class="font-bold text-amber-300 font-mono">{{ artist().publicRating }}★ ({{ artist().satisfactionPercent }}% satisfacción)</span>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-surface-container-high text-outline text-xs font-bold hover:text-on-surface"
          >
            Cerrar
          </button>
          <button
            type="button"
            (click)="printArtistSheet()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span class="material-symbols-outlined text-sm">print</span>
            Imprimir Ficha Digital
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
