import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AccreditationKind,
  COVERAGE_LABELS,
  COVERAGE_TYPES,
  CoverageType,
  PressAccreditationRequest,
  PressEventItem,
  PressZone,
  emptyAccreditationConfig
} from '../../../../core/models/press.models';
import { SessionService } from '../../../../core/services/session.service';
import { EditableFieldComponent } from '../../../../shared/ui/editable-field/editable-field.component';
import { MandatoryTaskTagComponent } from '../../../../shared/ui/mandatory-task-tag/mandatory-task-tag.component';
import { MandatoryFields } from '../../../events/mandatory-fields';
import { markIntervention, ResolvedTask } from '../../../events/event-tasks';
import { PressFileDropComponent } from '../press-file-drop.component';
import {
  ACCREDITATION_STATUS_LABEL,
  accreditationStats,
  badgeAccessLabel,
  crewSize,
  duplicateGroups,
  duplicatesOf,
  isApproved,
  isCheckInOpen,
  isLateRequest,
  nextBadgeId,
  pressRequests,
  pressZones,
  registrationWindow,
  registrationWindowLabel,
  stampLabel,
  zoneOccupancy
} from '../../press-metrics';
import {
  addRequest,
  approveMany,
  approveRequest,
  rejectRequest,
  removeRequests,
  revokeAccreditation,
  setAttendance,
  updateBadge
} from '../../press-accreditations';

/**
 * Acreditaciones: la operación central del apartado.
 *
 * Es lo que distingue una firma de prensa de cualquier otro evento del panel, y
 * por eso está diseñada como el corazón y no como una pestaña más. Todo lo que
 * hace falta para decidir sobre una solicitud está en su renglón —medio, persona,
 * cobertura, cuánta gente trae, si es duplicada, si llegó tarde— porque abrir un
 * detalle para cada una de treinta solicitudes es como se acaba aprobando en
 * bloque sin leer.
 */
@Component({
  selector: 'app-press-tab-accreditations',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    EditableFieldComponent, MandatoryTaskTagComponent, PressFileDropComponent
  ],
  host: { class: 'block' },
  template: `
    <div class="space-y-6">

      <!-- ─── CIFRAS ─── -->
      <section class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blue-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-blue-500/25 border-l-4 border-l-blue-500/70 shadow-2xl shadow-blue-500/5 space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-blue-300 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center justify-center material-symbols-outlined text-lg">badge</span>
            <span>Prensa acreditada</span>
          </h5>
          <span
            class="px-3.5 py-1.5 rounded-2xl border text-[11px] font-black flex items-center gap-1.5"
            [class]="windowClass()"
          >
            <span class="material-symbols-outlined text-[13px]">{{ windowIcon() }}</span>
            {{ windowLabel() }}
          </span>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Solicitudes</span>
            <span class="text-2xl font-black font-mono text-on-surface">{{ stats().total }}</span>
          </div>
          <div class="p-3.5 rounded-2xl border"
            [class]="stats().pending ? 'bg-amber-500/10 border-amber-500/35' : 'bg-surface-container/60 border-outline-variant/25'">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Por revisar</span>
            <span class="text-2xl font-black font-mono" [class]="stats().pending ? 'text-amber-300' : 'text-outline'">
              {{ stats().pending }}
            </span>
          </div>
          <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Acreditadas</span>
            <span class="text-2xl font-black font-mono text-emerald-300">{{ stats().approved }}</span>
            <span class="text-[10px] text-outline block mt-0.5">{{ stats().headcount }} persona(s) en total</span>
          </div>
          <div class="p-3.5 rounded-2xl border"
            [class]="cupoClass()">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Cupo restante</span>
            @if (stats().remaining === null) {
              <span class="text-sm font-black text-outline italic">Sin cupo definido</span>
            } @else {
              <span class="text-2xl font-black font-mono" [class]="stats().overCapacity ? 'text-rose-300' : 'text-on-surface'">
                {{ stats().remaining }}
              </span>
              <span class="text-[10px] text-outline block mt-0.5">de {{ stats().capacity }} lugares</span>
            }
          </div>
        </div>

        @if (showAttendance()) {
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Asistieron</span>
              <span class="text-2xl font-black font-mono text-emerald-300">{{ stats().attended }}</span>
            </div>
            <div class="p-3.5 rounded-2xl border"
              [class]="stats().noShow ? 'bg-rose-500/10 border-rose-500/30' : 'bg-surface-container/60 border-outline-variant/25'">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline block">No se presentaron</span>
              <span class="text-2xl font-black font-mono" [class]="stats().noShow ? 'text-rose-300' : 'text-outline'">
                {{ stats().noShow }}
              </span>
            </div>
          </div>
        }

        @if (stats().overCapacity) {
          <div class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-[11px] text-rose-200 leading-relaxed flex items-start gap-2">
            <span class="material-symbols-outlined text-sm text-rose-300 shrink-0 mt-0.5">warning</span>
            <span>
              Hay <strong>{{ stats().headcount }}</strong> personas acreditadas para un cupo de
              <strong>{{ stats().capacity }}</strong>. No está bloqueado —tú sabes si cabe uno más— pero conviene
              revisar quién trae equipo grande antes de aprobar más.
            </span>
          </div>
        }
      </section>

      <!-- ─── REGLAS DE ACREDITACIÓN ─── -->
      <section class="p-5 sm:p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-outline flex items-center justify-center material-symbols-outlined text-lg">tune</span>
            <span>Reglas de acreditación</span>
          </h5>
          <app-mandatory-task-tag ref="acreditacion" [event]="event()" (intervene)="onIntervene($event)" (openTasks)="openTasks.emit()" />
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

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <app-editable-field
            label="Abre el registro"
            type="datetime-local"
            [value]="config().opensAt ?? ''"
            [readonly]="!canEditConfig()"
            [proposalWarning]="mandatory.warning('acreditacion')"
            [proposals]="mandatory.proposals('acreditacion', 'accreditation')"
            [canDecide]="mandatory.canDecide('acreditacion')"
            [proposalOwner]="mandatory.approvers('acreditacion')"
            (acceptProposal)="mandatory.accept('acreditacion', $event)"
            (rejectProposal)="mandatory.reject('acreditacion', $event)"
            (save)="saveConfig('Apertura del registro', { opensAt: $event })"
          />
          <app-editable-field
            label="Cierra el registro"
            hint="deja de admitir altas"
            type="datetime-local"
            [value]="config().closesAt ?? ''"
            [readonly]="!canEditConfig()"
            (save)="saveConfig('Cierre del registro', { closesAt: $event })"
          />
          <app-editable-field
            label="Cupo de acreditados"
            hint="en personas"
            type="number"
            [value]="config().capacity ?? ''"
            [readonly]="!canEditConfig()"
            (save)="saveConfig('Cupo de acreditados', { capacity: toNumber($event) })"
          />
          <app-editable-field
            label="Texto de acceso total"
            hint="sale impreso en el gafete"
            [value]="config().allAccessLabel ?? ''"
            [readonly]="!canEditConfig()"
            placeholder="ALL ACCESS"
            (save)="saveConfig('Texto de acceso total', { allAccessLabel: $event })"
          />
        </div>

        <!-- Zonas -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">door_front</span>
              Zonas y qué da cada una
            </span>
            @if (canEditConfig()) {
              <button type="button" (click)="addZone()"
                class="px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/35 hover:bg-blue-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[13px]">add</span> Agregar zona
              </button>
            }
          </div>

          @if (!zones().length) {
            <p class="py-4 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
              Sin zonas, todos los gafetes dan acceso a todo. Define al menos una para poder distinguir quién entra a dónde.
            </p>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              @for (z of zones(); track z.id) {
                <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25 space-y-2">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1 space-y-1.5">
                      <input
                        [ngModel]="z.name"
                        (ngModelChange)="patchZone(z.id, { name: $event })"
                        [disabled]="!canEditConfig()"
                        placeholder="Nombre de la zona"
                        class="w-full bg-transparent text-xs font-black text-on-surface focus:outline-none border-b border-transparent focus:border-blue-400/60 transition-colors disabled:opacity-70"
                      />
                      <input
                        [ngModel]="z.description"
                        (ngModelChange)="patchZone(z.id, { description: $event })"
                        [disabled]="!canEditConfig()"
                        placeholder="Qué permite hacer"
                        class="w-full bg-transparent text-[11px] text-on-surface-variant focus:outline-none border-b border-transparent focus:border-blue-400/60 transition-colors disabled:opacity-70"
                      />
                    </div>
                    @if (canEditConfig()) {
                      <button type="button" (click)="removeZone(z.id)"
                        class="p-1.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shrink-0">
                        <span class="material-symbols-outlined text-[13px]">delete</span>
                      </button>
                    }
                  </div>
                  <div class="flex items-center justify-between gap-2 text-[10px] pt-1.5 border-t border-white/5">
                    <span class="text-outline">Ocupada por <strong class="text-on-surface font-mono">{{ occupancy(z.id) }}</strong> persona(s)</span>
                    @if (z.capacity) {
                      <span [class]="occupancy(z.id) > z.capacity ? 'text-rose-300 font-black' : 'text-outline'">
                        Cabe {{ z.capacity }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Kit de prensa -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <app-press-file-drop
            label="Kit de prensa"
            hint="boletín, fotos en alta y fechas"
            kind="file"
            [value]="config().pressKitUrl ?? ''"
            [readonly]="!canEditConfig()"
            (save)="saveConfig('Kit de prensa', { pressKitUrl: $event })"
            (named)="saveConfig('Kit de prensa', { pressKitName: $event })"
          />
          <app-editable-field
            label="Notas para los solicitantes"
            type="textarea"
            [rows]="4"
            [value]="config().notes ?? ''"
            [readonly]="!canEditConfig()"
            placeholder="Ej. los medios con cámara deben avisar el equipo 24 h antes"
            (save)="saveConfig('Notas de acreditación', { notes: $event })"
          />
        </div>
      </section>

      <!-- ─── DUPLICADAS ─── -->
      @if (duplicates().length) {
        <section class="p-4 sm:p-5 rounded-3xl bg-amber-500/[0.07] border border-amber-500/30 space-y-3">
          <h5 class="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
            <span class="material-symbols-outlined text-base">content_copy</span>
            Solicitudes que se pisan
          </h5>
          <p class="text-[11px] text-on-surface-variant leading-relaxed">
            Es lo más común del apartado y no se ve solo: la misma persona manda su solicitud dos veces porque no le
            llegó respuesta, o dos personas del mismo medio la mandan por separado. Aprobar las dos manda dos gafetes
            a la misma puerta.
          </p>
          <div class="space-y-2">
            @for (g of duplicates(); track g.reason + g.key) {
              <div class="p-3 rounded-2xl bg-black/30 border border-amber-500/25 text-[11px] space-y-1">
                <span class="font-black text-amber-200">
                  {{ g.reason === 'correo' ? 'Mismo correo' : 'Mismo medio' }}: {{ g.key }}
                </span>
                <div class="flex flex-wrap gap-1.5">
                  @for (r of g.requests; track r.id) {
                    <span class="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-on-surface-variant">
                      {{ r.journalistName }} · {{ statusLabel(r) }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- ─── LISTA ─── -->
      <section class="p-5 sm:p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h5 class="text-xs font-black uppercase tracking-wider text-on-surface flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-outline flex items-center justify-center material-symbols-outlined text-lg">list_alt</span>
            <span>Solicitudes ({{ filtered().length }})</span>
          </h5>

          <div class="flex items-center gap-2 flex-wrap">
            @if (selected().size > 0 && canDecide()) {
              <button type="button" (click)="approveSelected()"
                class="px-3.5 py-2 rounded-xl bg-emerald-500 text-black text-[11px] font-black hover:bg-emerald-400 transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[14px]">verified</span>
                Acreditar {{ selected().size }} en lote
              </button>
              <button type="button" (click)="deleteSelected()"
                class="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/35 hover:bg-rose-500 hover:text-white text-[11px] font-black transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[14px]">delete</span> Eliminar
              </button>
            }
            @if (canDecide()) {
              <button type="button" (click)="openNew()"
                [disabled]="!canRegister()"
                [title]="canRegister() ? 'Registrar una solicitud que llegó por fuera del portal' : windowBlockReason()"
                class="px-3.5 py-2 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/35 hover:bg-blue-500 hover:text-white text-[11px] font-black transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none">
                <span class="material-symbols-outlined text-[14px]">person_add</span> Registrar solicitud
              </button>
            }
          </div>
        </div>

        <!-- Filtros -->
        <div class="flex flex-wrap items-center gap-1.5">
          @for (chip of statusChips(); track chip.value) {
            <button type="button" (click)="statusFilter.set(chip.value)"
              [class]="statusFilter() === chip.value
                ? 'bg-blue-500 text-white border-blue-400'
                : 'bg-white/5 text-outline border-white/10 hover:text-on-surface'"
              class="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5">
              {{ chip.label }}
              <span class="font-mono opacity-70">{{ chip.count }}</span>
            </button>
          }
          <span class="w-px h-5 bg-white/10 mx-1"></span>
          @for (chip of kindChips(); track chip.value) {
            <button type="button" (click)="kindFilter.set(chip.value)"
              [class]="kindFilter() === chip.value
                ? 'bg-violet-500 text-white border-violet-400'
                : 'bg-white/5 text-outline border-white/10 hover:text-on-surface'"
              class="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all">
              {{ chip.label }}
            </button>
          }
          <span class="w-px h-5 bg-white/10 mx-1"></span>
          <select
            [ngModel]="coverageFilter()"
            (ngModelChange)="coverageFilter.set($event)"
            class="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-on-surface focus:outline-none focus:border-blue-400/60">
            <option value="todas" class="bg-surface-container">Toda la cobertura</option>
            @for (c of coverageTypes; track c) {
              <option [value]="c" class="bg-surface-container">{{ coverageLabel(c) }}</option>
            }
          </select>
        </div>

        <!-- Renglones -->
        @if (!filtered().length) {
          <p class="py-6 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
            {{ requests().length ? 'Ninguna solicitud coincide con el filtro.' : 'Todavía no llega ninguna solicitud de acreditación.' }}
          </p>
        } @else {
          <div class="space-y-2.5">
            @for (r of filtered(); track r.id) {
              <div class="p-3.5 rounded-2xl border transition-all"
                [class]="rowClass(r)">

                <div class="flex items-start gap-3 flex-wrap">
                  @if (canDecide()) {
                    <button type="button" (click)="toggleSelected(r.id)"
                      class="mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all"
                      [class]="selected().has(r.id)
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'bg-black/30 border-white/20 text-transparent hover:border-blue-400/60'">
                      <span class="material-symbols-outlined text-[13px]">check</span>
                    </button>
                  }

                  <!-- Quién y qué medio -->
                  <div class="min-w-0 flex-1 space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs font-black text-on-surface truncate">{{ r.journalistName }}</span>
                      <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border"
                        [class]="r.applicantType === 'media'
                          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                          : 'bg-violet-500/15 text-violet-300 border-violet-500/30'">
                        {{ r.applicantType === 'media' ? 'Medio' : 'Independiente' }}
                      </span>
                      <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border"
                        [class]="statusClass(r)">
                        {{ statusLabel(r) }}
                      </span>
                      @if (isLate(r)) {
                        <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Llegó tarde
                        </span>
                      }
                      @if (duplicateCount(r) > 0) {
                        <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-200 border border-amber-400/40"
                          [title]="'Comparte correo o medio con ' + duplicateCount(r) + ' solicitud(es) más'">
                          Duplicada ×{{ duplicateCount(r) + 1 }}
                        </span>
                      }
                    </div>

                    <div class="flex items-center gap-2 flex-wrap text-[11px] text-on-surface-variant">
                      <span class="font-bold text-blue-300 truncate">{{ r.mediumName }}</span>
                      <span class="text-outline">·</span>
                      <span>{{ coverageLabel(r.accredType) }}</span>
                      <span class="text-outline">·</span>
                      <span class="font-mono">{{ crew(r) }} persona(s)</span>
                      <span class="text-outline">·</span>
                      <span class="font-mono text-outline truncate">{{ r.email }}</span>
                    </div>

                    <div class="flex items-center gap-2 flex-wrap text-[10px] text-outline">
                      <span>ID: <span class="font-mono text-on-surface-variant">{{ r.cardId || 'sin capturar' }}</span></span>
                      <span>·</span>
                      <span>Solicitó el {{ when(r.requestedAt) }}</span>
                      @if (r.equipmentNotes) {
                        <span>·</span>
                        <span class="italic">{{ r.equipmentNotes }}</span>
                      }
                    </div>

                    @if (r.badgeId && isLive(r)) {
                      <div class="flex items-center gap-2 flex-wrap text-[10px] pt-1">
                        <span class="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-black">
                          {{ r.badgeId }}
                        </span>
                        <span class="text-on-surface-variant">{{ accessLabel(r) }}</span>
                        @if (r.respondedBy) {
                          <span class="text-outline">· resuelta por {{ r.respondedBy.name }} el {{ when(r.respondedAt) }}</span>
                        }
                      </div>
                    }

                    @if (r.status === 'rejected' && r.rejectionReason) {
                      <div class="mt-1.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-[10.5px] text-rose-200 leading-relaxed">
                        <strong class="uppercase text-[9px] tracking-wider block mb-0.5">
                          {{ r.revocation ? 'Motivo de la revocación' : 'Motivo del rechazo' }}
                          @if (r.revocation) { <span class="normal-case font-mono opacity-70">· gafete {{ r.revocation.badgeId || 's/f' }}</span> }
                        </strong>
                        {{ r.rejectionReason }}
                      </div>
                    }
                  </div>

                  <!-- Acciones -->
                  <div class="flex items-center gap-1.5 shrink-0 flex-wrap">
                    @if (showAttendance() && isLive(r)) {
                      <button type="button" (click)="toggleAttendance(r)"
                        [disabled]="!canMarkAttendance()"
                        class="px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                        [class]="r.attended
                          ? 'bg-emerald-500 text-black border-emerald-400'
                          : 'bg-white/5 text-outline border-white/15 hover:border-emerald-400/60 hover:text-emerald-300'">
                        <span class="material-symbols-outlined text-[13px]">{{ r.attended ? 'how_to_reg' : 'person_off' }}</span>
                        {{ r.attended ? 'Asistió' : 'No llegó' }}
                      </button>
                    }

                    @if (canDecide() && r.status === 'pending') {
                      <button type="button" (click)="openApprove(r)"
                        class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black text-[10px] font-black transition-all flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">verified</span> Acreditar
                      </button>
                      <button type="button" (click)="openReject(r)"
                        class="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/35 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">block</span> Rechazar
                      </button>
                    }

                    @if (canDecide() && isLive(r)) {
                      <button type="button" (click)="openApprove(r)"
                        class="px-3 py-1.5 rounded-xl bg-white/5 text-outline border border-white/15 hover:text-on-surface text-[10px] font-black transition-all flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">edit</span> Gafete
                      </button>
                      <button type="button" (click)="openRevoke(r)"
                        class="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/25 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">gpp_bad</span> Revocar
                      </button>
                    }

                    <button type="button" (click)="previewId.set(previewId() === r.id ? null : r.id)"
                      class="px-3 py-1.5 rounded-xl bg-white/5 text-outline border border-white/15 hover:text-on-surface text-[10px] font-black transition-all flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[13px]">badge</span>
                      {{ previewId() === r.id ? 'Cerrar' : 'Ver gafete' }}
                    </button>
                  </div>
                </div>

                <!-- Vista previa del gafete, tal como lo imprime el acreditado -->
                @if (previewId() === r.id) {
                  <div class="mt-3.5 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-start">
                    <div class="w-full max-w-[290px] bg-gradient-to-br from-[#1b1b1b] to-[#0d0d0d] border-2 border-blue-500/40 rounded-3xl p-4 flex flex-col relative overflow-hidden shadow-2xl text-left shrink-0">
                      <div class="absolute -right-16 -top-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl"></div>
                      <div class="w-10 h-2 bg-black/45 border border-white/10 rounded-full mx-auto mb-3 relative z-10"></div>

                      <div class="text-center pb-3 border-b border-white/5 relative z-10 flex flex-col gap-0.5">
                        <span class="text-[8px] uppercase tracking-[0.2em] font-black text-blue-400">ACORDEX OFICIAL</span>
                        <h5 class="text-xs font-black uppercase text-white tracking-wider">{{ coverageLabel(r.accredType) }}</h5>
                      </div>

                      <div class="py-3.5 flex flex-col gap-2.5 relative z-10">
                        <div class="flex flex-col min-w-0">
                          <span class="text-[7.5px] uppercase font-bold text-white/30">Reportero / Acreditado</span>
                          <span class="text-xs font-black text-white truncate mt-0.5">{{ r.journalistName }}</span>
                        </div>
                        <div class="flex flex-col min-w-0">
                          <span class="text-[7.5px] uppercase font-bold text-white/30">
                            {{ r.applicantType === 'media' ? 'Medio de Comunicación' : 'Plataforma / Canal' }}
                          </span>
                          <span class="text-xs font-bold text-blue-300 truncate mt-0.5">{{ r.mediumName }}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 mt-0.5">
                          <div class="flex flex-col">
                            <span class="text-[7.5px] uppercase font-bold text-white/30">ID Gafete</span>
                            <span class="text-[10px] font-black mt-0.5" [class]="r.badgeId ? 'text-white' : 'text-rose-400'">
                              {{ r.badgeId || 'SIN FOLIO' }}
                            </span>
                          </div>
                          <div class="flex flex-col">
                            <span class="text-[7.5px] uppercase font-bold text-white/30">Acceso Zonas</span>
                            <span class="text-[9px] font-black text-emerald-400 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                              <span class="truncate">{{ accessLabel(r) }}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div class="border-t border-white/5 pt-3 flex items-center justify-between gap-3 relative z-10">
                        <div class="flex flex-col min-w-0">
                          <span class="text-[7px] text-white/40 uppercase truncate">{{ event().title }}</span>
                          <span class="text-[7px] text-white/25 mt-0.5 truncate">{{ event().venue }}</span>
                        </div>
                        <div class="w-9 h-9 bg-white rounded-lg shrink-0 flex items-center justify-center border border-white/10">
                          <span class="material-symbols-outlined text-black text-lg">qr_code_2</span>
                        </div>
                      </div>
                    </div>

                    <div class="text-[11px] text-on-surface-variant leading-relaxed space-y-2 min-w-0">
                      <p class="font-black text-on-surface uppercase text-[10px] tracking-wider">Así lo verá e imprimirá el acreditado</p>
                      <p>
                        Es la misma credencial que el portal le muestra tras aprobar la solicitud. Si el folio sale en rojo
                        es porque la acreditación no tiene gafete asignado: en la puerta eso es una credencial que nadie
                        puede verificar contra esta lista.
                      </p>
                      @if (!isLive(r)) {
                        <p class="text-amber-300 font-bold">
                          Esta solicitud no está acreditada, así que el portal no le enseña ningún gafete todavía.
                        </p>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </section>

      <!-- ─── DIÁLOGO: ACREDITAR ─── -->
      @if (approveTarget(); as target) {
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" (click)="approveTarget.set(null)">
          <div class="w-full max-w-lg p-6 rounded-[2rem] bg-surface-container-high border border-emerald-500/40 shadow-2xl space-y-5 max-h-[88vh] overflow-y-auto scroll-oculto" (click)="$event.stopPropagation()">
            <div class="flex items-start gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-2xl">verified</span>
              </div>
              <div class="min-w-0 space-y-1">
                <h5 class="font-['Epilogue'] font-black text-lg text-on-surface leading-tight">
                  Acreditar a {{ target.journalistName }}
                </h5>
                <p class="text-[11px] text-outline">{{ target.mediumName }} · {{ coverageLabel(target.accredType) }} · {{ crew(target) }} persona(s)</p>
              </div>
            </div>

            @if (duplicateCount(target) > 0) {
              <div class="p-3 rounded-xl bg-amber-500/15 border border-amber-500/35 text-[11px] text-amber-100 leading-relaxed">
                Hay {{ duplicateCount(target) }} solicitud(es) más con el mismo correo o el mismo medio. Revisa que no
                estés emitiendo dos gafetes para la misma persona.
              </div>
            }

            @if (wouldExceed(target)) {
              <div class="p-3 rounded-xl bg-rose-500/12 border border-rose-500/35 text-[11px] text-rose-100 leading-relaxed">
                Con esta acreditación el cupo queda en {{ stats().headcount + crew(target) }} de {{ stats().capacity }}.
                No está bloqueado: tú sabes si cabe uno más.
              </div>
            }

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline">Folio del gafete</label>
              <div class="flex gap-2">
                <input
                  [ngModel]="approveBadge()"
                  (ngModelChange)="approveBadge.set($event)"
                  class="flex-1 bg-black/40 border border-outline-variant/30 focus:border-emerald-400/60 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none font-mono transition-colors"
                />
                <button type="button" (click)="approveBadge.set(suggestBadge())"
                  class="px-3 py-2 rounded-xl bg-white/5 text-outline border border-white/15 hover:text-on-surface text-[10px] font-black transition-all">
                  Generar
                </button>
              </div>
              <p class="text-[10px] text-outline">Si lo dejas vacío se genera uno: nunca se aprueba sin folio.</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline">Zonas del gafete</label>
              @if (!zones().length) {
                <p class="text-[11px] text-outline italic p-3 rounded-xl bg-black/30 border border-dashed border-white/10">
                  Este evento no tiene zonas definidas, así que el gafete saldrá con acceso total
                  ({{ config().allAccessLabel || 'ALL ACCESS' }}).
                </p>
              } @else {
                <div class="flex flex-wrap gap-2">
                  @for (z of zones(); track z.id) {
                    <button type="button" (click)="toggleApproveZone(z.id)"
                      class="px-3 py-2 rounded-xl border text-[11px] font-bold transition-all text-left"
                      [class]="approveZones().includes(z.id)
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/45'
                        : 'bg-white/5 text-outline border-white/12 hover:text-on-surface'">
                      <span class="block">{{ z.name }}</span>
                      @if (z.description) { <span class="block text-[9px] font-medium opacity-70 max-w-[220px] truncate">{{ z.description }}</span> }
                    </button>
                  }
                </div>
              }
            </div>

            <div class="flex items-center justify-end gap-2.5">
              <button type="button" (click)="approveTarget.set(null)"
                class="px-4 py-2.5 rounded-xl text-xs font-bold text-outline hover:text-on-surface transition-colors">Cancelar</button>
              <button type="button" (click)="confirmApprove()"
                class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2">
                <span class="material-symbols-outlined text-base">verified</span>
                {{ isLive(target) ? 'Guardar gafete' : 'Acreditar y emitir gafete' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ─── DIÁLOGO: RECHAZAR / REVOCAR ─── -->
      @if (reasonTarget(); as target) {
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" (click)="reasonTarget.set(null)">
          <div class="w-full max-w-lg p-6 rounded-[2rem] bg-surface-container-high border border-rose-500/40 shadow-2xl space-y-5" (click)="$event.stopPropagation()">
            <div class="flex items-start gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-2xl">{{ reasonMode() === 'revoke' ? 'gpp_bad' : 'block' }}</span>
              </div>
              <div class="min-w-0 space-y-1">
                <h5 class="font-['Epilogue'] font-black text-lg text-on-surface leading-tight">
                  {{ reasonMode() === 'revoke' ? 'Revocar el gafete de' : 'Rechazar la solicitud de' }} {{ target.journalistName }}
                </h5>
                <p class="text-[11px] text-outline">{{ target.mediumName }}</p>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-[11px] text-on-surface-variant leading-relaxed">
              @if (reasonMode() === 'revoke') {
                Quien ya tenía su gafete confirmado probablemente apartó su agenda y es muy posible que se presente
                igual. El motivo queda registrado con el folio, para poder explicarlo en la puerta.
              } @else {
                El motivo se le muestra al solicitante en el portal, junto a un botón de
                <strong>Corregir Datos e Intentar Nuevamente</strong>. Un rechazo sin explicación produce exactamente
                la misma solicitud otra vez.
              }
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline">Motivo (obligatorio)</label>
              <textarea
                [ngModel]="reasonText()"
                (ngModelChange)="reasonText.set($event)"
                rows="4"
                placeholder="Ej. el enlace al canal no está activo y no fue posible verificar coberturas previas"
                class="w-full bg-black/40 border border-outline-variant/30 focus:border-rose-400/60 rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none transition-colors resize-y"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-2.5">
              <button type="button" (click)="reasonTarget.set(null)"
                class="px-4 py-2.5 rounded-xl text-xs font-bold text-outline hover:text-on-surface transition-colors">Cancelar</button>
              <button type="button" (click)="confirmReason()"
                [disabled]="!reasonText().trim()"
                class="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2">
                <span class="material-symbols-outlined text-base">send</span>
                {{ reasonMode() === 'revoke' ? 'Revocar con motivo' : 'Rechazar y avisar' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ─── DIÁLOGO: ALTA MANUAL ─── -->
      @if (newOpen()) {
        <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" (click)="newOpen.set(false)">
          <div class="w-full max-w-xl p-6 rounded-[2rem] bg-surface-container-high border border-blue-500/40 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto scroll-oculto" (click)="$event.stopPropagation()">
            <h5 class="font-['Epilogue'] font-black text-lg text-on-surface">Registrar una solicitud</h5>
            <p class="text-[11px] text-outline leading-relaxed">
              Para las que no llegan por el portal: las que avisan por WhatsApp, por teléfono o porque el medio de
              siempre simplemente dice que va. Entra en revisión igual que las demás.
            </p>

            <div class="grid grid-cols-2 gap-2">
              <button type="button" (click)="newForm.applicantType = 'media'"
                [class]="newForm.applicantType === 'media' ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 text-outline border-white/12'"
                class="py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all">Medio Oficial</button>
              <button type="button" (click)="newForm.applicantType = 'independent'"
                [class]="newForm.applicantType === 'independent' ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 text-outline border-white/12'"
                class="py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all">Freelance / Creador</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="space-y-1 block">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline">
                  {{ newForm.applicantType === 'media' ? 'Nombre del medio' : 'Plataforma / canal' }}
                </span>
                <input [(ngModel)]="newForm.mediumName" class="w-full bg-black/40 border border-outline-variant/30 focus:border-blue-400/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none" />
              </label>
              <label class="space-y-1 block">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline">Tipo de cobertura</span>
                <select [(ngModel)]="newForm.accredType" class="w-full bg-black/40 border border-outline-variant/30 focus:border-blue-400/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none">
                  @for (c of coverageTypes; track c) {
                    <option [value]="c" class="bg-surface-container">{{ coverageLabel(c) }}</option>
                  }
                </select>
              </label>
              <label class="space-y-1 block">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline">Nombre del solicitante</span>
                <input [(ngModel)]="newForm.journalistName" class="w-full bg-black/40 border border-outline-variant/30 focus:border-blue-400/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none" />
              </label>
              <label class="space-y-1 block">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline">Correo de contacto</span>
                <input type="email" [(ngModel)]="newForm.email" class="w-full bg-black/40 border border-outline-variant/30 focus:border-blue-400/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none" />
              </label>
              <label class="space-y-1 block">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline">
                  {{ newForm.applicantType === 'media' ? 'Cédula de prensa' : 'INE / identificación' }}
                </span>
                <input [(ngModel)]="newForm.cardId" class="w-full bg-black/40 border border-outline-variant/30 focus:border-blue-400/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none" />
              </label>
              <label class="space-y-1 block">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline">Cuánta gente trae</span>
                <input type="number" min="1" [(ngModel)]="newForm.crewSize" class="w-full bg-black/40 border border-outline-variant/30 focus:border-blue-400/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none font-mono" />
              </label>
            </div>

            <label class="space-y-1 block">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline">Equipo que va a meter</span>
              <input [(ngModel)]="newForm.equipmentNotes" placeholder="Ej. cámara de hombro, trípode y micrófono de mano" class="w-full bg-black/40 border border-outline-variant/30 focus:border-blue-400/60 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none" />
            </label>

            <div class="flex items-center justify-end gap-2.5 pt-1">
              <button type="button" (click)="newOpen.set(false)"
                class="px-4 py-2.5 rounded-xl text-xs font-bold text-outline hover:text-on-surface transition-colors">Cancelar</button>
              <button type="button" (click)="confirmNew()"
                [disabled]="!canSaveNew()"
                class="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none">
                Registrar solicitud
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PressTabAccreditationsComponent {
  private readonly session = inject(SessionService);

  readonly event = input.required<PressEventItem>();
  /** Se pueden tocar la ventana, el cupo, las zonas y el kit. */
  readonly canEditConfig = input<boolean>(false);
  /** Se pueden aprobar, rechazar y revocar solicitudes. */
  readonly canDecide = input<boolean>(false);
  /** Se puede marcar quién se presentó. */
  readonly canMarkAttendance = input<boolean>(false);

  readonly patch = output<Partial<PressEventItem>>();
  readonly notify = output<string>();
  readonly openTasks = output<void>();

  readonly coverageTypes = COVERAGE_TYPES;

  readonly mandatory = new MandatoryFields<PressEventItem>(
    () => this.event(),
    () => this.session.actor(),
    patch => this.patch.emit(patch)
  );

  // ─── Estado de la pantalla ──────────────────────────────────────────────────

  readonly statusFilter = signal<'todas' | 'pending' | 'approved' | 'rejected'>('todas');
  readonly kindFilter = signal<'todas' | AccreditationKind>('todas');
  readonly coverageFilter = signal<string>('todas');
  readonly selected = signal<Set<string>>(new Set());
  readonly previewId = signal<string | null>(null);

  readonly approveTarget = signal<PressAccreditationRequest | null>(null);
  readonly approveBadge = signal('');
  readonly approveZones = signal<string[]>([]);

  readonly reasonTarget = signal<PressAccreditationRequest | null>(null);
  readonly reasonMode = signal<'reject' | 'revoke'>('reject');
  readonly reasonText = signal('');

  readonly newOpen = signal(false);
  newForm = this.emptyNewForm();

  // ─── Derivados ──────────────────────────────────────────────────────────────

  /**
   * Las reglas de acreditación, siempre con forma.
   *
   * El bloque es obligatorio en el modelo, pero un expediente guardado antes de
   * que existiera llegaría sin él y la plantilla reventaría al leer `zones`.
   */
  readonly config = computed(() => this.event().accreditation || emptyAccreditationConfig());

  readonly requests = computed(() => pressRequests(this.event()));
  readonly stats = computed(() => accreditationStats(this.event()));
  readonly zones = computed(() => pressZones(this.event()));
  readonly duplicates = computed(() => duplicateGroups(this.event()));

  /**
   * La asistencia solo tiene sentido el día del evento y después.
   *
   * El permiso lo da la fase y el momento lo da el calendario. Mezclarlos hacía
   * que un evento convocado para dentro de tres semanas anunciara "3 no se
   * presentaron", que es una cifra falsa dicha con toda seguridad.
   */
  readonly showAttendance = computed(() => isCheckInOpen(this.event()));

  readonly filtered = computed(() => {
    const estado = this.statusFilter();
    const tipo = this.kindFilter();
    const cobertura = this.coverageFilter();

    return this.requests().filter(r => {
      if (estado !== 'todas' && r.status !== estado) return false;
      if (tipo !== 'todas' && r.applicantType !== tipo) return false;
      if (cobertura !== 'todas' && r.accredType !== cobertura) return false;
      return true;
    });
  });

  statusChips(): { value: 'todas' | 'pending' | 'approved' | 'rejected'; label: string; count: number }[] {
    const list = this.requests();
    return [
      { value: 'todas', label: 'Todas', count: list.length },
      { value: 'pending', label: 'Por revisar', count: list.filter(r => r.status === 'pending').length },
      { value: 'approved', label: 'Acreditadas', count: list.filter(isApproved).length },
      { value: 'rejected', label: 'Rechazadas', count: list.filter(r => r.status === 'rejected').length }
    ];
  }

  kindChips(): { value: 'todas' | AccreditationKind; label: string }[] {
    return [
      { value: 'todas', label: 'Todos' },
      { value: 'media', label: 'Medios' },
      { value: 'independent', label: 'Independientes' }
    ];
  }

  // ─── Presentación ───────────────────────────────────────────────────────────

  coverageLabel(c: CoverageType): string {
    return COVERAGE_LABELS[c] || c;
  }

  crew(r: PressAccreditationRequest): number {
    return crewSize(r);
  }

  isLive(r: PressAccreditationRequest): boolean {
    return isApproved(r);
  }

  isLate(r: PressAccreditationRequest): boolean {
    return isLateRequest(this.event(), r);
  }

  duplicateCount(r: PressAccreditationRequest): number {
    return duplicatesOf(this.event(), r).length;
  }

  accessLabel(r: PressAccreditationRequest): string {
    return badgeAccessLabel(this.event(), r);
  }

  occupancy(zoneId: string): number {
    return zoneOccupancy(this.event(), zoneId);
  }

  when(iso?: string): string {
    return stampLabel(iso);
  }

  statusLabel(r: PressAccreditationRequest): string {
    if (r.revocation) return 'Revocada';
    return ACCREDITATION_STATUS_LABEL[r.status];
  }

  statusClass(r: PressAccreditationRequest): string {
    if (r.revocation) return 'bg-rose-500/15 text-rose-300 border-rose-500/35';
    switch (r.status) {
      case 'approved': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35';
      case 'rejected': return 'bg-rose-500/12 text-rose-300 border-rose-500/30';
      default: return 'bg-amber-500/15 text-amber-300 border-amber-500/35';
    }
  }

  rowClass(r: PressAccreditationRequest): string {
    if (this.selected().has(r.id)) return 'bg-blue-500/10 border-blue-500/40';
    if (r.status === 'pending') return 'bg-amber-500/[0.05] border-amber-500/20';
    if (isApproved(r)) return 'bg-surface-container/60 border-outline-variant/25';
    return 'bg-black/20 border-white/8 opacity-80';
  }

  cupoClass(): string {
    const s = this.stats();
    if (s.remaining === null) return 'bg-surface-container/60 border-outline-variant/25';
    if (s.overCapacity) return 'bg-rose-500/10 border-rose-500/35';
    if (s.remaining <= 3) return 'bg-amber-500/10 border-amber-500/35';
    return 'bg-surface-container/60 border-outline-variant/25';
  }

  windowLabel(): string {
    return registrationWindowLabel(this.event());
  }

  windowIcon(): string {
    switch (registrationWindow(this.event())) {
      case 'abierto': return 'lock_open';
      case 'cerrado': return 'lock';
      case 'por-abrir': return 'schedule';
      default: return 'help';
    }
  }

  windowClass(): string {
    switch (registrationWindow(this.event())) {
      case 'abierto': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35';
      case 'cerrado': return 'bg-rose-500/12 text-rose-300 border-rose-500/30';
      case 'por-abrir': return 'bg-sky-500/15 text-sky-300 border-sky-500/35';
      default: return 'bg-white/5 text-outline border-white/12';
    }
  }

  /**
   * Si se puede dar de alta una solicitud nueva.
   *
   * Aquí es donde la fecha de cierre deja de ser una frase: pasada esa hora el
   * registro está cerrado de verdad y el botón no abre. Sin esto, el campo sería
   * un requisito del checklist cuyo valor solo pinta texto.
   */
  canRegister(): boolean {
    return this.canDecide() && registrationWindow(this.event()) !== 'cerrado'
      && registrationWindow(this.event()) !== 'por-abrir';
  }

  windowBlockReason(): string {
    switch (registrationWindow(this.event())) {
      case 'cerrado': return this.windowLabel() + ': ya no se admiten altas nuevas.';
      case 'por-abrir': return this.windowLabel() + ': todavía no abre.';
      default: return '';
    }
  }

  // ─── Configuración ──────────────────────────────────────────────────────────

  toNumber(value: string): number {
    return Number(value) || 0;
  }

  /**
   * Guarda un cambio de las reglas de acreditación.
   *
   * El bloque va anidado, así que el parche se fusiona con lo que ya había en vez
   * de reemplazarlo: mandar `{ accreditation: { capacity } }` a secas borraría de
   * un plumazo las zonas, el kit y la ventana de registro, y eso se nota tarde y
   * mal —el dato desaparece sin que nadie lo haya tocado—.
   */
  saveConfig(label: string, changes: Record<string, unknown>): void {
    this.mandatory.save('acreditacion', label, {
      accreditation: { ...this.config(), ...changes }
    } as Partial<PressEventItem>);
  }

  addZone(): void {
    const zona: PressZone = {
      id: `z-${Date.now().toString(36)}`,
      name: 'Zona nueva',
      description: ''
    };
    this.saveConfig('Zonas de acceso', { zones: [...this.zones(), zona] });
  }

  patchZone(id: string, changes: Partial<PressZone>): void {
    this.saveConfig('Zonas de acceso', {
      zones: this.zones().map(z => (z.id === id ? { ...z, ...changes } : z))
    });
  }

  /**
   * Quita una zona.
   *
   * Los gafetes que la tenían asignada se quedarían apuntando a una zona que ya
   * no existe, así que se limpian de paso: un gafete con una zona fantasma sale
   * impreso con un nombre que en la puerta no significa nada.
   */
  removeZone(id: string): void {
    const requests = this.requests().map(r =>
      (r.zones || []).includes(id) ? { ...r, zones: (r.zones || []).filter(z => z !== id) } : r);

    this.patch.emit({
      accreditation: { ...this.config(), zones: this.zones().filter(z => z.id !== id) },
      accreditationRequests: requests
    });
  }

  onIntervene(task: ResolvedTask): void {
    this.patch.emit(markIntervention(this.event(), task, this.session.actor()));
  }

  // ─── Selección y lote ───────────────────────────────────────────────────────

  toggleSelected(id: string): void {
    this.selected.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  approveSelected(): void {
    const result = approveMany(this.event(), [...this.selected()], this.session.actor());
    this.apply(result);
    this.selected.set(new Set());
  }

  deleteSelected(): void {
    const result = removeRequests(this.event(), [...this.selected()], this.session.actor());
    this.apply(result);
    this.selected.set(new Set());
  }

  // ─── Diálogos ───────────────────────────────────────────────────────────────

  openApprove(r: PressAccreditationRequest): void {
    this.approveTarget.set(r);
    this.approveBadge.set(r.badgeId || nextBadgeId(this.event()));
    this.approveZones.set(r.zones?.length ? [...r.zones] : this.zones().map(z => z.id));
  }

  suggestBadge(): string {
    return nextBadgeId(this.event());
  }

  toggleApproveZone(id: string): void {
    this.approveZones.update(list =>
      list.includes(id) ? list.filter(z => z !== id) : [...list, id]);
  }

  wouldExceed(r: PressAccreditationRequest): boolean {
    const s = this.stats();
    return s.capacity > 0 && !isApproved(r) && s.headcount + crewSize(r) > s.capacity;
  }

  confirmApprove(): void {
    const target = this.approveTarget();
    if (!target) return;

    const result = isApproved(target)
      ? updateBadge(this.event(), target.id, this.session.actor(),
        { badgeId: this.approveBadge(), zones: this.approveZones() })
      : approveRequest(this.event(), target.id, this.session.actor(),
        { badgeId: this.approveBadge(), zones: this.approveZones() });

    this.apply(result);
    this.approveTarget.set(null);
  }

  openReject(r: PressAccreditationRequest): void {
    this.reasonMode.set('reject');
    this.reasonText.set('');
    this.reasonTarget.set(r);
  }

  openRevoke(r: PressAccreditationRequest): void {
    this.reasonMode.set('revoke');
    this.reasonText.set('');
    this.reasonTarget.set(r);
  }

  confirmReason(): void {
    const target = this.reasonTarget();
    if (!target) return;

    const result = this.reasonMode() === 'revoke'
      ? revokeAccreditation(this.event(), target.id, this.session.actor(), this.reasonText())
      : rejectRequest(this.event(), target.id, this.session.actor(), this.reasonText());

    this.apply(result);
    if (!result.blocked) this.reasonTarget.set(null);
  }

  toggleAttendance(r: PressAccreditationRequest): void {
    this.apply(setAttendance(this.event(), r.id, !r.attended, this.session.actor()));
  }

  openNew(): void {
    this.newForm = this.emptyNewForm();
    this.newOpen.set(true);
  }

  canSaveNew(): boolean {
    return !!this.newForm.journalistName.trim() && !!this.newForm.email.trim();
  }

  confirmNew(): void {
    if (!this.canSaveNew()) return;
    this.apply(addRequest(this.event(), {
      ...this.newForm,
      crewSize: Number(this.newForm.crewSize) || 1
    }, this.session.actor()));
    this.newOpen.set(false);
  }

  private emptyNewForm() {
    return {
      applicantType: 'media' as AccreditationKind,
      mediumName: '',
      journalistName: '',
      email: '',
      phone: '',
      cardId: '',
      accredType: 'Prensa Escrita' as CoverageType,
      crewSize: 1 as number | string,
      equipmentNotes: '',
      internalNotes: ''
    };
  }

  private apply(result: { patch: Partial<PressEventItem>; message: string; blocked?: boolean }): void {
    if (Object.keys(result.patch).length) this.patch.emit(result.patch);
    if (result.message) this.notify.emit(result.message);
  }
}
