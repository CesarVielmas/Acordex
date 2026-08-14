import {
  ActorRef, EventActivity, EventFieldProposal, EventItem, EventProductionItem,
  EventTask, MandatoryExpediente
} from '../../core/models/event.models';
import { CompletenessItem, CompletenessReport } from '../../core/models/completeness.models';
import { PressEventItem } from '../../core/models/press.models';
import { EventDetailTab } from './components/event-detail-modal.component';
import { eventCompleteness } from './event-completeness';
import { pressCompleteness, PRESS_FIELD_TO_CHECKLIST } from '../press/press-completeness';

/**
 * Qué checklist mide este expediente.
 *
 * Una firma de prensa y un evento con boletaje comparten toda esta maquinaria
 * —quién responde por un dato, quién puede escribirlo, qué se propone y quién
 * decide— y solo se distinguen en la lista de puntos que hay que cumplir. Este
 * es el único sitio donde esa diferencia existe; todo lo demás de este archivo
 * no sabe ni necesita saber de qué clase de expediente se trata.
 */
function expedienteCompleteness(e: MandatoryExpediente): CompletenessReport {
  return e.kind === 'prensa'
    ? pressCompleteness(e as unknown as PressEventItem)
    : eventCompleteness(e as unknown as EventItem);
}

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
export function resolveTasks(e: MandatoryExpediente): ResolvedTask[] {
  const report = expedienteCompleteness(e);
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

  /** Las propuestas guardadas con el modelo de una sola, leídas como la lista que ahora son. */
  const withProposals = (t: EventTask): EventFieldProposal[] => {
    const list = t.changeProposals || [];
    const legacy = t.pendingChangeProposal;
    if (!legacy || list.some(p => p.id === legacy.id)) return list;

    const key = Object.keys(legacy.proposedChanges || {})[0] || 'campo';
    return [...list, {
      id: legacy.id,
      checklistItemId: t.checklistItemId || '',
      fieldKey: key,
      fieldLabel: legacy.fieldLabel,
      proposedChanges: legacy.proposedChanges,
      proposedLabel: describePatch(legacy.proposedChanges || {}, key),
      previousLabel: describePatch(legacy.previousValues || {}, key),
      proposedBy: legacy.proposedBy,
      proposedAt: legacy.proposedAt,
      status: legacy.status,
      respondedAt: legacy.respondedAt,
      rejectionReason: legacy.rejectionReason
    }];
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
        changeProposals: withProposals(existing),
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
        changeProposals: withProposals(t),
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

// ─── Puntos obligatorios en el formulario ─────────────────────────────────────

/**
 * Cómo llama el formulario a cada punto del checklist.
 *
 * Las secciones del expediente no se corresponden una a una con los puntos: la
 * caja de "identidad" cubre seis campos y la corrida del día cubre tres puntos.
 * Antes cada componente resolvía esto por su cuenta con una cadena de ocho
 * condiciones copiada literalmente en cinco archivos, y con ids que **no existen
 * en el checklist** —`coverUrl`, `schedule`, `lineup`—, así que la mitad de las
 * veces no encontraba la tarea y el tag salía en blanco sin que nadie lo notara.
 * El mapa vive aquí una sola vez y los ids de la derecha son los de verdad.
 */
const FIELD_TO_CHECKLIST: Record<string, string[]> = {
  // Los alias del expediente de prensa los declara Prensa —este archivo no tiene
  // por qué saber qué es un backdrop— pero se enchufan aquí para que en tiempo de
  // ejecución siga habiendo un solo mapa, que es la regla que importa.
  ...PRESS_FIELD_TO_CHECKLIST,

  // Identidad: la caja del nombre y el recinto responde por todo lo suyo.
  identidad: ['identidad', 'descripcion', 'direccion', 'flyer'],

  // Cartelera pública.
  coverUrl: ['portada'],
  posterUrl: ['cartel_oficial'],
  categoria: ['categoria', 'edad'],
  tagline: ['tagline'],
  aboutText: ['about_publico'],
  about_publico: ['about_publico'],
  rules: ['reglas'],
  reglas: ['reglas'],
  soporte: ['soporte'],
  ticketSupportPhone: ['soporte'],
  cargo_servicio: ['cargo_servicio'],
  venueAddress: ['direccion'],

  // Cartel.
  lineup: ['cartel', 'headliner', 'grupos_publico'],
  greetingVideos: ['videos_grupos'],
  videos_grupos: ['videos_grupos'],

  // Producción: la corrida del día y el bloque de audio arrastran cada uno
  // varios puntos, y hasta ahora el tag solo respondía por el primero.
  schedule: ['corrida', 'orden', 'llegadas', 'costos', 'encargados'],
  sound: ['sonido', 'ingeniero', 'soundcheck', 'rider'],

  // Boletaje: el croquis y el boletaje se capturan juntos y se cierran juntos.
  croquis: ['croquis', 'croquis_escenario'],
  ticketTiers: ['boletos', 'areas_categoria', 'boletos_lugares', 'aforo', 'descripcion_boletos'],
  boletos: ['boletos', 'areas_categoria', 'boletos_lugares', 'aforo', 'descripcion_boletos']
};

/** Los puntos del checklist que cubre una referencia del formulario. */
export function checklistIdsFor(ref: string): string[] {
  return FIELD_TO_CHECKLIST[ref] || [ref];
}

/**
 * La tarea del punto obligatorio que gobierna esta parte del formulario.
 *
 * Cuando la referencia cubre varios puntos manda el que todavía está pendiente:
 * una sección se marca en verde cuando *todo* lo suyo está capturado, no cuando
 * lo está la primera cosa que se encontró.
 */
export function findFieldTask(tasks: ResolvedTask[], ref: string): ResolvedTask | undefined {
  return fieldTasks(tasks, ref).find(t => !t.done) || fieldTasks(tasks, ref)[0];
}

/** Todos los puntos del checklist que cuelgan de esta parte del formulario. */
export function fieldTasks(tasks: ResolvedTask[], ref: string): ResolvedTask[] {
  const ids = checklistIdsFor(ref);
  return tasks.filter(t =>
    (t.checklistItemId && ids.includes(t.checklistItemId))
    || (t.formSectionRef && (t.formSectionRef === ref || ids.includes(t.formSectionRef)))
    || ids.some(id => t.id === `task-sys-${id}`));
}

/** Quién responde por este punto: el encargado, o el organizador si no se repartió. */
export function taskOwner(event: MandatoryExpediente, task?: EventTask): string {
  const owner = task?.assignedManager || event.ownerManagerName || event.createdBy || '';
  // El sistema detecta los datos obligatorios, no responde por ellos. Un punto
  // "a cargo del sistema" no tiene a quién ir a buscar cuando falta, así que
  // cuando no hay nadie más responde el organizador.
  return isSystemActor(owner) ? (event.ownerManagerName || event.createdBy || '') : owner;
}

/** El sistema no es una disquera: ni interviene, ni completa, ni aprueba nada. */
export function isSystemActor(who?: string | ActorRef | null): boolean {
  if (!who) return false;
  const name = typeof who === 'string' ? who : who.managerName;
  return !name || name.toLowerCase() === 'sistema';
}

/**
 * La intervención viva sobre este punto, si la hay.
 *
 * Deja de valer en cuanto el encargado vuelve a escribir en su punto: eso quiere
 * decir que retomó lo suyo, y a partir de ahí quien intervino vuelve a ser un
 * manager cualquiera que tiene que pedir permiso como todos.
 */
export function activeIntervention(task?: EventTask): ActorRef | undefined {
  const who = task?.intervenedBy;
  return who && !isSystemActor(who) ? who : undefined;
}

/**
 * Quiénes tienen que enterarse de un cambio propuesto sobre este punto.
 *
 * Normalmente solo su encargado. Pero cuando otro manager tuvo que intervenir
 * porque el dato estaba vacío, el dato es de los dos: uno responde por el punto
 * y el otro lo llenó de su puño. Un tercero que quiera cambiarlo les debe
 * explicación a ambos, y a los dos les llega la decisión.
 */
export function approversOf(event: MandatoryExpediente, task?: EventTask): string[] {
  const owner = taskOwner(event, task);
  const intervened = activeIntervention(task)?.managerName;
  const list = [owner];
  if (intervened && intervened !== owner) list.push(intervened);
  return list.filter(Boolean);
}

/** Si este actor es el encargado del punto. */
export function ownsField(event: MandatoryExpediente, task: ResolvedTask | undefined, actor: ActorRef): boolean {
  const owner = taskOwner(event, task);
  return !owner || owner === actor.managerName;
}

/**
 * Si lo que escriba este actor se aplica solo, sin pedirle permiso a nadie.
 *
 * Son tres los que pueden, y en este orden de razón:
 *
 *   - **El encargado**, siempre. Es su dato.
 *   - **Quien intervino** mientras la intervención siga viva. Llenó un punto que
 *     estaba vacío y nadie más iba a llenar; obligarle a pedir permiso para
 *     corregir su propia captura sería castigarle por haber ayudado.
 *   - **Cualquiera**, si el punto está vacío y ya confirmó la intervención. El
 *     primer llenado nunca compite contra nada: no hay un dato bueno que
 *     proteger, hay un hueco que impide publicar.
 */
export function canEditDirectly(event: MandatoryExpediente, task: ResolvedTask | undefined, actor: ActorRef): boolean {
  if (!task) return true;
  if (ownsField(event, task, actor)) return true;

  const intervened = activeIntervention(task);
  if (intervened?.managerName === actor.managerName) return true;

  return !task.done && !!intervened && intervened.managerName === actor.managerName;
}

/**
 * Si a este actor le falta confirmar la intervención antes de poder escribir.
 *
 * Es la puerta del punto ajeno y vacío: se abre confirmando, no se queda
 * cerrada. Sin ella, meterse en el dato de otra disquera sería tan fácil como
 * un despiste, y el aviso es justamente lo que convierte el despiste en decisión.
 */
export function needsIntervention(event: MandatoryExpediente, task: ResolvedTask | undefined, actor: ActorRef): boolean {
  if (!task || task.done) return false;
  if (ownsField(event, task, actor)) return false;
  return activeIntervention(task)?.managerName !== actor.managerName;
}

/** Si este actor decide sobre lo que le proponen a este punto. */
export function canDecideProposals(event: MandatoryExpediente, task: ResolvedTask | undefined, actor: ActorRef): boolean {
  return approversOf(event, task).includes(actor.managerName);
}

export interface InterceptSaveResult<T extends MandatoryExpediente = EventItem> {
  /** El parche se aplicó al expediente tal cual. */
  applied: boolean;
  /** Se guardó como propuesta a la espera del encargado. */
  proposed: boolean;
  message: string;
  patch: Partial<T>;
}

/**
 * Decide qué pasa cuando alguien guarda un dato obligatorio.
 *
 * El punto pasa por tres fases y en cada una manda gente distinta:
 *
 *   1. **Vacío.** No hay nada que proteger, hay un hueco que impide publicar. Lo
 *      llena su encargado, o cualquier manager que confirme la intervención, y
 *      se aplica al instante. El primer llenado nunca compite contra nada.
 *
 *   2. **Lleno tras una intervención.** El dato es de dos: el que responde por el
 *      punto y el que lo llenó. Los dos lo corrigen al instante y los dos deciden
 *      lo que un tercero proponga, porque a los dos les afecta.
 *
 *   3. **Lleno y retomado.** En cuanto el encargado vuelve a escribir en su
 *      punto, la intervención se apaga: retomó lo suyo. A partir de ahí solo él
 *      escribe directo, y quien había intervenido vuelve a la cola como todos.
 *
 * Lo que nunca pasa es que un tercero sobrescriba un dato bueno sin que se entere
 * quien respondía por él.
 */
export function interceptFieldSave<T extends MandatoryExpediente>(
  event: T,
  ref: string,
  fieldKey: string,
  fieldLabel: string,
  actor: ActorRef,
  patch: Partial<T>,
  labels?: { proposed?: string; previous?: string }
): InterceptSaveResult<T> {
  const task = findFieldTask(resolveTasks(event), ref);
  const owner = taskOwner(event, task);
  const now = new Date().toISOString().slice(0, 16);

  if (!task) {
    return { applied: true, proposed: false, message: 'Cambio guardado en el expediente.', patch };
  }

  // ─── Fase 3: el encargado retoma lo suyo ───
  if (ownsField(event, task, actor)) {
    const intervened = activeIntervention(task);
    if (!intervened) {
      return { applied: true, proposed: false, message: 'Cambio guardado en el expediente.', patch };
    }

    // Apagar la intervención es lo que devuelve el punto a la normalidad: de
    // aquí en adelante quien intervino ya no escribe directo.
    const tasks = upsertTask(event, task, t => ({
      ...t,
      intervenedBy: undefined,
      intervenedAt: undefined,
      completedBy: actor,
      completedAt: now
    }));
    return {
      applied: true,
      proposed: false,
      message: `Retomaste tu punto. ${intervened.name} vuelve a necesitar tu aprobación para cambiarlo.`,
      patch: { ...patch, tasks } as Partial<T>
    };
  }

  // ─── Fase 1: el punto está vacío ───
  if (!task.done) {
    const tasks = upsertTask(event, task, t => ({
      ...t,
      intervenedBy: actor,
      intervenedAt: now,
      completedBy: actor,
      completedAt: now
    }));
    return {
      applied: true,
      proposed: false,
      message: `Capturaste un dato que responde ${owner}. Queda registrado que interviniste tú.`,
      patch: { ...patch, tasks } as Partial<T>
    };
  }

  // ─── Fase 2: lo llenó una intervención y quien escribe es quien intervino ───
  if (activeIntervention(task)?.managerName === actor.managerName) {
    const tasks = upsertTask(event, task, t => ({ ...t, completedBy: actor, completedAt: now }));
    return {
      applied: true,
      proposed: false,
      message: 'Corregiste el dato que tú mismo capturaste.',
      patch: { ...patch, tasks } as Partial<T>
    };
  }

  const proposal: EventFieldProposal = {
    id: `prop-${fieldKey}-${Date.now()}`,
    checklistItemId: task.checklistItemId || ref,
    fieldKey,
    fieldLabel,
    // Solo el campo que se tocó. Las pestañas construyen el parche esparciendo
    // la ficha pública entera —`{ publicProfile: { ...actual, ...cambio } }`—, y
    // guardarla así congelaría dentro de la propuesta todo lo demás tal como
    // estaba: aceptarla una semana después revertiría de paso cinco datos que
    // nadie pidió cambiar.
    proposedChanges: narrowPatch(patch, fieldKey),
    proposedLabel: labels?.proposed ?? describePatch(patch, fieldKey),
    previousLabel: labels?.previous ?? '',
    proposedBy: actor,
    proposedAt: now,
    status: 'pendiente'
  };

  const tasks = upsertTask(event, task, t => ({
    ...t,
    // Se apila: si otro manager ya propuso algo sobre este campo, las dos tienen
    // que llegarle al encargado para que elija. Sustituir la anterior —que es lo
    // que hacía el modelo de una sola propuesta— borraba la primera sin rastro.
    changeProposals: [...(t.changeProposals || []).filter(p => p.id !== proposal.id), proposal]
  }));

  const quienes = approversOf(event, task);
  return {
    applied: false,
    proposed: true,
    message: `Tu cambio en «${fieldLabel}» quedó como propuesta. `
      + (quienes.length > 1
        ? `Tienen que aceptarla ${quienes.join(' y ')}.`
        : `${quienes[0] || owner} decide si se aplica.`),
    patch: { tasks } as Partial<T>
  };
}

/** Las propuestas vivas de una tarea, las más recientes primero. */
export function pendingProposals(task?: EventTask): EventFieldProposal[] {
  return (task?.changeProposals || [])
    .filter(p => p.status === 'pendiente')
    .sort((l, r) => r.proposedAt.localeCompare(l.proposedAt));
}

/** Las propuestas vivas que compiten por un mismo campo. */
export function proposalsForField(task: EventTask | undefined, fieldKey: string): EventFieldProposal[] {
  return pendingProposals(task).filter(p => p.fieldKey === fieldKey);
}

/**
 * Acepta una propuesta y descarta las que peleaban por el mismo campo.
 *
 * Las rivales se marcan como desplazadas y no como rechazadas: no es que el
 * encargado dijera que estaban mal, es que solo cabía una. Las de otros campos
 * de la misma tarea siguen vivas, porque nunca estuvieron en la disputa.
 */
export function acceptProposal<T extends MandatoryExpediente>(
  event: T, taskId: string, proposalId: string, actor: ActorRef
): Partial<T> {
  const task = (event.tasks || []).find(t => t.id === taskId);
  const proposal = (task?.changeProposals || []).find(p => p.id === proposalId);
  if (!task || !proposal) return {};

  const now = new Date().toISOString().slice(0, 16);
  const tasks = (event.tasks || []).map(t => {
    if (t.id !== taskId) return t;
    return {
      ...t,
      changeProposals: (t.changeProposals || []).map(p => {
        if (p.id === proposalId) {
          return { ...p, status: 'aceptada' as const, respondedAt: now, respondedBy: actor };
        }
        if (p.status === 'pendiente' && p.fieldKey === proposal.fieldKey) {
          return { ...p, status: 'rechazada' as const, respondedAt: now, respondedBy: actor, supersededBy: proposalId };
        }
        return p;
      })
    };
  });

  return { ...mergePatch(event, proposal.proposedChanges), tasks } as Partial<T>;
}

export function rejectProposal<T extends MandatoryExpediente>(
  event: T, taskId: string, proposalId: string, actor: ActorRef, reason?: string
): Partial<T> {
  const now = new Date().toISOString().slice(0, 16);
  const tasks = (event.tasks || []).map(t => {
    if (t.id !== taskId) return t;
    return {
      ...t,
      changeProposals: (t.changeProposals || []).map(p =>
        p.id === proposalId
          ? { ...p, status: 'rechazada' as const, respondedAt: now, respondedBy: actor, rejectionReason: reason }
          : p)
    };
  });
  return { tasks } as Partial<T>;
}

/**
 * Deja escrito que este manager se metió a resolver un punto que no era suyo.
 *
 * No lo da por hecho: marcar la tarea como completada al confirmar el aviso
 * —que es lo que hacía antes— sellaba autoría y hora de un dato que todavía no
 * se había escrito. La tarea la cierra el checklist cuando el dato aparezca.
 */
export function markIntervention<T extends MandatoryExpediente>(
  event: T, task: ResolvedTask, actor: ActorRef
): Partial<T> {
  return {
    tasks: upsertTask(event, task, t => ({
      ...t, intervenedBy: actor, intervenedAt: new Date().toISOString().slice(0, 16)
    }))
  } as Partial<T>;
}

/**
 * Aplica un cambio a la tarea guardada, materializándola si era virtual.
 *
 * Las tareas de los puntos del checklist no se guardan hasta que alguien hace
 * algo con ellas, así que la primera propuesta sobre un punto que nadie había
 * tocado no tenía dónde escribirse y se perdía.
 */
function upsertTask(event: MandatoryExpediente, task: ResolvedTask, change: (t: EventTask) => EventTask): EventTask[] {
  const stored = event.tasks || [];
  const found = stored.some(t => t.id === task.id);
  if (found) return stored.map(t => (t.id === task.id ? change(t) : t));

  const { done, checklist, blocking, virtual, productionItems, productionTotal, ...base } = task;
  return [...stored, change(base)];
}

/** Un valor propuesto en una línea, para poder enseñarlo sin abrir el parche. */
function describePatch(patch: Record<string, any>, fieldKey: string): string {
  const flat: Record<string, any> = { ...patch, ...(patch['publicProfile'] || {}) };
  const value = flat[fieldKey] ?? Object.values(flat).find(v => v !== undefined && v !== null && v !== '');
  if (value === undefined || value === null || value === '') return '(vacío)';
  if (Array.isArray(value)) return `${value.length} elemento(s)`;
  if (typeof value === 'object') return 'varios campos';
  return String(value);
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
  /** Cambios que otros managers le proponen y tiene que aceptar o rechazar. */
  proposalsToDecide: number;
  /** Puntos ajenos que tuvo que llenar él porque estaban vacíos. */
  interventions: number;
  /** Lo que suma el desglose de todas sus tareas. */
  spend: number;
  /** Partidas del desglose que lleva, vengan o no de una tarea. */
  items: number;
}

export function managerWorkloads(e: MandatoryExpediente, tasks?: ResolvedTask[]): ManagerWorkload[] {
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
        delegated: 0, awaitingResponse: 0, proposalsToDecide: 0, interventions: 0,
        spend: 0, items: 0
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
    const manager = isSystemActor(t.assignedManager) ? owner : (t.assignedManager || owner);
    if (!manager || isSystemActor(manager)) continue;

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

    // Y los cambios propuestos los deciden todos sus aprobadores: el encargado
    // del punto y, si lo llenó otro, también quien intervino.
    const abiertas = pendingProposals(t).length;
    if (abiertas) {
      for (const quien of approversOf(e, t)) slot(quien).proposalsToDecide += abiertas;
    }

    const intervino = activeIntervention(t);
    if (intervino) slot(intervino.managerName).interventions += 1;
  }

  // Gasto suelto: partidas capturadas en Producción que no salieron de ninguna
  // tarea. También son responsabilidad de alguien.
  for (const p of prodItems) {
    if (p.taskId) continue;
    const manager = p.assignedTo || owner;
    if (!manager || isSystemActor(manager)) continue;
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
  before: MandatoryExpediente,
  after: MandatoryExpediente,
  actor: ActorRef
): { tasks: EventTask[]; activity: EventActivity[] } | null {
  const beforeComp = expedienteCompleteness(before);
  const afterComp = expedienteCompleteness(after);

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

/** El parche recortado al campo que de verdad se propone cambiar. */
function narrowPatch(patch: Record<string, any>, fieldKey: string): Record<string, any> {
  const profile = patch['publicProfile'];
  if (profile && typeof profile === 'object' && fieldKey in profile) {
    return { publicProfile: { [fieldKey]: profile[fieldKey] } };
  }
  if (fieldKey in patch) return { [fieldKey]: patch[fieldKey] };
  return patch;
}

/**
 * Aplica un parche sin tirar lo que no menciona.
 *
 * La ficha pública es un objeto anidado, así que un parche que solo trae la
 * frase de portada borraba de un plumazo el cartel, la portada y las reglas al
 * asignarse encima. Se nota tarde y mal: el dato desaparece de la ficha pública
 * sin que nadie lo haya tocado.
 */
function mergePatch(event: MandatoryExpediente, patch: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...patch };
  for (const [key, value] of Object.entries(patch)) {
    const current = (event as Record<string, any>)[key];
    const anidado = value && typeof value === 'object' && !Array.isArray(value);
    if (anidado && current && typeof current === 'object' && !Array.isArray(current)) {
      out[key] = { ...current, ...value };
    }
  }
  return out;
}
