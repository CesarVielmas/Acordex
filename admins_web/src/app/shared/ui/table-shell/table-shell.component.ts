import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-shell',
  standalone: true,
  imports: [CommonModule],
  host: { class: 'block' },
  template: `
    <div class="rounded-2xl sm:rounded-3xl border border-outline-variant/30 bg-surface-container shadow-xl">
      @if (!isEmpty) {
        <!-- Desktop: full table -->
        <div class="hidden md:block">
          <ng-content select="[desktop-table]"></ng-content>
        </div>
        <!-- Mobile/tablet: stacked card rows -->
        <div class="md:hidden divide-y divide-outline-variant/10">
          <ng-content select="[mobile-cards]"></ng-content>
        </div>
      } @else {
        <div class="p-10 sm:p-14 text-center space-y-2">
          <span class="material-symbols-outlined text-4xl text-outline">{{ emptyIcon }}</span>
          <p class="text-sm text-outline font-medium">{{ emptyMessage }}</p>
        </div>
      }
    </div>
  `
})
export class TableShellComponent {
  @Input() isEmpty: boolean = false;
  @Input() emptyIcon: string = 'inbox';
  @Input() emptyMessage: string = 'No hay registros para mostrar.';
}
