import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskItem } from '../../../core/models/admin.models';
import { TeamMemberWorkload } from '../../../core/models/task.models';
import { calculateTeamWorkload } from '../task-metrics';

/**
 * Pestaña 4: Carga de Trabajo del Equipo & Responsables.
 *
 * Muestra la asignación operativa por colaborador, tareas activas y eficiencia.
 */
@Component({
  selector: 'app-tasks-tab-team',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg">
              badge
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Carga de Trabajo del Equipo & Responsables</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Distribución de responsabilidades operativas entre encargados, coordinadores y staff</p>
        </div>
      </div>

      <!-- CARDS DE MIEMBROS -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (m of teamWorkload(); track m.memberName) {
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4 relative overflow-hidden transition-all hover:border-cyan-500/40">

            <!-- Encabezado con Avatar y Rol -->
            <div class="flex items-center justify-between gap-3 border-b border-outline-variant/20 pb-3">
              <div class="flex items-center gap-3">
                <span class="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-black text-sm font-mono">
                  {{ m.memberName.charAt(0) }}
                </span>
                <div>
                  <h3 class="text-sm font-black text-on-surface">{{ m.memberName }}</h3>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                    [class]="m.memberRole === 'encargado' ? 'bg-primary/20 text-primary border border-primary/40' : (m.memberRole === 'administrador' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-surface-container-highest text-outline border border-outline-variant/30')">
                    {{ m.memberRole }}
                  </span>
                </div>
              </div>

              <div class="text-right font-mono">
                <span class="text-lg font-black text-cyan-300 block">{{ m.efficiencyPercent }}%</span>
                <span class="text-[9px] text-outline uppercase font-sans">Efectividad</span>
              </div>
            </div>

            <!-- Métricas de Tareas Grid -->
            <div class="grid grid-cols-3 gap-2 font-mono text-center text-xs">
              <div class="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20">
                <span class="text-[9px] font-sans font-bold text-outline uppercase block">Asignadas</span>
                <span class="font-black text-on-surface">{{ m.totalAssigned }}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20">
                <span class="text-[9px] font-sans font-bold text-cyan-400 uppercase block">En Curso</span>
                <span class="font-black text-cyan-300">{{ m.inProgressCount }}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <span class="text-[9px] font-sans font-bold text-emerald-400 uppercase block">Listas</span>
                <span class="font-black text-emerald-300">{{ m.completedCount }}</span>
              </div>
            </div>

            <!-- Barra de Avance -->
            <div class="space-y-1">
              <div class="flex justify-between text-[10px] font-mono text-outline">
                <span>Progreso:</span>
                <span>{{ m.completedCount }}/{{ m.totalAssigned }} tareas</span>
              </div>
              <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                  [style.width.%]="m.efficiencyPercent"
                ></div>
              </div>
            </div>

            @if (m.urgentCount > 0) {
              <div class="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5 font-bold">
                <span class="material-symbols-outlined text-sm">priority_high</span>
                <span>{{ m.urgentCount }} tarea(s) urgente(s) pendiente(s)</span>
              </div>
            }

          </div>
        }
      </div>

    </div>
  `
})
export class TasksTabTeamComponent {
  tasks = input<TaskItem[]>([]);

  teamWorkload(): TeamMemberWorkload[] {
    return calculateTeamWorkload(this.tasks());
  }
}
