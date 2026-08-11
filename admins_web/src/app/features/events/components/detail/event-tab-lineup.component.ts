import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EventItem,
  EventLineupSlot,
  EventCostItem,
  EventInvitationVideo,
  EventCounterOffer,
  EventManagerAgreement,
  LineupEngagementKind
} from '../../../../core/models/event.models';
import { GroupItem } from '../../../../core/models/admin.models';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import {
  activeCounterOffer,
  counterOfferSavings,
  dateTimeLabel,
  isCoOrganizedSlot,
  isQuoteSlot,
  lineup,
  lineupTotalCost,
  money,
  pendingOutboundCount,
  slotCost,
  slotOfferAmount,
  slotProposedFee,
  slotPublishedTotal,
  slugify,
  unsentLineupRequests,
  unsentManagerInvites
} from '../../event-metrics';

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
          <button
            type="button"
            (click)="addModalOpen.set(true)"
            [disabled]="selectableGroups().length === 0"
            class="px-3.5 py-2 min-h-10 rounded-xl bg-primary/20 text-primary border border-primary/40 hover:bg-primary hover:text-on-primary text-[11px] font-black transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:pointer-events-none"
          >
            <span class="material-symbols-outlined text-sm">group_add</span> Agregar grupo
          </button>
        }
      </div>

      <!-- Nada de lo que se decide aquí sale del borrador. Se dice explícito
           porque el encargado necesita saber que puede armar, cambiar de opinión
           y contraofertar sin que el otro manager se entere de cada intento. -->
      @if (isDraft() && outboundCount() > 0) {
        <div class="p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 border-l-4 border-l-amber-500/70 space-y-2.5 shadow-lg">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-base">outbox</span>
            </span>
            <div class="min-w-0">
              <h5 class="text-[11px] font-black uppercase tracking-wider text-amber-300">
                {{ outboundCount() }} aviso(s) esperando el envío a revisión
              </h5>
              <p class="text-[10px] text-outline">
                Mientras el evento sea borrador, nadie de fuera recibe nada
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            @if (unsentQuoteSlots().length) {
              <span class="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-200 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[13px]">request_quote</span>
                {{ unsentQuoteSlots().length }} solicitud(es) de cotización directa
              </span>
            }
            @if (unsentCoorgSlots().length) {
              <span class="px-2.5 py-1 rounded-xl bg-sky-500/15 border border-sky-500/30 text-[10px] font-bold text-sky-200 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[13px]">handshake</span>
                {{ unsentCoorgSlots().length }} grupo(s) por co-organización
              </span>
            }
            @if (unsentInvites().length) {
              <span class="px-2.5 py-1 rounded-xl bg-sky-500/15 border border-sky-500/30 text-[10px] font-bold text-sky-200 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[13px]">person_add</span>
                {{ unsentInvites().length }} invitación(es) a manager
              </span>
            }
          </div>
        </div>
      }

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
              <!-- La etiqueta dice la VÍA por la que entra el grupo, no de quién
                   es: el mismo grupo ajeno se trae de las dos maneras y lo que
                   cambia todo (quién ve los números, quién decide) es la vía. -->
              @if (!slot.isExternal) {
                <span class="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
                  Grupo Propio
                </span>
              } @else if (isCoOrganizerSlot(slot)) {
                <span class="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[9px] font-black uppercase tracking-wider shadow-sm">
                  Co-Organización
                </span>
              } @else {
                <span class="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider">
                  Cotización Directa
                </span>
              }
              @if (missingPublic(slot)) {
                <span
                  class="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-black flex items-center gap-1"
                  title="Faltan datos que el cliente ve en la ficha pública"
                >
                  <span class="material-symbols-outlined text-[11px]">public_off</span> Ficha incompleta
                </span>
              }
              @if (slot.isExternal) {
                <span [class]="approvalClass(slot.approval)" class="px-2 py-1 rounded-lg text-[9px] font-black border flex items-center gap-1">
                  <span class="material-symbols-outlined text-[11px]">{{ approvalIcon(slot.approval) }}</span>
                  {{ approvalLabel(slot.approval) }}
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

              <!-- Estado real de la solicitud al dueño del grupo. En borrador
                   todavía no ha salido nada, y decirlo evita que el encargado
                   crea que ya está negociando cuando aún no ha mandado nada. -->
              @if (slot.isExternal) {
                <div
                  class="p-3.5 rounded-xl border text-xs space-y-2"
                  [class]="slot.approval === 'Sin Enviar'
                    ? 'bg-surface-container-highest/60 border-outline-variant/35 text-on-surface-variant'
                    : (isCoOrganizerSlot(slot)
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-200')"
                >
                  <div class="flex items-center justify-between gap-3 flex-wrap">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="material-symbols-outlined text-base shrink-0"
                        [class]="slot.approval === 'Sin Enviar'
                          ? 'text-outline'
                          : (isCoOrganizerSlot(slot) ? 'text-sky-300' : 'text-amber-300')">
                        {{ slot.approval === 'Sin Enviar' ? 'schedule_send' : (isCoOrganizerSlot(slot) ? 'group_add' : 'outgoing_mail') }}
                      </span>
                      <span>
                        @if (slot.approval === 'Sin Enviar') {
                          Se le enviará a <strong class="text-on-surface">{{ slot.managerName }}</strong> al mandar el evento a revisión.
                        } @else {
                          Solicitud enviada a <strong>{{ slot.managerName }}</strong>
                          @if (slot.requestSentAt) { el {{ dateTimeLabel(slot.requestSentAt) }} }.
                        }
                      </span>
                    </div>
                    <span [class]="approvalClass(slot.approval)" class="px-2.5 py-1 rounded-lg text-[10px] font-black border shrink-0">
                      {{ approvalLabel(slot.approval) }}
                    </span>
                  </div>

                  <!-- Qué es exactamente lo que va a recibir. Son dos cosas muy
                       distintas y de ahí depende cuánto del evento verá. -->
                  <p class="text-[10px] leading-relaxed pt-1.5 border-t"
                    [class]="slot.approval === 'Sin Enviar' ? 'border-outline-variant/20 text-outline' : 'border-white/10'">
                    @if (isCoOrganizerSlot(slot)) {
                      <strong>Co-organización:</strong> {{ slot.managerName }} entra al evento. Verá boletaje,
                      precios y avance de venta, y podrá sugerir grupos — aceptarlos sigue siendo decisión tuya.
                      No verá lo que ganan tus grupos ni los de los demás managers.
                    } @else {
                      <strong>Cotización directa:</strong> {{ slot.managerName }} solo recibe la oferta, el lugar,
                      la hora de llegada, la prueba de sonido y la duración. No entra al evento ni ve boletaje,
                      ventas ni ganancias.
                      @if (canViewFinances()) {
                        Se ofertan <strong class="font-mono">{{ money(offerAmount(slot)) }}</strong>
                        @if (slot.counterOffer && slot.counterOffer.status !== 'Rechazada') { (contraoferta) } @else { (su tarifa publicada) }.
                      }
                    }
                  </p>
                </div>
              }

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

                <!-- Estos datos son del alta del grupo, no del evento: se
                     muestran para confirmar qué verá el cliente, pero editarlos
                     aquí crearía una versión del grupo distinta en cada evento. -->
                <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25 space-y-3">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <span class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[13px]">lock</span>
                      Datos de alta del grupo
                    </span>
                    <span class="text-[9px] text-outline">Solo lectura · se editan en el expediente del grupo</span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Nombre en cartelera</span>
                      <span class="text-xs font-bold text-on-surface break-words">{{ slot.groupName }}</span>
                    </div>
                    <div>
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Género musical</span>
                      <span class="text-xs font-bold text-on-surface break-words">{{ slot.genre || 'Sin género capturado' }}</span>
                    </div>
                    <div>
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Calificación pública</span>
                      <span class="text-xs font-bold text-amber-300 font-mono">
                        {{ slot.rating != null ? '★ ' + slot.rating : 'Sin calificación' }}
                      </span>
                    </div>
                    <div>
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Perfil público</span>
                      <span class="text-xs font-mono text-on-surface break-all">
                        {{ slot.profileSlug ? '/grupo/' + slot.profileSlug : 'Sin perfil enlazado' }}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <!-- 1B · PRESUPUESTO / TARIFA (Oculto para grupos de co-organizadores) -->
              @if (canViewFinances() && !isCoOrganizerSlot(slot)) {
                <div
                  class="p-3.5 rounded-xl border space-y-3"
                  [class]="slot.isExternal
                    ? 'bg-amber-500/[0.06] border-amber-500/25'
                    : 'bg-emerald-500/[0.06] border-emerald-500/25'"
                >
                  @let live = liveCounter(slot);

                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <h5 class="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                      [class]="slot.isExternal ? 'text-amber-300' : 'text-emerald-300'">
                      <span class="material-symbols-outlined text-[13px]">{{ live ? 'gavel' : 'payments' }}</span>
                      @if (!slot.isExternal) {
                        Presupuesto asignado al grupo
                      } @else if (live) {
                        Tarifa negociada · contraoferta {{ counterStatusLabel(live.status) }}
                      } @else {
                        Tarifa del grupo (de otro manager)
                      }
                    </h5>
                    @if (live) {
                      <span [class]="counterStatusClass(live.status)" class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border">
                        {{ counterStatusLabel(live.status) }}
                      </span>
                    }
                  </div>

                  @if (slot.isExternal) {
                    <!-- Externo: el importe no se teclea. Lo fija su dueño y solo
                         se mueve cambiando las horas o vía contraoferta. Con una
                         contraoferta viva, ella pasa a ser la tarifa base: es la
                         cifra que de verdad se va a pagar si el dueño acepta, así
                         que las horas y el total se calculan sobre ella. -->
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-wider text-outline block">
                          {{ live ? 'Tu contraoferta' : 'Costo fijo' }}
                        </span>
                        @if (live) {
                          <span class="text-xs font-black text-amber-300 font-mono">{{ money(live.amount) }}</span>
                          <span class="text-[9px] text-outline block">por {{ live.hours || slot.minimumHours || 3 }} h</span>
                        } @else {
                          <span class="text-xs font-black text-on-surface font-mono">{{ money(slot.publishedFee || 0) }}</span>
                        }
                      </div>
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-wider text-outline block">
                          {{ live ? 'Tarifa publicada' : 'Horas mínimas' }}
                        </span>
                        @if (live) {
                          <span class="text-xs font-black text-outline font-mono line-through">{{ money(publishedTotal(slot)) }}</span>
                          <span class="text-[9px] block" [class]="savings(slot) >= 0 ? 'text-emerald-300' : 'text-rose-300'">
                            {{ savings(slot) >= 0 ? 'Ahorro ' : 'Sobrecosto ' }}{{ money(absSavings(slot)) }}
                          </span>
                        } @else {
                          <span class="text-xs font-black text-on-surface font-mono">{{ slot.minimumHours || 3 }} h</span>
                        }
                      </div>
                      <app-editable-field
                        label="Horas del evento"
                        type="number"
                        [groupThousands]="false"
                        [value]="slot.contractedHours ?? (slot.minimumHours || 3)"
                        [readonly]="!canEdit()"
                        (save)="setHours(slot, $event)"
                      />
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-wider text-outline block">
                          {{ live ? 'Total propuesto' : 'Total a pagar' }}
                        </span>
                        <span class="text-sm font-black text-amber-300 font-mono">{{ money(proposedTotal(slot)) }}</span>
                        @if (live && live.status !== 'Aceptada') {
                          <span class="text-[9px] text-outline block">si {{ slot.managerName }} acepta</span>
                        }
                      </div>
                    </div>

                    @if (live) {
                      <!-- La misma probabilidad que se calculó al armarla, ahora
                           fija en la ficha: es lo que dice si conviene esperar la
                           respuesta o subir la oferta antes de mandarla. -->
                      <div class="p-3 rounded-xl bg-surface-container/80 border border-outline-variant/25 space-y-2.5">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[13px] text-amber-400">analytics</span>
                            Probabilidad de aceptación
                          </span>
                          <span [class]="savedOdds(slot).badgeClass" class="px-2 py-0.5 rounded-md text-[10px] font-black border">
                            {{ savedOdds(slot).label }}
                          </span>
                        </div>

                        <div class="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all duration-300"
                            [class]="savedOdds(slot).percent >= 80 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : (savedOdds(slot).percent >= 50 ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]')"
                            [style.width.%]="savedOdds(slot).percent"
                          ></div>
                        </div>

                        <div class="flex items-start gap-2">
                          <span class="material-symbols-outlined text-[13px] shrink-0 mt-0.5" [class]="savedOdds(slot).class">lightbulb</span>
                          <p class="text-[10px] text-on-surface-variant font-medium leading-relaxed">
                            <strong>Recomendación:</strong> {{ savedOdds(slot).advice }}
                          </p>
                        </div>

                        @if (live.note) {
                          <p class="text-[10px] text-outline italic pt-2 border-t border-outline-variant/20">
                            Nota enviada al manager: "{{ live.note }}"
                          </p>
                        }
                      </div>

                      <!-- Hasta que el dueño acepte, el evento sigue debiendo la
                           tarifa de lista. Se dice aquí para que el total del
                           cartel no parezca un error de captura. -->
                      @if (live.status !== 'Aceptada') {
                        <p class="text-[10px] text-outline flex items-start gap-1.5">
                          <span class="material-symbols-outlined text-[13px] shrink-0">savings</span>
                          Mientras no la acepte, el cartel sigue comprometiendo la tarifa publicada
                          (<strong class="font-mono text-on-surface">{{ money(publishedTotal(slot)) }}</strong>).
                          El ahorro se da por bueno cuando responda.
                        </p>
                      }
                    } @else {
                      <p class="text-[10px] text-outline flex items-start gap-1.5">
                        <span class="material-symbols-outlined text-[13px] shrink-0">info</span>
                        El total sube con las horas y no se edita a mano. Para pagar otra cifra, manda una contraoferta.
                      </p>
                    }

                    @if (slot.counterOffer?.status === 'Rechazada') {
                      <p class="text-[10px] text-rose-300 flex items-start gap-1.5">
                        <span class="material-symbols-outlined text-[13px] shrink-0">cancel</span>
                        {{ slot.managerName }} rechazó tu contraoferta de {{ money(slot.counterOffer!.amount) }}.
                        Vuelve a mandar otra o quédate con su tarifa publicada.
                      </p>
                    }

                    @if (canEdit() && slot.counterOffer?.status !== 'Aceptada') {
                      <button
                        type="button"
                        (click)="openCounterOffer(slot)"
                        class="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500 hover:text-black text-[11px] font-black transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <span class="material-symbols-outlined text-sm">gavel</span>
                        @if (slot.counterOffer) {
                          Cambiar contraoferta
                        } @else {
                          {{ isDraft() ? 'Preparar contraoferta' : 'Enviar contraoferta' }}
                        }
                      </button>
                    }
                  } @else {
                    <!-- Propio: el manager decide libremente cuánto le da. -->
                    <div class="grid grid-cols-2 gap-3">
                      <app-editable-field
                        label="Presupuesto personalizado"
                        type="number"
                        prefix="$"
                        [value]="slot.agreedTotal ?? 0"
                        [readonly]="!canEdit()"
                        (save)="patchSlot(slot, { agreedTotal: toNumber($event) })"
                      />
                      <app-editable-field
                        label="Horas de show"
                        type="number"
                        [groupThousands]="false"
                        [value]="slot.contractedHours ?? (slot.minimumHours || 3)"
                        [readonly]="!canEdit()"
                        (save)="patchSlot(slot, { contractedHours: toNumber($event) })"
                      />
                    </div>
                    <p class="text-[10px] text-outline flex items-start gap-1.5">
                      <span class="material-symbols-outlined text-[13px] shrink-0">info</span>
                      Es tu grupo: fijas el monto que quieras, sin pedirle autorización a nadie.
                    </p>
                  }
                </div>
              }

              <!-- 2 · PROGRAMACIÓN -->
              <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/25 space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <h5 class="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]">schedule</span> Programación del día
                  </h5>
                  @if (isCoOrganizerSlot(slot)) {
                    <span class="text-[9px] text-outline italic">Inmutable · Debe completarla el co-organizador del grupo</span>
                  } @else if (isThirdPartySlot(slot)) {
                    <span class="text-[9px] text-cyan-300/80 italic">Propuesta de horarios (se envía en la oferta)</span>
                  }
                </div>

                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <app-editable-field
                    label="Hora de llegada"
                    placeholder="17:00"
                    [value]="slot.arrivalTime || ''"
                    [readonly]="!canEdit() || isCoOrganizerSlot(slot)"
                    (save)="patchSlot(slot, { arrivalTime: $event })"
                  />
                  <app-editable-field
                    label="Prueba de sonido"
                    placeholder="17:30"
                    [value]="slot.soundCheckTime || ''"
                    [readonly]="!canEdit() || isCoOrganizerSlot(slot)"
                    (save)="patchSlot(slot, { soundCheckTime: $event })"
                  />
                  <app-editable-field
                    label="Entra a tocar"
                    placeholder="20:00"
                    [value]="slot.setStartTime || ''"
                    [readonly]="!canEdit() || isCoOrganizerSlot(slot)"
                    (save)="patchSlot(slot, { setStartTime: $event })"
                  />
                  <app-editable-field
                    label="Termina"
                    placeholder="21:00"
                    [value]="slot.setEndTime || ''"
                    [readonly]="!canEdit() || isCoOrganizerSlot(slot)"
                    (save)="patchSlot(slot, { setEndTime: $event })"
                  />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-outline-variant/20">
                  <app-editable-field
                    label="Encargado responsable"
                    [value]="slot.managerName"
                    [readonly]="!canEdit() || slot.isExternal"
                    (save)="patchSlot(slot, { managerName: $event })"
                  />
                  <app-editable-field
                    label="Correo del encargado"
                    type="email"
                    [value]="slot.managerEmail || ''"
                    [readonly]="!canEdit() || slot.isExternal"
                    (save)="patchSlot(slot, { managerEmail: $event })"
                  />
                  <app-editable-field
                    label="Teléfono del encargado"
                    type="tel"
                    [value]="slot.managerPhone || ''"
                    [readonly]="!canEdit() || slot.isExternal"
                    (save)="patchSlot(slot, { managerPhone: $event })"
                  />
                </div>
              </div>

              <!-- 3 · COSTOS (Oculto para grupos de co-organizadores) -->
              @if (canViewFinances() && !isCoOrganizerSlot(slot)) {
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

              <!-- 4 · VIDEOS DE INVITACIÓN (Ocultos para terceros hasta que acepten la propuesta) -->
              @if (isThirdPartySlot(slot) && slot.approval !== 'Aprobado') {
                <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/25">
                  <p class="text-[10px] text-amber-300/90 italic flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px] text-amber-400">lock</span>
                    Los videos de invitación estarán disponibles una vez que el manager acepte la propuesta/contraoferta.
                  </p>
                </div>
              } @else {
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
              }

            </div>
          }
        </section>
      }
    </div>

    <!-- ─── MODAL: CONTRAOFERTA A UN GRUPO EXTERNO ─── -->
    @if (counterSlot(); as slot) {
      <div
        class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
        (click)="counterSlot.set(null)"
      >
        <div
          class="w-full max-w-lg bg-gradient-to-b from-[#2a1f0d] via-[#1a1408] to-[#0d0b06] border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(245,158,11,0.22)] relative overflow-hidden space-y-5"
          (click)="$event.stopPropagation()"
        >
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <header class="flex items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
            <div class="flex items-center gap-3 min-w-0">
              <span class="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-lg shrink-0">
                <span class="material-symbols-outlined text-xl">gavel</span>
              </span>
              <div class="min-w-0">
                <h3 class="text-base font-black text-on-surface tracking-tight">
                  {{ isDraft() ? 'PREPARAR CONTRAOFERTA' : 'ENVIAR CONTRAOFERTA' }}
                </h3>
                <p class="text-[11px] text-outline truncate">{{ slot.groupName }} · Manager: {{ slot.managerName }}</p>
              </div>
            </div>
            <button
              type="button"
              (click)="counterSlot.set(null)"
              class="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-outline flex items-center justify-center transition-all shrink-0"
            >
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </header>

          <div class="space-y-4 relative z-10">
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3.5 rounded-2xl bg-black/30 border border-white/10">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Su tarifa publicada</span>
                <span class="text-lg font-black text-on-surface font-mono">{{ money(publishedTotal(slot)) }}</span>
                <span class="text-[10px] text-outline block">
                  por {{ slot.contractedHours ?? (slot.minimumHours || 3) }} h
                </span>
              </div>
              <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <span class="text-[10px] font-black uppercase tracking-wider text-amber-300 block">Tu propuesta</span>
                <span class="text-lg font-black text-amber-300 font-mono">{{ money(counterAmount()) }}</span>
                <span class="text-[10px] block"
                  [class]="counterDelta() <= 0 ? 'text-emerald-300' : 'text-rose-300'">
                  {{ counterDelta() <= 0 ? 'Ahorro ' : 'Sobrecosto ' }}{{ money(absCounterDelta()) }}
                </span>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Costo Fijo / Importe Propuesto ($ MXN)</label>
              <input
                type="number"
                [value]="counterAmount()"
                (input)="counterAmount.set(+$any($event.target).value)"
                class="w-full px-4 py-3 rounded-2xl bg-black/40 border border-outline-variant/30 text-sm font-black font-mono text-on-surface focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>

            <!-- Probabilidad de Aceptación y Recomendación Inteligente -->
            <div class="p-3.5 rounded-2xl bg-surface-container/80 border border-outline-variant/25 space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[13px] text-amber-400">analytics</span>
                  Probabilidad de aceptación
                </span>
                <span [class]="counterProbabilityInfo().badgeClass" class="px-2 py-0.5 rounded-md text-[10px] font-black border">
                  {{ counterProbabilityInfo().label }}
                </span>
              </div>

              <!-- Barra visual de probabilidad -->
              <div class="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  [class]="counterProbabilityInfo().percent >= 80 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : (counterProbabilityInfo().percent >= 50 ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]')"
                  [style.width.%]="counterProbabilityInfo().percent"
                ></div>
              </div>

              <div class="flex items-start gap-2 pt-0.5">
                <span class="material-symbols-outlined text-[13px] shrink-0 mt-0.5" [class]="counterProbabilityInfo().class">lightbulb</span>
                <p class="text-[10px] text-on-surface-variant font-medium leading-relaxed">
                  <strong>Recomendación:</strong> {{ counterProbabilityInfo().advice }}
                </p>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Motivo o nota para el manager</label>
              <textarea
                rows="3"
                [value]="counterNote()"
                (input)="counterNote.set($any($event.target).value)"
                placeholder="Ej. El evento es de 3 horas y ya cubrimos hospedaje y transporte."
                class="w-full px-4 py-3 rounded-2xl bg-black/40 border border-outline-variant/30 text-xs font-medium text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
              ></textarea>
            </div>

            <p class="text-[11px] text-outline flex items-start gap-2">
              <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">info</span>
              <span>
                @if (isDraft()) {
                  La contraoferta se guarda en el borrador y <strong class="text-on-surface">no se manda todavía</strong>:
                  sale junto con la solicitud cuando envíes el evento a revisión. Puedes cambiarla las veces que quieras
                  sin que el manager se entere.
                } @else {
                  El grupo queda <strong class="text-amber-300">Pendiente</strong> hasta que su manager responda.
                  Mientras tanto el costo que cuenta sigue siendo el publicado.
                }
              </span>
            </p>
          </div>

          <footer class="flex items-center justify-end gap-3 pt-4 border-t border-white/10 relative z-10">
            <button
              type="button"
              (click)="counterSlot.set(null)"
              class="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-outline text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="submitCounterOffer()"
              [disabled]="counterAmount() <= 0"
              class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {{ isDraft() ? 'Guardar contraoferta' : 'Enviar contraoferta' }}
            </button>
          </footer>
        </div>
      </div>
    }

    <!-- ─── MODAL: AGREGAR GRUPO AL CARTEL ─── -->
    @if (addModalOpen()) {
      <div
        class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
        (click)="addModalOpen.set(false)"
      >
        <div
          class="w-full max-w-3xl bg-gradient-to-b from-[#1c1836] via-[#141126] to-[#0d0b1a] border border-primary/30 rounded-3xl shadow-[0_0_80px_rgba(242,202,80,0.2)] relative overflow-hidden flex flex-col max-h-[88vh]"
          (click)="$event.stopPropagation()"
        >
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

          <header class="shrink-0 flex items-center justify-between gap-3 p-6 border-b border-white/10 relative z-10">
            <div class="flex items-center gap-3 min-w-0">
              <span class="w-11 h-11 rounded-2xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center shadow-lg shrink-0">
                <span class="material-symbols-outlined text-xl">group_add</span>
              </span>
              <div class="min-w-0">
                <h3 class="text-base font-black text-on-surface tracking-tight">AGREGAR GRUPO AL CARTEL</h3>
                <p class="text-[11px] text-outline">
                  @if (isDraft()) {
                    Nada de lo que elijas aquí se envía todavía: sale al mandar el evento a revisión
                  } @else {
                    Los grupos ajenos se traen por cotización directa o invitando a su manager a co-organizar
                  }
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="addModalOpen.set(false)"
              class="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-outline flex items-center justify-center transition-all shrink-0"
            >
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </header>

          <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-6 relative z-10">

            <!-- 1. Grupos propios: se añaden directo y se les pone presupuesto. -->
            <section class="space-y-3">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <h4 class="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                  <span class="material-symbols-outlined text-base">verified_user</span>
                  Mis grupos ({{ ownGroups().length }})
                </h4>
                <span class="text-[10px] text-outline">Entran al cartel sin pedir permiso a nadie</span>
              </div>

              @for (g of ownGroups(); track g.id) {
                <div class="p-3.5 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/25 flex items-center justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-3 min-w-0">
                    <img [src]="g.image" [alt]="g.name" class="w-11 h-11 rounded-xl object-cover shrink-0 border border-white/10" />
                    <div class="min-w-0">
                      <p class="text-xs font-black text-on-surface truncate">{{ g.name }}</p>
                      <p class="text-[10px] text-outline truncate">{{ g.genre }} · {{ g.agendaStatus }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2.5 shrink-0">
                    @if (canViewFinances()) {
                      <span class="text-[10px] text-outline">
                        Presupuesto sugerido
                        <strong class="text-on-surface font-mono block text-right">{{ feeLabel(g) }}</strong>
                      </span>
                    }
                    <button
                      type="button"
                      (click)="addGroup(g.id)"
                      class="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black text-[11px] font-black transition-all active:scale-95"
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="p-4 text-center text-[11px] text-outline italic bg-surface-container/40 rounded-2xl border border-dashed border-outline-variant/30">
                  No te quedan grupos propios disponibles.
                </p>
              }
            </section>

            <!-- 2. Grupos ajenos: TODOS, invitado o no su manager.
                 Antes solo aparecían los de managers ya invitados, lo que
                 obligaba a invitar a ciegas para poder ver siquiera qué grupos
                 tenía. Ahora se ve el catálogo completo y lo que se elige por
                 grupo es la VÍA: pagarle una cotización a su dueño, o meter a su
                 dueño al evento como co-organizador. -->
            <section class="space-y-3">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <h4 class="text-[11px] font-black uppercase tracking-wider text-on-surface flex items-center gap-2">
                  <span class="material-symbols-outlined text-base text-primary">diversity_3</span>
                  Grupos de otros managers ({{ foreignGroups().length }})
                </h4>
                <span class="text-[10px] text-outline">Elige cómo lo traes: cada vía cambia quién ve el evento</span>
              </div>

              <!-- Las dos vías, explicadas una vez arriba en lugar de repetirlas
                   en cada tarjeta. -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="p-3 rounded-2xl bg-amber-500/[0.07] border border-amber-500/25 space-y-1">
                  <span class="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]">request_quote</span> Cotización directa
                  </span>
                  <p class="text-[10px] text-outline leading-relaxed">
                    Le pagas al dueño del grupo por unas horas y ahí acaba. No entra al evento ni ve boletaje,
                    ventas ni ganancias: solo lugar, hora de llegada, prueba de sonido y duración.
                  </p>
                </div>
                <div class="p-3 rounded-2xl bg-sky-500/[0.08] border border-sky-500/30 space-y-1">
                  <span class="text-[10px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]">handshake</span> Invitando a su manager
                  </span>
                  <p class="text-[10px] text-outline leading-relaxed">
                    El dueño co-organiza: ve boletaje, precios y avance de venta, y puede sugerir grupos —
                    aceptarlos lo decides tú. No ve lo que ganan tus grupos ni los de los demás.
                  </p>
                </div>
              </div>

              @for (g of foreignGroups(); track g.id) {
                @let invite = managerInviteState(g.groupLeaderName);
                <div class="p-3.5 rounded-2xl bg-surface-container/50 border border-outline-variant/25 space-y-3">
                  <div class="flex items-center justify-between gap-3 flex-wrap">
                    <div class="flex items-center gap-3 min-w-0">
                      <img [src]="g.image" [alt]="g.name" class="w-11 h-11 rounded-xl object-cover shrink-0 border border-white/10" />
                      <div class="min-w-0">
                        <p class="text-xs font-black text-on-surface truncate">{{ g.name }}</p>
                        <p class="text-[10px] text-outline truncate">{{ g.genre }} · Manager: {{ g.groupLeaderName }}</p>
                        <p class="text-[10px] text-outline truncate">Agenda: {{ g.agendaStatus }}</p>
                      </div>
                    </div>
                    @if (canViewFinances()) {
                      <span class="text-[10px] text-outline text-right shrink-0">
                        Costo fijo
                        <strong class="text-amber-300 font-mono block">{{ feeLabel(g) }}</strong>
                        <span class="block text-outline">por {{ g.minimumHours || 3 }} h mínimas</span>
                      </span>
                    }
                  </div>

                  <div class="flex items-center gap-2 flex-wrap pt-2.5 border-t border-outline-variant/20">
                    <!-- Cotización directa: solo si su manager no está ya dentro
                         del evento. Pagarle una cotización a alguien que es
                         co-organizador y ve toda la taquilla no tiene sentido. -->
                    @if (invite) {
                      <span class="px-2.5 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-[10px] font-bold text-sky-200 flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">handshake</span>
                        {{ g.groupLeaderName }} ya co-organiza · {{ inviteStateLabel(invite) }}
                      </span>
                      <button
                        type="button"
                        (click)="addGroup(g.id, 'coorganizacion')"
                        class="ml-auto px-3.5 py-2 rounded-xl bg-sky-500/25 text-sky-200 border border-sky-500/40 hover:bg-sky-400 hover:text-black text-[11px] font-black transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
                      >
                        <span class="material-symbols-outlined text-sm">add</span> Añadir a su cartel
                      </button>
                    } @else {
                      <button
                        type="button"
                        (click)="addGroup(g.id, 'cotizacion')"
                        class="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500 hover:text-black text-[11px] font-black transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <span class="material-symbols-outlined text-sm">request_quote</span> Cotización directa
                      </button>
                      <button
                        type="button"
                        (click)="addGroup(g.id, 'coorganizacion')"
                        class="px-3.5 py-2 rounded-xl bg-sky-500/25 text-sky-200 border border-sky-500/40 hover:bg-sky-400 hover:text-black text-[11px] font-black transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <span class="material-symbols-outlined text-sm">person_add</span> Invitar a {{ g.groupLeaderName }}
                      </button>
                    }
                  </div>
                </div>
              } @empty {
                <p class="p-4 text-center text-[11px] text-outline italic bg-surface-container/40 rounded-2xl border border-dashed border-outline-variant/30">
                  No hay grupos de otros managers disponibles.
                </p>
              }
            </section>
          </div>
        </div>
      </div>
    }
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

  addModalOpen = signal(false);

  /** Quién arma el evento: contra él se decide si un grupo es propio o ajeno. */
  private ownerName = computed(() => this.event().ownerManagerName || this.event().createdBy);

  /**
   * En borrador nada sale del evento. Es la frontera que decide si al agregar un
   * grupo ajeno se le manda la solicitud a su dueño o solo se deja lista.
   */
  isDraft = computed(() => this.event().state === 'Borrador');

  /** Grupos propios del organizador. */
  ownGroups = computed(() =>
    this.selectableGroups().filter(g => g.groupLeaderName === this.ownerName())
  );

  /**
   * Todos los grupos que no son del organizador, esté o no invitado su manager.
   * La vía por la que entran se elige al agregarlos, no se hereda de si el
   * manager ya está dentro del evento.
   */
  foreignGroups = computed(() =>
    this.selectableGroups().filter(g => g.groupLeaderName !== this.ownerName())
  );

  /** Acuerdo del manager de un grupo en este evento, si ya existe alguno. */
  managerInviteState(managerName: string): EventManagerAgreement | null {
    return (this.event().managerAgreements ?? [])
      .find(a => a.role === 'coorganizador' && a.managerName === managerName) ?? null;
  }

  inviteStateLabel(agreement: EventManagerAgreement): string {
    return agreement.status === 'Sin Enviar' ? 'invitación por enviar' : 'invitación ' + agreement.status.toLowerCase();
  }

  isCoOrganizerSlot(slot: EventLineupSlot): boolean {
    return isCoOrganizedSlot(this.event(), slot);
  }

  isThirdPartySlot(slot: EventLineupSlot): boolean {
    return isQuoteSlot(this.event(), slot);
  }

  // ─── Lo que espera el envío a revisión ────────────────────────────────────

  unsentQuoteSlots = computed(() =>
    unsentLineupRequests(this.event()).filter(s => this.isThirdPartySlot(s))
  );

  unsentCoorgSlots = computed(() =>
    unsentLineupRequests(this.event()).filter(s => this.isCoOrganizerSlot(s))
  );

  unsentInvites = computed(() => unsentManagerInvites(this.event()));

  outboundCount = computed(() => pendingOutboundCount(this.event()));

  offerAmount = slotOfferAmount;
  dateTimeLabel = dateTimeLabel;

  feeLabel(g: GroupItem): string {
    return money(g.artistFeeBase || 0);
  }

  money = money;

  // ─── Contraoferta ──────────────────────────────────────────────────────────

  counterSlot = signal<EventLineupSlot | null>(null);
  counterAmount = signal(0);
  counterNote = signal('');

  /** Diferencia contra la tarifa de lista del grupo; negativa es ahorro. */
  counterDelta = computed(() => {
    const slot = this.counterSlot();
    if (!slot) return 0;
    return this.counterAmount() - slotPublishedTotal(slot);
  });

  absCounterDelta = computed(() => Math.abs(this.counterDelta()));

  /** Probabilidad calculada de aceptación de la contraoferta (0-100%) y su recomendación */
  counterProbabilityInfo = computed(() => {
    const slot = this.counterSlot();
    if (!slot) return this.acceptanceOdds(1, 1);
    return this.acceptanceOdds(this.counterAmount(), slotPublishedTotal(slot));
  });

  /**
   * Probabilidad de aceptación de la contraoferta ya guardada de un grupo, para
   * poder mostrarla en la ficha del grupo y no solo mientras el modal está
   * abierto: una vez guardada, es el dato que dice si vale la pena esperar la
   * respuesta o conviene subir la oferta.
   */
  savedOdds(slot: EventLineupSlot) {
    const co = activeCounterOffer(slot);
    return this.acceptanceOdds(co ? slotProposedFee(slot) : 0, slotPublishedTotal(slot));
  }

  /**
   * Qué tan probable es que el dueño acepte, según cuánto se aleja la propuesta
   * de su tarifa de lista por esas mismas horas.
   */
  private acceptanceOdds(proposed: number, published: number) {
    const original = published || 1;
    const ratio = proposed / original;

    if (ratio >= 1.0) {
      return {
        percent: 98,
        label: 'Muy Alta (98%)',
        class: 'text-emerald-400',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        advice: 'Propuesta igual o superior al costo fijo solicitado. Es sumamente probable que el manager acepte de inmediato.'
      };
    } else if (ratio >= 0.85) {
      return {
        percent: 85,
        label: 'Alta (85%)',
        class: 'text-emerald-400',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        advice: 'Propuesta altamente competitiva. El ajuste de tarifa es moderado (≤15%) y está dentro del rango habitual del mercado.'
      };
    } else if (ratio >= 0.70) {
      return {
        percent: 60,
        label: 'Media (60%)',
        class: 'text-amber-300',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        advice: 'Propuesta con descuento sustancial (15%-30%). Se sugiere agregar una nota explicando las ventajas del evento (ej. viáticos u hospedaje cubiertos).'
      };
    } else {
      return {
        percent: 30,
        label: 'Baja (30%)',
        class: 'text-rose-300',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        advice: 'Propuesta muy por debajo del costo fijo publicado (>30% de descuento). Existe un alto riesgo de rechazo por parte del manager a menos que la exposición sea extraordinaria.'
      };
    }
  }

  openCounterOffer(slot: EventLineupSlot): void {
    this.counterSlot.set(slot);
    // Si ya hay una contraoferta viva se arranca desde ella —se está corrigiendo
    // una cifra propia, no partiendo de cero—; si no, desde lo que pide el dueño.
    // Va escalada a las horas de hoy para que se compare contra la tarifa
    // publicada por esas mismas horas y no contra las de cuando se propuso.
    const live = activeCounterOffer(slot);
    this.counterAmount.set(live ? slotProposedFee(slot) : slotPublishedTotal(slot));
    this.counterNote.set(slot.counterOffer?.note || '');
  }

  submitCounterOffer(): void {
    const slot = this.counterSlot();
    if (!slot || this.counterAmount() <= 0) return;

    const draft = this.isDraft();
    const now = new Date().toISOString().slice(0, 16);

    const offer: EventCounterOffer = {
      amount: this.counterAmount(),
      // Siempre con horas: son la base sobre la que después escala el total si
      // el evento cambia de duración. Sin ellas la cifra queda sin referencia.
      hours: slot.contractedHours ?? slot.minimumHours ?? 3,
      note: this.counterNote().trim() || undefined,
      proposedBy: this.ownerName(),
      proposedAt: now,
      status: draft ? 'Sin Enviar' : 'Pendiente',
      sentAt: draft ? undefined : now
    };

    // En borrador la contraoferta solo se guarda: viaja con la solicitud al
    // enviar a revisión. Después del borrador sí sale sola, y reabre la
    // negociación aunque el dueño ya hubiera aprobado la tarifa anterior.
    this.patchSlot(slot, {
      counterOffer: offer,
      approval: draft ? 'Sin Enviar' : 'Pendiente',
      requestSentAt: draft ? slot.requestSentAt : now
    });
    this.counterSlot.set(null);
  }

  /**
   * Cambia las horas contratadas. No baja del mínimo del grupo: pedir menos
   * horas no lo abarata, así que dejar teclear 1 h daría una cifra falsa.
   */
  setHours(slot: EventLineupSlot, raw: string | number): void {
    const min = slot.minimumHours || 1;
    const hours = Math.max(min, Number(raw) || min);
    this.patchSlot(slot, { contractedHours: hours });
  }

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

  // ─── Contraoferta guardada ─────────────────────────────────────────────────

  /** Contraoferta vigente del grupo; una rechazada ya no cuenta como tarifa. */
  liveCounter(slot: EventLineupSlot): EventCounterOffer | null {
    return activeCounterOffer(slot);
  }

  /** Lo que se propone pagar, ya escalado a las horas del evento. */
  proposedTotal(slot: EventLineupSlot): number {
    return slotProposedFee(slot);
  }

  /** Lo que costaría a tarifa de lista por esas mismas horas. */
  publishedTotal(slot: EventLineupSlot): number {
    return slotPublishedTotal(slot);
  }

  savings(slot: EventLineupSlot): number {
    return counterOfferSavings(slot);
  }

  absSavings(slot: EventLineupSlot): number {
    return Math.abs(counterOfferSavings(slot));
  }

  counterStatusLabel(status: EventCounterOffer['status']): string {
    return status === 'Sin Enviar' ? 'Por enviar' : status;
  }

  counterStatusClass(status: EventCounterOffer['status']): string {
    switch (status) {
      case 'Aceptada': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Rechazada': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Pendiente': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-surface-container-highest text-outline border-outline-variant/40';
    }
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
      case 'Sin Enviar': return 'bg-surface-container-highest text-outline border-outline-variant/40';
      default: return 'bg-surface-container-highest text-outline border-outline-variant/30';
    }
  }

  /**
   * 'Sin Enviar' se lee como "por enviar": el estado dice que falta mandarla, no
   * que se haya decidido no mandarla.
   */
  approvalLabel(status: EventLineupSlot['approval']): string {
    return status === 'Sin Enviar' ? 'Por enviar' : status;
  }

  approvalIcon(status: EventLineupSlot['approval']): string {
    switch (status) {
      case 'Aprobado': return 'check_circle';
      case 'Rechazado': return 'cancel';
      case 'Pendiente': return 'hourglass_top';
      case 'Sin Enviar': return 'schedule_send';
      default: return 'remove';
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

  remove(slot: EventLineupSlot): void {
    this.commit(this.slots().filter(s => s.id !== slot.id));
  }

  /**
   * Agrega un grupo al cartel por la vía indicada.
   *
   * En borrador el slot nace 'Sin Enviar': el grupo ya cuenta para el cartel, el
   * costo y el checklist, pero su dueño no se entera de nada hasta que el evento
   * se manda a revisión. Si el evento ya salió del borrador, un grupo nuevo sí
   * dispara su solicitud de inmediato — el flujo de revisión ya está corriendo.
   *
   * Elegir la vía de co-organización crea además la invitación al manager dueño,
   * si todavía no la tenía: sin manager dentro, el grupo no puede entrar por ahí.
   */
  addGroup(groupId: string, kind?: LineupEngagementKind): void {
    if (!groupId) return;
    const group = this.availableGroups().find(g => g.id === groupId);
    if (!group) return;

    const e = this.event();
    const isExternal = group.groupLeaderName !== this.ownerName();
    const engagementKind: LineupEngagementKind = !isExternal ? 'propio' : (kind ?? 'cotizacion');
    const draft = this.isDraft();

    const slot: EventLineupSlot = {
      id: 'ln-' + e.id + '-' + Date.now(),
      groupId: group.id,
      groupName: group.name,
      imageUrl: group.image,
      genre: group.genre,
      rating: group.rating,
      profileSlug: slugify(group.name),
      // El grupo es "de otro encargado" cuando su líder no es quien arma el evento.
      isExternal,
      engagementKind,
      managerName: group.groupLeaderName,
      managerEmail: group.groupLeaderEmail,
      managerPhone: group.groupLeaderPhone,
      order: this.slots().length + 1,
      publishedFee: group.artistFeeBase,
      minimumHours: group.minimumHours || 3,
      contractedHours: group.minimumHours || 3,
      costItems: [],
      approval: !isExternal ? 'No Requiere' : (draft ? 'Sin Enviar' : 'Pendiente'),
      requestSentAt: isExternal && !draft ? new Date().toISOString().slice(0, 16) : undefined
    };

    const changes: Partial<EventItem> = {
      lineup: [...this.slots(), slot].map((s, i) => ({ ...s, order: i + 1 }))
    };

    if (engagementKind === 'coorganizacion' && !this.managerInviteState(group.groupLeaderName)) {
      changes.managerAgreements = [
        ...(e.managerAgreements ?? []),
        this.newInvitation(group.groupLeaderName, draft)
      ];
    }

    this.patch.emit(changes);
    this.openIds.update(set => new Set(set).add(slot.id));
    this.addModalOpen.set(false);
  }

  /**
   * Invitación a co-organizar recién creada. Entra sin reparto pactado a
   * propósito: el porcentaje o el monto se acuerdan cuando el manager responde,
   * y ponerle un número por defecto sería inventar un acuerdo que nadie hizo.
   */
  private newInvitation(managerName: string, draft: boolean): EventManagerAgreement {
    return {
      id: 'agr-' + this.event().id + '-' + Date.now(),
      managerName,
      role: 'coorganizador',
      settlementKind: 'porcentaje',
      percent: 0,
      status: draft ? 'Sin Enviar' : 'Pendiente',
      invitedAt: draft ? undefined : new Date().toISOString().slice(0, 16)
    };
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
