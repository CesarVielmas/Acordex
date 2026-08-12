/**
 * El croquis del evento, tal como lo publica el panel.
 *
 * Trae la geometría completa —dónde está cada zona, cómo se curvan sus filas,
 * dónde quedó el escenario— porque el comprador tiene que ver el mismo plano que
 * el organizador dibujó. Una lista de zonas apiladas sería más fácil de pintar y
 * sería otro recinto: el que compra la fila A del lateral izquierdo necesita
 * saber que está en el lateral izquierdo.
 */

/** Estado de un lugar de cara al comprador. Sin estado, está libre. */
export type CroquisSeatState = 'vendido' | 'apartado' | 'bloqueado';

export interface CroquisPoint {
  x: number;
  y: number;
}

export interface CroquisSeat {
  /** Número impreso en el boleto. */
  number: number;
  /**
   * Posición en la rejilla de la fila —o alrededor de la mesa. No es el índice
   * del arreglo: los huecos entre `slot`s son los pasillos reales del recinto.
   */
  slot: number;
  /**
   * Corrimiento respecto del lugar que le tocaba en la rejilla.
   *
   * El organizador puede sacar lugares del renglón —un anillo alrededor de la
   * pista, un par de butacas metidas en un rincón— y el comprador tiene que
   * verlos donde de verdad están. Sin esto, el mapa enderezaría el recinto y
   * mandaría a alguien a una butaca que no existe donde la buscó.
   */
  dx?: number;
  dy?: number;
  state?: CroquisSeatState;
  /** Categoría distinta a la del área, para lugares sueltos. */
  tierId?: string;
  accessible?: boolean;
}

/** Redonda es la mesa de banquete; rectangular, la imperial. */
export type CroquisTableShape = 'redonda' | 'rectangular';

/**
 * Cómo se renta la mesa.
 *
 * `completa` se lleva la mesa entera y nadie más se sienta con el grupo.
 * `sillas` deja comprar lugares sueltos, con el mínimo que puso el organizador.
 */
export type CroquisTableRental = 'completa' | 'sillas';

/** Una mesa con sus sillas alrededor. */
export interface CroquisTable {
  id: string;
  /** Nombre impreso en el boleto: 'Mesa 1'. */
  label: string;
  /** Centro de la mesa, relativo a la esquina superior izquierda de la zona. */
  x: number;
  y: number;
  shape: CroquisTableShape;
  /** Diámetro si es redonda; ancho si es rectangular. */
  width: number;
  height: number;
  rotation: number;
  /** Posiciones de silla alrededor; de ahí sale el ángulo de cada una. */
  slots: number;
  seats: CroquisSeat[];
  rental: CroquisTableRental;
  /** Mínimo de lugares que hay que llevarse cuando se venden sueltos. */
  minSeats?: number;
  tierId?: string;
  /** Precio de la mesa completa; sin él se cobra lugar por lugar. */
  price?: number;
  /** Apartada o fuera de la venta. */
  state?: 'reservada' | 'bloqueada';
}

export interface CroquisRow {
  id: string;
  /** Letra o nombre de la fila: 'A', 'AA', 'Mesa 3'. */
  label: string;
  /** Origen de la fila, relativo a la esquina superior izquierda del área. */
  x: number;
  y: number;
  /** Giro de la fila en grados. */
  angle: number;
  /** Separación entre centros de butaca. */
  gap: number;
  seats: CroquisSeat[];
}

/**
 * Una zona del recinto.
 *
 * `numbered` decide cómo se compra: con butacas el cliente elige su lugar; sin
 * ellas es entrada libre y solo hay un aforo. Son dos experiencias distintas y
 * por eso el dato viaja explícito.
 */
export interface CroquisArea {
  id: string;
  name: string;
  numbered: boolean;
  tierId: string;

  /** Caja de la zona sobre el lienzo del plano. */
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  /** Vértices en 0..1 sobre la caja, cuando la zona no es un rectángulo. */
  points?: CroquisPoint[];
  /** Curvatura de las filas hacia el escenario, 0 a 1. */
  curve?: number;

  /** Aforo de las zonas de entrada libre. */
  capacity?: number;
  sold?: number;
  /** Nota que ve el comprador: 'Entrada por puerta 3'. */
  accessNote?: string;

  rows: CroquisRow[];
  /** Mesas de la zona; vacío en las que no las tienen. */
  tables?: CroquisTable[];
}

/** Referencia del recinto: escenario, pantallas, barras, accesos, sanitarios. */
export interface CroquisElement {
  kind: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  /** Ícono y color con los que se dibuja; los define el panel. */
  icon: string;
  color: string;
}

export interface CroquisTier {
  id: string;
  name: string;
  price: number;
  color: string;
  /** Qué incluye; el portal lo muestra bajo el precio. */
  description?: string;
}

/**
 * Un croquis por zona física del evento.
 *
 * Un festival con tres escenarios simultáneos trae tres, y el comprador cambia
 * entre ellos: cada uno con su propio boletaje y su propia butaquería.
 */
export interface CroquisPlan {
  id: string;
  name: string;
  description?: string;
  /** Lienzo en unidades de croquis; el visor escala a lo que haya. */
  width: number;
  height: number;
  areas: CroquisArea[];
  elements: CroquisElement[];
}

export interface EventCroquis {
  tiers: CroquisTier[];
  plans: CroquisPlan[];
  /** Cargo que la taquilla suma a cada boleto. */
  serviceFee: number;
}

/** Lado de la butaca en unidades de croquis. */
export const SEAT_SIZE = 16;
/** Hueco entre el borde de la mesa y el centro de la silla. */
export const TABLE_SEAT_OFFSET = 13;
