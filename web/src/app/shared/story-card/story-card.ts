import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-story-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative flex-shrink-0 w-24 md:w-32 h-40 md:h-52 rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-primary/20 transition-all duration-300 border-2 border-primary/20 hover:border-primary">
      <!-- Background Media -->
      <img [src]="thumbnailUrl" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
      
      <!-- Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>

      <!-- Group Avatar -->
      <div class="absolute top-3 left-3 w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary p-0.5 bg-surface-container">
        <img [src]="authorAvatar" class="w-full h-full rounded-full object-cover">
      </div>

      <!-- Like Button/Reaction (Bottom Right) -->
      <button class="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary hover:text-on-primary transition-colors">
        <span class="material-symbols-outlined text-sm">favorite</span>
      </button>

      <!-- Group Name -->
      <div class="absolute bottom-3 left-3 right-12">
        <p class="text-[10px] md:text-xs font-bold text-white truncate drop-shadow-md">{{ authorName }}</p>
      </div>

      <!-- Video Indicator -->
      <div *ngIf="isVideo" class="absolute top-3 right-3">
        <span class="material-symbols-outlined text-white text-sm md:text-base drop-shadow-md">play_circle</span>
      </div>
    </div>
  `
})
export class StoryCard {
  @Input() authorName: string = '';
  @Input() authorAvatar: string = '';
  @Input() thumbnailUrl: string = '';
  @Input() isVideo: boolean = false;
}
