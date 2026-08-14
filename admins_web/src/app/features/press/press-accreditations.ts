import { ActorRef, EventActivity } from '../../core/models/event.models';
import {
  AccreditationKind,
  CoverageType,
  PressAccreditationRequest,
  PressEventItem
} from '../../core/models/press.models';
import { isPublicPressState } from '../../core/models/press-state.meta';
import {
  accreditationStats, badgeBase, badgeIdFor, badgePrefix, crewSize, isApproved,
  nextBadgeId, pressRequests, pressZones
} from './press-metrics';

/**
 * Las operaciones sobre las acreditaciones.
 *
 * Están aquí y no dentro del componente porque son la operación central del
 * apartado y tienen reglas que no se pueden dejar a la disciplina de quien pinta
 * el botón: aprobar **asigna** gafete y zonas, rechazar **exige** motivo, y con
 * el evento ya convocado no se borra a nadie que tenga pase confirmado.
 *
 * Todas devuelven un parche del expediente, igual que el resto del panel: la
 * pestaña arma el cambio y lo manda entero en vez de que el store tenga un
 * método por campo.
 */

export interface AccreditationPatch {
  patch: Partial<PressEventItem>;
  /** Qué contarle a quien pulsó el botón. Vacío cuando no hay nada que decir. */
  message: string;
  /** True cuando la operación no llegó a hacer nada. */
  blocked?: boolean;
}

function now(): string {
  return new Date().toISOString().slice(0, 16);
}

function activity(
  e: PressEventItem,
  actor: ActorRef,
  kind: EventActivity['kind'],
  summary: string,
  targetId?: string,
  targetLabel?: string
): EventActivity[] {
  return [
    {
      id: `act-acr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      at: now(),
      actor,
      channel: 'acreditaciones',
      kind,
      summary,
      targetId,
      targetLabel
    },
    ...(e.activity || [])
  ];
}

function replaceRequest(
  e: PressEventItem,
  id: string,
  change: (r: PressAccreditationRequest) => PressAccreditationRequest
): PressAccreditationRequest[] {
  return pressRequests(e).map(r => (r.id === id ? change(r) : r));
}

// ─── Alta manual ──────────────────────────────────────────────────────────────

export interface NewAccreditationDraft {
  applicantType: AccreditationKind;
  mediumName: string;
  journalistName: string;
  email: string;
  phone?: string;
  cardId: string;
  accredType: CoverageType;
  crewSize?: number;
  equipmentNotes?: string;
  internalNotes?: string;
}

/**
 * Da de alta una solicitud desde el panel.
 *
 * Existe porque la mitad de las acreditaciones de un evento regional no llegan
 * por el portal: llegan por WhatsApp, por teléfono o porque el medio de siempre
 * simplemente avisa que va. Si esas no se pueden capturar, la lista del panel no
 * es la lista real y el conteo de cupo no sirve para nada.
 */
export function addRequest(
  e: PressEventItem,
  draft: NewAccreditationDraft,
  actor: ActorRef
): AccreditationPatch {
  const request: PressAccreditationRequest = {
    id: `ACR-${Date.now().toString(36).toUpperCase()}`,
    eventId: e.id,
    applicantType: draft.applicantType,
    mediumName: draft.mediumName.trim()
      || (draft.applicantType === 'independent' ? 'Creador Independiente' : 'Medio General'),
    journalistName: draft.journalistName.trim(),
    email: draft.email.trim(),
    phone: draft.phone?.trim() || undefined,
    cardId: draft.cardId.trim(),
    accredType: draft.accredType,
    crewSize: draft.crewSize && draft.crewSize > 0 ? draft.crewSize : undefined,
    equipmentNotes: draft.equipmentNotes?.trim() || undefined,
    internalNotes: draft.internalNotes?.trim() || undefined,
    status: 'pending',
    requestedAt: now()
  };

  return {
    patch: {
      accreditationRequests: [request, ...pressRequests(e)],
      activity: activity(e, actor, 'alta',
        `${actor.name} registró la solicitud de ${request.journalistName} (${request.mediumName})`,
        request.id, request.journalistName)
    },
    message: `Solicitud de ${request.journalistName} registrada. Queda en revisión, como las que llegan del portal.`
  };
}

// ─── Aprobar ──────────────────────────────────────────────────────────────────

export interface ApproveOptions {
  /** Folio del gafete. Si no se elige, se genera: nunca se aprueba sin folio. */
  badgeId?: string;
  /** Zonas del gafete. Vacío significa todas las del evento. */
  zones?: string[];
}

/**
 * Aprueba una solicitud asignándole gafete y zonas.
 *
 * Las dos cosas se asignan aquí y no en un paso posterior porque un aprobado sin
 * `badgeId` es literalmente un gafete en blanco en la puerta: el portal imprime
 * lo que haya, y el acreditado llega con una credencial sin folio que nadie
 * puede verificar contra esta lista.
 */
export function approveRequest(
  e: PressEventItem,
  id: string,
  actor: ActorRef,
  options: ApproveOptions = {}
): AccreditationPatch {
  const target = pressRequests(e).find(r => r.id === id);
  if (!target) return { patch: {}, message: '', blocked: true };

  const badgeId = options.badgeId?.trim() || target.badgeId || nextBadgeId(e);
  const zones = options.zones?.length ? options.zones : pressZones(e).map(z => z.id);

  const requests = replaceRequest(e, id, r => ({
    ...r,
    status: 'approved',
    respondedAt: now(),
    respondedBy: actor,
    rejectionReason: undefined,
    revocation: undefined,
    badgeId,
    zones
  }));

  const antes = accreditationStats(e);
  const despues = antes.capacity > 0 ? antes.headcount + crewSize(target) : 0;
  const aviso = antes.capacity > 0 && despues > antes.capacity
    ? ` Ojo: con esta acreditación el cupo queda en ${despues} de ${antes.capacity}.`
    : '';

  return {
    patch: {
      accreditationRequests: requests,
      activity: activity(e, actor, 'respuesta',
        `${actor.name} acreditó a ${target.journalistName} (${target.mediumName}) con el gafete ${badgeId}`,
        id, target.journalistName)
    },
    message: `${target.journalistName} queda acreditado con el gafete ${badgeId}.${aviso}`
  };
}

/**
 * Aprueba varias solicitudes de una vez.
 *
 * Existe para los medios de siempre —los cuatro o cinco que cubren todo lo de la
 * disquera— porque revisarlos uno por uno en cada evento es trabajo que nadie va
 * a hacer. Lo que **no** hay es rechazo en lote: cada rechazo lleva su motivo y
 * un motivo compartido entre seis solicitudes no le explica nada a ninguna.
 */
export function approveMany(
  e: PressEventItem,
  ids: string[],
  actor: ActorRef,
  zones?: string[]
): AccreditationPatch {
  const objetivo = new Set(ids);
  const seleccionadas = pressRequests(e).filter(r => objetivo.has(r.id));
  if (!seleccionadas.length) return { patch: {}, message: '', blocked: true };

  const usados = new Set(pressRequests(e).map(r => r.badgeId).filter(Boolean) as string[]);
  const todas = pressZones(e).map(z => z.id);
  const asignadas = zones?.length ? zones : todas;

  const requests = pressRequests(e).map(r => {
    if (!objetivo.has(r.id)) return r;
    // El folio se genera dentro del recorrido y contra los ya usados, no con
    // `nextBadgeId` por solicitud: esa función mira el expediente actual, así que
    // en lote habría devuelto el mismo folio para las cinco.
    const badgeId = r.badgeId || reserveBadgeId(e, usados);
    usados.add(badgeId);
    return {
      ...r,
      status: 'approved' as const,
      respondedAt: now(),
      respondedBy: actor,
      rejectionReason: undefined,
      revocation: undefined,
      badgeId,
      zones: r.zones?.length ? r.zones : asignadas
    };
  });

  const stats = accreditationStats({ ...e, accreditationRequests: requests });
  const aviso = stats.overCapacity
    ? ` El cupo queda en ${stats.headcount} de ${stats.capacity}: revisa si de verdad caben.`
    : '';

  return {
    patch: {
      accreditationRequests: requests,
      activity: activity(e, actor, 'respuesta',
        `${actor.name} acreditó ${seleccionadas.length} solicitud(es) en lote`,
        undefined, `${seleccionadas.length} acreditaciones`)
    },
    message: `${seleccionadas.length} solicitud(es) acreditadas con su gafete.${aviso}`
  };
}

function reserveBadgeId(e: PressEventItem, usados: Set<string>): string {
  for (let n = 1; n < 1000; n++) {
    const candidate = badgeIdFor(e, n);
    if (!usados.has(candidate)) return candidate;
  }
  return `${badgePrefix(e)}-${badgeBase(e)}-${Date.now().toString().slice(-4)}`;
}

// ─── Rechazar ─────────────────────────────────────────────────────────────────

/**
 * Rechaza una solicitud con su motivo.
 *
 * El motivo es obligatorio y no por formalismo: el portal se lo enseña al
 * solicitante junto a un botón de "Corregir Datos e Intentar Nuevamente". Un
 * rechazo sin explicación produce exactamente lo mismo que había antes —la misma
 * solicitud otra vez, idéntica— y encima con el medio molesto.
 */
export function rejectRequest(
  e: PressEventItem,
  id: string,
  actor: ActorRef,
  reason: string
): AccreditationPatch {
  const motivo = reason.trim();
  const target = pressRequests(e).find(r => r.id === id);
  if (!target) return { patch: {}, message: '', blocked: true };
  if (!motivo) {
    return {
      patch: {},
      message: 'Un rechazo sin motivo llega al solicitante como una negativa en blanco: escribe por qué.',
      blocked: true
    };
  }

  const requests = replaceRequest(e, id, r => ({
    ...r,
    status: 'rejected',
    respondedAt: now(),
    respondedBy: actor,
    rejectionReason: motivo,
    badgeId: undefined,
    zones: undefined
  }));

  return {
    patch: {
      accreditationRequests: requests,
      activity: activity(e, actor, 'respuesta',
        `${actor.name} rechazó la solicitud de ${target.journalistName} (${target.mediumName})`,
        id, target.journalistName)
    },
    message: `Solicitud rechazada. ${target.journalistName} verá el motivo en el portal y podrá corregir sus datos.`
  };
}

// ─── Revocar ──────────────────────────────────────────────────────────────────

/**
 * Le retira el pase a alguien que ya lo tenía.
 *
 * No es lo mismo que borrar y por eso no borra: la solicitud se queda, con quién
 * la revocó, cuándo y por qué. Alguien que ya confirmó su gafete probablemente ya
 * apartó su agenda y lo más seguro es que se presente igual; el día del evento
 * hay que poder explicar en la puerta por qué ese folio no vale.
 */
export function revokeAccreditation(
  e: PressEventItem,
  id: string,
  actor: ActorRef,
  reason: string
): AccreditationPatch {
  const motivo = reason.trim();
  const target = pressRequests(e).find(r => r.id === id);
  if (!target || !isApproved(target)) return { patch: {}, message: '', blocked: true };
  if (!motivo) {
    return {
      patch: {},
      message: 'Revocar un pase confirmado exige motivo: es lo que se le explica al medio y lo que queda en la puerta.',
      blocked: true
    };
  }

  const requests = replaceRequest(e, id, r => ({
    ...r,
    status: 'rejected',
    rejectionReason: motivo,
    respondedAt: now(),
    respondedBy: actor,
    revocation: { at: now(), by: actor, reason: motivo, badgeId: r.badgeId }
  }));

  return {
    patch: {
      accreditationRequests: requests,
      activity: activity(e, actor, 'baja',
        `${actor.name} revocó el gafete ${target.badgeId || 'sin folio'} de ${target.journalistName}: ${motivo}`,
        id, target.journalistName)
    },
    message: `Gafete revocado. Queda registrado el motivo y el folio ${target.badgeId || 'sin folio'} deja de ser válido.`
  };
}

// ─── Borrar ───────────────────────────────────────────────────────────────────

/**
 * Elimina solicitudes del expediente.
 *
 * Aquí vive el guardián de la regla aditiva, y vive en la operación y no en un
 * aviso a propósito: un aviso se ignora, un filtro no. Con el evento ya convocado
 * las acreditaciones vivas no se borran —se revocan, que deja rastro— y esta
 * función las aparta y reporta cuántas rechazó, en lugar de dejar que la pantalla
 * se acuerde de comprobarlo.
 */
export function removeRequests(
  e: PressEventItem,
  ids: string[],
  actor: ActorRef
): AccreditationPatch {
  const objetivo = new Set(ids);
  const publico = isPublicPressState(e.state);
  const seleccionadas = pressRequests(e).filter(r => objetivo.has(r.id));
  const protegidas = publico ? seleccionadas.filter(isApproved) : [];
  const borrables = new Set(
    seleccionadas.filter(r => !protegidas.some(p => p.id === r.id)).map(r => r.id)
  );

  if (!borrables.size) {
    return {
      patch: {},
      message: protegidas.length
        ? `No se borró nada: ${protegidas.length} acreditación(es) ya están confirmadas. Con el evento convocado se revocan con motivo, no se borran.`
        : '',
      blocked: true
    };
  }

  const requests = pressRequests(e).filter(r => !borrables.has(r.id));
  const rechazo = protegidas.length
    ? ` Se conservaron ${protegidas.length} acreditación(es) confirmada(s): esas se revocan con motivo.`
    : '';

  return {
    patch: {
      accreditationRequests: requests,
      activity: activity(e, actor, 'baja',
        `${actor.name} eliminó ${borrables.size} solicitud(es) de acreditación`)
    },
    message: `${borrables.size} solicitud(es) eliminadas.${rechazo}`
  };
}

// ─── Asistencia ───────────────────────────────────────────────────────────────

/**
 * Marca quién se presentó de verdad.
 *
 * Es el dato que de verdad importa al cerrar: la diferencia entre acreditados y
 * asistentes es lo único que distingue una rueda a la que fue todo el mundo de
 * una a la que se acreditaron treinta y llegaron cuatro.
 */
export function setAttendance(
  e: PressEventItem,
  id: string,
  attended: boolean,
  actor: ActorRef
): AccreditationPatch {
  const target = pressRequests(e).find(r => r.id === id);
  if (!target || !isApproved(target)) return { patch: {}, message: '', blocked: true };

  const requests = replaceRequest(e, id, r => ({
    ...r,
    attended,
    checkedInAt: attended ? now() : undefined
  }));

  return {
    patch: { accreditationRequests: requests },
    message: attended
      ? `${target.journalistName} queda marcado como asistente.`
      : `${target.journalistName} vuelve a contar como no presentado.`
  };
}

/** Cambia el gafete o las zonas de una acreditación viva. */
export function updateBadge(
  e: PressEventItem,
  id: string,
  actor: ActorRef,
  changes: { badgeId?: string; zones?: string[] }
): AccreditationPatch {
  const target = pressRequests(e).find(r => r.id === id);
  if (!target || !isApproved(target)) return { patch: {}, message: '', blocked: true };

  const badgeId = changes.badgeId?.trim() || target.badgeId;
  const zones = changes.zones ?? target.zones;

  const requests = replaceRequest(e, id, r => ({ ...r, badgeId, zones }));

  return {
    patch: {
      accreditationRequests: requests,
      activity: activity(e, actor, 'edicion',
        `${actor.name} ajustó el gafete de ${target.journalistName} (${badgeId || 'sin folio'})`,
        id, target.journalistName)
    },
    message: 'Gafete actualizado.'
  };
}
