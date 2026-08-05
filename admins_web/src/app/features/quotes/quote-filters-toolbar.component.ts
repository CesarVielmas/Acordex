import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuoteState } from '../../core/models/admin.models';
import { quoteStateMeta } from '../../core/models/quote-state.meta';
import { QuoteStateFilterBarComponent, StateFilterChip } from './quote-state-filter-bar.component';

/** Un estado del pipeline con su conteo, para pintar la rejilla de estados. */
export interface QuoteStateChip {
  state: QuoteState;
  count: number;
}

export type QuoteSortMode = 'estado' | 'fecha' | 'monto' | 'cliente';

/**
 * Barra de filtros del panel de cotizaciones.
 *
 * Se rediseñó por dos motivos concretos:
 *
 * 1. Las píldoras de estado se renderizaban en una sola fila que necesitaba
 *    1688px dentro de un contenedor de 908px: más de la mitad de los estados
 *    quedaban ocultos tras un scroll horizontal sin ninguna señal visual, y
 *    ninguno mostraba color ni conteo. Ahora es una rejilla que hace wrap, con
 *    el color de cada fase y su número de cotizaciones.
 *
 * 2. Los filtros no se adaptaban al formato de cada vista. El Kanban ya agrupa
 *    por estado y lleva su propia barra contextual en cada columna, así que aquí
 *    sólo necesita controlar qué columnas se ven. La Tabla, en cambio, es una
 *    lista plana: necesita ordenar y, cuando se ven todos los estados juntos,
 *    filtros transversales en vez de filtros por fase.
 *
 * Es un componente presentacional: no inyecta servicios ni conoce el origen de
 * los datos; recibe valores y emite intenciones.
 */
@Component({
  selector: 'app-quote-filters-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, QuoteStateFilterBarComponent],
  template: `
    <div class="p-4 sm:p-5 rounded-3xl bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 shadow-lg space-y-4">

      <!-- FILA 1: BÚSQUEDA + RESUMEN DE RESULTADOS -->
      <div class="flex flex-col lg:flex-row lg:items-center gap-3">
        <div class="relative flex-1 min-w-0">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">search</span>
          <input
            [ngModel]="searchTerm"
            (ngModelChange)="searchTermChange.emit($event)"
            type="text"
            placeholder="Buscar por folio, cliente, empresa, grupo musical o ciudad..."
            aria-label="Buscar cotizaciones"
            class="w-full bg-surface-container-high/90 border border-outline-variant/30 rounded-2xl pl-10 pr-4 py-2.5 min-h-11 text-xs text-on-surface focus:outline-none focus:border-primary/60 transition-all shadow-inner"
          />
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <span class="px-3 py-1.5 rounded-xl bg-surface-container-high/80 border border-outline-variant/30 text-[11px] font-bold text-outline whitespace-nowrap">
            <strong class="text-on-surface font-black">{{ resultCount }}</strong> de {{ totalCount }} cotizaciones
          </span>

          @if (hasActiveFilters) {
            <button
              type="button"
              (click)="clearFilters.emit()"
              class="px-3 py-1.5 min-h-9 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/40 hover:bg-rose-500/25 text-[11px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <span class="material-symbols-outlined text-sm">filter_alt_off</span> Limpiar filtros
            </button>
          }
        </div>
      </div>

      <!-- FILA 2: REJILLA DE ESTADOS (hace wrap, todos visibles, color por fase) -->
      <div class="space-y-2 pt-1 border-t border-outline-variant/20">
        <span class="text-[10px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">dashboard</span>
          Etapa del Pipeline
        </span>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <button
            type="button"
            (click)="stateFilterChange.emit('Todos')"
            [attr.aria-pressed]="stateFilter === 'Todos'"
            [class]="stateFilter === 'Todos'
              ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20'
              : 'bg-surface-container-high/80 text-outline border-outline-variant/30 hover:text-on-surface hover:border-outline-variant/60'"
            class="px-3 py-2 min-h-11 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 text-left"
          >
            <span class="material-symbols-outlined text-base shrink-0">apps</span>
            <span class="truncate flex-1 min-w-0">Todas las Etapas</span>
            <span class="px-1.5 rounded-md bg-black/25 font-mono text-[10px] leading-4 shrink-0">{{ totalCount }}</span>
          </button>

          @for (chip of stateChips; track chip.state) {
            <button
              type="button"
              (click)="stateFilterChange.emit(chip.state)"
              [attr.aria-pressed]="stateFilter === chip.state"
              [title]="chip.state + ' — ' + chip.count + ' cotización(es)'"
              [class]="stateFilter === chip.state ? stateActiveClass(chip.state) : stateIdleClass(chip.state)"
              class="px-3 py-2 min-h-11 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 text-left"
            >
              <span class="material-symbols-outlined text-base shrink-0">{{ stateIcon(chip.state) }}</span>
              <span class="truncate flex-1 min-w-0">{{ chip.state }}</span>
              <span class="px-1.5 rounded-md bg-black/25 font-mono text-[10px] leading-4 shrink-0">{{ chip.count }}</span>
            </button>
          }
        </div>
      </div>

      <!-- FILA 3: CONTROLES PROPIOS DE CADA VISTA -->
      <div class="pt-2 border-t border-outline-variant/20 space-y-3">

        @if (viewMode === 'table') {
          <!-- La Tabla es una lista plana: necesita chips que apliquen sobre todo
               el listado, no por columna como el Kanban. -->
          <app-quote-state-filter-bar
            [chips]="contextChips"
            [active]="contextActive"
            [label]="contextLabel"
            (select)="contextFilterChange.emit($event)"
          />
        }

        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          @if (viewMode === 'kanban') {
            <!-- El Kanban muestra una columna por estado; con 10 estados y pocas
                 cotizaciones, poder colapsar los vacíos evita el scroll inútil. -->
            <button
              type="button"
              (click)="hideEmptyStatesChange.emit(!hideEmptyStates)"
              [attr.aria-pressed]="hideEmptyStates"
              [class]="hideEmptyStates
                ? 'bg-primary/20 text-primary border-primary/50'
                : 'bg-surface-container-high/80 text-outline border-outline-variant/30 hover:text-on-surface'"
              class="px-3.5 py-2 min-h-11 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 self-start"
            >
              <span class="material-symbols-outlined text-base">{{ hideEmptyStates ? 'check_box' : 'check_box_outline_blank' }}</span>
              Ocultar estados vacíos
            </button>
          } @else {
            <div class="flex items-center gap-2 text-xs">
              <label for="quote-sort" class="text-outline font-semibold shrink-0">Ordenar por:</label>
              <select
                id="quote-sort"
                [ngModel]="sortMode"
                (ngModelChange)="sortModeChange.emit($event)"
                class="bg-surface-container-high/90 border border-outline-variant/30 rounded-xl px-3.5 py-2 min-h-11 text-xs text-on-surface focus:outline-none focus:border-primary/60"
              >
                <option value="estado">Etapa del pipeline</option>
                <option value="fecha">Fecha del evento</option>
                <option value="monto">Monto (mayor a menor)</option>
                <option value="cliente">Cliente (A-Z)</option>
              </select>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class QuoteFiltersToolbarComponent {
  @Input() viewMode: 'kanban' | 'table' = 'kanban';
  @Input() stateChips: QuoteStateChip[] = [];
  @Input() stateFilter = 'Todos';
  @Input() searchTerm = '';
  @Input() sortMode: QuoteSortMode = 'estado';
  @Input() hideEmptyStates = false;
  @Input() resultCount = 0;
  @Input() totalCount = 0;
  @Input() hasActiveFilters = false;

  /** Chips contextuales de la fase, o transversales si se ven todos los estados. */
  @Input() contextChips: StateFilterChip[] = [];
  @Input() contextActive = 'todas';
  @Input() contextLabel = 'Filtrar por:';

  @Output() stateFilterChange = new EventEmitter<string>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() sortModeChange = new EventEmitter<QuoteSortMode>();
  @Output() hideEmptyStatesChange = new EventEmitter<boolean>();
  @Output() contextFilterChange = new EventEmitter<string>();
  @Output() clearFilters = new EventEmitter<void>();

  stateIcon(state: QuoteState): string {
    return quoteStateMeta(state).icon;
  }

  stateActiveClass(state: QuoteState): string {
    return quoteStateMeta(state).chipActiveClass;
  }

  stateIdleClass(state: QuoteState): string {
    return 'bg-surface-container-high/80 border-outline-variant/30 hover:border-outline-variant/60 ' + quoteStateMeta(state).textColor;
  }
}
