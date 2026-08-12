import {
  CroquisArea,
  CroquisElement,
  CroquisPlan,
  CroquisPoint,
  CroquisRow,
  CroquisSeat,
  CroquisTable,
  RowLabeling,
  ROW_GAP,
  SeatGridOptions,
  SeatNumbering,
  SEAT_GAP,
  SEAT_SIZE,
  TableGridOptions,
  TABLE_GAP,
  TABLE_SEAT_OFFSET,
  TABLE_SIZE
} from '../../../core/models/croquis.models';

/**
 * Geometría del croquis: dónde cae cada butaca y qué forma tiene cada área.
 *
 * Todo lo de aquí es determinista y sin estado. El editor solo guarda el origen
 * de cada fila, su ángulo y su separación; la posición de las butacas se calcula
 * cada vez. Es a propósito: mover una fila de 60 lugares es cambiar dos números
 * en vez de reescribir 60 pares de coordenadas, y re-espaciar el área completa
 * no arrastra basura de posiciones viejas.
 *
 * Sobre la rejilla va el corrimiento por butaca (`dx`/`dy`), que es lo que
 * permite sacar lugares del renglón sin dejar de tenerlos ordenados: la rejilla
 * sigue diciendo a qué fila y a qué número pertenece cada uno, y el corrimiento
 * solo dice dónde acabó parado. Sin esa separación, arrastrar una butaca sería
 * romper la fila entera.
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
 *
 * Antes de numerar se acomodan por dónde quedaron paradas. Es lo que hace que
 * renumerar siga sirviendo después de mover lugares a mano: si se numerara por
 * el orden del arreglo, una butaca arrastrada al otro extremo de la fila se
 * quedaría con el número del lugar de donde salió y el boleto mandaría al
 * comprador al asiento equivocado.
 */
export function renumberArea(area: CroquisArea, numbering: SeatNumbering, labeling: RowLabeling, startLabel?: string): CroquisRow[] {
  // Las filas también se acomodan entre sí, de adelante hacia atrás: mover una
  // fila entera debe cambiarle la letra, no dejarla como la fila D en medio de
  // la A y la B.
  const ordered = [...area.rows].sort((l, r) => l.y - r.y || l.x - r.x);

  let running = 0;
  return ordered.map((row, r) => {
    const seats = orderRowSeats(area, row).seats;
    const numbers = seatNumbers(seats.length, numbering, running);
    running += seats.length;
    return {
      ...row,
      label: rowLabelAt(r, labeling, startLabel),
      seats: seats.map((seat, i) => ({ ...seat, number: numbers[i] }))
    };
  });
}

/**
 * Reparte los números de las filas indicadas por dónde está parada cada butaca.
 *
 * Es lo que mantiene el boleto pegado al lugar: el número no es un nombre que la
 * butaca se lleva consigo, es la posición que ocupa en su fila. Mover la A3 más
 * allá de la A5 la convierte en la A5 y corre a las demás, exactamente como si
 * el acomodador hubiera vuelto a contar la fila.
 *
 * Solo se renumeran las filas que se tocaron, salvo con numeración `corrida`:
 * ahí los números siguen de una fila a la siguiente, así que cambiar una obliga
 * a recorrer todas o el conteo se rompe a media zona.
 */
export function renumberSeatsInRows(
  rows: CroquisRow[],
  numbering: SeatNumbering,
  touched: Set<string>
): CroquisRow[] {
  // El conteo corrido va de adelante hacia atrás, no en el orden en que las
  // filas quedaron guardadas.
  const order = [...rows].sort((l, r) => l.y - r.y || l.x - r.x);
  const corrida = numbering === 'corrida';

  const numbers = new Map<string, string[]>();
  let running = 0;

  for (const row of order) {
    const nums = seatNumbers(row.seats.length, numbering, running);
    running += row.seats.length;
    if (corrida || touched.has(row.id)) numbers.set(row.id, nums);
  }

  return rows.map(row => {
    const nums = numbers.get(row.id);
    if (!nums) return row;
    return { ...row, seats: row.seats.map((seat, i) => ({ ...seat, number: nums[i] })) };
  });
}

/**
 * Con qué esquema estaba numerada el área.
 *
 * Los croquis dibujados antes de que el área recordara su esquema no traen el
 * dato, y renumerarlos a ciegas convertiría un teatro numerado por nones y pares
 * en uno de 1 a 30 —cambiándole el número a la mitad de las butacas de un
 * recinto que quizá ya vendió boletos. Así que se deduce de lo que dicen los
 * números que ya están puestos, que es la única fuente que queda.
 */
export function inferNumbering(area: CroquisArea): SeatNumbering {
  if (area.numbering) return area.numbering;

  const rows = [...area.rows].filter(r => r.seats.length > 1).sort((l, r) => l.y - r.y || l.x - r.x);
  if (!rows.length) return 'izquierda-derecha';

  const read = (row: CroquisRow) => orderRowSeats(area, row).seats.map(s => Number(s.number));
  const first = read(rows[0]);
  if (first.some(n => !Number.isFinite(n))) return 'izquierda-derecha';

  const n = first.length;
  const half = Math.ceil(n / 2);
  if (first.every((v, i) => (i < half ? v === (half - i) * 2 - 1 : v === (i - half + 1) * 2))) {
    return 'impares-pares';
  }
  if (first.every((v, i) => v === n - i)) return 'derecha-izquierda';
  if (rows.length > 1 && read(rows[1])[0] === first[n - 1] + 1) return 'corrida';

  return 'izquierda-derecha';
}

// ─── Detección por cercanía ───────────────────────────────────────────────────

/**
 * Qué tan lejos cae un punto de una fila, en el marco de la propia fila.
 *
 * Manda la distancia *a través* de la fila —a qué altura quedó— y no la distancia
 * en línea recta: una butaca soltada a la altura de la fila B pertenece a la B
 * aunque haya quedado en la otra punta del área. Salirse a lo largo sí cuenta,
 * pero a mitad de precio, para que una butaca puesta más allá del final de una
 * fila corta prefiera la fila larga que sí llega hasta ahí.
 *
 * La medición es contra la butaca vecina más cercana y no contra el eje recto de
 * la fila: en una zona curvada el eje se aleja hasta veinte unidades del centro
 * de la fila, y midiendo contra él una butaca bien puesta parecería estar en la
 * fila de atrás.
 */
export function rowProximity(
  area: CroquisArea,
  row: CroquisRow,
  point: CroquisPoint,
  skip?: Set<number>
): number {
  const a = rad(row.angle || 0);
  const dirX = Math.cos(a);
  const dirY = Math.sin(a);
  const project = (p: CroquisPoint) => ({
    along: p.x * dirX + p.y * dirY,
    across: -p.x * dirY + p.y * dirX
  });

  const target = project(point);
  let nearest: { along: number; across: number } | null = null;
  let minAlong = Infinity;
  let maxAlong = -Infinity;
  let bestGap = Infinity;

  for (let i = 0; i < row.seats.length; i++) {
    if (skip?.has(i)) continue;
    const p = project(seatLocalPoint(area, row, i));
    minAlong = Math.min(minAlong, p.along);
    maxAlong = Math.max(maxAlong, p.along);

    const gap = Math.abs(p.along - target.along);
    if (gap < bestGap) { bestGap = gap; nearest = p; }
  }

  // Una fila que se quedó sin butacas conserva su origen, y es contra eso contra
  // lo que se mide: sigue siendo un renglón del recinto hasta que se borra.
  if (!nearest) {
    const origin = project({ x: row.x, y: row.y });
    return Math.abs(target.across - origin.across) + Math.abs(target.along - origin.along) * 0.5;
  }

  const outside = Math.max(0, minAlong - target.along, target.along - maxAlong);
  return Math.abs(target.across - nearest.across) + outside * 0.5;
}

/** La fila del área a la que de verdad pertenece este punto. */
export function nearestRow(
  area: CroquisArea,
  point: CroquisPoint,
  skip?: Map<string, Set<number>>
): CroquisRow | null {
  let best: CroquisRow | null = null;
  let bestDistance = Infinity;

  for (const row of area.rows) {
    const distance = rowProximity(area, row, point, skip?.get(row.id));
    if (distance < bestDistance) { bestDistance = distance; best = row; }
  }

  return best;
}

/** En qué posición de la rejilla de la fila cae este punto. */
export function rowSlotFor(row: CroquisRow, point: CroquisPoint): number {
  const a = rad(row.angle || 0);
  const along = (point.x - row.x) * Math.cos(a) + (point.y - row.y) * Math.sin(a);
  return Math.max(0, Math.round(along / (row.gap || SEAT_GAP)));
}

/** La mesa del área más cercana a este punto; gana el tablero, no la silla. */
export function nearestTable(area: CroquisArea, point: CroquisPoint): CroquisTable | null {
  let best: CroquisTable | null = null;
  let bestDistance = Infinity;

  for (const table of area.tables || []) {
    const distance = Math.hypot(table.x - point.x, table.y - point.y);
    if (distance < bestDistance) { bestDistance = distance; best = table; }
  }

  return best;
}

/**
 * En qué lugar de la mesa cae este punto.
 *
 * Se prefieren las posiciones libres: soltar una silla encima de otra quiere
 * decir "ponla por aquí", no "amontónalas", y con la mesa llena se acepta la más
 * cercana aunque esté ocupada.
 */
export function tableSlotFor(table: CroquisTable, localPoint: CroquisPoint, taken?: Set<number>): number {
  const rel = rotatePoint(
    { x: localPoint.x - table.x, y: localPoint.y - table.y },
    { x: 0, y: 0 },
    -(table.rotation || 0)
  );

  const slots = Math.max(1, table.slots || table.seats.length || 1);
  let best = 0;
  let bestDistance = Infinity;
  let bestFree: number | null = null;
  let bestFreeDistance = Infinity;

  for (let slot = 0; slot < slots; slot++) {
    const o = tableSeatOffset(table, { number: '', slot });
    const d = Math.hypot(o.x - rel.x, o.y - rel.y);
    if (d < bestDistance) { bestDistance = d; best = slot; }
    if (!taken?.has(slot) && d < bestFreeDistance) { bestFreeDistance = d; bestFree = slot; }
  }

  return bestFree ?? best;
}

/**
 * Re-numera las sillas de una mesa por dónde están sentadas.
 *
 * Alrededor de una mesa el lugar 1 es el de arriba y se sigue el sentido del
 * reloj, que es como los cuenta el capitán de meseros y como los busca quien
 * llega con su boleto.
 */
export function renumberTableSeats(table: CroquisTable): CroquisTable {
  const ordered = [...table.seats].sort((l, r) => (l.slot || 0) - (r.slot || 0));
  return { ...table, seats: ordered.map((seat, i) => ({ ...seat, number: String(i + 1) })) };
}

/**
 * Re-numera las sillas de cada mesa, en el sentido en que están sentadas.
 *
 * Las mesas no se numeran con el esquema de las filas: alrededor de una mesa el
 * lugar 1 es el de arriba y se sigue el sentido del reloj, que es como los
 * cuenta el capitán de meseros y como los busca quien llega con su boleto.
 */
export function renumberTables(area: CroquisArea, labeling: RowLabeling, startLabel?: string): CroquisTable[] {
  const ordered = [...(area.tables || [])].sort((l, r) => l.y - r.y || l.x - r.x);

  return ordered.map((table, index) => ({
    ...renumberTableSeats(table),
    label: `Mesa ${rowLabelAt(index, labeling, startLabel)}`
  }));
}

// ─── Posición de las butacas ──────────────────────────────────────────────────

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Hasta qué `slot` llega la fila.
 *
 * Se memoriza por objeto fila porque hace falta una vez por butaca al pintar y
 * recorrer el arreglo cada vez volvería cuadrático el dibujo de un recinto
 * grande. El editor rehace las filas en cada cambio, así que las entradas viejas
 * se recogen solas.
 */
const rowSpanCache = new WeakMap<CroquisRow, number>();

function rowSpan(row: CroquisRow): number {
  const cached = rowSpanCache.get(row);
  if (cached !== undefined) return cached;

  let max = 0;
  for (const seat of row.seats) max = Math.max(max, seat.slot || 0);
  const span = Math.max(1, max);
  rowSpanCache.set(row, span);
  return span;
}

/**
 * Cuánto se hunde el centro de la fila cuando el área está curvada.
 *
 * Las filas de un recinto real abrazan el escenario: los extremos quedan más
 * cerca y el centro más lejos. Se aproxima con una parábola —cero en las puntas,
 * máximo al centro— porque a la escala de un croquis es indistinguible de un
 * arco y cuesta una multiplicación en vez de trigonometría por butaca.
 *
 * Se mide sobre el `slot` y no sobre el índice del arreglo. Es lo que hace que
 * la posición de una butaca no dependa de en qué lugar del arreglo esté
 * guardada: así reacomodar el orden de detección después de mover lugares a mano
 * no arrastra ninguna butaca, y de paso un pasillo a media fila deja de partir la
 * curva en dos.
 */
function curveOffset(area: CroquisArea, row: CroquisRow, seat: CroquisSeat | undefined): number {
  const curve = area.curve || 0;
  if (curve <= 0 || row.seats.length < 3) return 0;

  const t = (seat?.slot || 0) / rowSpan(row);
  const bow = Math.min(area.width, area.height) * 0.22 * curve;
  return bow * (1 - Math.pow(2 * t - 1, 2));
}

/** Posición de una butaca dentro del área, antes de rotar el área. */
export function seatLocalPoint(area: CroquisArea, row: CroquisRow, index: number): CroquisPoint {
  const seat = row.seats[index];
  const a = rad(row.angle || 0);
  const d = (seat?.slot ?? index) * row.gap;
  const dip = curveOffset(area, row, seat);

  return {
    x: row.x + d * Math.cos(a) - dip * Math.sin(a) + (seat?.dx || 0),
    y: row.y + d * Math.sin(a) + dip * Math.cos(a) + (seat?.dy || 0)
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
  return areaLocalToPlan(area, seatLocalPoint(area, row, index));
}

/** Punto del área (sin girar) llevado a coordenadas del plano. */
export function areaLocalToPlan(area: CroquisArea, p: CroquisPoint): CroquisPoint {
  const center = { x: area.width / 2, y: area.height / 2 };
  const rotated = rotatePoint(p, center, area.rotation || 0);
  return { x: area.x + rotated.x, y: area.y + rotated.y };
}

/**
 * Punto del plano llevado a coordenadas del área.
 *
 * Es la vuelta que hace falta para arrastrar: el mouse se mueve en el plano y
 * los corrimientos de las butacas viven dentro del área, así que sin deshacer el
 * giro del área una butaca de una zona girada 20° se iría en diagonal respecto
 * del cursor.
 */
export function planToAreaLocal(area: CroquisArea, p: CroquisPoint): CroquisPoint {
  const center = { x: area.width / 2, y: area.height / 2 };
  return rotatePoint({ x: p.x - area.x, y: p.y - area.y }, center, -(area.rotation || 0));
}

/** Desplazamiento del plano llevado a la orientación del área. */
export function planDeltaToAreaLocal(area: CroquisArea, delta: CroquisPoint): CroquisPoint {
  return rotatePoint(delta, { x: 0, y: 0 }, -(area.rotation || 0));
}

// ─── Mesas ────────────────────────────────────────────────────────────────────

/**
 * Dónde se sienta cada silla respecto del centro de su mesa, antes de girarla.
 *
 * La posición sale del `slot` y del total de posiciones, no de cuántas sillas
 * queden: quitar una silla de una mesa de diez tiene que dejar el hueco donde
 * estaba, no repartir las otras nueve y girar la mesa entera.
 */
export function tableSeatOffset(table: CroquisTable, seat: CroquisSeat): CroquisPoint {
  const slots = Math.max(1, table.slots || table.seats.length || 1);
  const slot = ((seat.slot || 0) % slots + slots) % slots;
  const dx = seat.dx || 0;
  const dy = seat.dy || 0;

  if (table.shape === 'rectangular') {
    const w = table.width;
    const h = table.height;
    const perimeter = 2 * (w + h);
    // Media posición de corrimiento: repartir a secas dejaría una silla clavada
    // en cada esquina, que es justo donde nadie se sienta.
    let d = ((slot + 0.5) / slots) * perimeter;

    let x: number, y: number, nx: number, ny: number;
    if (d < w) { x = -w / 2 + d; y = -h / 2; nx = 0; ny = -1; }
    else if ((d -= w) < h) { x = w / 2; y = -h / 2 + d; nx = 1; ny = 0; }
    else if ((d -= h) < w) { x = w / 2 - d; y = h / 2; nx = 0; ny = 1; }
    else { d -= w; x = -w / 2; y = h / 2 - d; nx = -1; ny = 0; }

    return { x: x + nx * TABLE_SEAT_OFFSET + dx, y: y + ny * TABLE_SEAT_OFFSET + dy };
  }

  // Redonda: se arranca arriba y se gira en el sentido del reloj, que es como
  // se numeran las mesas en un montaje.
  const radius = table.width / 2 + TABLE_SEAT_OFFSET;
  const angle = -Math.PI / 2 + (2 * Math.PI * slot) / slots;
  return { x: Math.cos(angle) * radius + dx, y: Math.sin(angle) * radius + dy };
}

/** Posición de una silla dentro del área, antes de girar el área. */
export function tableSeatLocalPoint(table: CroquisTable, seat: CroquisSeat): CroquisPoint {
  const offset = rotatePoint(tableSeatOffset(table, seat), { x: 0, y: 0 }, table.rotation || 0);
  return { x: table.x + offset.x, y: table.y + offset.y };
}

/** Posición de una silla en coordenadas del plano. */
export function tableSeatPlanPoint(area: CroquisArea, table: CroquisTable, seat: CroquisSeat): CroquisPoint {
  return areaLocalToPlan(area, tableSeatLocalPoint(table, seat));
}

/** Transform del grupo de la mesa: la mesa se dibuja centrada en su origen. */
export function tableTransform(table: CroquisTable): string {
  const rot = table.rotation ? ` rotate(${table.rotation})` : '';
  return `translate(${table.x} ${table.y})${rot}`;
}

/** Radio que ocupa la mesa con todo y sus sillas; sirve para no encimarlas. */
export function tableRadius(table: CroquisTable): number {
  const half = table.shape === 'rectangular'
    ? Math.max(table.width, table.height) / 2
    : table.width / 2;
  return half + TABLE_SEAT_OFFSET + SEAT_SIZE / 2;
}

export function defaultTableOptions(): TableGridOptions {
  return {
    rows: 3,
    perRow: 4,
    seatsPerTable: 8,
    shape: 'redonda',
    rental: 'completa',
    minSeats: 1,
    size: TABLE_SIZE,
    height: TABLE_SIZE,
    gap: TABLE_GAP,
    rowGap: TABLE_GAP,
    startLabel: '1',
    labeling: 'numeros'
  };
}

/** Cuántas mesas de este tamaño caben en un área así de grande. */
export function fitTables(width: number, height: number, gap = TABLE_GAP, rowGap = TABLE_GAP): { rows: number; perRow: number } {
  return {
    rows: Math.max(1, Math.floor((height - gap * 0.6) / rowGap)),
    perRow: Math.max(1, Math.floor((width - gap * 0.6) / gap))
  };
}

/**
 * Acomoda las mesas de un área en rejilla.
 *
 * Se numeran corridas —Mesa 1, Mesa 2, Mesa 3…— recorriendo hilera por hilera,
 * porque así es como las nombra quien monta el salón y como las busca quien
 * llega con su boleto en la mano. Una vez puestas, cada mesa se arrastra a donde
 * toque: casi ningún montaje real es una rejilla perfecta.
 */
export function buildTables(area: CroquisArea, options: TableGridOptions, idSeed: string): CroquisTable[] {
  const { rows, perRow, seatsPerTable, shape } = options;
  const width = Math.max(24, options.size);
  const height = shape === 'rectangular' ? Math.max(24, options.height) : width;

  // Se aprietan para caber en el área en vez de desbordarse sobre la de al lado.
  const fit = (available: number, count: number, wanted: number, min: number) =>
    count > 1 ? Math.max(min, Math.min(wanted, available / (count - 1))) : wanted;

  const minGapX = width + TABLE_SEAT_OFFSET * 2 + SEAT_SIZE + 6;
  const minGapY = height + TABLE_SEAT_OFFSET * 2 + SEAT_SIZE + 6;
  const marginX = width / 2 + TABLE_SEAT_OFFSET + SEAT_SIZE / 2 + 4;
  const marginY = height / 2 + TABLE_SEAT_OFFSET + SEAT_SIZE / 2 + 4;

  const gap = fit(area.width - marginX * 2, perRow, options.gap, minGapX);
  const rowGap = fit(area.height - marginY * 2, rows, options.rowGap, minGapY);

  const startX = Math.max(marginX, (area.width - (perRow - 1) * gap) / 2);
  const startY = marginY;

  const tables: CroquisTable[] = [];
  let n = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < perRow; c++) {
      const label = rowLabelAt(n, options.labeling, options.startLabel);
      tables.push({
        id: `${idSeed}-t${n + 1}`,
        label: `Mesa ${label}`,
        x: startX + c * gap,
        y: startY + r * rowGap,
        shape,
        width,
        height,
        rotation: 0,
        slots: Math.max(1, seatsPerTable),
        seats: Array.from({ length: Math.max(1, seatsPerTable) }, (_, i) => ({
          number: String(i + 1),
          slot: i
        })),
        rental: options.rental,
        minSeats: Math.max(1, options.minSeats || 1)
      });
      n += 1;
    }
  }

  return tables;
}

/** Una mesa suelta, para el botón de "agregar mesa" del inspector. */
export function makeTable(label: string, x: number, y: number, options?: Partial<TableGridOptions>): CroquisTable {
  const o = { ...defaultTableOptions(), ...options };
  const seats = Math.max(1, o.seatsPerTable);
  return {
    id: croquisId('tb'),
    label,
    x,
    y,
    shape: o.shape,
    width: Math.max(24, o.size),
    height: o.shape === 'rectangular' ? Math.max(24, o.height) : Math.max(24, o.size),
    rotation: 0,
    slots: seats,
    seats: Array.from({ length: seats }, (_, i) => ({ number: String(i + 1), slot: i })),
    rental: o.rental,
    minSeats: Math.max(1, o.minSeats || 1)
  };
}

/**
 * Reparte de nuevo las sillas de una mesa cuando cambia cuántas caben.
 *
 * Se conservan las que ya existían con su número y su estado de venta: subir una
 * mesa de ocho a diez lugares no puede desvender los ocho boletos que ya se
 * cobraron.
 */
export function resizeTableSeats(table: CroquisTable, slots: number): CroquisTable {
  const next = Math.max(1, Math.round(slots));
  const kept: CroquisSeat[] = table.seats
    .filter(s => (s.slot || 0) < next)
    .map(s => ({ ...s, dx: undefined, dy: undefined }));

  const used = new Set(kept.map(s => s.slot || 0));
  for (let slot = 0; slot < next; slot++) {
    if (used.has(slot)) continue;
    kept.push({ number: String(slot + 1), slot });
  }

  return { ...table, slots: next, seats: kept.sort((a, b) => (a.slot || 0) - (b.slot || 0)) };
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

// ─── Dentro y fuera del área ──────────────────────────────────────────────────

/** Vértices del área en coordenadas locales, sea rectángulo o polígono. */
export function areaPolygon(area: CroquisArea): CroquisPoint[] {
  if (area.shape !== 'polygon' || !area.points?.length) {
    return [
      { x: 0, y: 0 },
      { x: area.width, y: 0 },
      { x: area.width, y: area.height },
      { x: 0, y: area.height }
    ];
  }
  return area.points.map(p => ({ x: p.x * area.width, y: p.y * area.height }));
}

/** Lanzamiento de rayo: par de cruces = fuera, impar = dentro. */
export function pointInPolygon(p: CroquisPoint, polygon: CroquisPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses = a.y > p.y !== b.y > p.y;
    if (crosses && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y || 1e-9) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * ¿Cabe una butaca centrada aquí, sin salirse del área?
 *
 * Se comprueban las cuatro esquinas del cuadrito y no solo su centro. Fuera del
 * área una butaca no es un lugar mal puesto: es un lugar que el área no numera,
 * al que no le toca categoría ni precio, y que en el recinto cae en el pasillo.
 * Con solo el centro, media butaca podría quedar colgando del borde.
 */
export function seatFitsInArea(area: CroquisArea, point: CroquisPoint, polygon?: CroquisPoint[]): boolean {
  const poly = polygon || areaPolygon(area);
  const m = SEAT_SIZE / 2 + 1;
  return (
    pointInPolygon({ x: point.x - m, y: point.y - m }, poly) &&
    pointInPolygon({ x: point.x + m, y: point.y - m }, poly) &&
    pointInPolygon({ x: point.x + m, y: point.y + m }, poly) &&
    pointInPolygon({ x: point.x - m, y: point.y + m }, poly)
  );
}

/**
 * Recorta un arrastre para que ningún lugar acabe fuera del área.
 *
 * Se recorta el desplazamiento completo y no cada butaca por su cuenta: pegar
 * una a una contra el borde deformaría el bloque que se está moviendo, y quien
 * arrastra treinta butacas juntas espera que lleguen juntas o que se frenen
 * juntas.
 *
 * Cada eje se recorta por separado para poder deslizarse a lo largo del borde:
 * recortando los dos a la vez, arrimar una mesa a la pared de arriba la frenaba
 * también de lado y arrastrarla se sentía como si se hubiera atorado. Cuando el
 * área es cóncava esa combinación puede caer en el hueco, y ahí sí se recorta el
 * arrastre entero, que es la única respuesta que no saca nada del área.
 *
 * Los lugares que ya estaban fuera —porque alguien encogió el área después de
 * dibujarlos— no frenan a nadie: si contaran, quedarían atrapados para siempre
 * sin manera de meterlos de vuelta.
 */
export function limitSeatDelta(area: CroquisArea, points: CroquisPoint[], delta: CroquisPoint): CroquisPoint {
  const poly = areaPolygon(area);
  const anchored = points.filter(p => seatFitsInArea(area, p, poly));
  if (!anchored.length) return delta;

  const fits = (d: CroquisPoint) =>
    anchored.every(p => seatFitsInArea(area, { x: p.x + d.x, y: p.y + d.y }, poly));

  if (fits(delta)) return delta;

  /** El tramo más largo de este desplazamiento en el que todo sigue dentro. */
  const longest = (d: CroquisPoint): CroquisPoint => {
    if (fits(d)) return d;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (fits({ x: d.x * mid, y: d.y * mid })) lo = mid;
      else hi = mid;
    }
    return { x: d.x * lo, y: d.y * lo };
  };

  const combined = {
    x: longest({ x: delta.x, y: 0 }).x,
    y: longest({ x: 0, y: delta.y }).y
  };

  return fits(combined) ? combined : longest(delta);
}

/**
 * Imanta un punto a las butacas que ya están puestas.
 *
 * Es lo que resuelve el problema de verdad: soltar una butaca "más o menos" en
 * la fila deja el croquis con lugares corridos dos unidades que nadie nota en
 * pantalla y que se ven fatal en el mapa del comprador. Cada eje se imanta por
 * separado, así que una butaca puede pegarse a la altura de su fila y al mismo
 * tiempo a la columna de la de arriba, que es exactamente como se alinea a mano.
 *
 * La tolerancia tiene que quedar por debajo de media separación entre filas
 * (`ROW_GAP`, 24) y entre butacas (`SEAT_GAP`, 21): más arriba de eso el imán
 * empezaría a jalar hacia la fila de al lado y mover una butaca la mandaría al
 * renglón equivocado.
 */
export function alignToNeighbours(point: CroquisPoint, anchors: CroquisPoint[], tolerance = 9): CroquisPoint {
  let x = point.x;
  let y = point.y;
  let bestX = tolerance;
  let bestY = tolerance;

  for (const a of anchors) {
    const dx = Math.abs(a.x - point.x);
    if (dx < bestX) { bestX = dx; x = a.x; }
    const dy = Math.abs(a.y - point.y);
    if (dy < bestY) { bestY = dy; y = a.y; }
  }

  return { x, y };
}

/**
 * Reordena las butacas de una fila por dónde quedaron paradas.
 *
 * Después de mover lugares a mano el arreglo puede dejar de ir de izquierda a
 * derecha, y eso rompe todo lo que da por hecho que el orden de detección es el
 * orden real: dónde se ancla la letra de la fila, qué renumera el asistente y en
 * qué orden lee el portal la fila al armar el boleto. Mover no cambia nada
 * visualmente —la posición cuelga del `slot` y del corrimiento, no del índice—,
 * así que esto es puro acomodo interno.
 *
 * Devuelve también de dónde vino cada butaca, para que la selección abierta
 * siga apuntando a los mismos lugares después del acomodo.
 */
export function orderRowSeats(area: CroquisArea, row: CroquisRow): { seats: CroquisSeat[]; from: number[] } {
  const a = rad(row.angle || 0);
  const dirX = Math.cos(a);
  const dirY = Math.sin(a);

  const ranked = row.seats.map((seat, index) => {
    const p = seatLocalPoint(area, row, index);
    return { index, along: p.x * dirX + p.y * dirY, across: -p.x * dirY + p.y * dirX };
  });

  ranked.sort((l, r) => (l.along - r.along) || (l.across - r.across) || (l.index - r.index));

  return {
    seats: ranked.map(r => row.seats[r.index]),
    from: ranked.map(r => r.index)
  };
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
