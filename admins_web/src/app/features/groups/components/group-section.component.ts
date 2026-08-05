import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SectionTone = 'primary' | 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose' | 'neutral';

/**
 * Contenedor de sección del expediente de grupo con soporte opcional para colapsado/acordeón.
 */
@Component({
  selector: 'app-group-section',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section
      class="rounded-3xl bg-surface-container-high/95 border shadow-lg overflow-hidden transition-all duration-300"
      [class]="borderClass()"
    >
      <header
        class="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 border-b border-outline-variant/20 bg-surface-container/40 select-none"
        [class.cursor-pointer]="collapsible()"
        (click)="toggleCollapse()"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <span
            class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
            [class]="iconClass()"
          >
            <span class="material-symbols-outlined text-base">{{ icon() }}</span>
          </span>

          <div class="min-w-0">
            <h3 class="text-xs font-black uppercase tracking-wider truncate" [class]="titleClass()">
              {{ title() }}
            </h3>
            @if (subtitle()) {
              <p class="text-[11px] text-outline truncate">{{ subtitle() }}</p>
            }
          </div>
        </div>

        <div class="shrink-0 flex items-center gap-2" (click)="$event.stopPropagation()">
          <ng-content select="[section-actions]" />

          @if (collapsible()) {
            <button
              type="button"
              (click)="toggleCollapse()"
              class="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-bright text-outline hover:text-on-surface flex items-center justify-center transition-transform duration-300"
              [class.rotate-180]="!collapsed()"
              title="Desplegar / Ocultar"
            >
              <span class="material-symbols-outlined text-sm font-bold">expand_more</span>
            </button>
          }
        </div>
      </header>

      @if (!collapsed()) {
        <div class="p-4 sm:p-5 animate-fade-in">
          <ng-content />
        </div>
      }
    </section>
  `
})
export class GroupSectionComponent {
  title = input.required<string>();
  icon = input.required<string>();
  subtitle = input<string>('');
  tone = input<SectionTone>('primary');
  collapsible = input<boolean>(false);
  initiallyCollapsed = input<boolean>(false);

  collapsed = signal<boolean>(false);

  ngOnInit(): void {
    if (this.initiallyCollapsed()) {
      this.collapsed.set(true);
    }
  }

  toggleCollapse(): void {
    if (this.collapsible()) {
      this.collapsed.set(!this.collapsed());
    }
  }

  borderClass(): string {
    switch (this.tone()) {
      case 'emerald': return 'border-emerald-500/30 hover:border-emerald-500/50';
      case 'amber': return 'border-amber-500/30 hover:border-amber-500/50';
      case 'cyan': return 'border-cyan-500/30 hover:border-cyan-500/50';
      case 'purple': return 'border-purple-500/30 hover:border-purple-500/50';
      case 'rose': return 'border-rose-500/30 hover:border-rose-500/50';
      case 'neutral': return 'border-outline-variant/30 hover:border-outline-variant/50';
      default: return 'border-primary/25 hover:border-primary/40';
    }
  }

  iconClass(): string {
    switch (this.tone()) {
      case 'emerald': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'amber': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'cyan': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'purple': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'rose': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'neutral': return 'bg-surface-container text-outline border-outline-variant/30';
      default: return 'bg-primary/15 text-primary border-primary/30';
    }
  }

  titleClass(): string {
    switch (this.tone()) {
      case 'emerald': return 'text-emerald-300';
      case 'amber': return 'text-amber-300';
      case 'cyan': return 'text-cyan-300';
      case 'purple': return 'text-purple-300';
      case 'rose': return 'text-rose-300';
      case 'neutral': return 'text-on-surface';
      default: return 'text-primary';
    }
  }
}
