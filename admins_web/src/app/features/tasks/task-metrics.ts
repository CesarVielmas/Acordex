/**
 * Funciones de cálculo analítico y derivaciones reactivas para el módulo de Tareas.
 */

import { TaskItem, Role } from '../../core/models/admin.models';
import {
  TaskProjectGroup,
  TeamMemberWorkload,
  TaskPriority,
  TaskStatus,
  TaskCategory
} from '../../core/models/task.models';

export interface TasksOverviewKPIs {
  totalTasks: number;
  pendingCount: number;
  inProgressCount: number;
  inReviewCount: number;
  completedCount: number;
  urgentCount: number;
  overdueCount: number;
  dueTodayCount: number;
  completionRatePercent: number;
}

export function calculateTasksKPIs(tasks: TaskItem[], todayIso: string = '2026-08-15'): TasksOverviewKPIs {
  const total = tasks.length;
  const pendingCount = tasks.filter(t => t.status === 'Pendiente').length;
  const inProgressCount = tasks.filter(t => t.status === 'En Proceso').length;
  const inReviewCount = tasks.filter(t => t.status === 'En Revisión').length;
  const completedCount = tasks.filter(t => t.status === 'Completada').length;
  const urgentCount = tasks.filter(t => t.priority === 'Urgente' && t.status !== 'Completada').length;

  const overdueCount = tasks.filter(t => t.status !== 'Completada' && t.dueDate && t.dueDate < todayIso).length;
  const dueTodayCount = tasks.filter(t => t.status !== 'Completada' && t.dueDate === todayIso).length;

  const completionRatePercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return {
    totalTasks: total,
    pendingCount,
    inProgressCount,
    inReviewCount,
    completedCount,
    urgentCount,
    overdueCount,
    dueTodayCount,
    completionRatePercent
  };
}

export function groupTasksByProject(tasks: TaskItem[]): TaskProjectGroup[] {
  const projectMap = new Map<string, { title: string; type: 'evento' | 'cotizacion' | 'grupo' | 'general' | 'finanzas'; tasks: TaskItem[] }>();

  for (const t of tasks) {
    const key = t.relatedId || t.eventName || 'GENERAL';
    const title = t.relatedTitle || t.eventName || 'Operaciones Generales de Acordex';
    const type: 'evento' | 'cotizacion' | 'grupo' | 'general' | 'finanzas' = t.relatedToType || (t.eventName ? 'evento' : 'general');

    let entry = projectMap.get(key);
    if (!entry) {
      entry = { title, type, tasks: [] };
      projectMap.set(key, entry);
    }
    entry.tasks.push(t);
  }

  const groups: TaskProjectGroup[] = [];
  for (const [projectId, data] of projectMap.entries()) {
    const totalTasks = data.tasks.length;
    const completedTasks = data.tasks.filter(t => t.status === 'Completada').length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    groups.push({
      projectId,
      projectTitle: data.title,
      projectType: data.type,
      totalTasks,
      completedTasks,
      progressPercent,
      tasks: data.tasks as any
    });
  }

  return groups.sort((a, b) => b.totalTasks - a.totalTasks);
}

export function calculateTeamWorkload(tasks: TaskItem[]): TeamMemberWorkload[] {
  const teamMap = new Map<string, { role: Role; tasks: TaskItem[] }>();

  for (const t of tasks) {
    const name = t.assignedTo || 'Sin Asignar';
    const role = t.assignedRole || 'usuario';

    const entry = teamMap.get(name) || { role, tasks: [] };
    entry.tasks.push(t);
    teamMap.set(name, entry);
  }

  const list: TeamMemberWorkload[] = [];
  for (const [memberName, data] of teamMap.entries()) {
    const totalAssigned = data.tasks.length;
    const pendingCount = data.tasks.filter(t => t.status === 'Pendiente').length;
    const inProgressCount = data.tasks.filter(t => t.status === 'En Proceso').length;
    const completedCount = data.tasks.filter(t => t.status === 'Completada').length;
    const urgentCount = data.tasks.filter(t => t.priority === 'Urgente' && t.status !== 'Completada').length;

    const efficiencyPercent = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 100;

    list.push({
      memberName,
      memberRole: data.role,
      totalAssigned,
      pendingCount,
      inProgressCount,
      completedCount,
      urgentCount,
      efficiencyPercent
    });
  }

  return list.sort((a, b) => b.totalAssigned - a.totalAssigned);
}

export function getCategoryBadgeClass(category?: string): string {
  switch (category) {
    case 'Producción & Escenario': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    case 'Logística & Hospedaje': return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'Legal & Permisos': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
    case 'Hospitalidad & Camerinos': return 'bg-pink-500/15 text-pink-300 border-pink-500/30';
    case 'Finanzas & Cobranza': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Prensa & Marketing': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'Talento & Backline': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    default: return 'bg-surface-container-highest text-outline border-outline-variant/30';
  }
}

export function getPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'Urgente': return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
    case 'Alta': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'Media': return 'bg-primary/20 text-primary border-primary/40';
    case 'Baja': return 'bg-surface-container-highest text-outline border-outline-variant/30';
    default: return 'bg-surface-container-highest text-outline border-outline-variant/30';
  }
}

export function getStatusDotClass(status: string): string {
  switch (status) {
    case 'Pendiente': return 'bg-amber-400';
    case 'En Proceso': return 'bg-cyan-400';
    case 'En Revisión': return 'bg-purple-400';
    case 'Completada': return 'bg-emerald-400';
    case 'Cancelada': return 'bg-rose-400';
    default: return 'bg-outline';
  }
}
