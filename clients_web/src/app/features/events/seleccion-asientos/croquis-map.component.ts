import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CroquisArea, CroquisElement, CroquisPlan, CroquisRow, CroquisSeat, CroquisTable,
  CroquisTier, SEAT_SIZE, TABLE_SEAT_OFFSET
} from '../../../core/models/croquis.model';

/**
 * El croquis del evento, dibujado tal como se diseñó.
 *
 * Cada zona va donde el organizador la puso, con la curvatura de sus filas y los
 * elementos del recinto en su sitio. Es el mismo plano que él aprueba en el
 * panel: si aquí se reordenara para que quepa mejor, el comprador estaría
 * eligiendo su lugar sobre un recinto que no existe.
 *
 * El estado de cada butaca lo decide la pantalla de compra —vendida, elegida,
 * ya mía— y llega resuelto en `states`. Este componente no sabe de carritos ni
 * de precios: dibuja y avisa qué se tocó.
 */

export interface CroquisSeatHit {
  /** Identificador que ve el comprador: 'A-12'. */
  id: string;
  row: string;
  number: number;
  tierId: string;
}

/** Toque sobre una mesa que se renta completa. */
export interface CroquisTableHit {
  areaId: string;
  tableId: string;
  label: string;
}

/** Cómo se pinta cada butaca; lo decide quien gestiona la compra. */
export type SeatVisualState = 'available' | 'sold' | 'selected' | 'purchased' | 'muted';

interface SeatVM {
  key: string;
  hit: CroquisSeatHit;
  x: number;
  y: number;
  fill: string;
  stroke: string;
  numberFill: string;
  cushion: boolean;
  clickable: boolean;
  title: string;
}

interface RowVM {
  id: string;
  label: string;
  labelX: number;
  labelY: number;
  labelRightX: number;
  color: string;
  seats: SeatVM[];
}

/** Una mesa dibujada, con sus sillas en coordenadas del centro de la mesa. */
interface TableVM {
  areaId: string;
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
  badge: string;
  /** Se renta completa: se dibuja el aro que la ata y el tablero es tocable. */
  whole: boolean;
  clickable: boolean;
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
  labelY: number;
  chipWidth: number;
  rows: RowVM[];
  tables: TableVM[];
}

let mapSeq = 0;

const rad = (deg: number) => (deg * Math.PI) / 180;
const textWidth = (text: string, size: number) => (text || '').length * size * 0.56;

/** Recorta el texto a lo que quepa: SVG no sabe hacerlo solo. */
function fitText(text: string, maxWidth: number, size: number): string {
  const clean = (text || '').trim();
  if (!clean || textWidth(clean, size) <= maxWidth) return clean;
  return clean.slice(0, Math.max(1, Math.floor(maxWidth / (size * 0.56)) - 1)).trimEnd() + '…';
}

/**
 * Cuánto se hunde el centro de la fila cuando la zona está curvada.
 *
 * En un recinto real las filas abrazan el escenario: los extremos quedan más
 * cerca y el centro más lejos. Se aproxima con una parábola porque a esta escala
 * es indistinguible de un arco y cuesta una multiplicación por butaca.
 */
function curveOffset(area: CroquisArea, row: CroquisRow, seat: CroquisSeat | undefined): number {
  const curve = area.curve || 0;
  if (curve <= 0 || row.seats.length < 3) return 0;

  // Se mide sobre el `slot` y no sobre el índice del arreglo, igual que en el
  // panel: así la butaca cae donde el organizador la dejó aunque el orden en
  // que viajan haya cambiado, y un pasillo a media fila no parte la curva.
  let span = 1;
  for (const s of row.seats) span = Math.max(span, s.slot || 0);
  const t = (seat?.slot || 0) / span;
  return Math.min(area.width, area.height) * 0.22 * curve * (1 - Math.pow(2 * t - 1, 2));
}

function seatPoint(area: CroquisArea, row: CroquisRow, index: number) {
  const seat = row.seats[index];
  const a = rad(row.angle || 0);
  const d = (seat?.slot ?? index) * row.gap;
  const dip = curveOffset(area, row, seat);
  return {
    x: row.x + d * Math.cos(a) - dip * Math.sin(a) + (seat?.dx || 0),
    y: row.y + d * Math.sin(a) + dip * Math.cos(a) + (seat?.dy || 0)
  };
}

/**
 * Dónde se sienta cada silla respecto del centro de su mesa.
 *
 * Sale del `slot` y del total de posiciones, no de cuántas sillas queden: una
 * mesa a la que se le quitó un lugar tiene que verse con el hueco donde estaba,
 * no con las demás repartidas de nuevo y la mesa entera girada.
 */
function tableSeatOffset(table: CroquisTable, seat: CroquisSeat) {
  const slots = Math.max(1, table.slots || table.seats.length || 1);
  const slot = (((seat.slot || 0) % slots) + slots) % slots;
  const dx = seat.dx || 0;
  const dy = seat.dy || 0;

  if (table.shape === 'rectangular') {
    const w = table.width;
    const h = table.height;
    // Media posición de corrimiento: repartir a secas dejaría una silla clavada
    // en cada esquina, que es donde nadie se sienta.
    let d = ((slot + 0.5) / slots) * 2 * (w + h);

    let x: number, y: number, nx: number, ny: number;
    if (d < w) { x = -w / 2 + d; y = -h / 2; nx = 0; ny = -1; }
    else if ((d -= w) < h) { x = w / 2; y = -h / 2 + d; nx = 1; ny = 0; }
    else if ((d -= h) < w) { x = w / 2 - d; y = h / 2; nx = 0; ny = 1; }
    else { d -= w; x = -w / 2; y = h / 2 - d; nx = -1; ny = 0; }

    return { x: x + nx * TABLE_SEAT_OFFSET + dx, y: y + ny * TABLE_SEAT_OFFSET + dy };
  }

  const radius = table.width / 2 + TABLE_SEAT_OFFSET;
  const angle = -Math.PI / 2 + (2 * Math.PI * slot) / slots;
  return { x: Math.cos(angle) * radius + dx, y: Math.sin(angle) * radius + dy };
}

@Component({
  selector: 'app-croquis-map',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block relative w-full h-full' },
  template: `
    <svg
      #svg
      class="w-full h-full select-none touch-none"
      [attr.viewBox]="viewBox()"
      preserveAspectRatio="xMidYMid meet"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp()"
      (pointercancel)="onPointerUp()"
      (wheel)="onWheel($event)"
    >
      <defs>
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
      <rect x="0" y="0" [attr.width]="plan().width" [attr.height]="plan().height"
        rx="18" fill="#141414" stroke="rgba(255,255,255,0.05)" stroke-width="1.5" />

      <!-- Zonas -->
      @for (vm of scene().areas; track vm.area.id) {
        <g [attr.transform]="vm.transform">
          <path [attr.d]="vm.path" [attr.fill]="vm.fill" [attr.stroke]="vm.stroke" stroke-width="1.5"
            [attr.stroke-dasharray]="vm.area.numbered ? null : '10 6'" />

          @if (!vm.area.numbered) {
            <path [attr.d]="vm.path" [attr.fill]="'url(#' + uid + '-crowd)'" [style.color]="vm.color" />
          }

          @for (row of vm.rows; track row.id) {
            <text [attr.x]="row.labelX" [attr.y]="row.labelY" text-anchor="end" dominant-baseline="middle"
              font-size="11" font-weight="800" [attr.fill]="row.color" opacity="0.65">{{ row.label }}</text>
            <text [attr.x]="row.labelRightX" [attr.y]="row.labelY" text-anchor="start" dominant-baseline="middle"
              font-size="11" font-weight="800" [attr.fill]="row.color" opacity="0.65">{{ row.label }}</text>

            @for (seat of row.seats; track seat.key) {
              <rect
                [attr.x]="seat.x" [attr.y]="seat.y" [attr.width]="size" [attr.height]="size"
                rx="4"
                [attr.fill]="seat.fill" [attr.stroke]="seat.stroke" stroke-width="1"
                [class.cursor-pointer]="seat.clickable"
                [class.cursor-not-allowed]="!seat.clickable"
                (pointerdown)="onSeatDown($event, seat)"
              ><title>{{ seat.title }}</title></rect>
              @if (seat.cushion) {
                <rect [attr.x]="seat.x + 2.5" [attr.y]="seat.y + size - 4" [attr.width]="size - 5"
                  height="2.5" rx="1.2" fill="rgba(0,0,0,0.28)" class="pointer-events-none" />
              }
              <text [attr.x]="seat.x + size / 2" [attr.y]="seat.y + size / 2 + 0.5"
                text-anchor="middle" dominant-baseline="central" font-size="7.5" font-weight="800"
                [attr.fill]="seat.numberFill" class="pointer-events-none">{{ seat.hit.number }}</text>
            }
          }

          <!-- Mesas -->
          @for (t of vm.tables; track t.table.id) {
            <g [attr.transform]="t.transform">
              @if (t.whole) {
                @if (t.radius) {
                  <circle cx="0" cy="0" [attr.r]="t.radius + 21" fill="none" [attr.stroke]="t.color"
                    stroke-width="1.2" stroke-dasharray="3 5" opacity="0.5" class="pointer-events-none" />
                } @else {
                  <rect [attr.x]="t.boxX - 21" [attr.y]="t.boxY - 21"
                    [attr.width]="t.table.width + 42" [attr.height]="t.table.height + 42" rx="16"
                    fill="none" [attr.stroke]="t.color" stroke-width="1.2" stroke-dasharray="3 5"
                    opacity="0.5" class="pointer-events-none" />
                }
              }

              @if (t.radius) {
                <circle cx="0" cy="0" [attr.r]="t.radius"
                  [attr.fill]="t.fill" [attr.stroke]="t.stroke" stroke-width="1.6"
                  [attr.opacity]="t.dimmed ? 0.45 : 1"
                  [class.cursor-pointer]="t.clickable"
                  (pointerdown)="onTableDown($event, t)"
                ><title>{{ t.title }}</title></circle>
              } @else {
                <rect [attr.x]="t.boxX" [attr.y]="t.boxY"
                  [attr.width]="t.table.width" [attr.height]="t.table.height" rx="7"
                  [attr.fill]="t.fill" [attr.stroke]="t.stroke" stroke-width="1.6"
                  [attr.opacity]="t.dimmed ? 0.45 : 1"
                  [class.cursor-pointer]="t.clickable"
                  (pointerdown)="onTableDown($event, t)"
                ><title>{{ t.title }}</title></rect>
              }

              @for (seat of t.seats; track seat.key) {
                <rect
                  [attr.x]="seat.x" [attr.y]="seat.y" [attr.width]="size" [attr.height]="size" rx="5"
                  [attr.fill]="seat.fill" [attr.stroke]="seat.stroke" stroke-width="1"
                  [class.cursor-pointer]="seat.clickable"
                  [class.cursor-not-allowed]="!seat.clickable"
                  (pointerdown)="onSeatDown($event, seat)"
                ><title>{{ seat.title }}</title></rect>
                <text [attr.x]="seat.x + size / 2" [attr.y]="seat.y + size / 2 + 0.5"
                  text-anchor="middle" dominant-baseline="central" font-size="7.5" font-weight="800"
                  [attr.fill]="seat.numberFill" class="pointer-events-none">{{ seat.hit.number }}</text>
              }

              <text x="0" [attr.y]="t.badge ? -3 : 1" text-anchor="middle" dominant-baseline="middle"
                font-size="9" font-weight="900" [attr.fill]="t.color" class="pointer-events-none">{{ t.label }}</text>
              @if (t.badge) {
                <text x="0" y="9" text-anchor="middle" dominant-baseline="middle"
                  font-size="7.5" font-weight="700" fill="rgba(255,255,255,0.6)"
                  class="pointer-events-none">{{ t.badge }}</text>
              }
            </g>
          }

          <!-- Nombre de la zona -->
          <g class="pointer-events-none" [attr.transform]="'translate(4 ' + vm.labelY + ')'">
            <rect x="0" y="0" [attr.width]="vm.chipWidth" height="34" rx="9"
              fill="rgba(12,12,12,0.9)" [attr.stroke]="vm.stroke" />
            <text x="12" y="14" font-size="13" font-weight="900" [attr.fill]="vm.color">{{ vm.label }}</text>
            <text x="12" y="27" font-size="10" font-weight="700" fill="rgba(255,255,255,0.6)">{{ vm.sub }}</text>
          </g>
        </g>
      }

      <!-- Referencias del recinto -->
      @for (vm of scene().elements; track vm.el.label) {
        <g [attr.transform]="vm.transform">
          @if (vm.el.kind === 'escenario') {
            <rect x="0" y="0" [attr.width]="vm.el.width" [attr.height]="vm.el.height" rx="12"
              [attr.fill]="vm.el.color + '30'" [attr.stroke]="vm.el.color" stroke-width="2"
              [attr.filter]="'url(#' + uid + '-glow)'" />
            <rect [attr.x]="10" [attr.y]="vm.el.height - 9" [attr.width]="vm.el.width - 20"
              height="4" rx="2" [attr.fill]="vm.el.color" opacity="0.85" />
            <text [attr.x]="vm.el.width / 2" [attr.y]="vm.el.height / 2" text-anchor="middle"
              dominant-baseline="middle" font-size="17" font-weight="900" letter-spacing="2.5"
              [attr.fill]="vm.el.color" class="uppercase">{{ vm.label }}</text>
          } @else if (vm.el.kind === 'pantalla') {
            <rect x="0" y="0" [attr.width]="vm.el.width" [attr.height]="vm.el.height" rx="4"
              [attr.fill]="vm.el.color + '26'" [attr.stroke]="vm.el.color" stroke-width="1.8" />
            <rect x="5" y="5" [attr.width]="vm.el.width - 10" [attr.height]="vm.el.height - 10" rx="2"
              fill="rgba(10,10,10,0.55)" [attr.stroke]="vm.el.color" stroke-width="0.6" stroke-opacity="0.5" />
            <text [attr.x]="vm.el.width / 2" [attr.y]="vm.el.height + 14" text-anchor="middle"
              font-size="10" font-weight="800" [attr.fill]="vm.el.color">{{ vm.label }}</text>
          } @else {
            <rect x="0" y="0" [attr.width]="vm.el.width" [attr.height]="vm.el.height" rx="9"
              [attr.fill]="vm.el.color + '24'" [attr.stroke]="vm.el.color" stroke-width="1.4" stroke-opacity="0.75" />
            <text [attr.x]="vm.el.width / 2" [attr.y]="vm.iconY" text-anchor="middle" dominant-baseline="central"
              font-family="Material Symbols Outlined" [attr.font-size]="vm.iconSize"
              [attr.fill]="vm.el.color">{{ vm.el.icon }}</text>
            <text [attr.x]="vm.el.width / 2" [attr.y]="vm.labelY" text-anchor="middle" dominant-baseline="central"
              font-size="10" font-weight="800" [attr.fill]="vm.el.color">{{ vm.label }}</text>
          }
        </g>
      }
    </svg>
  `
})
export class CroquisMapComponent {
  plan = input.required<CroquisPlan>();
  tiers = input<CroquisTier[]>([]);
  /** Estado de cada butaca por su id visible ('A-12'), resuelto por la compra. */
  states = input<Record<string, SeatVisualState>>({});

  seatPicked = output<CroquisSeatHit>();
  /** Mesa tocada; solo llega cuando se renta completa. */
  tablePicked = output<CroquisTableHit>();

  @ViewChild('svg') private svgRef?: ElementRef<SVGSVGElement>;

  readonly uid = `cqm${++mapSeq}`;
  readonly size = SEAT_SIZE;

  private view = signal<{ x: number; y: number; width: number; height: number } | null>(null);
  private panning = signal<{ x: number; y: number } | null>(null);
  private moved = signal(false);

  private tierIndex = computed(() => new Map(this.tiers().map(t => [t.id, t])));

  viewBox = computed(() => {
    const v = this.view();
    const p = this.plan();
    if (v) return `${v.x} ${v.y} ${v.width} ${v.height}`;
    // Margen alrededor: las etiquetas de zona y de referencia se dibujan fuera de
    // su caja y contra el filo del SVG quedarían cortadas.
    const pad = 30;
    return `${-pad} ${-pad} ${p.width + pad * 2} ${p.height + pad * 2.2}`;
  });

  /**
   * Toda la geometría resuelta de una vez.
   *
   * El template solo pinta datos ya calculados: si llamara funciones por butaca,
   * Angular las reevaluaría en cada ciclo y un recinto de dos mil lugares se
   * arrastraría al mover el dedo.
   */
  scene = computed(() => {
    const plan = this.plan();
    const tiers = this.tierIndex();
    const states = this.states();

    const areas: AreaVM[] = plan.areas.map(area => {
      const tier = tiers.get(area.tierId);
      const color = tier?.color || '#99907c';

      const rows: RowVM[] = area.rows.map(row => {
        const seats: SeatVM[] = [];
        let minX = Infinity;
        let maxX = -Infinity;
        let labelY = row.y;

        for (let i = 0; i < row.seats.length; i++) {
          const seat = row.seats[i];
          if (seat.state === 'bloqueado') continue;

          const p = seatPoint(area, row, i);
          const id = `${row.label}-${seat.number}`;
          const seatTier = seat.tierId ? tiers.get(seat.tierId) || tier : tier;
          const state = states[id] || (seat.state ? 'sold' : 'available');
          const paint = this.paint(state, seatTier?.color || color);

          if (i === 0) labelY = p.y;
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);

          seats.push({
            key: `${row.id}-${i}`,
            hit: { id, row: row.label, number: seat.number, tierId: seatTier?.id || '' },
            x: p.x - SEAT_SIZE / 2,
            y: p.y - SEAT_SIZE / 2,
            fill: paint.fill,
            stroke: paint.stroke,
            numberFill: paint.text,
            cushion: state !== 'sold',
            clickable: state !== 'sold' && state !== 'muted',
            title: `${id} · ${seatTier?.name || ''} ($${seatTier?.price || 0} MXN)`
          });
        }

        return {
          id: row.id,
          label: row.label,
          labelX: (minX === Infinity ? row.x : minX) - SEAT_SIZE,
          labelRightX: (maxX === -Infinity ? row.x : maxX) + SEAT_SIZE,
          labelY,
          color,
          seats
        };
      }).filter(r => r.seats.length > 0);

      const mesas = (area.tables || []).filter(t => t.state !== 'bloqueada');

      const tables: TableVM[] = mesas.map(table => {
        const tableTier = table.tierId ? tiers.get(table.tierId) || tier : tier;
        const tableColor = tableTier?.color || color;

        const seats: SeatVM[] = [];
        for (let i = 0; i < table.seats.length; i++) {
          const seat = table.seats[i];
          if (seat.state === 'bloqueado') continue;

          const p = tableSeatOffset(table, seat);
          const id = `${table.label}-${seat.number}`;
          const seatTier = seat.tierId ? tiers.get(seat.tierId) || tableTier : tableTier;
          const state = states[id] || (seat.state || table.state ? 'sold' : 'available');
          const paint = this.paint(state, seatTier?.color || tableColor);

          seats.push({
            key: `${table.id}-${i}`,
            hit: { id, row: table.label, number: seat.number, tierId: seatTier?.id || '' },
            x: p.x - SEAT_SIZE / 2,
            y: p.y - SEAT_SIZE / 2,
            fill: paint.fill,
            stroke: paint.stroke,
            numberFill: paint.text,
            cushion: false,
            // Con la mesa a la venta completa la silla no se elige sola: el
            // gesto es sobre el tablero, y se deja pasar para poder moverse por
            // el plano con el dedo encima de la mesa.
            clickable: table.rental !== 'completa' && state !== 'sold' && state !== 'muted',
            title: `${id} · ${seatTier?.name || ''} ($${seatTier?.price || 0} MXN)`
          });
        }

        const disponibles = table.seats.filter(s => !s.state).length;
        const half = table.shape === 'rectangular' ? 0 : table.width / 2;

        return {
          areaId: area.id,
          table,
          transform: `translate(${table.x} ${table.y})${table.rotation ? ` rotate(${table.rotation})` : ''}`,
          fill: tableColor + (table.state ? '14' : '2e'),
          stroke: tableColor + (table.state ? '55' : 'bb'),
          color: tableColor,
          radius: half,
          boxX: -table.width / 2,
          boxY: -table.height / 2,
          label: fitText(table.label, table.width - 8, 9),
          badge: table.state === 'reservada' ? 'Apartada' : `${disponibles} libres`,
          whole: table.rental === 'completa',
          clickable: table.rental === 'completa' && !table.state && disponibles > 0,
          dimmed: !!table.state || disponibles === 0,
          seats,
          title: table.rental === 'completa'
            ? `${table.label} · se renta completa (${table.seats.length} lugares)` +
              (table.price ? ` · $${table.price.toLocaleString('es-MX')} MXN` : '')
            : `${table.label} · ${disponibles} de ${table.seats.length} lugares libres` +
              ` · mínimo ${Math.max(1, table.minSeats || 1)}`
        };
      });

      const capacity = area.numbered
        ? area.rows.reduce((s, r) => s + r.seats.filter(x => x.state !== 'bloqueado').length, 0) +
          mesas.reduce((s, t) => s + t.seats.filter(x => x.state !== 'bloqueado').length, 0)
        : (area.capacity || 0);
      const label = fitText(area.name, 290, 13);
      const unidad = !area.numbered ? 'de aforo' : mesas.length ? 'lugares en mesa' : 'butacas';
      const sub = fitText(
        `${capacity.toLocaleString('es-MX')} ${unidad} · $${tier?.price || 0}`,
        290, 10
      );

      return {
        area,
        transform: `translate(${area.x} ${area.y})${area.rotation ? ` rotate(${area.rotation} ${area.width / 2} ${area.height / 2})` : ''}`,
        path: area.points?.length
          ? `M${area.points.map(p => `${p.x * area.width},${p.y * area.height}`).join(' L')} Z`
          : `M0,0 H${area.width} V${area.height} H0 Z`,
        fill: color + (area.numbered ? '14' : '1f'),
        stroke: color + (area.numbered ? '66' : 'cc'),
        color,
        label,
        sub,
        // El chip va fuera de la caja siempre que quepa: dentro taparía la primera
        // fila, que suele ser la más cara.
        labelY: area.numbered ? (area.y > 46 ? -38 : 6) : 6,
        chipWidth: Math.max(130, Math.max(textWidth(label, 13), textWidth(sub, 10)) + 26),
        rows,
        tables
      };
    });

    const elements = plan.elements.map(el => {
      const compact = el.height < 58 || el.width < 74;
      const iconSize = Math.max(12, Math.min(30, Math.min(el.width, el.height) * (compact ? 0.54 : 0.38)));
      const labelSize = 10;
      const inside = !compact;

      return {
        el,
        transform: `translate(${el.x} ${el.y})${el.rotation ? ` rotate(${el.rotation} ${el.width / 2} ${el.height / 2})` : ''}`,
        label: fitText(el.label, inside ? el.width - 14 : Math.max(el.width, 110), labelSize),
        iconSize,
        iconY: inside ? (el.height - labelSize * 1.9) / 2 : el.height / 2,
        labelY: inside ? el.height - labelSize * 0.9 : el.height + labelSize + 3
      };
    });

    return { areas, elements };
  });

  /**
   * Los cuatro estados del mapa, con los mismos colores de siempre: disponible
   * en el color de su categoría, elegida en dorado, la propia en verde y
   * ocupada apagada.
   */
  private paint(state: SeatVisualState, color: string) {
    switch (state) {
      case 'selected':
        return { fill: '#F2CA50', stroke: '#F2CA50', text: '#121212' };
      case 'purchased':
        return { fill: '#10B981', stroke: '#10B981', text: '#052e21' };
      case 'sold':
        return { fill: 'rgba(255,255,255,0.06)', stroke: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.18)' };
      case 'muted':
        return { fill: 'rgba(255,255,255,0.02)', stroke: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.14)' };
      default:
        return { fill: color + '1f', stroke: color, text: color };
    }
  }

  // ─── Zoom y paneo ──────────────────────────────────────────────────────────

  private currentView() {
    const v = this.view();
    if (v) return v;
    const p = this.plan();
    const pad = 30;
    return { x: -pad, y: -pad, width: p.width + pad * 2, height: p.height + pad * 2.2 };
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.zoomBy(event.deltaY < 0 ? 1.14 : 1 / 1.14, this.toPlan(event));
  }

  /** Acercar: sin esto, en un recinto grande la butaca mide tres píxeles. */
  zoomBy(factor: number, center?: { x: number; y: number }): void {
    const v = this.currentView();
    const p = this.plan();
    const width = Math.min(p.width * 2, Math.max(p.width * 0.15, v.width / factor));
    const scale = width / v.width;
    const cx = center?.x ?? v.x + v.width / 2;
    const cy = center?.y ?? v.y + v.height / 2;

    this.view.set({
      x: cx - (cx - v.x) * scale,
      y: cy - (cy - v.y) * scale,
      width,
      height: v.height * scale
    });
  }

  fit(): void {
    this.view.set(null);
  }

  private toPlan(event: { clientX: number; clientY: number }) {
    const svg = this.svgRef?.nativeElement;
    const v = this.currentView();
    if (!svg) return { x: 0, y: 0 };

    // `xMidYMid meet` deja bandas vacías cuando el contenedor y el viewBox no
    // tienen la misma proporción; sin descontarlas, todo caería corrido.
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / v.width, rect.height / v.height) || 1;
    return {
      x: v.x + (event.clientX - rect.left - (rect.width - v.width * scale) / 2) / scale,
      y: v.y + (event.clientY - rect.top - (rect.height - v.height * scale) / 2) / scale
    };
  }

  onPointerDown(event: PointerEvent): void {
    this.moved.set(false);
    this.panning.set({ x: event.clientX, y: event.clientY });
    try {
      (event.target as Element).setPointerCapture?.(event.pointerId);
    } catch {
      /* el arrastre sigue sin captura */
    }
  }

  onPointerMove(event: PointerEvent): void {
    const from = this.panning();
    if (!from) return;

    const svg = this.svgRef?.nativeElement;
    const v = this.currentView();
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / v.width, rect.height / v.height) || 1;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.moved.set(true);

    this.view.set({ ...v, x: v.x - dx / scale, y: v.y - dy / scale });
    this.panning.set({ x: event.clientX, y: event.clientY });
  }

  onPointerUp(): void {
    this.panning.set(null);
  }

  /**
   * Un clic en la butaca la elige, pero solo si no se estaba arrastrando: al
   * moverse por el plano con el dedo es fácil soltar encima de un lugar, y
   * comprar por accidente sería el peor final posible para ese gesto.
   */
  onSeatDown(event: PointerEvent, seat: SeatVM): void {
    if (!seat.clickable) return;
    this.tapOnly(event, () => this.seatPicked.emit(seat.hit));
  }

  /** El tablero de una mesa que se renta completa: se lleva todos sus lugares. */
  onTableDown(event: PointerEvent, vm: TableVM): void {
    if (!vm.clickable) return;
    this.tapOnly(event, () =>
      this.tablePicked.emit({ areaId: vm.areaId, tableId: vm.table.id, label: vm.table.label })
    );
  }

  /**
   * Dispara solo si fue un toque y no un arrastre.
   *
   * Al moverse por el plano con el dedo es fácil soltar encima de un lugar, y
   * comprar por accidente sería el peor final posible para ese gesto.
   */
  private tapOnly(event: PointerEvent, run: () => void): void {
    event.stopPropagation();

    const start = { x: event.clientX, y: event.clientY };
    const target = event.target as Element;

    const finish = (up: PointerEvent) => {
      target.removeEventListener('pointerup', finish as EventListener);
      const moved = Math.abs(up.clientX - start.x) > 4 || Math.abs(up.clientY - start.y) > 4;
      if (!moved) run();
    };

    target.addEventListener('pointerup', finish as EventListener);
  }
}
