/**
 * Perfil completo de un grupo musical, tal como lo administra la disquera.
 *
 * Es deliberadamente un espejo de `BandDetail` de `clients_web`: esta pantalla
 * es el editor de lo que el cliente termina viendo en `/grupo/:id`. Los campos
 * que aquí sobran respecto del público (bitácora de altas y bajas, salarios,
 * moderación de publicaciones, contratos) son de gestión interna y nunca se
 * exponen; van marcados como `interno` en su comentario.
 */

export type MemberStatus = 'Activo' | 'Baja' | 'Invitado';
export type CrewRole = 'Integrante' | 'Staff';
export type PostVisibility = 'Publicada' | 'Privada' | 'Oculta';
export type PostSentiment = 'Positivo' | 'Neutro' | 'Negativo';

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  spotify?: string;
  tiktok?: string;
  twitter?: string;
  soundcloud?: string;
  appleMusic?: string;
  deezer?: string;
}

/** Un hito de la trayectoria del grupo. */
export interface Milestone {
  year: string;
  title: string;
  description: string;
}

export interface MemberVideo {
  title: string;
  thumbnailUrl: string;
  duration: string;
}

/**
 * Integrante o miembro del staff (chofer, ingeniero de sonido, cargadores...).
 * Se modelan juntos porque en la práctica comparten ficha; `crewRole` separa
 * a quien toca de quien opera.
 */
export interface GroupMember {
  id: string;
  name: string;
  crewRole: CrewRole;
  /** Instrumento si toca; puesto si es staff. */
  role: string;
  instrument?: string;
  photoUrl: string;
  coverPhotoUrl?: string;
  age: number;
  hometown: string;
  quote: string;
  bio: string;
  fullBio: string;
  experienceYears: number;
  status: MemberStatus;
  joinedAt: string;
  leftAt?: string;
  /** interno. Opcional: solo se muestra si el grupo autorizó publicarlo. */
  monthlySalary?: number;
  galleryPhotos: string[];
  videos: MemberVideo[];
  socials: SocialLinks;
}

/** interno. Movimiento de alta o baja en la alineación. */
export interface RosterLogEntry {
  id: string;
  memberName: string;
  role: string;
  action: 'Alta' | 'Baja';
  /** Fecha y hora del movimiento. */
  at: string;
  note?: string;
}

export interface PostComment {
  id: string;
  authorName: string;
  avatarUrl: string;
  text: string;
  at: string;
  sentiment: PostSentiment;
}

/** Publicación del grupo en el muro de Acordex. */
export interface GroupPost {
  id: string;
  content: string;
  imageUrl?: string;
  publishedAt: string;
  likes: number;
  shares: number;
  visibility: PostVisibility;
  /**
   * Clasificación del tono de los comentarios. Hoy viene precalculada en el
   * mock; cuando exista backend la resolverá el análisis de sentimiento.
   */
  sentiment: PostSentiment;
  comments: PostComment[];
}

/** Reseña que deja un asistente después de un evento. */
export interface GroupReview {
  id: string;
  clientName: string;
  avatarUrl: string;
  eventName: string;
  eventDate: string;
  venue: string;
  rating: number;
  comment: string;
  attendees: number;
}

export interface GroupEventRecord {
  id: string;
  title: string;
  type: 'Concierto' | 'Firma de Autógrafos' | 'Rueda de Prensa' | 'Privado';
  date: string;
  venue: string;
  city: string;
  status: 'Completado' | 'Confirmado' | 'Pendiente' | 'Cancelado';
  attendance?: number;
  capacity?: number;
  revenue?: number;
  rating?: number;
}

export interface Track {
  id: string;
  title: string;
  genre: string;
  durationLabel: string;
  releaseYear: string;
  plays: string;
  /** Aprobación del público sobre esa canción, en porcentaje. */
  approval: number;
  isPopular?: boolean;
  audioUrl?: string;
}

export interface GalleryImage {
  url: string;
  caption: string;
  category: 'Promocional' | 'En Vivo' | 'Backstage' | 'Estudio';
  isPublic?: boolean;
}

export interface HighlightVideo {
  title: string;
  thumbnailUrl: string;
  duration: string;
  views: string;
  isPublic?: boolean;
}

/**
 * Un representante del grupo. Un grupo puede estar representado por varias
 * disqueras a la vez si su disquera titular lo autoriza, y cada una ofrece su
 * propio precio y nivel de servicio.
 */
export interface GroupRepresentative {
  id: string;
  labelName: string;
  contactName: string;
  phone: string;
  email: string;
  /** Titular = la disquera que firmó al grupo. */
  isPrimary: boolean;
  serviceTier: 'Premium' | 'Estándar' | 'Básico';
  /** Honorario que cotiza este representante por el bloque mínimo de horas. */
  quotedFee: number;
  notes?: string;
}

/** Equipo de audio propio del grupo, si lo tiene. */
export interface AudioEquipment {
  hasOwnEquipment: boolean;
  engineerName?: string;
  engineerPhone?: string;
  consoleModel?: string;
  speakersSetup?: string;
  monitorsSetup?: string;
  /** Requisitos que el recinto debe cubrir. */
  riderRequirements: string[];
  notes?: string;
}

/** interno. Contrato con la disquera; puede no existir. */
export interface LabelContract {
  hasContract: boolean;
  contractType?: string;
  signedAt?: string;
  expiresAt?: string;
  fileName?: string;
  exclusivity?: 'Exclusivo' | 'Co-gestionado' | 'Independiente';
  commissionPercent?: number;
}

/**
 * Tarifa base sugerida. Es una recomendación del grupo, no un precio fijo: el
 * administrador puede cotizar por encima o por debajo al armar la propuesta.
 */
export interface BookingBaseRate {
  minimumHours: number;
  suggestedFee: number;
  /** Cargo sugerido por cada hora extra sobre el mínimo. */
  extraHourFee: number;
  currency: 'MXN';
  notes?: string;
}

export interface GroupProfile {
  id: string;
  name: string;
  /** Foto de perfil (cuadrada). */
  avatarUrl: string;
  /** Foto de portada (panorámica). */
  coverUrl: string;
  genre: string;
  secondaryGenres: string[];
  foundedYear: number;
  originCity: string;

  /** Domicilio de las oficinas del grupo. */
  officeAddress: string;
  officeCity: string;
  bookingPhone: string;
  bookingEmail: string;

  baseRate: BookingBaseRate;
  contract: LabelContract;
  audio: AudioEquipment;
  socials: SocialLinks;
  representatives: GroupRepresentative[];

  about: string;
  milestones: Milestone[];
  awards: string[];

  members: GroupMember[];
  /** interno. */
  rosterLog: RosterLogEntry[];

  posts: GroupPost[];
  reviews: GroupReview[];
  events: GroupEventRecord[];
  tracks: Track[];
  gallery: GalleryImage[];
  videos: HighlightVideo[];

  /** Métricas de alcance social, para las gráficas del muro. */
  social: {
    followers: number;
    followersGrowthPercent: number;
    totalLikes: number;
    /** % de seguidores que interactúan. */
    engagementPercent: number;
    monthlyFollowers: number[];
    monthlyLikes: number[];
  };
}

/** Miembros que hoy forman parte del grupo. */
export function activeMembers(profile: GroupProfile): GroupMember[] {
  return profile.members.filter(m => m.status !== 'Baja');
}

export function musicians(profile: GroupProfile): GroupMember[] {
  return activeMembers(profile).filter(m => m.crewRole === 'Integrante');
}

export function staff(profile: GroupProfile): GroupMember[] {
  return activeMembers(profile).filter(m => m.crewRole === 'Staff');
}

export function averageRating(profile: GroupProfile): number {
  if (!profile.reviews.length) return 0;
  const sum = profile.reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / profile.reviews.length) * 10) / 10;
}

/** % de reseñas de 4 estrellas o más. */
export function approvalPercent(profile: GroupProfile): number {
  if (!profile.reviews.length) return 0;
  const positive = profile.reviews.filter(r => r.rating >= 4).length;
  return Math.round((positive / profile.reviews.length) * 100);
}

/** Asistencia promedio de los eventos que ya tienen aforo registrado. */
export function averageAttendance(profile: GroupProfile): number {
  const withData = profile.events.filter(e => typeof e.attendance === 'number');
  if (!withData.length) return 0;
  return Math.round(withData.reduce((acc, e) => acc + (e.attendance || 0), 0) / withData.length);
}
