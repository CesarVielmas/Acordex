import { CroquisArea, CroquisPlan, CroquisTier } from '../../../core/models/croquis.models';
import { areaCapacity, areaHeld, areaSold } from './croquis-metrics';

/**
 * El croquis, traducido a lo que dibuja el portal del cliente.
 *
 * El portal no pinta el plano a escala: pinta filas centradas con su letra a los
 * dos costados, que es como se lee un mapa de asientos cuando lo único que
 * importa es "¿cuál agarro?". Este módulo hace la traducción de una a la otra:
 * de las áreas y filas del croquis a la lista de renglones que el portal
 * necesita.
 *
 * Existe para que la vista previa del panel y el portal dibujen lo mismo a
 * partir del mismo croquis, sin que ninguno de los dos tenga que conocer el
 * modelo del otro.
 */

export type ClientSeatStatus = 'disponible' | 'ocupada' | 'seleccionada' | 'mia';

export interface ClientSeat {
  /** Identificador que ve el comprador: 'A-12'. */
  id: string;
  row: string;
  number: string;
  tierId: string;
  tierName: string;
  price: number;
  color: string;
  status: ClientSeatStatus;
  accessible: boolean;
}

export interface ClientRow {
  row: string;
  /** Color de la categoría que manda en la fila; tiñe la letra a los costados. */
  color: string;
  seats: ClientSeat[];
}

export interface ClientArea {
  id: string;
  name: string;
  numbered: boolean;
  tierName: string;
  price: number;
  color: string;
  capacity: number;
  available: number;
  sold: number;
  accessNote: string;
  rows: ClientRow[];
}

/** Referencia del recinto tal como la lee el comprador. */
export interface ClientReference {
  icon: string;
  label: string;
  color: string;
}

const STAGE_KINDS = new Set(['escenario']);

/**
 * Traduce un plano a las áreas y filas que dibuja el portal.
 *
 * Las butacas bloqueadas no salen: para el comprador no son un lugar ocupado,
 * son piso del recinto. Las vendidas y las apartadas sí, apagadas, porque el
 * hueco ayuda a entender qué tan llena está la zona.
 */
export function clientAreas(
  plan: CroquisPlan,
  tiers: CroquisTier[],
  selected: Set<string> = new Set(),
  mine: Set<string> = new Set()
): ClientArea[] {
  const index = new Map(tiers.map(t => [t.id || '', t]));

  return plan.areas.map(area => {
    const tier = area.tierId ? index.get(area.tierId) : undefined;
    const color = tier?.color || '#99907c';

    // Las mesas se leen como una fila más: para el portal "Mesa 3, lugar 7" y
    // "Fila C, butaca 7" son la misma cosa —un lugar con nombre— y tratarlas
    // distinto obligaría a duplicar toda la lista de asientos.
    const grupos: { label: string; seats: typeof area.rows[number]['seats']; tierId?: string }[] = [
      ...area.rows.map(r => ({ label: r.label, seats: r.seats, tierId: undefined as string | undefined })),
      ...(area.tables || [])
        .filter(t => t.status !== 'bloqueada')
        .map(t => ({ label: t.label, seats: t.seats, tierId: t.tierId }))
    ];

    const rows: ClientRow[] = grupos.map(row => {
      const seats: ClientSeat[] = [];

      for (const seat of row.seats) {
        if (seat.status === 'bloqueado') continue;

        const seatTier = index.get(seat.tierId || row.tierId || area.tierId || '') || tier;
        const id = `${row.label}-${seat.number}`;
        const status: ClientSeatStatus =
          mine.has(id) ? 'mia'
          : selected.has(id) ? 'seleccionada'
          : seat.status === 'vendido' || seat.status === 'apartado' ? 'ocupada'
          : 'disponible';

        seats.push({
          id,
          row: row.label,
          number: seat.number,
          tierId: seatTier?.id || '',
          tierName: seatTier?.name || 'Sin categoría',
          price: seatTier?.price || 0,
          color: seatTier?.color || color,
          status,
          accessible: !!seat.accessible
        });
      }

      return { row: row.label, color, seats };
    }).filter(r => r.seats.length > 0);

    return {
      id: area.id,
      name: area.name,
      numbered: area.kind !== 'general',
      tierName: tier?.name || 'Sin categoría',
      price: tier?.price || 0,
      color,
      capacity: areaCapacity(area),
      available: Math.max(0, areaCapacity(area) - areaSold(area) - areaHeld(area)),
      sold: areaSold(area),
      accessNote: area.accessNote || '',
      rows
    };
  });
}

/** Nombres de los escenarios del plano, para el arco superior. */
export function stageNames(plan: CroquisPlan): string[] {
  return plan.elements.filter(e => STAGE_KINDS.has(e.kind)).map(e => e.label);
}

/**
 * Referencias del recinto que le sirven al comprador.
 *
 * Se filtran a propósito: al que compra un boleto le importa dónde entra, dónde
 * está el baño y dónde la barra. Los camerinos, la consola de audio y las notas
 * de producción no le dicen nada y solo alargarían la lista.
 */
const CLIENT_REFERENCES: Record<string, { icon: string; label: string; color: string }> = {
  pantalla: { icon: 'tv', label: 'Pantalla', color: '#38bdf8' },
  bocina: { icon: 'speaker', label: 'Sonido', color: '#a78bfa' },
  barra: { icon: 'local_bar', label: 'Barra', color: '#f472b6' },
  alimentos: { icon: 'restaurant', label: 'Alimentos', color: '#fbbf24' },
  sanitarios: { icon: 'wc', label: 'Sanitarios', color: '#34d399' },
  acceso: { icon: 'login', label: 'Acceso', color: '#22d3ee' },
  salida: { icon: 'logout', label: 'Salida de emergencia', color: '#f87171' },
  escaleras: { icon: 'stairs', label: 'Escaleras', color: '#94a3b8' },
  plataforma: { icon: 'deck', label: 'Plataforma', color: '#fb923c' }
};

export function clientReferences(plan: CroquisPlan): ClientReference[] {
  const seen = new Map<string, ClientReference>();

  for (const el of plan.elements) {
    const meta = CLIENT_REFERENCES[el.kind];
    if (!meta) continue;
    // Se agrupan por tipo: "Sonido ×4" no le aporta nada a nadie.
    if (!seen.has(el.kind)) seen.set(el.kind, { ...meta, label: el.label || meta.label });
  }

  return [...seen.values()];
}

/** Categorías con lugares en este plano, en el orden en que se venden. */
export function clientTiers(plan: CroquisPlan, tiers: CroquisTier[]): CroquisTier[] {
  const used = new Set<string>();

  for (const area of plan.areas) {
    if (area.tierId) used.add(area.tierId);
    for (const row of area.rows) {
      for (const seat of row.seats) if (seat.tierId) used.add(seat.tierId);
    }
    for (const table of area.tables || []) {
      if (table.tierId) used.add(table.tierId);
      for (const seat of table.seats) if (seat.tierId) used.add(seat.tierId);
    }
  }

  return tiers.filter(t => used.has(t.id || '')).sort((a, b) => (b.price || 0) - (a.price || 0));
}

/** Butacas numeradas y disponibles de una categoría dentro del plano. */
export function availableByTier(areas: ClientArea[]): Map<string, number> {
  const out = new Map<string, number>();

  for (const area of areas) {
    if (area.numbered) {
      for (const row of area.rows) {
        for (const seat of row.seats) {
          if (seat.status !== 'disponible') continue;
          out.set(seat.tierId, (out.get(seat.tierId) || 0) + 1);
        }
      }
    }
  }

  return out;
}

/** True cuando el área no tiene butacas que elegir, solo aforo. */
export function isGeneralArea(area: CroquisArea): boolean {
  return area.kind === 'general';
}
