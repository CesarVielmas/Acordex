import { Component, Output, EventEmitter, input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventItem, EventApproval } from '../../../core/models/event.models';
import { GroupItem } from '../../../core/models/admin.models';
import { eventStateMeta, eventEditPolicy } from '../../../core/models/event-state.meta';
import { RoleService } from '../../../core/services/role.service';
import { ModalShellComponent } from '../../../shared/ui/modal-shell/modal-shell.component';
import { ProgressBarComponent } from '../../../shared/ui/progress-bar/progress-bar.component';
import { TabPillsComponent, TabPillItem } from '../../../shared/ui/tab-pills/tab-pills.component';
import { EditableFieldComponent } from '../../../shared/ui/editable-field/editable-field.component';
import { EventTabPublicComponent } from './detail/event-tab-public.component';
import { EventTabLineupComponent } from './detail/event-tab-lineup.component';
import { EventTabProductionComponent } from './detail/event-tab-production.component';
import { EventTabTicketsComponent } from './detail/event-tab-tickets.component';
import { EventTabClosureComponent } from './detail/event-tab-closure.component';
import { completenessByGroup, eventCompleteness } from '../event-completeness';
import {
  approvals,
  approvedCount,
  availableSeats,
  currentReviewRound,
  dateTimeLabel,
  grossTicketRevenue,
  hasRejection,
  isFullyApproved,
  lineup,
  lineupTotalCost,
  money,
  occupancyPercent,
  pendingApprovals,
  potentialTicketRevenue,
  productionCost,
  shortDate,
  soldSeats,
  totalSeats
} from '../event-metrics';

export type EventDetailTab =
  | 'resumen' | 'publico' | 'cartel' | 'produccion' | 'boletaje'
  | 'revision' | 'venta' | 'cierre' | 'trazabilidad';

/**
 * Expediente del evento.
 *
 * Está dividido en pestañas porque un evento no se captura de corrido: la
 * ficha pública la escribe quien hace la difusión, el cartel lo arma quien
 * negocia con los grupos y el boletaje lo define quien conoce el recinto. Cada
 * pestaña es una de esas conversaciones.
 *
 * Las pestañas de revisión, venta y cierre solo aparecen cuando existen: un
 * borrador no tiene nada que enseñar en "Venta", y mostrar la pestaña vacía
 * sugiere que falta llenarla.
 *
 * Qué se puede editar en cada fase lo decide `eventEditPolicy`, no cada
 * pestaña: así la regla vive en un solo lugar y no se puede contradecir.
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
    EventTabClosureComponent
  ],
  template: `
    @if (event(); as e) {
      <app-modal-shell
        [title]="e.title"
        [subtitle]="e.venue + ', ' + e.location + ' · ' + dateLabel()"
        [icon]="meta().icon"
        size="7xl"
        [hasFooter]="true"
        (closed)="closed.emit()"
      >
        <div class="space-y-4">

          <!-- ─── FASE ACTUAL ─── -->
          <section [class]="meta().modalBorderClass" class="p-4 rounded-2xl bg-surface-container-high border shadow-lg space-y-2.5">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <div class="flex items-center gap-2.5 min-w-0">
                <span [class]="meta().badgeClass" class="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-lg">{{ meta().icon }}</span>
                </span>
                <div class="min-w-0">
                  <h4 class="text-xs font-black text-on-surface truncate">{{ meta().phaseTitle }}</h4>
                  <p class="text-[11px] text-outline">
                    {{ e.id }} · Creado por {{ e.createdBy }} · {{ slots().length }} grupo(s) en cartel
                  </p>
                </div>
              </div>
              <span [class]="meta().badgeClass" class="px-3 py-1 rounded-xl text-[11px] font-black border shrink-0">
                {{ e.state }}
              </span>
            </div>

            <p class="text-[11px] text-on-surface-variant">{{ meta().meaning }}</p>

            @if (policy().warning) {
              <p class="text-[11px] p-2.5 rounded-xl flex items-start gap-1.5"
                 [class]="e.state === 'En Venta' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200' : 'bg-surface-container border border-outline-variant/25 text-outline'">
                <span class="material-symbols-outlined text-sm shrink-0">{{ e.state === 'En Venta' ? 'lock' : 'info' }}</span>
                <span>{{ policy().warning }}</span>
              </p>
            }
          </section>

          <!-- ─── PESTAÑAS ─── -->
          <app-tab-pills [tabs]="tabs()" [active]="activeTab()" (change)="activeTab.set($any($event))" />

          <!-- ─── RESUMEN ─── -->
          @if (activeTab() === 'resumen') {
            <div class="space-y-4">

              <!-- Avance de captura -->
              <section class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]">checklist</span>
                    Información requerida para publicar
                  </h5>
                  <span class="text-[11px] font-bold" [class]="report().canSubmitForReview ? 'text-emerald-400' : 'text-amber-300'">
                    {{ report().doneCount }} de {{ report().totalCount }} puntos
                  </span>
                </div>

                <app-progress-bar
                  [percent]="report().percent"
                  [valueLabel]="report().percent + '% capturado'"
                  [colorVariant]="report().canSubmitForReview ? 'success' : 'warning'"
                />

                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  @for (block of checklist(); track block.group) {
                    <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center justify-between">
                        {{ block.group }}
                        <span class="font-mono" [class]="block.done === block.items.length ? 'text-emerald-400' : 'text-amber-300'">
                          {{ block.done }}/{{ block.items.length }}
                        </span>
                      </span>
                      <ul class="space-y-1.5">
                        @for (item of block.items; track item.id) {
                          <li class="flex items-start gap-2 text-[11px]">
                            <span
                              class="material-symbols-outlined text-sm shrink-0 mt-px"
                              [class]="item.done ? 'text-emerald-400' : (item.required ? 'text-rose-400' : 'text-outline')"
                            >{{ item.done ? 'check_circle' : (item.required ? 'error' : 'radio_button_unchecked') }}</span>
                            <span class="min-w-0">
                              <span [class]="item.done ? 'text-outline line-through' : 'text-on-surface font-semibold'">{{ item.label }}</span>
                              @if (!item.done) {
                                <span class="block text-[10px] text-outline">{{ item.hint }}</span>
                              }
                            </span>
                          </li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              </section>

              <!-- Datos base del evento -->
              <section class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[13px]">event</span> Datos del evento
                </h5>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <app-editable-field
                    label="Nombre del evento"
                    [value]="e.title"
                    [readonly]="!policy().identity"
                    (save)="patch.emit({ title: $event })"
                  />
                  <app-editable-field
                    label="Fecha"
                    type="date"
                    [value]="e.date"
                    [readonly]="!policy().identity"
                    (save)="patch.emit({ date: $event })"
                  />
                  <app-editable-field
                    label="Aforo del recinto"
                    type="number"
                    [value]="e.capacity ?? ''"
                    [readonly]="!policy().identity"
                    (save)="patch.emit({ capacity: toNumber($event) })"
                  />
                  <app-editable-field
                    label="Recinto"
                    [value]="e.venue"
                    [readonly]="!policy().identity"
                    (save)="patch.emit({ venue: $event })"
                  />
                  <app-editable-field
                    label="Ciudad y estado"
                    [value]="e.location"
                    [readonly]="!policy().identity"
                    (save)="patch.emit({ location: $event })"
                  />
                  <app-editable-field
                    label="Dirección del recinto"
                    [value]="e.venueAddress || ''"
                    [readonly]="!policy().identity"
                    (save)="patch.emit({ venueAddress: $event })"
                  />
                </div>

                <app-editable-field
                  label="Nota interna"
                  hint="no se muestra al público"
                  type="textarea"
                  [rows]="2"
                  valueClass="text-[11px] font-medium text-on-surface-variant break-words"
                  [value]="e.description || ''"
                  [readonly]="!policy().identity"
                  (save)="patch.emit({ description: $event })"
                />
              </section>

              <!-- Cifras de un vistazo -->
              <section class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/25">
                  <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Aforo a la venta</span>
                  <span class="font-black text-on-surface text-sm">{{ seats().toLocaleString('es-MX') }}</span>
                </div>
                <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/25">
                  <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Vendidos</span>
                  <span class="font-black text-emerald-400 text-sm">{{ sold().toLocaleString('es-MX') }} ({{ occupancy() }}%)</span>
                </div>
                @if (roleService.canViewFinances()) {
                  <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/25">
                    <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Costo de producción</span>
                    <span class="font-black text-amber-300 text-sm">{{ production() }}</span>
                  </div>
                  <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/25">
                    <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Taquilla potencial</span>
                    <span class="font-black text-on-surface text-sm">{{ potential() }}</span>
                  </div>
                }
              </section>
            </div>
          }

          <!-- ─── CARTELERA PÚBLICA ─── -->
          @if (activeTab() === 'publico') {
            <app-event-tab-public
              [event]="e"
              [canEdit]="policy().publicProfile"
              (patch)="patch.emit($event)"
            />
          }

          <!-- ─── CARTEL ─── -->
          @if (activeTab() === 'cartel') {
            <app-event-tab-lineup
              [event]="e"
              [canEdit]="policy().lineup"
              [canViewFinances]="roleService.canViewFinances()"
              [availableGroups]="availableGroups()"
              (patch)="patch.emit($event)"
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
            />
          }

          <!-- ─── REVISIÓN ─── -->
          @if (activeTab() === 'revision') {
            <section class="p-4 rounded-2xl bg-surface-container-high border border-amber-500/30 space-y-4">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <h5 class="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[13px]">rate_review</span>
                  Aprobaciones · Ronda {{ round()?.round || 1 }}
                </h5>
                <span class="text-[11px] font-bold text-outline">
                  {{ approvedTotal() }} de {{ approvalList().length }} aprobadas
                </span>
              </div>

              @if (round()?.note) {
                <p class="text-[11px] text-outline italic p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                  "{{ round()?.note }}" — {{ round()?.sentBy }}, {{ dateTimeLabel(round()?.sentAt) }}
                </p>
              }

              @if (approvalList().length === 0) {
                <p class="text-[11px] text-outline italic">
                  El cartel es completamente propio: no requiere la aprobación de ningún otro encargado.
                </p>
              }

              @for (a of approvalList(); track a.id) {
                <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/25 space-y-2">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <div class="min-w-0">
                      <p class="text-xs font-bold text-on-surface truncate">{{ a.groupName }}</p>
                      <p class="text-[10px] text-outline truncate">Encargado: {{ a.managerName }}</p>
                    </div>
                    <span [class]="approvalBadgeClass(a)" class="px-2.5 py-1 rounded-lg text-[10px] font-black border shrink-0">
                      {{ a.status }}
                    </span>
                  </div>

                  @if (a.status === 'Rechazado') {
                    <div class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 space-y-1">
                      <p class="text-[11px] text-rose-200"><strong>Motivo:</strong> {{ a.reason }}</p>
                      @if (a.requestedChanges?.length) {
                        <ul class="text-[10px] text-rose-200/90 list-disc list-inside">
                          @for (change of a.requestedChanges; track change) {
                            <li>{{ change }}</li>
                          }
                        </ul>
                      }
                    </div>
                  }

                  @if (a.status === 'Pendiente' && roleService.canEditEvents()) {
                    @if (respondingId() === a.id) {
                      <div class="space-y-2">
                        <textarea
                          [(ngModel)]="rejectionReason"
                          rows="2"
                          placeholder="Motivo del rechazo y qué debe cambiarse..."
                          class="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-2 text-[11px] text-on-surface focus:outline-none focus:border-rose-400/60"
                        ></textarea>
                        <div class="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            (click)="confirmReject(a)"
                            [disabled]="!rejectionReason.trim()"
                            class="px-3 py-2 min-h-9 rounded-xl bg-rose-500 text-white text-[11px] font-bold disabled:opacity-40 disabled:pointer-events-none"
                          >Confirmar rechazo</button>
                          <button
                            type="button"
                            (click)="respondingId.set(null)"
                            class="px-3 py-2 min-h-9 rounded-xl bg-surface-bright text-on-surface text-[11px] font-bold"
                          >Cancelar</button>
                        </div>
                      </div>
                    } @else {
                      <div class="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          (click)="approve.emit({ event: e, approvalId: a.id })"
                          class="px-3 py-2 min-h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black text-[11px] font-bold transition-all flex items-center gap-1.5"
                        >
                          <span class="material-symbols-outlined text-sm">thumb_up</span> Aprobar
                        </button>
                        <button
                          type="button"
                          (click)="startReject(a)"
                          class="px-3 py-2 min-h-9 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-[11px] font-bold transition-all flex items-center gap-1.5"
                        >
                          <span class="material-symbols-outlined text-sm">thumb_down</span> Rechazar
                        </button>
                      </div>
                    }
                  }
                </div>
              }

              <!-- Historial de rondas anteriores -->
              @if (e.reviewRounds.length > 1) {
                <div class="pt-3 border-t border-outline-variant/20 space-y-2">
                  <span class="text-[10px] font-black uppercase tracking-wider text-outline">Rondas anteriores</span>
                  @for (r of previousRounds(); track r.round) {
                    <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20 text-[10px] space-y-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="font-bold text-on-surface">Ronda {{ r.round }} · {{ r.outcome || 'En curso' }}</span>
                        <span class="text-outline">{{ dateTimeLabel(r.sentAt) }}</span>
                      </div>
                      @for (a of r.approvals; track a.id) {
                        <p class="text-outline">
                          <strong class="text-on-surface-variant">{{ a.managerName }}</strong>: {{ a.status }}
                          @if (a.reason) { — {{ a.reason }} }
                        </p>
                      }
                    </div>
                  }
                </div>
              }

              @if (canPublish()) {
                <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                  <p class="text-[11px] text-emerald-200 flex items-start gap-1.5">
                    <span class="material-symbols-outlined text-sm shrink-0">verified</span>
                    <span>Todos aprobaron. Publicar es el punto de no retorno: el evento queda a la vista del público.</span>
                  </p>
                  @if (!report().canSubmitForReview) {
                    <p class="text-[11px] text-amber-200 flex items-start gap-1.5">
                      <span class="material-symbols-outlined text-sm shrink-0">warning</span>
                      <span>Antes de publicar, revisa el resumen: faltan {{ report().missingRequired.length }} punto(s) de la ficha pública.</span>
                    </p>
                  }
                  <div class="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      (click)="publish.emit({ event: e })"
                      class="px-3.5 py-2 min-h-10 rounded-xl bg-blue-500 text-white text-[11px] font-black flex items-center gap-1.5"
                    >
                      <span class="material-symbols-outlined text-sm">campaign</span> Publicar ahora
                    </button>
                    <input
                      type="datetime-local"
                      [(ngModel)]="scheduleAt"
                      class="bg-surface-container border border-outline-variant/30 rounded-xl px-3 py-2 min-h-10 text-[11px] text-on-surface focus:outline-none focus:border-cyan-400/60"
                    />
                    <button
                      type="button"
                      (click)="publish.emit({ event: e, scheduledAt: scheduleAt })"
                      [disabled]="!scheduleAt"
                      class="px-3.5 py-2 min-h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
                    >
                      <span class="material-symbols-outlined text-sm">schedule_send</span> Programar publicación
                    </button>
                  </div>
                </div>
              }
            </section>
          }

          <!-- ─── VENTA ─── -->
          @if (activeTab() === 'venta') {
            <div class="space-y-4">
              @if (e.publication; as pub) {
                <section class="p-4 rounded-2xl bg-surface-container-high border border-blue-500/25 space-y-2 text-[11px]">
                  <h5 class="text-[10px] font-black uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]">campaign</span> Publicación
                  </h5>
                  @if (pub.publishedAt) {
                    <p class="text-on-surface-variant">
                      Publicado el <strong class="text-on-surface">{{ dateTimeLabel(pub.publishedAt) }}</strong> por {{ pub.publishedBy }}
                    </p>
                  }
                  @if (pub.scheduledAt) {
                    <p class="text-cyan-200">
                      Publicación programada para <strong>{{ dateTimeLabel(pub.scheduledAt) }}</strong>
                    </p>
                  }
                  @if (pub.channels?.length) {
                    <div class="flex items-center gap-1.5 flex-wrap pt-1">
                      @for (channel of pub.channels; track channel) {
                        <span class="px-2 py-0.5 rounded-lg bg-surface-container border border-outline-variant/25 text-[9px] font-bold text-outline">
                          {{ channel }}
                        </span>
                      }
                    </div>
                  }
                </section>
              }

              <section class="p-4 rounded-2xl bg-surface-container-high border border-emerald-500/25 space-y-3">
                <h5 class="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[13px]">confirmation_number</span> Venta de boletos
                </h5>

                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                  <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/25">
                    <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Vendidos</span>
                    <span class="font-black text-on-surface text-sm">{{ sold().toLocaleString('es-MX') }}</span>
                  </div>
                  <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/25">
                    <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Ocupación</span>
                    <span class="font-black text-emerald-400 text-sm">{{ occupancy() }}%</span>
                  </div>
                  <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/25">
                    <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Por vender</span>
                    <span class="font-black text-on-surface text-sm">{{ available().toLocaleString('es-MX') }}</span>
                  </div>
                  @if (roleService.canViewFinances()) {
                    <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/25">
                      <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Taquilla cobrada</span>
                      <span class="font-black text-emerald-400 text-sm">{{ collected() }}</span>
                    </div>
                  }
                </div>

                <!-- Ocupación por categoría -->
                <div class="space-y-2 pt-2 border-t border-outline-variant/20">
                  @for (tier of e.ticketTiers; track tier.name) {
                    <div class="space-y-1">
                      <div class="flex items-center justify-between gap-2 text-[11px]">
                        <span class="font-bold text-on-surface truncate">{{ tier.name }}</span>
                        <span class="text-outline shrink-0">
                          {{ tier.soldSeats.toLocaleString('es-MX') }} / {{ tier.totalSeats.toLocaleString('es-MX') }}
                        </span>
                      </div>
                      <app-progress-bar
                        [percent]="tierPercent(tier.soldSeats, tier.totalSeats)"
                        [colorVariant]="tierPercent(tier.soldSeats, tier.totalSeats) >= 70 ? 'success' : 'primary'"
                      />
                    </div>
                  }
                </div>

                @if (e.sales?.dailySales?.length) {
                  <div class="pt-2 border-t border-outline-variant/20 space-y-1">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline">Últimos días de venta</span>
                    @for (day of e.sales?.dailySales; track day.date) {
                      <div class="flex items-center justify-between gap-2 text-[10px]">
                        <span class="text-outline">{{ day.dayLabel }} · {{ day.date }}</span>
                        <span class="text-on-surface font-bold">
                          {{ day.tickets }} boletos
                          @if (roleService.canViewFinances()) { · &#36;{{ day.revenue | number:'1.0-0' }} }
                        </span>
                      </div>
                    }
                  </div>
                }

                @if ((e.sales?.refundsCount || 0) > 0) {
                  <p class="text-[11px] text-amber-200 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    {{ e.sales?.refundsCount }} reembolso(s) emitido(s)
                    @if (roleService.canViewFinances()) { por {{ refundedLabel() }} }
                  </p>
                }
              </section>
            </div>
          }

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
            <div class="space-y-4">
              @if (e.cancellation; as cancel) {
                <section class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-[11px]">
                  <h5 class="text-[10px] font-black uppercase tracking-wider text-rose-200 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]">cancel</span> Cancelación
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
              <section class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <h5 class="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]">photo_library</span>
                    Evidencia de campo ({{ e.evidenceMedia.length }})
                  </h5>
                  @if (allowsEvidence()) {
                    <button
                      type="button"
                      (click)="uploadEvidence.emit(e)"
                      class="px-3 py-1.5 min-h-9 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold text-[11px] transition-all flex items-center gap-1 shrink-0"
                    >
                      <span class="material-symbols-outlined text-sm">add_a_photo</span> Subir evidencia
                    </button>
                  }
                </div>

                @if (!e.evidenceMedia.length) {
                  <p class="text-[11px] text-outline italic p-4 rounded-xl bg-surface-container border border-dashed border-outline-variant/40 text-center">
                    Sin evidencia adjunta. El personal de campo puede subir fotos y videos del montaje, la prueba de sonido y el show.
                  </p>
                } @else {
                  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    @for (media of e.evidenceMedia; track media.id) {
                      <div class="rounded-xl overflow-hidden bg-surface-container border border-outline-variant/25 p-2 space-y-1.5">
                        <img [src]="media.url" [alt]="media.caption" class="w-full aspect-video object-cover rounded-lg" />
                        <p class="text-[10px] font-semibold text-on-surface px-0.5 line-clamp-2">{{ media.caption }}</p>
                        <div class="flex items-center justify-between text-[9px] text-outline px-0.5">
                          <span class="truncate">{{ media.uploaderName }}</span>
                          <span class="shrink-0">{{ media.stage || media.type }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </section>

              <!-- Línea de tiempo -->
              <section class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[13px]">timeline</span> Trazabilidad del evento
                </h5>

                <ol class="space-y-2.5 border-l-2 border-outline-variant/30 ml-2 pl-4">
                  @for (step of e.timeline; track step.id) {
                    <li class="relative">
                      <span
                        [class]="stepDotClass(step.state)"
                        class="absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-surface-container-high"
                      ></span>
                      <p class="text-[11px] font-bold text-on-surface">{{ step.phaseName }}</p>
                      <p class="text-[10px] text-outline">{{ dateTimeLabel(step.completedAt) }} · {{ step.actorName }}</p>
                      <p class="text-[10px] text-on-surface-variant mt-0.5">{{ step.summaryNote }}</p>
                    </li>
                  } @empty {
                    <li class="text-[11px] text-outline italic">Sin movimientos registrados.</li>
                  }
                </ol>
              </section>
            </div>
          }
        </div>

        <!-- ─── ACCIONES ─── -->
        <ng-container modal-footer>
          @if (canCancel()) {
            @if (cancelling()) {
              <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  [(ngModel)]="cancelReason"
                  placeholder="Motivo de la cancelación (obligatorio)"
                  class="flex-1 bg-surface-container border border-rose-500/40 rounded-xl px-3 py-2 min-h-11 text-[11px] text-on-surface focus:outline-none"
                />
                <button
                  type="button"
                  (click)="confirmCancel(e)"
                  [disabled]="!cancelReason.trim()"
                  class="px-4 py-2.5 min-h-11 rounded-xl bg-rose-500 text-white text-xs font-black disabled:opacity-40 disabled:pointer-events-none"
                >Confirmar cancelación</button>
                <button
                  type="button"
                  (click)="cancelling.set(false)"
                  class="px-4 py-2.5 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold"
                >Volver</button>
              </div>
            } @else {
              <button
                type="button"
                (click)="cancelling.set(true)"
                class="px-4 py-2.5 min-h-11 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 sm:mr-auto"
              >
                <span class="material-symbols-outlined text-sm">cancel</span> Cancelar evento
              </button>
            }
          }

          @if (e.state === 'Borrador' && roleService.canEditEvents()) {
            <button
              type="button"
              (click)="submitReview.emit(e)"
              [disabled]="!report().canSubmitForReview"
              [title]="report().canSubmitForReview ? 'Enviar a los encargados involucrados' : 'Faltan puntos obligatorios por capturar'"
              class="px-5 py-2.5 min-h-11 rounded-xl bg-amber-500 text-black font-black text-xs shadow-lg disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-sm">send</span> Enviar a Revisión
            </button>
          }

          @if (e.state === 'Próximo a Publicar' && roleService.canEditEvents()) {
            <button
              type="button"
              (click)="publish.emit({ event: e })"
              class="px-5 py-2.5 min-h-11 rounded-xl bg-blue-500 text-white font-black text-xs shadow-lg flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-sm">campaign</span> Publicar de inmediato
            </button>
          }

          <button
            type="button"
            (click)="closed.emit()"
            class="px-5 py-2.5 min-h-11 rounded-xl bg-surface-bright text-on-surface font-semibold text-xs"
          >
            Cerrar
          </button>
        </ng-container>
      </app-modal-shell>
    }
  `
})
export class EventDetailModalComponent {
  roleService = inject(RoleService);

  /**
   * Entrada de señal (y no `@Input` clásico) porque todo el expediente se
   * deriva con `computed`: con una propiedad normal, los cálculos se quedarían
   * congelados en el primer evento que se abriera.
   */
  event = input<EventItem | null>(null);
  /** Catálogo de grupos, para poder agregarlos al cartel. */
  availableGroups = input<GroupItem[]>([]);

  @Output() closed = new EventEmitter<void>();
  @Output() uploadEvidence = new EventEmitter<EventItem>();
  @Output() submitReview = new EventEmitter<EventItem>();
  @Output() approve = new EventEmitter<{ event: EventItem; approvalId: string }>();
  @Output() reject = new EventEmitter<{ event: EventItem; approvalId: string; reason: string }>();
  @Output() publish = new EventEmitter<{ event: EventItem; scheduledAt?: string }>();
  @Output() cancel = new EventEmitter<{ event: EventItem; reason: string }>();
  @Output() seal = new EventEmitter<EventItem>();
  @Output() patch = new EventEmitter<Partial<EventItem>>();

  activeTab = signal<EventDetailTab>('resumen');
  /** Aprobación que se está rechazando (muestra el campo de motivo). */
  respondingId = signal<string | null>(null);
  cancelling = signal(false);
  rejectionReason = '';
  cancelReason = '';
  scheduleAt = '';

  // Reexportadas para poder llamarlas desde la plantilla.
  dateTimeLabel = dateTimeLabel;

  meta = computed(() => eventStateMeta(this.event()?.state));

  policy = computed(() => {
    const e = this.event();
    if (!e || !this.roleService.canEditEvents()) {
      return { identity: false, publicProfile: false, lineup: false, production: false, tickets: false, closure: false };
    }
    return eventEditPolicy(e.state);
  });

  /**
   * Pestañas visibles. Revisión, venta y cierre aparecen solo cuando tienen
   * algo que mostrar: una pestaña vacía se lee como trabajo pendiente.
   */
  tabs = computed<TabPillItem[]>(() => {
    const e = this.event();
    if (!e) return [];

    const list: TabPillItem[] = [
      { value: 'resumen', label: 'Resumen', icon: 'dashboard', badge: this.report().percent + '%' },
      { value: 'publico', label: 'Cartelera Pública', icon: 'public' },
      { value: 'cartel', label: 'Cartel & Grupos', icon: 'queue_music', badge: String(this.slots().length) },
      { value: 'produccion', label: 'Producción', icon: 'speaker' },
      { value: 'boletaje', label: 'Boletaje & Croquis', icon: 'confirmation_number' }
    ];

    if ((e.reviewRounds?.length || 0) > 0) {
      const pending = pendingApprovals(e).length;
      list.push({ value: 'revision', label: 'Revisión', icon: 'rate_review', badge: pending > 0 ? String(pending) : undefined });
    }

    if (e.publication || (e.sales?.ticketsSold || 0) > 0) {
      list.push({ value: 'venta', label: 'Venta', icon: 'point_of_sale' });
    }

    if (e.state === 'Finalizada' || e.state === 'Cerrado' || e.closure) {
      list.push({ value: 'cierre', label: 'Cierre', icon: 'fact_check' });
    }

    list.push({ value: 'trazabilidad', label: 'Trazabilidad', icon: 'timeline' });
    return list;
  });

  report = computed(() => eventCompleteness(this.event() ?? ({} as EventItem)));

  checklist = computed(() => {
    const e = this.event();
    return e ? completenessByGroup(e) : [];
  });

  slots = computed(() => {
    const e = this.event();
    return e ? lineup(e) : [];
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

  canPublish = computed(() => {
    const e = this.event();
    if (!e || !this.roleService.canEditEvents() || hasRejection(e)) return false;
    if (e.state !== 'En Revisión') return false;
    return isFullyApproved(e) || (pendingApprovals(e).length === 0 && this.approvalList().length === 0);
  });

  /** Cancelar tiene sentido mientras el evento siga vivo. */
  canCancel = computed(() => {
    const e = this.event();
    if (!e || !this.roleService.canEditEvents()) return false;
    return e.state !== 'Cerrado' && e.state !== 'Cancelado';
  });

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
    if (!this.cancelReason.trim()) return;
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

  stepDotClass(state: EventItem['state']): string {
    return eventStateMeta(state).badgeClass;
  }
}
