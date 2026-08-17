import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { GroupDataService } from '../../core/services/group-data.service';
import {
  GroupProfile,
  GroupMember,
  Track,
  Milestone,
  GalleryImage,
  HighlightVideo,
  PackageOption,
  SectionVisibilityConfig
} from '../../core/models/group.models';
import { LivePreviewModalComponent } from '../../shared/live-preview-modal/live-preview-modal.component';

export type EditorTabId = 'identidad' | 'integrantes' | 'multimedia' | 'trayectoria' | 'rider' | 'contacto' | 'secciones';

export interface SectionToggleItem {
  key: keyof SectionVisibilityConfig;
  label: string;
  desc: string;
  icon: string;
}

@Component({
  selector: 'app-editor-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LivePreviewModalComponent],
  templateUrl: './editor-pagina.component.html',
  styleUrl: './editor-pagina.component.scss'
})
export class EditorPaginaComponent implements OnInit {
  readonly groupData = inject(GroupDataService);
  private readonly route = inject(ActivatedRoute);

  isLivePreviewOpen = signal<boolean>(false);
  activeEditorTab = signal<EditorTabId>('identidad');
  isSavedAlert = signal<boolean>(false);

  // Form Model Clone
  formData = signal<GroupProfile | null>(null);

  // Member Editor State
  editingMember = signal<GroupMember | null>(null);
  isMemberModalOpen = signal<boolean>(false);

  // Track Player Simulation State
  currentlyPlayingTrack = signal<Track | null>(null);

  readonly tabs: { id: EditorTabId; label: string; icon: string; badge?: string }[] = [
    { id: 'identidad', label: '1. Identidad & Portada', icon: 'badge' },
    { id: 'integrantes', label: '2. Integrantes & Fichas', icon: 'groups', badge: 'Músicos' },
    { id: 'multimedia', label: '3. Multimedia, Canciones & Videos', icon: 'library_music', badge: 'Contenido' },
    { id: 'trayectoria', label: '4. Historia & Hitos', icon: 'timeline' },
    { id: 'rider', label: '5. Rider & Audio', icon: 'speaker' },
    { id: 'contacto', label: '6. Tarifas & Contacto', icon: 'payments' },
    { id: 'secciones', label: '7. Visibilidad de Secciones', icon: 'toggle_on' }
  ];

  readonly sectionList: SectionToggleItem[] = [
    { key: 'showStatsDashboard', label: 'Panel de Estadísticas & Métricas', desc: 'Horas en escenario, calificación y aforo', icon: 'monitoring' },
    { key: 'showAbout', label: 'Historia & Biografía del Grupo', desc: 'Texto de trayectoria y reseñas de origen', icon: 'menu_book' },
    { key: 'showPresentationVideo', label: 'Video Mix de Cabecera', desc: 'Reproductor de video destacado en vivo', icon: 'play_circle' },
    { key: 'showUpcomingEvents', label: 'Próximos Eventos Públicos', desc: 'Cartelera de conciertos y boletos', icon: 'event' },
    { key: 'showMembersSection', label: 'Fichas de Integrantes', desc: 'Músicos, roles y biografías individuales', icon: 'badge' },
    { key: 'showPopularTracks', label: 'Repertorio Musical & Canciones', desc: 'Catálogo de temas y reproductor', icon: 'music_note' },
    { key: 'showPhotoGallery', label: 'Galería de Fotos Oficiales', desc: 'Fotografías de prensa y en vivo', icon: 'photo_library' },
    { key: 'showAudioRider', label: 'Rider Técnico de Sonido', desc: 'Consolas y especificaciones técnicas', icon: 'settings_voice' },
    { key: 'showDirectBooking', label: 'Contacto Directo de Oficina', desc: 'Teléfono, WhatsApp, correo y oficinas', icon: 'contact_phone' },
    { key: 'showMilestones', label: 'Hitos & Reconocimientos', desc: 'Premios y galardones obtenidos', icon: 'military_tech' }
  ];

  ngOnInit(): void {
    this.resetForm();

    this.route.queryParamMap.subscribe(params => {
      const tabParam = params.get('tab') as EditorTabId;
      if (tabParam && ['identidad', 'integrantes', 'multimedia', 'trayectoria', 'rider', 'contacto', 'secciones'].includes(tabParam)) {
        this.activeEditorTab.set(tabParam);
      }
    });
  }

  resetForm(): void {
    const profile = this.groupData.activeProfile();
    const cloned: GroupProfile = JSON.parse(JSON.stringify(profile));
    if (!cloned.instruments) {
      cloned.instruments = ['Tuba & Bajo Sexto', 'Sección de Viento', 'Percusiones', 'Voces Principales'];
    }
    if (!cloned.packages) {
      cloned.packages = [
        {
          name: 'Paquete Gala Estelar',
          hours: 4,
          price: '$140,000 MXN',
          description: 'Presentación completa con toda la dotación instrumental, audio profesional e iluminación.',
          includes: ['4 Horas de Show en Vivo', 'Staff Técnico & Audio Line Array', 'Ingeniero de Sonido en Escenario', 'Repertorio Personalizado'],
          recommended: true
        },
        {
          name: 'Paquete Festival Masivo',
          hours: 2,
          price: '$90,000 MXN',
          description: 'Set enérgico de 2 horas para festivales, palenques o ferias.',
          includes: ['2 Horas de Show Continuo', 'Prueba de Audio Previa', 'Staff de Escenario'],
          recommended: false
        }
      ];
    }
    this.formData.set(cloned);
  }

  setTab(tabId: EditorTabId): void {
    this.activeEditorTab.set(tabId);
  }

  saveAllChanges(): void {
    const data = this.formData();
    if (!data) return;

    this.groupData.updateProfile(data);
    this.isSavedAlert.set(true);
    setTimeout(() => this.isSavedAlert.set(false), 3500);
  }

  toggleSectionVisibility(key: keyof SectionVisibilityConfig): void {
    this.formData.update(data => {
      if (!data) return null;
      return {
        ...data,
        sectionVisibility: {
          ...data.sectionVisibility,
          [key]: !data.sectionVisibility[key]
        }
      };
    });
  }

  openLivePreview(): void {
    this.isLivePreviewOpen.set(true);
  }

  closeLivePreview(): void {
    this.isLivePreviewOpen.set(false);
  }

  // --- MEMBER MODAL & ACTIONS ---
  openEditMemberModal(member: GroupMember): void {
    this.editingMember.set(JSON.parse(JSON.stringify(member)));
    this.isMemberModalOpen.set(true);
  }

  openAddNewMemberModal(): void {
    const newMember: GroupMember = {
      id: `member-${Date.now()}`,
      name: '',
      crewRole: 'Integrante',
      role: 'Instrumentista',
      instrument: 'Instrumento',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
      age: 28,
      hometown: this.formData()?.originCity || 'México',
      quote: '«La música se vive con pasión.»',
      bio: 'Músico talentoso integrante de la agrupación.',
      fullBio: 'Músico con amplia trayectoria en presentaciones en vivo y grabaciones de estudio.',
      experienceYears: 6,
      status: 'Activo',
      joinedAt: '2024-01-01',
      galleryPhotos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600'],
      videos: [],
      socials: {}
    };
    this.editingMember.set(newMember);
    this.isMemberModalOpen.set(true);
  }

  closeMemberModal(): void {
    this.isMemberModalOpen.set(false);
    this.editingMember.set(null);
  }

  saveMemberModal(): void {
    const member = this.editingMember();
    if (!member || !member.name.trim()) {
      alert('Por favor escribe el nombre del integrante.');
      return;
    }

    this.formData.update(data => {
      if (!data) return null;
      const index = data.members.findIndex(m => m.id === member.id);
      let updatedMembers: GroupMember[];
      if (index >= 0) {
        updatedMembers = [...data.members];
        updatedMembers[index] = member;
      } else {
        updatedMembers = [...data.members, member];
      }
      return { ...data, members: updatedMembers };
    });

    this.closeMemberModal();
  }

  removeMember(memberId: string): void {
    if (confirm('¿Deseas eliminar a este integrante de la agrupación?')) {
      this.formData.update(data => {
        if (!data) return null;
        return {
          ...data,
          members: data.members.filter(m => m.id !== memberId)
        };
      });
    }
  }

  // --- AUDIO PLAYER SIMULATION ---
  playTrack(track: Track): void {
    if (this.currentlyPlayingTrack()?.id === track.id) {
      this.currentlyPlayingTrack.set(null);
    } else {
      this.currentlyPlayingTrack.set(track);
    }
  }

  // --- INSTRUMENTS MANAGEMENT ---
  addInstrument(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.formData.update(data => {
      if (!data) return null;
      const instruments = data.instruments ? [...data.instruments, trimmed] : [trimmed];
      return { ...data, instruments };
    });
  }

  removeInstrument(index: number): void {
    this.formData.update(data => {
      if (!data || !data.instruments) return data;
      const instruments = [...data.instruments];
      instruments.splice(index, 1);
      return { ...data, instruments };
    });
  }

  // --- MILESTONES MANAGEMENT ---
  addMilestone(year: string, title: string, description: string): void {
    if (!year || !title) return;
    this.formData.update(data => {
      if (!data) return null;
      const milestones = [...data.milestones, { year: year.trim(), title: title.trim(), description: description.trim() }];
      return { ...data, milestones };
    });
  }

  removeMilestone(index: number): void {
    this.formData.update(data => {
      if (!data) return null;
      const milestones = [...data.milestones];
      milestones.splice(index, 1);
      return { ...data, milestones };
    });
  }

  // --- AWARDS MANAGEMENT ---
  addAward(award: string): void {
    const trimmed = award.trim();
    if (!trimmed) return;
    this.formData.update(data => {
      if (!data) return null;
      const awards = [...data.awards, trimmed];
      return { ...data, awards };
    });
  }

  removeAward(index: number): void {
    this.formData.update(data => {
      if (!data) return null;
      const awards = [...data.awards];
      awards.splice(index, 1);
      return { ...data, awards };
    });
  }

  // --- TRACKS MANAGEMENT ---
  addTrack(title: string, genre: string, duration: string, spotifyUrl?: string): void {
    if (!title) return;
    this.formData.update(data => {
      if (!data) return null;
      const newTrack: Track = {
        id: `track-${Date.now()}`,
        title: title.trim(),
        genre: genre.trim() || data.genre,
        durationLabel: duration.trim() || '3:30',
        releaseYear: '2026',
        plays: 'Nuevo',
        approval: 100,
        isPopular: true,
        spotifyUrl: spotifyUrl?.trim() || undefined
      };
      return { ...data, tracks: [newTrack, ...data.tracks] };
    });
  }

  removeTrack(index: number): void {
    this.formData.update(data => {
      if (!data) return null;
      const tracks = [...data.tracks];
      tracks.splice(index, 1);
      return { ...data, tracks };
    });
  }

  // --- GALLERY IMAGES MANAGEMENT ---
  addGalleryImage(url: string, caption: string, category: 'Promocional' | 'En Vivo' | 'Backstage' | 'Estudio'): void {
    if (!url) return;
    this.formData.update(data => {
      if (!data) return null;
      const newImg: GalleryImage = {
        id: `img-${Date.now()}`,
        url: url.trim(),
        caption: caption.trim() || data.name,
        category,
        uploadedAt: new Date().toISOString().split('T')[0]
      };
      return { ...data, gallery: [newImg, ...data.gallery] };
    });
  }

  removeGalleryImage(index: number): void {
    this.formData.update(data => {
      if (!data) return null;
      const gallery = [...data.gallery];
      gallery.splice(index, 1);
      return { ...data, gallery };
    });
  }

  // --- HIGHLIGHT VIDEOS MANAGEMENT ---
  addHighlightVideo(title: string, videoUrl: string, thumbnailUrl: string, duration: string): void {
    if (!title || !thumbnailUrl) return;
    this.formData.update(data => {
      if (!data) return null;
      const newVid: HighlightVideo = {
        id: `vid-${Date.now()}`,
        title: title.trim(),
        videoUrl: videoUrl.trim() || 'https://vjs.zencdn.net/v/oceans.mp4',
        thumbnailUrl: thumbnailUrl.trim(),
        duration: duration.trim() || '3:45',
        views: 'Reciente',
        category: 'En Vivo'
      };
      return { ...data, videos: [newVid, ...data.videos] };
    });
  }

  removeHighlightVideo(index: number): void {
    this.formData.update(data => {
      if (!data) return null;
      const videos = [...data.videos];
      videos.splice(index, 1);
      return { ...data, videos };
    });
  }

  // --- PACKAGES MANAGEMENT ---
  addPackage(name: string, hours: number, price: string, description: string, includesStr: string): void {
    if (!name || !price) return;
    const includes = includesStr.split(',').map(s => s.trim()).filter(Boolean);
    this.formData.update(data => {
      if (!data) return null;
      const newPkg: PackageOption = {
        name: name.trim(),
        hours: Number(hours) || 3,
        price: price.trim(),
        description: description.trim() || 'Paquete para eventos.',
        includes: includes.length > 0 ? includes : ['Show en vivo', 'Staff técnico'],
        recommended: false
      };
      const packages = data.packages ? [...data.packages, newPkg] : [newPkg];
      return { ...data, packages };
    });
  }

  removePackage(index: number): void {
    this.formData.update(data => {
      if (!data || !data.packages) return data;
      const packages = [...data.packages];
      packages.splice(index, 1);
      return { ...data, packages };
    });
  }

  // --- RIDER REQUIREMENTS ---
  addRiderRequirement(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.formData.update(data => {
      if (!data) return null;
      return {
        ...data,
        audio: {
          ...data.audio,
          riderRequirements: [...data.audio.riderRequirements, trimmed]
        }
      };
    });
  }

  removeRiderRequirement(index: number): void {
    this.formData.update(data => {
      if (!data) return null;
      const updated = [...data.audio.riderRequirements];
      updated.splice(index, 1);
      return {
        ...data,
        audio: {
          ...data.audio,
          riderRequirements: updated
        }
      };
    });
  }
}
