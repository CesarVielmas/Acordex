import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Una opción de filtro contextual ya resuelta con su conteo para renderizar. */
export interface EventFilterChip {
  value: string;
  label: string;
  icon: string;
  /** Clases Tailwind aplicadas cuando el chip está activo (color propio de la categoría). */
  activeClass: string;
  count: number;
}

/**
 * Barra de filtros contextuales de una fase del evento.
 * Se reutiliza tal cual en el tablero (por columna) y en la cartelera (cuando
 * hay una fase concreta seleccionada), para que ambas se vean idénticas.
 */
@Component({
  selector: 'app-event-state-filter-bar',
  standalone: true,
  imports: [CommonModule],
  // Sin esto el host es `display: inline` y los márgenes verticales que le
  // aplica el contenedor (space-y-*) no surten efecto.
  host: { class: 'block' },
  template: `
    <!-- En móvil se desliza en una sola fila; desde sm hace wrap normal. -->
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar sm:flex-wrap sm:overflow-visible">
      <span class="text-[10px] font-bold text-outline uppercase tracking-wider flex items-center gap-1 shrink-0">
        <span class="material-symbols-outlined text-sm">filter_alt</span>
        {{ label }}
      </span>

      @for (chip of chips; track chip.value) {
        <button
          type="button"
          (click)="select.emit(chip.value)"
          [disabled]="chip.count === 0 && chip.value !== active"
          [attr.aria-pressed]="chip.value === active"
          [title]="chip.label + ' — ' + chip.count + ' evento(s)'"
          [class]="chip.value === active ? chip.activeClass : 'bg-surface-container-high/80 text-outline border-outline-variant/30 hover:text-on-surface hover:border-outline-variant/60'"
          class="px-3 py-1.5 min-h-9 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-30 disabled:pointer-events-none"
        >
          <span class="material-symbols-outlined text-xs shrink-0">{{ chip.icon }}</span>
          <span class="whitespace-nowrap">{{ chip.label }}</span>
          <span class="px-1.5 rounded-md bg-black/30 font-mono text-[10px] leading-4 shrink-0">{{ chip.count }}</span>
        </button>
      }
    </div>
  `
})
export class EventStateFilterBarComponent {
  @Input() chips: EventFilterChip[] = [];
  @Input() active = 'todas';
  @Input() label = 'Filtrar por:';
  @Output() select = new EventEmitter<string>();
}
