import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type KpiColorVariant = 'primary' | 'success' | 'warning' | 'info' | 'secondary' | 'neutral';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 sm:p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden hover:border-primary/50 transition-all shadow-md group">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[10px] sm:text-xs font-bold text-outline uppercase tracking-wider">{{ label }}</span>
        @if (icon) {
          <div
            class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
            [ngClass]="getIconBoxClass()"
          >
            <span class="material-symbols-outlined text-xl sm:text-2xl">{{ icon }}</span>
          </div>
        }
      </div>
      <p class="text-xl sm:text-2xl font-black mt-3" [ngClass]="getValueClass()">
        {{ value }}
        @if (unit) {
          <span class="text-xs font-medium text-outline">{{ unit }}</span>
        }
      </p>
      @if (trend) {
        <div class="flex items-center gap-1.5 text-xs mt-2 font-medium" [ngClass]="getTrendClass()">
          @if (trendIcon) {
            <span class="material-symbols-outlined text-sm">{{ trendIcon }}</span>
          }
          <span>{{ trend }}</span>
        </div>
      }
    </div>
  `
})
export class KpiCardComponent {
  @Input() label: string = '';
  @Input() value: string = '';
  @Input() unit: string = '';
  @Input() icon: string = '';
  @Input() trend: string = '';
  @Input() trendIcon: string = '';
  @Input() colorVariant: KpiColorVariant = 'primary';

  getIconBoxClass(): string {
    switch (this.colorVariant) {
      case 'success': return 'bg-emerald-500/10 text-emerald-400';
      case 'warning': return 'bg-amber-500/10 text-amber-400';
      case 'info': return 'bg-cyan-500/10 text-cyan-400';
      case 'secondary': return 'bg-secondary-container/40 text-secondary';
      case 'neutral': return 'bg-surface-bright text-outline';
      default: return 'bg-primary/10 text-primary';
    }
  }

  getValueClass(): string {
    switch (this.colorVariant) {
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'info': return 'text-cyan-400';
      default: return 'text-on-surface';
    }
  }

  getTrendClass(): string {
    switch (this.colorVariant) {
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      default: return 'text-outline';
    }
  }
}
