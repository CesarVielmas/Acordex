import {
  ActivityChange,
  ActivityChannel,
  ActorRef,
  EventActivity
} from '../../core/models/event.models';
import { PressEventItem } from '../../core/models/press.models';

/**
 * Qué cambió en el expediente de prensa, dicho en castellano.
 *
 * La bitácora existe para contestar una sola pregunta, y siempre es la misma:
 * *«¿quién puso esto y cuándo?»*. Se pregunta cuando el dato resulta estar mal, y
 * para entonces el que lo escribió ya no se acuerda. Por eso el diff se calcula
 * del antes y el después completos en vez de pedirle a cada pantalla que escriba
 * su propia entrada: en cuanto eso depende de la disciplina de quien programa la
 * pestaña, la mitad de los movimientos dejan de registrarse y la bitácora pasa
 * de ser una prueba a ser una anécdota.
 *
 * Las cifras largas se resumen —«3 zonas» → «4 zonas»— porque volcar el objeto
 * entero en la bitácora la vuelve ilegible justo cuando hace falta leerla.
 */

interface Campo {
  /** Cómo se llama el dato para quien lo lee. */
  label: string;
  channel: ActivityChannel;
  /** Cómo se lee su valor; por omisión, el valor tal cual. */
  read?: (e: PressEventItem) => string;
  /** De dónde se saca el valor crudo con el que se comparan dos versiones. */
  value: (e: PressEventItem) => unknown;
}

const VACIO = '(vacío)';

function texto(v: unknown): string {
  if (v === undefined || v === null || v === '') return VACIO;
  return String(v);
}

/** Los campos sueltos del expediente, con su nombre y su apartado. */
const CAMPOS: Record<string, Campo> = {
  title: { label: 'Nombre del evento', channel: 'evento', value: e => e.title },
  pressType: { label: 'Tipo de evento', channel: 'evento', value: e => e.pressType },
  date: { label: 'Fecha', channel: 'evento', value: e => e.date },
  startTime: { label: 'Hora de inicio', channel: 'evento', value: e => e.startTime },
  endTime: { label: 'Hora de cierre', channel: 'evento', value: e => e.endTime },
  venue: { label: 'Recinto', channel: 'evento', value: e => e.venue },
  location: { label: 'Ciudad y estado', channel: 'evento', value: e => e.location },
  venueAddress: { label: 'Dirección del recinto', channel: 'evento', value: e => e.venueAddress },
  groupName: { label: 'Grupo principal', channel: 'evento', value: e => e.groupName },
  photoPolicy: { label: 'Política de fotografías', channel: 'cartelera', value: e => e.photoPolicy },
  fanAccess: { label: 'Acceso de fans', channel: 'cartelera', value: e => e.fanAccess },
  fanCapacity: { label: 'Aforo de fans', channel: 'cartelera', value: e => e.fanCapacity },

  // Ficha pública
  'publicProfile.coverUrl': {
    label: 'Fotografía oficial', channel: 'cartelera',
    value: e => e.publicProfile?.coverUrl,
    read: e => (e.publicProfile?.coverUrl ? 'Con fotografía' : 'Sin fotografía')
  },
  'publicProfile.posterUrl': {
    label: 'Cartel vertical', channel: 'cartelera',
    value: e => e.publicProfile?.posterUrl,
    read: e => (e.publicProfile?.posterUrl ? 'Con cartel' : 'Sin cartel')
  },
  'publicProfile.tagline': { label: 'Frase de portada', channel: 'cartelera', value: e => e.publicProfile?.tagline },
  'publicProfile.about': {
    label: 'Descripción del evento', channel: 'cartelera',
    value: e => e.publicProfile?.about,
    // El texto largo se mide, no se vuelca: doscientas palabras en la bitácora
    // sepultan los demás movimientos de ese día.
    read: e => `${(e.publicProfile?.about || '').trim().length} caracteres`
  },
  'publicProfile.mapsQuery': { label: 'Búsqueda del mapa', channel: 'cartelera', value: e => e.publicProfile?.mapsQuery },
  'publicProfile.supportPhone': { label: 'Teléfono de dudas', channel: 'cartelera', value: e => e.publicProfile?.supportPhone },
  'publicProfile.supportWhatsApp': { label: 'WhatsApp de dudas', channel: 'cartelera', value: e => e.publicProfile?.supportWhatsApp },
  'publicProfile.minimumAge': { label: 'Edad mínima', channel: 'cartelera', value: e => e.publicProfile?.minimumAge },

  // Acreditación
  'accreditation.opensAt': { label: 'Apertura del registro', channel: 'acreditaciones', value: e => e.accreditation?.opensAt },
  'accreditation.closesAt': { label: 'Cierre del registro', channel: 'acreditaciones', value: e => e.accreditation?.closesAt },
  'accreditation.capacity': { label: 'Cupo de acreditados', channel: 'acreditaciones', value: e => e.accreditation?.capacity },
  'accreditation.allAccessLabel': { label: 'Texto de acceso total', channel: 'acreditaciones', value: e => e.accreditation?.allAccessLabel },
  'accreditation.pressKitUrl': {
    label: 'Kit de prensa', channel: 'acreditaciones',
    value: e => e.accreditation?.pressKitUrl,
    read: e => (e.accreditation?.pressKitUrl ? 'Con kit cargado' : 'Sin kit')
  },

  // Cierre
  'closure.attendedCount': { label: 'Medios que asistieron', channel: 'cierre', value: e => e.closure?.attendedCount },
  'closure.publishedPieces': { label: 'Notas publicadas', channel: 'cierre', value: e => e.closure?.publishedPieces },
  'closure.estimatedReach': { label: 'Alcance estimado', channel: 'cierre', value: e => e.closure?.estimatedReach },
  'closure.finalSpend': { label: 'Gasto real', channel: 'cierre', value: e => e.closure?.finalSpend },
  'closure.summary': {
    label: 'Resumen del evento', channel: 'cierre',
    value: e => e.closure?.summary,
    read: e => `${(e.closure?.summary || '').trim().length} caracteres`
  }
};

/** Colecciones que se cuentan en vez de compararse elemento a elemento. */
const COLECCIONES: { key: string; label: string; channel: ActivityChannel; count: (e: PressEventItem) => number; unidad: string }[] = [
  { key: 'lineup', label: 'Grupos del evento', channel: 'cartel', count: e => (e.lineup || []).length, unidad: 'grupo(s)' },
  { key: 'rules', label: 'Lineamientos publicados', channel: 'cartelera', count: e => (e.publicProfile?.rules || []).length, unidad: 'regla(s)' },
  { key: 'videos', label: 'Videos de invitación', channel: 'cartelera', count: e => (e.publicProfile?.greetingVideos || []).length, unidad: 'video(s)' },
  { key: 'zones', label: 'Zonas de acceso', channel: 'acreditaciones', count: e => (e.accreditation?.zones || []).length, unidad: 'zona(s)' },
  { key: 'talentCommitments', label: 'Compromisos de grupo', channel: 'produccion', count: e => (e.talentCommitments || []).length, unidad: 'grupo(s)' },
  { key: 'bannedTopics', label: 'Temas vetados', channel: 'produccion', count: e => (e.talentCommitments || []).reduce((n, c) => n + (c.bannedTopics || []).length, 0), unidad: 'tema(s)' },
  { key: 'productionItems', label: 'Partidas de gasto', channel: 'produccion', count: e => (e.productionItems || []).length, unidad: 'partida(s)' },
  { key: 'evidenceMedia', label: 'Material multimedia', channel: 'produccion', count: e => (e.evidenceMedia || []).length, unidad: 'archivo(s)' }
];

/** Cuál es el canal que mejor describe un puñado de cambios. */
function canalDominante(cambios: { channel: ActivityChannel }[]): ActivityChannel {
  const cuenta = new Map<ActivityChannel, number>();
  for (const c of cambios) cuenta.set(c.channel, (cuenta.get(c.channel) || 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'evento';
}

export function describePressPatch(
  before: PressEventItem,
  after: PressEventItem,
  actor: ActorRef
): EventActivity[] {
  const cambios: (ActivityChange & { channel: ActivityChannel })[] = [];

  for (const [field, campo] of Object.entries(CAMPOS)) {
    const antes = campo.value(before);
    const despues = campo.value(after);
    if (antes === despues) continue;

    cambios.push({
      field,
      label: campo.label,
      channel: campo.channel,
      before: campo.read ? campo.read(before) : texto(antes),
      after: campo.read ? campo.read(after) : texto(despues)
    });
  }

  for (const col of COLECCIONES) {
    const antes = col.count(before);
    const despues = col.count(after);
    if (antes === despues) continue;
    cambios.push({
      field: col.key,
      label: col.label,
      channel: col.channel,
      before: `${antes} ${col.unidad}`,
      after: `${despues} ${col.unidad}`
    });
  }

  // El gasto se sigue aparte de la cuenta de partidas: corregir el importe de una
  // sola partida no cambia cuántas hay, y es justo el movimiento que después
  // nadie sabe explicar.
  const gastoAntes = (before.productionItems || []).reduce((s, p) => s + (p.amount || 0), 0);
  const gastoDespues = (after.productionItems || []).reduce((s, p) => s + (p.amount || 0), 0);
  if (gastoAntes !== gastoDespues) {
    cambios.push({
      field: 'productionSpend',
      label: 'Gasto desglosado',
      channel: 'produccion',
      before: `$${gastoAntes.toLocaleString('es-MX')}`,
      after: `$${gastoDespues.toLocaleString('es-MX')}`
    });
  }

  if (!cambios.length) return [];

  const channel = canalDominante(cambios);
  const limpios: ActivityChange[] = cambios.map(({ channel: _, ...c }) => c);

  const summary = limpios.length === 1
    ? frase(limpios[0], actor)
    : `${actor.name} actualizó ${limpios.length} datos del expediente`;

  return [{
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString().slice(0, 16),
    actor,
    channel,
    kind: 'edicion',
    summary,
    changes: limpios,
    mergedCount: 1
  }];
}

/** Un cambio suelto contado como lo contaría una persona. */
function frase(c: ActivityChange, actor: ActorRef): string {
  if (c.before === VACIO) return `${actor.name} capturó ${c.label.toLowerCase()}: ${c.after}`;
  if (c.after === VACIO) return `${actor.name} vació ${c.label.toLowerCase()}`;
  return `${actor.name} cambió ${c.label.toLowerCase()} de «${c.before}» a «${c.after}»`;
}

/** Entrada de bitácora para un movimiento que no es una edición de campo. */
export function pressActivity(
  actor: ActorRef,
  channel: ActivityChannel,
  kind: EventActivity['kind'],
  summary: string,
  targetId?: string,
  targetLabel?: string
): EventActivity {
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString().slice(0, 16),
    actor,
    channel,
    kind,
    summary,
    targetId,
    targetLabel
  };
}
