import { GroupProfile, SectionVisibilityConfig, defaultSectionVisibility } from '../groups/group-profile.model';

/**
 * Modelo de la vista previa pública.
 *
 * Es una réplica de la forma que consume `clients_web` en `/grupo/:id`. Existe
 * como capa aparte a propósito: el expediente administrativo tiene campos que
 * el cliente nunca ve (salarios, bitácora, contrato, comisiones), y mezclarlos
 * en la misma estructura haría fácil filtrar por error algo interno a la vista
 * pública. Aquí solo entra lo publicable.
 */

export interface PreviewStat {
  label: string;
  value: string;
  icon: string;
}

export interface PreviewMember {
  id: string;
  name: string;
  role: string;
  instrument: string;
  photoUrl: string;
  quote: string;
  experienceYears: number;
  hometown: string;
  age?: number;
  bio?: string;
  coverPhotoUrl?: string;
}

export interface PreviewTrack {
  title: string;
  genre: string;
  duration: string;
  year: string;
  plays: string;
  isPopular: boolean;
}

export interface PreviewMilestone {
  year: string;
  title: string;
  description: string;
}

export interface PreviewPost {
  id: string;
  content: string;
  imageUrl?: string;
  publishedAt: string;
  likes: number;
  comments: number;
}

export interface PreviewReview {
  id: string;
  clientName: string;
  avatarUrl: string;
  eventName: string;
  eventDate: string;
  rating: number;
  comment: string;
}

export interface PreviewEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  venue: string;
  city: string;
}

export interface PreviewGalleryImage {
  url: string;
  caption: string;
  category: string;
}

export interface PreviewVideo {
  title: string;
  thumbnailUrl: string;
  duration: string;
  views: string;
}

export interface PreviewSocial {
  id: string;
  url: string;
}

export interface GroupPreview {
  id: string;
  name: string;
  avatarUrl: string;
  coverUrl: string;
  genre: string;
  secondaryGenres: string[];
  originCity: string;
  foundedYear: number;
  about: string;
  rating: number;
  reviewCount: number;
  approvalPercent: number;
  followersLabel: string;
  availability: string;
  membersCount: number;

  /** Etiqueta bajo el nombre. Se deriva del género, no se guarda aparte. */
  tag: string;
  verified: boolean;
  managerName: string;
  location: string;
  totalHoursLogged: number;
  mixVideoTitle: string;
  mixVideoThumbnailUrl: string;
  /** Texto largo de "Historia y Trayectoria". */
  history: string;
  /** Antigüedad en la plataforma, ya redactada (ej. "3 años en Acordex"). */
  seniorityLabel: string;
  platformJoinedAt: string;

  /** Precio de referencia que ve el cliente, ya redactado. */
  priceLabel: string;
  minimumHoursLabel: string;

  bookingPhone: string;
  bookingEmail: string;
  officeAddress: string;

  visibility: SectionVisibilityConfig;

  stats: PreviewStat[];
  members: PreviewMember[];
  crew: PreviewMember[];
  milestones: PreviewMilestone[];
  awards: string[];
  tracks: PreviewTrack[];
  repertoireByGenre: { genre: string; tracks: PreviewTrack[] }[];
  posts: PreviewPost[];
  reviews: PreviewReview[];
  events: PreviewEvent[];
  gallery: PreviewGalleryImage[];
  videos: PreviewVideo[];
  socials: PreviewSocial[];
  riderRequirements: string[];
  hasOwnAudio: boolean;
}

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-MX');

/**
 * Traduce el expediente administrativo a lo que vería un cliente.
 *
 * Aquí es donde se decide qué se publica y qué no: las publicaciones ocultas o
 * privadas se filtran, y los integrantes dados de baja no aparecen, igual que
 * ocurriría en el portal real.
 */
/** Cómo se anuncia la disponibilidad según el estado de agenda del grupo. */
function availabilityFrom(agendaStatus: string | undefined): string {
  switch (agendaStatus) {
    case 'Agenda Llena': return 'Agenda llena por ahora';
    case 'Parcialmente Ocupado': return 'Fechas limitadas disponibles';
    default: return 'Disponible para contratación';
  }
}

/** Antigüedad en la plataforma, redactada a partir de la fecha de alta. */
function seniorityFrom(joinedAt: string): string {
  const joined = new Date(joinedAt + 'T00:00:00');
  if (isNaN(joined.getTime())) return 'Nuevo en Acordex';

  const years = Math.floor((Date.now() - joined.getTime()) / (365.25 * 24 * 3600 * 1000));
  if (years < 1) return 'Menos de 1 año en Acordex';
  return years === 1 ? '1 año en Acordex' : `${years} años en Acordex`;
}

/**
 * @param agendaStatus Estado de agenda del catálogo; de ahí sale la
 * disponibilidad que se anuncia, en vez de un campo aparte que podría
 * contradecirlo.
 */
export function toPreview(profile: GroupProfile, agendaStatus?: string): GroupPreview {
  const publicPosts = profile.posts.filter(p => p.visibility === 'Publicada');
  const activeMembers = profile.members.filter(m => m.status !== 'Baja');
  const musicians = activeMembers.filter(m => m.crewRole === 'Integrante');

  const ratings = profile.reviews.map(r => r.rating);
  const rating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : 0;
  const approval = profile.reviews.length
    ? Math.round((profile.reviews.filter(r => r.rating >= 4).length / profile.reviews.length) * 100)
    : 0;

  const completed = profile.events.filter(e => e.status === 'Completado');
  const totalAttendance = profile.events.reduce((s, e) => s + (e.attendance || 0), 0);

  const tracks: PreviewTrack[] = profile.tracks.map(t => ({
    title: t.title,
    genre: t.genre,
    duration: t.durationLabel,
    year: t.releaseYear,
    plays: t.plays,
    isPopular: !!t.isPopular
  }));

  const byGenre = new Map<string, PreviewTrack[]>();
  for (const t of tracks) {
    byGenre.set(t.genre, [...(byGenre.get(t.genre) || []), t]);
  }

  return {
    id: profile.id,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    coverUrl: profile.coverUrl,
    genre: profile.genre,
    secondaryGenres: profile.secondaryGenres,
    originCity: profile.originCity,
    foundedYear: profile.foundedYear,
    about: profile.about,
    rating,
    reviewCount: profile.reviews.length,
    approvalPercent: approval,
    followersLabel: formatFollowers(profile.social.followers),
    availability: availabilityFrom(agendaStatus),
    membersCount: musicians.length,

    // La etiqueta del portal es el género: se deriva, no se duplica.
    tag: profile.genre,
    verified: profile.verified,
    managerName: profile.representatives.find(r => r.isPrimary)?.contactName ?? '',
    location: profile.officeCity || profile.originCity,
    totalHoursLogged: profile.totalHoursLogged,
    mixVideoTitle: profile.mixVideoTitle,
    mixVideoThumbnailUrl: profile.mixVideoThumbnailUrl,
    history: profile.history,
    seniorityLabel: seniorityFrom(profile.platformJoinedAt),
    platformJoinedAt: profile.platformJoinedAt,

    priceLabel: money(profile.baseRate.suggestedFee),
    minimumHoursLabel: `${profile.baseRate.minimumHours} horas mínimas`,

    bookingPhone: profile.bookingPhone,
    bookingEmail: profile.bookingEmail,
    officeAddress: profile.officeAddress || 'Av. Constitución 1800, Piso 14, Col. Centro',

    visibility: profile.sectionVisibility || defaultSectionVisibility(),

    // Las cuatro estadísticas del portal, en su mismo orden.
    stats: [
      { label: 'Eventos', value: `${completed.length}+`, icon: 'event_available' },
      { label: 'Horas', value: `${profile.totalHoursLogged} hrs`, icon: 'schedule' },
      { label: 'Satisfacción', value: `${approval}%`, icon: 'thumb_up' },
      { label: 'Músicos', value: `${musicians.length} Músicos`, icon: 'diversity_3' }
    ],

    members: musicians.map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
      instrument: m.instrument || '',
      photoUrl: m.photoUrl,
      quote: m.quote,
      experienceYears: m.experienceYears,
      hometown: m.hometown,
      age: m.age || 28,
      bio: m.bio || `${m.name} es un destacado músico en la escena actual con una amplia trayectoria en palenques y escenarios masivos.`,
      coverPhotoUrl: m.coverPhotoUrl || m.photoUrl
    })),

    crew: activeMembers.filter(m => m.crewRole === 'Staff').map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
      instrument: m.instrument || 'Staff Técnico',
      photoUrl: m.photoUrl,
      quote: m.quote,
      experienceYears: m.experienceYears,
      hometown: m.hometown,
      age: m.age || 30,
      bio: m.bio || `${m.name} forma parte fundamental de la logística y producción técnica del grupo.`,
      coverPhotoUrl: m.coverPhotoUrl || m.photoUrl
    })),

    milestones: profile.milestones.map(m => ({ ...m })),
    awards: [...profile.awards],
    tracks,
    repertoireByGenre: [...byGenre.entries()].map(([genre, list]) => ({ genre, tracks: list })),

    posts: publicPosts.map(p => ({
      id: p.id,
      content: p.content,
      imageUrl: p.imageUrl,
      publishedAt: p.publishedAt,
      likes: p.likes,
      comments: p.comments.length
    })),

    reviews: profile.reviews.map(r => ({
      id: r.id,
      clientName: r.clientName,
      avatarUrl: r.avatarUrl,
      eventName: r.eventName,
      eventDate: r.eventDate,
      rating: r.rating,
      comment: r.comment
    })),

    events: profile.events
      .filter(e => e.status === 'Confirmado' || e.status === 'Pendiente')
      .map(e => ({
        id: e.id,
        title: e.title,
        type: e.type,
        date: e.date,
        venue: e.venue,
        city: e.city
      })),

    gallery: profile.gallery.map(g => ({ url: g.url, caption: g.caption, category: g.category })),
    videos: profile.videos.map(v => ({ ...v })),

    socials: Object.entries(profile.socials)
      .filter(([, url]) => !!url)
      .map(([id, url]) => ({ id, url: url as string })),

    riderRequirements: [...profile.audio.riderRequirements],
    hasOwnAudio: profile.audio.hasOwnEquipment
  };
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000) return Math.round(n / 1_000) + 'K';
  return String(n);
}
