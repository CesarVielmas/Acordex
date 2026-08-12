import {
  CroquisArea,
  CroquisElement,
  CroquisElementKind,
  CroquisPlan,
  PLAN_HEIGHT,
  PLAN_WIDTH,
  ROW_GAP,
  SEAT_GAP
} from '../../../core/models/croquis.models';
import { boxPoints, buildRows, croquisId, defaultGridOptions, fanPoints } from './croquis-geometry';

/**
 * Catálogo del editor: qué elementos se pueden poner en un plano, con qué se
 * pintan, y de qué plantillas se puede partir.
 *
 * Las plantillas son la diferencia entre un editor que se usa y uno que se
 * abandona. Dibujar un auditorio desde cero son veinte minutos y varias
 * decisiones (¿dónde va el escenario? ¿cuántas filas caben?); partir de un
 * "Auditorio / Teatro" y correr dos áreas son dos minutos. Nadie arma un croquis
 * desde el lienzo en blanco si puede evitarlo.
 */

// ─── Elementos de referencia ──────────────────────────────────────────────────

export interface CroquisElementMeta {
  kind: CroquisElementKind;
  label: string;
  icon: string;
  color: string;
  /** Tamaño con el que nace el elemento, en unidades de croquis. */
  width: number;
  height: number;
  /** Qué es y para qué sirve, en el selector de elementos. */
  hint: string;
}

export const CROQUIS_ELEMENTS: CroquisElementMeta[] = [
  {
    kind: 'escenario',
    label: 'Escenario',
    icon: 'theater_comedy',
    color: '#f2ca50',
    width: 460,
    height: 90,
    hint: 'Orienta todo el croquis. Sin él nadie sabe si compra de frente o de espaldas.'
  },
  {
    kind: 'pantalla',
    label: 'Pantalla',
    icon: 'tv',
    color: '#38bdf8',
    width: 180,
    height: 34,
    hint: 'Pantalla LED o de proyección; justifica el precio de las zonas lejanas.'
  },
  {
    kind: 'bocina',
    label: 'Bocina',
    icon: 'speaker',
    color: '#a78bfa',
    width: 48,
    height: 70,
    hint: 'Torres de sonido. Marcarlas evita vender butacas pegadas a un clúster.'
  },
  {
    kind: 'consola',
    label: 'Consola de audio',
    icon: 'equalizer',
    color: '#a78bfa',
    width: 130,
    height: 80,
    hint: 'Front of house. Ocupa lugares reales que no se pueden vender.'
  },
  {
    kind: 'plataforma',
    label: 'Plataforma',
    icon: 'deck',
    color: '#fb923c',
    width: 180,
    height: 90,
    hint: 'Tarima elevada, pasarela o zona de prensa.'
  },
  {
    kind: 'barra',
    label: 'Barra',
    icon: 'local_bar',
    color: '#f472b6',
    width: 160,
    height: 46,
    hint: 'Barra de bebidas.'
  },
  {
    kind: 'alimentos',
    label: 'Alimentos',
    icon: 'restaurant',
    color: '#fbbf24',
    width: 150,
    height: 56,
    hint: 'Puestos de comida.'
  },
  {
    kind: 'sanitarios',
    label: 'Sanitarios',
    icon: 'wc',
    color: '#34d399',
    width: 110,
    height: 60,
    hint: 'Baños. El público los busca en el croquis más de lo que uno cree.'
  },
  {
    kind: 'acceso',
    label: 'Acceso',
    icon: 'login',
    color: '#22d3ee',
    width: 90,
    height: 34,
    hint: 'Puerta de entrada. Se liga a la nota de acceso de cada área.'
  },
  {
    kind: 'salida',
    label: 'Salida de emergencia',
    icon: 'logout',
    color: '#f87171',
    width: 90,
    height: 34,
    hint: 'Salida de emergencia; suele ser obligatoria en el plano de Protección Civil.'
  },
  {
    kind: 'escaleras',
    label: 'Escaleras',
    icon: 'stairs',
    color: '#94a3b8',
    width: 80,
    height: 80,
    hint: 'Escaleras o rampas entre niveles.'
  },
  {
    kind: 'camerinos',
    label: 'Camerinos',
    icon: 'checkroom',
    color: '#94a3b8',
    width: 150,
    height: 90,
    hint: 'Backstage. No se vende, pero ocupa metros del recinto.'
  },
  {
    kind: 'texto',
    label: 'Texto libre',
    icon: 'text_fields',
    color: '#d0c5af',
    width: 160,
    height: 34,
    hint: 'Una nota suelta sobre el plano.'
  }
];

const ELEMENT_INDEX = new Map(CROQUIS_ELEMENTS.map(m => [m.kind, m]));

export function elementMeta(kind: CroquisElementKind): CroquisElementMeta {
  return ELEMENT_INDEX.get(kind) || CROQUIS_ELEMENTS[CROQUIS_ELEMENTS.length - 1];
}

export function makeElement(kind: CroquisElementKind, x: number, y: number): CroquisElement {
  const meta = elementMeta(kind);
  return {
    id: croquisId('el'),
    kind,
    label: meta.label,
    x: Math.round(x - meta.width / 2),
    y: Math.round(y - meta.height / 2),
    width: meta.width,
    height: meta.height,
    rotation: 0
  };
}

// ─── Paleta de categorías ─────────────────────────────────────────────────────

/**
 * Colores con los que se pintan las categorías de boleto.
 *
 * El orden importa: están puestos saltando de tono en tono para que las dos
 * primeras categorías —las que casi siempre existen— caigan en extremos
 * opuestos del círculo cromático. Un croquis donde el VIP y el preferente son
 * dos dorados parecidos no comunica nada: el cliente ve una mancha del mismo
 * color y el que edita cree que el editor no le hizo caso al cambiar de
 * categoría, porque en pantalla no pasó nada.
 */
export const TIER_PALETTE = [
  '#f2ca50', // dorado de la marca
  '#38bdf8', // cian
  '#f472b6', // rosa
  '#4ade80', // verde
  '#fb923c', // naranja
  '#a78bfa', // violeta
  '#22d3ee', // turquesa
  '#f87171', // rojo
  '#c084fc', // lila
  '#facc15', // ámbar
  '#2dd4bf', // jade
  '#e879f9'  // magenta
];

/** Siguiente color libre, para que dos categorías no nazcan del mismo tono. */
export function nextTierColor(used: string[]): string {
  const usados = used.map(c => (c || '').toLowerCase()).filter(Boolean);
  return (
    TIER_PALETTE.find(c => usados.every(u => !colorsAreClose(c, u))) ||
    TIER_PALETTE.find(c => !usados.includes(c.toLowerCase())) ||
    TIER_PALETTE[0]
  );
}

/** Íconos con los que el portal anuncia cada categoría de boleto. */
export const TIER_ICONS: { value: string; label: string }[] = [
  { value: 'workspace_premium', label: 'Premium / VIP' },
  { value: 'star', label: 'Preferente' },
  { value: 'groups', label: 'General de pie' },
  { value: 'event_seat', label: 'Grada numerada' },
  { value: 'chair', label: 'Mesa' },
  { value: 'accessible', label: 'Accesible' },
  { value: 'family_restroom', label: 'Familiar' },
  { value: 'confirmation_number', label: 'Genérico' }
];

function channels(hex: string): [number, number, number] {
  const clean = (hex || '').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const n = parseInt(full.slice(0, 6) || '000000', 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * ¿Estos dos colores se confunden en el croquis?
 *
 * Se mide con una distancia RGB ponderada por cómo percibe el ojo cada canal
 * (más peso al verde, menos al azul). No es ciencia de color exacta, pero acierta
 * en lo único que importa aquí: decidir si dos cuadritos de 16 píxeles se ven
 * del mismo color a un metro de la pantalla.
 */
export function colorsAreClose(a: string, b: string): boolean {
  const [r1, g1, b1] = channels(a);
  const [r2, g2, b2] = channels(b);
  const d = Math.sqrt(
    2 * Math.pow(r1 - r2, 2) + 4 * Math.pow(g1 - g2, 2) + 3 * Math.pow(b1 - b2, 2)
  );
  return d < 120;
}

// ─── Fábricas de áreas ────────────────────────────────────────────────────────

export function makeGeneralArea(name: string, x: number, y: number, width: number, height: number, capacity = 0): CroquisArea {
  return {
    id: croquisId('ar'),
    name,
    kind: 'general',
    shape: 'rect',
    x, y, width, height,
    rotation: 0,
    points: boxPoints(),
    capacity,
    soldCount: 0,
    rows: []
  };
}

/**
 * Área con butacas ya generadas.
 *
 * Nace llena a propósito: un área de butacas vacía obliga a abrir el asistente
 * antes de ver nada, y lo que la gente quiere al dibujar un rectángulo es ver
 * butacas. Ajustar filas o numeración viene después, sobre algo que ya se ve.
 */
export function makeSeatedArea(
  name: string,
  x: number, y: number, width: number, height: number,
  rows: number, seatsPerRow: number,
  options: Partial<ReturnType<typeof defaultGridOptions>> = {}
): CroquisArea {
  const area: CroquisArea = {
    id: croquisId('ar'),
    name,
    kind: 'butacas',
    shape: 'rect',
    x, y, width, height,
    rotation: 0,
    points: boxPoints(),
    rows: [],
    curve: options.curve ?? 0
  };

  area.rows = buildRows(area, { ...defaultGridOptions(), ...options, rows, seatsPerRow }, area.id);
  return area;
}

// ─── Plantillas de plano ──────────────────────────────────────────────────────

export interface CroquisTemplate {
  id: string;
  name: string;
  icon: string;
  /** Para qué recinto sirve; se lee antes de elegir. */
  description: string;
  /** Aforo aproximado que arma la plantilla, para orientar la elección. */
  hint: string;
  build: (name: string) => CroquisPlan;
}

function plan(name: string, areas: CroquisArea[], elements: CroquisElement[], description: string): CroquisPlan {
  return {
    id: croquisId('plan'),
    name,
    description,
    width: PLAN_WIDTH,
    height: PLAN_HEIGHT,
    areas,
    elements
  };
}

function stage(label: string, x: number, y: number, width = 460, height = 90): CroquisElement {
  return { id: croquisId('el'), kind: 'escenario', label, x, y, width, height, rotation: 0 };
}

export const CROQUIS_TEMPLATES: CroquisTemplate[] = [
  {
    id: 'blanco',
    name: 'Lienzo en blanco',
    icon: 'draw',
    description: 'Sin nada dibujado. Para recintos que no se parecen a ninguna plantilla.',
    hint: 'Empiezas por el escenario',
    build: name => plan(name, [], [], '')
  },
  {
    id: 'teatro',
    name: 'Auditorio / Teatro',
    icon: 'theater_comedy',
    description: 'Escenario al frente, luneta curva numerada y dos bloques laterales.',
    hint: '≈ 700 butacas numeradas',
    build: name => {
      const luneta = makeSeatedArea('Luneta Central', 330, 220, 540, 380, 16, 24, { curve: 0.55, numbering: 'impares-pares' });
      luneta.shape = 'polygon';
      luneta.points = fanPoints(0.1);

      const izq = makeSeatedArea('Lateral Izquierda', 90, 250, 210, 300, 12, 9, { curve: 0.2, startLabel: 'A' });
      const der = makeSeatedArea('Lateral Derecha', 900, 250, 210, 300, 12, 9, { curve: 0.2, startLabel: 'A' });
      const balcon = makeSeatedArea('Balcón', 330, 640, 540, 130, 5, 24, { curve: 0.3, startLabel: 'AA' });

      return plan(
        name,
        [luneta, izq, der, balcon],
        [
          stage('Escenario Principal', 370, 70, 460, 100),
          { id: croquisId('el'), kind: 'pantalla', label: 'Pantalla LED', x: 470, y: 30, width: 260, height: 30, rotation: 0 },
          { id: croquisId('el'), kind: 'bocina', label: 'PA Izq.', x: 300, y: 80, width: 44, height: 80, rotation: 0 },
          { id: croquisId('el'), kind: 'bocina', label: 'PA Der.', x: 856, y: 80, width: 44, height: 80, rotation: 0 },
          { id: croquisId('el'), kind: 'consola', label: 'Consola', x: 535, y: 655, width: 130, height: 80, rotation: 0 },
          { id: croquisId('el'), kind: 'acceso', label: 'Acceso A', x: 60, y: 600, width: 90, height: 34, rotation: 0 },
          { id: croquisId('el'), kind: 'acceso', label: 'Acceso B', x: 1050, y: 600, width: 90, height: 34, rotation: 0 }
        ],
        'Butacas numeradas con vista frontal al escenario.'
      );
    }
  },
  {
    id: 'palenque',
    name: 'Palenque / Arena',
    icon: 'stadium',
    description: 'Escenario al centro con ruedo numerado y graderías generales alrededor.',
    hint: '≈ 400 numeradas + graderías',
    build: name => {
      const ruedo = makeSeatedArea('Ruedo VIP', 420, 300, 360, 230, 8, 16, { curve: 0.35 });
      const norte = makeGeneralArea('Gradería Norte', 300, 110, 600, 140, 1800);
      const sur = makeGeneralArea('Gradería Sur', 300, 580, 600, 140, 1800);
      const este = makeGeneralArea('Gradería Oriente', 900, 260, 150, 300, 900);
      const oeste = makeGeneralArea('Gradería Poniente', 150, 260, 150, 300, 900);

      return plan(
        name,
        [ruedo, norte, sur, este, oeste],
        [
          stage('Escenario Central', 480, 370, 240, 90),
          { id: croquisId('el'), kind: 'bocina', label: 'PA N', x: 576, y: 300, width: 48, height: 40, rotation: 0 },
          { id: croquisId('el'), kind: 'bocina', label: 'PA S', x: 576, y: 490, width: 48, height: 40, rotation: 0 },
          { id: croquisId('el'), kind: 'acceso', label: 'Puerta 1', x: 60, y: 390, width: 80, height: 34, rotation: 0 },
          { id: croquisId('el'), kind: 'acceso', label: 'Puerta 2', x: 1060, y: 390, width: 80, height: 34, rotation: 0 },
          { id: croquisId('el'), kind: 'sanitarios', label: 'Sanitarios', x: 60, y: 700, width: 110, height: 60, rotation: 0 },
          { id: croquisId('el'), kind: 'barra', label: 'Barra', x: 1000, y: 700, width: 140, height: 46, rotation: 0 }
        ],
        'Escenario al centro; el ruedo se vende numerado y las graderías por aforo.'
      );
    }
  },
  {
    id: 'explanada',
    name: 'Explanada / Festival',
    icon: 'festival',
    description: 'Escenario al frente, pista general de pie y zona VIP acordonada.',
    hint: 'Aforo libre por zonas',
    build: name => {
      const vip = makeGeneralArea('Zona VIP', 340, 230, 520, 170, 800);
      const general = makeGeneralArea('General de Pie', 200, 420, 800, 250, 5000);
      const palcos = makeSeatedArea('Palcos', 200, 700, 800, 80, 3, 34, { startLabel: 'P' });

      return plan(
        name,
        [vip, general, palcos],
        [
          stage('Escenario Principal', 300, 60, 600, 120),
          { id: croquisId('el'), kind: 'pantalla', label: 'Pantalla Izq.', x: 180, y: 90, width: 100, height: 60, rotation: 0 },
          { id: croquisId('el'), kind: 'pantalla', label: 'Pantalla Der.', x: 920, y: 90, width: 100, height: 60, rotation: 0 },
          { id: croquisId('el'), kind: 'bocina', label: 'Line array Izq.', x: 250, y: 190, width: 44, height: 70, rotation: 0 },
          { id: croquisId('el'), kind: 'bocina', label: 'Line array Der.', x: 906, y: 190, width: 44, height: 70, rotation: 0 },
          { id: croquisId('el'), kind: 'consola', label: 'FOH', x: 535, y: 610, width: 130, height: 80, rotation: 0 },
          { id: croquisId('el'), kind: 'alimentos', label: 'Zona de alimentos', x: 40, y: 430, width: 140, height: 120, rotation: 0 },
          { id: croquisId('el'), kind: 'barra', label: 'Barra', x: 1020, y: 430, width: 140, height: 60, rotation: 0 },
          { id: croquisId('el'), kind: 'sanitarios', label: 'Sanitarios', x: 1020, y: 560, width: 120, height: 70, rotation: 0 },
          { id: croquisId('el'), kind: 'acceso', label: 'Acceso general', x: 540, y: 748, width: 120, height: 36, rotation: 0 }
        ],
        'Aforo libre: se vende por zona, sin lugar asignado.'
      );
    }
  },
  {
    id: 'salon',
    name: 'Salón con mesas',
    icon: 'table_restaurant',
    description: 'Mesas redondas numeradas frente a una pista de baile.',
    hint: '≈ 30 mesas de 10',
    build: name => {
      const mesas = makeSeatedArea('Mesas', 180, 380, 840, 340, 6, 15, { labeling: 'numeros', startLabel: '1', gap: SEAT_GAP + 34, rowGap: ROW_GAP + 32 });
      mesas.name = 'Mesas';
      const pista = makeGeneralArea('Pista de Baile', 380, 220, 440, 130, 200);

      return plan(
        name,
        [mesas, pista],
        [
          stage('Templete', 400, 70, 400, 90),
          { id: croquisId('el'), kind: 'bocina', label: 'PA Izq.', x: 350, y: 80, width: 40, height: 70, rotation: 0 },
          { id: croquisId('el'), kind: 'bocina', label: 'PA Der.', x: 810, y: 80, width: 40, height: 70, rotation: 0 },
          { id: croquisId('el'), kind: 'barra', label: 'Barra', x: 60, y: 220, width: 130, height: 46, rotation: 0 },
          { id: croquisId('el'), kind: 'alimentos', label: 'Buffet', x: 1010, y: 220, width: 130, height: 56, rotation: 0 },
          { id: croquisId('el'), kind: 'acceso', label: 'Entrada', x: 545, y: 742, width: 110, height: 34, rotation: 0 }
        ],
        'Cada lugar es una silla de mesa; la mesa es la fila.'
      );
    }
  }
];

export function templateById(id: string): CroquisTemplate {
  return CROQUIS_TEMPLATES.find(t => t.id === id) || CROQUIS_TEMPLATES[0];
}
