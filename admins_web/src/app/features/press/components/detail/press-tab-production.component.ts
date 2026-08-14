import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EventProductionItem,
  ProductionCategory,
  ProductionItemStatus
} from '../../../../core/models/event.models';
import { PressEventItem, PressSetupKind } from '../../../../core/models/press.models';
import { SessionService } from '../../../../core/services/session.service';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import { MandatoryTaskTagComponent } from '../../../../shared/ui/mandatory-task-tag/mandatory-task-tag.component';
import { MandatoryFields } from '../../../events/mandatory-fields';
import { markIntervention, ResolvedTask } from '../../../events/event-tasks';
import { money } from '../../../events/event-metrics';
import { PRODUCTION_CATEGORY_KEYS, productionCategoryMeta } from '../../../events/production-catalog';
import { PressFileDropComponent } from '../press-file-drop.component';
import {
  pressCommittedSpend,
  pressPaidSpend,
  pressProductionItems,
  pressSpend
} from '../../press-metrics';

/**
 * Producción: qué se monta, qué se comprometió el grupo y en qué se va el dinero.
 *
 * El desglose es el mismo `EventProductionItem` de Eventos, con la misma
 * agrupación por rubro. Lo que **no** existe aquí es ninguna cifra de ingreso:
 * no hay taquilla, no hay ingreso potencial y no hay reparto de ganancias, así
 * que el único total del expediente es el gasto. Al cerrar no se compara ingreso
 * contra costo sino gasto contra cobertura.
 */
@Component({
  selector: 'app-press-tab-production',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent, MandatoryTaskTagComponent, PressFileDropComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-6">

      <!-- ─── MONTAJE ─── -->
      <section class="p-6 rounded-3xl bg-gradient-to-br from-violet-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-violet-500/25 border-l-4 border-l-violet-500/70 shadow-2xl shadow-violet-500/5 space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-violet-300 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center justify-center material-symbols-outlined text-lg">construction</span>
            <span>{{ isFirma() ? 'Montaje de la firma' : 'Montaje de la rueda de prensa' }}</span>
          </h5>
          <app-mandatory-task-tag ref="montaje" [event]="event()" (intervene)="onIntervene($event)" (openTasks)="openTasks.emit()" />
        </div>

        @if (mandatory.notice(); as aviso) {
          <div class="p-3 rounded-xl bg-amber-500/15 border border-amber-500/35 text-[11px] text-amber-100 flex items-start gap-2">
            <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">info</span>
            <span class="flex-1">{{ aviso }}</span>
            <button type="button" (click)="mandatory.notice.set(null)" class="text-amber-300 hover:text-white shrink-0">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        }

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <app-editable-field
            label="Qué se monta"
            type="select"
            [options]="setupOptions"
            [value]="stage().setupKind"
            [readonly]="!canEdit()"
            [proposalWarning]="mandatory.warning('montaje')"
            [proposals]="mandatory.proposals('montaje', 'stage')"
            [canDecide]="mandatory.canDecide('montaje')"
            [proposalOwner]="mandatory.approvers('montaje')"
            (acceptProposal)="mandatory.accept('montaje', $event)"
            (rejectProposal)="mandatory.reject('montaje', $event)"
            (save)="saveStage('Montaje', { setupKind: asSetup($event) })"
          />
          <app-editable-field
            label="Proveedor de sonido"
            [value]="stage().soundProvider ?? ''"
            [readonly]="!canEdit()"
            [hint]="isRueda() ? 'para que se oigan las preguntas' : ''"
            (save)="saveStage('Sonido', { soundProvider: $event })"
          />
          <app-editable-field
            label="Contacto del sonido"
            type="tel"
            [value]="stage().soundContact ?? ''"
            [readonly]="!canEdit()"
            (save)="saveStage('Contacto de sonido', { soundContact: $event })"
          />
          <app-editable-field
            label="Personal de control de fila"
            hint="cuántos"
            type="number"
            [value]="stage().queueStaffCount ?? ''"
            [readonly]="!canEdit()"
            (save)="saveStage('Control de fila', { queueStaffCount: toNumber($event) })"
          />
          <app-editable-field
            label="Quién coordina la fila"
            [value]="stage().queueStaffLead ?? ''"
            [readonly]="!canEdit()"
            (save)="saveStage('Control de fila', { queueStaffLead: $event })"
          />
          <app-editable-field
            label="Seguridad"
            [value]="stage().securityProvider ?? ''"
            [readonly]="!canEdit()"
            (save)="saveStage('Seguridad', { securityProvider: $event })"
          />
          <app-editable-field
            label="Contacto de seguridad"
            type="tel"
            [value]="stage().securityContact ?? ''"
            [readonly]="!canEdit()"
            (save)="saveStage('Seguridad', { securityContact: $event })"
          />
          <app-editable-field
            label="Notas del montaje"
            type="textarea"
            [rows]="3"
            [value]="stage().notes ?? ''"
            [readonly]="!canEdit()"
            (save)="saveStage('Notas del montaje', { notes: $event })"
          />
        </div>

        <!-- Backdrop -->
        <div class="p-4 rounded-2xl bg-black/25 border border-violet-500/20 space-y-3">
          <span class="text-[10px] font-black uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">wallpaper</span> Backdrop con logos
          </span>
          <p class="text-[10.5px] text-on-surface-variant leading-relaxed">
            Es el fondo de todas las fotos que se publiquen. Sin él, la marca no sale en ninguna de las notas que
            genere el evento, que es buena parte de la razón por la que se hace.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <app-press-file-drop
              label="Diseño del backdrop"
              kind="image"
              [value]="stage().backdropUrl ?? ''"
              [readonly]="!canEdit()"
              (save)="saveStage('Backdrop', { backdropUrl: $event })"
            />
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline">Logos que van en el backdrop</span>
                @if (canEdit()) {
                  <button type="button" (click)="addSponsor()"
                    class="px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/35 hover:bg-violet-500 hover:text-white text-[10px] font-black transition-all">
                    + Logo
                  </button>
                }
              </div>
              @if (!sponsors().length) {
                <p class="py-3 text-center text-[11px] text-outline italic bg-black/20 rounded-xl border border-dashed border-outline-variant/20">
                  Sin logos capturados.
                </p>
              } @else {
                <div class="space-y-1.5">
                  @for (s of sponsors(); track $index) {
                    <div class="flex items-center gap-2 p-2 rounded-xl bg-surface-container/60 border border-outline-variant/25">
                      <input
                        [ngModel]="s"
                        (ngModelChange)="patchSponsor($index, $event)"
                        [disabled]="!canEdit()"
                        class="flex-1 min-w-0 bg-transparent text-[11px] text-on-surface focus:outline-none disabled:opacity-70"
                      />
                      @if (canEdit()) {
                        <button type="button" (click)="removeSponsor($index)"
                          class="p-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shrink-0">
                          <span class="material-symbols-outlined text-[13px]">close</span>
                        </button>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- ─── TALENTO ─── -->
      <section class="p-6 rounded-3xl bg-gradient-to-br from-teal-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-teal-500/25 border-l-4 border-l-teal-500/70 shadow-2xl shadow-teal-500/5 space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center material-symbols-outlined text-lg">record_voice_over</span>
            <span>Compromiso del talento</span>
          </h5>
          <app-mandatory-task-tag ref="talento" [event]="event()" (intervene)="onIntervene($event)" (openTasks)="openTasks.emit()" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <app-editable-field
            label="Hora de llegada del grupo"
            hint="24h"
            [value]="talent().arrivalTime ?? ''"
            [readonly]="!canEditTalent()"
            placeholder="15:00"
            [proposalWarning]="mandatory.warning('talento')"
            [proposals]="mandatory.proposals('talento', 'talent')"
            [canDecide]="mandatory.canDecide('talento')"
            [proposalOwner]="mandatory.approvers('talento')"
            (acceptProposal)="mandatory.accept('talento', $event)"
            (rejectProposal)="mandatory.reject('talento', $event)"
            (save)="saveTalent('Hora de llegada', { arrivalTime: $event })"
          />
          <app-editable-field
            label="Vocero designado"
            [value]="talent().spokespersonName ?? ''"
            [readonly]="!canEditTalent()"
            [hint]="isRueda() ? 'quién habla' : ''"
            (save)="saveTalent('Vocero designado', { spokespersonName: $event })"
          />
          <app-editable-field
            label="Puesto del vocero"
            [value]="talent().spokespersonRole ?? ''"
            [readonly]="!canEditTalent()"
            placeholder="Vocalista, manager…"
            (save)="saveTalent('Vocero designado', { spokespersonRole: $event })"
          />
          <app-editable-field
            label="Duración comprometida"
            hint="minutos"
            type="number"
            [value]="talent().committedMinutes ?? ''"
            [readonly]="!canEditTalent()"
            (save)="saveTalent('Duración comprometida', { committedMinutes: toNumber($event) })"
          />
        </div>

        <div class="p-4 rounded-2xl bg-black/25 border border-teal-500/20 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-black uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">do_not_disturb_on</span> Temas vetados · el "no preguntar por"
            </span>
            @if (canEditTalent()) {
              <button type="button" (click)="addTopic()"
                class="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/35 hover:bg-teal-500 hover:text-black text-[10px] font-black transition-all">
                + Tema
              </button>
            }
          </div>
          <p class="text-[10.5px] text-on-surface-variant leading-relaxed">
            Lo que el grupo no va a contestar. Se le comunica a los medios acreditados antes de empezar: es la
            diferencia entre una rueda que sale como se planeó y una nota sobre la pregunta incómoda.
          </p>

          @if (!topics().length) {
            <p class="py-3 text-center text-[11px] text-outline italic bg-black/20 rounded-xl border border-dashed border-outline-variant/20">
              Sin temas vetados capturados.
            </p>
          } @else {
            <div class="space-y-1.5">
              @for (t of topics(); track $index) {
                <div class="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/25">
                  <span class="material-symbols-outlined text-[13px] text-rose-300 shrink-0">block</span>
                  <input
                    [ngModel]="t"
                    (ngModelChange)="patchTopic($index, $event)"
                    [disabled]="!canEditTalent()"
                    class="flex-1 min-w-0 bg-transparent text-[11px] text-on-surface focus:outline-none disabled:opacity-70"
                  />
                  @if (canEditTalent()) {
                    <button type="button" (click)="removeTopic($index)"
                      class="p-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shrink-0">
                      <span class="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>

        <app-editable-field
          label="Notas del talento"
          type="textarea"
          [rows]="3"
          [value]="talent().notes ?? ''"
          [readonly]="!canEditTalent()"
          (save)="saveTalent('Notas del talento', { notes: $event })"
        />
      </section>

      <!-- ─── GASTO ─── -->
      @if (canViewFinances()) {
        <section class="p-6 rounded-3xl bg-gradient-to-br from-rose-500/[0.05] via-surface-container-high/90 to-surface-container-high/90 border border-rose-500/20 border-l-4 border-l-rose-400/60 shadow-2xl space-y-5 backdrop-blur-2xl">
          <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
            <h5 class="text-xs font-black uppercase tracking-wider text-rose-200 flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 flex items-center justify-center material-symbols-outlined text-lg">receipt_long</span>
              <span>En qué se va el dinero</span>
            </h5>
            <span class="px-3.5 py-1.5 rounded-2xl bg-surface-container-highest border border-outline-variant/30 text-xs font-mono font-black text-on-surface">
              Total {{ money(total()) }}
            </span>
          </div>

          <div class="p-3.5 rounded-2xl bg-black/25 border border-white/8 text-[11px] text-on-surface-variant leading-relaxed">
            Un evento de prensa no genera ingreso: no hay boletos, no hay taquilla y no hay nada que repartir. Lo único
            que se lleva aquí es el gasto, y al cerrar se compara contra la cobertura que salió.
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Estimado</span>
              <span class="text-lg font-black font-mono text-on-surface">{{ money(total()) }}</span>
              <span class="text-[10px] text-outline block mt-0.5">{{ items().length }} partida(s)</span>
            </div>
            <div class="p-4 rounded-2xl bg-amber-500/[0.07] border border-amber-500/25">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Comprometido</span>
              <span class="text-lg font-black font-mono text-amber-200">{{ money(committed()) }}</span>
              <span class="text-[10px] text-outline block mt-0.5">Contratado o pagado</span>
            </div>
            <div class="p-4 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/25">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Pagado</span>
              <span class="text-lg font-black font-mono text-emerald-300">{{ money(paid()) }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline">Partidas</span>
            @if (canEdit()) {
              <button type="button" (click)="addItem()"
                class="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-200 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[13px]">add</span> Agregar partida
              </button>
            }
          </div>

          @if (!items().length) {
            <p class="py-5 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
              Sin desglose. El expediente se puede convocar igual: el desglose existe para saber en qué se fue el
              dinero, no para bloquear nada.
            </p>
          } @else {
            <div class="space-y-2">
              @for (p of items(); track p.id) {
                <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                  <div class="md:col-span-4 min-w-0">
                    <input
                      [ngModel]="p.concept"
                      (ngModelChange)="patchItem(p.id, { concept: $event })"
                      [disabled]="!canEdit()"
                      placeholder="Concepto"
                      class="w-full bg-transparent text-xs font-bold text-on-surface focus:outline-none border-b border-transparent focus:border-rose-400/60 transition-colors disabled:opacity-70"
                    />
                    <input
                      [ngModel]="p.supplier"
                      (ngModelChange)="patchItem(p.id, { supplier: $event })"
                      [disabled]="!canEdit()"
                      placeholder="Proveedor"
                      class="w-full bg-transparent text-[10px] text-outline focus:outline-none border-b border-transparent focus:border-rose-400/60 transition-colors disabled:opacity-70"
                    />
                  </div>

                  <div class="md:col-span-3">
                    <select
                      [ngModel]="p.category"
                      (ngModelChange)="patchItem(p.id, { category: $event })"
                      [disabled]="!canEdit()"
                      class="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-on-surface focus:outline-none focus:border-rose-400/60 disabled:opacity-70">
                      @for (c of categories; track c) {
                        <option [value]="c" class="bg-surface-container">{{ c }}</option>
                      }
                    </select>
                  </div>

                  <div class="md:col-span-2">
                    <select
                      [ngModel]="p.status"
                      (ngModelChange)="patchItem(p.id, { status: $event })"
                      [disabled]="!canEdit()"
                      class="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold focus:outline-none focus:border-rose-400/60 disabled:opacity-70"
                      [class]="statusColor(p.status)">
                      @for (s of statuses; track s) {
                        <option [value]="s" class="bg-surface-container text-on-surface">{{ s }}</option>
                      }
                    </select>
                  </div>

                  <div class="md:col-span-2">
                    <input
                      type="number"
                      [ngModel]="p.amount"
                      (ngModelChange)="patchItem(p.id, { amount: toNumber($event) })"
                      [disabled]="!canEdit()"
                      class="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-mono font-black text-on-surface text-right focus:outline-none focus:border-rose-400/60 disabled:opacity-70"
                    />
                  </div>

                  <div class="md:col-span-1 flex justify-end">
                    @if (canEdit()) {
                      <button type="button" (click)="removeItem(p.id)"
                        class="p-1.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all">
                        <span class="material-symbols-outlined text-[13px]">delete</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Reparto por rubro -->
            <div class="space-y-1.5 pt-2">
              @for (g of byCategory(); track g.category) {
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-[13px] shrink-0" [class]="meta(g.category).textColor">{{ meta(g.category).icon }}</span>
                  <span class="text-[11px] text-on-surface-variant w-40 shrink-0 truncate">{{ g.category }}</span>
                  <div class="flex-1 h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div class="h-full rounded-full" [class]="meta(g.category).barClass" [style.width.%]="percentOf(g.amount)"></div>
                  </div>
                  <span class="text-[11px] font-mono font-bold text-on-surface w-24 text-right shrink-0">{{ money(g.amount) }}</span>
                </div>
              }
            </div>
          }
        </section>
      }
    </div>
  `
})
export class PressTabProductionComponent {
  private readonly session = inject(SessionService);

  readonly event = input.required<PressEventItem>();
  readonly canEdit = input<boolean>(false);
  readonly canEditTalent = input<boolean>(false);
  readonly canViewFinances = input<boolean>(false);

  readonly patch = output<Partial<PressEventItem>>();
  readonly openTasks = output<void>();

  readonly money = money;
  readonly categories = PRODUCTION_CATEGORY_KEYS;
  readonly statuses: ProductionItemStatus[] = ['Estimado', 'Cotizado', 'Contratado', 'Pagado'];

  readonly setupOptions: EditableOption[] = [
    { value: 'Por Definir', label: 'Por definir' },
    { value: 'Templete', label: 'Templete con presídium' },
    { value: 'Mesa de Firmas', label: 'Mesa de firmas' },
    { value: 'Templete y Mesa', label: 'Templete y mesa de firmas' }
  ];

  readonly mandatory = new MandatoryFields<PressEventItem>(
    () => this.event(),
    () => this.session.actor(),
    patch => this.patch.emit(patch)
  );

  readonly stage = computed(() => this.event().stage || { setupKind: 'Por Definir' as PressSetupKind, backdropSponsors: [] });
  readonly talent = computed(() => this.event().talent || { bannedTopics: [] });
  readonly sponsors = computed(() => this.stage().backdropSponsors || []);
  readonly topics = computed(() => this.talent().bannedTopics || []);
  readonly items = computed(() => pressProductionItems(this.event()));

  readonly total = computed(() => pressSpend(this.event()));
  readonly committed = computed(() => pressCommittedSpend(this.event()));
  readonly paid = computed(() => pressPaidSpend(this.event()));

  readonly isFirma = computed(() => this.event().pressType === 'Firma de Autógrafos');
  readonly isRueda = computed(() => this.event().pressType === 'Rueda de Prensa');

  readonly byCategory = computed(() => {
    const by = new Map<ProductionCategory, number>();
    for (const p of this.items()) by.set(p.category, (by.get(p.category) || 0) + (p.amount || 0));
    return [...by.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  meta(c: ProductionCategory) {
    return productionCategoryMeta(c);
  }

  percentOf(amount: number): number {
    const t = this.total();
    return t > 0 ? Math.round((amount / t) * 100) : 0;
  }

  statusColor(status: ProductionItemStatus): string {
    switch (status) {
      case 'Pagado': return 'text-emerald-300';
      case 'Contratado': return 'text-amber-200';
      case 'Cotizado': return 'text-sky-300';
      default: return 'text-outline';
    }
  }

  toNumber(value: string | number): number {
    return Number(value) || 0;
  }

  asSetup(value: string): PressSetupKind {
    const validas: PressSetupKind[] = ['Por Definir', 'Templete', 'Mesa de Firmas', 'Templete y Mesa'];
    return validas.includes(value as PressSetupKind) ? (value as PressSetupKind) : 'Por Definir';
  }

  onIntervene(task: ResolvedTask): void {
    this.patch.emit(markIntervention(this.event(), task, this.session.actor()));
  }

  // El montaje y el talento son bloques anidados: el parche se fusiona con lo
  // que ya había, o guardar el proveedor de sonido borraría el backdrop.
  saveStage(label: string, changes: Record<string, unknown>): void {
    this.mandatory.save('montaje', label, { stage: { ...this.stage(), ...changes } } as Partial<PressEventItem>);
  }

  saveTalent(label: string, changes: Record<string, unknown>): void {
    this.mandatory.save('talento', label, { talent: { ...this.talent(), ...changes } } as Partial<PressEventItem>);
  }

  addSponsor(): void {
    this.saveStage('Backdrop', { backdropSponsors: [...this.sponsors(), ''] });
  }

  patchSponsor(index: number, value: string): void {
    this.saveStage('Backdrop', { backdropSponsors: this.sponsors().map((s, i) => (i === index ? value : s)) });
  }

  removeSponsor(index: number): void {
    this.saveStage('Backdrop', { backdropSponsors: this.sponsors().filter((_, i) => i !== index) });
  }

  addTopic(): void {
    this.saveTalent('Temas vetados', { bannedTopics: [...this.topics(), ''] });
  }

  patchTopic(index: number, value: string): void {
    this.saveTalent('Temas vetados', { bannedTopics: this.topics().map((t, i) => (i === index ? value : t)) });
  }

  removeTopic(index: number): void {
    this.saveTalent('Temas vetados', { bannedTopics: this.topics().filter((_, i) => i !== index) });
  }

  // ─── Desglose ───────────────────────────────────────────────────────────────

  addItem(): void {
    const nueva: EventProductionItem = {
      id: `pi-${Date.now().toString(36)}`,
      category: 'Otros',
      concept: '',
      amount: 0,
      status: 'Estimado',
      createdBy: this.session.actor().name
    };
    this.patch.emit({ productionItems: [...this.items(), nueva] });
  }

  patchItem(id: string, changes: Partial<EventProductionItem>): void {
    this.patch.emit({
      productionItems: this.items().map(p => (p.id === id ? { ...p, ...changes } : p))
    });
  }

  removeItem(id: string): void {
    this.patch.emit({ productionItems: this.items().filter(p => p.id !== id) });
  }
}
