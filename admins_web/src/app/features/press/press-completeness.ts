import {
  buildCompletenessReport,
  CompletenessDraft,
  CompletenessGroup,
  CompletenessItem,
  CompletenessReport
} from '../../core/models/completeness.models';
import { EventLineupSlot } from '../../core/models/event.models';
import { PressEventItem } from '../../core/models/press.models';
import {
  pressLineup,
  pressOrganizer,
  pressPublicProfile,
  pressRequests,
  pressZones
} from './press-metrics';

/**
 * Qué le falta a una firma o rueda de prensa para poder convocarse.
 *
 * Misma regla que en Eventos: el punto se cierra cuando el dato aparece
 * capturado, no cuando alguien dice que ya lo hizo. No hay botón de "listo"
 * porque no hay forma de distinguir un dato capturado de alguien afirmando que
 * lo capturó.
 *
 * Cada punto obligatorio corresponde a algo que el cliente ve en
 * `/events/firma-prensa?id=…` o a algo sin lo cual el evento no se puede operar.
 * Si un dato no se ve ahí y no hace falta para operar, no es obligatorio: llenar
 * el expediente de requisitos decorativos es la forma más rápida de que el
 * checklist deje de significar nada.
 *
 * **El checklist cambia según el tipo.** Una firma de autógrafos vive del control
 * de fila y de las reglas para los fans; una rueda de prensa vive del templete,
 * del sonido para las preguntas, del vocero y del kit. Exigir lo de una en la
 * otra deja pendientes que nadie va a cumplir porque no aplican, y un pendiente
 * que no aplica enseña a ignorar los pendientes.
 */

export const PRESS_COMPLETENESS_GROUPS: CompletenessGroup[] = [
  'Identidad',
  'Ficha Pública',
  'Acreditación',
  'Producción',
  'Talento'
];

export function pressCompleteness(e: PressEventItem): CompletenessReport {
  const organizer = pressOrganizer(e);
  const publico = pressPublicProfile(e);
  const slots = pressLineup(e);
  const zonas = pressZones(e);
  const acred = e.accreditation;
  const gasto = e.productionItems || [];
  const compromisos = e.talentCommitments || [];

  const esFirma = e.pressType === 'Firma de Autógrafos';
  const esRueda = e.pressType === 'Rueda de Prensa';

  /** Si hay algo presupuestado en alguno de estos rubros. */
  const gastoEn = (rubros: string[]) =>
    gasto.some(p => rubros.includes(p.category) && (p.amount || 0) > 0);

  /** El compromiso de un grupo, o uno vacío si todavía no se ha capturado. */
  const compromiso = (s: EventLineupSlot) => compromisos.find(c => c.slotId === s.id);
  const sinLlegada = slots.filter(s => !compromiso(s)?.arrivalTime?.trim());
  const sinVocero = slots.filter(s => !compromiso(s)?.spokespersonName?.trim());
  const sinDuracion = slots.filter(s => !(compromiso(s)?.committedMinutes || 0));

  /**
   * Un punto que se mide grupo por grupo lo responde el dueño de cada grupo.
   * El compromiso de un grupo ajeno lo pacta su disquera, no la que organiza.
   */
  const porGrupo = (pendientes: EventLineupSlot[]) => ({
    owners: slots.length ? [...new Set(slots.map(profileOwner))] : [organizer],
    pendingOwners: [...new Set(pendientes.map(profileOwner))]
  });

  /** La ficha pública de un grupo vive en el expediente de su dueño. */
  const profileOwner = (s: EventLineupSlot) => (s.isExternal ? s.managerName : organizer);
  const sinFichaPublica = slots.filter(s =>
    !s.imageUrl?.trim() || !s.genre?.trim() || !s.profileSlug?.trim() || !(s.rating ?? 0));

  const drafts: CompletenessDraft[] = [
    // ─── Identidad ──────────────────────────────────────────────────────────
    {
      id: 'identidad_prensa',
      group: 'Identidad',
      label: 'Nombre, fecha, recinto y ciudad',
      hint: 'Captura título, fecha, recinto y ciudad del evento',
      required: true,
      done: !!e.title?.trim() && !!e.date && !!e.venue?.trim() && !!e.location?.trim()
    },
    {
      id: 'tipo_prensa',
      group: 'Identidad',
      label: 'Tipo de evento: firma o rueda de prensa',
      hint: 'Decide de qué se trata: cambia lo que hay que montar y lo que hay que exigir',
      required: true,
      done: e.pressType === 'Firma de Autógrafos' || e.pressType === 'Rueda de Prensa'
    },
    {
      id: 'hora_prensa',
      group: 'Identidad',
      label: 'Hora de inicio',
      hint: 'Sin hora, el portal muestra "Hora pendiente" en la portada del evento',
      required: true,
      done: !!e.startTime?.trim()
    },
    {
      id: 'direccion_prensa',
      group: 'Identidad',
      label: 'Dirección exacta del recinto',
      hint: 'La dirección completa para el público, los medios y la producción',
      required: true,
      done: !!e.venueAddress?.trim()
    },
    {
      id: 'grupo_prensa',
      group: 'Identidad',
      label: 'Grupo o grupos que se presentan',
      hint: 'Agrega al menos un grupo: es lo que el portal enlaza a su ficha',
      required: true,
      done: slots.length > 0
    },
    {
      id: 'flyer_prensa',
      group: 'Identidad',
      label: 'Imagen de la tarjeta interna',
      hint: 'La imagen con la que el evento se reconoce dentro del panel',
      required: false,
      done: !!e.flyerUrl?.trim()
    },

    // ─── Ficha pública ──────────────────────────────────────────────────────
    // Todo lo que el portal muestra en /events/firma-prensa. Sin esto el evento
    // se convoca con huecos visibles para los medios y para los fans.
    {
      id: 'foto_oficial',
      group: 'Ficha Pública',
      label: 'Fotografía oficial del evento',
      hint: 'La imagen que encabeza la ficha pública del evento',
      required: true,
      done: !!publico.coverUrl?.trim()
    },
    {
      id: 'descripcion_prensa',
      group: 'Ficha Pública',
      label: 'Descripción del evento',
      hint: 'El texto de "Acerca de la firma & rueda de prensa" que lee el público',
      required: true,
      done: (publico.about || '').trim().length >= 80
    },
    {
      id: 'mapa_prensa',
      group: 'Ficha Pública',
      label: 'Ubicación con mapa',
      hint: 'El texto con el que se busca el recinto en el mapa que incrusta el portal',
      required: true,
      done: !!(publico.mapsQuery?.trim() || e.venueAddress?.trim())
    },
    {
      id: 'soporte_prensa',
      group: 'Ficha Pública',
      label: 'Teléfono y WhatsApp de dudas',
      hint: 'El portal ofrece llamar y escribir por WhatsApp: sin número, los dos botones no llevan a nada',
      required: true,
      done: !!publico.supportPhone?.trim() && !!publico.supportWhatsApp?.trim()
    },
    {
      id: 'reglas_fans',
      group: 'Ficha Pública',
      label: 'Reglas de acceso para fans',
      hint: esFirma
        ? 'Qué se firma, qué se puede llevar y cómo se forma la fila: sin esto la fila se vuelve un problema el día del evento'
        : 'Lineamientos de acceso que el portal lista al pie de la ficha',
      // En una firma la fila es el evento: sin reglas publicadas, la gente llega
      // con cinco discos y esperando selfies. En una rueda no hay fans formados.
      required: esFirma,
      done: (publico.rules || []).length >= 3
    },
    {
      id: 'galeria_prensa',
      group: 'Ficha Pública',
      label: 'Galería de fotografías',
      hint: 'Fotografías adicionales del evento o del grupo para la ficha pública',
      required: false,
      done: (e.evidenceMedia || []).filter(m => m.type === 'photo').length >= 2
    },
    {
      id: 'videos_prensa',
      group: 'Ficha Pública',
      label: 'Video de invitación del grupo',
      hint: 'El portal muestra los saludos de los artistas invitando al evento',
      required: false,
      done: (publico.greetingVideos || []).length > 0,
      owners: slots.length ? [...new Set(slots.map(profileOwner))] : [organizer]
    },
    {
      id: 'grupos_publico_prensa',
      group: 'Ficha Pública',
      label: 'Ficha pública de cada grupo (foto, género, rating y perfil)',
      hint: 'Es lo que el cliente ve en "Artistas en el Evento" y lo que enlaza a /grupo/:slug',
      required: true,
      done: slots.length > 0 && sinFichaPublica.length === 0,
      owners: slots.length ? [...new Set(slots.map(profileOwner))] : [organizer],
      pendingOwners: [...new Set(sinFichaPublica.map(profileOwner))]
    },

    // ─── Acreditación ───────────────────────────────────────────────────────
    {
      id: 'ventana_registro',
      group: 'Acreditación',
      label: 'Apertura y cierre del registro',
      hint: 'Sin cierre no hay momento en el que dejar de recibir solicitudes, y siguen llegando la mañana del evento',
      required: true,
      done: !!acred?.opensAt && !!acred?.closesAt
    },
    {
      id: 'cupo',
      group: 'Acreditación',
      label: 'Cupo de acreditados',
      hint: 'Sin cupo definido no se sabe cuándo dejar de aprobar solicitudes',
      required: true,
      done: (acred?.capacity || 0) > 0
    },
    {
      id: 'zonas',
      group: 'Acreditación',
      label: 'Zonas disponibles y qué da cada una',
      hint: 'Es lo que se imprime en el gafete: sin zonas, todos entran a todo',
      required: true,
      done: zonas.length > 0 && zonas.every(z => !!z.name?.trim())
    },
    {
      id: 'kit_prensa',
      group: 'Acreditación',
      label: 'Kit de prensa',
      hint: esRueda
        ? 'Boletín, fotografías en alta y datos del disco: es lo que el medio necesita para publicar la nota'
        : 'Material de apoyo para los medios que cubran la firma',
      // La rueda de prensa existe para que se publique una nota. Sin kit, cada
      // medio la escribe con lo que alcanzó a oír.
      required: esRueda,
      done: !!acred?.pressKitUrl?.trim()
    },

    // ─── Producción ─────────────────────────────────────────────────────────
    // Se mide contra el **desglose de gasto**, no contra campos sueltos. Antes
    // los mismos conceptos —el sonido, el templete, la seguridad— se capturaban
    // dos veces: una como «datos del montaje» y otra como partida, y ninguna de
    // las dos versiones era la buena. Un evento de prensa no genera ingreso: todo
    // lo que se monta es gasto, así que el gasto es el único sitio donde vive.
    {
      id: 'presupuesto',
      group: 'Producción',
      label: 'Presupuesto desglosado',
      hint: 'Captura en qué se va el dinero, partida por partida: es el único número del expediente',
      required: true,
      done: gasto.length > 0 && gasto.some(p => (p.amount || 0) > 0)
    },
    {
      id: 'sede_montaje',
      group: 'Producción',
      label: esFirma ? 'Mesa de firmas presupuestada' : 'Templete presupuestado',
      hint: esFirma
        ? 'Mesa, sillas y el paso de la fila: da de alta las partidas de Mobiliario o Escenario'
        : 'Templete, presídium y backdrop: da de alta las partidas de Escenario o Mobiliario',
      required: true,
      done: gastoEn(['Escenario y Estructuras', 'Mobiliario'])
    },
    {
      id: 'sonido_prensa',
      group: 'Producción',
      label: 'Audio presupuestado',
      hint: esRueda
        ? 'Sin audio, las preguntas de la sala no se oyen en los videos que publiquen los medios'
        : 'Equipo de sonido del evento',
      required: esRueda,
      done: gastoEn(['Audio'])
    },
    {
      id: 'control_fila',
      group: 'Producción',
      label: 'Personal presupuestado',
      hint: esFirma
        ? 'Quién cuida la fila: en una firma es lo que evita que se desborde. Da de alta las partidas de Personal y Staff'
        : 'Personal que ordena el acceso de los medios a la sala',
      required: esFirma,
      done: gastoEn(['Personal y Staff'])
    },
    {
      id: 'seguridad_prensa',
      group: 'Producción',
      label: 'Seguridad presupuestada',
      hint: 'Quién responde por la seguridad del grupo y del recinto',
      required: true,
      done: gastoEn(['Seguridad'])
    },
    {
      id: 'gasto_cerrado',
      group: 'Producción',
      label: 'Presupuesto cerrado con proveedores',
      hint: 'Un presupuesto con todo en «Estimado» es un cálculo de cabeza: cotiza y contrata',
      required: false,
      done: gasto.length > 0 && gasto.every(p => p.status === 'Contratado' || p.status === 'Pagado')
    },

    // ─── Talento ────────────────────────────────────────────────────────────
    // Cada punto se mide **grupo por grupo**: a una rueda vienen dos o tres y
    // cada uno llega a su hora y manda a su propio vocero.
    {
      id: 'llegada_grupo',
      group: 'Talento',
      label: 'Hora de llegada de cada grupo',
      hint: 'A qué hora debe estar cada grupo en el recinto, antes de que entren los medios',
      required: true,
      done: slots.length > 0 && sinLlegada.length === 0,
      ...porGrupo(sinLlegada)
    },
    {
      id: 'vocero',
      group: 'Talento',
      label: 'Vocero designado de cada grupo',
      hint: esRueda
        ? 'Quién habla por cada grupo. Sin vocero contesta quien se anime, y así se generan las notas que nadie quería'
        : 'Quién atiende a los medios por cada grupo durante la firma',
      required: esRueda,
      done: slots.length > 0 && sinVocero.length === 0,
      ...porGrupo(sinVocero)
    },
    {
      id: 'duracion_prensa',
      group: 'Talento',
      label: 'Duración comprometida por grupo',
      hint: 'Cuántos minutos da cada grupo: es lo que se le promete a los medios y a los fans',
      required: true,
      done: slots.length > 0 && sinDuracion.length === 0,
      ...porGrupo(sinDuracion)
    },
    {
      id: 'temas_vetados',
      group: 'Talento',
      label: 'Temas vetados ("no preguntar por")',
      hint: esRueda
        ? 'Lo que cada grupo no va a contestar. Se le comunica a los medios acreditados antes de empezar'
        : 'Temas que los grupos prefieren no tocar durante la firma',
      required: esRueda,
      done: slots.length > 0 && compromisos.some(c => (c.bannedTopics || []).length > 0)
    }
  ];

  return buildCompletenessReport(drafts, organizer);
}

/** Avance de captura del expediente, en porcentaje. */
export function pressCompletenessPercent(e: PressEventItem): number {
  return pressCompleteness(e).percent;
}

/**
 * Si el evento ya se puede convocar.
 *
 * Son dos condiciones y las dos son irreversibles hacia el público: convocar
 * abre el registro y publica la ficha. No basta con tener el expediente completo
 * —una solicitud sin contestar al abrir al público es un medio que lleva
 * semanas esperando y que va a ver cómo se acreditan otros delante de él—.
 */
export interface PressConvokeCheck {
  can: boolean;
  missingRequired: CompletenessItem[];
  pendingRequests: number;
  reason?: string;
}

export function canConvoke(e: PressEventItem): PressConvokeCheck {
  const report = pressCompleteness(e);
  const pendientes = pressRequests(e).filter(r => r.status === 'pending').length;
  const faltan = report.missingRequired;

  if (faltan.length && pendientes) {
    return {
      can: false, missingRequired: faltan, pendingRequests: pendientes,
      reason: `Faltan ${faltan.length} punto(s) obligatorio(s) y hay ${pendientes} solicitud(es) sin contestar.`
    };
  }
  if (faltan.length) {
    return {
      can: false, missingRequired: faltan, pendingRequests: 0,
      reason: `Faltan ${faltan.length} punto(s) obligatorio(s) del expediente.`
    };
  }
  if (pendientes) {
    return {
      can: false, missingRequired: [], pendingRequests: pendientes,
      reason: `Hay ${pendientes} solicitud(es) de acreditación sin contestar.`
    };
  }
  return { can: true, missingRequired: [], pendingRequests: 0 };
}

/** Puntos por grupo temático, para pintar el checklist agrupado. */
export function pressCompletenessByGroup(
  e: PressEventItem
): { group: CompletenessGroup; items: CompletenessItem[]; done: number }[] {
  const report = pressCompleteness(e);
  return PRESS_COMPLETENESS_GROUPS.map(group => {
    const items = report.items.filter(i => i.group === group);
    return { group, items, done: items.filter(i => i.done).length };
  });
}

/**
 * Cómo llama el formulario del expediente de prensa a cada punto del checklist.
 *
 * Se declara aquí y se enchufa en el mapa único de `event-tasks` en vez de
 * escribirse allá: las secciones del expediente de prensa las conoce Prensa, y
 * el archivo que resuelve las tareas no tiene por qué saber qué es un backdrop.
 * Lo que sí sigue habiendo es **un solo mapa en tiempo de ejecución**, que es la
 * regla que importa: en cuanto cada pestaña tuvo su propia lista de alias, dos de
 * ellas se desviaron y el tag salía en blanco sin que nadie lo notara.
 */
export const PRESS_FIELD_TO_CHECKLIST: Record<string, string[]> = {
  // La caja de identidad responde por todo lo suyo.
  identidad_prensa: ['identidad_prensa', 'tipo_prensa', 'hora_prensa', 'direccion_prensa', 'flyer_prensa'],

  // Ficha pública.
  foto_oficial: ['foto_oficial'],
  descripcion_prensa: ['descripcion_prensa'],
  mapa_prensa: ['mapa_prensa'],
  soporte_prensa: ['soporte_prensa'],
  reglas_fans: ['reglas_fans'],
  galeria_prensa: ['galeria_prensa'],
  videos_prensa: ['videos_prensa'],

  // Grupos: la tarjeta del grupo cubre su alta y su ficha pública.
  grupos_prensa: ['grupo_prensa', 'grupos_publico_prensa'],

  // Acreditación: la ventana, el cupo y las zonas se capturan en el mismo bloque.
  acreditacion: ['ventana_registro', 'cupo', 'zonas', 'kit_prensa'],

  // Producción: todo cuelga del desglose de gasto.
  gasto: ['presupuesto', 'sede_montaje', 'sonido_prensa', 'control_fila', 'seguridad_prensa', 'gasto_cerrado'],

  // Talento, grupo por grupo.
  talento: ['llegada_grupo', 'vocero', 'duracion_prensa', 'temas_vetados']
};
