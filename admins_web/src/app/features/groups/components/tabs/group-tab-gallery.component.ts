import { Component, input, output, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupProfile, GalleryImage, HighlightVideo, defaultSectionVisibility } from '../../group-profile.model';
import { GroupProfileStore } from '../../group-profile.store';
import { ImageSuggestionPickerComponent } from '../../../../shared/ui/image-suggestion-picker/image-suggestion-picker.component';

@Component({
  selector: 'app-group-tab-gallery',
  standalone: true,
  imports: [CommonModule, ImageSuggestionPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-6 text-xs select-none">

      <!-- VIDEOS DESTACADOS -->
      <section
        class="p-5 sm:p-6 rounded-3xl bg-[#18152a] border transition-all duration-300 space-y-4 shadow-xl"
        [class]="vis().showHighlightVideos ? 'border-outline-variant/30' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.2)] opacity-85'"
      >
        <header class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-3">
          <div>
            <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-base">smart_display</span> Shows & Videos Destacados
            </h3>
            <p class="text-[10px] text-outline">Sección "Videos & Concert Highlights" expuesta en la Vista Previa del Cliente</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
              <button
                type="button"
                (click)="!vis().showHighlightVideos && store.toggleSectionVisibility('showHighlightVideos')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="vis().showHighlightVideos ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
              >
                VISIBLE
              </button>
              <button
                type="button"
                (click)="vis().showHighlightVideos && store.toggleSectionVisibility('showHighlightVideos')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="!vis().showHighlightVideos ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
              >
                OCULTAR
              </button>
            </div>

            <button
              type="button"
              (click)="openAddVideoModal()"
              class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-primary to-amber-400 text-on-primary font-black text-xs hover:scale-105 transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <span class="material-symbols-outlined text-sm font-bold">video_call</span> Añadir Video
            </button>
          </div>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          @for (v of profile().videos; track v.title) {
            <div class="relative group/video flex flex-col rounded-3xl overflow-hidden bg-[#18152a] border border-outline-variant/30 hover:border-primary/60 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1">
              <button
                type="button"
                (click)="openVideo.emit(v)"
                class="w-full text-left flex-1"
              >
                <div class="relative h-36">
                  <img [src]="v.thumbnailUrl" [alt]="v.title" class="w-full h-full object-cover group-hover/video:scale-105 transition-transform duration-500" />
                  <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span class="material-symbols-outlined text-5xl text-white drop-shadow-xl group-hover/video:scale-110 transition-transform">play_circle</span>
                  </div>
                  <span class="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-lg bg-black/80 text-white text-[10px] font-black font-mono shadow-md backdrop-blur-sm">
                    {{ v.duration }}
                  </span>
                </div>
                <div class="p-3.5">
                  <p class="text-xs font-black text-on-surface truncate group-hover/video:text-primary transition-colors font-display-md">{{ v.title }}</p>
                  <p class="text-[10px] text-outline font-bold flex items-center gap-1 mt-1">
                    <span class="material-symbols-outlined text-xs">visibility</span> {{ v.views }} vistas acumuladas
                  </p>
                </div>
              </button>

              <button
                type="button"
                (click)="deleteVideo.emit(v.title)"
                class="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover/video:opacity-100 transition-all shadow-lg hover:scale-110"
                title="Eliminar video"
              >
                ✕
              </button>
            </div>
          }
        </div>
      </section>

      <!-- GALERÍA FOTOGRÁFICA -->
      <section
        class="p-5 sm:p-6 rounded-3xl bg-[#18152a] border transition-all duration-300 space-y-4 shadow-xl"
        [class]="vis().showPhotoGallery ? 'border-outline-variant/30' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.2)] opacity-85'"
      >
        <header class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-3">
          <div>
            <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-base">photo_library</span> Galería Fotográfica en Alta Definición
            </h3>
            <p class="text-[10px] text-outline">Sección "Galería de Fotos Exclusivas" expuesta en la Vista Previa del Cliente</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
              <button
                type="button"
                (click)="!vis().showPhotoGallery && store.toggleSectionVisibility('showPhotoGallery')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="vis().showPhotoGallery ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
              >
                VISIBLE
              </button>
              <button
                type="button"
                (click)="vis().showPhotoGallery && store.toggleSectionVisibility('showPhotoGallery')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="!vis().showPhotoGallery ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
              >
                OCULTAR
              </button>
            </div>

            <button
              type="button"
              (click)="openAddImageModal()"
              class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-primary to-amber-400 text-on-primary font-black text-xs hover:scale-105 transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <span class="material-symbols-outlined text-sm font-bold">add_a_photo</span> Añadir Imagen
            </button>

            <div class="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                (click)="categoryFilter.set('todas')"
                class="px-3 py-1 rounded-xl text-[10px] font-black border transition-all"
                [class]="categoryFilter() === 'todas' ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-[#18152a] text-outline border-outline-variant/25 hover:text-on-surface'"
              >
                Todas ({{ profile().gallery.length }})
              </button>
              @for (c of categories(); track c.name) {
                <button
                  type="button"
                  (click)="categoryFilter.set(c.name)"
                  class="px-3 py-1 rounded-xl text-[10px] font-black border transition-all"
                  [class]="categoryFilter() === c.name ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-[#18152a] text-outline border-outline-variant/25 hover:text-on-surface'"
                >
                  {{ c.name }} ({{ c.count }})
                </button>
              }
            </div>
          </div>
        </header>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          @for (img of visibleImages(); track img.url + img.caption) {
            <div class="group relative rounded-3xl overflow-hidden border border-outline-variant/30 hover:border-primary/60 transition-all duration-300 aspect-square shadow-lg transform hover:-translate-y-1">
              <button
                type="button"
                (click)="openImage.emit(img)"
                class="w-full h-full text-left"
              >
                <img [src]="img.url" [alt]="img.caption" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <p class="text-[10px] font-black text-white leading-snug text-left truncate">{{ img.caption }}</p>
                </div>
                <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-white text-[9px] font-black shadow-md border border-white/10">
                  {{ img.category }}
                </span>
              </button>

              <button
                type="button"
                (click)="deleteImage.emit(img.url)"
                class="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                title="Eliminar imagen"
              >
                ✕
              </button>
            </div>
          }
        </div>
      </section>

      <!-- IMAGE SUGGESTION PICKER POPUP -->
      @if (showPicker()) {
        <app-image-suggestion-picker
          title="Añadir Imagen a la Galería"
          categoryFilter="general"
          (selectedUrl)="applyPickedImage($event)"
          (closed)="showPicker.set(false)"
        />
      }

      <!-- MODAL POPUP: AÑADIR IMAGEN A LA GALERÍA -->
      @if (showImageModal()) {
        <div class="fixed inset-0 z-[99999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" (click)="showImageModal.set(false)">
          <div class="w-full max-w-lg bg-gradient-to-b from-[#1c1836] via-[#141126] to-[#0d0b1a] border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(242,202,80,0.2)] relative overflow-hidden space-y-6" (click)="$event.stopPropagation()">
            <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

            <header class="flex items-center justify-between border-b border-outline-variant/20 pb-4 relative z-10">
              <div class="flex items-center gap-3">
                <span class="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-amber-500/10 text-primary border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span class="material-symbols-outlined text-xl">add_a_photo</span>
                </span>
                <div>
                  <h3 class="text-sm font-black uppercase text-on-surface tracking-wider font-display-md">Añadir Foto a la Galería</h3>
                  <p class="text-[11px] text-outline font-medium">Exhibe fotografías en alta definición en el perfil del cliente</p>
                </div>
              </div>
              <button type="button" (click)="showImageModal.set(false)" class="w-8 h-8 rounded-full bg-surface-container/60 hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center transition-all hover:scale-110">✕</button>
            </header>

            <div class="space-y-4 relative z-10">
              <!-- URL O FILE PICKER -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Fotografía (Imagen HD)</label>
                <div class="flex items-center gap-2">
                  <input
                    #imgUrlInput
                    type="url"
                    [value]="newImgUrl()"
                    (input)="newImgUrl.set(imgUrlInput.value)"
                    placeholder="https://..."
                    class="flex-1 bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-mono"
                  />
                  <label class="px-4 py-3 rounded-2xl bg-primary/20 hover:bg-primary text-primary hover:text-black border border-primary/40 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shrink-0 shadow-md">
                    <span class="material-symbols-outlined text-base">upload_file</span> Subir
                    <input type="file" accept="image/*" class="hidden" (change)="handleImageFileSelect($event)" />
                  </label>
                </div>
                @if (newImgUrl()) {
                  <div class="mt-2.5 rounded-2xl overflow-hidden h-36 border border-primary/30 shadow-lg relative bg-black">
                    <img [src]="newImgUrl()" alt="Vista previa" class="w-full h-full object-cover" />
                  </div>
                }
              </div>

              <!-- DESCRIPCIÓN -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Título o Descripción de la Foto</label>
                <input
                  #imgCaptionInput
                  type="text"
                  [value]="newImgCaption()"
                  (input)="newImgCaption.set(imgCaptionInput.value)"
                  placeholder="Ej. Show masivo en Palenque de San Marcos"
                  class="w-full bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-medium"
                />
              </div>

              <!-- CATEGORÍA -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Categoría de la Foto</label>
                <select
                  #imgCatSelect
                  [value]="newImgCategory()"
                  (change)="newImgCategory.set(imgCatSelect.value)"
                  class="w-full bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-bold"
                >
                  <option value="Promocional">Promocional</option>
                  <option value="En Vivo">En Vivo</option>
                  <option value="Backstage">Backstage</option>
                  <option value="Estudio">Estudio</option>
                </select>
              </div>
            </div>

            <footer class="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20 relative z-10">
              <button
                type="button"
                (click)="showImageModal.set(false)"
                class="px-5 py-2.5 rounded-2xl bg-surface-container/60 hover:bg-surface-container text-outline hover:text-on-surface text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="submitNewImage()"
                [disabled]="!newImgUrl().trim()"
                class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-primary via-amber-400 to-amber-500 text-on-primary font-black text-xs hover:scale-105 transition-all shadow-[0_0_25px_rgba(242,202,80,0.4)] disabled:opacity-50 disabled:scale-100"
              >
                Guardar Imagen
              </button>
            </footer>
          </div>
        </div>
      }

      <!-- MODAL POPUP: AÑADIR VIDEO A LA GALERÍA -->
      @if (showVideoModal()) {
        <div class="fixed inset-0 z-[99999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" (click)="showVideoModal.set(false)">
          <div class="w-full max-w-lg bg-gradient-to-b from-[#1c1836] via-[#141126] to-[#0d0b1a] border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(242,202,80,0.2)] relative overflow-hidden space-y-6" (click)="$event.stopPropagation()">
            <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

            <header class="flex items-center justify-between border-b border-outline-variant/20 pb-4 relative z-10">
              <div class="flex items-center gap-3">
                <span class="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-amber-500/10 text-primary border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span class="material-symbols-outlined text-xl">smart_display</span>
                </span>
                <div>
                  <h3 class="text-sm font-black uppercase text-on-surface tracking-wider font-display-md">Añadir Video de Show</h3>
                  <p class="text-[11px] text-outline font-medium">Agrega videos promocionales o presentaciones en vivo</p>
                </div>
              </div>
              <button type="button" (click)="showVideoModal.set(false)" class="w-8 h-8 rounded-full bg-surface-container/60 hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center transition-all hover:scale-110">✕</button>
            </header>

            <div class="space-y-4 relative z-10">
              <!-- TÍTULO -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Título del Video</label>
                <input
                  #vidTitleInput
                  type="text"
                  [value]="newVidTitle()"
                  (input)="newVidTitle.set(vidTitleInput.value)"
                  placeholder="Ej. Presentación en Vivo - Concierto Cumbia 2026"
                  class="w-full bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-medium"
                />
              </div>

              <!-- MINIATURA / THUMBNAIL -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Imagen de Portada (Miniatura)</label>
                <div class="flex items-center gap-2">
                  <input
                    #vidThumbInput
                    type="url"
                    [value]="newVidThumb()"
                    (input)="newVidThumb.set(vidThumbInput.value)"
                    placeholder="https://..."
                    class="flex-1 bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-mono"
                  />
                  <label class="px-4 py-3 rounded-2xl bg-primary/20 hover:bg-primary text-primary hover:text-black border border-primary/40 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shrink-0 shadow-md">
                    <span class="material-symbols-outlined text-base">upload_file</span> Subir
                    <input type="file" accept="image/*" class="hidden" (change)="handleThumbFileSelect($event)" />
                  </label>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <!-- DURACIÓN -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Duración (mm:ss)</label>
                  <input
                    #vidDurInput
                    type="text"
                    [value]="newVidDuration()"
                    (input)="newVidDuration.set(vidDurInput.value)"
                    placeholder="3:45"
                    class="w-full bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-mono"
                  />
                </div>

                <!-- VISTAS -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Vistas Iniciales</label>
                  <input
                    #vidViewsInput
                    type="text"
                    [value]="newVidViews()"
                    (input)="newVidViews.set(vidViewsInput.value)"
                    placeholder="1.2k vistas"
                    class="w-full bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <footer class="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20 relative z-10">
              <button
                type="button"
                (click)="showVideoModal.set(false)"
                class="px-5 py-2.5 rounded-2xl bg-surface-container/60 hover:bg-surface-container text-outline hover:text-on-surface text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="submitNewVideo()"
                [disabled]="!newVidTitle().trim()"
                class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-primary via-amber-400 to-amber-500 text-on-primary font-black text-xs hover:scale-105 transition-all shadow-[0_0_25px_rgba(242,202,80,0.4)] disabled:opacity-50 disabled:scale-100"
              >
                Guardar Video
              </button>
            </footer>
          </div>
        </div>
      }

    </div>
  `
})
export class GroupTabGalleryComponent {
  profile = input.required<GroupProfile>();

  store = inject(GroupProfileStore);
  vis = computed(() => this.profile().sectionVisibility ?? defaultSectionVisibility());

  openImage = output<GalleryImage>();
  openVideo = output<HighlightVideo>();

  addImage = output<GalleryImage>();
  deleteImage = output<string>();
  addVideo = output<HighlightVideo>();
  deleteVideo = output<string>();

  categoryFilter = signal<string>('todas');
  showPicker = signal<boolean>(false);

  // Modals signals
  showImageModal = signal<boolean>(false);
  newImgUrl = signal<string>('');
  newImgCaption = signal<string>('');
  newImgCategory = signal<string>('Promocional');

  showVideoModal = signal<boolean>(false);
  newVidTitle = signal<string>('');
  newVidThumb = signal<string>('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800');
  newVidDuration = signal<string>('3:45');
  newVidViews = signal<string>('1.2k vistas');

  categories = computed(() => {
    const map = new Map<string, number>();
    for (const img of this.profile().gallery) {
      map.set(img.category, (map.get(img.category) || 0) + 1);
    }
    return [...map.entries()].map(([name, count]) => ({ name, count }));
  });

  visibleImages = computed(() => {
    const f = this.categoryFilter();
    const list = this.profile().gallery;
    return f === 'todas' ? list : list.filter(i => i.category === f);
  });

  openAddImageModal(): void {
    this.store.openAddImageModal();
  }

  openAddVideoModal(): void {
    this.store.openAddVideoModal();
  }

  handleImageFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      this.newImgUrl.set(URL.createObjectURL(file));
    }
  }

  handleThumbFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      this.newVidThumb.set(URL.createObjectURL(file));
    }
  }

  applyPickedImage(url: string): void {
    this.newImgUrl.set(url);
    this.showPicker.set(false);
    this.showImageModal.set(true);
  }

  submitNewImage(): void {
    const url = this.newImgUrl().trim();
    if (!url) return;

    const img: GalleryImage = {
      url,
      caption: this.newImgCaption().trim() || 'Imagen de Galería',
      category: (this.newImgCategory() as 'Promocional' | 'En Vivo' | 'Backstage' | 'Estudio') || 'Promocional',
      isPublic: true
    };

    this.addImage.emit(img);
    this.showImageModal.set(false);
  }

  submitNewVideo(): void {
    const title = this.newVidTitle().trim();
    if (!title) return;

    const video: HighlightVideo = {
      title,
      thumbnailUrl: this.newVidThumb().trim(),
      duration: this.newVidDuration().trim() || '3:30',
      views: this.newVidViews().trim() || '1k vistas',
      isPublic: true
    };

    this.addVideo.emit(video);
    this.showVideoModal.set(false);
  }
}
