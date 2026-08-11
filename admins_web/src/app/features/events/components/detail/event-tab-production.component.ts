import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EventItem,
  EventLineupSlot,
  EventProductionItem,
  EventProductionResponsibility,
  GroupSoundCheck,
  ProductionCategory
} from '../../../../core/models/event.models';
import { EditableFieldComponent, EditableOption } from '../../../../shared/ui/editable-field/editable-field.component';
import {
  dateTimeLabel,
  lineup,
  lineupTotalCost,
  money,
  organizerName,
  productionCommittedCost,
  productionCost,
  productionCostByCategory,
  productionItems,
  productionItemsCost,
  productionPaidCost,
  responsibilityFor,
  groupSoundChecks
} from '../../event-metrics';
import {
  PRODUCTION_CATEGORIES,
  ProductionCategoryMeta,
  productionCategoryMeta
} from '../../production-catalog';

/**
 * Producción: desglose de gastos, reparto de rubros entre managers,
 * orden de entradas con horarios de escenario y sound checks detallados por grupo.
 *
 * Incluye herramientas de llenado rápido de 1-clic (Auto-calcular horarios en cadena,
 * auto-generación de soundchecks, ajustes rápidos de duración y duplicación).
 */
@Component({
  selector: 'app-event-tab-production',
  standalone: true,
  imports: [CommonModule, EditableFieldComponent],
  host: { class: 'block' },
  template: `
    <div class="space-y-6">

      <!-- ─── EN QUÉ SE VA EL DINERO ─── -->
      @if (canViewFinances()) {
        <section class="p-6 rounded-3xl bg-gradient-to-br from-violet-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-violet-500/25 border-l-4 border-l-violet-500/70 shadow-2xl shadow-violet-500/5 space-y-5 backdrop-blur-2xl">
          <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
            <h5 class="text-xs font-black uppercase tracking-wider text-violet-300 flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center justify-center material-symbols-outlined text-lg">receipt_long</span>
              <span>En qué se va el dinero</span>
            </h5>
            <span class="px-3.5 py-1.5 rounded-2xl bg-surface-container-highest border border-outline-variant/30 text-xs font-mono font-black text-on-surface shadow-sm">
              Total {{ money(totalCost()) }}
            </span>
          </div>

          <!-- Fuentes principales del costo: Cartel y Desglose de producción -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25 space-y-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[13px] text-primary">queue_music</span> Cartel de grupos
              </span>
              <span class="text-lg font-black font-mono block text-on-surface">{{ money(cartelCost()) }}</span>
              <span class="text-[10px] text-outline block">Suma de tarifas y honorarios contratados</span>
            </div>
            <div class="p-4 rounded-2xl border space-y-1"
              [class]="itemsCost() > 0 ? 'bg-violet-500/[0.08] border-violet-500/30' : 'bg-surface-container/60 border-outline-variant/25'">
              <span class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[13px] text-violet-300">list_alt</span> Desglose de producción
              </span>
              <span class="text-lg font-black font-mono block" [class]="itemsCost() > 0 ? 'text-violet-200' : 'text-outline'">
                {{ money(itemsCost()) }}
              </span>
              <span class="text-[10px] text-outline block">{{ items().length }} partida(s) capturada(s)</span>
            </div>
          </div>

          @if (items().length) {
            <!-- Barra de reparto por rubro -->
            <div class="space-y-2.5">
              <div class="flex h-3 rounded-full overflow-hidden bg-surface-container-highest border border-outline-variant/25">
                @for (row of byCategory(); track row.category) {
                  <div
                    [class]="meta(row.category).barClass"
                    [style.width.%]="sharePercent(row.amount)"
                    [title]="row.category + ': ' + money(row.amount) + ' (' + sharePercent(row.amount).toFixed(0) + '% del desglose)'"
                    class="h-full first:rounded-l-full last:rounded-r-full transition-all"
                  ></div>
                }
              </div>

              <div class="flex items-center gap-2 flex-wrap">
                @for (row of byCategory(); track row.category) {
                  <span [class]="meta(row.category).badgeClass" class="px-2.5 py-1 rounded-xl border text-[10px] font-bold flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[12px]">{{ meta(row.category).icon }}</span>
                    {{ row.category }}
                    <strong class="font-mono">{{ sharePercent(row.amount).toFixed(0) }}%</strong>
                  </span>
                }
              </div>
            </div>

            <!-- Grado de compromiso de los gastos desglosados -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Solo estimado</span>
                <span class="text-sm font-black font-mono text-amber-300">{{ money(itemsCost() - committed()) }}</span>
                <span class="text-[10px] text-outline block">Cifras aún sin cerrar con el proveedor</span>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Ya comprometido</span>
                <span class="text-sm font-black font-mono text-on-surface">{{ money(committed()) }}</span>
                <span class="text-[10px] text-outline block">Contratado o pagado</span>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-container/60 border border-outline-variant/25">
                <span class="text-[10px] font-black uppercase tracking-wider text-outline block">Ya pagado</span>
                <span class="text-sm font-black font-mono text-emerald-400">{{ money(paid()) }}</span>
                <span class="text-[10px] text-outline block">Dinero que ya salió</span>
              </div>
            </div>
          } @else {
            <p class="text-[11px] text-outline italic p-5 rounded-2xl bg-surface-container/40 border border-dashed border-outline-variant/30 text-center">
              Todavía no hay nada desglosado. Es opcional: el evento se puede publicar así.
              Desglosar solo sirve para saber después en qué se fue el dinero.
            </p>
          }
        </section>
      }

      <!-- ─── REPARTO DE RUBROS ENTRE MANAGERS ─── -->
      @if (otherManagers().length) {
        <section class="p-6 rounded-3xl bg-gradient-to-br from-teal-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-teal-500/25 border-l-4 border-l-teal-500/70 shadow-2xl space-y-4 backdrop-blur-2xl">
          <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
            <h5 class="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center material-symbols-outlined text-lg">assignment_ind</span>
              <span>Quién se hace cargo de cada rubro</span>
            </h5>
            <span class="text-[10px] font-mono font-bold text-outline uppercase tracking-wider">
              {{ assignedCount() }} rubro(s) repartido(s)
            </span>
          </div>

          <p class="text-[11px] text-outline leading-relaxed">
            Con más de un manager en el evento, cada rubro se le puede encargar a uno. Quien lo reciba puede
            aceptarlo o rechazarlo, y si acepta <strong class="text-on-surface">no está obligado a desglosarlo</strong>:
            basta con que quede constancia de quién respondía por él.
          </p>

          @if (responsibilities().length) {
            <div class="space-y-2.5">
              @for (r of responsibilities(); track r.id) {
                @let m = meta(r.category);
                <div class="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/25 space-y-2.5 shadow-sm">
                  <div class="flex items-center justify-between gap-3 flex-wrap">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span [class]="m.badgeClass" class="w-9 h-9 rounded-xl border flex items-center justify-center material-symbols-outlined text-base shrink-0">
                        {{ m.icon }}
                      </span>
                      <div class="min-w-0">
                        <p class="text-xs font-black text-on-surface truncate">{{ r.category }}</p>
                        <p class="text-[10px] text-outline truncate">A cargo de <strong class="text-on-surface">{{ r.managerName }}</strong></p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      @if (canViewFinances() && r.budgetCap) {
                        <span class="px-2.5 py-1 rounded-xl bg-surface-container-highest border border-outline-variant/30 text-[10px] font-mono font-black text-on-surface">
                          Tope {{ money(r.budgetCap) }}
                        </span>
                      }
                      <span [class]="assignmentClass(r.status)" class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border">
                        {{ assignmentLabel(r.status) }}
                      </span>
                    </div>
                  </div>

                  @if (r.brief) {
                    <p class="text-[11px] text-on-surface-variant italic">"{{ r.brief }}"</p>
                  }
                  @if (r.status === 'Rechazada' && r.reason) {
                    <p class="text-[11px] text-rose-300 flex items-start gap-1.5">
                      <span class="material-symbols-outlined text-[13px] shrink-0 mt-0.5">cancel</span>
                      Rechazó: {{ r.reason }}
                    </p>
                  }

                  <div class="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-outline-variant/15">
                    <span class="text-[10px] text-outline flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[12px]">
                        {{ r.status === 'Sin Enviar' ? 'schedule_send' : 'send' }}
                      </span>
                      @if (r.status === 'Sin Enviar') {
                        Se le encargará al enviar el evento a revisión
                      } @else if (r.respondedAt) {
                        Respondió el {{ dateTimeLabel(r.respondedAt) }}
                      } @else {
                        Enviado el {{ dateTimeLabel(r.assignedAt) }} · sin respuesta
                      }
                    </span>

                    @if (canEdit()) {
                      <div class="flex items-center gap-1.5 flex-wrap">
                        @if (r.status === 'Pendiente') {
                          <button
                            type="button"
                            (click)="respondResponsibility(r, 'Aceptada')"
                            class="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black text-[10px] font-black transition-all flex items-center gap-1"
                            title="Pruebas: simular que el manager acepta el encargo"
                          >
                            <span class="material-symbols-outlined text-[13px]">check_circle</span> Aceptar (pruebas)
                          </button>
                          <button
                            type="button"
                            (click)="respondResponsibility(r, 'Rechazada')"
                            class="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all flex items-center gap-1"
                            title="Pruebas: simular que el manager rechaza el encargo"
                          >
                            <span class="material-symbols-outlined text-[13px]">thumb_down</span> Rechazar
                          </button>
                        }
                        <button
                          type="button"
                          (click)="removeResponsibility(r)"
                          class="px-2.5 py-1.5 rounded-xl bg-surface-container-highest text-outline border border-outline-variant/30 hover:text-rose-300 hover:border-rose-500/40 text-[10px] font-black transition-all flex items-center gap-1"
                        >
                          <span class="material-symbols-outlined text-[13px]">undo</span>
                          {{ r.status === 'Sin Enviar' ? 'Retirar' : 'Quitar encargo' }}
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-[11px] text-outline italic p-5 rounded-2xl bg-surface-container/40 border border-dashed border-outline-variant/30 text-center">
              Ningún rubro repartido: todo corre por tu cuenta. Repartir es opcional.
            </p>
          }

          @if (canEdit()) {
            <button
              type="button"
              (click)="openAssign()"
              class="px-4 py-2.5 min-h-11 rounded-2xl bg-teal-500/20 text-teal-200 border border-teal-500/40 hover:bg-teal-500 hover:text-black text-xs font-black transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-base">person_add</span> Encargar un rubro
            </button>
          }
        </section>
      }

      <!-- ─── DESGLOSE POR RUBRO ─── -->
      <section class="p-6 rounded-3xl bg-gradient-to-br from-violet-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-violet-500/25 border-l-4 border-l-violet-500/70 shadow-2xl space-y-4 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <h5 class="text-xs font-black uppercase tracking-wider text-violet-300 flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center justify-center material-symbols-outlined text-lg">list_alt</span>
            <span>Desglose de gastos de producción</span>
          </h5>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2.5 py-1 rounded-xl bg-surface-container-highest border border-outline-variant/30 text-[10px] font-black uppercase tracking-wider text-outline">
              Opcional
            </span>
            <button
              type="button"
              (click)="showAllCategories.set(!showAllCategories())"
              class="px-3 py-1.5 rounded-xl bg-surface-container text-outline hover:text-on-surface border border-outline-variant/30 text-[10px] font-black transition-all flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-[13px]">{{ showAllCategories() ? 'filter_list_off' : 'filter_list' }}</span>
              {{ showAllCategories() ? 'Solo rubros con gasto' : 'Ver los ' + allCategories.length + ' rubros' }}
            </button>
          </div>
        </div>

        <p class="text-[11px] text-outline leading-relaxed">
          Cada rubro trae las partidas que se contratan de verdad en un evento; tócalas para capturarlas de un clic.
          Llenar esto no es obligatorio y no bloquea nada — sirve para que al cerrar el evento se sepa
          <strong class="text-on-surface">en qué se fue cada peso y por qué</strong>.
        </p>

        <div class="space-y-2.5">
          @for (cat of visibleCategories(); track cat.key) {
            @let total = categoryTotal(cat.key);
            @let resp = responsibility(cat.key);
            <div class="rounded-2xl bg-surface-container/50 border border-outline-variant/25 overflow-hidden">

              <!-- Encabezado del rubro -->
              <button
                type="button"
                (click)="toggle(cat.key)"
                class="w-full p-4 flex items-center justify-between gap-3 flex-wrap text-left hover:bg-surface-container/70 transition-colors"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <span [class]="cat.badgeClass" class="w-9 h-9 rounded-xl border flex items-center justify-center material-symbols-outlined text-base shrink-0">
                    {{ cat.icon }}
                  </span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs font-black text-on-surface">{{ cat.key }}</span>
                      @if (resp) {
                        <span [class]="assignmentClass(resp.status)" class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border flex items-center gap-1">
                          <span class="material-symbols-outlined text-[10px]">assignment_ind</span>
                          {{ resp.managerName }}
                        </span>
                      }
                    </div>
                    <span class="text-[10px] text-outline block truncate">{{ cat.meaning }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 shrink-0">
                  <span class="text-[10px] text-outline font-mono">{{ categoryCount(cat.key) }} partida(s)</span>
                  @if (canViewFinances()) {
                    <span class="px-2.5 py-1 rounded-xl text-[11px] font-mono font-black border"
                      [class]="total > 0
                        ? 'bg-surface-container-highest text-on-surface border-outline-variant/30'
                        : 'bg-surface-container/60 text-outline border-outline-variant/20'">
                      {{ money(total) }}
                    </span>
                  }
                  <span class="material-symbols-outlined text-base text-outline transition-transform" [class.rotate-180]="isOpen(cat.key)">
                    expand_more
                  </span>
                </div>
              </button>

              @if (isOpen(cat.key)) {
                <div class="p-4 pt-0 space-y-3 animate-slide-up">

                  @if (resp && resp.status !== 'Rechazada') {
                    <div class="p-3 rounded-xl border text-[11px] flex items-start gap-2"
                      [class]="resp.status === 'Aceptada'
                        ? 'bg-emerald-500/[0.07] border-emerald-500/25 text-emerald-200'
                        : 'bg-surface-container-highest/60 border-outline-variant/30 text-on-surface-variant'">
                      <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">assignment_ind</span>
                      <span>
                        <strong>{{ resp.managerName }}</strong> se hace cargo de este rubro
                        ({{ assignmentLabel(resp.status).toLowerCase() }}).
                        Puede desglosarlo aquí o no hacerlo: el desglose sigue siendo opcional.
                      </span>
                    </div>
                  }

                  <!-- Partidas capturadas -->
                  @for (item of itemsOf(cat.key); track item.id) {
                    <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-2.5">
                      <div class="flex items-start gap-2">
                        <div class="flex-1 min-w-0 space-y-2">
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <app-editable-field
                              label="Concepto"
                              [value]="item.concept"
                              valueClass="text-[11px] font-bold text-on-surface break-words"
                              [readonly]="!canEdit()"
                              (save)="patchItem(item, { concept: $event })"
                            />
                            <app-editable-field
                              label="Proveedor"
                              placeholder="A quién se le paga"
                              [value]="item.supplier || ''"
                              valueClass="text-[11px] font-semibold text-on-surface-variant break-words"
                              [readonly]="!canEdit()"
                              (save)="patchItem(item, { supplier: $event })"
                            />
                          </div>

                          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            <app-editable-field
                              label="Cantidad"
                              type="number"
                              [groupThousands]="false"
                              [value]="item.quantity ?? 1"
                              [readonly]="!canEdit()"
                              (save)="recalc(item, { quantity: toNumber($event) })"
                            />
                            <app-editable-field
                              label="Unidad"
                              [placeholder]="cat.defaultUnit"
                              [value]="item.unit || ''"
                              [readonly]="!canEdit()"
                              (save)="patchItem(item, { unit: $event })"
                            />
                            @if (canViewFinances()) {
                              <app-editable-field
                                label="Costo unitario"
                                type="number"
                                prefix="$"
                                [value]="item.unitCost ?? 0"
                                [readonly]="!canEdit()"
                                (save)="recalc(item, { unitCost: toNumber($event) })"
                              />
                              <app-editable-field
                                label="Importe total"
                                type="number"
                                prefix="$"
                                valueClass="text-[11px] font-black text-violet-200 font-mono"
                                [value]="item.amount"
                                [readonly]="!canEdit()"
                                (save)="patchItem(item, { amount: toNumber($event) })"
                              />
                            }
                          </div>

                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <app-editable-field
                              label="Estado"
                              type="select"
                              [options]="itemStatuses"
                              [value]="item.status"
                              [readonly]="!canEdit()"
                              (save)="patchItem(item, { status: $any($event) })"
                            />
                            @if (otherManagers().length) {
                              <app-editable-field
                                label="Quién lo ve"
                                type="select"
                                [options]="managerOptions()"
                                [value]="item.assignedTo || organizerLabel()"
                                [readonly]="!canEdit()"
                                (save)="patchItem(item, { assignedTo: $event })"
                              />
                            }
                          </div>

                          <app-editable-field
                            label="Detalle o nota"
                            placeholder="Modelo, alcance de lo contratado, condiciones…"
                            [value]="item.detail || ''"
                            valueClass="text-[10px] font-medium text-outline break-words"
                            [readonly]="!canEdit()"
                            (save)="patchItem(item, { detail: $event })"
                          />
                        </div>

                        @if (canEdit()) {
                          <button
                            type="button"
                            (click)="removeItem(item)"
                            class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all"
                            title="Quitar partida"
                          >
                            <span class="material-symbols-outlined text-[13px]">delete</span>
                          </button>
                        }
                      </div>
                    </div>
                  } @empty {
                    <p class="text-[10px] text-outline italic px-1">Sin partidas capturadas en este rubro.</p>
                  }

                  @if (canEdit()) {
                    <div class="pt-2 border-t border-outline-variant/20 space-y-2">
                      <span class="text-[10px] font-black uppercase tracking-wider text-outline flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[12px]">bolt</span>
                        Lo que se suele contratar aquí
                      </span>
                      <div class="flex items-center gap-1.5 flex-wrap">
                        @for (example of cat.examples; track example) {
                          <button
                            type="button"
                            (click)="addItem(cat, example)"
                            [disabled]="hasConcept(cat.key, example)"
                            class="px-2.5 py-1.5 rounded-xl bg-surface-container-highest/70 text-on-surface-variant border border-outline-variant/30 hover:border-violet-500/50 hover:text-violet-200 text-[10px] font-bold transition-all flex items-center gap-1 disabled:opacity-35 disabled:pointer-events-none"
                          >
                            <span class="material-symbols-outlined text-[12px]">{{ hasConcept(cat.key, example) ? 'check' : 'add' }}</span>
                            {{ example }}
                          </button>
                        }
                        <button
                          type="button"
                          (click)="addItem(cat, '')"
                          class="px-2.5 py-1.5 rounded-xl bg-violet-500/15 text-violet-200 border border-violet-500/35 hover:bg-violet-500 hover:text-black text-[10px] font-black transition-all flex items-center gap-1"
                        >
                          <span class="material-symbols-outlined text-[12px]">edit</span> Otra partida
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- ─── ORDEN DE ENTRADAS Y HORARIOS EN ESCENARIO ─── -->
      <section class="p-6 rounded-3xl bg-gradient-to-br from-amber-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-amber-500/25 border-l-4 border-l-amber-500/70 shadow-2xl space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center material-symbols-outlined text-lg">queue_music</span>
            <div>
              <h5 class="text-xs font-black uppercase tracking-wider text-amber-300">Orden de Entradas y Horarios en Escenario</h5>
              <p class="text-[11px] text-outline">Llenado rápido: ingresa los horarios de inicio y término o usa el calculador automático.</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            @if (canEdit() && slots().length > 0) {
              <button
                type="button"
                (click)="autoScheduleOpen.set(!autoScheduleOpen())"
                class="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black text-[10px] font-black transition-all flex items-center gap-1.5 active:scale-95 shadow-md"
              >
                <span class="material-symbols-outlined text-xs">bolt</span> ⚡ Auto-calcular Horarios
              </button>
            }
            <span class="px-3 py-1 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-mono font-black">
              {{ slots().length }} grupo(s)
            </span>
          </div>
        </div>

        <!-- Panel de auto-calculador de horarios -->
        @if (autoScheduleOpen()) {
          <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-fade-in">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-black text-amber-200 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">auto_fix_high</span> Programador Secuencial en Cadena
              </span>
              <button type="button" (click)="autoScheduleOpen.set(false)" class="text-outline hover:text-white text-xs">Cerrar</button>
            </div>
            <p class="text-[11px] text-outline">
              Calcula los horarios de inicio y fin de cada grupo en secuencia automática según el orden del cartel.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[9px] font-black uppercase text-outline mb-1">Hora inicio del 1er grupo</label>
                <input
                  type="time"
                  [value]="autoScheduleStart()"
                  (change)="autoScheduleStart.set($any($event.target).value)"
                  class="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-outline-variant/30 text-xs font-mono font-bold text-on-surface focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label class="block text-[9px] font-black uppercase text-outline mb-1">Duración por grupo (min)</label>
                <input
                  type="number"
                  [value]="autoScheduleDuration()"
                  (input)="autoScheduleDuration.set(+$any($event.target).value)"
                  class="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-outline-variant/30 text-xs font-mono font-bold text-on-surface focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label class="block text-[9px] font-black uppercase text-outline mb-1">Cambio de equipo (min)</label>
                <input
                  type="number"
                  [value]="autoScheduleGap()"
                  (input)="autoScheduleGap.set(+$any($event.target).value)"
                  class="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-outline-variant/30 text-xs font-mono font-bold text-on-surface focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <div class="flex justify-end pt-1">
              <button
                type="button"
                (click)="applyAutoSchedule()"
                class="px-4 py-2 rounded-xl bg-amber-400 text-black font-black text-xs hover:bg-amber-300 transition-all shadow-md active:scale-95"
              >
                Aplicar a todo el cartel en 1-clic
              </button>
            </div>
          </div>
        }

        <div class="space-y-3">
          @for (slot of slots(); track slot.id) {
            <div class="p-4 rounded-2xl bg-surface-container/70 border border-outline-variant/30 space-y-3 shadow-md hover:border-amber-500/40 transition-all">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-black text-sm flex items-center justify-center shrink-0 shadow-inner">
                    #{{ slot.order }}
                  </span>

                  @if (slot.imageUrl) {
                    <img [src]="slot.imageUrl" [alt]="slot.groupName" class="w-10 h-10 rounded-xl object-cover border border-outline-variant/30 shrink-0" />
                  } @else {
                    <div class="w-10 h-10 rounded-xl bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center shrink-0 text-amber-400">
                      <span class="material-symbols-outlined text-lg">groups</span>
                    </div>
                  }

                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h6 class="text-xs font-black text-on-surface truncate">{{ slot.groupName }}</h6>
                      @if (slot.isHeadliner) {
                        <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <span class="material-symbols-outlined text-[11px]">star</span> Estelar
                        </span>
                      }
                      <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border"
                        [class]="slot.isExternal ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'">
                        {{ slot.isExternal ? (slot.engagementKind === 'coorganizacion' ? 'Co-organizado' : 'Cotización') : 'Grupo Propio' }}
                      </span>
                    </div>
                    <p class="text-[10px] text-outline truncate">Manager: <strong class="text-on-surface-variant">{{ slot.managerName }}</strong></p>
                  </div>
                </div>

                <!-- Duración calculada + Presets rápidos -->
                <div class="flex items-center gap-2 flex-wrap shrink-0">
                  @if (canEdit()) {
                    <span class="text-[9px] font-black uppercase text-outline">Predefinir:</span>
                    <button type="button" (click)="setPresetDuration(slot, 45)" class="px-2 py-1 rounded-lg bg-surface-container-highest text-[9px] font-bold text-amber-200 border border-outline-variant/30 hover:bg-amber-500 hover:text-black transition-all">45m</button>
                    <button type="button" (click)="setPresetDuration(slot, 60)" class="px-2 py-1 rounded-lg bg-surface-container-highest text-[9px] font-bold text-amber-200 border border-outline-variant/30 hover:bg-amber-500 hover:text-black transition-all">1h</button>
                    <button type="button" (click)="setPresetDuration(slot, 90)" class="px-2 py-1 rounded-lg bg-surface-container-highest text-[9px] font-bold text-amber-200 border border-outline-variant/30 hover:bg-amber-500 hover:text-black transition-all">1.5h</button>
                    <button type="button" (click)="setPresetDuration(slot, 120)" class="px-2 py-1 rounded-lg bg-surface-container-highest text-[9px] font-bold text-amber-200 border border-outline-variant/30 hover:bg-amber-500 hover:text-black transition-all">2h</button>
                  }
                  <span class="text-xs font-mono font-black text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                    {{ calculateSetDuration(slot.setStartTime, slot.setEndTime) }}
                  </span>
                </div>
              </div>

              <!-- Inputs directos de hora de inicio y hora de fin -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-outline-variant/20">
                <div>
                  <label class="block text-[9px] font-black uppercase tracking-wider text-outline mb-1">Hora de inicio en escenario</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="time"
                      [disabled]="!canEdit()"
                      [value]="slot.setStartTime || ''"
                      (change)="patchSlotTime(slot, { setStartTime: $any($event.target).value })"
                      class="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-outline-variant/30 text-xs font-mono font-bold text-on-surface focus:outline-none focus:border-amber-400 disabled:opacity-50"
                    />
                    <app-editable-field
                      [value]="slot.setStartTime || ''"
                      placeholder="HH:mm"
                      valueClass="text-xs font-mono font-bold text-on-surface"
                      [readonly]="!canEdit()"
                      (save)="patchSlotTime(slot, { setStartTime: $event })"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-[9px] font-black uppercase tracking-wider text-outline mb-1">Hora de término en escenario</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="time"
                      [disabled]="!canEdit()"
                      [value]="slot.setEndTime || ''"
                      (change)="patchSlotTime(slot, { setEndTime: $any($event.target).value })"
                      class="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-outline-variant/30 text-xs font-mono font-bold text-amber-200 focus:outline-none focus:border-amber-400 disabled:opacity-50"
                    />
                    <app-editable-field
                      [value]="slot.setEndTime || ''"
                      placeholder="HH:mm"
                      valueClass="text-xs font-mono font-bold text-amber-200"
                      [readonly]="!canEdit()"
                      (save)="patchSlotTime(slot, { setEndTime: $event })"
                    />
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <p class="text-[11px] text-outline italic p-6 rounded-2xl bg-surface-container/40 border border-dashed border-outline-variant/30 text-center">
              No hay grupos registrados en el cartel todavía. Agrega grupos en la pestaña "Evento" para definir su horario de entrada.
            </p>
          }
        </div>
      </section>

      <!-- ─── SOUNDCHECKS DEL GRUPO (PRUEBAS DE SONIDO) ─── -->
      <section class="p-6 rounded-3xl bg-gradient-to-br from-cyan-500/[0.07] via-surface-container-high/90 to-surface-container-high/90 border border-cyan-500/25 border-l-4 border-l-cyan-500/70 shadow-2xl space-y-5 backdrop-blur-2xl">
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/20 pb-4">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg">graphic_eq</span>
            <div>
              <h5 class="text-xs font-black uppercase tracking-wider text-cyan-300">SoundChecks del Grupo</h5>
              <p class="text-[11px] text-outline">Llegadas al recinto, horario de inicio/fin de prueba y hora de salida. Soporta múltiples soundchecks por grupo.</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            @if (canEdit() && slots().length > 0) {
              <button
                type="button"
                (click)="autoGenerateSoundChecks()"
                class="px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black text-[10px] font-black transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                title="Genera automáticamente un turno de soundcheck para cada grupo del cartel"
              >
                <span class="material-symbols-outlined text-xs">auto_awesome</span> ⚡ Auto-generar del Cartel
              </button>
              <button
                type="button"
                (click)="addSoundCheck()"
                class="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black text-xs font-black transition-all shadow-md flex items-center gap-1 active:scale-95"
              >
                <span class="material-symbols-outlined text-sm">add</span> + SoundCheck
              </button>
            }
          </div>
        </div>

        <div class="space-y-3">
          @for (sc of soundChecks(); track sc.id) {
            <div class="p-4 rounded-2xl bg-surface-container/70 border border-outline-variant/30 space-y-3 shadow-md hover:border-cyan-500/40 transition-all">
              <div class="flex items-center justify-between gap-3 flex-wrap border-b border-outline-variant/15 pb-2.5">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center material-symbols-outlined text-sm shrink-0">
                    music_note
                  </span>
                  <div class="min-w-0">
                    <div class="w-48 sm:w-64">
                      <app-editable-field
                        label="Grupo del sound check"
                        type="select"
                        [options]="slotGroupOptions()"
                        [value]="sc.groupId"
                        [readonly]="!canEdit()"
                        (save)="updateSoundCheckGroup(sc, $event)"
                      />
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  @if (canEdit()) {
                    <button
                      type="button"
                      (click)="autoSyncSoundCheckFromShow(sc)"
                      class="px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500 hover:text-black text-[10px] font-bold flex items-center gap-1 transition-all"
                      title="Sincroniza la llegada y prueba 3 horas antes de su presentación en escenario"
                    >
                      <span class="material-symbols-outlined text-[12px]">sync</span> ⚡ 3h antes de show
                    </button>
                    <button
                      type="button"
                      (click)="duplicateSoundCheck(sc)"
                      class="px-2.5 py-1 rounded-xl bg-surface-container-highest text-outline border border-outline-variant/30 hover:text-on-surface text-[10px] font-bold flex items-center gap-1 transition-all"
                      title="Crea otro turno de soundcheck para este mismo grupo"
                    >
                      <span class="material-symbols-outlined text-[12px]">content_copy</span> Duplicar
                    </button>
                    <button
                      type="button"
                      (click)="removeSoundCheck(sc)"
                      class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all"
                      title="Eliminar soundcheck"
                    >
                      <span class="material-symbols-outlined text-[13px]">delete</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Matriz de Tiempos con inputs directos + editable-field -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label class="block text-[9px] font-black uppercase text-outline mb-1">Día y Hora de llegada</label>
                  <input
                    type="text"
                    [disabled]="!canEdit()"
                    [value]="sc.arrivalDateTime || ''"
                    (change)="patchSoundCheck(sc, { arrivalDateTime: $any($event.target).value })"
                    placeholder="2026-08-15 15:00"
                    class="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-outline-variant/30 text-xs font-mono font-bold text-on-surface focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label class="block text-[9px] font-black uppercase text-outline mb-1">Hora inicio sound check</label>
                  <input
                    type="time"
                    [disabled]="!canEdit()"
                    [value]="sc.startTime || ''"
                    (change)="patchSoundCheck(sc, { startTime: $any($event.target).value })"
                    class="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-outline-variant/30 text-xs font-mono font-bold text-cyan-200 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label class="block text-[9px] font-black uppercase text-outline mb-1">Hora fin sound check</label>
                  <input
                    type="time"
                    [disabled]="!canEdit()"
                    [value]="sc.endTime || ''"
                    (change)="patchSoundCheck(sc, { endTime: $any($event.target).value })"
                    class="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-outline-variant/30 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label class="block text-[9px] font-black uppercase text-outline mb-1">Hora de salida</label>
                  <input
                    type="time"
                    [disabled]="!canEdit()"
                    [value]="sc.departureTime || ''"
                    (change)="patchSoundCheck(sc, { departureTime: $any($event.target).value })"
                    class="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-outline-variant/30 text-xs font-mono font-bold text-on-surface-variant focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                  />
                </div>
              </div>

              <!-- Notas u observaciones -->
              <app-editable-field
                label="Notas / Requerimientos del SoundCheck"
                placeholder="Ej. Prueba de microfonía inalámbrica, monitores de piso, nivelación de canales..."
                valueClass="text-[11px] font-medium text-on-surface-variant break-words"
                [value]="sc.notes || ''"
                [readonly]="!canEdit()"
                (save)="patchSoundCheck(sc, { notes: $event })"
              />
            </div>
          } @empty {
            <div class="p-6 rounded-2xl bg-surface-container/40 border border-dashed border-outline-variant/30 text-center space-y-3">
              <p class="text-[11px] text-outline italic">
                Sin pruebas de sonido registradas. Usa el botón rápido para auto-generarlas desde el cartel o añade manualmente.
              </p>
              @if (canEdit() && slots().length > 0) {
                <div class="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    (click)="autoGenerateSoundChecks()"
                    class="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black text-[11px] font-black inline-flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <span class="material-symbols-outlined text-sm">auto_awesome</span> ⚡ Auto-generar SoundChecks en 1-clic
                  </button>
                  <button
                    type="button"
                    (click)="addSoundCheck()"
                    class="px-3.5 py-2 rounded-xl bg-surface-container-highest text-outline border border-outline-variant/30 hover:text-on-surface text-[11px] font-bold inline-flex items-center gap-1 transition-all"
                  >
                    <span class="material-symbols-outlined text-sm">add</span> + Agregar manualmente
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </section>

    </div>

    <!-- ─── MODAL: ENCARGAR UN RUBRO A OTRO MANAGER ─── -->
    @if (assignOpen()) {
      <div
        class="fixed inset-0 z-[999999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
        (click)="assignOpen.set(false)"
      >
        <div
          class="w-full max-w-2xl bg-gradient-to-b from-[#12261f] via-[#101a1c] to-[#0b0f14] border border-teal-500/30 rounded-3xl shadow-[0_0_80px_rgba(20,184,166,0.18)] relative overflow-hidden flex flex-col max-h-[88vh]"
          (click)="$event.stopPropagation()"
        >
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <header class="shrink-0 flex items-center justify-between gap-3 p-6 border-b border-white/10 relative z-10">
            <div class="flex items-center gap-3 min-w-0">
              <span class="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shadow-lg shrink-0">
                <span class="material-symbols-outlined text-xl">assignment_ind</span>
              </span>
              <div class="min-w-0">
                <h3 class="text-base font-black text-on-surface tracking-tight">ENCARGAR UN RUBRO</h3>
                <p class="text-[11px] text-outline">
                  {{ isDraft() ? 'Se le avisará al enviar el evento a revisión' : 'El manager recibe el encargo y decide si lo acepta' }}
                </p>
              </div>
            </div>
            <button
              type="button"
              (click)="assignOpen.set(false)"
              class="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-500 hover:text-white text-outline flex items-center justify-center transition-all shrink-0"
            >
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </header>

          <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-4 relative z-10">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Rubro</label>
              <select
                [value]="assignCategory()"
                (change)="assignCategory.set($any($event.target).value)"
                class="w-full px-4 py-3 rounded-2xl bg-black/40 border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-teal-500"
              >
                @for (cat of assignableCategories(); track cat.key) {
                  <option [value]="cat.key">{{ cat.key }} — {{ cat.meaning }}</option>
                }
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Manager que se hace cargo</label>
              <select
                [value]="assignManager()"
                (change)="assignManager.set($any($event.target).value)"
                class="w-full px-4 py-3 rounded-2xl bg-black/40 border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-teal-500"
              >
                @for (m of otherManagers(); track m) {
                  <option [value]="m">{{ m }}</option>
                }
              </select>
            </div>

            @if (canViewFinances()) {
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-wider text-outline block">
                  Tope de gasto (opcional)
                </label>
                <input
                  type="number"
                  [value]="assignBudget()"
                  (input)="assignBudget.set(+$any($event.target).value)"
                  placeholder="0"
                  class="w-full px-4 py-3 rounded-2xl bg-black/40 border border-outline-variant/30 text-sm font-black font-mono text-on-surface focus:outline-none focus:border-teal-500"
                />
                <p class="text-[10px] text-outline">Déjalo en cero si no se pactó ningún tope.</p>
              </div>
            }

            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-outline block">Qué se le pide (opcional)</label>
              <textarea
                rows="3"
                [value]="assignBrief()"
                (input)="assignBrief.set($any($event.target).value)"
                placeholder="Ej. Conseguir el sonido y las luces con el proveedor de siempre; el escenario ya está apartado."
                class="w-full px-4 py-3 rounded-2xl bg-black/40 border border-outline-variant/30 text-xs font-medium text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-teal-500 resize-none"
              ></textarea>
            </div>

            <p class="text-[11px] text-outline flex items-start gap-2">
              <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">info</span>
              <span>
                Aceptar el encargo <strong class="text-on-surface">no obliga a desglosar</strong> nada. Si el acuerdo se
                cierra por fuera, basta con que aquí quede constancia de quién respondía por el rubro.
              </span>
            </p>
          </div>

          <footer class="shrink-0 flex items-center justify-end gap-3 p-4 border-t border-white/10 bg-black/30 relative z-10">
            <button
              type="button"
              (click)="assignOpen.set(false)"
              class="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-outline text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="saveAssignment()"
              [disabled]="!assignManager()"
              class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-400 to-teal-500 text-black font-black text-xs hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {{ isDraft() ? 'Guardar encargo' : 'Enviar encargo' }}
            </button>
          </footer>
        </div>
      </div>
    }
  `
})
export class EventTabProductionComponent {
  event = input.required<EventItem>();
  canEdit = input<boolean>(false);
  canViewFinances = input<boolean>(false);

  patch = output<Partial<EventItem>>();

  readonly allCategories = PRODUCTION_CATEGORIES;

  readonly itemStatuses: EditableOption[] = [
    { value: 'Estimado', label: 'Estimado (cifra tentativa)' },
    { value: 'Cotizado', label: 'Cotizado (hay propuesta)' },
    { value: 'Contratado', label: 'Contratado (compromiso firme)' },
    { value: 'Pagado', label: 'Pagado' }
  ];

  money = money;
  dateTimeLabel = dateTimeLabel;
  meta = productionCategoryMeta;

  slots = computed(() => lineup(this.event()));
  cartelCost = computed(() => lineupTotalCost(this.event()));

  // ─── Desglose ──────────────────────────────────────────────────────────────

  items = computed(() => productionItems(this.event()));
  itemsCost = computed(() => productionItemsCost(this.event()));
  committed = computed(() => productionCommittedCost(this.event()));
  paid = computed(() => productionPaidCost(this.event()));
  totalCost = computed(() => productionCost(this.event()));
  byCategory = computed(() => productionCostByCategory(this.event()));

  private openKeys = signal<Set<ProductionCategory>>(new Set());
  showAllCategories = signal(false);

  isOpen(key: ProductionCategory): boolean {
    return this.openKeys().has(key);
  }

  toggle(key: ProductionCategory): void {
    this.openKeys.update(set => {
      const next = new Set(set);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  visibleCategories = computed<ProductionCategoryMeta[]>(() => {
    if (this.showAllCategories()) return [...this.allCategories];
    const conContenido = this.allCategories.filter(
      c => this.categoryCount(c.key) > 0 || !!this.responsibility(c.key)
    );
    return conContenido.length ? conContenido : [...this.allCategories];
  });

  itemsOf(key: ProductionCategory): EventProductionItem[] {
    return this.items().filter(i => i.category === key);
  }

  categoryCount(key: ProductionCategory): number {
    return this.itemsOf(key).length;
  }

  categoryTotal(key: ProductionCategory): number {
    return this.itemsOf(key).reduce((sum, i) => sum + (i.amount || 0), 0);
  }

  sharePercent(amount: number): number {
    const total = this.itemsCost();
    return total > 0 ? (amount / total) * 100 : 0;
  }

  hasConcept(key: ProductionCategory, concept: string): boolean {
    return this.itemsOf(key).some(i => i.concept.trim().toLowerCase() === concept.trim().toLowerCase());
  }

  // ─── SoundChecks del Grupo (Herramientas Rápidas) ───────────────────────────

  soundChecks = computed<GroupSoundCheck[]>(() => groupSoundChecks(this.event()));

  slotGroupOptions = computed<EditableOption[]>(() => {
    const list = this.slots();
    if (!list.length) return [{ value: 'grp-default', label: 'Sin grupos' }];
    return list.map(s => ({ value: s.groupId, label: s.groupName }));
  });

  addSoundCheck(groupId?: string): void {
    const list = this.slots();
    const selectedSlot = list.find(s => s.groupId === groupId) || list[0];
    const gName = selectedSlot ? selectedSlot.groupName : 'Grupo del cartel';
    const gId = selectedSlot ? selectedSlot.groupId : 'grp-' + Date.now();
    const eventDate = this.event().date || new Date().toISOString().slice(0, 10);

    const newCheck: GroupSoundCheck = {
      id: 'sc-' + this.event().id + '-' + Date.now(),
      groupId: gId,
      groupName: gName,
      arrivalDateTime: eventDate + ' 15:00',
      startTime: '16:00',
      endTime: '17:00',
      departureTime: '17:30',
      notes: 'Prueba de sonido estándar'
    };

    this.patch.emit({ soundChecks: [...this.soundChecks(), newCheck] });
  }

  autoGenerateSoundChecks(): void {
    const slotsList = this.slots();
    if (!slotsList.length) return;
    const eventDate = this.event().date || new Date().toISOString().slice(0, 10);

    let startMins = 15 * 60; // 15:00
    const newChecks: GroupSoundCheck[] = slotsList.map((slot, i) => {
      const arr = this.minutesToTime(startMins);
      const scStart = this.minutesToTime(startMins + 30);
      const scEnd = this.minutesToTime(startMins + 90);
      const dep = this.minutesToTime(startMins + 120);

      startMins += 120; // 2 horas por grupo

      return {
        id: 'sc-' + this.event().id + '-' + (Date.now() + i),
        groupId: slot.groupId,
        groupName: slot.groupName,
        arrivalDateTime: `${eventDate} ${arr}`,
        startTime: scStart,
        endTime: scEnd,
        departureTime: dep,
        notes: slot.isHeadliner ? 'Prueba técnica estelar y monitoreo IEM' : 'Prueba de sonido estándar'
      };
    });

    this.patch.emit({ soundChecks: [...this.soundChecks(), ...newChecks] });
  }

  duplicateSoundCheck(sc: GroupSoundCheck): void {
    const copy: GroupSoundCheck = {
      ...sc,
      id: 'sc-' + this.event().id + '-' + Date.now(),
      notes: sc.notes ? sc.notes + ' (2da prueba)' : 'Segunda prueba de sonido'
    };
    this.patch.emit({ soundChecks: [...this.soundChecks(), copy] });
  }

  autoSyncSoundCheckFromShow(sc: GroupSoundCheck): void {
    const slot = this.slots().find(s => s.groupId === sc.groupId);
    if (!slot || !slot.setStartTime) return;
    const eventDate = this.event().date || new Date().toISOString().slice(0, 10);
    const showMins = this.timeToMinutes(slot.setStartTime);

    // Llegada 3 horas antes del show, soundcheck 2.5h antes
    const arrMins = Math.max(0, showMins - 180);
    const scStartMins = Math.max(0, showMins - 150);
    const scEndMins = Math.max(0, showMins - 90);
    const depMins = Math.max(0, showMins - 60);

    this.patchSoundCheck(sc, {
      arrivalDateTime: `${eventDate} ${this.minutesToTime(arrMins)}`,
      startTime: this.minutesToTime(scStartMins),
      endTime: this.minutesToTime(scEndMins),
      departureTime: this.minutesToTime(depMins)
    });
  }

  updateSoundCheckGroup(sc: GroupSoundCheck, newGroupId: string): void {
    const slot = this.slots().find(s => s.groupId === newGroupId);
    const groupName = slot ? slot.groupName : sc.groupName;
    this.patchSoundCheck(sc, { groupId: newGroupId, groupName });
  }

  patchSoundCheck(sc: GroupSoundCheck, changes: Partial<GroupSoundCheck>): void {
    const updated = this.soundChecks().map(item => (item.id === sc.id ? { ...item, ...changes } : item));
    this.patch.emit({ soundChecks: updated });
  }

  removeSoundCheck(sc: GroupSoundCheck): void {
    const updated = this.soundChecks().filter(item => item.id !== sc.id);
    this.patch.emit({ soundChecks: updated });
  }

  // ─── Orden de Entradas / Programador de Horarios Rápido ─────────────────────

  autoScheduleOpen = signal(false);
  autoScheduleStart = signal('20:00');
  autoScheduleDuration = signal(90);
  autoScheduleGap = signal(15);

  applyAutoSchedule(): void {
    const slotsList = this.slots();
    if (!slotsList.length) return;

    let currentMins = this.timeToMinutes(this.autoScheduleStart() || '20:00');
    const dur = Math.max(15, this.autoScheduleDuration() || 90);
    const gap = Math.max(0, this.autoScheduleGap() || 15);

    const updatedLineup = slotsList.map(slot => {
      const setDur = slot.isHeadliner ? Math.round(dur * 1.25) : dur;
      const startStr = this.minutesToTime(currentMins);
      const endMins = currentMins + setDur;
      const endStr = this.minutesToTime(endMins);

      currentMins = endMins + gap;

      return {
        ...slot,
        setStartTime: startStr,
        setEndTime: endStr,
        durationMinutes: setDur
      };
    });

    this.patch.emit({ lineup: updatedLineup });
    this.autoScheduleOpen.set(false);
  }

  setPresetDuration(slot: EventLineupSlot, minutes: number): void {
    const startStr = slot.setStartTime || '20:00';
    const startMins = this.timeToMinutes(startStr);
    const endMins = startMins + minutes;
    const endStr = this.minutesToTime(endMins);

    this.patchSlotTime(slot, {
      setStartTime: startStr,
      setEndTime: endStr,
      durationMinutes: minutes
    });
  }

  patchSlotTime(slot: EventLineupSlot, changes: Partial<EventLineupSlot>): void {
    const updatedLineup = this.slots().map(s => (s.id === slot.id ? { ...s, ...changes } : s));
    this.patch.emit({ lineup: updatedLineup });
  }

  calculateSetDuration(startTime?: string, endTime?: string): string {
    if (!startTime || !endTime) return 'Por definir';
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 'Por definir';
    let mins1 = h1 * 60 + m1;
    let mins2 = h2 * 60 + m2;
    if (mins2 < mins1) mins2 += 24 * 60;
    const diff = mins2 - mins1;
    const hours = Math.floor(diff / 60);
    const remainingMins = diff % 60;
    if (hours > 0 && remainingMins > 0) return `${hours}h ${remainingMins}m`;
    if (hours > 0) return `${hours}h`;
    return `${remainingMins}m`;
  }

  private timeToMinutes(timeStr: string): number {
    if (!timeStr) return 20 * 60;
    const [h, m] = timeStr.split(':').map(Number);
    return (isNaN(h) ? 20 : h) * 60 + (isNaN(m) ? 0 : m);
  }

  private minutesToTime(totalMins: number): string {
    const normalized = (totalMins % (24 * 60) + 24 * 60) % (24 * 60);
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // ─── Managers del evento ───────────────────────────────────────────────────

  private organizer = computed(() => organizerName(this.event()));

  otherManagers = computed(() =>
    (this.event().managerAgreements ?? [])
      .filter(a => a.role === 'coorganizador' && a.managerName !== this.organizer())
      .map(a => a.managerName)
  );

  organizerLabel = computed(() => this.organizer());

  managerOptions = computed<EditableOption[]>(() => [
    { value: this.organizer(), label: this.organizer() + ' (organizador)' },
    ...this.otherManagers().map(m => ({ value: m, label: m }))
  ]);

  isDraft = computed(() => this.event().state === 'Borrador');

  // ─── Reparto de rubros ─────────────────────────────────────────────────────

  responsibilities = computed(() => this.event().productionResponsibilities ?? []);
  assignedCount = computed(() => this.responsibilities().length);

  responsibility(key: ProductionCategory): EventProductionResponsibility | null {
    return responsibilityFor(this.event(), key);
  }

  assignableCategories = computed<ProductionCategoryMeta[]>(() =>
    this.allCategories.filter(c => !this.responsibility(c.key))
  );

  assignOpen = signal(false);
  assignCategory = signal<ProductionCategory>('Recinto');
  assignManager = signal('');
  assignBudget = signal(0);
  assignBrief = signal('');

  openAssign(): void {
    const libres = this.assignableCategories();
    this.assignCategory.set(libres[0]?.key ?? 'Otros');
    this.assignManager.set(this.otherManagers()[0] ?? '');
    this.assignBudget.set(0);
    this.assignBrief.set('');
    this.assignOpen.set(true);
  }

  saveAssignment(): void {
    const manager = this.assignManager();
    if (!manager) return;

    const draft = this.isDraft();
    const now = new Date().toISOString().slice(0, 16);
    const nuevo: EventProductionResponsibility = {
      id: 'pr-' + this.event().id + '-' + Date.now(),
      category: this.assignCategory(),
      managerName: manager,
      status: draft ? 'Sin Enviar' : 'Pendiente',
      budgetCap: this.assignBudget() > 0 ? this.assignBudget() : undefined,
      brief: this.assignBrief().trim() || undefined,
      assignedAt: draft ? undefined : now
    };

    this.patch.emit({ productionResponsibilities: [...this.responsibilities(), nuevo] });
    this.assignOpen.set(false);
  }

  respondResponsibility(r: EventProductionResponsibility, status: 'Aceptada' | 'Rechazada'): void {
    this.patch.emit({
      productionResponsibilities: this.responsibilities().map(x =>
        x.id === r.id
          ? {
              ...x,
              status,
              respondedAt: new Date().toISOString().slice(0, 16),
              reason: status === 'Rechazada' ? 'No puede hacerse cargo de este rubro' : undefined
            }
          : x
      )
    });
  }

  removeResponsibility(r: EventProductionResponsibility): void {
    this.patch.emit({ productionResponsibilities: this.responsibilities().filter(x => x.id !== r.id) });
  }

  assignmentLabel(status: EventProductionResponsibility['status']): string {
    return status === 'Sin Enviar' ? 'Por enviar' : status;
  }

  assignmentClass(status: EventProductionResponsibility['status']): string {
    switch (status) {
      case 'Aceptada': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Pendiente': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Rechazada': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default: return 'bg-surface-container-highest text-outline border-outline-variant/40';
    }
  }

  // ─── Mutaciones del desglose ───────────────────────────────────────────────

  private commitItems(next: EventProductionItem[]): void {
    this.patch.emit({ productionItems: next });
  }

  addItem(cat: ProductionCategoryMeta, concept: string): void {
    const resp = this.responsibility(cat.key);

    if (!this.showAllCategories() && this.items().length === 0) {
      this.showAllCategories.set(true);
    }

    const item: EventProductionItem = {
      id: 'pi-' + this.event().id + '-' + Date.now(),
      category: cat.key,
      concept: concept || 'Nueva partida',
      quantity: 1,
      unit: cat.defaultUnit,
      unitCost: 0,
      amount: 0,
      status: 'Estimado',
      assignedTo: resp?.managerName,
      createdBy: this.organizer()
    };
    this.commitItems([...this.items(), item]);
    this.openKeys.update(set => new Set(set).add(cat.key));
  }

  patchItem(item: EventProductionItem, changes: Partial<EventProductionItem>): void {
    this.commitItems(this.items().map(i => (i.id === item.id ? { ...i, ...changes } : i)));
  }

  recalc(item: EventProductionItem, changes: Partial<EventProductionItem>): void {
    const merged = { ...item, ...changes };
    const amount = Math.round((merged.quantity || 0) * (merged.unitCost || 0));
    this.patchItem(item, { ...changes, amount: amount > 0 ? amount : merged.amount });
  }

  removeItem(item: EventProductionItem): void {
    this.commitItems(this.items().filter(i => i.id !== item.id));
  }

  toNumber(value: string): number {
    return Math.max(0, Number(String(value).replace(/[^0-9.-]/g, '')) || 0);
  }
}
