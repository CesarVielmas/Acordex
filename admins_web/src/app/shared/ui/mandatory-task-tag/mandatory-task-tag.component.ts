import { Component, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventItem } from '../../../core/models/event.models';
import { SessionService } from '../../../core/services/session.service';
import {
  activeIntervention, canDecideProposals, fieldTasks, findFieldTask, isSystemActor,
  needsIntervention, pendingProposals, resolveTasks, ResolvedTask, taskOwner
} from '../../../features/events/event-tasks';

/**
 * La marca de un dato obligatorio, en la esquina de la sección que lo captura.
 *
 * Contesta las tres cosas que hay que saber antes de escribir ahí: que el dato
 * es obligatorio, de quién es, y si ya está resuelto —y entonces por quién y
 * cuándo—. Sin esto el expediente es un formulario plano donde nada distingue el
 * campo que impide publicar del que es un adorno, ni el que responde uno mismo
 * del que está esperando a otra disquera.
 *
 * Lo que **no** hace es decidir sobre las propuestas de cambio. Esas se aceptan
 * o se rechazan campo por campo, junto al dato o en la pestaña de Tareas, porque
 * son varias y compiten entre sí: resolverlas desde un botón de la esquina
 * obligaba a elegir a ciegas cuál de las tres se estaba aceptando.
 */
@Component({
  selector: 'app-mandatory-task-tag',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (task(); as t) {
      <div class="inline-flex items-center gap-1.5 relative">

        @if (proposalCount() > 0) {
          <!-- Hay cambios esperando decisión: es lo más urgente que puede decir
               esta esquina, así que se come el sitio de todo lo demás. -->
          <button
            type="button"
            (click)="openTasks.emit()"
            [title]="ownsIt()
              ? 'Tienes ' + proposalCount() + ' cambio(s) propuestos por otros managers esperando tu decisión'
              : 'Hay ' + proposalCount() + ' cambio(s) propuestos esperando a ' + owner()"
            class="px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
            [class]="ownsIt()
              ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-500/25 hover:bg-amber-300'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:border-amber-400/70'"
          >
            <span class="material-symbols-outlined text-[12px]">rate_review</span>
            {{ proposalCount() }} por revisar
            @if (ownsIt()) { <span class="w-1.5 h-1.5 rounded-full bg-black/60 animate-pulse"></span> }
          </button>

        } @else if (allDone()) {
          <!-- Resuelto: quién y cuándo. Es lo que se pregunta cuando el dato
               resulta estar mal y hay que ir a buscar a alguien. -->
          <span
            class="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5"
            [title]="resolvedTitle()"
          >
            <span class="material-symbols-outlined text-[12px]">verified</span>
            {{ resolvedBy() }}
            @if (resolvedAt()) {
              <span class="text-emerald-400/70 normal-case font-mono">{{ resolvedAt() }}</span>
            }
            @if (total() > 1) {
              <span class="text-emerald-400/50 normal-case font-mono">{{ total() }} pts</span>
            }
            @if (intervener()) {
              <span class="px-1.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 normal-case">intervino</span>
            }
          </span>

        } @else if (ownsIt()) {
          <span class="px-2.5 py-1 rounded-xl bg-white/5 text-outline border border-white/10 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[12px]">flag</span>
            Obligatorio · tuyo
            @if (total() > 1) {
              <span class="font-mono text-on-surface-variant">{{ doneCount() }}/{{ total() }}</span>
            }
          </span>

        } @else {
          <!-- De otra disquera y sin resolver. Un manager puede meter mano; se le
               avisa primero de quién era, que es lo único que necesita saber. -->
          <button
            type="button"
            (click)="onTagClick()"
            [disabled]="!canIntervene()"
            [title]="canIntervene()
              ? 'Lo responde ' + owner() + '. Puedes resolverlo tú.'
              : 'Lo responde ' + owner() + '. Solo un manager puede resolver un punto de otra disquera.'"
            class="px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
            [class]="canIntervene()
              ? 'bg-sky-500/12 text-sky-300 border-sky-500/35 hover:border-amber-400/60 hover:text-amber-300 active:scale-95'
              : 'bg-white/5 text-outline border-white/10 cursor-not-allowed'"
          >
            <span class="material-symbols-outlined text-[12px]">person</span>
            {{ owner() }}
            @if (total() > 1) {
              <span class="font-mono opacity-70">{{ doneCount() }}/{{ total() }}</span>
            }
            @if (canIntervene() && mustConfirm()) {
              <span class="px-1.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 normal-case">intervenir</span>
            } @else if (!mustConfirm()) {
              <span class="px-1.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 normal-case">puedes escribir</span>
            }
          </button>
        }

        <!-- Aviso de intervención. Es una confirmación, no un candado: el campo
             nunca estuvo cerrado, lo que hace falta es que quien va a meter mano
             sepa de quién era antes de hacerlo. -->
        @if (confirmOpen()) {
          <div
            class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
            (click)="confirmOpen.set(false)"
          >
            <div
              class="w-full max-w-md p-6 rounded-[2rem] bg-surface-container-high border border-amber-400/40 shadow-2xl space-y-5 text-left"
              (click)="$event.stopPropagation()"
            >
              <div class="flex items-start gap-3.5">
                <div class="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-2xl">shield_person</span>
                </div>
                <div class="min-w-0 space-y-1">
                  <h5 class="font-['Epilogue'] font-black text-lg text-on-surface leading-tight">
                    Este punto lo responde {{ owner() }}
                  </h5>
                  <p class="text-[11px] text-outline leading-relaxed">{{ task()?.title }}</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-black/40 border border-white/10 text-[11px] text-on-surface-variant leading-relaxed">
                Puedes resolverlo tú —está sin capturar y el evento no se publica sin él—, pero quedará
                registrado que interviniste en un punto de otra disquera, y {{ owner() }} lo verá en sus tareas.
              </div>

              <div class="flex items-center justify-end gap-2.5">
                <button type="button" (click)="confirmOpen.set(false)"
                  class="px-4 py-2.5 rounded-xl text-xs font-bold text-outline hover:text-on-surface transition-colors">
                  Mejor no
                </button>
                <button type="button" (click)="confirm()"
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black font-black text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center gap-2">
                  <span class="material-symbols-outlined text-base">edit</span>
                  Sí, lo resuelvo yo
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class MandatoryTaskTagComponent {
  private readonly session = inject(SessionService);

  /**
   * Cómo llama esta parte del formulario a su punto del checklist.
   *
   * Se llamaba `checklistItemId` y no lo era: la mitad de los sitios le pasaban
   * nombres de campo del modelo —`coverUrl`, `schedule`, `lineup`— que no existen
   * en el checklist, así que no encontraba la tarea y el tag no se pintaba. El
   * nombre dice ahora lo que de verdad admite, y la traducción vive en un solo
   * mapa dentro de `event-tasks`.
   */
  readonly ref = input.required<string>();
  readonly event = input.required<EventItem>();

  readonly intervene = output<ResolvedTask>();
  /** Ir a Tareas, que es donde se deciden las propuestas. */
  readonly openTasks = output<void>();

  readonly confirmOpen = signal(false);

  private readonly all = computed(() => fieldTasks(resolveTasks(this.event()), this.ref()));
  readonly task = computed(() => findFieldTask(resolveTasks(this.event()), this.ref()));

  /**
   * Cuántos puntos cubre esta sección y cuántos van.
   *
   * Una sección casi nunca es un solo punto —la corrida del día son cinco— y un
   * tag que solo mira el primero se pone en verde con cuatro cosas sin capturar.
   */
  readonly total = computed(() => this.all().length);
  readonly doneCount = computed(() => this.all().filter(t => t.done).length);
  readonly allDone = computed(() => this.total() > 0 && this.doneCount() === this.total());
  readonly owner = computed(() => taskOwner(this.event(), this.task()) || 'sin asignar');
  readonly proposalCount = computed(() => pendingProposals(this.task()).length);

  readonly ownsIt = computed(() => canDecideProposals(this.event(), this.task(), this.session.actor()));

  /** Le falta confirmar la intervención para poder escribir aquí. */
  readonly mustConfirm = computed(() =>
    needsIntervention(this.event(), this.task(), this.session.actor()));

  /** Un punto de otra disquera solo lo destraba un manager. */
  readonly canIntervene = computed(() => this.session.actor().rank === 'manager');

  /** Quien intervino sigue respondiendo por el dato junto al encargado. */
  readonly intervener = computed(() => activeIntervention(this.task())?.name || '');

  /**
   * Quién resolvió el punto. Nunca "el sistema": el sistema detecta el dato, no
   * lo captura, y poner su nombre aquí dejaba puntos obligatorios sin nadie a
   * quien preguntarle cuando el dato resultaba estar mal.
   */
  readonly resolvedBy = computed(() => {
    const t = this.task();
    const who = t?.completedBy || t?.intervenedBy;
    if (who && !isSystemActor(who)) return who.name;
    return !isSystemActor(t?.assignedManager) && t?.assignedManager ? t.assignedManager : this.owner();
  });

  /** Fecha y hora en que quedó resuelto, ya legible. */
  readonly resolvedAt = computed(() => {
    const t = this.task();
    const iso = t?.completedAt || t?.intervenedAt;
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
      + ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  readonly resolvedTitle = computed(() => {
    const t = this.task();
    if (!t) return '';
    const when = t.completedAt || t.intervenedAt;
    const who = this.resolvedBy();
    const base = `Resuelto por ${who}${when ? ' el ' + when : ''}`;
    return t.intervenedBy && t.assignedManager && t.intervenedBy.managerName !== t.assignedManager
      ? `${base}. Intervino: el punto era de ${t.assignedManager}.`
      : base;
  });

  onTagClick(): void {
    if (this.canIntervene()) this.confirmOpen.set(true);
  }

  confirm(): void {
    const t = this.task();
    this.confirmOpen.set(false);
    if (t) this.intervene.emit(t);
  }
}
