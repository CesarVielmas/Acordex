import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { LayoutStateService } from '../../core/services/layout_state.service';
import { Quote, QuoteState, PaymentStatus } from '../../core/models/admin.models';
import { QUOTE_ALL_STATES, quoteStateMeta } from '../../core/models/quote-state.meta';
import { AccessRestrictedComponent } from '../../shared/ui/access-restricted/access-restricted.component';
import { KpiCardComponent } from '../../shared/ui/kpi-card/kpi-card.component';
import { TableShellComponent } from '../../shared/ui/table-shell/table-shell.component';
import { QuoteStateBadgeComponent } from '../../shared/ui/quote-state-badge/quote-state-badge.component';
import { QuoteStateFilterBarComponent, StateFilterChip } from './quote-state-filter-bar.component';
import { QuoteFiltersToolbarComponent, QuoteStateChip, QuoteSortMode, ActiveFilterChip } from './quote-filters-toolbar.component';
import { QuoteKanbanCardComponent } from './quote-kanban-card.component';
import { stateSummary } from './quote-card-insights';
import { PanelMetric, panelMetrics as resolvePanelMetrics } from './quote-panel-metrics';
import {
  QuoteFilterOption,
  stateFilterOptions,
  stateFilterLabel,
  transversalFilterOptions,
  TRANSVERSAL_FILTER_LABEL
} from './quote-filter-catalog';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AccessRestrictedComponent,
    KpiCardComponent,
    TableShellComponent,
    QuoteStateBadgeComponent,
    QuoteStateFilterBarComponent,
    QuoteFiltersToolbarComponent,
    QuoteKanbanCardComponent
  ],
  template: `
    <div class="space-y-6 max-w-full">

      @if (roleService.activeRole() === 'usuario') {
        <!-- NEUTRAL ACCESS RESTRICTED SCREEN (NO ROLE EXPLANATIONS OR CAUSES) -->
        <app-access-restricted icon="lock" title="Acceso Restringido" message="Sección no disponible." [showBackLink]="true" />
      } @else {
        <!-- FULL COTIZACIONES MODULE FOR AUTHORIZED MANAGERS & ADMINISTRATORS -->

        <!-- TOP HEADER & VIEW TOGGLE (ULTRA MODERN GLASSMORPHISM) -->
        <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-surface-container-high/90 via-surface-container/80 to-surface-container-high/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div class="absolute -right-10 -top-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10">
            <div class="flex items-center gap-3 flex-wrap">
              <div class="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-inner shrink-0">
                <span class="material-symbols-outlined text-2xl">request_quote</span>
              </div>
              <div>
                <h1 class="font-display-xl text-xl sm:text-2xl lg:text-3xl font-black text-on-surface tracking-tight">Panel de Cotizaciones & Contrataciones Individuales</h1>
                <p class="text-xs text-outline mt-0.5">Gestión de contratación 1 a 1 por cliente y grupo musical, reserva de agenda y control de {{ allStates.length }} estados comerciales</p>
              </div>
            </div>
          </div>

          <!-- View Mode Switcher: Kanban Vertical vs Tabla -->
          <div class="flex items-center gap-3 self-start md:self-auto relative z-10">
            <div class="p-1.5 rounded-2xl bg-surface-container-highest/60 border border-outline-variant/40 flex items-center gap-1.5 shadow-lg backdrop-blur-md">
              <button
                (click)="viewMode.set('kanban')"
                [class]="viewMode() === 'kanban' ? 'bg-primary text-on-primary font-bold shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'"
                class="px-4 py-2 min-h-11 rounded-xl text-xs flex items-center gap-2 transition-all duration-300"
              >
                <span class="material-symbols-outlined text-base">view_kanban</span> Kanban Vertical
              </button>
              <button
                (click)="viewMode.set('table')"
                [class]="viewMode() === 'table' ? 'bg-primary text-on-primary font-bold shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'"
                class="px-4 py-2 min-h-11 rounded-xl text-xs flex items-center gap-2 transition-all duration-300"
              >
                <span class="material-symbols-outlined text-base">table_rows</span> Vista Tabla
              </button>
            </div>
          </div>
        </div>

        <!-- TIRA DE MÉTRICAS. El contenido cambia por rol a propósito: al Encargado
             le importa el dinero; al Administrador, la demanda y la carga operativa. -->
        <div class="space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center gap-x-2.5 gap-y-0.5">
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-base text-primary shrink-0">insights</span>
              <h2 class="text-xs font-black text-on-surface uppercase tracking-wider">{{ metricsTitle() }}</h2>
            </div>
            <span class="text-[11px] text-outline">{{ metricsSubtitle() }}</span>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            @for (m of panelMetrics(); track m.label) {
              <app-kpi-card
                [label]="m.label"
                [value]="m.value"
                [unit]="m.unit || ''"
                [icon]="m.icon"
                [trend]="m.trend || ''"
                [trendIcon]="m.trendIcon || ''"
                [colorVariant]="m.colorVariant"
                [dense]="!!m.dense"
              />
            }
          </div>
        </div>

        <!-- BARRA DE FILTROS (se adapta segun la vista activa) -->
        <app-quote-filters-toolbar
          [viewMode]="viewMode()"
          [stateChips]="stateChips()"
          [stateFilter]="stateFilter()"
          [searchTerm]="searchTerm()"
          [sortMode]="sortMode()"
          [hideEmptyStates]="hideEmptyStates()"
          [resultCount]="getTableQuotes().length"
          [totalCount]="mockData.quotes().length"
          [activeFilterChips]="activeFilterChips()"
          [contextChips]="activeContextChips()"
          [contextActive]="activeContextValue()"
          [contextLabel]="activeContextLabel()"
          (stateFilterChange)="stateFilter.set($event)"
          (searchTermChange)="searchTerm.set($event)"
          (sortModeChange)="sortMode.set($event)"
          (hideEmptyStatesChange)="hideEmptyStates.set($event)"
          (contextFilterChange)="setActiveContextFilter($event)"
          (clearFilters)="clearAllFilters()"
          (removeFilter)="removeFilter($event)"
        />

        <!-- KANBAN BOARD VIEW -->
        @if (viewMode() === 'kanban') {
          <div class="space-y-6">
            @for (state of getFilteredStates(); track state) {
              <div class="p-4 sm:p-6 rounded-3xl bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 shadow-xl space-y-5">

                <!-- ENCABEZADO DE LA FASE -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                  <div class="flex items-center gap-3 min-w-0">
                    <span [class]="stateDotClass(state)" class="w-3.5 h-3.5 rounded-full shadow-sm shrink-0"></span>
                    <h3 class="text-sm font-extrabold text-on-surface flex items-center gap-2 min-w-0 flex-wrap">
                      <span [class]="getStateTextColor(state)" class="material-symbols-outlined text-base">{{ getStateIcon(state) }}</span>
                      {{ state }}
                      <span [class]="getStateBadgeIconBg(state)" class="text-xs font-bold px-3 py-0.5 rounded-full border shadow-sm">
                        @if (hasActiveContextFilter(state)) {
                          {{ getFilteredQuotesByState(state).length }} de {{ getQuotesByStateRaw(state).length }}
                        } @else {
                          {{ getFilteredQuotesByState(state).length }}
                        }
                      </span>
                    </h3>
                  </div>

                  <!-- Resumen propio de la fase: el monto solo se agrega donde ya es firme. -->
                  <span class="text-xs font-semibold text-outline shrink-0 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-outline">insights</span>
                    {{ getStateSummary(state) }}
                  </span>
                </div>

                <!-- FILTROS CONTEXTUALES DE LA FASE (se ocultan si el estado no tiene cotizaciones) -->
                @if (getQuotesByStateRaw(state).length > 0) {
                  <app-quote-state-filter-bar
                    class="-mt-1"
                    [chips]="getStateFilterChips(state)"
                    [active]="getActiveStateFilter(state)"
                    [label]="getStateFilterLabel(state)"
                    (select)="setStateContextFilter(state, $event)"
                  />
                }

                <!-- Quote Cards Grid -->
                @if (getFilteredQuotesByState(state).length > 0) {
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    @for (q of getFilteredQuotesByState(state); track q.id) {
                      <app-quote-kanban-card
                        [quote]="q"
                        [paymentBadgeClass]="getPaymentStatusBadgeClass(q.paymentStatus, q)"
                        [paymentLabel]="getPaymentStatusLabel(q)"
                        (open)="openDetailModal($event)"
                        (copyFolio)="copyFolio($event)"
                      />
                    }
                  </div>
                } @else if (hasActiveContextFilter(state) && getQuotesByStateRaw(state).length > 0) {
                  <div class="py-5 px-4 text-center bg-surface-container-high/40 rounded-2xl border border-dashed border-outline-variant/20 space-y-2">
                    <p class="text-xs text-outline font-medium italic">
                      Ninguna cotización de "{{ state }}" coincide con el filtro <strong class="text-on-surface not-italic">{{ getActiveContextFilterLabel(state) }}</strong>.
                    </p>
                    <button
                      (click)="setStateContextFilter(state, 'todas')"
                      class="px-3.5 py-1.5 min-h-9 rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary text-[11px] font-bold transition-all inline-flex items-center gap-1.5"
                    >
                      <span class="material-symbols-outlined text-xs">filter_alt_off</span> Quitar filtro
                    </button>
                  </div>
                } @else {
                  <div class="py-5 text-center text-xs text-outline font-medium italic bg-surface-container-high/40 rounded-2xl border border-dashed border-outline-variant/20">
                    Sin cotizaciones en el estado "{{ state }}"
                  </div>
                }

              </div>
            }
          </div>
        } @else {
          <!-- TABLE VIEW -->
          <app-table-shell [isEmpty]="getTableQuotes().length === 0" emptyIcon="search_off" emptyMessage="No se encontraron cotizaciones con los filtros seleccionados.">

            <table desktop-table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-outline-variant/30 text-[11px] font-bold text-outline uppercase tracking-wider">
                  <th class="pt-5 pb-3 px-3">Folio</th>
                  <th class="pt-5 pb-3 px-3">Cliente Contratante</th>
                  <th class="pt-5 pb-3 px-3">Talento Solicitado</th>
                  <th class="pt-5 pb-3 px-3">Fecha &amp; Recinto</th>
                  @if (roleService.canViewFinances()) {
                    <th class="pt-5 pb-3 px-3">Resumen Comercial</th>
                  } @else {
                    <th class="pt-5 pb-3 px-3">Logística Operativa</th>
                  }
                  <th class="pt-5 pb-3 px-3">Estado Pipeline</th>
                  <th class="pt-5 pb-3 px-3">Estatus de Pago</th>
                  <th class="pt-5 pb-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/20">
                @for (group of getTableGroups(); track group.key) {

                  <!-- ENCABEZADO DE GRUPO: da al listado plano la legibilidad por
                       estado que antes solo tenia el Kanban. -->
                  @if (group.state) {
                    <tr class="bg-surface-container-high/60">
                      <td colspan="8" class="py-2 px-3 border-l-4" [class]="stateBorderClass(group.state)">
                        <span class="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider" [class]="getStateTextColor(group.state)">
                          <span class="material-symbols-outlined text-base">{{ getStateIcon(group.state) }}</span>
                          {{ group.state }}
                          <span class="px-2 py-0.5 rounded-md bg-black/25 font-mono text-[10px] text-outline">{{ group.quotes.length }}</span>
                        </span>
                      </td>
                    </tr>
                  }

                  @for (q of group.quotes; track q.id) {
                  <tr class="hover:bg-surface-container-high/50 transition-colors border-l-4" [class]="stateBorderClass(q.state)">
                    <td class="py-3.5 px-3 font-bold text-primary whitespace-nowrap">{{ q.id }}</td>
                    <td class="py-3.5 px-3 font-semibold text-on-surface">
                      {{ q.clientName }}
                      <span class="text-[10px] text-outline block font-normal">{{ q.clientCompany }}</span>
                    </td>
                    <td class="py-3.5 px-3 text-on-surface font-bold whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-extrabold">
                        {{ q.groupName }}
                      </span>
                    </td>
                    <td class="py-3.5 px-3 text-outline text-xs">
                      {{ q.proposedDate }}
                      <span class="text-[10px] text-on-surface font-medium block">{{ q.venue }} ({{ q.city }})</span>
                    </td>
                    <td class="py-3.5 px-3 whitespace-nowrap">
                      @if (roleService.canViewFinances()) {
                        <span class="font-bold text-xs text-emerald-500 block">
                          {{ q.totalAmount ? ('$' + (q.totalAmount | number:'1.0-0') + ' MXN') : 'Por definir' }}
                        </span>
                        <span class="text-[10px] text-outline block font-medium mt-0.5">
                          {{ q.state === 'En revisión' || q.state === 'Propuesta enviada' ? 'Valor proyectado' : 'Valor de contrato' }}
                        </span>
                      } @else {
                        <span class="font-bold text-xs text-on-surface block">
                          {{ q.eventType || 'Evento' }} &middot; {{ q.durationHours || 3 }} hrs
                        </span>
                        <span class="text-[10px] text-outline block font-medium mt-0.5">
                          {{ q.soundOption === 'cliente' ? 'Audio Cliente' : 'Audio Disquera' }}
                          @if (q.scheduleMode) {
                            &middot; {{ q.scheduleMode === 'tandas' ? 'Tandas' : 'Continuo' }}
                          }
                        </span>
                      }
                    </td>
                    <td class="py-3.5 px-3 whitespace-nowrap">
                      <app-quote-state-badge [state]="q.state" />
                    </td>
                    <td class="py-3.5 px-3 whitespace-nowrap">
                      <span [class]="getPaymentStatusBadgeClass(q.paymentStatus, q)" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 inline-flex">
                        @if (q.state === 'Propuesta enviada' && (q.negotiationRound ?? 0) > 0) {
                          <span class="material-symbols-outlined text-xs text-amber-400">handshake</span>
                        }
                        {{ getPaymentStatusLabel(q) }}
                      </span>
                    </td>
                    <td class="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        (click)="openDetailModal(q)"
                        class="px-3 py-1.5 min-h-11 rounded-xl bg-primary/20 text-primary hover:bg-primary hover:text-on-primary font-bold text-xs transition-all flex items-center gap-1 ml-auto"
                      >
                        <span class="material-symbols-outlined text-sm">visibility</span> Abrir Solicitud
                      </button>
                    </td>
                  </tr>
                  }
                }
              </tbody>
            </table>

            <div mobile-cards>
              @for (group of getTableGroups(); track group.key) {

                @if (group.state) {
                  <div class="px-4 py-2 bg-surface-container-high/60 border-l-4" [class]="stateBorderClass(group.state)">
                    <span class="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider" [class]="getStateTextColor(group.state)">
                      <span class="material-symbols-outlined text-base">{{ getStateIcon(group.state) }}</span>
                      {{ group.state }}
                      <span class="px-2 py-0.5 rounded-md bg-black/25 font-mono text-[10px] text-outline">{{ group.quotes.length }}</span>
                    </span>
                  </div>
                }

                @for (q of group.quotes; track q.id) {
                <div class="p-4 space-y-3 border-l-4" [class]="stateBorderClass(q.state)">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <span class="font-bold text-primary text-sm">{{ q.id }}</span>
                    <app-quote-state-badge [state]="q.state" />
                  </div>

                  <div class="text-xs">
                    <p class="font-semibold text-on-surface">{{ q.clientName }} <span class="text-outline font-normal">— {{ q.clientCompany }}</span></p>
                    <p class="text-primary font-bold mt-1">{{ q.groupName }}</p>
                    <p class="text-outline mt-1">{{ q.proposedDate }} &middot; {{ q.venue }} ({{ q.city }})</p>
                  </div>

                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <div class="text-xs">
                      @if (roleService.canViewFinances()) {
                        <span class="font-bold text-emerald-500 block">
                          {{ q.totalAmount ? ('$' + (q.totalAmount | number:'1.0-0') + ' MXN') : 'Por definir' }}
                        </span>
                        <span class="text-[10px] text-outline block font-medium mt-0.5">
                          {{ q.state === 'En revisión' || q.state === 'Propuesta enviada' ? 'Valor proyectado' : 'Valor de contrato' }}
                        </span>
                      } @else {
                        <span class="font-bold text-on-surface block">{{ q.eventType || 'Evento' }} &middot; {{ q.durationHours || 3 }} hrs</span>
                        <span class="text-[10px] text-outline block font-medium mt-0.5">
                          {{ q.soundOption === 'cliente' ? 'Audio Cliente' : 'Audio Disquera' }}
                          @if (q.scheduleMode) {
                            &middot; {{ q.scheduleMode === 'tandas' ? 'Tandas' : 'Continuo' }}
                          }
                        </span>
                      }
                    </div>
                    <span [class]="getPaymentStatusBadgeClass(q.paymentStatus, q)" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1">
                      {{ getPaymentStatusLabel(q) }}
                    </span>
                  </div>

                  <button
                    (click)="openDetailModal(q)"
                    class="w-full py-2.5 min-h-11 rounded-xl bg-primary/20 text-primary hover:bg-primary hover:text-on-primary font-bold text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <span class="material-symbols-outlined text-sm">visibility</span> Abrir Solicitud
                  </button>
                </div>
                }
              }
            </div>

          </app-table-shell>
        }

      }

    </div>
  `
})
export class QuotesComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);
  layoutState = inject(LayoutStateService);

  viewMode = signal<'kanban' | 'table'>('kanban');
  selectedQuote = signal<Quote | null>(null);

  modalTab = signal<'estado_actual' | 'solicitud' | 'cobranza' | 'contrato'>('estado_actual');

  searchTerm = signal('');
  stateFilter = signal('Todos');
  /** Filtro contextual activo por estado ({ 'Finalizada': 'atrasada', ... }). Default: 'todas'. */
  stateContextFilter = signal<Record<string, string>>({});
  /** Orden de la Vista Tabla. El Kanban no lo necesita: ya ordena por columna. */
  sortMode = signal<QuoteSortMode>('estado');
  /** Colapsa las columnas del Kanban sin cotizaciones. */
  hideEmptyStates = signal(false);
  /** Filtro transversal activo cuando la Tabla muestra todos los estados juntos. */
  transversalFilter = signal('todas');

  proposalSoundOption = signal<'cliente' | 'proveedor'>('proveedor');
  proposalSoundCost = signal<number>(15000);
  proposalViaticosCost = signal<number>(8500);
  proposalArtistFee = signal<number>(35000);
  proposalIncludeIva = signal<boolean>(false);

  getProposalSubtotal(): number {
    const sound = this.proposalSoundOption() === 'proveedor' ? (Number(this.proposalSoundCost()) || 0) : 0;
    const viaticos = Number(this.proposalViaticosCost()) || 0;
    const fee = Number(this.proposalArtistFee()) || 0;
    return fee + sound + viaticos;
  }

  getProposalIva(): number {
    return this.proposalIncludeIva() ? this.getProposalSubtotal() * 0.16 : 0;
  }

  getProposalTotal(): number {
    return this.getProposalSubtotal() + this.getProposalIva();
  }

  approveAndSendProposal(): void {
    const current = this.selectedQuote();
    if (!current) return;
    const total = this.getProposalTotal();
    const updates: Partial<Quote> = {
      totalAmount: total,
      state: 'Propuesta enviada',
      soundOption: this.proposalSoundOption(),
      soundCost: this.proposalSoundOption() === 'proveedor' ? (Number(this.proposalSoundCost()) || 0) : 0,
      viaticosCost: Number(this.proposalViaticosCost()) || 0,
      artistFee: Number(this.proposalArtistFee()) || 0,
      includeIva: this.proposalIncludeIva()
    };
    this.mockData.updateQuoteDetails(current.id, updates);
    this.selectedQuote.set({ ...current, ...updates });
  }

  constructor() {
    // When modal opens → hide header/sidebar via fullScreenModalActive (already wired in main-layout)
    effect(() => {
      const active = this.selectedQuote();
      this.layoutState.fullScreenModalActive.set(!!active);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = active ? 'hidden' : '';
      }
    });
  }

  /** Orden de estados del tablero. Fuente única: `core/models/quote-state.meta.ts`. */
  readonly allStates: readonly QuoteState[] = QUOTE_ALL_STATES;

  getStateIcon(state: QuoteState): string {
    return quoteStateMeta(state).icon;
  }

  getStatePhaseTitle(state: QuoteState): string {
    return quoteStateMeta(state).phaseTitle;
  }

  getStateModalBorderClass(state: QuoteState): string {
    return quoteStateMeta(state).modalBorderClass;
  }

  getStateBadgeIconBg(state: QuoteState): string {
    return quoteStateMeta(state).badgeClass;
  }

  getStateTextColor(state: QuoteState): string {
    return quoteStateMeta(state).textColor;
  }

  getStateActionDescription(state: QuoteState): string {
    return quoteStateMeta(state).actionDescription;
  }

  getFilteredQuotes(): Quote[] {
    return this.mockData.quotes().filter(q => {
      const matchSearch = !this.searchTerm() ||
        q.id.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        q.clientName.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        q.clientCompany.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        q.groupName.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        q.city.toLowerCase().includes(this.searchTerm().toLowerCase());

      const matchState = this.stateFilter() === 'Todos' || q.state === this.stateFilter();

      return matchSearch && matchState;
    });
  }

  getFilteredStates(): QuoteState[] {
    if (this.stateFilter() !== 'Todos') {
      return [this.stateFilter() as QuoteState];
    }
    if (this.hideEmptyStates()) {
      return this.allStates.filter(st => this.getQuotesByStateRaw(st).length > 0);
    }
    return [...this.allStates];
  }

  /** Estados con su conteo, para la rejilla de la barra de filtros. */
  stateChips(): QuoteStateChip[] {
    return this.allStates.map(state => ({
      state,
      count: this.mockData.quotes().filter(q => q.state === state).length
    }));
  }

  /** Cotizaciones de un estado con su filtro contextual aplicado (vista Kanban). */
  getFilteredQuotesByState(state: QuoteState): Quote[] {
    return this.applyContextFilter(this.getQuotesByStateRaw(state), state);
  }

  /** Cotizaciones de un estado SIN filtro contextual (base para calcular los conteos de cada chip). */
  getQuotesByStateRaw(state: QuoteState): Quote[] {
    return this.getFilteredQuotes().filter(q => q.state === state);
  }

  /**
   * Lista que alimenta la Vista Tabla. Cuando hay un estado seleccionado aplica
   * el filtro contextual de esa fase; cuando se ven todos juntos, aplica el
   * filtro transversal, que es el que tiene sentido sobre una lista plana.
   */
  getTableQuotes(): Quote[] {
    const list = this.getFilteredQuotes();
    if (this.stateFilter() === 'Todos') {
      return this.applyTransversalFilter(list);
    }
    return this.applyContextFilter(list, this.stateFilter() as QuoteState);
  }

  /**
   * Agrupa las filas de la tabla por estado cuando se ordena por etapa, para
   * darle al listado plano la legibilidad que antes solo tenía el Kanban.
   * Con cualquier otro orden devuelve un único grupo sin encabezado.
   */
  getTableGroups(): { key: string; state: QuoteState | null; quotes: Quote[] }[] {
    const list = this.getSortedTableQuotes();
    if (this.sortMode() !== 'estado') {
      return [{ key: 'all', state: null, quotes: list }];
    }
    return this.allStates
      .map(state => ({ key: state, state, quotes: list.filter(q => q.state === state) }))
      .filter(g => g.quotes.length > 0);
  }

  private getSortedTableQuotes(): Quote[] {
    const list = [...this.getTableQuotes()];
    switch (this.sortMode()) {
      case 'fecha':
        return list.sort((a, b) => a.proposedDate.localeCompare(b.proposedDate));
      case 'monto':
        return list.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
      case 'cliente':
        return list.sort((a, b) => a.clientName.localeCompare(b.clientName, 'es'));
      default:
        return list.sort((a, b) => this.getStateIndex(a.state) - this.getStateIndex(b.state));
    }
  }

  /** Color del borde izquierdo de cada fila/tarjeta, según el estado. */
  stateBorderClass(state: QuoteState): string {
    return quoteStateMeta(state).borderLeftClass;
  }

  private applyContextFilter(list: Quote[], state: QuoteState): Quote[] {
    const active = this.getActiveStateFilter(state);
    if (active === 'todas') return list;
    const option = this.getStateFilterOptions(state).find(o => o.value === active);
    return option ? list.filter(q => option.match(q)) : list;
  }

  private applyTransversalFilter(list: Quote[]): Quote[] {
    const active = this.transversalFilter();
    if (active === 'todas') return list;
    const option = transversalFilterOptions().find(o => o.value === active);
    return option ? list.filter(q => option.match(q)) : list;
  }

  // --- Puente entre la barra de filtros y los dos juegos de chips ---

  /** True cuando la Tabla muestra todos los estados y por lo tanto usa los transversales. */
  private usesTransversalFilters(): boolean {
    return this.stateFilter() === 'Todos';
  }

  activeContextChips(): StateFilterChip[] {
    if (this.usesTransversalFilters()) {
      const base = this.getFilteredQuotes();
      return transversalFilterOptions().map(o => ({
        value: o.value,
        label: o.label,
        icon: o.icon,
        activeClass: o.activeClass,
        count: base.filter(q => o.match(q)).length
      }));
    }
    return this.getStateFilterChips(this.selectedState());
  }

  activeContextValue(): string {
    return this.usesTransversalFilters()
      ? this.transversalFilter()
      : this.getActiveStateFilter(this.selectedState());
  }

  activeContextLabel(): string {
    return this.usesTransversalFilters()
      ? TRANSVERSAL_FILTER_LABEL
      : this.getStateFilterLabel(this.selectedState());
  }

  setActiveContextFilter(value: string): void {
    if (this.usesTransversalFilters()) {
      this.transversalFilter.set(value);
    } else {
      this.setStateContextFilter(this.selectedState(), value);
    }
  }

  /**
   * Filtros aplicados, como chips removibles. Se muestran incluso con el panel
   * colapsado para que nunca se filtre la lista sin que se note.
   */
  activeFilterChips(): ActiveFilterChip[] {
    const chips: ActiveFilterChip[] = [];

    if (this.searchTerm()) {
      chips.push({ key: 'search', label: '"' + this.searchTerm() + '"', icon: 'search' });
    }

    if (this.stateFilter() !== 'Todos') {
      chips.push({ key: 'state', label: this.stateFilter(), icon: quoteStateMeta(this.selectedState()).icon });
    }

    const context = this.activeContextValue();
    if (context !== 'todas') {
      const label = this.activeContextChips().find(c => c.value === context)?.label;
      if (label) chips.push({ key: 'context', label, icon: 'filter_alt' });
    }

    return chips;
  }

  /** Quita un solo filtro desde su chip, sin borrar los demás. */
  removeFilter(key: ActiveFilterChip['key']): void {
    switch (key) {
      case 'search':
        this.searchTerm.set('');
        break;
      case 'state':
        this.stateFilter.set('Todos');
        break;
      case 'context':
        this.setActiveContextFilter('todas');
        break;
    }
  }

  clearAllFilters(): void {
    this.searchTerm.set('');
    this.stateFilter.set('Todos');
    this.transversalFilter.set('todas');
    this.stateContextFilter.set({});
  }

  // --- Filtros contextuales por estado ---

  /** Estado actualmente seleccionado en las píldoras (solo válido cuando no es 'Todos'). */
  selectedState(): QuoteState {
    return this.stateFilter() as QuoteState;
  }

  getActiveStateFilter(state: QuoteState): string {
    return this.stateContextFilter()[state] ?? 'todas';
  }

  setStateContextFilter(state: QuoteState, value: string): void {
    this.stateContextFilter.update(map => ({ ...map, [state]: value }));
  }

  /** True si el estado tiene un filtro distinto de "Todas" activo (para avisar en el estado vacío). */
  hasActiveContextFilter(state: QuoteState): boolean {
    return this.getActiveStateFilter(state) !== 'todas';
  }

  /** Etiqueta legible del filtro contextual activo, usada en los mensajes de estado vacío. */
  getActiveContextFilterLabel(state: QuoteState): string {
    const active = this.getActiveStateFilter(state);
    return this.getStateFilterOptions(state).find(o => o.value === active)?.label ?? '';
  }

  /** Título de la barra de filtros, nombrando la dimensión que se filtra en esa fase. */
  getStateFilterLabel(state: QuoteState): string {
    return stateFilterLabel(state);
  }

  /** Opciones + conteos ya resueltos para renderizar la barra de filtros de un estado. */
  getStateFilterChips(state: QuoteState): StateFilterChip[] {
    const base = this.getQuotesByStateRaw(state);
    return this.getStateFilterOptions(state).map(o => ({
      value: o.value,
      label: o.label,
      icon: o.icon,
      activeClass: o.activeClass,
      count: base.filter(q => o.match(q)).length
    }));
  }

  /** Definiciones de filtros por fase. Viven en `quote-filter-catalog.ts`. */
  getStateFilterOptions(state: QuoteState): QuoteFilterOption[] {
    return stateFilterOptions(state);
  }

  getStateIndex(state: QuoteState): number {
    return this.allStates.indexOf(state);
  }

  /**
   * Resumen del encabezado de la columna. Reemplaza al antiguo "Subtotal del
   * Estado", que solo tenía sentido en las fases donde el monto ya es firme.
   */
  getStateSummary(state: QuoteState): string {
    return stateSummary(state, this.getFilteredQuotesByState(state), this.roleService.canViewFinances());
  }

  /** Punto de color del encabezado, del mismo color de la fase. */
  stateDotClass(state: QuoteState): string {
    return quoteStateMeta(state).badgeClass;
  }

  // --- Tira de métricas del panel (distinta por rol) ---

  /** Métricas ya resueltas para el rol activo. */
  panelMetrics(): PanelMetric[] {
    return resolvePanelMetrics(this.mockData.quotes(), this.roleService.canViewFinances());
  }

  metricsTitle(): string {
    return this.roleService.canViewFinances()
      ? 'Inteligencia Comercial & Facturación'
      : 'Demanda de Talento & Carga Operativa';
  }

  metricsSubtitle(): string {
    return this.roleService.canViewFinances()
      ? 'Valor del pipeline y quién sostiene la facturación'
      : 'Qué talento piden más, quién repite y dónde hay tracción';
  }

  updatePaymentStatus(newStatus: PaymentStatus): void {
    const current = this.selectedQuote();
    if (current) {
      this.mockData.updateQuotePaymentStatus(current.id, newStatus);
      this.selectedQuote.set({ ...current, paymentStatus: newStatus });
    }
  }

  getPaymentStatusLabel(q: Quote): string {
    if (q.state === 'Propuesta enviada' && (q.negotiationRound ?? 0) > 0) {
      return `Negociación Pendiente (Ronda #${q.negotiationRound})`;
    }
    return q.paymentStatus;
  }

  getPaymentStatusBadgeClass(status: PaymentStatus, q?: Quote): string {
    if (q && q.state === 'Propuesta enviada' && (q.negotiationRound ?? 0) > 0) {
      return 'bg-amber-500/25 text-amber-300 border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.25)] font-black';
    }
    switch (status) {
      case 'Pago Confirmado 100%': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-sm';
      case 'Anticipo 50%': return 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-sm';
      case 'Pendiente': return 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-sm';
      default: return 'bg-surface-bright text-outline';
    }
  }

  copyFolio(folioId: string): void {
    navigator.clipboard?.writeText(folioId);
    alert('Folio ' + folioId + ' copiado al portapapeles.');
  }

  openDetailModal(q: Quote): void {
    this.layoutState.openQuoteModal(q);
  }

  contactWhatsApp(): void {
    const q = this.selectedQuote();
    const phone = q?.representativePhone || '+528112345678';
    const text = encodeURIComponent(`Hola ${q?.representativeName || 'Ing. Luis Donaldo'}, me interesa la cotización ${q?.id} para el grupo ${q?.groupName}.`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  }

  downloadMockPdf(): void {
    const id = this.selectedQuote()?.id || 'COT-000';
    alert('Simulación de Descarga: Se generó el archivo contrato_' + id + '.pdf correctamente en tu equipo.');
  }
}
