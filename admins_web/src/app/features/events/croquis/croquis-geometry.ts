import {
  CroquisArea,
  CroquisElement,
  CroquisPlan,
  CroquisPoint,
  CroquisRow,
  CroquisSeat,
  RowLabeling,
  ROW_GAP,
  SeatGridOptions,
  SeatNumbering,
  SEAT_GAP,
  SEAT_SIZE
} from '../../../core/models/croquis.models';

/**
 * Geometría del croquis: dónde cae cada butaca y qué forma tiene cada área.
 *
 * Todo lo de aquí es determinista y sin estado. El editor solo guarda el origen
 * de cada fila, su ángulo y su separación; la posición de las butacas se calcula
 * cada vez. Es a propósito: mover una fila de 60 lugares es cambiar dos números
 * en vez de reescribir 60 pares de coordenadas, y re-espaciar el área completa
 * no arrastra basura de posiciones viejas.
 */

// ─── Etiquetas y numeración ───────────────────────────────────────────────────

/**
 * Convierte un índice en etiqueta de fila estilo hoja de cálculo: A…Z, AA, AB…
 * Después de la Z los recintos siguen con AA, no con A1.
 */
export function letterLabel(index: number): string {
  let n = Math.max(0, index);
  let out = '';
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

/** Índice a partir de una etiqueta de fila ('A' → 0, 'AB' → 27). */
export function letterIndex(label: string): number {
  const clean = (label || 'A').toUpperCase().replace(/[^A-Z]/g, '') || 'A';
  let n = 0;
  for (const ch of clean) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function rowLabelAt(index: number, labeling: RowLabeling, startLabel?: string): string {
  if (labeling === 'numeros') {
    const start = Number(startLabel) || 1;
    return String(start + index);
  }
  return letterLabel(letterIndex(startLabel || 'A') + index);
}

/**
 * Números de butaca de una fila según el esquema elegido.
 *
 * `impares-pares` es el de los teatros: se numera desde el pasillo central hacia
 * afuera, nones a la izquierda y pares a la derecha. Se ve extraño en una tabla
 * y es exactamente lo que dice el boleto en la puerta.
 */
export function seatNumbers(count: number, numbering: SeatNumbering, offset = 0): string[] {
  if (count <= 0) return [];

  switch (numbering) {
    case 'derecha-izquierda':
      return Array.from({ length: count }, (_, i) => String(count - i));

    case 'corrida':
      return Array.from({ length: count }, (_, i) => String(offset + i + 1));

    case 'impares-pares': {
      const half = Math.ceil(count / 2);
      return Array.from({ length: count }, (_, i) => {
        // Izquierda: nones descendentes hacia el pasillo. Derecha: pares
        // ascendentes desde el pasillo.
        if (i < half) return String((half - i) * 2 - 1);
        return String((i - half + 1) * 2);
      });
    }

    default:
      return Array.from({ length: count }, (_, i) => String(i + 1));
  }
}

// ─── Generación de butaquería ─────────────────────────────────────────────────

export function defaultGridOptions(): SeatGridOptions {
  return {
    rows: 6,
    seatsPerRow: 12,
    numbering: 'izquierda-derecha',
    labeling: 'letras',
    startLabel: 'A',
    gap: SEAT_GAP,
    rowGap: ROW_GAP,
    curve: 0,
    aisles: []
  };
}

/**
 * Cuántas filas y butacas por fila caben en un área de este tamaño.
 *
 * Se usa al dibujar un área nueva con el mouse: en vez de nacer vacía y obligar
 * a abrir el asistente, el área se llena sola con la butaquería que le cabe. Se
 * corrige después si hace falta, pero lo normal es que ya esté bien.
 */
export function fitGrid(width: number, height: number, gap = SEAT_GAP, rowGap = ROW_GAP): { rows: number; seatsPerRow: number } {
  return {
    rows: Math.max(1, Math.floor((height - SEAT_SIZE) / rowGap) + 1),
    seatsPerRow: Math.max(1, Math.floor((width - SEAT_SIZE) / gap) + 1)
  };
}

/**
 * Construye las filas de un área a partir de los parámetros del asistente.
 *
 * Los pasillos se modelan quitando el `slot`, no dibujando una línea encima: un
 * pasillo es, literalmente, la butaca que no existe. Así el hueco se ve en el
 * plano y además nunca se vende un lugar que en el recinto es piso.
 */
export function buildRows(area: CroquisArea, options: SeatGridOptions, idSeed: string): CroquisRow[] {
  const { rows, seatsPerRow, numbering, labeling, startLabel } = options;
  const aisles = new Set(options.aisles || []);

  // La butaquería se aprieta para caber en el área en vez de desbordarse sobre
  // la de al lado. El mínimo es el ancho de la butaca más un pelo: por debajo de
  // eso las butacas se encimarían y el croquis dejaría de leerse, así que ahí se
  // deja desbordar a propósito —es la señal de que el área quedó chica.
  const fitGap = (available: number, count: number, wanted: number) =>
    count > 1 ? Math.max(SEAT_SIZE + 2, Math.min(wanted, available / (count - 1))) : wanted;

  const gap = fitGap(area.width - SEAT_SIZE - 16, seatsPerRow, options.gap);
  const rowGap = fitGap(area.height - SEAT_SIZE - 24, rows, options.rowGap);

  const usedSlots = Array.from({ length: seatsPerRow }, (_, i) => i).filter(i => !aisles.has(i + 1));
  const startX = Math.max(SEAT_SIZE / 2 + 4, (area.width - (seatsPerRow - 1) * gap) / 2);
  const startY = SEAT_SIZE / 2 + 10;

  let running = 0;

  return Array.from({ length: rows }, (_, r) => {
    const numbers = seatNumbers(usedSlots.length, numbering, running);
    running += usedSlots.length;

    const seats: CroquisSeat[] = usedSlots.map((slot, i) => ({
      number: numbers[i],
      slot
    }));

    return {
      id: `${idSeed}-r${r + 1}`,
      label: rowLabelAt(r, labeling, startLabel),
      x: startX,
      y: startY + r * rowGap,
      angle: 0,
      gap,
      seats
    };
  });
}

/**
 * Re-numera todas las butacas del área conservando su posición.
 *
 * Cambiar el esquema de numeración no debe mover nada: las butacas siguen donde
 * estaban, solo cambia lo que dice el boleto.
 */
export function renumberArea(area: CroquisArea, numbering: SeatNumbering, labeling: RowLabeling, startLabel?: string): CroquisRow[] {
  let running = 0;
  return area.rows.map((row, r) => {
    const numbers = seatNumbers(row.seats.length, numbering, running);
    running += row.seats.length;
    return {
      ...row,
      label: rowLabelAt(r, labeling, startLabel),
      seats: row.seats.map((seat, i) => ({ ...seat, number: numbers[i] }))
    };
  });
}

// ─── Posición de las butacas ──────────────────────────────────────────────────

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Cuánto se hunde el centro de la fila cuando el área está curvada.
 *
 * Las filas de un recinto real abrazan el escenario: los extremos quedan más
 * cerca y el centro más lejos. Se aproxima con una parábola —cero en las puntas,
 * máximo al centro— porque a la escala de un croquis es indistinguible de un
 * arco y cuesta una multiplicación en vez de trigonometría por butaca.
 */
function curveOffset(area: CroquisArea, row: CroquisRow, index: number): number {
  const curve = area.curve || 0;
  if (curve <= 0 || row.seats.length < 3) return 0;

  const span = Math.max(1, row.seats.length - 1);
  const t = index / span;
  const bow = Math.min(area.width, area.height) * 0.22 * curve;
  return bow * (1 - Math.pow(2 * t - 1, 2));
}

/** Posición de una butaca dentro del área, antes de rotar el área. */
export function seatLocalPoint(area: CroquisArea, row: CroquisRow, index: number): CroquisPoint {
  const seat = row.seats[index];
  const a = rad(row.angle || 0);
  const d = (seat?.slot ?? index) * row.gap;
  const dip = curveOffset(area, row, index);

  return {
    x: row.x + d * Math.cos(a) - dip * Math.sin(a),
    y: row.y + d * Math.sin(a) + dip * Math.cos(a)
  };
}

/** Rota un punto alrededor de un centro. */
export function rotatePoint(point: CroquisPoint, center: CroquisPoint, degrees: number): CroquisPoint {
  if (!degrees) return point;
  const a = rad(degrees);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * Math.cos(a) - dy * Math.sin(a),
    y: center.y + dx * Math.sin(a) + dy * Math.cos(a)
  };
}

/**
 * Posición de una butaca en coordenadas del plano.
 *
 * El SVG dibuja cada área dentro de un `<g transform>`, así que para pintar
 * bastan las coordenadas locales. Esto hace falta para lo otro: decidir qué
 * butacas cayeron dentro de una selección de marco, que se hace en coordenadas
 * del plano.
 */
export function seatPlanPoint(area: CroquisArea, row: CroquisRow, index: number): CroquisPoint {
  const local = seatLocalPoint(area, row, index);
  const center = { x: area.width / 2, y: area.height / 2 };
  const rotated = rotatePoint(local, center, area.rotation || 0);
  return { x: area.x + rotated.x, y: area.y + rotated.y };
}

// ─── Formas ───────────────────────────────────────────────────────────────────

/** Polígono por defecto de un área: la caja completa. */
export function boxPoints(): CroquisPoint[] {
  return [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ];
}

/**
 * Polígono de un abanico, la forma real de la mayoría de las lunetas: angosto
 * pegado al escenario y abierto al fondo.
 */
export function fanPoints(narrow = 0.22): CroquisPoint[] {
  return [
    { x: narrow, y: 0 },
    { x: 1 - narrow, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ];
}

/** Path SVG del área en coordenadas locales (0,0 → width,height). */
export function areaPath(area: CroquisArea): string {
  if (area.shape !== 'polygon' || !area.points?.length) {
    return `M0,0 H${area.width} V${area.height} H0 Z`;
  }
  const pts = area.points.map(p => `${(p.x * area.width).toFixed(2)},${(p.y * area.height).toFixed(2)}`);
  return `M${pts.join(' L')} Z`;
}

/** Transform del área: la posiciona y la gira alrededor de su centro. */
export function areaTransform(area: CroquisArea): string {
  const rot = area.rotation
    ? ` rotate(${area.rotation} ${area.width / 2} ${area.height / 2})`
    : '';
  return `translate(${area.x} ${area.y})${rot}`;
}

export function elementTransform(el: CroquisElement): string {
  const rot = el.rotation ? ` rotate(${el.rotation} ${el.width / 2} ${el.height / 2})` : '';
  return `translate(${el.x} ${el.y})${rot}`;
}

// ─── Utilidades de edición ────────────────────────────────────────────────────

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Redondea a la rejilla; el editor la usa para que nada quede a medio píxel. */
export const snap = (value: number, grid: number): number =>
  grid > 0 ? Math.round(value / grid) * grid : value;

/** Mantiene el área dentro del lienzo aunque se arrastre hacia afuera. */
export function clampAreaToPlan(area: CroquisArea, plan: CroquisPlan): CroquisArea {
  return {
    ...area,
    x: clamp(area.x, -area.width * 0.5, plan.width - area.width * 0.5),
    y: clamp(area.y, -area.height * 0.5, plan.height - area.height * 0.5)
  };
}

/** Caja que envuelve todo lo dibujado; sirve para el botón "ajustar a la vista". */
export function planBounds(plan: CroquisPlan): { x: number; y: number; width: number; height: number } {
  const boxes = [
    ...plan.areas.map(a => ({ x: a.x, y: a.y, w: a.width, h: a.height })),
    ...plan.elements.map(e => ({ x: e.x, y: e.y, w: e.width, h: e.height }))
  ];
  if (!boxes.length) return { x: 0, y: 0, width: plan.width, height: plan.height };

  const minX = Math.min(...boxes.map(b => b.x));
  const minY = Math.min(...boxes.map(b => b.y));
  const maxX = Math.max(...boxes.map(b => b.x + b.w));
  const maxY = Math.max(...boxes.map(b => b.y + b.h));

  const pad = 40;
  return {
    x: minX - pad,
    y: minY - pad,
    width: Math.max(120, maxX - minX + pad * 2),
    height: Math.max(120, maxY - minY + pad * 2)
  };
}

/** ¿La butaca cae dentro del marco de selección? (coordenadas del plano). */
export function pointInBox(p: CroquisPoint, box: { x: number; y: number; width: number; height: number }): boolean {
  return p.x >= box.x && p.x <= box.x + box.width && p.y >= box.y && p.y <= box.y + box.height;
}

/** Caja normalizada a partir de dos esquinas arrastradas en cualquier sentido. */
export function boxFromDrag(a: CroquisPoint, b: CroquisPoint): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y)
  };
}

/** Identificador corto y único dentro de la sesión. */
let idCounter = 0;
export function croquisId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}`;
}
