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
      class="rounded-3xl bg-gradient-to-br from-[#18152a]/95 via-[#151226]/95 to-[#0f0c1b]/98 backdrop-blur-2xl border shadow-[0_12px_35px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 relative group/section"
      [class]="borderClass()"
    >
      <header
        class="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 border-b border-outline-variant/20 bg-[#161326]/60 backdrop-blur-md select-none relative"
        [class.cursor-pointer]="collapsible()"
        (click)="toggleCollapse()"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span
            class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-md transition-transform group-hover/section:scale-105"
            [class]="iconClass()"
          >
            <span class="material-symbols-outlined text-base font-bold">{{ icon() }}</span>
          </span>

          <div class="min-w-0">
            <h3 class="text-xs font-black uppercase tracking-wider truncate font-display-md" [class]="titleClass()">
              {{ title() }}
            </h3>
            @if (subtitle()) {
              <p class="text-[10px] text-outline font-bold truncate mt-0.5">{{ subtitle() }}</p>
            }
          </div>
        </div>

        <div class="shrink-0 flex items-center gap-2" (click)="$event.stopPropagation()">
          <ng-content select="[section-actions]" />

          @if (collapsible()) {
            <button
              type="button"
              (click)="toggleCollapse()"
              class="w-8 h-8 rounded-xl bg-surface-container-highest/80 hover:bg-primary/20 hover:text-primary text-outline border border-outline-variant/30 flex items-center justify-center transition-all duration-300 shadow-sm"
              [class.rotate-180]="!collapsed()"
              title="Desplegar / Ocultar"
            >
              <span class="material-symbols-outlined text-base font-bold">expand_more</span>
            </button>
          }
        </div>
      </header>

      @if (!collapsed()) {
        <div class="p-4 sm:p-6 animate-fade-in space-y-4">
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
