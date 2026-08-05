import { TagOption } from '../../shared/ui/multi-tag-select/multi-tag-select.component';
import { SelectOption } from '../../shared/ui/custom-select/custom-select.component';

export const GENRE_TAG_OPTIONS: TagOption[] = [
  { id: 'Regional Mexicano', label: 'Regional Mexicano', icon: 'music_note' },
  { id: 'Norteño', label: 'Norteño', icon: 'music_note' },
  { id: 'Banda Sinaloense', label: 'Banda Sinaloense', icon: 'music_note' },
  { id: 'Grupero', label: 'Grupero', icon: 'music_note' },
  { id: 'Cumbia', label: 'Cumbia', icon: 'music_note' },
  { id: 'Sierreño', label: 'Sierreño', icon: 'music_note' },
  { id: 'Corridos Tumbados', label: 'Corridos Tumbados', icon: 'music_note' },
  { id: 'Mariachi', label: 'Mariachi', icon: 'music_note' },
  { id: 'Ranchero', label: 'Ranchero', icon: 'music_note' },
  { id: 'Pop en Español', label: 'Pop en Español', icon: 'music_note' },
  { id: 'Rock en Español', label: 'Rock en Español', icon: 'music_note' },
  { id: 'Reggaetón', label: 'Reggaetón', icon: 'music_note' },
  { id: 'Salsa', label: 'Salsa', icon: 'music_note' },
  { id: 'Tropical', label: 'Tropical', icon: 'music_note' },
  { id: 'Electrónica', label: 'Electrónica', icon: 'music_note' }
];

export const GENRE_SELECT_OPTIONS: SelectOption[] = GENRE_TAG_OPTIONS.map(g => ({
  value: g.id,
  label: g.label,
  icon: 'music_note'
}));

export const SOCIAL_NETWORK_OPTIONS: TagOption[] = [
  { id: 'instagram', label: 'Instagram', icon: 'photo_camera' },
  { id: 'facebook', label: 'Facebook', icon: 'thumb_up' },
  { id: 'youtube', label: 'YouTube', icon: 'play_circle' },
  { id: 'spotify', label: 'Spotify', icon: 'graphic_eq' },
  { id: 'tiktok', label: 'TikTok', icon: 'videocam' },
  { id: 'twitter', label: 'Twitter / X', icon: 'tag' },
  { id: 'soundcloud', label: 'SoundCloud', icon: 'cloud' },
  { id: 'appleMusic', label: 'Apple Music', icon: 'music_note' },
  { id: 'deezer', label: 'Deezer', icon: 'headphones' }
];

export const INSTRUMENT_TAG_OPTIONS: TagOption[] = [
  { id: 'Vocalista Principal', label: 'Vocalista Principal', icon: 'mic' },
  { id: 'Segunda Voz', label: 'Segunda Voz', icon: 'record_voice_over' },
  { id: 'Acordeón', label: 'Acordeón', icon: 'music_note' },
  { id: 'Bajo Sexto', label: 'Bajo Sexto', icon: 'music_note' },
  { id: 'Saxofón', label: 'Saxofón', icon: 'music_note' },
  { id: 'Batería', label: 'Batería', icon: 'music_note' },
  { id: 'Bajo Eléctrico', label: 'Bajo Eléctrico', icon: 'music_note' },
  { id: 'Tololoche / Tuba', label: 'Tololoche / Tuba', icon: 'music_note' },
  { id: 'Guitarra', label: 'Guitarra', icon: 'music_note' },
  { id: 'Teclado / Piano', label: 'Teclado / Piano', icon: 'music_note' },
  { id: 'Trompeta', label: 'Trompeta', icon: 'music_note' },
  { id: 'Violín', label: 'Violín', icon: 'music_note' },
  { id: 'Percusiones', label: 'Percusiones', icon: 'music_note' },
  { id: 'Güiro', label: 'Güiro', icon: 'music_note' }
];
