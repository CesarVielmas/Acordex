import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { EventItem, EventState } from '../../core/models/event.models';
import { EVENT_ALL_STATES, eventStateMeta } from '../../core/models/event-state.meta';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';
import { FormFieldComponent, FormFieldOption } from '../../shared/ui/form-field/form-field.component';
import { KpiCardComponent } from '../../shared/ui/kpi-card/kpi-card.component';
import { EventCardComponent } from './components/event-card.component';
import { EventDetailModalComponent } from './components/event-detail-modal.component';
import { EventStateFilterBarComponent, EventFilterChip } from './components/event-state-filter-bar.component';
import {
  EventFiltersToolbarComponent,
  EventStateChip,
  ActiveEventFilterChip
} from './components/event-filters-toolbar.component';
import { stateSummary } from './event-card-insights';
import { PanelMetric, panelMetrics as resolvePanelMetrics } from './event-panel-metrics';
import {
  EventFilterOption,
  stateFilterLabel,
  stateFilterOptions
} from './event-filter-catalog';
import { daysUntilEvent, grossTicketRevenue, occupancyPercent, soldSeats } from './event-metrics';

/**
 * Gestor de eventos (Tablero por fase).
 *
 * El evento se mueve por siete fases (`event-state.meta.ts`) y cada una
 * bloquea más que la anterior. Esta pantalla agrupa los eventos por fase en un
 * Tablero, con su resumen y los filtros propios de cada una para trabajar el flujo.
 *
 * El rol Usuario de campo solo ve los eventos que ya son públicos: un borrador
 * con costos de grupos no es información suya.
 */
@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalShellComponent,
    FormFieldComponent,
    KpiCardComponent,
    EventCardComponent,
    EventDetailModalComponent,
    EventFiltersToolbarComponent,
    EventStateFilterBarComponent
  ],
  template: `
    <div class="space-y-6 animate-fade-in pb-12">

      <!-- ─── ENCABEZADO ─── -->
      <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-surface-container-high/90 via-surface-container/80 to-surface-container-high/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-inner shrink-0">
              <span class="material-symbols-outlined text-2xl">festival</span>
            </div>
            <div class="min-w-0">
              <h1 class="font-display-xl text-xl sm:text-2xl lg:text-3xl font-black text-on-surface tracking-tight">
                Gestor de Eventos
              </h1>
              <p class="text-xs text-outline mt-0.5">
                Creación, aprobación entre encargados, publicación y cierre de eventos con venta de boletos al público
                · {{ allStates.length }} fases del ciclo
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 self-start md:self-auto relative z-10 flex-wrap">
          @if (roleService.canEditEvents()) {
            <button
              type="button"
              (click)="openCreateModal()"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-lg">add_circle</span> Crear Evento
            </button>
          }
        </div>
      </div>

      <!-- ─── MÉTRICAS (cambian por rol a propósito) ─── -->
      @if (roleService.isAdminOrEncargado()) {
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
      }

      <!-- ─── FILTROS ─── -->
      <app-event-filters-toolbar
        [stateChips]="stateChips()"
        [stateFilter]="stateFilter()"
        [searchTerm]="searchTerm()"
        [hideEmptyStates]="hideEmptyStates()"
        [resultCount]="displayedEventsCount()"
        [totalCount]="visibleEvents().length"
        [activeFilterChips]="activeFilterChips()"
        (stateFilterChange)="stateFilter.set($event)"
        (searchTermChange)="searchTerm.set($event)"
        (hideEmptyStatesChange)="hideEmptyStates.set($event)"
        (clearFilters)="clearAllFilters()"
        (removeFilter)="removeFilter($event)"
      />

      <!-- ─── TABLERO POR FASE ─── -->
      <div class="space-y-6">
        @for (state of filteredStates(); track state) {
          <section class="p-4 sm:p-6 rounded-3xl bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 shadow-xl space-y-5">

            <!-- Encabezado de la fase -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
              <div class="flex items-center gap-3 min-w-0">
                <span [class]="stateBadgeClass(state)" class="w-3.5 h-3.5 rounded-full shadow-sm shrink-0 border"></span>
                <div class="min-w-0">
                  <h3 class="text-sm font-extrabold text-on-surface flex items-center gap-2 min-w-0 flex-wrap">
                    <span [class]="stateTextColor(state)" class="material-symbols-outlined text-base">{{ stateIcon(state) }}</span>
                    {{ state }}
                    <span [class]="stateBadgeClass(state)" class="text-xs font-bold px-3 py-0.5 rounded-full border shadow-sm">
                      @if (hasActiveContextFilter(state)) {
                        {{ eventsByState(state).length }} de {{ rawEventsByState(state).length }}
                      } @else {
                        {{ eventsByState(state).length }}
                      }
                    </span>
                  </h3>
                  <p class="text-[11px] text-outline mt-0.5 line-clamp-1">{{ stateMeaning(state) }}</p>
                </div>
              </div>

              <span class="text-xs font-semibold text-outline shrink-0 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">insights</span>
                {{ stateSummaryLabel(state) }}
              </span>
            </div>

            <!-- Filtros contextuales de la fase -->
            @if (rawEventsByState(state).length > 0) {
              <app-event-state-filter-bar
                class="-mt-1"
                [chips]="stateFilterChips(state)"
                [active]="activeStateFilter(state)"
                [label]="stateFilterBarLabel(state)"
                (select)="setStateContextFilter(state, $event)"
              />
            }

            <!-- Tarjetas -->
            @if (eventsByState(state).length > 0) {
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
                @for (evt of eventsByState(state); track evt.id) {
                  <app-event-card
                    [event]="evt"
                    (open)="openDetail($event)"
                    (uploadEvidence)="openUploadModal($event)"
                    (submitReview)="submitForReview($event)"
                  />
                }
              </div>
            } @else if (hasActiveContextFilter(state)) {
              <div class="py-5 px-4 text-center bg-surface-container-high/40 rounded-2xl border border-dashed border-outline-variant/20 space-y-2">
                <p class="text-xs text-outline font-medium italic">
                  Ningún evento de "{{ state }}" coincide con el filtro
                  <strong class="text-on-surface not-italic">{{ activeContextFilterLabel(state) }}</strong>.
                </p>
                <button
                  type="button"
                  (click)="setStateContextFilter(state, 'todas')"
                  class="px-3.5 py-1.5 min-h-9 rounded-xl bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary text-[11px] font-bold transition-all inline-flex items-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-xs">filter_alt_off</span> Quitar filtro
                </button>
              </div>
            } @else {
              <p class="py-5 text-center text-xs text-outline font-medium italic bg-surface-container-high/40 rounded-2xl border border-dashed border-outline-variant/20">
                Sin eventos en la fase "{{ state }}"
              </p>
            }
          </section>
        }
      </div>

      <!-- ─── EXPEDIENTE DEL EVENTO ─── -->
      @if (selectedEvent()) {
        <app-event-detail-modal
          [event]="selectedEvent()"
          [availableGroups]="mockData.groups()"
          (closed)="selectedEvent.set(null)"
          (uploadEvidence)="openUploadModal($event)"
          (submitReview)="submitForReview($event)"
          (approve)="respondApproval($event.event, $event.approvalId, true)"
          (reject)="respondApproval($event.event, $event.approvalId, false, $event.reason)"
          (publish)="publish($event.event, $event.scheduledAt)"
          (cancel)="cancelEvent($event.event, $event.reason)"
          (seal)="sealEvent($event)"
          (patch)="applyPatch($event)"
        />
      }

      <!-- ─── ALTA DE EVENTO ─── -->
      @if (isCreating()) {
        <app-modal-shell
          title="Crear Nuevo Evento"
          subtitle="Solo lo mínimo para identificarlo: el resto se captura en el expediente"
          icon="add_circle"
          size="lg"
          [hasFooter]="true"
          (closed)="isCreating.set(false)"
        >
          <div class="space-y-3.5">
            <div class="p-3 rounded-xl bg-primary/10 border border-primary/25 text-[11px] text-on-surface-variant">
              El evento nace en <strong class="text-primary">Borrador</strong>: podrás agregar el cartel, el equipo de
              sonido, los horarios y el boletaje antes de enviarlo a la revisión de los encargados involucrados.
            </div>

            <app-form-field label="Nombre del Evento" [(value)]="createForm.title" placeholder="Ej. Gran Baile del Recuerdo" />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <app-form-field label="Fecha del Evento" type="date" [(value)]="createForm.date" />
              <app-form-field label="Aforo Estimado del Recinto" type="number" [(value)]="createForm.capacity" placeholder="Ej. 8000" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <app-form-field label="Recinto" [(value)]="createForm.venue" placeholder="Ej. Arena Monterrey" />
              <app-form-field label="Ciudad y Estado" [(value)]="createForm.location" placeholder="Ej. Monterrey, NL" />
            </div>
            <app-form-field label="Dirección del Recinto" [(value)]="createForm.venueAddress" placeholder="Calle, número, colonia" />
            <app-form-field label="Descripción Pública" type="textarea" [(value)]="createForm.description" placeholder="Lo que leerá el público en la cartelera" />
            <app-form-field label="Imagen de Cartelera (URL)" [(value)]="createForm.flyerUrl" placeholder="https://..." />
            <app-form-field label="¿Es Co-producción?" type="select" [(value)]="createForm.isCoProduction" [options]="yesNoOptions" />
            @if (createForm.isCoProduction === 'si') {
              <app-form-field label="Disquera Socia" [(value)]="createForm.coProductionPartner" placeholder="Nombre de la disquera co-productora" />
            }
          </div>

          <ng-container modal-footer>
            <button
              type="button"
              (click)="isCreating.set(false)"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold"
            >Cancelar</button>
            <button
              type="button"
              (click)="createEvent()"
              [disabled]="!canCreate()"
              class="px-5 py-2.5 min-h-11 rounded-xl bg-primary text-on-primary text-xs font-black disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-sm">save</span> Crear Borrador
            </button>
          </ng-container>
        </app-modal-shell>
      }

      <!-- ─── CARGA DE EVIDENCIA ─── -->
      @if (uploadTarget(); as target) {
        <app-modal-shell
          title="Subir Evidencia de Campo"
          [subtitle]="target.title"
          icon="add_a_photo"
          size="md"
          [hasFooter]="true"
          (closed)="uploadTarget.set(null)"
        >
          <div class="space-y-3.5">
            <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs">
              Carga de fotos y videos del montaje, la prueba de sonido o el show. No modifica precios, horarios ni boletaje.
            </div>

            <app-form-field label="Tipo de Archivo" type="select" [(value)]="uploadForm.type" [options]="uploadTypeOptions" />
            <app-form-field label="Momento del Evento" type="select" [(value)]="uploadForm.stage" [options]="stageOptions" />
            <app-form-field label="Descripción / Pie de Foto" [(value)]="uploadForm.caption" placeholder="Ej. Prueba de sonido escenario principal" />
            <app-form-field label="URL del Archivo" [(value)]="uploadForm.url" placeholder="https://..." />
          </div>

          <ng-container modal-footer>
            <button
              type="button"
              (click)="uploadTarget.set(null)"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold"
            >Cancelar</button>
            <button
              type="button"
              (click)="saveEvidence()"
              [disabled]="!uploadForm.caption.trim()"
              class="px-5 py-2.5 min-h-11 rounded-xl bg-emerald-500 text-black text-xs font-bold disabled:opacity-40 disabled:pointer-events-none"
            >Subir Evidencia</button>
          </ng-container>
        </app-modal-shell>
      }
  `
})
export class EventsComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  readonly allStates: readonly EventState[] = EVENT_ALL_STATES;

  searchTerm = signal('');
  stateFilter = signal('Todos');
  hideEmptyStates = signal(false);
  /** Filtro contextual activo por fase ({ 'En Venta': 'venta_lenta', ... }). */
  stateContextFilter = signal<Record<string, string>>({});

  selectedEvent = signal<EventItem | null>(null);
  uploadTarget = signal<EventItem | null>(null);
  isCreating = signal(false);

  readonly uploadTypeOptions: FormFieldOption[] = [
    { label: 'Fotografía (JPG/PNG)', value: 'photo' },
    { label: 'Video Corto (MP4)', value: 'video' }
  ];

  readonly stageOptions: FormFieldOption[] = [
    { label: 'Montaje', value: 'Montaje' },
    { label: 'Prueba de Sonido', value: 'Prueba de Sonido' },
    { label: 'Show', value: 'Show' },
    { label: 'Desmontaje', value: 'Desmontaje' },
    { label: 'Otro', value: 'Otro' }
  ];

  readonly yesNoOptions: FormFieldOption[] = [
    { label: 'No', value: 'no' },
    { label: 'Sí', value: 'si' }
  ];

  uploadForm = { type: 'photo', stage: 'Montaje', caption: '', url: '' };

  createForm = {
    title: '',
    date: '',
    venue: '',
    location: '',
    venueAddress: '',
    description: '',
    flyerUrl: '',
    capacity: '' as string | number,
    isCoProduction: 'no',
    coProductionPartner: ''
  };

  // ─── Datos visibles según el rol ──────────────────────────────────────────

  /**
   * El Usuario de campo solo ve eventos ya públicos. Un borrador trae costos
   * de grupos y acuerdos entre encargados que no le corresponden.
   */
  visibleEvents = computed<EventItem[]>(() => {
    const list = this.mockData.events();
    if (!this.roleService.isUsuarioOnly()) return list;
    return list.filter(e => e.state === 'Publicado' || e.state === 'En Venta' || e.state === 'Finalizada');
  });

  /** Búsqueda + fase, sin los filtros contextuales. */
  private searchedEvents = computed<EventItem[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const state = this.stateFilter();

    return this.visibleEvents().filter(e => {
      const matchState = state === 'Todos' || e.state === state;
      if (!matchState) return false;
      if (!term) return true;

      return e.id.toLowerCase().includes(term)
        || e.title.toLowerCase().includes(term)
        || e.venue.toLowerCase().includes(term)
        || e.location.toLowerCase().includes(term)
        || e.groupName.toLowerCase().includes(term)
        || (e.lineup || []).some(s => s.groupName.toLowerCase().includes(term));
    });
  });

  // ─── Tablero ──────────────────────────────────────────────────────────────

  filteredStates = computed<EventState[]>(() => {
    if (this.stateFilter() !== 'Todos') return [this.stateFilter() as EventState];
    if (this.hideEmptyStates()) return this.allStates.filter(st => this.rawEventsByState(st).length > 0);
    return [...this.allStates];
  });

  stateChips = computed<EventStateChip[]>(() =>
    this.allStates.map(state => ({
      state,
      count: this.visibleEvents().filter(e => e.state === state).length
    }))
  );

  /** Cantidad total de eventos mostrados actualmente en el tablero. */
  displayedEventsCount = computed<number>(() => {
    return this.filteredStates().reduce((sum, state) => sum + this.eventsByState(state).length, 0);
  });

  /** Eventos de una fase sin su filtro contextual (base de los conteos). */
  rawEventsByState(state: EventState): EventItem[] {
    return this.searchedEvents().filter(e => e.state === state);
  }

  /** Eventos de una fase con su filtro contextual aplicado. */
  eventsByState(state: EventState): EventItem[] {
    return this.applyContextFilter(this.rawEventsByState(state), state);
  }

  // ─── Filtros contextuales ─────────────────────────────────────────────────

  private applyContextFilter(list: EventItem[], state: EventState): EventItem[] {
    const active = this.activeStateFilter(state);
    if (active === 'todas') return list;
    const option = this.stateOptions(state).find(o => o.value === active);
    return option ? list.filter(e => option.match(e)) : list;
  }

  private stateOptions(state: EventState): EventFilterOption[] {
    return stateFilterOptions(state);
  }

  activeStateFilter(state: EventState): string {
    return this.stateContextFilter()[state] ?? 'todas';
  }

  setStateContextFilter(state: EventState, value: string): void {
    this.stateContextFilter.update(map => ({ ...map, [state]: value }));
  }

  hasActiveContextFilter(state: EventState): boolean {
    return this.activeStateFilter(state) !== 'todas';
  }

  activeContextFilterLabel(state: EventState): string {
    const active = this.activeStateFilter(state);
    return this.stateOptions(state).find(o => o.value === active)?.label ?? '';
  }

  stateFilterBarLabel(state: EventState): string {
    return stateFilterLabel(state);
  }

  stateFilterChips(state: EventState): EventFilterChip[] {
    const base = this.rawEventsByState(state);
    return this.stateOptions(state).map(o => ({
      value: o.value,
      label: o.label,
      icon: o.icon,
      activeClass: o.activeClass,
      count: base.filter(e => o.match(e)).length
    }));
  }

  activeFilterChips(): ActiveEventFilterChip[] {
    const chips: ActiveEventFilterChip[] = [];

    if (this.searchTerm()) {
      chips.push({ key: 'search', label: '"' + this.searchTerm() + '"', icon: 'search' });
    }

    if (this.stateFilter() !== 'Todos') {
      chips.push({
        key: 'state',
        label: this.stateFilter(),
        icon: eventStateMeta(this.stateFilter() as EventState).icon
      });
    }

    return chips;
  }

  removeFilter(key: ActiveEventFilterChip['key']): void {
    switch (key) {
      case 'search': this.searchTerm.set(''); break;
      case 'state': this.stateFilter.set('Todos'); break;
    }
  }

  clearAllFilters(): void {
    this.searchTerm.set('');
    this.stateFilter.set('Todos');
    this.stateContextFilter.set({});
  }


  // ─── Presentación de la fase ──────────────────────────────────────────────

  stateIcon(state: EventState): string {
    return eventStateMeta(state).icon;
  }

  stateTextColor(state: EventState): string {
    return eventStateMeta(state).textColor;
  }

  stateBadgeClass(state: EventState): string {
    return eventStateMeta(state).badgeClass;
  }

  stateMeaning(state: EventState): string {
    return eventStateMeta(state).meaning;
  }

  stateSummaryLabel(state: EventState): string {
    return stateSummary(state, this.eventsByState(state), this.roleService.canViewFinances());
  }

  // ─── Métricas ─────────────────────────────────────────────────────────────

  panelMetrics(): PanelMetric[] {
    return resolvePanelMetrics(this.visibleEvents(), this.roleService.canViewFinances());
  }

  metricsTitle(): string {
    return this.roleService.canViewFinances()
      ? 'Taquilla & Compromisos de Producción'
      : 'Operación de Eventos & Aprobaciones';
  }

  metricsSubtitle(): string {
    return this.roleService.canViewFinances()
      ? 'Cuánto se ha cobrado, cuánto falta por vender y qué está comprometido con los grupos'
      : 'Qué está esperando aprobación, qué está por publicarse y cómo va el aforo';
  }

  // ─── Acciones ─────────────────────────────────────────────────────────────

  openDetail(evt: EventItem): void {
    this.selectedEvent.set(evt);
  }

  /** Vuelve a leer el evento del store para que el modal abierto no se quede con datos viejos. */
  private refreshSelected(eventId: string): void {
    if (this.selectedEvent()?.id !== eventId) return;
    const fresh = this.mockData.events().find(e => e.id === eventId) || null;
    this.selectedEvent.set(fresh);
  }

  submitForReview(evt: EventItem): void {
    this.mockData.submitEventForReview(evt.id);
    this.refreshSelected(evt.id);
  }

  respondApproval(evt: EventItem, approvalId: string, approve: boolean, reason?: string): void {
    this.mockData.respondEventApproval(evt.id, approvalId, approve, reason);
    this.refreshSelected(evt.id);
  }

  publish(evt: EventItem, scheduledAt?: string): void {
    this.mockData.publishEvent(evt.id, scheduledAt);
    this.refreshSelected(evt.id);
  }

  /**
   * Guarda una edición del expediente. Cada pestaña arma el objeto ya
   * modificado y lo manda entero, en vez de que el servicio tenga un método
   * por campo: así agregar un dato nuevo al evento no obliga a tocar el store.
   */
  applyPatch(changes: Partial<EventItem>): void {
    const current = this.selectedEvent();
    if (!current) return;
    this.mockData.updateEventDetails(current.id, changes);
    this.refreshSelected(current.id);
  }

  cancelEvent(evt: EventItem, reason: string): void {
    // Los boletos ya vendidos son exactamente los que hay que reembolsar.
    this.mockData.cancelEvent(evt.id, reason, soldSeats(evt), grossTicketRevenue(evt));
    this.refreshSelected(evt.id);
  }

  sealEvent(evt: EventItem): void {
    this.mockData.sealEventClosure(evt.id);
    this.refreshSelected(evt.id);
  }

  openCreateModal(): void {
    this.createForm = {
      title: '',
      date: '',
      venue: '',
      location: '',
      venueAddress: '',
      description: '',
      flyerUrl: '',
      capacity: '',
      isCoProduction: 'no',
      coProductionPartner: ''
    };
    this.isCreating.set(true);
  }

  canCreate(): boolean {
    const f = this.createForm;
    return !!f.title.trim() && !!f.date && !!f.venue.trim() && !!f.location.trim();
  }

  createEvent(): void {
    if (!this.canCreate()) return;
    const f = this.createForm;
    this.mockData.addEvent({
      title: f.title.trim(),
      date: String(f.date),
      venue: f.venue.trim(),
      location: f.location.trim(),
      venueAddress: f.venueAddress.trim() || undefined,
      description: f.description.trim() || undefined,
      flyerUrl: f.flyerUrl.trim() || undefined,
      capacity: Number(f.capacity) || undefined,
      isCoProduction: f.isCoProduction === 'si',
      coProductionPartner: f.isCoProduction === 'si' ? (f.coProductionPartner.trim() || undefined) : undefined
    });
    this.isCreating.set(false);
  }

  openUploadModal(evt: EventItem): void {
    this.uploadTarget.set(evt);
    this.uploadForm = { type: 'photo', stage: 'Montaje', caption: '', url: '' };
  }

  saveEvidence(): void {
    const target = this.uploadTarget();
    if (!target || !this.uploadForm.caption.trim()) return;

    this.mockData.uploadEventEvidence(
      target.id,
      this.uploadForm.type === 'video' ? 'video' : 'photo',
      this.uploadForm.caption.trim(),
      this.uploadForm.url.trim(),
      this.uploadForm.stage
    );
    this.uploadTarget.set(null);
    this.refreshSelected(target.id);
  }
}
