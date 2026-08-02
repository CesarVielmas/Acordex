import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-entity-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-5 sm:p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl hover:border-primary/40 transition-all space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-start gap-4">
        @if (hasVisual) {
          <div class="shrink-0 self-start">
            <ng-content select="[card-visual]"></ng-content>
          </div>
        }
        <div class="flex-1 min-w-0 space-y-1.5">
          @if (hasBadges) {
            <div class="flex items-center gap-2 flex-wrap">
              <ng-content select="[card-badges]"></ng-content>
            </div>
          }
          <h3 class="text-sm sm:text-base font-bold text-on-surface truncate" [title]="title">{{ title }}</h3>
          @if (subtitle) {
            <p class="text-xs text-outline font-medium truncate">{{ subtitle }}</p>
          }
          @if (description) {
            <p class="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{{ description }}</p>
          }
        </div>
      </div>

      @if (hasStats) {
        <div>
          <ng-content select="[card-stats]"></ng-content>
        </div>
      }

      @if (hasFooter) {
        <div class="pt-1">
          <ng-content select="[card-footer]"></ng-content>
        </div>
      }
    </div>
  `
})
export class EntityCardComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() description: string = '';
  @Input() hasVisual: boolean = true;
  @Input() hasBadges: boolean = true;
  @Input() hasStats: boolean = true;
  @Input() hasFooter: boolean = true;
}
