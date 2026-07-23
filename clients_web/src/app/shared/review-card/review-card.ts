import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-review-card',
  imports: [CommonModule],
  templateUrl: './review-card.html',
  styleUrl: './review-card.scss'
})
export class ReviewCard {
  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);

  @Input() userName: string = '';
  @Input() userAvatar: string = '';
  @Input() eventName: string = '';
  @Input() bandName: string = '';
  @Input() rating: number = 0;
  @Input() content: string = '';
  @Input() timeAgo: string = '';
  @Input() likes: number = 0;
  @Input() isLiked: boolean = false;

  @Output() likeToggle = new EventEmitter<boolean>();

  get starsArray() {
    return Array(5).fill(0).map((_, i) => i < this.rating);
  }

  onUserClick(event: MouseEvent) {
    event.stopPropagation();
    this.layoutService.openUserProfile({
      userName: this.userName,
      userAvatar: this.userAvatar
    });
  }

  onLikeClick(event: MouseEvent) {
    event.stopPropagation();
    this.likeToggle.emit(!this.isLiked);
  }

  onBandClick(event: MouseEvent) {
    event.stopPropagation();
    const slug = this.bandName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    this.router.navigate(['/grupo', slug]);
  }
}
