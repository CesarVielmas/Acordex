import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-review-card',
  imports: [CommonModule],
  templateUrl: './review-card.html',
  styleUrl: './review-card.scss'
})
export class ReviewCard {
  @Input() userName: string = '';
  @Input() userAvatar: string = '';
  @Input() eventName: string = '';
  @Input() bandName: string = '';
  @Input() rating: number = 0;
  @Input() content: string = '';
  @Input() timeAgo: string = '';

  get starsArray() {
    return Array(5).fill(0).map((_, i) => i < this.rating);
  }
}
