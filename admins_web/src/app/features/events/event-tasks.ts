import { EventItem, EventTask, EventActivity, ActorRef, EventProductionItem, EventTaskChangeProposal } from '../../core/models/event.models';
import { EventDetailTab } from './components/event-detail-modal.component';
import { eventCompleteness, CompletenessItem } from './event-completeness';

export interface ResolvedTask extends EventTask {
  /** Estado real. En las de sistema lo manda el checklist, siempre. */
  done: boolean;
  /** Punto vivo del checklist, para el texto de ayuda y los responsables. */
  checklist?: CompletenessItem;
  /**
   * El expediente no se puede publicar sin esto.
   *
   * Ya no dice "no puedes enviar a revisión": un borrador se manda a revisar
   * cuando su dueño quiere, y para eso es la revisión. Lo que de verdad no puede
   * pasar es que salga al público un evento sin fecha, sin recinto o sin precios,
   * y ese es el momento en el que esto pesa.
   */
  blocking: boolean;
  /** Nunca se guardó: esta tarea de sistema aún no la asigna nadie. */
  virtual: boolean;
  /**
   * Los gastos que salieron de esta tarea.
   *
   * En plural porque un encargo casi nunca es un solo gasto: "contratar el
   * audio" son la consola, las bocinas y el operador. Con una sola partida el
   * manager tenía que elegir cuál de las tres apuntar, o inventarse tres tareas
   * para un encargo que era uno.
   */
  productionItems: EventProductionItem[];
  /** Lo que suman esas partidas. */
  productionTotal: number;
}

/** Las partidas del desglose que salieron de esta tarea, sin repetir. */
export function taskProductionItems(t: EventTask, prodItems: EventProductionItem[]): EventProductionItem[] {
  const found = prodItems.filter(p => p.taskId === t.id);

  // Las tareas guardadas antes de que la liga viviera del lado de la partida
  // apuntan al revés. Se recogen igual, y sin duplicar la que apunte por los dos
  // lados a la vez.
  if (t.productionItemId && !found.some(p => p.id === t.productionItemId)) {
    const legacy = prodItems.find(p => p.id === t.productionItemId);
    if (legacy) found.unshift(legacy);
  }

  return found;
}

/**
 * Resuelve las tareas del evento cruzando las guardadas con los puntos vivos del
 * checklist y colgándoles su desglose de producción.
 */
export function resolveTasks(e: EventItem): ResolvedTask[] {
  const report = eventCompleteness(e);
  const checklistItems = report.items;
  const storedTasks = e.tasks || [];
  const prodItems = e.productionItems || [];
  const storedMap = new Map<string, EventTask>();

  for (const t of storedTasks) {
    if (t.checklistItemId) {
      storedMap.set(t.checklistItemId, t);
    }
  }

  const resolved: ResolvedTask[] = [];

  const withProduction = (t: EventTask) => {
    const items = taskProductionItems(t, prodItems);
    return { productionItems: items, productionTotal: items.reduce((s, p) => s + (p.amount || 0), 0) };
  };

  // 1. Tareas de sistema basadas en el checklist
  for (const item of checklistItems) {
    const existing = storedMap.get(item.id);
    if (existing) {
      resolved.push({
        ...existing,
        title: item.label,
        detail: item.hint,
        group: item.group,
        formSectionRef: existing.formSectionRef || item.id,
        done: item.done, // SIEMPRE lo manda el checklist
        checklist: item,
        blocking: item.required,
        virtual: false,
        ...withProduction(existing)
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
        formSectionRef: item.id,
        status: 'abierta',
        priority: item.required ? 'Alta' : 'Media',
        createdBy: { name: 'sistema', managerName: 'sistema', rank: 'sistema' },
        createdAt: e.createdAt || new Date().toISOString(),
        done: item.done,
        checklist: item,
        blocking: item.required,
        virtual: true,
        productionItems: [],
        productionTotal: 0
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
        virtual: false,
        ...withProduction(t)
      });
    }
  }

  // 3. Arriba lo que le pide algo a alguien ahora mismo.
  return resolved.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const aPending = a.status === 'pendiente-aprobacion' || !!a.pendingTransfer;
    const bPending = b.status === 'pendiente-aprobacion' || !!b.pendingTransfer;
    if (aPending !== bPending) return aPending ? -1 : 1;
    if (a.blocking !== b.blocking) return a.blocking ? -1 : 1;
    if (a.kind !== b.kind) return a.kind === 'externa' ? -1 : 1;
    return 0;
  });
}

/**
 * Determina si una tarea obligatoria o de campo está desbloqueada para edición por el actor actual.
 * Si pertenece a otro manager y NO ha sido intervenida, retorna false (bloqueado).
 */
export function isTaskUnlockedForActor(
  event: EventItem,
  checklistItemId: string,
  actorManagerName: string
): boolean {
  const tasks = resolveTasks(event);
  const task = tasks.find(t =>
    t.checklistItemId === checklistItemId ||
    t.formSectionRef === checklistItemId ||
    t.id === `task-sys-${checklistItemId}` ||
    (checklistItemId === 'coverUrl' && (t.checklistItemId === 'portada' || t.formSectionRef === 'coverUrl')) ||
    (checklistItemId === 'posterUrl' && (t.checklistItemId === 'cartel_oficial' || t.formSectionRef === 'posterUrl')) ||
    (checklistItemId === 'ticketTiers' && (t.checklistItemId === 'boletos' || t.formSectionRef === 'ticketTiers')) ||
    (checklistItemId === 'schedule' && (t.checklistItemId === 'corrida' || t.checklistItemId === 'orden' || t.formSectionRef === 'schedule')) ||
    (checklistItemId === 'sound' && (t.checklistItemId === 'sonido' || t.formSectionRef === 'sound')) ||
    (checklistItemId === 'videos_grupos' && (t.checklistItemId === 'videos_grupos' || t.formSectionRef === 'videos_grupos' || t.formSectionRef === 'greetingVideos'))
  );

  if (!task) return true;

  const assigned = task.assignedManager || event.ownerManagerName || event.createdBy;
  const isMine = assigned === actorManagerName || actorManagerName === 'Encargado Acordex';
  const hasIntervened = !!task.intervenedBy || (task.completedBy && task.completedBy.managerName === actorManagerName);

  return isMine || hasIntervened || task.done;
}

export interface InterceptSaveResult {
  applyDirectly: boolean;
  isProposalCreated: boolean;
  message: string;
  updatedEvent: Partial<EventItem>;
}

/**
 * Intercepta la edición de campos vinculados a tareas obligatorias.
 * Si la tarea obligatoria ya fue completada por algún manager, y quien edita ahora NO ES
 * el manager encargado asignado, se genera una propuesta de modificación pendiente.
 */
export function interceptFieldSave(
  event: EventItem,
  checklistItemId: string,
  fieldLabel: string,
  actor: ActorRef,
  patchData: Partial<EventItem>,
  previousValues?: Record<string, any>
): InterceptSaveResult {
  const tasks = resolveTasks(event);
  const task = tasks.find(t =>
    t.checklistItemId === checklistItemId ||
    t.formSectionRef === checklistItemId ||
    t.id === `task-sys-${checklistItemId}` ||
    (checklistItemId === 'coverUrl' && (t.checklistItemId === 'portada' || t.formSectionRef === 'coverUrl')) ||
    (checklistItemId === 'posterUrl' && (t.checklistItemId === 'cartel_oficial' || t.formSectionRef === 'posterUrl')) ||
    (checklistItemId === 'ticketTiers' && (t.checklistItemId === 'boletos' || t.formSectionRef === 'ticketTiers')) ||
    (checklistItemId === 'schedule' && (t.checklistItemId === 'corrida' || t.checklistItemId === 'orden' || t.formSectionRef === 'schedule')) ||
    (checklistItemId === 'sound' && (t.checklistItemId === 'sonido' || t.formSectionRef === 'sound')) ||
    (checklistItemId === 'videos_grupos' && (t.checklistItemId === 'videos_grupos' || t.formSectionRef === 'videos_grupos' || t.formSectionRef === 'greetingVideos'))
  );

  const ownerMgr = task?.completedBy?.managerName || task?.assignedManager || event.ownerManagerName || event.createdBy;
  const isOwner = ownerMgr === actor.managerName;

  if (task && task.done && !isOwner) {
    const proposal: EventTaskChangeProposal = {
      id: 'prop-' + Date.now(),
      proposedBy: actor,
      proposedAt: new Date().toISOString().slice(0, 16),
      fieldLabel,
      proposedChanges: patchData,
      previousValues: previousValues || {},
      status: 'pendiente'
    };

    const updatedTasks = (event.tasks || []).map(t => {
      if (t.id === task.id || t.checklistItemId === task.checklistItemId) {
        return {
          ...t,
          pendingChangeProposal: proposal
        };
      }
      return t;
    });

    return {
      applyDirectly: false,
      isProposalCreated: true,
      message: `Se ha registrado tu propuesta de cambio en "${fieldLabel}". El manager encargado (${ownerMgr}) recibirá el aviso para aceptarla o rechazarla.`,
      updatedEvent: { tasks: updatedTasks }
    };
  }

  return {
    applyDirectly: true,
    isProposalCreated: false,
    message: 'Cambio guardado en el expediente.',
    updatedEvent: patchData
  };
}

/**
 * Lo que cada disquera lleva encima en este evento.
 *
 * Es la pregunta del Resumen —"¿quién responde por qué?"— contestada de una vez
 * para las tres pestañas. Se arma del cruce de las tareas con el desglose porque
 * ninguna de las dos cosas la contesta sola: las tareas dicen quién se
 * comprometió y el desglose dice cuánto costó cumplirlo, y hasta ahora había que
 * leerlas por separado y unirlas de memoria.
 */
export interface ManagerWorkload {
  manager: string;
  isOrganizer: boolean;
  /** Puntos del expediente que le tocan. */
  required: ResolvedTask[];
  requiredDone: number;
  /** Encargos operativos: los que no salen del checklist. */
  optional: ResolvedTask[];
  optionalDone: number;
  /** Tareas que pasó a alguien de su equipo. */
  delegated: number;
  /** Transferencias esperando su respuesta. */
  awaitingResponse: number;
  /** Lo que suma el desglose de todas sus tareas. */
  spend: number;
  /** Partidas del desglose que lleva, vengan o no de una tarea. */
  items: number;
}

export function managerWorkloads(e: EventItem, tasks?: ResolvedTask[]): ManagerWorkload[] {
  const list = tasks || resolveTasks(e);
  const owner = e.ownerManagerName || e.createdBy || '';
  const prodItems = e.productionItems || [];
  const by = new Map<string, ManagerWorkload>();

  const slot = (manager: string): ManagerWorkload => {
    let entry = by.get(manager);
    if (!entry) {
      entry = {
        manager, isOrganizer: manager === owner,
        required: [], requiredDone: 0, optional: [], optionalDone: 0,
        delegated: 0, awaitingResponse: 0, spend: 0, items: 0
      };
      by.set(manager, entry);
    }
    return entry;
  };

  // El organizador siempre sale, aunque no se haya quedado con nada: su renglón
  // vacío es la respuesta a "¿y tú qué llevas?".
  if (owner) slot(owner);

  for (const t of list) {
    // Una tarea sin dueño la responde el organizador: es suya hasta que la
    // encargue, y dejarla fuera del reparto la volvía tierra de nadie.
    const manager = t.assignedManager || owner;
    if (!manager) continue;

    const entry = slot(manager);
    if (t.kind === 'sistema') {
      // Solo cuentan las que alguien encargó o las obligatorias: los 33 puntos
      // completos en el renglón de cada manager no dicen nada.
      if (!t.blocking && !t.assignedManager) continue;
      entry.required.push(t);
      if (t.done) entry.requiredDone += 1;
    } else {
      entry.optional.push(t);
      if (t.done) entry.optionalDone += 1;
    }

    if (t.delegate && !t.done) entry.delegated += 1;
    entry.spend += t.productionTotal;
    entry.items += t.productionItems.length;

    // La transferencia pendiente la contesta el destino, no quien la pidió.
    if (t.pendingTransfer?.status === 'pendiente') {
      slot(t.pendingTransfer.toManager).awaitingResponse += 1;
    }
  }

  // Gasto suelto: partidas capturadas en Producción que no salieron de ninguna
  // tarea. También son responsabilidad de alguien.
  for (const p of prodItems) {
    if (p.taskId) continue;
    const manager = p.assignedTo || owner;
    if (!manager) continue;
    const entry = slot(manager);
    entry.spend += p.amount || 0;
    entry.items += 1;
  }

  return Array.from(by.values()).sort((l, r) => {
    if (l.isOrganizer !== r.isOrganizer) return l.isOrganizer ? -1 : 1;
    return r.spend - l.spend || l.manager.localeCompare(r.manager);
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
 * En qué pestaña del expediente se captura este punto del checklist.
 *
 * Las ids son las de `eventCompleteness`, no nombres de campo del modelo: el
 * mapa anterior estaba escrito contra ids que no existen —`coverUrl`,
 * `lineup`, `ticketTiers`— así que ninguna coincidía y todo caía en el `default`.
 * El botón "Ir a capturarlo" abría siempre la misma pestaña, y en los puntos de
 * boletaje o de cartel dejaba a quien lo pulsaba buscando un dato que no estaba
 * ahí. Por eso el `default` es lo último que debería usarse y no la regla.
 */
export function getTabForChecklistItem(id: string): EventDetailTab {
  switch (id) {
    // Identidad y ficha pública: las dos viven en la misma pantalla.
    case 'identidad':
    case 'flyer':
    case 'descripcion':
    case 'direccion':
    case 'portada':
    case 'cartel_oficial':
    case 'categoria':
    case 'tagline':
    case 'about_publico':
    case 'reglas':
    case 'edad':
    case 'soporte':
    case 'cargo_servicio':
      return 'evento';

    case 'cartel':
    case 'headliner':
    case 'grupos_publico':
    case 'videos_grupos':
      return 'cartel';

    // El orden de entradas, las llegadas y los costos de cada grupo se capturan
    // en Producción, no en el cartel: ahí está la corrida del día.
    case 'orden':
    case 'llegadas':
    case 'costos':
    case 'encargados':
    case 'sonido':
    case 'ingeniero':
    case 'soundcheck':
    case 'corrida':
    case 'rider':
      return 'produccion';

    case 'croquis':
    case 'croquis_escenario':
    case 'boletos':
    case 'areas_categoria':
    case 'boletos_lugares':
    case 'aforo':
    case 'descripcion_boletos':
      return 'boletaje';

    default:
      return 'evento';
  }
}
