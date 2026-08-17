import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupProfile, Track } from '../../core/models/group.models';

export type PreviewTabId = 'general' | 'trayectoria' | 'musica' | 'galeria' | 'integrantes' | 'rider' | 'paquetes';

@Component({
  selector: 'app-live-preview-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-preview-modal.component.html',
  styleUrl: './live-preview-modal.component.scss'
})
export class LivePreviewModalComponent {
  @Input({ required: true }) profile!: GroupProfile;
  @Output() close = new EventEmitter<void>();

  selectedTab = signal<PreviewTabId>('general');
  viewportMode = signal<'desktop' | 'mobile'>('desktop');
  isFollowing = signal<boolean>(false);
  currentlyPlayingTrack = signal<Track | null>(null);

  readonly previewTabs: { id: PreviewTabId; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: 'info' },
    { id: 'trayectoria', label: 'Trayectoria & Hitos', icon: 'timeline' },
    { id: 'musica', label: 'Música & Repertorio', icon: 'library_music' },
    { id: 'galeria', label: 'Galería de Fotos & Videos', icon: 'collections' },
    { id: 'integrantes', label: 'Integrantes', icon: 'groups' },
    { id: 'rider', label: 'Rider Técnico', icon: 'speaker' },
    { id: 'paquetes', label: 'Paquetes & Tarifas', icon: 'payments' }
  ];

  setTab(tabId: PreviewTabId): void {
    this.selectedTab.set(tabId);
  }

  toggleFollow(): void {
    this.isFollowing.update(v => !v);
  }

  playTrack(track: Track): void {
    if (this.currentlyPlayingTrack()?.id === track.id) {
      this.currentlyPlayingTrack.set(null);
    } else {
      this.currentlyPlayingTrack.set(track);
    }
  }

  openClientsWebExternal(): void {
    const slug = this.profile.slug || this.profile.id;
    window.open(`http://localhost:4200/grupo/${slug}`, '_blank');
  }
}
