import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksOverviewKPIs } from '../task-metrics';

/**
 * Barra superior de KPIs del módulo de Tareas.
 *
 * Muestra:
 * 1. Total de Tareas Activas
 * 2. En Proceso / En Operación
 * 3. Tareas Urgentes
 * 4. Vencidas o por vencer hoy
 * 5. Tasa de Cumplimiento (%)
 */
@Component({
  selector: 'app-tasks-kpis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

      <!-- 1. TOTAL TAREAS -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-primary/30 shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Total de Tareas</span>
          <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg">
            task_alt
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-2xl font-black text-on-surface font-mono tracking-tight">{{ kpis()?.totalTasks || 0 }}</p>
          <p class="text-[11px] text-outline">{{ kpis()?.pendingCount || 0 }} pendientes por iniciar</p>
        </div>
      </div>

      <!-- 2. EN PROCESO & REVISIÓN -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-cyan-500/30 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-cyan-400 uppercase tracking-widest">En Operación</span>
          <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center material-symbols-outlined text-lg">
            engineering
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-2xl font-black text-cyan-300 font-mono tracking-tight">{{ (kpis()?.inProgressCount || 0) + (kpis()?.inReviewCount || 0) }}</p>
          <p class="text-[11px] text-cyan-200">{{ kpis()?.inReviewCount || 0 }} en revisión de encargado</p>
        </div>
      </div>

      <!-- 3. TAREAS URGENTES -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-rose-500/30 shadow-xl relative overflow-hidden group hover:border-rose-500/50 transition-all">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-rose-400 uppercase tracking-widest">Urgentes</span>
          <span class="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center material-symbols-outlined text-lg animate-pulse">
            priority_high
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-2xl font-black text-rose-300 font-mono tracking-tight">{{ kpis()?.urgentCount || 0 }}</p>
          <p class="text-[11px] text-rose-200">Atención inmediata requerida</p>
        </div>
      </div>

      <!-- 4. VENCIDAS & HOY -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-amber-500/30 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest">Vencimiento</span>
          <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center material-symbols-outlined text-lg">
            event_upcoming
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-2xl font-black text-amber-300 font-mono tracking-tight">{{ (kpis()?.overdueCount || 0) + (kpis()?.dueTodayCount || 0) }}</p>
          <p class="text-[11px] text-amber-200">{{ kpis()?.overdueCount || 0 }} vencidas · {{ kpis()?.dueTodayCount || 0 }} para hoy</p>
        </div>
      </div>

      <!-- 5. TASA DE CUMPLIMIENTO -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-emerald-500/30 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Cumplimiento</span>
          <span class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center material-symbols-outlined text-lg">
            check_circle
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-2xl font-black text-emerald-300 font-mono tracking-tight">{{ kpis()?.completionRatePercent || 0 }}%</p>
          <p class="text-[11px] text-emerald-400">{{ kpis()?.completedCount || 0 }} tareas terminadas</p>
        </div>
      </div>

    </div>
  `
})
export class TasksKpisComponent {
  kpis = input<TasksOverviewKPIs>();
}
