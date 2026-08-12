import {
  CroquisArea, CroquisElement, CroquisPlan, CroquisRow, CroquisSeat, EventCroquis
} from '../models/croquis.model';

/**
 * Croquis de ejemplo del portal.
 *
 * Reproduce lo que el panel publica, con su geometría: el escenario arriba, la
 * luneta curvada hacia él, los laterales y la pista general al fondo. Mientras
 * no haya API, esto ocupa el lugar de lo que vendrá del expediente del evento;
 * la pantalla de selección ya no sabe cómo se arma, solo lo dibuja.
 */

const PLAN_WIDTH = 1200;
const PLAN_HEIGHT = 860;
const SEAT_GAP = 21;
const ROW_GAP = 24;

/**
 * Butacas de una fila, con algunas ya vendidas de forma estable.
 *
 * La semilla es determinista a propósito: el mapa se ve igual en cada carga, que
 * es lo que uno espera de un recinto. Con aleatoriedad real, recargar movería los
 * lugares ocupados y el comprador pensaría que perdió el suyo.
 */
function buildRow(id: string, label: string, count: number, y: number, width: number, soldSeed: number): CroquisRow {
  const seats: CroquisSeat[] = [];

  for (let n = 1; n <= count; n++) {
    const seed = (label.charCodeAt(0) * n * 17 + soldSeed) % 100;
    seats.push(seed > 80 ? { number: n, slot: n - 1, state: 'vendido' } : { number: n, slot: n - 1 });
  }

  return {
    id,
    label,
    x: Math.max(12, (width - (count - 1) * SEAT_GAP) / 2),
    y,
    angle: 0,
    gap: SEAT_GAP,
    seats
  };
}

function seatedArea(
  id: string, name: string, tierId: string,
  box: { x: number; y: number; width: number; height: number },
  rows: string[], seatsPerRow: number,
  options: { curve?: number; accessNote?: string } = {}
): CroquisArea {
  return {
    id,
    name,
    numbered: true,
    tierId,
    ...box,
    rotation: 0,
    curve: options.curve ?? 0,
    accessNote: options.accessNote,
    rows: rows.map((label, i) =>
      buildRow(`${id}-r${i}`, label, seatsPerRow, 18 + i * ROW_GAP, box.width, i * 7))
  };
}

function generalArea(
  id: string, name: string, tierId: string,
  box: { x: number; y: number; width: number; height: number },
  capacity: number, sold: number, accessNote?: string
): CroquisArea {
  return {
    id, name, numbered: false, tierId, ...box,
    rotation: 0, capacity, sold, accessNote, rows: []
  };
}

const el = (
  kind: string, label: string, icon: string, color: string,
  x: number, y: number, width: number, height: number
): CroquisElement => ({ kind, label, icon, color, x, y, width, height, rotation: 0 });

/**
 * Croquis del evento.
 *
 * Todos los eventos comparten el mismo plano de ejemplo salvo que se declare
 * otro: el objetivo es que la pantalla de compra tenga siempre un croquis real
 * que dibujar, no que cada evento traiga un recinto distinto.
 */
export function croquisForEvent(_eventId: number): EventCroquis {
  const plan: CroquisPlan = {
    id: 'plan-principal',
    name: 'Arena Monterrey',
    description: 'Butacas numeradas frente al escenario y pista general al fondo.',
    width: PLAN_WIDTH,
    height: PLAN_HEIGHT,
    areas: [
      seatedArea('a-vip', 'VIP Oro', 'vip',
        { x: 330, y: 205, width: 540, height: 125 },
        ['A', 'B', 'C', 'D'], 14,
        { curve: 0.45, accessNote: 'Acceso preferente por puerta 1' }),

      seatedArea('a-lat-izq', 'Lateral Izquierda', 'preferente',
        { x: 95, y: 215, width: 210, height: 150 },
        ['L1', 'L2', 'L3', 'L4', 'L5'], 8, { curve: 0.15 }),

      seatedArea('a-lat-der', 'Lateral Derecha', 'preferente',
        { x: 895, y: 215, width: 210, height: 150 },
        ['R1', 'R2', 'R3', 'R4', 'R5'], 8, { curve: 0.15 }),

      seatedArea('a-pref', 'Preferente Central', 'preferente',
        { x: 300, y: 355, width: 600, height: 150 },
        ['E', 'F', 'G', 'H', 'I'], 18,
        { curve: 0.3, accessNote: 'Acceso por puerta 2' }),

      seatedArea('a-gen', 'General A', 'general-a',
        { x: 250, y: 530, width: 700, height: 175 },
        ['J', 'K', 'L', 'M', 'N', 'O'], 22, { curve: 0.2 }),

      generalArea('a-pista', 'Pista General', 'grada',
        { x: 200, y: 730, width: 800, height: 105 },
        2500, 940, 'Acceso por puerta 4')
    ],
    elements: [
      el('escenario', 'Escenario Principal', 'theater_comedy', '#F2CA50', 350, 60, 500, 95),
      el('pantalla', 'Pantalla Izq.', 'tv', '#38bdf8', 200, 75, 120, 60),
      el('pantalla', 'Pantalla Der.', 'tv', '#38bdf8', 880, 75, 120, 60),
      el('bocina', 'PA Izq.', 'speaker', '#a78bfa', 300, 165, 44, 70),
      el('bocina', 'PA Der.', 'speaker', '#a78bfa', 856, 165, 44, 70),
      el('barra', 'Barra', 'local_bar', '#f472b6', 30, 560, 140, 60),
      el('alimentos', 'Alimentos', 'restaurant', '#fbbf24', 30, 650, 140, 60),
      el('sanitarios', 'Sanitarios', 'wc', '#34d399', 1030, 560, 130, 70),
      el('acceso', 'Puerta 1', 'login', '#22d3ee', 40, 210, 90, 36),
      el('acceso', 'Puerta 4', 'login', '#22d3ee', 545, 840, 110, 36)
    ]
  };

  return {
    serviceFee: 45,
    tiers: [
      { id: 'vip', name: 'VIP Oro', price: 2200, color: '#F2CA50', description: 'Primeras filas, acceso prioritario y bebida de cortesía.' },
      { id: 'preferente', name: 'Preferente', price: 1200, color: '#38BDF8', description: 'Vista central con asiento numerado.' },
      { id: 'general-a', name: 'General A', price: 650, color: '#4ADE80', description: 'Asiento numerado en la zona media del recinto.' },
      { id: 'grada', name: 'Grada General', price: 350, color: '#FB923C', description: 'Entrada libre a la pista, sin lugar asignado.' }
    ],
    plans: [plan]
  };
}
