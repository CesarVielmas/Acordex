import { Component, input, output, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupProfile, Track, defaultSectionVisibility } from '../../group-profile.model';
import { GroupProfileStore } from '../../group-profile.store';
import { AudioPreviewPlayerComponent } from '../../../../shared/ui/audio-preview-player/audio-preview-player.component';

@Component({
  selector: 'app-group-tab-music',
  standalone: true,
  imports: [CommonModule, AudioPreviewPlayerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-6 text-xs select-none">

      <!-- AUDIO PREVIEW PLAYER BANNER -->
      <app-audio-preview-player
        [audioUrl]="activeTrack()?.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'"
        [title]="activeTrack()?.title || 'Selecciona una canción para escuchar el audio'"
        [artistName]="profile().name"
        [genre]="activeTrack()?.genre || profile().genre"
        (audioUrlChange)="updateTrackAudioUrl($event)"
      />

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

      <!-- MÁS POPULARES (RANKING PLAYER STYLE WITH AUDIO PREVIEW) -->
      <section
        class="p-5 rounded-3xl bg-gradient-to-br from-primary/15 via-[#18152a] to-[#18152a] border transition-all duration-300 space-y-4 shadow-xl"
        [class]="vis().showPopularTracks ? 'border-primary/40' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.2)] opacity-85'"
      >
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-3">
          <div>
            <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-base">local_fire_department</span> Ranking de Canciones & Audios Subidos
            </h3>
            <p class="text-[10px] text-outline">Sección "Canciones Más Escuchadas" expuesta en la Vista Previa del Cliente</p>
          </div>

          <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
            <button
              type="button"
              (click)="!vis().showPopularTracks && store.toggleSectionVisibility('showPopularTracks')"
              class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
              [class]="vis().showPopularTracks ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
            >
              VISIBLE
            </button>
            <button
              type="button"
              (click)="vis().showPopularTracks && store.toggleSectionVisibility('showPopularTracks')"
              class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
              [class]="!vis().showPopularTracks ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
            >
              OCULTAR
            </button>
          </div>
        </div>

        <div class="space-y-2.5">
          @for (t of popular(); track t.id; let i = $index) {
            <div class="flex items-center gap-2.5">
              
              <!-- PLAY PREVIEW BUTTON -->
              <button
                type="button"
                (click)="playTrackPreview(t)"
                class="w-10 h-10 rounded-2xl text-on-primary font-black flex items-center justify-center shrink-0 shadow-md transition-all hover:scale-105 active:scale-95"
                [class]="activeTrack()?.id === t.id
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-black ring-2 ring-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                  : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary'"
                [title]="'Escuchar vista previa de ' + t.title"
              >
                <span class="material-symbols-outlined text-xl">
                  {{ activeTrack()?.id === t.id ? 'graphic_eq' : 'play_arrow' }}
                </span>
              </button>

              <button
                type="button"
                (click)="openTrack.emit(t)"
                class="flex-1 text-left flex items-center gap-3.5 p-3 rounded-2xl bg-[#131022]/80 border border-outline-variant/25 hover:border-primary/60 transition-all duration-200 group min-w-0 shadow-md transform hover:-translate-y-0.5"
              >
                <span class="w-7 h-7 rounded-xl bg-primary/20 text-primary font-black text-xs flex items-center justify-center shrink-0 border border-primary/30">
                  {{ i + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="text-xs font-black text-on-surface truncate group-hover:text-primary transition-colors font-display-md">{{ t.title }}</p>
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-black border shrink-0" [class]="t.audioUrl ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'">
                      {{ t.audioUrl ? 'Audio Listo ✓' : 'Sin MP3' }}
                    </span>
                  </div>
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

      <!-- REPERTORIO POR GÉNERO (COLLAPSIBLE CARDS WITH AUDIO PREVIEWS) -->
      <section
        class="p-5 sm:p-6 rounded-3xl bg-[#18152a] border transition-all duration-300 space-y-4 shadow-xl"
        [class]="vis().showMusicCatalog ? 'border-outline-variant/30' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.2)] opacity-85'"
      >
        <header class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-3">
          <div>
            <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-base">library_music</span> Repertorio Clasificado por Género
            </h3>
            <p class="text-[10px] text-outline">Sección "Catálogo & Repertorio Completo" expuesta en la Vista Previa del Cliente</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
              <button
                type="button"
                (click)="!vis().showMusicCatalog && store.toggleSectionVisibility('showMusicCatalog')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="vis().showMusicCatalog ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
              >
                VISIBLE
              </button>
              <button
                type="button"
                (click)="vis().showMusicCatalog && store.toggleSectionVisibility('showMusicCatalog')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="!vis().showMusicCatalog ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
              >
                OCULTAR
              </button>
            </div>

            <button
              type="button"
              (click)="openAddGenreModal()"
              class="px-2.5 py-1 rounded-lg bg-primary/20 text-primary border border-primary/40 hover:bg-primary hover:text-on-primary text-[10px] font-black transition-all flex items-center gap-1 shadow-sm active:scale-95"
            >
              <span class="material-symbols-outlined text-[11px]">add</span> Añadir Género
            </button>
          </div>
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
              <div class="flex items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
                <div class="flex items-center gap-3">
                  <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center border border-primary/30 shadow-inner">
                    <span class="material-symbols-outlined text-[15px]">music_note</span>
                  </span>
                  <div>
                    <span class="text-xs font-black text-on-surface uppercase tracking-wider font-display-md">{{ g.genre }}</span>
                    <p class="text-[10px] text-outline font-bold mt-0.5">{{ g.tracks.length }} canciones en este género</p>
                  </div>
                </div>
                <button
                  type="button"
                  (click)="openAddTrackModal(g.genre)"
                  class="px-3 py-1.5 rounded-xl bg-surface-container-highest hover:bg-primary text-outline hover:text-on-primary border border-outline-variant/30 hover:border-primary text-[10px] font-black transition-all shadow-sm flex items-center gap-1 active:scale-95"
                  title="Añadir canción a este género"
                >
                  <span class="material-symbols-outlined text-[11px] font-bold">add</span> Añadir Canción
                </button>
              </div>

              <div class="space-y-2">
                @for (t of g.tracks; track t.id) {
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="playTrackPreview(t)"
                      class="w-9 h-9 rounded-xl text-on-primary font-black flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
                      [class]="activeTrack()?.id === t.id
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-black shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                        : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary'"
                      [title]="'Escuchar vista previa de ' + t.title"
                    >
                      <span class="material-symbols-outlined text-lg">
                        {{ activeTrack()?.id === t.id ? 'graphic_eq' : 'play_arrow' }}
                      </span>
                    </button>

                    <button
                      type="button"
                      (click)="openTrack.emit(t)"
                      class="flex-1 text-left flex items-center gap-3 py-2 px-3 border border-outline-variant/15 hover:border-primary/40 hover:bg-surface-container/60 transition-all rounded-xl min-w-0 group"
                    >
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <p class="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">{{ t.title }}</p>
                          <span class="px-2 py-0.5 rounded-full text-[8px] font-black border shrink-0" [class]="t.audioUrl ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'">
                            {{ t.audioUrl ? 'Audio OK' : 'Sin MP3' }}
                          </span>
                        </div>
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

      <!-- MODAL POPUP: AÑADIR NUEVO GÉNERO MUSICAL -->
      @if (showGenreModal()) {
        <div class="fixed inset-0 z-[99999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" (click)="showGenreModal.set(false)">
          <div class="w-full max-w-lg bg-gradient-to-b from-[#1c1836] via-[#141126] to-[#0d0b1a] border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(242,202,80,0.2)] relative overflow-hidden space-y-6" (click)="$event.stopPropagation()">
            <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

            <header class="flex items-center justify-between border-b border-outline-variant/20 pb-4 relative z-10">
              <div class="flex items-center gap-3">
                <span class="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-amber-500/10 text-primary border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span class="material-symbols-outlined text-xl">library_music</span>
                </span>
                <div>
                  <h3 class="text-sm font-black uppercase text-on-surface tracking-wider font-display-md">Añadir Nuevo Género Musical</h3>
                  <p class="text-[11px] text-outline font-medium">Crea una nueva categoría musical en el catálogo del grupo</p>
                </div>
              </div>
              <button type="button" (click)="showGenreModal.set(false)" class="w-8 h-8 rounded-full bg-surface-container/60 hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center transition-all hover:scale-110">✕</button>
            </header>

            <div class="space-y-4 relative z-10">
              <!-- NOMBRE DEL GÉNERO -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Nombre del Nuevo Género</label>
                <input
                  #newGenreNameInput
                  type="text"
                  [value]="newGenreName()"
                  (input)="newGenreName.set(newGenreNameInput.value)"
                  placeholder="Ej. Cumbia Sonidera, Norteño Banda, Huapango"
                  class="w-full bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-bold"
                />
              </div>

              <!-- CANCIÓN INICIAL -->
              <div class="p-4.5 rounded-2xl bg-[#0d0a1a] border border-outline-variant/25 space-y-3 shadow-inner">
                <span class="text-[10px] font-black uppercase tracking-wider text-primary block">Canción Inicial para este Género</span>
                
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-outline uppercase tracking-wider block">Título del Tema</label>
                  <input
                    #newGenreTrackTitleInput
                    type="text"
                    [value]="newGenreTrackTitle()"
                    (input)="newGenreTrackTitle.set(newGenreTrackTitleInput.value)"
                    placeholder="Ej. Éxito de Lanzamiento"
                    class="w-full bg-[#18152a] border border-outline-variant/30 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:border-primary outline-none transition-all font-medium"
                  />
                </div>

                <!-- SUBIR AUDIO MP3 -->
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold text-outline uppercase tracking-wider block">Archivo de Audio MP3 (Opcional)</label>
                  <div class="flex items-center gap-2">
                    <input
                      #newGenreAudioInput
                      type="url"
                      [value]="newGenreTrackAudioUrl()"
                      (input)="newGenreTrackAudioUrl.set(newGenreAudioInput.value)"
                      placeholder="https://..."
                      class="flex-1 bg-[#18152a] border border-outline-variant/30 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:border-primary outline-none transition-all font-mono"
                    />
                    <label class="px-3.5 py-2.5 rounded-xl bg-primary/20 hover:bg-primary text-primary hover:text-black border border-primary/30 font-bold text-xs cursor-pointer transition-all flex items-center gap-1 shrink-0">
                      <span class="material-symbols-outlined text-base">upload_file</span> Subir
                      <input type="file" accept="audio/*" class="hidden" (change)="handleGenreAudioFileSelect($event)" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <footer class="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20 relative z-10">
              <button
                type="button"
                (click)="showGenreModal.set(false)"
                class="px-5 py-2.5 rounded-2xl bg-surface-container/60 hover:bg-surface-container text-outline hover:text-on-surface text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="submitNewGenre()"
                [disabled]="!newGenreName().trim()"
                class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-primary via-amber-400 to-amber-500 text-on-primary font-black text-xs hover:scale-105 transition-all shadow-[0_0_25px_rgba(242,202,80,0.4)] disabled:opacity-50 disabled:scale-100"
              >
                Crear Género
              </button>
            </footer>
          </div>
        </div>
      }


    </div>
  `
})
export class GroupTabMusicComponent {
  profile = input.required<GroupProfile>();

  store = inject(GroupProfileStore);
  vis = computed(() => this.profile().sectionVisibility ?? defaultSectionVisibility());

  openTrack = output<Track>();
  addTrack = output<Track>();
  deleteTrack = output<string>();
  addGenre = output<void>();

  genreFilter = signal<string>('todos');
  activeTrack = signal<Track | null>(null);

  // Modal signals for genre creation
  showGenreModal = signal<boolean>(false);
  newGenreName = signal<string>('');
  newGenreTrackTitle = signal<string>('');
  newGenreTrackAudioUrl = signal<string>('');

  // Modal signals for track creation
  showTrackModal = signal<boolean>(false);
  newTrackTitle = signal<string>('');
  newTrackGenre = signal<string>('Regional Mexicano');
  newTrackYear = signal<string>(String(new Date().getFullYear()));
  newTrackDuration = signal<string>('3:30');
  newTrackAudioUrl = signal<string>('');
  newTrackIsPopular = signal<boolean>(false);

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

  availableGenres = computed(() => {
    const list = this.byGenre().map(g => g.genre);
    if (!list.length) return ['Regional Mexicano', 'Cumbia', 'Norteño', 'Banda'];
    return list;
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

  playTrackPreview(t: Track): void {
    this.activeTrack.set(t);
  }

  updateTrackAudioUrl(newUrl: string): void {
    const active = this.activeTrack();
    if (active) {
      active.audioUrl = newUrl;
      this.activeTrack.set({ ...active, audioUrl: newUrl });
    }
  }

  openAddGenreModal(): void {
    this.store.openAddGenreModal();
  }

  openAddTrackModal(genreName?: string): void {
    this.store.openAddTrackModal(genreName);
  }

  handleGenreAudioFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      this.newGenreTrackAudioUrl.set(URL.createObjectURL(file));
    }
  }

  submitNewGenre(): void {
    const genreName = this.newGenreName().trim();
    if (!genreName) return;

    const trackTitle = this.newGenreTrackTitle().trim() || `Éxito de ${genreName}`;

    const newTrack: Track = {
      id: crypto.randomUUID(),
      title: trackTitle,
      genre: genreName,
      releaseYear: String(new Date().getFullYear()),
      durationLabel: '3:30',
      audioUrl: this.newGenreTrackAudioUrl().trim(),
      isPopular: false,
      plays: '0',
      approval: 100
    };

    this.addTrack.emit(newTrack);
    this.genreFilter.set(genreName);
    this.showGenreModal.set(false);
  }

  addNewTrack(genre: string = 'Regional Mexicano'): void {
    this.newTrackTitle.set('');
    this.newTrackGenre.set(genre || this.availableGenres()[0] || 'Regional Mexicano');
    this.newTrackYear.set(String(new Date().getFullYear()));
    this.newTrackDuration.set('3:30');
    this.newTrackAudioUrl.set('');
    this.newTrackIsPopular.set(false);
    this.showTrackModal.set(true);
  }

  handleTrackAudioFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    this.newTrackAudioUrl.set(url);

    const audio = new Audio();
    audio.src = url;
    audio.onloadedmetadata = () => {
      const totalSecs = Math.round(audio.duration);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      this.newTrackDuration.set(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };
  }

  submitNewTrack(): void {
    const title = this.newTrackTitle().trim();
    if (!title) return;

    const newTrack: Track = {
      id: crypto.randomUUID(),
      title,
      genre: this.newTrackGenre().trim() || 'Regional Mexicano',
      releaseYear: this.newTrackYear().trim() || String(new Date().getFullYear()),
      durationLabel: this.newTrackDuration().trim() || '3:30',
      audioUrl: this.newTrackAudioUrl().trim(),
      isPopular: this.newTrackIsPopular(),
      plays: '0',
      approval: 100
    };

    this.addTrack.emit(newTrack);
    this.showTrackModal.set(false);
  }
}
