import { GroupItem } from '../../core/models/admin.models';
import {
  GroupProfile, GroupMember, RosterLogEntry, GroupPost, GroupReview, GroupEventRecord,
  Track, GalleryImage, HighlightVideo, GroupRepresentative, defaultSectionVisibility
} from './group-profile.model';

const PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'
];

const STAGE_PHOTOS = [
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800'
];

const SAMPLE_AUDIO_URLS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
];

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

const FIRST = ['Don Raúl', 'José Luis', 'Martín', 'Guillermo', 'Carlos', 'Alejandro', 'Gabriel', 'Ramiro', 'Esteban'];
const LAST = ['Treviño', 'Salazar', 'García', 'Villanueva', 'Cárdenas', 'Benavides', 'Montemayor', 'Pena'];

function buildMembers(groupId: string, seed: number): GroupMember[] {
  const isBanda = seed % 2 === 0;

  const roster: Array<{ role: string; inst?: string; isCrew?: boolean }> = isBanda
    ? [
        { role: 'Director Musical & Vocalista', inst: 'Voz Principal, Acordeón' },
        { role: 'Vocalista Secundario', inst: 'Voz Secundaria, Segunda Voz' },
        { role: 'Acordeonista Estelar', inst: 'Acordeón Diatónico' },
        { role: 'Baterista & Percusiones', inst: 'Batería, Tarolas' },
        { role: 'Bajista & Tololoche', inst: 'Bajo Eléctrico, Tololoche' },
        { role: 'Ingeniero de Sonido Principal', isCrew: true },
        { role: 'Coordinador de Logística & Gira', isCrew: true }
      ]
    : [
        { role: 'Vocalista Líder', inst: 'Voz Principal' },
        { role: 'Guitarrista Primera Voz', inst: 'Requinto, Guitarra Docerola' },
        { role: 'Bajista & Coros', inst: 'Bajo Eléctrico, Coros' },
        { role: 'Baterista', inst: 'Batería' },
        { role: 'Ingeniero de Sonido', isCrew: true },
        { role: 'Operador de Iluminación & Visuales', isCrew: true }
      ];

  return roster.map((item, i) => {
    const isMusician = !item.isCrew;
    const name = `${pick(FIRST, seed, i)} ${pick(LAST, seed, i + 1)}`;

    return {
      id: `${groupId}-m${i + 1}`,
      name,
      crewRole: isMusician ? 'Integrante' : 'Staff',
      role: item.role,
      instrument: item.inst,
      photoUrl: pick(PHOTOS, seed, i),
      coverPhotoUrl: pick(STAGE_PHOTOS, seed, i),
      age: 26 + ((seed + i * 3) % 22),
      hometown: pick(['Monterrey, N.L.', 'Guadalajara, Jal.', 'Culiacán, Sin.', 'Hermosillo, Son.', 'Saltillo, Coah.'], seed, i),
      quote: isMusician
        ? 'La música norteña no se toca sólo con los dedos, se toca con el alma y con el respeto al público.'
        : 'Mi trabajo es que la banda suene impecable en cualquier recinto del país.',
      bio: isMusician
        ? `${name} inició su carrera musical a los 14 años tocando en festivales regionales. Se incorporó al grupo en 2021 aportando versatilidad en los arreglos.`
        : `Responsable técnico con más de 8 años de experiencia en giras nacionales y recintos de gran aforo.`,
      fullBio: isMusician
        ? `${name} nació con vocación musical en una familia de ejecutantes. Estudió teoría musical básica antes de dedicarse por completo a las giras. En la agrupación coordina la presencia escénica y colabora en la selección del repertorio de estudio. Ha participado en más de 200 presentaciones en vivo y en la grabación de 3 producciones discográficas.`
        : `Con formación en ingeniería de audio y producción de espectáculos en vivo, supervisa el montaje técnico, las pruebas de sonido y el cumplimiento del rider en cada plaza donde se presenta el grupo.`,
      experienceYears: 4 + ((seed + i) % 15),
      status: 'Activo',
      joinedAt: `20${18 + (i % 6)}-0${(i % 9) + 1}-15`,
      monthlySalary: isMusician ? 45000 + (i * 5000) : 28000 + (i * 3000),
      galleryPhotos: [
        pick(STAGE_PHOTOS, seed, i),
        pick(PHOTOS, seed, i + 1),
        pick(STAGE_PHOTOS, seed, i + 2)
      ],
      videos: [
        { title: `Solo de ensayo — ${item.inst || item.role}`, thumbnailUrl: pick(STAGE_PHOTOS, seed, i), duration: '2:15' },
        { title: 'Prueba de sonido en vivo', thumbnailUrl: pick(STAGE_PHOTOS, seed, i + 1), duration: '4:30' }
      ],
      socials: {
        instagram: `https://instagram.com/${name.toLowerCase().replace(/[^a-z]/g, '')}`,
        facebook: `https://facebook.com/${name.toLowerCase().replace(/[^a-z]/g, '')}`,
        spotify: `https://open.spotify.com/artist/sample`
      }
    };
  });
}

function buildRosterLog(groupId: string, seed: number): RosterLogEntry[] {
  return [
    {
      id: `${groupId}-log1`,
      memberName: `${pick(FIRST, seed, 0)} ${pick(LAST, seed, 1)}`,
      role: 'Acordeonista',
      action: 'Alta',
      at: '2025-11-10 14:30',
      note: 'Ingreso oficial registrado en contrato.'
    },
    {
      id: `${groupId}-log2`,
      memberName: `${pick(FIRST, seed, 5)} ${pick(LAST, seed, 6)}`,
      role: 'Percusionista',
      action: 'Baja',
      at: '2025-08-01 09:00',
      note: 'Retiro voluntario por proyectos personales.'
    }
  ];
}

function buildPosts(groupId: string, group: GroupItem, seed: number): GroupPost[] {
  return [
    {
      id: `${groupId}-p1`,
      content: `¡Gracias Monterrey por una noche inolvidable! El lleno total en la Arena demuestra el cariño de nuestra gente. ¡Nos vemos muy pronto!`,
      imageUrl: pick(STAGE_PHOTOS, seed, 0),
      publishedAt: 'Hace 35 min',
      likes: 12400,
      shares: 890,
      visibility: 'Publicada',
      sentiment: 'Positivo',
      comments: [
        { id: 'c1', authorName: 'Carlos M.', avatarUrl: pick(PHOTOS, seed, 1), text: '¡Increíble espectáculo! Tocaron todas las favoritas.', at: 'Hace 20 min', sentiment: 'Positivo' },
        { id: 'c2', authorName: 'Ana Sofía R.', avatarUrl: pick(PHOTOS, seed, 2), text: 'El sonido estuvo impecable en las primeras filas.', at: 'Hace 10 min', sentiment: 'Positivo' }
      ]
    },
    {
      id: `${groupId}-p2`,
      content: 'Aviso importante a nuestro público de Saltillo: la fecha del 25 de agosto se reprograma por causas de fuerza mayor. Los boletos adquiridos serán válidos.',
      publishedAt: '2026-07-24 14:15',
      likes: 3100,
      shares: 1250,
      visibility: 'Publicada',
      sentiment: 'Neutro',
      comments: [
        { id: 'c3', authorName: 'Laura V.', avatarUrl: pick(PHOTOS, seed, 3), text: 'Ya había pedido el día en el trabajo, muy mala organización.', at: '2026-07-24 15:40', sentiment: 'Negativo' },
        { id: 'c4', authorName: 'Kevin M.', avatarUrl: pick(PHOTOS, seed, 4), text: '¿Habrá reembolso para los que no podamos la nueva fecha?', at: '2026-07-24 16:02', sentiment: 'Neutro' }
      ]
    },
    {
      id: `${groupId}-p3`,
      content: 'Adelanto del nuevo sencillo grabado en estudio. Sale el viernes en todas las plataformas.',
      imageUrl: pick(STAGE_PHOTOS, seed, 3),
      publishedAt: '2026-07-12 11:00',
      likes: 7300,
      shares: 480,
      visibility: 'Privada',
      sentiment: 'Neutro',
      comments: []
    }
  ];
}

function buildReviews(groupId: string, seed: number): GroupReview[] {
  const base = [
    { rating: 5, comment: 'Puntuales, profesionales y con un show impecable. Volveríamos a contratarlos sin dudar.', event: 'Noche de Gala Norteña 2026', venue: 'Arena Monterrey', attendees: 4250 },
    { rating: 5, comment: 'La gente no dejó de bailar. El sonido y la energía del grupo hicieron la noche.', event: 'Gran Palenque San Marcos', venue: 'Palenque de la Feria', attendees: 6800 },
    { rating: 4, comment: 'Muy buen espectáculo, aunque empezaron 20 minutos tarde por la prueba de sonido.', event: 'Festival Tumbado Zapopan', venue: 'Auditorio Telmex', attendees: 3200 },
    { rating: 3, comment: 'El grupo tocó bien pero el repertorio se sintió corto para lo que se pagó.', event: 'Feria Regional Saltillo', venue: 'Teatro del Pueblo', attendees: 1800 },
    { rating: 5, comment: 'Trato excelente con los organizadores y con el público. Muy recomendables.', event: 'Boda Villagómez', venue: 'Rancho Los Encinos', attendees: 400 }
  ];
  return base.map((r, i) => ({
    id: `${groupId}-rev${i}`,
    clientName: `${pick(FIRST, seed, i)} ${pick(LAST, seed, i + 2)}`,
    avatarUrl: pick(PHOTOS, seed, i),
    eventName: r.event,
    eventDate: `2026-0${(i % 8) + 1}-1${i % 9}`,
    venue: r.venue,
    rating: r.rating,
    comment: r.comment,
    attendees: r.attendees
  }));
}

function buildEvents(groupId: string, group: GroupItem): GroupEventRecord[] {
  return [
    {
      id: `${groupId}-evt1`,
      title: 'Noche de Gala Norteña 2026',
      type: 'Concierto',
      date: '2026-09-18',
      venue: 'Arena Monterrey',
      city: 'Monterrey, N.L.',
      status: 'Confirmado',
      attendance: 11500,
      capacity: 12000,
      revenue: group.artistFeeBase * 1.2,
      rating: 4.9
    },
    {
      id: `${groupId}-evt2`,
      title: 'Gran Palenque San Marcos',
      type: 'Concierto',
      date: '2026-09-28',
      venue: 'Palenque de la Feria',
      city: 'Aguascalientes, Ags.',
      status: 'Confirmado',
      attendance: 6800,
      capacity: 8000,
      revenue: group.artistFeeBase,
      rating: 5.0
    },
    {
      id: `${groupId}-evt3`,
      title: 'Firma de Autógrafos & Meet and Greet',
      type: 'Firma de Autógrafos',
      date: '2026-10-05',
      venue: 'Plaza Fiesta San Agustín',
      city: 'San Pedro, N.L.',
      status: 'Pendiente',
      attendance: 800,
      capacity: 1000
    },
    {
      id: `${groupId}-evt4`,
      title: 'Conferencia de Prensa Lanzamiento Disco',
      type: 'Rueda de Prensa',
      date: '2026-10-15',
      venue: 'Hotel Quinta Real',
      city: 'Guadalajara, Jal.',
      status: 'Pendiente'
    },
    {
      id: `${groupId}-evt5`,
      title: 'Festival Tumbado Zapopan',
      type: 'Concierto',
      date: '2026-10-22',
      venue: 'Auditorio Telmex',
      city: 'Zapopan, Jal.',
      status: 'Completado',
      attendance: 3200,
      capacity: 4500,
      revenue: group.artistFeeBase * 0.9,
      rating: 4.6
    }
  ];
}

function buildTracks(groupId: string, group: GroupItem, seed: number): Track[] {
  const titles = ['Camino de Terracería', 'La Última Carta', 'Ya No Me Esperes', 'Corrido del Amanecer', 'Noche de Feria', 'Prometí Volver', 'El Trato', 'Sombra en el Camino'];
  return titles.map((title, i) => ({
    id: `${groupId}-t${i}`,
    title,
    genre: i % 3 === 0 ? group.genre : pick(['Corridos Tumbados', 'Banda Sinaloense', 'Norteño Sax', 'Sierreño'], seed, i),
    durationLabel: `${2 + (i % 3)}:${10 + ((seed + i * 7) % 48)}`,
    releaseYear: `${2019 + (i % 7)}`,
    plays: `${1 + ((seed + i * 13) % 9)}.${(seed + i) % 9}M`,
    approval: 78 + ((seed + i * 5) % 21),
    isPopular: i < 3,
    audioUrl: SAMPLE_AUDIO_URLS[i % SAMPLE_AUDIO_URLS.length]
  }));
}

function buildGallery(seed: number): GalleryImage[] {
  const cats: GalleryImage['category'][] = ['En Vivo', 'Promocional', 'Backstage', 'Estudio'];
  return Array.from({ length: 8 }, (_, i) => ({
    url: pick([...STAGE_PHOTOS, ...PHOTOS], seed, i),
    caption: pick([
      'Arena Monterrey — lleno total',
      'Sesión promocional del nuevo disco',
      'Prueba de sonido antes del show',
      'Grabación en estudio',
      'Palenque de la Feria',
      'Backstage con el equipo'
    ], seed, i),
    category: cats[i % cats.length]
  }));
}

function buildVideos(seed: number): HighlightVideo[] {
  return [
    { title: 'En vivo desde Arena Monterrey', thumbnailUrl: pick(STAGE_PHOTOS, seed, 0), duration: '12:40', views: '2.4M' },
    { title: 'Videoclip oficial — La Última Carta', thumbnailUrl: pick(STAGE_PHOTOS, seed, 1), duration: '3:55', views: '8.1M' },
    { title: 'Detrás de cámaras del nuevo disco', thumbnailUrl: pick(STAGE_PHOTOS, seed, 2), duration: '7:22', views: '940K' },
    { title: 'Promocional gira 2026', thumbnailUrl: pick(STAGE_PHOTOS, seed, 3), duration: '1:08', views: '1.2M' }
  ];
}

function buildRepresentatives(groupId: string, group: GroupItem, seed: number): GroupRepresentative[] {
  const primary: GroupRepresentative = {
    id: `${groupId}-rep1`,
    labelName: group.disqueraName || 'Acordex Records',
    contactName: group.groupLeaderName,
    phone: group.groupLeaderPhone || '+52 81 1234 5678',
    email: group.groupLeaderEmail || 'booking@acordex.mx',
    isPrimary: true,
    serviceTier: 'Premium',
    quotedFee: group.artistFeeBase,
    notes: 'Disquera titular. Incluye producción, logística y respaldo contractual completo.'
  };

  const secondary: GroupRepresentative = {
    id: `${groupId}-rep2`,
    labelName: 'Representaciones Monterrey',
    contactName: 'Lic. Fernando Garza',
    phone: '+52 81 9876 5432',
    email: 'contacto@repmty.com',
    isPrimary: false,
    serviceTier: 'Estándar',
    quotedFee: Math.round(group.artistFeeBase * 1.08),
    notes: 'Agencia autorizada para la zona noreste del país.'
  };

  return [primary, secondary];
}

export function buildGroupProfile(group: GroupItem): GroupProfile {
  const seed = group.id.charCodeAt(group.id.length - 1) || 7;

  return {
    id: group.id,
    name: group.name,
    genre: group.genre,
    secondaryGenres: ['Norteño Sax', 'Corridos Tumbados', 'Cumbia Norteña'],
    foundedYear: 2018 + (seed % 5),
    originCity: 'Monterrey, N.L.',
    avatarUrl: group.image,
    coverUrl: pick(STAGE_PHOTOS, seed, 0),

    // Campos propios del perfil público (los derivables no se guardan aquí).
    verified: !group.pendingLabelContract,
    platformJoinedAt: `${2019 + (seed % 6)}-0${1 + (seed % 8)}-1${seed % 9}`,
    sectionVisibility: defaultSectionVisibility(),
    mixVideoTitle: 'Mix Oficial — Lo Mejor de ' + group.name,
    mixVideoThumbnailUrl: pick(STAGE_PHOTOS, seed, 1),
    mixVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    totalHoursLogged: 800 + (seed % 900),
    history:
      `${group.name} nació en Monterrey, N.L. con la idea de llevar el regional mexicano ` +
      `a los escenarios más exigentes del país. Sus primeros años se forjaron en palenques y ferias ` +
      `regionales, donde construyeron la reputación de no fallar una fecha. Con el paso del tiempo ` +
      `consolidaron un sonido propio que combina la tradición norteña con arreglos contemporáneos, ` +
      `lo que les abrió las puertas de recintos mayores y de la escena discográfica. Hoy son una de ` +
      `las agrupaciones más solicitadas de su género, con una trayectoria sostenida por el trabajo ` +
      `en vivo y una base de seguidores que crece en cada gira.`,

    baseRate: {
      suggestedFee: group.artistFeeBase,
      minimumHours: 3,
      extraHourFee: Math.round(group.artistFeeBase * 0.25),
      currency: 'MXN',
      notes: 'La tarifa puede variar en fechas patrias, fin de año o recintos con aforo superior a 5,000 personas.'
    },

    officeAddress: 'Av. Constitución 1800, Piso 14, Col. Centro',
    officeCity: 'Monterrey, N.L.',
    bookingPhone: group.groupLeaderPhone || '+52 81 8300 0000',
    bookingEmail: group.groupLeaderEmail || 'contrataciones@acordex.mx',

    contract: {
      hasContract: true,
      exclusivity: 'Exclusivo',
      signedAt: '2024-01-15',
      expiresAt: '2027-01-15',
      commissionPercent: 15,
      fileName: 'Contrato_Exclusividad_Acordex_2024_2027.pdf'
    },

    audio: {
      hasOwnEquipment: true,
      engineerName: 'Ing. Mateo Cantú',
      engineerPhone: '+52 81 5555 1234',
      consoleModel: 'Behringer X32 / Midas M32',
      speakersSetup: 'Line Array 8 elementos por lado + Subwoofers 18"',
      monitorsSetup: 'In-Ear Sennheiser EW-IEM G4 (6 mezclas independientes)',
      riderRequirements: [
        'Planta de luz trifásica 100 kW independiente.',
        'Escenario mínimo de 10x8 metros con tarima de batería de 2x2m.',
        'Camerino privado con clima, espejo de cuerpo entero y seguridad.',
        'Catering para 12 personas (agua embotellada, sueros, fruta de temporada).'
      ]
    },

    socials: {
      instagram: 'https://instagram.com/banda_acordex',
      facebook: 'https://facebook.com/banda_acordex',
      youtube: 'https://youtube.com/banda_acordex',
      spotify: 'https://open.spotify.com/artist/sample',
      tiktok: 'https://tiktok.com/@banda_acordex'
    },

    representatives: buildRepresentatives(group.id, group, seed),

    about: `La agrupación musical ${group.name} es uno de los proyectos artísticos más destacados y con mayor proyección en la escena de la música mexicana actual. Formada en ${2018 + (seed % 5)} en Monterrey, N.L., la banda combina el sonido auténtico de la tradición regional con arreglos contemporáneos que atrapan al público de todas las edades.\n\nCon más de ${15 + (seed % 20)} millones de reproducciones acumuladas en plataformas digitales y una impresionante trayectoria en los palenques y recintos más importantes de México y Estados Unidos, ${group.name} garantiza un espectáculo de primer nivel con producción de audio, iluminación y presencia escénica inolvidables.`,

    milestones: [
      { year: `${2019 + (seed % 3)}`, title: 'Fundación Oficial del Grupo', description: 'Primeras presentaciones en festivales regionales y grabación del primer demo.' },
      { year: '2023', title: 'Firma en Exclusiva con Acordex Records', description: 'Lanzamiento del primer álbum de estudio con alcance nacional.' },
      { year: '2025', title: 'Lleno Total en la Arena Monterrey', description: 'Concierto sold-out ante más de 12,000 asistentes.' }
    ],

    awards: [
      'Premio Lo Nuestro 2024 — Nominado a Mejor Grupo Regional',
      'Disco de Platino por más de 100,000 reproducciones digitales',
      'Reconocimiento Especial Feria de San Marcos 2025'
    ],

    members: buildMembers(group.id, seed),
    rosterLog: buildRosterLog(group.id, seed),
    posts: buildPosts(group.id, group, seed),
    reviews: buildReviews(group.id, seed),
    events: buildEvents(group.id, group),
    tracks: buildTracks(group.id, group, seed),
    gallery: buildGallery(seed),
    videos: buildVideos(seed),

    social: {
      followers: 1420000,
      followersGrowthPercent: 12.8,
      totalLikes: 8900000,
      engagementPercent: 8.4,
      monthlyFollowers: [1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.38, 1.4, 1.42, 1.45, 1.48, 1.5],
      monthlyLikes: [6.2, 6.5, 6.9, 7.1, 7.5, 7.8, 8.1, 8.4, 8.6, 8.9, 9.1, 9.4]
    }
  };
}
