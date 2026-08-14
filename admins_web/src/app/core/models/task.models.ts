/**
 * Modelos avanzados para el módulo de Tareas y Operación de Acordex.
 *
 * Conecta las tareas operativas con:
 * 1. Eventos Masivos (Montaje, audio, permisos, seguridad, camerinos)
 * 2. Cotizaciones Privadas (Rider de bodas, viáticos, anticipos)
 * 3. Talento (Mantenimiento de instrumentos, visas, sesiones de fotos)
 * 4. Finanzas (Cobranza de facturas, liquidación de proveedores)
 */

import { Role, TaskPrivacy } from './admin.models';

export type TaskCategory =
  | 'Producción & Escenario'
  | 'Logística & Hospedaje'
  | 'Legal & Permisos'
  | 'Hospitalidad & Camerinos'
  | 'Finanzas & Cobranza'
  | 'Prensa & Marketing'
  | 'Talento & Backline'
  | 'Operación General';

export type TaskPriority = 'Urgente' | 'Alta' | 'Media' | 'Baja';

export type TaskStatus =
  | 'Pendiente'
  | 'En Proceso'
  | 'En Revisión'
  | 'Completada'
  | 'Cancelada';

export interface TaskSubtask {
  id: string;
  label: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  authorName: string;
  authorRole: Role;
  authorAvatar?: string;
  text: string;
  createdAt: string; // ISO string o formato legible
}

export interface TaskAttachment {
  name: string;
  url?: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
  size?: string;
}

export interface TaskItemDetailed {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  privacy: TaskPrivacy;
  status: TaskStatus;
  dueDate: string;       // 'YYYY-MM-DD'
  dueTime?: string;      // '18:00 hrs'
  assignedTo: string;
  assignedRole: Role;
  assignedAvatar?: string;

  // Relación con otros módulos
  relatedToType?: 'evento' | 'cotizacion' | 'grupo' | 'finanzas' | 'general';
  relatedId?: string;
  relatedTitle?: string;

  // Subtareas y Colaboración
  subtasks: TaskSubtask[];
  comments: TaskComment[];
  attachments?: TaskAttachment[];

  completedAt?: string;
  completedBy?: string;
}

export interface TaskProjectGroup {
  projectId: string;
  projectTitle: string;
  projectType: 'evento' | 'cotizacion' | 'grupo' | 'general' | 'finanzas';
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  tasks: TaskItemDetailed[];
}

export interface TeamMemberWorkload {
  memberName: string;
  memberRole: Role;
  avatar?: string;
  totalAssigned: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  urgentCount: number;
  efficiencyPercent: number;
}
