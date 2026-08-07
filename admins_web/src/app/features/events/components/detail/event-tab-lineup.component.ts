import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EventItem,
  EventLineupSlot,
  EventCostItem,
  EventInvitationVideo
} from '../../../../core/models/event.models';
import { GroupItem } from '../../../../core/models/admin.models';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import { lineup, money, slotCost, lineupTotalCost, slugify } from '../../event-metrics';

/**
 * Cartel del evento, con un sub-apartado completo por grupo.
 *
 * Cada grupo se captura en cuatro bloques, y no por capricho de organización:
 * son cuatro públicos distintos. La **ficha pública** es exactamente lo que el
 * cliente ve en el line-up del portal (foto, género, calificación y el enlace a
 * `/grupo/:slug`); la **programación** es lo que necesita la producción el día
 * del evento; los **costos** son lo que el dueño del grupo propone y lo que el
 * encargado aprueba; y los **videos** son los saludos que el portal reproduce
 * antes de comprar. Si falta cualquiera de los cuatro, algo sale incompleto —
 * en la página del cliente o en el escenario.
 */
@Component({
  selector: 'app-event-tab-lineup',
  standalone: true,
  imports: [CommonModule, EditableFieldComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-4">

      <!-- Resumen del cartel -->
      <div class="flex items-center justify-between gap-3 flex-wrap p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30">
        <div class="min-w-0">
          <h4 class="text-xs font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-base">queue_music</span>
            Cartel & Orden de Entradas
          </h4>
          <p class="text-[11px] text-outline mt-0.5">
            {{ slots().length }} grupo(s) · {{ externalCount() }} de otros encargados
            @if (canViewFinances()) {
              · Costo total {{ totalCost() }}
            }
          </p>
        </div>

        @if (canEdit()) {
          <div class="flex items-center gap-2 shrink-0">
            @if (addMode()) {
              <select
                (change)="addGroup($any($event.target).value); $any($event.target).value = ''"
                class="px-3 py-2 min-h-10 rounded-xl bg-surface-container border border-primary/50 text-on-surface text-[11px] font-bold focus:outline-none"
              >
                <option value="">Elige un grupo…</option>
                @for (g of selectableGroups(); track g.id) {
                  <option [value]="g.id">{{ g.name }} — {{ g.genre }}</option>
                }
              </select>
              <button
                type="button"
                (click)="addMode.set(false)"
                class="px-3 py-2 min-h-10 rounded-xl bg-surface-bright text-on-surface text-[11px] font-bold"
              >Cancelar</button>
            } @else {
              <button
                type="button"
                (click)="addMode.set(true)"
                [disabled]="selectableGroups().length === 0"
                class="px-3.5 py-2 min-h-10 rounded-xl bg-primary/20 text-primary border border-primary/40 hover:bg-primary hover:text-on-primary text-[11px] font-black transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
              >
                <span class="material-symbols-outlined text-sm">group_add</span> Agregar grupo
              </button>
            }
          </div>
        }
      </div>

      @if (!slots().length) {
        <p class="p-6 text-center text-[11px] text-outline italic bg-surface-container-high/40 rounded-2xl border border-dashed border-outline-variant/30">
          Todavía no hay grupos en el cartel. Agrega al menos uno y marca cuál encabeza el evento.
        </p>
      }

      <!-- Un sub-apartado por grupo -->
      @for (slot of slots(); track slot.id) {
        <section class="rounded-2xl bg-surface-container-high border border-outline-variant/30 overflow-hidden">

          <!-- Encabezado del grupo -->
          <header class="p-4 flex items-center justify-between gap-3 flex-wrap bg-surface-container/60">
            <button
              type="button"
              (click)="toggle(slot.id)"
              class="flex items-center gap-3 min-w-0 flex-1 text-left"
            >
              <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary border border-primary/30 text-xs font-black flex items-center justify-center shrink-0">
                {{ slot.order }}
              </span>

              @if (slot.imageUrl) {
                <img [src]="slot.imageUrl" [alt]="slot.groupName" class="w-10 h-10 rounded-xl object-cover border border-outline-variant/30 shrink-0" />
              } @else {
                <span class="w-10 h-10 rounded-xl bg-surface-bright border border-dashed border-outline-variant/40 flex items-center justify-center text-outline shrink-0">
                  <span class="material-symbols-outlined text-base">no_photography</span>
                </span>
              }

              <span class="min-w-0">
                <span class="text-xs font-black text-on-surface truncate flex items-center gap-1.5">
                  {{ slot.groupName }}
                  @if (slot.isHeadliner) {
                    <span class="material-symbols-outlined text-[13px] text-primary" title="Cabeza de cartel">star</span>
                  }
                </span>
                <span class="text-[10px] text-outline block truncate">
                  {{ slot.genre || 'Sin género capturado' }}
                  @if (slot.setStartTime) { · {{ slot.setStartTime }} – {{ slot.setEndTime || '--:--' }} }
                  @if (canViewFinances()) { · {{ cost(slot) }} }
                </span>
              </span>
            </button>

            <div class="flex items-center gap-1.5 shrink-0">
              @if (missingPublic(slot)) {
                <span
                  class="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-black flex items-center gap-1"
                  title="Faltan datos que el cliente ve en la ficha pública"
                >
                  <span class="material-symbols-outlined text-[11px]">public_off</span> Ficha incompleta
                </span>
              }
              @if (slot.isExternal) {
                <span [class]="approvalClass(slot.approval)" class="px-2 py-1 rounded-lg text-[9px] font-black border">
                  {{ slot.approval }}
                </span>
              }
              <button
                type="button"
                (click)="toggle(slot.id)"
                class="w-8 h-8 rounded-xl bg-surface-container-highest border border-outline-variant/30 text-outline hover:text-on-surface flex items-center justify-center transition-all"
                [attr.aria-expanded]="isOpen(slot.id)"
              >
                <span class="material-symbols-outlined text-base transition-transform" [class.rotate-180]="isOpen(slot.id)">expand_more</span>
              </button>
            </div>
          </header>

          @if (isOpen(slot.id)) {
            <div class="p-4 space-y-4 border-t border-outline-variant/20 animate-slide-up">

              <!-- Acciones sobre el grupo -->
              @if (canEdit()) {
                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    (click)="move(slot, -1)"
                    [disabled]="slot.order <= 1"
                    class="px-2.5 py-1.5 min-h-9 rounded-xl bg-surface-container border border-outline-variant/30 text-[10px] font-bold text-on-surface disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-[13px]">arrow_upward</span> Subir en el orden
                  </button>
                  <button
                    type="button"
                    (click)="move(slot, 1)"
                    [disabled]="slot.order >= slots().length"
                    class="px-2.5 py-1.5 min-h-9 rounded-xl bg-surface-container border border-outline-variant/30 text-[10px] font-bold text-on-surface disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-[13px]">arrow_downward</span> Bajar
                  </button>
                  <button
                    type="button"
                    (click)="setHeadliner(slot)"
                    [class]="slot.isHeadliner ? 'bg-primary/25 text-primary border-primary/50' : 'bg-surface-container border-outline-variant/30 text-on-surface'"
                    class="px-2.5 py-1.5 min-h-9 rounded-xl border text-[10px] font-bold flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-[13px]">star</span> Cabeza de cartel
                  </button>
                  <button
                    type="button"
                    (click)="toggleExternal(slot)"
                    [class]="slot.isExternal ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-surface-container border-outline-variant/30 text-on-surface'"
                    class="px-2.5 py-1.5 min-h-9 rounded-xl border text-[10px] font-bold flex items-center gap-1"
                    title="Un grupo externo pertenece a otro encargado y debe aprobar su participación"
                  >
                    <span class="material-symbols-outlined text-[13px]">diversity_3</span> Grupo de otro encargado
                  </button>
                  <button
                    type="button"
                    (click)="remove(slot)"
                    class="ml-auto px-2.5 py-1.5 min-h-9 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                  >
                    <span class="material-symbols-outlined text-[13px]">person_remove</span> Quitar del cartel
                  </button>
                </div>
              }

              <!-- 1 · FICHA PÚBLICA DEL GRUPO -->
              <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/25 space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <h5 class="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]">public</span> Ficha pública del grupo
                  </h5>
                  <span class="text-[9px] text-outline">Esto es lo que el cliente ve en el line-up</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <app-editable-field
                    label="Nombre en cartelera"
                    [value]="slot.groupName"
                    [readonly]="!canEdit()"
                    (save)="patchSlot(slot, { groupName: $event })"
                  />
                  <app-editable-field
                    label="Género musical"
                    placeholder="Ej. Banda Sinaloense"
                    [value]="slot.genre || ''"
                    [readonly]="!canEdit()"
                    (save)="patchSlot(slot, { genre: $event })"
                  />
                  <app-editable-field
                    label="Foto del grupo (URL)"
                    type="url"
                    placeholder="https://…"
                    [value]="slot.imageUrl || ''"
                    [readonly]="!canEdit()"
                    (save)="patchSlot(slot, { imageUrl: $event })"
                  />
                  <app-editable-field
                    label="Calificación pública"
                    type="number"
                    hint="0 a 5"
                    [groupThousands]="false"
                    [value]="slot.rating ?? ''"
                    [readonly]="!canEdit()"
                    (save)="patchSlot(slot, { rating: clampRating($event) })"
                  />
                  <div class="sm:col-span-2">
                    <app-editable-field
                      label="Perfil público del grupo"
                      hint="ruta /grupo/:slug"
                      placeholder="banda-la-imperial"
                      [value]="slot.profileSlug || ''"
                      [readonly]="!canEdit()"
                      (save)="patchSlot(slot, { profileSlug: $event })"
                    />
                    @if (canEdit() && !slot.profileSlug) {
                      <button
                        type="button"
                        (click)="patchSlot(slot, { profileSlug: suggestSlug(slot) })"
                        class="mt-1 text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <span class="material-symbols-outlined text-[12px]">auto_fix_high</span>
                        Usar "{{ suggestSlug(slot) }}"
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- 2 · PROGRAMACIÓN -->
              <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/25 space-y-3">
                <h5 class="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[13px]">schedule</span> Programación del día
                </h5>

                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <app-editable-field
                    label="Hora de llegada"
                    placeholder="17:00"
                    [value]="slot.arrivalTime || ''"
                    [readonly]="!canEdit()"
                    (save)="patchSlot(slot, { arrivalTime: $event })"
                  />
                  <app-editable-field
                    label="Prueba de sonido"
                    placeholder="17:30"
                    [value]="slot.soundCheckTime || ''"
                    [readonly]="!canEdit()"
                    (save)="patchSlot(slot, { soundCheckTime: $event })"
                  />
                  <app-editable-field
                    label="Entra a tocar"
                    placeholder="20:00"
                    [value]="slot.setStartTime || ''"
                    [readonly]="!canEdit()"
                    (save)="patchSlot(slot, { setStartTime: $event })"
                  />
                  <app-editable-field
                    label="Termina"
                    placeholder="21:00"
                    [value]="slot.setEndTime || ''"
                    [readonly]="!canEdit()"
                    (save)="patchSlot(slot, { setEndTime: $event })"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-outline-variant/20">
                  <app-editable-field
                    label="Encargado responsable"
                    [value]="slot.managerName"
                    [readonly]="!canEdit()"
                    (save)="patchSlot(slot, { managerName: $event })"
                  />
                  <app-editable-field
                    label="Correo del encargado"
                    type="email"
                    [value]="slot.managerEmail || ''"
                    [readonly]="!canEdit()"
                    (save)="patchSlot(slot, { managerEmail: $event })"
                  />
                  <app-editable-field
                    label="Teléfono del encargado"
                    type="tel"
                    [value]="slot.managerPhone || ''"
                    [readonly]="!canEdit()"
                    (save)="patchSlot(slot, { managerPhone: $event })"
                  />
                </div>
              </div>

              <!-- 3 · COSTOS -->
              @if (canViewFinances()) {
                <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/25 space-y-3">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <h5 class="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[13px]">payments</span> Costo desglosado
                    </h5>
                    <span class="text-[11px] font-black text-on-surface">{{ cost(slot) }}</span>
                  </div>

                  @if (slot.costProposedBy) {
                    <p class="text-[10px] text-outline italic">Propuesto por {{ slot.costProposedBy }}</p>
                  }

                  <div class="space-y-2">
                    @for (item of slot.costItems; track item.id) {
                      <div class="flex items-center gap-2 p-2 rounded-lg bg-surface-container-high border border-outline-variant/20">
                        <div class="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <app-editable-field
                            [value]="item.concept"
                            valueClass="text-[11px] font-bold text-on-surface break-words"
                            [readonly]="!canEdit()"
                            (save)="patchCost(slot, item, { concept: $event })"
                          />
                          <app-editable-field
                            type="select"
                            [options]="costCategories"
                            [value]="item.category"
                            valueClass="text-[11px] font-semibold text-outline"
                            [readonly]="!canEdit()"
                            (save)="patchCost(slot, item, { category: $any($event) })"
                          />
                          <app-editable-field
                            type="number"
                            prefix="$"
                            [value]="item.amount"
                            valueClass="text-[11px] font-black text-emerald-400 text-right block"
                            [readonly]="!canEdit()"
                            (save)="patchCost(slot, item, { amount: toNumber($event) })"
                          />
                        </div>
                        @if (canEdit()) {
                          <button
                            type="button"
                            (click)="removeCost(slot, item)"
                            class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all"
                            title="Quitar concepto"
                          >
                            <span class="material-symbols-outlined text-[13px]">delete</span>
                          </button>
                        }
                      </div>
                    } @empty {
                      <p class="text-[10px] text-outline italic">
                        Sin desglose. El dueño del grupo debe indicar honorarios, viáticos y demás conceptos.
                      </p>
                    }
                  </div>

                  @if (canEdit()) {
                    <button
                      type="button"
                      (click)="addCost(slot)"
                      class="px-2.5 py-1.5 min-h-9 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <span class="material-symbols-outlined text-[13px]">add</span> Agregar concepto
                    </button>
                  }
                </div>
              }

              <!-- 4 · VIDEOS DE INVITACIÓN -->
              <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/25 space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <h5 class="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]">videocam</span> Videos de invitación
                  </h5>
                  <span class="text-[9px] text-outline">El portal los reproduce antes de comprar</span>
                </div>

                <div class="space-y-2">
                  @for (video of slot.invitationVideos || []; track video.id) {
                    <div class="p-2.5 rounded-lg bg-surface-container-high border border-outline-variant/20 space-y-2">
                      <div class="flex items-start gap-2">
                        <div class="flex-1 min-w-0 space-y-2">
                          <app-editable-field
                            label="Título"
                            [value]="video.title"
                            [readonly]="!canEdit()"
                            (save)="patchVideo(slot, video, { title: $event })"
                          />
                          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div class="sm:col-span-2">
                              <app-editable-field
                                label="URL"
                                type="url"
                                [value]="video.url"
                                valueClass="text-[10px] font-medium text-on-surface break-all"
                                [readonly]="!canEdit()"
                                (save)="patchVideo(slot, video, { url: $event })"
                              />
                            </div>
                            <app-editable-field
                              label="Tipo"
                              type="select"
                              [options]="videoTypes"
                              [value]="video.type"
                              [readonly]="!canEdit()"
                              (save)="patchVideo(slot, video, { type: $any($event) })"
                            />
                          </div>
                        </div>
                        @if (canEdit()) {
                          <button
                            type="button"
                            (click)="removeVideo(slot, video)"
                            class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all"
                            title="Quitar video"
                          >
                            <span class="material-symbols-outlined text-[13px]">delete</span>
                          </button>
                        }
                      </div>
                    </div>
                  } @empty {
                    <p class="text-[10px] text-outline italic">
                      Sin videos. Un saludo del grupo sube mucho la conversión de la ficha pública.
                    </p>
                  }
                </div>

                @if (canEdit()) {
                  <div class="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      (click)="addVideo(slot, 'local')"
                      class="px-2.5 py-1.5 min-h-9 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <span class="material-symbols-outlined text-[13px]">upload_file</span> Video subido (MP4)
                    </button>
                    <button
                      type="button"
                      (click)="addVideo(slot, 'youtube')"
                      class="px-2.5 py-1.5 min-h-9 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <span class="material-symbols-outlined text-[13px]">smart_display</span> Enlace de YouTube
                    </button>
                  </div>
                }
              </div>

            </div>
          }
        </section>
      }
    </div>
  `
})
export class EventTabLineupComponent {
  event = input.required<EventItem>();
  canEdit = input<boolean>(false);
  canViewFinances = input<boolean>(false);
  /** Catálogo de grupos disponibles para agregar al cartel. */
  availableGroups = input<GroupItem[]>([]);

  patch = output<Partial<EventItem>>();

  /** Grupos con su sub-apartado desplegado. */
  private openIds = signal<Set<string>>(new Set());
  addMode = signal(false);

  readonly costCategories: EditableOption[] = [
    { value: 'Honorarios', label: 'Honorarios' },
    { value: 'Viáticos', label: 'Viáticos' },
    { value: 'Transporte', label: 'Transporte' },
    { value: 'Hospedaje', label: 'Hospedaje' },
    { value: 'Alimentos', label: 'Alimentos' },
    { value: 'Otro', label: 'Otro' }
  ];

  readonly videoTypes: EditableOption[] = [
    { value: 'local', label: 'Video subido (MP4)' },
    { value: 'youtube', label: 'Enlace de YouTube' }
  ];

  slots = computed(() => lineup(this.event()));

  externalCount = computed(() => this.slots().filter(s => s.isExternal).length);

  totalCost = computed(() => money(lineupTotalCost(this.event())));

  /** Grupos del catálogo que todavía no están en el cartel. */
  selectableGroups = computed(() => {
    const used = new Set(this.slots().map(s => s.groupId));
    return this.availableGroups().filter(g => !used.has(g.id));
  });

  isOpen(id: string): boolean {
    return this.openIds().has(id);
  }

  toggle(id: string): void {
    this.openIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  cost(slot: EventLineupSlot): string {
    return money(slotCost(slot));
  }

  suggestSlug(slot: EventLineupSlot): string {
    return slugify(slot.groupName);
  }

  /** True si al grupo le falta algo de lo que el portal muestra. */
  missingPublic(slot: EventLineupSlot): boolean {
    return !slot.imageUrl?.trim() || !slot.genre?.trim() || !slot.profileSlug?.trim() || !(slot.rating ?? 0);
  }

  approvalClass(status: EventLineupSlot['approval']): string {
    switch (status) {
      case 'Aprobado': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Rechazado': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Pendiente': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-surface-container-highest text-outline border-outline-variant/30';
    }
  }

  toNumber(value: string): number {
    return Number(String(value).replace(/[^0-9.-]/g, '')) || 0;
  }

  clampRating(value: string): number {
    return Math.max(0, Math.min(5, this.toNumber(value)));
  }

  // ─── Mutaciones ────────────────────────────────────────────────────────────

  private commit(next: EventLineupSlot[]): void {
    this.patch.emit({ lineup: next.map((s, i) => ({ ...s, order: i + 1 })) });
  }

  patchSlot(slot: EventLineupSlot, changes: Partial<EventLineupSlot>): void {
    this.commit(this.slots().map(s => (s.id === slot.id ? { ...s, ...changes } : s)));
  }

  move(slot: EventLineupSlot, delta: number): void {
    const list = [...this.slots()];
    const from = list.findIndex(s => s.id === slot.id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= list.length) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    this.commit(list);
  }

  /** Solo un grupo puede encabezar el cartel: marcar uno desmarca al anterior. */
  setHeadliner(slot: EventLineupSlot): void {
    this.commit(this.slots().map(s => ({ ...s, isHeadliner: s.id === slot.id ? !s.isHeadliner : false })));
  }

  toggleExternal(slot: EventLineupSlot): void {
    const isExternal = !slot.isExternal;
    this.patchSlot(slot, {
      isExternal,
      approval: isExternal ? 'Pendiente' : 'No Requiere'
    });
  }

  remove(slot: EventLineupSlot): void {
    this.commit(this.slots().filter(s => s.id !== slot.id));
  }

  addGroup(groupId: string): void {
    if (!groupId) return;
    const group = this.availableGroups().find(g => g.id === groupId);
    if (!group) return;

    const slot: EventLineupSlot = {
      id: 'ln-' + this.event().id + '-' + Date.now(),
      groupId: group.id,
      groupName: group.name,
      imageUrl: group.image,
      genre: group.genre,
      rating: group.rating,
      profileSlug: slugify(group.name),
      // El grupo es "de otro encargado" cuando su líder no es quien arma el evento.
      isExternal: group.groupLeaderName !== this.event().ownerManagerName,
      managerName: group.groupLeaderName,
      managerEmail: group.groupLeaderEmail,
      managerPhone: group.groupLeaderPhone,
      order: this.slots().length + 1,
      costItems: [],
      approval: group.groupLeaderName !== this.event().ownerManagerName ? 'Pendiente' : 'No Requiere'
    };

    this.commit([...this.slots(), slot]);
    this.openIds.update(set => new Set(set).add(slot.id));
    this.addMode.set(false);
  }

  addCost(slot: EventLineupSlot): void {
    const item: EventCostItem = {
      id: 'c-' + slot.id + '-' + Date.now(),
      concept: 'Nuevo concepto',
      category: 'Honorarios',
      amount: 0
    };
    this.patchSlot(slot, { costItems: [...(slot.costItems || []), item] });
  }

  patchCost(slot: EventLineupSlot, item: EventCostItem, changes: Partial<EventCostItem>): void {
    this.patchSlot(slot, {
      costItems: (slot.costItems || []).map(c => (c.id === item.id ? { ...c, ...changes } : c))
    });
  }

  removeCost(slot: EventLineupSlot, item: EventCostItem): void {
    this.patchSlot(slot, { costItems: (slot.costItems || []).filter(c => c.id !== item.id) });
  }

  addVideo(slot: EventLineupSlot, type: 'local' | 'youtube'): void {
    const video: EventInvitationVideo = {
      id: 'vid-' + slot.id + '-' + Date.now(),
      title: type === 'local' ? 'Invitación Especial (Video Oficial del Grupo)' : 'Video de Promoción (Enlace a Redes Sociales)',
      url: '',
      type
    };
    this.patchSlot(slot, { invitationVideos: [...(slot.invitationVideos || []), video] });
  }

  patchVideo(slot: EventLineupSlot, video: EventInvitationVideo, changes: Partial<EventInvitationVideo>): void {
    this.patchSlot(slot, {
      invitationVideos: (slot.invitationVideos || []).map(v => (v.id === video.id ? { ...v, ...changes } : v))
    });
  }

  removeVideo(slot: EventLineupSlot, video: EventInvitationVideo): void {
    this.patchSlot(slot, { invitationVideos: (slot.invitationVideos || []).filter(v => v.id !== video.id) });
  }
}
