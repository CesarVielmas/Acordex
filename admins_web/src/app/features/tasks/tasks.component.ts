import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { TaskItem, TaskPrivacy, Role } from '../../core/models/admin.models';
import { BadgeComponent, BadgeVariant } from '../../shared/ui/badge/badge.component';
import { InfoBannerComponent } from '../../shared/ui/info-banner/info-banner.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';
import { FormFieldComponent, FormFieldOption } from '../../shared/ui/form-field/form-field.component';
import { IconButtonComponent } from '../../shared/ui/icon-button/icon-button.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, InfoBannerComponent, ModalShellComponent, FormFieldComponent, IconButtonComponent],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="font-display-xl text-xl sm:text-2xl font-black text-on-surface">Tablero de Tareas</h1>
            <app-badge label="Filtros por Privacidad" variant="primary" />
          </div>
          <p class="text-xs text-outline mt-1">Asignación operativa con control de privacidad según rol activo</p>
        </div>

        <button
          (click)="isCreating.set(true)"
          class="px-4 py-2.5 min-h-11 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 self-start"
        >
          <span class="material-symbols-outlined text-lg">add_task</span> Nueva Tarea
        </button>
      </div>

      <!-- ROLE PRIVACY NOTICE BANNER -->
      <app-info-banner icon="security" title="Visibilidad según Rol" [hasLegend]="true" variant="neutral">
        @if (roleService.isEncargado()) {
          Viendo tareas <strong>Públicas</strong>, <strong>Delicadas</strong> y <strong>Privadas</strong> (Encargado).
        } @else if (roleService.isAdminOrEncargado()) {
          Viendo tareas <strong>Públicas</strong> y <strong>Delicadas</strong> (Ocultas 1 tarea Privada).
        } @else {
          Viendo únicamente tareas <strong>Públicas</strong> de campo.
        }

        <ng-container banner-legend>
          <app-badge label="Pública" variant="success" />
          <app-badge label="Delicada" variant="warning" />
          <app-badge label="Privada" variant="error" />
        </ng-container>
      </app-info-banner>

      <!-- KANBAN BOARD COLUMNS -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        @for (status of taskStatuses; track status) {
          <div class="bg-surface-container/70 rounded-3xl p-5 border border-outline-variant/30 flex flex-col lg:min-h-[500px]">

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

                  <div class="flex items-center justify-between gap-2">
                    <app-badge [label]="tsk.privacy" [variant]="getPrivacyVariant(tsk.privacy)" />
                    <span [class]="tsk.priority === 'Alta' ? 'text-red-400 font-bold' : 'text-outline'" class="text-[11px] shrink-0">
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
                  <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2 text-xs">
                    <span class="text-[11px] font-medium text-outline min-w-0 truncate">
                      Resp: <strong class="text-on-surface">{{ tsk.assignedTo }}</strong>
                    </span>

                    <div class="flex items-center gap-1 shrink-0">
                      @if (status !== 'Pendiente') {
                        <app-icon-button icon="schedule" ariaLabel="Mover a Pendiente" variant="ghost" (pressed)="changeTaskStatus(tsk.id, 'Pendiente')" />
                      }
                      @if (status !== 'En Proceso') {
                        <app-icon-button icon="engineering" ariaLabel="Mover a En Proceso" variant="ghost" (pressed)="changeTaskStatus(tsk.id, 'En Proceso')" />
                      }
                      @if (status !== 'Completada') {
                        <app-icon-button icon="check" ariaLabel="Mover a Completada" variant="ghost" (pressed)="changeTaskStatus(tsk.id, 'Completada')" />
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
        <app-modal-shell title="Crear Nueva Tarea" icon="add_task" size="md" [hasFooter]="true" (closed)="isCreating.set(false)">
          <div class="space-y-3.5">
            <app-form-field label="Título de la Tarea" [(value)]="newTaskForm.title" placeholder="Ej. Inspección de escenario" />
            <app-form-field label="Descripción" type="textarea" [(value)]="newTaskForm.description" placeholder="Detalles de la asignación..." />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <app-form-field label="Nivel de Privacidad" type="select" [(value)]="newTaskForm.privacy" [options]="privacyOptions" />
              <app-form-field label="Prioridad" type="select" [(value)]="newTaskForm.priority" [options]="priorityOptions" />
            </div>

            <app-form-field label="Responsable" [(value)]="newTaskForm.assignedTo" placeholder="Ej. Jorge Staff" />
          </div>

          <ng-container modal-footer>
            <button (click)="isCreating.set(false)" class="px-4 py-2 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
            <button (click)="saveTask()" class="px-5 py-2 min-h-11 rounded-xl bg-primary text-on-primary text-xs font-bold">Crear Tarea</button>
          </ng-container>
        </app-modal-shell>
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

  readonly privacyOptions: FormFieldOption[] = [
    { label: 'Pública (Visible para todos)', value: 'Pública' },
    { label: 'Delicada (Encargado y Admin)', value: 'Delicada' },
    { label: 'Privada (Solo Encargado)', value: 'Privada' }
  ];

  readonly priorityOptions: FormFieldOption[] = [
    { label: 'Alta', value: 'Alta' },
    { label: 'Media', value: 'Media' },
    { label: 'Baja', value: 'Baja' }
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

  getPrivacyVariant(privacy: TaskPrivacy): BadgeVariant {
    switch (privacy) {
      case 'Privada': return 'error';
      case 'Delicada': return 'warning';
      default: return 'success';
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
