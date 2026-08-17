import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupDataService } from '../../core/services/group-data.service';
import { StoryItem } from '../../core/models/story.models';
import { StoryViewerModalComponent } from '../../shared/story-viewer-modal/story-viewer-modal.component';
import { StoryCreatorModalComponent } from '../../shared/story-creator-modal/story-creator-modal.component';

@Component({
  selector: 'app-historias',
  standalone: true,
  imports: [CommonModule, StoryViewerModalComponent, StoryCreatorModalComponent],
  templateUrl: './historias.component.html',
  styleUrl: './historias.component.scss'
})
export class HistoriasComponent {
  readonly groupData = inject(GroupDataService);

  isViewerOpen = signal<boolean>(false);
  isCreatorOpen = signal<boolean>(false);
  selectedStoryIndex = signal<number>(0);

  openViewer(index: number): void {
    this.selectedStoryIndex.set(index);
    this.isViewerOpen.set(true);
  }

  closeViewer(): void {
    this.isViewerOpen.set(false);
  }

  openCreator(): void {
    this.isCreatorOpen.set(true);
  }

  closeCreator(): void {
    this.isCreatorOpen.set(false);
  }

  deleteStory(id: string): void {
    if (confirm('¿Deseas eliminar esta historia?')) {
      this.groupData.deleteStory(id);
    }
  }

  getTimeRemaining(expiresAt: string): string {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return 'Expirada';
    const hours = Math.floor(remaining / (3600 * 1000));
    const mins = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
    return `${hours}h ${mins}m restantes`;
  }
}
