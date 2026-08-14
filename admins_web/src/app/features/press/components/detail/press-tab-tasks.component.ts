import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventTask } from '../../../../core/models/event.models';
import { PressEventItem } from '../../../../core/models/press.models';
import { PressTaskPolicy } from '../../../../core/models/press-state.meta';
import { SessionService } from '../../../../core/services/session.service';
import { FieldProposalsComponent } from '../../../../shared/ui/field-proposals/field-proposals.component';
import {
  acceptProposal,
  approversOf,
  managerWorkloads,
  pendingProposals,
  rejectProposal,
  resolveTasks,
  ResolvedTask,
  taskOwner
} from '../../../events/event-tasks';
import { money } from '../../../events/event-metrics';
import { isSingleManager, participatingManagers, stampLabel } from '../../press-metrics';
import { PRESS_COMPLETENESS_GROUPS } from '../../press-completeness';
import { getTabForPressChecklistItem, PressDetailTab } from '../press-detail-tabs';

/**
 * Tareas del expediente de prensa.
 *
 * Los puntos obligatorios **no se crean, ni se borran, ni se marcan a mano**: los
 * sintetiza el checklist y se cierran solos cuando el dato aparece capturado. Lo
 * único que se decide aquí es de quién son, y eso solo tiene sentido cuando hay
 * más de una disquera.
 *
 * Que casi siempre haya una sola es justo lo que gobierna esta pantalla: cuando
 * el evento es de un solo manager, todo el aparato de reparto —columnas de otros
 * managers, botones de encargar, avisos de propuestas— desaparece en lugar de
 * quedarse vacío. Una interfaz que pregunta a quién se lo encargas cuando no hay
 * nadie más es ruido en el 90 % de los casos.
 */
@Component({
  selector: 'app-press-tab-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, FieldProposalsComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-6">

      @if (policy().notice; as aviso) {
        <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-on-surface-variant flex items-start gap-2">
          <span class="material-symbols-outlined text-sm text-outline shrink-0 mt-0.5">lock</span>
          <span class="leading-relaxed">{{ aviso }}</span>
        </div>
      }

      <!-- ─── AVANCE ─── -->
      <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/[0.06] via-surface-container-high/90 to-surface-container-high/90 border border-amber-500/25 border-l-4 border-l-amber-500/60 shadow-2xl space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h5 class="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center material-symbols-outlined text-lg">assignment</span>
            <span>Puntos del expediente</span>
          </h5>
          <span class="text-[11px] font-mono font-black text-on-surface">
            {{ doneRequired() }} / {{ required().length }} obligatorios
          </span>
        </div>

        <div class="h-2 rounded-full bg-black/40 overflow-hidden">
          <div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all" [style.width.%]="percent()"></div>
        </div>

        <p class="text-[10.5px] text-on-surface-variant leading-relaxed">
          Los puntos obligatorios salen del checklist y se cierran solos cuando el dato aparece capturado. No hay botón
          de "ya lo hice": no hay forma de distinguir un dato capturado de alguien diciendo que lo capturó.
        </p>
      </section>

      <!-- ─── REPARTO ENTRE DISQUERAS ─── -->
      @if (!singleManager()) {
        <section class="p-5 sm:p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl space-y-4 backdrop-blur-2xl">
          <h5 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-outline flex items-center justify-center material-symbols-outlined text-lg">groups_2</span>
            <span>Quién lleva qué</span>
          </h5>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            @for (w of workloads(); track w.manager) {
              <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25 space-y-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-black text-on-surface truncate">{{ w.manager }}</span>
                  @if (w.isOrganizer) {
                    <span class="px-2 py-0.5 rounded-lg bg-primary/20 text-primary border border-primary/30 text-[9px] font-black uppercase tracking-wider">Organizador</span>
                  }
                </div>
                <div class="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span class="text-sm font-black font-mono text-on-surface block">{{ w.requiredDone }}/{{ w.required.length }}</span>
                    <span class="text-[9px] text-outline uppercase tracking-wider">Puntos</span>
                  </div>
                  <div>
                    <span class="text-sm font-black font-mono text-on-surface block">{{ w.optionalDone }}/{{ w.optional.length }}</span>
                    <span class="text-[9px] text-outline uppercase tracking-wider">Encargos</span>
                  </div>
                  <div>
                    <span class="text-sm font-black font-mono text-on-surface block">{{ money(w.spend) }}</span>
                    <span class="text-[9px] text-outline uppercase tracking-wider">Gasto</span>
                  </div>
                </div>
                @if (w.proposalsToDecide) {
                  <p class="text-[10px] text-amber-300 font-bold">
                    {{ w.proposalsToDecide }} cambio(s) esperando su decisión
                  </p>
                }
              </div>
            }
          </div>
        </section>
      }

      <!-- ─── PROPUESTAS QUE ME TOCA DECIDIR ─── -->
      @if (myProposals().length) {
        <section class="p-5 sm:p-6 rounded-3xl bg-amber-500/[0.08] border border-amber-500/35 shadow-xl space-y-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-amber-200 flex items-center gap-2.5">
            <span class="material-symbols-outlined text-lg">rate_review</span>
            <span>Cambios propuestos que tienes que decidir</span>
          </h5>

          @for (row of myProposals(); track row.task.id) {
            <div class="p-3.5 rounded-2xl bg-black/30 border border-amber-500/25 space-y-2">
              <span class="text-[11px] font-black text-on-surface">{{ row.task.title }}</span>
              <app-field-proposals
                [proposals]="row.proposals"
                [canDecide]="true"
                [owner]="approvers(row.task)"
                (accept)="accept(row.task, $event)"
                (reject)="reject(row.task, $event)"
              />
            </div>
          }
        </section>
      }

      <!-- ─── PUNTOS OBLIGATORIOS ─── -->
      <section class="p-5 sm:p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h5 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-outline flex items-center justify-center material-symbols-outlined text-lg">checklist</span>
            <span>Checklist del expediente</span>
          </h5>
          <button type="button" (click)="hideDone.set(!hideDone())"
            class="px-3 py-1.5 rounded-xl bg-white/5 text-outline border border-white/12 hover:text-on-surface text-[10px] font-black transition-all">
            {{ hideDone() ? 'Ver todos' : 'Ocultar resueltos' }}
          </button>
        </div>

        @for (grupo of grouped(); track grupo.group) {
          @if (grupo.items.length) {
            <div class="space-y-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center gap-2">
                {{ grupo.group }}
                <span class="font-mono opacity-70">{{ grupo.done }}/{{ grupo.total }}</span>
              </span>

              @for (t of grupo.items; track t.id) {
                <div class="p-3.5 rounded-2xl border flex items-start gap-3 flex-wrap"
                  [class]="t.done
                    ? 'bg-emerald-500/[0.05] border-emerald-500/20'
                    : (t.blocking ? 'bg-rose-500/[0.05] border-rose-500/25' : 'bg-surface-container/60 border-outline-variant/25')">
                  <span class="material-symbols-outlined text-base shrink-0 mt-0.5"
                    [class]="t.done ? 'text-emerald-400' : (t.blocking ? 'text-rose-300' : 'text-outline')">
                    {{ t.done ? 'check_circle' : (t.blocking ? 'error' : 'radio_button_unchecked') }}
                  </span>

                  <div class="min-w-0 flex-1 space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs font-black text-on-surface">{{ t.title }}</span>
                      @if (t.blocking) {
                        <span class="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[9px] font-black uppercase tracking-wider">
                          Bloquea convocar
                        </span>
                      }
                      @if (!singleManager() && ownerOf(t)) {
                        <span class="px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[9px] font-black uppercase tracking-wider">
                          {{ ownerOf(t) }}
                        </span>
                      }
                    </div>
                    <p class="text-[10.5px] text-outline leading-relaxed">{{ t.detail }}</p>
                    @if (t.done && resolvedLabel(t)) {
                      <p class="text-[10px] text-emerald-300/80">{{ resolvedLabel(t) }}</p>
                    }
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    @if (!t.done) {
                      <button type="button" (click)="navigateTab.emit(tabFor(t))"
                        class="px-3 py-1.5 rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary text-[10px] font-black transition-all flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">arrow_forward</span> Ir a capturarlo
                      </button>
                    }
                    @if (!singleManager() && policy().assignMandatory && !t.pendingTransfer) {
                      <select
                        [ngModel]="t.assignedManager || ''"
                        (ngModelChange)="assign(t, $event)"
                        class="px-2 py-1.5 rounded-xl bg-black/30 border border-white/10 text-[10px] font-bold text-on-surface focus:outline-none focus:border-primary/60">
                        <option value="" class="bg-surface-container">Sin encargar</option>
                        @for (m of managers(); track m) {
                          <option [value]="m" class="bg-surface-container">{{ m }}</option>
                        }
                      </select>
                      @if (t.assignedManager && t.assignedManager === myManager()) {
                        <button type="button" (click)="openTransfer(t)"
                          title="Pasarle este punto a otra disquera; tiene que aceptarlo"
                          class="px-2.5 py-1.5 rounded-xl bg-white/5 text-outline border border-white/12 hover:text-on-surface text-[10px] font-black transition-all flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-[13px]">swap_horiz</span> Transferir
                        </button>
                      }
                    }
                  </div>

                  <!-- Transferencia pendiente. La contesta el destino y solo el
                       destino: quien la pidió no puede aceptarse a sí mismo. -->
                  @if (t.pendingTransfer; as tr) {
                    <div class="w-full mt-1 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/35 text-[11px] text-amber-100 flex items-start gap-2 flex-wrap">
                      <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">swap_horiz</span>
                      <span class="min-w-0 flex-1 leading-relaxed">
                        <strong>{{ tr.fromManager }}</strong> quiere pasarle este punto a
                        <strong>{{ tr.toManager }}</strong>. Motivo: {{ tr.reason }}
                      </span>
                      @if (canAnswerTransfer(t)) {
                        <span class="flex items-center gap-1.5 shrink-0">
                          <button type="button" (click)="answerTransfer(t, true)"
                            class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black text-[10px] font-black transition-all">
                            Me hago cargo
                          </button>
                          <button type="button" (click)="answerTransfer(t, false)"
                            class="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/35 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all">
                            No puedo
                          </button>
                        </span>
                      } @else {
                        <span class="text-[10px] text-amber-200/70 shrink-0">Esperando a {{ tr.toManager }}</span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        }
      </section>

      <!-- ─── COLABORACIÓN ENTRE DISQUERAS ─── -->
      <!-- Es la excepción, no la regla: casi todos los eventos de prensa son de
           una sola disquera. Por eso cuando no hay nadie más solo queda el botón
           de invitar, y no la maquinaria entera con las columnas vacías. -->
      <section class="p-5 sm:p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h5 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-outline flex items-center justify-center material-symbols-outlined text-lg">handshake</span>
            <span>Otras disqueras</span>
          </h5>
          @if (policy().assignMandatory && isOrganizer()) {
            <button type="button" (click)="inviteOpen.set(!inviteOpen())"
              class="px-3 py-1.5 rounded-xl bg-white/5 text-outline border border-white/12 hover:text-on-surface text-[10px] font-black transition-all flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">group_add</span> Invitar a otra disquera
            </button>
          }
        </div>

        @if (!agreements().length) {
          <p class="py-4 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
            Este evento lo lleva una sola disquera. No hay nada que repartir.
          </p>
        } @else {
          <div class="space-y-2">
            @for (a of agreements(); track a.id) {
              <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25 flex items-center gap-3 flex-wrap">
                <span class="material-symbols-outlined text-base text-outline shrink-0">storefront</span>
                <div class="min-w-0 flex-1">
                  <span class="text-xs font-black text-on-surface block truncate">{{ a.managerName }}</span>
                  <span class="text-[10px] text-outline">{{ a.role === 'organizador' ? 'Organizador' : 'Co-organizador' }}</span>
                </div>
                <span class="px-2.5 py-1 rounded-lg border text-[9.5px] font-black uppercase tracking-wider shrink-0"
                  [class]="agreementClass(a.status)">
                  {{ a.status }}
                </span>
                @if (a.status === 'Pendiente' && a.managerName === myManager()) {
                  <span class="flex items-center gap-1.5 shrink-0">
                    <button type="button" (click)="answerInvite(a.id, true)"
                      class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black text-[10px] font-black transition-all">
                      Acepto co-organizar
                    </button>
                    <button type="button" (click)="answerInvite(a.id, false)"
                      class="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/35 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all">
                      No participo
                    </button>
                  </span>
                }
              </div>
            }
          </div>
        }

        @if (inviteOpen()) {
          <div class="p-3.5 rounded-2xl bg-black/30 border border-primary/25 space-y-2.5">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline">A quién invitas</span>
            <div class="flex flex-wrap gap-2">
              @for (m of invitableManagers(); track m) {
                <button type="button" (click)="invite(m)"
                  class="px-3 py-2 rounded-xl bg-white/5 border border-white/12 hover:border-primary/60 hover:text-primary text-[11px] font-bold text-on-surface-variant transition-all">
                  {{ m }}
                </button>
              }
            </div>
            @if (!invitableManagers().length) {
              <p class="text-[11px] text-outline italic">No hay más disqueras registradas a las que invitar.</p>
            }
          </div>
        }
      </section>

      <!-- ─── ENCARGOS OPERATIVOS ─── -->
      <section class="p-5 sm:p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h5 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-outline flex items-center justify-center material-symbols-outlined text-lg">task_alt</span>
            <span>Encargos operativos ({{ optional().length }})</span>
          </h5>
          @if (policy().createOptional) {
            <button type="button" (click)="newOpen.set(!newOpen())"
              class="px-3 py-1.5 rounded-xl bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary text-[10px] font-black transition-all flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">add</span> Nuevo encargo
            </button>
          }
        </div>

        <p class="text-[10.5px] text-on-surface-variant leading-relaxed">
          Lo que hay que hacer y no sale del checklist: contratar el templete, pagar el café, recoger el backdrop.
          Siguen abiertos aunque el expediente ya esté sellado, porque el evento aún no ha ocurrido.
        </p>

        @if (newOpen() && policy().createOptional) {
          <div class="p-3.5 rounded-2xl bg-black/30 border border-primary/25 space-y-2.5">
            <input [(ngModel)]="newTitle" placeholder="Qué hay que hacer"
              class="w-full bg-black/40 border border-outline-variant/30 focus:border-primary/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none" />
            <input [(ngModel)]="newDetail" placeholder="Detalle (opcional)"
              class="w-full bg-black/40 border border-outline-variant/30 focus:border-primary/60 rounded-xl px-3 py-2 text-[11px] text-on-surface focus:outline-none" />
            <div class="flex items-center justify-end gap-2">
              <button type="button" (click)="newOpen.set(false)"
                class="px-3 py-2 rounded-xl text-[11px] font-bold text-outline hover:text-on-surface transition-colors">Cancelar</button>
              <button type="button" (click)="createTask()" [disabled]="!newTitle.trim()"
                class="px-4 py-2 rounded-xl bg-primary text-on-primary text-[11px] font-black disabled:opacity-40 disabled:pointer-events-none transition-all">
                Crear encargo
              </button>
            </div>
          </div>
        }

        @if (!optional().length) {
          <p class="py-5 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
            Sin encargos operativos.
          </p>
        } @else {
          <div class="space-y-2">
            @for (t of optional(); track t.id) {
              <div class="p-3.5 rounded-2xl border flex items-start gap-3 flex-wrap"
                [class]="t.done ? 'bg-emerald-500/[0.05] border-emerald-500/20' : 'bg-surface-container/60 border-outline-variant/25'">
                <button type="button" (click)="toggleTask(t)" [disabled]="!policy().workOptional"
                  class="mt-0.5 shrink-0 disabled:opacity-50">
                  <span class="material-symbols-outlined text-base" [class]="t.done ? 'text-emerald-400' : 'text-outline'">
                    {{ t.done ? 'check_circle' : 'radio_button_unchecked' }}
                  </span>
                </button>

                <div class="min-w-0 flex-1 space-y-1">
                  <span class="text-xs font-black text-on-surface block" [class.line-through]="t.done">{{ t.title }}</span>
                  @if (t.detail) { <p class="text-[10.5px] text-outline leading-relaxed">{{ t.detail }}</p> }
                  <div class="flex items-center gap-2 flex-wrap text-[10px] text-outline">
                    @if (t.delegate) { <span>Lo ejecuta {{ t.delegate.name }} ({{ t.delegate.rank }})</span> }
                    @if (t.productionTotal) { <span>· {{ money(t.productionTotal) }} en {{ t.productionItems.length }} partida(s)</span> }
                    @if (t.completedAt) { <span>· cerrado el {{ when(t.completedAt) }}</span> }
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <!-- Delegar es dentro de la propia disquera: el manager sigue
                       respondiendo por el encargo, solo dice quién lo ejecuta. -->
                  @if (policy().workOptional && canDelegate(t)) {
                    <select
                      [ngModel]="t.delegate?.name || ''"
                      (ngModelChange)="delegate(t, $event)"
                      title="Quién lo ejecuta dentro de tu disquera"
                      class="px-2 py-1.5 rounded-xl bg-black/30 border border-white/10 text-[10px] font-bold text-on-surface focus:outline-none focus:border-primary/60">
                      <option value="" class="bg-surface-container">Sin delegar</option>
                      @for (m of myTeam(); track m.id) {
                        <option [value]="m.name" class="bg-surface-container">{{ m.name }}</option>
                      }
                    </select>
                  }
                  @if (policy().workOptional) {
                    <button type="button" (click)="removeTask(t)"
                      class="p-1.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all">
                      <span class="material-symbols-outlined text-[13px]">delete</span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `
})
export class PressTabTasksComponent {
  private readonly session = inject(SessionService);

  readonly event = input.required<PressEventItem>();
  readonly policy = input.required<PressTaskPolicy>();

  readonly patch = output<Partial<PressEventItem>>();
  readonly navigateTab = output<PressDetailTab>();

  readonly money = money;
  readonly hideDone = signal(false);
  readonly newOpen = signal(false);
  newTitle = '';
  newDetail = '';

  readonly tasks = computed(() => resolveTasks(this.event()));
  readonly required = computed(() => this.tasks().filter(t => t.kind === 'sistema' && t.blocking));
  readonly optional = computed(() => this.tasks().filter(t => t.kind === 'externa'));
  readonly doneRequired = computed(() => this.required().filter(t => t.done).length);
  readonly percent = computed(() => {
    const total = this.required().length;
    return total ? Math.round((this.doneRequired() / total) * 100) : 100;
  });

  readonly singleManager = computed(() => isSingleManager(this.event()));
  readonly managers = computed(() => participatingManagers(this.event()));
  readonly workloads = computed(() => managerWorkloads(this.event(), this.tasks()));

  /**
   * Los puntos del checklist agrupados por bloque temático.
   *
   * El orden lo manda el checklist y no el de las tareas resueltas: `resolveTasks`
   * ordena por urgencia —lo pendiente arriba— así que derivar los grupos de ahí
   * los barajaba en cada cambio y la pantalla parecía saltar sola.
   */
  readonly grouped = computed(() => {
    const sistema = this.tasks().filter(t => t.kind === 'sistema');
    const visibles = this.hideDone() ? sistema.filter(t => !t.done) : sistema;

    return PRESS_COMPLETENESS_GROUPS.map(group => ({
      group,
      items: visibles.filter(t => t.group === group),
      done: sistema.filter(t => t.group === group && t.done).length,
      total: sistema.filter(t => t.group === group).length
    })).filter(g => g.total > 0);
  });

  /** Los cambios propuestos que este actor tiene que aceptar o rechazar. */
  readonly myProposals = computed(() => {
    const actor = this.session.actor();
    return this.tasks()
      .map(task => ({ task, proposals: pendingProposals(task) }))
      .filter(row => row.proposals.length && approversOf(this.event(), row.task).includes(actor.managerName));
  });

  /**
   * Qué disquera responde por este punto, cuando no es la que organiza.
   *
   * Si nadie lo encargó a mano, manda lo que dice el propio checklist: hay puntos
   * que el organizador **no puede** resolver —la ficha pública de un grupo ajeno
   * vive en el expediente de su dueño— y sin esto salían como "sin encargar",
   * que le dice a quien lo lee que le toca a él.
   */
  ownerOf(t: ResolvedTask): string {
    const organizador = this.event().ownerManagerName || this.event().createdBy;
    const asignado = taskOwner(this.event(), t);
    if (asignado && asignado !== organizador) return asignado;

    const delChecklist = (t.checklist?.pendingOwners?.length ? t.checklist.pendingOwners : t.checklist?.owners) || [];
    const ajenos = delChecklist.filter(o => o && o !== organizador);
    return ajenos.join(' y ');
  }

  approvers(t: ResolvedTask): string {
    return approversOf(this.event(), t).join(' y ') || 'su encargado';
  }

  resolvedLabel(t: ResolvedTask): string {
    const quien = t.completedBy?.name || t.intervenedBy?.name;
    const cuando = t.completedAt || t.intervenedAt;
    if (!quien || quien === 'sistema') return '';
    return `Resuelto por ${quien}${cuando ? ' el ' + stampLabel(cuando) : ''}`;
  }

  when(iso?: string): string {
    return stampLabel(iso);
  }

  tabFor(t: ResolvedTask): PressDetailTab {
    return getTabForPressChecklistItem(t.checklistItemId || '');
  }

  // ─── Acciones ───────────────────────────────────────────────────────────────

  accept(task: ResolvedTask, proposalId: string): void {
    this.patch.emit(acceptProposal(this.event(), task.id, proposalId, this.session.actor()));
  }

  reject(task: ResolvedTask, proposalId: string): void {
    this.patch.emit(rejectProposal(this.event(), task.id, proposalId, this.session.actor()));
  }

  /**
   * Encarga un punto del checklist a otra disquera.
   *
   * Es lo único que se decide sobre un punto obligatorio: no se crea, no se
   * borra y no se marca a mano. La tarea se materializa aquí si era virtual,
   * porque hasta ahora no existía guardada en ningún sitio.
   */
  assign(t: ResolvedTask, manager: string): void {
    const stored = this.event().tasks || [];
    const asignado = manager || undefined;

    if (stored.some(x => x.id === t.id)) {
      this.patch.emit({
        tasks: stored.map(x => (x.id === t.id
          ? { ...x, assignedManager: asignado, status: asignado ? 'asignada' as const : 'abierta' as const }
          : x))
      });
      return;
    }

    const { done, checklist, blocking, virtual, productionItems, productionTotal, ...base } = t;
    this.patch.emit({
      tasks: [...stored, {
        ...base,
        assignedManager: asignado,
        status: asignado ? 'asignada' as const : 'abierta' as const,
        assignedAt: new Date().toISOString().slice(0, 16)
      }]
    });
  }

  createTask(): void {
    if (!this.newTitle.trim()) return;
    const actor = this.session.actor();
    const nueva: EventTask = {
      id: `task-op-${Date.now().toString(36)}`,
      kind: 'externa',
      title: this.newTitle.trim(),
      detail: this.newDetail.trim() || undefined,
      assignedManager: actor.managerName,
      status: 'aceptada',
      priority: 'Media',
      createdBy: actor,
      createdAt: new Date().toISOString().slice(0, 16)
    };

    this.patch.emit({ tasks: [...(this.event().tasks || []), nueva] });
    this.newTitle = '';
    this.newDetail = '';
    this.newOpen.set(false);
  }

  toggleTask(t: ResolvedTask): void {
    const actor = this.session.actor();
    const now = new Date().toISOString().slice(0, 16);
    this.patch.emit({
      tasks: (this.event().tasks || []).map(x => (x.id === t.id
        ? {
          ...x,
          status: t.done ? 'aceptada' as const : 'completada' as const,
          completedAt: t.done ? undefined : now,
          completedBy: t.done ? undefined : actor
        }
        : x))
    });
  }

  removeTask(t: ResolvedTask): void {
    this.patch.emit({ tasks: (this.event().tasks || []).filter(x => x.id !== t.id) });
  }
}
