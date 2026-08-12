import { EventItem, EventLineupSlot } from '../../core/models/event.models';
import {
  isCoOrganizedSlot,
  lineup,
  organizerName,
  slotCost,
  publicProfile
} from './event-metrics';
import {
  croquisCapacity,
  planStages,
  tierCroquisSummary
} from './croquis/croquis-metrics';

/**
 * Qué le falta a un evento para poder salir de 'Borrador'.
 *
 * Esta es la regla más importante del módulo: el evento no se envía a revisión
 * "cuando el encargado crea que ya está", sino cuando la información que los
 * demás encargados necesitan para poder aprobar existe de verdad. Pedirle a
 * alguien que apruebe un cartel sin horas de entrada ni costos desglosados es
 * pedirle que apruebe a ciegas, y ese es exactamente el error que después se
 * paga caro en 'En Venta'.
 *
 * Hay dos niveles: `required` bloquea el envío a revisión; el resto son
 * recomendaciones que solo bajan el porcentaje de avance.
 */

export type CompletenessGroup = 'Identidad' | 'Cartelera Pública' | 'Cartel' | 'Producción' | 'Boletaje';

export interface CompletenessItem {
  id: string;
  group: CompletenessGroup;
  label: string;
  /** Qué hacer para cumplirlo, cuando no está cumplido. */
  hint: string;
  done: boolean;
  /** True si su ausencia impide enviar el evento a revisión. */
  required: boolean;
  /**
   * Managers que responden por este dato, esté cumplido o no. Casi siempre es
   * solo el organizador, pero hay puntos que él no puede tocar: los horarios y
   * los costos de un grupo de co-organizador los captura su dueño, y la ficha
   * pública de cualquier grupo ajeno vive en el expediente de ese grupo.
   *
   * Cuando el punto ya está cumplido, esta es la lista de quienes lo capturaron.
   */
  owners: string[];
  /**
   * De esos, los que todavía tienen algo sin capturar. Vacío cuando el punto ya
   * está cumplido. Es la diferencia entre "me falta trabajo" y "estoy esperando
   * a alguien más".
   */
  pendingOwners: string[];
}

/** Pendientes obligatorios agrupados por quién los debe resolver. */
export interface PendingOwnerGroup {
  owner: string;
  /** True cuando es el propio organizador: son pendientes que sí puede resolver. */
  isOrganizer: boolean;
  items: CompletenessItem[];
}

export interface CompletenessReport {
  items: CompletenessItem[];
  doneCount: number;
  totalCount: number;
  /** Avance sobre todos los puntos, obligatorios y recomendados. */
  percent: number;
  /** Puntos obligatorios que siguen sin cumplirse. */
  missingRequired: CompletenessItem[];
  /** Puntos recomendados que siguen sin cumplirse. */
  missingOptional: CompletenessItem[];
  /** True cuando ya no falta ningún punto obligatorio. */
  canSubmitForReview: boolean;
  /** Quién arma el evento; contra él se decide qué pendiente es "de alguien más". */
  organizer: string;
  /** Los obligatorios que faltan, repartidos por responsable. */
  pendingByOwner: PendingOwnerGroup[];
  /** True cuando todo lo que falta lo puede resolver el organizador solo. */
  allPendingAreOwn: boolean;
}

export function eventCompleteness(e: EventItem): CompletenessReport {
  const slots = lineup(e);
  const tiers = e.ticketTiers || [];
  // El croquis es la fuente de verdad del boletaje: los lugares de cada
  // categoría se cuentan del plano, así que el checklist mide el plano.
  const plans = e.croquisPlans || [];
  const areas = plans.flatMap(p => p.areas);
  const tierIds = new Set(tiers.map(t => t.id).filter(Boolean) as string[]);
  const croquisPorTier = tierCroquisSummary(plans);
  const publico = publicProfile(e);
  const organizer = organizerName(e);

  /** Los horarios de un grupo de co-organizador los pone su dueño, no el organizador. */
  const scheduleOwner = (s: EventLineupSlot) => (isCoOrganizedSlot(e, s) ? s.managerName : organizer);
  /** El costo de un grupo de co-organizador es privado: solo él lo conoce. */
  const costOwner = scheduleOwner;
  /** La ficha pública de un grupo vive en el expediente de su dueño. */
  const profileOwner = (s: EventLineupSlot) => (s.isExternal ? s.managerName : organizer);

  /** Responsables únicos de un conjunto de grupos, sin repetir. */
  const responsables = (list: EventLineupSlot[], quien: (s: EventLineupSlot) => string): string[] =>
    [...new Set(list.map(quien))];

  /**
   * Responsables de un punto que se mide grupo por grupo: todos los que
   * responden por él, y de esos los que siguen debiendo algo.
   */
  const porGrupo = (pendientes: EventLineupSlot[], quien: (s: EventLineupSlot) => string) => ({
    owners: slots.length ? responsables(slots, quien) : [organizer],
    pendingOwners: responsables(pendientes, quien)
  });

  const sinHorarios = slots.filter(s => !s.setStartTime || !s.setEndTime);
  const sinLlegada = slots.filter(s => !s.arrivalTime);
  const sinCosto = slots.filter(s => slotCost(s) <= 0);
  const sinFichaPublica = slots.filter(s =>
    !s.imageUrl?.trim() || !s.genre?.trim() || !s.profileSlug?.trim() || !(s.rating ?? 0));

  // Los responsables se omiten en casi todos: lo resuelve el organizador y se
  // rellenan abajo. Solo se declaran donde de verdad depende de otro manager.
  const rawItems: (Omit<CompletenessItem, 'owners' | 'pendingOwners'> & {
    owners?: string[];
    pendingOwners?: string[];
  })[] = [
    // --- Identidad y logística ---
    {
      id: 'identidad',
      group: 'Identidad',
      label: 'Nombre, fecha y recinto del evento',
      hint: 'Captura título, fecha, recinto y ciudad',
      required: true,
      done: !!e.title?.trim() && !!e.date && !!e.venue?.trim() && !!e.location?.trim()
    },
    {
      id: 'flyer',
      group: 'Identidad',
      label: 'Flyer o imagen de cartelera',
      hint: 'Sube la imagen con la que el evento aparecerá en la cartelera pública',
      required: true,
      done: !!e.flyerUrl?.trim()
    },
    {
      id: 'descripcion',
      group: 'Identidad',
      label: 'Descripción pública del evento',
      hint: 'Escribe el texto que leerá el público en la cartelera',
      required: false,
      done: (e.description || '').trim().length >= 30
    },
    {
      id: 'direccion',
      group: 'Identidad',
      label: 'Dirección exacta del recinto',
      hint: 'Captura la dirección completa para el público y para la producción',
      required: false,
      done: !!e.venueAddress?.trim()
    },

    // --- Cartelera pública ---
    // Todo lo que el portal del cliente muestra en /events/comprar-boletos.
    // Sin esto el evento se publica con huecos visibles para el público.
    {
      id: 'portada',
      group: 'Cartelera Pública',
      label: 'Portada panorámica del evento',
      hint: 'Imagen horizontal que encabeza la ficha pública',
      required: true,
      done: !!publico.coverUrl.trim()
    },
    {
      id: 'cartel_oficial',
      group: 'Cartelera Pública',
      label: 'Cartel oficial vertical (3:4)',
      hint: 'Es el cartel que el cliente amplía con la lupa; no puede ser la misma portada',
      required: true,
      done: !!publico.posterUrl.trim()
    },
    {
      id: 'categoria',
      group: 'Cartelera Pública',
      label: 'Categoría del evento',
      hint: 'Concierto, festival, baile, palenque… es la etiqueta que ve el público',
      required: true,
      done: !!publico.category
    },
    {
      id: 'tagline',
      group: 'Cartelera Pública',
      label: 'Frase de portada',
      hint: 'La línea corta que aparece bajo el título en la ficha pública',
      required: true,
      done: publico.tagline.trim().length >= 15
    },
    {
      id: 'about_publico',
      group: 'Cartelera Pública',
      label: 'Texto de "Información del Evento"',
      hint: 'Descripción larga que lee el cliente antes de comprar',
      required: true,
      done: publico.about.trim().length >= 80
    },
    {
      id: 'reglas',
      group: 'Cartelera Pública',
      label: 'Reglas e información adicional',
      hint: 'Al menos tres reglas: accesos, edad mínima, apertura de puertas',
      required: true,
      done: publico.rules.length >= 3
    },
    {
      id: 'edad',
      group: 'Cartelera Pública',
      label: 'Restricción de edad',
      hint: 'Qué edad mínima se le comunica al público',
      required: false,
      done: !!publico.minimumAge?.trim()
    },
    {
      id: 'soporte',
      group: 'Cartelera Pública',
      label: 'Teléfono de compra y soporte',
      hint: 'El número que la ficha ofrece para comprar por teléfono',
      required: true,
      done: !!publico.supportPhone?.trim()
    },
    {
      id: 'cargo_servicio',
      group: 'Cartelera Pública',
      label: 'Cargo por servicio por asiento',
      hint: 'Lo que la taquilla suma a cada boleto; el cliente lo ve en el total',
      required: true,
      done: (publico.serviceFeePerSeat ?? 0) > 0
    },

    // --- Cartel ---
    {
      id: 'cartel',
      group: 'Cartel',
      label: 'Al menos un grupo en el cartel',
      hint: 'Agrega los grupos que se presentarán',
      required: true,
      done: slots.length > 0
    },
    {
      id: 'headliner',
      group: 'Cartel',
      label: 'Cabeza de cartel definida',
      hint: 'Marca cuál grupo encabeza el evento',
      required: true,
      done: slots.some(s => s.isHeadliner)
    },
    {
      id: 'orden',
      group: 'Cartel',
      label: 'Orden de entradas con hora de cada grupo',
      hint: 'Define hora de inicio y fin de la tanda de cada grupo',
      required: true,
      done: slots.length > 0 && sinHorarios.length === 0,
      ...porGrupo(sinHorarios, scheduleOwner)
    },
    {
      id: 'llegadas',
      group: 'Cartel',
      label: 'Hora de llegada de cada grupo',
      hint: 'Indica a qué hora debe estar cada grupo en el recinto',
      required: true,
      done: slots.length > 0 && sinLlegada.length === 0,
      ...porGrupo(sinLlegada, scheduleOwner)
    },
    {
      id: 'costos',
      group: 'Cartel',
      label: 'Costo desglosado de cada grupo',
      hint: 'Cada grupo debe traer su desglose de honorarios y viáticos',
      required: true,
      done: slots.length > 0 && sinCosto.length === 0,
      ...porGrupo(sinCosto, costOwner)
    },
    {
      id: 'encargados',
      group: 'Cartel',
      label: 'Encargado responsable de cada grupo externo',
      hint: 'Sin encargado no hay a quién pedirle la aprobación',
      required: true,
      done: slots.filter(s => s.isExternal).every(s => !!s.managerName?.trim())
    },
    {
      id: 'grupos_publico',
      group: 'Cartel',
      label: 'Ficha pública de cada grupo (foto, género, rating y perfil)',
      hint: 'Es lo que el cliente ve en el line-up y lo que enlaza al perfil del grupo',
      required: true,
      done: slots.length > 0 && sinFichaPublica.length === 0,
      ...porGrupo(sinFichaPublica, profileOwner)
    },
    {
      id: 'videos_grupos',
      group: 'Cartel',
      label: 'Video de invitación de al menos un grupo',
      hint: 'El portal muestra los saludos de los artistas antes de comprar',
      required: false,
      done: slots.some(s => (s.invitationVideos || []).length > 0),
      // Basta con un video de cualquiera, así que todos responden por igual.
      owners: slots.length ? responsables(slots, profileOwner) : [organizer]
    },

    // --- Producción ---
    {
      id: 'sonido',
      group: 'Producción',
      label: 'Equipo de sonido definido',
      hint: 'Indica quién lleva el audio: un grupo, un proveedor externo o el recinto',
      required: true,
      done: !!e.sound && e.sound.providerType !== 'Por Definir'
    },
    {
      id: 'ingeniero',
      group: 'Producción',
      label: 'Responsable de audio con contacto',
      hint: 'Captura nombre y teléfono del ingeniero de audio',
      required: true,
      done: !!e.sound?.engineerName?.trim() && !!e.sound?.engineerPhone?.trim()
    },
    {
      id: 'soundcheck',
      group: 'Producción',
      label: 'Prueba de sonido agendada',
      hint: 'Define la hora del sound check general',
      required: true,
      done: !!e.schedule?.soundCheckAt || !!e.sound?.soundCheckStart
    },
    {
      id: 'corrida',
      group: 'Producción',
      label: 'Corrida del día: puertas e inicio de show',
      hint: 'Define apertura de puertas y hora de inicio del espectáculo',
      required: true,
      done: !!e.schedule?.doorsOpenAt && !!e.schedule?.showStartAt
    },
    {
      id: 'rider',
      group: 'Producción',
      label: 'Requerimientos técnicos del rider revisados',
      hint: 'Marca los puntos del rider que el recinto ya cubre',
      required: false,
      done: (e.sound?.riderChecklist || []).length > 0
    },

    // --- Boletaje ---
    // El punto de "el mapa de butacas cuadra con los lugares a la venta"
    // desapareció de esta lista y no se le extraña: era la consecuencia de tener
    // dos fuentes de verdad. Con el croquis como única fuente, no hay nada que
    // pueda dejar de cuadrar.
    {
      id: 'croquis',
      group: 'Boletaje',
      label: 'Croquis del evento dibujado',
      hint: 'Dibuja el plano del recinto con sus áreas: es lo que define qué se vende',
      required: true,
      done: plans.length > 0 && plans.every(p => p.areas.length > 0)
    },
    {
      id: 'croquis_escenario',
      group: 'Boletaje',
      label: 'Escenario marcado en cada croquis',
      hint: 'Sin escenario el cliente no sabe hacia dónde mira el lugar que compra',
      required: true,
      done: plans.length > 0 && plans.every(p => planStages(p).length > 0)
    },
    {
      id: 'boletos',
      group: 'Boletaje',
      label: 'Categorías de boleto con precio',
      hint: 'Cada categoría necesita su precio de venta',
      required: true,
      done: tiers.length > 0 && tiers.every(t => (t.price || 0) > 0)
    },
    {
      id: 'areas_categoria',
      group: 'Boletaje',
      label: 'Cada área del croquis ligada a una categoría',
      hint: 'Un área sin categoría no tiene precio ni color: no se puede vender',
      required: true,
      done: areas.length > 0 && areas.every(a => !!a.tierId && tierIds.has(a.tierId))
    },
    {
      id: 'boletos_lugares',
      group: 'Boletaje',
      label: 'Cada categoría con lugares en el croquis',
      hint: 'Asigna la categoría a un área del plano; si no, no puede vender nada',
      required: true,
      done: tiers.length > 0 && tiers.every(t => (croquisPorTier.get(t.id || '')?.capacity || 0) > 0)
    },
    {
      id: 'aforo',
      group: 'Boletaje',
      label: 'El boletaje cabe en el aforo del recinto',
      hint: 'Los lugares dibujados no pueden superar el aforo declarado del recinto',
      required: true,
      done: croquisCapacity(e) > 0 && (!e.capacity || croquisCapacity(e) <= e.capacity)
    },
    {
      id: 'descripcion_boletos',
      group: 'Boletaje',
      label: 'Descripción de cada categoría de boleto',
      hint: 'Qué incluye cada zona; el cliente decide su compra con este texto',
      required: true,
      done: tiers.length > 0 && tiers.every(t => (t.description || '').trim().length >= 15)
    }
  ];

  const items: CompletenessItem[] = rawItems.map(i => {
    const owners = i.owners?.length ? i.owners : [organizer];
    // Un punto cumplido no le debe nada a nadie; uno pendiente que no se mide
    // grupo por grupo se lo debe entero al organizador.
    const pendingOwners = i.done ? [] : (i.pendingOwners ?? owners);
    return { ...i, owners, pendingOwners };
  });

  const doneCount = items.filter(i => i.done).length;
  const missingRequired = items.filter(i => i.required && !i.done);
  const missingOptional = items.filter(i => !i.required && !i.done);

  // Un mismo punto puede depender de varios managers (cada grupo con su dueño),
  // así que aparece en el bloque de cada uno de ellos.
  const byOwner = new Map<string, CompletenessItem[]>();
  for (const item of missingRequired) {
    for (const owner of item.pendingOwners) {
      byOwner.set(owner, [...(byOwner.get(owner) ?? []), item]);
    }
  }

  // El organizador siempre va primero: son los pendientes sobre los que puede
  // actuar ahora mismo, y por eso son los que debe leer antes que nada.
  const pendingByOwner: PendingOwnerGroup[] = [...byOwner.entries()]
    .map(([owner, list]) => ({ owner, isOrganizer: owner === organizer, items: list }))
    .sort((a, b) => Number(b.isOrganizer) - Number(a.isOrganizer) || a.owner.localeCompare(b.owner));

  return {
    items,
    doneCount,
    totalCount: items.length,
    percent: items.length ? Math.round((doneCount / items.length) * 100) : 0,
    missingRequired,
    missingOptional,
    canSubmitForReview: missingRequired.length === 0,
    organizer,
    pendingByOwner,
    allPendingAreOwn: pendingByOwner.every(g => g.isOrganizer)
  };
}

/** Avance de captura del borrador, en porcentaje. */
export function completenessPercent(e: EventItem): number {
  return eventCompleteness(e).percent;
}

/** True cuando el borrador ya tiene todo lo obligatorio para irse a revisión. */
export function canSubmitForReview(e: EventItem): boolean {
  return eventCompleteness(e).canSubmitForReview;
}

/** Puntos por grupo temático, para pintar el checklist agrupado. */
export function completenessByGroup(e: EventItem): { group: CompletenessGroup; items: CompletenessItem[]; done: number }[] {
  const report = eventCompleteness(e);
  const groups: CompletenessGroup[] = ['Identidad', 'Cartelera Pública', 'Cartel', 'Producción', 'Boletaje'];
  return groups.map(group => {
    const items = report.items.filter(i => i.group === group);
    return { group, items, done: items.filter(i => i.done).length };
  });
}
