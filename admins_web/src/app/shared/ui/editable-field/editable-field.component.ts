import {
  Component, input, output, signal, computed, effect,
  ViewChild, ElementRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type EditableType =
  'text' | 'textarea' | 'number' | 'tel' | 'email' | 'date' | 'datetime-local' | 'url' | 'select';

export interface EditableOption {
  value: string;
  label: string;
}

/**
 * Campo que se lee como texto y se edita en el sitio.
 *
 * La alternativa habitual —un botón "Editar" que convierte toda la pantalla en
 * un formulario— obliga a entrar y salir de un modo para tocar un dato. Aquí
 * cada campo se edita solo: un clic lo abre, Enter guarda, Escape cancela. Eso
 * hace cómodo corregir un teléfono sin abrir un formulario de veinte campos.
 *
 * En modo lectura el valor se ve como texto normal, con un lápiz que aparece al
 * pasar el cursor; así la pantalla no parece un formulario cuando solo se está
 * consultando.
 */
@Component({
  selector: 'app-editable-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="min-w-0 p-3.5 rounded-2xl bg-surface-container/70 border border-outline-variant/20 hover:border-amber-500/40 transition-all duration-300 shadow-sm group/field">
      @if (label()) {
        <span class="block text-[10px] font-black uppercase tracking-wider text-outline mb-1.5 flex items-center justify-between">
          <span>{{ label() }}</span>
          @if (hint()) {
            <span class="normal-case font-bold text-outline/70">· {{ hint() }}</span>
          }
        </span>
      }

      @if (!editing()) {
        <button
          type="button"
          (click)="beginEdit()"
          [disabled]="readonly()"
          class="group/edit w-full text-left flex items-center justify-between gap-2 rounded-xl p-1.5 -m-1.5 transition-colors enabled:hover:bg-primary/10 disabled:cursor-default"
          [attr.aria-label]="'Editar ' + label()"
        >
          <span class="min-w-0 flex-1" [class]="valueClass()">
            @if (displayValue()) {
              {{ prefix() }}{{ displayValue() }}{{ suffix() }}
            } @else {
              <span class="italic text-outline/60 font-medium">{{ placeholder() || 'Sin definir' }}</span>
            }
          </span>

          @if (!readonly()) {
            <div class="flex items-center gap-1.5 shrink-0">
              @if (proposalWarning()) {
                <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <span class="material-symbols-outlined text-[11px]">warning</span> Propuesta
                </span>
              }
              <span
                class="material-symbols-outlined text-sm text-amber-400 opacity-0 group-hover/field:opacity-100 transition-opacity p-1 rounded-lg bg-amber-500/10 border border-amber-500/20 shadow-sm"
              >edit</span>
            </div>
          }
        </button>
      } @else {
        <div class="space-y-2">
          @if (proposalWarning()) {
            <div class="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[10px] font-bold leading-relaxed flex items-start gap-2 shadow-md animate-fade-in">
              <span class="material-symbols-outlined text-sm text-amber-400 shrink-0 mt-0.5">info</span>
              <span>{{ proposalWarning() }}</span>
            </div>
          }

          @switch (type()) {
            @case ('textarea') {
              <textarea
                #control
                [(ngModel)]="draft"
                (keydown)="onKeydown($event)"
                [rows]="rows()"
                [placeholder]="placeholder()"
                class="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-primary/60 text-on-surface text-xs font-medium resize-y focus:outline-none focus:shadow-[0_0_18px_rgba(242,202,80,0.25)] transition-all"
              ></textarea>
            }
            @case ('select') {
              <select
                #control
                [(ngModel)]="draft"
                (keydown)="onKeydown($event)"
                class="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-primary/60 text-on-surface text-xs font-bold focus:outline-none focus:shadow-[0_0_18px_rgba(242,202,80,0.25)] transition-all"
              >
                @for (opt of options(); track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            }
            @default {
              <input
                #control
                [(ngModel)]="draft"
                (keydown)="onKeydown($event)"
                [type]="type()"
                [placeholder]="placeholder()"
                class="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-primary/60 text-on-surface text-xs font-bold focus:outline-none focus:shadow-[0_0_18px_rgba(242,202,80,0.25)] transition-all"
              />
            }
          }

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              (click)="commit()"
              [class]="proposalWarning()
                ? 'px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black text-[10px] font-black transition-all flex items-center gap-1.5 shadow-md active:scale-95'
                : 'px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1'"
            >
              <span class="material-symbols-outlined text-[13px]">{{ proposalWarning() ? 'send' : 'check' }}</span>
              <span>{{ proposalWarning() ? 'Guardar y enviar propuesta' : 'Guardar' }}</span>
            </button>
            <button
              type="button"
              (click)="cancel()"
              class="px-2.5 py-1 rounded-lg bg-surface-container-highest text-outline border border-outline-variant/30 hover:text-on-surface text-[10px] font-black transition-all"
            >
              Cancelar
            </button>
            <span class="text-[9px] text-outline/70 ml-auto hidden sm:inline">
              {{ type() === 'textarea' ? 'Ctrl+Enter guarda' : 'Enter guarda' }} · Esc cancela
            </span>
          </div>
        </div>
      }

      @if (proposedValue()) {
        <div class="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border border-amber-500/40 text-amber-200 text-[11px] font-medium leading-tight flex items-center justify-between gap-2 shadow-lg backdrop-blur-md animate-fade-in">
          <div class="flex items-center gap-2 min-w-0">
            <span class="material-symbols-outlined text-sm text-amber-400 shrink-0">pending_actions</span>
            <span class="truncate">
              <strong class="font-black text-amber-300 uppercase tracking-wider text-[9px] mr-1">Propuesta enviada:</strong>
              <span class="font-bold underline decoration-amber-400/50">"{{ proposedValue() }}"</span>
              @if (proposedBy()) {
                <span class="text-[10px] text-amber-200/80 ml-1">· por {{ proposedBy() }}</span>
              }
            </span>
          </div>
          <span class="px-2 py-0.5 rounded-md bg-amber-500/25 text-amber-300 text-[9px] font-black uppercase tracking-wider shrink-0 border border-amber-500/40 shadow-sm">
            Pendiente
          </span>
        </div>
      }
    </div>
  `
})
export class EditableFieldComponent {
  value = input<string | number | null | undefined>('');
  label = input<string>('');
  hint = input<string>('');
  proposalWarning = input<string | null | undefined>(undefined);
  proposedValue = input<string | number | null | undefined>(undefined);
  proposedBy = input<string | null | undefined>(undefined);
  type = input<EditableType>('text');
  options = input<EditableOption[]>([]);
  placeholder = input<string>('');
  readonly = input<boolean>(false);
  rows = input<number>(4);
  /** Clases del valor en modo lectura, para que cada sitio le dé su peso visual. */
  valueClass = input<string>('text-xs font-bold text-on-surface break-words');
  prefix = input<string>('');
  suffix = input<string>('');
  /** Agrupa los miles al leer un número. Desactívalo para años o porcentajes. */
  groupThousands = input<boolean>(true);

  /** Emite el valor ya confirmado. */
  save = output<string>();

  editing = signal(false);
  draft = signal<string>('');

  @ViewChild('control') private control?: ElementRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

  constructor() {
    // Al abrir la edición hay que esperar a que el control exista para enfocarlo.
    effect(() => {
      if (!this.editing()) return;
      queueMicrotask(() => {
        const el = this.control?.nativeElement;
        el?.focus();
        if (el && 'select' in el && typeof el.select === 'function') el.select();
      });
    });
  }

  /**
   * Valor tal como se lee. Un select muestra la etiqueta de la opción, y los
   * números se agrupan con separador de miles: al editar se sigue trabajando
   * sobre el número crudo, que es lo que espera un input numérico.
   */
  displayValue = computed(() => {
    const raw = this.value();
    if (raw === null || raw === undefined || raw === '') return '';

    if (this.type() === 'select') {
      return this.options().find(o => o.value === String(raw))?.label ?? String(raw);
    }

    if (this.type() === 'number' && this.groupThousands()) {
      const n = Number(raw);
      if (Number.isFinite(n)) return n.toLocaleString('es-MX');
    }

    return String(raw);
  });

  beginEdit(): void {
    if (this.readonly()) return;
    const raw = this.value();
    this.draft.set(raw === null || raw === undefined ? '' : String(raw));
    this.editing.set(true);
  }

  commit(): void {
    this.save.emit(this.draft());
    this.editing.set(false);
  }

  cancel(): void {
    this.editing.set(false);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
      return;
    }
    if (event.key === 'Enter') {
      // En un textarea Enter sirve para saltar de línea, así que se guarda con Ctrl.
      const needsModifier = this.type() === 'textarea';
      if (!needsModifier || event.ctrlKey || event.metaKey) {
        event.preventDefault();
        this.commit();
      }
    }
  }
}
