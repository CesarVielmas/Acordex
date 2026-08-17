import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskItem, TaskPrivacy, Role } from '../../../core/models/admin.models';
import { EventItem, Quote, GroupItem } from '../../../core/models/admin.models';

/**
 * Modal de Creación / Edición Completa de Tareas de Acordex.
 */
@Component({
  selector: 'app-modal-task-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div class="w-full max-w-2xl rounded-3xl bg-[#1A1A1A] border border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-xl shadow-inner">
              {{ isEditing() ? 'edit_note' : 'add_task' }}
            </span>
            <div>
              <h3 class="text-base sm:text-lg font-black text-on-surface font-['Epilogue']">
                {{ isEditing() ? 'Editar Asignación Operativa' : 'Nueva Asignación de Campo & Producción' }}
              </h3>
              <p class="text-xs text-outline font-['Epilogue']">Asignación de responsabilidades, plazos de entrega y requerimientos técnicos</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-[#222222] text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Formulario -->
        <div class="space-y-4 text-xs">

          <!-- 1. TÍTULO -->
          <div class="space-y-1.5">
            <label class="font-bold text-on-surface font-['Epilogue']">Título de la Asignación <span class="text-rose-400">*</span></label>
            <input
              type="text"
              [(ngModel)]="formTitle"
              placeholder="Ej. Trámite y validación de permisos de Protección Civil Municipal"
              class="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
            />
          </div>

          <!-- 2. DESCRIPCIÓN -->
          <div class="space-y-1.5">
            <label class="font-bold text-on-surface font-['Epilogue']">Alcance Operativo & Especificaciones Técnicas</label>
            <textarea
              [(ngModel)]="formDescription"
              rows="3"
              placeholder="Instrucciones específicas, contactos con proveedores, requerimientos de montaje..."
              class="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
            ></textarea>
          </div>

          <!-- 3. CATEGORÍA & PRIORIDAD -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Categoría de Operación</label>
              <select
                [(ngModel)]="formCategory"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
              >
                <option value="Producción & Escenario">Producción & Escenario</option>
                <option value="Logística & Hospedaje">Logística & Hospedaje</option>
                <option value="Legal & Permisos">Legal & Permisos</option>
                <option value="Hospitalidad & Camerinos">Hospitalidad & Camerinos</option>
                <option value="Finanzas & Cobranza">Finanzas & Cobranza</option>
                <option value="Prensa & Marketing">Prensa & Marketing</option>
                <option value="Talento & Backline">Talento & Backline</option>
                <option value="Operación General">Operación General</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Nivel de Prioridad</label>
              <select
                [(ngModel)]="formPriority"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
              >
                <option value="Urgente">🚨 Prioridad Crítica (Atención Inmediata)</option>
                <option value="Alta">Prioridad Alta</option>
                <option value="Media">Prioridad Media</option>
                <option value="Baja">Prioridad Ordinaria / Baja</option>
              </select>
            </div>
          </div>

          <!-- 4. VINCULACIÓN CON EVENTO / COTIZACIÓN / GRUPO -->
          <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-3 shadow-inner">
            <label class="font-bold text-on-surface flex items-center gap-1.5 font-['Epilogue']">
              <span class="material-symbols-outlined text-primary text-sm">link</span>
              Vinculación a Proyecto / Producción Real:
            </label>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <span class="text-[10px] text-outline uppercase font-bold font-['Epilogue']">Origen del Proyecto</span>
                <select
                  [(ngModel)]="formRelatedType"
                  (ngModelChange)="onRelatedTypeChange()"
                  class="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
                >
                  <option value="general">Operación General (Sin Vincular)</option>
                  <option value="evento">Evento Masivo / Palenque</option>
                  <option value="cotizacion">Cotización / Contratación Privada</option>
                  <option value="grupo">Grupo / Agrupación Musical</option>
                </select>
              </div>

              <!-- Selector específico según tipo -->
              <div class="space-y-1">
                <span class="text-[10px] text-outline uppercase font-bold font-['Epilogue']">Seleccionar Expediente</span>
                @if (formRelatedType === 'evento') {
                  <select
                    [(ngModel)]="formRelatedId"
                    (ngModelChange)="onEventSelected($event)"
                    class="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
                  >
                    <option value="">Selecciona un evento...</option>
                    @for (e of events(); track e.id) {
                      <option [value]="e.id">{{ e.title }} ({{ e.date }})</option>
                    }
                  </select>
                } @else if (formRelatedType === 'cotizacion') {
                  <select
                    [(ngModel)]="formRelatedId"
                    (ngModelChange)="onQuoteSelected($event)"
                    class="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
                  >
                    <option value="">Selecciona una cotización...</option>
                    @for (q of quotes(); track q.id) {
                      <option [value]="q.id">{{ q.clientName }} - {{ q.eventType }} ({{ q.groupName }})</option>
                    }
                  </select>
                } @else if (formRelatedType === 'grupo') {
                  <select
                    [(ngModel)]="formRelatedId"
                    (ngModelChange)="onGroupSelected($event)"
                    class="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
                  >
                    <option value="">Selecciona un grupo...</option>
                    @for (g of groups(); track g.id) {
                      <option [value]="g.id">{{ g.name }} ({{ g.genre }})</option>
                    }
                  </select>
                } @else {
                  <div class="p-2 text-outline text-[11px] italic font-['Epilogue']">No vinculado a un expediente específico.</div>
                }
              </div>
            </div>
          </div>

          <!-- 5. RESPONSABLE, PRIVACIDAD & FECHA -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Responsable Asignado</label>
              <select
                [(ngModel)]="formAssignedTo"
                (ngModelChange)="onAssigneeChange($event)"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
              >
                <option value="Lic. Claudia Morales">Lic. Claudia Morales (Encargado)</option>
                <option value="Ing. Mateo Rivas">Ing. Mateo Rivas (Encargado)</option>
                <option value="Jorge Técnico">Jorge Técnico (Audio & Staff)</option>
                <option value="Mariana Staff">Mariana Staff (Prensa & Logística)</option>
                <option value="Carlos Chofer">Carlos Chofer (Transporte)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Nivel de Privacidad</label>
              <select
                [(ngModel)]="formPrivacy"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
              >
                <option value="Pública">Pública (Visible para todo el staff)</option>
                <option value="Delicada">Delicada (Encargado y Admin)</option>
                <option value="Privada">Privada (Solo Encargado)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Fecha Límite</label>
              <input
                type="date"
                [(ngModel)]="formDueDate"
                class="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-white/10 text-on-surface focus:outline-none focus:border-primary text-xs font-mono shadow-inner"
              />
            </div>
          </div>

          <!-- 6. SUBTAREAS CHECKLIST -->
          <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-3 shadow-inner">
            <div class="flex items-center justify-between">
              <label class="font-bold text-on-surface flex items-center gap-1.5 font-['Epilogue']">
                <span class="material-symbols-outlined text-emerald-400 text-sm">checklist</span>
                Hitos y Checklist Operativo (Opcional):
              </label>
              <span class="text-[10px] text-outline font-mono">{{ formSubtasks.length }} pasos</span>
            </div>

            <!-- Lista de subtareas -->
            <div class="space-y-2">
              @for (st of formSubtasks; track st.id; let idx = $index) {
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    [(ngModel)]="st.completed"
                    class="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                  />
                  <input
                    type="text"
                    [(ngModel)]="st.label"
                    placeholder="Descripción del paso..."
                    class="flex-1 px-3 py-1.5 rounded-lg bg-[#181818] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
                  />
                  <button
                    type="button"
                    (click)="removeSubtask(idx)"
                    class="p-1 text-outline hover:text-rose-400 cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              }
            </div>

            <!-- Agregar subtarea -->
            <div class="flex items-center gap-2 pt-1">
              <input
                type="text"
                [(ngModel)]="newSubtaskLabel"
                (keyup.enter)="addSubtask()"
                placeholder="Añadir hito operativo y presionar Enter..."
                class="flex-1 px-3 py-2 rounded-xl bg-[#181818] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
              />
              <button
                type="button"
                (click)="addSubtask()"
                class="px-3 py-2 rounded-xl bg-[#222222] hover:bg-primary hover:text-on-primary font-bold text-xs transition-all flex items-center gap-1 cursor-pointer font-['Epilogue']"
              >
                <span class="material-symbols-outlined text-sm">add</span> Añadir
              </button>
            </div>
          </div>

        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-[#222222] hover:bg-[#282828] text-outline hover:text-on-surface text-xs font-bold transition-all cursor-pointer font-['Epilogue']"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="submitForm()"
            [disabled]="!formTitle.trim()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-on-primary text-xs font-black shadow-lg shadow-primary/20 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-base">save</span>
            {{ isEditing() ? 'Guardar Asignación' : 'Registrar Asignación' }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalTaskEditorComponent {
  taskToEdit = input<TaskItem | null>(null);
  events = input<EventItem[]>([]);
  quotes = input<Quote[]>([]);
  groups = input<GroupItem[]>([]);

  saved = output<TaskItem>();
  closed = output<void>();

  isEditing = signal(false);

  formTitle = '';
  formDescription = '';
  formCategory: any = 'Producción & Escenario';
  formPriority: any = 'Media';
  formPrivacy: TaskPrivacy = 'Pública';
  formAssignedTo = 'Jorge Técnico';
  formAssignedRole: Role = 'usuario';
  formDueDate = '2026-08-20';
  formDueTime = '12:00 hrs';

  formRelatedType: any = 'general';
  formRelatedId = '';
  formRelatedTitle = '';

  formSubtasks: { id: string; label: string; completed: boolean }[] = [];
  newSubtaskLabel = '';

  ngOnInit(): void {
    const edit = this.taskToEdit();
    if (edit) {
      this.isEditing.set(true);
      this.formTitle = edit.title;
      this.formDescription = edit.description;
      this.formCategory = edit.category || 'Operación General';
      this.formPriority = edit.priority;
      this.formPrivacy = edit.privacy;
      this.formAssignedTo = edit.assignedTo;
      this.formAssignedRole = edit.assignedRole;
      this.formDueDate = edit.dueDate;
      this.formDueTime = edit.dueTime || '12:00 hrs';
      this.formRelatedType = edit.relatedToType || (edit.eventName ? 'evento' : 'general');
      this.formRelatedId = edit.relatedId || '';
      this.formRelatedTitle = edit.relatedTitle || edit.eventName || '';
      this.formSubtasks = (edit.subtasks || []).map(s => ({ ...s }));
    }
  }

  onRelatedTypeChange(): void {
    this.formRelatedId = '';
    this.formRelatedTitle = '';
  }

  onEventSelected(eventId: string): void {
    const ev = this.events().find(e => e.id === eventId);
    if (ev) {
      this.formRelatedTitle = ev.title;
    }
  }

  onQuoteSelected(quoteId: string): void {
    const q = this.quotes().find(item => item.id === quoteId);
    if (q) {
      this.formRelatedTitle = `${q.clientName} - ${q.eventType}`;
    }
  }

  onGroupSelected(groupId: string): void {
    const g = this.groups().find(item => item.id === groupId);
    if (g) {
      this.formRelatedTitle = g.name;
    }
  }

  onAssigneeChange(name: string): void {
    if (name.includes('Claudia') || name.includes('Mateo')) {
      this.formAssignedRole = 'encargado';
    } else {
      this.formAssignedRole = 'usuario';
    }
  }

  addSubtask(): void {
    if (!this.newSubtaskLabel.trim()) return;
    this.formSubtasks.push({
      id: `st-${Date.now()}`,
      label: this.newSubtaskLabel.trim(),
      completed: false
    });
    this.newSubtaskLabel = '';
  }

  removeSubtask(index: number): void {
    this.formSubtasks.splice(index, 1);
  }

  submitForm(): void {
    if (!this.formTitle.trim()) return;

    const task: TaskItem = {
      id: this.taskToEdit()?.id || `TSK-${Math.floor(10 + Math.random() * 90)}`,
      title: this.formTitle.trim(),
      description: this.formDescription.trim(),
      category: this.formCategory,
      priority: this.formPriority,
      privacy: this.formPrivacy,
      status: this.taskToEdit()?.status || 'Pendiente',
      dueDate: this.formDueDate,
      dueTime: this.formDueTime,
      assignedTo: this.formAssignedTo,
      assignedRole: this.formAssignedRole,
      relatedToType: this.formRelatedType,
      relatedId: this.formRelatedId,
      relatedTitle: this.formRelatedTitle,
      eventName: this.formRelatedType === 'evento' ? this.formRelatedTitle : undefined,
      subtasks: this.formSubtasks,
      comments: this.taskToEdit()?.comments || []
    };

    this.saved.emit(task);
  }
}
