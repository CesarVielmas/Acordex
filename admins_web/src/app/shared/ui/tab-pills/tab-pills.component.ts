import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabPillItem {
  value: string;
  label: string;
  icon?: string;
  badge?: string;
}

@Component({
  selector: 'app-tab-pills',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
      @for (tab of tabs; track tab.value) {
        <button
          type="button"
          (click)="change.emit(tab.value)"
          class="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 min-h-11 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
          [ngClass]="tab.value === active
            ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
            : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-bright border border-outline-variant/30'"
        >
          @if (tab.icon) {
            <span class="material-symbols-outlined text-base">{{ tab.icon }}</span>
          }
          {{ tab.label }}
          @if (tab.badge) {
            <span class="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-black/20">{{ tab.badge }}</span>
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
