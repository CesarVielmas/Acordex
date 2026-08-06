import { Injectable, signal, computed } from '@angular/core';
import { GroupItem } from '../../core/models/admin.models';
import { buildGroupProfile } from './group-profile.mock';
import {
  GroupProfile, GroupMember, GroupPost, PostVisibility, Track,
  GroupRepresentative, GalleryImage, HighlightVideo, MemberVideo,
  SocialLinks, MemberStatus, RosterLogEntry, Milestone
} from './group-profile.model';

@Injectable({ providedIn: 'root' })
export class GroupProfileStore {
  /** Perfiles ya materializados, por id de grupo. */
  private readonly profiles = signal<Record<string, GroupProfile>>({});

  /** Perfil activo actualmente en edición en la modal. */
  private readonly activeProfileSignal = signal<GroupProfile | null>(null);

  /** Ids con cambios sin guardar. */
  private readonly dirtyIds = signal<Set<string>>(new Set());

  /** Marca de tiempo del último guardado, por grupo. */
  private readonly savedAt = signal<Record<string, string>>({});

  /** Inicializa o activa el perfil actual en la ventana modal. */
  initProfile(profile: GroupProfile): void {
    const existing = this.profiles()[profile.id];
    const target = existing ? { ...existing } : { ...profile };
    this.profiles.update(map => ({ ...map, [profile.id]: target }));
    this.activeProfileSignal.set(target);
  }

  /** Devuelve el perfil del grupo. */
  profile(groupId?: string): GroupProfile | null {
    if (groupId) {
      return this.profiles()[groupId] ?? null;
    }
    return this.activeProfileSignal();
  }

  /** Devuelve la señal computada del perfil activo. */
  activeProfile = computed<GroupProfile | null>(() => this.activeProfileSignal());

  /** Señal de solo lectura para comprobar si hay cambios sin guardar. */
  dirty(groupId?: string): boolean {
    const id = groupId || this.activeProfileSignal()?.id;
    if (!id) return false;
    return this.dirtyIds().has(id);
  }

  isDirty(groupId: string): boolean {
    return this.dirtyIds().has(groupId);
  }

  lastSavedAt(groupId?: string): string | null {
    const id = groupId || this.activeProfileSignal()?.id;
    if (!id) return null;
    return this.savedAt()[id] ?? null;
  }

  /** Descarta los cambios acumulados y restaura el perfil original. */
  discardChanges(groupId?: string): void {
    const id = groupId || this.activeProfileSignal()?.id;
    if (!id) return;

    this.dirtyIds.update(set => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  /** Confirma y guarda los cambios acumulados. */
  save(groupId?: string): void {
    const id = groupId || this.activeProfileSignal()?.id;
    if (!id) return;

    this.dirtyIds.update(set => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
    this.savedAt.update(map => ({ ...map, [id]: new Date().toLocaleString('es-MX') }));
  }

  saveChanges(groupId?: string): void {
    this.save(groupId);
  }

  ensure(group: GroupItem): GroupProfile {
    const existing = this.profiles()[group.id];
    if (existing) {
      this.activeProfileSignal.set(existing);
      return existing;
    }

    const built = buildGroupProfile(group);
    this.profiles.update(map => ({ ...map, [group.id]: built }));
    this.activeProfileSignal.set(built);
    return built;
  }

  // --- Mutaciones de Raíz y Campos ---

  updateRootField(field: string, value: any, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    this.patch(id, { [field]: value } as Partial<GroupProfile>);
  }

  toggleSectionVisibility(sectionKey: string, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    const active = this.profiles()[id];
    if (!active) return;

    const vis = active.sectionVisibility ?? {
      showStatsDashboard: true, showAbout: true, showPresentationVideo: true,
      showUpcomingEvents: true, showMembersSection: true, showTechnicalSpecs: true,
      showAudioRider: true, showSocials: true, showDirectBooking: true,
      showMilestones: true, showRepresentatives: true,
      showStatEvents: true, showStatHours: true, showStatSatisfaction: true, showStatMembers: true,
      showOriginCity: true, showFoundedYear: true, showMusicalGenre: true,
      showMembersCountSpec: true, showSenioritySpec: true,
      showBookingPhone: true, showBookingEmail: true, showOfficeAddress: true, showMinimumHours: true
    };

    const key = sectionKey as keyof typeof vis;
    const updatedVis = { ...vis, [key]: !vis[key] };
    this.patch(id, { sectionVisibility: updatedVis } as Partial<GroupProfile>);
  }

  updateBaseRate(field: string, value: any, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    const numVal = ['suggestedFee', 'minimumHours', 'extraHourFee'].includes(field) ? Number(value) : value;
    this.patchSection(id, 'baseRate', { [field]: numVal });
  }

  updateAudio(field: string, value: any, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    if (field === 'riderRequirements') {
      const list = typeof value === 'string' ? value.split('\n').filter(Boolean) : value;
      this.patchSection(id, 'audio', { riderRequirements: list });
    } else {
      this.patchSection(id, 'audio', { [field]: value });
    }
  }

  toggleOwnAudio(hasOwn: boolean, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    this.patchSection(id, 'audio', { hasOwnEquipment: hasOwn });
  }

  updateContract(field: string, value: any, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    const val = field === 'commissionPercent' ? Number(value) : value;
    this.patchSection(id, 'contract', { [field]: val });
  }

  toggleContract(hasContract: boolean, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    this.patchSection(id, 'contract', { hasContract });
  }

  updateSocials(field: string, value: any, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    const active = this.getActiveProfile(id);
    if (!active) return;
    const updated = { ...active.socials, [field]: value };
    this.patch(id, { socials: updated });
  }

  // --- Hitos & Trayectoria ---

  addMilestone(year: string, title: string, description: string, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    const active = this.getActiveProfile(id);
    if (!active) return;
    const newM: Milestone = { year, title, description };
    this.patch(id, { milestones: [...active.milestones, newM] });
  }

  updateMilestone(index: number, field: 'year' | 'title' | 'description', value: string, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    const active = this.getActiveProfile(id);
    if (!active) return;
    const updated = active.milestones.map((m, i) => (i === index ? { ...m, [field]: value } : m));
    this.patch(id, { milestones: updated });
  }

  deleteMilestone(indexOrGroupId: number | string, index?: number): void {
    let targetIndex: number;
    let targetId: string;

    if (typeof indexOrGroupId === 'number') {
      targetIndex = indexOrGroupId;
      targetId = this.resolveGroupId();
    } else {
      targetId = this.resolveGroupId(indexOrGroupId);
      targetIndex = index ?? 0;
    }

    if (!targetId) return;
    const active = this.getActiveProfile(targetId);
    if (!active) return;
    const updated = active.milestones.filter((_, i) => i !== targetIndex);
    this.patch(targetId, { milestones: updated });
  }

  // --- Integrantes & Staff ---

  updateMemberField(memberId: string, field: string, value: any, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    const numVal = ['age', 'experienceYears', 'monthlySalary'].includes(field) ? Number(value) : value;
    this.updateMember(id, memberId, { [field]: numVal });
  }

  updateMember(groupIdOrMemberId: string, memberIdOrChanges: string | Partial<GroupMember>, changes?: Partial<GroupMember>): void {
    let targetId: string;
    let targetMemberId: string;
    let targetChanges: Partial<GroupMember>;

    if (typeof changes === 'object') {
      targetId = groupIdOrMemberId;
      targetMemberId = memberIdOrChanges as string;
      targetChanges = changes;
    } else {
      targetId = this.resolveGroupId();
      targetMemberId = groupIdOrMemberId;
      targetChanges = memberIdOrChanges as Partial<GroupMember>;
    }

    if (!targetId) return;
    this.mutate(targetId, p => ({
      ...p,
      members: p.members.map(m => (m.id === targetMemberId ? { ...m, ...targetChanges } : m))
    }));
  }

  addMember(memberOrGroupId: GroupMember | string, member?: GroupMember): void {
    let targetId: string;
    let newMember: GroupMember;

    if (typeof memberOrGroupId === 'string') {
      targetId = memberOrGroupId;
      newMember = member!;
    } else {
      targetId = this.resolveGroupId();
      newMember = memberOrGroupId;
    }

    if (!targetId || !newMember) return;

    const logEntry: RosterLogEntry = {
      id: 'log-' + Date.now(),
      memberName: newMember.name,
      role: newMember.role,
      action: 'Alta',
      at: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      note: `Alta registrada en ${newMember.crewRole === 'Staff' ? 'Equipo de Apoyo & Logística' : 'Alineación Artística'}.`
    };

    this.mutate(targetId, p => ({
      ...p,
      members: [...p.members, newMember],
      rosterLog: [logEntry, ...(p.rosterLog || [])]
    }));
  }

  updateMemberMedia(groupId: string, memberId: string, photos: string[], videos: MemberVideo[]): void {
    this.updateMember(groupId, memberId, { galleryPhotos: photos, videos });
  }

  updateMemberSocials(groupId: string, memberId: string, socials: SocialLinks): void {
    this.updateMember(groupId, memberId, { socials });
  }

  addMemberPhoto(memberId: string, photoUrl: string, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    const active = this.getActiveProfile(id);
    if (!active) return;
    const m = active.members.find(x => x.id === memberId);
    if (!m) return;
    const updated = [...(m.galleryPhotos || []), photoUrl];
    this.updateMember(id, memberId, { galleryPhotos: updated });
  }

  deleteMemberPhoto(memberId: string, photoUrl: string, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    const active = this.getActiveProfile(id);
    if (!active) return;
    const m = active.members.find(x => x.id === memberId);
    if (!m) return;
    const updated = (m.galleryPhotos || []).filter(url => url !== photoUrl);
    this.updateMember(id, memberId, { galleryPhotos: updated });
  }

  addMemberVideo(memberId: string, video: MemberVideo, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    const active = this.getActiveProfile(id);
    if (!active) return;
    const m = active.members.find(x => x.id === memberId);
    if (!m) return;
    const updated = [...(m.videos || []), video];
    this.updateMember(id, memberId, { videos: updated });
  }

  deleteMemberVideo(memberId: string, videoTitle: string, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    const active = this.getActiveProfile(id);
    if (!active) return;
    const m = active.members.find(x => x.id === memberId);
    if (!m) return;
    const updated = (m.videos || []).filter(v => v.title !== videoTitle);
    this.updateMember(id, memberId, { videos: updated });
  }

  // --- Publicaciones & Feed ---

  addPost(postOrGroupId: GroupPost | string, post?: GroupPost): void {
    let targetId: string;
    let targetPost: GroupPost;

    if (typeof postOrGroupId === 'string' && post) {
      targetId = postOrGroupId;
      targetPost = post;
    } else {
      targetId = this.resolveGroupId();
      targetPost = postOrGroupId as GroupPost;
    }

    if (!targetId) return;
    this.mutate(targetId, p => ({ ...p, posts: [targetPost, ...p.posts] }));
  }

  deletePost(postIdOrGroupId: string, postId?: string): void {
    let targetId: string;
    let targetPostId: string;

    if (postId) {
      targetId = postIdOrGroupId;
      targetPostId = postId;
    } else {
      targetId = this.resolveGroupId();
      targetPostId = postIdOrGroupId;
    }

    if (!targetId) return;
    this.mutate(targetId, p => ({ ...p, posts: p.posts.filter(post => post.id !== targetPostId) }));
  }

  togglePostVisibility(postId: string, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    const active = this.getActiveProfile(id);
    if (!active) return;
    const post = active.posts.find(p => p.id === postId);
    if (!post) return;
    const nextVis: PostVisibility = post.visibility === 'Publicada' ? 'Privada' : 'Publicada';
    this.mutate(id, p => ({
      ...p,
      posts: p.posts.map(x => (x.id === postId ? { ...x, visibility: nextVis } : x))
    }));
  }

  setPostVisibility(groupId: string, postId: string, visibility: PostVisibility): void {
    this.mutate(groupId, p => ({
      ...p,
      posts: p.posts.map(post => (post.id === postId ? { ...post, visibility } : post))
    }));
  }

  updatePost(postId: string, changes: Partial<GroupPost>, groupId?: string): void {
    const id = this.resolveGroupId(groupId);
    if (!id) return;
    this.mutate(id, p => ({
      ...p,
      posts: p.posts.map(post => (post.id === postId ? { ...post, ...changes } : post))
    }));
  }

  // --- Canciones & Repertorio ---

  addTrack(trackOrGroupId: Track | string, track?: Track): void {
    let targetId: string;
    let targetTrack: Track;

    if (typeof trackOrGroupId === 'string' && track) {
      targetId = trackOrGroupId;
      targetTrack = track;
    } else {
      targetId = this.resolveGroupId();
      targetTrack = trackOrGroupId as Track;
    }

    if (!targetId) return;
    this.mutate(targetId, p => ({ ...p, tracks: [...p.tracks, targetTrack] }));
  }

  deleteTrack(trackIdOrGroupId: string, trackId?: string): void {
    let targetId: string;
    let targetTrackId: string;

    if (trackId) {
      targetId = trackIdOrGroupId;
      targetTrackId = trackId;
    } else {
      targetId = this.resolveGroupId();
      targetTrackId = trackIdOrGroupId;
    }

    if (!targetId) return;
    this.mutate(targetId, p => ({ ...p, tracks: p.tracks.filter(t => t.id !== targetTrackId) }));
  }

  updateTrack(trackIdOrGroupId: string, trackIdOrChanges: string | Partial<Track>, changes?: Partial<Track>): void {
    let targetId: string;
    let targetTrackId: string;
    let targetChanges: Partial<Track>;

    if (typeof trackIdOrChanges === 'string' && changes) {
      targetId = trackIdOrGroupId;
      targetTrackId = trackIdOrChanges;
      targetChanges = changes;
    } else {
      targetId = this.resolveGroupId();
      targetTrackId = trackIdOrGroupId;
      targetChanges = trackIdOrChanges as Partial<Track>;
    }

    if (!targetId) return;
    this.mutate(targetId, p => ({
      ...p,
      tracks: p.tracks.map(t => (t.id === targetTrackId ? { ...t, ...targetChanges } : t))
    }));
  }

  // --- Galería & Videos ---

  addImage(imageOrGroupId: GalleryImage | string, image?: GalleryImage): void {
    let targetId: string;
    let targetImage: GalleryImage;

    if (typeof imageOrGroupId === 'string' && image) {
      targetId = imageOrGroupId;
      targetImage = image;
    } else {
      targetId = this.resolveGroupId();
      targetImage = imageOrGroupId as GalleryImage;
    }

    if (!targetId) return;
    this.mutate(targetId, p => ({ ...p, gallery: [targetImage, ...p.gallery] }));
  }

  deleteImage(urlOrGroupId: string, url?: string): void {
    let targetId: string;
    let targetUrl: string;

    if (url) {
      targetId = urlOrGroupId;
      targetUrl = url;
    } else {
      targetId = this.resolveGroupId();
      targetUrl = urlOrGroupId;
    }

    if (!targetId) return;
    this.mutate(targetId, p => ({ ...p, gallery: p.gallery.filter(img => img.url !== targetUrl) }));
  }

  addVideo(videoOrGroupId: HighlightVideo | string, video?: HighlightVideo): void {
    let targetId: string;
    let targetVideo: HighlightVideo;

    if (typeof videoOrGroupId === 'string' && video) {
      targetId = videoOrGroupId;
      targetVideo = video;
    } else {
      targetId = this.resolveGroupId();
      targetVideo = videoOrGroupId as HighlightVideo;
    }

    if (!targetId) return;
    this.mutate(targetId, p => ({ ...p, videos: [targetVideo, ...p.videos] }));
  }

  deleteVideo(titleOrGroupId: string, title?: string): void {
    let targetId: string;
    let targetTitle: string;

    if (title) {
      targetId = titleOrGroupId;
      targetTitle = title;
    } else {
      targetId = this.resolveGroupId();
      targetTitle = titleOrGroupId;
    }

    if (!targetId) return;
    this.mutate(targetId, p => ({ ...p, videos: p.videos.filter(v => v.title !== targetTitle) }));
  }

  // --- Representantes ---

  updateRepresentative(repIdOrGroupId: string, fieldOrRepIdOrChanges: string | Partial<GroupRepresentative>, valueOrChanges?: any): void {
    let targetId: string;
    let targetRepId: string;
    let targetChanges: Partial<GroupRepresentative>;

    if (typeof valueOrChanges !== 'undefined') {
      targetId = this.resolveGroupId();
      targetRepId = repIdOrGroupId;
      targetChanges = { [fieldOrRepIdOrChanges as string]: valueOrChanges };
    } else if (typeof fieldOrRepIdOrChanges === 'object') {
      targetId = repIdOrGroupId;
      targetRepId = fieldOrRepIdOrChanges as any;
      targetChanges = valueOrChanges as any;
    } else {
      targetId = this.resolveGroupId();
      targetRepId = repIdOrGroupId;
      targetChanges = fieldOrRepIdOrChanges as any;
    }

    if (!targetId) return;
    this.mutate(targetId, p => ({
      ...p,
      representatives: p.representatives.map(r => (r.id === targetRepId ? { ...r, ...targetChanges } : r))
    }));
  }

  // --- Internos ---

  patch(groupId?: string, changes?: Partial<GroupProfile>): void {
    const id = this.resolveGroupId(groupId);
    if (!id || !changes) return;
    this.mutate(id, p => ({ ...p, ...changes }));
  }

  patchSection<K extends keyof GroupProfile>(
    groupIdOrSection: string | K,
    sectionOrChanges: K | Partial<GroupProfile[K]>,
    changes?: Partial<GroupProfile[K]>
  ): void {
    let targetId: string;
    let targetSection: K;
    let targetChanges: Partial<GroupProfile[K]>;

    if (changes) {
      targetId = groupIdOrSection as string;
      targetSection = sectionOrChanges as K;
      targetChanges = changes;
    } else {
      targetId = this.resolveGroupId();
      targetSection = groupIdOrSection as K;
      targetChanges = sectionOrChanges as Partial<GroupProfile[K]>;
    }

    if (!targetId) return;
    this.mutate(targetId, p => ({
      ...p,
      [targetSection]: { ...(p[targetSection] as object), ...(targetChanges as object) } as GroupProfile[K]
    }));
  }

  private resolveGroupId(groupId?: string): string {
    return groupId || this.activeProfileSignal()?.id || '';
  }

  private getActiveProfile(groupId?: string): GroupProfile | null {
    const id = this.resolveGroupId(groupId);
    if (!id) return null;
    return this.profiles()[id] ?? null;
  }

  private mutate(groupId: string, fn: (p: GroupProfile) => GroupProfile): void {
    if (!groupId) return;
    const current = this.profiles()[groupId];
    if (!current) return;

    const next = fn(current);
    this.profiles.update(map => ({ ...map, [groupId]: next }));
    if (this.activeProfileSignal()?.id === groupId) {
      this.activeProfileSignal.set(next);
    }
    this.dirtyIds.update(set => new Set(set).add(groupId));
  }

  // --- POPUP MODAL MANAGER CENTRALIZADO ---
  readonly activeModal = signal<'none' | 'post' | 'member' | 'genre' | 'track' | 'image' | 'video' | 'milestone'>('none');

  // Post Modal Signals
  readonly newPostContent = signal<string>('');
  readonly newPostImageUrl = signal<string>('');
  readonly newPostVisibility = signal<string>('Publicada');

  // Member Modal Signals
  readonly newMemberName = signal<string>('');
  readonly newMemberRole = signal<string>('Vocalista Principal / Acordeón');
  readonly newMemberCrewRole = signal<'Integrante' | 'Staff'>('Integrante');
  readonly newMemberInstrument = signal<string>('Acordeón');
  readonly newMemberAge = signal<number>(27);
  readonly newMemberHometown = signal<string>('Monterrey, N.L.');
  readonly newMemberPhotoUrl = signal<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400');
  readonly selectedInstrumentOption = signal<string>('Acordeón');
  readonly customInstrumentText = signal<string>('');
  readonly selectedStaffOption = signal<string>('Ingeniero de Audio FOH (Sala)');
  readonly customStaffText = signal<string>('');

  // Genre Modal Signals
  readonly newGenreName = signal<string>('');
  readonly newGenreTrackTitle = signal<string>('');
  readonly newGenreTrackAudioUrl = signal<string>('');

  // Track Modal Signals
  readonly newTrackTitle = signal<string>('');
  readonly newTrackGenre = signal<string>('');
  readonly newTrackYear = signal<string>('2026');
  readonly newTrackDuration = signal<string>('3:30');
  readonly newTrackAudioUrl = signal<string>('');
  readonly newTrackIsPopular = signal<boolean>(false);

  // Image Modal Signals
  readonly newImgUrl = signal<string>('');
  readonly newImgCaption = signal<string>('');
  readonly newImgCategory = signal<string>('Promocional');

  // Video Modal Signals
  readonly newVidTitle = signal<string>('');
  readonly newVidThumb = signal<string>('');
  readonly newVidDuration = signal<string>('3:45');
  readonly newVidViews = signal<string>('1.2k vistas');

  // Milestone Modal Signals
  readonly newMilestoneYear = signal<string>('2026');
  readonly newMilestoneTitle = signal<string>('');
  readonly newMilestoneDesc = signal<string>('');

  closeModal(): void {
    this.activeModal.set('none');
  }

  openAddPostModal(): void {
    this.newPostContent.set('');
    this.newPostImageUrl.set('');
    this.newPostVisibility.set('Publicada');
    this.activeModal.set('post');
  }

  openAddMemberModal(): void {
    this.newMemberName.set('');
    this.newMemberRole.set('Vocalista Principal / Acordeón');
    this.newMemberCrewRole.set('Integrante');
    this.newMemberInstrument.set('Acordeón');
    this.selectedInstrumentOption.set('Acordeón');
    this.customInstrumentText.set('');
    this.selectedStaffOption.set('Ingeniero de Audio FOH (Sala)');
    this.customStaffText.set('');
    this.newMemberAge.set(27);
    this.newMemberHometown.set('Monterrey, N.L.');
    this.newMemberPhotoUrl.set('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400');
    this.activeModal.set('member');
  }

  openAddGenreModal(): void {
    this.newGenreName.set('');
    this.newGenreTrackTitle.set('');
    this.newGenreTrackAudioUrl.set('');
    this.activeModal.set('genre');
  }

  openAddTrackModal(genre?: string): void {
    const prof = this.activeProfileSignal();
    const set = new Set<string>();
    if (prof?.genre) set.add(prof.genre);
    if (prof?.secondaryGenres) prof.secondaryGenres.forEach(g => set.add(g));
    if (prof?.tracks) prof.tracks.forEach(t => { if (t.genre) set.add(t.genre); });
    const available = [...set];
    this.newTrackTitle.set('');
    this.newTrackGenre.set(genre || available[0] || 'Regional Mexicano');
    this.newTrackYear.set('2026');
    this.newTrackDuration.set('3:30');
    this.newTrackAudioUrl.set('');
    this.newTrackIsPopular.set(false);
    this.activeModal.set('track');
  }

  openAddImageModal(): void {
    this.newImgUrl.set('');
    this.newImgCaption.set('');
    this.newImgCategory.set('Promocional');
    this.activeModal.set('image');
  }

  openAddVideoModal(): void {
    this.newVidTitle.set('');
    this.newVidThumb.set('');
    this.newVidDuration.set('3:45');
    this.newVidViews.set('1.2k vistas');
    this.activeModal.set('video');
  }

  openAddMilestoneModal(): void {
    this.newMilestoneYear.set('2026');
    this.newMilestoneTitle.set('');
    this.newMilestoneDesc.set('');
    this.activeModal.set('milestone');
  }

  submitNewPost(): void {
    const content = this.newPostContent().trim();
    if (!content) return;
    const newPost: GroupPost = {
      id: 'post-' + Date.now(),
      content,
      imageUrl: this.newPostImageUrl().trim() || undefined,
      publishedAt: 'Hace un momento',
      likes: 0,
      shares: 0,
      visibility: (this.newPostVisibility() as PostVisibility) || 'Publicada',
      sentiment: 'Positivo',
      comments: []
    };
    this.addPost(newPost);
    this.closeModal();
  }

  submitNewMember(): void {
    const name = this.newMemberName().trim();
    if (!name) return;
    let finalRole = this.newMemberRole().trim();
    let finalInst = this.newMemberInstrument().trim();

    if (this.newMemberCrewRole() === 'Integrante') {
      if (this.selectedInstrumentOption() === 'Otro / Personalizado' && this.customInstrumentText().trim()) {
        finalInst = this.customInstrumentText().trim();
        finalRole = finalInst;
      }
    } else {
      if (this.selectedStaffOption() === 'Otro Cargo' && this.customStaffText().trim()) {
        finalRole = this.customStaffText().trim();
      } else {
        finalRole = this.selectedStaffOption();
      }
      finalInst = 'Staff Operativo';
    }

    const newMember: GroupMember = {
      id: 'm-' + Date.now(),
      name,
      role: finalRole || (this.newMemberCrewRole() === 'Staff' ? 'Staff' : 'Músico'),
      crewRole: this.newMemberCrewRole(),
      instrument: finalInst,
      age: this.newMemberAge() || 25,
      hometown: this.newMemberHometown().trim() || 'Monterrey, N.L.',
      photoUrl: this.newMemberPhotoUrl().trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      status: 'Activo',
      quote: 'Pasión y excelencia en cada presentación.',
      bio: `${name} forma parte del equipo oficial de ${finalRole}.`,
      fullBio: `Trayectoria destacada en la música y producción.`,
      experienceYears: 5,
      joinedAt: '2024-01-15',
      galleryPhotos: [],
      videos: [],
      socials: {}
    };

    this.addMember(newMember);
    this.closeModal();
  }

  submitNewGenre(): void {
    const name = this.newGenreName().trim();
    if (!name) return;
    const initialTitle = this.newGenreTrackTitle().trim() || `Debut ${name}`;
    const initialTrack: Track = {
      id: 'trk-' + Date.now(),
      title: initialTitle,
      durationLabel: '3:30',
      releaseYear: '2026',
      genre: name,
      audioUrl: this.newGenreTrackAudioUrl().trim() || undefined,
      plays: '1.5k',
      approval: 100,
      isPopular: true
    };

    const prof = this.activeProfileSignal();
    if (prof) {
      const secondary = Array.from(new Set([...(prof.secondaryGenres || []), name]));
      this.patchSection('secondaryGenres' as any, secondary as any);
    }
    this.addTrack(initialTrack);
    this.closeModal();
  }

  submitNewTrack(): void {
    const title = this.newTrackTitle().trim();
    if (!title) return;
    const genreName = this.newTrackGenre().trim() || 'General';

    const newTrack: Track = {
      id: 'trk-' + Date.now(),
      title,
      genre: genreName,
      releaseYear: this.newTrackYear().trim() || '2026',
      durationLabel: this.newTrackDuration().trim() || '3:30',
      audioUrl: this.newTrackAudioUrl().trim() || undefined,
      plays: '0',
      approval: 100,
      isPopular: this.newTrackIsPopular()
    };

    this.addTrack(newTrack);
    this.closeModal();
  }

  submitNewImage(): void {
    const url = this.newImgUrl().trim();
    if (!url) return;
    const newImg: GalleryImage = {
      url,
      caption: this.newImgCaption().trim() || 'Nueva fotografía promocional',
      category: (this.newImgCategory() as any) || 'Promocional',
      isPublic: true
    };
    this.addImage(newImg);
    this.closeModal();
  }

  submitNewVideo(): void {
    const title = this.newVidTitle().trim();
    if (!title) return;
    const newVid: HighlightVideo = {
      title,
      thumbnailUrl: this.newVidThumb().trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
      duration: this.newVidDuration().trim() || '3:45',
      views: this.newVidViews().trim() || '1k vistas',
      isPublic: true
    };
    this.addVideo(newVid);
    this.closeModal();
  }

  submitNewMilestone(): void {
    const title = this.newMilestoneTitle().trim();
    if (!title) return;
    const year = this.newMilestoneYear().trim() || '2026';
    const desc = this.newMilestoneDesc().trim() || 'Hito histórico registrado';
    this.addMilestone(year, title, desc);
    this.closeModal();
  }
}
