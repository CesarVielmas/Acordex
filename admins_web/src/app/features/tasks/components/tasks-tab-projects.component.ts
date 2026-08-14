import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskItem } from '../../../core/models/admin.models';
import { TaskProjectGroup } from '../../../core/models/task.models';
import { groupTasksByProject, getCategoryBadgeClass, getPriorityBadgeClass, getStatusDotClass } from '../task-metrics';

/**
 * Pestaña 3: Tareas Agrupadas por Proyecto / Evento / Cotización.
 *
 * Muestra el porcentaje de avance operativo de cada producción y evento.
 */
@Component({
  selector: 'app-tasks-tab-projects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center material-symbols-outlined text-lg">
              folder_open
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Avance Operativo por Producción & Evento</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Control de avance de tareas por cada palenque, boda privada o grupo musical</p>
        </div>
      </div>

      <!-- CARPETAS DE PROYECTO -->
      <div class="space-y-5">
        @for (proj of projectGroups(); track proj.projectId) {
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4">

            <!-- Encabezado de Proyecto y Progreso -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-2xl flex items-center justify-center material-symbols-outlined text-xl"
                  [class]="proj.projectType === 'cotizacion' ? 'bg-purple-500/20 text-purple-300' : (proj.projectType === 'grupo' ? 'bg-rose-500/20 text-rose-300' : 'bg-primary/20 text-primary')">
                  {{ proj.projectType === 'cotizacion' ? 'celebration' : (proj.projectType === 'grupo' ? 'mic' : 'festival') }}
                </span>
                <div>
                  <h3 class="text-sm sm:text-base font-black text-on-surface">{{ proj.projectTitle }}</h3>
                  <p class="text-xs text-outline">{{ proj.totalTasks }} tareas asignadas · {{ proj.completedTasks }} concluidas</p>
                </div>
              </div>

              <!-- Porcentaje de Avance -->
              <div class="flex items-center gap-3 self-end sm:self-auto font-mono">
                <div class="w-28 sm:w-36 h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-700"
                    [class]="proj.progressPercent === 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-primary to-cyan-400'"
                    [style.width.%]="proj.progressPercent"
                  ></div>
                </div>
                <span class="text-sm font-black text-primary">{{ proj.progressPercent }}%</span>
              </div>
            </div>

            <!-- Lista de Tareas del Proyecto -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              @for (tsk of proj.tasks; track tsk.id) {
                <div
                  (click)="openDetail.emit(tsk)"
                  class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 hover:border-primary/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div class="min-w-0 space-y-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="px-2 py-0.5 rounded text-[9px] font-bold border" [class]="getCategoryBadgeClass(tsk.category)">
                        {{ tsk.category || 'General' }}
                      </span>
                      <span class="px-2 py-0.5 rounded text-[9px] font-black border uppercase" [class]="getPriorityBadgeClass(tsk.priority)">
                        {{ tsk.priority }}
                      </span>
                    </div>
                    <h4 class="text-xs font-black text-on-surface group-hover:text-primary transition-colors truncate">
                      {{ tsk.title }}
                    </h4>
                    <span class="text-[10px] text-outline block">Resp: {{ tsk.assignedTo }}</span>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <div class="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-xs">
                      <span [class]="getStatusDotClass(tsk.status)" class="w-2 h-2 rounded-full"></span>
                      <span class="text-[11px] font-bold text-on-surface">{{ tsk.status }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class TasksTabProjectsComponent {
  tasks = input<TaskItem[]>([]);
  openDetail = output<TaskItem>();

  projectGroups(): TaskProjectGroup[] {
    return groupTasksByProject(this.tasks());
  }

  getCategoryBadgeClass = getCategoryBadgeClass;
  getPriorityBadgeClass = getPriorityBadgeClass;
  getStatusDotClass = getStatusDotClass;
}
