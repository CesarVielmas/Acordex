import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalShellSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[99999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 py-4 sm:py-8 animate-fade-in" (click)="onBackdropClick()">
      <div
        class="w-full bg-surface-container rounded-3xl border border-outline-variant/40 shadow-[0_25px_85px_rgba(0,0,0,0.95)] max-h-[92vh] my-auto flex flex-col overflow-hidden backdrop-blur-2xl transition-all duration-500 ease-out"
        [ngClass]="getSizeClass()"
        [style.margin-right]="reservedRightVw ? reservedRightVw + 'vw' : null"
        [style.max-width]="reservedRightVw ? 'calc(' + (96 - reservedRightVw) + 'vw)' : null"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="shrink-0 flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-outline-variant/20 bg-surface-container-high/80 backdrop-blur-2xl">
          <div class="min-w-0">
            @if (icon) {
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-md">
                  <span class="material-symbols-outlined text-2xl font-bold">{{ icon }}</span>
                </div>
                <h3 class="text-lg sm:text-xl font-black text-on-surface truncate tracking-tight">{{ title }}</h3>
              </div>
            } @else {
              <h3 class="text-lg sm:text-xl font-black text-on-surface truncate tracking-tight">{{ title }}</h3>
            }
            @if (subtitle) {
              <p class="text-xs text-outline mt-1 font-semibold pl-0.5">{{ subtitle }}</p>
            }
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="shrink-0 inline-flex items-center justify-center min-w-11 min-h-11 w-11 h-11 rounded-2xl bg-surface-container-highest hover:bg-surface-bright text-outline hover:text-on-surface transition-all border border-outline-variant/30 shadow-md hover:scale-105 active:scale-95"
          >
            <span class="material-symbols-outlined text-xl font-bold">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8 custom-scrollbar space-y-6">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        @if (hasFooter) {
          <div class="shrink-0 p-4 sm:px-6 sm:py-5 border-t border-outline-variant/25 bg-surface-container-high/90 backdrop-blur-2xl flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <ng-content select="[modal-footer]"></ng-content>
          </div>
        }
      </div>

      <!-- Proyección del Modal Window Lateral (Side Preview Modal) -->
      <ng-content select="[side-modal]"></ng-content>
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
  /**
   * Ancho (en vw) que se reserva a la derecha para un panel acompañante, como
   * la vista previa del cliente. El modal se corre a la izquierda y se estrecha
   * en vez de quedar tapado por el panel. En 0 el modal se centra como siempre
   * y no se toca su ancho máximo.
   */
  @Input() reservedRightVw: number = 0;
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
