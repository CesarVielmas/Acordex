import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskItem, TaskPrivacy, Role } from '../../../core/models/admin.models';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { getCategoryBadgeClass, getPriorityBadgeClass, getStatusDotClass } from '../task-metrics';

/**
 * Pestaña 1: Tablero Kanban Operativo.
 *
 * Maneja las 4 columnas de flujo de trabajo:
 * 1. Pendientes
 * 2. En Proceso
 * 3. En Revisión
 * 4. Completadas
 */
@Component({
  selector: 'app-tasks-tab-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ─── BARRA DE FILTROS & BÚSQUEDA ─── -->
      <div class="p-4 sm:p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">

        <!-- Buscador -->
        <div class="relative flex-1 max-w-md">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por asignación, responsable o evento..."
            class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#141414] border border-white/10 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all font-['Epilogue']"
          />
        </div>

        <!-- Filtros Rápidos -->
        <div class="flex items-center gap-2 flex-wrap text-xs">

          <!-- Categoría -->
          <select
            [ngModel]="selectedCategory()"
            (ngModelChange)="selectedCategory.set($event)"
            class="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="Producción & Escenario">Producción & Escenario</option>
            <option value="Logística & Hospedaje">Logística & Hospedaje</option>
            <option value="Legal & Permisos">Legal & Permisos</option>
            <option value="Hospitalidad & Camerinos">Hospitalidad & Camerinos</option>
            <option value="Finanzas & Cobranza">Finanzas & Cobranza</option>
            <option value="Prensa & Marketing">Prensa & Marketing</option>
            <option value="Talento & Backline">Talento & Backline</option>
          </select>

          <!-- Prioridad -->
          <select
            [ngModel]="selectedPriority()"
            (ngModelChange)="selectedPriority.set($event)"
            class="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
          >
            <option value="ALL">Todas las Prioridades</option>
            <option value="Urgente">Prioridad Crítica / Urgente</option>
            <option value="Alta">Prioridad Alta</option>
            <option value="Media">Prioridad Media</option>
            <option value="Baja">Prioridad Ordinaria / Baja</option>
          </select>

          <!-- Botón de Limpiar Filtros -->
          @if (searchQuery() || selectedCategory() !== 'ALL' || selectedPriority() !== 'ALL') {
            <button
              type="button"
              (click)="clearFilters()"
              class="px-3 py-2 rounded-xl bg-[#222222] text-outline hover:text-on-surface font-bold text-xs transition-all cursor-pointer font-['Epilogue']"
            >
              Limpiar
            </button>
          }
        </div>

      </div>

      <!-- ─── 4 COLUMNAS KANBAN ─── -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        @for (col of columns; track col.status) {
          <div class="bg-[#181818] rounded-3xl p-4 sm:p-5 border border-white/10 flex flex-col min-h-[550px] shadow-xl">

            <!-- Encabezado de Columna -->
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <h3 class="text-sm font-black text-on-surface flex items-center gap-2 font-['Epilogue']">
                <span [class]="getStatusDotClass(col.status)" class="w-3 h-3 rounded-full"></span>
                {{ col.title }}
              </h3>
              <span class="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-[#141414] text-primary border border-white/10 shadow-sm">
                {{ getFilteredTasksByStatus(col.status).length }}
              </span>
            </div>

            <!-- Contenedor de Tarjetas -->
            <div class="space-y-3.5 flex-1 overflow-y-auto pr-1">
              @for (tsk of getFilteredTasksByStatus(col.status); track tsk.id) {
                <div
                  (click)="openDetail.emit(tsk)"
                  class="p-4 rounded-2xl bg-[#141414] border border-white/5 hover:border-primary/50 transition-all shadow-md space-y-3 group cursor-pointer hover:scale-[1.01]"
                >

                  <!-- Badges Superiores -->
                  <div class="flex items-center justify-between gap-1.5 flex-wrap">
                    @if (tsk.category) {
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border font-['Epilogue']" [class]="getCategoryBadgeClass(tsk.category)">
                        {{ tsk.category }}
                      </span>
                    }

                    <div class="flex items-center gap-1 font-mono">
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-black border uppercase" [class]="getPriorityBadgeClass(tsk.priority)">
                        {{ tsk.priority }}
                      </span>
                      @if (tsk.privacy === 'Privada') {
                        <span class="w-5 h-5 rounded bg-rose-500/20 text-rose-300 flex items-center justify-center material-symbols-outlined text-xs shadow-inner" title="Confidencial Encargado">lock</span>
                      } @else if (tsk.privacy === 'Delicada') {
                        <span class="w-5 h-5 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center material-symbols-outlined text-xs shadow-inner" title="Encargado y Admin">shield</span>
                      }
                    </div>
                  </div>

                  <!-- Título y Descripción -->
                  <div>
                    <h4 class="text-xs sm:text-sm font-black text-on-surface group-hover:text-primary transition-colors line-clamp-2 font-['Epilogue']">
                      {{ tsk.title }}
                    </h4>
                    <p class="text-[11px] text-outline mt-1 line-clamp-2 leading-relaxed font-['Epilogue']">
                      {{ tsk.description }}
                    </p>
                  </div>

                  <!-- Proyecto / Evento Vinculado -->
                  @if (tsk.relatedTitle || tsk.eventName) {
                    <div class="p-2 rounded-xl bg-[#1A1A1A] border border-white/5 flex items-center gap-1.5 text-[11px] text-primary font-bold truncate font-['Epilogue']">
                      <span class="material-symbols-outlined text-xs shrink-0">
                        {{ tsk.relatedToType === 'cotizacion' ? 'celebration' : (tsk.relatedToType === 'grupo' ? 'mic' : 'confirmation_number') }}
                      </span>
                      <span class="truncate">{{ tsk.relatedTitle || tsk.eventName }}</span>
                    </div>
                  }

                  <!-- Subtareas Checklist Progress -->
                  @if (tsk.subtasks && tsk.subtasks.length > 0) {
                    <div class="space-y-1">
                      <div class="flex justify-between text-[10px] font-mono text-outline">
                        <span class="font-['Epilogue']">Hitos / Checklist:</span>
                        <span>{{ getCompletedSubtasksCount(tsk) }}/{{ tsk.subtasks.length }}</span>
                      </div>
                      <div class="w-full h-1.5 bg-[#202020] rounded-full overflow-hidden border border-white/5">
                        <div
                          class="h-full bg-emerald-400 rounded-full shadow-sm"
                          [style.width.%]="(getCompletedSubtasksCount(tsk) / tsk.subtasks.length) * 100"
                        ></div>
                      </div>
                    </div>
                  }

                  <!-- Card Footer -->
                  <div class="pt-2.5 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                    <div class="flex items-center gap-1.5 min-w-0">
                      <span class="w-6 h-6 rounded-full bg-[#202020] text-primary font-black text-[10px] flex items-center justify-center shrink-0 border border-white/10 font-mono shadow-sm">
                        {{ tsk.assignedTo.charAt(0) }}
                      </span>
                      <span class="text-[10px] text-outline font-medium truncate font-['Epilogue']">{{ tsk.assignedTo }}</span>
                    </div>

                    <div class="flex items-center gap-2 font-mono text-[10px] text-outline shrink-0">
                      @if (tsk.comments && tsk.comments.length > 0) {
                        <span class="flex items-center gap-0.5 text-primary font-bold">
                          <span class="material-symbols-outlined text-xs">comment</span> {{ tsk.comments.length }}
                        </span>
                      }
                      <span class="flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-xs">event</span> {{ tsk.dueDate.slice(5) }}
                      </span>
                    </div>
                  </div>

                  <!-- Botones de Cambio de Estado Rápido -->
                  <div class="pt-2 flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity" (click)="$event.stopPropagation()">
                    @if (col.status !== 'Pendiente') {
                      <button
                        type="button"
                        (click)="changeStatus.emit({ taskId: tsk.id, status: 'Pendiente' })"
                        title="Mover a Pendiente"
                        class="p-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-outline hover:text-amber-400 transition-all text-xs cursor-pointer"
                      >
                        <span class="material-symbols-outlined text-sm">schedule</span>
                      </button>
                    }
                    @if (col.status !== 'En Proceso') {
                      <button
                        type="button"
                        (click)="changeStatus.emit({ taskId: tsk.id, status: 'En Proceso' })"
                        title="Mover a En Proceso"
                        class="p-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-outline hover:text-cyan-400 transition-all text-xs cursor-pointer"
                      >
                        <span class="material-symbols-outlined text-sm">engineering</span>
                      </button>
                    }
                    @if (col.status !== 'En Revisión') {
                      <button
                        type="button"
                        (click)="changeStatus.emit({ taskId: tsk.id, status: 'En Revisión' })"
                        title="Enviar a Revisión"
                        class="p-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-outline hover:text-purple-400 transition-all text-xs cursor-pointer"
                      >
                        <span class="material-symbols-outlined text-sm">rule</span>
                      </button>
                    }
                    @if (col.status !== 'Completada') {
                      <button
                        type="button"
                        (click)="changeStatus.emit({ taskId: tsk.id, status: 'Completada' })"
                        title="Marcar Completada"
                        class="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black transition-all text-xs cursor-pointer"
                      >
                        <span class="material-symbols-outlined text-sm">check</span>
                      </button>
                    }
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
export class TasksTabKanbanComponent {
  tasks = input<TaskItem[]>([]);
  openDetail = output<TaskItem>();
  changeStatus = output<{ taskId: string; status: TaskItem['status'] }>();

  searchQuery = signal('');
  selectedCategory = signal('ALL');
  selectedPriority = signal('ALL');

  readonly columns = [
    { status: 'Pendiente' as const, title: '⏳ Pendientes por Iniciar' },
    { status: 'En Proceso' as const, title: '⚙️ En Operación' },
    { status: 'En Revisión' as const, title: '🔍 En Revisión' },
    { status: 'Completada' as const, title: '✅ Completadas' }
  ];

  getFilteredTasksByStatus(status: TaskItem['status']): TaskItem[] {
    return this.tasks().filter(t => {
      if (t.status !== status) return false;

      // Filtro de Búsqueda
      if (this.searchQuery()) {
        const q = this.searchQuery().toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchAssignee = t.assignedTo?.toLowerCase().includes(q);
        const matchEvent = (t.relatedTitle || t.eventName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAssignee && !matchEvent) return false;
      }

      // Filtro de Categoría
      if (this.selectedCategory() !== 'ALL' && t.category !== this.selectedCategory()) {
        return false;
      }

      // Filtro de Prioridad
      if (this.selectedPriority() !== 'ALL' && t.priority !== this.selectedPriority()) {
        return false;
      }

      return true;
    });
  }

  getCompletedSubtasksCount(tsk: TaskItem): number {
    return (tsk.subtasks || []).filter(st => st.completed).length;
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('ALL');
    this.selectedPriority.set('ALL');
  }

  getCategoryBadgeClass = getCategoryBadgeClass;
  getPriorityBadgeClass = getPriorityBadgeClass;
  getStatusDotClass = getStatusDotClass;
}
