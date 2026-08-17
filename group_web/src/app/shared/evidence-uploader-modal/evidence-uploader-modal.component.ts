import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupDataService } from '../../core/services/group-data.service';
import { GroupEventItem } from '../../core/models/event.models';

export type EvidenceCategory = 'En Vivo' | 'Backstage' | 'Prueba de Sonido' | 'Meet & Greet' | 'Prensa';

@Component({
  selector: 'app-evidence-uploader-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evidence-uploader-modal.component.html',
  styleUrl: './evidence-uploader-modal.component.scss'
})
export class EvidenceUploaderModalComponent {
  private readonly groupData = inject(GroupDataService);

  @Input({ required: true }) event: GroupEventItem | null = null;
  @Output() close = new EventEmitter<void>();

  mediaUrl = signal<string>('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200');
  caption = signal<string>('');
  category = signal<EvidenceCategory>('En Vivo');
  mediaType = signal<'photo' | 'video'>('photo');

  readonly categoriesList: EvidenceCategory[] = ['En Vivo', 'Backstage', 'Prueba de Sonido', 'Meet & Greet', 'Prensa'];

  readonly presetImages: { url: string; label: string; cat: EvidenceCategory }[] = [
    { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200', label: 'Foto Escenario En Vivo', cat: 'En Vivo' },
    { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200', label: 'Euforia del Público', cat: 'En Vivo' },
    { url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200', label: 'Backstage / Camerinos', cat: 'Backstage' },
    { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200', label: 'Prueba de Sonido', cat: 'Prueba de Sonido' },
    { url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200', label: 'Convivencia con Fans', cat: 'Meet & Greet' }
  ];

  selectPreset(item: { url: string; cat: EvidenceCategory }): void {
    this.mediaUrl.set(item.url);
    this.category.set(item.cat);
  }

  setCategory(cat: EvidenceCategory): void {
    this.category.set(cat);
  }

  onFileSelected(e: any): void {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        this.mediaUrl.set(event.target.result);
        this.mediaType.set(file.type.includes('video') ? 'video' : 'photo');
      };
      reader.readAsDataURL(file);
    }
  }

  saveEvidence(): void {
    if (!this.event || !this.mediaUrl()) {
      alert('Por favor selecciona una foto o video.');
      return;
    }

    this.groupData.addEventEvidence(this.event.id, {
      url: this.mediaUrl(),
      caption: this.caption().trim() || `Evidencia de presentación en ${this.event.venue}`,
      type: this.mediaType(),
      category: this.category()
    });

    this.close.emit();
  }
}
