import { Component, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventItem, EventTask, ProductionCategory } from '../../../../core/models/event.models';
import { OrgRank } from '../../../../core/models/org.models';
import { SessionService } from '../../../../core/services/session.service';
import { RoleService } from '../../../../core/services/role.service';
import { eventCompleteness, CompletenessItem } from '../../event-completeness';
import { resolveTasks, ResolvedTask, getTabForChecklistItem } from '../../event-tasks';
import { EventDetailTab } from '../event-detail-modal.component';

@Component({
  selector: 'app-event-tab-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { class: 'block pt-4' },
  template: `
    <div class="space-y-8">

      <!-- ─── HERO HEADER GLASSMORPHIC BANNER ─── -->
      <section class="relative overflow-hidden p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-amber-500/15 via-black/40 to-black/60 border border-amber-500/30 shadow-[0_0_50px_rgba(242,202,80,0.12)] backdrop-blur-3xl space-y-8">

        <!-- Halos brillantes de fondo -->
        <div class="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div class="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex items-start justify-between gap-6 flex-wrap">
          <div class="flex items-center gap-5 min-w-0 flex-1">
            <div class="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/10 shrink-0">
              <span class="material-symbols-outlined text-3xl">assignment_add</span>
            </div>
            <div class="space-y-1 min-w-0 flex-1">
              <div class="flex items-center gap-3 flex-wrap">
                <h4 class="font-['Epilogue'] font-black text-2xl sm:text-3xl text-on-surface tracking-tight leading-tight">
                  Matriz de Tareas y Responsabilidades
                </h4>
                @if (canSubmitForReview()) {
                  <span class="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 shadow-md animate-pulse">
                    <span class="material-symbols-outlined text-sm">check_circle</span> Listo para revisión
                  </span>
                }
              </div>
              <p class="text-xs text-outline leading-relaxed max-w-2xl">
                Asigna puntos verificables del expediente o tareas externas a tus disqueras co-organizadoras y delega la ejecución interna a su equipo de administradores y staff.
              </p>
            </div>
          </div>

          <!-- BOTONES PRINCIPALES DE ENCARGO / CREACIÓN -->
          <div class="flex items-center gap-3 flex-wrap shrink-0">
            <!-- Botón 1: Encargar Punto del Expediente -->
            <button
              type="button"
              (click)="openAssignSystemModal()"
              class="px-5 py-3 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 font-bold text-xs transition-all shadow-lg hover:shadow-sky-500/20 backdrop-blur-md flex items-center gap-2.5 active:scale-95"
            >
              <span class="material-symbols-outlined text-lg">verified</span>
              <span>Encargar Punto del Expediente</span>
            </button>

            <!-- Botón 2: Crear Tarea Externa -->
            <button
              type="button"
              (click)="openCreateExternalModal()"
              class="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs transition-all shadow-[0_0_25px_rgba(242,202,80,0.35)] hover:scale-[1.02] active:scale-95 flex items-center gap-2.5"
            >
              <span class="material-symbols-outlined text-lg">add_task</span>
              <span>Nueva Tarea Externa</span>
            </button>
          </div>
        </div>

        <!-- 4 KPI CARDS RESPLANDECIONTES (GLASSMORPHISM) -->
        <div class="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pt-2">
          <!-- KPI 1: Bloqueantes -->
          <div class="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg backdrop-blur-2xl hover:bg-white/[0.06] hover:border-rose-500/30 transition-all duration-300 flex flex-col justify-between space-y-3 group">
            <div class="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-rose-500/15 blur-2xl group-hover:bg-rose-500/25 transition-colors"></div>
            <div class="relative z-10 flex items-center justify-between">
              <span class="text-[11px] font-black uppercase tracking-widest text-rose-300/90">Bloqueantes</span>
              <div class="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-base">warning</span>
              </div>
            </div>
            <div class="relative z-10">
              <div class="text-3xl sm:text-4xl font-black font-mono text-rose-400 tracking-tight leading-none">
                {{ blockingPendingCount() }}
              </div>
              <span class="text-[11px] font-medium text-outline block mt-2">Impiden enviar a revisión</span>
            </div>
          </div>

          <!-- KPI 2: De mi Disquera -->
          <div class="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg backdrop-blur-2xl hover:bg-white/[0.06] hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between space-y-3 group">
            <div class="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-amber-500/15 blur-2xl group-hover:bg-amber-500/25 transition-colors"></div>
            <div class="relative z-10 flex items-center justify-between">
              <span class="text-[11px] font-black uppercase tracking-widest text-amber-300/90">Mi Disquera</span>
              <div class="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-base">business</span>
              </div>
            </div>
            <div class="relative z-10">
              <div class="text-3xl sm:text-4xl font-black font-mono text-amber-300 tracking-tight leading-none">
                {{ myDisqueraTasksCount() }}
              </div>
              <span class="text-[11px] font-medium text-outline block mt-2">Encargadas a tu equipo</span>
            </div>
          </div>

          <!-- KPI 3: Delegadas a Staff -->
          <div class="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg backdrop-blur-2xl hover:bg-white/[0.06] hover:border-violet-500/30 transition-all duration-300 flex flex-col justify-between space-y-3 group">
            <div class="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-violet-500/15 blur-2xl group-hover:bg-violet-500/25 transition-colors"></div>
            <div class="relative z-10 flex items-center justify-between">
              <span class="text-[11px] font-black uppercase tracking-widest text-violet-300/90">Delegadas</span>
              <div class="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-base">engineering</span>
              </div>
            </div>
            <div class="relative z-10">
              <div class="text-3xl sm:text-4xl font-black font-mono text-violet-300 tracking-tight leading-none">
                {{ delegatedCount() }}
              </div>
              <span class="text-[11px] font-medium text-outline block mt-2">Ejecución interna en curso</span>
            </div>
          </div>

          <!-- KPI 4: Completadas -->
          <div class="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg backdrop-blur-2xl hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between space-y-3 group">
            <div class="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-emerald-500/15 blur-2xl group-hover:bg-emerald-500/25 transition-colors"></div>
            <div class="relative z-10 flex items-center justify-between">
              <span class="text-[11px] font-black uppercase tracking-widest text-emerald-300/90">Completadas</span>
              <div class="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-base">check_circle</span>
              </div>
            </div>
            <div class="relative z-10">
              <div class="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-tight leading-none">
                {{ completedCount() }}
              </div>
              <span class="text-[11px] font-medium text-outline block mt-2">Verificadas y cerradas</span>
            </div>
          </div>
        </div>

      </section>

      <!-- ─── BARRA DE FILTROS & BÚSQUEDA ─── -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-2xl shadow-xl">

        <!-- Filter Chips -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          @for (f of filterOptions; track f.value) {
            <button
              type="button"
              (click)="activeFilter.set(f.value)"
              [class]="activeFilter() === f.value ? 'bg-amber-400 text-black font-black shadow-md shadow-amber-400/20' : 'bg-white/5 border border-white/10 text-on-surface-variant hover:text-on-surface hover:bg-white/10'"
              class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
            >
              {{ f.label }}
            </button>
          }
        </div>

        <!-- Búsqueda rápida por texto -->
        <div class="relative min-w-[240px]">
          <span class="material-symbols-outlined absolute left-3.5 top-3 text-outline text-base">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Buscar tarea..."
            class="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-amber-400 backdrop-blur-md"
          />
        </div>

      </div>

      <!-- ─── LISTADO DE TARJETAS DE TAREAS ─── -->
      <div class="space-y-4">
        @for (t of filteredTasks(); track t.id) {
          <div
            class="relative overflow-hidden p-6 sm:p-7 rounded-[2rem] bg-black/20 border border-white/10 hover:border-white/20 transition-all duration-300 space-y-4 shadow-xl backdrop-blur-3xl group hover:shadow-[0_10px_40px_rgba(0,0,0,0.6)] hover:bg-white/5"
          >
            <!-- Franja vertical de grupo -->
            <span [class]="getGroupStripeClass(t)" class="absolute left-0 top-0 bottom-0 w-2.5 shadow-[0_0_15px_currentColor]"></span>

            <!-- Encabezado de la tarjeta -->
            <div class="flex items-start justify-between gap-5 flex-wrap pl-3">

              <div class="space-y-2 min-w-0 flex-1">

                <div class="flex items-center gap-2.5 flex-wrap">
                  <!-- Distintivo Sistema vs Externa -->
                  @if (t.kind === 'sistema') {
                    <span class="px-3.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <span class="material-symbols-outlined text-xs">verified</span> Punto del Expediente (Sistema)
                    </span>
                  } @else {
                    <span class="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <span class="material-symbols-outlined text-xs">handyman</span> Tarea Externa (Declarada)
                    </span>
                  }

                  <!-- Distintivo Bloqueante -->
                  @if (t.blocking && !t.done) {
                    <span class="px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                      <span class="material-symbols-outlined text-xs">block</span> Bloquea revisión
                    </span>
                  }

                  <!-- Estado Pill -->
                  <span [class]="getStatusBadgeClass(t.status)" class="px-3.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider">
                    {{ getStatusLabel(t.status) }}
                  </span>
                </div>

                <h5 class="text-lg sm:text-xl font-bold text-on-surface leading-tight pt-1 group-hover:text-amber-300 transition-colors">
                  {{ t.title }}
                </h5>
                @if (t.detail) {
                  <p class="text-xs text-outline leading-relaxed max-w-3xl">{{ t.detail }}</p>
                }
              </div>

              <!-- Bloque Visual de Responsabilidad de Disquera y Miembro -->
              <div class="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 shrink-0 min-w-[230px] text-right shadow-inner">
                <span class="text-[10px] font-black uppercase tracking-widest text-outline block">Responsables</span>

                <!-- Manager / Disquera Asignada -->
                <div class="flex items-center justify-end gap-2 text-xs font-bold text-amber-300">
                  <span class="material-symbols-outlined text-base">business</span>
                  <span>{{ t.assignedManager || 'Sin encargar a disquera' }}</span>
                </div>

                <!-- Miembro Interno Delegado -->
                @if (t.delegate) {
                  <div class="flex items-center justify-end gap-2 text-xs text-violet-300 font-semibold pt-1.5 border-t border-white/10">
                    <span class="material-symbols-outlined text-sm">badge</span>
                    <span>{{ t.delegate.name }} ({{ t.delegate.rank }})</span>
                  </div>
                } @else if (t.assignedManager) {
                  <span class="text-[10px] text-outline italic block pt-0.5">Sin delegar a staff</span>
                }
              </div>

            </div>

            <!-- Fila Inferior de Acciones Elevadas -->
            <div class="flex items-center justify-between gap-4 pt-3.5 border-t border-white/10 flex-wrap pl-3">

              <!-- Auditoría corta -->
              <div class="text-[11px] text-outline font-mono flex items-center gap-2">
                @if (t.completedBy) {
                  <span class="text-emerald-300 font-semibold flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">check_circle</span>
                    Completada por {{ t.completedBy.name }} ({{ t.completedBy.rank }})
                  </span>
                } @else if (t.assignedAt) {
                  <span>Asignada el {{ t.assignedAt }}</span>
                } @else {
                  <span>Disponible para encargo</span>
                }
              </div>

              <!-- Botones de Acción -->
              <div class="flex items-center gap-2.5 flex-wrap">

                <!-- Accion 1: IR AL DATO / RESOLVER EN EXPEDIENTE (para tareas de sistema) -->
                @if (t.checklistItemId) {
                  <button
                    type="button"
                    (click)="goToData(t.checklistItemId)"
                    class="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-black font-black text-xs transition-all shadow-md shadow-sky-500/20 flex items-center gap-2 active:scale-95 hover:scale-105"
                  >
                    <span class="material-symbols-outlined text-base">open_in_new</span>
                    <span>Resolver en Expediente</span>
                  </button>
                }

                <!-- Accion 2: ASIGNAR DISQUERA (Para Sistema y Externas) -->
                @if (!t.done && isOrganizer()) {
                  <button
                    type="button"
                    (click)="openAssignModal(t)"
                    class="px-4 py-2.5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold text-xs border border-white/10 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <span class="material-symbols-outlined text-base text-amber-300">person_add</span>
                    <span>{{ t.assignedManager ? 'Reasignar Disquera' : 'Asignar Disquera' }}</span>
                  </button>
                }

                <!-- Accion 3: DELEGAR A MIEMBRO INTERNO (Si pertenece a la disquera asignada) -->
                @if (!t.done && t.assignedManager && sessionService.canDelegateFor(t.assignedManager)) {
                  <button
                    type="button"
                    (click)="openDelegateModal(t)"
                    class="px-4 py-2.5 rounded-xl bg-violet-500/20 hover:bg-violet-500 text-violet-300 hover:text-black font-bold text-xs border border-violet-500/40 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <span class="material-symbols-outlined text-base">engineering</span>
                    <span>{{ t.delegate ? 'Cambiar Delegado' : 'Delegar a Staff' }}</span>
                  </button>
                }

                <!-- Accion 4: MARCAR COMPLETADA (Para Tareas Externas) -->
                @if (t.kind === 'externa' && !t.done && canCompleteExternal(t)) {
                  <button
                    type="button"
                    (click)="openCompleteModal(t)"
                    class="px-4.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95 hover:scale-105"
                  >
                    <span class="material-symbols-outlined text-base">check</span>
                    <span>Marcar completada</span>
                  </button>
                }

              </div>

            </div>

          </div>
        } @empty {
          <div class="p-14 text-center rounded-3xl bg-surface-container-high/40 border border-white/5 space-y-3">
            <span class="material-symbols-outlined text-4xl text-outline">checklist</span>
            <p class="text-sm font-bold text-on-surface">No se encontraron tareas con estos filtros.</p>
          </div>
        }
      </div>

      <!-- ─── MODAL 1: ENCARGAR PUNTO DEL EXPEDIENTE (SISTEMA) ─── -->
      @if (assignSystemModalOpen()) {
        <div class="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div class="w-full max-w-xl bg-white/5 border border-white/10 rounded-[2rem] p-7 sm:p-8 space-y-6 shadow-[0_0_80px_rgba(56,189,248,0.2)] animate-scale-up backdrop-blur-3xl relative overflow-hidden">

            <!-- Halo ambiental superior -->
            <div class="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>

            <!-- Modal Header -->
            <div class="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-300 flex items-center justify-center shadow-xl shrink-0">
                  <span class="material-symbols-outlined text-3xl">verified</span>
                </div>
                <div>
                  <h4 class="font-['Epilogue'] font-black text-xl text-on-surface tracking-tight">
                    Encargar Punto del Expediente
                  </h4>
                  <p class="text-xs text-outline">Asigna la captura de información del evento a una disquera y su staff</p>
                </div>
              </div>
              <button (click)="assignSystemModalOpen.set(false)" class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-outline hover:text-on-surface transition-all flex items-center justify-center">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <!-- Form Body -->
            <div class="space-y-5 text-xs">

              <!-- Selector de Punto del Expediente -->
              <div class="space-y-2">
                <label class="block font-black uppercase text-[10px] tracking-widest text-sky-300 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">checklist</span> Selecciona el Punto del Expediente *
                </label>
                <select
                  [(ngModel)]="selectedChecklistItemId"
                  (ngModelChange)="onSystemItemSelect($event)"
                  class="w-full bg-black/40 border border-white/10 text-on-surface rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-sky-400 focus:bg-white/5 shadow-inner transition-all backdrop-blur-md"
                >
                  <option value="" disabled>-- Elige un punto del expediente --</option>
                  @for (item of checklistOptions(); track item.id) {
                    <option [value]="item.id">
                      [{{ item.group }}] {{ item.label }} {{ item.done ? '✓ (Ya capturado)' : '• (Pendiente)' }}
                    </option>
                  }
                </select>
                @if (selectedSystemItem()) {
                  <div class="p-3.5 rounded-2xl bg-black/40 border border-sky-500/20 space-y-1">
                    <span class="text-[10px] font-black uppercase tracking-wider text-sky-300 block">Especificaciones del punto</span>
                    <p class="text-xs text-on-surface leading-relaxed">
                      💡 {{ selectedSystemItem()?.hint }}
                    </p>
                  </div>
                }
              </div>

              <!-- Selector de Disquera Responsable -->
              <div class="space-y-2">
                <label class="block font-black uppercase text-[10px] tracking-widest text-amber-300 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">business</span> Disquera Encargada *
                </label>
                <select
                  [(ngModel)]="selectedSystemManager"
                  (ngModelChange)="onSystemManagerSelect($event)"
                  class="w-full bg-black/40 border border-white/10 text-on-surface rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-amber-400 focus:bg-white/5 shadow-inner transition-all backdrop-blur-md"
                >
                  @for (m of managerList(); track m) {
                    <option [value]="m">{{ m }}</option>
                  }
                </select>
              </div>

              <!-- Selector de Miembro Interno Delegado (Solo para la disquera propia) -->
              @if (isOwnSystemManager()) {
                <div class="space-y-2">
                  <label class="block font-black uppercase text-[10px] tracking-widest text-violet-300 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">badge</span> Delegar Ejecución Interna (Staff / Admin de tu disquera)
                  </label>
                  <select
                    [(ngModel)]="selectedSystemDelegateId"
                    class="w-full bg-black/40 border border-white/10 text-on-surface rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-violet-400 focus:bg-white/5 shadow-inner transition-all backdrop-blur-md"
                  >
                    <option value="">Sin delegar (Queda a tu cargo general)</option>
                    @for (mem of availableSystemOrgMembers(); track mem.id) {
                      <option [value]="mem.id">{{ mem.name }} ({{ mem.rank }})</option>
                    }
                  </select>
                </div>
              } @else if (selectedSystemManager) {
                <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 backdrop-blur-md">
                  <span class="material-symbols-outlined text-base text-amber-400 shrink-0 mt-0.5">info</span>
                  <span class="leading-relaxed">
                    Al encargar a <strong class="text-on-surface">{{ selectedSystemManager }}</strong>, solo el manager de esa disquera podrá delegar internamente el trabajo a su equipo de administradores o staff.
                  </span>
                </div>
              }

            </div>

            <!-- Modal Footer Actions -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                (click)="assignSystemModalOpen.set(false)"
                class="px-6 py-3 rounded-2xl text-xs font-bold text-outline hover:text-on-surface hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="submitAssignSystemTask()"
                [disabled]="!selectedChecklistItemId || !selectedSystemManager"
                class="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-400 hover:from-sky-300 hover:to-cyan-300 disabled:opacity-40 text-black font-black text-xs shadow-xl shadow-sky-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-lg">check</span>
                <span>Guardar Encargo del Expediente</span>
              </button>
            </div>

          </div>
        </div>
      }

      <!-- ─── MODAL 2: CREAR TAREA EXTERNA ─── -->
      @if (createModalOpen()) {
        <div class="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div class="w-full max-w-lg bg-white/5 border border-white/10 rounded-[2rem] p-7 sm:p-8 space-y-6 shadow-[0_0_80px_rgba(242,202,80,0.2)] animate-scale-up backdrop-blur-3xl relative overflow-hidden">

            <!-- Halo ambiental superior -->
            <div class="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

            <!-- Modal Header -->
            <div class="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-xl shrink-0">
                  <span class="material-symbols-outlined text-3xl">add_task</span>
                </div>
                <div>
                  <h4 class="font-['Epilogue'] font-black text-xl text-on-surface tracking-tight">
                    Nueva Tarea Externa
                  </h4>
                  <p class="text-xs text-outline">Crea una tarea manual fuera del flujo automático del expediente</p>
                </div>
              </div>
              <button (click)="createModalOpen.set(false)" class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-outline hover:text-on-surface transition-all flex items-center justify-center">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div class="space-y-4 text-xs">
              <div class="space-y-2">
                <label class="block font-black uppercase text-[10px] tracking-widest text-amber-300 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">edit</span> Título de la Tarea *
                </label>
                <input
                  type="text"
                  [(ngModel)]="newTitle"
                  placeholder="Ej: Rentar 40 mesas redondas y 300 sillas"
                  class="w-full bg-black/40 border border-white/10 text-on-surface rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-amber-400 focus:bg-white/5 shadow-inner transition-all backdrop-blur-md"
                />
              </div>

              <div class="space-y-2">
                <label class="block font-black uppercase text-[10px] tracking-widest text-outline">Especificaciones / Detalles</label>
                <textarea
                  [(ngModel)]="newDetail"
                  rows="2.5"
                  placeholder="Detalles de proveedores, fechas de entrega, colores..."
                  class="w-full bg-black/40 border border-white/10 text-on-surface rounded-2xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-amber-400 focus:bg-white/5 shadow-inner transition-all backdrop-blur-md"
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="block font-black uppercase text-[10px] tracking-widest text-amber-300">Disquera Responsable</label>
                  <select
                    [(ngModel)]="newAssignedManager"
                    class="w-full bg-black/40 border border-white/10 text-on-surface rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-amber-400 focus:bg-white/5 backdrop-blur-md"
                  >
                    @for (m of managerList(); track m) {
                      <option [value]="m">{{ m }}</option>
                    }
                  </select>
                </div>

                <div class="space-y-2">
                  <label class="block font-black uppercase text-[10px] tracking-widest text-outline">Prioridad</label>
                  <select
                    [(ngModel)]="newPriority"
                    class="w-full bg-black/40 border border-white/10 text-on-surface rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-amber-400 focus:bg-white/5 backdrop-blur-md"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <!-- Bloque Opcional de Producción -->
              <div class="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <label class="flex items-center gap-3 font-bold text-amber-300 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="linkProduction" class="rounded text-amber-400 w-4 h-4" />
                  Vincular a presupuesto de Producción
                </label>

                @if (linkProduction) {
                  <div class="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label class="block text-[10px] font-black uppercase tracking-wider text-outline mb-1">Rubro de Producción</label>
                      <select
                        [(ngModel)]="prodCategory"
                        class="w-full bg-black/40 border border-white/10 text-on-surface rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 focus:bg-white/5 backdrop-blur-md"
                      >
                        @for (cat of prodCategories; track cat) {
                          <option [value]="cat">{{ cat }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] font-black uppercase tracking-wider text-outline mb-1">Costo Estimado ($)</label>
                      <input
                        type="number"
                        [(ngModel)]="estimatedCost"
                        placeholder="18000"
                        class="w-full bg-black/40 border border-white/10 text-on-surface rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400 focus:bg-white/5 backdrop-blur-md"
                      />
                    </div>
                  </div>
                }
              </div>

            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                (click)="createModalOpen.set(false)"
                class="px-6 py-3 rounded-2xl text-xs font-bold text-outline hover:text-on-surface hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="submitCreateExternalTask()"
                [disabled]="!newTitle.trim()"
                class="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 disabled:opacity-40 text-black font-black text-xs shadow-xl shadow-amber-400/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-lg">check</span>
                <span>Guardar Tarea Externa</span>
              </button>
            </div>

          </div>
        </div>
      }

      <!-- ─── MODAL 3: COMPLETAR TAREA EXTERNA ─── -->
      @if (completeModalTask()) {
        <div class="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div class="w-full max-w-md bg-white/5 border border-white/10 rounded-[2rem] p-7 sm:p-8 space-y-6 shadow-[0_0_80px_rgba(16,185,129,0.2)] animate-scale-up backdrop-blur-3xl relative overflow-hidden">

            <div class="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-xl shrink-0">
                  <span class="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <div>
                  <h4 class="font-['Epilogue'] font-black text-xl text-on-surface tracking-tight">
                    Marcar Tarea Completada
                  </h4>
                  <p class="text-xs text-outline">Registra la nota de cierre y costo final real</p>
                </div>
              </div>
              <button (click)="completeModalTask.set(null)" class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-outline hover:text-on-surface transition-all flex items-center justify-center">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div class="space-y-4 text-xs">
              <div class="p-4 rounded-2xl bg-black/40 border border-white/10">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline block mb-1">Tarea a cerrar</span>
                <p class="text-on-surface font-bold text-sm leading-snug">
                  {{ completeModalTask()?.title }}
                </p>
              </div>

              <div class="space-y-2">
                <label class="block font-black uppercase text-[10px] tracking-widest text-emerald-300 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm">notes</span> Nota de Cierre Obligatoria *
                </label>
                <textarea
                  [(ngModel)]="completionNote"
                  rows="3"
                  placeholder="Detalla cómo se completó (ej: Contrato firmado con Proveedor X, folios #1234...)"
                  class="w-full bg-black/40 border border-white/10 text-on-surface rounded-2xl px-4.5 py-3 text-xs font-medium focus:outline-none focus:border-emerald-400 focus:bg-white/5 shadow-inner transition-all backdrop-blur-md"
                ></textarea>
              </div>

              @if (completeModalTask()?.productionItemId) {
                <div class="space-y-2">
                  <label class="block font-black uppercase text-[10px] tracking-widest text-amber-300 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">attach_money</span> Costo Final Real ($)
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="finalCost"
                    placeholder="16500"
                    class="w-full bg-black/40 border border-white/10 text-on-surface rounded-2xl px-4.5 py-3 text-xs font-mono focus:outline-none focus:border-emerald-400 focus:bg-white/5 shadow-inner transition-all backdrop-blur-md"
                  />
                  <span class="text-[10px] text-outline block pt-0.5">
                    Actualizará la partida en Producción a 'Contratado' con este monto definitivo.
                  </span>
                </div>
              }
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                (click)="completeModalTask.set(null)"
                class="px-6 py-3 rounded-2xl text-xs font-bold text-outline hover:text-on-surface hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="submitCompleteTask()"
                [disabled]="!completionNote.trim()"
                class="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-40 text-black font-black text-xs shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-lg">check</span>
                <span>Confirmar Cierre</span>
              </button>
            </div>

          </div>
        </div>
      }

      <!-- ─── MODAL 4: ASIGNAR DISQUERA ─── -->
      @if (assignModalTask()) {
        <div class="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div class="w-full max-w-sm bg-white/5 border border-white/10 rounded-[2rem] p-7 space-y-6 shadow-[0_0_80px_rgba(99,102,241,0.2)] animate-scale-up backdrop-blur-3xl relative overflow-hidden">
            <div class="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
            <h4 class="font-['Epilogue'] font-black text-lg text-on-surface flex items-center gap-2.5">
              <span class="material-symbols-outlined text-indigo-400 text-2xl">business</span>
              Asignar Disquera Responsable
            </h4>
            <p class="text-xs text-outline leading-relaxed">
              Selecciona cuál disquera co-organizadora responderá por la tarea:
            </p>
            <select
              [(ngModel)]="selectedAssignManager"
              class="w-full bg-black/40 border border-white/10 text-on-surface rounded-2xl px-4.5 py-3.5 text-xs font-bold focus:outline-none focus:border-indigo-400 focus:bg-white/5 shadow-inner backdrop-blur-md transition-all"
            >
              @for (m of managerList(); track m) {
                <option [value]="m">{{ m }}</option>
              }
            </select>
            <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button (click)="assignModalTask.set(null)" class="px-5 py-2.5 text-xs text-outline font-bold hover:text-on-surface">Cancelar</button>
              <button (click)="submitAssignTask()" class="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-400 hover:from-indigo-400 hover:to-indigo-300 text-black font-black text-xs rounded-2xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95">
                Guardar Disquera
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ─── MODAL 5: DELEGAR A MIEMBRO INTERNO ─── -->
      @if (delegateModalTask()) {
        <div class="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div class="w-full max-w-sm bg-white/5 border border-white/10 rounded-[2rem] p-7 space-y-6 shadow-[0_0_80px_rgba(139,92,246,0.2)] animate-scale-up backdrop-blur-3xl relative overflow-hidden">
            <div class="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none"></div>
            <h4 class="font-['Epilogue'] font-black text-lg text-on-surface flex items-center gap-2.5">
              <span class="material-symbols-outlined text-violet-400 text-2xl">badge</span>
              Delegar Ejecución Interna
            </h4>
            <p class="text-xs text-outline leading-relaxed">
              Selecciona un miembro de la plantilla de <strong>{{ delegateModalTask()?.assignedManager }}</strong>:
            </p>
            <select
              [(ngModel)]="selectedDelegateId"
              class="w-full bg-black/40 border border-white/10 text-on-surface rounded-2xl px-4.5 py-3.5 text-xs font-bold focus:outline-none focus:border-violet-400 focus:bg-white/5 shadow-inner backdrop-blur-md transition-all"
            >
              @for (mem of availableOrgMembers(); track mem.id) {
                <option [value]="mem.id">{{ mem.name }} ({{ mem.rank }})</option>
              }
            </select>
            <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button (click)="delegateModalTask.set(null)" class="px-5 py-2.5 text-xs text-outline font-bold hover:text-on-surface">Cancelar</button>
              <button (click)="submitDelegateTask()" class="px-6 py-3 bg-gradient-to-r from-violet-500 to-violet-400 hover:from-violet-400 hover:to-violet-300 text-black font-black text-xs rounded-2xl shadow-lg shadow-violet-500/30 transition-all hover:scale-105 active:scale-95">
                Delegar a Staff
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class EventTabTasksComponent {
  event = input.required<EventItem>();
  navigateTab = output<EventDetailTab>();
  patch = output<Partial<EventItem>>();

  sessionService = inject(SessionService);
  roleService = inject(RoleService);

  activeFilter = signal<string>('todas');
  searchQuery = '';

  // Modals Signals
  assignSystemModalOpen = signal(false);
  createModalOpen = signal(false);
  completeModalTask = signal<ResolvedTask | null>(null);
  assignModalTask = signal<ResolvedTask | null>(null);
  delegateModalTask = signal<ResolvedTask | null>(null);

  // Form State - Assign System Task
  selectedChecklistItemId = '';
  selectedSystemManager = '';
  selectedSystemDelegateId = '';

  // Form State - Create External Task
  newTitle = '';
  newDetail = '';
  newAssignedManager = '';
  newPriority: 'Alta' | 'Media' | 'Baja' = 'Media';
  linkProduction = false;
  prodCategory: ProductionCategory = 'Mobiliario';
  estimatedCost?: number;

  // Form State - Complete Task
  completionNote = '';
  finalCost?: number;

  // Form State - Assign / Delegate Task
  selectedAssignManager = '';
  selectedDelegateId = '';

  readonly filterOptions = [
    { value: 'todas', label: 'Todas' },
    { value: 'mias', label: 'Mías / Mi equipo' },
    { value: 'disquera', label: 'De mi disquera' },
    { value: 'unassigned', label: 'Sin encargar' },
    { value: 'blocking', label: 'Bloqueantes' },
    { value: 'sistema', label: 'Del Expediente' },
    { value: 'externas', label: 'Externas' },
    { value: 'completadas', label: 'Completadas' }
  ];

  readonly prodCategories: ProductionCategory[] = [
    'Recinto', 'Audio', 'Iluminación', 'Video y Pantallas', 'Escenario y Estructuras',
    'Energía', 'Backline', 'Mobiliario', 'Personal y Staff', 'Seguridad',
    'Servicios Médicos', 'Permisos y Licencias', 'Seguros', 'Limpieza y Sanitarios',
    'Transporte y Logística', 'Hospitalidad', 'Hospedaje'
  ];

  resolvedTasks = computed(() => resolveTasks(this.event()));

  blockingPendingCount = computed(() => this.resolvedTasks().filter(t => t.blocking && !t.done).length);
  myDisqueraTasksCount = computed(() => {
    const myManager = this.sessionService.actor().managerName;
    return this.resolvedTasks().filter(t => t.assignedManager === myManager).length;
  });
  delegatedCount = computed(() => this.resolvedTasks().filter(t => !!t.delegate && !t.done).length);
  completedCount = computed(() => this.resolvedTasks().filter(t => t.done).length);

  canSubmitForReview = computed(() => {
    const report = eventCompleteness(this.event());
    return report.canSubmitForReview;
  });

  checklistOptions = computed(() => {
    const report = eventCompleteness(this.event());
    return report.items;
  });

  selectedSystemItem = computed(() => {
    const id = this.selectedChecklistItemId;
    if (!id) return null;
    return this.checklistOptions().find(i => i.id === id) || null;
  });

  managerList = computed(() => {
    const e = this.event();
    const set = new Set<string>();
    const owner = e.ownerManagerName || e.createdBy;
    if (owner) set.add(owner);
    for (const a of e.managerAgreements || []) {
      if (a.managerName) set.add(a.managerName);
    }
    for (const s of e.lineup || []) {
      if (s.managerName) set.add(s.managerName);
    }
    return Array.from(set);
  });

  availableOrgMembers = computed(() => {
    const task = this.delegateModalTask();
    if (!task?.assignedManager) return [];
    return this.sessionService.membersOf(task.assignedManager);
  });

  availableSystemOrgMembers = computed(() => {
    const managerName = this.selectedSystemManager;
    if (!managerName || !this.sessionService.canDelegateFor(managerName)) return [];
    return this.sessionService.membersOf(managerName);
  });

  isOwnSystemManager = computed(() => {
    const managerName = this.selectedSystemManager;
    if (!managerName) return false;
    return this.sessionService.canDelegateFor(managerName);
  });

  filteredTasks = computed(() => {
    const filter = this.activeFilter();
    const query = (this.searchQuery || '').toLowerCase().trim();
    const actor = this.sessionService.actor();
    let list = this.resolvedTasks();

    if (query) {
      list = list.filter(t => t.title.toLowerCase().includes(query) || (t.detail && t.detail.toLowerCase().includes(query)));
    }

    switch (filter) {
      case 'mias':
        return list.filter(t => t.delegate?.name === actor.name || (t.assignedManager === actor.managerName && !t.delegate));
      case 'disquera':
        return list.filter(t => t.assignedManager === actor.managerName);
      case 'unassigned':
        return list.filter(t => !t.assignedManager && !t.done);
      case 'blocking':
        return list.filter(t => t.blocking && !t.done);
      case 'sistema':
        return list.filter(t => t.kind === 'sistema');
      case 'externas':
        return list.filter(t => t.kind === 'externa');
      case 'completadas':
        return list.filter(t => t.done);
      default:
        // Oculta completadas por defecto en 'todas' si no se buscan explícitamente
        return list.filter(t => !t.done);
    }
  });

  isOrganizer(): boolean {
    const e = this.event();
    const owner = e.ownerManagerName || e.createdBy;
    return this.sessionService.belongsTo(owner);
  }

  canCompleteExternal(task: ResolvedTask): boolean {
    if (task.kind !== 'externa') return false;
    const actor = this.sessionService.actor();
    if (this.isOrganizer()) return true;
    if (task.assignedManager && actor.managerName === task.assignedManager) return true;
    return false;
  }

  goToData(checklistItemId?: string): void {
    if (!checklistItemId) return;
    const targetTab = getTabForChecklistItem(checklistItemId);
    this.navigateTab.emit(targetTab);
  }

  getGroupStripeClass(t: ResolvedTask): string {
    if (t.kind === 'externa') return 'bg-amber-400 text-amber-400';
    switch (t.group) {
      case 'Identidad': return 'bg-amber-400 text-amber-400';
      case 'Cartelera Pública': return 'bg-sky-400 text-sky-400';
      case 'Cartel': return 'bg-indigo-400 text-indigo-400';
      case 'Producción': return 'bg-violet-400 text-violet-400';
      case 'Boletaje': return 'bg-cyan-400 text-cyan-400';
      default: return 'bg-slate-400 text-slate-400';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'abierta': return 'bg-surface-container text-outline border-white/10';
      case 'sin-enviar': return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'asignada': return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'aceptada': return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'completada': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      default: return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'abierta': return 'Abierta';
      case 'sin-enviar': return 'Sin Enviar (Borrador)';
      case 'asignada': return 'Asignada';
      case 'aceptada': return 'Aceptada';
      case 'completada': return 'Completada';
      default: return status;
    }
  }

  // ─── HANDLERS: ENCARGAR PUNTO DEL EXPEDIENTE (SISTEMA) ──────────────────────

  openAssignSystemModal(): void {
    const items = this.checklistOptions();
    this.selectedChecklistItemId = items[0]?.id || '';
    const managers = this.managerList();
    this.selectedSystemManager = managers[0] || this.sessionService.actor().managerName;
    this.selectedSystemDelegateId = '';
    this.assignSystemModalOpen.set(true);
  }

  onSystemItemSelect(itemId: string): void {
    const existing = (this.event().tasks || []).find(t => t.checklistItemId === itemId);
    if (existing?.assignedManager) {
      this.selectedSystemManager = existing.assignedManager;
      this.selectedSystemDelegateId = '';
    }
  }

  onSystemManagerSelect(managerName: string): void {
    this.selectedSystemDelegateId = '';
  }

  submitAssignSystemTask(): void {
    const itemId = this.selectedChecklistItemId;
    const manager = this.selectedSystemManager;
    if (!itemId || !manager) return;

    const item = this.checklistOptions().find(i => i.id === itemId);
    if (!item) return;

    const isDraft = this.event().state === 'Borrador';
    const now = new Date().toISOString().slice(0, 16);

    let delegateObj: { name: string; rank: OrgRank } | undefined = undefined;
    if (this.selectedSystemDelegateId && this.isOwnSystemManager()) {
      const members = this.availableSystemOrgMembers();
      const mem = members.find(m => m.id === this.selectedSystemDelegateId);
      if (mem) {
        delegateObj = { name: mem.name, rank: mem.rank };
      }
    }

    let found = false;
    const updatedTasks = (this.event().tasks || []).map(t => {
      if (t.checklistItemId === itemId) {
        found = true;
        return {
          ...t,
          assignedManager: manager,
          delegate: delegateObj || t.delegate,
          status: isDraft ? ('sin-enviar' as const) : ('asignada' as const),
          assignedAt: isDraft ? undefined : now
        };
      }
      return t;
    });

    if (!found) {
      updatedTasks.push({
        id: `task-${itemId}-${Date.now()}`,
        kind: 'sistema',
        title: item.label,
        detail: item.hint,
        group: item.group,
        checklistItemId: itemId,
        assignedManager: manager,
        delegate: delegateObj,
        status: isDraft ? 'sin-enviar' : 'asignada',
        priority: item.required ? 'Alta' : 'Media',
        createdBy: this.sessionService.actor(),
        createdAt: now,
        assignedAt: isDraft ? undefined : now
      });
    }

    this.patch.emit({ tasks: updatedTasks });
    this.assignSystemModalOpen.set(false);
  }

  // ─── HANDLERS: CREAR TAREA EXTERNA ─────────────────────────────────────────

  openCreateExternalModal(): void {
    this.newTitle = '';
    this.newDetail = '';
    const managers = this.managerList();
    this.newAssignedManager = managers[0] || this.sessionService.actor().managerName;
    this.newPriority = 'Media';
    this.linkProduction = false;
    this.prodCategory = 'Mobiliario';
    this.estimatedCost = undefined;
    this.createModalOpen.set(true);
  }

  submitCreateExternalTask(): void {
    if (!this.newTitle.trim()) return;

    const actor = this.sessionService.actor();
    const isDraft = this.event().state === 'Borrador';

    const taskId = `task-ext-${Date.now()}`;
    const newTask: EventTask = {
      id: taskId,
      kind: 'externa',
      title: this.newTitle.trim(),
      detail: this.newDetail.trim() || undefined,
      assignedManager: this.newAssignedManager,
      status: isDraft ? 'sin-enviar' : 'asignada',
      priority: this.newPriority,
      createdBy: actor,
      createdAt: new Date().toISOString().slice(0, 16),
      assignedAt: isDraft ? undefined : new Date().toISOString().slice(0, 16)
    };

    const currentTasks = [...(this.event().tasks || []), newTask];
    const updates: Partial<EventItem> = { tasks: currentTasks };

    if (this.linkProduction && this.estimatedCost) {
      const prodId = `prod-task-${Date.now()}`;
      newTask.productionItemId = prodId;
      newTask.productionCategory = this.prodCategory;
      newTask.estimatedCost = this.estimatedCost;

      const newProdItem = {
        id: prodId,
        category: this.prodCategory,
        concept: this.newTitle.trim(),
        assignedTo: this.newAssignedManager,
        amount: this.estimatedCost,
        status: 'Estimado' as const,
        notes: 'Generado desde tarea externa'
      };

      updates.productionItems = [...(this.event().productionItems || []), newProdItem];
    }

    this.patch.emit(updates);
    this.createModalOpen.set(false);
  }

  // ─── HANDLERS: COMPLETAR TAREA EXTERNA ────────────────────────────────────

  openCompleteModal(task: ResolvedTask): void {
    this.completeModalTask.set(task);
    this.completionNote = '';
    this.finalCost = task.estimatedCost;
  }

  submitCompleteTask(): void {
    const task = this.completeModalTask();
    if (!task || !this.completionNote.trim()) return;

    const actor = this.sessionService.actor();
    const now = new Date().toISOString().slice(0, 16);

    const updatedTasks = (this.event().tasks || []).map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          status: 'completada' as const,
          completedAt: now,
          completedBy: actor,
          completionNote: this.completionNote.trim(),
          finalCost: this.finalCost
        };
      }
      return t;
    });

    const updates: Partial<EventItem> = { tasks: updatedTasks };

    if (task.productionItemId && this.finalCost) {
      updates.productionItems = (this.event().productionItems || []).map(p => {
        if (p.id === task.productionItemId) {
          return {
            ...p,
            amount: this.finalCost!,
            status: 'Contratado' as const,
            notes: (p.notes || '') + ` | Completado: ${this.completionNote.trim()}`
          };
        }
        return p;
      });
    }

    this.patch.emit(updates);
    this.completeModalTask.set(null);
  }

  // ─── HANDLERS: ASIGNAR DISQUERA & DELEGAR STAFF ────────────────────────────

  openAssignModal(task: ResolvedTask): void {
    this.assignModalTask.set(task);
    this.selectedAssignManager = task.assignedManager || this.managerList()[0] || '';
  }

  submitAssignTask(): void {
    const task = this.assignModalTask();
    if (!task || !this.selectedAssignManager) return;

    const isDraft = this.event().state === 'Borrador';
    const now = new Date().toISOString().slice(0, 16);

    let found = false;
    const updatedTasks = (this.event().tasks || []).map(t => {
      if (t.id === task.id || (task.checklistItemId && t.checklistItemId === task.checklistItemId)) {
        found = true;
        return {
          ...t,
          assignedManager: this.selectedAssignManager,
          status: isDraft ? ('sin-enviar' as const) : ('asignada' as const),
          assignedAt: isDraft ? undefined : now
        };
      }
      return t;
    });

    if (!found && task.kind === 'sistema' && task.checklistItemId) {
      updatedTasks.push({
        id: `task-${task.checklistItemId}-${Date.now()}`,
        kind: 'sistema',
        title: task.title,
        detail: task.detail,
        group: task.group,
        checklistItemId: task.checklistItemId,
        assignedManager: this.selectedAssignManager,
        status: isDraft ? 'sin-enviar' : 'asignada',
        priority: task.priority,
        createdBy: this.sessionService.actor(),
        createdAt: now,
        assignedAt: isDraft ? undefined : now
      });
    }

    this.patch.emit({ tasks: updatedTasks });
    this.assignModalTask.set(null);
  }

  openDelegateModal(task: ResolvedTask): void {
    this.delegateModalTask.set(task);
    const members = this.availableOrgMembers();
    this.selectedDelegateId = members[0]?.id || '';
  }

  submitDelegateTask(): void {
    const task = this.delegateModalTask();
    if (!task || !this.selectedDelegateId) return;

    const members = this.availableOrgMembers();
    const member = members.find(m => m.id === this.selectedDelegateId);
    if (!member) return;

    let found = false;
    const updatedTasks = (this.event().tasks || []).map(t => {
      if (t.id === task.id || (task.checklistItemId && t.checklistItemId === task.checklistItemId)) {
        found = true;
        return {
          ...t,
          delegate: { name: member.name, rank: member.rank }
        };
      }
      return t;
    });

    if (!found && task.kind === 'sistema' && task.checklistItemId) {
      const now = new Date().toISOString().slice(0, 16);
      const isDraft = this.event().state === 'Borrador';
      updatedTasks.push({
        id: `task-${task.checklistItemId}-${Date.now()}`,
        kind: 'sistema',
        title: task.title,
        detail: task.detail,
        group: task.group,
        checklistItemId: task.checklistItemId,
        assignedManager: task.assignedManager || this.sessionService.actor().managerName,
        delegate: { name: member.name, rank: member.rank },
        status: isDraft ? 'sin-enviar' : 'asignada',
        priority: task.priority,
        createdBy: this.sessionService.actor(),
        createdAt: now,
        assignedAt: isDraft ? undefined : now
      });
    }

    this.patch.emit({ tasks: updatedTasks });
    this.delegateModalTask.set(null);
  }
}
