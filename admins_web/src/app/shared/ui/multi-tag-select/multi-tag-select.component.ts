import { Component, input, output, signal, computed, ElementRef, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TagOption {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

/**
 * Selector de múltiples etiquetas.
 *
 * El catálogo de opciones se despliega bajo demanda en vez de estar siempre a
 * la vista: con quince géneros, la lista permanente ocupaba media pantalla y
 * competía visualmente con lo que de verdad importa, que es lo ya seleccionado.
 * Al abrirlo aparece además un buscador, porque a partir de una docena de
 * opciones leerlas todas ya cuesta más que escribir dos letras.
 */
@Component({
  selector: 'app-multi-tag-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-1.5 text-xs">
      @if (label()) {
        <label class="block text-[10px] font-black uppercase tracking-wider text-outline">
          {{ label() }}
        </label>
      }

      <!-- Seleccionados + disparador del catálogo -->
      <div class="p-2 rounded-2xl bg-surface-container-highest border border-outline-variant/30 shadow-inner flex flex-wrap items-center gap-1.5">
        @for (tag of selectedTags(); track tag) {
          <span class="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-xl bg-primary text-on-primary font-black text-[11px] shadow-sm">
            @if (getTagIcon(tag); as icon) {
              <span class="material-symbols-outlined text-xs">{{ icon }}</span>
            }
            <span class="truncate max-w-[10rem]">{{ getTagLabel(tag) }}</span>
            <button
              type="button"
              (click)="removeTag(tag)"
              class="w-4 h-4 rounded-full bg-on-primary/25 hover:bg-on-primary/45 flex items-center justify-center transition-colors shrink-0"
              [attr.aria-label]="'Quitar ' + getTagLabel(tag)"
            >
              <span class="material-symbols-outlined text-[11px]">close</span>
            </button>
          </span>
        } @empty {
          <span class="text-outline text-[11px] italic font-medium px-1.5">
            {{ placeholder() || 'Ninguno seleccionado' }}
          </span>
        }

        @if (unselectedOptions().length) {
          <button
            type="button"
            (click)="toggle()"
            [attr.aria-expanded]="open()"
            class="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-black transition-all shrink-0"
            [class]="open()
              ? 'bg-primary/20 text-primary border-primary/50'
              : 'bg-surface-container-high text-outline border-outline-variant/30 hover:text-on-surface'"
          >
            <span class="material-symbols-outlined text-xs">{{ open() ? 'expand_less' : 'add' }}</span>
            {{ open() ? 'Cerrar' : 'Añadir' }}
          </button>
        }
      </div>

      @if (open()) {
        <div class="p-2.5 rounded-2xl bg-surface-container border border-primary/30 shadow-lg space-y-2 animate-fade-in">
          @if (availableOptions().length > 8) {
            <div class="relative">
              <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm pointer-events-none">search</span>
              <input
                [(ngModel)]="query"
                type="text"
                [placeholder]="'Buscar entre ' + unselectedOptions().length + ' opciones...'"
                class="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant/40 text-on-surface text-[11px] font-bold focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>
          }

          <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
            @for (opt of visibleOptions(); track opt.id) {
              <button
                type="button"
                (click)="addTag(opt.id)"
                class="px-2.5 py-1 rounded-xl bg-surface-container-high hover:bg-primary hover:text-on-primary text-outline border border-outline-variant/30 hover:border-primary text-[11px] font-extrabold flex items-center gap-1.5 transition-all"
              >
                @if (opt.icon) {
                  <span class="material-symbols-outlined text-xs">{{ opt.icon }}</span>
                }
                <span>{{ opt.label }}</span>
              </button>
            } @empty {
              <span class="text-[11px] text-outline italic px-1 py-1.5">
                Sin coincidencias para "{{ query() }}".
              </span>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class MultiTagSelectComponent {
  label = input<string>('');
  placeholder = input<string>('Seleccionar opciones...');
  selectedTags = input<string[]>([]);
  availableOptions = input<TagOption[]>([]);
  tagsChange = output<string[]>();

  open = signal(false);
  query = signal('');

  constructor(private host: ElementRef<HTMLElement>) {}

  /** Cerrar al hacer clic fuera evita dejar catálogos abiertos por la pantalla. */
  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  toggle(): void {
    this.open() ? this.close() : this.open.set(true);
  }

  private close(): void {
    this.open.set(false);
    this.query.set('');
  }

  addTag(id: string): void {
    if (!this.selectedTags().includes(id)) {
      this.tagsChange.emit([...this.selectedTags(), id]);
    }
    this.query.set('');
  }

  removeTag(id: string): void {
    this.tagsChange.emit(this.selectedTags().filter(t => t !== id));
  }

  unselectedOptions = computed(() => {
    const selected = new Set(this.selectedTags());
    return this.availableOptions().filter(o => !selected.has(o.id));
  });

  visibleOptions = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.unselectedOptions();
    return q ? list.filter(o => o.label.toLowerCase().includes(q)) : list;
  });

  getTagLabel(id: string): string {
    return this.availableOptions().find(o => o.id === id)?.label ?? id;
  }

  getTagIcon(id: string): string | undefined {
    return this.availableOptions().find(o => o.id === id)?.icon;
  }
}
