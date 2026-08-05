import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TagOption {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

@Component({
  selector: 'app-multi-tag-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2 text-xs">
      @if (label()) {
        <label class="block text-[10px] font-black uppercase tracking-wider text-outline">
          {{ label() }}
        </label>
      }

      <!-- Selected Tags Container -->
      <div class="p-3 rounded-2xl bg-surface-container-highest border border-outline-variant/30 min-h-[46px] flex flex-wrap items-center gap-1.5 shadow-inner">
        @for (tag of selectedTags(); track tag) {
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary text-on-primary font-black text-xs shadow-sm animate-scale-up">
            @if (getTagIcon(tag); as icon) {
              <span class="material-symbols-outlined text-xs">{{ icon }}</span>
            }
            <span>{{ getTagLabel(tag) }}</span>
            <button
              type="button"
              (click)="removeTag(tag)"
              class="w-4 h-4 rounded-full bg-on-primary/20 hover:bg-on-primary/40 flex items-center justify-center text-[10px] transition-colors"
              title="Eliminar"
            >
              ✕
            </button>
          </span>
        } @empty {
          <span class="text-outline text-xs italic font-medium px-1">
            {{ placeholder() || 'Ninguno seleccionado' }}
          </span>
        }
      </div>

      <!-- Available Options Chips to Add -->
      <div class="space-y-1">
        <span class="text-[9px] font-bold text-outline uppercase tracking-wider block">Opciones disponibles:</span>
        <div class="flex flex-wrap gap-1 max-h-36 overflow-y-auto custom-scrollbar p-1">
          @for (opt of unselectedOptions(); track opt.id) {
            <button
              type="button"
              (click)="addTag(opt.id)"
              class="px-2.5 py-1 rounded-xl bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface border border-outline-variant/30 text-[11px] font-extrabold flex items-center gap-1.5 transition-all hover:scale-105"
            >
              @if (opt.icon) {
                <span class="material-symbols-outlined text-xs text-primary">{{ opt.icon }}</span>
              }
              <span>{{ opt.label }}</span>
              <span class="text-primary font-black text-xs">+</span>
            </button>
          } @empty {
            <span class="text-[10px] text-outline italic">Todas las opciones están seleccionadas.</span>
          }
        </div>
      </div>
    </div>
  `
})
export class MultiTagSelectComponent {
  label = input<string>('');
  placeholder = input<string>('Seleccionar opciones...');
  selectedTags = input<string[]>([]);
  availableOptions = input<TagOption[]>([]);
  tagsChange = output<string[]>();

  addTag(id: string): void {
    if (!this.selectedTags().includes(id)) {
      this.tagsChange.emit([...this.selectedTags(), id]);
    }
  }

  removeTag(id: string): void {
    this.tagsChange.emit(this.selectedTags().filter(t => t !== id));
  }

  unselectedOptions(): TagOption[] {
    const selected = new Set(this.selectedTags());
    return this.availableOptions().filter(o => !selected.has(o.id));
  }

  getTagLabel(id: string): string {
    const found = this.availableOptions().find(o => o.id === id);
    return found ? found.label : id;
  }

  getTagIcon(id: string): string | undefined {
    return this.availableOptions().find(o => o.id === id)?.icon;
  }
}
