import { CroquisArea, CroquisPlan, CroquisSeat, CroquisTier } from '../../../core/models/croquis.models';
import {
  areaBlocked, areaCapacity, areaHeld, areaSeatEntries, areaSeats, areaSold, planStages
} from './croquis-metrics';

/**
 * Las cuentas del croquis: cuánto vale lo que está dibujado.
 *
 * El editor ya decía cuántos lugares hay; esto dice cuánto valen. Es la
 * diferencia entre dibujar un plano y tomar una decisión: mover la frontera
 * entre el VIP y el preferente treinta butacas cambia la taquilla potencial en
 * decenas de miles de pesos, y ese número no se saca de cabeza mientras se
 * arrastra el mouse.
 *
 * Todo aquí es cálculo puro sobre los planos y las categorías. Nada se guarda:
 * son cifras derivadas de lo dibujado, y guardarlas solo crearía otra fuente de
 * verdad que se desincroniza —justo el problema que este módulo vino a resolver.
 */

// ─── Dinero legible ───────────────────────────────────────────────────────────

/**
 * Importe corto para etiquetas dentro del croquis.
 *
 * "$1.1M" cabe en el chip de un área; "$1,120,000 MXN" no, y partir la etiqueta
 * en dos renglones para que quepa un número que se lee de reojo no vale la pena.
 * El importe exacto siempre está en el resumen y en el inspector.
 */
/**
 * Importe sin el sufijo de moneda, para las tarjetas de cifras.
 *
 * Ahí el ancho lo manda la rejilla y "$8,776,000 MXN" se corta a media cifra,
 * que es peor que no ponerlo: el "MXN" ya está en las tablas y al pie, y ningún
 * importe del expediente está en otra moneda.
 */
export function pesos(amount: number): string {
  return '$' + Math.round(amount || 0).toLocaleString('es-MX');
}

export function compactMoney(amount: number): string {
  const n = Math.round(amount || 0);
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (n >= 10_000) return '$' + Math.round(n / 1000) + 'k';
  return '$' + n.toLocaleString('es-MX');
}

// ─── Por área ─────────────────────────────────────────────────────────────────

export interface AreaInsight {
  capacity: number;
  sold: number;
  held: number;
  blocked: number;
  available: number;
  /** Ingreso si se vendiera todo lo disponible del área. */
  potential: number;
  /** Ingreso ya realizado por lo vendido. */
  collected: number;
  occupancy: number;
  price: number;
}

export function areaInsight(area: CroquisArea, tiers: Map<string, CroquisTier>): AreaInsight {
  const capacity = areaCapacity(area);
  const sold = areaSold(area);
  const held = areaHeld(area);
  const blocked = areaBlocked(area);

  // El precio se cobra butaca por butaca porque una butaca suelta puede llevar
  // otra categoría: multiplicar el aforo por el precio del área daría de más.
  let potential = 0;
  let collected = 0;

  if (area.kind === 'general') {
    const price = (area.tierId ? tiers.get(area.tierId)?.price : 0) || 0;
    potential = capacity * price;
    collected = sold * price;
  } else {
    for (const { seat, tierId } of areaSeatEntries(area)) {
      if (seat.status === 'bloqueado') continue;
      const price = tiers.get(tierId || '')?.price || 0;
      potential += price;
      if (seat.status === 'vendido') collected += price;
    }

    // Una mesa con precio propio no vale la suma de sus sillas: se cobra de
    // corrido y ese monto es el que hay que reportar, o la taquilla del salón
    // saldría de menos justamente en las mesas que más dejan.
    for (const table of area.tables || []) {
      if (table.status === 'bloqueada' || !table.price) continue;
      const sillas = table.seats.filter(s => s.status !== 'bloqueado');
      if (!sillas.length) continue;

      const porSilla = sillas.reduce(
        (sum, s) => sum + (tiers.get(s.tierId || table.tierId || area.tierId || '')?.price || 0),
        0
      );
      potential += table.price - porSilla;
      // Solo cuenta como cobrada cuando la mesa se vendió completa: media mesa
      // no es medio precio de mesa, es las sillas que se hayan cobrado.
      if (sillas.every(s => s.status === 'vendido')) {
        collected += table.price - porSilla;
      }
    }
  }

  return {
    capacity,
    sold,
    held,
    blocked,
    available: Math.max(0, capacity - sold - held),
    potential,
    collected,
    occupancy: capacity > 0 ? Math.min(100, (sold / capacity) * 100) : 0,
    price: (area.tierId ? tiers.get(area.tierId)?.price : 0) || 0
  };
}

// ─── Por categoría de boleto ──────────────────────────────────────────────────

export interface TierInsight {
  tier: CroquisTier;
  capacity: number;
  sold: number;
  held: number;
  blocked: number;
  available: number;
  potential: number;
  collected: number;
  /** Lugares numerados frente a lugares de aforo libre. */
  seated: number;
  general: number;
  /** Croquis donde la categoría tiene lugares. */
  planNames: string[];
  areaCount: number;
  /** Tajada de la categoría sobre el aforo total, en porcentaje. */
  sharePercent: number;
}

export function tierInsights(plans: CroquisPlan[], tiers: CroquisTier[]): TierInsight[] {
  const index = new Map<string, TierInsight>();

  for (const tier of tiers) {
    index.set(tier.id || '', {
      tier,
      capacity: 0, sold: 0, held: 0, blocked: 0, available: 0,
      potential: 0, collected: 0, seated: 0, general: 0,
      planNames: [], areaCount: 0, sharePercent: 0
    });
  }

  const touch = (tierId: string, planName: string): TierInsight | undefined => {
    const entry = index.get(tierId);
    if (!entry) return undefined;
    if (!entry.planNames.includes(planName)) entry.planNames.push(planName);
    return entry;
  };

  for (const plan of plans) {
    for (const area of plan.areas) {
      if (area.kind === 'general') {
        if (!area.tierId) continue;
        const entry = touch(area.tierId, plan.name);
        if (!entry) continue;
        const cap = areaCapacity(area);
        const sold = areaSold(area);
        entry.capacity += cap;
        entry.general += cap;
        entry.sold += sold;
        entry.potential += cap * (entry.tier.price || 0);
        entry.collected += sold * (entry.tier.price || 0);
        entry.areaCount += 1;
        continue;
      }

      const used = new Set<string>();
      for (const { seat, tierId } of areaSeatEntries(area)) {
        if (!tierId) continue;
        const entry = touch(tierId, plan.name);
        if (!entry) continue;
        used.add(tierId);

        if (seat.status === 'bloqueado') {
          entry.blocked += 1;
          continue;
        }
        entry.capacity += 1;
        entry.seated += 1;
        entry.potential += entry.tier.price || 0;
        if (seat.status === 'vendido') {
          entry.sold += 1;
          entry.collected += entry.tier.price || 0;
        } else if (seat.status === 'apartado') {
          entry.held += 1;
        }
      }
      for (const tierId of used) {
        const entry = index.get(tierId);
        if (entry) entry.areaCount += 1;
      }
    }
  }

  const list = [...index.values()];
  const total = list.reduce((sum, t) => sum + t.capacity, 0);

  for (const entry of list) {
    entry.available = Math.max(0, entry.capacity - entry.sold - entry.held);
    entry.sharePercent = total > 0 ? (entry.capacity / total) * 100 : 0;
  }

  // De mayor a menor aforo: así la categoría que manda el evento va primero.
  return list.sort((a, b) => b.capacity - a.capacity);
}

// ─── Por croquis ──────────────────────────────────────────────────────────────

export interface PlanInsight {
  plan: CroquisPlan;
  capacity: number;
  sold: number;
  available: number;
  potential: number;
  collected: number;
  /** Butacas dibujadas, incluidas las bloqueadas. */
  seatCount: number;
  /** Mesas dibujadas. */
  tableCount: number;
  seatedAreas: number;
  generalAreas: number;
  stageCount: number;
  occupancy: number;
}

export function planInsights(plans: CroquisPlan[], tiers: CroquisTier[]): PlanInsight[] {
  const index = new Map(tiers.map(t => [t.id || '', t]));

  return plans.map(plan => {
    let capacity = 0, sold = 0, held = 0, potential = 0, collected = 0, seatCount = 0, tableCount = 0;
    let seatedAreas = 0, generalAreas = 0;

    for (const area of plan.areas) {
      const info = areaInsight(area, index);
      capacity += info.capacity;
      sold += info.sold;
      held += info.held;
      potential += info.potential;
      collected += info.collected;
      if (area.kind === 'general') {
        generalAreas += 1;
      } else {
        seatedAreas += 1;
        seatCount += areaSeats(area).length;
        tableCount += (area.tables || []).length;
      }
    }

    return {
      plan,
      capacity,
      sold,
      available: Math.max(0, capacity - sold - held),
      potential,
      collected,
      seatCount,
      tableCount,
      seatedAreas,
      generalAreas,
      stageCount: planStages(plan).length,
      occupancy: capacity > 0 ? Math.min(100, (sold / capacity) * 100) : 0
    };
  });
}

// ─── Del evento completo ──────────────────────────────────────────────────────

export interface CroquisOverview {
  planCount: number;
  areaCount: number;
  capacity: number;
  sold: number;
  held: number;
  blocked: number;
  available: number;
  potential: number;
  collected: number;
  occupancy: number;
  /** Lugares numerados frente a lugares de aforo libre. */
  seatedCapacity: number;
  generalCapacity: number;
  /** Butacas dibujadas en total, para saber qué tan pesado va el croquis. */
  seatCount: number;
  /** Mesas dibujadas en total. */
  tableCount: number;
  /** Precio promedio ponderado por lugares: el boleto "típico" del evento. */
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  /** Lo que la taquilla suma por cargo de servicio si se vende todo. */
  serviceFeeTotal: number;
}

export function croquisOverview(plans: CroquisPlan[], tiers: CroquisTier[], serviceFee: number): CroquisOverview {
  const byTier = tierInsights(plans, tiers);
  const byPlan = planInsights(plans, tiers);

  const capacity = byPlan.reduce((s, p) => s + p.capacity, 0);
  const sold = byPlan.reduce((s, p) => s + p.sold, 0);
  const potential = byPlan.reduce((s, p) => s + p.potential, 0);
  const collected = byPlan.reduce((s, p) => s + p.collected, 0);
  const held = byTier.reduce((s, t) => s + t.held, 0);
  const prices = tiers.map(t => t.price || 0).filter(p => p > 0);

  return {
    planCount: plans.length,
    areaCount: plans.reduce((s, p) => s + p.areas.length, 0),
    capacity,
    sold,
    held,
    blocked: byTier.reduce((s, t) => s + t.blocked, 0),
    available: Math.max(0, capacity - sold - held),
    potential,
    collected,
    occupancy: capacity > 0 ? Math.min(100, (sold / capacity) * 100) : 0,
    seatedCapacity: byTier.reduce((s, t) => s + t.seated, 0),
    generalCapacity: byTier.reduce((s, t) => s + t.general, 0),
    seatCount: byPlan.reduce((s, p) => s + p.seatCount, 0),
    tableCount: byPlan.reduce((s, p) => s + p.tableCount, 0),
    // Ponderado por lugares y no por categorías: un VIP de 50 butacas no debe
    // pesar lo mismo que una general de 5,000 al describir el boleto típico.
    averagePrice: capacity > 0 ? potential / capacity : 0,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    serviceFeeTotal: capacity * (serviceFee || 0)
  };
}

// ─── De la selección ──────────────────────────────────────────────────────────

export interface SelectionInsight {
  total: number;
  available: number;
  sold: number;
  held: number;
  blocked: number;
  /** Ingreso de las butacas seleccionadas que todavía se pueden vender. */
  potential: number;
  byTier: { tier: CroquisTier | null; count: number; subtotal: number }[];
  /** Áreas y filas tocadas por la selección, para ubicarla sin buscarla. */
  areaNames: string[];
  rowLabels: string[];
}

/**
 * Qué se seleccionó y cuánto vale.
 *
 * Es la cifra que decide un cambio de precio: "estas 120 butacas de la orilla
 * valen 336 mil como preferente y 168 mil como general" no se responde mirando
 * el plano, y es exactamente lo que uno quiere saber antes de repintarlas.
 */
export function selectionInsight(
  plans: CroquisPlan[],
  selected: Set<string>,
  tiers: CroquisTier[]
): SelectionInsight {
  const index = new Map(tiers.map(t => [t.id || '', t]));
  const buckets = new Map<string, { tier: CroquisTier | null; count: number; subtotal: number }>();
  const areaNames: string[] = [];
  const rowLabels: string[] = [];

  let total = 0, sold = 0, held = 0, blocked = 0, potential = 0;

  const take = (area: CroquisArea, groupId: string, groupLabel: string, seats: { seat: CroquisSeat; tierId?: string }[]) => {
    for (let i = 0; i < seats.length; i++) {
      if (!selected.has(`${area.id}|${groupId}|${i}`)) continue;

      const { seat, tierId } = seats[i];
      const tier = index.get(tierId || '') || null;
      const key = tier?.id || '';
      const price = tier?.price || 0;

      total += 1;
      if (seat.status === 'vendido') sold += 1;
      else if (seat.status === 'apartado') held += 1;
      else if (seat.status === 'bloqueado') blocked += 1;
      else potential += price;

      if (!buckets.has(key)) buckets.set(key, { tier, count: 0, subtotal: 0 });
      const bucket = buckets.get(key)!;
      bucket.count += 1;
      if (seat.status !== 'bloqueado') bucket.subtotal += price;

      if (!areaNames.includes(area.name)) areaNames.push(area.name);
      if (!rowLabels.includes(groupLabel)) rowLabels.push(groupLabel);
    }
  };

  for (const plan of plans) {
    for (const area of plan.areas) {
      for (const row of area.rows) {
        take(area, row.id, row.label, row.seats.map(seat => ({ seat, tierId: seat.tierId || area.tierId })));
      }
      for (const table of area.tables || []) {
        take(
          area,
          table.id,
          table.label,
          table.seats.map(seat => ({ seat, tierId: seat.tierId || table.tierId || area.tierId }))
        );
      }
    }
  }

  return {
    total,
    available: Math.max(0, total - sold - held - blocked),
    sold,
    held,
    blocked,
    potential,
    byTier: [...buckets.values()].sort((a, b) => b.count - a.count),
    areaNames,
    rowLabels
  };
}
