import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-band-card',
  imports: [CommonModule],
  templateUrl: './band-card.html',
  styleUrl: './band-card.scss'
})
export class BandCard {
  @Input() imageUrl: string = '';
  @Input() imageAlt: string = '';
  @Input() tag: string = '';
  @Input() rating: number = 0;
  @Input() name: string = '';
  @Input() location: string = '';
  @Input() availability: string = '';
  @Input() isFeatured: boolean = false;
  @Input() managerPhone: string = '';
  @Input() managerName: string = '';

  @Output() quote = new EventEmitter<void>();

  onQuoteClick(event: MouseEvent) {
    event.stopPropagation();
    this.quote.emit();
  }

  get genreBadgeClass(): string {
    const t = this.tag.toLowerCase();
    if (t.includes('sinaloense') || t.includes('banda')) {
      return 'bg-purple-500/80 border-purple-400/40 text-purple-100';
    }
    if (t.includes('norteño')) {
      return 'bg-blue-500/80 border-blue-400/40 text-blue-100';
    }
    if (t.includes('sierreño')) {
      return 'bg-orange-500/80 border-orange-400/40 text-orange-100';
    }
    if (t.includes('mariachi')) {
      return 'bg-amber-500/80 border-amber-400/40 text-amber-100';
    }
    return 'bg-white/10 border-white/20 text-white';
  }
}
