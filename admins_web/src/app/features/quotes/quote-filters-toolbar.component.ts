import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
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

/** Un filtro activo, mostrado como chip removible en la barra compacta. */
export interface ActiveFilterChip {
  /** Identifica qué filtro quitar cuando se pulsa la X. */
  key: 'search' | 'state' | 'context';
  label: string;
  icon: string;
}

export type QuoteSortMode = 'estado' | 'fecha' | 'monto' | 'cliente';

/**
 * Barra de filtros del panel de cotizaciones.
 *
 * Arranca **colapsada**: al entrar solo se ve una fila con el buscador, el
 * conteo de resultados y un botón que indica cuántos filtros hay activos. Los
 * filtros que sí están aplicados se listan como chips removibles, para que
 * colapsar nunca esconda el hecho de que la lista está filtrada.
 *
 * Al desplegar aparecen la rejilla de estados y los controles propios de cada
 * vista, que son distintos a propósito: el Kanban ya agrupa por estado y lleva
 * su barra contextual en cada columna, así que aquí solo necesita decidir qué
 * columnas ver; la Tabla es una lista plana y necesita ordenar y filtrar de
 * forma transversal.
 *
 * Es un componente presentacional: no inyecta servicios ni conoce el origen de
 * los datos; recibe valores y emite intenciones. La única excepción es
 * `expanded`, que es estado puramente visual y por eso vive aquí.
 */
@Component({
  selector: 'app-quote-filters-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, QuoteStateFilterBarComponent],
  template: `
    <div class="rounded-3xl bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 shadow-lg overflow-hidden">

      <!-- BARRA COMPACTA: siempre visible -->
      <div class="p-3.5 sm:p-4 space-y-3">
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

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <span class="px-3 py-2 min-h-11 rounded-xl bg-surface-container-high/80 border border-outline-variant/30 text-[11px] font-bold text-outline whitespace-nowrap inline-flex items-center">
              <strong class="text-on-surface font-black mr-1">{{ resultCount }}</strong> de {{ totalCount }}
            </span>

            <button
              type="button"
              (click)="expanded.set(!expanded())"
              [attr.aria-expanded]="expanded()"
              aria-controls="quote-filters-panel"
              [class]="activeFilterChips.length > 0
                ? 'bg-primary/20 text-primary border-primary/50'
                : 'bg-surface-container-high/80 text-on-surface-variant border-outline-variant/30 hover:text-on-surface'"
              class="px-3.5 py-2 min-h-11 rounded-xl text-[11px] font-bold border transition-all inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span class="material-symbols-outlined text-base">tune</span>
              Filtros
              @if (activeFilterChips.length > 0) {
                <span class="px-1.5 rounded-md bg-primary text-on-primary font-mono text-[10px] leading-4">{{ activeFilterChips.length }}</span>
              }
              <span class="material-symbols-outlined text-base transition-transform" [class.rotate-180]="expanded()">expand_more</span>
            </button>

            @if (activeFilterChips.length > 0) {
              <button
                type="button"
                (click)="clearFilters.emit()"
                class="px-3 py-2 min-h-11 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/40 hover:bg-rose-500/25 text-[11px] font-bold transition-all inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span class="material-symbols-outlined text-sm">filter_alt_off</span> Limpiar
              </button>
            }
          </div>
        </div>

        <!-- Filtros aplicados: visibles aunque el panel esté colapsado, para que
             nunca se filtre la lista "en secreto". -->
        @if (activeFilterChips.length > 0) {
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[10px] font-bold text-outline uppercase tracking-wider shrink-0">Aplicados:</span>
            @for (chip of activeFilterChips; track chip.key + chip.label) {
              <button
                type="button"
                (click)="removeFilter.emit(chip.key)"
                [title]="'Quitar filtro: ' + chip.label"
                class="pl-2 pr-1.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 text-[10px] font-bold inline-flex items-center gap-1 transition-all"
              >
                <span class="material-symbols-outlined text-[11px]">{{ chip.icon }}</span>
                {{ chip.label }}
                <span class="material-symbols-outlined text-[13px] opacity-70">close</span>
              </button>
            }
          </div>
        }
      </div>

      <!-- PANEL DESPLEGABLE.
           Se renderiza condicionalmente en vez de ocultarse con CSS: así el
           contenido colapsado no queda accesible por teclado ni por lectores de
           pantalla, y no hay que inventar una altura máxima que podría recortarlo. -->
      @if (expanded()) {
        <div id="quote-filters-panel" class="animate-slide-up">
          <div class="px-3.5 sm:px-4 pb-4 space-y-4 border-t border-outline-variant/20 pt-4">

            <!-- ETAPAS DEL PIPELINE -->
            <div class="space-y-2">
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

            <!-- CONTROLES PROPIOS DE CADA VISTA -->
            <div class="pt-3 border-t border-outline-variant/20 space-y-3">
              @if (viewMode === 'table') {
                <app-quote-state-filter-bar
                  [chips]="contextChips"
                  [active]="contextActive"
                  [label]="contextLabel"
                  (select)="contextFilterChange.emit($event)"
                />
              }

              @if (viewMode === 'kanban') {
                <button
                  type="button"
                  (click)="hideEmptyStatesChange.emit(!hideEmptyStates)"
                  [attr.aria-pressed]="hideEmptyStates"
                  [class]="hideEmptyStates
                    ? 'bg-primary/20 text-primary border-primary/50'
                    : 'bg-surface-container-high/80 text-outline border-outline-variant/30 hover:text-on-surface'"
                  class="px-3.5 py-2 min-h-11 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5"
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
      }
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
  /** Filtros aplicados, para mostrarlos y poder quitarlos uno a uno. */
  @Input() activeFilterChips: ActiveFilterChip[] = [];

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
  @Output() removeFilter = new EventEmitter<ActiveFilterChip['key']>();

  /** Estado visual del panel. Arranca cerrado para no robar espacio. */
  expanded = signal(false);

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
