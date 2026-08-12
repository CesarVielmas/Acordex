/**
 * Croquis del evento: el plano que se dibuja aquí y que el cliente ve al comprar.
 *
 * El modelo viejo describía el recinto con puros números —capacidad, filas,
 * butacas por fila— y eso deja fuera lo único que de verdad importa cuando
 * alguien compra: *dónde* queda su lugar. Con números sueltos no se puede pintar
 * un croquis, no se sabe si el VIP está pegado al escenario o hasta atrás, y
 * hacen falta validaciones ("filas × butacas debe dar el total") que solo existen
 * porque hay dos fuentes de verdad peleándose.
 *
 * Aquí el croquis *es* la fuente de verdad. Los lugares a la venta de cada
 * categoría de boleto no se capturan: se cuentan del plano. Lo que se dibuja es
 * lo que se vende.
 *
 * Tres niveles, de afuera hacia adentro:
 *
 *   1. `CroquisPlan`  — un plano por área física del evento. Un festival con tres
 *      escenarios simultáneos lleva tres planos, cada uno con su propio lienzo y
 *      su propio boletaje. El cliente los cambia con un selector.
 *   2. `CroquisArea`  — una región del plano. O tiene butacas numeradas, o mesas
 *      con sillas alrededor, o es de aforo libre (una pista, una explanada,
 *      gradas generales).
 *   3. `CroquisSeat`  — el lugar. Existe solo si está dibujado; quitarlo del
 *      croquis es literalmente quitarlo de la venta. Da igual que cuelgue de una
 *      fila de butacas o de una mesa: es el mismo lugar vendible.
 *
 * Los elementos (`CroquisElement`) no se venden: son las referencias que hacen
 * legible el plano —escenario, pantallas, bocinas, barras, accesos— y sin ellas
 * un croquis es una cuadrícula de cuadritos sin orientación.
 */

// ─── Categoría de boleto ──────────────────────────────────────────────────────

/**
 * Lo que el croquis necesita saber de una categoría de boleto.
 *
 * Es un subconjunto del `TicketTier` del panel a propósito. El croquis lo dibuja
 * y el portal lo vende: para eso bastan el nombre, el precio, el color y qué
 * incluye. Todo lo demás del expediente —cuántos van vendidos, cuándo abre la
 * venta, a qué zona vieja apuntaba— no le hace falta a ninguno de los dos, y
 * arrastrarlo hasta aquí ataría el portal del cliente al modelo interno del
 * panel.
 */
export interface CroquisTier {
  id?: string;
  name: string;
  price: number;
  color: string;
  icon?: string;
  description?: string;
}

// ─── Sistema de coordenadas ───────────────────────────────────────────────────

/**
 * Todo se guarda en "unidades de croquis", no en píxeles: el visor escala el
 * lienzo a lo que le den (una miniatura de 200px o un editor de 1400px) y el
 * plano se ve igual. Sin esto, un croquis capturado en una pantalla grande se
 * rompería al abrirlo en otra.
 */
export interface CroquisPoint {
  x: number;
  y: number;
}

// ─── Butacas ──────────────────────────────────────────────────────────────────

/** Estado de venta de una butaca. Sin estado = disponible. */
export type CroquisSeatStatus = 'vendido' | 'apartado' | 'bloqueado';

export interface CroquisSeat {
  /** Número impreso en el boleto: '1', '12', '12A'. */
  number: string;
  /**
   * Posición dentro de la rejilla de la fila —o alrededor de la mesa, cuando la
   * butaca es una silla. No es el índice del arreglo: los huecos entre `slot`s
   * son pasillos reales del recinto. Quitar la butaca 8 de una fila de 20 deja
   * el pasillo dibujado, no recorre las butacas 9 a 20.
   */
  slot: number;
  /**
   * Corrimiento respecto del lugar que le tocaba en la rejilla, en unidades de
   * croquis y en coordenadas del área sin girar.
   *
   * La rejilla resuelve el 95% de los recintos y por eso sigue siendo la base:
   * mover una fila de sesenta lugares son dos números. Pero un recinto real
   * tiene butacas que no caen en ninguna rejilla —un anillo alrededor de la
   * pista, un par de lugares metidos en un rincón, la fila que se recorre para
   * esquivar una columna— y sin esto habría que partir el área en pedazos hasta
   * que cada pedazo volviera a ser una rejilla. El corrimiento se guarda aparte
   * del origen de la fila justamente para que re-espaciar o re-numerar el área
   * no se lo lleve por delante.
   */
  dx?: number;
  dy?: number;
  status?: CroquisSeatStatus;
  /**
   * Categoría distinta a la del área. Sirve para butacas sueltas —la primera
   * fila de la luneta vendida como VIP, un par de lugares de cortesía— sin tener
   * que partir el área en dos.
   */
  tierId?: string;
  /** Butaca adaptada para silla de ruedas; el portal la marca aparte. */
  accessible?: boolean;
}

/**
 * Una fila de butacas dentro de un área.
 *
 * La posición de cada butaca se calcula (origen de la fila + slot × separación),
 * no se guarda. Así mover o re-espaciar una fila de 60 lugares es cambiar dos
 * números en vez de reescribir 60 coordenadas.
 */
export interface CroquisRow {
  id: string;
  /** Letra o nombre de la fila tal como va en el boleto: 'A', 'AA', 'Mesa 3'. */
  label: string;
  /** Origen de la fila, relativo a la esquina superior izquierda del área. */
  x: number;
  y: number;
  /** Giro de la fila en grados. 0 = horizontal, de izquierda a derecha. */
  angle: number;
  /** Separación entre centros de butaca. */
  gap: number;
  seats: CroquisSeat[];
}

// ─── Mesas ────────────────────────────────────────────────────────────────────

/** Redonda es la mesa de banquete de siempre; rectangular, la imperial o la de junta. */
export type CroquisTableShape = 'redonda' | 'rectangular';

/**
 * Cómo se renta la mesa.
 *
 * `completa` es la venta clásica de banquete: la mesa se aparta entera y no se
 * sientan extraños con el grupo, cueste lo que cueste dejar sillas vacías.
 * `sillas` deja que cada quien compre los lugares que necesita —lo normal en una
 * cena de gala con boletos individuales—, con el mínimo que ponga el
 * organizador para que nadie ocupe una mesa de diez comprando un solo lugar.
 */
export type CroquisTableRental = 'completa' | 'sillas';

/** Estado de venta de la mesa completa. Sin estado = libre. */
export type CroquisTableStatus = 'reservada' | 'bloqueada';

/**
 * Una mesa con sus sillas alrededor.
 *
 * Es su propia entidad y no una fila disfrazada. Antes las mesas se dibujaban
 * como filas muy separadas —la plantilla de salón hacía exactamente eso— y el
 * resultado era una hilera de sillas en línea recta que ni se ve como una mesa
 * ni se vende como una: no hay nada que decir "estas diez sillas van juntas",
 * que es la única cosa que de verdad define una mesa a la hora de rentarla.
 *
 * Las sillas son `CroquisSeat` normales a propósito. Una silla de mesa se vende,
 * se aparta, se bloquea y se pinta de una categoría igual que una butaca de
 * luneta; inventarle un tipo aparte habría duplicado toda la maquinaria de
 * venta para no ganar nada.
 */
export interface CroquisTable {
  id: string;
  /** Nombre impreso en el boleto: 'Mesa 1', 'Mesa de honor'. */
  label: string;
  /** Centro de la mesa, relativo a la esquina superior izquierda del área. */
  x: number;
  y: number;
  shape: CroquisTableShape;
  /** Diámetro si es redonda; ancho si es rectangular. */
  width: number;
  /** Alto de la mesa rectangular. En la redonda no se usa. */
  height: number;
  /** Giro de la mesa en grados; arrastra a sus sillas. */
  rotation: number;

  /**
   * Posiciones de silla alrededor de la mesa.
   *
   * Es el máximo que cabe, no cuántas hay: las sillas se reparten sobre estas
   * posiciones y quitar una deja el hueco donde estaba, igual que el pasillo de
   * una fila. Sin esto, quitar una silla de una mesa de diez repartiría las
   * nueve restantes y la mesa entera giraría sola.
   */
  slots: number;
  seats: CroquisSeat[];

  rental: CroquisTableRental;
  /** Mínimo de sillas que hay que llevarse cuando se venden sueltas. */
  minSeats?: number;

  /** Categoría de la mesa; las sillas la heredan si no traen la suya. */
  tierId?: string;
  /**
   * Precio de la mesa completa. Sin esto se cobra silla por silla, que es lo
   * normal; se usa cuando la mesa vale un monto redondo que no es el precio de
   * la silla por el número de sillas —una mesa de patrocinador, por ejemplo.
   */
  price?: number;

  status?: CroquisTableStatus;
  /** A nombre de quién quedó apartada; lo ve el organizador, no el comprador. */
  holder?: string;
}

// ─── Áreas ────────────────────────────────────────────────────────────────────

/**
 * `butacas` obliga a elegir lugar y se cuenta butaca por butaca.
 * `mesas` es lo mismo pero agrupado: el lugar es una silla y la mesa es lo que
 * se renta.
 * `general` es entrada libre dentro del área: no hay nada que numerar, solo un
 * aforo. Una pista de pie o unas gradas generales son esto; forzarlas a tener
 * butacas numeradas sería inventar lugares que en el recinto no existen.
 */
export type CroquisAreaKind = 'butacas' | 'mesas' | 'general';

/** Rectángulo o polígono libre, para recintos que no son cajas. */
export type CroquisShape = 'rect' | 'polygon';

export interface CroquisArea {
  id: string;
  name: string;
  kind: CroquisAreaKind;
  shape: CroquisShape;

  /** Caja del área sobre el lienzo del plano. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Giro del área completa, en grados, alrededor de su centro. */
  rotation: number;

  /**
   * Vértices del polígono en coordenadas normalizadas (0..1) sobre la caja.
   * Normalizados a propósito: así redimensionar el área con el mouse deforma el
   * polígono junto con ella en vez de dejarlo desanclado.
   */
  points?: CroquisPoint[];

  /** Categoría de boleto que se vende en esta área. */
  tierId?: string;

  /** Aforo del área cuando es `general`; en las de butacas se cuenta el plano. */
  capacity?: number;
  /** Vendidos de un área general. Las butacas llevan su estado una por una. */
  soldCount?: number;

  rows: CroquisRow[];
  /** Mesas del área. Vacío en las áreas que no son de mesas. */
  tables?: CroquisTable[];

  /**
   * Cómo se numeró el área la última vez.
   *
   * Se guarda para poder volver a numerar después de mover lugares a mano sin
   * preguntar de nuevo el esquema: sin esto, reacomodar una zona de teatro la
   * dejaría numerada de izquierda a derecha y el boleto diría otra cosa que la
   * butaca.
   */
  numbering?: SeatNumbering;
  labeling?: RowLabeling;
  startLabel?: string;

  /**
   * Curvatura de las filas hacia el escenario, de 0 (rectas) a 1 (abanico).
   * Es lo que distingue un croquis de teatro de una hoja de Excel: en un recinto
   * real las filas abrazan el escenario.
   */
  curve?: number;

  /** Nota de acceso que ve el cliente: 'Entrada por puerta 3'. */
  accessNote?: string;
}

// ─── Elementos de referencia ──────────────────────────────────────────────────

/**
 * Lo que no se vende pero orienta al que mira el plano. El escenario es el más
 * importante con diferencia: sin él, el cliente no sabe si está comprando de
 * frente o de espaldas.
 */
export type CroquisElementKind =
  | 'escenario'
  | 'pantalla'
  | 'bocina'
  | 'consola'
  | 'plataforma'
  | 'barra'
  | 'alimentos'
  | 'sanitarios'
  | 'acceso'
  | 'salida'
  | 'escaleras'
  | 'camerinos'
  | 'texto';

export interface CroquisElement {
  id: string;
  kind: CroquisElementKind;
  /** Texto sobre el elemento: 'Escenario Principal', 'Puerta 3'. */
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  /**
   * Grupo del cartel que toca en este escenario. Es lo que permite que un
   * festival diga "aquí toca La Imperial y allá los Sierreños" sin capturarlo
   * dos veces: sale del cartel del evento.
   */
  lineupSlotId?: string;
  /** Color propio; si se omite, toma el del catálogo de su tipo. */
  color?: string;
}

// ─── Plano ────────────────────────────────────────────────────────────────────

/**
 * Un croquis completo: una zona física del evento con todo lo suyo.
 *
 * Un evento puede tener varios. Tres grupos tocando al mismo tiempo en tres
 * carpas distintas son tres planos, cada uno con su escenario, sus áreas y su
 * boletaje. Meterlos en un solo plano obligaría a dibujar el recinto entero a
 * escala y volvería ilegible lo único que el comprador quiere ver: dónde se
 * sienta en la carpa a la que va.
 */
export interface CroquisPlan {
  id: string;
  /** Nombre de la zona: 'Explanada Norte', 'Salón Principal', 'Carpa Sur'. */
  name: string;
  /** Qué es esta zona y qué pasa aquí; el cliente lo lee al cambiar de plano. */
  description?: string;

  /** Lienzo en unidades de croquis. El visor escala a lo que haya. */
  width: number;
  height: number;

  areas: CroquisArea[];
  elements: CroquisElement[];
}

// ─── Constantes de dibujo ─────────────────────────────────────────────────────

/** Lado de la butaca en unidades de croquis. */
export const SEAT_SIZE = 16;
/** Separación entre centros de butaca dentro de una fila. */
export const SEAT_GAP = 21;
/** Separación entre filas. */
export const ROW_GAP = 24;
/** Diámetro con el que nace una mesa redonda. */
export const TABLE_SIZE = 62;
/**
 * Hueco entre el borde de la mesa y el centro de la silla.
 *
 * Es lo que hace que la mesa se lea como una mesa: pegadas al canto las sillas
 * parecen un solo bulto, y muy separadas parecen un corro de gente de pie.
 */
export const TABLE_SEAT_OFFSET = 13;
/** Separación entre centros de mesa cuando el asistente las acomoda en rejilla. */
export const TABLE_GAP = 120;
/** Lienzo por defecto de un plano nuevo. */
export const PLAN_WIDTH = 1200;
export const PLAN_HEIGHT = 820;

/**
 * Tope de butacas por plano a partir del cual el editor avisa.
 *
 * No es un límite del modelo sino del navegador: cada butaca es un nodo en el
 * SVG y arriba de unos pocos miles la interacción se arrastra. En recintos así
 * de grandes lo correcto de todas formas es un área `general` con aforo —unas
 * gradas de 5,000 lugares casi nunca se venden numeradas.
 */
export const SEAT_WARN_THRESHOLD = 2500;

// ─── Esquemas de numeración ───────────────────────────────────────────────────

/**
 * Cómo se numeran las butacas dentro de cada fila.
 *
 * `impares-pares` es el estándar de los teatros: se numera desde el pasillo
 * central hacia afuera, nones a la izquierda y pares a la derecha. Se ve raro
 * en una hoja de cálculo y es exactamente lo que dice el boleto en la puerta.
 */
export type SeatNumbering = 'izquierda-derecha' | 'derecha-izquierda' | 'impares-pares' | 'corrida';

/** Cómo se etiquetan las filas: A, B, C… o 1, 2, 3… */
export type RowLabeling = 'letras' | 'numeros';

/** Parámetros del asistente que genera la butaquería de un área. */
export interface SeatGridOptions {
  rows: number;
  seatsPerRow: number;
  numbering: SeatNumbering;
  labeling: RowLabeling;
  /** Letra o número con el que arranca la primera fila. */
  startLabel?: string;
  /** Separación entre butacas y entre filas. */
  gap: number;
  rowGap: number;
  /** Curvatura hacia el escenario, 0..1. */
  curve: number;
  /**
   * Posiciones (1-based) donde se abre un pasillo vertical. Un pasillo no es
   * decoración: es la butaca que *no* existe, y por eso se modela quitando el
   * slot en vez de dibujando una línea encima.
   */
  aisles?: number[];
}

/**
 * Parámetros del asistente que acomoda las mesas de un área.
 *
 * Se acomodan en rejilla porque así se montan los salones —hileras de mesas con
 * su pasillo entre ellas—, y una vez puestas cada mesa se arrastra a donde toque
 * si el montaje real no es tan ordenado.
 */
export interface TableGridOptions {
  /** Hileras de mesas y mesas por hilera. */
  rows: number;
  perRow: number;
  /** Sillas alrededor de cada mesa. */
  seatsPerTable: number;
  shape: CroquisTableShape;
  /** Cómo se venden todas las mesas que genere el asistente. */
  rental: CroquisTableRental;
  /** Mínimo de sillas a comprar cuando se venden sueltas. */
  minSeats: number;
  /** Tamaño de la mesa: diámetro si es redonda, ancho y alto si no. */
  size: number;
  height: number;
  /** Separación entre centros de mesa. */
  gap: number;
  rowGap: number;
  /** Con qué número o letra arranca la primera mesa. */
  startLabel?: string;
  labeling: RowLabeling;
}
