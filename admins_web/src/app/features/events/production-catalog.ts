import { ProductionCategory } from '../../core/models/event.models';

/**
 * Qué se contrata de verdad para montar un evento musical.
 *
 * Este catálogo es la parte del módulo que más se consulta sin darse cuenta: un
 * manager que abre el desglose en blanco no recuerda que hay que pagar
 * protección civil, la ambulancia y la planta de luz hasta que alguien se los
 * pone enfrente. Por eso cada rubro trae sus partidas típicas — no son un
 * ejemplo decorativo, son la lista con la que se arma un presupuesto real de
 * baile, palenque o concierto en México.
 *
 * El orden no es alfabético sino el del montaje: primero dónde se hace el
 * evento, luego lo que se instala, luego quién lo opera, y al final lo que se
 * gasta alrededor. Leído de arriba abajo es el recorrido de una producción.
 */
export interface ProductionCategoryMeta {
  key: ProductionCategory;
  icon: string;
  /** Qué entra en este rubro, en una línea. */
  meaning: string;
  /** Partidas típicas, para capturar de un clic en vez de escribirlas. */
  examples: string[];
  /** Unidad con la que se suele contratar. */
  defaultUnit: string;
  textColor: string;
  badgeClass: string;
  /** Color del segmento en la barra de reparto del gasto. */
  barClass: string;
}

export const PRODUCTION_CATEGORIES: readonly ProductionCategoryMeta[] = [
  {
    key: 'Recinto',
    icon: 'stadium',
    meaning: 'Lo que cobra el inmueble por dejarte hacer el evento ahí',
    examples: [
      'Renta del recinto',
      'Depósito en garantía',
      'Horas extra fuera del horario contratado',
      'Uso de camerinos',
      'Consumo de energía del recinto',
      'Estacionamiento'
    ],
    defaultUnit: 'servicio',
    textColor: 'text-amber-300',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    barClass: 'bg-amber-500'
  },
  {
    key: 'Audio',
    icon: 'speaker',
    meaning: 'Sistema de sonido, consolas, microfonía e ingenieros',
    examples: [
      'Sistema principal (line array)',
      'Monitores de piso',
      'Sistema in-ear (IEM)',
      'Consola de sala (FOH)',
      'Consola de monitores',
      'Paquete de microfonía',
      'Ingeniero de audio',
      'Cableado y multipar'
    ],
    defaultUnit: 'servicio',
    textColor: 'text-violet-300',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    barClass: 'bg-violet-500'
  },
  {
    key: 'Iluminación',
    icon: 'lightbulb',
    meaning: 'Luces del escenario, consola y quien las opera',
    examples: [
      'Luces robóticas (móviles)',
      'Luces convencionales (par LED)',
      'Consola de iluminación',
      'Seguidores (follow spot)',
      'Operador de iluminación',
      'Máquina de humo',
      'Dimmers y distribución'
    ],
    defaultUnit: 'servicio',
    textColor: 'text-yellow-300',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    barClass: 'bg-yellow-500'
  },
  {
    key: 'Video y Pantallas',
    icon: 'tv',
    meaning: 'Pantallas LED, cámaras y contenido en vivo',
    examples: [
      'Pantalla LED principal',
      'Pantallas laterales',
      'Cámaras y switcher',
      'Operador de video / VJ',
      'Contenido y cortinillas',
      'Grabación del show'
    ],
    defaultUnit: 'servicio',
    textColor: 'text-cyan-300',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    barClass: 'bg-cyan-500'
  },
  {
    key: 'Escenario y Estructuras',
    icon: 'foundation',
    meaning: 'El escenario, el techo y todo lo que se arma en fierro',
    examples: [
      'Escenario modular',
      'Techo / roof',
      'Truss y torres',
      'Torres de delay',
      'Barricadas frontales',
      'Faldón y escaleras',
      'Vallas perimetrales',
      'Dictamen estructural'
    ],
    defaultUnit: 'servicio',
    textColor: 'text-slate-300',
    badgeClass: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
    barClass: 'bg-slate-400'
  },
  {
    key: 'Energía',
    icon: 'bolt',
    meaning: 'De dónde sale la luz y qué pasa si se va',
    examples: [
      'Planta de luz / generador',
      'Planta de respaldo',
      'Combustible (diésel)',
      'Distribución eléctrica',
      'Electricista de guardia',
      'Dictamen eléctrico'
    ],
    defaultUnit: 'jornada',
    textColor: 'text-orange-300',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    barClass: 'bg-orange-500'
  },
  {
    key: 'Backline',
    icon: 'piano',
    meaning: 'Instrumentos y equipo que se comparte entre los grupos',
    examples: [
      'Batería completa',
      'Amplificadores de guitarra y bajo',
      'Teclado y stand',
      'Tarimas (risers)',
      'Atriles y bancos',
      'Técnico de backline'
    ],
    defaultUnit: 'servicio',
    textColor: 'text-rose-300',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    barClass: 'bg-rose-500'
  },
  {
    key: 'Mobiliario',
    icon: 'table_restaurant',
    meaning: 'Mesas, sillas y las zonas donde se sienta la gente',
    examples: [
      'Mesas redondas',
      'Sillas',
      'Manteles y cubresillas',
      'Salas lounge VIP',
      'Carpas y sombrillas',
      'Barras de servicio',
      'Maniobra de montaje de mobiliario'
    ],
    defaultUnit: 'pieza',
    textColor: 'text-teal-300',
    badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    barClass: 'bg-teal-500'
  },
  {
    key: 'Personal y Staff',
    icon: 'engineering',
    meaning: 'La gente que monta, opera y atiende el evento',
    examples: [
      'Cargadores / stagehands',
      'Coordinador de producción',
      'Acomodadores',
      'Personal de taquilla',
      'Checadores de boleto',
      'Runners',
      'Desmontaje'
    ],
    defaultUnit: 'persona',
    textColor: 'text-blue-300',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    barClass: 'bg-blue-500'
  },
  {
    key: 'Seguridad',
    icon: 'security',
    meaning: 'Control de accesos, cacheo y resguardo',
    examples: [
      'Seguridad privada',
      'Personal de cacheo',
      'Control de accesos',
      'Custodia de valores / traslado de efectivo',
      'Seguridad de camerinos',
      'Detectores de metales'
    ],
    defaultUnit: 'persona',
    textColor: 'text-red-300',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
    barClass: 'bg-red-500'
  },
  {
    key: 'Servicios Médicos',
    icon: 'medical_services',
    meaning: 'Atención médica en sitio; casi siempre la exige el permiso',
    examples: [
      'Ambulancia con paramédicos',
      'Puesto de primeros auxilios',
      'Médico responsable',
      'Insumos de curación'
    ],
    defaultUnit: 'servicio',
    textColor: 'text-pink-300',
    badgeClass: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    barClass: 'bg-pink-500'
  },
  {
    key: 'Permisos y Licencias',
    icon: 'gavel',
    meaning: 'Lo que hay que pagarle a la autoridad para poder abrir',
    examples: [
      'Permiso municipal del evento',
      'Visto bueno de Protección Civil',
      'Licencia de alcoholes',
      'Uso de suelo',
      'Derechos de autor (SACM)',
      'Permiso de espectáculos públicos',
      'Impuesto sobre espectáculos'
    ],
    defaultUnit: 'trámite',
    textColor: 'text-lime-300',
    badgeClass: 'bg-lime-500/15 text-lime-300 border-lime-500/30',
    barClass: 'bg-lime-500'
  },
  {
    key: 'Seguros',
    icon: 'verified_user',
    meaning: 'Lo que cubre si algo sale mal',
    examples: [
      'Responsabilidad civil',
      'Seguro del evento',
      'Seguro del equipo rentado',
      'Fianza del recinto'
    ],
    defaultUnit: 'póliza',
    textColor: 'text-emerald-300',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    barClass: 'bg-emerald-500'
  },
  {
    key: 'Limpieza y Sanitarios',
    icon: 'cleaning_services',
    meaning: 'Baños, basura y dejar el recinto como estaba',
    examples: [
      'Sanitarios portátiles',
      'Sanitario para personas con discapacidad',
      'Limpieza durante el evento',
      'Limpieza final',
      'Contenedores y retiro de basura'
    ],
    defaultUnit: 'servicio',
    textColor: 'text-green-300',
    badgeClass: 'bg-green-500/15 text-green-300 border-green-500/30',
    barClass: 'bg-green-500'
  },
  {
    key: 'Transporte y Logística',
    icon: 'local_shipping',
    meaning: 'Mover el equipo y a la gente hasta el recinto',
    examples: [
      'Flete de equipo',
      'Camionetas para staff',
      'Traslado de artistas',
      'Casetas y combustible',
      'Montacargas / maniobras',
      'Bodegaje'
    ],
    defaultUnit: 'viaje',
    textColor: 'text-indigo-300',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    barClass: 'bg-indigo-500'
  },
  {
    key: 'Hospitalidad',
    icon: 'restaurant',
    meaning: 'Comida y bebida de camerinos y del staff',
    examples: [
      'Catering de camerinos',
      'Alimentos del staff',
      'Bebidas y hieleras',
      'Rider de alimentos del artista',
      'Montaje de camerinos'
    ],
    defaultUnit: 'servicio',
    textColor: 'text-fuchsia-300',
    badgeClass: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    barClass: 'bg-fuchsia-500'
  },
  {
    key: 'Hospedaje',
    icon: 'hotel',
    meaning: 'Dónde duermen artistas y crew',
    examples: [
      'Hotel de artistas',
      'Hotel del crew técnico',
      'Habitaciones de producción',
      'Noches extra por montaje'
    ],
    defaultUnit: 'noche',
    textColor: 'text-sky-300',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    barClass: 'bg-sky-500'
  },
  {
    key: 'Publicidad',
    icon: 'campaign',
    meaning: 'Lo que se gasta para que la gente se entere',
    examples: [
      'Spots de radio',
      'Pauta en redes sociales',
      'Lonas y espectaculares',
      'Impresos y volantes',
      'Perifoneo',
      'Fotografía y video promocional',
      'Rueda de prensa'
    ],
    defaultUnit: 'campaña',
    textColor: 'text-purple-300',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    barClass: 'bg-purple-500'
  },
  {
    key: 'Boletaje',
    icon: 'confirmation_number',
    meaning: 'Lo que cuesta vender y controlar la entrada',
    examples: [
      'Impresión de boletos',
      'Pulseras de acceso',
      'Comisión de plataforma de venta',
      'Terminales de cobro',
      'Lectores de QR',
      'Personal de taquilla externa'
    ],
    defaultUnit: 'servicio',
    textColor: 'text-cyan-200',
    badgeClass: 'bg-cyan-400/15 text-cyan-200 border-cyan-400/30',
    barClass: 'bg-cyan-300'
  },
  {
    key: 'Otros',
    icon: 'more_horiz',
    meaning: 'Lo que no cabe en ningún rubro y el margen para imprevistos',
    examples: [
      'Fondo para imprevistos',
      'Radios de comunicación',
      'Papelería y credenciales',
      'Viáticos de producción',
      'Propinas y gratificaciones'
    ],
    defaultUnit: 'servicio',
    textColor: 'text-outline',
    badgeClass: 'bg-surface-container-highest text-outline border-outline-variant/40',
    barClass: 'bg-outline'
  }
];

const BY_KEY = new Map<ProductionCategory, ProductionCategoryMeta>(
  PRODUCTION_CATEGORIES.map(c => [c.key, c])
);

export function productionCategoryMeta(key: ProductionCategory): ProductionCategoryMeta {
  return BY_KEY.get(key) ?? PRODUCTION_CATEGORIES[PRODUCTION_CATEGORIES.length - 1];
}

export const PRODUCTION_CATEGORY_KEYS: readonly ProductionCategory[] =
  PRODUCTION_CATEGORIES.map(c => c.key);
