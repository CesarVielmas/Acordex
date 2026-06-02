import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-card',
  imports: [CommonModule],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss'
})
export class PostCard {
  @Input() authorName: string = '';
  @Input() authorAvatar: string = '';
  @Input() timeAgo: string = '';
  @Input() content: string = '';
  @Input() mediaUrl?: string;
  @Input() likes: number = 0;
  @Input() comments: number = 0;
}
