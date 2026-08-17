import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EventLineupSlot,
  EventProductionItem,
  ProductionCategory,
  ProductionItemStatus
} from '../../../../core/models/event.models';
import { PressEventItem, PressGroupCommitment } from '../../../../core/models/press.models';
import { SessionService } from '../../../../core/services/session.service';
import { EditableFieldComponent } from '../../../../shared/ui/editable-field/editable-field.component';
import { MandatoryTaskTagComponent } from '../../../../shared/ui/mandatory-task-tag/mandatory-task-tag.component';
import { MandatoryFields } from '../../../events/mandatory-fields';
import { markIntervention, resolveTasks, ResolvedTask } from '../../../events/event-tasks';
import { money } from '../../../events/event-metrics';
import {
  PRODUCTION_CATEGORIES,
  PRODUCTION_CATEGORY_KEYS,
  ProductionCategoryMeta,
  productionCategoryMeta
} from '../../../events/production-catalog';
import {
  commitmentOf,
  pressCommittedSpend,
  pressLineup,
  pressPaidSpend,
  pressProductionItems,
  pressSpend
} from '../../press-metrics';

/**
 * Producción: el presupuesto del evento y lo que se compromete cada grupo.
 *
 * El desglose es el mismo `EventProductionItem` de Eventos, con la misma
 * agrupación por rubro, y es **todo lo que hay**: el sonido, el templete, el
 * backdrop, el control de fila, la seguridad y el café son partidas de gasto, no
 * campos aparte. Tenerlo partido en dos —un bloque de «datos del montaje» y otro
 * de partidas— hacía que los mismos conceptos se capturaran dos veces y que
 * ninguna de las dos versiones fuera la buena.
 *
 * Lo que **no** existe aquí es ninguna cifra de ingreso: no hay taquilla, no hay
 * ingreso potencial y no hay reparto de ganancias. Un evento de prensa se sube
 * para crear auge, y todo lo que pasa por esta pestaña es dinero que sale.
 */
@Component({
  selector: 'app-press-tab-production',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent, MandatoryTaskTagComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-6">

      <!-- ═══ COMPROMISO DE CADA GRUPO ═══ -->
      <!-- Uno por grupo y no uno para todo el evento. A una rueda vienen dos o
           tres grupos: cada uno llega a su hora, manda a su propio vocero y trae
           sus propios temas que no va a tocar. Un solo bloque obliga a elegir la
           hora de alguien y a apuntar las otras en una nota que nadie lee. -->
      <section class="p-6 rounded-3xl bg-gradient-to-br from-teal-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-teal-500/25 border-l-4 border-l-teal-500/70 shadow-2xl space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center material-symbols-outlined text-xl shrink-0">record_voice_over</span>
            <div class="min-w-0">
              <h5 class="text-sm font-black uppercase tracking-wider text-on-surface">Compromisos del Talento</h5>
              <p class="text-[11px] text-outline">Hora de llegada, vocero y duración de cada uno por separado</p>
            </div>
          </div>
          <app-mandatory-task-tag ref="talento" [event]="event()" (intervene)="onIntervene($event)" (openTasks)="openTasks.emit()" />
        </div>

        @if (mandatory.notice(); as aviso) {
          <div class="p-3 rounded-xl bg-amber-500/15 border border-amber-500/35 text-[11px] text-amber-100 flex items-start gap-2">
            <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">info</span>
            <span class="flex-1">{{ aviso }}</span>
            <button type="button" (click)="mandatory.notice.set(null)" class="text-amber-300 hover:text-white shrink-0">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        }

        @if (!slots().length) {
          <p class="py-5 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
            Sin grupos en el evento. Agrégalos en la pestaña <strong class="text-on-surface">Evento</strong> y aquí
            aparecerá el compromiso de cada uno.
          </p>
        } @else {
          <div class="space-y-3">
            @for (s of slots(); track s.id) {
              <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25 space-y-3.5">
                <div class="flex items-center gap-3 flex-wrap">
                  @if (s.imageUrl) {
                    <img [src]="s.imageUrl" [alt]="s.groupName" class="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0" />
                  } @else {
                    <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                      <span class="material-symbols-outlined text-base text-outline">group</span>
                    </div>
                  }
                  <div class="min-w-0 flex-1">
                    <span class="text-xs font-black text-on-surface block truncate">{{ s.groupName }}</span>
                    <span class="text-[10px] text-outline">
                      {{ s.isExternal ? 'Su compromiso lo pacta ' + s.managerName : 'Grupo propio' }}
                    </span>
                  </div>
                  @if (commitment(s).arrivalTime) {
                    <span class="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-black font-mono shrink-0">
                      Llega {{ commitment(s).arrivalTime }}
                    </span>
                  }
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <app-editable-field
                    label="Hora de llegada"
                    hint="24h"
                    [value]="commitment(s).arrivalTime ?? ''"
                    placeholder="15:00"
                    [readonly]="!canEditSlot(s)"
                    (save)="saveCommitment(s, 'Hora de llegada', { arrivalTime: $event })"
                  />
                  <app-editable-field
                    label="Se retira"
                    [value]="commitment(s).departureTime ?? ''"
                    placeholder="17:30"
                    [readonly]="!canEditSlot(s)"
                    (save)="saveCommitment(s, 'Hora de salida', { departureTime: $event })"
                  />
                  <app-editable-field
                    label="Vocero designado"
                    [value]="commitment(s).spokespersonName ?? ''"
                    [readonly]="!canEditSlot(s)"
                    (save)="saveCommitment(s, 'Vocero designado', { spokespersonName: $event })"
                  />
                  <app-editable-field
                    label="Duración"
                    hint="minutos"
                    type="number"
                    [value]="commitment(s).committedMinutes ?? ''"
                    [readonly]="!canEditSlot(s)"
                    (save)="saveCommitment(s, 'Duración comprometida', { committedMinutes: toNumber($event) })"
                  />
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <app-editable-field
                    label="Puesto del vocero"
                    [value]="commitment(s).spokespersonRole ?? ''"
                    placeholder="Vocalista, manager…"
                    [readonly]="!canEditSlot(s)"
                    (save)="saveCommitment(s, 'Puesto del vocero', { spokespersonRole: $event })"
                  />
                  <app-editable-field
                    label="Notas de este grupo"
                    [value]="commitment(s).notes ?? ''"
                    [readonly]="!canEditSlot(s)"
                    (save)="saveCommitment(s, 'Notas del grupo', { notes: $event })"
                  />
                </div>

                <!-- Temas vetados de este grupo -->
                <div class="p-3.5 rounded-2xl bg-black/25 border border-teal-500/20 space-y-2.5">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-black uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[13px]">do_not_disturb_on</span>
                      El "no preguntar por" de {{ s.groupName }}
                    </span>
                    @if (canEditSlot(s)) {
                      <button type="button" (click)="addTopic(s)"
                        class="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/35 hover:bg-teal-500 hover:text-black text-[10px] font-black transition-all">
                        + Tema
                      </button>
                    }
                  </div>

                  @if (!commitment(s).bannedTopics.length) {
                    <p class="text-[10.5px] text-outline italic">Sin temas vetados capturados.</p>
                  } @else {
                    <div class="space-y-1.5">
                      @for (t of commitment(s).bannedTopics; track $index) {
                        <div class="flex items-center gap-2 p-2 rounded-xl bg-surface-container/60 border border-outline-variant/25">
                          <span class="material-symbols-outlined text-[13px] text-rose-300 shrink-0">block</span>
                          <input
                            [ngModel]="t"
                            (ngModelChange)="patchTopic(s, $index, $event)"
                            [disabled]="!canEditSlot(s)"
                            class="flex-1 min-w-0 bg-transparent text-[11px] text-on-surface focus:outline-none disabled:opacity-70"
                          />
                          @if (canEditSlot(s)) {
                            <button type="button" (click)="removeTopic(s, $index)"
                              class="p-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shrink-0">
                              <span class="material-symbols-outlined text-[13px]">close</span>
                            </button>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </section>


      <!-- ═══ DESGLOSE DE GASTO ═══ -->
      <!-- Una firma o rueda de prensa no vende nada: existe para crear auge, y
           todo lo que pasa por aquí es dinero que sale. Por eso el desglose es el
           corazón de esta pestaña y no un anexo: es el único número del expediente
           y es lo que después se compara contra la cobertura que salió. -->
      @if (canViewFinances()) {
        <section class="relative overflow-hidden p-6 sm:p-7 rounded-[2rem] bg-gradient-to-br from-rose-500/[0.08] via-surface-container-high/90 to-surface-container-high/90 border border-rose-500/25 border-l-4 border-l-rose-400/70 shadow-2xl backdrop-blur-2xl space-y-6">
          <div class="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex items-start justify-between gap-5 flex-wrap">
            <div class="flex items-start gap-4 min-w-0 flex-1">
              <div class="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 flex items-center justify-center shrink-0 shadow-lg">
                <span class="material-symbols-outlined text-2xl">receipt_long</span>
              </div>
              <div class="space-y-1.5 min-w-0 flex-1">
                <h4 class="font-['Epilogue'] font-black text-xl sm:text-2xl text-on-surface tracking-tight leading-tight">
                  Presupuesto & Desglose de Gastos
                </h4>
                <p class="text-[11px] text-outline leading-relaxed max-w-2xl">
                  Un evento de prensa <strong class="text-rose-200">no genera ingreso</strong>: no hay boletos, no hay
                  taquilla y no hay nada que repartir. Lo que se lleva aquí es el gasto, partida por partida, y al
                  cerrar se compara contra la cobertura que salió.
                </p>
              </div>
            </div>

            @if (canEdit()) {
              <button type="button" (click)="catalogOpen.set(!catalogOpen())"
                class="px-4 py-2.5 rounded-2xl font-black text-[11px] transition-all flex items-center gap-2 active:scale-95 border shrink-0"
                [class]="catalogOpen()
                  ? 'bg-rose-300 text-black border-rose-200 shadow-lg'
                  : 'bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-300 text-black border-rose-300/40 shadow-[0_0_22px_rgba(244,63,94,0.25)]'">
                <span class="material-symbols-outlined text-base">add_shopping_cart</span>
                Agregar partida
              </button>
            }
          </div>

          <!-- Cifras -->
          <div class="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div class="p-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl space-y-2">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-black uppercase tracking-widest text-outline">Presupuestado</span>
                <span class="material-symbols-outlined text-base text-outline">calculate</span>
              </div>
              <div class="text-2xl font-black font-mono text-on-surface leading-none">{{ money(total()) }}</div>
              <span class="text-[10px] text-outline block leading-snug">{{ items().length }} partida(s) capturada(s)</span>
            </div>

            <div class="p-4 rounded-2xl border border-amber-500/25 bg-white/[0.03] backdrop-blur-xl space-y-2">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-black uppercase tracking-widest text-amber-300">Comprometido</span>
                <span class="material-symbols-outlined text-base text-amber-400">handshake</span>
              </div>
              <div class="text-2xl font-black font-mono text-amber-200 leading-none">{{ money(committed()) }}</div>
              <span class="text-[10px] text-outline block leading-snug">Contratado o ya pagado</span>
            </div>

            <div class="p-4 rounded-2xl border border-emerald-500/25 bg-white/[0.03] backdrop-blur-xl space-y-2">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-black uppercase tracking-widest text-emerald-300">Pagado</span>
                <span class="material-symbols-outlined text-base text-emerald-400">paid</span>
              </div>
              <div class="text-2xl font-black font-mono text-emerald-300 leading-none">{{ money(paid()) }}</div>
              <span class="text-[10px] text-outline block leading-snug">Salió de la cuenta</span>
            </div>

            <!-- Lo que sigue siendo servilleta. Un total con todo en 'Estimado'
                 no es un presupuesto, es un cálculo de cabeza, y sumarlo junto a
                 lo contratado es como un evento "sale caro de repente". -->
            <div class="p-4 rounded-2xl border bg-white/[0.03] backdrop-blur-xl space-y-2"
              [class]="estimatedShare() > 50 ? 'border-amber-400/45' : 'border-white/10'">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-black uppercase tracking-widest"
                  [class]="estimatedShare() > 50 ? 'text-amber-300' : 'text-outline'">Sin cerrar</span>
                <span class="material-symbols-outlined text-base"
                  [class]="estimatedShare() > 50 ? 'text-amber-400' : 'text-outline'">pending</span>
              </div>
              <div class="text-2xl font-black font-mono leading-none"
                [class]="estimatedShare() > 50 ? 'text-amber-300' : 'text-on-surface-variant'">{{ estimatedShare() }}%</div>
              <span class="text-[10px] text-outline block leading-snug">
                {{ estimatedShare() > 50 ? 'Buena parte sigue siendo estimación' : 'Del total sigue en estimación' }}
              </span>
            </div>
          </div>

          <!-- Catálogo de rubros: capturar de un clic en vez de escribirlo -->
          @if (catalogOpen() && canEdit()) {
            <div class="relative z-10 p-4 rounded-2xl bg-black/40 border border-rose-500/25 space-y-3">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <span class="text-[10px] font-black uppercase tracking-wider text-rose-200">
                  Rubros típicos de una {{ isFirma() ? 'firma de autógrafos' : 'rueda de prensa' }}
                </span>
                <button type="button" (click)="addItem(); catalogOpen.set(false)"
                  class="px-3 py-1.5 rounded-xl bg-white/5 text-outline border border-white/12 hover:text-on-surface text-[10px] font-black transition-all">
                  Partida en blanco
                </button>
              </div>
              <p class="text-[10.5px] text-on-surface-variant leading-relaxed">
                La lista está cerrada a propósito: si cada evento inventara sus etiquetas, comparar dos ruedas —o saber
                en qué se va siempre el dinero— sería imposible, que es justo para lo que existe el desglose.
              </p>

              <div class="space-y-2.5 max-h-72 overflow-y-auto scroll-oculto pr-1">
                @for (c of suggestedCategories(); track c.key) {
                  <div class="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/20 space-y-2">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-sm" [class]="c.textColor">{{ c.icon }}</span>
                      <span class="text-[11px] font-black text-on-surface">{{ c.key }}</span>
                      <span class="text-[10px] text-outline truncate">· {{ c.meaning }}</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      @for (ej of c.examples; track ej) {
                        <button type="button" (click)="addFromCatalog(c, ej)"
                          class="px-2.5 py-1 rounded-lg bg-white/5 border border-white/12 hover:border-rose-400/60 hover:text-rose-200 text-[10.5px] text-on-surface-variant transition-all">
                          + {{ ej }}
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Partidas agrupadas por rubro -->
          @if (!items().length) {
            <p class="relative z-10 py-6 text-center text-[11px] text-outline italic bg-black/20 rounded-2xl border border-dashed border-outline-variant/20">
              Sin desglose todavía. El evento se puede convocar igual —el desglose existe para saber en qué se fue el
              dinero, no para bloquear nada— pero al cerrar no habrá con qué comparar la cobertura.
            </p>
          } @else {
            <div class="relative z-10 space-y-3">
              @for (g of groups(); track g.category) {
                <div class="rounded-2xl border border-outline-variant/25 bg-surface-container/50 overflow-hidden">

                  <!-- Cabecera del rubro -->
                  <button type="button" (click)="toggleGroup(g.category)"
                    class="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.03] transition-colors">
                    <span class="material-symbols-outlined text-lg shrink-0" [class]="g.meta.textColor">{{ g.meta.icon }}</span>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-black text-on-surface">{{ g.category }}</span>
                        <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border" [class]="g.meta.badgeClass">
                          {{ g.items.length }} partida(s)
                        </span>
                        @if (g.responsible) {
                          <span class="px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[9px] font-black uppercase tracking-wider">
                            {{ g.responsible }}
                          </span>
                        }
                      </div>
                      <span class="text-[10px] text-outline block mt-0.5 truncate">{{ g.meta.meaning }}</span>
                    </div>
                    <div class="text-right shrink-0">
                      <span class="text-sm font-black font-mono text-on-surface block">{{ money(g.amount) }}</span>
                      <span class="text-[9.5px] text-outline">{{ spendPercent(g.amount) }}% del total</span>
                    </div>
                    <span class="material-symbols-outlined text-base text-outline shrink-0">
                      {{ openGroups().has(g.category) ? 'expand_less' : 'expand_more' }}
                    </span>
                  </button>

                  @if (openGroups().has(g.category)) {
                    <div class="px-4 pb-4 space-y-2.5 border-t border-outline-variant/15 pt-3">
                      @for (p of g.items; track p.id) {
                        <div class="p-3.5 rounded-2xl bg-black/25 border border-white/8 space-y-2.5">

                          <!-- Concepto y proveedor -->
                          <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                            <div class="md:col-span-5 space-y-1">
                              <label class="text-[9px] font-black uppercase tracking-wider text-outline">Concepto</label>
                              <input
                                [ngModel]="p.concept"
                                (ngModelChange)="patchItem(p.id, { concept: $event })"
                                [disabled]="!canEdit()"
                                placeholder="Qué se paga"
                                class="w-full bg-black/40 border border-outline-variant/25 focus:border-rose-400/60 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-on-surface focus:outline-none disabled:opacity-70"
                              />
                            </div>
                            <div class="md:col-span-4 space-y-1">
                              <label class="text-[9px] font-black uppercase tracking-wider text-outline">Proveedor</label>
                              <input
                                [ngModel]="p.supplier"
                                (ngModelChange)="patchItem(p.id, { supplier: $event })"
                                [disabled]="!canEdit()"
                                placeholder="A quién se le paga"
                                class="w-full bg-black/40 border border-outline-variant/25 focus:border-rose-400/60 rounded-lg px-2.5 py-1.5 text-[11px] text-on-surface focus:outline-none disabled:opacity-70"
                              />
                            </div>
                            <div class="md:col-span-3 space-y-1">
                              <label class="text-[9px] font-black uppercase tracking-wider text-outline">Rubro</label>
                              <select
                                [ngModel]="p.category"
                                (ngModelChange)="patchItem(p.id, { category: $event })"
                                [disabled]="!canEdit()"
                                class="w-full bg-black/40 border border-outline-variant/25 focus:border-rose-400/60 rounded-lg px-2 py-1.5 text-[10.5px] font-bold text-on-surface focus:outline-none disabled:opacity-70">
                                @for (c of categories; track c) {
                                  <option [value]="c" class="bg-surface-container">{{ c }}</option>
                                }
                              </select>
                            </div>
                          </div>

                          <!-- Cantidad, unitario, importe, estado -->
                          <div class="grid grid-cols-2 md:grid-cols-12 gap-2.5">
                            <div class="md:col-span-2 space-y-1">
                              <label class="text-[9px] font-black uppercase tracking-wider text-outline">Cantidad</label>
                              <input type="number" min="0"
                                [ngModel]="p.quantity"
                                (ngModelChange)="patchQuantity(p, { quantity: toNumber($event) })"
                                [disabled]="!canEdit()"
                                class="w-full bg-black/40 border border-outline-variant/25 focus:border-rose-400/60 rounded-lg px-2 py-1.5 text-[11px] font-mono text-on-surface text-right focus:outline-none disabled:opacity-70"
                              />
                            </div>
                            <div class="md:col-span-2 space-y-1">
                              <label class="text-[9px] font-black uppercase tracking-wider text-outline">Unidad</label>
                              <input
                                [ngModel]="p.unit"
                                (ngModelChange)="patchItem(p.id, { unit: $event })"
                                [disabled]="!canEdit()"
                                [placeholder]="g.meta.defaultUnit"
                                class="w-full bg-black/40 border border-outline-variant/25 focus:border-rose-400/60 rounded-lg px-2 py-1.5 text-[10.5px] text-on-surface focus:outline-none disabled:opacity-70"
                              />
                            </div>
                            <div class="md:col-span-3 space-y-1">
                              <label class="text-[9px] font-black uppercase tracking-wider text-outline">Costo unitario</label>
                              <input type="number" min="0"
                                [ngModel]="p.unitCost"
                                (ngModelChange)="patchQuantity(p, { unitCost: toNumber($event) })"
                                [disabled]="!canEdit()"
                                class="w-full bg-black/40 border border-outline-variant/25 focus:border-rose-400/60 rounded-lg px-2 py-1.5 text-[11px] font-mono text-on-surface text-right focus:outline-none disabled:opacity-70"
                              />
                            </div>
                            <div class="md:col-span-3 space-y-1">
                              <label class="text-[9px] font-black uppercase tracking-wider text-rose-200">Importe</label>
                              <input type="number" min="0"
                                [ngModel]="p.amount"
                                (ngModelChange)="patchItem(p.id, { amount: toNumber($event) })"
                                [disabled]="!canEdit()"
                                class="w-full bg-rose-500/[0.08] border border-rose-500/25 focus:border-rose-400/60 rounded-lg px-2 py-1.5 text-[11px] font-mono font-black text-rose-100 text-right focus:outline-none disabled:opacity-70"
                              />
                            </div>
                            <div class="md:col-span-2 space-y-1">
                              <label class="text-[9px] font-black uppercase tracking-wider text-outline">Estado</label>
                              <select
                                [ngModel]="p.status"
                                (ngModelChange)="patchItem(p.id, { status: $event })"
                                [disabled]="!canEdit()"
                                class="w-full bg-black/40 border border-outline-variant/25 rounded-lg px-2 py-1.5 text-[10.5px] font-black focus:outline-none disabled:opacity-70"
                                [class]="statusColor(p.status)">
                                @for (s of statuses; track s) {
                                  <option [value]="s" class="bg-surface-container text-on-surface">{{ s }}</option>
                                }
                              </select>
                            </div>
                          </div>

                          <!-- Detalle, encargo del que sale y borrar -->
                          <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                            <div class="md:col-span-6 space-y-1">
                              <label class="text-[9px] font-black uppercase tracking-wider text-outline">Detalle</label>
                              <input
                                [ngModel]="p.detail"
                                (ngModelChange)="patchItem(p.id, { detail: $event })"
                                [disabled]="!canEdit()"
                                placeholder="Modelo, alcance o especificación de lo contratado"
                                class="w-full bg-black/40 border border-outline-variant/25 focus:border-rose-400/60 rounded-lg px-2.5 py-1.5 text-[10.5px] text-on-surface focus:outline-none disabled:opacity-70"
                              />
                            </div>
                            <div class="md:col-span-5 space-y-1">
                              <label class="text-[9px] font-black uppercase tracking-wider text-outline">Sale del encargo</label>
                              <select
                                [ngModel]="p.taskId || ''"
                                (ngModelChange)="patchItem(p.id, { taskId: $event || undefined })"
                                [disabled]="!canEdit()"
                                title="Ligarlo a un encargo convierte «se gastaron 12,000 en audio» en «a Beto se le encargó el audio y esto contrató»"
                                class="w-full bg-black/40 border border-outline-variant/25 focus:border-rose-400/60 rounded-lg px-2 py-1.5 text-[10.5px] text-on-surface focus:outline-none disabled:opacity-70">
                                <option value="" class="bg-surface-container">Gasto suelto</option>
                                @for (t of optionalTasks(); track t.id) {
                                  <option [value]="t.id" class="bg-surface-container">{{ t.title }}</option>
                                }
                              </select>
                            </div>
                            <div class="md:col-span-1 flex justify-end">
                              @if (canEdit()) {
                                <button type="button" (click)="removeItem(p.id)"
                                  class="p-2 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all">
                                  <span class="material-symbols-outlined text-[13px]">delete</span>
                                </button>
                              }
                            </div>
                          </div>
                        </div>
                      }

                      @if (canEdit()) {
                        <button type="button" (click)="addItem(g.category)"
                          class="w-full py-2 rounded-xl border border-dashed border-outline-variant/30 hover:border-rose-400/50 text-[10.5px] font-bold text-outline hover:text-rose-200 transition-all flex items-center justify-center gap-1.5">
                          <span class="material-symbols-outlined text-[13px]">add</span> Otra partida de {{ g.category }}
                        </button>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Reparto del gasto por rubro -->
            <div class="relative z-10 space-y-1.5 pt-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline">Reparto del gasto</span>
              @for (g of groups(); track g.category) {
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-[13px] shrink-0" [class]="g.meta.textColor">{{ g.meta.icon }}</span>
                  <span class="text-[11px] text-on-surface-variant w-40 shrink-0 truncate">{{ g.category }}</span>
                  <div class="flex-1 h-2 rounded-full bg-black/40 overflow-hidden">
                    <div class="h-full rounded-full" [class]="g.meta.barClass" [style.width.%]="spendPercent(g.amount)"></div>
                  </div>
                  <span class="text-[11px] font-mono font-bold text-on-surface w-24 text-right shrink-0">{{ money(g.amount) }}</span>
                </div>
              }
            </div>
          }
        </section>
      } @else {
        <section class="p-6 rounded-3xl bg-surface-container-high/90 border border-outline-variant/25 shadow-xl text-center space-y-2">
          <span class="material-symbols-outlined text-2xl text-outline">lock</span>
          <p class="text-[11px] text-outline">El desglose de gasto está reservado al Encargado.</p>
        </section>
      }
    </div>
  `
})
export class PressTabProductionComponent {
  private readonly session = inject(SessionService);

  readonly event = input.required<PressEventItem>();
  readonly canEdit = input<boolean>(false);
  readonly canEditTalent = input<boolean>(false);
  readonly canViewFinances = input<boolean>(false);

  readonly patch = output<Partial<PressEventItem>>();
  readonly openTasks = output<void>();

  readonly money = money;
  readonly categories = PRODUCTION_CATEGORY_KEYS;
  readonly statuses: ProductionItemStatus[] = ['Estimado', 'Cotizado', 'Contratado', 'Pagado'];

  readonly mandatory = new MandatoryFields<PressEventItem>(
    () => this.event(),
    () => this.session.actor(),
    patch => this.patch.emit(patch)
  );

  readonly items = computed(() => pressProductionItems(this.event()));

  readonly total = computed(() => pressSpend(this.event()));
  readonly committed = computed(() => pressCommittedSpend(this.event()));
  readonly paid = computed(() => pressPaidSpend(this.event()));

  readonly catalogOpen = signal(false);
  readonly openGroups = signal<Set<string>>(new Set());

  /**
   * Cuánto del total sigue siendo un cálculo de cabeza.
   *
   * Importa para leer la cifra de arriba: un presupuesto con todo en 'Estimado'
   * y uno con todo 'Contratado' se suman igual pero no valen lo mismo, y sumarlos
   * como si fueran lo mismo es cómo un evento «sale caro de repente».
   */
  readonly estimatedShare = computed(() => {
    const total = this.total();
    if (!total) return 0;
    const abierto = this.items()
      .filter(p => p.status === 'Estimado' || p.status === 'Cotizado')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    return Math.round((abierto / total) * 100);
  });

  /** Los encargos operativos a los que se puede colgar un gasto. */
  readonly optionalTasks = computed(() =>
    resolveTasks(this.event()).filter(t => t.kind === 'externa'));

  /**
   * Los rubros que de verdad aplican, primero los del tipo de evento.
   *
   * El catálogo completo son veinte rubros pensados para un palenque. Enseñarlos
   * todos en una rueda de prensa entierra los cinco que se usan siempre debajo de
   * «Energía» y «Servicios Médicos».
   */
  readonly suggestedCategories = computed(() => {
    const propios: ProductionCategory[] = this.isFirma()
      ? ['Mobiliario', 'Personal y Staff', 'Seguridad', 'Escenario y Estructuras', 'Audio', 'Hospitalidad', 'Publicidad']
      : ['Recinto', 'Audio', 'Escenario y Estructuras', 'Video y Pantallas', 'Hospitalidad', 'Publicidad', 'Personal y Staff'];

    const primero = propios.map(k => productionCategoryMeta(k));
    const resto = PRODUCTION_CATEGORIES.filter(c => !propios.includes(c.key));
    return [...primero, ...resto];
  });

  /** El gasto agrupado por rubro, con quién responde por él si se repartió. */
  readonly groups = computed(() => {
    const by = new Map<ProductionCategory, EventProductionItem[]>();
    for (const p of this.items()) {
      by.set(p.category, [...(by.get(p.category) || []), p]);
    }
    const encargos = this.event().productionResponsibilities || [];

    return [...by.entries()]
      .map(([category, items]) => ({
        category,
        items,
        meta: productionCategoryMeta(category),
        amount: items.reduce((sum, p) => sum + (p.amount || 0), 0),
        responsible: encargos.find(r => r.category === category && r.status === 'Aceptada')?.managerName || ''
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  readonly slots = computed(() => pressLineup(this.event()));
  readonly isFirma = computed(() => this.event().pressType === 'Firma de Autógrafos');
  readonly isRueda = computed(() => this.event().pressType === 'Rueda de Prensa');

  commitment(slot: EventLineupSlot): PressGroupCommitment {
    return commitmentOf(this.event(), slot);
  }

  /**
   * Si este actor puede pactar el compromiso de este grupo.
   *
   * El de un grupo ajeno lo cierra su disquera: la hora a la que llega y los
   * temas que no toca los pacta quien lo representa, no quien organiza. Lo que
   * se escriba desde fuera va por el camino de las propuestas.
   */
  canEditSlot(slot: EventLineupSlot): boolean {
    if (!this.canEditTalent()) return false;
    return !slot.isExternal || slot.managerName === this.session.actor().managerName;
  }

  statusColor(status: ProductionItemStatus): string {
    switch (status) {
      case 'Pagado': return 'text-emerald-300';
      case 'Contratado': return 'text-amber-200';
      case 'Cotizado': return 'text-sky-300';
      default: return 'text-outline';
    }
  }

  toNumber(value: string | number): number {
    return Number(value) || 0;
  }

  onIntervene(task: ResolvedTask): void {
    this.patch.emit(markIntervention(this.event(), task, this.session.actor()));
  }

  /**
   * Guarda el compromiso de un grupo.
   *
   * La lista es por grupo, así que el parche sustituye solo su renglón y crea el
   * suyo si todavía no existía: capturar la hora de llegada del segundo grupo no
   * puede borrar la del primero.
   */
  saveCommitment(slot: EventLineupSlot, label: string, changes: Partial<PressGroupCommitment>): void {
    const actuales = this.event().talentCommitments || [];
    const existe = actuales.some(c => c.slotId === slot.id);
    const base = this.commitment(slot);

    const lista = existe
      ? actuales.map(c => (c.slotId === slot.id ? { ...c, ...changes } : c))
      : [...actuales, { ...base, ...changes }];

    this.mandatory.save('talento', `${label} · ${slot.groupName}`, {
      talentCommitments: lista
    } as Partial<PressEventItem>);
  }

  addTopic(slot: EventLineupSlot): void {
    this.saveCommitment(slot, 'Temas vetados', { bannedTopics: [...this.commitment(slot).bannedTopics, ''] });
  }

  patchTopic(slot: EventLineupSlot, index: number, value: string): void {
    this.saveCommitment(slot, 'Temas vetados', {
      bannedTopics: this.commitment(slot).bannedTopics.map((t, i) => (i === index ? value : t))
    });
  }

  removeTopic(slot: EventLineupSlot, index: number): void {
    this.saveCommitment(slot, 'Temas vetados', {
      bannedTopics: this.commitment(slot).bannedTopics.filter((_, i) => i !== index)
    });
  }

  // ─── Desglose ───────────────────────────────────────────────────────────────

  toggleGroup(category: string): void {
    this.openGroups.update(set => {
      const next = new Set(set);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }

  spendPercent(amount: number): number {
    const t = this.total();
    return t > 0 ? Math.round((amount / t) * 100) : 0;
  }

  addItem(category: ProductionCategory = 'Otros'): void {
    const nueva: EventProductionItem = {
      id: `pi-${Date.now().toString(36)}`,
      category,
      concept: '',
      unit: productionCategoryMeta(category).defaultUnit,
      quantity: 1,
      amount: 0,
      status: 'Estimado',
      createdBy: this.session.actor().name
    };
    this.openGroups.update(set => new Set(set).add(category));
    this.patch.emit({ productionItems: [...this.items(), nueva] });
  }

  /** Da de alta una partida ya nombrada desde el catálogo del rubro. */
  addFromCatalog(meta: ProductionCategoryMeta, concepto: string): void {
    const nueva: EventProductionItem = {
      id: `pi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      category: meta.key,
      concept: concepto,
      unit: meta.defaultUnit,
      quantity: 1,
      amount: 0,
      status: 'Estimado',
      createdBy: this.session.actor().name
    };
    this.openGroups.update(set => new Set(set).add(meta.key));
    this.patch.emit({ productionItems: [...this.items(), nueva] });
  }

  /**
   * Recalcula el importe al cambiar cantidad o unitario.
   *
   * El importe manda sobre cantidad × unitario —hay partidas que se cierran a
   * precio alzado— pero mientras el importe siga cuadrando con el cálculo, tocar
   * la cantidad debe moverlo. Si no, capturar «6 elementos» después de haber
   * escrito el total deja los dos números contradiciéndose en la misma línea.
   */
  patchQuantity(p: EventProductionItem, changes: Partial<EventProductionItem>): void {
    const cantidad = changes.quantity ?? p.quantity ?? 0;
    const unitario = changes.unitCost ?? p.unitCost ?? 0;
    const anterior = (p.quantity ?? 0) * (p.unitCost ?? 0);
    const cuadraba = !p.amount || Math.abs(anterior - p.amount) < 0.01;

    this.patchItem(p.id, {
      ...changes,
      amount: cuadraba && cantidad && unitario ? Math.round(cantidad * unitario) : p.amount
    });
  }

  patchItem(id: string, changes: Partial<EventProductionItem>): void {
    this.patch.emit({
      productionItems: this.items().map(p => (p.id === id ? { ...p, ...changes } : p))
    });
  }

  removeItem(id: string): void {
    this.patch.emit({ productionItems: this.items().filter(p => p.id !== id) });
  }
}
