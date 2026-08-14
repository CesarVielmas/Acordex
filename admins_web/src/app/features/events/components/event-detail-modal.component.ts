import { Component, Output, EventEmitter, input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EventItem, EventApproval, EventState, EventManagerAgreement, EventAgreementStatus,
  EventLineupSlot, LineupApprovalStatus, ArtistGreetingVideo, EventPostponement, EventManagerClosureConfirmation
} from '../../../core/models/event.models';
import { GroupItem } from '../../../core/models/admin.models';
import { eventStateMeta, eventEditPolicy } from '../../../core/models/event-state.meta';
import { RoleService } from '../../../core/services/role.service';
import { SessionService } from '../../../core/services/session.service';
import { ModalShellComponent } from '../../../shared/ui/modal-shell/modal-shell.component';
import { ProgressBarComponent } from '../../../shared/ui/progress-bar/progress-bar.component';
import { TabPillsComponent, TabPillItem } from '../../../shared/ui/tab-pills/tab-pills.component';
import { EditableFieldComponent } from '../../../shared/ui/editable-field/editable-field.component';
import { EventTabPublicComponent } from './detail/event-tab-public.component';
import { EventTabLineupComponent } from './detail/event-tab-lineup.component';
import { EventTabProductionComponent } from './detail/event-tab-production.component';
import { EventTabTicketsComponent } from './detail/event-tab-tickets.component';
import { EventTabClosureComponent } from './detail/event-tab-closure.component';
import { EventTabTasksComponent } from './detail/event-tab-tasks.component';
import { EventTabActivityComponent } from './detail/event-tab-activity.component';
import { CroquisEditorComponent } from '../croquis/components/croquis-editor.component';
import { croquisCapacity } from '../croquis/croquis-metrics';
import { managerWorkloads, ManagerWorkload, resolveTasks, ResolvedTask } from '../event-tasks';
import { CompletenessItem, completenessByGroup, eventCompleteness } from '../event-completeness';
import {
  isStaleUnpublished,
  salesAreClosed,
  allManagersConfirmedClosure,
  allReviewApprovalsResolved,
  approvals,
  approvedCount,
  availableSeats,
  currentReviewRound,
  dateTimeLabel,
  evaluatePublishReadiness,
  grossTicketRevenue,
  hasRejection,
  isClosureComplete,
  isEventCreator,
  isFullyApproved,
  lineup,
  lineupTotalCost,
  money,
  netResult,
  occupancyPercent,
  paidPayouts,
  participatingManagers,
  pendingApprovals,
  pendingOutboundCount,
  potentialTicketRevenue,
  productionCost,
  publicProfile,
  shortDate,
  slotEngagement,
  slotOfferAmount,
  soldSeats,
  totalExpenses,
  totalPayouts,
  totalSeats,
  unsentLineupRequests,
  unsentResponsibilities
} from '../event-metrics';

export type EventDetailTab =
  | 'resumen' | 'evento' | 'cartel' | 'produccion' | 'boletaje'
  | 'tareas' | 'acuerdos' | 'revision' | 'venta' | 'cierre' | 'trazabilidad';

/**
 * Expediente del evento.
 *
 * Muestra toda la información del evento organizada en pestañas claras:
 * Resumen, Cartel & Difusión (unificando la ficha pública y el cartel de grupos),
 * Producción, Boletaje & Croquis, Revisión, Venta, Cierre y Trazabilidad.
 */
@Component({
  selector: 'app-event-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalShellComponent,
    ProgressBarComponent,
    TabPillsComponent,
    EditableFieldComponent,
    EventTabPublicComponent,
    EventTabLineupComponent,
    EventTabProductionComponent,
    EventTabTicketsComponent,
    EventTabClosureComponent,
    EventTabTasksComponent,
    EventTabActivityComponent,
    CroquisEditorComponent
  ],
  template: `
    @if (event(); as e) {
      <app-modal-shell
        [title]="e.title"
        [subtitle]="e.venue + ', ' + e.location + ' · ' + dateLabel()"
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
                        <span class="material-symbols-outlined text-[13px]">person</span>
                        <strong class="text-on-surface font-bold">{{ e.createdBy }}</strong>
                      </span>
                      <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-highest/60 border border-outline-variant/25 text-outline">
                        <span class="material-symbols-outlined text-[13px]">groups</span>
                        <strong class="text-primary font-bold">{{ slots().length }}</strong> en cartel
                      </span>
                      <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-highest/60 border border-outline-variant/25 text-outline">
                        <span class="material-symbols-outlined text-[13px]">event_seat</span>
                        Aforo <strong class="text-on-surface font-mono font-bold">{{ seats().toLocaleString('es-MX') }}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <span [class]="meta().badgeClass" class="px-4 py-2 rounded-2xl text-xs font-black border shadow-lg shrink-0 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-current animate-pulse"></span>
                  {{ e.state }}
                </span>
              </div>

              <p class="text-xs text-on-surface-variant leading-relaxed max-w-4xl">{{ meta().meaning }}</p>

              <!-- El calendario contra el estado. Son las dos formas de que un
                   evento se muera en silencio: la venta cerró y nadie se enteró,
                   o se le pasó la fecha sin llegar a publicarse y se quedó
                   flotando en su fase para siempre sin salir en ninguna alarma. -->
              @if (staleUnpublished()) {
                <div class="p-4 rounded-2xl bg-rose-500/12 border border-rose-500/40 flex items-start gap-3">
                  <span class="material-symbols-outlined text-lg text-rose-400 shrink-0">event_busy</span>
                  <div class="space-y-1 min-w-0">
                    <p class="text-xs font-black text-rose-200">La fecha del evento ya pasó y nunca se publicó</p>
                    <p class="text-[11px] text-rose-100/90 leading-relaxed">
                      Estaba para el {{ e.date }} y sigue en {{ e.state }}. No se concluye solo —no llegó a ocurrir— ni
                      se cancela solo, porque eso lo decide alguien. Cancélalo para cerrarlo con su motivo, o cámbiale
                      la fecha si de verdad se va a hacer.
                    </p>
                  </div>
                </div>
              }

              @if (salesClosed()) {
                <div class="p-4 rounded-2xl bg-amber-500/12 border border-amber-500/35 flex items-start gap-3">
                  <span class="material-symbols-outlined text-lg text-amber-400 shrink-0">local_activity</span>
                  <div class="space-y-1 min-w-0">
                    <p class="text-xs font-black text-amber-200">La venta anticipada ya cerró</p>
                    <p class="text-[11px] text-amber-100/90 leading-relaxed">
                      {{ salesCloseLabel(e) }}. Lo que se venda a partir de aquí es taquilla en puerta.
                    </p>
                  </div>
                </div>
              }

              <!-- La regla aditiva, dicha en positivo. El aviso de la fase la
                   explica en prosa, pero al llegar a Cartel o Boletaje lo que
                   hace falta es saber de un vistazo qué sí y qué no. -->
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
                        Sustituir un grupo que se cayó · abrir zonas o lugares nuevos · corregir textos de la ficha
                      </p>
                    </div>
                    <div class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1">
                      <span class="font-black text-rose-300 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[13px]">block</span> No puedes
                      </span>
                      <p class="text-rose-100/90 leading-snug">
                        Borrar butacas vendidas o apartadas · cambiar fecha o recinto (usa Posponer)
                      </p>
                    </div>
                  </div>
                  @if (sold() > 0) {
                    <p class="text-[10px] text-outline">
                      {{ sold().toLocaleString('es-MX') }} asiento(s) con dueño quedan protegidos: el croquis no deja quitarlos.
                    </p>
                  }
                </div>
              }

              @if (policy().warning) {
                <div class="text-xs p-3.5 rounded-2xl flex items-start gap-2.5 backdrop-blur-md shadow-inner"
                   [class]="e.state === 'En Venta' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200' : 'bg-surface-container/80 border border-outline-variant/30 text-outline'">
                  <span class="material-symbols-outlined text-lg shrink-0 mt-0.5" [class.text-amber-400]="e.state === 'En Venta'">{{ e.state === 'En Venta' ? 'lock' : 'info' }}</span>
                  <span class="font-medium leading-normal">{{ policy().warning }}</span>
                </div>
              }

              <!-- ─── LÍNEA DE FASES ─── -->
              @if (isCancelled()) {
                <div class="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs shadow-inner">
                  <span class="material-symbols-outlined text-lg shrink-0">cancel</span>
                  <span class="font-bold">Este evento salió del flujo: fue cancelado y ya no avanza por las fases.</span>
                </div>
              } @else {
                <div class="pt-4 border-t border-outline-variant/20">
                  <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-sm text-primary">timeline</span>
                      <span class="text-[10px] font-black uppercase tracking-widest text-on-surface">Ruta del evento</span>
                    </div>
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline">
                      Fase <strong class="text-primary font-mono">{{ currentStep() }}</strong> de {{ phaseSteps().length }}
                      · faltan <strong class="text-on-surface font-mono">{{ phaseSteps().length - currentStep() }}</strong>
                    </span>
                  </div>

                  <div class="relative pt-1.5">
                    <!-- Riel: va de centro a centro del primer y último nodo.
                         Se ancla al centro real del nodo —6px de relleno
                         superior más la mitad de sus 34px— y se centra por
                         transformación, en vez de con un desplazamiento
                         calculado a ojo: así la línea sale por la mitad del
                         círculo y no por el tercio de abajo, que es lo que la
                         hacía verse metida dentro del ícono. -->
                    <div
                      class="absolute top-[23px] -translate-y-1/2 h-[3px] rounded-full bg-surface-container-highest/80"
                      [style.left.%]="phaseTrackInset()"
                      [style.right.%]="phaseTrackInset()"
                    ></div>
                    <!-- Tramo recorrido -->
                    <div
                      class="absolute top-[23px] -translate-y-1/2 h-[3px] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.55)] transition-all duration-500"
                      [style.left.%]="phaseTrackInset()"
                      [style.width]="'calc((100% - ' + (2 * phaseTrackInset()) + '%) * ' + (phaseProgressPercent() / 100) + ')'"
                    ></div>

                    <ol class="relative flex items-start">
                      @for (p of phaseSteps(); track p.state) {
                        <li class="flex-1 min-w-0 flex flex-col items-center gap-2 text-center px-0.5">
                          <!-- Nodo -->
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

                          <!-- Etiqueta -->
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

          <!-- ─── PESTAÑAS ─── -->
          <!-- El pt-4 extra separa la fase (arriba) de sus apartados (abajo):
               sin él se leen como un mismo bloque y cuesta ver dónde termina
               el estado del evento y dónde empieza la navegación. -->
          <div class="pt-4">
            <p class="text-[10px] font-black uppercase tracking-widest text-outline mb-2.5 pl-1">
              Apartados del expediente
            </p>
            <app-tab-pills [tabs]="tabs()" [active]="activeTab()" (change)="activeTab.set($any($event))" />
          </div>

          <!-- ─── RESUMEN ─── -->
          @if (activeTab() === 'resumen') {
            <div class="space-y-6">

              <!-- ─── VISTA: BORRADOR Y EN REVISIÓN ─── -->
              @if (e.state === 'Borrador' || e.state === 'En Revisión') {

                <!-- En Revisión: Panel de Estado de Aprobaciones y Solicitudes -->
                @if (e.state === 'En Revisión') {
                  <section class="p-6 rounded-3xl bg-gradient-to-br from-amber-500/[0.08] via-surface-container-high/90 to-surface-container-high/90 border border-amber-500/30 border-l-4 border-l-amber-500 shadow-2xl space-y-4 backdrop-blur-2xl">
                    <div class="flex items-center justify-between gap-3 flex-wrap">
                      <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-black shadow-lg">
                          <span class="material-symbols-outlined text-2xl font-bold">how_to_reg</span>
                        </div>
                        <div>
                          <h5 class="text-xs font-black uppercase tracking-wider text-on-surface">Estado de Aprobaciones & Solicitudes de Ronda</h5>
                          <p class="text-xs text-outline font-medium">Requisito indispensable para habilitar la publicación del evento</p>
                        </div>
                      </div>

                      <span class="px-4 py-2 rounded-2xl text-xs font-mono font-black border shadow-lg backdrop-blur-md flex items-center gap-2"
                        [class]="publishReadiness().canPublish
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10'"
                      >
                        <span class="w-2.5 h-2.5 rounded-full" [class]="publishReadiness().canPublish ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
                        {{ publishReadiness().canPublish ? 'Listo para Publicar' : publishReadiness().pendingRequestsCount + ' solicitud(es) por resolver' }}
                      </span>
                    </div>

                    @if (!publishReadiness().canPublish) {
                      <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1 text-xs text-amber-200">
                        <strong class="font-bold flex items-center gap-1.5 text-amber-300">
                          <span class="material-symbols-outlined text-sm">lock</span> Publicación bloqueada temporalmente:
                        </strong>
                        <ul class="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
                          @for (reason of publishReadiness().missingRequirements; track reason) {
                            <li>{{ reason }}</li>
                          }
                        </ul>
                      </div>
                    } @else {
                      <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-300">
                        <span class="material-symbols-outlined text-base">verified</span>
                        <span>Todas las tareas obligatorias y solicitudes han sido resueltas de conformidad. El botón <strong>Publicar</strong> está habilitado.</span>
                      </div>
                    }

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                        <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Aprobaciones de Cartel</span>
                        <span class="text-sm font-black font-mono" [class]="pendingApprovals(e).length ? 'text-amber-400' : 'text-emerald-400'">
                          {{ approvedTotal() }} de {{ approvalList().length }}
                        </span>
                      </div>
                      <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                        <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Co-organización</span>
                        <span class="text-sm font-black font-mono text-teal-300">
                          {{ agreements().length }} manager(s)
                        </span>
                      </div>
                      <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                        <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Puntos Obligatorios</span>
                        <span class="text-sm font-black font-mono" [class]="report().missingRequired.length ? 'text-rose-400' : 'text-emerald-400'">
                          {{ report().doneCount }}/{{ report().totalCount }}
                        </span>
                      </div>
                      <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                        <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Ronda Vigente</span>
                        <span class="text-sm font-black font-mono text-primary">
                          Ronda {{ reviewRoundsCount() }}
                        </span>
                      </div>
                    </div>
                  </section>
                }

                <!-- Avance de captura (Checklist de 33 puntos) -->
                <section class="p-6 rounded-3xl bg-gradient-to-br from-sky-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-sky-500/25 border-l-4 border-l-sky-500/70 shadow-2xl shadow-sky-500/5 space-y-5 backdrop-blur-2xl relative overflow-hidden">
                  <div class="absolute -left-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                  <div class="flex items-center justify-between gap-3 flex-wrap relative z-10">
                    <div class="flex items-center gap-3">
                      <div class="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black shadow-lg shadow-amber-500/10">
                        <span class="material-symbols-outlined text-2xl font-bold">checklist</span>
                      </div>
                      <div>
                        <h5 class="text-xs font-black uppercase tracking-wider text-on-surface">Información Requerida para Publicar</h5>
                        <p class="text-xs text-outline font-medium">Estado general de completitud del expediente</p>
                      </div>
                    </div>

                    <span class="px-4 py-2 rounded-2xl text-xs font-mono font-black border shadow-lg backdrop-blur-md flex items-center gap-2"
                      [class]="report().canSubmitForReview
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10'"
                    >
                      <span class="w-2.5 h-2.5 rounded-full" [class]="report().canSubmitForReview ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
                      {{ report().doneCount }} de {{ report().totalCount }} puntos completados ({{ report().percent }}%)
                    </span>
                  </div>

                  <app-progress-bar
                    [percent]="report().percent"
                    [colorVariant]="report().canSubmitForReview ? 'success' : 'warning'"
                  />

                  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 relative z-10">
                    @for (block of checklist(); track block.group) {
                      @let meta = groupColorClass(block.group);
                      <div class="p-4 rounded-3xl bg-surface-container/70 border border-outline-variant/25 {{ meta.border }} space-y-3.5 backdrop-blur-md shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden group">
                        <div class="absolute -right-8 -top-8 w-28 h-28 bg-gradient-to-br {{ meta.bg }} rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity"></div>

                        <!-- Header de la tarjeta -->
                        <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-outline-variant/15 relative z-10">
                          <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border {{ meta.badge }} shadow-md">
                              <span class="material-symbols-outlined text-base font-bold">{{ groupIcon(block.group) }}</span>
                            </div>
                            <div class="min-w-0">
                              <h6 class="text-xs font-black uppercase tracking-wider text-on-surface truncate">{{ block.group }}</h6>
                              <p class="text-[10px] text-outline font-mono">
                                {{ block.done }} de {{ block.items.length }} avance
                              </p>
                            </div>
                          </div>

                          <span
                            class="px-2.5 py-1 rounded-xl text-[10px] font-mono font-black border shadow-sm shrink-0"
                            [class]="block.done === block.items.length
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'"
                          >
                            {{ block.done === block.items.length ? '100% LISTO' : (roundPercent(block.done, block.items.length) + '%') }}
                          </span>
                        </div>

                        <!-- Lista de items -->
                        <ul class="space-y-2 relative z-10">
                          @for (item of block.items; track item.id) {
                            <li
                              [title]="itemTooltip(item)"
                              class="p-2.5 rounded-2xl border transition-all duration-200 cursor-help"
                              [class]="item.done
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-on-surface'
                                : (item.required
                                  ? (e.state === 'En Revisión' ? 'bg-rose-500/15 border-rose-500/40 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.18)]' : 'bg-rose-500/10 border-rose-500/30 text-rose-100 shadow-[0_0_10px_rgba(244,63,94,0.12)]')
                                  : 'bg-surface-container/50 border-outline-variant/15 text-outline')"
                            >
                              <div class="flex items-start gap-2.5">
                                <div
                                  class="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                                  [class]="item.done
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : (item.required
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                      : 'bg-surface-container-highest/60 text-outline border border-outline-variant/30')"
                                >
                                  <span class="material-symbols-outlined text-xs font-black">
                                    {{ item.done ? 'check' : (item.required ? 'exclamation' : 'remove') }}
                                  </span>
                                </div>

                                <div class="min-w-0 flex-1">
                                  <div class="flex items-center justify-between gap-1.5">
                                    <span
                                      class="text-[11px] leading-tight"
                                      [class]="item.done ? 'text-on-surface-variant font-semibold' : 'text-on-surface font-bold'"
                                    >
                                      {{ item.label }}
                                    </span>

                                    @if (item.required && !item.done) {
                                      <span class="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-rose-500/25 text-rose-300 border border-rose-400/40 shrink-0">
                                        {{ e.state === 'En Revisión' ? 'Falta para publicar' : 'Requerido' }}
                                      </span>
                                    }
                                  </div>

                                  @if (!item.done && item.hint) {
                                    <p class="text-[10px] text-outline mt-0.5 leading-snug">
                                      {{ item.hint }}
                                    </p>
                                  }

                                  @if (!item.done && !isOwnItem(item)) {
                                    <div class="flex items-center gap-1 flex-wrap mt-1">
                                      @for (owner of foreignOwners(item); track owner) {
                                        <span class="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                                          <span class="material-symbols-outlined text-[10px]">hourglass_top</span>
                                          Depende de {{ owner }}
                                        </span>
                                      }
                                    </div>
                                  }
                                </div>
                              </div>
                            </li>
                          }
                        </ul>
                      </div>
                    }
                  </div>
                </section>

                <!-- Quién resuelve lo que falta -->
                @if (report().missingRequired.length) {
                  <section class="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-indigo-500/25 border-l-4 border-l-indigo-500/70 shadow-2xl space-y-4 backdrop-blur-2xl">
                    <div class="flex items-center justify-between gap-3 flex-wrap">
                      <h5 class="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2.5">
                        <span class="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center justify-center material-symbols-outlined text-lg">assignment_ind</span>
                        <span>Quién resuelve lo que falta</span>
                      </h5>
                      <span class="px-3 py-1.5 rounded-xl text-[11px] font-black border"
                        [class]="report().allPendingAreOwn
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'">
                        {{ report().allPendingAreOwn ? 'Todo está en tus manos' : 'Hay pendientes de otros managers' }}
                      </span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      @for (block of report().pendingByOwner; track block.owner) {
                        <div class="p-4 rounded-2xl border space-y-2.5"
                          [class]="block.isOrganizer
                            ? 'bg-surface-container/70 border-outline-variant/25'
                            : 'bg-sky-500/[0.07] border-sky-500/30'">
                          <div class="flex items-center justify-between gap-2 flex-wrap">
                            <div class="flex items-center gap-2.5 min-w-0">
                              <span class="w-8 h-8 rounded-xl border flex items-center justify-center material-symbols-outlined text-base shrink-0"
                                [class]="block.isOrganizer
                                  ? 'bg-primary/15 border-primary/30 text-primary'
                                  : 'bg-sky-500/15 border-sky-500/30 text-sky-300'">
                                {{ block.isOrganizer ? 'person' : 'group' }}
                              </span>
                              <div class="min-w-0">
                                <p class="text-xs font-black text-on-surface truncate">
                                  {{ block.owner }}{{ block.isOrganizer ? ' (tú)' : '' }}
                                </p>
                                <p class="text-[10px] text-outline">
                                  {{ block.isOrganizer ? 'Organizador del evento' : ownerRoleLabel(block.owner) }}
                                </p>
                              </div>
                            </div>
                            <span class="px-2.5 py-1 rounded-xl text-[10px] font-mono font-black border shrink-0"
                              [class]="block.isOrganizer
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-sky-500/15 text-sky-300 border-sky-500/30'">
                              {{ block.items.length }} pendiente(s)
                            </span>
                          </div>

                          <ul class="space-y-1 pt-1 border-t border-outline-variant/15">
                            @for (item of block.items; track item.id) {
                              <li class="text-[11px] text-on-surface-variant flex items-start gap-1.5">
                                <span class="material-symbols-outlined text-[12px] shrink-0 mt-0.5 text-outline">chevron_right</span>
                                <span>{{ item.label }}</span>
                              </li>
                            }
                          </ul>
                        </div>
                      }
                    </div>
                  </section>
                }

                <!-- Quién carga con qué -->
                @if (workloads().length) {
                  <section class="p-6 rounded-3xl bg-gradient-to-br from-teal-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-teal-500/25 border-l-4 border-l-teal-500/70 shadow-2xl space-y-4 backdrop-blur-2xl">
                    <div class="flex items-center justify-between gap-3 flex-wrap">
                      <h5 class="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-2.5">
                        <span class="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center material-symbols-outlined text-lg">groups</span>
                        <span>Quién carga con qué</span>
                      </h5>
                      <button
                        type="button"
                        (click)="activeTab.set('tareas')"
                        class="px-3 py-1.5 rounded-xl bg-teal-500/15 text-teal-200 border border-teal-500/30 hover:bg-teal-500 hover:text-black text-[10px] font-black transition-all flex items-center gap-1.5"
                      >
                        <span class="material-symbols-outlined text-[13px]">open_in_new</span> Abrir Tareas
                      </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      @for (w of workloads(); track w.manager) {
                        <div class="p-4 rounded-2xl border space-y-3"
                          [class]="w.isOrganizer
                            ? 'bg-amber-500/[0.06] border-amber-500/30'
                            : 'bg-surface-container/70 border-outline-variant/25'">

                          <div class="flex items-start justify-between gap-2.5 pb-2.5 border-b border-outline-variant/15">
                            <div class="flex items-center gap-2.5 min-w-0">
                              <span class="w-9 h-9 rounded-xl border flex items-center justify-center material-symbols-outlined text-base shrink-0"
                                [class]="w.isOrganizer
                                  ? 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                                  : 'bg-sky-500/15 border-sky-500/30 text-sky-300'">
                                {{ w.isOrganizer ? 'stars' : 'business' }}
                              </span>
                              <div class="min-w-0">
                                <p class="text-xs font-black text-on-surface truncate">
                                  {{ w.manager }}{{ w.isOrganizer ? ' · organiza' : '' }}
                                </p>
                                <p class="text-[10px] text-outline">
                                  {{ w.required.length + w.optional.length }} responsabilidad(es)
                                </p>
                              </div>
                            </div>
                          </div>

                          <div class="grid grid-cols-3 gap-2">
                            <div class="p-2.5 rounded-xl bg-black/25 border border-white/5 text-center">
                              <div class="text-base font-black font-mono text-sky-300">
                                {{ w.requiredDone }}/{{ w.required.length }}
                              </div>
                              <span class="text-[9px] font-bold uppercase tracking-wider text-outline">Expediente</span>
                            </div>
                            <div class="p-2.5 rounded-xl bg-black/25 border border-white/5 text-center">
                              <div class="text-base font-black font-mono text-amber-300">
                                {{ w.optionalDone }}/{{ w.optional.length }}
                              </div>
                              <span class="text-[9px] font-bold uppercase tracking-wider text-outline">Encargos</span>
                            </div>
                            <div class="p-2.5 rounded-xl bg-black/25 border border-white/5 text-center">
                              <div class="text-base font-black font-mono text-violet-300">{{ money(w.spend) }}</div>
                              <span class="text-[9px] font-bold uppercase tracking-wider text-outline">Gasto</span>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </section>
                }

              } @else if (e.state === 'Próximo a Publicar' || e.state === 'Publicado' || e.state === 'En Venta') {

                <!-- ─── VISTA: EN CARTELERA & VENTA EN VIVO ─── -->

                <!-- Alerta de postergación de fecha si aplica -->
                @if (e.activePostponement; as post) {
                  <section class="p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 shadow-xl space-y-2">
                    <div class="flex items-center justify-between gap-3">
                      <h5 class="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                        <span class="material-symbols-outlined text-lg">event_repeat</span>
                        Evento Reprogramado
                      </h5>
                      <span class="px-2.5 py-0.5 rounded-lg bg-amber-500/25 text-amber-200 text-[10px] font-bold">
                        Nueva fecha: {{ post.newDate }}
                      </span>
                    </div>
                    <p class="text-xs text-amber-100/90"><strong>Motivo:</strong> {{ post.reason }}</p>
                    <p class="text-[11px] text-amber-200/80">{{ post.clientNotice }}</p>
                  </section>
                }

                <!-- Tablero Operativo de Venta y Cartelera -->
                <section class="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/[0.08] via-surface-container-high/90 to-surface-container-high/90 border border-emerald-500/30 border-l-4 border-l-emerald-400 shadow-2xl space-y-5 backdrop-blur-2xl">
                  <div class="flex items-center justify-between gap-3 flex-wrap">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-lg">
                        <span class="material-symbols-outlined text-2xl font-bold">point_of_sale</span>
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <h5 class="text-sm font-black uppercase tracking-wider text-on-surface">
                            {{ e.state === 'Publicado' ? 'Evento Publicado en Cartelera' : (e.state === 'Próximo a Publicar' ? 'Publicación Automática Programada' : 'Taquilla Activa con Asientos Asignados') }}
                          </h5>
                          <span class="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border"
                            [class]="e.state === 'En Venta' ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40' : (e.state === 'Publicado' ? 'bg-blue-500/25 text-blue-300 border-blue-500/40' : 'bg-cyan-500/25 text-cyan-300 border-cyan-500/40')">
                            {{ e.state }}
                          </span>
                        </div>
                        <p class="text-xs text-outline font-medium mt-0.5">
                          {{ e.state === 'Publicado' ? 'Los clientes pueden ver el evento. Al registrarse 1 venta pasará automáticamente a En Venta.' : (e.state === 'Próximo a Publicar' ? 'El evento permanece privado hasta la fecha programada.' : 'Precios y butacas están bloqueados.') }}
                        </p>
                      </div>
                    </div>

                    <!-- Aquí no van botones de acción. Posponer, devolver a
                         revisión, publicar y concluir viven en la barra de
                         abajo, que está siempre a la vista: tenerlos también en
                         este banner era el mismo botón dos veces en la misma
                         pantalla, y ya había empezado a desviarse —el de
                         publicar de aquí no comprobaba nada—. -->
                    <p class="text-[11px] text-outline flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[13px]">south</span>
                      Las acciones de esta fase están en la barra inferior.
                    </p>
                  </div>

                  <!-- Ficha de publicación. Vivía en una pestaña aparte junto a
                       cifras que ya estaban en Boletaje; aquí acompaña al banner
                       que cuenta en qué fase está el evento, que es donde uno
                       pregunta "¿desde cuándo está publicado y quién lo sacó?". -->
                  @if (e.publication; as pub) {
                    <div class="p-4 rounded-2xl bg-black/25 border border-white/10 space-y-2">
                      <span class="text-[10px] font-black uppercase tracking-widest text-outline flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">campaign</span> Publicación
                      </span>
                      @if (pub.publishedAt) {
                        <p class="text-[11px] text-on-surface-variant">
                          Publicado el <strong class="text-on-surface">{{ dateTimeLabel(pub.publishedAt) }}</strong>
                          @if (pub.publishedBy) { por {{ pub.publishedBy }} }
                        </p>
                      }
                      @if (pub.scheduledAt) {
                        <p class="text-[11px] text-cyan-200">
                          Programada para <strong>{{ dateTimeLabel(pub.scheduledAt) }}</strong>
                        </p>
                      }
                      @if (pub.channels?.length) {
                        <div class="flex items-center gap-1.5 flex-wrap pt-1">
                          @for (channel of pub.channels; track channel) {
                            <span class="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-outline">
                              {{ channel }}
                            </span>
                          }
                        </div>
                      }
                    </div>
                  }

                  @if (e.sales?.dailySales?.length) {
                    <div class="p-4 rounded-2xl bg-black/25 border border-white/10 space-y-2">
                      <span class="text-[10px] font-black uppercase tracking-widest text-outline flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">calendar_month</span> Últimos días de venta
                      </span>
                      @for (day of e.sales?.dailySales; track day.date) {
                        <div class="flex items-center justify-between gap-2 text-[11px] px-2.5 py-1.5 rounded-xl bg-white/[0.03]">
                          <span class="text-outline">{{ day.dayLabel }} · {{ day.date }}</span>
                          <span class="text-on-surface font-bold">
                            {{ day.tickets }} boletos
                            @if (roleService.canViewFinances()) { · &#36;{{ day.revenue | number:'1.0-0' }} }
                          </span>
                        </div>
                      }
                    </div>
                  }

                  <!-- Métricas de Venta en Tiempo Real -->
                  <div class="grid grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Aforo Total</span>
                      <span class="text-xl font-black font-mono text-on-surface">{{ seats().toLocaleString('es-MX') }}</span>
                      <span class="text-[10px] text-outline block">Lugares vendibles</span>
                    </div>

                    <div class="p-4 rounded-2xl bg-surface-container border border-emerald-500/30 space-y-1">
                      <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">Boletos Vendidos</span>
                      <span class="text-xl font-black font-mono text-emerald-400">{{ sold().toLocaleString('es-MX') }}</span>
                      <span class="text-[10px] text-emerald-300/80 block">{{ occupancy() }}% ocupación</span>
                    </div>

                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Disponibles</span>
                      <span class="text-xl font-black font-mono text-cyan-300">{{ available().toLocaleString('es-MX') }}</span>
                      <span class="text-[10px] text-outline block">Por vender</span>
                    </div>

                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Taquilla Cobrada</span>
                      <span class="text-xl font-black font-mono text-emerald-300">{{ collected() }}</span>
                      <span class="text-[10px] text-outline block">Ingreso bruto</span>
                    </div>

                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Potencial 100%</span>
                      <span class="text-xl font-black font-mono text-on-surface-variant">{{ potential() }}</span>
                      <span class="text-[10px] text-outline block">Lleno total</span>
                    </div>
                  </div>

                  <!-- Desglose de Categorías de Boletos -->
                  <div class="space-y-2.5 pt-2 border-t border-outline-variant/20">
                    <h6 class="text-xs font-black uppercase tracking-wider text-on-surface">Avance por Categoría de Boleto</h6>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      @for (tier of e.ticketTiers; track tier.id || tier.name) {
                        <div class="p-3.5 rounded-2xl bg-surface-container/70 border border-outline-variant/20 space-y-2">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-xs font-bold text-on-surface truncate">{{ tier.name }}</span>
                            <span class="text-xs font-mono font-black text-emerald-400">{{ money(tier.price) }}</span>
                          </div>
                          <app-progress-bar
                            [percent]="tierPercent(tier.soldSeats, tier.totalSeats)"
                            [valueLabel]="(tier.soldSeats || 0) + ' de ' + tier.totalSeats + ' vendidos'"
                            colorVariant="success"
                          />
                        </div>
                      }
                    </div>
                  </div>
                </section>

                <!-- Expediente 100% Verificado -->
                <section class="p-5 rounded-3xl bg-surface-container/70 border border-outline-variant/25 flex items-center justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                      <span class="material-symbols-outlined text-xl">verified</span>
                    </span>
                    <div>
                      <p class="text-xs font-black text-on-surface">Expediente Verificado y Completo (33/33 puntos)</p>
                      <p class="text-[11px] text-outline">Identidad, Cartel de Artistas, Audio y Boletaje validados.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    (click)="activeTab.set('evento')"
                    class="px-3.5 py-2 rounded-xl bg-surface-container-highest text-on-surface hover:bg-surface-bright text-xs font-bold transition-all border border-outline-variant/30 flex items-center gap-1.5"
                  >
                    <span class="material-symbols-outlined text-sm">visibility</span> Ver Ficha del Evento
                  </button>
                </section>

              } @else if (e.state === 'Finalizada') {

                <!-- ─── VISTA: FINALIZADA (RESULTADOS & LIQUIDACIÓN) ─── -->
                <section class="p-6 rounded-3xl bg-gradient-to-br from-purple-500/[0.08] via-surface-container-high/90 to-surface-container-high/90 border border-purple-500/30 border-l-4 border-l-purple-400 shadow-2xl space-y-5 backdrop-blur-2xl">
                  <div class="flex items-center justify-between gap-3 flex-wrap">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shadow-lg">
                        <span class="material-symbols-outlined text-2xl font-bold">fact_check</span>
                      </div>
                      <div>
                        <h5 class="text-sm font-black uppercase tracking-wider text-on-surface">Evento Realizado · Balance Financiero & Finiquitos</h5>
                        <p class="text-xs text-outline font-medium mt-0.5">Captura de resultados finales, liquidación de pagos y visto bueno de los managers</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      (click)="activeTab.set('cierre')"
                      class="px-4 py-2 rounded-xl bg-purple-500 text-white font-black text-xs hover:bg-purple-600 transition-all flex items-center gap-1.5 shadow-lg"
                    >
                      <span class="material-symbols-outlined text-sm">edit_note</span> Abrir Pestaña de Cierre
                    </button>
                  </div>

                  <!-- Métricas de Cierre -->
                  <div class="grid grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Asistencia Real</span>
                      <span class="text-xl font-black font-mono text-on-surface">{{ (e.closure?.attendance || sold()).toLocaleString('es-MX') }}</span>
                      <span class="text-[10px] text-outline block">Personas en recinto</span>
                    </div>

                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Taquilla Cobrada</span>
                      <span class="text-xl font-black font-mono text-emerald-300">{{ money(e.closure?.grossRevenue || grossRevenue(e)) }}</span>
                      <span class="text-[10px] text-outline block">Ingreso bruto final</span>
                    </div>

                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Gastos Producción</span>
                      <span class="text-xl font-black font-mono text-rose-300">{{ money(closureExpensesTotal(e)) }}</span>
                      <span class="text-[10px] text-outline block">Recinto + Staff + Sonido</span>
                    </div>

                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Pagos a Grupos</span>
                      <span class="text-xl font-black font-mono text-amber-300">{{ money(closurePayoutsTotal(e)) }}</span>
                      <span class="text-[10px] text-outline block">Honorarios pactados</span>
                    </div>

                    <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Utilidad Neta</span>
                      <span class="text-xl font-black font-mono" [class]="closureNetResult(e) >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                        {{ money(closureNetResult(e)) }}
                      </span>
                      <span class="text-[10px] text-outline block">A repartir</span>
                    </div>
                  </div>

                  <!-- Panel de Confirmación de Managers -->
                  <div class="p-4 rounded-2xl bg-surface-container/80 border border-outline-variant/25 space-y-3">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <h6 class="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm">draw</span> Firmas de Conformidad de Managers
                      </h6>
                      <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black border"
                        [class]="allManagersConfirmed() ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'">
                        {{ closureConfirmationsCount(e) }} de {{ managers().length }} confirmados
                      </span>
                    </div>

                    <p class="text-[11px] text-outline">
                      {{ managers().length > 1 ? 'Co-organización: Todos los managers participantes deben confirmar su finiquito antes de sellar el expediente.' : 'Organizador único: se sella directamente al completar los datos de cierre.' }}
                    </p>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      @for (m of managers(); track m) {
                        @let conf = managerConfirmationOf(e, m);
                        <div class="p-3 rounded-xl bg-surface-container-highest/50 border flex items-center justify-between gap-2"
                          [class]="conf ? 'border-emerald-500/30 text-emerald-200' : 'border-outline-variant/25 text-outline'">
                          <div class="min-w-0">
                            <span class="text-xs font-black block text-on-surface truncate">{{ m }}</span>
                            <span class="text-[10px] block">{{ conf ? ('Firmado: ' + conf.confirmedAt) : 'Pendiente de confirmación' }}</span>
                          </div>
                          @if (conf) {
                            <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">✓ Firmado</span>
                          } @else {
                            <button
                              type="button"
                              (click)="confirmManagerClosureAction(e, m)"
                              class="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-200 hover:bg-teal-500 hover:text-black text-[10px] font-black transition-all border border-teal-500/30 shrink-0"
                            >
                              Firmar
                            </button>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </section>

              } @else if (e.state === 'Cerrado') {

                <!-- ─── VISTA: EXPEDIENTE CERRADO & SELLADO ─── -->
                <section class="p-6 rounded-3xl bg-gradient-to-br from-zinc-500/[0.08] via-surface-container-high/90 to-surface-container-high/90 border border-zinc-500/30 border-l-4 border-l-zinc-400 shadow-2xl space-y-5 backdrop-blur-2xl text-center">
                  <div class="w-16 h-16 rounded-full bg-zinc-500/20 border-2 border-zinc-400 text-zinc-200 flex items-center justify-center mx-auto shadow-2xl">
                    <span class="material-symbols-outlined text-3xl font-bold">lock</span>
                  </div>
                  <div class="space-y-1">
                    <h4 class="text-base font-black uppercase tracking-wider text-on-surface">Acta de Cierre Sellada e Inmutable</h4>
                    <p class="text-xs text-outline max-w-lg mx-auto">
                      Sellado el {{ e.closure?.sealedAt || 'fecha registrada' }} por <strong>{{ e.closure?.sealedBy || 'Administración' }}</strong>.
                      Este expediente está archivado en modo de solo lectura y consulta histórica.
                    </p>
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
                    <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20">
                      <span class="text-[9px] font-black uppercase text-outline block">Asistencia</span>
                      <strong class="text-sm font-mono text-on-surface">{{ (e.closure?.attendance || sold()).toLocaleString('es-MX') }}</strong>
                    </div>
                    <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20">
                      <span class="text-[9px] font-black uppercase text-outline block">Taquilla</span>
                      <strong class="text-sm font-mono text-emerald-300">{{ money(e.closure?.grossRevenue || grossRevenue(e)) }}</strong>
                    </div>
                    <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20">
                      <span class="text-[9px] font-black uppercase text-outline block">Gastos & Pagos</span>
                      <strong class="text-sm font-mono text-amber-300">{{ money(closureExpensesTotal(e) + closurePayoutsTotal(e)) }}</strong>
                    </div>
                    <div class="p-3 rounded-2xl bg-surface-container border border-outline-variant/20">
                      <span class="text-[9px] font-black uppercase text-outline block">Utilidad Final</span>
                      <strong class="text-sm font-mono text-emerald-400">{{ money(closureNetResult(e)) }}</strong>
                    </div>
                  </div>
                </section>

              } @else if (e.state === 'Cancelado') {

                <!-- ─── VISTA: EVENTO CANCELADO ─── -->
                <section class="p-6 rounded-3xl bg-gradient-to-br from-rose-500/[0.1] via-surface-container-high/90 to-surface-container-high/90 border border-rose-500/30 border-l-4 border-l-rose-500 shadow-2xl space-y-4 backdrop-blur-2xl">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center shadow-lg shrink-0">
                      <span class="material-symbols-outlined text-2xl font-bold">cancel</span>
                    </div>
                    <div>
                      <h5 class="text-sm font-black uppercase tracking-wider text-rose-200">Evento Cancelado Definitivamente</h5>
                      <p class="text-xs text-rose-100/80 mt-0.5">
                        Cancelado el {{ dateTimeLabel(e.cancellation?.at) }} por <strong>{{ e.cancellation?.by }}</strong> (desde fase {{ e.cancellation?.cancelledFromState }}).
                      </p>
                    </div>
                  </div>

                  <div class="p-4 rounded-2xl bg-surface-container border border-rose-500/30 space-y-2 text-xs text-rose-100">
                    <p><strong>Motivo oficial de cancelación:</strong> {{ e.cancellation?.reason }}</p>
                    @if (e.cancellation?.clientMessage) {
                      <p class="text-[11px] text-outline"><strong>Aviso a clientes:</strong> {{ e.cancellation?.clientMessage }}</p>
                    }
                    @if ((e.cancellation?.refundsIssued || 0) > 0) {
                      <div class="pt-2 border-t border-rose-500/20 flex items-center gap-4 text-xs font-mono font-black text-rose-300">
                        <span>Reembolsos: {{ e.cancellation?.refundsIssued }} boletos</span>
                        <span>Monto devuelto: {{ money(e.cancellation?.refundedAmount || 0) }}</span>
                      </div>
                    }
                  </div>
                </section>

              }

              <!-- Cifras de un vistazo generales -->
              <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="p-5 rounded-3xl bg-gradient-to-br from-surface-container-high/90 to-surface-container/70 border border-outline-variant/30 shadow-xl backdrop-blur-xl space-y-1.5 hover:border-outline-variant/50 transition-all">
                  <div class="flex items-center justify-between text-outline">
                    <span class="text-[10px] font-black uppercase tracking-wider">Aforo a la venta</span>
                    <span class="material-symbols-outlined text-base text-primary">event_seat</span>
                  </div>
                  <span class="font-black text-on-surface text-xl sm:text-2xl block font-mono">{{ seats().toLocaleString('es-MX') }}</span>
                  <span class="text-[10px] text-outline block">Boletos totales disponibles</span>
                </div>

                <div class="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-surface-container-high/90 to-surface-container/70 border border-emerald-500/30 shadow-xl backdrop-blur-xl space-y-1.5 hover:border-emerald-500/50 transition-all">
                  <div class="flex items-center justify-between text-emerald-400">
                    <span class="text-[10px] font-black uppercase tracking-wider">Vendidos</span>
                    <span class="material-symbols-outlined text-base">confirmation_number</span>
                  </div>
                  <span class="font-black text-emerald-400 text-xl sm:text-2xl block font-mono">{{ sold().toLocaleString('es-MX') }} ({{ occupancy() }}%)</span>
                  <span class="text-[10px] text-emerald-300/80 block">Ocupación real confirmada</span>
                </div>

                @if (roleService.canViewFinances()) {
                  <div class="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-surface-container-high/90 to-surface-container/70 border border-amber-500/30 shadow-xl backdrop-blur-xl space-y-1.5 hover:border-amber-500/50 transition-all">
                    <div class="flex items-center justify-between text-amber-300">
                      <span class="text-[10px] font-black uppercase tracking-wider">Costo de producción</span>
                      <span class="material-symbols-outlined text-base">payments</span>
                    </div>
                    <span class="font-black text-amber-300 text-xl sm:text-2xl block font-mono">{{ production() }}</span>
                    <span class="text-[10px] text-amber-200/80 block">Alineación + audio y luces</span>
                  </div>

                  <div class="p-5 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-surface-container-high/90 to-surface-container/70 border border-cyan-500/30 shadow-xl backdrop-blur-xl space-y-1.5 hover:border-cyan-500/50 transition-all">
                    <div class="flex items-center justify-between text-cyan-300">
                      <span class="text-[10px] font-black uppercase tracking-wider">Taquilla potencial</span>
                      <span class="material-symbols-outlined text-base">point_of_sale</span>
                    </div>
                    <span class="font-black text-cyan-300 text-xl sm:text-2xl block font-mono">{{ potential() }}</span>
                    <span class="text-[10px] text-cyan-200/80 block">Ingreso 100% vendidos</span>
                  </div>
                }
              </section>

              <!-- Resumen de acuerdos -->
              <section class="p-6 rounded-3xl bg-gradient-to-br from-teal-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-teal-500/25 border-l-4 border-l-teal-500/70 shadow-2xl shadow-teal-500/5 space-y-4 backdrop-blur-2xl">
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <h5 class="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center material-symbols-outlined text-lg">handshake</span>
                    <span>Managers y reparto</span>
                  </h5>
                  <button
                    type="button"
                    (click)="activeTab.set('acuerdos')"
                    class="px-3 py-1.5 rounded-xl bg-teal-500/15 text-teal-200 border border-teal-500/30 hover:bg-teal-500 hover:text-black text-[11px] font-black transition-all flex items-center gap-1.5"
                  >
                    Ver acuerdos <span class="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  @for (a of agreements(); track a.id) {
                    <span class="px-3 py-1.5 rounded-xl bg-surface-container/70 border border-outline-variant/25 text-[11px] flex items-center gap-2">
                      <span class="material-symbols-outlined text-sm text-teal-300">{{ a.role === 'organizador' ? 'star' : 'group_add' }}</span>
                      <strong class="text-on-surface">{{ a.managerName }}</strong>
                      <span class="font-mono font-black"
                        [class]="a.settlementKind === 'porcentaje' ? 'text-emerald-300' : 'text-amber-300'">
                        {{ a.settlementKind === 'porcentaje' ? a.percent + '%' : money(a.fixedAmount || 0) }}
                      </span>
                      @if (a.status !== 'Aceptado') {
                        <span class="text-[9px] font-black uppercase tracking-wider"
                          [class]="a.status === 'Sin Enviar' ? 'text-outline' : 'text-amber-300'">
                          {{ agreementStatusLabel(a.status) }}
                        </span>
                      }
                    </span>
                  }
                </div>
              </section>

            </div>
          }

          <!-- ─── PESTAÑA UNIFICADA: EVENTO ─── -->
          @if (activeTab() === 'evento' || activeTab() === 'cartel') {
            <app-event-tab-public
              [event]="e"
              [canEdit]="policy().publicProfile"
              [canEditIdentity]="policy().identity"
              [canEditLineup]="policy().lineup"
              [canViewFinances]="roleService.canViewFinances()"
              [availableGroups]="availableGroups()"
              [showPreview]="showLivePreview()"
              (patch)="patch.emit($event)"
              (togglePreview)="showLivePreview.set($event)"
            />
          }

          <!-- ─── PRODUCCIÓN ─── -->
          @if (activeTab() === 'produccion') {
            <app-event-tab-production
              [event]="e"
              [canEdit]="policy().production"
              [canViewFinances]="roleService.canViewFinances()"
              (patch)="patch.emit($event)"
            />
          }

          <!-- ─── BOLETAJE ─── -->
          @if (activeTab() === 'boletaje') {
            <app-event-tab-tickets
              [event]="e"
              [canEdit]="policy().tickets"
              [canViewFinances]="roleService.canViewFinances()"
              (patch)="patch.emit($event)"
              (openEditor)="openCroquisEditor($event)"
            />
          }

          <!-- ─── TAREAS ─── -->
          @if (activeTab() === 'tareas') {
            <app-event-tab-tasks
              [event]="e"
              [canEdit]="roleService.canEditEvents()"
              [canViewFinances]="roleService.canViewFinances()"
              (navigateTab)="activeTab.set($event)"
              (patch)="patch.emit($event)"
            />
          }

          <!-- ─── ACUERDOS ─── -->
          @if (activeTab() === 'acuerdos') {
            <div class="space-y-6">

              <!-- Bandeja de salida del borrador. Todo lo que el organizador
                   decidió aquí sigue guardado: sale de una sola vez al enviar el
                   evento a revisión, no conforme se va armando. -->
              @if (isDraft() && outboundCount() > 0) {
                <section class="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-black/40 to-black/60 border border-amber-500/30 border-l-4 border-l-amber-500/70 shadow-[0_0_40px_rgba(245,158,11,0.15)] space-y-4 backdrop-blur-3xl">
                  <div class="flex items-center justify-between gap-3 flex-wrap">
                    <h5 class="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2.5">
                      <span class="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center material-symbols-outlined text-lg">outbox</span>
                      <span>Esperando el envío a revisión</span>
                    </h5>
                    <span class="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/40 text-[11px] font-black">
                      {{ outboundCount() }} por salir
                    </span>
                  </div>

                  <p class="text-[11px] text-outline leading-relaxed">
                    Mientras el evento sea borrador, ningún manager de fuera recibe nada. Puedes agregar grupos,
                    contraofertar y retirar invitaciones las veces que haga falta: todo sale junto al presionar
                    <strong class="text-on-surface">Enviar a Revisión</strong>.
                  </p>

                  <div class="space-y-2.5">
                    @for (a of unsentInvites(); track a.id) {
                      <div class="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between gap-3 flex-wrap backdrop-blur-md">
                        <div class="flex items-center gap-2.5 min-w-0">
                          <span class="material-symbols-outlined text-base text-sky-300 shrink-0">person_add</span>
                          <span class="text-[11px] text-on-surface-variant min-w-0">
                            Invitación a co-organizar para <strong class="text-on-surface">{{ a.managerName }}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          (click)="cancelInvitation(a)"
                          class="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all shrink-0 flex items-center gap-1"
                        >
                          <span class="material-symbols-outlined text-[13px]">undo</span> Retirar
                        </button>
                      </div>
                    }

                    @for (s of unsentRequests(); track s.id) {
                      <div class="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between gap-3 flex-wrap backdrop-blur-md">
                        <div class="flex items-center gap-2.5 min-w-0">
                          <span class="material-symbols-outlined text-base shrink-0"
                            [class]="engagementOf(s) === 'coorganizacion' ? 'text-sky-300' : 'text-amber-300'">
                            {{ engagementOf(s) === 'coorganizacion' ? 'handshake' : 'request_quote' }}
                          </span>
                          <span class="text-[11px] text-on-surface-variant min-w-0">
                            <strong class="text-on-surface">{{ s.groupName }}</strong>
                            @if (engagementOf(s) === 'coorganizacion') {
                              · se pedirá a {{ s.managerName }} como co-organizador
                            } @else {
                              · cotización directa a {{ s.managerName }}
                            }
                          </span>
                        </div>
                        @if (roleService.canViewFinances() && engagementOf(s) === 'cotizacion') {
                          <span class="px-2.5 py-1 rounded-xl bg-surface-container-highest border border-outline-variant/30 text-[10px] font-black font-mono text-amber-300 shrink-0">
                            Se ofrece {{ money(offerAmount(s)) }}
                          </span>
                        }
                      </div>
                    }

                    @for (r of unsentAssignments(); track r.id) {
                      <div class="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between gap-3 flex-wrap backdrop-blur-md">
                        <div class="flex items-center gap-2.5 min-w-0">
                          <span class="material-symbols-outlined text-base text-violet-300 shrink-0">assignment_ind</span>
                          <span class="text-[11px] text-on-surface-variant min-w-0">
                            Encargo de <strong class="text-on-surface">{{ r.category }}</strong> para {{ r.managerName }}
                          </span>
                        </div>
                        @if (roleService.canViewFinances() && r.budgetCap) {
                          <span class="px-2.5 py-1 rounded-xl bg-surface-container-highest border border-outline-variant/30 text-[10px] font-black font-mono text-on-surface shrink-0">
                            Tope {{ money(r.budgetCap) }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                </section>
              }

              <!-- Reparto entre managers -->
              <section class="p-6 rounded-3xl bg-gradient-to-br from-teal-500/10 via-black/40 to-black/60 border border-teal-500/25 border-l-4 border-l-teal-500/70 shadow-[0_0_40px_rgba(20,184,166,0.15)] space-y-5 backdrop-blur-3xl">
                <div class="flex items-center justify-between gap-3 border-b border-outline-variant/20 pb-4 flex-wrap">
                  <h5 class="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center material-symbols-outlined text-lg">handshake</span>
                    <span>Managers y reparto de ganancias</span>
                  </h5>
                  <div class="flex items-center gap-2.5">
                    <span class="text-[10px] font-mono font-bold text-outline uppercase tracking-wider">
                      {{ agreements().length }} participante(s)
                    </span>
                    @if (policy().lineup) {
                      <button
                        type="button"
                        (click)="inviteModalOpen.set(true)"
                        class="px-3.5 py-2 rounded-xl bg-teal-500/20 text-teal-200 border border-teal-500/40 hover:bg-teal-500 hover:text-black text-[11px] font-black transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                      >
                        <span class="material-symbols-outlined text-sm">person_add</span> Invitar manager
                      </button>
                    }
                  </div>
                </div>

                <!-- Por privacidad, entre managers solo se comparte el total del
                     evento: los costos de los grupos de cada quien no se exponen. -->
                <div class="p-3.5 rounded-2xl bg-black/20 border border-white/5 text-[11px] text-outline flex items-start gap-2.5 backdrop-blur-md">
                  <span class="material-symbols-outlined text-base shrink-0 text-teal-300 mt-0.5">lock</span>
                  <span>
                    Entre managers solo se comparte la <strong class="text-on-surface">ganancia total del evento</strong>.
                    Lo que le cuesta a cada quien su propio cartel queda privado y la plataforma lo calcula por detrás.
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div class="p-4 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Repartido por porcentaje</span>
                    <span class="font-black text-xl font-mono"
                      [class]="percentMismatch() ? 'text-rose-300' : 'text-emerald-400'">
                      {{ agreedPercentTotal() }}%
                    </span>
                  </div>
                  <div class="p-4 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Comprometido en montos fijos</span>
                    <span class="font-black text-xl text-amber-300 font-mono">{{ money(agreedFixedTotal()) }}</span>
                  </div>
                  <div class="p-4 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Pendientes de aceptar</span>
                    <span class="font-black text-xl font-mono"
                      [class]="pendingAgreements().length ? 'text-amber-300' : 'text-emerald-400'">
                      {{ pendingAgreements().length }}
                    </span>
                    @if (unsentInvites().length) {
                      <span class="text-[10px] text-outline block">
                        + {{ unsentInvites().length }} sin enviar todavía
                      </span>
                    }
                  </div>
                </div>

                @if (percentMismatch()) {
                  <div class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 backdrop-blur-xl">
                    <span class="material-symbols-outlined text-lg shrink-0">error</span>
                    <span>
                      Los porcentajes suman {{ agreedPercentTotal() }}% y no 100%.
                      @if (agreedPercentTotal() < 100) {
                        Queda {{ 100 - agreedPercentTotal() }}% de las ganancias sin asignar.
                      } @else {
                        Se está repartiendo más de lo que el evento genera.
                      }
                    </span>
                  </div>
                }

                <div class="space-y-4">
                  @for (a of agreements(); track a.id) {
                    <div class="p-5 sm:p-6 rounded-3xl bg-black/20 border border-teal-500/30 shadow-2xl backdrop-blur-3xl space-y-4 hover:border-teal-400/50 hover:bg-white/5 transition-all duration-300 group">
                      <div class="flex items-center justify-between gap-4 flex-wrap">
                        <div class="flex items-center gap-3 min-w-0">
                          <span class="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center material-symbols-outlined text-lg shrink-0">
                            {{ a.role === 'organizador' ? 'star' : 'group_add' }}
                          </span>
                          <div class="min-w-0">
                            <p class="text-sm font-black text-on-surface truncate">{{ a.managerName }}</p>
                            <span class="text-[10px] font-black uppercase tracking-wider"
                              [class]="a.role === 'organizador' ? 'text-primary' : 'text-outline'">
                              {{ a.role === 'organizador' ? 'Organizador del evento' : 'Co-organizador invitado' }}
                            </span>
                          </div>
                        </div>

                        <div class="flex items-center gap-2.5 shrink-0">
                          <span class="px-3 py-1.5 rounded-xl border text-xs font-black font-mono"
                            [class]="a.settlementKind === 'porcentaje'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'">
                            {{ a.settlementKind === 'porcentaje' ? a.percent + '%' : money(a.fixedAmount || 0) }}
                          </span>
                          <span [class]="agreementStatusClass(a.status)" class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border">
                            {{ agreementStatusLabel(a.status) }}
                          </span>
                        </div>
                      </div>

                      <!-- 1. Sus grupos en el cartel -->
                      <div class="p-3.5 rounded-xl bg-black/20 border border-white/5 space-y-2">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[10px] font-bold uppercase text-outline flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-indigo-400">groups</span>
                            Grupos en el cartel ({{ managerLineupSlots(a.managerName).length }})
                          </span>
                          @if (policy().lineup) {
                            <button
                              type="button"
                              (click)="activeTab.set('cartel')"
                              class="text-[10px] font-bold text-indigo-300 hover:underline"
                            >
                              + Agregar grupo
                            </button>
                          }
                        </div>
                        @if (managerLineupSlots(a.managerName).length > 0) {
                          <div class="space-y-1.5 text-xs">
                            @for (slot of managerLineupSlots(a.managerName); track slot.id) {
                              <div class="flex items-center justify-between text-on-surface p-2 rounded-lg bg-surface-container/50">
                                <span class="font-bold">{{ slot.groupName }}</span>
                                <span class="text-[10px] text-outline font-mono">{{ slot.setStartTime || 'Horario por definir' }}</span>
                              </div>
                            }
                          </div>
                        } @else {
                          <p class="text-[11px] text-outline italic">Sin grupos asignados en el cartel aún.</p>
                        }
                      </div>

                      <!-- 2. Sus tareas -->
                      @let taskInfo = managerTasksMetrics(a.managerName);
                      <div class="p-3.5 rounded-xl bg-black/20 border border-white/5 space-y-2">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[10px] font-bold uppercase text-outline flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-amber-400">assignment</span>
                            Tareas ({{ taskInfo.pending }} pendientes · {{ taskInfo.completed }} completadas)
                          </span>
                          <button
                            type="button"
                            (click)="activeTab.set('tareas')"
                            class="text-[10px] font-bold text-amber-300 hover:underline"
                          >
                            Ver en Tareas
                          </button>
                        </div>
                        @if (taskInfo.top3.length > 0) {
                          <div class="space-y-1">
                            @for (t of taskInfo.top3; track t.id) {
                              <div class="flex items-center justify-between text-xs p-1.5 rounded-lg bg-surface-container/30">
                                <span class="text-on-surface font-medium truncate max-w-[200px]">{{ t.title }}</span>
                                @if (t.blocking) {
                                  <span class="text-[9px] font-bold text-rose-300 uppercase">Bloqueante</span>
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>

                      <!-- 3. Ventas y Rendimiento -->
                      <div class="p-3.5 rounded-xl bg-black/20 border border-white/5 space-y-2 text-xs">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[10px] font-bold uppercase text-outline flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-emerald-400">payments</span>
                            Rendimiento y Ocupación
                          </span>
                          @if (isDraft()) {
                            <span class="text-[10px] text-amber-300 font-bold">
                              estimado, sin ventas todavía
                            </span>
                          }
                        </div>

                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <span class="text-outline block">Aforo total:</span>
                            <strong class="text-on-surface font-mono">{{ croquisCapacityHelper(e) }} lugares</strong>
                          </div>
                          <div>
                            <span class="text-outline block">Boletos vendidos:</span>
                            <strong class="text-on-surface font-mono">0 (0%)</strong>
                          </div>
                          <div>
                            <span class="text-outline block">Participación estimada:</span>
                            <strong class="text-emerald-400 font-mono">{{ estimatedShareLabel(a) }}</strong>
                          </div>
                        </div>
                      </div>

                      @if (a.role === 'coorganizador' && a.status === 'Sin Enviar') {
                        <!-- Todavía no ha salido: no hay nada que rastrear, solo
                             la opción de arrepentirse antes de mandarla. -->
                        <div class="pt-2 border-t border-outline-variant/15 flex items-center justify-between gap-3 flex-wrap">
                          <p class="text-[10px] text-outline flex items-center gap-1.5 min-w-0">
                            <span class="material-symbols-outlined text-[13px] shrink-0">schedule_send</span>
                            <span>
                              La invitación sale al presionar <strong class="text-on-surface">Enviar a Revisión</strong>.
                              {{ a.managerName }} todavía no sabe nada de este evento.
                            </span>
                          </p>
                          <button
                            type="button"
                            (click)="cancelInvitation(a)"
                            class="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all shrink-0 flex items-center gap-1.5"
                          >
                            <span class="material-symbols-outlined text-xs">undo</span> Retirar invitación
                          </button>
                        </div>
                      } @else if (a.role === 'coorganizador') {
                        <div class="pt-2 border-t border-outline-variant/15 flex items-center justify-between gap-3 flex-wrap">
                          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] flex-1 min-w-0">
                            <div class="flex items-center gap-1.5 text-outline">
                              <span class="material-symbols-outlined text-[13px] text-teal-300">send</span>
                              <span>Enviado: <strong class="text-on-surface">{{ a.invitedAt ? dateTimeLabel(a.invitedAt) : 'Sin fecha de envío' }}</strong></span>
                            </div>
                            <div class="flex items-center gap-1.5 text-outline">
                              <span class="material-symbols-outlined text-[13px]" [class]="a.viewedAt ? 'text-emerald-400' : 'text-amber-400'">
                                {{ a.viewedAt ? 'visibility' : 'visibility_off' }}
                              </span>
                              <span>Visto:
                                @if (a.viewedAt) {
                                  <strong class="text-emerald-300">{{ dateTimeLabel(a.viewedAt) }}</strong>
                                } @else {
                                  <strong class="text-amber-300">No ha visto la solicitud</strong>
                                }
                              </span>
                            </div>
                            <div class="flex items-center gap-1.5 text-outline">
                              <span class="material-symbols-outlined text-[13px]"
                                [class]="a.status === 'Aceptado' ? 'text-emerald-400' : (a.status === 'Rechazado' ? 'text-rose-400' : 'text-amber-400')">
                                {{ a.status === 'Aceptado' ? 'check_circle' : (a.status === 'Rechazado' ? 'cancel' : 'hourglass_top') }}
                              </span>
                              <span>Respuesta:
                                @if (a.respondedAt) {
                                  <strong [class]="a.status === 'Aceptado' ? 'text-emerald-300' : 'text-rose-300'">
                                    {{ a.status }} ({{ dateTimeLabel(a.respondedAt) }})
                                  </strong>
                                } @else {
                                  <strong class="text-amber-300">Pendiente de respuesta</strong>
                                }
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            (click)="toggleAgreementStatus(a)"
                            [class]="a.status === 'Aceptado' ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 hover:bg-amber-500 hover:text-black' : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500 hover:text-black'"
                            class="px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95"
                            title="Pruebas: cambiar entre Pendiente y Aceptado"
                          >
                            <span class="material-symbols-outlined text-xs font-bold">{{ a.status === 'Aceptado' ? 'undo' : 'check_circle' }}</span>
                            <span>{{ a.status === 'Aceptado' ? 'Marcar Pendiente' : 'Aceptar Solicitud (Pruebas)' }}</span>
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>

                <p class="text-[11px] text-outline flex items-start gap-2">
                  <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">info</span>
                  <span>
                    El reparto por <strong class="text-emerald-300">porcentaje</strong> lo liquida la plataforma sola al cerrar el evento.
                    Los <strong class="text-amber-300">montos fijos</strong> se pagan a mano sobre las ganancias totales.
                    Se pueden combinar ambos esquemas en un mismo evento.
                  </span>
                </p>
              </section>

              <!-- Grupos contratados a otros managers -->
              <section class="p-6 rounded-3xl bg-gradient-to-br from-teal-500/10 via-black/40 to-black/60 border border-teal-500/25 border-l-4 border-l-teal-500/70 shadow-[0_0_40px_rgba(20,184,166,0.15)] space-y-4 backdrop-blur-3xl">
                <div class="flex items-center justify-between gap-3 border-b border-outline-variant/20 pb-4 flex-wrap">
                  <h5 class="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-2.5">
                    <span class="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center material-symbols-outlined text-lg">groups</span>
                    <span>Grupos de otros managers en el cartel</span>
                  </h5>
                  <span class="text-[10px] font-mono font-bold text-outline uppercase tracking-wider">
                    {{ externalSlots().length }} de {{ slots().length }} en cartel
                  </span>
                </div>

                @for (s of externalSlots(); track s.id) {
                  <div class="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between gap-4 flex-wrap shadow-md backdrop-blur-md hover:bg-white/5 transition-colors">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-sm font-black text-on-surface truncate">{{ s.groupName }}</p>
                        <!-- La vía es el dato que importa aquí: decide si ese
                             manager ve el evento o solo cobra y se va. -->
                        <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border"
                          [class]="engagementOf(s) === 'coorganizacion'
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'">
                          {{ engagementOf(s) === 'coorganizacion' ? 'Co-Organización' : 'Cotización Directa' }}
                        </span>
                      </div>
                      <p class="text-[11px] text-outline truncate">
                        Manager dueño: <strong class="text-on-surface">{{ s.managerName }}</strong>
                      </p>
                    </div>
                    <div class="flex items-center gap-2.5 shrink-0">
                      @if (roleService.canViewFinances() && engagementOf(s) === 'cotizacion') {
                        <span class="px-3 py-1.5 rounded-xl bg-surface-container-highest border border-outline-variant/30 text-xs font-black font-mono text-on-surface">
                          {{ money(s.approval === 'Sin Enviar' ? offerAmount(s) : slotCost(s)) }}
                        </span>
                      }
                      <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border"
                        [class]="lineupApprovalClass(s.approval)">
                        {{ lineupApprovalLabel(s.approval) }}
                      </span>
                    </div>
                  </div>
                } @empty {
                  <p class="p-5 text-center text-xs text-outline italic bg-surface-container/40 rounded-2xl border border-dashed border-outline-variant/30">
                    Todo el cartel es de grupos propios. No hay grupos de otros managers.
                  </p>
                }

                @if (externalSlots().length) {
                  <div class="text-[11px] text-outline space-y-2 pt-1">
                    <p class="flex items-start gap-2">
                      <span class="material-symbols-outlined text-sm shrink-0 mt-0.5 text-amber-300">request_quote</span>
                      <span>
                        <strong class="text-amber-300">Cotización directa:</strong> al manager dueño le llega la
                        solicitud con el precio propuesto y puede aceptarlo o contraofertar. Aceptado, no interviene
                        en el evento ni ve boletaje o ganancias: solo recibe horarios de llegada, prueba de sonido y
                        zona asignada.
                      </span>
                    </p>
                    <p class="flex items-start gap-2">
                      <span class="material-symbols-outlined text-sm shrink-0 mt-0.5 text-sky-300">handshake</span>
                      <span>
                        <strong class="text-sky-300">Co-organización:</strong> el manager dueño entra al evento. Ve
                        boletaje, precios y avance de venta, y puede sugerir grupos — aceptarlos sigue siendo decisión
                        del organizador. Nunca ve lo que ganan los grupos de los demás managers.
                      </span>
                    </p>
                    @if (isDraft()) {
                      <p class="flex items-start gap-2">
                        <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">schedule_send</span>
                        <span>
                          En borrador nada de esto ha salido: las solicitudes y las invitaciones se mandan al
                          presionar <strong class="text-on-surface">Enviar a Revisión</strong>.
                        </span>
                      </p>
                    }
                  </div>
                }
              </section>
            </div>
          }

          <!-- La pestaña Revisión se retiró. Solo repetía, en una lista
               aparte, el estado de aprobación que cada grupo ya lleva en su
               tarjeta del Cartel; lo único suyo —el motivo del rechazo y los
               cambios que pide el dueño del grupo— se movió justo ahí, que es
               donde sirve para hacer algo con ello. El candado de publicación
               no cambia: sigue leyendo las aprobaciones pendientes. -->

          <!-- La pestaña Venta se retiró: sus cuatro cifras —vendidos,
               ocupación, por vender y taquilla cobrada— ya estaban, y con más
               detalle, en Boletaje & Croquis, que es donde se define el aforo
               del que salen. Lo único suyo que no se repetía era la ficha de
               publicación y el detalle diario, y eso se movió al Resumen, junto
               al banner que ya cuenta en qué fase está el evento. -->

          <!-- ─── CIERRE ─── -->
          @if (activeTab() === 'cierre') {
            <app-event-tab-closure
              [event]="e"
              [canEdit]="policy().closure"
              [canViewFinances]="roleService.canViewFinances()"
              (patch)="patch.emit($event)"
              (seal)="seal.emit(e)"
            />
          }

          <!-- ─── TRAZABILIDAD ─── -->
          @if (activeTab() === 'trazabilidad') {
            <div class="space-y-5">
              @if (e.cancellation; as cancel) {
                <section class="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs shadow-xl backdrop-blur-xl">
                  <h5 class="text-xs font-black uppercase tracking-wider text-rose-200 flex items-center gap-2">
                    <span class="material-symbols-outlined text-base">cancel</span> Cancelación
                  </h5>
                  <p class="text-rose-100"><strong>Motivo:</strong> {{ cancel.reason }}</p>
                  <p class="text-rose-100/80">
                    Cancelado desde <strong>{{ cancel.cancelledFromState }}</strong> por {{ cancel.by }}, {{ dateTimeLabel(cancel.at) }}
                  </p>
                  @if ((cancel.refundsIssued || 0) > 0) {
                    <p class="text-rose-100/80">
                      {{ cancel.refundsIssued }} boleto(s) reembolsado(s)
                      @if (roleService.canViewFinances()) { por {{ cancelRefundLabel() }} }
                    </p>
                  }
                </section>
              }

              <!-- Evidencia -->
              <section class="p-6 rounded-3xl bg-gradient-to-br from-slate-400/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-slate-400/25 border-l-4 border-l-slate-300/70 shadow-2xl space-y-4 backdrop-blur-xl">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <h5 class="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <span class="material-symbols-outlined text-base">photo_library</span>
                    Evidencia de campo ({{ e.evidenceMedia.length }})
                  </h5>
                  @if (allowsEvidence()) {
                    <button
                      type="button"
                      (click)="uploadEvidence.emit(e)"
                      class="px-4 py-2 min-h-9 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-md"
                    >
                      <span class="material-symbols-outlined text-sm">add_a_photo</span> Subir evidencia
                    </button>
                  }
                </div>

                @if (!e.evidenceMedia.length) {
                  <p class="text-xs text-outline italic p-6 rounded-2xl bg-surface-container border border-dashed border-outline-variant/40 text-center">
                    Sin evidencia adjunta. El personal de campo puede subir fotos y videos del montaje, la prueba de sonido y el show.
                  </p>
                } @else {
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    @for (media of e.evidenceMedia; track media.id) {
                      <div class="rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/25 p-2.5 space-y-2 shadow-md group">
                        <div class="overflow-hidden rounded-xl aspect-video bg-black/40">
                          <img [src]="media.url" [alt]="media.caption" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <p class="text-[11px] font-semibold text-on-surface px-0.5 line-clamp-2">{{ media.caption }}</p>
                        <div class="flex items-center justify-between text-[10px] text-outline px-0.5 pt-0.5 border-t border-outline-variant/15">
                          <span class="truncate">{{ media.uploaderName }}</span>
                          <span class="shrink-0 font-mono">{{ media.stage || media.type }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </section>

              <!-- Línea de tiempo -->
              <section class="p-6 rounded-3xl bg-gradient-to-br from-slate-400/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-slate-400/25 border-l-4 border-l-slate-300/70 shadow-2xl space-y-4 backdrop-blur-xl">
                <h5 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                  <span class="material-symbols-outlined text-base">timeline</span> Trazabilidad del evento
                </h5>

                <ol class="space-y-4 border-l-2 border-outline-variant/30 ml-3 pl-4">
                  @for (step of e.timeline; track step.id) {
                    <li class="relative">
                      <span
                        [class]="stepDotClass(step.state)"
                        class="absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 border-surface-container-high shadow-md"
                      ></span>
                      <p class="text-xs font-bold text-on-surface">{{ step.phaseName }}</p>
                      <p class="text-[10px] text-outline mt-0.5 font-mono">{{ dateTimeLabel(step.completedAt) }} · {{ step.actorName }}</p>
                      <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">{{ step.summaryNote }}</p>
                    </li>
                  } @empty {
                    <li class="text-xs text-outline italic">Sin movimientos registrados.</li>
                  }
                </ol>
              </section>

              <!-- Bitácora Fina de Movimientos -->
              <section class="space-y-3">
                <h5 class="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <span class="material-symbols-outlined text-base">history</span>
                  Bitácora de movimientos del expediente
                </h5>
                <app-event-tab-activity [event]="e" />
              </section>
            </div>
          }
        </div>

        <!-- ─── ACCIONES ─── -->
        <ng-container modal-footer>
          <!-- Cancelar es del creador y de nadie más. A los demás managers se
               les enseña apagado con el motivo: esconder el botón deja a quien
               lo busca pensando que la pantalla está rota. -->
          @if (!canCancel() && cancelIsRelevant()) {
            <span
              class="px-4 py-2.5 min-h-11 rounded-xl bg-white/[0.03] text-outline border border-white/10 text-xs font-bold flex items-center gap-1.5 sm:mr-auto cursor-not-allowed"
              [title]="'Cancelar el evento solo lo puede hacer ' + organizer() + ', que fue quien lo creó.'"
            >
              <span class="material-symbols-outlined text-sm">lock</span>
              Cancelar · solo {{ organizer() }}
            </span>
          }

          @if (canCancel()) {
            <button
              type="button"
              (click)="openCancelDialog()"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 sm:mr-auto shadow-md"
            >
              <span class="material-symbols-outlined text-sm">cancel</span> Cancelar evento
            </button>
          }

          <!-- ESTADO: BORRADOR -->
          @if (e.state === 'Borrador' && roleService.canEditEvents()) {
            @if (outboundCount() > 0) {
              <span class="text-[11px] text-outline flex items-center gap-1.5 mr-1">
                <span class="material-symbols-outlined text-sm text-amber-300">outbox</span>
                Saldrán <strong class="text-amber-300">{{ outboundCount() }}</strong> aviso(s) a otros managers
              </span>
            }
            @if (!report().canSubmitForReview) {
              <span class="text-[11px] text-amber-300/90 flex items-center gap-1.5 mr-1">
                <span class="material-symbols-outlined text-sm">pending_actions</span>
                Se envía con <strong>{{ report().missingRequired.length }}</strong> punto(s) por capturar
              </span>
            }
            <button
              type="button"
              (click)="submitReview.emit(e)"
              class="px-6 py-3 min-h-11 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black text-xs shadow-xl shadow-amber-500/25 hover:scale-105 transition-all flex items-center gap-2 border border-amber-300/40"
            >
              <span class="material-symbols-outlined text-base">send</span> Enviar a Revisión
            </button>
          }

          <!-- ESTADO: EN REVISIÓN -->
          @if (e.state === 'En Revisión' && roleService.canEditEvents()) {
            @if (!publishReadiness().canPublish) {
              <span class="text-[11px] text-amber-300 flex items-center gap-1.5 mr-2">
                <span class="material-symbols-outlined text-sm">lock</span>
                Faltan {{ publishReadiness().missingRequirements.length }} requisito(s) para publicar
              </span>
            }
            <button
              type="button"
              (click)="openPublishDialog()"
              [disabled]="!publishReadiness().canPublish"
              [title]="publishReadiness().canPublish ? 'Publicar inmediatamente o programar fecha' : publishReadiness().missingRequirements.join('\n')"
              class="px-6 py-3 min-h-11 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 text-black font-black text-xs shadow-xl shadow-emerald-500/25 hover:scale-105 transition-all disabled:opacity-40 disabled:pointer-events-none disabled:hover:scale-100 flex items-center gap-2 border border-emerald-300/40"
            >
              <span class="material-symbols-outlined text-base">campaign</span> Publicar Evento
            </button>
          }

          <!-- ESTADO: PRÓXIMO A PUBLICAR -->
          @if (e.state === 'Próximo a Publicar' && roleService.canEditEvents()) {
            <button
              type="button"
              (click)="openReturnReviewDialog()"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-surface-container-highest text-outline hover:text-on-surface text-xs font-bold transition-all border border-outline-variant/30 flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-sm">reply</span> Devolver a En Revisión
            </button>
            <button
              type="button"
              (click)="publish.emit({ event: e })"
              [disabled]="!publishReadiness().canPublish"
              [title]="publishReadiness().canPublish
                ? 'Sacarlo al público ahora, sin esperar a la fecha programada'
                : publishReadiness().missingRequirements.join('\n')"
              class="px-6 py-3 min-h-11 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black text-xs shadow-xl shadow-blue-500/25 hover:scale-105 transition-all disabled:opacity-40 disabled:pointer-events-none disabled:hover:scale-100 flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-base">campaign</span> Publicar de inmediato
            </button>
          }

          <!-- ESTADO: PUBLICADO -->
          @if (e.state === 'Publicado' && roleService.canEditEvents()) {
            <button
              type="button"
              (click)="openPostponeDialog(e)"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500 hover:text-black text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-sm">edit_calendar</span> Posponer Fecha
            </button>
            <button
              type="button"
              (click)="openReturnReviewDialog()"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-surface-container-highest text-outline hover:text-on-surface text-xs font-bold transition-all border border-outline-variant/30 flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-sm">reply</span> Devolver a En Revisión
            </button>
            <!-- Andamio de datos de prueba, no una operación del negocio. En
                 producción la primera venta la dispara el portal del cliente;
                 aquí hace falta un pulsador para poder recorrer el ciclo. Se
                 marca aparte para que no se lea como algo que un encargado hace. -->
            <span class="px-2 py-1 rounded-lg bg-white/[0.04] border border-dashed border-white/20 text-[9px] font-black uppercase tracking-widest text-outline">
              Simulación
            </span>
            <button
              type="button"
              (click)="triggerSimulateSale(e, 1)"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-white/[0.03] text-on-surface-variant border border-dashed border-white/25 hover:border-emerald-400/50 hover:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Dispara la primera venta como lo haría el portal del cliente: el evento pasará solo a En Venta"
            >
              <span class="material-symbols-outlined text-sm">shopping_cart</span> 1ª venta
            </button>
          }

          <!-- ESTADO: EN VENTA -->
          @if (e.state === 'En Venta' && roleService.canEditEvents()) {
            <button
              type="button"
              (click)="openPostponeDialog(e)"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500 hover:text-black text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-sm">edit_calendar</span> Posponer Fecha
            </button>
            <span class="px-2 py-1 rounded-lg bg-white/[0.04] border border-dashed border-white/20 text-[9px] font-black uppercase tracking-widest text-outline">
              Simulación
            </span>
            <button
              type="button"
              (click)="triggerSimulateSale(e, 2)"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-white/[0.03] text-on-surface-variant border border-dashed border-white/25 hover:border-emerald-400/50 hover:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Añade dos ventas más para poder ver el avance de taquilla"
            >
              <span class="material-symbols-outlined text-sm">confirmation_number</span> +2 boletos
            </button>
            <!-- Concluir no es una decisión: el evento se acaba porque llegó
                 su día. Tenerlo a mano permitía dar por terminado un
                 espectáculo al que la gente todavía va a ir. Lo que queda es
                 decir cuándo pasará solo. -->
            <span class="px-4 py-2.5 min-h-11 rounded-xl bg-white/[0.03] text-outline border border-white/10 text-xs font-bold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">schedule</span>
              Concluye solo el {{ concludesOn() }}
            </span>
            <button
              type="button"
              (click)="finish.emit(e)"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-white/[0.03] text-on-surface-variant border border-dashed border-white/25 hover:border-purple-400/50 hover:text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Adelanta el reloj: da el evento por celebrado para poder ver la fase de cierre"
            >
              <span class="material-symbols-outlined text-sm">fast_forward</span> Ya pasó la fecha
            </button>
          }

          <!-- ESTADO: FINALIZADA -->
          @if (e.state === 'Finalizada' && roleService.canEditEvents()) {
            <button
              type="button"
              (click)="activeTab.set('cierre')"
              class="px-4 py-2.5 min-h-11 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-500/40 hover:bg-purple-500 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-sm">fact_check</span> Ir a Cierre & Finiquitos
            </button>
            <button
              type="button"
              (click)="seal.emit(e)"
              [disabled]="!allManagersConfirmed()"
              [title]="allManagersConfirmed()
                ? 'Sellar el expediente: a partir de aquí solo se consulta'
                : 'Faltan firmas de los managers que participaron en el evento'"
              class="px-6 py-3 min-h-11 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-black text-xs shadow-xl shadow-emerald-500/25 hover:scale-105 transition-all disabled:opacity-40 disabled:pointer-events-none disabled:hover:scale-100 flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-base">lock</span> Cerrar y Sellar Expediente
            </button>
          }

          <button
            type="button"
            (click)="closed.emit()"
            class="px-6 py-3 min-h-11 rounded-2xl bg-surface-bright text-on-surface font-bold text-xs hover:bg-surface-container-highest transition-all border border-outline-variant/30 shadow-md"
          >
            Cerrar
          </button>
        </ng-container>

      </app-modal-shell>

      <!-- ─── EDITOR DE CROQUIS ─── -->
      <!-- Fuera del modal a propósito: el editor necesita la pantalla completa y
           dentro del expediente quedaría atrapado en su caja. -->
      @if (croquisEditorOpen()) {
        <app-croquis-editor
          [event]="e"
          [canEdit]="policy().tickets"
          [canViewFinances]="roleService.canViewFinances()"
          [initialPlanId]="croquisEditorPlanId()"
          (patch)="patch.emit($event)"
          (closed)="croquisEditorOpen.set(false)"
        />
      }

      <!-- ─── MODAL: PUBLICAR EVENTO ─── -->
      @if (publishModalOpen()) {
        <div
          class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
          (click)="publishModalOpen.set(false)"
        >
          <div
            class="w-full max-w-lg bg-gradient-to-b from-[#142318] via-[#101815] to-[#0b0f14] border border-emerald-500/40 rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.2)] p-6 space-y-5 relative overflow-hidden"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold">
                  <span class="material-symbols-outlined text-xl">campaign</span>
                </div>
                <div>
                  <h4 class="text-sm font-black uppercase tracking-wider text-on-surface">Publicar Evento</h4>
                  <p class="text-xs text-outline">Elige la modalidad de publicación</p>
                </div>
              </div>
              <button
                type="button"
                (click)="publishModalOpen.set(false)"
                class="w-8 h-8 rounded-xl bg-surface-container-highest text-outline hover:text-on-surface flex items-center justify-center transition-all"
              >
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div class="space-y-3">
              <label
                (click)="publishMode.set('immediate')"
                class="p-4 rounded-2xl border cursor-pointer block transition-all"
                [class]="publishMode() === 'immediate'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200 shadow-md'
                  : 'bg-surface-container/60 border-outline-variant/20 text-outline hover:border-outline-variant/40'"
              >
                <div class="flex items-start gap-3">
                  <input type="radio" [checked]="publishMode() === 'immediate'" name="pubMode" class="mt-1" />
                  <div>
                    <strong class="text-xs font-black block text-on-surface">Publicar Inmediatamente</strong>
                    <span class="text-[11px]">El evento se listará de inmediato en la cartelera pública (&quot;Publicado&quot;).</span>
                  </div>
                </div>
              </label>

              <label
                (click)="publishMode.set('scheduled')"
                class="p-4 rounded-2xl border cursor-pointer block transition-all"
                [class]="publishMode() === 'scheduled'
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200 shadow-md'
                  : 'bg-surface-container/60 border-outline-variant/20 text-outline hover:border-outline-variant/40'"
              >
                <div class="flex items-start gap-3">
                  <input type="radio" [checked]="publishMode() === 'scheduled'" name="pubMode" class="mt-1" />
                  <div class="space-y-2 flex-1">
                    <div>
                      <strong class="text-xs font-black block text-on-surface">Publicar Próximamente (Programada)</strong>
                      <span class="text-[11px]">Pasará a &quot;Próximo a Publicar&quot; y no será visible al público hasta la fecha especificada.</span>
                    </div>
                    @if (publishMode() === 'scheduled') {
                      <input
                        type="datetime-local"
                        [ngModel]="publishScheduleDate()"
                        (ngModelChange)="publishScheduleDate.set($event)"
                        class="w-full bg-black/40 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none"
                      />
                    }
                  </div>
                </div>
              </label>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                (click)="publishModalOpen.set(false)"
                class="px-4 py-2.5 rounded-xl bg-surface-container-highest text-outline text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="confirmPublish(e)"
                [disabled]="publishMode() === 'scheduled' && !publishScheduleDate().trim()"
                class="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-xs hover:bg-emerald-400 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-emerald-500/20"
              >
                Confirmar Publicación
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ─── MODAL: DEVOLVER A EN REVISIÓN ─── -->
      @if (returnReviewModalOpen()) {
        <div
          class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
          (click)="returnReviewModalOpen.set(false)"
        >
          <div
            class="w-full max-w-lg bg-gradient-to-b from-[#231e14] via-[#1a1712] to-[#0b0f14] border border-amber-500/40 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.2)] p-6 space-y-4 relative overflow-hidden"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold">
                  <span class="material-symbols-outlined text-xl">reply</span>
                </div>
                <div>
                  <h4 class="text-sm font-black uppercase tracking-wider text-on-surface">Devolver a En Revisión</h4>
                  <p class="text-xs text-outline">Retirar el evento del público para ajustes mayores</p>
                </div>
              </div>
              <button
                type="button"
                (click)="returnReviewModalOpen.set(false)"
                class="w-8 h-8 rounded-xl bg-surface-container-highest text-outline hover:text-on-surface flex items-center justify-center transition-all"
              >
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <p class="text-xs text-amber-200/90 leading-relaxed">
              El evento dejará de estar publicado o programado y volverá al estado <strong>En Revisión</strong>. Podrás editar todos los campos, cartel, boletaje y fechas a puerta cerrada.
            </p>

            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-outline">Motivo de la devolución (Obligatorio)</label>
              <textarea
                [ngModel]="returnReviewReason()"
                (ngModelChange)="returnReviewReason.set($event)"
                placeholder="Explica qué ajustes se realizarán en el evento..."
                rows="3"
                class="w-full bg-black/40 border border-amber-500/40 rounded-xl p-3 text-xs text-on-surface focus:outline-none resize-none"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                (click)="returnReviewModalOpen.set(false)"
                class="px-4 py-2.5 rounded-xl bg-surface-container-highest text-outline text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="confirmReturnToReview(e)"
                [disabled]="!returnReviewReason().trim()"
                class="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-black text-xs hover:bg-amber-400 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-amber-500/20"
              >
                Confirmar y Regresar a Revisión
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ─── MODAL: CANCELAR EL EVENTO ─── -->
      <!-- Es la operación más grave del expediente y no se deshace: si hay
           boletos vendidos hay que devolverle el dinero a gente que ya reservó
           su noche. Se hacía con un campo de texto en la barra, con menos
           ceremonia que posponer una fecha. Aquí se ve a quién afecta, cuánto
           hay que devolver y qué se le va a decir, y hay que escribir el folio
           para confirmar: cancelar por un clic de más no puede pasar. -->
      @if (cancelModalOpen()) {
        <div
          class="fixed inset-0 z-[999999999] bg-black/92 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
          (click)="cancelModalOpen.set(false)"
        >
          <div
            class="w-full max-w-3xl bg-gradient-to-b from-[#2a1114] via-[#1a0f11] to-[#0b0f14] border border-rose-500/45 rounded-[2rem] shadow-[0_0_100px_rgba(244,63,94,0.25)] relative overflow-hidden max-h-[92vh] flex flex-col"
            (click)="$event.stopPropagation()"
          >
            <div class="absolute -top-28 -right-28 w-72 h-72 bg-rose-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <header class="shrink-0 flex items-center justify-between gap-4 p-6 border-b border-white/10 relative z-10">
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/45 text-rose-300 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-2xl">cancel</span>
                </div>
                <div class="min-w-0">
                  <h4 class="font-['Epilogue'] text-lg font-black text-on-surface tracking-tight leading-tight">Cancelar el evento</h4>
                  <p class="text-[11px] text-outline truncate">{{ e.title }} · {{ e.id }}</p>
                </div>
              </div>
              <button
                type="button"
                (click)="cancelModalOpen.set(false)"
                class="w-9 h-9 rounded-xl bg-white/5 text-outline hover:text-on-surface hover:bg-white/10 flex items-center justify-center transition-all shrink-0"
              >
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </header>

            <div class="flex-1 overflow-y-auto scroll-oculto p-6 space-y-4 relative z-10">

              <!-- Qué se lleva por delante -->
              <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/35 space-y-3">
                <p class="text-[11px] font-black uppercase tracking-widest text-rose-300 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[14px]">warning</span>
                  Esto no se puede deshacer
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Compradores</span>
                    <span class="text-lg font-black font-mono" [class]="sold() > 0 ? 'text-rose-300' : 'text-on-surface-variant'">
                      {{ sold().toLocaleString('es-MX') }}
                    </span>
                  </div>
                  @if (roleService.canViewFinances()) {
                    <div class="p-3 rounded-xl bg-black/40 border border-white/10">
                      <span class="text-[9px] font-black uppercase tracking-wider text-outline block">A reembolsar</span>
                      <span class="text-lg font-black font-mono text-rose-300">{{ money(refundAmount()) }}</span>
                    </div>
                  }
                  <div class="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Se cancela desde</span>
                    <span class="text-xs font-black text-on-surface-variant">{{ e.state }}</span>
                  </div>
                </div>
                <p class="text-[11px] text-rose-100 leading-relaxed">
                  @if (sold() > 0) {
                    Hay <strong>{{ sold().toLocaleString('es-MX') }}</strong> boleto(s) vendidos. Al confirmar se emite el
                    reembolso del 100% y sale el aviso de cancelación a todos los compradores. El expediente queda como
                    registro histórico y no vuelve a abrirse.
                  } @else {
                    No hay boletos vendidos, así que no hay reembolsos que emitir. Aun así el expediente queda cerrado
                    como registro histórico y no vuelve a abrirse.
                  }
                </p>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-rose-300">Motivo de la cancelación *</label>
                <textarea
                  [(ngModel)]="cancelReason"
                  rows="3"
                  placeholder="Qué pasó. Queda en la trazabilidad y es lo que se le explica a los compradores."
                  class="w-full bg-black/40 border border-rose-500/40 focus:border-rose-400 rounded-xl p-3.5 text-xs text-on-surface focus:outline-none resize-none transition-colors"
                ></textarea>
              </div>

              <!-- Lo que leerá quien compró -->
              <div class="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                <span class="text-[10px] font-black uppercase tracking-widest text-outline flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[13px]">visibility</span>
                  Así lo verá el comprador
                </span>
                <p class="text-[11px] text-on-surface-variant leading-relaxed italic">"{{ cancelPreview() }}"</p>
              </div>

              <!-- Confirmación por folio -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-rose-300">
                  Escribe <strong class="font-mono text-rose-200">{{ e.id }}</strong> para confirmar
                </label>
                <input
                  type="text"
                  [ngModel]="cancelConfirmText()"
                  (ngModelChange)="cancelConfirmText.set($event)"
                  [placeholder]="e.id"
                  class="w-full bg-black/40 rounded-xl px-3.5 py-2.5 text-xs font-mono text-on-surface focus:outline-none border transition-colors"
                  [class]="cancelConfirmed(e) ? 'border-emerald-500/50' : 'border-rose-500/40 focus:border-rose-400'"
                />
                <p class="text-[10px] text-outline">
                  Se pide para que cancelar nunca sea un clic de más en la barra de acciones.
                </p>
              </div>
            </div>

            <footer class="shrink-0 flex items-center justify-end gap-2.5 p-5 border-t border-white/10 relative z-10">
              <button
                type="button"
                (click)="cancelModalOpen.set(false)"
                class="px-5 py-2.5 rounded-xl text-xs font-bold text-outline hover:text-on-surface transition-colors"
              >No cancelar</button>
              <button
                type="button"
                (click)="confirmCancel(e)"
                [disabled]="!cancelReason.trim() || !cancelConfirmed(e)"
                class="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 text-white font-black text-xs transition-all disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-rose-500/25 flex items-center gap-2 active:scale-95"
              >
                <span class="material-symbols-outlined text-base">cancel</span>
                Cancelar definitivamente
                @if (sold() > 0) { <span class="opacity-80">y reembolsar {{ sold().toLocaleString('es-MX') }}</span> }
              </button>
            </footer>
          </div>
        </div>
      }

      <!-- ─── MODAL: POSPONER FECHA DEL EVENTO ─── -->
      <!-- Posponer no es cambiar un campo: es avisarle a la gente que ya compró
           que el plan cambió. Por eso la pantalla se reparte en dos: a la
           izquierda la decisión —cuándo y por qué— y a la derecha lo que se le
           manda al comprador, con el material a la vista. Los adjuntos se suben
           de verdad, porque pedirle una URL a quien acaba de recibir el video
           del grupo por WhatsApp era pedirle que lo publicara antes en otro
           sitio. -->
      @if (postponeModalOpen()) {
        <div
          class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
          (click)="postponeModalOpen.set(false)"
        >
          <div
            class="w-full max-w-5xl bg-gradient-to-b from-[#241712] via-[#1a120f] to-[#0b0f14] border border-amber-500/40 rounded-[2rem] shadow-[0_0_100px_rgba(245,158,11,0.22)] relative overflow-hidden max-h-[92vh] flex flex-col"
            (click)="$event.stopPropagation()"
          >
            <div class="absolute -top-28 -right-28 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <header class="shrink-0 flex items-center justify-between gap-4 p-6 border-b border-white/10 relative z-10">
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
                  <span class="material-symbols-outlined text-2xl">event_repeat</span>
                </div>
                <div class="min-w-0">
                  <h4 class="font-['Epilogue'] text-lg font-black text-on-surface tracking-tight leading-tight">Posponer el evento</h4>
                  <p class="text-[11px] text-outline truncate">{{ e.title }} · {{ e.venue }}</p>
                </div>
              </div>
              <button
                type="button"
                (click)="postponeModalOpen.set(false)"
                class="w-9 h-9 rounded-xl bg-white/5 text-outline hover:text-on-surface hover:bg-white/10 flex items-center justify-center transition-all shrink-0"
              >
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </header>

            <div class="flex-1 overflow-y-auto scroll-oculto p-6 relative z-10">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <!-- ─── Izquierda: la decisión ─── -->
                <div class="space-y-4">
                  <div class="p-4 rounded-2xl border flex items-start gap-3"
                    [class]="sold() > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/[0.03] border-white/10'">
                    <span class="material-symbols-outlined text-lg shrink-0"
                      [class]="sold() > 0 ? 'text-rose-400' : 'text-outline'">groups</span>
                    <p class="text-[11px] leading-relaxed" [class]="sold() > 0 ? 'text-rose-100' : 'text-outline'">
                      @if (sold() > 0) {
                        <strong>{{ sold().toLocaleString('es-MX') }} persona(s)</strong> ya compraron su boleto con
                        asiento asignado. A todas les llegará este aviso.
                      } @else {
                        Todavía no hay boletos vendidos: posponer no afecta a ningún comprador.
                      }
                      @if (e.postponementHistory?.length) {
                        <span class="block mt-1 font-bold">Ya se pospuso {{ e.postponementHistory?.length }} vez/veces antes.</span>
                      }
                    </p>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-black uppercase tracking-wider text-outline">Fecha actual</label>
                      <div class="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-outline line-through">
                        {{ e.date }}
                      </div>
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-black uppercase tracking-wider text-amber-400">Nueva fecha *</label>
                      <input
                        type="date"
                        [ngModel]="postponeNewDate()"
                        (ngModelChange)="postponeNewDate.set($event)"
                        [min]="tomorrow()"
                        class="w-full bg-black/40 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none border transition-colors"
                        [class]="postponeDateError() ? 'border-rose-500/60' : 'border-amber-500/40 focus:border-amber-400'"
                      />
                    </div>
                  </div>

                  @if (postponeDateError(); as err) {
                    <p class="text-[11px] text-rose-300 flex items-start gap-1.5">
                      <span class="material-symbols-outlined text-[13px] shrink-0 mt-0.5">error</span>
                      <span>{{ err }}</span>
                    </p>
                  }

                  <div class="space-y-1.5">
                    <label class="text-[10px] font-black uppercase tracking-wider text-outline">Motivo de la reprogramación *</label>
                    <input
                      type="text"
                      [ngModel]="postponeReason()"
                      (ngModelChange)="postponeReason.set($event)"
                      placeholder="Fuerza mayor, clima, logística de los artistas…"
                      class="w-full bg-black/40 border border-amber-500/40 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none transition-colors"
                    />
                    <p class="text-[10px] text-outline">Queda en la trazabilidad del expediente. No se le muestra al comprador.</p>
                  </div>

                  <div class="space-y-1.5">
                    <label class="text-[10px] font-black uppercase tracking-wider text-outline">Aviso para el comprador</label>
                    <textarea
                      [ngModel]="postponeClientNotice()"
                      (ngModelChange)="postponeClientNotice.set($event)"
                      rows="4"
                      placeholder="Si lo dejas vacío se manda el aviso estándar, que ya explica que los boletos siguen siendo válidos."
                      class="w-full bg-black/40 border border-outline-variant/30 focus:border-amber-400/60 rounded-xl p-3.5 text-xs text-on-surface focus:outline-none resize-none transition-colors"
                    ></textarea>
                  </div>
                </div>

                <!-- ─── Derecha: lo que recibe el comprador ─── -->
                <div class="space-y-4">
                  <span class="text-[10px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]">attach_file</span>
                    Material del aviso
                  </span>

                  <!-- Flyer -->
                  <div class="space-y-1.5">
                    <label class="text-[10px] font-black uppercase tracking-wider text-outline">Flyer actualizado</label>
                    @if (postponeFlyerUrl()) {
                      <div class="relative rounded-2xl overflow-hidden border border-amber-500/35 bg-black group">
                        <img [src]="postponeFlyerUrl()" alt="Flyer del aviso" class="w-full h-44 object-contain bg-black/60" />
                        <div class="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black to-transparent flex items-center justify-between gap-2">
                          <span class="text-[10px] text-on-surface-variant truncate">{{ postponeFlyerName() || 'Flyer cargado' }}</span>
                          <button
                            type="button"
                            (click)="clearPostponeFlyer()"
                            class="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-[10px] font-bold transition-all shrink-0"
                          >Quitar</button>
                        </div>
                      </div>
                    } @else {
                      <label
                        class="flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
                        [class]="dragOverFlyer()
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-white/15 bg-black/30 hover:border-amber-400/50 hover:bg-amber-500/5'"
                        (dragover)="onDragOver($event, 'flyer')"
                        (dragleave)="dragOverFlyer.set(false)"
                        (drop)="onDropFlyer($event)"
                      >
                        <span class="material-symbols-outlined text-2xl text-amber-400/70">add_photo_alternate</span>
                        <span class="text-[11px] font-bold text-on-surface-variant">Arrastra el flyer o haz clic</span>
                        <span class="text-[10px] text-outline">JPG o PNG</span>
                        <input type="file" accept="image/*" class="hidden" (change)="onPickFlyer($event)" />
                      </label>
                    }
                  </div>

                  <!-- Video -->
                  <div class="space-y-1.5">
                    <label class="text-[10px] font-black uppercase tracking-wider text-outline">Video del grupo dando el aviso</label>
                    @if (postponeVideoUrl()) {
                      <div class="rounded-2xl overflow-hidden border border-amber-500/35 bg-black">
                        <video [src]="postponeVideoUrl()" controls class="w-full h-40 bg-black object-contain"></video>
                        <div class="p-2.5 flex items-center justify-between gap-2 border-t border-white/10">
                          <span class="text-[10px] text-on-surface-variant truncate">{{ postponeVideoName() || 'Video cargado' }}</span>
                          <button
                            type="button"
                            (click)="clearPostponeVideo()"
                            class="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-[10px] font-bold transition-all shrink-0"
                          >Quitar</button>
                        </div>
                      </div>
                    } @else {
                      <label
                        class="flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border-2 border-dashed cursor-pointer transition-all"
                        [class]="dragOverVideo()
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-white/15 bg-black/30 hover:border-amber-400/50 hover:bg-amber-500/5'"
                        (dragover)="onDragOver($event, 'video')"
                        (dragleave)="dragOverVideo.set(false)"
                        (drop)="onDropVideo($event)"
                      >
                        <span class="material-symbols-outlined text-2xl text-amber-400/70">videocam</span>
                        <span class="text-[11px] font-bold text-on-surface-variant">Arrastra el video o haz clic</span>
                        <span class="text-[10px] text-outline">MP4 o MOV · también sirve una liga de YouTube</span>
                        <input type="file" accept="video/*" class="hidden" (change)="onPickVideo($event)" />
                      </label>
                      <input
                        type="url"
                        [ngModel]="postponeVideoUrl()"
                        (ngModelChange)="postponeVideoUrl.set($event)"
                        placeholder="…o pega la liga aquí"
                        class="w-full bg-black/40 border border-outline-variant/30 focus:border-amber-400/60 rounded-xl px-3.5 py-2 text-[11px] text-on-surface focus:outline-none font-mono transition-colors"
                      />
                    }
                  </div>

                  <!-- Vista previa del comunicado -->
                  <div class="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                    <span class="text-[10px] font-black uppercase tracking-widest text-outline flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[13px]">visibility</span>
                      Así lo verá el comprador
                    </span>
                    <div class="flex items-center gap-2 text-[11px]">
                      <span class="text-outline line-through">{{ e.date }}</span>
                      <span class="material-symbols-outlined text-[13px] text-amber-400">arrow_forward</span>
                      <strong class="text-amber-200">{{ postponeNewDate() || '(nueva fecha)' }}</strong>
                    </div>
                    <p class="text-[11px] text-on-surface-variant leading-relaxed italic">"{{ postponePreview(e) }}"</p>
                    <div class="flex items-center gap-1.5 flex-wrap pt-1">
                      @if (postponeFlyerUrl()) {
                        <span class="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider">con flyer</span>
                      }
                      @if (postponeVideoUrl()) {
                        <span class="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider">con video</span>
                      }
                      @if (!postponeFlyerUrl() && !postponeVideoUrl()) {
                        <span class="text-[10px] text-outline">Solo texto. Un flyer o un video del grupo hacen que el aviso se lea de verdad.</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer class="shrink-0 flex items-center justify-end gap-2.5 p-5 border-t border-white/10 relative z-10">
              <button
                type="button"
                (click)="postponeModalOpen.set(false)"
                class="px-5 py-2.5 rounded-xl text-xs font-bold text-outline hover:text-on-surface transition-colors"
              >Cancelar</button>
              <button
                type="button"
                (click)="confirmPostpone(e)"
                [disabled]="!postponeNewDate().trim() || !postponeReason().trim() || !!postponeDateError()"
                class="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black font-black text-xs transition-all disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-amber-500/25 flex items-center gap-2 active:scale-95"
              >
                <span class="material-symbols-outlined text-base">send</span>
                Posponer y avisar
                @if (sold() > 0) { <span class="opacity-80">a {{ sold().toLocaleString('es-MX') }}</span> }
              </button>
            </footer>
          </div>
        </div>
      }

      <!-- ─── MODAL: INVITAR MANAGER A CO-ORGANIZAR ─── -->
      @if (inviteModalOpen()) {
        <div
          class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
          (click)="inviteModalOpen.set(false)"
        >
          <div
            class="w-full max-w-3xl bg-gradient-to-b from-[#12261f] via-[#101a1c] to-[#0b0f14] border border-teal-500/30 rounded-3xl shadow-[0_0_80px_rgba(20,184,166,0.18)] relative overflow-hidden flex flex-col max-h-[88vh]"
            (click)="$event.stopPropagation()"
          >
            <div class="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <header class="shrink-0 flex items-center justify-between gap-3 p-6 border-b border-white/10 relative z-10">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shadow-lg shrink-0">
                  <span class="material-symbols-outlined text-xl">person_add</span>
                </span>
                <div class="min-w-0">
                  <h3 class="text-base font-black text-on-surface tracking-tight">INVITAR MANAGER A CO-ORGANIZAR</h3>
                  <p class="text-[11px] text-outline">
                    @if (isDraft()) {
                      La invitación se guarda en el borrador y sale al enviar el evento a revisión
                    } @else {
                      Podrá ayudar a armar el evento; sus costos quedan privados y solo se reparte la ganancia total
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                (click)="inviteModalOpen.set(false)"
                class="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-outline flex items-center justify-center transition-all shrink-0"
              >
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </header>

            <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-4 relative z-10">
              @for (m of invitableManagers(); track m.name) {
                <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25 space-y-3 shadow-md">
                  <div class="flex items-center justify-between gap-3 flex-wrap">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center material-symbols-outlined text-lg shrink-0">
                        account_circle
                      </span>
                      <div class="min-w-0">
                        <p class="text-sm font-black text-on-surface truncate">{{ m.name }}</p>
                        <p class="text-[11px] text-outline">
                          {{ m.groups.length }} grupo(s) · {{ m.freeCount }} con agenda libre
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      (click)="inviteManager(m.name)"
                      class="px-4 py-2 rounded-xl bg-teal-500/20 text-teal-200 border border-teal-500/40 hover:bg-teal-500 hover:text-black text-[11px] font-black transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
                    >
                      <span class="material-symbols-outlined text-sm">{{ isDraft() ? 'schedule_send' : 'outgoing_mail' }}</span>
                      {{ isDraft() ? 'Preparar invitación' : 'Enviar invitación' }}
                    </button>
                  </div>

                  <!-- Sus grupos y su agenda: es lo que decide si vale la pena
                       invitarlo, así que se ve antes de mandar la invitación. -->
                  <div class="flex items-center gap-2 flex-wrap pt-1 border-t border-outline-variant/15">
                    @for (g of m.groups; track g.id) {
                      <span class="px-2.5 py-1.5 rounded-xl bg-surface-container-highest/60 border border-outline-variant/25 text-[10px] flex items-center gap-1.5">
                        <img [src]="g.image" [alt]="g.name" class="w-5 h-5 rounded-md object-cover" />
                        <strong class="text-on-surface">{{ g.name }}</strong>
                        <span class="text-outline">· {{ g.agendaStatus }}</span>
                      </span>
                    }
                  </div>
                </div>
              } @empty {
                <p class="p-6 text-center text-xs text-outline italic bg-surface-container/40 rounded-2xl border border-dashed border-outline-variant/30">
                  No hay otros managers disponibles para invitar a este evento.
                </p>
              }
            </div>

            <footer class="shrink-0 p-4 border-t border-white/10 bg-black/30 text-center relative z-10">
              <span class="text-[10px] text-outline">
                @if (isDraft()) {
                  Nada sale mientras el evento sea borrador: las invitaciones se mandan al presionar
                  <strong class="text-on-surface">Enviar a Revisión</strong>. Hasta entonces puedes retirarlas.
                } @else {
                  Al invitar, el manager recibe la solicitud y decide si acepta. Su reparto se define en este mismo apartado.
                }
              </span>
            </footer>
          </div>
        </div>
      }

      @if (showLivePreview()) {
        <div
          (click)="$event.stopPropagation()"
          class="fixed top-4 bottom-4 right-4 z-[999999999] w-[48vw] min-w-[380px] max-w-[calc(100vw-2rem)] rounded-3xl bg-[#0D0D0D] border border-amber-500/50 shadow-[0_25px_95px_rgba(0,0,0,0.98)] backdrop-blur-3xl flex flex-col overflow-hidden animate-scale-up select-none"
        >
          <!-- Header del Side Modal Window -->
          <div class="shrink-0 p-5 bg-surface-container-high/90 border-b border-outline-variant/30 flex items-center justify-between gap-3 backdrop-blur-2xl">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold shrink-0 shadow-md">
                <span class="material-symbols-outlined text-xl">visibility</span>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h5 class="text-xs font-black uppercase tracking-wider text-on-surface truncate">Vista Previa de Cliente</h5>
                  <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[8px] font-black uppercase tracking-widest border border-emerald-500/30">En Vivo</span>
                </div>
                <span class="text-[10px] text-outline font-mono block truncate mt-0.5">/events/comprar-boletos?id={{ e.id }}</span>
              </div>
            </div>

            <button
              type="button"
              (click)="showLivePreview.set(false)"
              class="w-10 h-10 rounded-2xl bg-surface-container-highest hover:bg-surface-bright text-outline hover:text-on-surface flex items-center justify-center border border-outline-variant/30 transition-all shadow-md hover:scale-105 active:scale-95"
              title="Cerrar vista previa"
            >
              <span class="material-symbols-outlined text-lg font-bold">close</span>
            </button>
          </div>

          <!-- Body de la Vista Previa -->
          <!-- Dos columnas cuando el panel es ancho, igual que la ficha real
               del cliente; en pantallas chicas cae a una sola columna. -->
          <div class="flex-1 overflow-y-auto p-5 custom-scrollbar grid grid-cols-1 2xl:grid-cols-2 gap-5 content-start">
            
            <!-- Cover Hero -->
            <div class="2xl:col-span-2 relative h-48 rounded-2xl overflow-hidden bg-surface-container-high border border-white/10 shadow-xl">
              @if (publicProfile(e).coverUrl) {
                <img [src]="publicProfile(e).coverUrl" alt="Portada" class="w-full h-full object-cover brightness-[0.45]" />
              }
              <div class="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/40 to-transparent"></div>
              <div class="absolute bottom-0 inset-x-0 p-4 space-y-1.5">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-[9px] font-black uppercase tracking-widest">
                    {{ publicProfile(e).category }}
                  </span>
                  <span class="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[9px] font-bold flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs text-primary">schedule</span>
                    {{ shortDate(e.date) }}
                  </span>
                </div>
                <h3 class="font-black text-xl uppercase tracking-wide text-white leading-tight line-clamp-2">
                  {{ e.title }}
                </h3>
                <p class="text-xs text-white/80 font-light line-clamp-2">
                  {{ publicProfile(e).tagline || 'Sin frase de portada' }}
                </p>
              </div>
            </div>

            <!-- Ficha de presentación -->
            <div class="rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-3 shadow-md">
              <span class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">info</span> Información del Evento
              </span>
              <p class="text-xs text-white/70 leading-relaxed">
                {{ publicProfile(e).about || 'Sin texto de presentación. Completa el campo en el panel para previsualizar.' }}
              </p>
              <!-- Los mismos cuatro datos que la ficha real pone bajo el título. -->
              <div class="grid grid-cols-2 gap-2 pt-1">
                <div class="bg-white/5 border border-white/10 p-3 rounded-xl">
                  <span class="text-[9px] text-white/50 uppercase font-bold block">Fecha</span>
                  <span class="text-xs text-white font-bold">{{ shortDate(e.date) }}</span>
                </div>
                <div class="bg-white/5 border border-white/10 p-3 rounded-xl">
                  <span class="text-[9px] text-white/50 uppercase font-bold block">Categoría</span>
                  <span class="text-xs text-white font-bold truncate block">{{ publicProfile(e).category }}</span>
                </div>
                <div class="bg-white/5 border border-white/10 p-3 rounded-xl">
                  <span class="text-[9px] text-white/50 uppercase font-bold block">Precios desde</span>
                  <span class="text-xs text-emerald-400 font-bold truncate block">{{ previewLowestPrice(e) }}</span>
                </div>
                <div class="bg-white/5 border border-white/10 p-3 rounded-xl">
                  <span class="text-[9px] text-white/50 uppercase font-bold block">Garantía</span>
                  <span class="text-xs text-white font-bold truncate block">{{ publicProfile(e).guaranteeLabel || 'Acordex VIP' }}</span>
                </div>
                <div class="bg-white/5 border border-white/10 p-3 rounded-xl col-span-2">
                  <span class="text-[9px] text-white/50 uppercase font-bold block">Recinto</span>
                  <span class="text-xs text-emerald-400 font-bold truncate block">{{ e.venue }}</span>
                </div>
              </div>
            </div>

            <!-- Cartel + Lineup -->
            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-1">
                <div class="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] shadow-md">
                  @if (publicProfile(e).posterUrl) {
                    <img [src]="publicProfile(e).posterUrl" alt="Cartel" class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-white/40 text-[9px] text-center p-2">
                      Falta cartel 3:4
                    </div>
                  }
                </div>
              </div>

              <div class="col-span-2 rounded-2xl bg-white/[0.03] border border-white/10 p-3 space-y-2 shadow-md">
                <span class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">groups</span> Line-up de Artistas
                </span>

                <!-- Los grupos ajenos que aún no responden SÍ se muestran, pero
                     marcados: el encargado tiene que ver cómo quedaría la ficha
                     si aceptan, sabiendo que podrían no aparecer si no aceptan. -->
                @for (slot of previewSlots(); track slot.id) {
                  <div class="flex items-center gap-2 p-2 rounded-xl border"
                    [class]="isTentativeSlot(slot) ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'">
                    @if (slot.imageUrl) {
                      <img [src]="slot.imageUrl" [alt]="slot.groupName" class="w-8 h-8 rounded-xl object-cover shrink-0"
                        [class.opacity-60]="isTentativeSlot(slot)" />
                    } @else {
                      <span class="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-xs text-white/40">no_photography</span>
                      </span>
                    }
                    <div class="min-w-0 flex-1">
                      <span class="text-xs font-bold truncate block"
                        [class]="isTentativeSlot(slot) ? 'text-amber-100' : 'text-white'">{{ slot.groupName }}</span>
                      <span class="text-[9px] text-white/50 truncate block">{{ slot.genre || 'Sin género' }}</span>
                    </div>
                    @if (isTentativeSlot(slot)) {
                      <span class="px-1.5 py-0.5 rounded-md bg-amber-500/25 text-amber-200 border border-amber-400/40 text-[8px] font-black uppercase tracking-wider shrink-0 flex items-center gap-0.5"
                        [title]="'Depende de ' + slot.managerName + ': si no acepta, este grupo no aparecerá en la ficha del cliente'">
                        <span class="material-symbols-outlined text-[9px]">hourglass_top</span> Pendiente
                      </span>
                    }
                  </div>
                } @empty {
                  <p class="text-xs text-white/40 italic">Sin grupos en el cartel todavía</p>
                }

                @if (tentativeSlots().length) {
                  <p class="text-[9px] text-amber-200/80 leading-snug flex items-start gap-1 pt-1 border-t border-white/10">
                    <span class="material-symbols-outlined text-[11px] shrink-0 mt-0.5">info</span>
                    {{ tentativeSlots().length }} grupo(s) siguen sin confirmar. Así se vería la ficha si aceptan;
                    si alguno rechaza, desaparece de aquí.
                  </p>
                }
              </div>
            </div>

            <!-- Saludos y mensajes de los artistas / Videos de invitación -->
            <div class="rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-4 shadow-inner">
              <span class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-white/10 pb-2">
                <span class="material-symbols-outlined text-sm text-purple-400">videocam</span> Saludos y Mensajes de los Artistas
              </span>

              <!-- 1. VIDEOS GENERALES DEL EVENTO (Añadidos en la pestaña de Contenido / Ficha Pública)
                   Se muestran DIRECTAMENTE SIN NINGÚN TÍTULO superior sobre el video -->
              @for (v of previewVideoData().generalVideos; track v.id) {
                <div class="rounded-xl overflow-hidden bg-black/50 border border-purple-500/30">
                  @if (v.title) {
                    <div class="px-2.5 py-1.5 bg-white/5 border-b border-white/5">
                      <span class="text-[10px] font-semibold text-white/80 block truncate">{{ v.title }}</span>
                    </div>
                  }
                  <div class="aspect-video bg-black relative flex flex-col items-center justify-center gap-2 text-white/80 p-3">
                    @if (v.url) {
                      <span class="material-symbols-outlined text-4xl text-purple-400">play_circle</span>
                      <span class="text-[9px] font-mono uppercase tracking-widest text-purple-200">
                        {{ v.type === 'youtube' ? 'YouTube' : 'Video Subido' }}
                      </span>
                    } @else {
                      <span class="material-symbols-outlined text-3xl text-white/40">play_circle</span>
                      <span class="text-[10px] text-white/50 italic text-center">
                        Video sin enlace capturado
                      </span>
                    }
                  </div>
                </div>
              }

              <!-- 2. VIDEOS DE INVITACIÓN POR GRUPO (Cada grupo en su sección con su NOMBRE como TÍTULO) -->
              @for (group of previewVideoData().groupSections; track group.groupName) {
                <div class="rounded-xl bg-white/[0.04] border border-white/10 p-3 space-y-2.5">
                  <!-- Encabezado con el Nombre del Grupo -->
                  <div class="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                    <h5 class="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-xs text-amber-400">stars</span>
                      {{ group.groupName }}
                    </h5>
                    <div class="flex items-center gap-1.5 shrink-0">
                      @if (group.tentative) {
                        <span class="px-1.5 py-0.5 rounded-md bg-amber-500/25 text-amber-200 border border-amber-400/40 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5">
                          <span class="material-symbols-outlined text-[9px]">hourglass_top</span> Pendiente
                        </span>
                      }
                      <span class="text-[9px] font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-md">
                        {{ group.videos.length }} {{ group.videos.length === 1 ? 'video' : 'videos' }}
                      </span>
                    </div>
                  </div>

                  <div class="space-y-2">
                    @for (v of group.videos; track v.id) {
                      <div class="rounded-lg overflow-hidden bg-black/60 border border-white/10">
                        @if (v.title) {
                          <div class="px-2.5 py-1.5 bg-white/5 border-b border-white/5">
                            <span class="text-[10px] font-semibold text-white/80 block truncate">{{ v.title }}</span>
                          </div>
                        }
                        <div class="aspect-video bg-black relative flex flex-col items-center justify-center gap-1.5 text-white/70 p-3">
                          @if (v.url) {
                            <span class="material-symbols-outlined text-3xl text-purple-400">play_circle</span>
                            <span class="text-[9px] font-mono uppercase tracking-widest text-white/60">
                              {{ v.type === 'youtube' ? 'YouTube' : 'Video Subido' }}
                            </span>
                          } @else {
                            <span class="text-[10px] text-rose-300 italic text-center">
                              Sin enlace capturado
                            </span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Mensaje por defecto cuando NO HAY NINGÚN VIDEO capturado -->
              @if (!previewVideoData().generalVideos.length && !previewVideoData().groupSections.length) {
                <p class="text-xs text-white/40 italic text-center py-2">
                  Sin saludos en video ni videos de invitación capturados.
                </p>
              }
            </div>

            <!-- Reglas e info adicional -->
            <div class="rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-2 text-xs text-white/70 shadow-md">
              <span class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5 mb-1">
                <span class="material-symbols-outlined text-sm">gavel</span> Reglas del Evento
              </span>
              <ul class="list-disc list-inside space-y-1">
                @for (rule of publicProfile(e).rules; track rule.id) {
                  <li class="text-white/60 font-light">{{ rule.text }}</li>
                } @empty {
                  <li class="text-white/30 italic list-none">Sin reglas capturadas</li>
                }
              </ul>
            </div>

            <!-- Boletos disponibles y categorías -->
            <div class="rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-3 shadow-inner">
              <span class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">confirmation_number</span> Boletos Disponibles
              </span>

              <div>
                <span class="text-2xl font-black text-white block leading-tight">{{ previewPriceRange(e) }}</span>
                <span class="text-[10px] text-white/40">
                  Cargo por servicio no incluido
                  @if (publicProfile(e).serviceFeePerSeat) {
                    · {{ money(publicProfile(e).serviceFeePerSeat || 0) }} por asiento
                  }
                </span>
              </div>

              <div class="space-y-2 pt-1">
                @for (tier of e.ticketTiers; track tier.id || tier.name) {
                  <div class="flex items-start justify-between gap-2 pb-2 border-b border-white/5 last:border-0">
                    <div class="min-w-0">
                      <span class="text-[11px] font-bold text-white block truncate">{{ tier.name }}</span>
                      @if (tier.description) {
                        <span class="text-[9px] text-white/40 font-light block truncate">{{ tier.description }}</span>
                      }
                    </div>
                    <span class="text-[11px] font-black text-emerald-400 shrink-0">{{ money(tier.price) }}</span>
                  </div>
                } @empty {
                  <p class="text-xs text-white/30 italic">Sin categorías de boleto capturadas</p>
                }
              </div>

              <!-- Cierre de venta: el cliente necesita saber hasta cuándo compra. -->
              <div class="flex items-center gap-2 pt-1 text-[10px] text-amber-300 border-t border-white/5 mt-1">
                <span class="material-symbols-outlined text-sm">timer_off</span>
                <span>{{ salesCloseLabel(e) }}</span>
              </div>
            </div>

            <!-- Ubicación -->
            <div class="rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-1.5 shadow-inner">
              <span class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">location_on</span> Ubicación del Evento
              </span>
              <p class="text-sm font-black text-white">{{ e.venue }}</p>
              <p class="text-[11px] text-white/50 font-light">{{ e.venueAddress || e.location }}</p>
              @if (!e.venueAddress) {
                <p class="text-[10px] text-amber-300 flex items-center gap-1 pt-0.5">
                  <span class="material-symbols-outlined text-xs">warning</span>
                  Sin dirección: el mapa del cliente quedará impreciso.
                </p>
              }
            </div>

            <!-- Contacto de Soporte -->
            <div class="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs text-white/80 space-y-1 shadow-md">
              <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Soporte & Compra Telefónica</span>
              <p class="font-bold text-white text-sm">{{ publicProfile(e).supportPhone || 'No definido' }}</p>
              <p class="text-[10px] text-emerald-300/70">WhatsApp: {{ publicProfile(e).supportWhatsApp || 'No definido' }}</p>
            </div>

          </div>

          <!-- Footer del Side Modal Window -->
          <div class="shrink-0 p-4 border-t border-outline-variant/20 bg-surface-container-high/90 backdrop-blur-2xl text-center">
            <span class="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-xs animate-spin">sync</span> Sincronizado en tiempo real
            </span>
          </div>

        </div>
      }
    }
  `
})
export class EventDetailModalComponent {
  roleService = inject(RoleService);
  /**
   * Quién está mirando el expediente.
   *
   * Hacía falta y no estaba: sin sesión, la comprobación de "¿eres el creador?"
   * se resolvía con nombres escritos a mano en el código y acababa comparando el
   * evento consigo mismo.
   */
  sessionService = inject(SessionService);

  event = input<EventItem | null>(null);
  availableGroups = input<GroupItem[]>([]);

  @Output() closed = new EventEmitter<void>();
  @Output() uploadEvidence = new EventEmitter<EventItem>();
  @Output() submitReview = new EventEmitter<EventItem>();
  @Output() approve = new EventEmitter<{ event: EventItem; approvalId: string }>();
  @Output() reject = new EventEmitter<{ event: EventItem; approvalId: string; reason: string }>();
  @Output() publish = new EventEmitter<{ event: EventItem; scheduledAt?: string }>();
  @Output() returnToReview = new EventEmitter<{ event: EventItem; reason: string }>();
  @Output() simulateSale = new EventEmitter<{ event: EventItem; quantity: number; tierId?: string }>();
  @Output() postpone = new EventEmitter<{ event: EventItem; newDate: string; reason: string; clientNotice?: string; videoUrl?: string; flyerUrl?: string }>();
  @Output() finish = new EventEmitter<EventItem>();
  @Output() confirmClosure = new EventEmitter<{ event: EventItem; managerName: string; notes?: string }>();
  @Output() cancel = new EventEmitter<{ event: EventItem; reason: string }>();
  @Output() seal = new EventEmitter<EventItem>();
  @Output() patch = new EventEmitter<Partial<EventItem>>();

  activeTab = signal<EventDetailTab>('evento');
  showLivePreview = signal(false);

  croquisEditorOpen = signal(false);
  croquisEditorPlanId = signal<string | null>(null);

  // ─── Diálogos de acción de ciclo de vida ───
  publishModalOpen = signal(false);
  publishMode = signal<'immediate' | 'scheduled'>('immediate');
  publishScheduleDate = signal('');

  returnReviewModalOpen = signal(false);
  returnReviewReason = signal('');

  postponeModalOpen = signal(false);
  postponeNewDate = signal('');
  postponeReason = signal('');
  postponeClientNotice = signal('');
  postponeVideoUrl = signal('');
  postponeFlyerUrl = signal('');

  simulateSaleModalOpen = signal(false);
  simulateSaleQty = signal(1);
  simulateSaleTierId = signal<string | null>(null);

  /** Abre el editor de croquis, opcionalmente en un croquis concreto. */
  openCroquisEditor(planId: string | null): void {
    this.croquisEditorPlanId.set(planId);
    this.croquisEditorOpen.set(true);
  }

  publicProfile = publicProfile;
  shortDate = shortDate;
  dateTimeLabel = dateTimeLabel;
  money = money;
  pendingApprovals = pendingApprovals;
  isClosureComplete = isClosureComplete;

  respondingId = signal<string | null>(null);
  cancelling = signal(false);
  rejectionReason = '';
  cancelReason = '';
  scheduleAt = '';

  meta = computed(() => eventStateMeta(this.event()?.state));

  /** Saludos en video capturados para la ficha pública. */
  greetingVideos(e: EventItem) {
    return publicProfile(e).greetingVideos ?? [];
  }

  /**
   * Rango de precios tal como lo pinta la ficha del cliente. Si solo hay una
   * categoría se muestra un precio suelto en vez de un rango con el mismo
   * número dos veces.
   */
  previewPriceRange(e: EventItem): string {
    const prices = (e.ticketTiers ?? []).map(t => t.price).filter(p => p > 0);
    if (!prices.length) return 'Sin precios';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? money(min) : `${money(min)} – ${money(max)}`;
  }

  /** Precio más barato del boletaje: es el "Precios desde" de la ficha. */
  previewLowestPrice(e: EventItem): string {
    const prices = (e.ticketTiers ?? []).map(t => t.price).filter(p => p > 0);
    return prices.length ? money(Math.min(...prices)) : 'Sin precios';
  }

  /** Frase de cierre de venta, con la fecha ya resuelta a partir de los días. */
  salesCloseLabel(e: EventItem): string {
    const days = publicProfile(e).salesCloseDaysBefore;
    if (days == null) return 'Cierre de venta sin definir';
    if (days === 0) return 'La venta cierra el mismo día del evento';

    const label = days === 1 ? '1 día antes' : `${days} días antes`;
    const base = new Date(e.date + 'T00:00:00');
    if (isNaN(base.getTime())) return `La venta cierra ${label} del evento`;

    base.setDate(base.getDate() - days);
    return `La venta cierra ${label} (${shortDate(base.toISOString().slice(0, 10))})`;
  }

  /**
   * Ruta feliz del evento, en orden. 'Cancelado' queda fuera a propósito: no es
   * un paso del camino sino una salida, y pintarlo como una etapa más haría
   * creer que todo evento termina cancelándose.
   */
  /**
   * Un color por apartado. El encargado deja de leer la palabra y empieza a
   * reconocer la sección por su color: dinero en verde, boletaje en cyan,
   * producción en violeta. Se escriben las clases completas porque Tailwind
   * solo genera el CSS de lo que encuentra literal en el código.
   */
  private static readonly TAB_ACCENT: Record<string, { accentActiveClass: string; accentIdleClass: string }> = {
    evento:       { accentActiveClass: 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-amber-500/30 border-amber-300/50',   accentIdleClass: 'text-amber-300/80' },
    resumen:      { accentActiveClass: 'bg-gradient-to-r from-sky-400 to-sky-500 text-black shadow-sky-500/30 border-sky-300/50',          accentIdleClass: 'text-sky-300/80' },
    produccion:   { accentActiveClass: 'bg-gradient-to-r from-violet-400 to-violet-500 text-black shadow-violet-500/30 border-violet-300/50', accentIdleClass: 'text-violet-300/80' },
    boletaje:     { accentActiveClass: 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-black shadow-cyan-500/30 border-cyan-300/50',      accentIdleClass: 'text-cyan-300/80' },
    tareas:       { accentActiveClass: 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-amber-500/30 border-amber-300/50',   accentIdleClass: 'text-amber-300/80' },
    revision:     { accentActiveClass: 'bg-gradient-to-r from-orange-400 to-orange-500 text-black shadow-orange-500/30 border-orange-300/50', accentIdleClass: 'text-orange-300/80' },
    venta:        { accentActiveClass: 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-black shadow-emerald-500/30 border-emerald-300/50', accentIdleClass: 'text-emerald-300/80' },
    cierre:       { accentActiveClass: 'bg-gradient-to-r from-purple-400 to-purple-500 text-black shadow-purple-500/30 border-purple-300/50', accentIdleClass: 'text-purple-300/80' },
    acuerdos:     { accentActiveClass: 'bg-gradient-to-r from-teal-400 to-teal-500 text-black shadow-teal-500/30 border-teal-300/50',       accentIdleClass: 'text-teal-300/80' },
    trazabilidad: { accentActiveClass: 'bg-gradient-to-r from-slate-300 to-slate-400 text-black shadow-slate-400/30 border-slate-200/50',  accentIdleClass: 'text-slate-300/80' }
  };

  private static readonly PHASE_PATH: EventState[] = [
    'Borrador', 'En Revisión', 'Próximo a Publicar', 'Publicado',
    'En Venta', 'Finalizada', 'Cerrado'
  ];

  /**
   * Línea de fases del expediente. Da de un vistazo dónde está el evento, qué
   * ya quedó atrás y qué falta — que es justo lo que un encargado necesita
   * deducir al abrir el expediente sin leer nada.
   */
  phaseSteps = computed(() => {
    const current = this.event()?.state;
    const path = EventDetailModalComponent.PHASE_PATH;
    const cancelled = current === 'Cancelado';
    const idx = cancelled ? -1 : path.indexOf(current as EventState);

    return path.map((state, i) => {
      const m = eventStateMeta(state);
      return {
        state,
        label: m.shortLabel,
        icon: m.icon,
        textColor: m.textColor,
        badgeClass: m.badgeClass,
        step: i + 1,
        isCurrent: i === idx,
        isDone: idx > -1 && i < idx
      };
    });
  });

  /** El evento salió del camino: se muestra un aviso en vez de la línea de fases. */
  isCancelled = computed(() => this.event()?.state === 'Cancelado');

  // ─── Acuerdos entre managers ───────────────────────────────────────────────

  /**
   * Managers que participan. Si el evento no trae acuerdos capturados se asume
   * el caso simple: lo organiza un solo manager, que se queda con todo.
   */
  agreements = computed<EventManagerAgreement[]>(() => {
    const e = this.event();
    if (!e) return [];
    if (e.managerAgreements?.length) return e.managerAgreements;
    return [{
      id: 'agr-' + e.id + '-owner',
      managerName: e.ownerManagerName || e.createdBy,
      role: 'organizador',
      settlementKind: 'porcentaje',
      percent: 100,
      status: 'Aceptado'
    }];
  });

  /**
   * Suma de los porcentajes pactados. Los managers con monto fijo no entran:
   * cobran aparte y no consumen porcentaje de las ganancias.
   */
  agreedPercentTotal = computed(() =>
    this.agreements()
      .filter(a => a.settlementKind === 'porcentaje')
      .reduce((sum, a) => sum + (a.percent || 0), 0)
  );

  /** Suma comprometida en montos fijos, que se liquidan a mano al cierre. */
  agreedFixedTotal = computed(() =>
    this.agreements()
      .filter(a => a.settlementKind === 'fijo')
      .reduce((sum, a) => sum + (a.fixedAmount || 0), 0)
  );

  /** Un reparto por porcentaje que no suma 100 deja ganancias sin dueño. */
  percentMismatch = computed(() => {
    const total = this.agreedPercentTotal();
    return total > 0 && Math.abs(total - 100) > 0.01;
  });

  pendingAgreements = computed(() => this.agreements().filter(a => a.status === 'Pendiente'));

  /** En borrador nada sale del evento: ni solicitudes ni invitaciones. */
  isDraft = computed(() => this.event()?.state === 'Borrador');

  /** Invitaciones decididas en el borrador que aún no le llegan a su manager. */
  unsentInvites = computed(() => this.agreements().filter(a => a.status === 'Sin Enviar'));

  /** Solicitudes de grupo que salen al enviar el evento a revisión. */
  unsentRequests = computed(() => {
    const e = this.event();
    return e ? unsentLineupRequests(e) : [];
  });

  /** Rubros de producción encargados a otro manager que aún no salen. */
  unsentAssignments = computed(() => {
    const e = this.event();
    return e ? unsentResponsibilities(e) : [];
  });

  /** Todo lo que el evento tiene guardado esperando el envío a revisión. */
  outboundCount = computed(() => {
    const e = this.event();
    return e ? pendingOutboundCount(e) : 0;
  });

  /** Vía por la que entró un grupo ajeno, para etiquetarlo en los acuerdos. */
  engagementOf(slot: EventLineupSlot): 'propio' | 'cotizacion' | 'coorganizacion' {
    const e = this.event();
    return e ? slotEngagement(e, slot) : 'propio';
  }

  /** Importe que se le ofrece al dueño del grupo por una cotización directa. */
  offerAmount = slotOfferAmount;

  agreementStatusClass(status: EventAgreementStatus): string {
    switch (status) {
      case 'Aceptado': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Pendiente': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Sin Enviar': return 'bg-surface-container-highest text-outline border-outline-variant/40';
      default: return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
  }

  agreementStatusLabel(status: EventAgreementStatus): string {
    return status === 'Sin Enviar' ? 'Por enviar' : status;
  }

  inviteModalOpen = signal(false);

  /**
   * Managers a los que todavía se puede invitar, con sus grupos y su agenda.
   * Se excluye al organizador y a quien ya participa: volver a invitarlos no
   * significa nada.
   */
  invitableManagers = computed(() => {
    const e = this.event();
    if (!e) return [];
    const yaDentro = new Set(this.agreements().map(a => a.managerName));
    const owner = e.ownerManagerName || e.createdBy;

    const porManager = new Map<string, GroupItem[]>();
    for (const g of this.availableGroups()) {
      const manager = g.groupLeaderName;
      if (!manager || manager === owner || yaDentro.has(manager)) continue;
      porManager.set(manager, [...(porManager.get(manager) ?? []), g]);
    }

    return [...porManager.entries()].map(([name, groups]) => ({
      name,
      groups,
      freeCount: groups.filter(g => g.agendaStatus === 'Totalmente Libre').length
    }));
  });

  /**
   * Alta del co-organizador. Entra sin reparto: el porcentaje o el monto se
   * pactan después, cuando el manager acepte. Darle un número por defecto aquí
   * sería inventar un acuerdo que nadie hizo.
   *
   * Y entra 'Sin Enviar' mientras el evento sea borrador: la invitación no sale
   * al armar el borrador sino al enviarlo a revisión, igual que las solicitudes
   * de cotización directa. Invitar a alguien a co-organizar un evento que aún no
   * existe es pedirle que evalúe algo a medias.
   */
  inviteManager(managerName: string): void {
    const e = this.event();
    if (!e) return;

    const draft = this.isDraft();
    const nuevo: EventManagerAgreement = {
      id: 'agr-' + e.id + '-' + Date.now(),
      managerName,
      role: 'coorganizador',
      settlementKind: 'porcentaje',
      percent: 0,
      status: draft ? 'Sin Enviar' : 'Pendiente',
      invitedAt: draft ? undefined : new Date().toISOString().slice(0, 16)
    };

    this.patch.emit({ managerAgreements: [...this.agreements(), nuevo] });
    this.inviteModalOpen.set(false);
  }

  /** Retira una invitación que todavía no ha salido del borrador. */
  cancelInvitation(agreement: EventManagerAgreement): void {
    if (agreement.status !== 'Sin Enviar') return;
    this.patch.emit({ managerAgreements: this.agreements().filter(a => a.id !== agreement.id) });
  }

  /** Acción rápida para pruebas: cambia el estado de la solicitud entre Pendiente y Aceptado */
  toggleAgreementStatus(agreement: EventManagerAgreement): void {
    const nextStatus: EventAgreementStatus = agreement.status === 'Aceptado' ? 'Pendiente' : 'Aceptado';
    const updated: EventManagerAgreement[] = this.agreements().map(a => (
      a.id === agreement.id
        ? {
            ...a,
            status: nextStatus,
            viewedAt: a.viewedAt || new Date().toISOString().slice(0, 16),
            respondedAt: nextStatus === 'Aceptado' ? new Date().toISOString().slice(0, 16) : undefined
          }
        : a
    ));
    this.patch.emit({ managerAgreements: updated });
  }

  /**
   * Grupos del cartel que pertenecen a otro manager. De estos sí se ve el
   * precio, porque su dueño publicó una tarifa para ser contratado.
   */
  externalSlots = computed(() => this.slots().filter(s => s.isExternal));

  /**
   * Lo que cuesta un grupo. Manda el total pactado tras la negociación; si
   * todavía no lo hay, se suma el desglose que propuso el dueño del grupo.
   */
  slotCost(slot: EventLineupSlot): number {
    if (slot.agreedTotal != null) return slot.agreedTotal;
    return (slot.costItems ?? []).reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  croquisCapacityHelper(e: EventItem): number {
    return croquisCapacity(e);
  }

  managerLineupSlots(managerName: string): EventLineupSlot[] {
    const e = this.event();
    if (!e) return [];
    return (e.lineup || []).filter(s => s.managerName === managerName);
  }

  managerTasks(managerName: string) {
    const e = this.event();
    if (!e) return [];
    return resolveTasks(e).filter(t => t.assignedManager === managerName);
  }

  managerTasksMetrics(managerName: string) {
    const tasks = this.managerTasks(managerName);
    const pending = tasks.filter(t => !t.done).length;
    const blocking = tasks.filter(t => t.blocking && !t.done).length;
    const completed = tasks.filter(t => t.done).length;
    const top3 = tasks.filter(t => !t.done).slice(0, 3);
    return { pending, blocking, completed, top3 };
  }

  estimatedShareLabel(a: EventManagerAgreement): string {
    const e = this.event();
    if (!e) return '$0';
    const potentialRevenue = potentialTicketRevenue(e);
    const prod = productionCost(e);
    const net = Math.max(0, potentialRevenue - prod);

    if (a.settlementKind === 'porcentaje') {
      const share = net * ((a.percent || 0) / 100);
      return money(share);
    } else {
      return money(a.fixedAmount || 0);
    }
  }

  lineupApprovalClass(status: LineupApprovalStatus): string {
    switch (status) {
      case 'Aprobado': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Pendiente': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Rechazado': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Sin Enviar': return 'bg-surface-container-highest text-outline border-outline-variant/40';
      default: return 'bg-surface-container-highest text-outline border-outline-variant/30';
    }
  }

  /** 'Sin Enviar' se lee como "por enviar": falta mandarla, no se descartó. */
  lineupApprovalLabel(status: LineupApprovalStatus): string {
    return status === 'Sin Enviar' ? 'Por enviar' : status;
  }

  /** Número de fase actual (1..n) para el contador "Fase X de Y". */
  currentStep = computed(() => {
    const found = this.phaseSteps().find(p => p.isCurrent);
    return found ? found.step : 0;
  });

  /**
   * Geometría del riel del stepper. Los nodos van centrados dentro de columnas
   * de igual ancho, así que el centro del nodo i cae en (i + 0.5)/n. El riel
   * debe empezar y terminar justo en el centro del primer y del último nodo,
   * de ahí el margen de media columna a cada lado.
   */
  phaseTrackInset = computed(() => 100 / (2 * this.phaseSteps().length));

  /** Cuánto del riel se pinta como recorrido, en % del propio riel. */
  phaseProgressPercent = computed(() => {
    const n = this.phaseSteps().length;
    if (n < 2) return 0;
    const i = this.currentStep() - 1;
    return i <= 0 ? 0 : (i / (n - 1)) * 100;
  });

  policy = computed(() => {
    const e = this.event();
    if (!e || !this.roleService.canEditEvents()) {
      return { identity: false, publicProfile: false, lineup: false, production: false, tickets: false, closure: false };
    }
    return eventEditPolicy(e.state);
  });

  /**
   * Pestañas visibles según el estado del ciclo de vida del evento.
   */
  tabs = computed<TabPillItem[]>(() => {
    const e = this.event();
    if (!e) return [];

    const state = e.state;
    const list: TabPillItem[] = [];

    // 1. Resumen: Siempre presente
    const resumenBadge = (state === 'Borrador' || state === 'En Revisión')
      ? this.report().percent + '%'
      : (state === 'Finalizada' ? (isClosureComplete(e) ? 'Listo' : 'Pendiente') : undefined);
    list.push({
      value: 'resumen',
      label: 'Resumen',
      icon: 'dashboard',
      badge: resumenBadge,
      ...EventDetailModalComponent.TAB_ACCENT['resumen']
    });

    // La revisión del cartel no tiene pestaña: cada grupo lleva su estado y su
    // motivo en su propia tarjeta, dentro del Cartel.

    // 3. Ficha Principal del Evento
    list.push({
      value: 'evento',
      label: 'Evento',
      icon: 'event',
      badge: String(this.slots().length),
      ...EventDetailModalComponent.TAB_ACCENT['evento']
    });

    // La venta no tiene pestaña propia: sus cifras se leen en Boletaje & Croquis,
    // que es donde se define el aforo del que salen, y la ficha de publicación
    // vive en el Resumen. Tenerla aparte obligaba a mantener dos vistas del
    // mismo número y ya se habían desincronizado los formatos.

    // 5. Cierre (en Finalizada y Cerrado)
    if (state === 'Finalizada' || state === 'Cerrado' || e.closure) {
      list.push({
        value: 'cierre',
        label: 'Cierre',
        icon: 'fact_check',
        badge: state === 'Cerrado' ? 'Sellado' : (isClosureComplete(e) ? 'Listo' : 'Pendiente'),
        ...EventDetailModalComponent.TAB_ACCENT['cierre']
      });
    }

    // 6. Producción y Boletaje
    list.push({
      value: 'produccion',
      label: 'Producción',
      icon: 'speaker',
      ...EventDetailModalComponent.TAB_ACCENT['produccion']
    });

    list.push({
      value: 'boletaje',
      label: 'Boletaje & Croquis',
      icon: 'confirmation_number',
      ...EventDetailModalComponent.TAB_ACCENT['boletaje']
    });

    // 7. Tareas y Acuerdos
    const pendingTasks = resolveTasks(e).filter(t => !t.done).length;
    list.push({
      value: 'tareas',
      label: 'Tareas',
      icon: 'assignment',
      badge: pendingTasks > 0 ? String(pendingTasks) : undefined,
      ...EventDetailModalComponent.TAB_ACCENT['tareas']
    });

    list.push({
      value: 'acuerdos',
      label: 'Acuerdos',
      icon: 'handshake',
      badge: this.agreements().length ? String(this.agreements().length) : undefined,
      ...EventDetailModalComponent.TAB_ACCENT['acuerdos']
    });

    // 8. Trazabilidad
    list.push({
      value: 'trazabilidad',
      label: 'Trazabilidad',
      icon: 'timeline',
      ...EventDetailModalComponent.TAB_ACCENT['trazabilidad']
    });

    return list;
  });

  report = computed(() => eventCompleteness(this.event() ?? ({} as EventItem)));

  // ─── Quién carga con qué ──────────────────────────────────────────────────

  /**
   * El reparto del trabajo por disquera.
   *
   * Se calcula del cruce de tareas y desglose porque ninguna de las dos cosas lo
   * contesta sola: las tareas dicen quién se comprometió y el desglose cuánto
   * costó cumplirlo. Antes había que leer las dos pestañas y juntarlas de cabeza.
   */
  workloads = computed(() => {
    const e = this.event();
    return e ? managerWorkloads(e) : [];
  });

  /** Lo que le falta a esta disquera, recortado a lo que cabe en la tarjeta. */
  pendingOf(w: ManagerWorkload): ResolvedTask[] {
    return [...w.required, ...w.optional].filter(t => !t.done).slice(0, 4);
  }

  pendingCountOf(w: ManagerWorkload): number {
    return w.required.filter(t => !t.done).length + w.optional.filter(t => !t.done).length;
  }

  // ─── Reparto de pendientes ────────────────────────────────────────────────

  /** True si el punto lo puede resolver el propio organizador. */
  isOwnItem(item: CompletenessItem): boolean {
    return item.pendingOwners.includes(this.report().organizer);
  }

  /** Managers distintos del organizador que bloquean un punto. */
  foreignOwners(item: CompletenessItem): string[] {
    const organizer = this.report().organizer;
    return item.pendingOwners.filter(o => o !== organizer);
  }

  /**
   * Lo que se lee al pasar por encima de un punto del checklist: si ya está,
   * quién respondió por él; si falta, a quién le toca, si bloquea el envío y qué
   * hay que hacer. Es la información que de otro modo obligaría a abrir el
   * apartado correspondiente para averiguar quién debe moverse.
   */
  itemTooltip(item: CompletenessItem): string {
    const organizer = this.report().organizer;
    const nombres = (list: string[]) =>
      list.map(o => (o === organizer ? 'tú' : o)).join(', ') || 'nadie';

    if (item.done) {
      return `${item.label}\n\n✓ Capturado. Responde por este dato: ${nombres(item.owners)}.`;
    }

    const lineas = [
      item.label,
      '',
      item.required
        ? '⚠ Obligatorio: sin esto no se puede enviar a revisión.'
        : 'Recomendado: no bloquea el envío, pero deja la ficha del cliente incompleta.',
      `Le toca a: ${nombres(item.pendingOwners)}.`
    ];

    // Cuando el pendiente es de otro manager, lo útil no es el "cómo se hace"
    // —el organizador no puede hacerlo— sino si esa persona ya puede trabajar.
    const ajenos = this.foreignOwners(item);
    if (ajenos.length) {
      lineas.push('', ajenos.map(o => `${o}: ${this.ownerAvailability(o)}`).join('\n'));
    } else if (item.hint) {
      lineas.push('', `Cómo cumplirlo: ${item.hint}`);
    }

    return lineas.join('\n');
  }

  /** En qué situación está un manager ajeno para poder capturar lo suyo. */
  private ownerAvailability(managerName: string): string {
    const invite = this.invitationOf(managerName);
    if (!invite) return 'no co-organiza el evento; el dato sale del expediente de su grupo';
    switch (invite.status) {
      case 'Sin Enviar': return 'aún no recibe la invitación (sale al enviar a revisión)';
      case 'Pendiente': return 'ya recibió la invitación y no ha respondido';
      case 'Aceptado': return 'ya aceptó co-organizar; puede capturarlo cuando quiera';
      default: return 'rechazó co-organizar el evento';
    }
  }

  /** Acuerdo de un manager en este evento, si es que lo tiene. */
  invitationOf(managerName: string): EventManagerAgreement | null {
    return this.agreements().find(a => a.managerName === managerName) ?? null;
  }

  ownerRoleLabel(managerName: string): string {
    const invite = this.invitationOf(managerName);
    return invite ? 'Manager co-organizador' : 'Manager dueño del grupo';
  }


  checklist = computed(() => {
    const e = this.event();
    return e ? completenessByGroup(e) : [];
  });

  slots = computed(() => {
    const e = this.event();
    return e ? lineup(e) : [];
  });

  /** Grupos aprobados: los que el portal mostraría hoy, sin condiciones. */
  approvedSlots = computed(() =>
    this.slots().filter(s => !s.isExternal || s.approval === 'Aprobado')
  );

  /**
   * Cartel completo para la vista previa del cliente.
   *
   * Se muestran también los grupos ajenos que todavía no responden. Esconderlos
   * daba una vista previa engañosa —el encargado veía una ficha vacía cuando en
   * realidad tenía el cartel armado—, así que aparecen marcados como pendientes:
   * así se ve cómo quedaría la ficha si aceptan, sin olvidar que podrían no
   * aparecer si no lo hacen.
   */
  previewSlots = computed(() => this.slots());

  /** Grupo que aparecerá en la ficha solo si su dueño acepta. */
  isTentativeSlot(slot: EventLineupSlot): boolean {
    return slot.isExternal && slot.approval !== 'Aprobado';
  }

  tentativeSlots = computed(() => this.slots().filter(s => this.isTentativeSlot(s)));

  /**
   * Colección estructurada de videos para la Vista Previa del Cliente:
   * 1. generalVideos: videos generales del evento (sin nombre de grupo).
   * 2. groupSections: secciones de videos divididas por el Nombre del Grupo (asociando tanto
   *    greetingVideos del perfil público como invitationVideos del cartel aprobado).
   */
  previewVideoData = computed(() => {
    const e = this.event();
    if (!e) return { generalVideos: [], groupSections: [] };

    type VideoItem = { id: string; title?: string; url: string; type: 'youtube' | 'local' };

    // 1. Videos generales del evento: TODOS los cargados en 'publicProfile.greetingVideos'
    const generalVideos: VideoItem[] = (publicProfile(e).greetingVideos || []).map(v => ({
      id: v.id,
      title: v.title,
      url: v.url,
      type: v.type
    }));

    // 2. Videos de invitación capturados en los slots del cartel. Se incluyen
    //    los de grupos sin confirmar, marcados igual que en el line-up: su video
    //    solo llegará al público si su dueño acepta.
    const groupVideosMap = new Map<string, { videos: VideoItem[]; tentative: boolean }>();
    for (const slot of this.previewSlots()) {
      if (slot.invitationVideos && slot.invitationVideos.length > 0) {
        const entry = groupVideosMap.get(slot.groupName) ?? { videos: [], tentative: false };
        for (const v of slot.invitationVideos) {
          if (!entry.videos.some(existing => existing.id === v.id)) {
            entry.videos.push({ id: v.id, title: v.title, url: v.url, type: v.type });
          }
        }
        entry.tentative = entry.tentative || this.isTentativeSlot(slot);
        groupVideosMap.set(slot.groupName, entry);
      }
    }

    const groupSections = [...groupVideosMap.entries()].map(([groupName, entry]) => ({
      groupName,
      videos: entry.videos,
      tentative: entry.tentative
    }));

    return { generalVideos, groupSections };
  });

  round = computed(() => {
    const e = this.event();
    return e ? currentReviewRound(e) : null;
  });

  previousRounds = computed(() => {
    const rounds = this.event()?.reviewRounds || [];
    return rounds.slice(0, -1).reverse();
  });

  approvalList = computed(() => {
    const e = this.event();
    return e ? approvals(e) : [];
  });

  approvedTotal = computed(() => {
    const e = this.event();
    return e ? approvedCount(e) : 0;
  });

  publishReadiness = computed(() => {
    const e = this.event();
    return e
      ? evaluatePublishReadiness(e, this.report().missingRequired.length)
      : { canPublish: false, missingRequirements: [], pendingRequestsCount: 0 };
  });

  canPublish = computed(() => {
    const e = this.event();
    if (!e || !this.roleService.canEditEvents()) return false;
    if (e.state !== 'En Revisión') return false;
    return this.publishReadiness().canPublish;
  });

  /**
   * Si quien mira es la disquera que creó el evento.
   *
   * Se pregunta contra la sesión, que es la única respuesta posible. Antes se le
   * pasaba `e.ownerManagerName` como si fuera el actor, así que `isEventCreator`
   * comparaba el dueño del evento contra el dueño del evento: siempre cierto.
   * Con eso, el botón de cancelar —que solo debe tener el creador— lo tenía
   * cualquiera con permiso de edición, en cualquier evento y en cualquier fase.
   */
  isCreator = computed(() => {
    const e = this.event();
    if (!e) return false;
    return isEventCreator(e, this.sessionService.actor().managerName);
  });

  /** Cancelar solo lo puede efectuar el creador original / organizador del evento mientras siga vivo. */
  /** Fases en las que cancelar todavía significa algo. */
  cancelIsRelevant = computed(() => {
    const e = this.event();
    if (!e || !this.roleService.canEditEvents()) return false;
    return e.state !== 'Cerrado' && e.state !== 'Cancelado' && e.state !== 'Finalizada';
  });

  organizer = computed(() => {
    const e = this.event();
    return e ? (e.ownerManagerName || e.createdBy || 'el organizador') : 'el organizador';
  });

  canCancel = computed(() => {
    const e = this.event();
    if (!e || !this.roleService.canEditEvents()) return false;
    if (e.state === 'Cerrado' || e.state === 'Cancelado') return false;
    return this.isCreator();
  });

  managers = computed(() => {
    const e = this.event();
    return e ? participatingManagers(e) : [];
  });

  allManagersConfirmed = computed(() => {
    const e = this.event();
    return e ? allManagersConfirmedClosure(e) : false;
  });

  openPublishDialog(): void {
    this.publishMode.set('immediate');
    this.publishScheduleDate.set('');
    this.publishModalOpen.set(true);
  }

  confirmPublish(e: EventItem): void {
    if (this.publishMode() === 'scheduled' && !this.publishScheduleDate().trim()) return;
    this.publish.emit({
      event: e,
      scheduledAt: this.publishMode() === 'scheduled' ? this.publishScheduleDate().trim() : undefined
    });
    this.publishModalOpen.set(false);
  }

  openReturnReviewDialog(): void {
    this.returnReviewReason.set('');
    this.returnReviewModalOpen.set(true);
  }

  confirmReturnToReview(e: EventItem): void {
    if (!this.returnReviewReason().trim()) return;
    this.returnToReview.emit({ event: e, reason: this.returnReviewReason().trim() });
    this.returnReviewModalOpen.set(false);
    this.returnReviewReason.set('');
  }

  openPostponeDialog(e: EventItem): void {
    this.postponeNewDate.set('');
    this.postponeReason.set('');
    this.postponeClientNotice.set('');
    this.postponeVideoUrl.set('');
    this.postponeFlyerUrl.set('');
    this.postponeModalOpen.set(true);
  }

  confirmPostpone(e: EventItem): void {
    if (!this.postponeNewDate().trim() || !this.postponeReason().trim()) return;
    this.postpone.emit({
      event: e,
      newDate: this.postponeNewDate().trim(),
      reason: this.postponeReason().trim(),
      clientNotice: this.postponeClientNotice().trim() || undefined,
      videoUrl: this.postponeVideoUrl().trim() || undefined,
      flyerUrl: this.postponeFlyerUrl().trim() || undefined
    });
    this.postponeModalOpen.set(false);
  }

  triggerSimulateSale(e: EventItem, quantity = 1, tierId?: string): void {
    this.simulateSale.emit({ event: e, quantity, tierId });
  }

  confirmManagerClosureAction(e: EventItem, managerName: string, notes?: string): void {
    this.confirmClosure.emit({ event: e, managerName, notes });
  }

  seats = computed(() => { const e = this.event(); return e ? totalSeats(e) : 0; });
  sold = computed(() => { const e = this.event(); return e ? soldSeats(e) : 0; });
  available = computed(() => { const e = this.event(); return e ? availableSeats(e) : 0; });
  occupancy = computed(() => { const e = this.event(); return e ? Math.round(occupancyPercent(e)) : 0; });
  collected = computed(() => { const e = this.event(); return money(e ? grossTicketRevenue(e) : 0); });
  potential = computed(() => { const e = this.event(); return money(e ? potentialTicketRevenue(e) : 0); });
  production = computed(() => { const e = this.event(); return money(e ? productionCost(e) : 0); });
  lineupCost = computed(() => { const e = this.event(); return money(e ? lineupTotalCost(e) : 0); });
  refundedLabel = computed(() => money(this.event()?.sales?.refundedAmount || 0));
  cancelRefundLabel = computed(() => money(this.event()?.cancellation?.refundedAmount || 0));

  dateLabel = computed(() => shortDate(this.event()?.date));

  allowsEvidence = computed(() => {
    const state = this.event()?.state;
    return state === 'Publicado' || state === 'En Venta' || state === 'Finalizada';
  });

  groupIcon(group: string): string {
    switch (group.toUpperCase()) {
      case 'IDENTIDAD': return 'badge';
      case 'CARTELERA PÚBLICA': return 'public';
      case 'CARTEL': return 'queue_music';
      case 'PRODUCCIÓN': return 'speaker';
      case 'BOLETAJE': return 'confirmation_number';
      default: return 'checklist';
    }
  }

  groupColorClass(group: string): { badge: string; border: string; text: string; bg: string } {
    switch (group.toUpperCase()) {
      case 'IDENTIDAD':
        return { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', border: 'hover:border-amber-500/50', text: 'text-amber-400', bg: 'from-amber-500/10 to-transparent' };
      case 'CARTELERA PÚBLICA':
        return { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', border: 'hover:border-emerald-500/50', text: 'text-emerald-400', bg: 'from-emerald-500/10 to-transparent' };
      case 'CARTEL':
        return { badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', border: 'hover:border-cyan-500/50', text: 'text-cyan-400', bg: 'from-cyan-500/10 to-transparent' };
      case 'PRODUCCIÓN':
        return { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', border: 'hover:border-blue-500/50', text: 'text-blue-400', bg: 'from-blue-500/10 to-transparent' };
      case 'BOLETAJE':
        return { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', border: 'hover:border-purple-500/50', text: 'text-purple-400', bg: 'from-purple-500/10 to-transparent' };
      default:
        return { badge: 'bg-primary/20 text-primary border-primary/30', border: 'hover:border-primary/50', text: 'text-primary', bg: 'from-primary/10 to-transparent' };
    }
  }

  roundPercent(done: number, total: number): number {
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  toNumber(value: string): number {
    return Math.max(0, Number(String(value).replace(/[^0-9.-]/g, '')) || 0);
  }

  tierPercent(sold: number, total: number): number {
    return total > 0 ? (sold / total) * 100 : 0;
  }

  startReject(approval: EventApproval): void {
    this.rejectionReason = '';
    this.respondingId.set(approval.id);
  }

  confirmReject(approval: EventApproval): void {
    const current = this.event();
    if (!current || !this.rejectionReason.trim()) return;
    this.reject.emit({ event: current, approvalId: approval.id, reason: this.rejectionReason.trim() });
    this.respondingId.set(null);
    this.rejectionReason = '';
  }

  confirmCancel(e: EventItem): void {
    if (!this.cancelReason.trim() || !this.cancelConfirmed(e)) return;
    this.cancelModalOpen.set(false);
    this.cancel.emit({ event: e, reason: this.cancelReason.trim() });
    this.cancelling.set(false);
    this.cancelReason = '';
  }

  approvalBadgeClass(a: EventApproval): string {
    switch (a.status) {
      case 'Aprobado': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Rechazado': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default: return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  }

  reviewRoundsCount(): number {
    return this.event()?.reviewRounds?.length || 0;
  }

  grossRevenue(e: EventItem): number {
    return grossTicketRevenue(e);
  }

  closureExpensesTotal(e: EventItem): number {
    return totalExpenses(e);
  }

  closurePayoutsTotal(e: EventItem): number {
    return totalPayouts(e);
  }

  closureNetResult(e: EventItem): number {
    return netResult(e);
  }

  closureConfirmationsCount(e: EventItem): number {
    return e.closure?.managerConfirmations?.length || 0;
  }

  managerConfirmationOf(e: EventItem, managerName: string): EventManagerClosureConfirmation | undefined {
    return e.closure?.managerConfirmations?.find(c => c.managerName === managerName);
  }

  stepDotClass(state: EventItem['state']): string {
    return eventStateMeta(state).badgeClass;
  }

  /**
   * El día en que el evento pasará solo a Finalizada: el siguiente al del show.
   *
   * Se enseña porque la transición dejó de ser un botón, y sin decirlo la barra
   * de acciones se quedaba muda sobre qué falta para avanzar de fase.
   */
  concludesOn = computed(() => {
    const e = this.event();
    if (!e?.date) return 'terminar el evento';
    const dia = new Date(e.date + 'T00:00:00');
    if (isNaN(dia.getTime())) return e.date;
    const siguiente = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
    return siguiente.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  });


  /** Mañana, el primer día al que tiene sentido mover un evento. */
  tomorrow = computed(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  /**
   * Por qué la nueva fecha no sirve, si no sirve.
   *
   * Mover un evento a una fecha ya pasada lo daría por concluido en cuanto se
   * guardara —ahora que la conclusión la manda el calendario—, que es lo
   * contrario de posponerlo. Y moverlo al mismo día no es posponer nada.
   */
  postponeDateError = computed<string | null>(() => {
    const nueva = this.postponeNewDate().trim();
    if (!nueva) return null;

    const e = this.event();
    if (nueva === e?.date) return 'Es la misma fecha que ya tiene el evento.';
    if (nueva < this.tomorrow()) {
      return 'La nueva fecha ya pasó o es hoy: el evento se daría por concluido en vez de posponerse.';
    }
    return null;
  });

  /** El aviso tal como le llegará al comprador, con el texto por omisión si se deja vacío. */
  postponePreview(e: EventItem): string {
    const escrito = this.postponeClientNotice().trim();
    if (escrito) return escrito;
    const nueva = this.postponeNewDate().trim() || '(nueva fecha)';
    return `Aviso: El evento ha sido reprogramado del ${e.date} al ${nueva}. `
      + 'Tus boletos y asientos continúan siendo 100% válidos para la nueva fecha.';
  }


  // ─── Adjuntos del aviso de postergación ─────────────────────────────────────

  /**
   * Los archivos se cargan de verdad, no se piden por URL.
   *
   * Pedir una liga a quien acaba de recibir el video del grupo por WhatsApp es
   * pedirle que antes lo publique en otro sitio. Aquí se suelta el archivo y
   * listo; en el mock se referencia con un objeto de sesión, que es lo que ya
   * hace el resto del panel, y contra un backend real sería la respuesta de la
   * subida.
   */
  readonly postponeFlyerName = signal('');
  readonly postponeVideoName = signal('');
  readonly dragOverFlyer = signal(false);
  readonly dragOverVideo = signal(false);

  onDragOver(ev: DragEvent, zona: 'flyer' | 'video'): void {
    ev.preventDefault();
    (zona === 'flyer' ? this.dragOverFlyer : this.dragOverVideo).set(true);
  }

  onDropFlyer(ev: DragEvent): void {
    ev.preventDefault();
    this.dragOverFlyer.set(false);
    this.takeFlyer(ev.dataTransfer?.files?.[0]);
  }

  onDropVideo(ev: DragEvent): void {
    ev.preventDefault();
    this.dragOverVideo.set(false);
    this.takeVideo(ev.dataTransfer?.files?.[0]);
  }

  onPickFlyer(ev: Event): void { this.takeFlyer((ev.target as HTMLInputElement).files?.[0]); }
  onPickVideo(ev: Event): void { this.takeVideo((ev.target as HTMLInputElement).files?.[0]); }

  private takeFlyer(file?: File | null): void {
    if (!file || !file.type.startsWith('image/')) return;
    this.postponeFlyerUrl.set(URL.createObjectURL(file));
    this.postponeFlyerName.set(`${file.name} · ${this.fileSize(file.size)}`);
  }

  private takeVideo(file?: File | null): void {
    if (!file || !file.type.startsWith('video/')) return;
    this.postponeVideoUrl.set(URL.createObjectURL(file));
    this.postponeVideoName.set(`${file.name} · ${this.fileSize(file.size)}`);
  }

  clearPostponeFlyer(): void {
    this.postponeFlyerUrl.set('');
    this.postponeFlyerName.set('');
  }

  clearPostponeVideo(): void {
    this.postponeVideoUrl.set('');
    this.postponeVideoName.set('');
  }

  private fileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }


  // ─── Cancelación ────────────────────────────────────────────────────────────

  readonly cancelModalOpen = signal(false);
  readonly cancelConfirmText = signal('');

  openCancelDialog(): void {
    this.cancelReason = '';
    this.cancelConfirmText.set('');
    this.cancelModalOpen.set(true);
  }

  /** Lo que hay que devolverle a los compradores si se cancela ahora. */
  refundAmount = computed(() => {
    const e = this.event();
    return e ? grossTicketRevenue(e) : 0;
  });

  /**
   * El folio escrito a mano es la última puerta.
   *
   * Cancelar borra un evento del mundo y devuelve el dinero de miles de
   * personas; no puede depender de acertarle a un botón. Escribir el folio
   * obliga a mirar cuál es el expediente que se está cancelando.
   */
  cancelConfirmed(e: EventItem): boolean {
    return this.cancelConfirmText().trim().toUpperCase() === (e.id || '').toUpperCase();
  }

  /** El aviso que recibirá quien compró, tal como saldrá. */
  cancelPreview(): string {
    const motivo = this.cancelReason.trim() || '(motivo por escribir)';
    const vendidos = this.sold();
    return `Aviso oficial: El evento ha sido cancelado definitivamente. Motivo: ${motivo}.`
      + (vendidos > 0
        ? ` Se procesa el reembolso del 100% para los ${vendidos.toLocaleString('es-MX')} boletos emitidos.`
        : '');
  }


  /** La venta anticipada ya cerró según lo que dice el propio expediente. */
  salesClosed = computed(() => {
    const e = this.event();
    return e ? salesAreClosed(e) : false;
  });

  /** Se le pasó la fecha sin llegar a publicarse. */
  staleUnpublished = computed(() => {
    const e = this.event();
    return e ? isStaleUnpublished(e) : false;
  });

}
