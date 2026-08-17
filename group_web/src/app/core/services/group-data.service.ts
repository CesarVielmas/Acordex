import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import {
  GroupProfile,
  GroupMember,
  GroupPost,
  Track,
  GalleryImage,
  HighlightVideo,
  defaultSectionVisibility,
  LiveActivityStatus,
  GroupItemSummary
} from '../models/group.models';
import { QuoteItem, ChatMessage } from '../models/quote.models';
import { GroupEventItem, EventEvidenceItem } from '../models/event.models';
import { StoryItem } from '../models/story.models';
import { GroupNotification } from '../models/notification.models';

const STORAGE_KEYS = {
  PROFILES: 'acordex_group_profiles_v1',
  QUOTES: 'acordex_quotes_v7',
  EVENTS: 'acordex_group_events_v1',
  STORIES: 'acordex_group_stories_v1',
  NOTIFICATIONS: 'acordex_group_notifications_v1',
  ACTIVE_GROUP_ID: 'acordex_active_group_id',
  ACTIVE_MEMBER_ID: 'acordex_active_member_id'
};

@Injectable({
  providedIn: 'root'
})
export class GroupDataService {
  private readonly storage = inject(StorageService);

  // ─────────────────────────────────────────────────────────────
  // INITIAL MOCK PROFILES COMPATIBLE WITH CLIENTS_WEB & ADMINS_WEB
  // ─────────────────────────────────────────────────────────────
  private readonly INITIAL_PROFILES: Record<string, GroupProfile> = {
    'banda-los-reyes': {
      id: 'banda-los-reyes',
      name: 'Banda Los Reyes',
      avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1600&auto=format&fit=crop',
      genre: 'Banda Sinaloense',
      secondaryGenres: ['Ranchera', 'Cumbia Norteña', 'Banda Romántica'],
      foundedYear: 2012,
      originCity: 'Mazatlán',
      state: 'Sinaloa',
      country: 'México',
      verified: true,
      platformJoinedAt: '2023-03-15',
      mixVideoTitle: 'Mix Estelar de Canciones Sinaloenses - Banda Los Reyes (En Vivo)',
      mixVideoThumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop',
      mixVideoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      totalHoursLogged: 840,
      history: 'Fundada en el corazón de Mazatlán, Sinaloa, Banda Los Reyes ha llevado el sonido auténtico de la tuba, los clarinetes y la tambora a más de 500 eventos de gala, festejos masivos y bodas exclusivas en México y Estados Unidos.',
      about: 'Máximos exponentes de la tambora sinaloense tradicional con arreglos vanguardistas y potente sonido en vivo.',
      officeAddress: 'Av. Camarón Sábalo 1920, Zona Dorada',
      officeCity: 'Mazatlán, Sinaloa',
      bookingPhone: '+52 669 981 4455',
      bookingEmail: 'contacto@bandalosreyes.mx',
      managerName: 'Don Pedro Reyes',
      managerPhone: '+52 33 1234 5678',
      managerEmail: 'manager@bandalosreyes.mx',
      rating: 4.9,
      reviewCount: 142,
      followersCount: '1.8M',
      agendaStatus: 'Parcialmente Ocupado',
      liveStatus: 'Disponible',
      artistFeeBase: 350000,
      minimumHours: 3,
      sectionVisibility: defaultSectionVisibility(),
      audio: {
        hasOwnEquipment: true,
        engineerName: 'Ing. Roberto Santana',
        engineerPhone: '+52 669 120 9944',
        consoleModel: 'Yamaha QL5 Digital 64 Canales',
        speakersSetup: 'Line Array Meyer Sound (6 cajas por lado)',
        monitorsSetup: 'In-Ears Shure PSM1000 + 4 Monitores de Piso',
        riderRequirements: [
          'Toma de corriente trifásica 220V / 60A a pie de escenario',
          'Tarima mínima de 10m x 8m con elevador para batería',
          'Camerino climatizado con agua embotellada, toallas limpias y fruta fresca',
          'Espacio de estacionamiento seguro para autobús de gira de 45 pasajeros'
        ],
        notes: 'La banda viaja con staff propio de 6 personas (2 técnicos de audio, 1 iluminación, 3 asistentes de escenario).'
      },
      socials: {
        instagram: 'https://instagram.com/bandalosreyesoficial',
        facebook: 'https://facebook.com/bandalosreyes',
        youtube: 'https://youtube.com/@bandalosreyes',
        spotify: 'https://open.spotify.com/artist/bandalosreyes',
        tiktok: 'https://tiktok.com/@bandalosreyes'
      },
      milestones: [
        { year: '2025', title: 'Gira Nacional "Reyes del Pacífico"', description: 'Más de 35 fechas con boletos agotados en los mejores palenques de la República Mexicana.' },
        { year: '2024', title: 'Premio Mejor Banda Regional en Acordex', description: 'Reconocimiento otorgado por los más de 120 eventos privados y masivos calificados con 5 estrellas.' },
        { year: '2022', title: 'Lanzamiento del Álbum "Orgullo Sinaloense"', description: 'Superó los 45 millones de reproducciones en plataformas digitales en su primer trimestre.' }
      ],
      awards: [
        'Galardón de Oro Acordex 2024 (Grupo Más Solicitado)',
        'Premio Palma de Plata Mazatlán 2023',
        'Top 10 Billboard Regional Mexican Airplay 2022'
      ],
      members: [
        {
          id: 'blr-m1',
          name: 'Mateo Reyes',
          crewRole: 'Integrante',
          role: 'Vocalista Principal & Líder',
          instrument: 'Voz Principal',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
          age: 31,
          hometown: 'Mazatlán, Sinaloa',
          quote: '«La música sinaloense no se canta con la garganta, se canta con el corazón y la tuba retumbando en el pecho.»',
          bio: 'Voz carismática con más de 12 años dominando escenarios en Sinaloa y festivales internacionales.',
          fullBio: 'Mateo Reyes nació en Mazatlán, Sinaloa. Creció rodeado de la brisa marina y las notas festivas de las bandas tradicionales que animaban el malecón. Con más de 12 años de trayectoria profesional ininterrumpida, Mateo se ha consolidado como la voz principal de Banda Los Reyes.',
          experienceYears: 12,
          status: 'Activo',
          joinedAt: '2012-01-10',
          galleryPhotos: [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop'
          ],
          videos: [
            { title: 'Mateo Reyes - Solo Vocal de "Mi Reina Sinaloense"', thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4', duration: '3:45' },
            { title: 'Ensayo Acústico en Mazatlán', thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '2:30' }
          ],
          socials: {
            instagram: 'https://instagram.com/mateoreyes_oficial',
            spotify: 'https://spotify.com/artist/mateoreyes',
            tiktok: 'https://tiktok.com/@mateoreyesmusica'
          }
        },
        {
          id: 'blr-m2',
          name: 'Santiago Beltrán',
          crewRole: 'Integrante',
          role: 'Director Musical & Tubero',
          instrument: 'Tuba Electroacústica',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
          age: 36,
          hometown: 'Culiacán, Sinaloa',
          quote: '«La tuba es el motor que le da vida a la banda. Si la tuba suena firme, el evento nunca cae.»',
          bio: 'Fundador y arreglista musical, especialista en darle el ponche potente y afinado a la tambora.',
          fullBio: 'Santiago Beltrán nació en Culiacán, Sinaloa. Es egresado con mención honorífica en Teoría Musical por la UAS. Como director musical, es el arquitecto detrás de los arreglos armónicos que caracterizan el sonido único de la agrupación.',
          experienceYears: 15,
          status: 'Activo',
          joinedAt: '2012-01-10',
          galleryPhotos: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop'
          ],
          videos: [
            { title: 'Solo de Tuba en Palenque Texcoco', thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4', duration: '1:50' }
          ],
          socials: {
            instagram: 'https://instagram.com/santiagobeltran_tuba'
          }
        },
        {
          id: 'blr-m3',
          name: 'Carlos Morales',
          crewRole: 'Integrante',
          role: 'Primera Trompeta',
          instrument: 'Trompeta en Sib',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
          age: 28,
          hometown: 'Mazatlán, Sinaloa',
          quote: '«Los metales tienen que brillar con alegría y precisión en cada nota.»',
          bio: 'Virtuoso trompetista con formación orquestal y pasión por el regional mexicano.',
          fullBio: 'Carlos Morales aporta la agudeza y brillo en la sección de metales. Ha participado en grabaciones de estudio con artistas de talla internacional.',
          experienceYears: 9,
          status: 'Activo',
          joinedAt: '2017-06-15',
          galleryPhotos: [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop'
          ],
          videos: [],
          socials: {
            instagram: 'https://instagram.com/carlosmorales_trumpet'
          }
        },
        {
          id: 'blr-m4',
          name: 'Luis Mendoza',
          crewRole: 'Integrante',
          role: 'Clarinetista Principal',
          instrument: 'Clarinete en Sib',
          photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop',
          age: 29,
          hometown: 'Guasave, Sinaloa',
          quote: '«La dulzura del clarinete es el alma de las rancheras de antes.»',
          bio: 'Especialista en adornos y fraseos clásicos del estilo tradicional sinaloense.',
          fullBio: 'Luis Mendoza domina el clarinete con técnica impecable y agilidad melódica en las canciones más exigentes del repertorio.',
          experienceYears: 10,
          status: 'Activo',
          joinedAt: '2016-04-20',
          galleryPhotos: [
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop'
          ],
          videos: [],
          socials: {
            instagram: 'https://instagram.com/luismendoza_clarinete'
          }
        },
        {
          id: 'blr-m5',
          name: 'Javier Rocha',
          crewRole: 'Integrante',
          role: 'Tamborero & Percusiones',
          instrument: 'Tambora Tradicional y Platillos',
          photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop',
          age: 33,
          hometown: 'Culiacán, Sinaloa',
          quote: '«El golpe de la tambora hace que la gente no se quede sentada.»',
          bio: 'Fuerza rítmica inagotable que mantiene el pulso de fiesta en cada evento.',
          fullBio: 'Javier Rocha cuenta con más de 14 años tocando en las bandas más reconocidas del noroeste del país.',
          experienceYears: 14,
          status: 'Activo',
          joinedAt: '2015-09-01',
          galleryPhotos: [
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop'
          ],
          videos: [],
          socials: {
            instagram: 'https://instagram.com/javierrocha_tambora'
          }
        }
      ],
      posts: [
        {
          id: 'post-1',
          content: '¡Qué noche inolvidable en el Palenque de Guadalajara! Más de 6,000 personas cantando a una sola voz "Mi Reina Sinaloense". ¡Muchas gracias por tanto cariño!',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
          publishedAt: 'Hace 2 horas',
          likes: 1420,
          shares: 280,
          visibility: 'Publicada',
          sentiment: 'Positivo',
          isLikedByMe: false,
          comments: [
            {
              id: 'c-1',
              authorName: 'Mariana Valenzuela',
              avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
              text: '¡Estuvieron espectaculares! La mejor banda de todo México, tocaron todas mis favoritas.',
              at: 'Hace 1 hora',
              sentiment: 'Positivo',
              reply: '¡Gracias Mariana! Nos vemos pronto en la próxima fecha.',
              replyAuthor: 'Mateo Reyes',
              repliedAt: 'Hace 45 min'
            },
            {
              id: 'c-2',
              authorName: 'Héctor Gómez',
              avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
              text: '¿Cuándo vienen a Monterrey? Ya nos urge verlos en vivo.',
              at: 'Hace 40 min',
              sentiment: 'Positivo'
            }
          ]
        },
        {
          id: 'post-2',
          content: 'Preparando sorpresas en el estudio de grabación para nuestro próximo disco. Los metales vienen más bravos que nunca. ¿Qué estilo les gustaría escuchar en este nuevo álbum?',
          imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop',
          publishedAt: 'Ayer a las 18:30',
          likes: 980,
          shares: 115,
          visibility: 'Publicada',
          sentiment: 'Positivo',
          isLikedByMe: true,
          comments: [
            {
              id: 'c-3',
              authorName: 'Fernando Ruiz',
              avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
              text: '¡Unos corridos clásicos con clarinete de los buenos!',
              at: 'Ayer a las 19:10',
              sentiment: 'Positivo'
            }
          ]
        }
      ],
      tracks: [
        {
          id: 'trk-1',
          title: 'Mi Reina Sinaloense',
          genre: 'Banda Sinaloense',
          durationLabel: '3:42',
          releaseYear: '2024',
          plays: '12.4M',
          approval: 98,
          isPopular: true,
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
        },
        {
          id: 'trk-2',
          title: 'El Baile del Malecón',
          genre: 'Cumbia con Banda',
          durationLabel: '3:15',
          releaseYear: '2023',
          plays: '8.7M',
          approval: 95,
          isPopular: true,
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
        },
        {
          id: 'trk-3',
          title: 'Noches de Mazatlán',
          genre: 'Banda Romántica',
          durationLabel: '4:05',
          releaseYear: '2023',
          plays: '6.2M',
          approval: 94,
          isPopular: false,
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
        },
        {
          id: 'trk-4',
          title: 'Zapateado del Rey',
          genre: 'Zapateado Sinaloense',
          durationLabel: '2:58',
          releaseYear: '2022',
          plays: '4.9M',
          approval: 96,
          isPopular: false,
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
        }
      ],
      gallery: [
        { id: 'gal-1', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000', caption: 'Presentación estelar en Auditorio Telmex', category: 'En Vivo', uploadedAt: '2026-08-10' },
        { id: 'gal-2', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000', caption: 'Festival Arre Ciudad de México', category: 'En Vivo', uploadedAt: '2026-08-05' },
        { id: 'gal-3', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000', caption: 'Sesión fotográfica oficial 2026', category: 'Promocional', uploadedAt: '2026-07-20' },
        { id: 'gal-4', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000', caption: 'Backstage y preparación de metales', category: 'Backstage', uploadedAt: '2026-07-15' }
      ],
      videos: [
        { id: 'vid-1', title: 'Mix Estelar en Vivo - Palenque Texcoco', thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600', videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4', duration: '4:20', views: '2.1M', category: 'En Vivo' },
        { id: 'vid-2', title: 'Video Oficial - Mi Reina Sinaloense (4K)', thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '3:45', views: '8.4M', category: 'Oficial' }
      ]
    },
    'grp-1': {
      id: 'grp-1',
      name: 'Los Elegantes del Norte',
      avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
      genre: 'Norteño Sax',
      secondaryGenres: ['Norteño Clásico', 'Huapango', 'Cumbia Norteña'],
      foundedYear: 2015,
      originCity: 'Monterrey',
      state: 'Nuevo León',
      country: 'México',
      verified: true,
      platformJoinedAt: '2023-01-20',
      mixVideoTitle: 'Los Elegantes del Norte - Sesión Acústica Exclusiva Acordex',
      mixVideoThumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop',
      mixVideoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      totalHoursLogged: 720,
      history: 'Originarios de Monterrey, Nuevo León, Los Elegantes del Norte han revolucionado el género Norteño Sax con un sonido refinado y una ejecución virtuosa del acordeón y saxofón.',
      about: 'Pioneros del Norteño Sax contemporáneo, con presentaciones en las principales plazas de México y Estados Unidos.',
      officeAddress: 'Av. Constitución 2050, Obispado',
      officeCity: 'Monterrey, N.L.',
      bookingPhone: '+52 81 9928 1120',
      bookingEmail: 'booking@elegantesdelnorte.mx',
      managerName: 'Lic. Raúl Treviño',
      managerPhone: '+52 81 8300 4500',
      managerEmail: 'raul.trevino@elegantes.com',
      rating: 4.9,
      reviewCount: 98,
      followersCount: '1.4M',
      agendaStatus: 'Parcialmente Ocupado',
      liveStatus: 'Disponible',
      artistFeeBase: 320000,
      minimumHours: 3,
      sectionVisibility: defaultSectionVisibility(),
      audio: {
        hasOwnEquipment: true,
        engineerName: 'Ing. David Salinas',
        engineerPhone: '+52 81 9900 1234',
        consoleModel: 'Behringer WING Digital 48 Canales',
        speakersSetup: 'Sistema d&b audiotechnik',
        monitorsSetup: 'Sennheiser G4 In-Ear Systems',
        riderRequirements: [
          'Corriente 220V aterrizada independiente a 15 metros del escenario',
          'Tarima de 8m x 6m con alfombra de uso rudo'
        ]
      },
      socials: {
        instagram: 'https://instagram.com/elegantesdelnorte',
        facebook: 'https://facebook.com/elegantesdelnorte',
        spotify: 'https://open.spotify.com/artist/elegantesdelnorte'
      },
      milestones: [
        { year: '2024', title: 'Arena Monterrey Sold Out', description: 'Presentación estelar ante más de 14,000 asistentes.' }
      ],
      awards: ['Premios La Fiera 2023 - Agrupación Norteña del Año'],
      members: [
        {
          id: 'grp1-m1',
          name: 'Raúl Treviño',
          crewRole: 'Integrante',
          role: 'Director Musical & Vocalista',
          instrument: 'Voz Principal & Acordeón',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
          coverPhotoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
          age: 34,
          hometown: 'Monterrey, N.L.',
          quote: '«El acordeón es la voz de la gente del norte.»',
          bio: 'Líder y fundador con más de 15 años de trayectoria en el género norteño.',
          fullBio: 'Raúl Treviño es un referente del acordeón diatónico en el norte del país.',
          experienceYears: 15,
          status: 'Activo',
          joinedAt: '2015-02-01',
          galleryPhotos: [],
          videos: [],
          socials: { instagram: 'https://instagram.com/raultrevino' }
        },
        {
          id: 'grp1-m2',
          name: 'Esteban Salazar',
          crewRole: 'Integrante',
          role: 'Saxofonista Estelar',
          instrument: 'Saxofón Alto',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
          age: 29,
          hometown: 'Saltillo, Coah.',
          quote: '«El sax le da la elegancia al compás norteño.»',
          bio: 'Saxofonista virtuoso con fraseo limpio y melodioso.',
          fullBio: 'Esteban aporta el distintivo toque saxofonero que define al grupo.',
          experienceYears: 11,
          status: 'Activo',
          joinedAt: '2015-02-01',
          galleryPhotos: [],
          videos: [],
          socials: { instagram: 'https://instagram.com/estebansax' }
        }
      ],
      posts: [],
      tracks: [
        { id: 'trk-e1', title: 'Flor de Capomo (Versión Sax)', genre: 'Norteño Sax', durationLabel: '3:20', releaseYear: '2024', plays: '9.1M', approval: 97, isPopular: true, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }
      ],
      gallery: [],
      videos: []
    }
  };

  // ─────────────────────────────────────────────────────────────
  // INITIAL MOCK EVENTS
  // ─────────────────────────────────────────────────────────────
  private readonly INITIAL_EVENTS: GroupEventItem[] = [
    {
      id: 'EVT-101',
      title: 'Festival Arre 2026 - Escenario Principal',
      type: 'Festival Masivo',
      date: '2026-10-24',
      callTime: '17:30',
      showTime: '21:30',
      endTime: '23:30',
      venue: 'Autódromo Hermanos Rodríguez',
      city: 'Ciudad de México',
      state: 'CDMX',
      address: 'Viaducto Río de la Piedad s/n, Granjas México, Iztacalco, 08400 CDMX',
      googleMapsUrl: 'https://maps.google.com/?q=Autodromo+Hermanos+Rodriguez',
      wazeUrl: 'https://waze.com/ul?q=Autodromo+Hermanos+Rodriguez',
      capacity: 45000,
      expectedAttendance: 42000,
      status: 'Programado',
      dressCode: 'Traje de Gala Negro y Dorado Oficial',
      notes: 'Llegar puntuales a la caseta 4 para acceso de vehículos y gafetes de camerino.',
      honorarios: 550000,
      paymentStatus: 'Anticipo 50%',
      contactPerson: 'Lic. Andrés Martínez (Promotor OCESA)',
      contactPhone: '+52 55 5000 8000',
      audioEquipmentConfirmed: true,
      evidences: [
        {
          id: 'ev-1',
          url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200',
          caption: 'Foto oficial del cartel y escenario principal',
          type: 'photo',
          category: 'Prensa',
          uploadedAt: '2026-08-01',
          uploadedByName: 'Mateo Reyes'
        }
      ]
    },
    {
      id: 'EVT-102',
      title: 'Boda de Gala Familia Garza - Salón Las Nubes',
      type: 'Boda / Evento Privado',
      date: '2026-09-19',
      callTime: '20:00',
      showTime: '22:30',
      endTime: '02:30',
      venue: 'Hacienda Las Nubes Grand Event Venue',
      city: 'San Pedro Garza García',
      state: 'Nuevo León',
      address: 'Av. Alfonso Reyes 1050, Valle del Campestre, 66265 San Pedro Garza García, N.L.',
      googleMapsUrl: 'https://maps.google.com/?q=Valle+del+Campestre+San+Pedro',
      capacity: 650,
      expectedAttendance: 600,
      status: 'Programado',
      dressCode: 'Esmoquin Formal Azul Marino / Accesorios Dorados',
      notes: 'El vals de los novios será con el tema "Mi Reina Sinaloense" a las 23:00 hrs.',
      honorarios: 380000,
      paymentStatus: 'Liquidado',
      contactPerson: 'Sra. Patricia Garza (Cliente Contratante)',
      contactPhone: '+52 81 1234 5678',
      audioEquipmentConfirmed: true,
      evidences: []
    },
    {
      id: 'EVT-103',
      title: 'Firma de Autógrafos & Convivencia Fan Zone Oficial',
      type: 'Firma de Autógrafos',
      date: '2026-09-12',
      callTime: '16:00',
      showTime: '17:00',
      endTime: '20:00',
      venue: 'Plaza Las Américas Fan Zone',
      city: 'Mazatlán',
      state: 'Sinaloa',
      address: 'Av. Reforma 200, Fracc. Flamingos, 82149 Mazatlán, Sin.',
      capacity: 1200,
      expectedAttendance: 1100,
      status: 'Programado',
      dressCode: 'Camisa Casual Bordada Oficial Acordex',
      notes: 'Se firmarán pósters oficiales y se rifarán 5 pases dobles para el próximo concierto.',
      honorarios: 120000,
      paymentStatus: 'Liquidado',
      contactPerson: 'Don Pedro Reyes (Manager)',
      contactPhone: '+52 33 1234 5678',
      audioEquipmentConfirmed: true,
      evidences: []
    },
    {
      id: 'EVT-100-COMPLETED',
      title: 'Gran Baile de Aniversario en Palenque de Guadalajara',
      type: 'Palenque',
      date: '2026-07-28',
      callTime: '21:00',
      showTime: '23:30',
      endTime: '03:00',
      venue: 'Palenque Fiestas de Octubre',
      city: 'Guadalajara',
      state: 'Jalisco',
      address: 'Club de Leones 50, Auditorio, 45180 Zapopan, Jal.',
      capacity: 6500,
      expectedAttendance: 6500,
      status: 'Completado',
      dressCode: 'Traje Charro Estilizado Vino y Oro',
      honorarios: 420000,
      paymentStatus: 'Liquidado',
      contactPerson: 'Comité Organizador Palenque',
      contactPhone: '+52 33 3818 2800',
      audioEquipmentConfirmed: true,
      performanceRating: 5,
      performanceNotes: 'Lleno total. La interacción con el público fue extraordinaria, se tocaron 40 minutos extra.',
      evidences: [
        {
          id: 'ev-comp-1',
          url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200',
          caption: 'Ovación del público en el redondel del palenque',
          type: 'photo',
          category: 'En Vivo',
          uploadedAt: '2026-07-29',
          uploadedByName: 'Santiago Beltrán'
        },
        {
          id: 'ev-comp-2',
          url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200',
          caption: 'Foto con fans ganadores del Meet & Greet',
          type: 'photo',
          category: 'Meet & Greet',
          uploadedAt: '2026-07-29',
          uploadedByName: 'Mateo Reyes'
        }
      ]
    }
  ];

  // ─────────────────────────────────────────────────────────────
  // INITIAL MOCK QUOTES (COTIZACIONES)
  // ─────────────────────────────────────────────────────────────
  private readonly INITIAL_QUOTES: QuoteItem[] = [
    {
      id: 'quote-101',
      folio: 'ACX-4912',
      clientName: 'Carlos Fuentes',
      clientEmail: 'carlos.fuentes@gmail.com',
      clientPhone: '+52 81 1234 5678',
      clientCompany: 'Particular',
      groupName: 'Banda Los Reyes',
      groupId: 'banda-los-reyes',
      eventType: 'Boda / Evento Social',
      proposedDate: '2026-11-20',
      eventTime: '21:00',
      venue: 'Casino Monterrey Grand Salón',
      city: 'Monterrey, N.L.',
      durationHours: 5,
      totalAmount: 380000,
      artistFee: 320000,
      state: 'Aceptada',
      paymentStatus: 'Anticipo 50%',
      notes: 'Solicitamos 5 horas continuas con entrada triunfal de novios tocando "Mi Reina Sinaloense".',
      createdAt: '2026-08-10',
      isDirectChatAccepted: true,
      directChatAcceptedAt: '2026-08-11 10:30',
      directChatAcceptedBy: 'Mateo Reyes',
      chatHistory: [
        {
          id: 'msg-1',
          senderName: 'Carlos Fuentes',
          senderRole: 'Cliente',
          senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
          message: '¡Hola Mateo y Banda Los Reyes! Estamos muy emocionados de contar con ustedes en nuestra boda. Queríamos revisar si es posible agregar 2 temas específicos al repertorio del inicio.',
          timestamp: '2026-08-11 11:15'
        },
        {
          id: 'msg-2',
          senderName: 'Mateo Reyes',
          senderRole: 'Grupo Musical',
          senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
          message: '¡Qué tal Carlos! Muchísimas felicidades por su boda. Claro que sí, con todo gusto las montamos para ese día. Pásanos los nombres de las canciones y las dejamos listas en los ensayos.',
          timestamp: '2026-08-11 11:22'
        }
      ]
    },
    {
      id: 'quote-102',
      folio: 'ACX-7821',
      clientName: 'Ing. Marcelo Villarreal',
      clientEmail: 'marcelo.villarreal@corporativovg.com',
      clientPhone: '+52 33 9988 7766',
      clientCompany: 'Corporativo VG Logistics',
      groupName: 'Banda Los Reyes',
      groupId: 'banda-los-reyes',
      eventType: 'Aniversario Empresarial de Gala',
      proposedDate: '2026-12-05',
      eventTime: '20:30',
      venue: 'Hacienda El Centenario Mundo Cuervo',
      city: 'Tequila, Jalisco',
      durationHours: 4,
      totalAmount: 360000,
      artistFee: 300000,
      state: 'Propuesta enviada',
      paymentStatus: 'Pendiente',
      notes: 'Evento corporativo de fin de año para 400 directivos y clientes clave. Requerimos factura fiscal.',
      createdAt: '2026-08-15',
      isDirectChatAccepted: false // PENDIENTE DE ACEPTAR POR EL GRUPO
    },
    {
      id: 'quote-103',
      folio: 'ACX-8933',
      clientName: 'Lic. Claudia Montero',
      clientEmail: 'cmontero@feriasmexico.org',
      clientPhone: '+52 44 2100 4567',
      clientCompany: 'Patronato de la Feria de Querétaro',
      groupName: 'Banda Los Reyes',
      groupId: 'banda-los-reyes',
      eventType: 'Concierto Masivo / Teatro del Pueblo',
      proposedDate: '2026-12-18',
      eventTime: '22:00',
      venue: 'Eco Centro Expositor',
      city: 'Querétaro, Qro.',
      durationHours: 3,
      totalAmount: 480000,
      artistFee: 420000,
      state: 'En revisión',
      paymentStatus: 'Pendiente',
      notes: 'Presentación estelar de noche de cierre. Se incluye backline y sonido masivo del recinto.',
      createdAt: '2026-08-16',
      isDirectChatAccepted: false // PENDIENTE DE ACEPTAR POR EL GRUPO
    }
  ];

  // ─────────────────────────────────────────────────────────────
  // INITIAL MOCK 24H STORIES
  // ─────────────────────────────────────────────────────────────
  private readonly INITIAL_STORIES: StoryItem[] = [
    {
      id: 'st-1',
      groupId: 'banda-los-reyes',
      groupName: 'Banda Los Reyes',
      authorName: 'Mateo Reyes',
      mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop',
      mediaType: 'image',
      caption: '¡Probando sonido en Guadalajara! 🔥🎺',
      locationTag: 'Palenque Guadalajara, JAL',
      musicTag: 'Mi Reina Sinaloense (En Vivo)',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 21 * 3600 * 1000).toISOString(),
      viewsCount: 4320,
      viewers: [
        { id: 'v-1', name: 'Mariana Valenzuela', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80', viewedAt: 'Hace 2 horas', isFan: true },
        { id: 'v-2', name: 'Carlos Fuentes', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80', viewedAt: 'Hace 1 hora', isFan: false },
        { id: 'v-3', name: 'Don Pedro Reyes', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80', viewedAt: 'Hace 45 min', isFan: false }
      ]
    },
    {
      id: 'st-2',
      groupId: 'banda-los-reyes',
      groupName: 'Banda Los Reyes',
      authorName: 'Santiago Beltrán',
      mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
      mediaType: 'image',
      caption: 'Afinando la tuba antes de subir a tarima 🎶✨',
      locationTag: 'Camerinos VIP',
      musicTag: 'Zapateado del Rey',
      createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      viewsCount: 3180,
      viewers: []
    }
  ];

  // ─────────────────────────────────────────────────────────────
  // INITIAL MOCK NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────
  private readonly INITIAL_NOTIFICATIONS: GroupNotification[] = [
    {
      id: 'notif-1',
      title: 'Nueva Solicitud de Cotización',
      message: 'Marcelo Villarreal ha cotizado a Banda Los Reyes para su Aniversario Empresarial (Folio ACX-7821).',
      category: 'cotizacion',
      timestamp: 'Hace 20 min',
      read: false,
      priority: 'Alta',
      actionRoute: '/chat',
      actionLabel: 'Ver Cotización',
      targetId: 'quote-102'
    },
    {
      id: 'notif-2',
      title: 'Anticipo Confirmado por Administración',
      message: 'Se confirmó el anticipo de $190,000 MXN para el evento Boda Familia Garza (Folio ACX-4912).',
      category: 'pago',
      timestamp: 'Hace 2 horas',
      read: false,
      priority: 'Normal',
      actionRoute: '/calendario',
      actionLabel: 'Ver en Agenda',
      targetId: 'EVT-102'
    },
    {
      id: 'notif-3',
      title: 'Mensaje de tu Manager',
      message: 'Don Pedro Reyes: "Revisen el horario de soundcheck para el Festival Arre, se adelantó 30 minutos".',
      category: 'mensaje',
      timestamp: 'Ayer',
      read: true,
      priority: 'Urgente',
      actionRoute: '/chat',
      actionLabel: 'Abrir Chat'
    },
    {
      id: 'notif-4',
      title: '¡Nueva Reseña de 5 Estrellas!',
      message: 'Familia Mendoza calificó su presentación en Casino Monterrey con 5 estrellas y dejó un comentario elogioso.',
      category: 'fans',
      timestamp: 'Hace 2 días',
      read: true,
      priority: 'Normal',
      actionRoute: '/publicaciones',
      actionLabel: 'Ver Muro'
    }
  ];

  // ─────────────────────────────────────────────────────────────
  // SAFE DATA INITIALIZERS
  // ─────────────────────────────────────────────────────────────
  private loadInitialProfiles(): Record<string, GroupProfile> {
    try {
      const stored = this.storage.getItem<Record<string, GroupProfile>>(STORAGE_KEYS.PROFILES, this.INITIAL_PROFILES);
      if (!stored || typeof stored !== 'object' || Object.keys(stored).length === 0) {
        return this.INITIAL_PROFILES;
      }
      const result: Record<string, GroupProfile> = { ...this.INITIAL_PROFILES };
      for (const key of Object.keys(stored)) {
        const p = stored[key];
        if (p && p.name) {
          const fallback = this.INITIAL_PROFILES[key] || this.INITIAL_PROFILES['banda-los-reyes'];
          result[key] = {
            ...fallback,
            ...p,
            members: Array.isArray(p.members) && p.members.length > 0 ? p.members : fallback.members,
            posts: Array.isArray(p.posts) ? p.posts : (fallback.posts || []),
            tracks: Array.isArray(p.tracks) ? p.tracks : (fallback.tracks || []),
            gallery: Array.isArray(p.gallery) ? p.gallery : (fallback.gallery || []),
            videos: Array.isArray(p.videos) ? p.videos : (fallback.videos || []),
            sectionVisibility: p.sectionVisibility || fallback.sectionVisibility || defaultSectionVisibility(),
            audio: p.audio || fallback.audio,
            socials: p.socials || fallback.socials
          };
        }
      }
      return result;
    } catch {
      return this.INITIAL_PROFILES;
    }
  }

  private loadInitialQuotes(): QuoteItem[] {
    try {
      const stored = this.storage.getItem<QuoteItem[]>(STORAGE_KEYS.QUOTES, this.INITIAL_QUOTES);
      if (Array.isArray(stored) && stored.length > 0) return stored;
      return this.INITIAL_QUOTES;
    } catch {
      return this.INITIAL_QUOTES;
    }
  }

  private loadInitialEvents(): GroupEventItem[] {
    try {
      const stored = this.storage.getItem<GroupEventItem[]>(STORAGE_KEYS.EVENTS, this.INITIAL_EVENTS);
      if (Array.isArray(stored) && stored.length > 0) return stored;
      return this.INITIAL_EVENTS;
    } catch {
      return this.INITIAL_EVENTS;
    }
  }

  private loadInitialStories(): StoryItem[] {
    try {
      const stored = this.storage.getItem<StoryItem[]>(STORAGE_KEYS.STORIES, this.INITIAL_STORIES);
      if (Array.isArray(stored) && stored.length > 0) return stored;
      return this.INITIAL_STORIES;
    } catch {
      return this.INITIAL_STORIES;
    }
  }

  private loadInitialNotifications(): GroupNotification[] {
    try {
      const stored = this.storage.getItem<GroupNotification[]>(STORAGE_KEYS.NOTIFICATIONS, this.INITIAL_NOTIFICATIONS);
      if (Array.isArray(stored) && stored.length > 0) return stored;
      return this.INITIAL_NOTIFICATIONS;
    } catch {
      return this.INITIAL_NOTIFICATIONS;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // REACTIVE STATE SIGNALS
  // ─────────────────────────────────────────────────────────────
  readonly profiles = signal<Record<string, GroupProfile>>(
    this.loadInitialProfiles()
  );

  readonly quotes = signal<QuoteItem[]>(
    this.loadInitialQuotes()
  );

  readonly events = signal<GroupEventItem[]>(
    this.loadInitialEvents()
  );

  readonly stories = signal<StoryItem[]>(
    this.loadInitialStories()
  );

  readonly notifications = signal<GroupNotification[]>(
    this.loadInitialNotifications()
  );

  // Active Group ID & Member ID
  readonly activeGroupId = signal<string>(
    this.storage.getItem(STORAGE_KEYS.ACTIVE_GROUP_ID, 'banda-los-reyes')
  );

  readonly activeMemberId = signal<string>(
    this.storage.getItem(STORAGE_KEYS.ACTIVE_MEMBER_ID, 'blr-m1')
  );

  // ─────────────────────────────────────────────────────────────
  // COMPUTED PROPERTIES (WITH FULL NULL SAFETY)
  // ─────────────────────────────────────────────────────────────
  readonly activeProfile = computed<GroupProfile>(() => {
    const map = this.profiles() || this.INITIAL_PROFILES;
    const id = this.activeGroupId();
    return (map && map[id]) || (map && map['banda-los-reyes']) || (map && Object.values(map)[0]) || this.INITIAL_PROFILES['banda-los-reyes'];
  });

  readonly activeMember = computed<GroupMember>(() => {
    const profile = this.activeProfile();
    const fallbackMember = this.INITIAL_PROFILES['banda-los-reyes'].members[0];
    if (!profile || !Array.isArray(profile.members) || profile.members.length === 0) {
      return fallbackMember;
    }
    const memberId = this.activeMemberId();
    const found = profile.members.find(m => m.id === memberId);
    return found || profile.members[0] || fallbackMember;
  });

  readonly activeGroupSummaryList = computed<GroupItemSummary[]>(() => {
    const map = this.profiles() || this.INITIAL_PROFILES;
    return Object.values(map).map(p => ({
      id: p.id,
      slug: p.slug || p.id,
      name: p.name || 'Grupo Musical',
      genre: p.genre || 'Regional Mexicano',
      rating: p.rating || 4.9,
      image: p.avatarUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
      membersCount: p.members ? p.members.length : 1,
      followersCount: p.followersCount || '10K',
      groupLeaderName: p.members?.[0]?.name || p.managerName || 'Director',
      groupLeaderRole: p.members?.[0]?.role || 'Director Musical',
      agendaStatus: p.agendaStatus || 'Parcialmente Ocupado',
      liveStatus: p.liveStatus || 'Disponible'
    }));
  });

  readonly unreadNotificationsCount = computed<number>(() => {
    const list = this.notifications();
    return Array.isArray(list) ? list.filter(n => !n.read).length : 0;
  });

  readonly pendingQuotesCount = computed<number>(() => {
    const gid = this.activeGroupId();
    const profile = this.activeProfile();
    const list = this.quotes();
    if (!Array.isArray(list)) return 0;
    return list.filter(q => q && (q.groupId === gid || q.groupName === profile.name) && !q.isDirectChatAccepted).length;
  });

  readonly upcomingEvents = computed<GroupEventItem[]>(() => {
    const list = this.events();
    if (!Array.isArray(list)) return [];
    return list.filter(e => e && (e.status === 'Programado' || e.status === 'En Curso'));
  });

  readonly completedEvents = computed<GroupEventItem[]>(() => {
    const list = this.events();
    if (!Array.isArray(list)) return [];
    return list.filter(e => e && e.status === 'Completado');
  });

  readonly posts = computed<any[]>(() => {
    const p = this.activeProfile();
    if (!p || !Array.isArray(p.posts)) return [];
    return p.posts.map(post => ({
      ...post,
      authorName: this.activeMember()?.name || p.name,
      authorPhotoUrl: this.activeMember()?.photoUrl || p.avatarUrl,
      authorRole: this.activeMember()?.role || 'Agrupación Oficial',
      timestamp: (post as any).publishedAt || 'Reciente',
      likesCount: (post as any).likes ?? 0,
      isLikedByMe: (post as any).isLikedByMe ?? false,
      comments: (post as any).comments || []
    }));
  });

  deletePost(postId: string): void {
    const p = this.activeProfile();
    if (!p || !p.posts) return;
    const updated = {
      ...p,
      posts: p.posts.filter(item => item.id !== postId)
    };
    this.updateProfile(updated);
  }

  addCommentToPost(postId: string, commentText: string): void {
    if (!commentText?.trim()) return;
    const p = this.activeProfile();
    const m = this.activeMember();
    if (!p || !p.posts) return;
    const newComment = {
      id: `comm-${Date.now()}`,
      authorName: m.name,
      authorAvatar: m.photoUrl,
      avatarUrl: m.photoUrl,
      comment: commentText.trim(),
      text: commentText.trim(),
      timestamp: 'Justo ahora',
      at: 'Justo ahora',
      sentiment: 'Positivo' as const
    };
    const updated = {
      ...p,
      posts: p.posts.map(item => {
        if (item.id === postId) {
          return {
            ...item,
            comments: [...(item.comments || []), newComment as any]
          };
        }
        return item;
      })
    };
    this.updateProfile(updated);
  }

  // ─────────────────────────────────────────────────────────────
  // IDENTITY & GROUP SWITCHING (EQUAL ACCESS FOR ANY MEMBER)
  // ─────────────────────────────────────────────────────────────
  setActiveGroup(groupId: string): void {
    if (this.profiles()[groupId]) {
      this.activeGroupId.set(groupId);
      this.storage.setItem(STORAGE_KEYS.ACTIVE_GROUP_ID, groupId);
      const firstMember = this.profiles()[groupId].members[0];
      if (firstMember) {
        this.setActiveMember(firstMember.id);
      }
    }
  }

  setActiveMember(memberId: string): void {
    this.activeMemberId.set(memberId);
    this.storage.setItem(STORAGE_KEYS.ACTIVE_MEMBER_ID, memberId);
  }

  setLiveActivityStatus(status: LiveActivityStatus): void {
    const current = this.activeProfile();
    const updated: GroupProfile = { ...current, liveStatus: status };
    this.updateProfile(updated);
  }

  // ─────────────────────────────────────────────────────────────
  // PROFILE & SETTINGS MUTATIONS
  // ─────────────────────────────────────────────────────────────
  updateProfile(updated: GroupProfile): void {
    this.profiles.update(map => {
      const next = { ...map, [updated.id]: updated };
      this.storage.setItem(STORAGE_KEYS.PROFILES, next);
      
      // Sincronización espejo para clients_web
      try {
        const json = JSON.stringify(updated);
        localStorage.setItem(`acordex_band_override_${updated.id}`, json);
        if (updated.slug) {
          localStorage.setItem(`acordex_band_override_${updated.slug}`, json);
        }
      } catch (e) {
        console.warn('Sync override error', e);
      }

      // Sincronización espejo para admins_web
      try {
        const groupsRaw = localStorage.getItem('acordex_groups');
        if (groupsRaw) {
          const groups = JSON.parse(groupsRaw);
          if (Array.isArray(groups)) {
            const updatedGroups = groups.map((g: any) => {
              if (g.id === updated.id || g.name === updated.name) {
                return {
                  ...g,
                  name: updated.name,
                  genre: updated.genre,
                  image: updated.avatarUrl,
                  membersCount: updated.members.length,
                  groupLeaderName: updated.members[0]?.name || updated.managerName
                };
              }
              return g;
            });
            localStorage.setItem('acordex_groups', JSON.stringify(updatedGroups));
          }
        }
      } catch (e) {
        console.warn('Sync admins groups error', e);
      }

      return next;
    });
  }

  updateMemberInfo(memberId: string, data: Partial<GroupMember>): void {
    const current = this.activeProfile();
    const updatedMembers = current.members.map(m => {
      if (m.id === memberId) {
        return { ...m, ...data };
      }
      return m;
    });
    this.updateProfile({ ...current, members: updatedMembers });
  }

  // ─────────────────────────────────────────────────────────────
  // POSTS & WALL MUTATIONS
  // ─────────────────────────────────────────────────────────────
  createPost(content: string, imageUrl?: string, visibility: any = 'Publicada'): void {
    const current = this.activeProfile();
    const newPost: GroupPost = {
      id: `post-${Date.now()}`,
      content,
      imageUrl,
      publishedAt: 'Justo ahora',
      likes: 0,
      shares: 0,
      visibility,
      sentiment: 'Positivo',
      comments: [],
      isLikedByMe: false
    };

    const updatedPosts = [newPost, ...current.posts];
    this.updateProfile({ ...current, posts: updatedPosts });
  }

  toggleLikePost(postId: string): void {
    const current = this.activeProfile();
    const updatedPosts = current.posts.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLikedByMe;
        return {
          ...p,
          isLikedByMe: isLiked,
          likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1)
        };
      }
      return p;
    });
    this.updateProfile({ ...current, posts: updatedPosts });
  }

  replyToComment(postId: string, commentId: string, replyText: string): void {
    const current = this.activeProfile();
    const author = this.activeMember().name;
    const updatedPosts = current.posts.map(p => {
      if (p.id === postId) {
        const updatedComments = p.comments.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              reply: replyText,
              replyAuthor: author,
              repliedAt: 'Justo ahora'
            };
          }
          return c;
        });
        return { ...p, comments: updatedComments };
      }
      return p;
    });
    this.updateProfile({ ...current, posts: updatedPosts });
  }

  // ─────────────────────────────────────────────────────────────
  // 24H STORIES MUTATIONS
  // ─────────────────────────────────────────────────────────────
  addStory(mediaUrl: string, mediaType: 'image' | 'video', caption?: string, locationTag?: string, musicTag?: string): void {
    const profile = this.activeProfile();
    const member = this.activeMember();
    const newStory: StoryItem = {
      id: `story-${Date.now()}`,
      groupId: profile.id,
      groupName: profile.name,
      authorName: member.name,
      mediaUrl,
      mediaType,
      caption,
      locationTag,
      musicTag,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      viewsCount: 0,
      viewers: [],
      isSeenByMe: true
    };

    this.stories.update(list => {
      const updated = [newStory, ...list];
      this.storage.setItem(STORAGE_KEYS.STORIES, updated);
      return updated;
    });
  }

  deleteStory(storyId: string): void {
    this.stories.update(list => {
      const updated = list.filter(s => s.id !== storyId);
      this.storage.setItem(STORAGE_KEYS.STORIES, updated);
      return updated;
    });
  }

  // ─────────────────────────────────────────────────────────────
  // EVENT EVIDENCES MUTATIONS
  // ─────────────────────────────────────────────────────────────
  addEventEvidence(eventId: string, evidence: Omit<EventEvidenceItem, 'id' | 'uploadedAt' | 'uploadedByName'>): void {
    const member = this.activeMember();
    const newEvidence: EventEvidenceItem = {
      ...evidence,
      id: `evid-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedByName: member.name
    };

    this.events.update(list => {
      const updated = list.map(ev => {
        if (ev.id === eventId) {
          return { ...ev, evidences: [newEvidence, ...ev.evidences] };
        }
        return ev;
      });
      this.storage.setItem(STORAGE_KEYS.EVENTS, updated);
      return updated;
    });

    // Also link into profile general gallery if it is a photo
    if (evidence.type === 'photo') {
      const profile = this.activeProfile();
      const newGalleryItem: GalleryImage = {
        id: newEvidence.id,
        url: evidence.url,
        caption: evidence.caption,
        category: evidence.category === 'En Vivo' ? 'En Vivo' : 'Backstage',
        uploadedAt: newEvidence.uploadedAt,
        eventId: eventId,
        eventName: this.events().find(e => e.id === eventId)?.title
      };
      this.updateProfile({ ...profile, gallery: [newGalleryItem, ...profile.gallery] });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // COTIZACIONES & CHAT AUTHORIZATION
  // ─────────────────────────────────────────────────────────────
  acceptQuoteDirectChat(quoteId: string): void {
    const member = this.activeMember();
    this.quotes.update(list => {
      const updated = list.map(q => {
        if (q.id === quoteId) {
          return {
            ...q,
            isDirectChatAccepted: true,
            directChatAcceptedAt: new Date().toLocaleString('es-MX'),
            directChatAcceptedBy: member.name,
            chatHistory: q.chatHistory || []
          };
        }
        return q;
      });
      this.storage.setItem(STORAGE_KEYS.QUOTES, updated);
      return updated;
    });

    // Notify
    this.addNotification({
      title: 'Chat con Cliente Activado',
      message: `Has habilitado la línea directa con el cliente de la cotización ${quoteId}.`,
      category: 'mensaje',
      priority: 'Alta',
      actionRoute: '/chat',
      actionLabel: 'Ir al Chat'
    });
  }

  sendQuoteChatMessage(quoteId: string, messageText: string, attachmentUrl?: string, attachmentType?: 'image' | 'audio' | 'document'): void {
    const member = this.activeMember();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: member.name,
      senderRole: 'Grupo Musical',
      senderAvatar: member.photoUrl,
      message: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachmentUrl,
      attachmentType
    };

    this.quotes.update(list => {
      const updated = list.map(q => {
        if (q.id === quoteId) {
          return {
            ...q,
            chatHistory: [...(q.chatHistory || []), newMsg]
          };
        }
        return q;
      });
      this.storage.setItem(STORAGE_KEYS.QUOTES, updated);
      return updated;
    });
  }

  // ─────────────────────────────────────────────────────────────
  // NOTIFICATIONS MUTATIONS
  // ─────────────────────────────────────────────────────────────
  addNotification(notif: Omit<GroupNotification, 'id' | 'timestamp' | 'read'>): void {
    const newNotif: GroupNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Justo ahora',
      read: false
    };
    this.notifications.update(list => {
      const updated = [newNotif, ...list];
      this.storage.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
      return updated;
    });
  }

  markNotificationAsRead(id: string): void {
    this.notifications.update(list => {
      const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
      this.storage.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
      return updated;
    });
  }

  markAllNotificationsAsRead(): void {
    this.notifications.update(list => {
      const updated = list.map(n => ({ ...n, read: true }));
      this.storage.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);
      return updated;
    });
  }
}
