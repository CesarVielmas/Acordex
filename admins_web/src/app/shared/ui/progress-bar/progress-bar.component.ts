import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ProgressBarColorVariant = 'primary' | 'success' | 'warning' | 'error' | 'secondary' | 'neutral';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      @if (label) {
        <div class="flex justify-between items-center gap-2 font-semibold mb-1 text-xs">
          <span class="text-on-surface-variant truncate min-w-0">{{ label }}</span>
          @if (valueLabel) {
            <span class="shrink-0" [ngClass]="getValueColorClass()">{{ valueLabel }}</span>
          }
        </div>
      }
      <div class="w-full h-2 sm:h-2.5 rounded-full bg-surface-bright overflow-hidden">
        <div class="h-full rounded-full transition-all duration-500" [ngClass]="getBarColorClass()" [style.width.%]="clampedPercent"></div>
      </div>
    </div>
  `
})
export class ProgressBarComponent {
  @Input() percent: number = 0;
  @Input() label: string = '';
  @Input() valueLabel: string = '';
  @Input() colorVariant: ProgressBarColorVariant = 'primary';

  get clampedPercent(): number {
    return Math.max(0, Math.min(100, this.percent));
  }

  getBarColorClass(): string {
    switch (this.colorVariant) {
      case 'success': return 'bg-emerald-400';
      case 'warning': return 'bg-amber-400';
      case 'error': return 'bg-red-400';
      case 'secondary': return 'bg-secondary';
      case 'neutral': return 'bg-outline';
      default: return 'bg-primary';
    }
  }

  getValueColorClass(): string {
    switch (this.colorVariant) {
      case 'success': return 'text-emerald-400 font-bold';
      case 'warning': return 'text-amber-400 font-bold';
      case 'error': return 'text-red-400 font-bold';
      case 'secondary': return 'text-secondary font-bold';
      default: return 'text-primary font-bold';
    }
  }
}
