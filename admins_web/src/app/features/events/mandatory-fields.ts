import { signal } from '@angular/core';
import { isSystemActor as isSystem } from './event-tasks';
import { ActorRef, EventFieldProposal, EventItem, MandatoryExpediente } from '../../core/models/event.models';
import {
  acceptProposal, activeIntervention, approversOf, canDecideProposals, canEditDirectly,
  findFieldTask, interceptFieldSave, needsIntervention, proposalsForField, rejectProposal,
  resolveTasks, ResolvedTask, taskOwner
} from './event-tasks';

/**
 * La maquinaria de los datos obligatorios, para las pestañas del expediente.
 *
 * Cada pestaña necesita lo mismo de cada campo obligatorio —de quién es, si el
 * que escribe puede aplicarlo o solo proponerlo, y qué propuestas hay encima—, y
 * hasta ahora cada una lo resolvía por su cuenta: cinco copias del mismo
 * buscador de tareas, cada una con su propia lista de alias, y dos de ellas ya
 * habían empezado a desviarse. Esto es esa lógica una sola vez, con las
 * pestañas quedándose solo con lo suyo: dónde va el campo y cómo se pinta.
 *
 * No es un servicio inyectable a propósito. Necesita el evento *de esa pestaña*
 * —que es una señal de entrada distinta en cada una— y un servicio compartido
 * tendría que recibirlo en cada llamada, que es justo la firma incómoda que hace
 * que la gente acabe copiando la función en vez de usarla.
 */
export class MandatoryFields<T extends MandatoryExpediente = EventItem> {
  constructor(
    private readonly event: () => T,
    private readonly actor: () => ActorRef,
    private readonly emit: (patch: Partial<T>) => void
  ) {}

  /**
   * Lo último que hubo que avisar al guardar. La pestaña lo pinta y lo limpia.
   *
   * Es señal para que el aviso aparezca sin que la pestaña tenga que forzar un
   * ciclo de detección a mano.
   */
  readonly notice = signal<string | null>(null);

  task(ref: string): ResolvedTask | undefined {
    return findFieldTask(resolveTasks(this.event()), ref);
  }

  owner(ref: string): string {
    return taskOwner(this.event(), this.task(ref));
  }

  /** Si quien mira responde por este dato. */
  isMine(ref: string): boolean {
    const owner = this.owner(ref);
    return !owner || owner === this.actor().managerName;
  }

  /** Si lo que escriba se aplica solo, sin pasar por nadie. */
  canEdit(ref: string): boolean {
    return canEditDirectly(this.event(), this.task(ref), this.actor());
  }

  /**
   * Si le falta confirmar la intervención antes de poder escribir aquí.
   *
   * Es lo que mantiene el campo cerrado hasta que quien va a meter mano en el
   * punto de otra disquera diga que sí a sabiendas.
   */
  locked(ref: string): boolean {
    return needsIntervention(this.event(), this.task(ref), this.actor());
  }

  /** Si decide sobre lo que le proponen a este punto. */
  canDecide(ref: string): boolean {
    return canDecideProposals(this.event(), this.task(ref), this.actor());
  }

  /** Quiénes tienen que aceptar un cambio propuesto sobre este punto. */
  approvers(ref: string): string {
    return approversOf(this.event(), this.task(ref)).join(' y ') || 'su encargado';
  }

  /** El manager que intervino y sigue respondiendo por el dato junto al encargado. */
  intervener(ref: string): string {
    return activeIntervention(this.task(ref))?.name || '';
  }

  /**
   * Lo que hay que advertirle a quien va a escribir aquí.
   *
   * Distingue los dos casos que antes se trataban igual: ayudar a llenar un dato
   * que falta —que se aplica solo y no le quita nada a nadie— de cambiar uno que
   * ya está bueno, que sí necesita el visto bueno de quien respondió por él.
   */
  warning(ref: string): string | null {
    const task = this.task(ref);
    if (!task || this.canEdit(ref)) return null;

    const owner = this.owner(ref);
    if (!task.done) {
      return `Este punto lo responde ${owner} y todavía está vacío. Confirma la intervención y podrás llenarlo tú; el primer dato se aplica al momento.`;
    }
    return `Este dato ya está capturado y lo responde ${this.approvers(ref)}. Lo que escribas no se aplica: llega como propuesta y ${approversOf(this.event(), task).length > 1 ? 'ambos deciden' : 'decide quien responde'}.`;
  }

  /** Las propuestas vivas que pelean por este campo. */
  proposals(ref: string, fieldKey: string): EventFieldProposal[] {
    return proposalsForField(this.task(ref), fieldKey);
  }

  /** Quién resolvió el punto y cuándo, para poder decirlo donde haga falta. */
  resolution(ref: string): { by: string; at: string; intervened: boolean } | null {
    const t = this.task(ref);
    if (!t?.done) return null;
    const who = t.completedBy || t.intervenedBy;
    if (!who || isSystem(who.managerName)) return null;
    return { by: who.name, at: t.completedAt || t.intervenedAt || '', intervened: !!activeIntervention(t) };
  }

  /**
   * Guarda un dato obligatorio por el camino que le toque.
   *
   * `ref` es la sección del formulario y `patch` el cambio tal como iría al
   * expediente. El campo concreto —lo que decide qué propuestas compiten entre
   * sí— sale del propio parche en vez de pedirlo aparte: teniéndolo que escribir
   * a mano en sesenta llamadas del formulario, la primera que se desviara del
   * nombre real habría creado una propuesta que no compite con ninguna.
   */
  save(ref: string, label: string, patch: Partial<T>): void {
    const fieldKey = fieldKeyOf(patch);
    const result = interceptFieldSave(
      this.event(), ref, fieldKey, label, this.actor(), patch,
      { previous: this.currentLabel(fieldKey) }
    );

    this.notice.set(result.applied && !result.proposed ? null : result.message);
    this.emit(result.patch);
  }

  /** Aplica una propuesta y descarta las que peleaban por el mismo campo. */
  accept(ref: string, proposalId: string): void {
    const task = this.task(ref);
    if (task) this.emit(acceptProposal(this.event(), task.id, proposalId, this.actor()));
  }

  reject(ref: string, proposalId: string, reason?: string): void {
    const task = this.task(ref);
    if (task) this.emit(rejectProposal(this.event(), task.id, proposalId, this.actor(), reason));
  }

  /** Cómo se lee ahora el campo, para poder enseñar el antes junto al después. */
  private currentLabel(fieldKey: string): string {
    const e = this.event() as Record<string, any>;
    const value = e[fieldKey] ?? (e['publicProfile'] || {})[fieldKey];
    if (value === undefined || value === null || value === '') return '(vacío)';
    if (Array.isArray(value)) return `${value.length} elemento(s)`;
    if (typeof value === 'object') return 'varios campos';
    return String(value);
  }
}

/**
 * Qué campo toca este parche.
 *
 * Los datos de la ficha pública van anidados bajo `publicProfile`, así que el
 * nombre que identifica al campo está un nivel más adentro: sin bajar ahí, todas
 * las propuestas de la ficha competirían entre sí por llamarse igual.
 */
function fieldKeyOf(patch: Record<string, any>): string {
  const keys = Object.keys(patch);
  if (keys.length === 1 && keys[0] === 'publicProfile') {
    const inner = Object.keys(patch['publicProfile'] || {});
    if (inner.length) return inner[0];
  }
  return keys[0] || 'campo';
}
