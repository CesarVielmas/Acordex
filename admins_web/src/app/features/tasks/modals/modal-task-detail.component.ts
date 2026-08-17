import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskItem, Role } from '../../../core/models/admin.models';
import { getCategoryBadgeClass, getPriorityBadgeClass, getStatusDotClass } from '../task-metrics';

/**
 * Modal de Detalle de Tarea con Subtareas Interactivas y Muro de Comentarios.
 */
@Component({
  selector: 'app-modal-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div class="w-full max-w-2xl rounded-3xl bg-[#1A1A1A] border border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">

        <!-- Encabezado -->
        <div class="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#141414] border border-white/10 text-outline">
                {{ task().id }}
              </span>
              @if (task().category) {
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-['Epilogue']" [class]="getCategoryBadgeClass(task().category)">
                  {{ task().category }}
                </span>
              }
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase font-mono" [class]="getPriorityBadgeClass(task().priority)">
                {{ task().priority }}
              </span>
            </div>

            <h3 class="text-base sm:text-lg font-black text-on-surface leading-snug font-['Epilogue']">{{ task().title }}</h3>
          </div>

          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-[#222222] text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Barra de Estado y Cambio Rápido -->
        <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div class="flex items-center gap-2 font-['Epilogue']">
            <span [class]="getStatusDotClass(task().status)" class="w-3 h-3 rounded-full"></span>
            <span class="text-xs text-outline font-bold">Estado Operativo:</span>
            <span class="text-xs font-black text-on-surface">{{ task().status }}</span>
          </div>

          <!-- Selector de Estado Rápido -->
          <div class="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              type="button"
              (click)="changeStatus.emit('Pendiente')"
              class="px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold cursor-pointer font-['Epilogue']"
              [class]="task().status === 'Pendiente' ? 'bg-amber-400 text-black shadow-md' : 'bg-[#202020] text-outline hover:text-on-surface'"
            >
              Pendiente
            </button>
            <button
              type="button"
              (click)="changeStatus.emit('En Proceso')"
              class="px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold cursor-pointer font-['Epilogue']"
              [class]="task().status === 'En Proceso' ? 'bg-cyan-400 text-black shadow-md' : 'bg-[#202020] text-outline hover:text-on-surface'"
            >
              En Proceso
            </button>
            <button
              type="button"
              (click)="changeStatus.emit('En Revisión')"
              class="px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold cursor-pointer font-['Epilogue']"
              [class]="task().status === 'En Revisión' ? 'bg-purple-400 text-white shadow-md' : 'bg-[#202020] text-outline hover:text-on-surface'"
            >
              En Revisión
            </button>
            <button
              type="button"
              (click)="changeStatus.emit('Completada')"
              class="px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold cursor-pointer font-['Epilogue']"
              [class]="task().status === 'Completada' ? 'bg-emerald-400 text-black shadow-md' : 'bg-[#202020] text-outline hover:text-on-surface'"
            >
              Completada
            </button>
          </div>
        </div>

        <!-- Descripción y Detalles -->
        <div class="space-y-3 text-xs">
          <div class="space-y-1">
            <span class="text-[10px] text-outline uppercase font-bold font-['Epilogue']">Especificaciones & Alcance Operativo</span>
            <p class="text-on-surface leading-relaxed p-3.5 rounded-2xl bg-[#141414] border border-white/5 font-['Epilogue']">
              {{ task().description || 'Sin descripción adicional capturada.' }}
            </p>
          </div>

          <!-- Metadatos de Responsable, Fecha y Proyecto -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3 rounded-xl bg-[#141414] border border-white/5 space-y-0.5">
              <span class="text-[10px] text-outline font-bold uppercase block font-['Epilogue']">Responsable</span>
              <span class="text-xs font-black text-on-surface font-['Epilogue']">{{ task().assignedTo }}</span>
            </div>

            <div class="p-3 rounded-xl bg-[#141414] border border-white/5 space-y-0.5">
              <span class="text-[10px] text-outline font-bold uppercase block font-['Epilogue']">Fecha Límite</span>
              <span class="text-xs font-mono font-black text-on-surface">{{ task().dueDate }} ({{ task().dueTime || '12:00 hrs' }})</span>
            </div>

            <div class="p-3 rounded-xl bg-[#141414] border border-white/5 space-y-0.5">
              <span class="text-[10px] text-outline font-bold uppercase block font-['Epilogue']">Proyecto Vinculado</span>
              <span class="text-xs font-bold text-primary truncate block font-['Epilogue']">{{ task().relatedTitle || task().eventName || 'Operaciones Generales' }}</span>
            </div>
          </div>
        </div>

        <!-- Checklist Interactivo de Subtareas -->
        <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-on-surface flex items-center gap-1.5 font-['Epilogue']">
              <span class="material-symbols-outlined text-emerald-400 text-base">checklist</span>
              Checklist de Control & Hitos
            </h4>
            <span class="text-[10px] font-mono text-outline">
              {{ completedSubtasksCount() }}/{{ (task().subtasks || []).length }} concluidas
            </span>
          </div>

          <div class="space-y-2">
            @for (st of task().subtasks || []; track st.id) {
              <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#181818] border border-white/5 cursor-pointer hover:border-primary/40 transition-all">
                <input
                  type="checkbox"
                  [checked]="st.completed"
                  (change)="toggleSubtask.emit(st.id)"
                  class="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <span class="text-xs text-on-surface font-['Epilogue']" [class.line-through]="st.completed" [class.text-outline]="st.completed">
                  {{ st.label }}
                </span>
              </label>
            } @empty {
              <p class="text-[11px] text-outline italic font-['Epilogue']">No hay subtareas definidas para esta asignación.</p>
            }
          </div>
        </div>

        <!-- Muro de Comentarios del Equipo -->
        <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-3">
          <h4 class="text-xs font-bold text-on-surface flex items-center gap-1.5 font-['Epilogue']">
            <span class="material-symbols-outlined text-cyan-400 text-base">chat</span>
            Bitácora de Campo & Comentarios
          </h4>

          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            @for (comm of task().comments || []; track comm.id) {
              <div class="p-2.5 rounded-xl bg-[#181818] border border-white/5 space-y-1 text-xs shadow-sm">
                <div class="flex justify-between items-center text-[10px]">
                  <span class="font-bold text-primary font-['Epilogue']">{{ comm.authorName }} ({{ comm.authorRole }})</span>
                  <span class="text-outline font-mono">{{ comm.createdAt }}</span>
                </div>
                <p class="text-on-surface text-[11px] font-['Epilogue']">{{ comm.text }}</p>
              </div>
            } @empty {
              <p class="text-[11px] text-outline italic font-['Epilogue']">No hay registros de bitácora aún. Ingrese una actualización operativa.</p>
            }
          </div>

          <!-- Input para nuevo comentario -->
          <div class="flex items-center gap-2 pt-2 border-t border-white/5">
            <input
              type="text"
              [(ngModel)]="newCommentText"
              (keyup.enter)="submitComment()"
              placeholder="Escribir una actualización en la bitácora..."
              class="flex-1 px-3 py-2 rounded-xl bg-[#181818] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
            />
            <button
              type="button"
              (click)="submitComment()"
              [disabled]="!newCommentText.trim()"
              class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-on-primary font-bold text-xs hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer font-['Epilogue']"
            >
              <span class="material-symbols-outlined text-sm">send</span> Registrar
            </button>
          </div>
        </div>

        <!-- Footer con Botones de Acción -->
        <div class="flex items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
          <button
            type="button"
            (click)="delete.emit(task().id)"
            class="px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold transition-all flex items-center gap-1 cursor-pointer font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-base">delete</span>
            Eliminar Asignación
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="edit.emit(task())"
              class="px-4 py-2 rounded-xl bg-[#222222] hover:bg-[#282828] text-on-surface font-bold transition-all flex items-center gap-1.5 cursor-pointer font-['Epilogue']"
            >
              <span class="material-symbols-outlined text-base">edit</span>
              Editar
            </button>
            <button
              type="button"
              (click)="closed.emit()"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-on-primary font-bold hover:opacity-95 transition-all cursor-pointer font-['Epilogue']"
            >
              Concluir
            </button>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ModalTaskDetailComponent {
  task = input.required<TaskItem>();
  closed = output<void>();
  edit = output<TaskItem>();
  delete = output<string>();
  changeStatus = output<TaskItem['status']>();
  toggleSubtask = output<string>();
  addComment = output<string>();

  newCommentText = '';

  completedSubtasksCount(): number {
    return (this.task().subtasks || []).filter(s => s.completed).length;
  }

  submitComment(): void {
    if (!this.newCommentText.trim()) return;
    this.addComment.emit(this.newCommentText.trim());
    this.newCommentText = '';
  }

  getCategoryBadgeClass = getCategoryBadgeClass;
  getPriorityBadgeClass = getPriorityBadgeClass;
  getStatusDotClass = getStatusDotClass;
}
