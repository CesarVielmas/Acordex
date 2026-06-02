import { Component, Input } from '@angular/core';
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
}
