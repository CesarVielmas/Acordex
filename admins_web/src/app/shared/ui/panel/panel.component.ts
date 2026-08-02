import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-5 sm:p-6 lg:p-8 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-5 sm:space-y-6">
      @if (title) {
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
            @if (icon) {
              <span class="material-symbols-outlined text-primary">{{ icon }}</span>
            }
            {{ title }}
          </h3>
          @if (hasHeaderAction) {
            <ng-content select="[panel-header-action]"></ng-content>
          }
        </div>
      }
      <ng-content></ng-content>
    </div>
  `
})
export class PanelComponent {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() hasHeaderAction: boolean = false;
}
