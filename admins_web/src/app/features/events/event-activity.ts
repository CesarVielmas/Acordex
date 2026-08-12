import { EventItem, EventActivity, ActivityChange, ActivityChannel, ActivityKind, ActorRef } from '../../core/models/event.models';

interface FieldMeta {
  label: string;
  channel: ActivityChannel;
  kind?: ActivityKind;
  isImage?: boolean;
  isLongText?: boolean;
}

const FIELD_DICTIONARY: Record<string, FieldMeta> = {
  title: { label: 'Título del evento', channel: 'evento' },
  date: { label: 'Fecha del evento', channel: 'evento' },
  venue: { label: 'Recinto', channel: 'evento' },
  location: { label: 'Ciudad / Ubicación', channel: 'evento' },
  venueAddress: { label: 'Dirección del recinto', channel: 'evento' },
  description: { label: 'Información general', channel: 'evento', isLongText: true },
  flyerUrl: { label: 'Flyer del evento', channel: 'cartelera', isImage: true },
  'publicProfile.tagline': { label: 'Frase de portada', channel: 'cartelera' },
  'publicProfile.coverUrl': { label: 'Imagen panorámica de portada', channel: 'cartelera', isImage: true },
  'publicProfile.aboutText': { label: 'Semblanza del evento', channel: 'cartelera', isLongText: true },
  'sound.providerType': { label: 'Tipo de proveedor de audio', channel: 'produccion' },
  'sound.providerName': { label: 'Nombre de proveedor de audio', channel: 'produccion' },
  'sound.engineerName': { label: 'Ingeniero de audio', channel: 'produccion' },
  'sound.cost': { label: 'Costo de sonido y producción', channel: 'produccion' }
};

function getCroquisTotalSeats(e: EventItem): number {
  if (!e.croquisPlans) return 0;
  let total = 0;
  for (const plan of e.croquisPlans) {
    for (const area of plan.areas || []) {
      for (const row of area.rows || []) {
        total += (row.seats || []).length;
      }
    }
  }
  return total;
}

/**
 * Compara dos estados del evento antes y después de una edición y genera
 * las entradas de bitácora correspondientes con lenguaje humano.
 */
export function describeEventPatch(
  before: EventItem,
  after: EventItem,
  actor: ActorRef
): EventActivity[] {
  const activities: EventActivity[] = [];
  const now = new Date().toISOString().slice(0, 16);

  // 1. Campos escalares y del diccionario
  const changes: ActivityChange[] = [];
  let mainChannel: ActivityChannel = 'evento';

  // Título
  if (before.title !== after.title) {
    changes.push({
      field: 'title',
      label: 'Título del evento',
      before: before.title,
      after: after.title
    });
  }

  // Recinto
  if (before.venue !== after.venue) {
    changes.push({
      field: 'venue',
      label: 'Recinto',
      before: before.venue,
      after: after.venue
    });
  }

  // Fecha
  if (before.date !== after.date) {
    changes.push({
      field: 'date',
      label: 'Fecha del evento',
      before: before.date,
      after: after.date
    });
  }

  // Flyer
  if (before.flyerUrl !== after.flyerUrl) {
    mainChannel = 'cartelera';
    changes.push({
      field: 'flyerUrl',
      label: 'Flyer del evento',
      before: before.flyerUrl ? 'Con flyer' : 'Sin flyer',
      after: after.flyerUrl ? 'Nuevo flyer' : 'Sin flyer'
    });
  }

  // Descripción (long text delta)
  if (before.description !== after.description) {
    const lenBefore = (before.description || '').length;
    const lenAfter = (after.description || '').length;
    const delta = lenAfter - lenBefore;
    const sign = delta >= 0 ? `+${delta}` : `${delta}`;
    changes.push({
      field: 'description',
      label: 'Información general',
      before: `${lenBefore} caracteres`,
      after: `${lenAfter} caracteres (${sign})`
    });
  }

  // 2. Lineup (Cartel)
  const lineupBefore = before.lineup || [];
  const lineupAfter = after.lineup || [];
  if (lineupBefore.length !== lineupAfter.length) {
    mainChannel = 'cartel';
    if (lineupAfter.length > lineupBefore.length) {
      const newSlot = lineupAfter[lineupAfter.length - 1];
      changes.push({
        field: 'lineup',
        label: 'Cartel de artistas',
        before: `${lineupBefore.length} artistas`,
        after: `Agregó «${newSlot?.groupName || 'Nuevo Grupo'}»`
      });
    } else {
      changes.push({
        field: 'lineup',
        label: 'Cartel de artistas',
        before: `${lineupBefore.length} artistas`,
        after: `Removió un grupo del cartel`
      });
    }
  }

  // 3. Ticket Tiers (Boletaje)
  const tiersBefore = before.ticketTiers || [];
  const tiersAfter = after.ticketTiers || [];
  if (JSON.stringify(tiersBefore) !== JSON.stringify(tiersAfter)) {
    mainChannel = 'boletaje';
    changes.push({
      field: 'ticketTiers',
      label: 'Precios y categorías de boletos',
      before: `${tiersBefore.length} categorías`,
      after: `${tiersAfter.length} categorías`
    });
  }

  // 4. Croquis Plans
  const seatsBefore = getCroquisTotalSeats(before);
  const seatsAfter = getCroquisTotalSeats(after);
  if (seatsBefore !== seatsAfter || JSON.stringify(before.croquisPlans) !== JSON.stringify(after.croquisPlans)) {
    mainChannel = 'croquis';
    changes.push({
      field: 'croquisPlans',
      label: 'Aforo del croquis',
      before: `${seatsBefore} lugares`,
      after: `${seatsAfter} lugares a la venta`
    });
  }

  // 5. Production Items
  const prodBefore = before.productionItems || [];
  const prodAfter = after.productionItems || [];
  if (JSON.stringify(prodBefore) !== JSON.stringify(prodAfter)) {
    mainChannel = 'produccion';
    changes.push({
      field: 'productionItems',
      label: 'Desglose de producción',
      before: `${prodBefore.length} partidas`,
      after: `${prodAfter.length} partidas`
    });
  }

  if (!changes.length) return [];

  // Construir resumen legible
  let summary = '';
  if (mainChannel === 'croquis') {
    summary = `Editó el croquis: ${seatsBefore} → ${seatsAfter} lugares a la venta`;
  } else if (changes.length === 1) {
    const ch = changes[0];
    if (ch.field === 'flyerUrl') {
      summary = 'Reemplazó el flyer del evento';
    } else if (ch.field === 'venue') {
      summary = `Cambió el recinto de «${ch.before}» a «${ch.after}»`;
    } else {
      summary = `Actualizó ${ch.label.toLowerCase()}`;
    }
  } else {
    summary = `Actualizó el expediente (${changes.length} cambios en ${mainChannel})`;
  }

  activities.push({
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: now,
    actor,
    channel: mainChannel,
    kind: 'edicion',
    summary,
    changes,
    mergedCount: 1
  });

  return activities;
}
