import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoryItem } from '../../core/models/story.models';

@Component({
  selector: 'app-story-viewer-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './story-viewer-modal.component.html',
  styleUrl: './story-viewer-modal.component.scss'
})
export class StoryViewerModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) stories: StoryItem[] = [];
  @Input() initialIndex: number = 0;
  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<string>();
  @Output() deleteStory = this.delete;

  currentIndex = signal<number>(0);
  progress = signal<number>(0);
  isPaused = signal<boolean>(false);
  showViewersDrawer = signal<boolean>(false);

  private timerInterval: any = null;
  private readonly STORY_DURATION_MS = 5000;
  private readonly STEP_MS = 50;

  ngOnInit(): void {
    this.currentIndex.set(this.initialIndex);
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  get currentStory(): StoryItem | null {
    return this.stories[this.currentIndex()] || null;
  }

  startTimer(): void {
    this.clearTimer();
    this.progress.set(0);

    const stepProgress = (this.STEP_MS / this.STORY_DURATION_MS) * 100;
    this.timerInterval = setInterval(() => {
      if (!this.isPaused() && !this.showViewersDrawer()) {
        this.progress.update(p => {
          if (p >= 100) {
            this.nextStory();
            return 0;
          }
          return p + stepProgress;
        });
      }
    }, this.STEP_MS);
  }

  clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  nextStory(): void {
    if (this.currentIndex() < this.stories.length - 1) {
      this.currentIndex.update(i => i + 1);
      this.progress.set(0);
    } else {
      this.closeModal();
    }
  }

  prevStory(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
      this.progress.set(0);
    } else {
      this.progress.set(0);
    }
  }

  pause(): void {
    this.isPaused.set(true);
  }

  resume(): void {
    this.isPaused.set(false);
  }

  toggleViewersDrawer(): void {
    this.showViewersDrawer.update(v => !v);
  }

  deleteCurrentStory(): void {
    const s = this.currentStory;
    if (s && confirm('¿Estás seguro de eliminar esta historia?')) {
      this.delete.emit(s.id);
      this.closeModal();
    }
  }

  closeModal(): void {
    this.clearTimer();
    this.close.emit();
  }
}
