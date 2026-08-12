import { Component, ChangeDetectionStrategy, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketTier } from '../../../../core/models/event.models';
import { colorsAreClose, nextTierColor, TIER_ICONS, TIER_PALETTE } from '../croquis-catalog';

/**
 * Alta y edición de una categoría de boleto.
 *
 * Existe como diálogo y no como campos sueltos porque una categoría a medias no
 * sirve para nada: sin precio no se puede vender, y sin un color distinguible el
 * croquis se vuelve una sola mancha donde el cliente no ve dónde termina una
 * zona y empieza otra. Pedir las cuatro cosas juntas —nombre, color, precio y
 * qué incluye— evita que nazca incompleta y haya que perseguirla después desde
 * el checklist.
 *
 * El aviso de color parecido es el que más se agradece: es un error que no se
 * nota al capturar y que solo se descubre cuando el croquis ya está armado y no
 * se entiende.
 */
@Component({
  selector: 'app-croquis-tier-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div
      class="fixed inset-0 z-[9999999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      (click)="cancelled.emit()"
    >
      <div
        class="w-full max-w-lg my-auto bg-surface-container rounded-3xl border border-outline-variant/40 shadow-[0_25px_85px_rgba(0,0,0,0.9)] overflow-hidden animate-scale-up"
        (click)="$event.stopPropagation()"
      >
        <!-- Cabecera: se tiñe del color elegido, así se ve el resultado antes de guardar -->
        <header
          class="p-5 border-b border-outline-variant/25 flex items-center gap-3"
          [style.background]="'linear-gradient(135deg,' + draft().color + '26, transparent)'"
        >
          <span
            class="w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg"
            [style.background-color]="draft().color + '2e'"
            [style.border-color]="draft().color + '80'"
          >
            <span class="material-symbols-outlined text-xl" [style.color]="draft().color">
              {{ draft().icon || 'confirmation_number' }}
            </span>
          </span>
          <div class="min-w-0 flex-1">
            <h3 class="text-sm font-black text-on-surface tracking-tight truncate">
              {{ mode() === 'editar' ? 'Editar categoría de boleto' : 'Nueva categoría de boleto' }}
            </h3>
            <p class="text-[11px] text-outline truncate">
              {{ draft().name || 'Sin nombre' }} ·
              <span class="font-mono">&#36;{{ (draft().price || 0).toLocaleString('es-MX') }}</span>
            </p>
          </div>
          <button
            type="button"
            (click)="cancelled.emit()"
            class="w-9 h-9 shrink-0 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-outline hover:text-on-surface border border-outline-variant/30 flex items-center justify-center transition-all"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </header>

        <div class="p-5 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label class="block min-w-0">
              <span [class]="labelClass">Nombre de la categoría</span>
              <input
                #nombre
                [value]="draft().name"
                (input)="patch({ name: value($event) })"
                placeholder="Ej. Palco VIP"
                [class]="inputClass"
              />
            </label>

            <label class="block min-w-0">
              <span [class]="labelClass">Precio del boleto</span>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-outline pointer-events-none">$</span>
                <input
                  type="number"
                  min="0"
                  [value]="draft().price || 0"
                  (input)="patch({ price: num($event) })"
                  [class]="inputClass + ' pl-7'"
                />
              </div>
            </label>
          </div>

          <!-- ─── COLOR ─── -->
          <div>
            <span [class]="labelClass">
              Color en el croquis
              <span class="normal-case font-bold text-outline/70">· es lo que distingue una zona de otra</span>
            </span>

            <div class="flex flex-wrap gap-2">
              @for (color of palette; track color) {
                <button
                  type="button"
                  (click)="patch({ color })"
                  class="w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 relative"
                  [style.background-color]="color"
                  [style.border-color]="draft().color === color ? '#ffffff' : 'transparent'"
                  [title]="takenBy(color) || 'Usar este color'"
                >
                  @if (takenBy(color); as owner) {
                    <span class="absolute inset-0 flex items-center justify-center">
                      <span class="material-symbols-outlined text-[15px] text-black/70">block</span>
                    </span>
                  }
                </button>
              }

              <label
                class="w-9 h-9 rounded-xl border-2 border-dashed border-outline-variant/50 flex items-center justify-center cursor-pointer hover:border-primary/60 transition-all"
                title="Elegir otro color"
              >
                <span class="material-symbols-outlined text-[15px] text-outline">palette</span>
                <input
                  type="color"
                  [value]="draft().color"
                  (input)="patch({ color: value($event) })"
                  class="sr-only"
                />
              </label>
            </div>

            @if (colorClash(); as clash) {
              <p class="mt-2 text-[10px] text-amber-300 flex items-start gap-1.5 leading-snug">
                <span class="material-symbols-outlined text-[13px] shrink-0">warning</span>
                <span class="min-w-0">
                  Este color es casi igual al de <strong class="break-words">"{{ clash }}"</strong>.
                  En el croquis las dos categorías se van a ver como una sola mancha.
                </span>
              </p>
            }
          </div>

          <!-- ─── ÍCONO ─── -->
          <div>
            <span [class]="labelClass">Ícono con el que se anuncia</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              @for (item of icons; track item.value) {
                <button
                  type="button"
                  (click)="patch({ icon: item.value })"
                  class="px-2 py-2 rounded-xl border text-[10px] font-black flex flex-col items-center gap-1 transition-all min-w-0"
                  [class]="draft().icon === item.value
                    ? 'bg-primary/20 text-primary border-primary/50'
                    : 'bg-surface-container-high/60 text-on-surface-variant border-outline-variant/30 hover:border-primary/40'"
                >
                  <span class="material-symbols-outlined text-lg">{{ item.value }}</span>
                  <span class="truncate max-w-full leading-tight">{{ item.label }}</span>
                </button>
              }
            </div>
          </div>

          <!-- ─── DESCRIPCIÓN ─── -->
          <label class="block">
            <span [class]="labelClass">
              Qué incluye
              <span class="normal-case font-bold text-outline/70">· el cliente decide su compra con esto</span>
            </span>
            <textarea
              rows="3"
              [value]="draft().description || ''"
              (input)="patch({ description: value($event) })"
              placeholder="Ej. Primeras filas, acceso prioritario y bebida de cortesía."
              [class]="inputClass + ' resize-y leading-relaxed'"
            ></textarea>
          </label>

          @if (mode() === 'nuevo') {
            <p class="text-[10px] text-outline leading-relaxed p-2.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 flex items-start gap-1.5">
              <span class="material-symbols-outlined text-[13px] shrink-0 text-cyan-300">info</span>
              <span class="min-w-0">
                Los lugares no se capturan: se cuentan del croquis. Al crearla, asígnala a un área del plano
                o píntala sobre las butacas que le tocan.
              </span>
            </p>
          }
        </div>

        <footer class="p-4 border-t border-outline-variant/25 bg-surface-container-high/60 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
          <button
            type="button"
            (click)="cancelled.emit()"
            class="px-4 py-2.5 min-h-11 rounded-xl bg-surface-container-highest text-on-surface-variant border border-outline-variant/30 hover:text-on-surface text-xs font-black transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="commit()"
            [disabled]="!canSave()"
            class="px-5 py-2.5 min-h-11 rounded-xl bg-primary text-black text-xs font-black transition-all shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <span class="material-symbols-outlined text-base">{{ mode() === 'editar' ? 'save' : 'add' }}</span>
            {{ mode() === 'editar' ? 'Guardar cambios' : 'Crear categoría' }}
          </button>
        </footer>
      </div>
    </div>
  `
})
export class CroquisTierDialogComponent {
  /** Categoría a editar; sin ella, el diálogo da de alta una nueva. */
  tier = input<TicketTier | null>(null);
  /** Las demás categorías del evento, para avisar de colores repetidos. */
  siblings = input<TicketTier[]>([]);

  saved = output<TicketTier>();
  cancelled = output<void>();

  readonly palette = TIER_PALETTE;
  readonly icons = TIER_ICONS;

  readonly labelClass = 'block text-[10px] font-black uppercase tracking-wider text-outline mb-1.5';
  readonly inputClass =
    'w-full px-3 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 ' +
    'text-xs font-bold text-on-surface placeholder:text-outline/50 placeholder:font-medium ' +
    'focus:outline-none focus:border-primary/60 focus:shadow-[0_0_18px_rgba(242,202,80,0.18)] transition-all';

  mode = computed<'nuevo' | 'editar'>(() => (this.tier() ? 'editar' : 'nuevo'));

  draft = signal<TicketTier>(this.blank());

  constructor() {
    effect(() => {
      const existing = this.tier();
      this.draft.set(existing ? { ...existing } : this.blank());
    });
  }

  private blank(): TicketTier {
    return {
      id: '',
      name: '',
      price: 0,
      totalSeats: 0,
      soldSeats: 0,
      color: nextTierColor((this.siblings() || []).map(t => t.color)),
      icon: 'confirmation_number',
      description: ''
    };
  }

  /** Categorías distintas a la que se edita: contra ellas se compara el color. */
  private others = computed(() => {
    const id = this.tier()?.id;
    return (this.siblings() || []).filter(t => t.id !== id);
  });

  colorClash = computed(() => {
    const color = this.draft().color;
    return this.others().find(t => colorsAreClose(t.color, color))?.name || '';
  });

  takenBy(color: string): string {
    return this.others().find(t => (t.color || '').toLowerCase() === color.toLowerCase())?.name || '';
  }

  canSave = computed(() => this.draft().name.trim().length > 0);

  value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  num(event: Event): number {
    return Math.max(0, Number(this.value(event)) || 0);
  }

  patch(changes: Partial<TicketTier>): void {
    this.draft.update(d => ({ ...d, ...changes }));
  }

  commit(): void {
    if (!this.canSave()) return;
    const d = this.draft();
    this.saved.emit({ ...d, name: d.name.trim(), description: (d.description || '').trim() });
  }
}
