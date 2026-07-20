import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-story-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div (click)="onCardClick()"
         (mouseenter)="onMouseEnter()"
         (mouseleave)="onMouseLeave()"
         class="relative flex-shrink-0 w-28 md:w-36 h-48 md:h-60 rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-primary/20 transition-all duration-300 border-2 border-primary/20 hover:border-primary">
      
      <!-- Background Image -->
      <img [src]="thumbnailUrl" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 z-0">
      
      <!-- Background Video (Only on hover, loaded dynamically, statically muted to ensure immediate autoplay) -->
      <video *ngIf="isHovered && isVideo && videoUrl"
             [src]="videoUrl"
             class="absolute inset-0 w-full h-full object-cover z-10"
             autoplay
             loop
             playsinline
             muted>
      </video>
      
      <!-- Gradient Overlay (Renders on top of video/image to maintain text legibility) -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-20 pointer-events-none"></div>

      <!-- Group Avatar -->
      <div class="absolute top-3 left-3 w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary p-0.5 bg-surface-container z-30">
        <img [src]="authorAvatar" class="w-full h-full rounded-full object-cover">
      </div>

      <!-- Follow Status Badge -->
      <div class="absolute top-3 right-3 z-30">
        <ng-container *ngIf="isFollowed; else recommendBtn">
          <span class="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#10B981]/95 backdrop-blur-md text-white border border-emerald-400/30 shadow-md animate-fade-in">
            <span class="material-symbols-outlined text-xs md:text-sm font-black">check</span>
          </span>
        </ng-container>
        <ng-template #recommendBtn>
          <button (click)="onFollowClick($event)" class="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/95 hover:bg-primary text-on-primary border border-white/10 hover:scale-110 active:scale-95 transition-all shadow-md hover:shadow-primary/30">
            <span class="material-symbols-outlined text-xs md:text-sm font-black">add</span>
          </button>
        </ng-template>
      </div>

      <!-- Like/Reaction Button (Bottom Right) -->
      <button (click)="toggleLike($event)"
              [ngClass]="isLiked ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-105' : 'bg-white/10 text-white hover:bg-primary hover:text-on-primary'"
              class="absolute bottom-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all z-30">
        <span class="material-symbols-outlined text-sm">music_note</span>
      </button>

      <!-- Group Name -->
      <div class="absolute bottom-3 left-3 right-12 z-30">
        <p class="text-[10px] md:text-xs font-bold text-white truncate drop-shadow-md flex items-center gap-1">
          <span *ngIf="isVideo" class="material-symbols-outlined text-[10px] md:text-xs text-primary drop-shadow-md shrink-0">play_circle</span>
          {{ authorName }}
        </p>
      </div>
    </div>
  `
})
export class StoryCard {
  @Input() authorName: string = '';
  @Input() authorAvatar: string = '';
  @Input() thumbnailUrl: string = '';
  @Input() isVideo: boolean = false;
  @Input() isFollowed: boolean = false;
  @Input() videoUrl: string = '';

  @Output() followToggle = new EventEmitter<void>();
  @Output() cardClick = new EventEmitter<void>();

  isHovered = false;
  isLiked = false;

  onMouseEnter() {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    if (isDesktop) {
      this.isHovered = true;
    }
  }

  onMouseLeave() {
    this.isHovered = false;
  }

  onFollowClick(event: Event) {
    event.stopPropagation();
    this.followToggle.emit();
  }

  onCardClick() {
    this.cardClick.emit();
  }

  toggleLike(event: Event) {
    event.stopPropagation();
    this.isLiked = !this.isLiked;
  }
}


