import { Injectable, signal } from '@angular/core';

export interface Track {
  id: number;
  title: string;
  genre: string;
  plays: string;
  duration: string;
  releaseYear: string;
  spotifyUrl?: string;
  isPopular?: boolean;
}

export interface PackageOption {
  name: string;
  hours: number;
  price: string;
  description: string;
  includes: string[];
  recommended?: boolean;
}

export interface ReviewItem {
  id: number;
  clientName: string;
  eventType: string;
  date: string;
  rating: number;
  comment: string;
  avatarUrl: string;
  location: string;
}

export interface BandMilestone {
  year: string;
  title: string;
  description: string;
}

export interface BandUpcomingEvent {
  id: string;
  eventId?: number;
  title: string;
  type: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  internalRoute: string;
  imageUrl?: string;
  statusText?: string;
}

export interface BandMemberVideo {
  title: string;
  videoUrl: string;
  duration: string;
}

export interface BandMemberSocials {
  spotify?: { url: string; followers?: string };
  instagram?: { url: string; handle: string };
  facebook?: { url: string; pageName: string };
  youtube?: { url: string; channelName: string };
  tiktok?: { url: string; handle: string };
}

export interface BandMember {
  id: number;
  name: string;
  role: string;
  instrument: string;
  photoUrl: string;
  coverPhotoUrl?: string;
  bio: string;
  fullBio: string;
  experienceYears: number;
  age: number;
  hometown: string;
  quote: string;
  galleryPhotos: string[];
  videos?: BandMemberVideo[];
  socials: BandMemberSocials;
}

export interface BandDetail {
  id: string;
  name: string;
  tag: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  imageUrl: string;
  heroCoverUrl: string;
  location: string;
  country: string;
  state: string;
  municipality: string;
  availability: string;
  basePrice: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  socials: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    spotify?: string;
    tiktok?: string;
  };
  // General Info
  bio: string;
  membersCount: number;
  foundedYear: number;
  originCity: string;
  instruments: string[];
  membersList: BandMember[];
  mixVideoUrl: string;
  mixVideoTitle: string;
  stats: {
    eventsCompleted: number;
    totalHoursLogged: number;
    clientSatisfactionPercentage: number;
    repeatClientsCount: number;
  };
  technicalRider: string[];
  
  // Trayectoria
  biographyFull: string;
  milestones: BandMilestone[];
  awards: string[];

  // Music
  genres: string[];
  topTracks: Track[];
  repertoireByGenre: { genre: string; songs: string[] }[];

  // Media Gallery
  galleryImages: { url: string; caption: string }[];
  highlightVideos: { title: string; videoUrl: string; thumbnailUrl: string; duration: string }[];

  // Packages
  packages: PackageOption[];

  // Reviews
  reviews: ReviewItem[];

  // Upcoming Public Events
  upcomingEvents?: BandUpcomingEvent[];
}

@Injectable({
  providedIn: 'root'
})
export class BandService {
  
  private readonly bandsDatabase: Record<string, BandDetail> = {
    'banda-los-reyes': {
      id: 'banda-los-reyes',
      name: 'Banda Los Reyes',
      tag: 'Banda Sinaloense',
      rating: 4.9,
      reviewCount: 142,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
      heroCoverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1600&auto=format&fit=crop',
      location: 'Mazatlán, Sinaloa (México)',
      country: 'México',
      state: 'Sinaloa',
      municipality: 'Mazatlán',
      availability: 'Disponibilidad Alta',
      basePrice: '$35,000 MXN / hr',
      managerName: 'Don Pedro Reyes',
      managerPhone: '523312345678',
      managerEmail: 'contacto@bandalosreyes.mx',
      socials: {
        instagram: 'https://instagram.com',
        facebook: 'https://facebook.com',
        youtube: 'https://youtube.com',
        spotify: 'https://spotify.com',
        tiktok: 'https://tiktok.com'
      },
      bio: 'Fundada en el corazón de Sinaloa, Banda Los Reyes ha llevado el sonido auténtico de la tuba, los clarinetes y la tambora a más de 500 eventos de gala, festejos masivos y bodas exclusivas en México y Estados Unidos.',
      membersCount: 16,
      foundedYear: 2012,
      originCity: 'Mazatlán, Sinaloa',
      instruments: ['Tuba electroacústica', 'Trompetas de bronce (3)', 'Trombones (3)', 'Clarinetes Bb (3)', 'Tarolas y Tambora tradicional', 'Voces principales (3)'],
      mixVideoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      mixVideoTitle: 'Mix Estelar de Canciones Sinaloenses - Banda Los Reyes (En Vivo)',
      membersList: [
        {
          id: 1,
          name: 'Mateo Reyes',
          role: 'Vocalista Principal & Líder',
          instrument: 'Voz Principal',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
          bio: 'Voz carismática con más de 12 años dominando escenarios en Sinaloa y festivales internacionales.',
          fullBio: `Mateo Reyes nació en el puerto histórico de Mazatlán, Sinaloa. Creció rodeado de la brisa marina y las notas festivas de las bandas tradicionales que animaban el malecón. Desde una edad muy temprana, a los 12 años, inició sus estudios de canto e interpretación escénica, integrándose a coros juveniles y agrupaciones de viento locales.

Con más de 12 años de trayectoria profesional ininterrumpida, Mateo se ha consolidado como la voz principal y líder indiscutible de Banda Los Reyes. Su potente rango vocal, entonación limpia y carisma natural le permiten conectar instantáneamente con audiencias de todas las edades en bodas de gala, aniversarios y festivales masivos.

Aparte de su pasión por los escenarios en vivo, Mateo dedica gran parte de su tiempo libre a la composición de temas inéditos a la orilla del mar, la práctica del fútbol playero con amigos de la infancia y la exploración gastronómica de los mariscos tradicionales sinaloenses. Su filosofía artística radica en transmitir con honestidad cada verso, asegurando que cada presentación en vivo sea una experiencia memorable para los anfitriones y sus invitados.`,
          experienceYears: 12,
          age: 31,
          hometown: 'Mazatlán, Sinaloa',
          quote: '«La música sinaloense no se canta con la garganta, se canta con el corazón y la tuba retumbando en el pecho.»',
          galleryPhotos: [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop'
          ],
          videos: [
            { title: 'Mateo Reyes - Solo Vocal de "Mi Reina Sinaloense"', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4', duration: '3:45' },
            { title: 'Ensayo Acústico en Mazatlán', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '2:30' }
          ],
          socials: {
            spotify: { url: 'https://spotify.com', followers: '125K Oyentes Mensuales' },
            instagram: { url: 'https://instagram.com', handle: '@mateoreyes_oficial' },
            facebook: { url: 'https://facebook.com', pageName: 'Mateo Reyes Oficial' },
            youtube: { url: 'https://youtube.com', channelName: 'Mateo Reyes Music' },
            tiktok: { url: 'https://tiktok.com', handle: '@mateoreyesmusica' }
          }
        },
        {
          id: 2,
          name: 'Santiago Beltrán',
          role: 'Director Musical & Tubero',
          instrument: 'Tuba Electroacústica',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
          bio: 'Fundador y arreglista musical, especialista en darle el ponche potente y afinado a la tambora sinaloense.',
          fullBio: `Santiago Beltrán nació en Culiacán, Sinaloa. Es egresado con mención de honor en Teoría Musical y Composición por la Universidad Autónoma de Sinaloa. Es reconocido por directores y productores musicales como uno de los ejecutantes de tuba electroacústica más virtuosos y precisos del país.

Como director musical de Banda Los Reyes desde 2012, Santiago es el arquitecto detrás de los arreglos armónicos que caracterizan el sonido único de la agrupación. Su meticuloso oído musical garantiza que la sección de viento y percusiones mantengan una afinación impecable en escenarios abiertos y cerrados.

En su faceta personal, Santiago disfruta de la pesca deportiva en las costas del Pacífico, la restauración artesanal de instrumentos de metal antiguos y la docencia musical, impartiendo talleres gratuitos para jóvenes talentos de bajos recursos. Su compromiso con la preservación de las raíces de la banda sinaloense se refleja en cada compás que interpreta.`,
          experienceYears: 15,
          age: 36,
          hometown: 'Culiacán, Sinaloa',
          quote: '«La tuba es el motor que le da vida a la banda. Si la tuba suena firme, el evento nunca cae.»',
          galleryPhotos: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=800&auto=format&fit=crop'
          ],
          videos: [
            { title: 'Santiago Beltrán - Demostración de Tuba Sinaloense', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4', duration: '4:10' }
          ],
          socials: {
            spotify: { url: 'https://spotify.com', followers: '45K Oyentes' },
            instagram: { url: 'https://instagram.com', handle: '@santiagobeltran_tuba' },
            facebook: { url: 'https://facebook.com', pageName: 'Santiago Beltrán Tuba' },
            youtube: { url: 'https://youtube.com', channelName: 'Santiago Beltrán Masterclass' }
          }
        },
        {
          id: 3,
          name: 'Carlos Ruiz',
          role: 'Primer Clarinete',
          instrument: 'Clarinete Bb',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
          bio: 'Egresado de la Escuela de Música de Mazatlán con solos virtuosos en cada presentación.',
          fullBio: `Carlos Ruiz nació en Los Mochis, Sinaloa. Inició sus estudios formales de clarinete a los 10 años en el conservatorio regional. Su versatilidad le ha permitido fusionar la técnica pura de la música clásica orquestal con la velocidad e improvisación alegre de las bandas sinaloenses.

Ha recorrido los escenarios más prestigiados de México y Estados Unidos interpretando temas icónicos como 'El Niño Perdido' y 'El Sinaloense'. Carlos destaca por sus improvisaciones melódicas veloces y por mantener un tono brillante y equilibrado que deleita a los melómanos más exigentes.

En sus momentos de descanso, a Carlos le gusta la fotografía urbana, los recorridos en bicicleta de montaña por los valles sinaloenses y la colección de discos de vinilo de jazz clásico.`,
          experienceYears: 10,
          age: 28,
          hometown: 'Los Mochis, Sinaloa',
          quote: '«El clarinete en la banda le da esa alegría y brillo característico que hace bailar a cualquiera.»',
          galleryPhotos: [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop'
          ],
          videos: [
            { title: 'Carlos Ruiz - Solo de Clarinete en "El Niño Perdido"', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '3:15' }
          ],
          socials: {
            instagram: { url: 'https://instagram.com', handle: '@carlosruiz_clarinete' },
            spotify: { url: 'https://spotify.com', followers: '20K Oyentes' },
            youtube: { url: 'https://youtube.com', channelName: 'Carlos Ruiz Music' }
          }
        },
        {
          id: 4,
          name: 'Javier Morales',
          role: 'Percusionista Principal',
          instrument: 'Tarolas y Tambora',
          photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
          bio: 'El ritmo imbatible que mantiene la pista de baile encendida durante todo el evento.',
          fullBio: `Javier Morales es originario de Mazatlán, Sinaloa. Criado en una familia de percusionistas, desarrolló desde niño una agilidad rítmica insuperable. Es el encargado de controlar la velocidad y el repique de las tarolas y la tambora en Banda Los Reyes.

Su energía sobre el escenario contagia a los asistentes desde el primer minuto del evento. Javier complementa sus habilidades rítmicas estudiando percusionismo afrolatino y calistenia de alto rendimiento para mantener la resistencia durante shows de más de 5 horas continuas.`,
          experienceYears: 11,
          age: 30,
          hometown: 'Mazatlán, Sinaloa',
          quote: '«El tiempo en las tarolas es sagrado. Un buen repique hace levantar las manos a todo el público.»',
          galleryPhotos: [
            'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop'
          ],
          videos: [
            { title: 'Javier Morales - Repique de Tarola Sinaloense', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4', duration: '2:50' }
          ],
          socials: {
            instagram: { url: 'https://instagram.com', handle: '@javiermorales_percus' },
            tiktok: { url: 'https://tiktok.com', handle: '@javiermorales_drums' },
            youtube: { url: 'https://youtube.com', channelName: 'Javier Morales Drums' }
          }
        }
      ],
      stats: {
        eventsCompleted: 540,
        totalHoursLogged: 2400,
        clientSatisfactionPercentage: 99.4,
        repeatClientsCount: 88
      },
      technicalRider: [
        'Consola de sonido digital de 32 canales (Behringer X32 / Midas M32)',
        'Sistema de monitoreo In-Ear inalámbrico para 16 músicos',
        'Iluminación robótica LED beam & wash programable',
        'Planta de luz trifásica de respaldo para eventos en exterior'
      ],
      biographyFull: 'Banda Los Reyes nació en 2012 bajo la visión directiva de la familia Reyes en Mazatlán. Lo que inició como una pequeña agrupación de viento en serenatas del malecón se transformó rápidamente en uno de los referentes más solicitados del género Sinaloense para eventos privados de alto prestigio. Han compartido escenario con leyendas de la música regional y cuentan con producción musical propia grabada en los mejores estudios de Guadalajara y Mazatlán.',
      milestones: [
        { year: '2012', title: 'Fundación en Mazatlán', description: 'Se reúne la alineación original de 14 talentosos jóvenes sinaloenses.' },
        { year: '2016', title: 'Primer Álbum Inédito', description: 'Lanzamiento del disco "Reyes del Malecón" logrando sonar en radios locales.' },
        { year: '2019', title: 'Gira Nacional e Internacional', description: 'Primeros conciertos en California, Texas y Arizona con lleno total.' },
        { year: '2023', title: 'Reconocimiento Acordex de Oro', description: 'Otorgado por mayor cantidad de contrataciones con calificación perfecta en eventos privados.' }
      ],
      awards: [
        'Premio Acordex Excelencia en Vivo 2023',
        'Mejor Banda Sinaloense para Eventos Sociales 2022 - ExpoBoda México',
        'Disco de Oro por reproducciones digitales con "Mi Reina Sinaloense"'
      ],
      genres: ['Banda Sinaloense', 'Rancheras', 'Corridos', 'Cumbias', 'Baladas'],
      topTracks: [
        { id: 1, title: 'El Son de los Reyes', genre: 'Banda Sinaloense', plays: '3.4M', duration: '3:15', releaseYear: '2022', isPopular: true },
        { id: 2, title: 'Mi Reina Sinaloense', genre: 'Balada Banda', plays: '5.1M', duration: '3:45', releaseYear: '2021', isPopular: true },
        { id: 3, title: 'Cumbia del Malecón', genre: 'Cumbia Banda', plays: '2.8M', duration: '3:30', releaseYear: '2023', isPopular: true },
        { id: 4, title: 'Corrido del Patrón', genre: 'Corrido', plays: '1.9M', duration: '3:05', releaseYear: '2020', isPopular: false },
        { id: 5, title: 'El Muchacho Alegre (Versión Especial)', genre: 'Ranchera', plays: '4.2M', duration: '2:50', releaseYear: '2022', isPopular: true }
      ],
      repertoireByGenre: [
        {
          genre: 'Banda Sinaloense Tradicional',
          songs: ['El Sinaloense', 'Mi Gusto Es', 'El Niño Perdido', 'El Muchacho Alegre', 'Los Tecolotes', 'El Toro Mambo']
        },
        {
          genre: 'Baladas y Románticas',
          songs: ['Mi Reina Sinaloense', 'Dime Que Me Quieres', 'Te Presumo', 'Háblame de Ti', 'Por Mujeres Como Tú']
        },
        {
          genre: 'Cumbias para Baile',
          songs: ['Cumbia del Malecón', 'La Yaquesita', 'El Baile del Caballito', 'Juana la Cubana', 'La Chona (Banda Ver.)']
        }
      ],
      galleryImages: [
        { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop', caption: 'Presentación estelar en Boda de Gala en Guadalajara' },
        { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop', caption: 'Show en vivo en la Expo Ganadera Mazatlán' },
        { url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop', caption: 'Sección de metales en acción de concierto' },
        { url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=800&auto=format&fit=crop', caption: 'Backstage y convivencia con fans' }
      ],
      highlightVideos: [
        { title: 'Banda Los Reyes - En Vivo desde Casino Monterrey', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop', duration: '4:20' },
        { title: 'Medley de Cumbias Sinaloenses - Boda VIP', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop', duration: '6:15' }
      ],
      packages: [],
      reviews: [
        {
          id: 1,
          clientName: 'Valeria & Roberto',
          eventType: 'Boda en Hacienda La Moreda',
          date: '15 de Mayo, 2024',
          rating: 5,
          comment: '¡Quedamos fascinados! Tocaron en nuestra boda y la pista nunca estuvo vacía. La potencia del sonido y la puntualidad fueron impecables.',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop',
          location: 'Guadalajara, Jal.'
        },
        {
          id: 2,
          clientName: 'Ing. Alejandro Garza',
          eventType: 'Aniversario Corporativo',
          date: '28 de Febrero, 2024',
          rating: 5,
          comment: 'Super profesionales. Desde la cotización en Acordex hasta la firma del contrato y el show en vivo. Don Pedro Reyes muy atento.',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
          location: 'Monterrey, N.L.'
        }
      ],
      upcomingEvents: [
        {
          id: 'evt-101',
          eventId: 3,
          title: 'Festival Arre 2026 - Escenario Principal',
          type: 'Festival Masivo',
          date: '24 OCT 2026',
          time: '21:30 HRS',
          venue: 'Autódromo Hermanos Rodríguez',
          city: 'Ciudad de México',
          internalRoute: '/events/comprar-boletos?id=3',
          statusText: 'Boletos Disponibles en Acordex',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop'
        },
        {
          id: 'evt-102',
          eventId: 6,
          title: 'Firma de Autógrafos & Convivencia Fan Zone',
          type: 'Firma de Autógrafos',
          date: '12 SEP 2026',
          time: '17:00 HRS',
          venue: 'Plaza Las Américas',
          city: 'Monterrey, N.L.',
          internalRoute: '/events/firma-prensa?id=6',
          statusText: 'Acceso Libre con Pre-registro',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop'
        },
        {
          id: 'evt-103',
          eventId: 1,
          title: 'Gran Baile de Aniversario de Banda Los Reyes',
          type: 'Concierto Estelar',
          date: '19 DIC 2026',
          time: '22:00 HRS',
          venue: 'Palenque de la Feria',
          city: 'Guadalajara, JAL',
          internalRoute: '/events/comprar-boletos?id=1',
          statusText: 'Boletos & Selección de Asientos',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop'
        }
      ]
    },

    'norteno-del-sur': {
      id: 'norteno-del-sur',
      name: 'Norteño del Sur',
      tag: 'Norteño',
      rating: 4.7,
      reviewCount: 98,
      verified: true,
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
      heroCoverUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1600&auto=format&fit=crop',
      location: 'Monterrey, Nuevo León (México)',
      country: 'México',
      state: 'Nuevo León',
      municipality: 'Monterrey',
      availability: 'Disponibilidad Media',
      basePrice: '$22,000 MXN / hr',
      managerName: 'Ing. Luis Donaldo',
      managerPhone: '528112345678',
      managerEmail: 'contacto@nortenodelsur.com',
      socials: {
        instagram: 'https://instagram.com',
        facebook: 'https://facebook.com',
        spotify: 'https://spotify.com',
        youtube: 'https://youtube.com',
        tiktok: 'https://tiktok.com'
      },
      bio: 'Sabor regio puro con acordeón de teclas y bajo sexto afinado al centavo. Norteño del Sur combina los clásicos inolvidables del norte con los ritmos progresivos más modernos.',
      membersCount: 5,
      foundedYear: 2015,
      originCity: 'Monterrey, Nuevo León',
      instruments: ['Acordeón Hohner / Gabanelli', 'Bajo Sexto personalizado', 'Bajo eléctrico', 'Batería acústica', 'Vocalista principal y segunda voz'],
      mixVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      mixVideoTitle: 'Popurrí Norteño & Huapangos - Norteño del Sur (Mix Oficial)',
      membersList: [
        {
          id: 1,
          name: 'Luis Donaldo',
          role: 'Acordeonista & Primera Voz',
          instrument: 'Acordeón Gabanelli',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
          bio: 'Maestro del acordeón con raíces en la música tradicional regiomontana.',
          fullBio: `Luis Donaldo comenzó a tocar el acordeón a la edad de 9 años guiado por su abuelo en Allende, Nuevo León. Es un apasionado de la cultura norteña, las carnes asadas con amigos y la colección de acordeones antiguos de botones. Su técnica limpia y su matiz vocal caracterizan el sonido único de Norteño del Sur en cada evento.`,
          experienceYears: 11,
          age: 33,
          hometown: 'Monterrey, NL',
          quote: '«El norteño es corazón y orgullo regio. Cada huapango se toca para que la gente zapatee sabroso.»',
          galleryPhotos: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop'
          ],
          videos: [
            { title: 'Luis Donaldo - Huapango en Acordeón Gabanelli', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4', duration: '3:00' }
          ],
          socials: {
            spotify: { url: 'https://spotify.com', followers: '80K Oyentes' },
            instagram: { url: 'https://instagram.com', handle: '@luisdonaldo_acordeon' },
            facebook: { url: 'https://facebook.com', pageName: 'Luis Donaldo Oficial' },
            youtube: { url: 'https://youtube.com', channelName: 'Luis Donaldo Norteño' }
          }
        },
        {
          id: 2,
          name: 'Rodrigo Garza',
          role: 'Bajo Sexto & Segunda Voz',
          instrument: 'Bajo Sexto Artesanal',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1200&auto=format&fit=crop',
          bio: 'Armonista preciso y productor musical de la agrupación en Monterrey.',
          fullBio: `Rodrigo estudió producción en Monterrey y es el encargado de afinar cada detalle de sonido en vivo. Disfruta de la montaña, el senderismo y el café de especialidad. Su trabajo en el bajo sexto le da esa consistencia armónica irremplazable a la agrupación.`,
          experienceYears: 9,
          age: 29,
          hometown: 'San Pedro Garza García, NL',
          quote: '«El bajo sexto le da ese ritmo único que acompaña el acordeón en cada polca.»',
          galleryPhotos: [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop'
          ],
          videos: [
            { title: 'Rodrigo Garza - Arpegio en Bajo Sexto', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '2:15' }
          ],
          socials: {
            instagram: { url: 'https://instagram.com', handle: '@rodrigogarza_bajosexto' },
            facebook: { url: 'https://facebook.com', pageName: 'Rodrigo Garza Bajo Sexto' }
          }
        }
      ],
      stats: {
        eventsCompleted: 380,
        totalHoursLogged: 1650,
        clientSatisfactionPercentage: 98.2,
        repeatClientsCount: 65
      },
      technicalRider: [
        'Sistema compacto de microfonía para acordeón y bajo sexto',
        'Consola digital de 16 canales',
        'Monitoreo In-Ear personalizado'
      ],
      biographyFull: 'Norteño del Sur nació en Monterrey en 2015. Formado por talentosos egresados de la Escuela de Música de la UANL, revolucionaron la escena local ofreciendo un repertorio versátil que va desde los Cadetes de Linares y Ramón Ayala hasta los temas virales de la música norteña contemporánea.',
      milestones: [
        { year: '2015', title: 'Creación de la Agrupación', description: 'Primeras presentaciones en eventos corporativos y quintas en Santiago, NL.' },
        { year: '2018', title: 'Álbum "Tragos de Tradición"', description: 'Éxito en plataformas digitales con más de 2 millones de escuchas.' },
        { year: '2021', title: 'Consolidación en Acordex', description: 'Forman parte de los grupos más cotizados en el norte del país.' }
      ],
      awards: ['Reconocimiento Norteño del Año Monterrey 2021'],
      genres: ['Norteño Classic', 'Huapangos', 'Corridos', 'Norteño Sax'],
      topTracks: [
        { id: 1, title: 'Polka Regiomontana', genre: 'Norteño', plays: '1.8M', duration: '2:45', releaseYear: '2021', isPopular: true },
        { id: 2, title: 'Tragos de Amargo Licores (Cover Especial)', genre: 'Norteño Classic', plays: '3.2M', duration: '3:10', releaseYear: '2019', isPopular: true },
        { id: 3, title: 'El Huapango del Sur', genre: 'Huapango', plays: '1.4M', duration: '2:30', releaseYear: '2022', isPopular: true }
      ],
      repertoireByGenre: [
        {
          genre: 'Clásicos Norteños',
          songs: ['Tragos de Amargo Licor', 'Un Rincón Cerca del Cielo', 'Casas de Madera', 'La Chata', 'Que la Dejen Ir Sola']
        },
        {
          genre: 'Huapangos para Zapatear',
          songs: ['El Huapango del Sur', 'El Sinaloense en Acordeón', 'Los Alacranes', 'El Aniceto']
        }
      ],
      galleryImages: [
        { url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop', caption: 'Norteño del Sur en evento privado en San Pedro' },
        { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop', caption: 'Acordeón en vivo en festival regio' }
      ],
      highlightVideos: [
        { title: 'Norteño del Sur - Popurrí de Huapangos En Vivo', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop', duration: '5:10' }
      ],
      packages: [],
      reviews: [
        {
          id: 1,
          clientName: 'Lic. Gerardo Sada',
          eventType: 'Fiesta de Cumpleaños',
          date: '10 de Junio, 2024',
          rating: 5,
          comment: 'Impresionante nivel con el acordeón. Todos nuestros invitados terminaron bailando los huapangos. 100% recomendados.',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
          location: 'San Pedro Garza García, N.L.'
        }
      ]
    }
  };

  private generateSlug(name: string): string {
    return name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  getBandById(idOrName: string): BandDetail {
    const slug = this.generateSlug(idOrName);

    let bandResult: BandDetail;

    if (this.bandsDatabase[slug]) {
      bandResult = { ...this.bandsDatabase[slug] };
    } else if (this.bandsDatabase[idOrName]) {
      bandResult = { ...this.bandsDatabase[idOrName] };
    } else {
      const cleanName = idOrName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      bandResult = {
        id: slug,
        name: cleanName,
        tag: cleanName.toLowerCase().includes('mariachi') ? 'Mariachi' : cleanName.toLowerCase().includes('norteño') ? 'Norteño' : cleanName.toLowerCase().includes('sierreño') ? 'Sierreño' : 'Banda Sinaloense',
        rating: 4.9,
        reviewCount: 74,
        verified: true,
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
        heroCoverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1600&auto=format&fit=crop',
        location: 'México (Disponible a Nivel Nacional)',
        country: 'México',
        state: 'Sinaloa',
        municipality: 'Mazatlán',
        availability: 'Disponibilidad Alta',
        basePrice: '$30,000 MXN / hr',
        managerName: 'Representación Artística Acordex',
        managerPhone: '523312345678',
        managerEmail: `contacto@${slug}.com`,
        socials: {
          instagram: 'https://instagram.com',
          facebook: 'https://facebook.com',
          youtube: 'https://youtube.com',
          spotify: 'https://spotify.com',
          tiktok: 'https://tiktok.com'
        },
        bio: `${cleanName} es una de las agrupaciones más solicitadas en la plataforma Acordex. Destaca por su alta calidad interpretativa, puntualidad estricta y un espectáculo en vivo diseñado para garantizar el éxito de tu evento.`,
        membersCount: 12,
        foundedYear: 2017,
        originCity: 'Guadalajara, Jalisco',
        instruments: ['Tuba & Bajo Sexto', 'Sección de Viento', 'Percusiones', 'Voces Principales'],
        mixVideoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        mixVideoTitle: `Mix Especial de Éxitos en Vivo - ${cleanName}`,
        membersList: [
          {
            id: 1,
            name: 'Director Musical Acordex',
            role: 'Director & Primera Voz',
            instrument: 'Voz Principal & Acordeón',
            photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
            coverPhotoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
            bio: 'Líder y fundador de la agrupación con amplia experiencia en presentaciones masivas.',
            fullBio: `Director y fundador de ${cleanName}. Reconocido por su profesionalismo y entrega en cada presentación.`,
            experienceYears: 12,
            age: 34,
            hometown: 'Guadalajara, Jal.',
            quote: '«La disciplina en los ensayos es la clave para un show impecable.»',
            galleryPhotos: [
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop'
            ],
            videos: [
              { title: 'Solo Instrumental de Director', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4', duration: '2:40' }
            ],
            socials: {
              instagram: { url: 'https://instagram.com', handle: '@director_acordex' },
              youtube: { url: 'https://youtube.com', channelName: 'Director Musical Acordex' },
              facebook: { url: 'https://facebook.com', pageName: 'Director Musical' }
            }
          }
        ],
        stats: {
          eventsCompleted: 230,
          totalHoursLogged: 950,
          clientSatisfactionPercentage: 99.1,
          repeatClientsCount: 45
        },
        technicalRider: [
          'Consola de sonido digital de alta gama',
          'Sistema In-Ear para todos los músicos',
          'Iluminación LED ambientada para escenario'
        ],
        biographyFull: `${cleanName} cuenta con una destacada trayectoria en la música regional. Su compromiso con la excelencia musical y el profesionalismo escénico los ha convertido en favoritos para bodas de gala, aniversarios y festivales en toda la república mexicana.`,
        milestones: [
          { year: '2017', title: 'Inicio de la Agrupación', description: 'Consolidación de talentos y primeros conciertos privados.' },
          { year: '2022', title: 'Integración a Plataforma Acordex', description: 'Alcanzando más de 200 eventos contratados con reseñas de 5 estrellas.' }
        ],
        awards: ['Certificado de Excelencia Acordex 2023'],
        genres: ['Regional Mexicano', 'Baladas', 'Cumbias', 'Rancheras'],
        topTracks: [
          { id: 1, title: `Éxito Estelar - ${cleanName}`, genre: 'Regional', plays: '2.1M', duration: '3:20', releaseYear: '2023', isPopular: true },
          { id: 2, title: 'Corazón Sinaloense', genre: 'Banda', plays: '1.4M', duration: '3:05', releaseYear: '2022', isPopular: true },
          { id: 3, title: 'Cumbia Pa Bailar', genre: 'Cumbia', plays: '3.0M', duration: '3:45', releaseYear: '2023', isPopular: true }
        ],
        repertoireByGenre: [
          {
            genre: 'Éxitos para Eventos',
            songs: ['Popurrí de Cumbias', 'Rancheras Clásicas', 'Baladas Románticas', 'Éxitos de Baile']
          }
        ],
        galleryImages: [
          { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop', caption: `${cleanName} en vivo en evento de gala` },
          { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop', caption: 'Escenario e iluminación en concierto' }
        ],
        highlightVideos: [
          { title: `${cleanName} - Presentación en Vivo Acordex`, videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop', duration: '4:00' }
        ],
        packages: [],
        reviews: [
          {
            id: 1,
            clientName: 'Cliente Acordex Verificado',
            eventType: 'Evento Social',
            date: 'Hace 1 mes',
            rating: 5,
            comment: 'Excelente agrupación, súper puntuales y con una energía inigualable. Los volvería a contratar sin duda alguna.',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
            location: 'México'
          }
        ]
      };
    }

    if (!bandResult.upcomingEvents || bandResult.upcomingEvents.length === 0) {
      bandResult.upcomingEvents = [
        {
          id: `evt-${bandResult.id}-1`,
          eventId: 3,
          title: `Festival Arre 2026 - ${bandResult.name} en Escenario Principal`,
          type: 'Festival Masivo',
          date: '24 OCT 2026',
          time: '21:30 HRS',
          venue: 'Autódromo Hermanos Rodríguez',
          city: 'Ciudad de México',
          internalRoute: '/events/comprar-boletos?id=3',
          statusText: 'Boletos Disponibles en Acordex',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop'
        },
        {
          id: `evt-${bandResult.id}-2`,
          eventId: 6,
          title: 'Firma de Autógrafos & Convivencia Fan Zone Oficial',
          type: 'Firma de Autógrafos',
          date: '12 SEP 2026',
          time: '17:00 HRS',
          venue: 'Plaza Las Américas Fan Zone',
          city: bandResult.originCity || 'Monterrey, N.L.',
          internalRoute: '/events/firma-prensa?id=6',
          statusText: 'Acceso Libre con Pre-registro',
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop'
        },
        {
          id: `evt-${bandResult.id}-3`,
          eventId: 1,
          title: `Gran Baile de Aniversario de ${bandResult.name}`,
          type: 'Concierto Estelar',
          date: '19 DIC 2026',
          time: '22:00 HRS',
          venue: 'Palenque Principal de la Feria',
          city: 'Guadalajara, JAL',
          internalRoute: '/events/comprar-boletos?id=1',
          statusText: 'Boletos & Selección de Asientos',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop'
        }
      ];
    }

    return bandResult;
  }

  getAllBands(): BandDetail[] {
    return Object.values(this.bandsDatabase);
  }
}
