/**
 * El vocabulario del checklist, compartido por todos los expedientes.
 *
 * Vive aquí y no dentro de `event-completeness` porque la maquinaria de tareas,
 * intervenciones y propuestas es la misma para un evento con boletaje que para
 * una firma de prensa: lo único que cambia son los puntos que se miden. Tenerlo
 * declarado dos veces —que es como estaba: una copia en `event.models` y otra en
 * `event-completeness`— garantizaba que tarde o temprano una de las dos se
 * quedara sin el grupo nuevo y las tareas de ese grupo salieran sin etiqueta.
 */

/**
 * Bloques temáticos del checklist. Los cinco primeros son de un evento con venta
 * de boletos; los siguientes son de una firma o rueda de prensa, donde no hay
 * boletaje pero sí acreditación de medios y compromiso del talento.
 */
export type CompletenessGroup =
  // Eventos con boletaje
  | 'Identidad'
  | 'Cartelera Pública'
  | 'Cartel'
  | 'Producción'
  | 'Boletaje'
  // Firmas y ruedas de prensa
  | 'Ficha Pública'
  | 'Acreditación'
  | 'Talento';

export interface CompletenessItem {
  id: string;
  group: CompletenessGroup;
  label: string;
  /** Qué hacer para cumplirlo, cuando no está cumplido. */
  hint: string;
  done: boolean;
  /** True si su ausencia impide que el expediente salga a la vista pública. */
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
  /** Quién arma el expediente; contra él se decide qué pendiente es "de alguien más". */
  organizer: string;
  /** Los obligatorios que faltan, repartidos por responsable. */
  pendingByOwner: PendingOwnerGroup[];
  /** True cuando todo lo que falta lo puede resolver el organizador solo. */
  allPendingAreOwn: boolean;
}

/**
 * Lo que declara un punto del checklist antes de que se le calculen los
 * responsables. Los `owners` se omiten en casi todos porque los resuelve el
 * organizador; solo se escriben donde de verdad dependen de otro manager.
 */
export type CompletenessDraft = Omit<CompletenessItem, 'owners' | 'pendingOwners'> & {
  owners?: string[];
  pendingOwners?: string[];
};

/**
 * Cierra un checklist: reparte responsables y cuenta lo que falta.
 *
 * Es idéntico en todos los expedientes —lo único propio de cada uno es la lista
 * de puntos— y estaba escrito dentro de `eventCompleteness`. Sacarlo evita que
 * Prensa naciera con su propia versión del reparto por responsable, que es
 * exactamente la clase de copia que después se desvía.
 */
export function buildCompletenessReport(
  drafts: CompletenessDraft[],
  organizer: string
): CompletenessReport {
  const items: CompletenessItem[] = drafts.map(i => {
    const owners = i.owners?.length ? i.owners : [organizer];
    // Un punto cumplido no le debe nada a nadie; uno pendiente que no se mide
    // pieza por pieza se lo debe entero al organizador.
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
