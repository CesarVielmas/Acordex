import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type EventCardMode = 'upcoming' | 'history_review' | 'history_done';

@Component({
  selector: 'app-event-card',
  imports: [CommonModule],
  templateUrl: './event-card.html',
  styleUrl: './event-card.scss'
})
export class EventCard {
  @Input() id!: number;
  @Input() imageUrl: string = '';
  @Input() imageAlt: string = '';
  @Input() date: string = '';
  @Input() title: string = '';
  @Input() location: string = '';
  @Input() mode: EventCardMode = 'upcoming';
  @Input() rating: number = 0; // For history_done

  @Output() buy = new EventEmitter<number>();

  onBuyClick(event: MouseEvent) {
    event.stopPropagation();
    this.buy.emit(this.id);
  }
}
