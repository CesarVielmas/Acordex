import { Component, ChangeDetectionStrategy, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CroquisArea, CroquisElement, CroquisPlan, RowLabeling,
  SeatGridOptions, SeatNumbering
} from '../../../../core/models/croquis.models';
import { EventItem, TicketTier } from '../../../../core/models/event.models';
import { CROQUIS_ELEMENTS, elementMeta } from '../croquis-catalog';
import { defaultGridOptions, fitGrid } from '../croquis-geometry';
import { areaBlocked, areaCapacity, areaHeld, areaSold } from '../croquis-metrics';
import { AreaInsight, SelectionInsight } from '../croquis-insights';
import { money } from '../../event-metrics';

/**
 * Panel de propiedades del editor.
 *
 * Cambia según lo que esté seleccionado, y ese es todo el punto: un croquis
 * tiene demasiadas propiedades para caber juntas en pantalla, pero muy pocas
 * son relevantes a la vez. Con un área de butacas seleccionada no importa el
 * aforo libre; con butacas sueltas seleccionadas solo importan tres acciones.
 *
 * El orden dentro de cada estado no es casual: primero lo que identifica (qué
 * es y a qué boleto pertenece), luego la forma, y hasta el final lo destructivo.
 */

export type SeatBatchAction = 'disponible' | 'vendido' | 'apartado' | 'bloqueado' | 'quitar' | 'accesible';

@Component({
  selector: 'app-croquis-inspector',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-4">

      <!-- ─── BUTACAS SELECCIONADAS ─── -->
      @if (seatCount() > 0) {
        <section class="p-4 rounded-2xl bg-gradient-to-br from-amber-500/[0.09] to-surface-container-high/90 border border-amber-500/35 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h6 class="text-[10px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[14px]">event_seat</span>
              {{ seatCount() }} butaca(s)
            </h6>
            <button type="button" (click)="clearSeats.emit()"
              class="text-[10px] font-black text-outline hover:text-on-surface transition-colors shrink-0">
              Quitar selección
            </button>
          </div>

          <!-- ─── QUÉ SE SELECCIONÓ ─── -->
          <!-- La cifra que decide un cambio de precio: cuánto valen exactamente
               estas butacas antes de repintarlas de otra categoría. -->
          @if (selection(); as sel) {
            <div class="p-2.5 rounded-xl bg-surface-container/70 border border-outline-variant/25 space-y-2">
              @if (canViewFinances() && sel.potential > 0) {
                <div class="flex items-baseline justify-between gap-2">
                  <span class="text-[9px] font-black uppercase tracking-wider text-outline">Valen</span>
                  <span class="text-sm font-black font-mono text-primary truncate" [title]="money(sel.potential)">
                    {{ money(sel.potential) }}
                  </span>
                </div>
              }

              @for (row of sel.byTier; track row.tier?.id || 'sin') {
                <div class="flex items-center gap-2 min-w-0 text-[10px]">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0 border border-white/15"
                    [style.background-color]="row.tier?.color || '#4d4635'"></span>
                  <span class="font-bold text-on-surface-variant truncate flex-1" [title]="row.tier?.name || 'Sin categoría'">
                    {{ row.tier?.name || 'Sin categoría' }}
                  </span>
                  <span class="font-mono font-black text-on-surface shrink-0">{{ row.count }}</span>
                  @if (canViewFinances() && row.subtotal > 0) {
                    <span class="font-mono text-outline shrink-0">{{ money(row.subtotal) }}</span>
                  }
                </div>
              }

              <div class="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-outline-variant/15">
                <span class="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[9px] font-black">
                  {{ sel.available }} libres
                </span>
                @if (sel.sold) {
                  <span class="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 text-[9px] font-black">{{ sel.sold }} vendidas</span>
                }
                @if (sel.held) {
                  <span class="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 text-[9px] font-black">{{ sel.held }} apartadas</span>
                }
                @if (sel.blocked) {
                  <span class="px-1.5 py-0.5 rounded-md bg-surface-container-highest text-outline text-[9px] font-black">{{ sel.blocked }} bloqueadas</span>
                }
              </div>

              <p class="text-[9px] text-outline leading-snug break-words">
                {{ sel.areaNames.join(' · ') }}
                @if (sel.rowLabels.length) {
                  <span class="text-on-surface-variant"> · filas {{ rowRange(sel.rowLabels) }}</span>
                }
              </p>
            </div>
          }

          <div>
            <span class="block text-[9px] font-black uppercase tracking-wider text-outline mb-1.5">Cambiar de categoría</span>
            <div class="flex flex-wrap gap-1.5">
              @for (tier of tiers(); track tier.id) {
                <button type="button" (click)="assignSeatTier.emit(tier.id || '')"
                  [title]="tier.name"
                  class="px-2 py-1 max-w-full min-w-0 rounded-lg border text-[10px] font-black flex items-center gap-1.5 transition-all hover:brightness-125"
                  [style.background-color]="tier.color + '22'"
                  [style.border-color]="tier.color + '99'"
                  [style.color]="tier.color"
                >
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background-color]="tier.color"></span>
                  <span class="truncate">{{ tier.name }}</span>
                </button>
              }
              <button type="button" (click)="assignSeatTier.emit('')"
                class="px-2 py-1 rounded-lg border border-outline-variant/40 text-[10px] font-black text-outline hover:text-on-surface transition-all">
                Heredar del área
              </button>
            </div>
          </div>

          <div>
            <span class="block text-[9px] font-black uppercase tracking-wider text-outline mb-1.5">Estado de venta</span>
            <div class="grid grid-cols-2 gap-1.5">
              <button type="button" (click)="seatAction.emit('disponible')" [class]="actionClass('emerald')">Disponible</button>
              <button type="button" (click)="seatAction.emit('vendido')" [class]="actionClass('rose')">Vendido</button>
              <button type="button" (click)="seatAction.emit('apartado')" [class]="actionClass('amber')">Apartado</button>
              <button type="button" (click)="seatAction.emit('bloqueado')" [class]="actionClass('slate')">Bloqueado</button>
            </div>
            <p class="text-[9px] text-outline mt-1.5 leading-snug">
              <strong class="text-on-surface-variant">Bloqueado</strong> deja la butaca dibujada pero fuera de la venta
              (una columna enfrente, un lugar de prensa). <strong class="text-on-surface-variant">Quitar</strong> la borra
              del croquis: el hueco queda como pasillo.
            </p>
          </div>

          <div class="flex gap-1.5">
            <button type="button" (click)="seatAction.emit('accesible')"
              class="flex-1 px-2 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/35 hover:bg-sky-500 hover:text-black text-[10px] font-black transition-all flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[13px]">accessible</span> Silla de ruedas
            </button>
            <button type="button" (click)="seatAction.emit('quitar')"
              class="flex-1 px-2 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/35 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[13px]">backspace</span> Quitar del croquis
            </button>
          </div>
        </section>
      }

      <!-- ─── ÁREA SELECCIONADA ─── -->
      @if (area(); as a) {
        <section class="p-4 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3.5">
          <div class="flex items-center justify-between gap-2">
            <h6 class="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[14px]">{{ a.kind === 'butacas' ? 'event_seat' : 'groups' }}</span>
              Área seleccionada
            </h6>
            <span class="px-2 py-0.5 rounded-lg bg-surface-container text-[9px] font-black text-outline border border-outline-variant/30">
              {{ a.kind === 'butacas' ? 'Butacas' : 'Aforo libre' }}
            </span>
          </div>

          <label class="block">
            <span [class]="labelClass">Nombre del área</span>
            <input [value]="a.name" (change)="patchArea.emit({ name: value($event) })" [class]="inputClass" />
          </label>

          <div>
            <span [class]="labelClass">Categoría de boleto</span>
            <div class="flex flex-wrap gap-1.5">
              @for (tier of tiers(); track tier.id) {
                <button type="button" (click)="patchArea.emit({ tierId: tier.id })"
                  [title]="tier.name + ' · $' + (tier.price || 0).toLocaleString('es-MX')"
                  class="px-2 py-1 max-w-full min-w-0 rounded-lg border text-[10px] font-black flex items-center gap-1.5 transition-all"
                  [class.ring-2]="a.tierId === tier.id"
                  [class.ring-offset-1]="a.tierId === tier.id"
                  [class.ring-offset-surface-container-high]="a.tierId === tier.id"
                  [style.background-color]="tier.color + (a.tierId === tier.id ? '44' : '18')"
                  [style.border-color]="tier.color + '99'"
                  [style.color]="tier.color"
                  [style.--tw-ring-color]="tier.color"
                >
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background-color]="tier.color"></span>
                  <span class="truncate">{{ tier.name }}</span>
                  <span class="font-mono opacity-80 shrink-0">&#36;{{ (tier.price || 0).toLocaleString('es-MX') }}</span>
                </button>
              } @empty {
                <p class="text-[10px] text-rose-300 italic">
                  No hay categorías de boleto. Crea una abajo para poder venderle a esta área.
                </p>
              }
            </div>
          </div>

          @if (a.kind === 'general') {
            <div class="grid grid-cols-2 gap-2">
              <label class="block">
                <span [class]="labelClass">Aforo</span>
                <input type="number" min="0" [value]="a.capacity || 0"
                  (change)="patchArea.emit({ capacity: num($event) })" [class]="inputClass" />
              </label>
              <label class="block">
                <span [class]="labelClass">Vendidos</span>
                <input type="number" min="0" [value]="a.soldCount || 0"
                  (change)="patchArea.emit({ soldCount: num($event) })" [class]="inputClass" />
              </label>
            </div>
            <button type="button" (click)="convertArea.emit('butacas')"
              class="w-full px-2 py-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 hover:bg-cyan-500 hover:text-black text-[10px] font-black transition-all flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-[14px]">grid_on</span>
              Convertir a butacas numeradas
            </button>
          } @else {
            <!-- Resumen de la butaquería. Son los números que el organizador
                 revisa al vender: cuántas hay, cuántas quedan y cuántas se
                 sacaron de la venta a mano. -->
            <div class="grid grid-cols-2 gap-2">
              <div class="p-2.5 rounded-xl bg-surface-container/70 border border-outline-variant/25">
                <span class="text-[9px] font-black uppercase tracking-wider text-outline block">A la venta</span>
                <span class="text-sm font-black font-mono text-on-surface">{{ capacity().toLocaleString('es-MX') }}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-surface-container/70 border border-outline-variant/25">
                <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Vendidas</span>
                <span class="text-sm font-black font-mono text-emerald-400">{{ sold().toLocaleString('es-MX') }}</span>
              </div>
              @if (held() > 0) {
                <div class="p-2.5 rounded-xl bg-surface-container/70 border border-outline-variant/25">
                  <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Apartadas</span>
                  <span class="text-sm font-black font-mono text-amber-300">{{ held() }}</span>
                </div>
              }
              @if (blocked() > 0) {
                <div class="p-2.5 rounded-xl bg-surface-container/70 border border-outline-variant/25">
                  <span class="text-[9px] font-black uppercase tracking-wider text-outline block">Bloqueadas</span>
                  <span class="text-sm font-black font-mono text-outline">{{ blocked() }}</span>
                </div>
              }
            </div>

            <!-- Lo que vale el área. Es lo que convierte "mover esta frontera
                 treinta butacas" en una decisión con número. -->
            @if (canViewFinances() && areaEconomics(); as eco) {
              @if (eco.potential > 0) {
                <div class="p-2.5 rounded-xl bg-primary/[0.07] border border-primary/25 space-y-1.5">
                  <div class="flex items-baseline justify-between gap-2">
                    <span class="text-[9px] font-black uppercase tracking-wider text-outline">Taquilla del área</span>
                    <span class="text-sm font-black font-mono text-primary truncate" [title]="money(eco.potential)">
                      {{ money(eco.potential) }}
                    </span>
                  </div>
                  @if (eco.collected > 0) {
                    <div class="flex items-baseline justify-between gap-2">
                      <span class="text-[9px] font-black uppercase tracking-wider text-outline">Ya cobrado</span>
                      <span class="text-[11px] font-black font-mono text-emerald-400">{{ money(eco.collected) }}</span>
                    </div>
                    <div class="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                      <div class="h-full rounded-full bg-emerald-500 transition-all" [style.width.%]="eco.occupancy"></div>
                    </div>
                  }
                  <p class="text-[9px] text-outline leading-snug">
                    {{ eco.available.toLocaleString('es-MX') }} lugares libres a
                    <strong class="text-on-surface-variant font-mono">&#36;{{ eco.price.toLocaleString('es-MX') }}</strong>
                  </p>
                </div>
              }
            }

            <!-- ─── Asistente de butaquería ─── -->
            <div class="p-3 rounded-xl bg-surface-container/60 border border-cyan-500/25 space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[9px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">grid_view</span> Generar butaquería
                </span>
                <button type="button" (click)="autoFill(a)"
                  class="text-[9px] font-black text-cyan-300 hover:text-cyan-200 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">auto_fix_high</span> Llenar el área
                </button>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <label class="block">
                  <span [class]="labelClass">Filas</span>
                  <input type="number" min="1" max="60" [value]="grid().rows"
                    (input)="setGrid({ rows: num($event) })" [class]="inputClass" />
                </label>
                <label class="block">
                  <span [class]="labelClass">Butacas por fila</span>
                  <input type="number" min="1" max="80" [value]="grid().seatsPerRow"
                    (input)="setGrid({ seatsPerRow: num($event) })" [class]="inputClass" />
                </label>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <label class="block">
                  <span [class]="labelClass">Numeración</span>
                  <select [value]="grid().numbering" (change)="setNumbering($event)" [class]="inputClass">
                    <option value="izquierda-derecha">1, 2, 3… (izq. a der.)</option>
                    <option value="derecha-izquierda">1, 2, 3… (der. a izq.)</option>
                    <option value="impares-pares">Nones / pares (teatro)</option>
                    <option value="corrida">Corrida entre filas</option>
                  </select>
                </label>
                <label class="block">
                  <span [class]="labelClass">Filas etiquetadas</span>
                  <select [value]="grid().labeling" (change)="setLabeling($event)" [class]="inputClass">
                    <option value="letras">A, B, C…</option>
                    <option value="numeros">1, 2, 3…</option>
                  </select>
                </label>
              </div>

              <label class="block">
                <span [class]="labelClass">Empieza en</span>
                <input [value]="grid().startLabel || 'A'" (change)="setGrid({ startLabel: value($event) })" [class]="inputClass" />
              </label>

              <label class="block">
                <span [class]="labelClass">Pasillos (posiciones separadas por coma)</span>
                <input [value]="(grid().aisles || []).join(', ')" placeholder="Ej. 7, 14"
                  (change)="setAisles(value($event))" [class]="inputClass" />
              </label>

              <div>
                <span [class]="labelClass">Curvatura hacia el escenario · {{ ((a.curve || 0) * 100).toFixed(0) }}%</span>
                <input type="range" min="0" max="1" step="0.05" [value]="a.curve || 0"
                  (input)="patchArea.emit({ curve: numFloat($event) })"
                  class="w-full accent-primary" />
              </div>

              <button type="button" (click)="regenerate.emit(grid())"
                class="w-full px-2 py-2 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black text-[10px] font-black transition-all flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-[14px]">refresh</span>
                Regenerar {{ grid().rows * grid().seatsPerRow }} butacas
              </button>
              <p class="text-[9px] text-amber-300/90 leading-snug flex items-start gap-1">
                <span class="material-symbols-outlined text-[11px] mt-0.5">warning</span>
                Regenerar reemplaza la butaquería: se pierden los estados de venta y las categorías por butaca de esta área.
              </p>
            </div>

            <button type="button" (click)="convertArea.emit('general')"
              class="w-full px-2 py-2 rounded-xl bg-surface-container text-outline border border-outline-variant/35 hover:text-on-surface text-[10px] font-black transition-all flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-[14px]">groups</span>
              Convertir a aforo libre
            </button>
          }

          <!-- Forma y posición -->
          <div class="pt-2 border-t border-outline-variant/20 space-y-2.5">
            <span [class]="labelClass">Forma</span>
            <div class="grid grid-cols-2 gap-1.5">
              <button type="button" (click)="patchArea.emit({ shape: 'rect' })" [class]="chipClass(a.shape === 'rect')">
                Rectángulo
              </button>
              <button type="button" (click)="setFan.emit()" [class]="chipClass(a.shape === 'polygon')">
                Abanico
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <label class="block">
                <span [class]="labelClass">Ancho</span>
                <input type="number" [value]="a.width" (change)="patchArea.emit({ width: num($event) })" [class]="inputClass" />
              </label>
              <label class="block">
                <span [class]="labelClass">Alto</span>
                <input type="number" [value]="a.height" (change)="patchArea.emit({ height: num($event) })" [class]="inputClass" />
              </label>
            </div>

            <div>
              <span [class]="labelClass">Giro · {{ a.rotation || 0 }}°</span>
              <input type="range" min="-180" max="180" step="1" [value]="a.rotation || 0"
                (input)="patchArea.emit({ rotation: num($event) })" class="w-full accent-primary" />
            </div>

            <label class="block">
              <span [class]="labelClass">Nota de acceso (la ve el cliente)</span>
              <input [value]="a.accessNote || ''" placeholder="Ej. Entrada por puerta 3"
                (change)="patchArea.emit({ accessNote: value($event) })" [class]="inputClass" />
            </label>
          </div>

          <div class="flex gap-1.5 pt-1">
            <button type="button" (click)="duplicateArea.emit()"
              class="flex-1 px-2 py-2 rounded-xl bg-surface-container text-on-surface-variant border border-outline-variant/35 hover:text-on-surface text-[10px] font-black transition-all flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[13px]">content_copy</span> Duplicar
            </button>
            <button type="button" (click)="deleteArea.emit()"
              class="flex-1 px-2 py-2 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/35 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[13px]">delete</span> Eliminar
            </button>
          </div>
        </section>
      }

      <!-- ─── ELEMENTO SELECCIONADO ─── -->
      @if (element(); as el) {
        <section class="p-4 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3">
          <h6 class="text-[10px] font-black uppercase tracking-widest text-violet-300 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px]">{{ meta(el).icon }}</span>
            {{ meta(el).label }}
          </h6>

          <label class="block">
            <span [class]="labelClass">Etiqueta</span>
            <input [value]="el.label" (change)="patchElement.emit({ label: value($event) })" [class]="inputClass" />
          </label>

          @if (el.kind === 'escenario' && lineupOptions().length) {
            <label class="block">
              <span [class]="labelClass">Grupo que toca aquí</span>
              <select [value]="el.lineupSlotId || ''" (change)="patchElement.emit({ lineupSlotId: value($event) || undefined })" [class]="inputClass">
                <option value="">Sin asignar</option>
                @for (slot of lineupOptions(); track slot.id) {
                  <option [value]="slot.id">{{ slot.name }}</option>
                }
              </select>
              <span class="text-[9px] text-outline block mt-1 leading-snug">
                Con varios escenarios simultáneos, esto es lo que le dice al cliente a cuál croquis entrar.
              </span>
            </label>
          }

          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span [class]="labelClass">Ancho</span>
              <input type="number" [value]="el.width" (change)="patchElement.emit({ width: num($event) })" [class]="inputClass" />
            </label>
            <label class="block">
              <span [class]="labelClass">Alto</span>
              <input type="number" [value]="el.height" (change)="patchElement.emit({ height: num($event) })" [class]="inputClass" />
            </label>
          </div>

          <div>
            <span [class]="labelClass">Giro · {{ el.rotation || 0 }}°</span>
            <input type="range" min="-180" max="180" step="1" [value]="el.rotation || 0"
              (input)="patchElement.emit({ rotation: num($event) })" class="w-full accent-primary" />
          </div>

          <button type="button" (click)="deleteElement.emit()"
            class="w-full px-2 py-2 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/35 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[13px]">delete</span> Eliminar elemento
          </button>
        </section>
      }

      <!-- ─── NADA SELECCIONADO: PROPIEDADES DEL CROQUIS ─── -->
      @if (!area() && !element() && seatCount() === 0) {
        <section class="p-4 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3">
          <h6 class="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px]">map</span> Este croquis
          </h6>

          <label class="block">
            <span [class]="labelClass">Nombre de la zona</span>
            <input [value]="plan().name" (change)="patchPlan.emit({ name: value($event) })" [class]="inputClass" />
          </label>

          <label class="block">
            <span [class]="labelClass">Descripción</span>
            <textarea rows="3" [value]="plan().description || ''"
              placeholder="Qué pasa en esta zona y quién toca aquí."
              (change)="patchPlan.emit({ description: value($event) })"
              [class]="inputClass + ' resize-y'"></textarea>
          </label>

          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span [class]="labelClass">Ancho del lienzo</span>
              <input type="number" min="400" [value]="plan().width" (change)="patchPlan.emit({ width: num($event) })" [class]="inputClass" />
            </label>
            <label class="block">
              <span [class]="labelClass">Alto del lienzo</span>
              <input type="number" min="400" [value]="plan().height" (change)="patchPlan.emit({ height: num($event) })" [class]="inputClass" />
            </label>
          </div>

          <div class="text-[10px] text-outline leading-relaxed p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/20 space-y-1.5">
            <p class="text-on-surface-variant font-bold">Cómo se maneja el croquis</p>
            <p><strong class="text-on-surface">Clic</strong> en un área o elemento para editarlo aquí.</p>
            <p><strong class="text-on-surface">Arrastra</strong> sobre las butacas para seleccionarlas en bloque; Ctrl suma a la selección.</p>
            <p><strong class="text-on-surface">La etiqueta</strong> de cada área es su tirador: arrástrala para moverla.</p>
            <p><strong class="text-on-surface">Shift + arrastrar</strong> mueve el plano y la rueda hace zoom.</p>
          </div>
        </section>
      }

      <!-- ─── CATEGORÍAS DE BOLETO ─── -->
      <section class="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/[0.07] to-surface-container-high/90 border border-cyan-500/25 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <h6 class="text-[10px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px]">confirmation_number</span>
            Categorías ({{ tiers().length }})
          </h6>
          <button type="button" (click)="addTier.emit()"
            class="px-2 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 hover:bg-cyan-500 hover:text-black text-[10px] font-black transition-all flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px]">add</span> Nueva
          </button>
        </div>

        @for (tier of tiers(); track tier.id) {
          <div class="p-2.5 rounded-xl bg-surface-container/70 border border-outline-variant/25 space-y-2 min-w-0">
            <div class="flex items-center gap-2 min-w-0">
              <label
                class="w-7 h-7 rounded-lg border border-outline-variant/40 cursor-pointer shrink-0 relative overflow-hidden"
                [style.background-color]="tier.color"
                title="Color de la categoría en el croquis"
              >
                <input type="color" [value]="tier.color"
                  (input)="patchTier.emit({ id: tier.id || '', changes: { color: value($event) } })"
                  class="absolute inset-0 opacity-0 cursor-pointer" />
              </label>
              <input [value]="tier.name"
                (change)="patchTier.emit({ id: tier.id || '', changes: { name: value($event) } })"
                class="flex-1 min-w-0 px-2 py-1 rounded-lg bg-surface-container-high border border-outline-variant/30 text-[11px] font-black text-on-surface focus:outline-none focus:border-primary/60 text-ellipsis" />
              <button type="button" (click)="editTier.emit(tier.id || '')"
                class="w-6 h-6 rounded-lg bg-surface-container-high text-outline border border-outline-variant/30 hover:text-primary hover:border-primary/40 flex items-center justify-center shrink-0 transition-all"
                title="Editar ícono, descripción y color">
                <span class="material-symbols-outlined text-[12px]">edit</span>
              </button>
              <button type="button" (click)="removeTier.emit(tier.id || '')"
                class="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 transition-all"
                title="Eliminar categoría">
                <span class="material-symbols-outlined text-[12px]">delete</span>
              </button>
            </div>

            <div class="flex items-start gap-2 min-w-0">
              <label class="flex-1 min-w-0">
                <span [class]="labelClass">Precio</span>
                <input type="number" min="0" [value]="tier.price"
                  (change)="patchTier.emit({ id: tier.id || '', changes: { price: num($event) } })"
                  [class]="inputClass" />
              </label>
              <div class="flex-1 min-w-0">
                <span [class]="labelClass">En el croquis</span>
                <div class="px-2 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/25 text-[11px] font-black font-mono truncate"
                  [class]="(tier.totalSeats || 0) > 0 ? 'text-on-surface' : 'text-rose-300'"
                  [title]="(tier.totalSeats || 0).toLocaleString('es-MX') + ' lugares'">
                  {{ (tier.totalSeats || 0).toLocaleString('es-MX') }}
                  <span class="font-sans font-bold text-outline">lug.</span>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <p class="text-[10px] text-outline italic text-center py-3">
            Sin categorías. Crea una para poder ponerle precio y color a las áreas.
          </p>
        }

        <p class="text-[9px] text-outline leading-snug flex items-start gap-1 pt-1 border-t border-outline-variant/15">
          <span class="material-symbols-outlined text-[11px] mt-0.5 text-cyan-300">sync</span>
          Los lugares de cada categoría se cuentan del croquis y no se capturan: lo que dibujas es lo que se vende.
        </p>
      </section>

      <!-- ─── ELEMENTOS DISPONIBLES ─── -->
      <section class="p-4 rounded-2xl bg-surface-container-high/60 border border-outline-variant/25 space-y-2">
        <h6 class="text-[10px] font-black uppercase tracking-widest text-outline flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[14px]">category</span> Elementos del recinto
        </h6>
        <div class="grid grid-cols-2 gap-1.5">
          @for (item of elementCatalog; track item.kind) {
            <button type="button" (click)="pickElement.emit(item.kind)"
              [title]="item.hint"
              class="px-2 py-2 rounded-xl border text-[10px] font-black flex items-center gap-1.5 transition-all text-left"
              [class]="activeElementKind() === item.kind
                ? 'bg-primary/20 text-primary border-primary/50'
                : 'bg-surface-container/60 text-on-surface-variant border-outline-variant/30 hover:border-primary/40 hover:text-on-surface'"
            >
              <span class="material-symbols-outlined text-[15px] shrink-0" [style.color]="item.color">{{ item.icon }}</span>
              <span class="truncate">{{ item.label }}</span>
            </button>
          }
        </div>
        <p class="text-[9px] text-outline leading-snug">
          Elige uno y haz clic en el croquis para colocarlo.
        </p>
      </section>
    </div>
  `
})
export class CroquisInspectorComponent {
  plan = input.required<CroquisPlan>();
  area = input<CroquisArea | null>(null);
  element = input<CroquisElement | null>(null);
  tiers = input<TicketTier[]>([]);
  seatCount = input<number>(0);
  /** Desglose de las butacas seleccionadas; lo calcula el editor. */
  selection = input<SelectionInsight | null>(null);
  /** Cifras del área seleccionada. */
  areaEconomics = input<AreaInsight | null>(null);
  canViewFinances = input<boolean>(true);
  event = input<EventItem | null>(null);
  activeElementKind = input<string | null>(null);

  patchPlan = output<Partial<CroquisPlan>>();
  patchArea = output<Partial<CroquisArea>>();
  patchElement = output<Partial<CroquisElement>>();
  deleteArea = output<void>();
  duplicateArea = output<void>();
  deleteElement = output<void>();
  convertArea = output<'butacas' | 'general'>();
  setFan = output<void>();
  regenerate = output<SeatGridOptions>();

  assignSeatTier = output<string>();
  seatAction = output<SeatBatchAction>();
  clearSeats = output<void>();

  addTier = output<void>();
  editTier = output<string>();
  patchTier = output<{ id: string; changes: Partial<TicketTier> }>();
  removeTier = output<string>();
  pickElement = output<CroquisElement['kind']>();

  readonly elementCatalog = CROQUIS_ELEMENTS;

  readonly labelClass = 'block text-[9px] font-black uppercase tracking-wider text-outline mb-1';
  readonly inputClass =
    'w-full px-2 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/30 ' +
    'text-[11px] font-bold text-on-surface focus:outline-none focus:border-primary/60 transition-colors';

  /**
   * Parámetros del asistente. Viven aquí y no en el área porque describen cómo
   * se *va a* generar la butaquería, no cómo está hecha: una vez generada, las
   * filas son editables una por una y estos números dejan de describirla.
   */
  private gridDraft = signal<SeatGridOptions>(defaultGridOptions());
  grid = computed(() => this.gridDraft());

  capacity = computed(() => (this.area() ? areaCapacity(this.area()!) : 0));
  sold = computed(() => (this.area() ? areaSold(this.area()!) : 0));
  held = computed(() => (this.area() ? areaHeld(this.area()!) : 0));
  blocked = computed(() => (this.area() ? areaBlocked(this.area()!) : 0));

  lineupOptions = computed(() =>
    (this.event()?.lineup || []).map(s => ({ id: s.id, name: s.groupName }))
  );

  money = money;

  meta(el: CroquisElement) {
    return elementMeta(el.kind);
  }

  /**
   * Filas de la selección en corto: "A–F" en vez de listar catorce letras.
   * Solo se abrevia cuando son contiguas; si no, se enumeran para no mentir.
   */
  rowRange(labels: string[]): string {
    if (labels.length <= 3) return labels.join(', ');
    return `${labels[0]}–${labels[labels.length - 1]} (${labels.length})`;
  }

  value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  }

  num(event: Event): number {
    return Math.max(0, Math.round(Number(this.value(event)) || 0));
  }

  numFloat(event: Event): number {
    return Number(this.value(event)) || 0;
  }

  setGrid(changes: Partial<SeatGridOptions>): void {
    this.gridDraft.update(g => ({ ...g, ...changes }));
  }

  setNumbering(event: Event): void {
    this.setGrid({ numbering: this.value(event) as SeatNumbering });
  }

  setLabeling(event: Event): void {
    this.setGrid({ labeling: this.value(event) as RowLabeling });
  }

  setAisles(raw: string): void {
    const aisles = raw
      .split(',')
      .map(p => Math.round(Number(p.trim())))
      .filter(n => Number.isFinite(n) && n > 0);
    this.setGrid({ aisles });
  }

  /** Rellena filas y butacas con lo que cabe en el área tal como está dibujada. */
  autoFill(area: CroquisArea): void {
    const g = this.gridDraft();
    const fit = fitGrid(area.width, area.height, g.gap, g.rowGap);
    this.setGrid(fit);
  }

  chipClass(active: boolean): string {
    return active
      ? 'px-2 py-1.5 rounded-lg bg-primary/20 text-primary border border-primary/50 text-[10px] font-black transition-all'
      : 'px-2 py-1.5 rounded-lg bg-surface-container text-outline border border-outline-variant/30 hover:text-on-surface text-[10px] font-black transition-all';
  }

  actionClass(tone: 'emerald' | 'rose' | 'amber' | 'slate'): string {
    const map = {
      emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500 hover:text-black',
      rose: 'bg-rose-500/15 text-rose-300 border-rose-500/35 hover:bg-rose-500 hover:text-white',
      amber: 'bg-amber-500/15 text-amber-300 border-amber-500/35 hover:bg-amber-500 hover:text-black',
      slate: 'bg-surface-container text-outline border-outline-variant/35 hover:text-on-surface'
    };
    return `px-2 py-1.5 rounded-lg border text-[10px] font-black transition-all ${map[tone]}`;
  }
}
