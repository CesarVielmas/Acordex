import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventState } from '../../../core/models/event.models';
import { eventStateMeta } from '../../../core/models/event-state.meta';
import { EventStateFilterBarComponent } from './event-state-filter-bar.component';

/** Una fase del ciclo con su conteo, para pintar la rejilla de fases. */
export interface EventStateChip {
  state: EventState;
  count: number;
}

/** Un filtro activo, mostrado como chip removible en la barra compacta. */
export interface ActiveEventFilterChip {
  key: 'search' | 'state' | 'context';
  label: string;
  icon: string;
}

/**
 * Barra de filtros del panel de eventos.
 *
 * Arranca colapsada y los filtros aplicados quedan visibles como chips
 * removibles aunque el panel esté cerrado. Permite filtrar por texto, por
 * fase del ciclo de vida y ocultar fases vacías en el Tablero.
 */
@Component({
  selector: 'app-event-filters-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, EventStateFilterBarComponent],
  host: { class: 'block' },
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
              placeholder="Buscar por folio, evento, grupo, recinto o ciudad..."
              aria-label="Buscar eventos"
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
              aria-controls="event-filters-panel"
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

        <!-- Filtros aplicados: visibles aunque el panel esté colapsado -->
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

      <!-- PANEL DESPLEGABLE -->
      @if (expanded()) {
        <div id="event-filters-panel" class="animate-slide-up">
          <div class="px-3.5 sm:px-4 pb-4 space-y-4 border-t border-outline-variant/20 pt-4">

            <!-- FASES DEL CICLO DE VIDA -->
            <div class="space-y-2">
              <span class="text-[10px] font-bold text-outline uppercase tracking-wider flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">dashboard</span>
                Fase del Evento
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
                  <span class="truncate flex-1 min-w-0">Todas las Fases</span>
                  <span class="px-1.5 rounded-md bg-black/25 font-mono text-[10px] leading-4 shrink-0">{{ totalCount }}</span>
                </button>

                @for (chip of stateChips; track chip.state) {
                  <button
                    type="button"
                    (click)="stateFilterChange.emit(chip.state)"
                    [attr.aria-pressed]="stateFilter === chip.state"
                    [title]="stateMeaning(chip.state)"
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

            <!-- OPCOINES ADICIONALES -->
            <div class="pt-3 border-t border-outline-variant/20">
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
                Ocultar fases vacías
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class EventFiltersToolbarComponent {
  @Input() stateChips: EventStateChip[] = [];
  @Input() stateFilter = 'Todos';
  @Input() searchTerm = '';
  @Input() hideEmptyStates = false;
  @Input() resultCount = 0;
  @Input() totalCount = 0;
  /** Filtros aplicados, para mostrarlos y poder quitarlos uno a uno. */
  @Input() activeFilterChips: ActiveEventFilterChip[] = [];

  @Output() stateFilterChange = new EventEmitter<string>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() hideEmptyStatesChange = new EventEmitter<boolean>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() removeFilter = new EventEmitter<ActiveEventFilterChip['key']>();

  /** Estado visual del panel. Arranca cerrado para no robar espacio. */
  expanded = signal(false);

  stateIcon(state: EventState): string {
    return eventStateMeta(state).icon;
  }

  stateMeaning(state: EventState): string {
    return eventStateMeta(state).meaning;
  }

  stateActiveClass(state: EventState): string {
    return eventStateMeta(state).chipActiveClass;
  }

  stateIdleClass(state: EventState): string {
    return 'bg-surface-container-high/80 border-outline-variant/30 hover:border-outline-variant/60 ' + eventStateMeta(state).textColor;
  }
}

