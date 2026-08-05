import { GroupItem } from '../../core/models/admin.models';
import {
  GroupProfile, GroupMember, GroupPost, GroupReview, GroupEventRecord,
  Track, GalleryImage, HighlightVideo, RosterLogEntry, GroupRepresentative
} from './group-profile.model';

/**
 * Construye el perfil completo de un grupo a partir de su ficha del catálogo.
 *
 * Es mock, pero **determinista**: el mismo grupo produce siempre los mismos
 * datos. Eso importa porque la vista se recalcula en cada render y con valores
 * aleatorios las cifras bailarían solas delante del usuario.
 */

const PHOTOS = [
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80'
];

const STAGE_PHOTOS = [
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80',
  'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80'
];

/** Hash estable de una cadena, para variar los datos sin usar azar. */
function seedOf(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

const pick = <T>(list: T[], seed: number, offset = 0): T => list[(seed + offset) % list.length];

const MUSICIAN_ROLES = [
  { role: 'Vocalista Principal', instrument: 'Voz' },
  { role: 'Acordeonista', instrument: 'Acordeón' },
  { role: 'Bajo Sexto', instrument: 'Bajo Sexto' },
  { role: 'Saxofonista', instrument: 'Saxofón Alto' },
  { role: 'Baterista', instrument: 'Batería' },
  { role: 'Tolón / Bajo', instrument: 'Bajo Eléctrico' },
  { role: 'Segunda Voz', instrument: 'Voz & Guitarra' }
];

const STAFF_ROLES = [
  { role: 'Ingeniero de Sonido', instrument: undefined },
  { role: 'Chofer de Gira', instrument: undefined },
  { role: 'Jefe de Cargadores', instrument: undefined },
  { role: 'Técnico de Iluminación', instrument: undefined },
  { role: 'Road Manager', instrument: undefined }
];

const FIRST = ['Ramiro', 'Joel', 'Ernesto', 'Cuauhtémoc', 'Adán', 'Rubén', 'Ismael', 'Gerardo', 'Fabián', 'Tadeo', 'Ulises', 'Nicolás'];
const LAST = ['Cavazos', 'Quintanilla', 'Barrientos', 'Alanís', 'Elizondo', 'Saucedo', 'Rentería', 'Villarreal', 'Zapata', 'Montemayor'];
const CITIES = ['Monterrey, NL', 'Saltillo, COAH', 'Torreón, COAH', 'Reynosa, TAMPS', 'Culiacán, SIN', 'Hermosillo, SON'];

function buildMember(groupId: string, index: number, isStaff: boolean, seed: number): GroupMember {
  const s = seed + index * 7;
  const spec = isStaff ? pick(STAFF_ROLES, s, index) : MUSICIAN_ROLES[index % MUSICIAN_ROLES.length];
  const name = `${pick(FIRST, s, index)} ${pick(LAST, s, index * 3)}`;
  const years = 4 + (s % 16);

  return {
    id: `${groupId}-m${index}${isStaff ? 's' : ''}`,
    name,
    crewRole: isStaff ? 'Staff' : 'Integrante',
    role: spec.role,
    instrument: spec.instrument,
    photoUrl: pick(PHOTOS, s, index),
    coverPhotoUrl: pick(STAGE_PHOTOS, s, index),
    age: 24 + (s % 22),
    hometown: pick(CITIES, s, index),
    quote: pick([
      'El escenario no se le miente a nadie.',
      'Primero el ensayo, luego el aplauso.',
      'Cada tocada es la primera.',
      'La música se toca con el estómago lleno de nervios.'
    ], s, index),
    bio: `${spec.role} del grupo desde hace ${years} años.`,
    fullBio: `${name} se integró al proyecto tras años de rodaje en palenques del norte. ` +
      `Como ${spec.role.toLowerCase()}, es pieza clave del sonido en vivo del grupo y ha participado ` +
      `en la grabación de los últimos materiales discográficos.`,
    experienceYears: years,
    status: 'Activo',
    joinedAt: `${2015 + (s % 9)}-0${1 + (s % 8)}-1${s % 9}`,
    // Solo algunos autorizan publicar salario; así se ve el caso con y sin dato.
    monthlySalary: s % 3 === 0 ? 18000 + (s % 12) * 1500 : undefined,
    galleryPhotos: [pick(STAGE_PHOTOS, s, 1), pick(STAGE_PHOTOS, s, 2), pick(PHOTOS, s, 3)],
    videos: [
      { title: 'Solo en Arena Monterrey', thumbnailUrl: pick(STAGE_PHOTOS, s, 0), duration: '3:42' },
      { title: 'Backstage — prueba de sonido', thumbnailUrl: pick(STAGE_PHOTOS, s, 2), duration: '5:18' }
    ],
    socials: {
      instagram: `https://instagram.com/${name.split(' ')[0].toLowerCase()}_oficial`,
      facebook: `https://facebook.com/${name.split(' ')[0].toLowerCase()}`,
      tiktok: `https://tiktok.com/@${name.split(' ')[0].toLowerCase()}`
    }
  };
}

function buildRosterLog(groupId: string, seed: number): RosterLogEntry[] {
  return [
    { id: `${groupId}-r1`, memberName: 'Aarón Pesqueira', role: 'Trompetista', action: 'Baja', at: '2026-05-18 17:40', note: 'Salida por proyecto solista.' },
    { id: `${groupId}-r2`, memberName: 'Ulises Zapata', role: 'Técnico de Iluminación', action: 'Alta', at: '2026-04-02 09:15' },
    { id: `${groupId}-r3`, memberName: 'Nicolás Rentería', role: 'Baterista', action: 'Alta', at: `${2020 + (seed % 5)}-08-11 12:00` },
    { id: `${groupId}-r4`, memberName: 'Sergio Lozano', role: 'Bajo Sexto', action: 'Baja', at: '2024-11-30 20:05', note: 'Retiro por lesión.' }
  ];
}

function buildPosts(groupId: string, seed: number): GroupPost[] {
  return [
    {
      id: `${groupId}-p1`,
      content: '¡Gracias Monterrey! Anoche se llenó la Arena y ustedes cantaron cada canción. Nos vemos en la próxima 🔥',
      imageUrl: pick(STAGE_PHOTOS, seed, 0),
      publishedAt: '2026-08-01 23:10',
      likes: 12400 + (seed % 900),
      shares: 640,
      visibility: 'Publicada',
      sentiment: 'Positivo',
      comments: [
        { id: 'c1', authorName: 'Marisol T.', avatarUrl: pick(PHOTOS, seed, 1), text: 'El mejor concierto al que he ido, sin exagerar.', at: '2026-08-02 00:12', sentiment: 'Positivo' },
        { id: 'c2', authorName: 'Beto R.', avatarUrl: pick(PHOTOS, seed, 2), text: 'Impecables en vivo, el sonido se escuchó perfecto.', at: '2026-08-02 08:30', sentiment: 'Positivo' }
      ]
    },
    {
      id: `${groupId}-p2`,
      content: 'Se pospone la fecha de Torreón por condiciones del recinto. Los boletos siguen siendo válidos para la nueva fecha.',
      publishedAt: '2026-07-24 14:05',
      likes: 890,
      shares: 210,
      visibility: 'Publicada',
      sentiment: 'Negativo',
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
    { id: `${groupId}-e1`, title: 'Noche de Gala Norteña 2026', type: 'Concierto', date: '2026-08-15', venue: 'Arena Monterrey', city: 'Monterrey, NL', status: 'Completado', attendance: 4250, capacity: 5000, revenue: 425000, rating: 4.9 },
    { id: `${groupId}-e2`, title: 'Gran Palenque San Marcos', type: 'Concierto', date: '2026-09-28', venue: 'Palenque de la Feria', city: 'Aguascalientes, AGS', status: 'Confirmado', capacity: 8000, revenue: 680000 },
    { id: `${groupId}-e3`, title: 'Firma de Autógrafos & Prensa', type: 'Firma de Autógrafos', date: '2026-08-10', venue: 'Hotel Fiesta Americana', city: 'Guadalajara, JAL', status: 'Completado', attendance: 850, rating: 4.8 },
    { id: `${groupId}-e4`, title: 'Rueda de Prensa Nuevo Disco', type: 'Rueda de Prensa', date: '2026-10-02', venue: 'Centro de Convenciones', city: 'Monterrey, NL', status: 'Pendiente' },
    { id: `${groupId}-e5`, title: 'Festival Tumbado Zapopan', type: 'Concierto', date: '2026-10-12', venue: 'Auditorio Telmex', city: 'Zapopan, JAL', status: 'Confirmado', capacity: 4500, revenue: 320000 },
    { id: `${groupId}-e6`, title: `Evento privado — ${group.name}`, type: 'Privado', date: '2026-06-20', venue: 'Hacienda Los Morales', city: 'Ciudad de México', status: 'Completado', attendance: 400, rating: 5 }
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
    isPopular: i < 3
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

  // Solo los grupos no exclusivos aparecen representados por terceros.
  if (group.isExclusive) return [primary];

  return [
    primary,
    {
      id: `${groupId}-rep2`,
      labelName: 'Sonido del Norte Booking',
      contactName: 'Lic. Efraín Cordero',
      phone: '+52 33 2244 8890',
      email: 'contrataciones@sonidodelnorte.mx',
      isPrimary: false,
      serviceTier: 'Estándar',
      quotedFee: Math.round(group.artistFeeBase * 0.88),
      notes: 'Co-gestión autorizada. No incluye producción de audio ni viáticos.'
    },
    {
      id: `${groupId}-rep3`,
      labelName: 'Promotora Bajío Live',
      contactName: 'Ing. Nadia Sepúlveda',
      phone: '+52 55 7788 1120',
      email: 'booking@bajiolive.mx',
      isPrimary: false,
      serviceTier: 'Básico',
      quotedFee: Math.round(group.artistFeeBase * 0.8),
      notes: 'Solo gestión de fecha. El cliente cubre audio, traslados y hospedaje.'
    }
  ];
}

/** Ensambla el perfil completo del grupo. */
export function buildGroupProfile(group: GroupItem): GroupProfile {
  const seed = seedOf(group.id + group.name);
  const musicianCount = Math.max(3, group.membersCount);

  const members: GroupMember[] = [
    ...Array.from({ length: musicianCount }, (_, i) => buildMember(group.id, i, false, seed)),
    ...Array.from({ length: 3 }, (_, i) => buildMember(group.id, i, true, seed + 100))
  ];

  const minimumHours = 2 + (seed % 3);

  return {
    id: group.id,
    name: group.name,
    avatarUrl: group.image,
    coverUrl: pick(STAGE_PHOTOS, seed, 0),
    genre: group.genre,
    secondaryGenres: [pick(['Corridos', 'Banda', 'Sierreño', 'Cumbia Norteña'], seed, 1), pick(['Baladas', 'Rancheras'], seed, 2)],
    foundedYear: 2005 + (seed % 15),
    originCity: pick(CITIES, seed, 0),

    officeAddress: `Av. Constitución ${800 + (seed % 400)}, Col. Centro`,
    officeCity: pick(CITIES, seed, 1),
    bookingPhone: group.groupLeaderPhone || '+52 81 1234 5678',
    bookingEmail: group.groupLeaderEmail || 'booking@acordex.mx',

    baseRate: {
      minimumHours,
      suggestedFee: group.artistFeeBase,
      extraHourFee: Math.round(group.artistFeeBase / minimumHours * 0.6),
      currency: 'MXN',
      notes: 'Tarifa sugerida por el grupo. El administrador puede ajustarla al armar la cotización.'
    },

    contract: group.pendingLabelContract
      ? { hasContract: false, exclusivity: 'Independiente' }
      : {
          hasContract: true,
          contractType: group.disqueraType,
          signedAt: `${2021 + (seed % 4)}-03-1${seed % 9}`,
          expiresAt: `${2027 + (seed % 2)}-03-15`,
          fileName: `contrato_${group.id}_acordex.pdf`,
          exclusivity: group.isExclusive ? 'Exclusivo' : 'Co-gestionado',
          commissionPercent: 15 + (seed % 11)
        },

    audio: seed % 2 === 0
      ? {
          hasOwnEquipment: true,
          engineerName: 'Ing. Marco Betancourt',
          engineerPhone: '+52 81 3344 5566',
          consoleModel: 'Yamaha CL5 Digital',
          speakersSetup: 'Line array JBL VTX V20 — 12 cajas + 8 subs',
          monitorsSetup: '8 monitores de piso + 2 IEM Shure PSM1000',
          riderRequirements: ['Energía trifásica 220V estabilizada', 'Escenario mínimo 10x8 m', '4 accesos de carga', 'Camerino con clima'],
          notes: 'El grupo viaja con equipo propio y su propio ingeniero.'
        }
      : {
          hasOwnEquipment: false,
          riderRequirements: [
            'Consola digital de al menos 32 canales',
            'Line array acorde al aforo del recinto',
            '6 monitores de piso',
            'Backline de batería y amplificadores',
            'Ingeniero de sonido de casa disponible'
          ],
          notes: 'El recinto o el cliente debe cubrir el audio completo.'
        },

    socials: {
      instagram: `https://instagram.com/${group.id}`,
      facebook: `https://facebook.com/${group.id}`,
      youtube: `https://youtube.com/@${group.id}`,
      spotify: `https://open.spotify.com/artist/${group.id}`,
      tiktok: `https://tiktok.com/@${group.id}`
    },

    representatives: buildRepresentatives(group.id, group, seed),

    about: group.description,
    milestones: [
      { year: `${2005 + (seed % 15)}`, title: 'Fundación del grupo', description: `Nace en ${pick(CITIES, seed, 0)} con la alineación original.` },
      { year: `${2012 + (seed % 5)}`, title: 'Primer disco de estudio', description: 'Debut discográfico que los posiciona en la escena regional.' },
      { year: `${2019 + (seed % 3)}`, title: 'Gira nacional', description: 'Primera gira por más de 20 plazas del país.' },
      { year: '2024', title: 'Firma con Acordex Records', description: 'Se integran al catálogo de la disquera.' },
      { year: '2026', title: 'Arena Monterrey', description: 'Llenan por primera vez la Arena Monterrey.' }
    ],
    awards: ['Premio Regional del Norte 2024', 'Disco de Oro — La Última Carta', 'Artista Revelación Feria San Marcos'],

    members,
    rosterLog: buildRosterLog(group.id, seed),

    posts: buildPosts(group.id, seed),
    reviews: buildReviews(group.id, seed),
    events: buildEvents(group.id, group),
    tracks: buildTracks(group.id, group, seed),
    gallery: buildGallery(seed),
    videos: buildVideos(seed),

    social: {
      followers: 240000 + (seed % 900) * 1000,
      followersGrowthPercent: 4 + (seed % 15),
      totalLikes: 1200000 + (seed % 600) * 1000,
      engagementPercent: 6 + (seed % 12),
      monthlyFollowers: Array.from({ length: 12 }, (_, i) => 120 + ((seed + i * 17) % 90) + i * 8),
      monthlyLikes: Array.from({ length: 12 }, (_, i) => 60 + ((seed + i * 23) % 70) + i * 5)
    }
  };
}
