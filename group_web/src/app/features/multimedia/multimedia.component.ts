import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupDataService } from '../../core/services/group-data.service';
import { GroupMember, Track, GalleryImage, HighlightVideo } from '../../core/models/group.models';

@Component({
  selector: 'app-multimedia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './multimedia.component.html',
  styleUrl: './multimedia.component.scss'
})
export class MultimediaComponent {
  readonly groupData = inject(GroupDataService);

  activeSection = signal<'grupal' | 'individual'>('grupal');
  selectedMemberId = signal<string>('');
  currentlyPlayingTrack = signal<Track | null>(null);
  selectedMediaUrl = signal<string | null>(null);

  // New Media Modal Signals
  isAddPhotoModalOpen = signal<boolean>(false);
  newPhotoUrl = signal<string>('');
  newPhotoCaption = signal<string>('');
  newPhotoCategory = signal<'Promocional' | 'En Vivo' | 'Backstage' | 'Estudio'>('Promocional');

  get currentMember(): GroupMember {
    const profile = this.groupData.activeProfile();
    const id = this.selectedMemberId() || profile.members[0]?.id;
    return profile.members.find(m => m.id === id) || profile.members[0];
  }

  selectMember(memberId: string): void {
    this.selectedMemberId.set(memberId);
  }

  playTrack(track: Track): void {
    if (this.currentlyPlayingTrack()?.id === track.id) {
      this.currentlyPlayingTrack.set(null);
    } else {
      this.currentlyPlayingTrack.set(track);
    }
  }

  openPhotoModal(): void {
    this.newPhotoUrl.set('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000');
    this.newPhotoCaption.set('');
    this.isAddPhotoModalOpen.set(true);
  }

  closePhotoModal(): void {
    this.isAddPhotoModalOpen.set(false);
  }

  saveNewPhoto(): void {
    if (!this.newPhotoUrl()) return;
    const profile = this.groupData.activeProfile();

    if (this.activeSection() === 'grupal') {
      const newImg: GalleryImage = {
        id: `img-${Date.now()}`,
        url: this.newPhotoUrl(),
        caption: this.newPhotoCaption().trim() || 'Fotografía oficial',
        category: this.newPhotoCategory(),
        uploadedAt: new Date().toISOString().split('T')[0]
      };
      this.groupData.updateProfile({ ...profile, gallery: [newImg, ...profile.gallery] });
    } else {
      const member = this.currentMember;
      const updatedGallery = [this.newPhotoUrl(), ...member.galleryPhotos];
      this.groupData.updateMemberInfo(member.id, { galleryPhotos: updatedGallery });
    }

    this.closePhotoModal();
  }

  viewMedia(url: string): void {
    this.selectedMediaUrl.set(url);
  }

  closeMediaView(): void {
    this.selectedMediaUrl.set(null);
  }
}
