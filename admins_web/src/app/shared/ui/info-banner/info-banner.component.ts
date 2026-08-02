import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type InfoBannerVariant = 'info' | 'warning' | 'success' | 'neutral';

@Component({
  selector: 'app-info-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-lg flex flex-col sm:flex-row sm:items-center gap-4" [ngClass]="getContainerClass()">
      <div class="flex items-start sm:items-center gap-3 flex-1 min-w-0">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" [ngClass]="getIconBoxClass()">
          <span class="material-symbols-outlined text-xl">{{ icon }}</span>
        </div>
        <div class="min-w-0 space-y-1">
          <h4 class="text-sm font-bold text-on-surface">{{ title }}</h4>
          <div class="text-xs text-on-surface-variant leading-relaxed">
            <ng-content></ng-content>
          </div>
          @if (hasLegend) {
            <div class="flex items-center gap-2 flex-wrap pt-1">
              <ng-content select="[banner-legend]"></ng-content>
            </div>
          }
        </div>
      </div>

      @if (hasAction) {
        <div class="shrink-0 self-stretch sm:self-center flex items-center">
          <ng-content select="[banner-action]"></ng-content>
        </div>
      }
    </div>
  `
})
export class InfoBannerComponent {
  @Input() icon: string = 'info';
  @Input() title: string = '';
  @Input() variant: InfoBannerVariant = 'info';
  @Input() hasAction: boolean = false;
  @Input() hasLegend: boolean = false;

  getContainerClass(): string {
    switch (this.variant) {
      case 'warning': return 'bg-amber-500/5 border-amber-500/30';
      case 'success': return 'bg-emerald-500/5 border-emerald-500/30';
      case 'neutral': return 'bg-surface-container border-outline-variant/30';
      default: return 'bg-primary/5 border-primary/30';
    }
  }

  getIconBoxClass(): string {
    switch (this.variant) {
      case 'warning': return 'bg-amber-500/15 text-amber-400';
      case 'success': return 'bg-emerald-500/15 text-emerald-400';
      case 'neutral': return 'bg-surface-container-high text-outline';
      default: return 'bg-primary/15 text-primary';
    }
  }
}
