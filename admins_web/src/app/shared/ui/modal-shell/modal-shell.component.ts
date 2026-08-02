import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalShellSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in" (click)="onBackdropClick()">
      <div
        class="w-full bg-surface-container rounded-2xl sm:rounded-3xl border border-outline-variant/30 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        [ngClass]="getSizeClass()"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="shrink-0 flex items-start justify-between gap-3 p-4 sm:p-6 border-b border-outline-variant/20">
          <div class="min-w-0">
            @if (icon) {
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-xl shrink-0">{{ icon }}</span>
                <h3 class="text-base sm:text-lg font-bold text-on-surface truncate">{{ title }}</h3>
              </div>
            } @else {
              <h3 class="text-base sm:text-lg font-bold text-on-surface truncate">{{ title }}</h3>
            }
            @if (subtitle) {
              <p class="text-xs text-outline mt-0.5">{{ subtitle }}</p>
            }
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="shrink-0 inline-flex items-center justify-center min-w-9 min-h-9 w-9 h-9 rounded-xl bg-surface-container-high text-outline hover:text-on-surface hover:bg-surface-bright transition-all"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        @if (hasFooter) {
          <div class="shrink-0 p-4 sm:p-6 border-t border-outline-variant/20 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <ng-content select="[modal-footer]"></ng-content>
          </div>
        }
      </div>
    </div>
  `
})
export class ModalShellComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = '';
  @Input() size: ModalShellSize = 'xl';
  @Input() hasFooter: boolean = false;
  @Input() closeOnBackdrop: boolean = true;
  @Output() closed = new EventEmitter<void>();

  getSizeClass(): string {
    switch (this.size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case '2xl': return 'max-w-2xl';
      case '3xl': return 'max-w-3xl';
      default: return 'max-w-xl';
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.closed.emit();
    }
  }
}
