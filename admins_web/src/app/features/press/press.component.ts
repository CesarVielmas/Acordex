import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { SessionService } from '../../core/services/session.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { PressEventItem, PressEventType, PressState } from '../../core/models/press.models';
import { PRESS_ALL_STATES, pressStateMeta } from '../../core/models/press-state.meta';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';
import { FormFieldComponent, FormFieldOption } from '../../shared/ui/form-field/form-field.component';
import { KpiCardComponent } from '../../shared/ui/kpi-card/kpi-card.component';
import { PressCardComponent } from './components/press-card.component';
import { PressDetailModalComponent } from './components/press-detail-modal.component';
import { money } from '../events/event-metrics';
import { accreditationStats, isStaleUnconvoked, pressSpend } from './press-metrics';

/**
 * Firmas & Ruedas de Prensa.
 *
 * Mismo tablero por fase que Eventos, porque un evento de prensa es un evento: se
 * arma, se revisa, se convoca, ocurre y se cierra. Lo que cambia es lo que se
 * mide: aquí no hay taquilla ni aforo de pago, así que las cifras de arriba
 * hablan de solicitudes, acreditados y gasto.
 *
 * El rol Usuario de campo solo ve lo que ya es público: un borrador trae gasto y
 * datos de contacto de medios que no le corresponden.
 */
@Component({
  selector: 'app-press',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ModalShellComponent, FormFieldComponent, KpiCardComponent,
    PressCardComponent, PressDetailModalComponent
  ],
  template: `
    <div class="space-y-6 animate-fade-in pb-12">

      <!-- ─── ENCABEZADO ─── -->
      <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-surface-container-high/90 via-surface-container/80 to-surface-container-high/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <div class="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-center shadow-inner shrink-0">
              <span class="material-symbols-outlined text-2xl">newspaper</span>
            </div>
            <div class="min-w-0">
              <h1 class="font-display-xl text-xl sm:text-2xl lg:text-3xl font-black text-on-surface tracking-tight">
                Firmas & Ruedas de Prensa
              </h1>
              <p class="text-xs text-outline mt-0.5">
                Acreditación de medios, montaje y control de gasto · sin boletaje ni taquilla
                · {{ allStates.length }} fases del ciclo
              </p>
            </div>
          </div>
        </div>

        @if (roleService.canEditEvents()) {
          <button type="button" (click)="openCreate()"
            class="px-4 py-2.5 min-h-11 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2 self-start md:self-auto relative z-10">
            <span class="material-symbols-outlined text-lg">add_circle</span> Crear evento de prensa
          </button>
        }
      </div>

      <!-- ─── MÉTRICAS ─── -->
      @if (roleService.isAdminOrEncargado()) {
        <div class="space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center gap-x-2.5 gap-y-0.5">
            <div class="flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-base text-blue-300 shrink-0">insights</span>
              <h2 class="text-xs font-black text-on-surface uppercase tracking-wider">Cobertura & Gasto Operativo</h2>
            </div>
            <span class="text-[11px] text-outline">
              Cuánta prensa está esperando respuesta, cuánta está confirmada y cuánto cuesta traerla
            </span>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <app-kpi-card
              label="Solicitudes por revisar"
              [value]="totals().pending + ''"
              icon="hourglass_top"
              [trend]="totals().pending ? 'Requieren respuesta' : 'Todo contestado'"
              [colorVariant]="totals().pending ? 'warning' : 'success'"
            />
            <app-kpi-card
              label="Medios acreditados"
              [value]="totals().approved + ''"
              icon="badge"
              [trend]="totals().headcount + ' persona(s) en total'"
              colorVariant="success"
            />
            <app-kpi-card
              label="Eventos convocados"
              [value]="totals().convoked + ''"
              icon="campaign"
              trend="Visibles en el portal"
              colorVariant="info"
            />
            @if (roleService.canViewFinances()) {
              <app-kpi-card
                label="Gasto comprometido"
                [value]="money(totals().spend)"
                icon="payments"
                trend="Sin ingresos asociados"
                colorVariant="secondary"
              />
            } @else {
              <app-kpi-card
                label="Eventos con alarma"
                [value]="totals().stale + ''"
                icon="running_with_errors"
                trend="Se les pasó la fecha"
                colorVariant="warning"
              />
            }
          </div>
        </div>
      }

      <!-- ─── FILTROS ─── -->
      <div class="p-4 rounded-3xl bg-surface-container/80 border border-outline-variant/25 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div class="relative flex-1 min-w-0">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-outline">search</span>
          <input
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Buscar por título, recinto, grupo o medio acreditado"
            class="w-full pl-10 pr-3 py-2.5 rounded-xl bg-black/30 border border-outline-variant/25 focus:border-blue-400/60 text-xs text-on-surface focus:outline-none transition-colors"
          />
        </div>

        <div class="flex items-center gap-1.5 flex-wrap">
          <button type="button" (click)="typeFilter.set('todos')"
            [class]="typeFilter() === 'todos' ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 text-outline border-white/10'"
            class="px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all">Todos</button>
          <button type="button" (click)="typeFilter.set('Firma de Autógrafos')"
            [class]="typeFilter() === 'Firma de Autógrafos' ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 text-outline border-white/10'"
            class="px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all">Firmas</button>
          <button type="button" (click)="typeFilter.set('Rueda de Prensa')"
            [class]="typeFilter() === 'Rueda de Prensa' ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 text-outline border-white/10'"
            class="px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all">Ruedas</button>
          <span class="w-px h-6 bg-white/10 mx-1"></span>
          <button type="button" (click)="hideEmpty.set(!hideEmpty())"
            [class]="hideEmpty() ? 'bg-white/10 text-on-surface border-white/20' : 'bg-white/5 text-outline border-white/10'"
            class="px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">{{ hideEmpty() ? 'visibility_off' : 'visibility' }}</span>
            Fases vacías
          </button>
        </div>
      </div>

      <!-- ─── TABLERO POR FASE ─── -->
      <div class="space-y-6">
        @for (state of visibleStates(); track state) {
          <section class="p-4 sm:p-6 rounded-3xl bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 shadow-xl space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
              <div class="flex items-center gap-3 min-w-0">
                <span [class]="meta(state).badgeClass" class="w-3.5 h-3.5 rounded-full shadow-sm shrink-0 border"></span>
                <div class="min-w-0">
                  <h3 class="text-sm font-extrabold text-on-surface flex items-center gap-2 min-w-0 flex-wrap">
                    <span [class]="meta(state).textColor" class="material-symbols-outlined text-base">{{ meta(state).icon }}</span>
                    {{ state }}
                    <span [class]="meta(state).badgeClass" class="text-xs font-bold px-3 py-0.5 rounded-full border shadow-sm">
                      {{ byState(state).length }}
                    </span>
                  </h3>
                  <p class="text-[11px] text-outline mt-0.5 line-clamp-1">{{ meta(state).meaning }}</p>
                </div>
              </div>
              <span class="text-xs font-semibold text-outline shrink-0 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">insights</span>
                {{ stateSummary(state) }}
              </span>
            </div>

            @if (byState(state).length) {
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
                @for (p of byState(state); track p.id) {
                  <app-press-card
                    [event]="p"
                    [canViewFinances]="roleService.canViewFinances()"
                    (open)="openDetail($event)"
                  />
                }
              </div>
            } @else {
              <p class="py-5 text-center text-xs text-outline font-medium italic bg-surface-container-high/40 rounded-2xl border border-dashed border-outline-variant/20">
                Sin eventos en la fase "{{ state }}"
              </p>
            }
          </section>
        }
      </div>

      <!-- ─── EXPEDIENTE ─── -->
      @if (selected()) {
        <app-press-detail-modal
          [event]="selected()"
          [availableGroups]="mockData.groups()"
          (closed)="selected.set(null)"
          (patch)="applyPatch($event)"
          (submitReview)="submitReview($event)"
          (convoke)="convoke($event.event, $event.scheduledAt)"
          (returnToReview)="returnToReview($event.event, $event.reason)"
          (postpone)="postpone($event)"
          (reconvoke)="reconvoke($event)"
          (seal)="seal($event)"
          (cancel)="cancelEvent($event.event, $event.reason)"
          (uploadEvidence)="openUpload($event)"
        />
      }

      <!-- ─── ALTA ─── -->
      @if (creating()) {
        <app-modal-shell
          title="Crear Evento de Prensa"
          subtitle="Solo lo mínimo para identificarlo: el resto se captura en el expediente"
          icon="add_circle"
          size="lg"
          [hasFooter]="true"
          (closed)="creating.set(false)"
        >
          <div class="space-y-3.5">
            <div class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-[11px] text-on-surface-variant leading-relaxed">
              Nace en <strong class="text-blue-300">Borrador</strong>. El tipo que elijas decide qué se le va a exigir:
              una firma necesita control de fila y reglas para los fans; una rueda necesita templete, sonido, vocero
              y kit de prensa.
            </div>

            <app-form-field label="Nombre del Evento" [(value)]="form.title" placeholder="Ej. Firma de Autógrafos Nuevo Disco" />
            <app-form-field label="Tipo de Evento" type="select" [(value)]="form.pressType" [options]="typeOptions" />
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <app-form-field label="Fecha" type="date" [(value)]="form.date" />
              <app-form-field label="Hora de Inicio" [(value)]="form.startTime" placeholder="16:00" />
              <app-form-field label="Cupo de Acreditados" type="number" [(value)]="form.capacity" placeholder="Ej. 25" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <app-form-field label="Recinto" [(value)]="form.venue" placeholder="Ej. Plaza Fiesta San Agustín" />
              <app-form-field label="Ciudad y Estado" [(value)]="form.location" placeholder="Ej. Monterrey, NL" />
            </div>
            <app-form-field label="Dirección del Recinto" [(value)]="form.venueAddress" placeholder="Calle, número, colonia" />
            <app-form-field label="Grupo que se presenta" [(value)]="form.groupName" placeholder="Ej. Los Elegantes del Norte" />
            <app-form-field label="Descripción" type="textarea" [(value)]="form.description" placeholder="De qué va el evento" />
          </div>

          <ng-container modal-footer>
            <button type="button" (click)="creating.set(false)"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
            <button type="button" (click)="create()" [disabled]="!canCreate()"
              class="px-5 py-2.5 min-h-11 rounded-xl bg-blue-500 text-white text-xs font-black disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">save</span> Crear Borrador
            </button>
          </ng-container>
        </app-modal-shell>
      }

      <!-- ─── MATERIAL ─── -->
      @if (uploadTarget(); as target) {
        <app-modal-shell
          title="Subir Material del Evento"
          [subtitle]="target.title"
          icon="add_a_photo"
          size="md"
          [hasFooter]="true"
          (closed)="uploadTarget.set(null)"
        >
          <div class="space-y-3.5">
            <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs">
              Fotografías y video del montaje o del evento. Alimentan la galería de la ficha pública y el cierre.
            </div>
            <app-form-field label="Tipo de Archivo" type="select" [(value)]="uploadForm.type" [options]="uploadTypeOptions" />
            <app-form-field label="Momento" type="select" [(value)]="uploadForm.stage" [options]="stageOptions" />
            <app-form-field label="Pie de foto" [(value)]="uploadForm.caption" placeholder="Ej. Presídium durante el anuncio" />
            <app-form-field label="URL del Archivo" [(value)]="uploadForm.url" placeholder="https://..." />
          </div>

          <ng-container modal-footer>
            <button type="button" (click)="uploadTarget.set(null)"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
            <button type="button" (click)="saveEvidence()" [disabled]="!uploadForm.caption.trim()"
              class="px-5 py-2.5 min-h-11 rounded-xl bg-emerald-500 text-black text-xs font-bold disabled:opacity-40 disabled:pointer-events-none">
              Subir Material
            </button>
          </ng-container>
        </app-modal-shell>
      }
    </div>
  `
})
export class PressComponent {
  readonly roleService = inject(RoleService);
  readonly sessionService = inject(SessionService);
  readonly mockData = inject(MockDataService);

  readonly allStates = PRESS_ALL_STATES;
  readonly money = money;

  readonly searchTerm = signal('');
  readonly typeFilter = signal<'todos' | PressEventType>('todos');
  readonly hideEmpty = signal(false);

  readonly selected = signal<PressEventItem | null>(null);
  readonly creating = signal(false);
  readonly uploadTarget = signal<PressEventItem | null>(null);

  readonly typeOptions: FormFieldOption[] = [
    { label: 'Firma de Autógrafos', value: 'Firma de Autógrafos' },
    { label: 'Rueda de Prensa', value: 'Rueda de Prensa' }
  ];

  readonly uploadTypeOptions: FormFieldOption[] = [
    { label: 'Fotografía (JPG/PNG)', value: 'photo' },
    { label: 'Video Corto (MP4)', value: 'video' }
  ];

  readonly stageOptions: FormFieldOption[] = [
    { label: 'Montaje', value: 'Montaje' },
    { label: 'Show', value: 'Show' },
    { label: 'Desmontaje', value: 'Desmontaje' },
    { label: 'Otro', value: 'Otro' }
  ];

  form = this.emptyForm();
  uploadForm = { type: 'photo', stage: 'Show', caption: '', url: '' };

  /** El Usuario de campo solo ve lo que ya es público. */
  readonly visible = computed<PressEventItem[]>(() => {
    const list = this.mockData.pressEvents();
    if (!this.roleService.isUsuarioOnly()) return list;
    return list.filter(p => p.state === 'Convocado' || p.state === 'Realizado' || p.state === 'Pospuesto');
  });

  readonly filtered = computed<PressEventItem[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const tipo = this.typeFilter();

    return this.visible().filter(p => {
      if (tipo !== 'todos' && p.pressType !== tipo) return false;
      if (!term) return true;
      return p.id.toLowerCase().includes(term)
        || p.title.toLowerCase().includes(term)
        || p.venue.toLowerCase().includes(term)
        || p.location.toLowerCase().includes(term)
        || p.groupName.toLowerCase().includes(term)
        || (p.accreditationRequests || []).some(r =>
          r.mediumName.toLowerCase().includes(term) || r.journalistName.toLowerCase().includes(term));
    });
  });

  readonly visibleStates = computed<PressState[]>(() => {
    if (!this.hideEmpty()) return [...this.allStates];
    return this.allStates.filter(s => this.byState(s).length > 0);
  });

  readonly totals = computed(() => {
    const list = this.visible();
    let pending = 0, approved = 0, headcount = 0, spend = 0, convoked = 0, stale = 0;

    for (const p of list) {
      const s = accreditationStats(p);
      pending += s.pending;
      approved += s.approved;
      headcount += s.headcount;
      spend += pressSpend(p);
      if (p.state === 'Convocado') convoked += 1;
      if (isStaleUnconvoked(p) || p.convocation?.blockedReason) stale += 1;
    }

    return { pending, approved, headcount, spend, convoked, stale };
  });

  meta(state: PressState) {
    return pressStateMeta(state);
  }

  byState(state: PressState): PressEventItem[] {
    return this.filtered().filter(p => p.state === state);
  }

  stateSummary(state: PressState): string {
    const list = this.byState(state);
    if (!list.length) return 'Sin eventos';

    const totales = list.reduce((acc, p) => {
      const s = accreditationStats(p);
      return { pending: acc.pending + s.pending, approved: acc.approved + s.approved, spend: acc.spend + pressSpend(p) };
    }, { pending: 0, approved: 0, spend: 0 });

    switch (state) {
      case 'Borrador':
      case 'En Revisión':
        return `${list.length} expediente(s) en captura`;
      case 'Convocado':
        return `${totales.pending} por revisar · ${totales.approved} acreditadas`;
      case 'Realizado':
      case 'Cerrado':
        return this.roleService.canViewFinances()
          ? `${totales.approved} acreditados · ${money(totales.spend)} de gasto`
          : `${totales.approved} medios acreditados`;
      default:
        return `${list.length} evento(s)`;
    }
  }

  // ─── Acciones ───────────────────────────────────────────────────────────────

  openDetail(p: PressEventItem): void {
    this.selected.set(p);
  }

  /** Vuelve a leer del store para que el modal abierto no se quede con datos viejos. */
  private refresh(id: string): void {
    if (this.selected()?.id !== id) return;
    this.selected.set(this.mockData.pressEvents().find(p => p.id === id) || null);
  }

  applyPatch(changes: Partial<PressEventItem>): void {
    const current = this.selected();
    if (!current) return;
    this.mockData.updatePressDetails(current.id, changes);
    this.refresh(current.id);
  }

  submitReview(p: PressEventItem): void {
    this.mockData.submitPressForReview(p.id);
    this.refresh(p.id);
  }

  convoke(p: PressEventItem, scheduledAt?: string): void {
    this.mockData.convokePress(p.id, scheduledAt);
    this.refresh(p.id);
  }

  returnToReview(p: PressEventItem, reason: string): void {
    this.mockData.returnPressToReview(p.id, reason);
    this.refresh(p.id);
  }

  postpone(payload: {
    event: PressEventItem; newDate: string; reason: string;
    mediaNotice?: string; videoUrl?: string; flyerUrl?: string;
  }): void {
    this.mockData.postponePress(
      payload.event.id, payload.newDate, payload.reason,
      payload.mediaNotice, payload.videoUrl, payload.flyerUrl
    );
    this.refresh(payload.event.id);
  }

  reconvoke(p: PressEventItem): void {
    this.mockData.reconvokePress(p.id);
    this.refresh(p.id);
  }

  seal(p: PressEventItem): void {
    this.mockData.sealPressClosure(p.id);
    this.refresh(p.id);
  }

  cancelEvent(p: PressEventItem, reason: string): void {
    this.mockData.cancelPress(p.id, reason);
    this.refresh(p.id);
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.creating.set(true);
  }

  canCreate(): boolean {
    const f = this.form;
    return !!f.title.trim() && !!f.date && !!f.venue.trim() && !!f.location.trim();
  }

  create(): void {
    if (!this.canCreate()) return;
    const f = this.form;
    this.mockData.addPressEvent({
      title: f.title.trim(),
      pressType: f.pressType as PressEventType,
      date: String(f.date),
      startTime: f.startTime.trim() || undefined,
      location: f.location.trim(),
      venue: f.venue.trim(),
      venueAddress: f.venueAddress.trim() || undefined,
      groupName: f.groupName.trim() || undefined,
      description: f.description.trim() || undefined,
      capacity: Number(f.capacity) || undefined
    });
    this.creating.set(false);
  }

  openUpload(p: PressEventItem): void {
    this.uploadTarget.set(p);
    this.uploadForm = { type: 'photo', stage: 'Show', caption: '', url: '' };
  }

  saveEvidence(): void {
    const target = this.uploadTarget();
    if (!target || !this.uploadForm.caption.trim()) return;
    this.mockData.uploadPressEvidence(
      target.id,
      this.uploadForm.type === 'video' ? 'video' : 'photo',
      this.uploadForm.caption.trim(),
      this.uploadForm.url.trim(),
      this.uploadForm.stage
    );
    this.uploadTarget.set(null);
    this.refresh(target.id);
  }

  private emptyForm() {
    return {
      title: '',
      pressType: 'Firma de Autógrafos' as string,
      date: '',
      startTime: '',
      venue: '',
      location: '',
      venueAddress: '',
      groupName: '',
      description: '',
      capacity: '' as string | number
    };
  }
}
