import { Component, EventEmitter, Output, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupItem } from '../../../core/models/admin.models';
import { EventItem } from '../../../core/models/event.models';
import { COVERAGE_LABELS, CoverageType, PressEventItem, PressState } from '../../../core/models/press.models';
import {
  PRESS_PIPELINE_STATES,
  pressEditPolicy,
  pressStateMeta,
  pressTaskPolicy
} from '../../../core/models/press-state.meta';
import { RoleService } from '../../../core/services/role.service';
import { SessionService } from '../../../core/services/session.service';
import { ModalShellComponent } from '../../../shared/ui/modal-shell/modal-shell.component';
import { TabPillsComponent, TabPillItem } from '../../../shared/ui/tab-pills/tab-pills.component';
import { managerWorkloads, resolveTasks } from '../../events/event-tasks';
import { money } from '../../events/event-metrics';
import { canConvoke, pressCompleteness, pressCompletenessByGroup } from '../press-completeness';
import {
  accreditationStats,
  accreditedOutlets,
  costPerAttendee,
  coverageBreakdown,
  daysUntilPress,
  duplicateGroups,
  isApproved,
  isPressCreator,
  isSingleManager,
  isStaleUnconvoked,
  participatingManagers,
  pressCommittedSpend,
  pressPaidSpend,
  pressRequests,
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
import { PressClientPreviewComponent } from './press-client-preview.component';

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
    PressTabTasksComponent, PressTabClosureComponent, PressTabActivityComponent,
    PressClientPreviewComponent
  ],
  template: `
    @if (event(); as e) {
      <app-modal-shell
        [title]="e.title"
        [subtitle]="e.venue + ', ' + e.location + ' · ' + whenLabel()"
        [icon]="meta().icon"
        size="7xl"
        [hasFooter]="true"
        [reservedRightVw]="showLivePreview() ? 50 : 0"
        (closed)="closed.emit()"
      >
        <div class="space-y-6">

          <!-- ─── FASE ACTUAL (HERO BANNER CON GLOW) ─── -->
          <section [class]="meta().modalBorderClass" class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-high/70 border shadow-2xl backdrop-blur-2xl">
            <!-- Franja y halo toman el color de la fase, así el expediente se
                 "tiñe" del estado en el que está el evento. -->
            <span [class]="meta().textColor" class="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full bg-current shadow-[0_0_18px_currentColor] pointer-events-none"></span>
            <div [class]="meta().textColor" class="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-current opacity-[0.07] blur-3xl pointer-events-none"></div>

            <div class="relative z-10 p-5 sm:p-6 pl-6 sm:pl-8 space-y-4">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="flex items-start gap-4 min-w-0">
                  <span [class]="meta().badgeClass" class="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xl">
                    <span class="material-symbols-outlined text-2xl font-bold">{{ meta().icon }}</span>
                  </span>
                  <div class="min-w-0 space-y-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4 class="text-base sm:text-lg font-black text-on-surface tracking-tight">{{ meta().phaseTitle }}</h4>
                      <span class="px-2.5 py-0.5 rounded-lg bg-surface-container-highest/90 border border-outline-variant/30 text-[10px] font-mono font-black text-primary shrink-0">
                        ID: {{ e.id }}
                      </span>
                    </div>

                    <!-- Los datos de cabecera como chips: se leen de un vistazo
                         en vez de ir apretados en una línea con separadores. -->
                    <div class="flex items-center gap-x-2 gap-y-1.5 flex-wrap text-[11px]">
                      <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-highest/60 border border-outline-variant/25 text-outline">
                        <span class="material-symbols-outlined text-[13px]">newspaper</span>
                        <strong class="text-on-surface font-bold">{{ e.pressType }}</strong>
                      </span>
                      <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-highest/60 border border-outline-variant/25 text-outline">
                        <span class="material-symbols-outlined text-[13px]">person</span>
                        <strong class="text-on-surface font-bold">{{ e.createdBy }}</strong>
                      </span>
                      <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-highest/60 border border-outline-variant/25 text-outline">
                        <span class="material-symbols-outlined text-[13px]">groups</span>
                        <strong class="text-primary font-bold">{{ e.lineup.length }}</strong> en el evento
                      </span>
                      <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-highest/60 border border-outline-variant/25 text-outline">
                        <span class="material-symbols-outlined text-[13px]">badge</span>
                        <strong class="text-on-surface font-mono font-bold">{{ stats().approved }}</strong> acreditados
                        @if (stats().remaining !== null) {
                          <span class="text-outline/70">de {{ stats().capacity }}</span>
                        }
                      </span>
                      @if (canViewFinances()) {
                        <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-highest/60 border border-outline-variant/25 text-outline">
                          <span class="material-symbols-outlined text-[13px]">payments</span>
                          <strong class="text-on-surface font-mono font-bold">{{ money(spend()) }}</strong> de gasto
                        </span>
                      }
                      @if (!singleManager()) {
                        <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300">
                          <span class="material-symbols-outlined text-[13px]">groups_2</span>
                          <strong class="font-bold">{{ managers().length }}</strong> disqueras
                        </span>
                      }
                    </div>
                  </div>
                </div>

                <div class="flex flex-col items-end gap-2 shrink-0">
                  <span [class]="meta().badgeClass" class="px-4 py-2 rounded-2xl text-xs font-black border shadow-lg flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-current animate-pulse"></span>
                    {{ e.state }}
                  </span>
                  <span class="text-[10px] text-outline">{{ daysLabel() }}</span>
                </div>
              </div>

              <p class="text-xs text-on-surface-variant leading-relaxed max-w-4xl">{{ meta().meaning }}</p>

              <!-- El calendario contra el estado: la forma más silenciosa de
                   perder un evento es que se le pase la fecha sin convocarse.
                   No se concluye solo —nunca ocurrió— ni se cancela solo. -->
              @if (staleUnconvoked()) {
                <div class="p-4 rounded-2xl bg-rose-500/12 border border-rose-500/40 flex items-start gap-3">
                  <span class="material-symbols-outlined text-lg text-rose-400 shrink-0">event_busy</span>
                  <div class="space-y-1 min-w-0">
                    <p class="text-xs font-black text-rose-200">La fecha del evento ya pasó y nunca se convocó</p>
                    <p class="text-[11px] text-rose-100/90 leading-relaxed">
                      Estaba para el {{ e.date }} y sigue en {{ e.state }}. Ningún medio llegó a verlo. Cancélalo para
                      cerrarlo con su motivo, o cámbiale la fecha si de verdad se va a hacer.
                    </p>
                  </div>
                </div>
              }

              <!-- La convocatoria programada que no pudo salir. Se grita, no se
                   calla: una transición que se salta su turno en silencio deja el
                   expediente diciendo "programado" para siempre. -->
              @if (e.convocation?.blockedReason; as motivo) {
                <div class="p-4 rounded-2xl bg-rose-500/12 border border-rose-500/40 flex items-start gap-3">
                  <span class="material-symbols-outlined text-lg text-rose-400 shrink-0">error</span>
                  <div class="space-y-1 min-w-0">
                    <p class="text-xs font-black text-rose-200">La convocatoria programada no salió</p>
                    <p class="text-[11px] text-rose-100/90 leading-relaxed">
                      Le tocaba el {{ when(e.convocation?.scheduledAt) }} y no pudo: {{ motivo }}
                      Resuélvelo y vuelve a convocar; mientras tanto el evento sigue invisible para los medios.
                    </p>
                  </div>
                </div>
              }

              @if (e.convocation?.scheduledAt && !e.convocation?.convokedAt && !e.convocation?.blockedReason) {
                <div class="p-4 rounded-2xl bg-sky-500/12 border border-sky-500/35 flex items-start gap-3">
                  <span class="material-symbols-outlined text-lg text-sky-300 shrink-0">schedule_send</span>
                  <p class="text-[11px] text-sky-100 leading-relaxed">
                    Sale al portal solo el <strong>{{ when(e.convocation?.scheduledAt) }}</strong>. Hasta entonces sigue privado.
                  </p>
                </div>
              }

              <!-- La regla aditiva, dicha en positivo. El aviso de la fase la
                   explica en prosa, pero al llegar a Acreditaciones lo que hace
                   falta es saber de un vistazo qué sí y qué no. -->
              @if (policy().additiveOnly) {
                <div class="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-2.5">
                  <p class="text-xs font-black text-sky-200 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-base">add_circle</span>
                    Solo se puede añadir y sustituir
                  </p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                    <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                      <span class="font-black text-emerald-300 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[13px]">check</span> Sí puedes
                      </span>
                      <p class="text-emerald-100/90 leading-snug">
                        Acreditar a más medios · abrir otra zona · sustituir al vocero · corregir textos de la ficha
                      </p>
                    </div>
                    <div class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1">
                      <span class="font-black text-rose-300 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[13px]">block</span> No puedes
                      </span>
                      <p class="text-rose-100/90 leading-snug">
                        Borrar una acreditación confirmada (se revoca con motivo) · cambiar fecha o recinto (usa Posponer)
                      </p>
                    </div>
                  </div>
                  @if (stats().approved > 0) {
                    <p class="text-[10px] text-outline">
                      {{ stats().approved }} acreditación(es) confirmadas quedan protegidas: la lista no deja borrarlas.
                    </p>
                  }
                </div>
              }

              @if (policy().warning) {
                <div class="text-xs p-3.5 rounded-2xl flex items-start gap-2.5 backdrop-blur-md shadow-inner"
                   [class]="e.state === 'Convocado' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200' : 'bg-surface-container/80 border border-outline-variant/30 text-outline'">
                  <span class="material-symbols-outlined text-lg shrink-0 mt-0.5" [class.text-amber-400]="e.state === 'Convocado'">
                    {{ policy().additiveOnly ? 'lock' : 'info' }}
                  </span>
                  <span class="font-medium leading-normal">{{ policy().warning }}</span>
                </div>
              }

              @if (e.activePostponement; as p) {
                <div class="p-4 rounded-2xl bg-orange-500/12 border border-orange-500/35 space-y-1">
                  <p class="text-xs font-black text-orange-200">Reprogramado del {{ p.previousDate }} al {{ p.newDate }}</p>
                  <p class="text-[11px] text-orange-100/90 leading-relaxed">{{ p.reason }}</p>
                  <p class="text-[10.5px] text-orange-200/70 leading-relaxed">{{ p.clientNotice }}</p>
                </div>
              }

              @if (e.cancellation; as c) {
                <div class="p-4 rounded-2xl bg-rose-500/12 border border-rose-500/40 space-y-1">
                  <p class="text-xs font-black text-rose-200">Cancelado por {{ c.by }} el {{ when(c.at) }}</p>
                  <p class="text-[11px] text-rose-100/90 leading-relaxed">{{ c.reason }}</p>
                  <p class="text-[10.5px] text-rose-200/70 leading-relaxed">{{ c.clientMessage }}</p>
                </div>
              }

              <!-- ─── LÍNEA DE FASES ─── -->
              @if (isOutOfFlow()) {
                <div class="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs shadow-inner">
                  <span class="material-symbols-outlined text-lg shrink-0">cancel</span>
                  <span class="font-bold">Este evento salió del flujo: fue cancelado y ya no avanza por las fases.</span>
                </div>
              } @else {
                <div class="pt-4 border-t border-outline-variant/20">
                  <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-sm text-primary">timeline</span>
                      <span class="text-[10px] font-black uppercase tracking-widest text-on-surface">Ruta del evento de prensa</span>
                    </div>
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline">
                      Fase <strong class="text-primary font-mono">{{ currentStep() }}</strong> de {{ phaseSteps().length }}
                      · faltan <strong class="text-on-surface font-mono">{{ phaseSteps().length - currentStep() }}</strong>
                    </span>
                  </div>

                  <div class="relative pt-1.5">
                    <!-- Riel: va de centro a centro del primer y último nodo, no
                         de borde a borde, para que salga por la mitad del círculo. -->
                    <div
                      class="absolute top-[23px] -translate-y-1/2 h-[3px] rounded-full bg-surface-container-highest/80"
                      [style.left.%]="phaseTrackInset()"
                      [style.right.%]="phaseTrackInset()"
                    ></div>
                    <div
                      class="absolute top-[23px] -translate-y-1/2 h-[3px] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.55)] transition-all duration-500"
                      [style.left.%]="phaseTrackInset()"
                      [style.width]="'calc((100% - ' + (2 * phaseTrackInset()) + '%) * ' + (phaseProgressPercent() / 100) + ')'"
                    ></div>

                    <ol class="relative flex items-start">
                      @for (p of phaseSteps(); track p.state) {
                        <li class="flex-1 min-w-0 flex flex-col items-center gap-2 text-center px-0.5">
                          <span
                            class="relative z-10 w-[34px] h-[34px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300"
                            [class]="p.isCurrent
                              ? (p.badgeClass + ' scale-110 shadow-[0_0_20px_-2px_currentColor] ring-4 ring-current/15')
                              : (p.isDone
                                ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_14px_-3px_rgb(16,185,129)]'
                                : 'bg-surface-container border-outline-variant/40 text-outline/70')"
                            [title]="'Fase ' + p.step + ': ' + p.label"
                          >
                            @if (p.isDone) {
                              <span class="material-symbols-outlined text-[19px] font-black">check</span>
                            } @else {
                              <span class="material-symbols-outlined text-[18px]">{{ p.icon }}</span>
                            }
                            @if (p.isCurrent) {
                              <span class="absolute -inset-1 rounded-full border border-current/40 animate-ping pointer-events-none"></span>
                            }
                          </span>

                          <span
                            class="text-[10px] font-black uppercase tracking-wide leading-tight px-0.5"
                            [class]="p.isCurrent
                              ? 'text-on-surface'
                              : (p.isDone ? 'text-emerald-300/90' : 'text-outline/60')"
                          >
                            {{ p.label }}
                          </span>

                          @if (p.isCurrent) {
                            <span [class]="p.badgeClass" class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border">
                              Aquí
                            </span>
                          }
                        </li>
                      }
                    </ol>
                  </div>
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
          <!-- Igual que en Eventos: lo que se enseña arriba cambia con la fase,
               porque la pregunta cambia. En Borrador es "¿qué me falta?"; con el
               evento convocado es "¿quién viene y cuánta prensa cabe todavía?"; y
               al terminar es "¿cuánto costó y cuánta cobertura salió?". Una sola
               vista para las tres deja las tres a medias. -->
          @if (activeTab() === 'resumen') {
            <div class="space-y-5">

              <!-- ═══ CIFRAS DE CABECERA ═══ -->
              <section class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div class="p-4 rounded-2xl border bg-white/[0.03] backdrop-blur-xl space-y-2"
                  [class]="stats().pending ? 'border-amber-400/45 shadow-lg shadow-amber-500/10' : 'border-white/10'">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-black uppercase tracking-widest"
                      [class]="stats().pending ? 'text-amber-300' : 'text-outline'">Por revisar</span>
                    <span class="material-symbols-outlined text-base"
                      [class]="stats().pending ? 'text-amber-400' : 'text-outline'">hourglass_top</span>
                  </div>
                  <div class="text-3xl font-black font-mono leading-none"
                    [class]="stats().pending ? 'text-amber-300' : 'text-on-surface-variant'">{{ stats().pending }}</div>
                  <span class="text-[10px] text-outline block leading-snug">
                    {{ stats().pending ? 'Solicitudes esperando respuesta' : 'Ninguna solicitud sin contestar' }}
                  </span>
                </div>

                <div class="p-4 rounded-2xl border border-emerald-500/30 bg-white/[0.03] backdrop-blur-xl space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-black uppercase tracking-widest text-emerald-300">Acreditados</span>
                    <span class="material-symbols-outlined text-base text-emerald-400">badge</span>
                  </div>
                  <div class="text-3xl font-black font-mono text-emerald-300 leading-none">{{ stats().approved }}</div>
                  <span class="text-[10px] text-outline block leading-snug">
                    {{ stats().headcount }} persona(s) · {{ outlets().length }} medio(s) distinto(s)
                  </span>
                </div>

                <div class="p-4 rounded-2xl border bg-white/[0.03] backdrop-blur-xl space-y-2"
                  [class]="stats().overCapacity ? 'border-rose-500/40' : 'border-white/10'">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-black uppercase tracking-widest text-outline">Cupo</span>
                    <span class="material-symbols-outlined text-base text-outline">groups</span>
                  </div>
                  @if (stats().remaining === null) {
                    <div class="text-sm font-black text-outline italic leading-none pt-2">Sin definir</div>
                    <span class="text-[10px] text-outline block leading-snug">No se sabe cuándo dejar de aprobar</span>
                  } @else {
                    <div class="text-3xl font-black font-mono leading-none"
                      [class]="stats().overCapacity ? 'text-rose-300' : 'text-on-surface'">{{ stats().remaining }}</div>
                    <span class="text-[10px] text-outline block leading-snug">
                      libres de {{ stats().capacity }} · ocupa {{ occupancyPercent() }}%
                    </span>
                  }
                </div>

                @if (canViewFinances()) {
                  <div class="p-4 rounded-2xl border border-violet-500/25 bg-white/[0.03] backdrop-blur-xl space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[10px] font-black uppercase tracking-widest text-violet-300">Gasto</span>
                      <span class="material-symbols-outlined text-base text-violet-400">payments</span>
                    </div>
                    <div class="text-2xl font-black font-mono text-violet-200 leading-none">{{ money(spend()) }}</div>
                    <span class="text-[10px] text-outline block leading-snug">
                      Sin ingresos: una firma compra cobertura, no la vende
                    </span>
                  </div>
                } @else {
                  <div class="p-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[10px] font-black uppercase tracking-widest text-outline">Registro</span>
                      <span class="material-symbols-outlined text-base text-outline">how_to_reg</span>
                    </div>
                    <div class="text-sm font-black text-on-surface leading-tight pt-1">{{ windowLabel() }}</div>
                  </div>
                }
              </section>

              <!-- ═══ QUÉ PRENSA VA A VENIR ═══ -->
              <!-- Es la pregunta del apartado y no estaba contestada en ninguna
                   parte: cuántos vienen, de qué tipo son y cuánta gente meten. Un
                   evento con quince acreditados de televisión no se monta igual
                   que uno con quince de prensa escrita. -->
              <section class="p-6 rounded-3xl bg-gradient-to-br from-blue-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-blue-500/25 border-l-4 border-l-blue-500/70 shadow-2xl space-y-5 backdrop-blur-2xl">
                <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
                  <h5 class="text-xs font-black uppercase tracking-wider text-blue-300 flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center justify-center material-symbols-outlined text-lg">newspaper</span>
                    <span>Perfil de la Prensa Acreditada</span>
                  </h5>
                  <button type="button" (click)="activeTab.set('acreditaciones')"
                    class="px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/35 hover:bg-blue-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]">arrow_forward</span> Ir a acreditaciones
                  </button>
                </div>

                @if (!stats().total) {
                  <p class="py-5 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
                    Todavía no llega ninguna solicitud. Al convocar, el registro se abre y empiezan a caer aquí.
                  </p>
                } @else {
                  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Equipo promedio</span>
                      <span class="text-xl font-black font-mono text-on-surface">{{ avgCrew() }}</span>
                      <span class="text-[10px] text-outline block mt-0.5">personas por medio</span>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Medios oficiales</span>
                      <span class="text-xl font-black font-mono text-sky-300">{{ mediaSplit().media }}</span>
                      <span class="text-[10px] text-outline block mt-0.5">de {{ stats().approved }} acreditados</span>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Independientes</span>
                      <span class="text-xl font-black font-mono text-violet-300">{{ mediaSplit().independent }}</span>
                      <span class="text-[10px] text-outline block mt-0.5">creadores y freelance</span>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Tasa de aprobación</span>
                      <span class="text-xl font-black font-mono text-on-surface">{{ approvalRate() }}%</span>
                      <span class="text-[10px] text-outline block mt-0.5">{{ stats().rejected }} rechazada(s)</span>
                    </div>
                  </div>

                  <!-- Mezcla de cobertura -->
                  @if (coverage().length) {
                    <div class="space-y-2">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline">Mezcla de cobertura acreditada</span>
                      @for (c of coverage(); track c.type) {
                        <div class="flex items-center gap-2.5">
                          <span class="text-[11px] text-on-surface-variant w-44 shrink-0 truncate">{{ coverageLabel(c.type) }}</span>
                          <div class="flex-1 h-2 rounded-full bg-black/40 overflow-hidden">
                            <div class="h-full rounded-full bg-gradient-to-r from-blue-400 to-sky-400"
                              [style.width.%]="coveragePercent(c.count)"></div>
                          </div>
                          <span class="text-[11px] font-mono font-bold text-on-surface w-8 text-right shrink-0">{{ c.count }}</span>
                        </div>
                      }
                    </div>
                  }

                  <!-- Quién viene -->
                  @if (outlets().length) {
                    <div class="space-y-2">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline">Medios confirmados</span>
                      <div class="flex flex-wrap gap-1.5">
                        @for (m of outlets(); track m) {
                          <span class="px-2.5 py-1 rounded-lg bg-surface-bright text-on-surface text-[11px] font-medium border border-outline-variant/30">{{ m }}</span>
                        }
                      </div>
                    </div>
                  }

                  @if (duplicates().length) {
                    <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-100 leading-relaxed flex items-start gap-2">
                      <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">content_copy</span>
                      <span>
                        Hay {{ duplicates().length }} caso(s) de solicitudes que se pisan —mismo correo o mismo medio—.
                        Revísalas antes de aprobar dos gafetes para la misma persona.
                      </span>
                    </div>
                  }
                }
              </section>

              <!-- ═══ VISTA POR FASE: LO QUE FALTA PARA CONVOCAR ═══ -->
              @if (e.state === 'Borrador' || e.state === 'En Revisión') {
                <section class="p-6 rounded-3xl bg-gradient-to-br from-sky-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-sky-500/25 border-l-4 border-l-sky-500/70 shadow-2xl space-y-5 backdrop-blur-2xl">
                  <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-300 flex items-center justify-center material-symbols-outlined text-xl shrink-0">checklist</span>
                      <div class="min-w-0">
                        <h5 class="text-xs font-black uppercase tracking-wider text-on-surface">Información requerida para convocar</h5>
                        <p class="text-[11px] text-outline">Avance de captura del expediente</p>
                      </div>
                    </div>
                    <span class="text-2xl font-black font-mono shrink-0"
                      [class]="convokeCheck().can ? 'text-emerald-300' : 'text-sky-300'">{{ report().percent }}%</span>
                  </div>

                  @if (convokeCheck().can) {
                    <div class="p-4 rounded-2xl bg-emerald-500/12 border border-emerald-500/35 text-[11.5px] text-emerald-100 leading-relaxed flex items-start gap-2.5">
                      <span class="material-symbols-outlined text-base shrink-0">verified</span>
                      <span>
                        Todo listo: el expediente está completo y no hay solicitudes sin contestar.
                        El botón <strong>Convocar</strong> está habilitado.
                      </span>
                    </div>
                  } @else {
                    <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/35 text-[11.5px] text-amber-100 leading-relaxed flex items-start gap-2.5">
                      <span class="material-symbols-outlined text-base shrink-0">pending</span>
                      <span>{{ convokeCheck().reason }}</span>
                    </div>
                  }

                  <!-- Bloques del checklist -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    @for (b of checklistBlocks(); track b.group) {
                      <button type="button" (click)="activeTab.set(tabForGroup(b.group))"
                        class="text-left p-4 rounded-2xl border transition-all hover:border-sky-400/50"
                        [class]="b.done === b.total
                          ? 'bg-emerald-500/[0.05] border-emerald-500/25'
                          : 'bg-surface-container/60 border-outline-variant/25'">
                        <div class="flex items-center justify-between gap-2 mb-2">
                          <h6 class="text-xs font-black uppercase tracking-wider text-on-surface truncate">{{ b.group }}</h6>
                          <span class="text-[11px] font-mono font-black shrink-0"
                            [class]="b.done === b.total ? 'text-emerald-300' : 'text-on-surface-variant'">
                            {{ b.done }}/{{ b.total }}
                          </span>
                        </div>
                        <div class="h-1.5 rounded-full bg-black/40 overflow-hidden mb-2">
                          <div class="h-full rounded-full transition-all"
                            [class]="b.done === b.total ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-400 to-sky-400'"
                            [style.width.%]="b.total ? (b.done / b.total) * 100 : 0"></div>
                        </div>
                        @if (b.missing.length) {
                          <ul class="text-[10.5px] text-outline leading-relaxed space-y-0.5">
                            @for (m of b.missing; track m.id) {
                              <li class="flex items-start gap-1.5">
                                <span class="material-symbols-outlined text-[11px] shrink-0 mt-0.5"
                                  [class]="m.required ? 'text-rose-300' : 'text-outline/60'">
                                  {{ m.required ? 'error' : 'remove' }}
                                </span>
                                <span class="min-w-0">{{ m.label }}</span>
                              </li>
                            }
                          </ul>
                        } @else {
                          <span class="text-[10.5px] text-emerald-300/80">Completo</span>
                        }
                      </button>
                    }
                  </div>
                </section>

                <!-- Quién resuelve lo que falta: solo cuando hay a quién esperar -->
                @if (!singleManager() && report().pendingByOwner.length) {
                  <section class="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-indigo-500/25 border-l-4 border-l-indigo-500/70 shadow-2xl space-y-4 backdrop-blur-2xl">
                    <h5 class="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2.5 border-b border-outline-variant/20 pb-4">
                      <span class="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center justify-center material-symbols-outlined text-lg">how_to_reg</span>
                      <span>Responsables de los Pendientes</span>
                    </h5>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      @for (g of report().pendingByOwner; track g.owner) {
                        <div class="p-4 rounded-2xl border space-y-2"
                          [class]="g.isOrganizer ? 'bg-primary/[0.06] border-primary/30' : 'bg-surface-container/60 border-outline-variant/25'">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs font-black text-on-surface truncate">{{ g.owner }}</span>
                            @if (g.isOrganizer) {
                              <span class="px-2 py-0.5 rounded-lg bg-primary/20 text-primary border border-primary/30 text-[9px] font-black uppercase tracking-wider">Tú organizas</span>
                            }
                          </div>
                          <p class="text-[10.5px] text-outline">
                            {{ g.isOrganizer ? 'Puedes resolverlo ahora mismo' : 'Estás esperando a esta disquera' }}
                          </p>
                          <ul class="text-[10.5px] text-on-surface-variant leading-relaxed space-y-0.5">
                            @for (i of g.items; track i.id) { <li>· {{ i.label }}</li> }
                          </ul>
                        </div>
                      }
                    </div>
                  </section>
                }
              }

              <!-- ═══ VISTA POR FASE: EVENTO CONVOCADO ═══ -->
              @if (e.state === 'Convocado' || e.state === 'Pospuesto') {
                <section class="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/[0.08] via-surface-container-high/90 to-surface-container-high/90 border border-emerald-500/30 border-l-4 border-l-emerald-400 shadow-2xl space-y-5 backdrop-blur-2xl">
                  <div class="flex items-center justify-between gap-3 flex-wrap">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 flex items-center justify-center material-symbols-outlined text-xl shrink-0">campaign</span>
                      <div class="min-w-0">
                        <h5 class="text-sm font-black uppercase tracking-wider text-on-surface">Acreditación abierta</h5>
                        <p class="text-[11px] text-outline">{{ windowLabel() }}</p>
                      </div>
                    </div>
                    <span class="text-[11px] font-mono font-black text-emerald-300 shrink-0">{{ daysLabel() }}</span>
                  </div>

                  <div class="h-2.5 rounded-full bg-black/40 overflow-hidden">
                    <div class="h-full rounded-full transition-all"
                      [class]="stats().overCapacity ? 'bg-rose-400' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'"
                      [style.width.%]="occupancyPercent()"></div>
                  </div>
                  <p class="text-[11px] text-on-surface-variant">
                    {{ stats().headcount }} persona(s) comprometidas
                    {{ stats().capacity ? 'de un cupo de ' + stats().capacity : '(sin cupo definido)' }}.
                  </p>
                </section>
              }

              <!-- ═══ VISTA POR FASE: REALIZADO Y CERRADO ═══ -->
              @if (e.state === 'Realizado' || e.state === 'Cerrado') {
                <section class="p-6 rounded-3xl bg-gradient-to-br from-purple-500/[0.08] via-surface-container-high/90 to-surface-container-high/90 border border-purple-500/30 border-l-4 border-l-purple-400 shadow-2xl space-y-5 backdrop-blur-2xl">
                  <div class="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
                    <span class="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/35 text-purple-200 flex items-center justify-center material-symbols-outlined text-xl shrink-0">balance</span>
                    <div class="min-w-0">
                      <h5 class="text-sm font-black uppercase tracking-wider text-on-surface">Relación Gasto / Impacto</h5>
                      <p class="text-[11px] text-outline">Aquí no hay margen: se compara cuánto costó contra cuánta cobertura salió</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Asistieron</span>
                      <span class="text-2xl font-black font-mono text-emerald-300">{{ stats().attended }}</span>
                      <span class="text-[10px] text-outline block mt-0.5">de {{ stats().approved }} acreditados</span>
                    </div>
                    <div class="p-4 rounded-2xl border"
                      [class]="stats().noShow ? 'bg-rose-500/10 border-rose-500/30' : 'bg-surface-container/60 border-outline-variant/25'">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">No llegaron</span>
                      <span class="text-2xl font-black font-mono" [class]="stats().noShow ? 'text-rose-300' : 'text-outline'">{{ stats().noShow }}</span>
                    </div>
                    <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Notas publicadas</span>
                      <span class="text-2xl font-black font-mono text-on-surface">{{ e.closure?.publishedPieces ?? 0 }}</span>
                      <span class="text-[10px] text-outline block mt-0.5">
                        {{ e.closure?.estimatedReach ? (e.closure!.estimatedReach! | number) + ' de alcance' : 'Sin alcance capturado' }}
                      </span>
                    </div>
                    @if (canViewFinances()) {
                      <div class="p-4 rounded-2xl bg-violet-500/[0.07] border border-violet-500/25">
                        <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Costo por medio</span>
                        @if (costPerMedia() === null) {
                          <span class="text-sm font-black text-outline italic">Sin asistentes</span>
                        } @else {
                          <span class="text-lg font-black font-mono text-violet-200">{{ money(costPerMedia()!) }}</span>
                          <span class="text-[10px] text-outline block mt-0.5">de los que sí llegaron</span>
                        }
                      </div>
                    }
                  </div>

                  <button type="button" (click)="activeTab.set('cierre')"
                    class="px-4 py-2.5 rounded-xl bg-purple-500/15 text-purple-200 border border-purple-500/35 hover:bg-purple-400 hover:text-black text-[11px] font-black transition-all flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">fact_check</span> Ir al cierre
                  </button>
                </section>
              }

              <!-- ═══ DÓNDE SE VA EL DINERO ═══ -->
              @if (canViewFinances() && spendByCategory().length) {
                <section class="p-6 rounded-3xl bg-gradient-to-br from-violet-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-violet-500/25 border-l-4 border-l-violet-500/70 shadow-2xl space-y-4 backdrop-blur-2xl">
                  <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
                    <h5 class="text-xs font-black uppercase tracking-wider text-violet-300 flex items-center gap-2.5">
                      <span class="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center justify-center material-symbols-outlined text-lg">receipt_long</span>
                      <span>Distribución del Gasto</span>
                    </h5>
                    <button type="button" (click)="activeTab.set('produccion')"
                      class="px-3 py-1.5 rounded-xl bg-violet-500/15 text-violet-300 border border-violet-500/35 hover:bg-violet-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[13px]">arrow_forward</span> Ir a producción
                    </button>
                  </div>

                  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Presupuestado</span>
                      <span class="text-lg font-black font-mono text-on-surface">{{ money(spend()) }}</span>
                      <span class="text-[10px] text-outline block mt-0.5">{{ itemCount() }} partida(s)</span>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-amber-500/[0.07] border border-amber-500/25">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Comprometido</span>
                      <span class="text-lg font-black font-mono text-amber-200">{{ money(committedSpend()) }}</span>
                      <span class="text-[10px] text-outline block mt-0.5">{{ committedShare() }}% del total</span>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/25">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Pagado</span>
                      <span class="text-lg font-black font-mono text-emerald-300">{{ money(paidSpend()) }}</span>
                      <span class="text-[10px] text-outline block mt-0.5">{{ money(pendingSpend()) }} por pagar</span>
                    </div>
                    <div class="p-3.5 rounded-2xl border"
                      [class]="estimatedShare() > 50 ? 'bg-amber-500/[0.07] border-amber-500/30' : 'bg-surface-container/60 border-outline-variant/25'">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Sin cerrar</span>
                      <span class="text-lg font-black font-mono"
                        [class]="estimatedShare() > 50 ? 'text-amber-300' : 'text-on-surface-variant'">{{ estimatedShare() }}%</span>
                      <span class="text-[10px] text-outline block mt-0.5">Sigue en estimación</span>
                    </div>
                  </div>

                  <!-- Lo que este gasto está comprando. En un evento de prensa no
                       hay margen que calcular: la única forma de saber si el
                       presupuesto tiene sentido es dividirlo entre la prensa que
                       va a traer. -->
                  <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <div class="p-3.5 rounded-2xl bg-black/25 border border-white/8">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Costo por acreditado</span>
                      @if (costPerAccredited() === null) {
                        <span class="text-sm font-black text-outline italic">Sin acreditados</span>
                      } @else {
                        <span class="text-lg font-black font-mono text-on-surface">{{ money(costPerAccredited()!) }}</span>
                        <span class="text-[10px] text-outline block mt-0.5">{{ stats().approved }} medio(s)</span>
                      }
                    </div>
                    <div class="p-3.5 rounded-2xl bg-black/25 border border-white/8">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Costo por persona</span>
                      @if (costPerPerson() === null) {
                        <span class="text-sm font-black text-outline italic">Sin acreditados</span>
                      } @else {
                        <span class="text-lg font-black font-mono text-on-surface">{{ money(costPerPerson()!) }}</span>
                        <span class="text-[10px] text-outline block mt-0.5">{{ stats().headcount }} persona(s)</span>
                      }
                    </div>
                    <div class="p-3.5 rounded-2xl bg-black/25 border border-white/8">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Rubro más caro</span>
                      @if (topCategory(); as top) {
                        <span class="text-sm font-black text-on-surface block truncate">{{ top.category }}</span>
                        <span class="text-[10px] text-outline block mt-0.5">{{ money(top.amount) }} · {{ spendPercent(top.amount) }}%</span>
                      } @else {
                        <span class="text-sm font-black text-outline italic">Sin desglose</span>
                      }
                    </div>
                  </div>

                  <div class="space-y-1.5">
                    @for (g of spendByCategory(); track g.category) {
                      <div class="flex items-center gap-2.5">
                        <span class="text-[11px] text-on-surface-variant w-40 shrink-0 truncate">{{ g.category }}</span>
                        <div class="flex-1 h-2 rounded-full bg-black/40 overflow-hidden">
                          <div class="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-500"
                            [style.width.%]="spendPercent(g.amount)"></div>
                        </div>
                        <span class="text-[11px] font-mono font-bold text-on-surface w-24 text-right shrink-0">{{ money(g.amount) }}</span>
                      </div>
                    }
                  </div>
                </section>
              }

              <!-- ═══ QUIÉN CARGA CON QUÉ ═══ -->
              @if (!singleManager()) {
                <section class="p-6 rounded-3xl bg-gradient-to-br from-teal-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-teal-500/25 border-l-4 border-l-teal-500/70 shadow-2xl space-y-4 backdrop-blur-2xl">
                  <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
                    <h5 class="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-2.5">
                      <span class="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center material-symbols-outlined text-lg">groups_2</span>
                      <span>Carga de Trabajo por Disquera</span>
                    </h5>
                    <button type="button" (click)="activeTab.set('tareas')"
                      class="px-3 py-1.5 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/35 hover:bg-teal-500 hover:text-black text-[10px] font-black transition-all flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[13px]">arrow_forward</span> Ir a tareas
                    </button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    @for (w of workloads(); track w.manager) {
                      <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25 space-y-2.5">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-xs font-black text-on-surface truncate">{{ w.manager }}</span>
                          @if (w.isOrganizer) {
                            <span class="px-2 py-0.5 rounded-lg bg-primary/20 text-primary border border-primary/30 text-[9px] font-black uppercase tracking-wider">Organizador</span>
                          }
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <span class="text-sm font-black font-mono text-on-surface block">{{ w.requiredDone }}/{{ w.required.length }}</span>
                            <span class="text-[9px] text-outline uppercase tracking-wider">Expediente</span>
                          </div>
                          <div>
                            <span class="text-sm font-black font-mono text-on-surface block">{{ w.optionalDone }}/{{ w.optional.length }}</span>
                            <span class="text-[9px] text-outline uppercase tracking-wider">Encargos</span>
                          </div>
                          <div>
                            <span class="text-sm font-black font-mono block"
                              [class]="canViewFinances() ? 'text-violet-200' : 'text-outline'">
                              {{ canViewFinances() ? money(w.spend) : '—' }}
                            </span>
                            <span class="text-[9px] text-outline uppercase tracking-wider">Gasto</span>
                          </div>
                        </div>
                        @if (w.proposalsToDecide) {
                          <p class="text-[10px] text-amber-300 font-bold">{{ w.proposalsToDecide }} cambio(s) esperando su decisión</p>
                        }
                      </div>
                    }
                  </div>
                </section>
              }
            </div>
          }


          @if (activeTab() === 'evento') {
            <app-press-tab-event
              [event]="e"
              [availableGroups]="availableGroups()"
              [allEvents]="allEvents()"
              [allPressEvents]="allPressEvents()"
              [canEditIdentity]="policy().identity && canEdit()"
              [canEditPublic]="policy().publicProfile && canEdit()"
              [canEditLineup]="policy().lineup && canEdit()"
              [showPreview]="showLivePreview()"
              (patch)="patch.emit($event)"
              (openTasks)="activeTab.set('tareas')"
              (uploadPhoto)="uploadEvidence.emit(e)"
              (togglePreview)="showLivePreview.set($event)"
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

      @if (showLivePreview()) {
        <app-press-client-preview [event]="e" (closed)="showLivePreview.set(false)" />
      }

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
  /**
   * Toda la agenda del panel.
   *
   * Hace falta aquí porque la disponibilidad de un grupo no se captura: se
   * deriva de lo que ese grupo ya tiene agendado en otros eventos y en otras
   * firmas. Una agenda que hubiera que mantener a mano diría que hay hueco donde
   * no lo hay el primer día que alguien se olvidara de actualizarla.
   */
  readonly allEvents = input<EventItem[]>([]);
  readonly allPressEvents = input<PressEventItem[]>([]);

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
  readonly showLivePreview = signal(false);
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

  // ─── Ruta del evento ────────────────────────────────────────────────────────

  /**
   * La ruta feliz, en orden.
   *
   * 'Cancelado' y 'Pospuesto' quedan fuera a propósito: no son pasos del camino
   * sino salidas de él. Pintarlos como una etapa más haría creer que todo evento
   * de prensa termina cancelándose.
   */
  private static readonly PHASE_PATH: readonly PressState[] = PRESS_PIPELINE_STATES;

  readonly phaseSteps = computed(() => {
    const current = this.event()?.state;
    const path = PressDetailModalComponent.PHASE_PATH;
    const idx = path.indexOf(current as PressState);

    return path.map((state, i) => {
      const m = pressStateMeta(state);
      return {
        state,
        label: m.shortLabel,
        icon: m.icon,
        badgeClass: m.badgeClass,
        step: i + 1,
        isCurrent: i === idx,
        isDone: idx > -1 && i < idx
      };
    });
  });

  readonly currentStep = computed(() => this.phaseSteps().find(p => p.isCurrent)?.step ?? 0);

  /**
   * Geometría del riel del stepper. Los nodos van centrados en columnas de igual
   * ancho, así que el centro del nodo i cae en (i + 0.5)/n: el riel empieza y
   * termina justo ahí, de ahí el margen de media columna a cada lado.
   */
  readonly phaseTrackInset = computed(() => 100 / (2 * this.phaseSteps().length));

  readonly phaseProgressPercent = computed(() => {
    const n = this.phaseSteps().length;
    if (n < 2) return 0;
    const i = this.currentStep() - 1;
    return i <= 0 ? 0 : (i / (n - 1)) * 100;
  });

  /** Se salió del camino: se avisa en vez de pintar la línea de fases. */
  readonly isOutOfFlow = computed(() => this.event()?.state === 'Cancelado');

  readonly staleUnconvoked = computed(() => {
    const e = this.event();
    return !!e && isStaleUnconvoked(e);
  });

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

  // ─── Qué prensa va a venir ──────────────────────────────────────────────────

  readonly outlets = computed(() => accreditedOutlets(this.safe()));
  readonly coverage = computed(() => coverageBreakdown(this.safe()));
  readonly duplicates = computed(() => duplicateGroups(this.safe()));
  readonly workloads = computed(() => managerWorkloads(this.safe()));
  readonly costPerMedia = computed(() => costPerAttendee(this.safe()));
  readonly committedSpend = computed(() => pressCommittedSpend(this.safe()));
  readonly paidSpend = computed(() => pressPaidSpend(this.safe()));

  /**
   * Cuánta gente trae de media cada medio acreditado.
   *
   * Es el número que decide el montaje y que no estaba en ninguna parte: quince
   * acreditados de televisión —tres personas y un trípode cada uno— no caben en
   * la misma sala que quince de prensa escrita.
   */
  readonly avgCrew = computed(() => {
    const s = this.stats();
    if (!s.approved) return '—';
    return (s.headcount / s.approved).toFixed(1);
  });

  readonly mediaSplit = computed(() => {
    const vivos = pressRequests(this.safe()).filter(isApproved);
    return {
      media: vivos.filter(r => r.applicantType === 'media').length,
      independent: vivos.filter(r => r.applicantType === 'independent').length
    };
  });

  readonly approvalRate = computed(() => {
    const s = this.stats();
    const resueltas = s.approved + s.rejected + s.revoked;
    return resueltas ? Math.round((s.approved / resueltas) * 100) : 0;
  });

  /** Qué tan lleno está el cupo, en porcentaje. */
  readonly occupancyPercent = computed(() => {
    const s = this.stats();
    if (!s.capacity) return 0;
    return Math.min(100, Math.round((s.headcount / s.capacity) * 100));
  });

  coveragePercent(count: number): number {
    const total = this.coverage().reduce((sum, c) => sum + c.count, 0);
    return total ? Math.round((count / total) * 100) : 0;
  }

  // ─── Dónde se va el dinero ──────────────────────────────────────────────────

  readonly spendByCategory = computed(() => {
    const by = new Map<string, number>();
    for (const p of this.safe().productionItems || []) {
      by.set(p.category, (by.get(p.category) || 0) + (p.amount || 0));
    }
    return [...by.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  spendPercent(amount: number): number {
    const total = this.spend();
    return total ? Math.round((amount / total) * 100) : 0;
  }

  readonly itemCount = computed(() => (this.safe().productionItems || []).length);
  readonly pendingSpend = computed(() => this.spend() - this.paidSpend());
  readonly topCategory = computed(() => this.spendByCategory()[0] || null);

  readonly committedShare = computed(() => {
    const total = this.spend();
    return total ? Math.round((this.committedSpend() / total) * 100) : 0;
  });

  /** Cuánto del presupuesto sigue siendo un cálculo de cabeza. */
  readonly estimatedShare = computed(() => {
    const total = this.spend();
    if (!total) return 0;
    const abierto = (this.safe().productionItems || [])
      .filter(p => p.status === 'Estimado' || p.status === 'Cotizado')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    return Math.round((abierto / total) * 100);
  });

  /**
   * Lo que cuesta traer a cada medio.
   *
   * Es la única forma de saber si el presupuesto tiene sentido: aquí no hay
   * margen que calcular, así que un gasto solo se puede juzgar contra la prensa
   * que compra. Y en dos versiones, porque no es lo mismo un medio que trae a
   * una persona que uno que trae a cuatro.
   */
  readonly costPerAccredited = computed(() => {
    const s = this.stats();
    return s.approved ? Math.round(this.spend() / s.approved) : null;
  });

  readonly costPerPerson = computed(() => {
    const s = this.stats();
    return s.headcount ? Math.round(this.spend() / s.headcount) : null;
  });

  // ─── Lo que falta, por bloque del checklist ─────────────────────────────────

  /**
   * El checklist agrupado, con lo que falta de cada bloque a la vista.
   *
   * Un porcentaje suelto no dice qué hacer. Enseñar el nombre de los puntos que
   * faltan dentro de su bloque convierte «56 %» en «te falta el kit y el vocero»,
   * que es lo que de verdad se necesita saber para poder seguir.
   */
  readonly checklistBlocks = computed(() =>
    pressCompletenessByGroup(this.safe()).map(b => ({
      group: b.group,
      done: b.done,
      total: b.items.length,
      missing: b.items.filter(i => !i.done).slice(0, 4)
    })).filter(b => b.total > 0)
  );

  /** A qué pestaña lleva un bloque del checklist. */
  tabForGroup(group: string): PressDetailTab {
    switch (group) {
      case 'Acreditación': return 'acreditaciones';
      case 'Producción':
      case 'Talento': return 'produccion';
      default: return 'evento';
    }
  }

  coverageLabel(c: CoverageType): string {
    return COVERAGE_LABELS[c] || c;
  }

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
