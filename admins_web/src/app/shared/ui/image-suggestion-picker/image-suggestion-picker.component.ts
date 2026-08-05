import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

export interface ImageSuggestion {
  url: string;
  label: string;
  category: 'avatar' | 'cover' | 'general';
}

const SUGGESTIONS: ImageSuggestion[] = [
  // Avatars / Musician Portraits
  { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800', label: 'Banda en Vivo Neón', category: 'cover' },
  { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800', label: 'Escenario de Noche', category: 'cover' },
  { url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', label: 'Concierto Festivo', category: 'cover' },
  { url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800', label: 'Luces de Concierto', category: 'cover' },
  { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600', label: 'Retrato Músico', category: 'avatar' },
  { url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600', label: 'Acordeón / En vivo', category: 'avatar' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', label: 'Integrante Masculino 1', category: 'avatar' },
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600', label: 'Integrante Femenino 1', category: 'avatar' },
  { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600', label: 'Integrante Masculino 2', category: 'avatar' },
  { url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600', label: 'Músico de Estudio', category: 'avatar' },
  { url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800', label: 'Teclado / Piano', category: 'general' },
  { url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800', label: 'Estudio de Grabación', category: 'general' },
];

@Component({
  selector: 'app-image-suggestion-picker',
  standalone: true,
  imports: [CommonModule, ModalShellComponent],
  template: `
    <app-modal-shell
      [title]="title()"
      subtitle="Selecciona una sugerencia de alta resolución o ingresa una URL personalizada"
      size="3xl"
      [hasFooter]="true"
      (closed)="closed.emit()"
    >
      <div class="space-y-5 text-xs">
        <!-- URL Custom Input Box -->
        <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2">
          <label class="block font-black text-on-surface uppercase text-[10px]">URL de imagen personalizada:</label>
          <div class="flex items-center gap-2">
            <input
              type="text"
              #customInput
              [value]="customUrl()"
              (input)="customUrl.set(customInput.value)"
              placeholder="https://images.unsplash.com/..."
              class="flex-1 px-3 py-2 rounded-xl bg-surface-bright border border-outline-variant/40 text-on-surface font-mono text-xs focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              (click)="selectUrl(customUrl())"
              [disabled]="!customUrl().trim()"
              class="px-4 py-2 rounded-xl bg-primary text-on-primary font-black disabled:opacity-50 hover:bg-primary/90 transition-all"
            >
              Usar URL
            </button>
          </div>
        </div>

        <!-- Suggestions Grid -->
        <div class="space-y-2">
          <span class="font-black text-outline uppercase text-[10px] block">Sugerencias Recomendadas:</span>
          
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto custom-scrollbar p-1">
            @for (img of filteredSuggestions(); track img.url) {
              <div
                (click)="selectUrl(img.url)"
                class="group cursor-pointer rounded-2xl overflow-hidden border border-outline-variant/30 hover:border-primary transition-all shadow-md hover:scale-105 relative bg-black/40"
                [class.ring-4]="currentUrl() === img.url"
                [class.ring-primary]="currentUrl() === img.url"
              >
                <img [src]="img.url" [alt]="img.label" class="w-full h-24 object-cover group-hover:opacity-90" />
                <div class="p-2 bg-surface-container-high/90 text-[10px] font-extrabold text-on-surface truncate">
                  {{ img.label }}
                </div>
                @if (currentUrl() === img.url) {
                  <span class="absolute top-1 right-1 bg-primary text-on-primary rounded-full px-1.5 py-0.5 text-[9px] font-black">✓ Actual</span>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <ng-container modal-footer>
        <button (click)="closed.emit()" class="px-5 py-2 rounded-xl bg-surface-bright text-outline hover:text-on-surface font-black">
          Cancelar
        </button>
      </ng-container>
    </app-modal-shell>
  `
})
export class ImageSuggestionPickerComponent {
  title = input<string>('Cambiar Imagen');
  currentUrl = input<string>('');
  categoryFilter = input<'avatar' | 'cover' | 'general' | 'all'>('all');

  selectedUrl = output<string>();
  closed = output<void>();

  customUrl = signal<string>('');

  ngOnInit(): void {
    this.customUrl.set(this.currentUrl());
  }

  filteredSuggestions(): ImageSuggestion[] {
    const cat = this.categoryFilter();
    if (cat === 'all') return SUGGESTIONS;
    return SUGGESTIONS.filter(s => s.category === cat || s.category === 'general');
  }

  selectUrl(url: string): void {
    if (url.trim()) {
      this.selectedUrl.emit(url.trim());
      this.closed.emit();
    }
  }
}
