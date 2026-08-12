import {
  CroquisArea, CroquisPlan, CroquisPoint, CroquisRow, CroquisSeat, CroquisTable,
  RowLabeling
} from '../../../core/models/croquis.models';
import {
  areaPolygon, inferNumbering, orderRowSeats, renumberSeatsInRows,
  renumberTableSeats, rowLabelAt, seatFitsInArea, seatLocalPoint,
  tableSeatLocalPoint
} from './croquis-geometry';

/**
 * La revisión final del croquis: dejar en orden lo que se armó a mano.
 *
 * Un croquis se dibuja a lo largo de un rato largo —se generan filas, se
 * arrastran butacas, se borran otras, se convierte un área, se deshace medio
 * paso— y cada una de esas operaciones deja el plano correcto por su cuenta.
 * Lo que ninguna puede garantizar es el resultado del conjunto: una fila que se
 * quedó vacía y desapareció deja un hueco en las letras, un área que se encogió
 * deja butacas colgando fuera, un arrastre deja un corrimiento de dos centésimas
 * que nadie ve. Nada de eso rompe el croquis, y todo junto lo deja disparejo.
 *
 * Por eso esto corre al guardar: es la segunda pasada que revisa el plano
 * completo y lo deja como si se hubiera dibujado de un tirón.
 *
 * Lo que **no** hace es inventar criterios propios. Renumera con el esquema con
 * el que se numeró el área, reetiqueta con el que se etiquetó, y en cuanto
 * encuentra un nombre puesto a mano —una "Mesa de Honor", una fila que no se
 * llama ni con letra ni con número— se aparta y lo deja como está. Corregir no
 * puede significar pisar una decisión que alguien tomó a propósito.
 */

// ─── Qué se corrigió ──────────────────────────────────────────────────────────

export interface CroquisFixes {
  /** Butacas cuyo número no correspondía a su posición. */
  renumbered: number;
  /** Filas cuya letra no seguía el orden del recinto. */
  relabelled: number;
  /** Filas que se habían quedado sin ninguna butaca. */
  emptyRows: number;
  /** Mesas renumeradas por su sitio en el salón. */
  tables: number;
  /** Lugares que habían quedado fuera de su área y se metieron de vuelta. */
  pulledIn: number;
  /** Corrimientos de medio píxel que sobraban del arrastre. */
  cleaned: number;
}

export const NO_FIXES: CroquisFixes = {
  renumbered: 0, relabelled: 0, emptyRows: 0, tables: 0, pulledIn: 0, cleaned: 0
};

export function totalFixes(fixes: CroquisFixes): number {
  return fixes.renumbered + fixes.relabelled + fixes.emptyRows + fixes.tables + fixes.pulledIn + fixes.cleaned;
}

/** Resumen en una línea de lo que se corrigió, para decírselo a quien dibuja. */
export function describeFixes(fixes: CroquisFixes): string {
  const partes: string[] = [];
  if (fixes.renumbered) partes.push(`${fixes.renumbered} butaca(s) renumerada(s)`);
  if (fixes.relabelled) partes.push(`${fixes.relabelled} fila(s) reetiquetada(s)`);
  if (fixes.emptyRows) partes.push(`${fixes.emptyRows} fila(s) vacía(s) eliminada(s)`);
  if (fixes.tables) partes.push(`${fixes.tables} mesa(s) reacomodada(s)`);
  if (fixes.pulledIn) partes.push(`${fixes.pulledIn} lugar(es) devuelto(s) a su área`);
  if (fixes.cleaned) partes.push(`${fixes.cleaned} corrimiento(s) limpiado(s)`);
  return partes.join(' · ');
}

// ─── Etiquetas ────────────────────────────────────────────────────────────────

const ES_LETRA = /^[A-Z]+$/;
const ES_NUMERO = /^\d+$/;
/** El nombre que pone el asistente de mesas; cualquier otro es de alguien. */
const MESA_POR_DEFECTO = /^Mesa \d+$/;

/**
 * Con qué esquema se etiquetaron las filas del área.
 *
 * Devuelve `null` en cuanto alguna fila lleva un nombre que no es ni letra ni
 * número: eso quiere decir que alguien lo escribió, y reetiquetar borraría lo
 * que quiso decir.
 */
function labellingOf(area: CroquisArea, rows: CroquisRow[]): { labeling: RowLabeling; startLabel: string } | null {
  const labels = rows.map(r => (r.label || '').trim().toUpperCase());
  if (!labels.length) return null;

  if (labels.every(l => ES_NUMERO.test(l))) {
    return { labeling: 'numeros', startLabel: area.startLabel || labels[0] };
  }
  if (labels.every(l => ES_LETRA.test(l))) {
    const start = area.startLabel && ES_LETRA.test(area.startLabel.toUpperCase())
      ? area.startLabel.toUpperCase()
      : labels[0];
    return { labeling: 'letras', startLabel: start };
  }
  return null;
}

// ─── Posiciones ───────────────────────────────────────────────────────────────

/**
 * Devuelve un lugar que quedó fuera de su área al punto más cercano de dentro.
 *
 * Se busca sobre la recta que va del centro del área al lugar: es el camino más
 * corto hacia adentro y funciona igual con un rectángulo que con un abanico. Un
 * lugar fuera del área no es un lugar mal puesto —es un lugar al que el área no
 * le da fila, ni número, ni precio— y dejarlo ahí es dejarlo invendible.
 */
function pullInside(area: CroquisArea, point: CroquisPoint): CroquisPoint | null {
  const polygon = areaPolygon(area);
  if (seatFitsInArea(area, point, polygon)) return null;

  const center = polygon.reduce(
    (acc, p) => ({ x: acc.x + p.x / polygon.length, y: acc.y + p.y / polygon.length }),
    { x: 0, y: 0 }
  );
  if (!seatFitsInArea(area, center, polygon)) return null;

  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    const probe = { x: center.x + (point.x - center.x) * mid, y: center.y + (point.y - center.y) * mid };
    if (seatFitsInArea(area, probe, polygon)) lo = mid;
    else hi = mid;
  }

  return { x: center.x + (point.x - center.x) * lo, y: center.y + (point.y - center.y) * lo };
}

/** Corrimientos por debajo de esto son basura del arrastre, no una decisión. */
const RUIDO = 0.06;

function cleanOffset(seat: CroquisSeat): { seat: CroquisSeat; cleaned: boolean } {
  const dx = seat.dx || 0;
  const dy = seat.dy || 0;
  if (!dx && !dy) return { seat, cleaned: false };
  if (Math.abs(dx) >= RUIDO || Math.abs(dy) >= RUIDO) return { seat, cleaned: false };
  return { seat: { ...seat, dx: undefined, dy: undefined }, cleaned: true };
}

// ─── Áreas ────────────────────────────────────────────────────────────────────

/**
 * Deja un área como si se hubiera dibujado de un tirón.
 *
 * El orden importa: primero se tira lo que sobra, luego se mete de vuelta lo que
 * quedó fuera —porque eso cambia posiciones— y solo al final se cuenta y se
 * nombra, cuando ya nada se va a mover.
 */
export function normalizeArea(area: CroquisArea, fixes: CroquisFixes): CroquisArea {
  if (area.kind === 'general') return area;

  // 1. Filas sin nadie: su letra ya no nombra ningún lugar del recinto.
  const alive = area.rows.filter(row => row.seats.length > 0);
  fixes.emptyRows += area.rows.length - alive.length;

  // 2. De adelante hacia atrás, que es como se cuenta un recinto.
  const ordered = [...alive].sort((l, r) => l.y - r.y || l.x - r.x);

  // 3. Lugares fuera del área y corrimientos de ruido.
  let rows: CroquisRow[] = ordered.map(row => {
    const seats = row.seats.map((seat, index) => {
      const point = seatLocalPoint(area, row, index);
      const inside = pullInside(area, point);

      if (inside) {
        fixes.pulledIn += 1;
        // El corrimiento absorbe la corrección: la butaca conserva su sitio en
        // la rejilla y solo se recoloca lo justo para volver a caber.
        const base = { x: point.x - (seat.dx || 0), y: point.y - (seat.dy || 0) };
        return {
          ...seat,
          dx: Math.round((inside.x - base.x) * 10) / 10 || undefined,
          dy: Math.round((inside.y - base.y) * 10) / 10 || undefined
        };
      }

      const limpio = cleanOffset(seat);
      if (limpio.cleaned) fixes.cleaned += 1;
      return limpio.seat;
    });

    // 4. Orden de detección: el arreglo tiene que ir como va el recinto.
    return { ...row, seats: orderRowSeats(area, { ...row, seats }).seats };
  });

  // 5. Las letras siguen el orden del recinto, salvo que alguien las escribiera.
  const labelling = labellingOf(area, rows);
  if (labelling) {
    rows = rows.map((row, index) => {
      const label = rowLabelAt(index, labelling.labeling, labelling.startLabel);
      if (label === row.label) return row;
      fixes.relabelled += 1;
      return { ...row, label };
    });
  }

  // 6. Y los números, la posición que ocupa cada butaca en su fila.
  const numbering = inferNumbering({ ...area, rows });
  const antes = new Map<string, string>();
  for (const row of rows) for (let i = 0; i < row.seats.length; i++) antes.set(`${row.id}|${i}`, row.seats[i].number);

  rows = renumberSeatsInRows(rows, numbering, new Set(rows.map(r => r.id)));
  for (const row of rows) {
    for (let i = 0; i < row.seats.length; i++) {
      if (antes.get(`${row.id}|${i}`) !== row.seats[i].number) fixes.renumbered += 1;
    }
  }

  // ─── Mesas ───
  const tables = normalizeTables(area, fixes);

  return {
    ...area,
    numbering,
    labeling: labelling?.labeling ?? area.labeling,
    startLabel: labelling?.startLabel ?? area.startLabel,
    rows,
    tables: area.tables ? tables : area.tables
  };
}

function normalizeTables(area: CroquisArea, fixes: CroquisFixes): CroquisTable[] {
  const ordered = [...(area.tables || [])].sort((l, r) => l.y - r.y || l.x - r.x);
  // Solo se renumeran las que llevan el nombre que pone el asistente: una "Mesa
  // de Honor" se llama así porque alguien lo decidió.
  const renombrables = ordered.every(t => MESA_POR_DEFECTO.test(t.label));

  return ordered.map((table, index) => {
    let cambiada = false;

    // Las posiciones alrededor de la mesa tienen que alcanzar para las sillas
    // que hay: si no, dos acabarían sentadas en el mismo sitio.
    const maxSlot = table.seats.reduce((max, s) => Math.max(max, s.slot || 0), 0);
    const slots = Math.max(1, table.slots || 0, maxSlot + 1, table.seats.length);
    if (slots !== table.slots) cambiada = true;

    // Y dos sillas no pueden ocupar la misma: pasa al arrastrar una hacia una
    // mesa llena, y mientras siga así la mesa no se puede contar —dos lugares
    // con el mismo sitio son dos boletos para la misma silla.
    const ocupadas = new Set<number>();
    const sentadas: CroquisSeat[] = [...table.seats]
      .sort((l, r) => (l.slot || 0) - (r.slot || 0))
      .map(seat => {
        const slot = seat.slot || 0;
        if (!ocupadas.has(slot) && slot < slots) {
          ocupadas.add(slot);
          return seat;
        }

        // Se busca hacia los dos lados: la silla de más se queda junto a donde
        // la soltaron, no al final de la mesa.
        let libre = slot;
        for (let paso = 1; paso <= slots; paso++) {
          const derecha = (slot + paso) % slots;
          const izquierda = ((slot - paso) % slots + slots) % slots;
          if (!ocupadas.has(derecha)) { libre = derecha; break; }
          if (!ocupadas.has(izquierda)) { libre = izquierda; break; }
        }

        ocupadas.add(libre);
        cambiada = true;
        // El corrimiento medía contra el sitio viejo; en el nuevo no significa
        // nada, así que la silla vuelve limpia a su lugar alrededor de la mesa.
        return { ...seat, slot: libre, dx: undefined, dy: undefined };
      });

    const seats = sentadas.map(seat => {
      const point = tableSeatLocalPoint(table, seat);
      const inside = pullInside(area, point);
      if (!inside) {
        const limpio = cleanOffset(seat);
        if (limpio.cleaned) { fixes.cleaned += 1; cambiada = true; }
        return limpio.seat;
      }

      fixes.pulledIn += 1;
      cambiada = true;
      // La silla vuelve a su posición limpia alrededor de la mesa: si la mesa
      // cabe, el lugar de la rejilla cabe, y arrastrarla al borde solo dejaría
      // una silla apretada contra la pared.
      return { ...seat, dx: undefined, dy: undefined };
    });

    // Se compara por posición alrededor de la mesa y no por índice: renumerar
    // reordena el arreglo, y comparar índice contra índice contaría como cambio
    // de número lo que solo fue un cambio de orden.
    const numerada = renumberTableSeats({ ...table, slots, seats });
    const antes = new Map(seats.map(s => [s.slot || 0, s.number]));
    if (numerada.seats.some(s => antes.get(s.slot || 0) !== s.number)) cambiada = true;

    const label = renombrables ? `Mesa ${index + 1}` : table.label;
    if (label !== table.label) cambiada = true;

    if (cambiada) fixes.tables += 1;
    return { ...numerada, label };
  });
}

// ─── Croquis completo ─────────────────────────────────────────────────────────

/**
 * Revisa y corrige todos los croquis del evento.
 *
 * Devuelve los planos nuevos solo si algo cambió: emitir un parche idéntico
 * dispararía el guardado y la bitácora sin que nada haya pasado, que es
 * exactamente el ruido que hace inservible una trazabilidad.
 */
export function normalizeCroquis(plans: CroquisPlan[]): { plans: CroquisPlan[] | null; fixes: CroquisFixes } {
  const fixes: CroquisFixes = { ...NO_FIXES };

  const next = plans.map(plan => ({
    ...plan,
    areas: plan.areas.map(area => normalizeArea(area, fixes))
  }));

  return { plans: totalFixes(fixes) > 0 ? next : null, fixes };
}
