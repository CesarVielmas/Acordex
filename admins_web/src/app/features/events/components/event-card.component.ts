import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventItem } from '../../../core/models/event.models';
import { eventStateMeta } from '../../../core/models/event-state.meta';
import { RoleService } from '../../../core/services/role.service';
import { EventHighlight, EventTag, cardHighlight, cardTags, stalledLabel } from '../event-card-insights';
import { eventCompleteness } from '../event-completeness';
import {
  daysUntilEvent,
  highestTicketPrice,
  lineup,
  lineupTotalCost,
  lowestTicketPrice,
  money,
  publicProfile,
  relativeDays,
  serviceFee,
  shortDate,
  soldSeats,
  totalSeats
} from '../event-metrics';

/**
 * Tarjeta de un evento en la cartelera y en el tablero por estado.
 *
 * La versión anterior mostraba lo mismo para todos los eventos: flyer, fecha,
 * recinto y la lista de precios. Eso servía para un evento publicado, pero no
 * decía nada útil de un borrador a medio capturar ni de un evento atorado en
 * revisión, que son justo los que necesitan atención.
 *
 * Ahora la tarjeta se arma en tres capas:
 *  1. Identidad — flyer, fase, folio, cuenta regresiva y cartel.
 *  2. El dato que importa en esa fase, resuelto por `event-card-insights.ts`.
 *  3. Boletaje y acciones, que también cambian según lo que se pueda hacer.
 */
@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block h-full' },
  template: `
    @if (event(); as e) {
      <article
        [class]="meta().borderLeftClass"
        class="h-full flex flex-col rounded-3xl bg-surface-container border border-outline-variant/30 border-l-4 hover:border-primary/50 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
      >

        <!-- ─── PORTADA: la misma imagen que ve el cliente, fase, folio y cuenta regresiva ─── -->
        <div class="relative aspect-video bg-surface-container-high overflow-hidden shrink-0">
          <img
            [src]="coverImage()"
            [alt]="e.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            [class.opacity-40]="isInactive()"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/40 to-transparent"></div>

          <!-- Folio, categoría pública y co-producción -->
          <div class="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap max-w-[65%]">
            <span class="px-2 py-1 rounded-lg text-[10px] font-black bg-background/80 backdrop-blur-md text-primary border border-primary/30 font-mono">
              {{ e.id }}
            </span>
            <span class="px-2 py-1 rounded-lg text-[10px] font-black bg-background/80 backdrop-blur-md text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
              {{ profile().category }}
            </span>
            @if (e.isCoProduction) {
              <span class="px-2 py-1 rounded-lg text-[10px] font-bold bg-background/80 backdrop-blur-md text-purple-300 border border-purple-500/40 flex items-center gap-1">
                <span class="material-symbols-outlined text-[11px]">handshake</span> Co-producción
              </span>
            }
          </div>

          <!-- Miniatura del cartel oficial: si falta, se ve el hueco -->
          <div class="absolute bottom-3 right-3 w-11 aspect-[3/4] rounded-lg overflow-hidden border border-white/20 shadow-lg bg-background/60 backdrop-blur-md">
            @if (profile().posterUrl) {
              <img [src]="profile().posterUrl" alt="Cartel oficial" class="w-full h-full object-cover" />
            } @else {
              <div class="w-full h-full flex items-center justify-center text-rose-300" title="Falta el cartel oficial vertical de la ficha pública">
                <span class="material-symbols-outlined text-sm">imagesmode</span>
              </div>
            }
          </div>

          <!-- Fase del evento -->
          <div class="absolute top-3 right-3">
            <span
              [class]="meta().badgeClass"
              class="px-2.5 py-1 rounded-lg text-[10px] font-black backdrop-blur-md border flex items-center gap-1 shadow-lg"
              [title]="meta().meaning"
            >
              <span class="material-symbols-outlined text-[12px]">{{ meta().icon }}</span>
              {{ meta().shortLabel }}
            </span>
          </div>

          <!-- Fecha y cuenta regresiva -->
          <div class="absolute bottom-3 left-3 right-16 flex items-end justify-between gap-2">
            <div class="min-w-0">
              <span class="text-[10px] font-bold uppercase tracking-wider text-primary block leading-none">
                {{ shortDateLabel() }}
              </span>
              <h3 class="text-sm sm:text-base font-black text-on-surface leading-tight line-clamp-2 mt-1 drop-shadow-lg">
                {{ e.title }}
              </h3>
            </div>
            @if (countdown(); as c) {
              <span
                [class]="countdownClass()"
                class="shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-black backdrop-blur-md border whitespace-nowrap"
              >
                {{ c }}
              </span>
            }
          </div>
        </div>

        <!-- ─── CUERPO ─── -->
        <div class="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col">

          <!-- Recinto -->
          <p class="text-[11px] text-outline font-semibold flex items-center gap-1.5 min-w-0">
            <span class="material-symbols-outlined text-sm text-primary shrink-0">location_on</span>
            <span class="truncate">{{ e.venue }}, {{ e.location }}</span>
          </p>

          <!-- Frase de portada: lo primero que lee el cliente -->
          @if (profile().tagline) {
            <p class="text-[11px] text-on-surface-variant font-medium italic line-clamp-2 leading-relaxed">
              "{{ profile().tagline }}"
            </p>
          }

          <!-- Señales de atención de esta fase -->
          @if (tags().length) {
            <div class="flex items-center gap-1.5 flex-wrap">
              @for (tag of tags(); track tag.label) {
                <span [class]="tagClass(tag.tone)" class="px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1">
                  <span class="material-symbols-outlined text-[11px]">{{ tag.icon }}</span>
                  {{ tag.label }}
                </span>
              }
            </div>
          }

          <!-- Cartel: orden de entradas -->
          <div class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/25 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[9px] font-black uppercase tracking-wider text-outline flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px] text-primary">queue_music</span> Cartel & Orden de Entradas
              </span>
              @if (externalCount() > 0) {
                <span class="text-[9px] font-bold text-amber-300 flex items-center gap-1 shrink-0" title="Grupos de otros encargados: requieren aprobación">
                  <span class="material-symbols-outlined text-[11px]">diversity_3</span> {{ externalCount() }} externo(s)
                </span>
              }
            </div>

            @if (slots().length) {
              <ol class="space-y-1">
                @for (slot of visibleSlots(); track slot.id) {
                  <li class="flex items-center gap-2 min-w-0">
                    <span
                      class="w-[18px] h-[18px] rounded-md bg-primary/15 text-primary border border-primary/25 text-[9px] font-black flex items-center justify-center shrink-0"
                    >{{ slot.order }}</span>

                    @if (slot.imageUrl) {
                      <img [src]="slot.imageUrl" [alt]="slot.groupName" class="w-5 h-5 rounded-md object-cover shrink-0" />
                    } @else {
                      <span class="w-5 h-5 rounded-md bg-surface-bright flex items-center justify-center shrink-0" title="Sin foto para la ficha pública">
                        <span class="material-symbols-outlined text-[10px] text-rose-300">no_photography</span>
                      </span>
                    }

                    <span class="min-w-0 flex-1">
                      <span class="text-[11px] font-bold text-on-surface truncate block" [class.text-primary]="slot.isHeadliner">
                        {{ slot.groupName }}
                        @if (slot.isHeadliner) {
                          <span class="material-symbols-outlined text-[11px] text-primary align-middle" title="Cabeza de cartel">star</span>
                        }
                        @if (slot.isExternal) {
                          <span class="material-symbols-outlined text-[11px] text-amber-300 align-middle" [title]="'Grupo de ' + slot.managerName">person_alert</span>
                        }
                      </span>
                      <span class="text-[9px] text-outline truncate block">{{ slot.genre || 'Sin género para la ficha pública' }}</span>
                    </span>

                    <span class="text-[10px] font-mono text-outline shrink-0">
                      {{ slot.setStartTime || '--:--' }}
                    </span>
                  </li>
                }
              </ol>
              @if (hiddenSlotsCount() > 0) {
                <span class="text-[10px] text-outline font-semibold">+{{ hiddenSlotsCount() }} grupo(s) más en el cartel</span>
              }
            } @else {
              <p class="text-[11px] text-outline italic">Sin grupos asignados todavía</p>
            }
          </div>

          <!-- Dato principal según la fase -->
          <div class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/25 space-y-1">
            <span class="text-[9px] text-outline uppercase font-black tracking-wider flex items-center gap-1.5">
              {{ highlight().caption }}
              @if (highlight().tentative) {
                <span
                  class="px-1.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] normal-case font-bold"
                  title="Todavía no es una cifra real: nadie ha comprado boletos"
                >Proyectado</span>
              }
            </span>
            <span class="font-black text-on-surface text-sm block truncate">{{ highlight().value }}</span>
            @if (highlight().hint) {
              <span class="text-[10px] text-outline block line-clamp-2">{{ highlight().hint }}</span>
            }
            @if (highlight().progressPercent !== undefined) {
              <div class="w-full h-1.5 rounded-full bg-surface-bright overflow-hidden mt-1.5">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  [ngClass]="progressBarClass()"
                  [style.width.%]="clampedProgress()"
                ></div>
              </div>
            }
          </div>

          <!-- Estado de la ficha que ve el cliente -->
          <div class="p-2.5 rounded-2xl bg-surface-container-high border border-outline-variant/25 space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[9px] font-black uppercase tracking-wider text-outline flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px] text-cyan-400">public</span> Ficha del cliente
              </span>
              <span
                class="text-[9px] font-black px-1.5 py-0.5 rounded-md border"
                [class]="publicReady() ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'"
              >
                {{ publicDone() }}/{{ publicTotal() }}
              </span>
            </div>

            <div class="flex items-center gap-1.5 flex-wrap">
              @for (check of publicChecks(); track check.label) {
                <span
                  [class]="check.ok ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : 'bg-rose-500/10 text-rose-300 border-rose-500/25'"
                  class="px-1.5 py-0.5 rounded-md border text-[9px] font-bold flex items-center gap-0.5"
                  [title]="check.hint"
                >
                  <span class="material-symbols-outlined text-[10px]">{{ check.icon }}</span>
                  {{ check.label }}
                </span>
              }
            </div>
          </div>

          <!-- Boletaje y aforo -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-2.5 rounded-xl bg-surface-container-highest/70 border border-outline-variant/20 min-w-0">
              <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Precios desde</span>
              @if (totalTickets() > 0) {
                <span class="font-black text-emerald-400 text-[11px] block truncate">{{ fromPrice() }}</span>
                <span class="text-[10px] text-outline block truncate">
                  {{ tierCount() }} zona(s) · +&#36;{{ fee() }} servicio
                </span>
              } @else {
                <span class="font-bold text-outline text-[11px] block">Sin configurar</span>
              }
            </div>

            <div class="p-2.5 rounded-xl bg-surface-container-highest/70 border border-outline-variant/20 min-w-0">
              <span class="text-[9px] font-black uppercase tracking-wider text-outline block">
                {{ hasSales() ? 'Vendidos' : 'Aforo' }}
              </span>
              @if (totalTickets() > 0) {
                <span class="font-black text-[11px] block truncate" [ngClass]="hasSales() ? 'text-emerald-400' : 'text-on-surface'">
                  {{ hasSales() ? soldLabel() : totalTickets().toLocaleString('es-MX') + ' lugares' }}
                </span>
                <span class="text-[10px] text-outline block truncate">
                  {{ hasSales() ? 'de ' + totalTickets().toLocaleString('es-MX') + ' lugares' : 'a la venta' }}
                </span>
              } @else {
                <span class="font-bold text-outline text-[11px] block">Sin configurar</span>
              }
            </div>
          </div>

          <!-- Costo del cartel (solo para quien puede ver cifras) -->
          @if (roleService.canViewFinances() && lineupCost() > 0) {
            <div class="flex items-center justify-between gap-2 px-1 text-[10px] border-t border-outline-variant/20 pt-2.5">
              <span class="text-outline font-bold uppercase tracking-wider flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px]">payments</span> Costo del cartel
              </span>
              <span class="font-black text-on-surface shrink-0">{{ lineupCostLabel() }}</span>
            </div>
          }

          @if (stalled(); as warning) {
            <p class="text-[10px] text-amber-300/90 font-semibold flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">history_toggle_off</span> {{ warning }}
            </p>
          }

          <!-- ─── ACCIONES ─── -->
          <div class="mt-auto pt-3 border-t border-outline-variant/20 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              (click)="open.emit(e)"
              class="flex-1 py-2.5 min-h-11 rounded-xl bg-surface-bright hover:bg-primary hover:text-on-primary text-on-surface font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span class="material-symbols-outlined text-sm">folder_open</span> Abrir Expediente
            </button>

            @if (e.state === 'Borrador' && roleService.canEditEvents()) {
              <button
                type="button"
                (click)="submitReview.emit(e)"
                [disabled]="!canSubmit()"
                [title]="canSubmit() ? 'Enviar a los encargados para su aprobación' : pendingLabel()"
                class="px-3.5 py-2.5 min-h-11 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40 disabled:pointer-events-none"
              >
                <span class="material-symbols-outlined text-sm">send</span> Enviar a Revisión
              </button>
            }

            @if (roleService.isUsuarioOnly() && allowsEvidence()) {
              <button
                type="button"
                (click)="uploadEvidence.emit(e)"
                class="px-3.5 py-2.5 min-h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                title="Subir fotos o videos de campo sin modificar precios ni fechas"
              >
                <span class="material-symbols-outlined text-sm">add_a_photo</span> Evidencia
              </button>
            }
          </div>

        </div>
      </article>
    }
  `
})
export class EventCardComponent {
  roleService = inject(RoleService);

  event = input.required<EventItem>();

  open = output<EventItem>();
  uploadEvidence = output<EventItem>();
  submitReview = output<EventItem>();

  /** Cuántos grupos del cartel caben en la tarjeta antes de resumir. */
  private readonly MAX_VISIBLE_SLOTS = 3;

  meta = computed(() => eventStateMeta(this.event().state));

  highlight = computed<EventHighlight>(() =>
    cardHighlight(this.event(), this.roleService.canViewFinances())
  );

  tags = computed<EventTag[]>(() => cardTags(this.event()));

  slots = computed(() => lineup(this.event()));

  visibleSlots = computed(() => this.slots().slice(0, this.MAX_VISIBLE_SLOTS));

  hiddenSlotsCount = computed(() => Math.max(0, this.slots().length - this.MAX_VISIBLE_SLOTS));

  externalCount = computed(() => this.slots().filter(s => s.isExternal).length);

  lineupCost = computed(() => lineupTotalCost(this.event()));

  lineupCostLabel = computed(() => money(this.lineupCost()));

  stalled = computed(() => stalledLabel(this.event()));

  totalTickets = computed(() => totalSeats(this.event()));

  tierCount = computed(() => (this.event().ticketTiers || []).length);

  hasSales = computed(() => soldSeats(this.event()) > 0);

  soldLabel = computed(() => soldSeats(this.event()).toLocaleString('es-MX'));

  shortDateLabel = computed(() => shortDate(this.event().date));

  /** Estados en los que el evento ya no está vivo, para atenuar el flyer. */
  isInactive = computed(() => this.event().state === 'Cerrado' || this.event().state === 'Cancelado');

  /** La evidencia de campo solo tiene sentido de la publicación en adelante. */
  allowsEvidence = computed(() => {
    const state = this.event().state;
    return state === 'Publicado' || state === 'En Venta' || state === 'Finalizada';
  });

  canSubmit = computed(() => eventCompleteness(this.event()).canSubmitForReview);

  pendingLabel = computed(() => {
    const missing = eventCompleteness(this.event()).missingRequired;
    if (!missing.length) return 'Listo para enviarse';
    return 'Faltan ' + missing.length + ' puntos obligatorios: ' + missing.slice(0, 3).map(m => m.label).join(', ');
  });

  /** Cuenta regresiva del evento; se calla cuando el expediente ya está cerrado. */
  countdown = computed<string | null>(() => {
    if (this.isInactive()) return null;
    const days = daysUntilEvent(this.event());
    if (!isFinite(days)) return null;
    return relativeDays(days);
  });

  countdownClass = computed(() => {
    const days = daysUntilEvent(this.event());
    if (days < 0) return 'bg-background/80 text-outline border-outline-variant/40';
    if (days <= 7) return 'bg-rose-500/25 text-rose-200 border-rose-400/50';
    if (days <= 30) return 'bg-amber-500/25 text-amber-200 border-amber-400/50';
    return 'bg-background/80 text-on-surface border-outline-variant/40';
  });

  priceRange = computed(() => {
    const low = lowestTicketPrice(this.event());
    const high = highestTicketPrice(this.event());
    if (low <= 0 && high <= 0) return 'Sin precio';
    if (low === high) return '$' + low.toLocaleString('es-MX');
    return '$' + low.toLocaleString('es-MX') + ' – $' + high.toLocaleString('es-MX');
  });

  /** El precio con el que el portal anuncia el evento ("Precios desde…"). */
  fromPrice = computed(() => {
    const low = lowestTicketPrice(this.event());
    return low > 0 ? '$' + low.toLocaleString('es-MX') : 'Por definir';
  });

  fee = computed(() => serviceFee(this.event()));

  profile = computed(() => publicProfile(this.event()));

  /**
   * La imagen de la tarjeta es la misma portada que ve el cliente, cuando ya
   * existe: así el panel y el portal no muestran eventos distintos.
   */
  coverImage = computed(() => this.profile().coverUrl || this.event().flyerUrl);

  /**
   * Resumen de qué tan lista está la ficha pública. Son los cinco bloques que
   * el portal renderiza sí o sí: si alguno falta, el cliente ve un hueco.
   */
  publicChecks = computed(() => {
    const e = this.event();
    const p = this.profile();
    const videos = (e.lineup || []).reduce((sum, s) => sum + (s.invitationVideos || []).length, 0);
    const gruposOk = (e.lineup || []).length > 0 && (e.lineup || []).every(
      s => !!s.imageUrl?.trim() && !!s.genre?.trim() && !!s.profileSlug?.trim() && (s.rating ?? 0) > 0
    );

    return [
      { label: 'Portada', icon: 'wallpaper', ok: !!p.coverUrl, hint: 'Imagen panorámica del encabezado de la ficha' },
      { label: 'Cartel', icon: 'imagesmode', ok: !!p.posterUrl, hint: 'Cartel vertical que el cliente amplía con la lupa' },
      { label: 'Textos', icon: 'edit_note', ok: p.about.trim().length >= 80 && p.tagline.trim().length >= 15, hint: 'Frase de portada e información del evento' },
      { label: 'Reglas', icon: 'gavel', ok: p.rules.length >= 3, hint: 'Reglas e información adicional al pie de la ficha' },
      { label: 'Grupos', icon: 'groups', ok: gruposOk, hint: 'Foto, género, calificación y perfil de cada grupo del line-up' },
      { label: 'Videos', icon: 'videocam', ok: videos > 0, hint: 'Saludos de los artistas que el portal reproduce' }
    ];
  });

  publicDone = computed(() => this.publicChecks().filter(c => c.ok).length);

  publicTotal = computed(() => this.publicChecks().length);

  publicReady = computed(() => this.publicDone() === this.publicTotal());

  clampedProgress = computed(() => Math.max(0, Math.min(100, this.highlight().progressPercent ?? 0)));

  progressBarClass(): string {
    switch (this.highlight().progressTone) {
      case 'success': return 'bg-emerald-400';
      case 'warning': return 'bg-amber-400';
      case 'error': return 'bg-rose-400';
      default: return 'bg-primary';
    }
  }

  tagClass(tone: EventTag['tone']): string {
    switch (tone) {
      case 'success': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'warning': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'danger': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'info': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      default: return 'bg-surface-container-highest text-outline border-outline-variant/30';
    }
  }
}
