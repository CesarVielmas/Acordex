import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { TaskItem, TaskPrivacy, Role } from '../../core/models/admin.models';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display-xl text-2xl font-black text-on-surface">Tablero de Tareas</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
              Filtros por Privacidad
            </span>
          </div>
          <p class="text-xs text-outline mt-1">Asignación operativa con control de privacidad según rol activo</p>
        </div>

        <button 
          (click)="isCreating.set(true)"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 self-start"
        >
          <span class="material-symbols-outlined text-lg">add_task</span> Nueva Tarea
        </button>
      </div>

      <!-- ROLE PRIVACY NOTICE BANNER -->
      <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-2xl text-primary">security</span>
          <div class="text-xs">
            <span class="font-bold text-on-surface">Visibilidad según Rol:</span> 
            <span class="text-outline ml-1">
              @if (roleService.isEncargado()) {
                Viendo tareas <strong>Públicas</strong>, <strong>Delicadas</strong> y <strong>Privadas</strong> (Encargado).
              } @else if (roleService.isAdminOrEncargado()) {
                Viendo tareas <strong>Públicas</strong> y <strong>Delicadas</strong> (Ocultas 1 tarea Privada).
              } @else {
                Viendo únicamente tareas <strong>Públicas</strong> de campo.
              }
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1 text-[11px] font-bold">
          <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Pública</span>
          <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Delicada</span>
          <span class="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">Privada</span>
        </div>
      </div>

      <!-- KANBAN BOARD COLUMNS -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (status of taskStatuses; track status) {
          <div class="bg-surface-container/70 rounded-3xl p-5 border border-outline-variant/30 flex flex-col min-h-[500px]">
            
            <!-- Column Header -->
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-outline-variant/20">
              <h3 class="text-sm font-bold text-on-surface flex items-center gap-2">
                <span [class]="getStatusColorDot(status)" class="w-3 h-3 rounded-full"></span>
                {{ status }}
              </h3>
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-bright text-primary">
                {{ getTasksByStatus(status).length }}
              </span>
            </div>

            <!-- Cards Container -->
            <div class="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              @for (tsk of getTasksByStatus(status); track tsk.id) {
                <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-primary/50 transition-all shadow-md space-y-3 group">
                  
                  <div class="flex items-center justify-between">
                    <span 
                      [class]="tsk.privacy === 'Privada' ? 'bg-red-500/20 text-red-300 border-red-500/30' : tsk.privacy === 'Delicada' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'"
                      class="text-[10px] font-bold px-2 py-0.5 rounded uppercase border"
                    >
                      {{ tsk.privacy }}
                    </span>

                    <span [class]="tsk.priority === 'Alta' ? 'text-red-400 font-bold' : 'text-outline'" class="text-[11px]">
                      Prioridad {{ tsk.priority }}
                    </span>
                  </div>

                  <div>
                    <h4 class="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                      {{ tsk.title }}
                    </h4>
                    <p class="text-xs text-outline mt-1 leading-relaxed">{{ tsk.description }}</p>
                  </div>

                  @if (tsk.eventName) {
                    <p class="text-[11px] text-primary font-semibold flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">event</span> {{ tsk.eventName }}
                    </p>
                  }

                  <!-- Card Footer & Quick Status Switcher -->
                  <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                    <span class="text-[11px] font-medium text-outline">
                      Resp: <strong class="text-on-surface">{{ tsk.assignedTo }}</strong>
                    </span>

                    <div class="flex items-center gap-1">
                      @if (status !== 'Pendiente') {
                        <button 
                          (click)="changeTaskStatus(tsk.id, 'Pendiente')"
                          class="p-1 rounded bg-surface-bright hover:bg-amber-500 hover:text-black text-outline transition-all"
                          title="Mover a Pendiente"
                        >
                          <span class="material-symbols-outlined text-sm">schedule</span>
                        </button>
                      }

                      @if (status !== 'En Proceso') {
                        <button 
                          (click)="changeTaskStatus(tsk.id, 'En Proceso')"
                          class="p-1 rounded bg-surface-bright hover:bg-blue-500 hover:text-white text-outline transition-all"
                          title="Mover a En Proceso"
                        >
                          <span class="material-symbols-outlined text-sm">engineering</span>
                        </button>
                      }

                      @if (status !== 'Completada') {
                        <button 
                          (click)="changeTaskStatus(tsk.id, 'Completada')"
                          class="p-1 rounded bg-surface-bright hover:bg-emerald-500 hover:text-black text-outline transition-all"
                          title="Mover a Completada"
                        >
                          <span class="material-symbols-outlined text-sm">check</span>
                        </button>
                      }
                    </div>
                  </div>

                </div>
              }
            </div>

          </div>
        }
      </div>

      <!-- CREATE TASK MODAL -->
      @if (isCreating()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-surface-container p-6 rounded-3xl border border-outline-variant/30 max-w-md w-full space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 class="text-base font-bold text-on-surface">Crear Nueva Tarea</h3>
              <button (click)="isCreating.set(false)" class="text-outline hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-outline font-medium mb-1">Título de la Tarea</label>
                <input [(ngModel)]="newTaskForm.title" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" placeholder="Ej. Inspección de escenario" />
              </div>

              <div>
                <label class="block text-outline font-medium mb-1">Descripción</label>
                <textarea [(ngModel)]="newTaskForm.description" rows="2" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" placeholder="Detalles de la asignación..."></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-outline font-medium mb-1">Nivel de Privacidad</label>
                  <select [(ngModel)]="newTaskForm.privacy" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface">
                    <option value="Pública">Pública (Visible para todos)</option>
                    <option value="Delicada">Delicada (Encargado y Admin)</option>
                    <option value="Privada">Privada (Solo Encargado)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-outline font-medium mb-1">Prioridad</label>
                  <select [(ngModel)]="newTaskForm.priority" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface">
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-outline font-medium mb-1">Responsable</label>
                <input [(ngModel)]="newTaskForm.assignedTo" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" placeholder="Ej. Jorge Staff" />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button (click)="isCreating.set(false)" class="px-4 py-2 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
              <button (click)="saveTask()" class="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold">Crear Tarea</button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class TasksComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  isCreating = signal(false);

  readonly taskStatuses: ('Pendiente' | 'En Proceso' | 'Completada')[] = [
    'Pendiente',
    'En Proceso',
    'Completada'
  ];

  newTaskForm = {
    title: '',
    description: '',
    assignedTo: 'Jorge Staff',
    priority: 'Media' as 'Alta' | 'Media' | 'Baja',
    privacy: 'Pública' as TaskPrivacy,
    dueDate: '2026-08-10'
  };

  getTasksByStatus(status: 'Pendiente' | 'En Proceso' | 'Completada') {
    return this.mockData.filteredTasks().filter(t => t.status === status);
  }

  getStatusColorDot(status: string): string {
    switch (status) {
      case 'Pendiente': return 'bg-amber-400';
      case 'En Proceso': return 'bg-blue-400';
      case 'Completada': return 'bg-emerald-400';
      default: return 'bg-outline';
    }
  }

  changeTaskStatus(taskId: string, newStatus: 'Pendiente' | 'En Proceso' | 'Completada'): void {
    this.mockData.updateTaskStatus(taskId, newStatus);
  }

  saveTask(): void {
    if (!this.newTaskForm.title) return;
    this.mockData.addTask({
      title: this.newTaskForm.title,
      description: this.newTaskForm.description,
      assignedTo: this.newTaskForm.assignedTo,
      assignedRole: 'usuario' as Role,
      priority: this.newTaskForm.priority,
      privacy: this.newTaskForm.privacy,
      status: 'Pendiente',
      dueDate: this.newTaskForm.dueDate
    });
    this.isCreating.set(false);
  }
}
