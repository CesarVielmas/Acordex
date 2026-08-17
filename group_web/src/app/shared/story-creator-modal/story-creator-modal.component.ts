import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupDataService } from '../../core/services/group-data.service';

@Component({
  selector: 'app-story-creator-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './story-creator-modal.component.html',
  styleUrl: './story-creator-modal.component.scss'
})
export class StoryCreatorModalComponent {
  private readonly groupData = inject(GroupDataService);

  @Output() close = new EventEmitter<void>();

  mediaUrl = signal<string>('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800');
  mediaType = signal<'image' | 'video'>('image');
  caption = signal<string>('');
  locationTag = signal<string>('En Directo desde Mazatlán');
  musicTag = signal<string>('Mi Reina Sinaloense');

  readonly presetMedia = [
    { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800', type: 'image' as const, label: 'Escenario' },
    { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800', type: 'image' as const, label: 'Público / Festival' },
    { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800', type: 'image' as const, label: 'Instrumentos' },
    { url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800', type: 'image' as const, label: 'Backstage' },
    { url: 'https://vjs.zencdn.net/v/oceans.mp4', type: 'video' as const, label: 'Clip Video' }
  ];

  selectPreset(item: { url: string; type: 'image' | 'video' }): void {
    this.mediaUrl.set(item.url);
    this.mediaType.set(item.type);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.mediaUrl.set(e.target.result);
        this.mediaType.set(file.type.includes('video') ? 'video' : 'image');
      };
      reader.readAsDataURL(file);
    }
  }

  publishStory(): void {
    if (!this.mediaUrl()) {
      alert('Por favor selecciona o ingresa una imagen/video para la historia.');
      return;
    }

    this.groupData.addStory(
      this.mediaUrl(),
      this.mediaType(),
      this.caption() ? this.caption().trim() : undefined,
      this.locationTag() ? this.locationTag().trim() : undefined,
      this.musicTag() ? this.musicTag().trim() : undefined
    );

    this.close.emit();
  }
}
