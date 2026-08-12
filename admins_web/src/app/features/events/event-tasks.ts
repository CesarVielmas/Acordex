import { EventItem, EventTask, EventActivity, ActorRef } from '../../core/models/event.models';
import { EventDetailTab } from './components/event-detail-modal.component';
import { eventCompleteness, CompletenessItem } from './event-completeness';

export interface ResolvedTask extends EventTask {
  /** Estado real. En las de sistema lo manda el checklist, siempre. */
  done: boolean;
  /** Punto vivo del checklist, para el texto de ayuda y los responsables. */
  checklist?: CompletenessItem;
  /** True si su ausencia impide enviar a revisión. */
  blocking: boolean;
  /** Nunca se guardó: esta tarea de sistema aún no la asigna nadie. */
  virtual: boolean;
}

/**
 * Resuelve las tareas del evento cruzando las guardadas con los 33 puntos
 * vivos del checklist.
 */
export function resolveTasks(e: EventItem): ResolvedTask[] {
  const report = eventCompleteness(e);
  const checklistItems = report.items;
  const storedTasks = e.tasks || [];
  const storedMap = new Map<string, EventTask>();

  for (const t of storedTasks) {
    if (t.checklistItemId) {
      storedMap.set(t.checklistItemId, t);
    }
  }

  const resolved: ResolvedTask[] = [];

  // 1. Tareas de sistema basadas en el checklist
  for (const item of checklistItems) {
    const existing = storedMap.get(item.id);
    if (existing) {
      resolved.push({
        ...existing,
        title: item.label,
        detail: item.hint,
        group: item.group,
        done: item.done, // SIEMPRE lo manda el checklist
        checklist: item,
        blocking: item.required,
        virtual: false
      });
    } else {
      // Tarea virtual sintetizada
      resolved.push({
        id: `task-sys-${item.id}`,
        kind: 'sistema',
        title: item.label,
        detail: item.hint,
        group: item.group,
        checklistItemId: item.id,
        status: 'abierta',
        priority: item.required ? 'Alta' : 'Media',
        createdBy: { name: 'sistema', managerName: 'sistema', rank: 'sistema' },
        createdAt: e.createdAt || new Date().toISOString(),
        done: item.done,
        checklist: item,
        blocking: item.required,
        virtual: true
      });
    }
  }

  // 2. Tareas externas
  for (const t of storedTasks) {
    if (t.kind === 'externa') {
      resolved.push({
        ...t,
        done: t.status === 'completada',
        blocking: false,
        virtual: false
      });
    }
  }

  // 3. Ordenamiento: bloqueantes -> externas -> recomendadas -> completadas
  return resolved.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.blocking !== b.blocking) return a.blocking ? -1 : 1;
    if (a.kind !== b.kind) return a.kind === 'externa' ? -1 : 1;
    return 0;
  });
}

/**
 * Compara el checklist antes y después de una edición para cerrar o reabrir
 * automáticamente las tareas de sistema.
 */
export function reconcileTasks(
  before: EventItem,
  after: EventItem,
  actor: ActorRef
): { tasks: EventTask[]; activity: EventActivity[] } | null {
  const beforeComp = eventCompleteness(before);
  const afterComp = eventCompleteness(after);

  const beforeMap = new Map(beforeComp.items.map(i => [i.id, i]));
  const afterMap = new Map(afterComp.items.map(i => [i.id, i]));

  const currentTasks = [...(after.tasks || [])];
  const newActivities: EventActivity[] = [];
  let changed = false;
  const now = new Date().toISOString().slice(0, 16);

  for (const [id, afterItem] of afterMap.entries()) {
    const beforeItem = beforeMap.get(id);
    if (!beforeItem) continue;

    // Pasó de NO cumplido a CUMPLIDO
    if (!beforeItem.done && afterItem.done) {
      changed = true;
      let taskIdx = currentTasks.findIndex(t => t.checklistItemId === id);
      if (taskIdx === -1) {
        // Materializar tarea de sistema si era virtual
        const newTask: EventTask = {
          id: `task-${id}-${Date.now()}`,
          kind: 'sistema',
          title: afterItem.label,
          detail: afterItem.hint,
          group: afterItem.group,
          checklistItemId: id,
          status: 'completada',
          priority: afterItem.required ? 'Alta' : 'Media',
          createdBy: { name: 'sistema', managerName: 'sistema', rank: 'sistema' },
          createdAt: now,
          completedAt: now,
          completedBy: actor,
          autoCompleted: true
        };
        currentTasks.push(newTask);
      } else {
        currentTasks[taskIdx] = {
          ...currentTasks[taskIdx],
          status: 'completada',
          completedAt: now,
          completedBy: actor,
          autoCompleted: true
        };
      }

      newActivities.push({
        id: `act-task-done-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        at: now,
        actor,
        channel: 'tareas',
        kind: 'completada',
        summary: `${actor.name} completó «${afterItem.label}»`,
        targetId: id
      });
    }

    // Pasó de CUMPLIDO a NO CUMPLIDO (reapertura)
    else if (beforeItem.done && !afterItem.done) {
      changed = true;
      let taskIdx = currentTasks.findIndex(t => t.checklistItemId === id);
      if (taskIdx !== -1) {
        const t = currentTasks[taskIdx];
        const nextStatus = t.assignedManager ? 'asignada' : 'abierta';
        currentTasks[taskIdx] = {
          ...t,
          status: nextStatus,
          completedAt: undefined,
          completedBy: undefined,
          autoCompleted: false
        };
      }

      newActivities.push({
        id: `act-task-reopen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        at: now,
        actor,
        channel: 'tareas',
        kind: 'reapertura',
        summary: `Se reabrió «${afterItem.label}»: el dato se vació`,
        targetId: id
      });
    }
  }

  if (!changed) return null;
  return { tasks: currentTasks, activity: newActivities };
}

/**
 * Mapea la id de un punto del checklist a la pestaña del modal de evento
 * donde se captura ese dato ("Ir al dato").
 */
export function getTabForChecklistItem(id: string): EventDetailTab {
  switch (id) {
    case 'flyer':
    case 'tagline':
    case 'coverUrl':
    case 'aboutText':
    case 'greetingVideos':
    case 'rules':
      return 'evento';
    case 'croquis':
    case 'ticketTiers':
    case 'salesCloseDaysBefore':
    case 'maxTicketsPerPurchase':
    case 'ticketSupportPhone':
    case 'venueAddress':
      return 'boletaje';
    case 'lineup':
    case 'schedule':
    case 'groupSoundChecks':
    case 'invitationVideos':
      return 'cartel';
    case 'sound':
    case 'productionItems':
    case 'responsibilities':
      return 'produccion';
    case 'managerAgreements':
    case 'coProductionPartner':
    case 'splitPercent':
      return 'acuerdos';
    default:
      return 'evento';
  }
}
