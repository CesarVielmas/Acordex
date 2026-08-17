import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GroupDataService } from '../../core/services/group-data.service';
import { StoryViewerModalComponent } from '../../shared/story-viewer-modal/story-viewer-modal.component';
import { StoryCreatorModalComponent } from '../../shared/story-creator-modal/story-creator-modal.component';
import { EvidenceUploaderModalComponent } from '../../shared/evidence-uploader-modal/evidence-uploader-modal.component';
import { GroupEventItem } from '../../core/models/event.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    StoryViewerModalComponent, 
    StoryCreatorModalComponent,
    EvidenceUploaderModalComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  readonly groupData = inject(GroupDataService);

  isStoryViewerOpen = signal<boolean>(false);
  isStoryCreatorOpen = signal<boolean>(false);
  isEvidenceUploaderOpen = signal<boolean>(false);

  selectedStoryIndex = signal<number>(0);
  selectedEventForEvidence = signal<GroupEventItem | null>(null);

  readonly upcomingEventsCount = computed<number>(() => this.groupData.upcomingEvents().length);

  readonly nextEvent = computed<GroupEventItem | null>(() => {
    const list = this.groupData.upcomingEvents();
    return list.length > 0 ? list[0] : (this.groupData.events()[0] || null);
  });

  get nextUpcomingEvent(): GroupEventItem | null {
    return this.nextEvent();
  }

  openStoryViewer(index: number = 0): void {
    this.selectedStoryIndex.set(index);
    this.isStoryViewerOpen.set(true);
  }

  closeStoryViewer(): void {
    this.isStoryViewerOpen.set(false);
  }

  openStoryCreator(): void {
    this.isStoryCreatorOpen.set(true);
  }

  closeStoryCreator(): void {
    this.isStoryCreatorOpen.set(false);
  }

  openEvidenceUploader(event?: GroupEventItem): void {
    const target = event || this.nextUpcomingEvent || this.groupData.events()[0];
    this.selectedEventForEvidence.set(target);
    this.isEvidenceUploaderOpen.set(true);
  }

  closeEvidenceUploader(): void {
    this.isEvidenceUploaderOpen.set(false);
  }

  deleteStory(id: string): void {
    this.groupData.deleteStory(id);
  }
}
