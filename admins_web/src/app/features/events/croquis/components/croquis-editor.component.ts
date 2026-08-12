import {
  Component, ChangeDetectionStrategy, ViewChild,
  computed, effect, input, output, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CroquisArea, CroquisElement, CroquisElementKind, CroquisPlan,
  CroquisPoint, CroquisRow, CroquisSeat, CroquisTable, PLAN_HEIGHT, PLAN_WIDTH,
  SeatGridOptions, TableGridOptions
} from '../../../../core/models/croquis.models';
import { EventItem, TicketTier } from '../../../../core/models/event.models';
import {
  AreaDraft, BoxChange, CroquisCanvasComponent, CroquisColorBy, CroquisTool,
  SeatMove, SeatRef, seatKey
} from './croquis-canvas.component';
import { CroquisInspectorComponent, SeatBatchAction, SeatLayoutAction } from './croquis-inspector.component';
import { CroquisTierDialogComponent } from './croquis-tier-dialog.component';
import { CroquisSummaryComponent } from './croquis-summary.component';
import { CroquisClientPreviewComponent } from './croquis-client-preview.component';
import {
  CROQUIS_TEMPLATES, elementMeta, makeElement, makeGeneralArea,
  makeSeatedArea, makeTableArea, templateById
} from '../croquis-catalog';
import {
  boxPoints, buildRows, buildTables, croquisId, defaultTableOptions, fanPoints,
  fitGrid, fitTables, inferNumbering, makeTable, nearestRow, nearestTable,
  orderRowSeats, renumberArea, renumberSeatsInRows, renumberTables,
  renumberTableSeats, resizeTableSeats, rotatePoint, rowSlotFor, seatLocalPoint,
  tableRadius, tableSeatLocalPoint, tableSlotFor
} from '../croquis-geometry';
import {
  areaCapacity, croquisIssues, planCapacity, planSeatCount, planSold,
  planStages, planTableCount, syncTiersWithCroquis, tierCroquisSummary
} from '../croquis-metrics';
import {
  areaInsight, croquisOverview, PlanInsight, planInsights,
  selectionInsight, tierInsights
} from '../croquis-insights';
import { describeFixes, normalizeCroquis, totalFixes } from '../croquis-normalize';
import { money, serviceFee } from '../../event-metrics';

/** Capas opcionales de información sobre el croquis. */
export type CroquisLayer = 'cuadricula' | 'filas' | 'elementos' | 'numeros' | 'precios' | 'ocupacion';

/**
 * Editor de croquis.
 *
 * Ocupa la pantalla completa a propósito. Un croquis se arma mirando el conjunto
 * —dónde queda el escenario respecto a cada zona, si el VIP se ve apretado, si
 * las gradas alcanzan— y eso no cabe en el ancho de una pestaña dentro de un
 * modal. Aquí el plano es lo grande y todo lo demás son barras alrededor.
 *
 * La otra decisión de fondo: **el croquis manda**. No hay ningún campo donde se
 * capture "lugares a la venta"; el número sale de contar lo dibujado y las
 * categorías de boleto se sincronizan solas en cada cambio. Por eso el editor
 * emite el parche completo (planos + categorías) en cada movimiento en vez de
 * guardar al cerrar: lo que se ve dibujado es, en todo momento, lo que está
 * guardado.
 */
@Component({
  selector: 'app-croquis-editor',
  standalone: true,
  imports: [
    CommonModule,
    CroquisCanvasComponent,
    CroquisInspectorComponent,
    CroquisTierDialogComponent,
    CroquisSummaryComponent,
    CroquisClientPreviewComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'fixed inset-0 z-[999999999] flex flex-col bg-[#0d0d0d]/98 backdrop-blur-2xl animate-fade-in',
    '(keydown)': 'onKeydown($event)',
    tabindex: '-1'
  },
  template: `
    <!-- ─── CABECERA ─── -->
    <header class="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-outline-variant/25 bg-surface-container-high/70">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-xl font-bold">map</span>
        </div>
        <div class="min-w-0">
          <h3 class="text-sm sm:text-base font-black text-on-surface truncate tracking-tight">
            Editor de croquis · {{ event().title }}
          </h3>
          <p class="text-[11px] text-outline truncate font-semibold">
            {{ plans().length }} croquis · {{ totalCapacity().toLocaleString('es-MX') }} lugares a la venta
            @if (errorCount() > 0) {
              · <span class="text-rose-300 font-black">{{ errorCount() }} por resolver</span>
            } @else {
              · <span class="text-emerald-300 font-black">sin errores</span>
            }
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        @if (!preview()) {
          <button type="button" (click)="undo()" [disabled]="!canUndo()" [class]="iconBtn" title="Deshacer (Ctrl+Z)">
            <span class="material-symbols-outlined text-lg">undo</span>
          </button>
          <button type="button" (click)="redo()" [disabled]="!canRedo()" [class]="iconBtn" title="Rehacer (Ctrl+Shift+Z)">
            <span class="material-symbols-outlined text-lg">redo</span>
          </button>
        }

        <button
          type="button"
          (click)="preview.set(!preview())"
          class="px-3 py-2 rounded-xl text-[11px] font-black border transition-all flex items-center gap-1.5"
          [class]="preview()
            ? 'bg-primary text-black border-primary'
            : 'bg-surface-container-highest text-on-surface-variant border-outline-variant/35 hover:text-on-surface'"
        >
          <span class="material-symbols-outlined text-base">{{ preview() ? 'edit' : 'visibility' }}</span>
          <span class="hidden sm:inline">{{ preview() ? 'Volver a editar' : 'Vista del cliente' }}</span>
        </button>

        @if (!preview()) {
          <button
            type="button"
            (click)="reviewCroquis()"
            [class]="iconBtn"
            title="Revisar y corregir el croquis: nombres, numeración y lugares fuera de su área"
          >
            <span class="material-symbols-outlined text-lg">fact_check</span>
          </button>
        }

        <button type="button" (click)="closeEditor()"
          class="w-10 h-10 rounded-2xl bg-surface-container-highest hover:bg-surface-bright text-outline hover:text-on-surface border border-outline-variant/35 flex items-center justify-center transition-all"
          title="Cerrar editor">
          <span class="material-symbols-outlined text-xl font-bold">close</span>
        </button>
      </div>
    </header>

    <div class="flex-1 min-h-0 flex relative">

      <!-- ─── RIEL IZQUIERDO: CROQUIS DEL EVENTO ─── -->
      @if (!preview()) {
        <aside
          class="shrink-0 w-[252px] border-r border-outline-variant/25 bg-surface-container/60 overflow-y-auto custom-scrollbar p-3 space-y-3"
          [class]="leftOpen() ? 'absolute inset-y-0 left-0 z-30 shadow-2xl lg:static lg:shadow-none' : 'hidden lg:block'"
        >
          <div class="flex items-center justify-between gap-2">
            <h6 class="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[14px]">layers</span>
              Croquis ({{ plans().length }})
            </h6>
            <button type="button" (click)="leftOpen.set(false)" class="lg:hidden text-outline hover:text-on-surface">
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <p class="text-[9px] text-outline leading-snug">
            Un croquis por zona física del evento. Con varios escenarios al mismo tiempo, cada zona lleva el suyo.
          </p>

          @for (p of plans(); track p.id) {
            <button
              type="button"
              (click)="selectPlan(p.id)"
              class="w-full text-left p-2.5 rounded-2xl border transition-all group"
              [class]="p.id === activePlanId()
                ? 'bg-primary/15 border-primary/50 shadow-lg'
                : 'bg-surface-container-high/70 border-outline-variant/25 hover:border-primary/30'"
            >
              <div class="h-20 rounded-xl overflow-hidden bg-[#161616] border border-outline-variant/20 mb-2">
                <app-croquis-canvas [plan]="p" [tiers]="tiers()" [lineup]="lineupOptions()" mode="miniatura" />
              </div>
              <p class="text-[11px] font-black truncate"
                [class]="p.id === activePlanId() ? 'text-primary' : 'text-on-surface'">
                {{ p.name }}
              </p>
              <p class="text-[9px] text-outline font-mono">
                {{ capacityOf(p).toLocaleString('es-MX') }} lugares · {{ p.areas.length }} área(s)
              </p>
              @if (stagesOf(p); as st) {
                @if (st.length > 1) {
                  <p class="text-[9px] text-amber-300 font-bold">{{ st.length }} escenarios</p>
                } @else if (!st.length) {
                  <p class="text-[9px] text-rose-300 font-bold">Sin escenario</p>
                }
              }
            </button>
          }

          <div class="pt-2 border-t border-outline-variant/20 space-y-1.5">
            <span class="block text-[9px] font-black uppercase tracking-wider text-outline">Agregar croquis</span>
            @for (t of templates; track t.id) {
              <button
                type="button"
                (click)="addPlan(t.id)"
                [title]="t.description"
                class="w-full px-2.5 py-2 rounded-xl bg-surface-container-high/60 border border-outline-variant/25 hover:border-primary/40 text-left transition-all flex items-center gap-2 group"
              >
                <span class="material-symbols-outlined text-[15px] text-primary shrink-0">{{ t.icon }}</span>
                <span class="min-w-0">
                  <span class="block text-[10px] font-black text-on-surface truncate">{{ t.name }}</span>
                  <span class="block text-[9px] text-outline truncate">{{ t.hint }}</span>
                </span>
              </button>
            }
          </div>

          @if (plans().length > 1) {
            <div class="pt-2 border-t border-outline-variant/20 flex gap-1.5">
              <button type="button" (click)="duplicatePlan()"
                class="flex-1 px-2 py-1.5 rounded-lg bg-surface-container text-on-surface-variant border border-outline-variant/30 hover:text-on-surface text-[10px] font-black transition-all">
                Duplicar
              </button>
              <button type="button" (click)="removePlan()"
                class="flex-1 px-2 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-[10px] font-black transition-all">
                Eliminar
              </button>
            </div>
          } @else if (plans().length === 1) {
            <button type="button" (click)="duplicatePlan()"
              class="w-full px-2 py-1.5 rounded-lg bg-surface-container text-on-surface-variant border border-outline-variant/30 hover:text-on-surface text-[10px] font-black transition-all">
              Duplicar este croquis
            </button>
          }
        </aside>
      }

      <!-- ─── CENTRO ─── -->
      <div class="flex-1 min-w-0 flex flex-col">

        <!-- Barra de herramientas -->
        @if (!preview()) {
          <!-- Envuelve en vez de recortar: con scroll horizontal, en una pantalla
               de 1280 los controles de zoom quedaban fuera de vista y parecía que
               el editor no los tenía. -->
          <div class="shrink-0 flex items-center gap-2 gap-y-1.5 px-3 py-2 border-b border-outline-variant/20 bg-surface-container/40 flex-wrap">
            <button type="button" (click)="leftOpen.set(true)" class="lg:hidden shrink-0" [class]="iconBtn" title="Croquis">
              <span class="material-symbols-outlined text-lg">layers</span>
            </button>

            <div class="flex items-center gap-1 p-1 rounded-xl bg-surface-container-highest/60 border border-outline-variant/25 shrink-0">
              @for (t of toolbarTools; track t.tool) {
                <button
                  type="button"
                  (click)="setTool(t.tool)"
                  [title]="t.hint + ' (' + t.key.toUpperCase() + ')'"
                  class="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  [class]="tool() === t.tool
                    ? 'bg-primary text-black shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'"
                >
                  <span class="material-symbols-outlined text-[18px]">{{ t.icon }}</span>
                </button>
              }
            </div>

            <!-- Categoría con la que se pinta -->
            @if (tool() === 'pintar') {
              <div class="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-surface-container-highest/60 border border-primary/30 flex-wrap max-w-full">
                <span class="text-[9px] font-black uppercase tracking-wider text-outline shrink-0">Pintar con</span>
                @for (tier of tiers(); track tier.id) {
                  <button
                    type="button"
                    (click)="activeTierId.set(tier.id || '')"
                    [title]="tier.name + ' · $' + (tier.price || 0).toLocaleString('es-MX')"
                    class="w-7 h-7 shrink-0 rounded-lg border-2 transition-all hover:scale-110"
                    [style.background-color]="tier.color"
                    [style.border-color]="activeTierId() === tier.id ? '#ffffff' : 'transparent'"
                  ></button>
                }
              </div>
            }

            @if (activeTool() === 'elemento') {
              <div class="flex items-center gap-1.5 min-w-0 px-2.5 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/30">
                <span class="material-symbols-outlined text-[15px] text-violet-300 shrink-0">{{ elementIcon() }}</span>
                <span class="text-[10px] font-black text-violet-200 truncate">{{ elementLabel() }}</span>
                <span class="text-[9px] text-outline shrink-0 hidden sm:inline">— haz clic en el plano</span>
              </div>
            }

            <div class="flex-1"></div>

            <!-- Modo de color -->
            <div class="flex items-center gap-1 p-1 rounded-xl bg-surface-container-highest/60 border border-outline-variant/25 shrink-0">
              @for (m of colorModes; track m.value) {
                <button
                  type="button"
                  (click)="colorBy.set(m.value)"
                  class="px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all"
                  [class]="colorBy() === m.value ? 'bg-primary text-black' : 'text-on-surface-variant hover:text-on-surface'"
                >{{ m.label }}</button>
              }
            </div>

            <!-- ─── CAPAS DE INFORMACIÓN ─── -->
            <div class="relative shrink-0">
              <button
                type="button"
                (click)="layersOpen.set(!layersOpen())"
                [class]="iconBtn"
                [class.!border-primary]="activeLayerCount() > 0"
                title="Capas de información"
              >
                <span class="material-symbols-outlined text-lg" [class.text-primary]="activeLayerCount() > 0">layers</span>
                @if (activeLayerCount() > 0) {
                  <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-black text-[9px] font-black flex items-center justify-center">
                    {{ activeLayerCount() }}
                  </span>
                }
              </button>

              @if (layersOpen()) {
                <div class="absolute top-full mt-2 right-0 z-50 w-72 p-3 rounded-2xl bg-surface-container-high border border-outline-variant/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-1.5 animate-scale-up">
                  <div class="flex items-center justify-between gap-2 pb-2 border-b border-outline-variant/20">
                    <span class="text-[10px] font-black uppercase tracking-widest text-primary">Qué mostrar en el croquis</span>
                    <button type="button" (click)="layersOpen.set(false)" class="text-outline hover:text-on-surface shrink-0">
                      <span class="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>

                  @for (layer of layerOptions(); track layer.key) {
                    <button
                      type="button"
                      (click)="toggleLayer(layer.key)"
                      class="w-full px-2.5 py-2 rounded-xl flex items-start gap-2.5 text-left transition-all min-w-0"
                      [class]="layers()[layer.key]
                        ? 'bg-primary/12 border border-primary/35'
                        : 'bg-surface-container/50 border border-transparent hover:border-outline-variant/30'"
                    >
                      <span
                        class="w-8 h-4 rounded-full shrink-0 mt-0.5 relative transition-colors"
                        [class]="layers()[layer.key] ? 'bg-primary' : 'bg-surface-container-highest'"
                      >
                        <span
                          class="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                          [class]="layers()[layer.key] ? 'left-[18px]' : 'left-0.5'"
                        ></span>
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block text-[11px] font-black leading-tight"
                          [class]="layers()[layer.key] ? 'text-primary' : 'text-on-surface'">
                          {{ layer.label }}
                        </span>
                        <span class="block text-[9px] text-outline leading-snug mt-0.5">{{ layer.hint }}</span>
                      </span>
                    </button>
                  }

                  @if (layers().numeros && seatsOf(activePlan()!) > 1200) {
                    <p class="text-[9px] text-amber-300 leading-snug flex items-start gap-1 pt-1">
                      <span class="material-symbols-outlined text-[11px] shrink-0">warning</span>
                      Con {{ seatsOf(activePlan()!).toLocaleString('es-MX') }} butacas los números solo se leen con zoom.
                    </p>
                  }
                </div>
              }
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button type="button" (click)="canvas?.zoomBy(1 / 1.25)" [class]="iconBtn" title="Alejar">
                <span class="material-symbols-outlined text-lg">zoom_out</span>
              </button>
              <button type="button" (click)="canvas?.fit()" [class]="iconBtn" title="Ajustar a la vista">
                <span class="material-symbols-outlined text-lg">fit_screen</span>
              </button>
              <button type="button" (click)="canvas?.zoomBy(1.25)" [class]="iconBtn" title="Acercar">
                <span class="material-symbols-outlined text-lg">zoom_in</span>
              </button>
            </div>

            <button type="button" (click)="rightOpen.set(true)" class="lg:hidden shrink-0" [class]="iconBtn" title="Propiedades">
              <span class="material-symbols-outlined text-lg">tune</span>
            </button>
          </div>
        }

        <!-- ─── VISTA DEL CLIENTE ─── -->
        <!-- No es el lienzo del editor con otros colores: es la pantalla del
             portal, con su marcado y sus clases, alimentada por este croquis.
             Reaprovechar el lienzo habría sido más barato y habría enseñado al
             organizador algo que el comprador nunca va a ver. -->
        @if (preview()) {
          <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#121212]">
            <app-croquis-client-preview
              [plans]="plans()"
              [tiers]="tiers()"
              [eventTitle]="event().title"
              [venue]="event().venue + ', ' + event().location"
              [serviceFee]="fee()"
              [activePlanId]="activePlanId()"
            />
          </div>
        }

        <!-- Lienzo del editor -->
        <div class="flex-1 min-h-0 relative bg-[#0f0f0f]" [class.hidden]="preview()">
          @if (activePlan(); as p) {
            <app-croquis-canvas
              [plan]="p"
              [tiers]="tiers()"
              [lineup]="lineupOptions()"
              mode="editor"
              [colorBy]="colorBy()"
              [tool]="activeTool()"
              [showGrid]="layers().cuadricula"
              [showRowLabels]="layers().filas"
              [showSeatNumbers]="layers().numeros"
              [showElements]="layers().elementos"
              [showPrices]="layers().precios"
              [showOccupancy]="layers().ocupacion"
              [canViewFinances]="canViewFinances()"
              [selectedAreaId]="selectedAreaId()"
              [selectedElementId]="selectedElementId()"
              [selectedTableId]="selectedTableId()"
              [selectedSeats]="selectedSeats()"
              (selectArea)="onSelectArea($event)"
              (selectElement)="onSelectElement($event)"
              (selectTable)="onSelectTable($event)"
              (seatsPicked)="onSeatsPicked($event)"
              (seatsMoved)="onSeatsMoved($event)"
              (areaDrawn)="onAreaDrawn($event)"
              (elementDropped)="onElementDropped($event)"
              (areaMoved)="onAreaMoved($event)"
              (elementMoved)="onElementMoved($event)"
              (tableMoved)="onTableMoved($event)"
            />

            @if (!p.areas.length && !preview()) {
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="text-center max-w-sm p-6 rounded-3xl bg-surface-container/85 border border-dashed border-outline-variant/40">
                  <span class="material-symbols-outlined text-4xl text-outline mb-2 block">draw</span>
                  <p class="text-xs font-black text-on-surface mb-1">Este croquis está vacío</p>
                  <p class="text-[11px] text-outline leading-relaxed">
                    Elige la herramienta de butacas, de mesas o de aforo libre y arrastra sobre el plano para
                    dibujar la primera área. El escenario se pone desde el catálogo de elementos.
                  </p>
                </div>
              </div>
            }
          } @else {
            <div class="absolute inset-0 flex items-center justify-center">
              <p class="text-xs text-outline italic">Este evento todavía no tiene ningún croquis.</p>
            </div>
          }

          <!-- ─── TODOS LOS NÚMEROS ─── -->
          <!-- Cajón, no riel fijo: estos datos se consultan a ratos, y tenerlos
               siempre en pantalla le quitaría al plano el espacio que necesita. -->
          @if (summaryOpen() && !preview()) {
            <div class="absolute inset-x-0 bottom-0 z-30 max-h-[64%] flex flex-col bg-surface-container/97 backdrop-blur-2xl border-t border-primary/30 shadow-[0_-20px_60px_rgba(0,0,0,0.7)] animate-slide-up">
              <div class="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-outline-variant/25">
                <h6 class="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2 min-w-0">
                  <span class="material-symbols-outlined text-base shrink-0">query_stats</span>
                  <span class="truncate">Todos los números del evento</span>
                </h6>
                <button type="button" (click)="summaryOpen.set(false)"
                  class="w-8 h-8 shrink-0 rounded-xl bg-surface-container-highest text-outline hover:text-on-surface border border-outline-variant/30 flex items-center justify-center transition-all">
                  <span class="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
                <app-croquis-summary
                  [plans]="plans()"
                  [tiers]="tiers()"
                  [serviceFee]="fee()"
                  [canViewFinances]="canViewFinances()"
                  [clickablePlans]="true"
                  (planPicked)="selectPlan($event); summaryOpen.set(false)"
                />
              </div>
            </div>
          }
        </div>

        <!-- Pie: cifras del croquis activo -->
        @if (!preview() && activePlan(); as p) {
          <div class="shrink-0 flex items-center gap-x-3 gap-y-1 px-3.5 py-2 border-t border-outline-variant/20 bg-surface-container/50 flex-wrap">
            <span class="text-[10px] font-black uppercase tracking-wider text-outline shrink-0">{{ p.name }}</span>
            <span class="shrink-0 text-[11px] font-mono font-black text-on-surface">
              {{ capacityOf(p).toLocaleString('es-MX') }} <span class="text-outline font-sans font-bold text-[10px]">a la venta</span>
            </span>
            <span class="shrink-0 text-[11px] font-mono font-black text-emerald-400">
              {{ soldOf(p).toLocaleString('es-MX') }} <span class="text-outline font-sans font-bold text-[10px]">vendidos</span>
            </span>
            <span class="shrink-0 text-[11px] font-mono font-black text-cyan-300">
              {{ seatsOf(p).toLocaleString('es-MX') }} <span class="text-outline font-sans font-bold text-[10px]">butacas dibujadas</span>
            </span>
            @if (tablesOf(p); as mesas) {
              @if (mesas > 0) {
                <span class="shrink-0 text-[11px] font-mono font-black text-fuchsia-300">
                  {{ mesas.toLocaleString('es-MX') }} <span class="text-outline font-sans font-bold text-[10px]">mesas</span>
                </span>
              }
            }
            @if (canViewFinances()) {
              <span class="shrink-0 text-[11px] font-mono font-black text-primary">
                {{ money(activePlanInsight().potential) }} <span class="text-outline font-sans font-bold text-[10px]">de taquilla</span>
              </span>
            }

            <button
              type="button"
              (click)="summaryOpen.set(!summaryOpen())"
              class="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all flex items-center gap-1.5"
              [class]="summaryOpen()
                ? 'bg-primary text-black border-primary'
                : 'bg-surface-container-highest/60 text-on-surface-variant border-outline-variant/30 hover:text-on-surface hover:border-primary/40'"
            >
              <span class="material-symbols-outlined text-[13px]">query_stats</span>
              Todos los números
            </button>

            <div class="flex-1"></div>

            @if (issues().length) {
              <span class="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black border"
                [class]="errorCount() > 0
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/35'">
                {{ errorCount() > 0 ? errorCount() + ' error(es)' : issues().length + ' aviso(s)' }}
              </span>
            } @else {
              <span class="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 text-[10px] font-black">
                Croquis listo para publicar
              </span>
            }
            @if (reviewNote(); as nota) {
              <span class="shrink-0 px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-200 border border-cyan-500/35 text-[10px] font-black flex items-center gap-1.5 animate-fade-in">
                <span class="material-symbols-outlined text-[13px]">fact_check</span>
                {{ nota }}
              </span>
            } @else {
              <span class="shrink-0 text-[10px] text-outline hidden 2xl:inline">
                Arrastra para seleccionar · <strong class="text-on-surface-variant">Shift + arrastrar una butaca</strong> la mueve
                · la etiqueta mueve el área · rueda hace zoom
              </span>
            }
          </div>
        }
      </div>

      <!-- ─── RIEL DERECHO: INSPECTOR ─── -->
      @if (!preview() && activePlan(); as p) {
        <aside
          class="shrink-0 w-[326px] border-l border-outline-variant/25 bg-surface-container/60 overflow-y-auto custom-scrollbar p-3"
          [class]="rightOpen() ? 'absolute inset-y-0 right-0 z-30 shadow-2xl lg:static lg:shadow-none' : 'hidden lg:block'"
        >
          <div class="flex justify-end lg:hidden mb-2">
            <button type="button" (click)="rightOpen.set(false)" class="text-outline hover:text-on-surface">
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <app-croquis-inspector
            [plan]="p"
            [area]="selectedArea()"
            [element]="selectedElement()"
            [table]="selectedTable()"
            [tiers]="tiers()"
            [seatCount]="selectedSeats().size"
            [selection]="selection()"
            [areaEconomics]="areaEconomics()"
            [canViewFinances]="canViewFinances()"
            [event]="event()"
            [activeElementKind]="activeTool() === 'elemento' ? elementKind() : null"
            (patchPlan)="patchPlan($event)"
            (patchArea)="patchArea($event)"
            (patchElement)="patchElement($event)"
            (patchTable)="patchTable($event)"
            (deleteArea)="deleteArea()"
            (duplicateArea)="duplicateArea()"
            (deleteElement)="deleteElement()"
            (convertArea)="convertArea($event)"
            (setFan)="setFan()"
            (regenerate)="regenerateSeats($event)"
            (regenerateTables)="regenerateTables($event)"
            (addTable)="addTable()"
            (duplicateTable)="duplicateTable()"
            (deleteTable)="deleteTable()"
            (tableStatus)="setTableStatus($event)"
            (assignSeatTier)="assignSeatTier($event)"
            (seatAction)="applySeatAction($event)"
            (seatLayout)="applySeatLayout($event)"
            (renumberArea)="renumberSelectedArea()"
            (clearSeats)="clearSelection()"
            (addTier)="addTier()"
            (editTier)="editTier($event)"
            (patchTier)="patchTier($event.id, $event.changes)"
            (removeTier)="removeTier($event)"
            (pickElement)="pickElement($event)"
          />
        </aside>
      }
    </div>

    @if (tierDialogOpen()) {
      <app-croquis-tier-dialog
        [tier]="tierUnderEdit()"
        [siblings]="tiers()"
        (saved)="onTierSaved($event)"
        (cancelled)="tierDialogOpen.set(false); tierUnderEdit.set(null)"
      />
    }
  `
})
export class CroquisEditorComponent {
  event = input.required<EventItem>();
  canEdit = input<boolean>(true);
  /** Sin esto no se dibuja ni se lista ninguna cifra de dinero. */
  canViewFinances = input<boolean>(true);
  /** Croquis que se abre primero; si no llega, se abre el primero de la lista. */
  initialPlanId = input<string | null>(null);

  patch = output<Partial<EventItem>>();
  closed = output<void>();

  @ViewChild(CroquisCanvasComponent) canvas?: CroquisCanvasComponent;

  readonly templates = CROQUIS_TEMPLATES;

  readonly toolbarTools: { tool: CroquisTool; icon: string; key: string; hint: string }[] = [
    { tool: 'seleccionar', icon: 'arrow_selector_tool', key: 'v', hint: 'Seleccionar y mover' },
    { tool: 'area-butacas', icon: 'grid_on', key: 'b', hint: 'Dibujar área con butacas' },
    { tool: 'area-mesas', icon: 'table_restaurant', key: 'm', hint: 'Dibujar área con mesas' },
    { tool: 'area-general', icon: 'groups', key: 'g', hint: 'Dibujar área de aforo libre' },
    { tool: 'elemento', icon: 'add_box', key: 'e', hint: 'Colocar elemento del recinto' },
    { tool: 'pintar', icon: 'format_paint', key: 'p', hint: 'Pintar butacas con una categoría' },
    { tool: 'quitar-butacas', icon: 'backspace', key: 'x', hint: 'Quitar butacas del croquis' }
  ];

  readonly colorModes: { value: CroquisColorBy; label: string }[] = [
    { value: 'categoria', label: 'Por boleto' },
    { value: 'venta', label: 'Por venta' }
  ];

  readonly iconBtn =
    'w-9 h-9 shrink-0 rounded-xl bg-surface-container-highest/60 border border-outline-variant/25 ' +
    'text-on-surface-variant hover:text-on-surface hover:border-primary/40 flex items-center justify-center ' +
    'transition-all disabled:opacity-35 disabled:cursor-not-allowed';

  // ─── Estado ────────────────────────────────────────────────────────────────

  /**
   * Copia de trabajo de los croquis.
   *
   * Se mantiene local para poder deshacer sin pelearse con el expediente, pero
   * cada mutación emite el parche: nunca hay un estado "sin guardar" que se
   * pueda perder al cerrar.
   */
  plans = signal<CroquisPlan[]>([]);
  tiers = signal<TicketTier[]>([]);

  activePlanId = signal<string | null>(null);
  tool = signal<CroquisTool>('seleccionar');
  elementKind = signal<CroquisElementKind>('escenario');
  colorBy = signal<CroquisColorBy>('categoria');
  preview = signal(false);
  leftOpen = signal(false);
  rightOpen = signal(false);
  layersOpen = signal(false);
  summaryOpen = signal(false);

  /**
   * Qué se dibuja encima del croquis.
   *
   * Las que vienen encendidas son las que siempre hicieron falta para dibujar;
   * las apagadas son datos que estorbarían de fijo. Nada de esto cambia el
   * croquis: solo cambia cuánto cuenta de sí mismo, y por eso puede apagarse
   * entero cuando el que dibuja quiere el plano limpio.
   */
  layers = signal<Record<CroquisLayer, boolean>>({
    cuadricula: true,
    filas: true,
    elementos: true,
    numeros: false,
    precios: false,
    ocupacion: false
  });

  selectedAreaId = signal<string | null>(null);
  selectedElementId = signal<string | null>(null);
  selectedTableId = signal<string | null>(null);
  selectedSeats = signal<Set<string>>(new Set());
  activeTierId = signal<string>('');

  tierDialogOpen = signal(false);
  tierUnderEdit = signal<TicketTier | null>(null);

  private history = signal<CroquisPlan[][]>([]);
  private future = signal<CroquisPlan[][]>([]);

  canUndo = computed(() => this.history().length > 0);
  canRedo = computed(() => this.future().length > 0);

  constructor() {
    // El expediente es la fuente: al abrir el editor (o si el evento cambia por
    // fuera) se toma una copia propia sobre la que trabajar.
    effect(() => {
      const e = this.event();
      this.plans.set(structuredClone(e.croquisPlans || []));
      this.tiers.set(structuredClone(e.ticketTiers || []));

      const wanted = this.initialPlanId();
      const current = this.activePlanId();
      const exists = (id: string | null) => !!id && (e.croquisPlans || []).some(p => p.id === id);
      if (!exists(current)) {
        this.activePlanId.set(exists(wanted) ? wanted : (e.croquisPlans?.[0]?.id ?? null));
      }
      if (!this.activeTierId()) this.activeTierId.set(e.ticketTiers?.[0]?.id || '');
    });
  }

  // ─── Derivados ─────────────────────────────────────────────────────────────

  activePlan = computed(() => this.plans().find(p => p.id === this.activePlanId()) || this.plans()[0] || null);

  selectedArea = computed(() => this.activePlan()?.areas.find(a => a.id === this.selectedAreaId()) || null);
  selectedElement = computed(() => this.activePlan()?.elements.find(e => e.id === this.selectedElementId()) || null);
  selectedTable = computed(() =>
    this.selectedArea()?.tables?.find(t => t.id === this.selectedTableId()) || null);

  /** En vista de cliente ninguna herramienta debe estar activa. */
  activeTool = computed<CroquisTool>(() => (this.preview() ? 'seleccionar' : this.tool()));

  totalCapacity = computed(() => this.plans().reduce((sum, p) => sum + planCapacity(p), 0));

  issues = computed(() => croquisIssues({ ...this.event(), croquisPlans: this.plans(), ticketTiers: this.tiers() }));
  errorCount = computed(() => this.issues().filter(i => i.level === 'error').length);

  legend = computed(() => {
    const summary = tierCroquisSummary(this.plans());
    return this.tiers()
      .map(tier => {
        const entry = summary.get(tier.id || '');
        return {
          tier,
          available: Math.max(0, (entry?.capacity || 0) - (entry?.sold || 0) - (entry?.held || 0))
        };
      })
      .filter(row => row.available > 0 || (row.tier.totalSeats || 0) > 0);
  });

  planDescription = computed(() => this.activePlan()?.description || '');

  // ─── Capas ─────────────────────────────────────────────────────────────────

  /** Solo se cuentan las que el que dibuja encendió: las de base no son "extras". */
  activeLayerCount = computed(() => {
    const l = this.layers();
    return [l.numeros, l.precios, l.ocupacion].filter(Boolean).length;
  });

  layerOptions = computed<{ key: CroquisLayer; label: string; hint: string }[]>(() => {
    const options: { key: CroquisLayer; label: string; hint: string }[] = [];

    if (this.canViewFinances()) {
      options.push({
        key: 'precios',
        label: 'Taquilla por área',
        hint: 'Cuánto vale cada zona si se vende completa, y cuánto lleva cobrado.'
      });
    }

    options.push(
      { key: 'ocupacion', label: 'Avance de venta por área', hint: 'Barra de vendidos y lugares libres sobre cada zona.' },
      { key: 'numeros', label: 'Número de butaca', hint: 'Dibuja el número dentro de cada butaca. Pide zoom en zonas grandes.' },
      { key: 'filas', label: 'Letras de fila', hint: 'La letra a la izquierda de cada fila.' },
      { key: 'elementos', label: 'Elementos del recinto', hint: 'Escenario, pantallas, bocinas, barras y accesos.' },
      { key: 'cuadricula', label: 'Cuadrícula', hint: 'La rejilla de fondo a la que se imanta todo.' }
    );

    return options;
  });

  toggleLayer(key: CroquisLayer): void {
    this.layers.update(l => ({ ...l, [key]: !l[key] }));
  }

  // ─── Cifras ────────────────────────────────────────────────────────────────

  money = money;

  fee = computed(() => serviceFee(this.event()));
  planRows = computed(() => planInsights(this.plans(), this.tiers()));

  /** Qué se seleccionó y cuánto vale; el inspector lo desglosa. */
  selection = computed(() =>
    this.selectedSeats().size
      ? selectionInsight(this.plans(), this.selectedSeats(), this.tiers())
      : null
  );

  /** Cifras del área seleccionada, para el bloque de números del inspector. */
  areaEconomics = computed(() => {
    const area = this.selectedArea();
    if (!area) return null;
    return areaInsight(area, new Map(this.tiers().map(t => [t.id || '', t])));
  });

  activePlanInsight = computed(() => {
    const id = this.activePlanId();
    return this.planRows().find(r => r.plan.id === id) || this.planRows()[0]
      || { potential: 0, collected: 0, capacity: 0, sold: 0 } as PlanInsight;
  });

  lineupOptions = computed(() =>
    (this.event().lineup || []).map(s => ({ id: s.id, name: s.groupName }))
  );

  elementIcon = computed(() => elementMeta(this.elementKind()).icon);
  elementLabel = computed(() => elementMeta(this.elementKind()).label);

  capacityOf = (p: CroquisPlan) => planCapacity(p);
  soldOf = (p: CroquisPlan) => planSold(p);
  seatsOf = (p: CroquisPlan) => planSeatCount(p);
  tablesOf = (p: CroquisPlan) => planTableCount(p);
  stagesOf = (p: CroquisPlan) => planStages(p);

  // ─── Guardado, historial ───────────────────────────────────────────────────

  /**
   * Aplica un cambio a los croquis y lo propaga.
   *
   * Todas las mutaciones pasan por aquí: es el único lugar donde se apila el
   * historial, se sincronizan las categorías con lo dibujado y se emite el
   * parche. Si cada mutación lo hiciera por su cuenta, deshacer terminaría con
   * huecos y las categorías se desfasarían del plano en cuanto alguien olvidara
   * un paso.
   */
  private commit(mutate: (plans: CroquisPlan[]) => CroquisPlan[]): void {
    if (!this.canEdit()) return;

    const before = this.plans();
    const next = mutate(structuredClone(before));

    this.history.update(h => [...h.slice(-39), before]);
    this.future.set([]);
    this.plans.set(next);

    const syncedTiers = syncTiersWithCroquis(this.tiers(), next);
    if (syncedTiers) this.tiers.set(syncedTiers);

    this.patch.emit(syncedTiers ? { croquisPlans: next, ticketTiers: syncedTiers } : { croquisPlans: next });
  }

  /** Cambios que solo tocan las categorías (precio, nombre, color). */
  private commitTiers(next: TicketTier[]): void {
    if (!this.canEdit()) return;
    this.tiers.set(next);
    this.patch.emit({ ticketTiers: next });
  }

  private mutatePlan(mutate: (plan: CroquisPlan) => CroquisPlan): void {
    const id = this.activePlanId();
    this.commit(plans => plans.map(p => (p.id === id ? mutate(p) : p)));
  }

  private mutateArea(areaId: string, mutate: (area: CroquisArea) => CroquisArea): void {
    this.mutatePlan(plan => ({
      ...plan,
      areas: plan.areas.map(a => (a.id === areaId ? mutate(a) : a))
    }));
  }

  undo(): void {
    const h = this.history();
    if (!h.length) return;
    const previous = h[h.length - 1];
    this.history.set(h.slice(0, -1));
    this.future.update(f => [this.plans(), ...f]);
    this.plans.set(previous);
    this.clearSelection();

    const synced = syncTiersWithCroquis(this.tiers(), previous);
    if (synced) this.tiers.set(synced);
    this.patch.emit(synced ? { croquisPlans: previous, ticketTiers: synced } : { croquisPlans: previous });
  }

  redo(): void {
    const f = this.future();
    if (!f.length) return;
    const next = f[0];
    this.future.set(f.slice(1));
    this.history.update(h => [...h, this.plans()]);
    this.plans.set(next);
    this.clearSelection();

    const synced = syncTiersWithCroquis(this.tiers(), next);
    if (synced) this.tiers.set(synced);
    this.patch.emit(synced ? { croquisPlans: next, ticketTiers: synced } : { croquisPlans: next });
  }

  // ─── Planos ────────────────────────────────────────────────────────────────

  selectPlan(id: string): void {
    this.activePlanId.set(id);
    this.clearSelection();
    this.leftOpen.set(false);
  }

  addPlan(templateId: string): void {
    const template = templateById(templateId);
    const name = `Zona ${this.plans().length + 1}`;
    const plan = template.build(name);
    this.commit(plans => [...plans, plan]);
    this.activePlanId.set(plan.id);
    this.clearSelection();
  }

  duplicatePlan(): void {
    const current = this.activePlan();
    if (!current) return;

    // Ids nuevos en todo el árbol: sin esto, mover un área del duplicado movería
    // también la del original y las butacas se seleccionarían de dos en dos.
    const copy: CroquisPlan = {
      ...structuredClone(current),
      id: croquisId('plan'),
      name: `${current.name} (copia)`,
      areas: current.areas.map(a => ({
        ...structuredClone(a),
        id: croquisId('ar'),
        rows: a.rows.map(r => ({ ...structuredClone(r), id: croquisId('row') })),
        tables: (a.tables || []).map(t => ({ ...structuredClone(t), id: croquisId('tb') }))
      })),
      elements: current.elements.map(el => ({ ...structuredClone(el), id: croquisId('el') }))
    };

    this.commit(plans => [...plans, copy]);
    this.activePlanId.set(copy.id);
    this.clearSelection();
  }

  removePlan(): void {
    const id = this.activePlanId();
    if (!id || this.plans().length <= 1) return;
    this.commit(plans => plans.filter(p => p.id !== id));
    this.activePlanId.set(this.plans()[0]?.id ?? null);
    this.clearSelection();
  }

  patchPlan(changes: Partial<CroquisPlan>): void {
    this.mutatePlan(plan => ({ ...plan, ...changes }));
  }

  // ─── Áreas ─────────────────────────────────────────────────────────────────

  onAreaDrawn(draft: AreaDraft): void {
    const n = (this.activePlan()?.areas.length || 0) + 1;
    const nombre = draft.kind === 'butacas' ? `Zona ${n}`
      : draft.kind === 'mesas' ? `Mesas ${n}`
      : `General ${n}`;

    // El área nace llena: dibujar un rectángulo y que aparezcan butacas —o
    // mesas— es lo que la gente espera. Ajustar filas o numeración viene
    // después, sobre algo que ya se ve, no sobre un formulario en blanco.
    const area = draft.kind === 'butacas'
      ? (() => {
          const fit = fitGrid(draft.width, draft.height);
          return makeSeatedArea(nombre, draft.x, draft.y, draft.width, draft.height, fit.rows, fit.seatsPerRow);
        })()
      : draft.kind === 'mesas'
        ? makeTableArea(nombre, draft.x, draft.y, draft.width, draft.height, fitTables(draft.width, draft.height))
        : makeGeneralArea(nombre, draft.x, draft.y, draft.width, draft.height, 100);

    area.tierId = this.activeTierId() || this.tiers()[0]?.id;

    this.mutatePlan(plan => ({ ...plan, areas: [...plan.areas, area] }));
    this.selectedAreaId.set(area.id);
    this.selectedElementId.set(null);
    this.selectedTableId.set(null);
    this.tool.set('seleccionar');
  }

  patchArea(changes: Partial<CroquisArea>): void {
    const id = this.selectedAreaId();
    if (!id) return;
    this.mutateArea(id, a => ({ ...a, ...changes }));
  }

  onAreaMoved(box: BoxChange): void {
    this.mutateArea(box.id, a => ({ ...a, x: box.x, y: box.y, width: box.width, height: box.height }));
  }

  deleteArea(): void {
    const id = this.selectedAreaId();
    if (!id) return;
    this.mutatePlan(plan => ({ ...plan, areas: plan.areas.filter(a => a.id !== id) }));
    this.clearSelection();
  }

  duplicateArea(): void {
    const area = this.selectedArea();
    if (!area) return;
    const copy: CroquisArea = {
      ...structuredClone(area),
      id: croquisId('ar'),
      name: `${area.name} (copia)`,
      x: area.x + 30,
      y: area.y + 30,
      rows: area.rows.map(r => ({ ...structuredClone(r), id: croquisId('row') })),
      tables: (area.tables || []).map(t => ({ ...structuredClone(t), id: croquisId('tb') }))
    };
    this.mutatePlan(plan => ({ ...plan, areas: [...plan.areas, copy] }));
    this.selectedAreaId.set(copy.id);
    this.selectedTableId.set(null);
  }

  convertArea(kind: CroquisArea['kind']): void {
    const area = this.selectedArea();
    if (!area) return;
    this.selectedTableId.set(null);

    if (kind === 'general') {
      // El aforo hereda lo que había dibujado: convertir no debe cambiar cuántos
      // lugares se venden, solo cómo se venden.
      const capacity = areaCapacity(area);
      this.mutateArea(area.id, a => ({ ...a, kind: 'general', capacity, rows: [], tables: [] }));
      return;
    }

    if (kind === 'mesas') {
      this.mutateArea(area.id, a => {
        const next: CroquisArea = { ...a, kind: 'mesas', rows: [], tables: [] };
        const setup = { ...defaultTableOptions(), ...fitTables(a.width, a.height) };
        next.tables = buildTables(next, setup, a.id + '-' + Date.now().toString(36));
        next.labeling = setup.labeling;
        next.startLabel = setup.startLabel;
        return next;
      });
      this.clearSeatSelection();
      return;
    }

    this.mutateArea(area.id, a => {
      const fit = fitGrid(a.width, a.height);
      const next: CroquisArea = { ...a, kind: 'butacas', rows: [], tables: [] };
      next.rows = buildRows(next, { ...defaultGrid(), ...fit }, a.id);
      return next;
    });
    this.clearSeatSelection();
  }

  setFan(): void {
    this.patchArea({ shape: 'polygon', points: fanPoints(0.14) });
  }

  regenerateSeats(options: SeatGridOptions): void {
    const area = this.selectedArea();
    if (!area) return;
    this.mutateArea(area.id, a => ({
      ...a,
      kind: 'butacas',
      curve: options.curve ?? a.curve,
      numbering: options.numbering,
      labeling: options.labeling,
      startLabel: options.startLabel,
      rows: buildRows(a, options, a.id + '-' + Date.now().toString(36))
    }));
    this.clearSeatSelection();
  }

  // ─── Mesas ─────────────────────────────────────────────────────────────────

  onSelectTable(pick: { areaId: string; tableId: string } | null): void {
    this.selectedTableId.set(pick?.tableId ?? null);
    if (pick) {
      this.selectedAreaId.set(pick.areaId);
      this.clearSeatSelection();
    }
  }

  /** Rehace el montaje del área con los parámetros del asistente. */
  regenerateTables(options: TableGridOptions): void {
    const area = this.selectedArea();
    if (!area) return;
    this.mutateArea(area.id, a => ({
      ...a,
      kind: 'mesas',
      rows: [],
      labeling: options.labeling,
      startLabel: options.startLabel,
      tables: buildTables(a, options, a.id + '-' + Date.now().toString(36))
    }));
    this.selectedTableId.set(null);
    this.clearSeatSelection();
  }

  /**
   * Suelta una mesa más en el hueco que quede.
   *
   * Se busca sitio en vez de ponerla en el centro: encimada sobre otra habría
   * que arrastrarla siempre antes de poder verla, y el caso normal de "me falta
   * una mesa" es justamente añadirla al montaje que ya está.
   */
  addTable(): void {
    const area = this.selectedArea();
    if (!area) return;

    const existentes = area.tables || [];
    const molde = existentes[existentes.length - 1];

    // El número salta hasta el primero libre en vez de contar cuántas hay: con
    // una mesa borrada en medio, contar daría un nombre repetido y en el salón
    // habría dos "Mesa 7".
    const usados = new Set(existentes.map(t => t.label));
    let n = existentes.length + 1;
    while (usados.has(`Mesa ${n}`)) n += 1;

    const table = makeTable(`Mesa ${n}`, 0, 0, {
      seatsPerTable: molde?.seats.length || 8,
      shape: molde?.shape || 'redonda',
      rental: molde?.rental || 'completa',
      minSeats: molde?.minSeats || 1,
      size: molde?.width,
      height: molde?.height
    });
    table.tierId = molde?.tierId;

    const radio = tableRadius(table);
    const paso = radio * 2 + 8;
    const libre = (x: number, y: number) =>
      existentes.every(t => Math.hypot(t.x - x, t.y - y) > radio + tableRadius(t));

    let x = radio + 6;
    let y = radio + 6;
    outer: for (; y < area.height - radio; y += paso) {
      for (x = radio + 6; x < area.width - radio; x += paso) {
        if (libre(x, y)) break outer;
      }
    }

    table.x = Math.min(Math.max(radio + 4, x), Math.max(radio + 4, area.width - radio - 4));
    table.y = Math.min(Math.max(radio + 4, y), Math.max(radio + 4, area.height - radio - 4));

    this.mutateArea(area.id, a => ({ ...a, kind: 'mesas', tables: [...(a.tables || []), table] }));
    this.selectedTableId.set(table.id);
  }

  patchTable(changes: Partial<CroquisTable>): void {
    const area = this.selectedArea();
    const id = this.selectedTableId();
    if (!area || !id) return;

    this.mutateArea(area.id, a => ({
      ...a,
      tables: (a.tables || []).map(t => {
        if (t.id !== id) return t;
        const next = { ...t, ...changes };
        // Cambiar cuántas sillas caben es re-repartirlas: la mesa tiene que
        // volver a quedar simétrica, no con dos sillas juntas y un hueco.
        return changes.slots !== undefined ? resizeTableSeats(next, changes.slots) : next;
      })
    }));
  }

  onTableMoved(move: { areaId: string; tableId: string; dx: number; dy: number }): void {
    this.mutateArea(move.areaId, a => ({
      ...a,
      tables: (a.tables || []).map(t =>
        t.id === move.tableId
          ? { ...t, x: Math.round((t.x + move.dx) * 10) / 10, y: Math.round((t.y + move.dy) * 10) / 10 }
          : t
      )
    }));
  }

  duplicateTable(): void {
    const area = this.selectedArea();
    const table = this.selectedTable();
    if (!area || !table) return;

    const copy: CroquisTable = {
      ...structuredClone(table),
      id: croquisId('tb'),
      label: `${table.label} (copia)`,
      x: table.x + tableRadius(table) * 2 + 8,
      // Una copia nace libre: heredar el "vendida" de la mesa original
      // inventaría una venta que nadie hizo.
      status: undefined,
      holder: undefined,
      seats: table.seats.map(s => ({ ...s, status: undefined }))
    };

    this.mutateArea(area.id, a => ({ ...a, tables: [...(a.tables || []), copy] }));
    this.selectedTableId.set(copy.id);
  }

  deleteTable(): void {
    const area = this.selectedArea();
    const id = this.selectedTableId();
    if (!area || !id) return;

    this.mutateArea(area.id, a => ({ ...a, tables: (a.tables || []).filter(t => t.id !== id) }));
    this.selectedTableId.set(null);
    this.clearSeatSelection();
  }

  /** Estado de venta de la mesa completa: aparta o libera todas sus sillas. */
  setTableStatus(status: CroquisTable['status']): void {
    const area = this.selectedArea();
    const id = this.selectedTableId();
    if (!area || !id) return;

    this.mutateArea(area.id, a => ({
      ...a,
      tables: (a.tables || []).map(t => {
        if (t.id !== id) return t;
        const seatStatus = status === 'reservada' ? 'apartado' : status === 'bloqueada' ? 'bloqueado' : undefined;
        return {
          ...t,
          status,
          // Las sillas siguen a la mesa salvo las ya vendidas: liberar la mesa no
          // puede desvender un boleto que ya se cobró.
          seats: t.seats.map(s => (s.status === 'vendido' ? s : { ...s, status: seatStatus }))
        };
      })
    }));
  }

  // ─── Elementos ─────────────────────────────────────────────────────────────

  pickElement(kind: CroquisElementKind): void {
    this.elementKind.set(kind);
    this.tool.set('elemento');
    this.rightOpen.set(false);
  }

  onElementDropped(point: CroquisPoint): void {
    const el = makeElement(this.elementKind(), point.x, point.y);
    this.mutatePlan(plan => ({ ...plan, elements: [...plan.elements, el] }));
    this.selectedElementId.set(el.id);
    this.selectedAreaId.set(null);
    this.tool.set('seleccionar');
  }

  patchElement(changes: Partial<CroquisElement>): void {
    const id = this.selectedElementId();
    if (!id) return;
    this.mutatePlan(plan => ({
      ...plan,
      elements: plan.elements.map(el => (el.id === id ? { ...el, ...changes } : el))
    }));
  }

  onElementMoved(box: BoxChange): void {
    this.mutatePlan(plan => ({
      ...plan,
      elements: plan.elements.map(el =>
        el.id === box.id ? { ...el, x: box.x, y: box.y, width: box.width, height: box.height } : el
      )
    }));
  }

  deleteElement(): void {
    const id = this.selectedElementId();
    if (!id) return;
    this.mutatePlan(plan => ({ ...plan, elements: plan.elements.filter(el => el.id !== id) }));
    this.selectedElementId.set(null);
  }

  // ─── Selección ─────────────────────────────────────────────────────────────

  onSelectArea(id: string | null): void {
    if (id !== this.selectedAreaId()) this.selectedTableId.set(null);
    this.selectedAreaId.set(id);
    if (id) this.clearSeatSelection();
  }

  onSelectElement(id: string | null): void {
    this.selectedElementId.set(id);
    if (id) this.clearSeatSelection();
  }

  clearSelection(): void {
    this.selectedAreaId.set(null);
    this.selectedElementId.set(null);
    this.selectedTableId.set(null);
    this.clearSeatSelection();
  }

  private clearSeatSelection(): void {
    if (this.selectedSeats().size) this.selectedSeats.set(new Set());
  }

  /**
   * Butacas señaladas en el lienzo.
   *
   * Qué significa señalarlas depende de la herramienta: con la de selección solo
   * se marcan, con la brocha se pintan de una vez y con la de quitar se borran.
   * Hacerlo aquí y no en el lienzo mantiene al lienzo como algo que solo dibuja
   * y reporta, sin saber qué significa cada gesto.
   */
  onSeatsPicked(payload: { seats: SeatRef[]; additive: boolean }): void {
    const tool = this.activeTool();

    if (tool === 'pintar') {
      const tierId = this.activeTierId() || this.tiers()[0]?.id || '';
      if (tierId) this.applyToSeats(payload.seats, seat => ({ ...seat, tierId }));
      return;
    }

    if (tool === 'quitar-butacas') {
      this.removeSeats(payload.seats);
      return;
    }

    const next = payload.additive ? new Set(this.selectedSeats()) : new Set<string>();
    for (const ref of payload.seats) next.add(seatKey(ref));
    this.selectedSeats.set(next);
    if (next.size) {
      this.selectedAreaId.set(null);
      this.selectedElementId.set(null);
    }
  }

  // ─── Butacas ───────────────────────────────────────────────────────────────

  private refsFromSelection(): SeatRef[] {
    return [...this.selectedSeats()].map(key => {
      const [areaId, rowId, index] = key.split('|');
      return { areaId, rowId, index: Number(index) };
    });
  }

  /** Agrupa los lugares señalados por la fila o la mesa a la que pertenecen. */
  private groupRefs(refs: SeatRef[]): Map<string, Set<number>> {
    const byGroup = new Map<string, Set<number>>();
    for (const ref of refs) {
      const key = `${ref.areaId}|${ref.rowId}`;
      if (!byGroup.has(key)) byGroup.set(key, new Set());
      byGroup.get(key)!.add(ref.index);
    }
    return byGroup;
  }

  private applyToSeats(refs: SeatRef[], mutate: (seat: CroquisSeat) => CroquisSeat): void {
    if (!refs.length) return;
    const byGroup = this.groupRefs(refs);

    this.mutatePlan(plan => ({
      ...plan,
      areas: plan.areas.map(area => ({
        ...area,
        rows: area.rows.map(row => {
          const targets = byGroup.get(`${area.id}|${row.id}`);
          if (!targets) return row;
          return {
            ...row,
            seats: row.seats.map((seat, i) => (targets.has(i) ? mutate(seat) : seat))
          };
        }),
        tables: (area.tables || []).map(table => {
          const targets = byGroup.get(`${area.id}|${table.id}`);
          if (!targets) return table;
          return {
            ...table,
            seats: table.seats.map((seat, i) => (targets.has(i) ? mutate(seat) : seat))
          };
        })
      }))
    }));
  }

  /**
   * Aplica el arrastre de lugares y deja el croquis contando bien.
   *
   * Son tres cosas en un solo paso, y las tres hacen falta para que mover una
   * butaca signifique algo:
   *
   *   1. **El corrimiento**, que es lo único que se ve.
   *   2. **La re-detección de fila.** El lugar pasa a la fila a la que quedó más
   *      cerca. Arrastrar la A2 hasta junto a la B3 tiene que dejarla en la fila
   *      B; si se quedara en la A, el boleto diría fila A y el acomodador la
   *      buscaría dos renglones más adelante.
   *   3. **El renumerado por posición.** El número no es un nombre que la butaca
   *      se lleva consigo: es el lugar que ocupa. Pasar la A3 más allá de la A5
   *      las intercambia, y la butaca que llegó a la fila B se numera por donde
   *      cayó y corre a las que estaban después de ella.
   *
   * Nada de esto mueve un píxel: la posición cuelga del `slot` y del
   * corrimiento, nunca del índice ni del número.
   *
   * La selección abierta se remapea al vuelo; si no, después de arrastrar tres
   * butacas quedarían marcadas otras tres.
   */
  onSeatsMoved(move: SeatMove): void {
    if (!move.seats.length) return;

    const moving = this.groupRefs(move.seats);
    const remap = new Map<string, string>();

    // El remapeo se llena dentro del mutador, que `commit` corre en el acto: es
    // la única pasada donde se sabe a la vez de dónde salió y adónde llegó cada
    // lugar.
    this.mutatePlan(plan => ({
      ...plan,
      areas: plan.areas.map(area =>
        area.id === move.areaId ? this.relocateSeats(area, move, moving, remap) : area
      )
    }));

    if (remap.size) {
      this.selectedSeats.update(set => new Set([...set].map(k => remap.get(k) || k)));
    }
  }

  /**
   * Reparte los lugares arrastrados entre las filas y mesas del área.
   *
   * Vive aparte porque es la única pieza del editor con geometría de verdad
   * dentro, y mezclarla con el resto de las mutaciones —que solo cambian
   * campos— haría difícil ver dónde empieza y dónde acaba el acomodo.
   */
  private relocateSeats(
    area: CroquisArea,
    move: SeatMove,
    moving: Map<string, Set<number>>,
    remap: Map<string, string>
  ): CroquisArea {
    const numbering = inferNumbering(area);
    const round = (n: number) => Math.round(n * 10) / 10;

    /** Un lugar que viaja, con el punto del área donde se soltó. */
    interface Landing { seat: CroquisSeat; originKey: string; point: CroquisPoint }
    /** Un lugar ya asentado en su fila o mesa, sin perder de dónde venía. */
    interface Placed { seat: CroquisSeat; originKey: string; target?: CroquisPoint }

    // ─── Filas ───
    const rowLandings: Landing[] = [];
    const rowLeaving = new Map<string, Set<number>>();
    const rowDrafts = new Map<string, Placed[]>();

    for (const row of area.rows) {
      const hit = moving.get(`${area.id}|${row.id}`);
      if (hit) {
        rowLeaving.set(row.id, hit);
        for (const i of hit) {
          const p = seatLocalPoint(area, row, i);
          rowLandings.push({
            seat: row.seats[i],
            originKey: `${area.id}|${row.id}|${i}`,
            point: { x: p.x + move.dx, y: p.y + move.dy }
          });
        }
      }
      rowDrafts.set(
        row.id,
        row.seats
          .map((seat, i) => ({ seat, originKey: `${area.id}|${row.id}|${i}` }))
          .filter((_, i) => !hit?.has(i))
      );
    }

    const touchedRows = new Set(rowLeaving.keys());

    for (const landing of rowLandings) {
      // Los que viajan no cuentan al medir cercanía: si contaran, la fila de la
      // que sale un lugar seguiría pareciendo la más cercana por culpa de él
      // mismo y nunca cambiaría de renglón.
      const row = nearestRow(area, landing.point, rowLeaving);
      const draft = row ? rowDrafts.get(row.id) : null;
      if (!row || !draft) continue;

      touchedRows.add(row.id);
      draft.push({
        seat: { ...landing.seat, slot: rowSlotFor(row, landing.point), dx: undefined, dy: undefined },
        originKey: landing.originKey,
        target: landing.point
      });
    }

    let rows = area.rows
      .map(row => {
        if (!touchedRows.has(row.id)) return row;
        const items = rowDrafts.get(row.id) || [];

        // El corrimiento se mide contra la fila ya armada: la curvatura depende
        // de hasta dónde llega, y un lugar añadido al final puede cambiarla.
        const armed: CroquisRow = { ...row, seats: items.map(i => i.seat) };
        const settled: CroquisRow = {
          ...armed,
          seats: items.map((item, i) => {
            if (!item.target) return item.seat;
            const base = seatLocalPoint(area, armed, i);
            const dx = round(item.target.x - base.x);
            const dy = round(item.target.y - base.y);
            return { ...item.seat, dx: dx || undefined, dy: dy || undefined };
          })
        };

        const { seats, from } = orderRowSeats(area, settled);
        from.forEach((old, index) => remap.set(items[old].originKey, `${area.id}|${row.id}|${index}`));

        return { ...settled, seats };
      })
      // Una fila que se quedó sin nadie deja de existir: su letra ya no nombra
      // ningún lugar del recinto y dibujarla dejaría un renglón fantasma.
      .filter(row => row.seats.length > 0);

    rows = renumberSeatsInRows(rows, numbering, touchedRows);

    // ─── Mesas ───
    const tableLandings: Landing[] = [];
    const tableLeaving = new Map<string, Set<number>>();
    const tableDrafts = new Map<string, Placed[]>();

    for (const table of area.tables || []) {
      const hit = moving.get(`${area.id}|${table.id}`);
      if (hit) {
        tableLeaving.set(table.id, hit);
        for (const i of hit) {
          const p = tableSeatLocalPoint(table, table.seats[i]);
          tableLandings.push({
            seat: table.seats[i],
            originKey: `${area.id}|${table.id}|${i}`,
            point: { x: p.x + move.dx, y: p.y + move.dy }
          });
        }
      }
      tableDrafts.set(
        table.id,
        table.seats
          .map((seat, i) => ({ seat, originKey: `${area.id}|${table.id}|${i}` }))
          .filter((_, i) => !hit?.has(i))
      );
    }

    const touchedTables = new Set(tableLeaving.keys());

    for (const landing of tableLandings) {
      // Alrededor de una mesa manda el tablero más cercano: arrastrar una silla
      // a la mesa de junto es cambiarla de mesa, no dejarla flotando entre dos.
      const table = nearestTable(area, landing.point);
      const draft = table ? tableDrafts.get(table.id) : null;
      if (!table || !draft) continue;

      touchedTables.add(table.id);
      const taken = new Set(draft.map(i => i.seat.slot || 0));
      const slot = tableSlotFor(table, landing.point, taken);

      const base = tableSeatLocalPoint(table, { number: '', slot });
      const residual = rotatePoint(
        { x: landing.point.x - base.x, y: landing.point.y - base.y },
        { x: 0, y: 0 },
        -(table.rotation || 0)
      );

      draft.push({
        seat: {
          ...landing.seat,
          slot,
          dx: round(residual.x) || undefined,
          dy: round(residual.y) || undefined
        },
        originKey: landing.originKey
      });
    }

    const tables = (area.tables || []).map(table => {
      if (!touchedTables.has(table.id)) return table;
      const items = tableDrafts.get(table.id) || [];

      // Mismo criterio que el renumerado: por el lugar que ocupan alrededor de
      // la mesa, no por el orden en que llegaron al arreglo.
      const order = [...items].sort((l, r) => (l.seat.slot || 0) - (r.seat.slot || 0));
      order.forEach((item, index) => remap.set(item.originKey, `${area.id}|${table.id}|${index}`));

      return renumberTableSeats({ ...table, seats: items.map(i => i.seat) });
    });

    return {
      ...area,
      // Se deja escrito el esquema con el que se acaba de contar: la próxima vez
      // ya no hace falta deducirlo de los números que hay puestos.
      numbering,
      rows,
      tables: area.tables ? tables : area.tables
    };
  }

  /**
   * Ordena lo que se movió a mano.
   *
   * Mover butacas sueltas deja el croquis con lugares corridos dos o tres
   * unidades que en pantalla casi no se notan y que en el mapa del comprador se
   * ven como una fila torcida. Estas tres acciones son el remate del gesto de
   * arrastrar: alinear la fila, repartirla pareja o rendirse y devolverlo todo a
   * la rejilla.
   */
  applySeatLayout(action: SeatLayoutAction): void {
    const refs = this.refsFromSelection();
    if (!refs.length) return;

    if (action === 'rejilla') {
      this.applyToSeats(refs, seat => ({ ...seat, dx: undefined, dy: undefined }));
      return;
    }

    const byGroup = this.groupRefs(refs);

    this.mutatePlan(plan => ({
      ...plan,
      areas: plan.areas.map(area => {
        const touched = new Set<string>();
        const rows = area.rows.map(row => {
          const targets = byGroup.get(`${area.id}|${row.id}`);
          if (!targets || targets.size < 2) return row;
          touched.add(row.id);

          const a = ((row.angle || 0) * Math.PI) / 180;
          const dirX = Math.cos(a);
          const dirY = Math.sin(a);

          const picked = [...targets]
            .filter(i => i < row.seats.length)
            .map(i => {
              const p = seatLocalPoint(area, row, i);
              return { i, p, along: p.x * dirX + p.y * dirY };
            })
            .sort((l, r) => l.along - r.along);

          if (picked.length < 2) return row;

          const shift = new Map<number, { dx: number; dy: number }>();

          if (action === 'alinear') {
            // Todas a la altura de la primera de la selección: es la que marca
            // dónde va la fila, y es la que uno mira al decir "esta está chueca".
            const base = picked[0].p;
            const acrossBase = -base.x * dirY + base.y * dirX;
            for (const s of picked) {
              const across = -s.p.x * dirY + s.p.y * dirX;
              const d = acrossBase - across;
              shift.set(s.i, { dx: -d * dirY, dy: d * dirX });
            }
          } else {
            // Repartir parejo entre la primera y la última, sin moverlas: son
            // las que definen hasta dónde llega el tramo.
            const first = picked[0].along;
            const last = picked[picked.length - 1].along;
            const step = (last - first) / (picked.length - 1);
            picked.forEach((s, n) => {
              const d = first + step * n - s.along;
              shift.set(s.i, { dx: d * dirX, dy: d * dirY });
            });
          }

          const moved = {
            ...row,
            seats: row.seats.map((seat, i) => {
              const d = shift.get(i);
              if (!d) return seat;
              const dx = Math.round(((seat.dx || 0) + d.dx) * 10) / 10;
              const dy = Math.round(((seat.dy || 0) + d.dy) * 10) / 10;
              return { ...seat, dx: dx || undefined, dy: dy || undefined };
            })
          };

          return { ...moved, seats: orderRowSeats(area, moved).seats };
        });

        // Alinear o repartir puede cambiar el orden de la fila, así que los
        // números se vuelven a repartir igual que al arrastrar: si no, "repartir
        // parejo" dejaría la fila bien puesta y mal contada.
        return touched.size
          ? { ...area, rows: renumberSeatsInRows(rows, inferNumbering(area), touched) }
          : area;
      })
    }));

    this.clearSeatSelection();
  }

  /**
   * Vuelve a poner en orden y a numerar el área seleccionada.
   *
   * Es lo que cierra el ciclo de mover lugares a mano: se acomodan las filas de
   * adelante hacia atrás, los lugares de izquierda a derecha, y se reparten los
   * números con el mismo esquema con el que se generó el área. Sin esto,
   * reacomodar un recinto dejaría boletos que mandan a la butaca equivocada.
   */
  // ─── Revisión final ────────────────────────────────────────────────────────

  /** Lo que corrigió la última revisión; se enseña un momento y se va. */
  reviewNote = signal<string>('');
  private reviewTimer?: ReturnType<typeof setTimeout>;

  /**
   * Revisa el croquis completo y corrige lo que quedó disparejo.
   *
   * Corre al cerrar el editor y también a mano desde la barra. Al cerrar va en
   * silencio —es una corrección, no una pregunta— y a mano avisa qué tocó, que
   * es la única forma de que quien dibuja sepa que el croquis con el que se
   * queda no es exactamente el que dejó en pantalla.
   */
  reviewCroquis(quiet = false): void {
    if (!this.canEdit()) return;

    const { plans, fixes } = normalizeCroquis(this.plans());
    if (!plans) {
      if (!quiet) this.flashReview('Todo en orden: nombres y lugares cuadran.');
      return;
    }

    this.commit(() => plans);
    this.clearSelection();
    if (!quiet) this.flashReview(`${totalFixes(fixes)} corrección(es) · ${describeFixes(fixes)}`);
  }

  private flashReview(text: string): void {
    clearTimeout(this.reviewTimer);
    this.reviewNote.set(text);
    this.reviewTimer = setTimeout(() => this.reviewNote.set(''), 6000);
  }

  /** El croquis se guarda revisado: cerrar es el único momento en que está quieto. */
  closeEditor(): void {
    this.reviewCroquis(true);
    this.closed.emit();
  }

  renumberSelectedArea(): void {
    const area = this.selectedArea();
    if (!area) return;

    this.mutateArea(area.id, a => ({
      ...a,
      numbering: inferNumbering(a),
      rows: renumberArea(a, inferNumbering(a), a.labeling || 'letras', a.startLabel),
      tables: a.tables?.length ? renumberTables(a, a.labeling || 'numeros', a.startLabel) : a.tables
    }));
    this.clearSeatSelection();
  }

  /**
   * Borra butacas del croquis.
   *
   * Se filtra por índice y no se recorre el arreglo: el `slot` de cada butaca
   * sobrevive, así que el hueco que queda se dibuja como el pasillo que es en
   * vez de recorrer todas las butacas de la fila una posición.
   */
  private removeSeats(refs: SeatRef[]): void {
    if (!refs.length) return;
    const byGroup = this.groupRefs(refs);

    this.mutatePlan(plan => ({
      ...plan,
      areas: plan.areas.map(area => {
        const touched = new Set<string>();

        const rows = area.rows
          .map(row => {
            const targets = byGroup.get(`${area.id}|${row.id}`);
            if (!targets) return row;
            touched.add(row.id);
            return { ...row, seats: row.seats.filter((_, i) => !targets.has(i)) };
          })
          .filter(row => row.seats.length > 0);

        return {
          ...area,
          // Los números se cierran sobre el hueco, que es lo que hace el
          // generador cuando se le pide un pasillo: el pasillo se ve en el
          // plano pero no se lleva un número. Dejarlos como estaban acabaría
          // con filas que van 1, 2, 4, 5 sin que nada lo explique.
          rows: touched.size ? renumberSeatsInRows(rows, inferNumbering(area), touched) : rows,
          // Una mesa sin sillas sí se queda: es un tablero que sigue ocupando su
          // sitio en el salón y al que se le pueden volver a poner lugares. Que
          // desapareciera al quitarle la última silla sería perder el montaje.
          tables: (area.tables || []).map(table => {
            const targets = byGroup.get(`${area.id}|${table.id}`);
            if (!targets) return table;
            return renumberTableSeats({ ...table, seats: table.seats.filter((_, i) => !targets.has(i)) });
          })
        };
      })
    }));
    this.clearSeatSelection();
  }

  assignSeatTier(tierId: string): void {
    this.applyToSeats(this.refsFromSelection(), seat => ({ ...seat, tierId: tierId || undefined }));
  }

  applySeatAction(action: SeatBatchAction): void {
    const refs = this.refsFromSelection();
    if (!refs.length) return;

    if (action === 'quitar') {
      this.removeSeats(refs);
      return;
    }
    if (action === 'accesible') {
      this.applyToSeats(refs, seat => ({ ...seat, accessible: !seat.accessible }));
      return;
    }
    if (action === 'disponible') {
      this.applyToSeats(refs, seat => ({ ...seat, status: undefined }));
      return;
    }
    this.applyToSeats(refs, seat => ({ ...seat, status: action }));
  }

  // ─── Categorías de boleto ──────────────────────────────────────────────────

  /** Abre el diálogo: una categoría nueva nace completa o no nace. */
  addTier(): void {
    this.tierDialogOpen.set(true);
    this.tierUnderEdit.set(null);
  }

  editTier(id: string): void {
    const tier = this.tiers().find(t => t.id === id);
    if (!tier) return;
    this.tierUnderEdit.set(tier);
    this.tierDialogOpen.set(true);
  }

  onTierSaved(tier: TicketTier): void {
    const existing = this.tierUnderEdit();
    this.tierDialogOpen.set(false);
    this.tierUnderEdit.set(null);

    if (existing?.id) {
      this.patchTier(existing.id, tier);
      return;
    }

    const created: TicketTier = { ...tier, id: croquisId('tt') };
    this.commitTiers([...this.tiers(), created]);
    // Queda activa para pintar: lo normal después de crearla es asignarla.
    this.activeTierId.set(created.id!);
    this.setTool('pintar');
  }

  patchTier(id: string, changes: Partial<TicketTier>): void {
    this.commitTiers(this.tiers().map(t => (t.id === id ? { ...t, ...changes } : t)));
  }

  /**
   * Elimina una categoría y desliga del croquis todo lo que apuntaba a ella.
   *
   * Se hace en un solo movimiento porque dejar áreas apuntando a una categoría
   * borrada las volvería invendibles sin decirlo: se seguirían viendo pintadas y
   * con precio hasta que alguien abriera el editor.
   */
  removeTier(id: string): void {
    const tier = this.tiers().find(t => t.id === id);
    if (tier && (tier.soldSeats || 0) > 0) return;

    const nextTiers = this.tiers().filter(t => t.id !== id);
    const nextPlans = this.plans().map(plan => ({
      ...plan,
      areas: plan.areas.map(area => ({
        ...area,
        tierId: area.tierId === id ? undefined : area.tierId,
        rows: area.rows.map(row => ({
          ...row,
          seats: row.seats.map(seat => (seat.tierId === id ? { ...seat, tierId: undefined } : seat))
        })),
        tables: (area.tables || []).map(table => ({
          ...table,
          tierId: table.tierId === id ? undefined : table.tierId,
          seats: table.seats.map(seat => (seat.tierId === id ? { ...seat, tierId: undefined } : seat))
        }))
      }))
    }));

    this.history.update(h => [...h.slice(-39), this.plans()]);
    this.future.set([]);
    this.plans.set(nextPlans);
    this.tiers.set(nextTiers);
    if (this.activeTierId() === id) this.activeTierId.set(nextTiers[0]?.id || '');
    this.patch.emit({ croquisPlans: nextPlans, ticketTiers: nextTiers });
  }

  // ─── Teclado ───────────────────────────────────────────────────────────────

  setTool(tool: CroquisTool): void {
    this.tool.set(tool);
    this.layersOpen.set(false);
    if (tool !== 'seleccionar') this.clearSeatSelection();
  }

  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    // Nunca robarle las teclas a un campo de texto: la "b" de un nombre de zona
    // no debe cambiar de herramienta.
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) return;

    const ctrl = event.ctrlKey || event.metaKey;

    if (ctrl && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.shiftKey ? this.redo() : this.undo();
      return;
    }
    if (ctrl && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      this.redo();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      // Escape va cerrando de lo más superficial a lo más profundo: primero los
      // paneles, luego la selección, y solo al final el editor. Cerrarlo de golpe
      // con una tecla que se usa para "quitar esto de encima" perdería el sitio.
      if (this.layersOpen()) this.layersOpen.set(false);
      else if (this.summaryOpen()) this.summaryOpen.set(false);
      else if (this.preview()) this.preview.set(false);
      else if (this.tool() !== 'seleccionar') this.setTool('seleccionar');
      else if (this.selectedAreaId() || this.selectedElementId() || this.selectedTableId() || this.selectedSeats().size) this.clearSelection();
      else this.closeEditor();
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      if (this.selectedSeats().size) this.applySeatAction('quitar');
      else if (this.selectedTableId()) this.deleteTable();
      else if (this.selectedAreaId()) this.deleteArea();
      else if (this.selectedElementId()) this.deleteElement();
      return;
    }

    const shortcut = this.toolbarTools.find(t => t.key === event.key.toLowerCase());
    if (shortcut && !ctrl) {
      event.preventDefault();
      this.setTool(shortcut.tool);
    }
  }
}

/** Parámetros por defecto del generador; se usa al convertir un área a butacas. */
function defaultGrid(): SeatGridOptions {
  return {
    rows: 6,
    seatsPerRow: 12,
    numbering: 'izquierda-derecha',
    labeling: 'letras',
    startLabel: 'A',
    gap: 21,
    rowGap: 24,
    curve: 0,
    aisles: []
  };
}
