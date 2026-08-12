import {
  Component, ChangeDetectionStrategy, ElementRef, ViewChild,
  computed, input, output, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CroquisArea, CroquisElement, CroquisPlan, CroquisPoint, CroquisSeat,
  CroquisTier, SEAT_SIZE
} from '../../../../core/models/croquis.models';
import {
  areaPath, areaTransform, boxFromDrag, elementTransform,
  planBounds, pointInBox, seatLocalPoint, seatPlanPoint, snap
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
  | 'area-general'
  | 'elemento'
  | 'pintar'
  | 'quitar-butacas';

/** Referencia a una butaca concreta dentro del plano. */
export interface SeatRef {
  areaId: string;
  rowId: string;
  /** Índice dentro de la fila. */
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
  kind: 'butacas' | 'general';
  x: number;
  y: number;
  width: number;
  height: number;
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
                  font-size="7.5" font-weight="800"
                  [attr.fill]="seat.numberFill"
                  [attr.opacity]="seat.opacity"
                  class="pointer-events-none"
                >{{ seat.number }}</text>
              }
            }
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
  /** Clic de compra en la vista del cliente. */
  seatActivated = output<SeatRef>();

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
    const picked = this.selectedSeats();
    const mine = this.mySeats();
    const activeTier = this.activeTierId();
    const dinero = this.showPrices() && this.canViewFinances() && !mini;
    const ocupacion = this.showOccupancy() && !mini;

    const areas: AreaVM[] = plan.areas.map(area => {
      const tier = area.tierId ? tiers.get(area.tierId) : undefined;
      const color = tier?.color || '#99907c';

      const rows: RowVM[] = area.kind === 'butacas'
        ? area.rows.map(row => {
            const first = row.seats.length ? seatLocalPoint(area, row, 0) : { x: row.x, y: row.y };
            const seats: SeatVM[] = [];

            for (let i = 0; i < row.seats.length; i++) {
              const seat = row.seats[i];
              // En la vista del cliente una butaca bloqueada no existe: no es un
              // lugar "no disponible", es piso del recinto.
              if (cliente && seat.status === 'bloqueado') continue;

              const p = seatLocalPoint(area, row, i);
              const key = `${area.id}|${row.id}|${i}`;
              const seatTier = seat.tierId ? tiers.get(seat.tierId) : tier;
              const estado = cliente
                ? {
                    seleccionada: picked.has(key),
                    mia: mine.has(key),
                    activa: !activeTier || (seatTier?.id || '') === activeTier
                  }
                : undefined;
              const paint = this.seatPaint(seat, seatTier?.color || color, porVenta, cliente, estado);

              seats.push({
                key,
                ref: { areaId: area.id, rowId: row.id, index: i },
                x: p.x - SEAT_SIZE / 2,
                y: p.y - SEAT_SIZE / 2,
                size: SEAT_SIZE,
                fill: paint.fill,
                stroke: paint.stroke,
                opacity: paint.opacity,
                number: numbersOn ? seat.number : '',
                numberFill: cliente
                  ? (estado?.mia ? '#052e21' : estado?.seleccionada ? '#121212'
                    : estado?.activa && seat.status !== 'vendido' && seat.status !== 'apartado'
                      ? (seatTier?.color || color) : 'rgba(255,255,255,0.18)')
                  : readableOn(paint.fill),
                cushion: cliente && seat.status !== 'vendido' && seat.status !== 'apartado',
                title: this.seatTitle(area, row.label, seat, seatTier)
              });
            }

            return {
              id: row.id,
              label: row.label,
              labelX: first.x - SEAT_SIZE,
              labelY: first.y,
              seats
            };
          })
        : [];

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

    const out: { key: string; x: number; y: number; size: number }[] = [];
    for (const area of this.plan().areas) {
      for (const row of area.rows) {
        for (let i = 0; i < row.seats.length; i++) {
          const key = `${area.id}|${row.id}|${i}`;
          if (!picked.has(key)) continue;
          const p = seatPlanPoint(area, row, i);
          out.push({ key, x: p.x - SEAT_SIZE / 2 - 2, y: p.y - SEAT_SIZE / 2 - 2, size: SEAT_SIZE + 4 });
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

  private seatTitle(area: CroquisArea, rowLabel: string, seat: CroquisSeat, tier?: CroquisTier): string {
    const estado = seat.status === 'vendido' ? 'Vendido'
      : seat.status === 'apartado' ? 'Apartado'
      : seat.status === 'bloqueado' ? 'Bloqueado (no se vende)'
      : 'Disponible';
    const precio = tier ? ` · $${(tier.price || 0).toLocaleString('es-MX')}` : '';
    return `${area.name} · Fila ${rowLabel}, Butaca ${seat.number}\n${tier?.name || 'Sin categoría'}${precio} · ${estado}`;
  }

  private areaSubtitle(area: CroquisArea, tier?: CroquisTier): string {
    const cap = areaCapacity(area).toLocaleString('es-MX');
    const kind = area.kind === 'general' ? 'aforo libre' : 'butacas';
    const sold = areaSold(area);
    const precio = tier ? ` · $${(tier.price || 0).toLocaleString('es-MX')}` : ' · sin categoría';
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

    if (tool === 'area-butacas' || tool === 'area-general') {
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
      this.seatsPicked.emit({ seats: [], additive: false });
    }
  }

  onPointerMove(event: PointerEvent): void {
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
    const drag = this.drag();
    this.painting.set(false);
    this.drag.set(null);

    const box = this.marquee();
    this.marquee.set(null);
    if (!drag || !box) return;

    if (drag.kind === 'dibujar-area') {
      if (box.width < 60 || box.height < 50) return;
      this.areaDrawn.emit({
        kind: this.tool() === 'area-general' ? 'general' : 'butacas',
        x: box.x, y: box.y, width: box.width, height: box.height
      });
      return;
    }

    if (drag.kind === 'marco') {
      if (box.width < 4 && box.height < 4) return;
      this.seatsPicked.emit({ seats: this.seatsInBox(box), additive: drag.additive });
    }
  }

  /** Butacas que cayeron dentro del marco, en coordenadas del plano. */
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
    // Pintar y quitar butacas funcionan arrastrando: es la única forma cómoda de
    // tocar cincuenta butacas seguidas sin dar cincuenta clics.
    this.painting.set(this.tool() === 'pintar' || this.tool() === 'quitar-butacas');
    this.seatsPicked.emit({ seats: [ref], additive: event.ctrlKey || event.metaKey || this.painting() });
  }

  onSeatEnter(event: PointerEvent, ref: SeatRef): void {
    if (!this.painting()) return;
    this.seatsPicked.emit({ seats: [ref], additive: true });
  }
}
