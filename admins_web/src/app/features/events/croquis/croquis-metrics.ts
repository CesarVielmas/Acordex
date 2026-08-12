import {
  CroquisArea, CroquisPlan, CroquisSeat, CroquisTier,
  PLAN_HEIGHT, PLAN_WIDTH, ROW_GAP, SEAT_SIZE, SEAT_WARN_THRESHOLD
} from '../../../core/models/croquis.models';
import { EventItem, TicketTier } from '../../../core/models/event.models';
import { croquisId, letterLabel } from './croquis-geometry';
import { colorsAreClose, makeGeneralArea, makeSeatedArea, nextTierColor } from './croquis-catalog';

/**
 * Cuentas y validaciones del croquis.
 *
 * La regla que ordena todo este apartado: **el croquis manda**. Los lugares a la
 * venta de una categoría no se capturan a mano, se cuentan del plano. Antes eran
 * dos datos independientes y por eso hacía falta un validador de "filas ×
 * butacas debe dar el total"; con una sola fuente de verdad ese error deja de
 * poder existir.
 */

// ─── Conteos por área ─────────────────────────────────────────────────────────

/** Butacas dibujadas en el área (las bloqueadas cuentan como lugar existente). */
export function areaSeats(area: CroquisArea): CroquisSeat[] {
  return area.rows.flatMap(r => r.seats);
}

/** Lugares que el área pone a la venta. */
export function areaCapacity(area: CroquisArea): number {
  if (area.kind === 'general') return Math.max(0, area.capacity || 0);
  return areaSeats(area).filter(s => s.status !== 'bloqueado').length;
}

export function areaSold(area: CroquisArea): number {
  if (area.kind === 'general') return Math.max(0, area.soldCount || 0);
  return areaSeats(area).filter(s => s.status === 'vendido').length;
}

export function areaHeld(area: CroquisArea): number {
  if (area.kind === 'general') return 0;
  return areaSeats(area).filter(s => s.status === 'apartado').length;
}

export function areaBlocked(area: CroquisArea): number {
  if (area.kind === 'general') return 0;
  return areaSeats(area).filter(s => s.status === 'bloqueado').length;
}

export function areaOccupancy(area: CroquisArea): number {
  const cap = areaCapacity(area);
  return cap > 0 ? Math.min(100, (areaSold(area) / cap) * 100) : 0;
}

// ─── Conteos por plano y por evento ───────────────────────────────────────────

export function planCapacity(plan: CroquisPlan): number {
  return plan.areas.reduce((sum, a) => sum + areaCapacity(a), 0);
}

export function planSold(plan: CroquisPlan): number {
  return plan.areas.reduce((sum, a) => sum + areaSold(a), 0);
}

export function planSeatCount(plan: CroquisPlan): number {
  return plan.areas.reduce((sum, a) => sum + (a.kind === 'butacas' ? areaSeats(a).length : 0), 0);
}

export function planOccupancy(plan: CroquisPlan): number {
  const cap = planCapacity(plan);
  return cap > 0 ? Math.min(100, (planSold(plan) / cap) * 100) : 0;
}

export function planStages(plan: CroquisPlan) {
  return plan.elements.filter(e => e.kind === 'escenario');
}

/** True cuando el plano tiene tantas butacas que el editor va a arrastrarse. */
export function planIsHeavy(plan: CroquisPlan): boolean {
  return planSeatCount(plan) > SEAT_WARN_THRESHOLD;
}

// ─── Reparto por categoría de boleto ──────────────────────────────────────────

export interface TierCroquisSummary {
  tierId: string;
  /** Lugares que el croquis le asigna a la categoría, sumando todos los planos. */
  capacity: number;
  sold: number;
  held: number;
  /** Nombres de los planos donde aparece la categoría. */
  planNames: string[];
  /** Cuántas áreas la usan. */
  areaCount: number;
}

/**
 * Lo que el croquis le asigna a cada categoría de boleto.
 *
 * Cuenta tres cosas distintas que suelen confundirse: las áreas que declaran la
 * categoría, las butacas sueltas que la sobreescriben (una fila vendida como VIP
 * dentro de la luneta) y los planos donde aparece. Lo último importa cuando hay
 * croquis anidados: una categoría que existe en dos zonas del evento se vende
 * como una sola, pero se ocupa en las dos.
 */
export function tierCroquisSummary(plans: CroquisPlan[]): Map<string, TierCroquisSummary> {
  const map = new Map<string, TierCroquisSummary>();

  const bucket = (tierId: string, planName: string): TierCroquisSummary => {
    let entry = map.get(tierId);
    if (!entry) {
      entry = { tierId, capacity: 0, sold: 0, held: 0, planNames: [], areaCount: 0 };
      map.set(tierId, entry);
    }
    if (!entry.planNames.includes(planName)) entry.planNames.push(planName);
    return entry;
  };

  for (const plan of plans) {
    for (const area of plan.areas) {
      if (area.kind === 'general') {
        if (!area.tierId) continue;
        const entry = bucket(area.tierId, plan.name);
        entry.capacity += areaCapacity(area);
        entry.sold += areaSold(area);
        entry.areaCount += 1;
        continue;
      }

      // Área de butacas: cada butaca puede traer su propia categoría, así que se
      // cuenta una por una en vez de multiplicar el total por la del área.
      let touched = false;
      for (const row of area.rows) {
        for (const seat of row.seats) {
          const tierId = seat.tierId || area.tierId;
          if (!tierId) continue;
          const entry = bucket(tierId, plan.name);
          touched = touched || tierId === area.tierId;
          if (seat.status !== 'bloqueado') entry.capacity += 1;
          if (seat.status === 'vendido') entry.sold += 1;
          if (seat.status === 'apartado') entry.held += 1;
        }
      }
      if (touched && area.tierId) bucket(area.tierId, plan.name).areaCount += 1;
    }
  }

  return map;
}

/**
 * Deja las categorías de boleto en sintonía con el croquis.
 *
 * Devuelve `null` cuando no hay nada que cambiar: emitir un parche idéntico en
 * cada movimiento del editor dispararía el guardado y la bitácora de auditoría
 * sin que nada haya cambiado de verdad.
 */
export function syncTiersWithCroquis<T extends CroquisTier & { totalSeats?: number; soldSeats?: number; heldSeats?: number }>(
  tiers: T[],
  plans: CroquisPlan[]
): T[] | null {
  const summary = tierCroquisSummary(plans);
  let changed = false;

  const next = tiers.map(tier => {
    const id = tier.id || '';
    const entry = summary.get(id);
    const capacity = entry?.capacity ?? 0;
    const sold = entry?.sold ?? tier.soldSeats ?? 0;
    const held = entry?.held ?? 0;

    if (tier.totalSeats === capacity && (tier.soldSeats || 0) === sold && (tier.heldSeats || 0) === held) {
      return tier;
    }
    changed = true;
    return { ...tier, totalSeats: capacity, soldSeats: sold, heldSeats: held };
  });

  return changed ? next : null;
}

export function croquisPlans(e: EventItem): CroquisPlan[] {
  return e.croquisPlans || [];
}

export function croquisCapacity(e: EventItem): number {
  return croquisPlans(e).reduce((sum, p) => sum + planCapacity(p), 0);
}

export function croquisSold(e: EventItem): number {
  return croquisPlans(e).reduce((sum, p) => sum + planSold(p), 0);
}

// ─── Validación ───────────────────────────────────────────────────────────────

export type CroquisIssueLevel = 'error' | 'aviso';

export interface CroquisIssue {
  level: CroquisIssueLevel;
  /** Plano donde está el problema; vacío cuando es del evento completo. */
  planId?: string;
  planName?: string;
  areaId?: string;
  message: string;
  /** Qué hacer para resolverlo. */
  fix: string;
}

/**
 * Todo lo que impediría publicar el croquis, en un solo lugar.
 *
 * Se separa en `error` (rompe la venta: el cliente no podría comprar, o compraría
 * mal) y `aviso` (se puede publicar, pero se ve incompleto). La distinción evita
 * el problema clásico de las listas de validación: cuando todo pesa igual, nadie
 * distingue lo que bloquea de lo que solo estorba.
 */
export function croquisIssues(e: EventItem): CroquisIssue[] {
  const plans = croquisPlans(e);
  const tiers = e.ticketTiers || [];
  const tierIds = new Set(tiers.map(t => t.id).filter(Boolean) as string[]);
  const issues: CroquisIssue[] = [];

  if (!plans.length) {
    issues.push({
      level: 'error',
      message: 'El evento no tiene ningún croquis.',
      fix: 'Crea al menos un croquis: sin plano no hay nada que vender.'
    });
    return issues;
  }

  const summary = tierCroquisSummary(plans);

  for (const plan of plans) {
    if (!plan.areas.length) {
      issues.push({
        level: 'error',
        planId: plan.id,
        planName: plan.name,
        message: `"${plan.name}" no tiene ninguna área.`,
        fix: 'Dibuja al menos un área de butacas o de aforo libre.'
      });
    }

    if (!planStages(plan).length) {
      issues.push({
        level: 'aviso',
        planId: plan.id,
        planName: plan.name,
        message: `"${plan.name}" no tiene escenario marcado.`,
        fix: 'Coloca el escenario: es lo que le dice al cliente hacia dónde mira su lugar.'
      });
    }

    if (!plan.description?.trim() && plans.length > 1) {
      issues.push({
        level: 'aviso',
        planId: plan.id,
        planName: plan.name,
        message: `"${plan.name}" no tiene descripción.`,
        fix: 'Con varios croquis, la descripción es lo que distingue una zona de otra al cambiar entre ellas.'
      });
    }

    for (const area of plan.areas) {
      if (!area.tierId) {
        issues.push({
          level: 'error',
          planId: plan.id,
          planName: plan.name,
          areaId: area.id,
          message: `"${area.name}" no tiene categoría de boleto.`,
          fix: 'Asígnale una categoría: sin ella no tiene precio ni color y el cliente no puede comprarla.'
        });
      } else if (!tierIds.has(area.tierId)) {
        issues.push({
          level: 'error',
          planId: plan.id,
          planName: plan.name,
          areaId: area.id,
          message: `"${area.name}" apunta a una categoría que ya no existe.`,
          fix: 'Vuelve a asignarle una categoría vigente.'
        });
      }

      if (area.kind === 'general' && areaCapacity(area) <= 0) {
        issues.push({
          level: 'error',
          planId: plan.id,
          planName: plan.name,
          areaId: area.id,
          message: `"${area.name}" es de aforo libre pero su aforo es 0.`,
          fix: 'Captura cuántas personas caben; es el único número que puede vender.'
        });
      }

      if (area.kind === 'butacas' && areaCapacity(area) <= 0) {
        issues.push({
          level: 'error',
          planId: plan.id,
          planName: plan.name,
          areaId: area.id,
          message: `"${area.name}" no tiene ninguna butaca disponible.`,
          fix: 'Genera su butaquería o cámbiala a área de aforo libre.'
        });
      }
    }

    if (planIsHeavy(plan)) {
      issues.push({
        level: 'aviso',
        planId: plan.id,
        planName: plan.name,
        message: `"${plan.name}" tiene ${planSeatCount(plan).toLocaleString('es-MX')} butacas dibujadas.`,
        fix: 'Las zonas muy grandes suelen venderse por aforo. Convertir alguna a aforo libre aligera el croquis.'
      });
    }
  }

  for (const tier of tiers) {
    const entry = summary.get(tier.id || '');
    if (!entry || entry.capacity <= 0) {
      issues.push({
        level: 'error',
        message: `La categoría "${tier.name}" no tiene lugares en ningún croquis.`,
        fix: 'Asígnala a un área del plano o elimínala: hoy no puede vender nada.'
      });
    }
    if ((tier.price || 0) <= 0) {
      issues.push({
        level: 'error',
        message: `La categoría "${tier.name}" no tiene precio.`,
        fix: 'Captura el precio del boleto.'
      });
    }
    if (!tier.description?.trim()) {
      issues.push({
        level: 'aviso',
        message: `La categoría "${tier.name}" no dice qué incluye.`,
        fix: 'El cliente decide su compra con ese texto.'
      });
    }
  }

  // Dos categorías del mismo tono vuelven ilegible el croquis: el cliente ve una
  // sola mancha de color y no distingue dónde termina una zona y empieza la otra.
  for (let i = 0; i < tiers.length; i++) {
    for (let j = i + 1; j < tiers.length; j++) {
      if (colorsAreClose(tiers[i].color, tiers[j].color)) {
        issues.push({
          level: 'aviso',
          message: `"${tiers[i].name}" y "${tiers[j].name}" tienen colores casi iguales.`,
          fix: 'Cámbiale el color a una: en el croquis es lo único que las distingue.'
        });
      }
    }
  }

  const capacity = e.capacity || 0;
  const sale = croquisCapacity(e);
  if (capacity > 0 && sale > capacity) {
    issues.push({
      level: 'error',
      message: `El croquis pone a la venta ${sale.toLocaleString('es-MX')} lugares y el recinto declara ${capacity.toLocaleString('es-MX')}.`,
      fix: 'Reduce áreas o corrige el aforo del recinto en el apartado Evento.'
    });
  }

  return issues;
}

export function croquisErrors(e: EventItem): CroquisIssue[] {
  return croquisIssues(e).filter(i => i.level === 'error');
}

// ─── Migración desde el modelo viejo ──────────────────────────────────────────

/**
 * Convierte las zonas numéricas del modelo anterior en un croquis dibujable.
 *
 * Los expedientes viejos guardaban el recinto como una lista de zonas con
 * capacidad y nada más. En vez de dejarlos sin croquis —y obligar a redibujar a
 * mano decenas de eventos ya capturados— se acomodan en bandas horizontales
 * frente al escenario, respetando el orden en que fueron capturadas: la primera
 * zona es casi siempre la más cara y la más cercana.
 *
 * Las zonas numeradas se convierten a butacas solo si son razonablemente chicas.
 * Unas graderías de 5,000 lugares se quedan como aforo libre: dibujarlas butaca
 * por butaca haría el croquis inmanejable y, en la práctica, esas zonas casi
 * nunca se venden con lugar asignado.
 */
const SEATED_MIGRATION_LIMIT = 900;

export function planFromLegacyZones(e: EventItem): CroquisPlan[] {
  const zones = e.croquisZones || [];
  const tiers = e.ticketTiers || [];

  const stageEl = {
    id: croquisId('el'),
    kind: 'escenario' as const,
    label: 'Escenario Principal',
    x: 340,
    y: 50,
    width: 520,
    height: 90,
    rotation: 0
  };

  if (!zones.length) {
    return [{
      id: croquisId('plan'),
      name: e.venue || 'Croquis principal',
      description: '',
      width: PLAN_WIDTH,
      height: PLAN_HEIGHT,
      areas: [],
      elements: [stageEl]
    }];
  }

  // Las bandas se apilan y cada una crece hasta donde su butaquería necesita, en
  // vez de repartir un alto fijo entre todas. Un alto fijo obligaría a apretar
  // catorce filas donde caben ocho y las butacas terminarían encimadas sobre la
  // zona de abajo.
  const GAP_ENTRE_BANDAS = 20;
  let cursorY = 190;

  const areas: CroquisArea[] = zones.map((zone, index) => {
    // Las zonas de más adelante son más angostas: reproduce la forma de abanico
    // de casi cualquier recinto y hace legible el orden de cercanía.
    const inset = Math.max(0, (zones.length - index - 1) * 26);
    const x = 120 + inset;
    const width = PLAN_WIDTH - 240 - inset * 2;

    const tier = tiers.find(t => t.zoneId === zone.id);
    const capacity = Math.max(0, zone.capacity || 0);
    const numbered = zone.seatingType === 'Numerada' && capacity > 0 && capacity <= SEATED_MIGRATION_LIMIT;

    if (numbered) {
      const perRow = Math.max(6, Math.min(30, zone.seatsPerRow || tier?.seatsPerRow || Math.ceil(Math.sqrt(capacity * 2))));
      const rows = Math.max(1, Math.ceil(capacity / perRow));
      const height = rows * ROW_GAP + SEAT_SIZE + 34;

      const area = makeSeatedArea(zone.name, x, cursorY, width, height, rows, perRow, {
        curve: index === 0 ? 0.35 : 0.12,
        startLabel: letterLabel(index * 8)
      });
      area.tierId = tier?.id;
      area.accessNote = zone.accessNotes;

      // La última fila se recorta para que el total dibujado sea exactamente el
      // aforo capturado, en vez de redondear hacia arriba e inventar lugares.
      const extra = rows * perRow - capacity;
      if (extra > 0 && area.rows.length) {
        const last = area.rows[area.rows.length - 1];
        last.seats = last.seats.slice(0, Math.max(0, last.seats.length - extra));
        if (!last.seats.length) area.rows.pop();
      }

      cursorY += height + GAP_ENTRE_BANDAS;
      return area;
    }

    // Las zonas de aforo libre no tienen butacas que acomodar, así que su alto
    // solo tiene que ser proporcional para que se lean grandes las grandes.
    const height = Math.round(Math.min(220, Math.max(110, capacity / 26)));
    const area = makeGeneralArea(zone.name, x, cursorY, width, height, capacity);
    area.tierId = tier?.id;
    area.accessNote = zone.accessNotes;
    area.soldCount = Math.round((capacity * (zone.occupancyPercent || 0)) / 100);

    cursorY += height + GAP_ENTRE_BANDAS;
    return area;
  });

  return [{
    id: croquisId('plan'),
    name: e.venue || 'Croquis principal',
    description: 'Croquis generado a partir de las zonas capturadas antes del editor.',
    width: PLAN_WIDTH,
    height: Math.max(PLAN_HEIGHT, cursorY + 30),
    areas,
    elements: [stageEl]
  }];
}

/**
 * Croquis del evento, migrando el modelo viejo si hace falta.
 *
 * Se llama al sembrar los datos, no al leerlos: si la migración corriera en cada
 * lectura, cada render generaría ids nuevos y el editor perdería la selección en
 * cada cambio.
 */
export function ensureCroquisPlans(e: EventItem): CroquisPlan[] {
  if (e.croquisPlans?.length) return e.croquisPlans;
  return planFromLegacyZones(e);
}

/** Color libre para una categoría nueva, sin repetir los que ya se usan. */
export function nextColorFor(tiers: TicketTier[]): string {
  return nextTierColor(tiers.map(t => t.color));
}

/**
 * Separa los colores de las categorías que se confunden entre sí.
 *
 * Los expedientes viejos se capturaron cuando el color de la categoría era un
 * adorno de la ficha y daba igual que dos fueran parecidos. Ahora ese color es
 * el que pinta cada butaca del croquis: dos dorados casi iguales vuelven el
 * plano ilegible y hacen que cambiar una butaca de categoría parezca no hacer
 * nada. Se respeta el color de la primera categoría —suele ser el de la marca— y
 * se reasignan solo las que chocan con alguna anterior.
 */
export function distinguishTierColors(tiers: TicketTier[]): TicketTier[] {
  const settled: string[] = [];

  return (tiers || []).map(tier => {
    const current = tier.color || '';
    const clashes = !current || settled.some(c => colorsAreClose(c, current));
    const color = clashes ? nextTierColor(settled) : current;
    settled.push(color);
    return color === tier.color ? tier : { ...tier, color };
  });
}
