import {
  AccreditationStatus,
  CoverageType,
  PressAccreditationRequest,
  PressEventItem,
  PressState,
  PressZone
} from '../../core/models/press.models';
import { EventLineupSlot, EventProductionItem, EventPublicProfile } from '../../core/models/event.models';
import { PressGroupCommitment, emptyCommitment } from '../../core/models/press.models';
import { emptyPublicProfile } from '../../core/models/event.models';

/**
 * Las cuentas de una firma o rueda de prensa.
 *
 * Todo lo que aquí se calcula gira alrededor de dos preguntas: cuánta prensa
 * cabe y cuánta va a venir. No hay ninguna función de ingreso porque no hay
 * ingreso: lo único que entra en un evento de prensa es cobertura, y eso se mide
 * al cerrar.
 */

// ─── Lo básico del expediente ─────────────────────────────────────────────────

export function pressPublicProfile(e: PressEventItem): EventPublicProfile {
  return e.publicProfile || emptyPublicProfile();
}

export function pressLineup(e: PressEventItem): EventLineupSlot[] {
  return e.lineup || [];
}

export function pressRequests(e: PressEventItem): PressAccreditationRequest[] {
  return e.accreditationRequests || [];
}

export function pressZones(e: PressEventItem): PressZone[] {
  return e.accreditation?.zones || [];
}

export function pressProductionItems(e: PressEventItem): EventProductionItem[] {
  return e.productionItems || [];
}

/**
 * El compromiso de un grupo, siempre con forma.
 *
 * Devuelve uno vacío en vez de `undefined` para que la pantalla no tenga que
 * decidir si pinta el bloque: un grupo sin compromiso capturado es un grupo con
 * el compromiso en blanco, no un grupo que no lo necesita.
 */
export function commitmentOf(e: PressEventItem, slot: EventLineupSlot): PressGroupCommitment {
  return (e.talentCommitments || []).find(c => c.slotId === slot.id)
    || emptyCommitment(slot.id, slot.groupId, slot.groupName);
}

/** Cuánto gasto hay presupuestado en un rubro. */
export function spendInCategories(e: PressEventItem, rubros: string[]): number {
  return pressProductionItems(e)
    .filter(p => rubros.includes(p.category))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
}

/** Quién arma el evento. Contra él se decide qué pendiente es "de alguien más". */
export function pressOrganizer(e: PressEventItem): string {
  return e.ownerManagerName || e.createdBy || '';
}

/**
 * Si quien mira es el creador original del evento.
 *
 * Recibe el nombre del actor por parámetro y no lo saca del propio evento. Suena
 * obvio, pero la versión de Eventos nació comparando el evento consigo mismo
 * —`isEventCreator(e, e.ownerManagerName)`— y devolvía `true` siempre: cualquiera
 * podía cancelar cualquier evento.
 */
export function isPressCreator(e: PressEventItem, actorNameOrManager?: string): boolean {
  if (!actorNameOrManager) return false;
  const owner = pressOrganizer(e);
  if (owner && owner.toLowerCase() === actorNameOrManager.toLowerCase()) return true;
  return !!e.createdBy && e.createdBy.toLowerCase() === actorNameOrManager.toLowerCase();
}

/**
 * Las disqueras que participan de verdad.
 *
 * Es la comprobación que decide si la interfaz habla de reparto o se calla. En
 * el caso normal —una sola disquera— cualquier columna de "otros managers",
 * cualquier confirmación cruzada y cualquier aviso de propuesta sobra: no hay a
 * quién preguntarle.
 */
export function participatingManagers(e: PressEventItem): string[] {
  const set = new Set<string>();
  const organizer = pressOrganizer(e);
  if (organizer) set.add(organizer);
  for (const a of e.managerAgreements || []) {
    if (a.status === 'Aceptado' || a.status === 'Pendiente' || a.status === 'Sin Enviar') {
      set.add(a.managerName);
    }
  }
  for (const s of pressLineup(e)) {
    if (s.isExternal && s.managerName) set.add(s.managerName);
  }
  return [...set].filter(Boolean);
}

/** True cuando el evento es de una sola disquera, que es el caso normal. */
export function isSingleManager(e: PressEventItem): boolean {
  return participatingManagers(e).length <= 1;
}

// ─── Acreditaciones ───────────────────────────────────────────────────────────

export interface AccreditationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  revoked: number;
  /** Personas comprometidas: cada acreditado aprobado con su equipo. */
  headcount: number;
  /** Cupo declarado del evento; 0 cuando no se ha definido. */
  capacity: number;
  /** Lugares que quedan. `null` cuando no hay cupo definido. */
  remaining: number | null;
  /** True cuando aprobar uno más rebasa el cupo. */
  overCapacity: boolean;
  attended: number;
  noShow: number;
}

export function accreditationStats(e: PressEventItem): AccreditationStats {
  const list = pressRequests(e);
  const approved = list.filter(isApproved);
  const revoked = list.filter(r => !!r.revocation);
  const capacity = e.accreditation?.capacity || 0;

  // El cupo se mide en personas y no en solicitudes: un medio que trae reportero,
  // camarógrafo y fotógrafo ocupa tres lugares en la sala, no uno. Contarlo por
  // solicitud es cómo se llena una rueda de prensa con el doble de gente de la
  // que cabe sin que nadie viera venir el problema.
  const headcount = approved.reduce((sum, r) => sum + crewSize(r), 0);

  return {
    total: list.length,
    pending: list.filter(r => r.status === 'pending').length,
    approved: approved.length,
    rejected: list.filter(r => r.status === 'rejected' && !r.revocation).length,
    revoked: revoked.length,
    headcount,
    capacity,
    remaining: capacity > 0 ? capacity - headcount : null,
    overCapacity: capacity > 0 && headcount > capacity,
    attended: approved.filter(r => r.attended).length,
    noShow: approved.filter(r => !r.attended).length
  };
}

/** Una acreditación viva: aprobada y sin revocar. */
export function isApproved(r: PressAccreditationRequest): boolean {
  return r.status === 'approved' && !r.revocation;
}

/** Cuánta gente trae. Sin dato, se cuenta una persona: la que solicita. */
export function crewSize(r: PressAccreditationRequest): number {
  return Math.max(1, r.crewSize || 1);
}

/**
 * En qué punto está la ventana de registro.
 *
 * `closesAt` deja de ser un adorno aquí: es lo que hace que el panel deje de
 * admitir altas y marque como tardío lo que llegue después. Un campo obligatorio
 * cuyo valor solo pinta una frase es un campo que no hace nada, y ya se cometió
 * ese error una vez.
 */
export type RegistrationWindow = 'sin-definir' | 'por-abrir' | 'abierto' | 'cerrado';

export function registrationWindow(e: PressEventItem, now = new Date()): RegistrationWindow {
  const opens = parseStamp(e.accreditation?.opensAt);
  const closes = parseStamp(e.accreditation?.closesAt);
  if (!opens && !closes) return 'sin-definir';
  if (opens && now.getTime() < opens.getTime()) return 'por-abrir';
  if (closes && now.getTime() > closes.getTime()) return 'cerrado';
  return 'abierto';
}

export function registrationWindowLabel(e: PressEventItem, now = new Date()): string {
  switch (registrationWindow(e, now)) {
    case 'sin-definir': return 'Sin ventana de registro definida';
    case 'por-abrir': return `El registro abre el ${stampLabel(e.accreditation?.opensAt)}`;
    case 'cerrado': return `El registro cerró el ${stampLabel(e.accreditation?.closesAt)}`;
    default: return e.accreditation?.closesAt
      ? `Registro abierto hasta el ${stampLabel(e.accreditation.closesAt)}`
      : 'Registro abierto sin fecha de cierre';
  }
}

/** Una solicitud que llegó después de cerrado el registro. */
export function isLateRequest(e: PressEventItem, r: PressAccreditationRequest): boolean {
  const closes = parseStamp(e.accreditation?.closesAt);
  const at = parseStamp(r.requestedAt);
  return !!closes && !!at && at.getTime() > closes.getTime();
}

/**
 * Solicitudes que se pisan entre sí.
 *
 * Es lo más común del apartado y hoy nadie lo vería: el mismo reportero manda su
 * solicitud dos veces porque no le llegó el correo, o dos personas del mismo
 * medio la mandan por separado sin saberlo. Aprobar las dos es mandar dos
 * gafetes a la misma puerta.
 */
export interface DuplicateGroup {
  /** Por qué se parecen: el correo o el medio. */
  reason: 'correo' | 'medio';
  key: string;
  requests: PressAccreditationRequest[];
}

export function duplicateGroups(e: PressEventItem): DuplicateGroup[] {
  const list = pressRequests(e).filter(r => !r.revocation);
  const out: DuplicateGroup[] = [];

  const byEmail = new Map<string, PressAccreditationRequest[]>();
  for (const r of list) {
    const key = (r.email || '').trim().toLowerCase();
    if (!key) continue;
    byEmail.set(key, [...(byEmail.get(key) || []), r]);
  }
  for (const [key, requests] of byEmail) {
    if (requests.length > 1) out.push({ reason: 'correo', key, requests });
  }

  // Un medio con varias solicitudes no siempre es un error —un diario manda al
  // reportero y al fotógrafo— así que se avisa aparte y con menos alarma que el
  // correo repetido, que sí es casi siempre la misma persona dos veces.
  const byMedium = new Map<string, PressAccreditationRequest[]>();
  for (const r of list) {
    if (r.applicantType !== 'media') continue;
    const key = (r.mediumName || '').trim().toLowerCase();
    if (!key) continue;
    byMedium.set(key, [...(byMedium.get(key) || []), r]);
  }
  for (const [key, requests] of byMedium) {
    const emails = new Set(requests.map(r => (r.email || '').trim().toLowerCase()));
    // Si todas comparten correo ya se reportó arriba; repetirlo es ruido.
    if (requests.length > 1 && emails.size > 1) out.push({ reason: 'medio', key, requests });
  }

  return out;
}

/** Las solicitudes que comparten correo o medio con esta. */
export function duplicatesOf(e: PressEventItem, r: PressAccreditationRequest): PressAccreditationRequest[] {
  const found = new Map<string, PressAccreditationRequest>();
  for (const group of duplicateGroups(e)) {
    if (!group.requests.some(x => x.id === r.id)) continue;
    for (const other of group.requests) {
      if (other.id !== r.id) found.set(other.id, other);
    }
  }
  return [...found.values()];
}

/** Cómo se reparte la cobertura entre tipos. Es la mezcla que se busca cuidar. */
export function coverageBreakdown(e: PressEventItem): { type: CoverageType; count: number }[] {
  const approved = pressRequests(e).filter(isApproved);
  const by = new Map<CoverageType, number>();
  for (const r of approved) by.set(r.accredType, (by.get(r.accredType) || 0) + 1);
  return [...by.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/** Medios distintos con al menos un acreditado vivo. */
export function accreditedOutlets(e: PressEventItem): string[] {
  const set = new Set<string>();
  for (const r of pressRequests(e)) {
    if (isApproved(r) && r.mediumName?.trim()) set.add(r.mediumName.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Genera el folio del gafete.
 *
 * Se genera y no se deja vacío porque un aprobado sin `badgeId` es un gafete en
 * blanco en la puerta: el portal lo imprime tal cual y el acreditado llega con
 * una credencial sin folio que nadie puede verificar.
 */
export function nextBadgeId(e: PressEventItem): string {
  const used = new Set(pressRequests(e).map(r => r.badgeId).filter(Boolean) as string[]);
  for (let n = 1; n < 1000; n++) {
    const candidate = badgeIdFor(e, n);
    if (!used.has(candidate)) return candidate;
  }
  return `${badgePrefix(e)}-${badgeBase(e)}-${Date.now().toString().slice(-4)}`;
}

export function badgePrefix(e: PressEventItem): string {
  return e.pressType === 'Firma de Autógrafos' ? 'FRM' : 'RDP';
}

/**
 * El tronco del folio.
 *
 * Es la parte numérica del id del expediente y no sus últimos caracteres: con
 * 'PRS-301' el recorte devolvía 'S301', así que los folios nuevos salían
 * 'FRM-S301-001' y no colisionaban con los 'FRM-301-00x' que ya existían. El
 * resultado era un segundo gafete número uno en la misma puerta.
 */
export function badgeBase(e: PressEventItem): string {
  return (e.id?.match(/\d+/) || ['000'])[0];
}

export function badgeIdFor(e: PressEventItem, n: number): string {
  return `${badgePrefix(e)}-${badgeBase(e)}-${String(n).padStart(3, '0')}`;
}

/**
 * Cómo se lee el acceso de un gafete.
 *
 * Sin zonas asignadas manda la etiqueta general del evento, que es la que el
 * portal enseñaba fija: el gafete siempre decía ALL ACCESS aunque el acreditado
 * solo pudiera entrar a la sala de prensa.
 */
export function badgeAccessLabel(e: PressEventItem, r: PressAccreditationRequest): string {
  const all = e.accreditation?.allAccessLabel?.trim() || 'ALL ACCESS';
  const zones = r.zones || [];
  const available = pressZones(e);
  if (!zones.length) return all;
  if (available.length > 0 && zones.length >= available.length) return all;
  return zones.map(id => zoneName(e, id)).join(' · ');
}

export function zoneName(e: PressEventItem, zoneId: string): string {
  return pressZones(e).find(z => z.id === zoneId)?.name || zoneId;
}

/** Cuántos gafetes vivos tiene asignada una zona. */
export function zoneOccupancy(e: PressEventItem, zoneId: string): number {
  return pressRequests(e).filter(r => isApproved(r) && (r.zones || []).includes(zoneId))
    .reduce((sum, r) => sum + crewSize(r), 0);
}

// ─── Gasto ────────────────────────────────────────────────────────────────────

/** Lo que suma el desglose de producción. Es el único total del expediente. */
export function pressSpend(e: PressEventItem): number {
  return pressProductionItems(e).reduce((sum, p) => sum + (p.amount || 0), 0);
}

/** Lo ya comprometido: contratado o pagado. El resto sigue siendo estimación. */
export function pressCommittedSpend(e: PressEventItem): number {
  return pressProductionItems(e)
    .filter(p => p.status === 'Contratado' || p.status === 'Pagado')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
}

export function pressPaidSpend(e: PressEventItem): number {
  return pressProductionItems(e)
    .filter(p => p.status === 'Pagado')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
}

/**
 * Cuánto costó cada medio que se presentó.
 *
 * Es la cifra que sustituye al margen: en un evento de prensa no se gana dinero,
 * se compra cobertura, y lo único comparable entre dos ruedas es cuánto costó
 * traer a cada medio que de verdad llegó.
 */
export function costPerAttendee(e: PressEventItem): number | null {
  const asistieron = e.closure?.attendedCount ?? accreditationStats(e).attended;
  if (!asistieron) return null;
  const gasto = e.closure?.finalSpend ?? pressSpend(e);
  return Math.round(gasto / asistieron);
}

// ─── El calendario contra el estado ───────────────────────────────────────────

/** Si ya amaneció el día siguiente al del evento. */
export function pressDayHasPassed(date: string | undefined, today = new Date()): boolean {
  if (!date) return false;
  const dia = new Date(date + 'T00:00:00');
  if (isNaN(dia.getTime())) return false;
  const corte = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
  return today.getTime() >= corte.getTime();
}

/**
 * Si ya tiene sentido pasar lista.
 *
 * El permiso lo da la fase, pero el momento lo da el calendario, y son dos cosas
 * distintas: en 'Convocado' se puede marcar asistencia porque el día del evento
 * el expediente sigue en esa fase, no porque tenga sentido hacerlo tres semanas
 * antes. Sin esta comprobación la pantalla anunciaba "3 no se presentaron" en un
 * evento que todavía no ocurría.
 */
export function isCheckInOpen(e: PressEventItem, today = new Date()): boolean {
  if (e.state === 'Realizado' || e.state === 'Cerrado') return true;
  if (e.state !== 'Convocado') return false;
  return daysUntilPress(e, today) <= 0;
}

export function daysUntilPress(e: PressEventItem, today = new Date()): number {
  if (!e.date) return NaN;
  const dia = new Date(e.date + 'T00:00:00');
  if (isNaN(dia.getTime())) return NaN;
  const hoy = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((dia.getTime() - hoy.getTime()) / 86_400_000);
}

/**
 * Un evento de prensa al que se le pasó la fecha sin llegar a convocarse.
 *
 * No se concluye solo —nunca ocurrió— ni se cancela —nadie lo decidió—, así que
 * se queda flotando en su fase para siempre sin aparecer en ninguna alarma.
 */
export function isStaleUnconvoked(e: PressEventItem, today = new Date()): boolean {
  const vivos: PressState[] = ['Borrador', 'En Revisión'];
  return vivos.includes(e.state) && pressDayHasPassed(e.date, today);
}

/** Fecha y hora del evento en un solo texto, para la portada y las tarjetas. */
export function pressWhenLabel(e: PressEventItem): string {
  if (!e.date) return 'Sin fecha';
  const d = new Date(e.date + 'T00:00:00');
  const fecha = isNaN(d.getTime())
    ? e.date
    : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  return e.startTime ? `${fecha} · ${e.startTime} hrs` : fecha;
}

// ─── Utilidades de fecha ──────────────────────────────────────────────────────

function parseStamp(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso.length > 10 ? iso : iso + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

export function stampLabel(iso?: string): string {
  const d = parseStamp(iso);
  if (!d) return 'sin definir';
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    + ', ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Cómo se lee un estado de solicitud en el panel. */
export const ACCREDITATION_STATUS_LABEL: Record<AccreditationStatus, string> = {
  pending: 'En revisión',
  approved: 'Acreditada',
  rejected: 'Rechazada'
};
