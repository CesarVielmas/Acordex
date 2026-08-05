import { Injectable, signal, computed } from '@angular/core';
import { GroupItem } from '../../core/models/admin.models';
import { buildGroupProfile } from './group-profile.mock';
import { GroupProfile, GroupMember, GroupPost, PostVisibility, Track, GroupRepresentative, GalleryImage, HighlightVideo, MemberVideo, SocialLinks } from './group-profile.model';

/**
 * Estado editable de los perfiles de grupo.
 *
 * El modal es de consulta **y** de edición, así que el perfil no puede
 * derivarse en cada render: se construye una vez por grupo y a partir de ahí
 * vive aquí, donde las ediciones se acumulan. Cuando exista backend, este
 * servicio es el único punto que hay que cambiar — los componentes ya solo
 * leen señales y emiten intenciones.
 *
 * Cada mutación marca el perfil como sucio para que la barra de guardado sepa
 * que hay cambios sin confirmar.
 */
@Injectable({ providedIn: 'root' })
export class GroupProfileStore {
  /** Perfiles ya materializados, por id de grupo. */
  private readonly profiles = signal<Record<string, GroupProfile>>({});

  /** Ids con cambios sin guardar. */
  private readonly dirtyIds = signal<Set<string>>(new Set());

  /** Marca de tiempo del último guardado, por grupo. */
  private readonly savedAt = signal<Record<string, string>>({});

  /**
   * Devuelve el perfil del grupo, construyéndolo la primera vez.
   * La construcción perezosa es intencional: evita generar seis perfiles
   * completos al entrar al catálogo cuando el usuario abrirá uno.
   */
  ensure(group: GroupItem): GroupProfile {
    const existing = this.profiles()[group.id];
    if (existing) return existing;

    const built = buildGroupProfile(group);
    this.profiles.update(map => ({ ...map, [group.id]: built }));
    return built;
  }

  /** Señal de solo lectura del perfil de un grupo. */
  profile(groupId: string): GroupProfile | null {
    return this.profiles()[groupId] ?? null;
  }

  isDirty(groupId: string): boolean {
    return this.dirtyIds().has(groupId);
  }

  lastSavedAt(groupId: string): string | null {
    return this.savedAt()[groupId] ?? null;
  }

  /** Confirma los cambios. Hoy solo limpia el estado sucio y sella la hora. */
  save(groupId: string): void {
    this.dirtyIds.update(set => {
      const next = new Set(set);
      next.delete(groupId);
      return next;
    });
    this.savedAt.update(map => ({ ...map, [groupId]: new Date().toLocaleString('es-MX') }));
  }

  // --- Mutaciones ---

  /** Aplica un cambio parcial a la raíz del perfil. */
  patch(groupId: string, changes: Partial<GroupProfile>): void {
    this.mutate(groupId, p => ({ ...p, ...changes }));
  }

  /** Cambia un campo anidado de primer nivel (baseRate, audio, contract, social...). */
  patchSection<K extends keyof GroupProfile>(
    groupId: string,
    section: K,
    changes: Partial<GroupProfile[K]>
  ): void {
    this.mutate(groupId, p => ({ ...p, [section]: { ...(p[section] as object), ...(changes as object) } as GroupProfile[K] }));
  }

  deleteMilestone(groupId: string, index: number): void {
    this.mutate(groupId, p => ({
      ...p,
      milestones: p.milestones.filter((_, i) => i !== index)
    }));
  }

  updateMember(groupId: string, memberId: string, changes: Partial<GroupMember>): void {
    this.mutate(groupId, p => ({
      ...p,
      members: p.members.map(m => (m.id === memberId ? { ...m, ...changes } : m))
    }));
  }

  updateMemberMedia(groupId: string, memberId: string, photos: string[], videos: MemberVideo[]): void {
    this.updateMember(groupId, memberId, { galleryPhotos: photos, videos });
  }

  updateMemberSocials(groupId: string, memberId: string, socials: SocialLinks): void {
    this.updateMember(groupId, memberId, { socials });
  }

  updateRepresentative(groupId: string, repId: string, changes: Partial<GroupRepresentative>): void {
    this.mutate(groupId, p => ({
      ...p,
      representatives: p.representatives.map(r => (r.id === repId ? { ...r, ...changes } : r))
    }));
  }

  addPost(groupId: string, post: GroupPost): void {
    this.mutate(groupId, p => ({ ...p, posts: [post, ...p.posts] }));
  }

  updatePost(groupId: string, postId: string, changes: Partial<GroupPost>): void {
    this.mutate(groupId, p => ({
      ...p,
      posts: p.posts.map(post => (post.id === postId ? { ...post, ...changes } : post))
    }));
  }

  setPostVisibility(groupId: string, postId: string, visibility: PostVisibility): void {
    this.updatePost(groupId, postId, { visibility });
  }

  deletePost(groupId: string, postId: string): void {
    this.mutate(groupId, p => ({ ...p, posts: p.posts.filter(post => post.id !== postId) }));
  }

  addTrack(groupId: string, track: Track): void {
    this.mutate(groupId, p => ({ ...p, tracks: [...p.tracks, track] }));
  }

  updateTrack(groupId: string, trackId: string, changes: Partial<Track>): void {
    this.mutate(groupId, p => ({
      ...p,
      tracks: p.tracks.map(t => (t.id === trackId ? { ...t, ...changes } : t))
    }));
  }

  deleteTrack(groupId: string, trackId: string): void {
    this.mutate(groupId, p => ({ ...p, tracks: p.tracks.filter(t => t.id !== trackId) }));
  }

  addGalleryImage(groupId: string, image: GalleryImage): void {
    this.mutate(groupId, p => ({ ...p, gallery: [image, ...p.gallery] }));
  }

  updateGalleryImage(groupId: string, url: string, changes: Partial<GalleryImage>): void {
    this.mutate(groupId, p => ({
      ...p,
      gallery: p.gallery.map(img => (img.url === url ? { ...img, ...changes } : img))
    }));
  }

  deleteGalleryImage(groupId: string, url: string): void {
    this.mutate(groupId, p => ({ ...p, gallery: p.gallery.filter(img => img.url !== url) }));
  }

  addVideo(groupId: string, video: HighlightVideo): void {
    this.mutate(groupId, p => ({ ...p, videos: [video, ...p.videos] }));
  }

  updateVideo(groupId: string, title: string, changes: Partial<HighlightVideo>): void {
    this.mutate(groupId, p => ({
      ...p,
      videos: p.videos.map(v => (v.title === title ? { ...v, ...changes } : v))
    }));
  }

  deleteVideo(groupId: string, title: string): void {
    this.mutate(groupId, p => ({ ...p, videos: p.videos.filter(v => v.title !== title) }));
  }

  /** Añade o quita un requisito del rider técnico. */
  setRiderRequirements(groupId: string, requirements: string[]): void {
    this.patchSection(groupId, 'audio', { riderRequirements: requirements });
  }

  private mutate(groupId: string, fn: (p: GroupProfile) => GroupProfile): void {
    const current = this.profiles()[groupId];
    if (!current) return;

    this.profiles.update(map => ({ ...map, [groupId]: fn(current) }));
    this.dirtyIds.update(set => new Set(set).add(groupId));
  }
}
