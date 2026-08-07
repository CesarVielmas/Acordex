import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabPillItem {
  value: string;
  label: string;
  icon?: string;
  badge?: string;
  /**
   * Color propio de la pestaña cuando está activa (clases Tailwind completas).
   * Darle a cada apartado su color hace que se reconozcan por color y no solo
   * por el texto. Si se omite, la pestaña usa el ámbar del sistema.
   */
  accentActiveClass?: string;
  /** Tinte del ícono y del texto cuando la pestaña está en reposo. */
  accentIdleClass?: string;
}

@Component({
  selector: 'app-tab-pills',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-1.5 rounded-2xl bg-surface-container-highest/50 border border-outline-variant/25 backdrop-blur-xl flex items-center gap-1.5 overflow-x-auto custom-scrollbar shadow-inner">
      @for (tab of tabs; track tab.value) {
        <button
          type="button"
          (click)="change.emit(tab.value)"
          class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-xl text-xs font-black tracking-wide whitespace-nowrap transition-all duration-300 relative group overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
          [ngClass]="tab.value === active
            ? (tab.accentActiveClass || 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black shadow-amber-500/25 border-amber-300/40') + ' shadow-lg scale-[1.03] border'
            : (tab.accentIdleClass || 'text-on-surface-variant') + ' hover:text-on-surface hover:bg-surface-container-high/80 border border-transparent'"
        >
          @if (tab.icon) {
            <span class="material-symbols-outlined text-base transition-transform group-hover:scale-110">{{ tab.icon }}</span>
          }
          <span>{{ tab.label }}</span>
          @if (tab.badge) {
            <span
              class="text-[10px] font-mono font-black px-2 py-0.5 rounded-lg transition-colors"
              [ngClass]="tab.value === active
                ? 'bg-black/25 text-current'
                : 'bg-surface-container-highest/80 text-outline border border-outline-variant/30 group-hover:text-on-surface'"
            >
              {{ tab.badge }}
            </span>
          }
        </button>
      }
    </div>
  `
})
export class TabPillsComponent {
  @Input() tabs: TabPillItem[] = [];
  @Input() active: string = '';
  @Output() change = new EventEmitter<string>();
}

