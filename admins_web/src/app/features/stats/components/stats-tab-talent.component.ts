import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtistStatsDetail } from '../../../core/models/stats.models';
import { formatNumber, compactNumber } from '../stats-metrics';

/**
 * Pestaña 4: Talento & Redes Sociales / Streaming.
 *
 * Muestra el impacto en Spotify, TikTok, Instagram y satisfacción
 * del público para cada artista del catálogo de Acordex.
 */
@Component({
  selector: 'app-stats-tab-talent',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center material-symbols-outlined text-lg">
              cell_tower
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Impacto Digital, Streaming & Redes Sociales</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Oyentes mensuales en Spotify, seguidores de TikTok, rating del público y popularidad</p>
        </div>
      </div>

      <!-- CARDS DE ARTISTAS -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (item of artists(); track item.groupId; let i = $index) {
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-5 relative overflow-hidden transition-all hover:border-emerald-500/50">

            <!-- Encabezado con Foto y Tendencia -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="relative shrink-0">
                  <img
                    [src]="item.image"
                    [alt]="item.groupName"
                    class="w-14 h-14 rounded-2xl object-cover border-2 border-outline-variant/40"
                  />
                  <span class="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-surface-container-highest text-emerald-400 border border-outline-variant/30 flex items-center justify-center text-[10px] font-black font-mono">
                    #{{ i + 1 }}
                  </span>
                </div>

                <div class="min-w-0">
                  <h4 class="text-sm font-black text-on-surface truncate">{{ item.groupName }}</h4>
                  <p class="text-xs text-outline">{{ item.genre }} · {{ item.disqueraType }}</p>
                  <div class="flex items-center gap-1.5 mt-1">
                    <span class="text-amber-400 material-symbols-outlined text-sm">star</span>
                    <span class="text-xs font-bold text-on-surface">{{ item.publicRating }}★</span>
                    <span class="text-[10px] text-outline">({{ item.satisfactionPercent }}% aprobación)</span>
                  </div>
                </div>
              </div>

              <!-- Score de Tendencia -->
              <div class="text-right shrink-0">
                <span class="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-block">
                  {{ item.trendingScore }} pts
                </span>
                <span class="text-[9px] text-outline uppercase block mt-0.5">Popularidad</span>
              </div>
            </div>

            <!-- Redes Sociales y Streaming Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-center text-xs">
              <div class="p-2.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
                <span class="text-[9px] font-sans text-outline uppercase block">Spotify</span>
                <span class="font-black text-emerald-400">{{ compactNumber(item.spotifyMonthlyListeners) }}</span>
              </div>
              <div class="p-2.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
                <span class="text-[9px] font-sans text-outline uppercase block">TikTok</span>
                <span class="font-black text-purple-300">{{ compactNumber(item.tikTokFollowers) }}</span>
              </div>
              <div class="p-2.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
                <span class="text-[9px] font-sans text-outline uppercase block">Instagram</span>
                <span class="font-black text-pink-400">{{ compactNumber(item.instagramFollowers) }}</span>
              </div>
              <div class="p-2.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
                <span class="text-[9px] font-sans text-outline uppercase block">Engagement</span>
                <span class="font-black text-primary">{{ item.engagementRatePercent }}%</span>
              </div>
            </div>

            <!-- Resumen de Shows y Audiencia -->
            <div class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-outline text-base">stadium</span>
                <span class="text-outline">{{ item.totalShows }} presentaciones en vivo</span>
              </div>
              <span class="font-mono font-bold text-on-surface">{{ formatNumber(item.totalAudienceAttended) }} fans atendidos</span>
            </div>

            <!-- Botón de Ficha -->
            <div class="pt-2 border-t border-outline-variant/20 flex justify-end">
              <button
                type="button"
                (click)="selectArtist.emit(item)"
                class="px-4 py-2 rounded-xl bg-surface-container-highest hover:bg-emerald-500 hover:text-black text-on-surface text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-base">query_stats</span>
                Ver Ficha Digital & Canciones Top
              </button>
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class StatsTabTalentComponent {
  artists = input<ArtistStatsDetail[]>([]);
  selectArtist = output<ArtistStatsDetail>();

  formatNumber = formatNumber;
  compactNumber = compactNumber;
}
