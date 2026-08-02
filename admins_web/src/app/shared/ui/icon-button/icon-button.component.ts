import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      [attr.aria-label]="ariaLabel || icon"
      [title]="ariaLabel"
      (click)="pressed.emit()"
      class="relative inline-flex items-center justify-center min-w-11 min-h-11 w-11 h-11 rounded-2xl transition-all shrink-0"
      [ngClass]="getVariantClass()"
    >
      <span class="material-symbols-outlined text-xl pointer-events-none">{{ icon }}</span>
      @if (showDot) {
        <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-surface"></span>
      }
    </button>
  `
})
export class IconButtonComponent {
  @Input() icon: string = 'circle';
  @Input() ariaLabel: string = '';
  @Input() variant: 'default' | 'primary' | 'danger' | 'ghost' = 'default';
  @Input() showDot: boolean = false;
  @Output() pressed = new EventEmitter<void>();

  getVariantClass(): string {
    switch (this.variant) {
      case 'primary':
        return 'bg-primary text-on-primary hover:scale-105 shadow-md shadow-primary/20';
      case 'danger':
        return 'bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white';
      case 'ghost':
        return 'bg-transparent text-on-surface-variant hover:bg-white/5 hover:text-on-surface';
      default:
        return 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright hover:text-on-surface border border-outline-variant/30';
    }
  }
}
