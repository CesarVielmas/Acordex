import { Component, EventEmitter, Output, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupItem } from '../../../core/models/admin.models';
import { PressEventItem } from '../../../core/models/press.models';
import {
  pressEditPolicy,
  pressStateMeta,
  pressTaskPolicy
} from '../../../core/models/press-state.meta';
import { RoleService } from '../../../core/services/role.service';
import { SessionService } from '../../../core/services/session.service';
import { ModalShellComponent } from '../../../shared/ui/modal-shell/modal-shell.component';
import { TabPillsComponent, TabPillItem } from '../../../shared/ui/tab-pills/tab-pills.component';
import { resolveTasks } from '../../events/event-tasks';
import { money } from '../../events/event-metrics';
import { canConvoke, pressCompleteness } from '../press-completeness';
import {
  accreditationStats,
  daysUntilPress,
  isPressCreator,
  isSingleManager,
  participatingManagers,
  pressSpend,
  pressWhenLabel,
  registrationWindowLabel,
  stampLabel
} from '../press-metrics';
import { PressDetailTab, getTabForPressChecklistItem } from './press-detail-tabs';
import { PressTabEventComponent } from './detail/press-tab-event.component';
import { PressTabAccreditationsComponent } from './detail/press-tab-accreditations.component';
import { PressTabProductionComponent } from './detail/press-tab-production.component';
import { PressTabTasksComponent } from './detail/press-tab-tasks.component';
import { PressTabClosureComponent } from './detail/press-tab-closure.component';
import { PressTabActivityComponent } from './detail/press-tab-activity.component';
import { PressFileDropComponent } from './press-file-drop.component';

/**
 * Expediente de una firma o rueda de prensa.
 *
 * Las acciones de ciclo de vida viven en **un solo sitio** —la barra del pie— y
 * no repartidas entre el banner y el pie. Tenerlas en dos sitios es cómo el
 * botón del banner acabó comprobando cosas distintas que el de la barra, y a
 * partir de ahí ninguno de los dos era el que mandaba.
 */
@Component({
  selector: 'app-press-detail-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ModalShellComponent, TabPillsComponent, PressFileDropComponent,
    PressTabEventComponent, PressTabAccreditationsComponent, PressTabProductionComponent,
    PressTabTasksComponent, PressTabClosureComponent, PressTabActivityComponent
  ],
  template: `
    @if (event(); as e) {
      <app-modal-shell
        [title]="e.title"
        [subtitle]="e.venue + ', ' + e.location + ' · ' + whenLabel()"
        [icon]="meta().icon"
        size="7xl"
        [hasFooter]="true"
        (closed)="closed.emit()"
      >
        <div class="space-y-6">

          <!-- ─── FASE ACTUAL ─── -->
          <section [class]="meta().modalBorderClass" class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-high/70 border shadow-2xl backdrop-blur-2xl">
            <span [class]="meta().textColor" class="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full bg-current shadow-[0_0_18px_currentColor] pointer-events-none"></span>
            <div [class]="meta().textColor" class="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-current opacity-[0.07] blur-3xl pointer-events-none"></div>

            <div class="relative z-10 p-5 sm:p-6 pl-6 sm:pl-8 space-y-4">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="flex items-start gap-4 min-w-0">
                  <span [class]="meta().badgeClass" class="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xl">
                    <span class="material-symbols-outlined text-2xl font-bold">{{ meta().icon }}</span>
                  </span>
                  <div class="min-w-0 space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="text-sm font-black uppercase tracking-wider text-on-surface">{{ meta().phaseTitle }}</h3>
                      <span class="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-outline">
                        {{ e.pressType }}
                      </span>
                      @if (!singleManager()) {
                        <span class="px-2.5 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-black uppercase tracking-wider">
                          {{ managers().length }} disqueras
                        </span>
                      }
                    </div>
                    <p class="text-[11px] text-on-surface-variant leading-relaxed max-w-3xl">{{ meta().meaning }}</p>
                    <p class="text-[10.5px] text-outline leading-relaxed max-w-3xl">{{ meta().actionDescription }}</p>
                  </div>
                </div>

                <div class="text-right shrink-0 space-y-0.5">
                  <span class="text-2xl font-black font-mono block" [class]="meta().textColor">{{ report().percent }}%</span>
                  <span class="text-[10px] text-outline uppercase tracking-wider block">Expediente capturado</span>
                  <span class="text-[10px] text-outline block">{{ daysLabel() }}</span>
                </div>
              </div>

              <!-- Aviso de la fase. Sale del mismo sitio que la política, así que
                   no puede decir que todo está bloqueado cuando no lo está. -->
              @if (policy().warning) {
                <div class="p-3.5 rounded-2xl bg-black/30 border border-white/10 text-[11px] text-on-surface-variant leading-relaxed flex items-start gap-2">
                  <span class="material-symbols-outlined text-sm shrink-0 mt-0.5" [class]="meta().textColor">
                    {{ policy().additiveOnly ? 'add_circle' : 'info' }}
                  </span>
                  <span>{{ policy().warning }}</span>
                </div>
              }

              <!-- La convocatoria programada que no pudo salir. Se grita, no se
                   calla: una transición que se salta su turno en silencio deja el
                   expediente diciendo "programado" para siempre. -->
              @if (e.convocation?.blockedReason; as motivo) {
                <div class="p-3.5 rounded-2xl bg-rose-500/12 border border-rose-500/40 text-[11px] text-rose-100 leading-relaxed flex items-start gap-2">
                  <span class="material-symbols-outlined text-sm text-rose-300 shrink-0 mt-0.5">error</span>
                  <span>
                    <strong class="block uppercase text-[10px] tracking-wider mb-0.5">La convocatoria programada no salió</strong>
                    Le tocaba el {{ when(e.convocation?.scheduledAt) }} y no pudo: {{ motivo }}
                    Resuélvelo y vuelve a convocar; mientras tanto el evento sigue invisible para los medios.
                  </span>
                </div>
              }

              @if (e.convocation?.scheduledAt && !e.convocation?.convokedAt && !e.convocation?.blockedReason) {
                <div class="p-3.5 rounded-2xl bg-sky-500/12 border border-sky-500/35 text-[11px] text-sky-100 leading-relaxed flex items-start gap-2">
                  <span class="material-symbols-outlined text-sm text-sky-300 shrink-0 mt-0.5">schedule_send</span>
                  <span>Sale al portal solo el <strong>{{ when(e.convocation?.scheduledAt) }}</strong>. Hasta entonces sigue privado.</span>
                </div>
              }

              @if (e.activePostponement; as p) {
                <div class="p-3.5 rounded-2xl bg-orange-500/12 border border-orange-500/35 text-[11px] text-orange-100 leading-relaxed">
                  <strong class="block uppercase text-[10px] tracking-wider mb-0.5">Reprogramado</strong>
                  Del {{ p.previousDate }} al {{ p.newDate }}. Motivo: {{ p.reason }}
                  <span class="block mt-1 text-orange-200/80">{{ p.clientNotice }}</span>
                </div>
              }

              @if (e.cancellation; as c) {
                <div class="p-3.5 rounded-2xl bg-rose-500/12 border border-rose-500/40 text-[11px] text-rose-100 leading-relaxed">
                  <strong class="block uppercase text-[10px] tracking-wider mb-0.5">Cancelado por {{ c.by }} el {{ when(c.at) }}</strong>
                  {{ c.reason }}
                  <span class="block mt-1 text-rose-200/80">{{ c.clientMessage }}</span>
                </div>
              }
            </div>
          </section>

          @if (notice(); as aviso) {
            <div class="p-3.5 rounded-2xl bg-emerald-500/12 border border-emerald-500/35 text-[11px] text-emerald-100 flex items-start gap-2">
              <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">check_circle</span>
              <span class="flex-1 leading-relaxed">{{ aviso }}</span>
              <button type="button" (click)="notice.set(null)" class="text-emerald-300 hover:text-white shrink-0">
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          }

          <app-tab-pills [tabs]="tabs()" [active]="activeTab()" (change)="activeTab.set($any($event))" />

          <!-- ─── RESUMEN ─── -->
          @if (activeTab() === 'resumen') {
            <div class="space-y-5">
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div class="p-4 rounded-2xl bg-surface-container-high/80 border border-outline-variant/25">
                  <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Solicitudes</span>
                  <span class="text-2xl font-black font-mono text-on-surface">{{ stats().total }}</span>
                  <span class="text-[10px] text-outline block mt-0.5">{{ stats().pending }} por revisar</span>
                </div>
                <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Acreditadas</span>
                  <span class="text-2xl font-black font-mono text-emerald-300">{{ stats().approved }}</span>
                  <span class="text-[10px] text-outline block mt-0.5">{{ stats().headcount }} persona(s)</span>
                </div>
                <div class="p-4 rounded-2xl bg-surface-container-high/80 border border-outline-variant/25">
                  <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Cupo</span>
                  @if (stats().remaining === null) {
                    <span class="text-sm font-black text-outline italic">Sin definir</span>
                  } @else {
                    <span class="text-2xl font-black font-mono" [class]="stats().overCapacity ? 'text-rose-300' : 'text-on-surface'">
                      {{ stats().remaining }}
                    </span>
                    <span class="text-[10px] text-outline block mt-0.5">libres de {{ stats().capacity }}</span>
                  }
                </div>
                <div class="p-4 rounded-2xl bg-surface-container-high/80 border border-outline-variant/25">
                  <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Gasto</span>
                  @if (canViewFinances()) {
                    <span class="text-lg font-black font-mono text-on-surface">{{ money(spend()) }}</span>
                  } @else {
                    <span class="text-sm font-black text-outline">Reservado</span>
                  }
                  <span class="text-[10px] text-outline block mt-0.5">Sin ingresos: solo gasto</span>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-surface-container-high/80 border border-outline-variant/25 flex items-center gap-3 flex-wrap">
                <span class="material-symbols-outlined text-base text-outline">how_to_reg</span>
                <span class="text-[11px] text-on-surface-variant">{{ windowLabel() }}</span>
              </div>

              <!-- Lo que falta -->
              <section class="p-5 sm:p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl space-y-4">
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <h5 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2.5">
                    <span class="material-symbols-outlined text-lg text-outline">checklist</span>
                    <span>Lo que falta para convocar</span>
                  </h5>
                  <span class="text-[11px] font-mono font-black" [class]="convokeCheck().can ? 'text-emerald-300' : 'text-amber-300'">
                    {{ report().doneCount }}/{{ report().totalCount }} puntos
                  </span>
                </div>

                @if (convokeCheck().can) {
                  <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-100 leading-relaxed flex items-start gap-2">
                    <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">check_circle</span>
                    <span>Todo listo: el expediente está completo y no hay solicitudes sin contestar.</span>
                  </div>
                } @else {
                  <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-100 leading-relaxed flex items-start gap-2">
                    <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">pending</span>
                    <span>{{ convokeCheck().reason }}</span>
                  </div>

                  <div class="space-y-2">
                    @for (item of report().missingRequired; track item.id) {
                      <button type="button" (click)="activeTab.set(tabFor(item.id))"
                        class="w-full text-left p-3 rounded-2xl bg-surface-container/60 border border-outline-variant/25 hover:border-primary/50 transition-all flex items-start gap-2.5">
                        <span class="material-symbols-outlined text-[15px] text-rose-300 shrink-0 mt-0.5">error</span>
                        <span class="min-w-0 flex-1">
                          <span class="text-[11px] font-black text-on-surface block">{{ item.label }}</span>
                          <span class="text-[10px] text-outline block">{{ item.hint }}</span>
                          @if (!singleManager() && item.pendingOwners.length && item.pendingOwners[0] !== report().organizer) {
                            <span class="text-[10px] text-sky-300 block mt-0.5">Lo responde {{ item.pendingOwners.join(' y ') }}</span>
                          }
                        </span>
                        <span class="material-symbols-outlined text-[15px] text-outline shrink-0">arrow_forward</span>
                      </button>
                    }
                  </div>
                }
              </section>

              <!-- Ficha del portal -->
              <section class="p-5 sm:p-6 rounded-3xl bg-sky-500/[0.05] border border-sky-500/25 shadow-xl space-y-3">
                <h5 class="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-lg">public</span>
                  <span>La ficha que ve el cliente</span>
                </h5>
                <p class="text-[11px] text-on-surface-variant leading-relaxed">
                  Todo lo que se captura aquí sale en la página del portal. Ábrela y compara: ese ida y vuelta es la
                  única prueba real de que el expediente está haciendo su trabajo.
                </p>
                <a [href]="portalUrl()" target="_blank"
                  class="inline-flex px-3.5 py-2 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/35 hover:bg-sky-500 hover:text-white text-[11px] font-black transition-all items-center gap-1.5">
                  <span class="material-symbols-outlined text-[14px]">open_in_new</span>
                  {{ portalUrl() }}
                </a>
              </section>
            </div>
          }

          @if (activeTab() === 'evento') {
            <app-press-tab-event
              [event]="e"
              [availableGroups]="availableGroups()"
              [canEditIdentity]="policy().identity && canEdit()"
              [canEditPublic]="policy().publicProfile && canEdit()"
              [canEditLineup]="policy().lineup && canEdit()"
              (patch)="patch.emit($event)"
              (openTasks)="activeTab.set('tareas')"
              (uploadPhoto)="uploadEvidence.emit(e)"
            />
          }

          @if (activeTab() === 'acreditaciones') {
            <app-press-tab-accreditations
              [event]="e"
              [canEditConfig]="policy().accreditation && canEdit()"
              [canDecide]="policy().decisions && canEdit()"
              [canMarkAttendance]="policy().attendance && canEdit()"
              (patch)="patch.emit($event)"
              (notify)="notice.set($event)"
              (openTasks)="activeTab.set('tareas')"
            />
          }

          @if (activeTab() === 'produccion') {
            <app-press-tab-production
              [event]="e"
              [canEdit]="policy().production && canEdit()"
              [canEditTalent]="policy().talent && canEdit()"
              [canViewFinances]="canViewFinances()"
              (patch)="patch.emit($event)"
              (openTasks)="activeTab.set('tareas')"
            />
          }

          @if (activeTab() === 'tareas') {
            <app-press-tab-tasks
              [event]="e"
              [policy]="taskPolicy()"
              (patch)="patch.emit($event)"
              (navigateTab)="activeTab.set($event)"
            />
          }

          @if (activeTab() === 'cierre') {
            <app-press-tab-closure
              [event]="e"
              [canEdit]="policy().closure && canEdit()"
              [canViewFinances]="canViewFinances()"
              (patch)="patch.emit($event)"
            />
          }

          @if (activeTab() === 'trazabilidad') {
            <app-press-tab-activity [event]="e" [canViewFinances]="canViewFinances()" />
          }
        </div>

        <!-- ─── BARRA DE ACCIONES ─── -->
        <ng-container modal-footer>
          <div class="flex items-center gap-2 flex-wrap justify-end w-full">

            @if (e.state === 'Borrador') {
              <button type="button" (click)="submitReview.emit(e)" [disabled]="!canEdit()"
                class="px-5 py-2.5 min-h-11 rounded-xl bg-primary text-on-primary text-xs font-black disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">send</span> Mandar a revisión
              </button>
            }

            @if (e.state === 'En Revisión') {
              <button type="button" (click)="openConvoke()"
                [disabled]="!canEdit() || !convokeCheck().can"
                [title]="convokeCheck().can ? 'Publica la ficha y abre el registro de acreditaciones' : convokeCheck().reason || ''"
                class="px-5 py-2.5 min-h-11 rounded-xl bg-blue-500 text-white text-xs font-black hover:bg-blue-400 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-all">
                <span class="material-symbols-outlined text-sm">campaign</span> Convocar
              </button>
            }

            @if (e.state === 'Convocado') {
              <button type="button" (click)="returnOpen.set(true)" [disabled]="!canEdit()"
                class="px-4 py-2.5 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-bold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">undo</span> Retirar a revisión
              </button>
              <button type="button" (click)="postponeOpen.set(true)" [disabled]="!canEdit()"
                class="px-4 py-2.5 min-h-11 rounded-xl bg-orange-500/15 text-orange-200 border border-orange-500/35 hover:bg-orange-500 hover:text-black text-xs font-bold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-all">
                <span class="material-symbols-outlined text-sm">event_repeat</span> Posponer
              </button>
            }

            @if (e.state === 'Pospuesto') {
              <button type="button" (click)="reconvoke.emit(e)" [disabled]="!canEdit()"
                class="px-5 py-2.5 min-h-11 rounded-xl bg-blue-500 text-white text-xs font-black hover:bg-blue-400 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-all">
                <span class="material-symbols-outlined text-sm">campaign</span> Volver a convocar
              </button>
            }

            @if (e.state === 'Realizado') {
              <button type="button" (click)="sealOpen.set(true)" [disabled]="!canEdit()"
                class="px-5 py-2.5 min-h-11 rounded-xl bg-zinc-500/20 text-zinc-200 border border-zinc-500/40 hover:bg-zinc-400 hover:text-black text-xs font-black disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-all">
                <span class="material-symbols-outlined text-sm">lock</span> Sellar expediente
              </button>
            }

            @if (canCancel()) {
              <button type="button" (click)="cancelOpen.set(true)"
                class="px-4 py-2.5 min-h-11 rounded-xl bg-rose-500/12 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all">
                <span class="material-symbols-outlined text-sm">cancel</span> Cancelar evento
              </button>
            }

            <button type="button" (click)="closed.emit()"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cerrar</button>
          </div>
        </ng-container>
      </app-modal-shell>

      <!-- ─── DIÁLOGO: CONVOCAR ─── -->
      @if (convokeOpen()) {
        <div class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" (click)="convokeOpen.set(false)">
          <div class="w-full max-w-lg p-6 rounded-[2rem] bg-surface-container-high border border-blue-500/40 shadow-2xl space-y-5" (click)="$event.stopPropagation()">
            <div class="flex items-start gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/40 text-blue-300 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-2xl">campaign</span>
              </div>
              <div class="min-w-0 space-y-1">
                <h5 class="font-['Epilogue'] font-black text-lg text-on-surface leading-tight">Convocar el evento</h5>
                <p class="text-[11px] text-outline leading-relaxed">
                  Publica la ficha en el portal y abre el registro de acreditaciones. A partir de aquí hay medios
                  ajenos mirando y mandando solicitudes.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button type="button" (click)="convokeMode.set('immediate')"
                [class]="convokeMode() === 'immediate' ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 text-outline border-white/12'"
                class="py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all">Ahora mismo</button>
              <button type="button" (click)="convokeMode.set('scheduled')"
                [class]="convokeMode() === 'scheduled' ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 text-outline border-white/12'"
                class="py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all">Programada</button>
            </div>

            @if (convokeMode() === 'scheduled') {
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline">Fecha y hora de salida</label>
                <input type="datetime-local" [ngModel]="convokeAt()" (ngModelChange)="convokeAt.set($event)"
                  class="w-full bg-black/40 border border-outline-variant/30 focus:border-blue-400/60 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none font-mono" />
                <p class="text-[10px] text-outline leading-relaxed">
                  Sale sola al llegar la fecha. Si para entonces falta algún punto obligatorio o hay solicitudes sin
                  contestar, no sale y te avisa aquí mismo en vez de quedarse callada.
                </p>
              </div>
            }

            <div class="flex items-center justify-end gap-2.5">
              <button type="button" (click)="convokeOpen.set(false)"
                class="px-4 py-2.5 rounded-xl text-xs font-bold text-outline hover:text-on-surface transition-colors">Cancelar</button>
              <button type="button" (click)="confirmConvoke()"
                [disabled]="convokeMode() === 'scheduled' && !convokeAt()"
                class="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2">
                <span class="material-symbols-outlined text-base">campaign</span>
                {{ convokeMode() === 'immediate' ? 'Convocar ahora' : 'Programar convocatoria' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ─── DIÁLOGO: RETIRAR A REVISIÓN ─── -->
      @if (returnOpen()) {
        <div class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" (click)="returnOpen.set(false)">
          <div class="w-full max-w-lg p-6 rounded-[2rem] bg-surface-container-high border border-amber-500/40 shadow-2xl space-y-5" (click)="$event.stopPropagation()">
            <h5 class="font-['Epilogue'] font-black text-lg text-on-surface">Retirar del portal</h5>
            <p class="text-[11px] text-outline leading-relaxed">
              El evento deja de verse y el registro se cierra. Las acreditaciones ya emitidas no se tocan.
            </p>
            <textarea [ngModel]="returnReason()" (ngModelChange)="returnReason.set($event)" rows="3"
              placeholder="Por qué se retira"
              class="w-full bg-black/40 border border-outline-variant/30 focus:border-amber-400/60 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none resize-y"></textarea>
            <div class="flex items-center justify-end gap-2.5">
              <button type="button" (click)="returnOpen.set(false)"
                class="px-4 py-2.5 rounded-xl text-xs font-bold text-outline hover:text-on-surface transition-colors">Cancelar</button>
              <button type="button" (click)="confirmReturn()" [disabled]="!returnReason().trim()"
                class="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition-all disabled:opacity-40 disabled:pointer-events-none">
                Retirar a revisión
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ─── DIÁLOGO: POSPONER ─── -->
      @if (postponeOpen()) {
        <div class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" (click)="postponeOpen.set(false)">
          <div class="w-full max-w-2xl p-6 rounded-[2rem] bg-surface-container-high border border-orange-500/40 shadow-2xl space-y-5 max-h-[88vh] overflow-y-auto scroll-oculto" (click)="$event.stopPropagation()">
            <div class="flex items-start gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-orange-500/15 border border-orange-500/40 text-orange-300 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-2xl">event_repeat</span>
              </div>
              <div class="min-w-0 space-y-1">
                <h5 class="font-['Epilogue'] font-black text-lg text-on-surface leading-tight">Mover la fecha</h5>
                <p class="text-[11px] text-outline leading-relaxed">
                  Los gafetes emitidos siguen valiendo —nadie pagó nada— pero {{ stats().approved }} medio(s)
                  apartaron su agenda para ese día. El aviso es lo que evita que se presenten a un recinto vacío.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline">Fecha nueva</label>
                <input type="date" [ngModel]="postponeDate()" (ngModelChange)="postponeDate.set($event)"
                  class="w-full bg-black/40 border border-outline-variant/30 focus:border-orange-400/60 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none font-mono" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline">Fecha anterior</label>
                <div class="px-3.5 py-2.5 rounded-xl bg-black/25 border border-white/8 text-xs text-outline font-mono line-through">{{ e.date }}</div>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline">Motivo (obligatorio)</label>
              <textarea [ngModel]="postponeReason()" (ngModelChange)="postponeReason.set($event)" rows="2"
                class="w-full bg-black/40 border border-outline-variant/30 focus:border-orange-400/60 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none resize-y"></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline">Aviso a los acreditados</label>
              <textarea [ngModel]="postponeNotice()" (ngModelChange)="postponeNotice.set($event)" rows="3"
                placeholder="Si lo dejas vacío se manda uno estándar con las dos fechas"
                class="w-full bg-black/40 border border-outline-variant/30 focus:border-orange-400/60 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none resize-y"></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <app-press-file-drop label="Flyer actualizado" kind="image"
                [value]="postponeFlyer()" (save)="postponeFlyer.set($event)" />
              <app-press-file-drop label="Video del grupo dando el aviso" kind="video"
                [value]="postponeVideo()" (save)="postponeVideo.set($event)" />
            </div>

            <div class="flex items-center justify-end gap-2.5">
              <button type="button" (click)="postponeOpen.set(false)"
                class="px-4 py-2.5 rounded-xl text-xs font-bold text-outline hover:text-on-surface transition-colors">Cancelar</button>
              <button type="button" (click)="confirmPostpone()"
                [disabled]="!postponeDate() || !postponeReason().trim()"
                class="px-5 py-2.5 rounded-xl bg-orange-400 hover:bg-orange-300 text-black font-black text-xs transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2">
                <span class="material-symbols-outlined text-base">send</span> Posponer y avisar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ─── DIÁLOGO: SELLAR ─── -->
      @if (sealOpen()) {
        <div class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" (click)="sealOpen.set(false)">
          <div class="w-full max-w-md p-6 rounded-[2rem] bg-surface-container-high border border-zinc-500/40 shadow-2xl space-y-5" (click)="$event.stopPropagation()">
            <h5 class="font-['Epilogue'] font-black text-lg text-on-surface">Sellar el expediente</h5>
            <p class="text-[11px] text-outline leading-relaxed">
              Después de esto el expediente queda en solo lectura para siempre. Revisa que la asistencia y la cobertura
              publicada estén capturadas antes de cerrarlo.
            </p>
            <div class="flex items-center justify-end gap-2.5">
              <button type="button" (click)="sealOpen.set(false)"
                class="px-4 py-2.5 rounded-xl text-xs font-bold text-outline hover:text-on-surface transition-colors">Mejor no</button>
              <button type="button" (click)="seal.emit(e); sealOpen.set(false)"
                class="px-5 py-2.5 rounded-xl bg-zinc-400 hover:bg-zinc-300 text-black font-black text-xs transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-base">lock</span> Sellar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ─── DIÁLOGO: CANCELAR ─── -->
      @if (cancelOpen()) {
        <div class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" (click)="cancelOpen.set(false)">
          <div class="w-full max-w-lg p-6 rounded-[2rem] bg-surface-container-high border border-rose-500/45 shadow-2xl space-y-5" (click)="$event.stopPropagation()">
            <div class="flex items-start gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-2xl">cancel</span>
              </div>
              <div class="min-w-0 space-y-1">
                <h5 class="font-['Epilogue'] font-black text-lg text-on-surface leading-tight">Cancelar el evento</h5>
                <p class="text-[11px] text-outline leading-relaxed">
                  No hay nada que reembolsar —nunca se cobró— pero {{ stats().approved }} medio(s) acreditados
                  apartaron su agenda. El motivo se les manda tal cual.
                </p>
              </div>
            </div>

            <textarea [ngModel]="cancelReason()" (ngModelChange)="cancelReason.set($event)" rows="3"
              placeholder="Motivo de la cancelación"
              class="w-full bg-black/40 border border-outline-variant/30 focus:border-rose-400/60 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none resize-y"></textarea>

            <div class="p-3 rounded-xl bg-black/40 border border-white/10 text-[10.5px] text-outline leading-relaxed">
              Escribe <strong class="text-rose-300 font-mono">CANCELAR</strong> para confirmar.
            </div>
            <input [ngModel]="cancelConfirm()" (ngModelChange)="cancelConfirm.set($event)"
              class="w-full bg-black/40 border border-outline-variant/30 focus:border-rose-400/60 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none font-mono uppercase" />

            <div class="flex items-center justify-end gap-2.5">
              <button type="button" (click)="cancelOpen.set(false)"
                class="px-4 py-2.5 rounded-xl text-xs font-bold text-outline hover:text-on-surface transition-colors">Mejor no</button>
              <button type="button" (click)="confirmCancel()"
                [disabled]="!cancelReason().trim() || cancelConfirm().trim().toUpperCase() !== 'CANCELAR'"
                class="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs transition-all disabled:opacity-40 disabled:pointer-events-none">
                Cancelar definitivamente
              </button>
            </div>
          </div>
        </div>
      }
    }
  `
})
export class PressDetailModalComponent {
  readonly roleService = inject(RoleService);
  readonly sessionService = inject(SessionService);

  readonly event = input<PressEventItem | null>(null);
  readonly availableGroups = input<GroupItem[]>([]);

  @Output() closed = new EventEmitter<void>();
  @Output() patch = new EventEmitter<Partial<PressEventItem>>();
  @Output() submitReview = new EventEmitter<PressEventItem>();
  @Output() convoke = new EventEmitter<{ event: PressEventItem; scheduledAt?: string }>();
  @Output() returnToReview = new EventEmitter<{ event: PressEventItem; reason: string }>();
  @Output() postpone = new EventEmitter<{
    event: PressEventItem; newDate: string; reason: string;
    mediaNotice?: string; videoUrl?: string; flyerUrl?: string;
  }>();
  @Output() reconvoke = new EventEmitter<PressEventItem>();
  @Output() seal = new EventEmitter<PressEventItem>();
  @Output() cancel = new EventEmitter<{ event: PressEventItem; reason: string }>();
  @Output() uploadEvidence = new EventEmitter<PressEventItem>();

  readonly activeTab = signal<PressDetailTab>('resumen');
  readonly notice = signal<string | null>(null);
  readonly money = money;

  readonly convokeOpen = signal(false);
  readonly convokeMode = signal<'immediate' | 'scheduled'>('immediate');
  readonly convokeAt = signal('');

  readonly returnOpen = signal(false);
  readonly returnReason = signal('');

  readonly postponeOpen = signal(false);
  readonly postponeDate = signal('');
  readonly postponeReason = signal('');
  readonly postponeNotice = signal('');
  readonly postponeFlyer = signal('');
  readonly postponeVideo = signal('');

  readonly sealOpen = signal(false);
  readonly cancelOpen = signal(false);
  readonly cancelReason = signal('');
  readonly cancelConfirm = signal('');

  private readonly safe = computed(() => this.event() as PressEventItem);

  readonly meta = computed(() => pressStateMeta(this.event()?.state));
  readonly policy = computed(() => pressEditPolicy(this.event()?.state ?? 'Cerrado'));
  readonly taskPolicy = computed(() => pressTaskPolicy(this.event()?.state ?? 'Cerrado'));
  readonly report = computed(() => pressCompleteness(this.safe()));
  readonly convokeCheck = computed(() => canConvoke(this.safe()));
  readonly stats = computed(() => accreditationStats(this.safe()));
  readonly spend = computed(() => pressSpend(this.safe()));
  readonly singleManager = computed(() => isSingleManager(this.safe()));
  readonly managers = computed(() => participatingManagers(this.safe()));

  readonly canEdit = computed(() => this.roleService.canEditEvents());
  readonly canViewFinances = computed(() => this.roleService.canViewFinances());

  /**
   * Cancelar solo lo puede el creador original, comprobado contra la sesión.
   *
   * Contra la **sesión**, no contra el propio expediente: la versión de Eventos
   * nació comparando el evento consigo mismo y devolvía `true` siempre, así que
   * cualquiera podía cancelar cualquier evento.
   */
  readonly canCancel = computed(() => {
    const e = this.event();
    if (!e) return false;
    const vivos = ['Borrador', 'En Revisión', 'Convocado', 'Pospuesto'];
    if (!vivos.includes(e.state)) return false;
    return this.canEdit() && isPressCreator(e, this.sessionService.actor().managerName);
  });

  readonly tabs = computed<TabPillItem[]>(() => {
    const e = this.event();
    if (!e) return [];

    const pendientes = resolveTasks(e).filter(t => !t.done).length;
    const list: TabPillItem[] = [
      {
        value: 'resumen', label: 'Resumen', icon: 'dashboard',
        badge: this.report().percent + '%',
        accentActiveClass: 'bg-gradient-to-r from-sky-400 to-sky-500 text-black shadow-sky-500/30 border-sky-300/50',
        accentIdleClass: 'text-sky-300/80'
      },
      {
        value: 'evento', label: 'Evento', icon: 'newspaper',
        accentActiveClass: 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-amber-500/30 border-amber-300/50',
        accentIdleClass: 'text-amber-300/80'
      },
      {
        value: 'acreditaciones', label: 'Acreditaciones', icon: 'badge',
        badge: this.stats().pending ? String(this.stats().pending) : undefined,
        accentActiveClass: 'bg-gradient-to-r from-blue-400 to-blue-500 text-black shadow-blue-500/30 border-blue-300/50',
        accentIdleClass: 'text-blue-300/80'
      },
      {
        value: 'produccion', label: 'Producción', icon: 'construction',
        accentActiveClass: 'bg-gradient-to-r from-violet-400 to-violet-500 text-black shadow-violet-500/30 border-violet-300/50',
        accentIdleClass: 'text-violet-300/80'
      },
      {
        value: 'tareas', label: 'Tareas', icon: 'assignment',
        badge: pendientes > 0 ? String(pendientes) : undefined,
        accentActiveClass: 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-amber-500/30 border-amber-300/50',
        accentIdleClass: 'text-amber-300/80'
      }
    ];

    if (e.state === 'Realizado' || e.state === 'Cerrado' || e.closure) {
      list.push({
        value: 'cierre', label: 'Cierre', icon: 'fact_check',
        badge: e.state === 'Cerrado' ? 'Sellado' : undefined,
        accentActiveClass: 'bg-gradient-to-r from-purple-400 to-purple-500 text-black shadow-purple-500/30 border-purple-300/50',
        accentIdleClass: 'text-purple-300/80'
      });
    }

    list.push({
      value: 'trazabilidad', label: 'Trazabilidad', icon: 'timeline',
      accentActiveClass: 'bg-gradient-to-r from-slate-300 to-slate-400 text-black shadow-slate-400/30 border-slate-200/50',
      accentIdleClass: 'text-slate-300/80'
    });

    return list;
  });

  // ─── Presentación ───────────────────────────────────────────────────────────

  whenLabel(): string {
    const e = this.event();
    return e ? pressWhenLabel(e) : '';
  }

  when(iso?: string): string {
    return stampLabel(iso);
  }

  windowLabel(): string {
    return registrationWindowLabel(this.safe());
  }

  daysLabel(): string {
    const dias = daysUntilPress(this.safe());
    if (!isFinite(dias)) return 'Sin fecha';
    if (dias === 0) return 'Es hoy';
    if (dias === 1) return 'Mañana';
    if (dias > 0) return `Faltan ${dias} días`;
    return `Hace ${Math.abs(dias)} días`;
  }

  portalUrl(): string {
    const numero = (this.event()?.id.match(/\d+/) || ['1'])[0];
    return `http://localhost:4200/events/firma-prensa?id=${numero}`;
  }

  tabFor(checklistId: string): PressDetailTab {
    return getTabForPressChecklistItem(checklistId);
  }

  // ─── Acciones ───────────────────────────────────────────────────────────────

  openConvoke(): void {
    this.convokeMode.set('immediate');
    this.convokeAt.set('');
    this.convokeOpen.set(true);
  }

  confirmConvoke(): void {
    const e = this.event();
    if (!e) return;
    this.convoke.emit({
      event: e,
      scheduledAt: this.convokeMode() === 'scheduled' ? this.convokeAt() : undefined
    });
    this.convokeOpen.set(false);
  }

  confirmReturn(): void {
    const e = this.event();
    if (!e || !this.returnReason().trim()) return;
    this.returnToReview.emit({ event: e, reason: this.returnReason().trim() });
    this.returnReason.set('');
    this.returnOpen.set(false);
  }

  confirmPostpone(): void {
    const e = this.event();
    if (!e || !this.postponeDate() || !this.postponeReason().trim()) return;
    this.postpone.emit({
      event: e,
      newDate: this.postponeDate(),
      reason: this.postponeReason().trim(),
      mediaNotice: this.postponeNotice().trim() || undefined,
      videoUrl: this.postponeVideo() || undefined,
      flyerUrl: this.postponeFlyer() || undefined
    });
    this.postponeOpen.set(false);
    this.postponeDate.set('');
    this.postponeReason.set('');
    this.postponeNotice.set('');
    this.postponeFlyer.set('');
    this.postponeVideo.set('');
  }

  confirmCancel(): void {
    const e = this.event();
    if (!e || !this.cancelReason().trim()) return;
    if (this.cancelConfirm().trim().toUpperCase() !== 'CANCELAR') return;
    this.cancel.emit({ event: e, reason: this.cancelReason().trim() });
    this.cancelOpen.set(false);
    this.cancelReason.set('');
    this.cancelConfirm.set('');
  }
}
