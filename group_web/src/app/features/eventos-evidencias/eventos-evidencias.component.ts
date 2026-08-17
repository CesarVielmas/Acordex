import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupDataService } from '../../core/services/group-data.service';
import { GroupEventItem } from '../../core/models/event.models';
import { EvidenceUploaderModalComponent } from '../../shared/evidence-uploader-modal/evidence-uploader-modal.component';

@Component({
  selector: 'app-eventos-evidencias',
  standalone: true,
  imports: [CommonModule, FormsModule, EvidenceUploaderModalComponent],
  templateUrl: './eventos-evidencias.component.html',
  styleUrl: './eventos-evidencias.component.scss'
})
export class EventosEvidenciasComponent {
  readonly groupData = inject(GroupDataService);

  activeFilter = signal<'todos' | 'programados' | 'completados'>('todos');
  searchQuery = signal<string>('');
  selectedEvent = signal<GroupEventItem | null>(null);
  isUploaderOpen = signal<boolean>(false);
  selectedEvidenceImage = signal<string | null>(null);

  get filteredEvents(): GroupEventItem[] {
    const list = this.groupData.events();
    const filter = this.activeFilter();
    const query = this.searchQuery().toLowerCase().trim();

    return list.filter(e => {
      const matchesFilter = filter === 'todos' || 
        (filter === 'programados' && (e.status === 'Programado' || e.status === 'En Curso')) ||
        (filter === 'completados' && e.status === 'Completado');

      const matchesQuery = !query || 
        e.title.toLowerCase().includes(query) ||
        e.venue.toLowerCase().includes(query) ||
        e.city.toLowerCase().includes(query);

      return matchesFilter && matchesQuery;
    });
  }

  openUploader(event: GroupEventItem): void {
    this.selectedEvent.set(event);
    this.isUploaderOpen.set(true);
  }

  closeUploader(): void {
    this.isUploaderOpen.set(false);
  }

  viewImage(url: string): void {
    this.selectedEvidenceImage.set(url);
  }

  closeImageView(): void {
    this.selectedEvidenceImage.set(null);
  }
}
