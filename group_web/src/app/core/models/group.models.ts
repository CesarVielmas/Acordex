export type MemberStatus = 'Activo' | 'Baja' | 'Invitado';
export type CrewRole = 'Integrante' | 'Staff';
export type PostVisibility = 'Publicada' | 'Privada' | 'Oculta';
export type PostSentiment = 'Positivo' | 'Neutro' | 'Negativo';
export type GroupAgendaStatus = 'Totalmente Libre' | 'Parcialmente Ocupado' | 'Agenda Llena';
export type LiveActivityStatus = 'En Gira' | 'Disponible' | 'En Ensayo' | 'En Escenario' | 'Descanso';

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  spotify?: string;
  tiktok?: string;
  twitter?: string;
  soundcloud?: string;
  appleMusic?: string;
}

export interface Milestone {
  year: string;
  title: string;
  description: string;
}

export interface MemberVideo {
  title: string;
  videoUrl?: string;
  thumbnailUrl: string;
  duration: string;
}

export interface GroupMember {
  id: string;
  name: string;
  crewRole: CrewRole;
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
  galleryPhotos: string[];
  videos: MemberVideo[];
  socials: SocialLinks;
}

export interface PostComment {
  id: string;
  authorName: string;
  avatarUrl: string;
  text: string;
  at: string;
  sentiment: PostSentiment;
  reply?: string;
  replyAuthor?: string;
  repliedAt?: string;
}

export interface GroupPost {
  id: string;
  content: string;
  imageUrl?: string;
  publishedAt: string;
  likes: number;
  shares: number;
  visibility: PostVisibility;
  sentiment: PostSentiment;
  comments: PostComment[];
  isLikedByMe?: boolean;
}

export interface Track {
  id: string;
  title: string;
  genre: string;
  durationLabel: string;
  releaseYear: string;
  plays: string;
  approval: number;
  isPopular?: boolean;
  audioUrl?: string;
  spotifyUrl?: string;
}

export interface GalleryImage {
  id?: string;
  url: string;
  caption: string;
  category: 'Promocional' | 'En Vivo' | 'Backstage' | 'Estudio' | 'Fans';
  uploadedAt?: string;
  eventId?: string;
  eventName?: string;
}

export interface HighlightVideo {
  id?: string;
  title: string;
  thumbnailUrl: string;
  videoUrl?: string;
  duration: string;
  views: string;
  category?: 'En Vivo' | 'Oficial' | 'Backstage' | 'Entrevista';
}

export interface AudioEquipment {
  hasOwnEquipment: boolean;
  engineerName?: string;
  engineerPhone?: string;
  consoleModel?: string;
  speakersSetup?: string;
  monitorsSetup?: string;
  riderRequirements: string[];
  notes?: string;
}

export interface SectionVisibilityConfig {
  showStatsDashboard: boolean;
  showAbout: boolean;
  showPresentationVideo: boolean;
  showUpcomingEvents: boolean;
  showMembersSection: boolean;
  showStaffMembers: boolean;
  showTechnicalSpecs: boolean;
  showAudioRider: boolean;
  showSocials: boolean;
  showDirectBooking: boolean;
  showMilestones: boolean;
  showPopularTracks: boolean;
  showMusicCatalog: boolean;
  showHighlightVideos: boolean;
  showPhotoGallery: boolean;
  showPosts: boolean;
  showReviews: boolean;
}

export function defaultSectionVisibility(): SectionVisibilityConfig {
  return {
    showStatsDashboard: true,
    showAbout: true,
    showPresentationVideo: true,
    showUpcomingEvents: true,
    showMembersSection: true,
    showStaffMembers: true,
    showTechnicalSpecs: true,
    showAudioRider: true,
    showSocials: true,
    showDirectBooking: true,
    showMilestones: true,
    showPopularTracks: true,
    showMusicCatalog: true,
    showHighlightVideos: true,
    showPhotoGallery: true,
    showPosts: true,
    showReviews: true,
  };
}

export interface PackageOption {
  name: string;
  hours: number;
  price: string;
  description: string;
  includes: string[];
  recommended?: boolean;
}

export interface GroupProfile {
  id: string;
  slug?: string;
  name: string;
  avatarUrl: string;
  coverUrl: string;
  genre: string;
  secondaryGenres: string[];
  foundedYear: number;
  originCity: string;
  state?: string;
  municipality?: string;
  country?: string;
  verified: boolean;
  platformJoinedAt: string;
  mixVideoTitle: string;
  mixVideoThumbnailUrl: string;
  mixVideoUrl?: string;
  totalHoursLogged: number;
  history: string;
  about: string;
  officeAddress: string;
  officeCity: string;
  bookingPhone: string;
  bookingEmail: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  rating: number;
  reviewCount: number;
  reviewsCount?: number;
  followersCount: string;
  agendaStatus: GroupAgendaStatus;
  liveStatus: LiveActivityStatus;
  artistFeeBase: number;
  minimumHours: number;
  sectionVisibility: SectionVisibilityConfig;
  audio: AudioEquipment;
  socials: SocialLinks;
  instruments?: string[];
  milestones: Milestone[];
  awards: string[];
  members: GroupMember[];
  posts: GroupPost[];
  tracks: Track[];
  gallery: GalleryImage[];
  videos: HighlightVideo[];
  packages?: PackageOption[];
  repertoireByGenre?: { genre: string; songs: string[] }[];
}

export interface GroupItemSummary {
  id: string;
  slug?: string;
  name: string;
  genre: string;
  rating: number;
  image: string;
  membersCount: number;
  followersCount: string;
  groupLeaderName: string;
  groupLeaderRole: string;
  agendaStatus: GroupAgendaStatus;
  liveStatus: LiveActivityStatus;
}
