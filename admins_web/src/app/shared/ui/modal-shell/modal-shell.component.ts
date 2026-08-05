import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalShellSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[90000] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in" (click)="onBackdropClick()">
      <div
        class="w-full bg-surface-container rounded-3xl border border-outline-variant/40 shadow-[0_25px_70px_rgba(0,0,0,0.9)] max-h-[94vh] flex flex-col overflow-hidden"
        [ngClass]="getSizeClass()"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="shrink-0 flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-outline-variant/20 bg-surface-container-high/60 backdrop-blur-xl">
          <div class="min-w-0">
            @if (icon) {
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-primary text-2xl shrink-0 font-bold">{{ icon }}</span>
                <h3 class="text-lg sm:text-xl font-black text-on-surface truncate tracking-tight">{{ title }}</h3>
              </div>
            } @else {
              <h3 class="text-lg sm:text-xl font-black text-on-surface truncate tracking-tight">{{ title }}</h3>
            }
            @if (subtitle) {
              <p class="text-xs text-outline mt-0.5 font-semibold">{{ subtitle }}</p>
            }
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="shrink-0 inline-flex items-center justify-center min-w-10 min-h-10 w-10 h-10 rounded-2xl bg-surface-container-highest hover:bg-surface-bright text-outline hover:text-on-surface transition-all border border-outline-variant/30 shadow-sm hover:scale-105 active:scale-95"
          >
            <span class="material-symbols-outlined text-xl font-bold">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 custom-scrollbar space-y-6">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        @if (hasFooter) {
          <div class="shrink-0 p-4 sm:p-6 border-t border-outline-variant/20 bg-surface-container-high/40 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
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
  @Input() size: ModalShellSize = '7xl';
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
      case '4xl': return 'max-w-4xl';
      case '5xl': return 'max-w-5xl';
      case '6xl': return 'max-w-6xl';
      case '7xl': return 'max-w-[1400px]';
      case 'full': return 'max-w-[96vw] h-[92vh]';
      default: return 'max-w-[1400px]';
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.closed.emit();
    }
  }
}
