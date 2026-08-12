import { Component, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventItem, EventTask } from '../../../core/models/event.models';
import { SessionService } from '../../../core/services/session.service';
import { resolveTasks, ResolvedTask } from '../../../features/events/event-tasks';

@Component({
  selector: 'app-mandatory-task-tag',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (task()) {
      @let t = task()!;
      @let done = isDone();
      @let assigned = assignedManager();

      <div class="inline-flex items-center gap-1.5 relative group z-30 select-none">

        <!-- ─── BADGE ESQUINA ULTRA-PREMIUM (PENDIENTE VS VERIFICADO VS PROPUESTA) ─── -->
        @if (hasPendingProposal()) {
          <!-- PROPUESTA DE CAMBIO PENDIENTE (AMBER / WARNING GLOW GLASS) -->
          <button
            type="button"
            (click)="showProposalModal.set(true)"
            class="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-surface-container-high/90 to-yellow-950/90 hover:from-amber-900 hover:to-yellow-900 text-amber-300 border border-amber-400/70 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.3)] backdrop-blur-xl transition-all duration-300 active:scale-95 cursor-pointer group/btn"
          >
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shadow-[0_0_12px_#f59e0b]"></span>
            <span class="material-symbols-outlined text-[14px] text-amber-300">error</span>
            <span class="tracking-wider text-amber-200">CAMBIO PROPUESTO</span>
            <span class="text-amber-400/40">•</span>
            <span class="text-white font-bold normal-case">
              {{ task()?.pendingChangeProposal?.proposedBy?.name || 'Otro Manager' }}
            </span>
          </button>
        } @else if (done) {
          <!-- VERIFICADO (EMERALD / TEAL GLASS) -->
          <div
            class="px-3 py-1 rounded-2xl bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-xl cursor-default transition-all"
            [title]="'Verificado en expediente el ' + completedAtLabel()"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
            <span class="material-symbols-outlined text-[13px] text-emerald-400">verified</span>
            <span class="tracking-widest">VERIFICADO</span>
            <span class="text-emerald-400/40">•</span>
            <span class="text-emerald-200 font-bold normal-case">
              {{ completedByLabel() }}
            </span>
            <span class="text-emerald-400/60 text-[9px] font-mono pl-1">{{ completedAtLabel() }}</span>
          </div>
        } @else {
          <!-- PENDIENTE (ROSE / AMBER GLOW GLASS) -->
          <button
            type="button"
            (click)="handleTagClick()"
            class="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-surface-container-high/90 to-amber-950/80 hover:from-rose-900/90 hover:to-amber-900/90 text-rose-300 border border-rose-500/50 hover:border-amber-400/80 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(244,63,94,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] backdrop-blur-xl transition-all duration-300 active:scale-95 cursor-pointer group/btn"
          >
            <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping shadow-[0_0_10px_#f43f5e]"></span>
            <span class="material-symbols-outlined text-[13px] text-rose-400 group-hover/btn:rotate-12 transition-transform">lock</span>
            <span class="tracking-wider text-rose-200">OBLIGATORIO</span>
            <span class="text-rose-400/40">•</span>
            <span class="text-amber-300 font-bold normal-case flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px] text-amber-400">person</span>
              {{ assigned }}
            </span>

            @if (isOtherManagerAssigned()) {
              <span class="px-2 py-0.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black border border-amber-300/80 text-[9px] font-black ml-1 uppercase shadow-md shadow-amber-500/30 flex items-center gap-1 group-hover/btn:scale-105 transition-transform">
                <span class="material-symbols-outlined text-[11px]">bolt</span> Intervenir
              </span>
            }
          </button>
        }

        <!-- ─── MODAL INLINE DE CONFIRMACIÓN DE INTERVENCIÓN (MANAGER OVERRIDE) ─── -->
        @if (showInterventionModal()) {
          <div
            class="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in"
            (click)="showInterventionModal.set(false)"
          >
            <div
              class="relative w-full max-w-lg p-7 sm:p-8 rounded-[2.5rem] bg-gradient-to-b from-[#1c1812] via-[#141619] to-black border border-amber-400/50 shadow-[0_0_80px_rgba(245,158,11,0.3)] space-y-6 backdrop-blur-2xl text-left"
              (click)="$event.stopPropagation()"
            >
              <!-- Icono flotante de fondo -->
              <div class="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <!-- Encabezado Modal Intervención -->
              <div class="flex items-start gap-4 relative z-10">
                <div class="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/50 text-amber-300 flex items-center justify-center font-bold shrink-0 shadow-xl shadow-amber-500/20">
                  <span class="material-symbols-outlined text-3xl">shield_person</span>
                </div>
                <div class="space-y-1 min-w-0 flex-1">
                  <span class="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase tracking-widest inline-block shadow-sm">
                    ⚡ Intervención de Manager (Override)
                  </span>
                  <h5 class="font-['Epilogue'] font-black text-xl text-on-surface leading-tight tracking-tight">
                    ¿Intervenir y desbloquear esta tarea?
                  </h5>
                </div>
              </div>

              <!-- Contenido Explicativo -->
              <div class="p-5 rounded-3xl bg-surface-container-high/60 border border-white/10 text-xs space-y-3 leading-relaxed relative z-10">
                <div class="flex items-center gap-2 text-amber-300 font-bold">
                  <span class="material-symbols-outlined text-base">lock</span>
                  <span>Tarea originalmente asignada a:</span>
                </div>
                <div class="p-3 rounded-2xl bg-black/60 border border-amber-500/30 text-amber-200 text-sm font-black flex items-center gap-2">
                  <span class="material-symbols-outlined text-base">person</span>
                  <span>{{ assigned }}</span>
                </div>
                <p class="text-outline text-[11px] leading-relaxed">
                  Al confirmar la intervención, tomarás la responsabilidad de este campo obligatorio, el formulario se **desbloqueará para edición**, y tu nombre quedará registrado en la bitácora del expediente.
                </p>
              </div>

              <!-- Botones de Acción -->
              <div class="flex items-center gap-3 justify-end pt-2 relative z-10">
                <button
                  type="button"
                  (click)="showInterventionModal.set(false)"
                  class="px-5 py-3 rounded-2xl text-xs font-bold text-outline hover:text-on-surface transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  (click)="confirmIntervention()"
                  class="px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black text-xs shadow-xl shadow-amber-500/30 transition-all active:scale-95 flex items-center gap-2"
                >
                  <span class="material-symbols-outlined text-lg">bolt</span>
                  <span>Sí, intervenir y desbloquear edición</span>
                </button>
              </div>

            </div>
          </div>
        }

        <!-- ─── MODAL DE REVISIÓN DE CAMBIO PROPUESTO (Aceptación / Rechazo) ─── -->
        @if (showProposalModal() && task()?.pendingChangeProposal) {
          @let prop = task()!.pendingChangeProposal!;
          <div
            class="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
            (click)="showProposalModal.set(false)"
          >
            <div
              class="relative w-full max-w-lg p-7 sm:p-8 rounded-[2.5rem] bg-gradient-to-b from-[#1c1812] via-[#16171a] to-black border border-amber-400/60 shadow-[0_0_90px_rgba(245,158,11,0.35)] space-y-6 backdrop-blur-2xl text-left"
              (click)="$event.stopPropagation()"
            >
              <div class="flex items-start gap-4 relative z-10">
                <div class="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/50 text-amber-300 flex items-center justify-center font-bold shrink-0 shadow-xl shadow-amber-500/20">
                  <span class="material-symbols-outlined text-3xl">rate_review</span>
                </div>
                <div class="space-y-1 min-w-0 flex-1">
                  <span class="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase tracking-widest inline-block shadow-sm">
                    ⚠️ Propuesta de Modificación Post-Completado
                  </span>
                  <h5 class="font-['Epilogue'] font-black text-xl text-on-surface leading-tight tracking-tight">
                    Revisar Cambio en {{ prop.fieldLabel }}
                  </h5>
                </div>
              </div>

              <div class="p-5 rounded-3xl bg-surface-container-high/60 border border-white/10 text-xs space-y-3 leading-relaxed relative z-10">
                <div class="flex items-center justify-between gap-2 text-amber-300 font-bold">
                  <span class="flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-base">person_edit</span>
                    <span>Propuesto por:</span>
                  </span>
                  <span class="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 font-black">
                    {{ prop.proposedBy.name }} ({{ prop.proposedBy.managerName }})
                  </span>
                </div>

                <div class="p-3.5 rounded-2xl bg-black/70 border border-amber-500/30 space-y-2">
                  <div class="text-[10px] font-black uppercase tracking-wider text-outline">Modificación Solicitada</div>
                  <div class="text-xs font-mono font-bold text-amber-200 break-all">
                    {{ formatProposalChanges(prop) }}
                  </div>
                </div>

                <p class="text-outline text-[11px]">
                  Como encargado asignado (<strong>{{ assigned }}</strong>), debes aprobar o rechazar esta modificación. Si la apruebas, el expediente se actualizará con los nuevos valores.
                </p>
              </div>

              <!-- Botones Aceptar / Rechazar -->
              <div class="flex items-center gap-3 justify-end pt-2 relative z-10">
                <button
                  type="button"
                  (click)="showProposalModal.set(false)"
                  class="px-4 py-3 rounded-2xl text-xs font-bold text-outline hover:text-on-surface transition-colors"
                >
                  Cerrar
                </button>
                @if (canManageProposal()) {
                  <button
                    type="button"
                    (click)="handleRejectProposal()"
                    class="px-5 py-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white font-black text-xs transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <span class="material-symbols-outlined text-base">close</span>
                    <span>Rechazar Cambio</span>
                  </button>
                  <button
                    type="button"
                    (click)="handleAcceptProposal()"
                    class="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 text-black font-black text-xs shadow-xl shadow-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <span class="material-symbols-outlined text-base font-bold">check</span>
                    <span>Aceptar y Aplicar</span>
                  </button>
                } @else {
                  <span class="text-[11px] text-amber-300/80 italic font-bold">
                    Esperando decisión de {{ assigned }}
                  </span>
                }
              </div>

            </div>
          </div>
        }

        <!-- ─── MENSAJE DE RESTRICCIÓN PARA STAFF / ADMIN ─── -->
        @if (showStaffRestrictionToast()) {
          <div class="absolute right-0 top-full mt-2 w-80 p-4 rounded-3xl bg-rose-950/95 border border-rose-500/50 text-rose-200 text-xs shadow-2xl backdrop-blur-2xl space-y-1.5 animate-slide-up z-50">
            <div class="flex items-center gap-2 font-black text-rose-300">
              <span class="material-symbols-outlined text-base">block</span>
              <span>Edición Bloqueada por Rol</span>
            </div>
            <p class="text-[11px] text-rose-200/90 leading-relaxed">
              Esta tarea obligatoria pertenece a <strong>{{ assigned }}</strong>. El personal de Staff/Admin no puede resolver tareas de otros managers a menos que hayan sido formalmente delegadas.
            </p>
          </div>
        }

      </div>
    }
  `
})
export class MandatoryTaskTagComponent {
  private sessionService = inject(SessionService);

  readonly checklistItemId = input.required<string>();
  readonly event = input.required<EventItem>();

  readonly intervene = output<ResolvedTask>();
  readonly acceptProposal = output<ResolvedTask>();
  readonly rejectProposal = output<ResolvedTask>();

  readonly showInterventionModal = signal(false);
  readonly showProposalModal = signal(false);
  readonly showStaffRestrictionToast = signal(false);

  readonly resolvedTasksList = computed(() => resolveTasks(this.event()));

  readonly task = computed<ResolvedTask | undefined>(() => {
    const id = this.checklistItemId();
    return this.resolvedTasksList().find(t =>
      t.checklistItemId === id ||
      t.formSectionRef === id ||
      t.id === `task-sys-${id}` ||
      (id === 'coverUrl' && (t.checklistItemId === 'portada' || t.formSectionRef === 'coverUrl')) ||
      (id === 'posterUrl' && (t.checklistItemId === 'cartel_oficial' || t.formSectionRef === 'posterUrl')) ||
      (id === 'ticketTiers' && (t.checklistItemId === 'boletos' || t.formSectionRef === 'ticketTiers')) ||
      (id === 'schedule' && (t.checklistItemId === 'corrida' || t.checklistItemId === 'orden' || t.formSectionRef === 'schedule')) ||
      (id === 'sound' && (t.checklistItemId === 'sonido' || t.formSectionRef === 'sound')) ||
      (id === 'videos_grupos' && (t.checklistItemId === 'videos_grupos' || t.formSectionRef === 'videos_grupos' || t.formSectionRef === 'greetingVideos'))
    );
  });

  readonly isDone = computed(() => this.task()?.done ?? false);

  readonly hasPendingProposal = computed(() => {
    const t = this.task();
    return t?.pendingChangeProposal && t.pendingChangeProposal.status === 'pendiente';
  });

  readonly canManageProposal = computed(() => {
    const actorMgr = this.sessionService.actor().managerName;
    const assigned = this.assignedManager();
    return assigned === actorMgr || actorMgr === 'Encargado Acordex' || this.sessionService.belongsTo(assigned);
  });

  readonly assignedManager = computed(() => {
    const t = this.task();
    return t?.assignedManager || this.event().ownerManagerName || this.event().createdBy;
  });

  readonly isOtherManagerAssigned = computed(() => {
    const actorMgr = this.sessionService.actor().managerName;
    const assigned = this.assignedManager();
    return assigned !== actorMgr && !this.sessionService.belongsTo(assigned);
  });

  readonly completedByLabel = computed(() => {
    const t = this.task();
    if (!t) return 'Sistema';
    if (t.intervenedBy) {
      return `${t.intervenedBy.name} (Manager)`;
    }
    if (t.completedBy) {
      return t.completedBy.name;
    }
    return t.assignedManager || 'Sistema';
  });

  readonly completedAtLabel = computed(() => {
    const t = this.task();
    if (!t?.completedAt && !t?.createdAt) return 'Hoy';
    const iso = t.completedAt || t.createdAt;
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) + ' ' +
        d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return iso;
    }
  });

  formatProposalChanges(prop: any): string {
    if (!prop?.proposedChanges) return 'Cambios generales en el campo';
    const entries = Object.entries(prop.proposedChanges);
    return entries.map(([k, v]) => `${k}: "${v}"`).join(', ');
  }

  handleTagClick(): void {
    const t = this.task();
    if (!t) return;

    if (this.hasPendingProposal()) {
      this.showProposalModal.set(true);
      return;
    }

    if (t.done) return;

    const actor = this.sessionService.actor();
    const isManager = actor.rank === 'manager' || this.sessionService.belongsTo(this.assignedManager());

    if (this.isOtherManagerAssigned()) {
      if (isManager) {
        this.showInterventionModal.set(true);
      } else {
        this.showStaffRestrictionToast.set(true);
        setTimeout(() => this.showStaffRestrictionToast.set(false), 4000);
      }
    }
  }

  confirmIntervention(): void {
    const t = this.task();
    if (!t) return;

    this.showInterventionModal.set(false);
    this.intervene.emit(t);
  }

  handleAcceptProposal(): void {
    const t = this.task();
    if (!t) return;
    this.showProposalModal.set(false);
    this.acceptProposal.emit(t);
  }

  handleRejectProposal(): void {
    const t = this.task();
    if (!t) return;
    this.showProposalModal.set(false);
    this.rejectProposal.emit(t);
  }
}
