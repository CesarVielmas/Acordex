import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'secondary' | 'purple';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border whitespace-nowrap"
      [ngClass]="getVariantClass()"
    >
      @if (icon) {
        <span class="material-symbols-outlined text-xs sm:text-sm">{{ icon }}</span>
      }
      {{ label }}
    </span>
  `
})
export class BadgeComponent {
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() variant: BadgeVariant = 'neutral';

  getVariantClass(): string {
    switch (this.variant) {
      case 'success': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'warning': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'error': return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'info': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'primary': return 'bg-primary/20 text-primary border-primary/30';
      case 'secondary': return 'bg-secondary-container/40 text-secondary border-secondary/30';
      case 'purple': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-surface-container-high text-outline border-outline-variant/40';
    }
  }
}
