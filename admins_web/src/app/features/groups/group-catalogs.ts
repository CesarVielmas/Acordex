/**
 * Catálogos de opciones del expediente de grupo.
 *
 * Viven aparte porque los comparten varias pestañas (géneros en General y en
 * Repertorio, redes en el grupo y en cada integrante) y porque son justo lo que
 * cambiará cuando exista backend: hoy son constantes, mañana vendrán de una
 * tabla de catálogo. Que estén en un solo sitio hace ese cambio trivial.
 */

/** Géneros del catálogo regional mexicano que maneja la disquera. */
export const MUSIC_GENRES: string[] = [
  'Norteño',
  'Norteño Sax',
  'Banda Sinaloense',
  'Corridos Tumbados',
  'Corridos Bélicos',
  'Sierreño',
  'Mariachi',
  'Ranchera',
  'Cumbia Norteña',
  'Duranguense',
  'Grupero',
  'Balada Romántica',
  'Tribal / Electrónico Regional',
  'Bolero',
  'Huapango'
];

/** Instrumentos y voces habituales en una agrupación regional. */
export const INSTRUMENTS: string[] = [
  'Voz',
  'Voz & Guitarra',
  'Segunda Voz',
  'Acordeón',
  'Bajo Sexto',
  'Bajo Eléctrico',
  'Tuba / Sousafón',
  'Batería',
  'Percusión',
  'Saxofón Alto',
  'Saxofón Tenor',
  'Trompeta',
  'Trombón',
  'Clarinete',
  'Guitarra Eléctrica',
  'Requinto',
  'Teclado',
  'Violín'
];

export interface SocialNetworkMeta {
  /** Clave estable que se guarda en el modelo. */
  id: string;
  label: string;
  icon: string;
  /** Color de marca, para teñir el chip. */
  color: string;
  placeholder: string;
}

/** Las nueve redes donde tiene sentido que un grupo o un músico tenga presencia. */
export const SOCIAL_NETWORKS: SocialNetworkMeta[] = [
  { id: 'instagram', label: 'Instagram', icon: 'photo_camera', color: 'text-pink-400', placeholder: 'https://instagram.com/usuario' },
  { id: 'facebook', label: 'Facebook', icon: 'thumb_up', color: 'text-blue-400', placeholder: 'https://facebook.com/pagina' },
  { id: 'youtube', label: 'YouTube', icon: 'smart_display', color: 'text-red-400', placeholder: 'https://youtube.com/@canal' },
  { id: 'tiktok', label: 'TikTok', icon: 'music_note', color: 'text-cyan-300', placeholder: 'https://tiktok.com/@usuario' },
  { id: 'spotify', label: 'Spotify', icon: 'graphic_eq', color: 'text-emerald-400', placeholder: 'https://open.spotify.com/artist/...' },
  { id: 'appleMusic', label: 'Apple Music', icon: 'library_music', color: 'text-rose-300', placeholder: 'https://music.apple.com/artist/...' },
  { id: 'soundcloud', label: 'SoundCloud', icon: 'cloud', color: 'text-orange-400', placeholder: 'https://soundcloud.com/usuario' },
  { id: 'x', label: 'X (Twitter)', icon: 'tag', color: 'text-slate-200', placeholder: 'https://x.com/usuario' },
  { id: 'whatsapp', label: 'WhatsApp Business', icon: 'chat', color: 'text-green-400', placeholder: 'https://wa.me/52...' }
];

export function socialMeta(id: string): SocialNetworkMeta {
  return SOCIAL_NETWORKS.find(n => n.id === id)
    ?? { id, label: id, icon: 'link', color: 'text-outline', placeholder: 'https://' };
}

/** Categorías de la galería. */
export const GALLERY_CATEGORIES = ['Promocional', 'En Vivo', 'Backstage', 'Estudio'] as const;

/**
 * Banco de imágenes sugeridas para los selectores.
 *
 * Sustituye al "pega aquí una URL" a secas: en la práctica el administrador no
 * tiene una URL a mano, así que se le ofrece de dónde escoger. Cuando exista
 * backend, este arreglo se reemplaza por la biblioteca de medios del grupo.
 */
export interface ImageSuggestion {
  url: string;
  label: string;
  tag: 'Escenario' | 'Retrato' | 'Estudio' | 'Público' | 'Portada';
}

export const IMAGE_SUGGESTIONS: ImageSuggestion[] = [
  { url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80', label: 'Concierto en vivo', tag: 'Escenario' },
  { url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80', label: 'Escenario iluminado', tag: 'Escenario' },
  { url: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80', label: 'Público en concierto', tag: 'Público' },
  { url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', label: 'Multitud con luces', tag: 'Público' },
  { url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', label: 'Micrófono vintage', tag: 'Estudio' },
  { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80', label: 'Sesión de estudio', tag: 'Estudio' },
  { url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80', label: 'Guitarra acústica', tag: 'Estudio' },
  { url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80', label: 'Banda ensayando', tag: 'Retrato' },
  { url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80', label: 'Grupo en vivo', tag: 'Retrato' },
  { url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80', label: 'Cantante en escenario', tag: 'Retrato' },
  { url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80', label: 'Festival nocturno', tag: 'Portada' },
  { url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80', label: 'Luces de escenario', tag: 'Portada' }
];
