import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { TaskItem, TaskPrivacy, Role } from '../../core/models/admin.models';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { InfoBannerComponent } from '../../shared/ui/info-banner/info-banner.component';
import { TabPillsComponent, TabPillItem } from '../../shared/ui/tab-pills/tab-pills.component';

import { calculateTasksKPIs } from './task-metrics';

import { TasksKpisComponent } from './components/tasks-kpis.component';
import { TasksTabKanbanComponent } from './components/tasks-tab-kanban.component';
import { TasksTabTimelineComponent } from './components/tasks-tab-timeline.component';
import { TasksTabProjectsComponent } from './components/tasks-tab-projects.component';
import { TasksTabTeamComponent } from './components/tasks-tab-team.component';

import { ModalTaskEditorComponent } from './modals/modal-task-editor.component';
import { ModalTaskDetailComponent } from './modals/modal-task-detail.component';

export type TasksTab = 'kanban' | 'timeline' | 'projects' | 'team';

/**
 * Módulo de Gestión de Tareas & Operación de Campo de Acordex.
 *
 * Conecta las tareas operativas de Eventos Masivos, Cotizaciones Privadas,
 * Grupos del Catálogo y Finanzas, con control de privacidad por rol.
 */
@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    InfoBannerComponent,
    TabPillsComponent,
    TasksKpisComponent,
    TasksTabKanbanComponent,
    TasksTabTimelineComponent,
    TasksTabProjectsComponent,
    TasksTabTeamComponent,
    ModalTaskEditorComponent,
    ModalTaskDetailComponent
  ],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-fade-in pb-12">

      <!-- ─── ENCABEZADO PRINCIPAL ─── -->
      <div class="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#1A1A1A] via-[#161616] to-[#121212] backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-xl sm:text-2xl font-black text-on-surface tracking-tight font-['Epilogue']">Control Operativo & Logística de Producción</h1>
            <app-badge label="Coordinación Ejecutiva" variant="primary" />
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30 shadow-sm">
              Operación en Campo
            </span>
          </div>
          <p class="text-xs text-outline mt-1 max-w-2xl leading-relaxed">
            Asignación operativa de producción técnica, permisos municipales, logística de transporte y hospedaje, hospitalidad VIP y cobranza de anticipos vinculada a eventos reales.
          </p>
        </div>

        <!-- Botones de Acción -->
        <div class="relative z-10 flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            (click)="printTasks()"
            class="px-3.5 py-2.5 rounded-2xl bg-[#202020] hover:bg-[#282828] border border-white/10 text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-base">print</span>
            Imprimir
          </button>

          <button
            type="button"
            (click)="openCreateModal()"
            class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-on-primary font-black text-xs shadow-lg shadow-primary/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-lg">add_task</span>
            Nueva Asignación
          </button>
        </div>
      </div>

      <!-- ─── ROLE PRIVACY NOTICE BANNER ─── -->
      <app-info-banner icon="security" title="Protocolo de Confidencialidad por Rol" [hasLegend]="true" variant="neutral">
        @if (roleService.isEncargado()) {
          Visualización total autorizada: Tareas <strong>Públicas</strong>, <strong>Delicadas</strong> y <strong>Privadas / Estratégicas</strong> (Nivel Encargado General).
        } @else if (roleService.isAdminOrEncargado()) {
          Visualización operativa: Tareas <strong>Públicas</strong> y <strong>Delicadas</strong> (Tareas de alta confidencialidad restringidas).
        } @else {
          Visualización restringida a tareas <strong>Públicas</strong> de campo, staff y logística técnica.
        }

        <ng-container banner-legend>
          <app-badge label="Pública" variant="success" />
          <app-badge label="Delicada" variant="warning" />
          <app-badge label="Privada" variant="error" />
        </ng-container>
      </app-info-banner>

      <!-- ─── KPIS SUPERIORES ─── -->
      <app-tasks-kpis [kpis]="tasksKPIs()" />

      <!-- ─── NAVEGACIÓN DE PESTAÑAS ─── -->
      <div class="border-b border-white/10 pb-2">
        <app-tab-pills
          [tabs]="tabOptions"
          [active]="activeTab()"
          (change)="setTab($event)"
        />
      </div>

      <!-- ─── CONTENIDO DE VISTAS ─── -->

      <!-- 1. TABLERO KANBAN -->
      @if (activeTab() === 'kanban') {
        <app-tasks-tab-kanban
          [tasks]="mockData.filteredTasks()"
          (openDetail)="onOpenDetail($event)"
          (changeStatus)="onChangeStatus($event.taskId, $event.status)"
        />
      }

      <!-- 2. AGENDA CRONOLÓGICA -->
      @if (activeTab() === 'timeline') {
        <app-tasks-tab-timeline
          [tasks]="mockData.filteredTasks()"
          (openDetail)="onOpenDetail($event)"
        />
      }

      <!-- 3. AVANCE POR PROYECTO / EVENTO -->
      @if (activeTab() === 'projects') {
        <app-tasks-tab-projects
          [tasks]="mockData.filteredTasks()"
          (openDetail)="onOpenDetail($event)"
        />
      }

      <!-- 4. CARGA DE TRABAJO DEL EQUIPO -->
      @if (activeTab() === 'team') {
        <app-tasks-tab-team
          [tasks]="mockData.filteredTasks()"
        />
      }

      <!-- ─── MODALES INTERACTIVOS ─── -->

      <!-- Modal 1: Editor / Creador de Tarea -->
      @if (isEditorOpen()) {
        <app-modal-task-editor
          [taskToEdit]="taskBeingEdited()"
          [events]="mockData.events()"
          [quotes]="mockData.quotes()"
          [groups]="mockData.groups()"
          (saved)="onSaveTask($event)"
          (closed)="closeEditorModal()"
        />
      }

      <!-- Modal 2: Detalle de Tarea con Subtareas y Comentarios -->
      @if (selectedTaskForDetail()) {
        <app-modal-task-detail
          [task]="selectedTaskForDetail()!"
          (closed)="selectedTaskForDetail.set(null)"
          (edit)="onEditFromDetail($event)"
          (delete)="onDeleteTask($event)"
          (changeStatus)="onChangeStatus(selectedTaskForDetail()!.id, $event)"
          (toggleSubtask)="onToggleSubtask(selectedTaskForDetail()!.id, $event)"
          (addComment)="onAddComment(selectedTaskForDetail()!.id, $event)"
        />
      }

    </div>
  `
})
export class TasksComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  activeTab = signal<TasksTab>('kanban');

  // Modales
  isEditorOpen = signal(false);
  taskBeingEdited = signal<TaskItem | null>(null);
  selectedTaskForDetail = signal<TaskItem | null>(null);

  readonly tabOptions: TabPillItem[] = [
    { value: 'kanban', label: 'Flujo Operativo Kanban', icon: 'view_kanban' },
    { value: 'timeline', label: 'Cronograma & Vencimientos', icon: 'event_upcoming' },
    { value: 'projects', label: 'Avance por Proyecto & Evento', icon: 'folder_open' },
    { value: 'team', label: 'Distribución de Carga Operativa', icon: 'badge' }
  ];

  setTab(tabId: string): void {
    this.activeTab.set(tabId as TasksTab);
  }

  tasksKPIs = computed(() => {
    return calculateTasksKPIs(this.mockData.filteredTasks());
  });

  // Operaciones de Modales
  openCreateModal(): void {
    this.taskBeingEdited.set(null);
    this.isEditorOpen.set(true);
  }

  closeEditorModal(): void {
    this.isEditorOpen.set(false);
    this.taskBeingEdited.set(null);
  }

  onOpenDetail(task: TaskItem): void {
    this.selectedTaskForDetail.set(task);
  }

  onEditFromDetail(task: TaskItem): void {
    this.selectedTaskForDetail.set(null);
    this.taskBeingEdited.set(task);
    this.isEditorOpen.set(true);
  }

  onSaveTask(task: TaskItem): void {
    if (this.taskBeingEdited()) {
      this.mockData.updateTask(task);
    } else {
      this.mockData.addTask(task);
    }
    this.closeEditorModal();
  }

  onChangeStatus(taskId: string, status: TaskItem['status']): void {
    this.mockData.updateTaskStatus(taskId, status);
    // Si el modal de detalle está abierto, refrescar su estado
    const current = this.selectedTaskForDetail();
    if (current && current.id === taskId) {
      const updated = this.mockData.tasks().find(t => t.id === taskId);
      if (updated) {
        this.selectedTaskForDetail.set(updated);
      }
    }
  }

  onToggleSubtask(taskId: string, subtaskId: string): void {
    this.mockData.toggleSubtask(taskId, subtaskId);
    // Refrescar modal de detalle
    const updated = this.mockData.tasks().find(t => t.id === taskId);
    if (updated) {
      this.selectedTaskForDetail.set(updated);
    }
  }

  onAddComment(taskId: string, text: string): void {
    const actorName = this.roleService.isEncargado() ? 'Lic. Claudia Morales' : 'Jorge Técnico';
    const role = this.roleService.activeRole();
    this.mockData.addCommentToTask(taskId, text, actorName, role);

    // Refrescar modal de detalle
    const updated = this.mockData.tasks().find(t => t.id === taskId);
    if (updated) {
      this.selectedTaskForDetail.set(updated);
    }
  }

  onDeleteTask(taskId: string): void {
    this.mockData.deleteTask(taskId);
    this.selectedTaskForDetail.set(null);
  }

  printTasks(): void {
    window.print();
  }
}
