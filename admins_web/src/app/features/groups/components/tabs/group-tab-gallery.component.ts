import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupProfile, GalleryImage, HighlightVideo } from '../../group-profile.model';
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
      <section class="space-y-3.5">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
            <span class="material-symbols-outlined text-base">smart_display</span> Shows & Videos Destacados
          </h3>

          <button
            type="button"
            (click)="addNewVideo()"
            class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-primary to-amber-400 text-on-primary font-black text-xs hover:scale-105 transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
          >
            <span class="material-symbols-outlined text-sm font-bold">video_call</span> Añadir Video
          </button>
        </div>

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
      <section class="space-y-3.5">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
            <span class="material-symbols-outlined text-base">photo_library</span> Galería Fotográfica en Alta Definición
          </h3>

          <div class="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              (click)="showPicker.set(true)"
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

    </div>
  `
})
export class GroupTabGalleryComponent {
  profile = input.required<GroupProfile>();
  openImage = output<GalleryImage>();
  openVideo = output<HighlightVideo>();

  addImage = output<GalleryImage>();
  deleteImage = output<string>();
  addVideo = output<HighlightVideo>();
  deleteVideo = output<string>();

  categoryFilter = signal<string>('todas');
  showPicker = signal<boolean>(false);

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

  applyPickedImage(url: string): void {
    const caption = prompt('Descripción o título de la imagen:') || 'Imagen de Galería';
    const categoryRaw = prompt('Categoría (Promocional / En Vivo / Backstage / Estudio):') || 'Promocional';
    
    let category: 'Promocional' | 'En Vivo' | 'Backstage' | 'Estudio' = 'Promocional';
    if (['En Vivo', 'Backstage', 'Estudio'].includes(categoryRaw)) {
      category = categoryRaw as 'Promocional' | 'En Vivo' | 'Backstage' | 'Estudio';
    }

    const img: GalleryImage = {
      url,
      caption: caption.trim(),
      category,
      isPublic: true
    };

    this.addImage.emit(img);
  }

  addNewVideo(): void {
    const title = prompt('Título del video:');
    if (!title || !title.trim()) return;

    const thumbnailUrl = prompt('URL del miniatura / thumbnail:') || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800';
    const duration = prompt('Duración (ej. 4:15):') || '4:00';

    const video: HighlightVideo = {
      title: title.trim(),
      thumbnailUrl: thumbnailUrl.trim(),
      duration: duration.trim(),
      views: '1k',
      isPublic: true
    };

    this.addVideo.emit(video);
  }
}
