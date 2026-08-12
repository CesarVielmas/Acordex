import {
  Component, ChangeDetectionStrategy, ElementRef, ViewChild,
  computed, input, output, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CroquisArea, CroquisElement, CroquisPlan, CroquisPoint, CroquisSeat,
  CroquisTable, CroquisTier, SEAT_SIZE
} from '../../../../core/models/croquis.models';
import {
  alignToNeighbours, areaPath, areaTransform, boxFromDrag, elementTransform,
  limitSeatDelta, planBounds, planDeltaToAreaLocal, pointInBox, rotatePoint,
  seatLocalPoint, seatPlanPoint, snap, tableSeatLocalPoint, tableSeatOffset,
  tableSeatPlanPoint, tableTransform
} from '../croquis-geometry';
import { areaCapacity, areaSold } from '../croquis-metrics';
import { areaInsight, compactMoney } from '../croquis-insights';
import { elementMeta } from '../croquis-catalog';

/**
 * El croquis dibujado. Un solo componente pinta las tres vistas del plano —la
 * miniatura de la ficha, la vista del cliente y el lienzo del editor— porque si
 * fueran tres implementaciones, tarde o temprano el croquis se vería distinto en
 * cada una y nadie sabría cuál es el bueno.
 *
 * Lo que cambia entre modos es qué se muestra y qué responde al mouse, no cómo
 * se dibuja: en `miniatura` no hay etiquetas ni interacción, en `cliente` las
 * butacas vendidas se apagan y las disponibles llaman, y en `editor` todo es
 * seleccionable y arrastrable.
 *
 * El detalle que hace que esto funcione con miles de butacas: la escena se
 * calcula una vez en `scene()` y el template solo pinta datos ya resueltos. Si
 * el template llamara funciones por butaca, Angular las volvería a evaluar en
 * cada ciclo de detección y arrastrar un área de 2,000 lugares sería inusable.
 * Por lo mismo la selección se pinta en una capa aparte: así seleccionar no
 * obliga a recalcular la escena completa.
 */

export type CroquisMode = 'editor' | 'cliente' | 'miniatura';
export type CroquisColorBy = 'categoria' | 'venta';

/** Herramienta activa del editor. En los otros modos siempre es 'seleccionar'. */
export type CroquisTool =
  | 'seleccionar'
  | 'area-butacas'
  | 'area-mesas'
  | 'area-general'
  | 'elemento'
  | 'pintar'
  | 'quitar-butacas';

/**
 * Referencia a un lugar concreto dentro del plano.
 *
 * `rowId` es la fila o la mesa a la que pertenece —los identificadores no se
 * repiten entre unas y otras—, así que una silla de mesa se selecciona, se
 * pinta y se vende con la misma maquinaria que una butaca de luneta.
 */
export interface SeatRef {
  areaId: string;
  rowId: string;
  /** Índice dentro de la fila o de la mesa. */
  index: number;
}

export const seatKey = (ref: SeatRef): string => `${ref.areaId}|${ref.rowId}|${ref.index}`;

export interface BoxChange {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AreaDraft {
  kind: 'butacas' | 'mesas' | 'general';
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Arrastre de lugares terminado.
 *
 * El desplazamiento va en coordenadas del área ya sin girar y de una sola vez al
 * soltar, no en cada movimiento del mouse: así arrastrar treinta butacas por
 * medio croquis deja un solo paso que deshacer en vez de doscientos.
 */
export interface SeatMove {
  areaId: string;
  seats: SeatRef[];
  dx: number;
  dy: number;
  /**
   * Se arrastró con Alt: sin imantar a los vecinos y sin caer en la rejilla de
   * la fila que lo reciba. Es la salida para las butacas que de verdad no van en
   * ningún renglón —el anillo alrededor de la pista, el par de lugares metidos
   * en un rincón—, que si se acomodaran solas no habría manera de dibujarlas.
   */
  free: boolean;
}

interface SeatVM {
  key: string;
  ref: SeatRef;
  x: number;
  y: number;
  size: number;
  fill: string;
  stroke: string;
  opacity: number;
  /** Número impreso dentro de la butaca, con la capa de numeración activa. */
  number: string;
  /** Tamaño de esa tinta; baja cuando el identificador es largo, para que quepa. */
  numberSize: number;
  /** Ancho al que el navegador tiene que apretarlo; nulo cuando ya cabe solo. */
  numberWidth: number | null;
  /** Tinta que contrasta con el relleno de esta butaca en concreto. */
  numberFill: string;
  /** Franja inferior que imita el respaldo de la butaca, en la vista del cliente. */
  cushion: boolean;
  /** Etiqueta completa de la butaca, para el tooltip nativo. */
  title: string;
}

interface RowVM {
  id: string;
  label: string;
  labelX: number;
  labelY: number;
  seats: SeatVM[];
}

/**
 * Una mesa dibujada.
 *
 * Las sillas van en coordenadas del centro de la mesa: se pintan dentro del
 * grupo de la mesa para que girarla las lleve consigo, que es lo que uno espera
 * al girar una mesa imperial para que quede a lo largo del salón.
 */
interface TableVM {
  table: CroquisTable;
  transform: string;
  fill: string;
  stroke: string;
  color: string;
  /** Redonda: radio. Rectangular: 0, y se usa la caja. */
  radius: number;
  boxX: number;
  boxY: number;
  label: string;
  labelSize: number;
  /** Lugares libres sobre el total, dentro de la mesa. */
  badge: string;
  /** Se renta completa: se dibuja el aro que la ata. */
  whole: boolean;
  dimmed: boolean;
  seats: SeatVM[];
  title: string;
}

interface AreaVM {
  area: CroquisArea;
  transform: string;
  path: string;
  fill: string;
  stroke: string;
  color: string;
  label: string;
  sub: string;
  /** Alto al que se ancla la etiqueta: arriba de la caja si hay lugar. */
  labelY: number;
  rows: RowVM[];
  tables: TableVM[];

  // --- Capas opcionales del chip. Vacías cuando la capa está apagada, y
  //     entonces el chip conserva su alto de siempre. ---
  /** Taquilla del área: potencial y, si hay venta, lo ya cobrado. */
  moneyLine: string;
  /** Vendidos sobre aforo. */
  occupancyLine: string;
  occupancyPercent: number;
  chipHeight: number;
  chipWidth: number;
}

/**
 * Cómo se dibuja cada elemento del recinto.
 *
 * No todos merecen la misma forma. El escenario es una tarima maciza con su
 * borde al público; una pantalla es un panel sobre un soporte; lo demás son
 * módulos con su ícono. Dibujarlos todos como el mismo rectángulo punteado
 * obligaba a leer la etiqueta para saber qué era cada cosa, que es justo lo que
 * un croquis debería ahorrarte.
 */
type ElementShape = 'escenario' | 'pantalla' | 'modulo' | 'texto';

interface ElementVM {
  el: CroquisElement;
  transform: string;
  color: string;
  icon: string;
  shape: ElementShape;

  /** Etiqueta ya recortada a lo que cabe. */
  label: string;
  labelSize: number;
  labelY: number;
  labelAnchor: string;
  /** Fuera de la caja cuando el elemento es muy chico para llevarla dentro. */
  labelOutside: boolean;

  showIcon: boolean;
  iconSize: number;
  iconY: number;

  /** Grupo del cartel que toca en este escenario. */
  subtitle: string;
}

let canvasSeq = 0;

/**
 * Ancho aproximado de un texto en unidades de croquis.
 *
 * SVG no sabe recortar texto: lo que no cabe se sale del elemento y se encima
 * con lo de al lado. Se estima con el ancho medio de la tipografía en vez de
 * medirlo de verdad —que obligaría a tocar el DOM por cada etiqueta en cada
 * render— porque para decidir dónde cortar sobra con la aproximación.
 */
const textWidth = (text: string, fontSize: number): number => (text || '').length * fontSize * 0.56;

/** Recorta el texto con puntos suspensivos a lo que quepa en `maxWidth`. */
function fitText(text: string, maxWidth: number, fontSize: number): string {
  const clean = (text || '').trim();
  if (!clean || maxWidth <= 0) return clean;
  if (textWidth(clean, fontSize) <= maxWidth) return clean;

  const max = Math.max(1, Math.floor(maxWidth / (fontSize * 0.56)) - 1);
  return clean.slice(0, max).trimEnd() + '…';
}

/** Lo que puede ocupar el identificador dentro del cuadrito de la butaca. */
const SEAT_LABEL_WIDTH = SEAT_SIZE - 2.6;

/**
 * Con qué tamaño y en qué ancho cabe el identificador dentro de la butaca.
 *
 * La butaca mide `SEAT_SIZE` de lado y el texto de un SVG no se recorta: "A10"
 * con la letra de "A1" se sale del cuadrito y se encima con la butaca de al
 * lado, y una fila entera así deja de leerse justo cuando más falta hace.
 *
 * Se hacen las dos cosas a la vez y no una sola porque cada una arregla la mitad
 * del problema. Bajar la letra hasta que quepa a ojo depende de una estimación
 * del ancho de la tipografía que en negritas se queda corta —medido, "M30" ocupa
 * diecisiete unidades donde la cuenta decía trece—, así que además se le pone al
 * navegador el ancho exacto y que sea él quien lo apriete: es la única medida que
 * no puede fallar porque es la que él mismo va a pintar. Y apretar a secas, sin
 * bajar la letra, dejaría "AA12" tan estrecho que no se leería; bajarla primero
 * hace que lo que se aprieta sea poco.
 */
function seatLabelSize(label: string): number {
  const chars = (label || '').length;
  if (chars <= 2) return 7.5;
  if (chars === 3) return 6.6;
  if (chars === 4) return 5.6;
  return 4.8;
}

/**
 * Tinta que se lee sobre un relleno dado.
 *
 * El número de butaca se dibuja encima del color de su categoría, y esos colores
 * van del dorado claro al gris oscuro. Una tinta fija sería ilegible en la mitad
 * de la paleta, así que se decide por la luminancia del relleno.
 */
function readableOn(hex: string): string {
  const clean = (hex || '').replace('#', '').slice(0, 6);
  if (clean.length < 6) return '#131313';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#131313' : '#e5e2e1';
}

@Component({
  selector: 'app-croquis-canvas',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block relative w-full h-full' },
  template: `
    <svg
      #svg
      class="w-full h-full select-none touch-none"
      [class.cursor-crosshair]="tool() !== 'seleccionar'"
      [attr.viewBox]="viewBox()"
      preserveAspectRatio="xMidYMid meet"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerUp($event)"
      (wheel)="onWheel($event)"
      (contextmenu)="$event.preventDefault()"
    >
      <defs>
        <pattern [attr.id]="uid + '-grid'" [attr.width]="gridSize()" [attr.height]="gridSize()" patternUnits="userSpaceOnUse">
          <path
            [attr.d]="'M ' + gridSize() + ' 0 L 0 0 0 ' + gridSize()"
            fill="none"
            stroke="rgba(153,144,124,0.16)"
            stroke-width="1"
          />
        </pattern>
        <pattern [attr.id]="uid + '-crowd'" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.6" fill="currentColor" opacity="0.55" />
          <circle cx="10.5" cy="10.5" r="1.6" fill="currentColor" opacity="0.55" />
        </pattern>
        <filter [attr.id]="uid + '-glow'" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <!-- Piso del recinto -->
      <rect
        x="0" y="0" [attr.width]="plan().width" [attr.height]="plan().height"
        rx="18"
        fill="#161616"
        stroke="rgba(153,144,124,0.28)"
        stroke-width="1.5"
      />
      @if (showGrid() && mode() === 'editor') {
        <rect
          x="0" y="0" [attr.width]="plan().width" [attr.height]="plan().height"
          rx="18" [attr.fill]="'url(#' + uid + '-grid)'"
        />
      }

      <!-- ─── ÁREAS ─── -->
      @for (vm of scene().areas; track vm.area.id) {
        <g [attr.transform]="vm.transform" [class.cursor-move]="interactive()">
          <path
            [attr.d]="vm.path"
            [attr.fill]="vm.fill"
            [attr.stroke]="vm.stroke"
            [attr.stroke-width]="selectedAreaId() === vm.area.id ? 3 : 1.5"
            [attr.stroke-dasharray]="vm.area.kind === 'general' ? '10 6' : null"
            (pointerdown)="onAreaPointerDown($event, vm.area)"
          />

          @if (vm.area.kind === 'general') {
            <path
              [attr.d]="vm.path"
              [attr.fill]="'url(#' + uid + '-crowd)'"
              [style.color]="vm.color"
              class="pointer-events-none"
            />
          }

          <!-- Butacas -->
          @for (row of vm.rows; track row.id) {
            @if (showSeatLabels() && showRowLabels()) {
              <text
                [attr.x]="row.labelX" [attr.y]="row.labelY"
                text-anchor="end" dominant-baseline="middle"
                font-size="11" font-weight="800" fill="rgba(208,197,175,0.75)"
                class="pointer-events-none"
              >{{ row.label }}</text>
            }
            @for (seat of row.seats; track seat.key) {
              <rect
                [attr.x]="seat.x" [attr.y]="seat.y"
                [attr.width]="seat.size" [attr.height]="seat.size"
                rx="4"
                [attr.fill]="seat.fill"
                [attr.stroke]="seat.stroke"
                stroke-width="1"
                [attr.opacity]="seat.opacity"
                [class.cursor-pointer]="seatsClickable()"
                (pointerdown)="onSeatPointerDown($event, seat.ref)"
                (pointerenter)="onSeatEnter($event, seat.ref)"
              ><title>{{ seat.title }}</title></rect>
              @if (seat.cushion) {
                <rect
                  [attr.x]="seat.x + 2.5" [attr.y]="seat.y + seat.size - 4"
                  [attr.width]="seat.size - 5" height="2.5" rx="1.2"
                  fill="rgba(0,0,0,0.28)"
                  class="pointer-events-none"
                />
              }
              @if (seat.number) {
                <text
                  [attr.x]="seat.x + seat.size / 2" [attr.y]="seat.y + seat.size / 2 + 0.5"
                  text-anchor="middle" dominant-baseline="central"
                  [attr.font-size]="seat.numberSize" font-weight="800"
                  [attr.textLength]="seat.numberWidth"
                  [attr.lengthAdjust]="seat.numberWidth ? 'spacingAndGlyphs' : null"
                  [attr.fill]="seat.numberFill"
                  [attr.opacity]="seat.opacity"
                  class="pointer-events-none"
                >{{ seat.number }}</text>
              }
            }
          }

          <!-- ─── MESAS ─── -->
          @for (t of vm.tables; track t.table.id) {
            <g [attr.transform]="t.transform">

              <!-- El aro de la mesa que se renta completa. Es lo único que
                   distingue de un vistazo "estas diez sillas van juntas" de
                   "aquí hay diez lugares sueltos", y de eso depende el precio. -->
              @if (t.whole) {
                @if (t.radius) {
                  <circle cx="0" cy="0" [attr.r]="t.radius + 21"
                    fill="none" [attr.stroke]="t.color" stroke-width="1.2"
                    stroke-dasharray="3 5" opacity="0.5" class="pointer-events-none" />
                } @else {
                  <rect
                    [attr.x]="t.boxX - 21" [attr.y]="t.boxY - 21"
                    [attr.width]="t.table.width + 42" [attr.height]="t.table.height + 42"
                    rx="16" fill="none" [attr.stroke]="t.color" stroke-width="1.2"
                    stroke-dasharray="3 5" opacity="0.5" class="pointer-events-none" />
                }
              }

              <!-- El tablero -->
              @if (t.radius) {
                <circle
                  cx="0" cy="0" [attr.r]="t.radius"
                  [attr.fill]="t.fill" [attr.stroke]="t.stroke"
                  [attr.stroke-width]="selectedTableId() === t.table.id ? 3 : 1.6"
                  [attr.opacity]="t.dimmed ? 0.4 : 1"
                  [class.cursor-pointer]="seatsClickable()"
                  (pointerdown)="onTablePointerDown($event, vm.area, t.table)"
                ><title>{{ t.title }}</title></circle>
              } @else {
                <rect
                  [attr.x]="t.boxX" [attr.y]="t.boxY"
                  [attr.width]="t.table.width" [attr.height]="t.table.height"
                  rx="7"
                  [attr.fill]="t.fill" [attr.stroke]="t.stroke"
                  [attr.stroke-width]="selectedTableId() === t.table.id ? 3 : 1.6"
                  [attr.opacity]="t.dimmed ? 0.4 : 1"
                  [class.cursor-pointer]="seatsClickable()"
                  (pointerdown)="onTablePointerDown($event, vm.area, t.table)"
                ><title>{{ t.title }}</title></rect>
              }

              <!-- Sillas -->
              @for (seat of t.seats; track seat.key) {
                <rect
                  [attr.x]="seat.x" [attr.y]="seat.y"
                  [attr.width]="seat.size" [attr.height]="seat.size"
                  rx="5"
                  [attr.fill]="seat.fill"
                  [attr.stroke]="seat.stroke"
                  stroke-width="1"
                  [attr.opacity]="seat.opacity"
                  [class.cursor-pointer]="seatsClickable()"
                  (pointerdown)="onSeatPointerDown($event, seat.ref)"
                  (pointerenter)="onSeatEnter($event, seat.ref)"
                ><title>{{ seat.title }}</title></rect>
                @if (seat.number) {
                  <text
                    [attr.x]="seat.x + seat.size / 2" [attr.y]="seat.y + seat.size / 2 + 0.5"
                    text-anchor="middle" dominant-baseline="central"
                    [attr.font-size]="seat.numberSize" font-weight="800"
                    [attr.textLength]="seat.numberWidth"
                    [attr.lengthAdjust]="seat.numberWidth ? 'spacingAndGlyphs' : null"
                    [attr.fill]="seat.numberFill"
                    [attr.opacity]="seat.opacity"
                    class="pointer-events-none"
                  >{{ seat.number }}</text>
                }
              }

              <!-- El nombre va dentro del tablero: es donde lo busca quien llega
                   con su boleto, y fuera chocaría con las sillas. -->
              @if (showLabels()) {
                <text
                  x="0" [attr.y]="t.badge ? -3 : 1"
                  text-anchor="middle" dominant-baseline="middle"
                  [attr.font-size]="t.labelSize" font-weight="900"
                  [attr.fill]="t.color"
                  class="pointer-events-none"
                >{{ t.label }}</text>
                @if (t.badge) {
                  <text
                    x="0" y="9"
                    text-anchor="middle" dominant-baseline="middle"
                    font-size="7.5" font-weight="700"
                    fill="rgba(208,197,175,0.8)"
                    class="pointer-events-none"
                  >{{ t.badge }}</text>
                }
              }
            </g>
          }

          <!-- Nombre del área. Va por fuera de la caja siempre que quepa: dentro
               taparía la primera fila de butacas, que es justo la más cara.
               Además es el tirador para mover el área: el interior se reserva
               para seleccionar butacas en bloque, que es lo que más se hace. -->
          @if (showLabels()) {
            <g
              [attr.transform]="'translate(4 ' + vm.labelY + ')'"
              [class.cursor-move]="interactive()"
              [class.pointer-events-none]="!interactive()"
              (pointerdown)="onAreaLabelPointerDown($event, vm.area)"
            >
              <rect
                x="0" y="0"
                [attr.width]="vm.chipWidth" [attr.height]="vm.chipHeight" rx="9"
                fill="rgba(19,19,19,0.9)" [attr.stroke]="vm.stroke"
              >@if (interactive()) {<title>Arrastra para mover "{{ vm.area.name }}"</title>}</rect>
              <text x="12" y="14" font-size="13" font-weight="900" [attr.fill]="vm.color" class="pointer-events-none">{{ vm.label }}</text>
              <text x="12" y="27" font-size="10" font-weight="700" fill="rgba(208,197,175,0.8)" class="pointer-events-none">{{ vm.sub }}</text>

              @if (vm.moneyLine) {
                <text x="12" y="40" font-size="10" font-weight="800" fill="#f2ca50" class="pointer-events-none">{{ vm.moneyLine }}</text>
              }

              @if (vm.occupancyLine) {
                @let barY = vm.chipHeight - 15;
                <rect
                  [attr.x]="12" [attr.y]="barY" [attr.width]="vm.chipWidth - 24" height="4" rx="2"
                  fill="rgba(255,255,255,0.12)" class="pointer-events-none"
                />
                <rect
                  [attr.x]="12" [attr.y]="barY" [attr.width]="(vm.chipWidth - 24) * vm.occupancyPercent / 100" height="4" rx="2"
                  fill="#34d399" class="pointer-events-none"
                />
                <text [attr.x]="12" [attr.y]="vm.chipHeight - 4" font-size="9" font-weight="700" fill="rgba(208,197,175,0.85)" class="pointer-events-none">
                  {{ vm.occupancyLine }}
                </text>
              }
            </g>
          }
        </g>
      }

      <!-- ─── ELEMENTOS DEL RECINTO ─── -->
      @for (vm of showElements() ? scene().elements : []; track vm.el.id) {
        <g [attr.transform]="vm.transform" [class.cursor-move]="interactive()">

          @switch (vm.shape) {

            <!-- Tarima: maciza, con su borde al público y su halo. Es lo que
                 orienta el croquis entero, así que pesa más que todo lo demás. -->
            @case ('escenario') {
              <rect
                x="0" y="0" [attr.width]="vm.el.width" [attr.height]="vm.el.height"
                rx="12"
                [attr.fill]="vm.color + '30'"
                [attr.stroke]="vm.color"
                [attr.stroke-width]="selectedElementId() === vm.el.id ? 3.5 : 2"
                [attr.filter]="mode() === 'miniatura' ? null : 'url(#' + uid + '-glow)'"
                (pointerdown)="onElementPointerDown($event, vm.el)"
              />
              <!-- Franja del frente: el lado por el que se ve el show. -->
              <rect
                [attr.x]="10" [attr.y]="vm.el.height - 9"
                [attr.width]="vm.el.width - 20" height="4" rx="2"
                [attr.fill]="vm.color" opacity="0.85"
                class="pointer-events-none"
              />
              <text
                [attr.x]="vm.el.width / 2" [attr.y]="vm.subtitle ? vm.labelY - 7 : vm.labelY"
                text-anchor="middle" dominant-baseline="middle"
                [attr.font-size]="vm.labelSize"
                font-weight="900" letter-spacing="2.5"
                [attr.fill]="vm.color"
                class="pointer-events-none uppercase"
              >{{ vm.label }}</text>
              @if (vm.subtitle) {
                <text
                  [attr.x]="vm.el.width / 2" [attr.y]="vm.labelY + 11"
                  text-anchor="middle" dominant-baseline="middle"
                  font-size="11" font-weight="700"
                  fill="rgba(229,226,225,0.75)"
                  class="pointer-events-none"
                >{{ vm.subtitle }}</text>
              }
            }

            <!-- Pantalla: panel sobre su soporte, como se ve de frente. -->
            @case ('pantalla') {
              <rect
                x="0" y="0" [attr.width]="vm.el.width" [attr.height]="vm.el.height"
                rx="4"
                [attr.fill]="vm.color + '26'"
                [attr.stroke]="vm.color"
                [attr.stroke-width]="selectedElementId() === vm.el.id ? 3 : 1.8"
                (pointerdown)="onElementPointerDown($event, vm.el)"
              />
              <rect
                x="5" y="5" [attr.width]="vm.el.width - 10" [attr.height]="vm.el.height - 10"
                rx="2" fill="rgba(10,10,10,0.55)" [attr.stroke]="vm.color" stroke-width="0.6" stroke-opacity="0.5"
                class="pointer-events-none"
              />
              <path
                [attr.d]="'M' + (vm.el.width / 2 - 9) + ',' + (vm.el.height + 8) + ' L' + (vm.el.width / 2) + ',' + vm.el.height + ' L' + (vm.el.width / 2 + 9) + ',' + (vm.el.height + 8) + ' Z'"
                [attr.fill]="vm.color" opacity="0.7"
                class="pointer-events-none"
              />
              @if (showLabels()) {
                <text
                  [attr.x]="vm.el.width / 2" [attr.y]="vm.el.height + 20"
                  text-anchor="middle" dominant-baseline="middle"
                  [attr.font-size]="vm.labelSize" font-weight="800"
                  [attr.fill]="vm.color"
                  class="pointer-events-none"
                >{{ vm.label }}</text>
              }
            }

            <!-- Nota suelta sobre el plano. -->
            @case ('texto') {
              <text
                x="0" [attr.y]="vm.el.height / 2"
                dominant-baseline="middle"
                font-size="14" font-weight="800"
                [attr.fill]="vm.color"
                (pointerdown)="onElementPointerDown($event, vm.el)"
              >{{ vm.el.label }}</text>
            }

            <!-- Módulo: caja con el ícono de lo que es. El ícono hace el trabajo
                 que antes hacía leer la etiqueta. -->
            @default {
              <rect
                x="0" y="0" [attr.width]="vm.el.width" [attr.height]="vm.el.height"
                rx="9"
                [attr.fill]="vm.color + '24'"
                [attr.stroke]="vm.color"
                [attr.stroke-width]="selectedElementId() === vm.el.id ? 2.8 : 1.4"
                [attr.stroke-opacity]="selectedElementId() === vm.el.id ? 1 : 0.75"
                (pointerdown)="onElementPointerDown($event, vm.el)"
              />
              @if (vm.showIcon) {
                <text
                  [attr.x]="vm.el.width / 2" [attr.y]="vm.iconY"
                  text-anchor="middle" dominant-baseline="central"
                  font-family="Material Symbols Outlined"
                  [attr.font-size]="vm.iconSize"
                  [attr.fill]="vm.color"
                  class="pointer-events-none"
                >{{ vm.icon }}</text>
              }
              @if (showLabels()) {
                @if (vm.labelOutside) {
                  <!-- Fondo bajo la etiqueta: fuera de la caja puede caer encima
                       de butacas y sin él se vuelve ilegible. -->
                  <rect
                    [attr.x]="vm.el.width / 2 - labelBoxWidth(vm) / 2"
                    [attr.y]="vm.labelY - vm.labelSize"
                    [attr.width]="labelBoxWidth(vm)" [attr.height]="vm.labelSize + 6"
                    rx="4" fill="rgba(13,13,13,0.8)"
                    class="pointer-events-none"
                  />
                }
                <text
                  [attr.x]="vm.el.width / 2" [attr.y]="vm.labelY"
                  text-anchor="middle" dominant-baseline="central"
                  [attr.font-size]="vm.labelSize" font-weight="800"
                  [attr.fill]="vm.color"
                  class="pointer-events-none"
                >{{ vm.label }}</text>
              }
            }
          }
        </g>
      }

      <!-- ─── CAPA DE SELECCIÓN ─── -->
      @if (mode() === 'editor') {
        @for (mark of selectionMarks(); track mark.key) {
          <rect
            [attr.x]="mark.x" [attr.y]="mark.y"
            [attr.width]="mark.size" [attr.height]="mark.size"
            rx="4" fill="none" stroke="#f2ca50" stroke-width="2.2"
            class="pointer-events-none"
          />
        }

        @if (selectedBox(); as box) {
          <g class="pointer-events-none">
            <rect
              [attr.x]="box.x" [attr.y]="box.y" [attr.width]="box.width" [attr.height]="box.height"
              fill="none" stroke="#f2ca50" stroke-width="1.5" stroke-dasharray="7 5" opacity="0.9"
            />
          </g>
          <!-- Tirador de tamaño: solo la esquina inferior derecha. Cuatro
               tiradores en un croquis lleno de butacas estorban más de lo que
               ayudan; para lo demás está el inspector. -->
          <rect
            [attr.x]="box.x + box.width - 9" [attr.y]="box.y + box.height - 9"
            width="18" height="18" rx="5"
            fill="#f2ca50" stroke="#131313" stroke-width="1.5"
            class="cursor-nwse-resize"
            (pointerdown)="onResizeHandleDown($event)"
          />
        }

        @if (marquee(); as m) {
          <rect
            [attr.x]="m.x" [attr.y]="m.y" [attr.width]="m.width" [attr.height]="m.height"
            fill="rgba(242,202,80,0.12)" stroke="#f2ca50" stroke-width="1.5" stroke-dasharray="6 4"
            class="pointer-events-none"
          />
        }
      }
    </svg>
  `
})
export class CroquisCanvasComponent {
  plan = input.required<CroquisPlan>();
  tiers = input<CroquisTier[]>([]);
  /** Cartel del evento, para nombrar al grupo que toca en cada escenario. */
  lineup = input<{ id: string; name: string }[]>([]);
  mode = input<CroquisMode>('miniatura');
  colorBy = input<CroquisColorBy>('categoria');
  tool = input<CroquisTool>('seleccionar');
  showGrid = input<boolean>(true);
  /** Rejilla de imantado, en unidades de croquis. 0 la desactiva. */
  gridSize = input<number>(20);

  selectedAreaId = input<string | null>(null);
  selectedElementId = input<string | null>(null);
  selectedTableId = input<string | null>(null);
  selectedSeats = input<Set<string>>(new Set<string>());

  // ─── Capas de información ───
  // Apagadas por defecto salvo las que siempre hicieron falta. Cada una añade
  // datos al croquis sin mover nada de lo que ya estaba: el que dibuja las
  // enciende cuando quiere las cifras y las apaga cuando quiere el plano limpio.
  showRowLabels = input<boolean>(true);
  showSeatNumbers = input<boolean>(false);
  showElements = input<boolean>(true);
  /** Añade la taquilla de cada área a su etiqueta. */
  showPrices = input<boolean>(false);
  /** Añade la barra de vendidos de cada área a su etiqueta. */
  showOccupancy = input<boolean>(false);
  /** Sin esto, ninguna cifra de dinero se dibuja. */
  canViewFinances = input<boolean>(true);

  // ─── Solo modo cliente ───
  /**
   * Categoría que el comprador está eligiendo. Las butacas de las demás se
   * apagan, igual que en el portal: sin eso, un plano con cuatro categorías
   * son cuatro colores compitiendo y no se ve dónde puede comprar uno.
   */
  activeTierId = input<string>('');
  /** Butacas que este cliente ya tiene compradas, para distinguirlas. */
  mySeats = input<Set<string>>(new Set<string>());

  // ─── Salidas ───
  selectArea = output<string | null>();
  selectElement = output<string | null>();
  seatsPicked = output<{ seats: SeatRef[]; additive: boolean }>();
  areaDrawn = output<AreaDraft>();
  elementDropped = output<CroquisPoint>();
  areaMoved = output<BoxChange>();
  elementMoved = output<BoxChange>();
  /** Lugares arrastrados a mano dentro de su área. */
  seatsMoved = output<SeatMove>();
  /** Mesa seleccionada en el editor. */
  selectTable = output<{ areaId: string; tableId: string } | null>();
  /** Mesa arrastrada a otro sitio del área. */
  tableMoved = output<{ areaId: string; tableId: string; dx: number; dy: number }>();
  /** Clic de compra en la vista del cliente. */
  seatActivated = output<SeatRef>();
  /** Clic sobre la mesa en la vista del cliente: se renta completa. */
  tableActivated = output<{ areaId: string; tableId: string }>();

  @ViewChild('svg') private svgRef?: ElementRef<SVGSVGElement>;

  readonly uid = `cq${++canvasSeq}`;

  /** Ventana visible del lienzo. Zoom y paneo mueven esto, no el contenido. */
  private view = signal<{ x: number; y: number; width: number; height: number } | null>(null);
  marquee = signal<{ x: number; y: number; width: number; height: number } | null>(null);

  private drag = signal<{
    kind: 'panear' | 'mover-area' | 'mover-elemento' | 'dibujar-area' | 'marco' | 'redimensionar';
    startPlan: CroquisPoint;
    startClient: CroquisPoint;
    origin: BoxChange;
    additive: boolean;
  } | null>(null);

  /** Verdadero mientras se pinta o se borran butacas arrastrando. */
  private painting = signal(false);

  /**
   * Arrastre de lugares en curso.
   *
   * El corrimiento vive aquí y no en el croquis mientras dura el gesto: la
   * escena lo suma al pintar, así que la butaca sigue al cursor sin que el plano
   * se toque ni una sola vez hasta que se suelta. Antes de esto la única forma
   * de mover algo era emitir un cambio por cada movimiento del mouse, que es lo
   * que hacen las áreas —y por eso deshacer una arrastrada de área cuesta
   * cincuenta pasos.
   *
   * `origins` y `anchors` se calculan una vez al empezar: son los lugares que se
   * mueven y los que se quedan quietos, que es contra lo que se imanta.
   */
  private seatMove = signal<{
    areaId: string;
    refs: SeatRef[];
    keys: Set<string>;
    /** Posición local de cada lugar que se mueve, al empezar el gesto. */
    origins: CroquisPoint[];
    /** Lugar agarrado con el cursor; es el que se imanta. */
    anchor: CroquisPoint;
    /** Lugares del área que no se mueven; contra ellos se alinea. */
    anchors: CroquisPoint[];
    startPlan: CroquisPoint;
    /** Con Alt se mueve libre, sin imantado. */
    free: boolean;
    dx: number;
    dy: number;
  } | null>(null);

  /**
   * Arrastre de una mesa completa, con sus sillas detrás.
   *
   * Mismo trato que el de los lugares y por la misma razón: acomodar un salón
   * son treinta arrastres seguidos, y si cada movimiento del mouse fuera un
   * cambio guardado, deshacer uno solo costaría cien Ctrl+Z.
   */
  private tableMove = signal<{
    areaId: string;
    tableId: string;
    startPlan: CroquisPoint;
    /** Sillas de la mesa al empezar; son las que no pueden salirse del área. */
    origins: CroquisPoint[];
    dx: number;
    dy: number;
  } | null>(null);

  interactive = computed(() => this.mode() === 'editor');
  /**
   * El plano se puede acercar y arrastrar también en la vista del cliente.
   * En un recinto de ocho mil lugares, sin zoom la butaca mide tres píxeles y
   * elegir la propia es imposible.
   */
  navigable = computed(() => this.mode() !== 'miniatura');
  showLabels = computed(() => this.mode() !== 'miniatura');
  showSeatLabels = computed(() => this.mode() !== 'miniatura');
  seatsClickable = computed(() => this.mode() !== 'miniatura');

  /**
   * Ventana visible por defecto.
   *
   * Lleva un margen alrededor del lienzo a propósito: las etiquetas de las áreas
   * y de los módulos se dibujan *fuera* de su caja, así que un elemento pegado al
   * borde del plano se quedaría con su nombre recortado contra el filo del SVG.
   */
  viewBox = computed(() => {
    const v = this.view();
    const p = this.plan();
    if (v) return `${v.x} ${v.y} ${v.width} ${v.height}`;
    if (this.mode() === 'miniatura') {
      const b = planBounds(p);
      return `${b.x} ${b.y} ${b.width} ${b.height}`;
    }
    const pad = 30;
    return `${-pad} ${-pad} ${p.width + pad * 2} ${p.height + pad * 2.2}`;
  });

  // ─── Escena ────────────────────────────────────────────────────────────────

  private tierIndex = computed(() => new Map((this.tiers() || []).map(t => [t.id || '', t])));

  /**
   * Toda la geometría resuelta de una vez.
   *
   * Depende del plano, de las categorías y del modo de color; a propósito no
   * depende de la selección, que se pinta encima en su propia capa. Así mover el
   * cursor por el croquis no recalcula miles de butacas.
   */
  scene = computed<{ areas: AreaVM[]; elements: ElementVM[] }>(() => {
    const plan = this.plan();
    const tiers = this.tierIndex();
    const cliente = this.mode() === 'cliente';
    const porVenta = this.colorBy() === 'venta';
    const mini = this.mode() === 'miniatura';

    // En la vista del cliente el número siempre va: el comprador necesita saber
    // qué butaca está eligiendo, no solo dónde está.
    const numbersOn = (this.showSeatNumbers() || cliente) && !mini;
    /**
     * En el editor se dibuja el identificador completo —A1, A2, B12— y no el
     * número pelado.
     *
     * Es la diferencia entre poder revisar el croquis y no poder. La numeración
     * de una butaca solo tiene sentido junto a su fila: viendo "1, 2, 3" en tres
     * renglones seguidos no hay manera de notar que la butaca que se arrastró de
     * la B a la A se quedó contada en la B, que es justo el error que hay que
     * cazar. Al comprador, en cambio, ya se le dice la fila aparte y meterla
     * dentro del cuadrito solo la haría ilegible.
     */
    const fullLabels = this.showSeatNumbers() && this.mode() === 'editor';
    const picked = this.selectedSeats();
    const mine = this.mySeats();
    const activeTier = this.activeTierId();
    const dinero = this.showPrices() && this.canViewFinances() && !mini;
    const ocupacion = this.showOccupancy() && !mini;

    const moving = this.seatMove();

    const areas: AreaVM[] = plan.areas.map(area => {
      const tier = area.tierId ? tiers.get(area.tierId) : undefined;
      const color = tier?.color || '#99907c';

      // Corrimiento en vivo del arrastre. Solo aplica al área agarrada: mover
      // lugares de dos zonas a la vez no significaría nada, porque cada área
      // numera los suyos.
      const shift = moving && moving.areaId === area.id ? moving : null;

      /** Un lugar pintado, venga de una fila o de una mesa. */
      const paintSeat = (
        seat: CroquisSeat,
        groupId: string,
        groupLabel: string,
        index: number,
        point: CroquisPoint,
        ownTier: CroquisTier | undefined,
        atTable = false
      ): SeatVM | null => {
        // En la vista del cliente una butaca bloqueada no existe: no es un
        // lugar "no disponible", es piso del recinto.
        if (cliente && seat.status === 'bloqueado') return null;

        const key = `${area.id}|${groupId}|${index}`;
        const estado = cliente
          ? {
              seleccionada: picked.has(key),
              mia: mine.has(key),
              activa: !activeTier || (ownTier?.id || '') === activeTier
            }
          : undefined;
        const paint = this.seatPaint(seat, ownTier?.color || color, porVenta, cliente, estado);

        // La silla de una mesa se queda con su número a secas: el nombre de la
        // mesa es "Mesa 12" y no cabe dentro de un cuadrito de dieciséis
        // unidades. Ahí el identificador lo da la mesa, que lo lleva escrito
        // encima en letra grande.
        const label = numbersOn
          ? (fullLabels && !atTable ? `${groupLabel}${seat.number}` : seat.number)
          : '';

        return {
          key,
          ref: { areaId: area.id, rowId: groupId, index },
          x: point.x - SEAT_SIZE / 2,
          y: point.y - SEAT_SIZE / 2,
          size: SEAT_SIZE,
          fill: paint.fill,
          stroke: paint.stroke,
          opacity: paint.opacity,
          number: label,
          numberSize: seatLabelSize(label),
          numberWidth: label.length > 2 ? SEAT_LABEL_WIDTH : null,
          numberFill: cliente
            ? (estado?.mia ? '#052e21' : estado?.seleccionada ? '#121212'
              : estado?.activa && seat.status !== 'vendido' && seat.status !== 'apartado'
                ? (ownTier?.color || color) : 'rgba(255,255,255,0.18)')
            : readableOn(paint.fill),
          cushion: cliente && seat.status !== 'vendido' && seat.status !== 'apartado',
          title: this.seatTitle(area, groupLabel, seat, ownTier, atTable)
        };
      };

      const rows: RowVM[] = area.kind === 'butacas'
        ? area.rows.map(row => {
            const seats: SeatVM[] = [];
            // La letra se ancla al lugar más a la izquierda y no al primero del
            // arreglo: con butacas movidas a mano el primero puede haber
            // acabado en la otra punta, y la letra se iría con él.
            let anchorX = Infinity;
            let anchorY = row.y;

            for (let i = 0; i < row.seats.length; i++) {
              const seat = row.seats[i];
              const base = seatLocalPoint(area, row, i);
              const p = shift?.keys.has(`${area.id}|${row.id}|${i}`)
                ? { x: base.x + shift.dx, y: base.y + shift.dy }
                : base;

              const vm = paintSeat(seat, row.id, row.label, i, p, seat.tierId ? tiers.get(seat.tierId) : tier);
              if (!vm) continue;

              if (p.x < anchorX) { anchorX = p.x; anchorY = p.y; }
              seats.push(vm);
            }

            return {
              id: row.id,
              label: row.label,
              labelX: (anchorX === Infinity ? row.x : anchorX) - SEAT_SIZE,
              labelY: anchorY,
              seats
            };
          })
        : [];

      const dragging = this.tableMove();
      const tableShift = dragging && dragging.areaId === area.id ? dragging : null;

      const tables: TableVM[] = (area.tables || []).map(table => {
        // El corrimiento del arrastre llega en coordenadas del área; dentro del
        // grupo de la mesa hay que deshacerle el giro o una mesa torcida
        // mandaría la silla en diagonal respecto del cursor.
        const localShift = shift
          ? rotatePoint({ x: shift.dx, y: shift.dy }, { x: 0, y: 0 }, -(table.rotation || 0))
          : null;

        const tableTier = table.tierId ? tiers.get(table.tierId) : tier;
        const tableColor = tableTier?.color || color;
        const oculta = cliente && table.status === 'bloqueada';

        const seats: SeatVM[] = [];
        for (let i = 0; i < table.seats.length; i++) {
          if (oculta) break;
          const seat = table.seats[i];
          const base = tableSeatOffset(table, seat);
          const p = localShift && shift?.keys.has(`${area.id}|${table.id}|${i}`)
            ? { x: base.x + localShift.x, y: base.y + localShift.y }
            : base;

          const vm = paintSeat(
            seat, table.id, table.label, i, p,
            seat.tierId ? tiers.get(seat.tierId) : tableTier,
            true
          );
          if (vm) seats.push(vm);
        }

        const vendibles = table.seats.filter(s => s.status !== 'bloqueado');
        const libres = vendibles.filter(s => !s.status).length;
        const half = table.shape === 'rectangular' ? 0 : table.width / 2;

        const puesta = tableShift?.tableId === table.id
          ? { ...table, x: table.x + tableShift.dx, y: table.y + tableShift.dy }
          : table;

        return {
          table,
          transform: tableTransform(puesta),
          fill: tableColor + (table.status ? '14' : '2e'),
          stroke: tableColor + (table.status ? '55' : 'bb'),
          color: tableColor,
          radius: half,
          boxX: -table.width / 2,
          boxY: -table.height / 2,
          label: fitText(table.label, table.width - 8, 9),
          labelSize: 9,
          badge: mini || !this.showLabels()
            ? ''
            : (table.status === 'bloqueada' ? 'Bloqueada'
              : table.status === 'reservada' ? 'Apartada'
              : `${libres}/${vendibles.length}`),
          whole: table.rental === 'completa',
          dimmed: !!table.status,
          seats,
          title: this.tableTitle(table, tableTier, libres, vendibles.length)
        };
      });

      const info = dinero || ocupacion ? areaInsight(area, tiers) : null;

      const moneyLine = dinero && info
        ? (info.collected > 0
            ? `Taquilla ${compactMoney(info.potential)} · cobrado ${compactMoney(info.collected)}`
            : `Taquilla ${compactMoney(info.potential)}`)
        : '';

      const occupancyLine = ocupacion && info
        ? `${info.sold.toLocaleString('es-MX')} vendidos · ${info.available.toLocaleString('es-MX')} libres`
        : '';

      // El chip solo crece cuando hay capas encendidas: apagadas, mide y pesa
      // exactamente lo mismo que antes de que existieran.
      const chipHeight = 34 + (moneyLine ? 13 : 0) + (occupancyLine ? 20 : 0);
      const label = fitText(area.name, 290, 13);
      const sub = fitText(this.areaSubtitle(area, tier), 290, 10);

      return {
        area,
        transform: areaTransform(area),
        path: areaPath(area),
        fill: color + (area.kind === 'general' ? '1f' : '14'),
        stroke: color + (area.kind === 'general' ? 'cc' : '66'),
        color,
        // El chip no puede crecer sin fin: un área llamada "Gradería lateral
        // poniente cubierta" empujaría la etiqueta fuera del lienzo.
        label,
        sub,
        // En un área de aforo libre el chip va dentro: no hay butacas que tapar
        // y así no invade la zona de arriba, que es lo que pasaba al crecer con
        // las capas encendidas. En las de butacas se queda por fuera, donde no
        // esconde la primera fila —que suele ser la más cara.
        labelY: area.kind === 'general'
          ? 6
          : (area.y > chipHeight + 12 ? -(chipHeight + 4) : 6),
        rows,
        tables,
        moneyLine,
        occupancyLine,
        occupancyPercent: info?.occupancy ?? 0,
        chipHeight,
        chipWidth: Math.max(
          130,
          Math.max(textWidth(label, 13), textWidth(sub, 10), textWidth(moneyLine, 10), textWidth(occupancyLine, 9)) + 26
        )
      };
    });

    const lineup = new Map((this.lineup() || []).map(s => [s.id, s.name]));

    const elements: ElementVM[] = plan.elements.map(el => {
      const meta = elementMeta(el.kind);
      const shape: ElementShape =
        el.kind === 'escenario' ? 'escenario'
        : el.kind === 'pantalla' ? 'pantalla'
        : el.kind === 'texto' ? 'texto'
        : 'modulo';

      // Un módulo chico no tiene dónde poner el ícono y la etiqueta juntos, así
      // que la etiqueta se va por debajo de la caja. Es lo que hace que una
      // bocina de 44 unidades se siga entendiendo sin tener que agrandarla.
      const compact = el.height < 58 || el.width < 74;
      // Dentro de la caja el ícono comparte el espacio con la etiqueta, así que
      // se queda más chico: un ícono que roza el texto se lee como una mancha.
      const iconSize = Math.max(12, Math.min(30, Math.min(el.width, el.height) * (compact ? 0.54 : 0.38)));
      const labelSize = shape === 'escenario'
        ? Math.max(12, Math.min(mini ? 26 : 18, el.height * 0.24))
        : (mini ? 11 : 10);

      const inside = shape === 'escenario' || (!compact && shape !== 'pantalla');
      const labelWidth = inside ? el.width - 14 : Math.max(el.width, 110);

      return {
        el,
        transform: elementTransform(el),
        color: el.color || meta.color,
        icon: meta.icon,
        shape,
        label: fitText(el.label, labelWidth, labelSize),
        labelSize,
        labelY: shape === 'escenario'
          ? el.height / 2
          : inside ? el.height - labelSize * 0.9 : el.height + labelSize + 3,
        labelAnchor: 'middle',
        labelOutside: !inside,
        showIcon: shape === 'modulo' && !mini,
        iconSize,
        iconY: inside ? (el.height - labelSize * 1.9) / 2 : el.height / 2,
        subtitle: el.lineupSlotId ? lineup.get(el.lineupSlotId) || '' : ''
      };
    });

    return { areas, elements };
  });

  /** Recuadros de las butacas seleccionadas: capa aparte, barata de recalcular. */
  selectionMarks = computed(() => {
    const picked = this.selectedSeats();
    if (!picked.size) return [] as { key: string; x: number; y: number; size: number }[];

    // El corrimiento del arrastre en curso también se aplica aquí: si no, el
    // recuadro dorado se quedaría clavado donde estaba la butaca mientras la
    // butaca ya va con el cursor.
    const moving = this.seatMove();

    const out: { key: string; x: number; y: number; size: number }[] = [];
    const mark = (key: string, p: CroquisPoint) =>
      out.push({ key, x: p.x - SEAT_SIZE / 2 - 2, y: p.y - SEAT_SIZE / 2 - 2, size: SEAT_SIZE + 4 });

    for (const area of this.plan().areas) {
      const shift = moving && moving.areaId === area.id ? moving : null;
      const nudge = (p: CroquisPoint, key: string) => {
        if (!shift?.keys.has(key)) return p;
        const d = rotatePoint({ x: shift.dx, y: shift.dy }, { x: 0, y: 0 }, area.rotation || 0);
        return { x: p.x + d.x, y: p.y + d.y };
      };

      for (const row of area.rows) {
        for (let i = 0; i < row.seats.length; i++) {
          const key = `${area.id}|${row.id}|${i}`;
          if (!picked.has(key)) continue;
          mark(key, nudge(seatPlanPoint(area, row, i), key));
        }
      }

      for (const table of area.tables || []) {
        for (let i = 0; i < table.seats.length; i++) {
          const key = `${area.id}|${table.id}|${i}`;
          if (!picked.has(key)) continue;
          mark(key, nudge(tableSeatPlanPoint(area, table, table.seats[i]), key));
        }
      }
    }
    return out;
  });

  /** Caja de lo seleccionado, en coordenadas del plano. */
  selectedBox = computed<BoxChange | null>(() => {
    const areaId = this.selectedAreaId();
    if (areaId) {
      const a = this.plan().areas.find(x => x.id === areaId);
      return a ? { id: a.id, x: a.x, y: a.y, width: a.width, height: a.height } : null;
    }
    const elId = this.selectedElementId();
    if (elId) {
      const e = this.plan().elements.find(x => x.id === elId);
      return e ? { id: e.id, x: e.x, y: e.y, width: e.width, height: e.height } : null;
    }
    return null;
  });

  // ─── Pintado de butacas ────────────────────────────────────────────────────

  /**
   * De qué color va cada butaca.
   *
   * El modo cliente reproduce exactamente los cuatro estados del portal —
   * disponible, seleccionada, mi asiento y ocupada— porque es literalmente la
   * misma pantalla: lo que el organizador ve en la vista previa es lo que el
   * comprador tendrá enfrente, y cualquier diferencia de color aquí sería una
   * sorpresa el día de la venta.
   */
  private seatPaint(
    seat: CroquisSeat,
    color: string,
    porVenta: boolean,
    cliente: boolean,
    estado?: { seleccionada: boolean; mia: boolean; activa: boolean }
  ) {
    if (seat.status === 'bloqueado') {
      return { fill: '#2a2a2a', stroke: '#4d4635', opacity: 1 };
    }

    if (cliente) {
      if (estado?.mia) return { fill: '#10B981', stroke: '#10B981', opacity: 1 };
      if (estado?.seleccionada) return { fill: '#F2CA50', stroke: '#F2CA50', opacity: 1 };

      if (seat.status === 'vendido' || seat.status === 'apartado') {
        return { fill: 'rgba(255,255,255,0.06)', stroke: 'rgba(255,255,255,0.05)', opacity: 1 };
      }

      // Disponible pero de otra categoría: se atenúa en vez de esconderse, para
      // que el comprador siga viendo la forma completa del recinto.
      if (estado && !estado.activa) {
        return { fill: 'rgba(255,255,255,0.02)', stroke: 'rgba(255,255,255,0.06)', opacity: 1 };
      }

      // Disponible de la categoría elegida: contorno de su color sobre fondo
      // tenue, como en el portal.
      return { fill: color + '1f', stroke: color, opacity: 1 };
    }

    if (porVenta) {
      if (seat.status === 'vendido') return { fill: '#f87171', stroke: '#7f1d1d', opacity: 1 };
      if (seat.status === 'apartado') return { fill: '#fbbf24', stroke: '#78350f', opacity: 1 };
      return { fill: '#34d399', stroke: '#065f46', opacity: 1 };
    }

    // Modo categoría: el vendido se apaga para que el color siga leyéndose como
    // "esta butaca pertenece a tal boleto" sin fingir que está disponible.
    if (seat.status === 'vendido') return { fill: color, stroke: '#131313', opacity: 0.32 };
    if (seat.status === 'apartado') return { fill: color, stroke: '#fbbf24', opacity: 0.6 };
    return { fill: color, stroke: '#131313', opacity: 1 };
  }

  private seatTitle(area: CroquisArea, groupLabel: string, seat: CroquisSeat, tier: CroquisTier | undefined, atTable: boolean): string {
    const estado = seat.status === 'vendido' ? 'Vendido'
      : seat.status === 'apartado' ? 'Apartado'
      : seat.status === 'bloqueado' ? 'Bloqueado (no se vende)'
      : 'Disponible';
    const precio = tier ? ` · $${(tier.price || 0).toLocaleString('es-MX')}` : '';
    // La silla de una mesa se pide por su mesa y su lugar, no por fila y butaca:
    // es lo que dice el boleto y lo que pregunta quien llega al salón.
    const donde = atTable
      ? `${groupLabel}, lugar ${seat.number}`
      : `Fila ${groupLabel}, Butaca ${seat.number}`;
    return `${area.name} · ${donde}\n${tier?.name || 'Sin categoría'}${precio} · ${estado}`;
  }

  private tableTitle(table: CroquisTable, tier: CroquisTier | undefined, libres: number, total: number): string {
    const venta = table.rental === 'completa'
      ? 'Se renta completa'
      : `Se venden sillas sueltas (mínimo ${Math.max(1, table.minSeats || 1)})`;
    const estado = table.status === 'bloqueada' ? 'Fuera de la venta'
      : table.status === 'reservada' ? `Apartada${table.holder ? ` · ${table.holder}` : ''}`
      : `${libres} de ${total} lugares libres`;
    const precio = table.price
      ? ` · $${table.price.toLocaleString('es-MX')} la mesa`
      : tier ? ` · $${(tier.price || 0).toLocaleString('es-MX')} por lugar` : '';
    return `${table.label} · ${total} lugares\n${venta}${precio}\n${estado}`;
  }

  private areaSubtitle(area: CroquisArea, tier?: CroquisTier): string {
    const cap = areaCapacity(area).toLocaleString('es-MX');
    const sold = areaSold(area);
    const precio = tier ? ` · $${(tier.price || 0).toLocaleString('es-MX')}` : ' · sin categoría';

    if (area.kind === 'mesas') {
      const mesas = (area.tables || []).length;
      return `${mesas} mesa(s) · ${cap} lugares${sold ? ` · ${sold} vendidos` : ''}${precio}`;
    }

    const kind = area.kind === 'general' ? 'aforo libre' : 'butacas';
    return `${cap} ${kind}${sold ? ` · ${sold} vendidos` : ''}${precio}`;
  }

  /** Fondo de la etiqueta de un módulo cuando cae fuera de su caja. */
  labelBoxWidth(vm: ElementVM): number {
    return textWidth(vm.label, vm.labelSize) + 12;
  }

  // ─── Zoom y paneo ──────────────────────────────────────────────────────────

  private currentView(): { x: number; y: number; width: number; height: number } {
    const v = this.view();
    if (v) return v;
    const p = this.plan();
    const pad = 30;
    return { x: -pad, y: -pad, width: p.width + pad * 2, height: p.height + pad * 2.2 };
  }

  fit(): void {
    this.view.set(null);
  }

  zoomBy(factor: number, center?: CroquisPoint): void {
    const v = this.currentView();
    const p = this.plan();
    const width = Math.min(p.width * 3, Math.max(p.width * 0.12, v.width / factor));
    const scale = width / v.width;
    const height = v.height * scale;
    const cx = center?.x ?? v.x + v.width / 2;
    const cy = center?.y ?? v.y + v.height / 2;

    this.view.set({
      x: cx - (cx - v.x) * scale,
      y: cy - (cy - v.y) * scale,
      width,
      height
    });
  }

  zoomPercent = computed(() => {
    const v = this.view();
    if (!v) return 100;
    return Math.round((this.plan().width / v.width) * 100);
  });

  onWheel(event: WheelEvent): void {
    if (!this.navigable()) return;
    event.preventDefault();
    this.zoomBy(event.deltaY < 0 ? 1.14 : 1 / 1.14, this.toPlan(event));
  }

  // ─── Conversión de coordenadas ─────────────────────────────────────────────

  /**
   * Punto del mouse en coordenadas del plano.
   *
   * `preserveAspectRatio="xMidYMid meet"` deja bandas vacías cuando el contenedor
   * y el viewBox no tienen la misma proporción; sin descontarlas, todo lo que se
   * dibuje con el mouse quedaría corrido. Por eso se calcula la escala real y se
   * centra a mano en vez de dividir por el ancho del contenedor.
   */
  private toPlan(event: { clientX: number; clientY: number }): CroquisPoint {
    const svg = this.svgRef?.nativeElement;
    const v = this.currentView();
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / v.width, rect.height / v.height) || 1;
    const offsetX = (rect.width - v.width * scale) / 2;
    const offsetY = (rect.height - v.height * scale) / 2;

    return {
      x: v.x + (event.clientX - rect.left - offsetX) / scale,
      y: v.y + (event.clientY - rect.top - offsetY) / scale
    };
  }

  /**
   * Retiene el puntero para que el arrastre siga funcionando aunque el cursor
   * se salga del elemento. Va envuelto porque `setPointerCapture` lanza si el
   * puntero ya no está activo, y esa excepción abortaría la selección entera.
   */
  private capture(event: PointerEvent): void {
    try {
      (event.target as Element).setPointerCapture?.(event.pointerId);
    } catch {
      /* el arrastre sigue funcionando sin captura */
    }
  }

  private snapped(point: CroquisPoint): CroquisPoint {
    const g = this.gridSize();
    return { x: snap(point.x, g), y: snap(point.y, g) };
  }

  // ─── Interacción ───────────────────────────────────────────────────────────

  onPointerDown(event: PointerEvent): void {
    // En la vista del cliente el fondo solo sirve para moverse por el plano:
    // no hay herramientas ni selección de zonas que valga la pena disparar.
    if (!this.interactive()) {
      if (!this.navigable()) return;
      this.capture(event);
      this.drag.set({
        kind: 'panear',
        startPlan: this.toPlan(event),
        startClient: { x: event.clientX, y: event.clientY },
        origin: { id: '', x: 0, y: 0, width: 0, height: 0 },
        additive: false
      });
      return;
    }

    const point = this.toPlan(event);
    const origin: BoxChange = { id: '', x: 0, y: 0, width: 0, height: 0 };
    const startClient = { x: event.clientX, y: event.clientY };
    this.capture(event);

    // Botón central o secundario siempre panean, sin importar la herramienta:
    // en un croquis con zoom, moverse es la acción más frecuente de todas.
    if (event.button === 1 || event.button === 2 || event.shiftKey) {
      this.drag.set({ kind: 'panear', startPlan: point, startClient, origin, additive: false });
      return;
    }

    const tool = this.tool();

    if (tool === 'elemento') {
      this.elementDropped.emit(this.snapped(point));
      return;
    }

    if (tool === 'area-butacas' || tool === 'area-mesas' || tool === 'area-general') {
      this.drag.set({ kind: 'dibujar-area', startPlan: this.snapped(point), startClient, origin, additive: false });
      this.marquee.set({ x: point.x, y: point.y, width: 0, height: 0 });
      return;
    }

    // Herramienta de selección sobre el piso: marco de selección de butacas y,
    // de paso, deseleccionar lo que estuviera activo.
    this.drag.set({ kind: 'marco', startPlan: point, startClient, origin, additive: event.ctrlKey || event.metaKey });
    this.marquee.set({ x: point.x, y: point.y, width: 0, height: 0 });

    if (!(event.ctrlKey || event.metaKey)) {
      this.selectArea.emit(null);
      this.selectElement.emit(null);
      this.selectTable.emit(null);
      this.seatsPicked.emit({ seats: [], additive: false });
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (this.seatMove()) {
      this.updateSeatMove(event);
      return;
    }
    if (this.tableMove()) {
      this.updateTableMove(event);
      return;
    }

    const drag = this.drag();
    if (!drag) return;

    const point = this.toPlan(event);

    switch (drag.kind) {
      case 'panear': {
        const v = this.currentView();
        const svg = this.svgRef?.nativeElement;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const scale = Math.min(rect.width / v.width, rect.height / v.height) || 1;
        this.view.set({
          ...v,
          x: v.x - (event.clientX - drag.startClient.x) / scale,
          y: v.y - (event.clientY - drag.startClient.y) / scale
        });
        this.drag.set({ ...drag, startClient: { x: event.clientX, y: event.clientY } });
        return;
      }

      case 'dibujar-area':
      case 'marco': {
        this.marquee.set(boxFromDrag(drag.startPlan, drag.kind === 'dibujar-area' ? this.snapped(point) : point));
        return;
      }

      case 'mover-area':
      case 'mover-elemento': {
        const dx = point.x - drag.startPlan.x;
        const dy = point.y - drag.startPlan.y;
        const box: BoxChange = {
          ...drag.origin,
          x: snap(drag.origin.x + dx, this.gridSize()),
          y: snap(drag.origin.y + dy, this.gridSize())
        };
        if (drag.kind === 'mover-area') this.areaMoved.emit(box);
        else this.elementMoved.emit(box);
        return;
      }

      case 'redimensionar': {
        const box: BoxChange = {
          ...drag.origin,
          width: Math.max(60, snap(point.x - drag.origin.x, this.gridSize())),
          height: Math.max(50, snap(point.y - drag.origin.y, this.gridSize()))
        };
        if (this.selectedAreaId()) this.areaMoved.emit(box);
        else this.elementMoved.emit(box);
        return;
      }
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (this.endSeatMove() || this.endTableMove()) {
      this.painting.set(false);
      return;
    }

    const drag = this.drag();
    this.painting.set(false);
    this.drag.set(null);

    const box = this.marquee();
    this.marquee.set(null);
    if (!drag || !box) return;

    if (drag.kind === 'dibujar-area') {
      if (box.width < 60 || box.height < 50) return;
      const tool = this.tool();
      this.areaDrawn.emit({
        kind: tool === 'area-general' ? 'general' : tool === 'area-mesas' ? 'mesas' : 'butacas',
        x: box.x, y: box.y, width: box.width, height: box.height
      });
      return;
    }

    if (drag.kind === 'marco') {
      if (box.width < 4 && box.height < 4) return;
      this.seatsPicked.emit({ seats: this.seatsInBox(box), additive: drag.additive });
    }
  }

  /** Lugares que cayeron dentro del marco, en coordenadas del plano. */
  private seatsInBox(box: { x: number; y: number; width: number; height: number }): SeatRef[] {
    const out: SeatRef[] = [];
    for (const area of this.plan().areas) {
      for (const row of area.rows) {
        for (let i = 0; i < row.seats.length; i++) {
          if (pointInBox(seatPlanPoint(area, row, i), box)) {
            out.push({ areaId: area.id, rowId: row.id, index: i });
          }
        }
      }
      for (const table of area.tables || []) {
        for (let i = 0; i < table.seats.length; i++) {
          if (pointInBox(tableSeatPlanPoint(area, table, table.seats[i]), box)) {
            out.push({ areaId: area.id, rowId: table.id, index: i });
          }
        }
      }
    }
    return out;
  }

  /**
   * Clic dentro del área.
   *
   * Selecciona el área, pero si se arrastra abre un marco de selección de
   * butacas en vez de mover el área. Es al revés de lo que hace un editor de
   * dibujo, y a propósito: en un croquis las áreas se acomodan una vez y las
   * butacas se tocan todo el tiempo. Si el interior moviera el área, tocar
   * cincuenta butacas de una fila sería imposible sin salirse del croquis. Para
   * mover el área está su etiqueta, que funciona como tirador.
   */
  onAreaPointerDown(event: PointerEvent, area: CroquisArea): void {
    if (!this.interactive()) return;
    if (this.tool() !== 'seleccionar') return;
    event.stopPropagation();

    this.selectArea.emit(area.id);
    this.selectElement.emit(null);
    this.selectTable.emit(null);
    this.capture(event);

    const point = this.toPlan(event);
    this.drag.set({
      kind: 'marco',
      startPlan: point,
      startClient: { x: event.clientX, y: event.clientY },
      origin: { id: area.id, x: area.x, y: area.y, width: area.width, height: area.height },
      additive: event.ctrlKey || event.metaKey
    });
    this.marquee.set({ x: point.x, y: point.y, width: 0, height: 0 });
  }

  onAreaLabelPointerDown(event: PointerEvent, area: CroquisArea): void {
    if (!this.interactive()) return;
    if (this.tool() !== 'seleccionar') return;
    event.stopPropagation();

    this.selectArea.emit(area.id);
    this.selectElement.emit(null);
    this.selectTable.emit(null);
    this.capture(event);
    this.drag.set({
      kind: 'mover-area',
      startPlan: this.toPlan(event),
      startClient: { x: event.clientX, y: event.clientY },
      origin: { id: area.id, x: area.x, y: area.y, width: area.width, height: area.height },
      additive: false
    });
  }

  onElementPointerDown(event: PointerEvent, el: CroquisElement): void {
    if (!this.interactive()) return;
    if (this.tool() !== 'seleccionar') return;
    event.stopPropagation();

    this.selectElement.emit(el.id);
    this.selectArea.emit(null);
    this.selectTable.emit(null);
    this.capture(event);
    this.drag.set({
      kind: 'mover-elemento',
      startPlan: this.toPlan(event),
      startClient: { x: event.clientX, y: event.clientY },
      origin: { id: el.id, x: el.x, y: el.y, width: el.width, height: el.height },
      additive: false
    });
  }

  onResizeHandleDown(event: PointerEvent): void {
    const box = this.selectedBox();
    if (!box) return;
    event.stopPropagation();
    this.capture(event);
    this.drag.set({
      kind: 'redimensionar',
      startPlan: this.toPlan(event),
      startClient: { x: event.clientX, y: event.clientY },
      origin: box,
      additive: false
    });
  }

  onSeatPointerDown(event: PointerEvent, ref: SeatRef): void {
    if (this.mode() === 'miniatura') return;

    if (this.mode() === 'cliente') {
      event.stopPropagation();
      this.seatActivated.emit(ref);
      return;
    }

    event.stopPropagation();

    // Shift sobre un lugar lo arrastra. Sobre el piso del croquis Shift sigue
    // moviendo el plano, que es lo que uno espera del fondo; aquí el gesto es
    // sobre la butaca en concreto y no hay ninguna ambigüedad.
    if (event.shiftKey && this.tool() === 'seleccionar' && event.button === 0) {
      this.startSeatMove(event, ref);
      return;
    }

    // Pintar y quitar butacas funcionan arrastrando: es la única forma cómoda de
    // tocar cincuenta butacas seguidas sin dar cincuenta clics.
    this.painting.set(this.tool() === 'pintar' || this.tool() === 'quitar-butacas');
    this.seatsPicked.emit({ seats: [ref], additive: event.ctrlKey || event.metaKey || this.painting() });
  }

  onSeatEnter(event: PointerEvent, ref: SeatRef): void {
    if (!this.painting()) return;
    this.seatsPicked.emit({ seats: [ref], additive: true });
  }

  /**
   * Clic sobre el tablero de una mesa.
   *
   * En el editor la selecciona para editarla; en la vista del cliente la renta,
   * pero solo cuando se vende completa: si sus sillas se venden sueltas, tocar
   * el tablero no puede significar "me llevo las diez".
   */
  onTablePointerDown(event: PointerEvent, area: CroquisArea, table: CroquisTable): void {
    if (this.mode() === 'miniatura') return;

    if (this.mode() === 'cliente') {
      // Con las sillas a la venta por separado, tocar el tablero no puede
      // significar "me llevo las diez": se deja pasar para que el gesto siga
      // sirviendo para moverse por el plano.
      if (table.rental !== 'completa' || table.status) return;
      event.stopPropagation();
      this.tableActivated.emit({ areaId: area.id, tableId: table.id });
      return;
    }

    if (this.tool() !== 'seleccionar') return;
    event.stopPropagation();
    this.selectTable.emit({ areaId: area.id, tableId: table.id });
    this.selectArea.emit(area.id);
    this.selectElement.emit(null);

    // El tablero es el tirador de la mesa. Al revés que las áreas —cuyo interior
    // se reserva para seleccionar butacas—, aquí no hay nada dentro que
    // seleccionar: la mesa es un objeto que se acomoda, y acomodarla es
    // justamente lo que se hace todo el rato al montar un salón.
    this.capture(event);
    this.tableMove.set({
      areaId: area.id,
      tableId: table.id,
      startPlan: this.toPlan(event),
      origins: table.seats.map(seat => tableSeatLocalPoint(table, seat)),
      dx: 0,
      dy: 0
    });
  }

  // ─── Arrastre de lugares ───────────────────────────────────────────────────

  /**
   * Prepara el arrastre de uno o varios lugares.
   *
   * Si la butaca agarrada ya estaba seleccionada se mueve la selección entera —es
   * como se recorre media fila de un jalón—; si no, se selecciona esa sola y se
   * mueve ella. Los lugares de otras áreas se quedan fuera aunque estén
   * seleccionados: cada área numera los suyos y sacarlos a otra los dejaría sin
   * fila, sin número y sin precio.
   */
  private startSeatMove(event: PointerEvent, ref: SeatRef): void {
    const area = this.plan().areas.find(a => a.id === ref.areaId);
    if (!area) return;

    const grabbed = seatKey(ref);
    const selected = this.selectedSeats();
    const keys = selected.has(grabbed)
      ? new Set([...selected].filter(k => k.startsWith(`${area.id}|`)))
      : new Set([grabbed]);

    if (!selected.has(grabbed)) {
      this.seatsPicked.emit({ seats: [ref], additive: false });
    }

    // Lo que se mueve y lo que se queda quieto, de una vez: el imantado compara
    // contra los lugares que no viajan, y recalcularlos en cada movimiento del
    // mouse haría que arrastrar en un área de mil butacas se sintiera pegajoso.
    const refs: SeatRef[] = [];
    const origins: CroquisPoint[] = [];
    const anchors: CroquisPoint[] = [];
    let anchor: CroquisPoint | null = null;

    const consider = (key: string, index: number, groupId: string, point: CroquisPoint) => {
      if (!keys.has(key)) {
        anchors.push(point);
        return;
      }
      refs.push({ areaId: area.id, rowId: groupId, index });
      origins.push(point);
      if (key === grabbed) anchor = point;
    };

    for (const row of area.rows) {
      for (let i = 0; i < row.seats.length; i++) {
        consider(`${area.id}|${row.id}|${i}`, i, row.id, seatLocalPoint(area, row, i));
      }
    }
    for (const table of area.tables || []) {
      for (let i = 0; i < table.seats.length; i++) {
        consider(`${area.id}|${table.id}|${i}`, i, table.id, tableSeatLocalPoint(table, table.seats[i]));
      }
    }

    if (!refs.length || !anchor) return;

    this.capture(event);
    this.painting.set(false);
    this.seatMove.set({
      areaId: area.id,
      refs,
      keys,
      origins,
      anchor,
      anchors,
      startPlan: this.toPlan(event),
      free: event.altKey,
      dx: 0,
      dy: 0
    });
  }

  /** Sigue el cursor, imanta a los vecinos y frena en el borde del área. */
  private updateSeatMove(event: PointerEvent): void {
    const move = this.seatMove();
    if (!move) return;

    const area = this.plan().areas.find(a => a.id === move.areaId);
    if (!area) return;

    const point = this.toPlan(event);
    let delta = planDeltaToAreaLocal(area, {
      x: point.x - move.startPlan.x,
      y: point.y - move.startPlan.y
    });

    // Alt en cualquier momento del gesto lo vuelve libre y así se queda: quien
    // lo pulsa a medio arrastre es porque ya vio que el imán no lo lleva donde
    // quiere, y soltarlo por levantar el dedo un instante lo devolvería a la
    // fila de la que estaba intentando sacarlo.
    const free = move.free || event.altKey;

    // Se imanta el lugar agarrado y el resto lo sigue: alinear cada uno por su
    // cuenta amontonaría el bloque contra la primera fila que se cruzara.
    if (!free) {
      const target = { x: move.anchor.x + delta.x, y: move.anchor.y + delta.y };
      const snapped = alignToNeighbours(target, move.anchors);
      delta = { x: snapped.x - move.anchor.x, y: snapped.y - move.anchor.y };
    }

    delta = limitSeatDelta(area, move.origins, delta);
    this.seatMove.set({ ...move, free, dx: delta.x, dy: delta.y });
  }

  /** Mueve la mesa entera, frenándola cuando sus sillas llegan al borde. */
  private updateTableMove(event: PointerEvent): void {
    const move = this.tableMove();
    if (!move) return;

    const area = this.plan().areas.find(a => a.id === move.areaId);
    if (!area) return;

    const point = this.toPlan(event);
    const raw = planDeltaToAreaLocal(area, {
      x: point.x - move.startPlan.x,
      y: point.y - move.startPlan.y
    });

    const g = this.gridSize();
    const delta = limitSeatDelta(area, move.origins, {
      x: g > 0 && !event.altKey ? snap(raw.x, g) : raw.x,
      y: g > 0 && !event.altKey ? snap(raw.y, g) : raw.y
    });

    this.tableMove.set({ ...move, dx: delta.x, dy: delta.y });
  }

  private endTableMove(): boolean {
    const move = this.tableMove();
    if (!move) return false;

    this.tableMove.set(null);
    if (Math.abs(move.dx) < 0.5 && Math.abs(move.dy) < 0.5) return true;

    this.tableMoved.emit({
      areaId: move.areaId,
      tableId: move.tableId,
      dx: move.dx,
      dy: move.dy
    });
    return true;
  }

  /** Suelta el arrastre y lo manda al croquis en un solo cambio. */
  private endSeatMove(): boolean {
    const move = this.seatMove();
    if (!move) return false;

    this.seatMove.set(null);
    // Un temblor de medio píxel no es un movimiento: emitirlo dejaría un paso de
    // historial cada vez que alguien selecciona una butaca con Shift puesto.
    if (Math.abs(move.dx) < 0.5 && Math.abs(move.dy) < 0.5) return true;

    this.seatsMoved.emit({
      areaId: move.areaId,
      seats: move.refs,
      dx: move.dx,
      dy: move.dy,
      free: move.free
    });
    return true;
  }
}
