import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupProfile, Track } from '../../group-profile.model';

@Component({
  selector: 'app-group-tab-music',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-6 text-xs select-none">

      <!-- RESUMEN DE REPERTORIO -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div class="p-4 rounded-2xl bg-[#18152a] border border-outline-variant/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Canciones Totales</span>
          <span class="text-2xl font-black text-on-surface font-mono">{{ profile().tracks.length }}</span>
        </div>
        <div class="p-4 rounded-2xl bg-[#18152a] border border-primary/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-wider text-primary block">Géneros en Lista</span>
          <span class="text-2xl font-black text-on-surface font-mono">{{ byGenre().length }}</span>
        </div>
        <div class="p-4 rounded-2xl bg-[#18152a] border border-emerald-500/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">Aprobación Prom.</span>
          <span class="text-2xl font-black text-emerald-400 font-mono">{{ avgApproval() }}%</span>
        </div>
        <div class="p-4 rounded-2xl bg-[#18152a] border border-amber-500/30 shadow-md">
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-300 block">Canciones Destacadas</span>
          <span class="text-2xl font-black text-on-surface font-mono">{{ popular().length }}</span>
        </div>
      </section>

      <!-- MÁS POPULARES (RANKING PLAYER STYLE) -->
      <section class="p-5 rounded-3xl bg-gradient-to-br from-primary/15 via-[#18152a] to-[#18152a] border border-primary/40 space-y-4 shadow-xl">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
            <span class="material-symbols-outlined text-base">local_fire_department</span> Ranking de Canciones Más Populares
          </h3>
          <button
            type="button"
            (click)="addNewTrack()"
            class="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-black text-xs hover:scale-105 transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
          >
            <span class="material-symbols-outlined text-sm font-bold">add</span> Añadir Canción
          </button>
        </div>

        <div class="space-y-2.5">
          @for (t of popular(); track t.id; let i = $index) {
            <div class="flex items-center gap-2.5">
              <button
                type="button"
                (click)="openTrack.emit(t)"
                class="flex-1 text-left flex items-center gap-3.5 p-3 rounded-2xl bg-[#131022]/80 border border-outline-variant/25 hover:border-primary/60 transition-all duration-200 group min-w-0 shadow-md transform hover:-translate-y-0.5"
              >
                <span class="w-8 h-8 rounded-xl bg-primary/20 text-primary font-black text-xs flex items-center justify-center shrink-0 border border-primary/30">
                  {{ i + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-black text-on-surface truncate group-hover:text-primary transition-colors font-display-md">{{ t.title }}</p>
                  <p class="text-[10px] text-outline font-bold truncate mt-0.5">{{ t.genre }} · {{ t.releaseYear }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-xs font-black text-emerald-400 font-mono">{{ t.plays }} reprod.</p>
                  <p class="text-[10px] text-outline font-mono">{{ t.durationLabel }}</p>
                </div>
              </button>

              <button
                type="button"
                (click)="deleteTrack.emit(t.id)"
                class="p-2.5 rounded-2xl bg-surface-container-highest hover:bg-rose-500/20 text-outline hover:text-rose-400 border border-outline-variant/25 transition-all shrink-0 shadow-sm"
                title="Eliminar canción"
              >
                <span class="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          }
        </div>
      </section>

      <!-- REPERTORIO POR GÉNERO (COLLAPSIBLE CARDS) -->
      <section class="space-y-3.5">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
            <span class="material-symbols-outlined text-base">library_music</span> Repertorio Clasificado por Género
          </h3>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              (click)="genreFilter.set('todos')"
              class="px-3 py-1 rounded-xl text-[10px] font-black border transition-all"
              [class]="genreFilter() === 'todos' ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-[#18152a] text-outline border-outline-variant/25 hover:text-on-surface'"
            >
              Todos
            </button>
            @for (g of byGenre(); track g.genre) {
              <button
                type="button"
                (click)="genreFilter.set(g.genre)"
                class="px-3 py-1 rounded-xl text-[10px] font-black border transition-all"
                [class]="genreFilter() === g.genre ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-[#18152a] text-outline border-outline-variant/25 hover:text-on-surface'"
              >
                {{ g.genre }} ({{ g.tracks.length }})
              </button>
            }
          </div>
        </header>

        <div class="space-y-4">
          @for (g of visibleGenres(); track g.genre) {
            <div class="p-4 sm:p-5 rounded-3xl bg-[#18152a] border border-outline-variant/30 space-y-3 shadow-lg">
              <div class="flex items-center justify-between gap-2 border-b border-outline-variant/20 pb-2">
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center border border-primary/30">
                    <span class="material-symbols-outlined text-sm">music_note</span>
                  </span>
                  <span class="text-xs font-black text-on-surface uppercase tracking-wider">{{ g.genre }}</span>
                </div>
                <span class="text-[10px] font-extrabold text-outline px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant/25">
                  {{ g.tracks.length }} canciones
                </span>
              </div>

              <div class="space-y-1.5">
                @for (t of g.tracks; track t.id) {
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="openTrack.emit(t)"
                      class="flex-1 text-left flex items-center gap-3 py-2 px-3 border border-outline-variant/15 hover:border-primary/40 hover:bg-surface-container/60 transition-all rounded-xl min-w-0 group"
                    >
                      <div class="min-w-0 flex-1">
                        <p class="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">{{ t.title }}</p>
                        <p class="text-[10px] text-outline font-mono">{{ t.releaseYear }} · {{ t.durationLabel }}</p>
                      </div>
                      <div class="w-28 shrink-0">
                        <div class="flex items-center justify-between text-[9px] font-bold mb-0.5">
                          <span class="text-outline">Aprobación</span>
                          <span class="text-emerald-400 font-mono">{{ t.approval }}%</span>
                        </div>
                        <div class="h-2 rounded-full bg-surface-container overflow-hidden border border-outline-variant/20 p-0.5">
                          <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" [style.width.%]="t.approval"></div>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      (click)="deleteTrack.emit(t.id)"
                      class="p-2 rounded-xl hover:bg-rose-500/20 text-outline hover:text-rose-400 border border-outline-variant/20 transition-colors shrink-0"
                      title="Eliminar canción"
                    >
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </section>

    </div>
  `
})
export class GroupTabMusicComponent {
  profile = input.required<GroupProfile>();
  openTrack = output<Track>();
  addTrack = output<Track>();
  deleteTrack = output<string>();

  genreFilter = signal<string>('todos');

  popular = computed(() => this.profile().tracks.filter(t => t.isPopular));

  byGenre = computed(() => {
    const map = new Map<string, Track[]>();
    for (const t of this.profile().tracks) {
      const list = map.get(t.genre) || [];
      list.push(t);
      map.set(t.genre, list);
    }
    return [...map.entries()].map(([genre, tracks]) => ({ genre, tracks }));
  });

  visibleGenres = computed(() => {
    const f = this.genreFilter();
    return f === 'todos' ? this.byGenre() : this.byGenre().filter(g => g.genre === f);
  });

  avgApproval = computed(() => {
    const list = this.profile().tracks;
    if (!list.length) return 0;
    return Math.round(list.reduce((s, t) => s + t.approval, 0) / list.length);
  });

  addNewTrack(): void {
    const title = prompt('Título de la canción:');
    if (!title || !title.trim()) return;

    const genre = prompt('Género (ej. Regional Mexicano, Cumbia, Norteño):') || 'Regional Mexicano';
    const releaseYear = prompt('Año de lanzamiento:') || String(new Date().getFullYear());
    const durationLabel = prompt('Duración (ej. 3:45):') || '3:30';

    const track: Track = {
      id: 'track-' + Date.now(),
      title: title.trim(),
      genre: genre.trim(),
      durationLabel: durationLabel.trim(),
      releaseYear: releaseYear.trim(),
      plays: '1k',
      approval: 95,
      isPopular: true
    };

    this.addTrack.emit(track);
  }
}
