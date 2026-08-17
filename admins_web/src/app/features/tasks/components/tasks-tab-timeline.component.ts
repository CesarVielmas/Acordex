import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskItem } from '../../../core/models/admin.models';
import { getCategoryBadgeClass, getPriorityBadgeClass, getStatusDotClass } from '../task-metrics';

/**
 * Pestaña 2: Agenda Cronológica & Línea de Tiempo de Tareas.
 *
 * Agrupa las tareas por vencimiento: Vencidas, Hoy, Esta Semana y Próximas.
 */
@Component({
  selector: 'app-tasks-tab-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
              event_upcoming
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface font-['Epilogue']">Cronograma Operativo & Control de Vencimientos</h2>
          </div>
          <p class="text-xs text-outline mt-0.5 font-['Epilogue']">Control de hitos críticos de entrega, montajes en recintos, llamados a staff técnico y plazos contractuales</p>
        </div>
      </div>

      <!-- ─── 1. TAREAS VENCIDAS (ALERTA ROJA) ─── -->
      @if (overdueTasks().length > 0) {
        <div class="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/40 shadow-xl space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center material-symbols-outlined text-lg animate-pulse shadow-inner">
                warning
              </span>
              <div>
                <h3 class="text-sm font-black text-rose-300 font-['Epilogue']">Asignaciones en Mora Operativa</h3>
                <p class="text-[11px] text-rose-200/80 font-['Epilogue']">Hitos con fecha límite excedida que requieren escalamiento o resolución prioritaria</p>
              </div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-rose-500/30 text-rose-200 border border-rose-500/50">
              {{ overdueTasks().length }}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (tsk of overdueTasks(); track tsk.id) {
              <div
                (click)="openDetail.emit(tsk)"
                class="p-4 rounded-2xl bg-[#141414] border border-rose-500/30 hover:border-rose-400 transition-all cursor-pointer space-y-2 group shadow-md"
              >
                <div class="flex justify-between items-center text-xs">
                  <span class="font-mono font-bold text-rose-400">Expiró: {{ tsk.dueDate }}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-black border uppercase font-mono" [class]="getPriorityBadgeClass(tsk.priority)">
                    {{ tsk.priority }}
                  </span>
                </div>
                <h4 class="text-xs sm:text-sm font-black text-on-surface group-hover:text-rose-300 transition-colors font-['Epilogue']">{{ tsk.title }}</h4>
                <div class="flex justify-between text-[11px] text-outline pt-2 border-t border-white/5 font-['Epilogue']">
                  <span>Responsable: <b class="text-on-surface font-sans">{{ tsk.assignedTo }}</b></span>
                  <span class="text-rose-300 font-bold font-mono">{{ tsk.status }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ─── 2. TAREAS PARA HOY & ESTA SEMANA ─── -->
      <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-4">
        <div class="flex items-center gap-2 border-b border-white/10 pb-3">
          <span class="material-symbols-outlined text-primary text-lg">today</span>
          <h3 class="text-sm font-black text-on-surface font-['Epilogue']">Hitos y Vencimientos Programados</h3>
        </div>

        <div class="space-y-3">
          @for (tsk of upcomingTasks(); track tsk.id) {
            <div
              (click)="openDetail.emit(tsk)"
              class="p-4 rounded-2xl bg-[#141414] border border-white/5 hover:border-primary/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-sm"
            >
              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold border font-['Epilogue']" [class]="getCategoryBadgeClass(tsk.category)">
                    {{ tsk.category || 'General' }}
                  </span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-black border uppercase font-mono" [class]="getPriorityBadgeClass(tsk.priority)">
                    {{ tsk.priority }}
                  </span>
                  @if (tsk.relatedTitle) {
                    <span class="text-[11px] text-primary font-bold font-['Epilogue']">· {{ tsk.relatedTitle }}</span>
                  }
                </div>
                <h4 class="text-xs sm:text-sm font-black text-on-surface group-hover:text-primary transition-colors font-['Epilogue']">{{ tsk.title }}</h4>
                <p class="text-[11px] text-outline line-clamp-1 font-['Epilogue']">{{ tsk.description }}</p>
              </div>

              <div class="flex items-center gap-4 text-xs font-mono shrink-0 self-end sm:self-auto">
                <div class="text-right">
                  <span class="font-bold text-on-surface block">{{ tsk.dueDate }}</span>
                  <span class="text-[10px] text-outline font-sans font-['Epilogue']">{{ tsk.dueTime || 'Horario Abierto' }}</span>
                </div>
                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1A1A] border border-white/10 shadow-sm">
                  <span [class]="getStatusDotClass(tsk.status)" class="w-2.5 h-2.5 rounded-full"></span>
                  <span class="text-xs font-bold text-on-surface font-sans font-['Epilogue']">{{ tsk.status }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class TasksTabTimelineComponent {
  tasks = input<TaskItem[]>([]);
  openDetail = output<TaskItem>();

  readonly todayIso = '2026-08-15';

  overdueTasks(): TaskItem[] {
    return this.tasks().filter(t => t.status !== 'Completada' && t.dueDate && t.dueDate < this.todayIso);
  }

  upcomingTasks(): TaskItem[] {
    return this.tasks().filter(t => t.status !== 'Completada' && (!t.dueDate || t.dueDate >= this.todayIso));
  }

  getCategoryBadgeClass = getCategoryBadgeClass;
  getPriorityBadgeClass = getPriorityBadgeClass;
  getStatusDotClass = getStatusDotClass;
}
