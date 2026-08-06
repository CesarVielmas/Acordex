import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  ElementRef,
  HostListener,
  ViewChild,
  TemplateRef,
  ViewContainerRef,
  EmbeddedViewRef,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  badge?: string;
  color?: string;
}

/** Coordenadas del desplegable, en el sistema del viewport. */
interface PopoverRect {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

/**
 * Select personalizado.
 *
 * El desplegable se monta en `document.body` como vista embebida (un portal
 * casero, porque el proyecto no usa el CDK) y se posiciona con `position:
 * fixed` calculado desde el recuadro del disparador.
 *
 * Las dos cosas son necesarias. Varias tarjetas del panel llevan
 * `backdrop-blur`, y un ancestro con filtro no solo crea un contexto de
 * apilamiento que atrapa al desplegable por más z-index que se le ponga: además
 * pasa a ser su bloque contenedor, así que ni siquiera `position: fixed` se
 * mide ya contra el viewport. Sacar el nodo del árbol resuelve ambas.
 *
 * Además se voltea hacia arriba cuando no cabe abajo, y se recoloca si la
 * página se desplaza o cambia de tamaño.
 */
@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="relative w-full text-xs">
      @if (label()) {
        <label [attr.for]="triggerId" class="block text-[10px] font-black uppercase tracking-wider text-outline mb-1.5">
          {{ label() }}
        </label>
      }

      <button
        #trigger
        [id]="triggerId"
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="listboxId"
        (click)="toggleOpen($event)"
        (keydown)="onTriggerKeydown($event)"
        class="w-full py-2.5 px-3.5 rounded-2xl bg-[#18152a] hover:bg-[#1f1b36] border border-outline-variant/50 hover:border-primary/70 text-on-surface font-extrabold flex items-center justify-between gap-2 shadow-md transition-all duration-200"
        [class.ring-2]="isOpen()"
        [class.ring-primary]="isOpen()"
        [class.border-primary]="isOpen()"
      >
        <div class="flex items-center gap-2 min-w-0">
          @if (selectedOption()?.icon; as icon) {
            <span class="material-symbols-outlined text-sm text-primary shrink-0">{{ icon }}</span>
          }
          <span class="truncate text-xs font-black">
            {{ selectedOption()?.label || placeholder() }}
          </span>
        </div>

        <span
          class="material-symbols-outlined text-base text-primary transition-transform duration-300 shrink-0 font-bold"
          [class.rotate-180]="isOpen()"
        >
          expand_more
        </span>
      </button>

    </div>

    <!-- Popover desplegable flotante con alta elevación z-[99999] -->
    <ng-template #popoverTpl>
      @if (rect(); as r) {
        <div
          [id]="listboxId"
          role="listbox"
          [attr.aria-activedescendant]="optionId(activeIndex())"
          class="fixed z-[99999] p-1.5 rounded-2xl bg-[#18152a]/98 backdrop-blur-3xl border border-primary/50 shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-1 overflow-y-auto custom-scrollbar animate-fade-in text-xs"
          [style.top.px]="r.top"
          [style.left.px]="r.left"
          [style.width.px]="r.width"
          [style.maxHeight.px]="r.maxHeight"
        >
          @for (opt of options(); track opt.value; let i = $index) {
            <button
              [id]="optionId(i)"
              type="button"
              role="option"
              [attr.aria-selected]="effectiveValue() === opt.value"
              (click)="selectOption(opt.value, $event)"
              (mouseenter)="activeIndex.set(i)"
              class="w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-between gap-2 transition-all text-left"
              [ngClass]="optionClass(opt, i)"
            >
              <div class="flex items-center gap-2 min-w-0">
                @if (opt.icon) {
                  <span
                    class="material-symbols-outlined text-sm shrink-0"
                    [ngClass]="effectiveValue() === opt.value ? 'text-on-primary' : 'text-primary'"
                  >
                    {{ opt.icon }}
                  </span>
                }
                <span class="truncate font-black text-xs">{{ opt.label }}</span>
              </div>

              @if (opt.badge) {
                <span
                  class="text-[9px] px-2 py-0.5 rounded-full font-black uppercase shrink-0"
                  [ngClass]="effectiveValue() === opt.value ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-bright text-outline border border-outline-variant/30'"
                >
                  {{ opt.badge }}
                </span>
              }
            </button>
          }
        </div>
      }
    </ng-template>
  `
})
export class CustomSelectComponent implements OnDestroy {
  private static nextId = 0;
  private readonly uid = CustomSelectComponent.nextId++;
  protected readonly triggerId = `acx-select-${this.uid}`;
  protected readonly listboxId = `acx-listbox-${this.uid}`;

  private readonly OFFSET = 6;
  private readonly VIEWPORT_MARGIN = 12;

  options = input.required<SelectOption[]>();
  value = input<string>('ALL');
  placeholder = input<string>('Seleccionar...');
  label = input<string>('');

  valueChange = output<string>();

  isOpen = signal<boolean>(false);
  internalValue = signal<string | null>(null);
  activeIndex = signal<number>(-1);
  rect = signal<PopoverRect | null>(null);

  @ViewChild('trigger') private triggerRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('popoverTpl') private popoverTpl?: TemplateRef<unknown>;

  private readonly vcr = inject(ViewContainerRef);
  private popoverView: EmbeddedViewRef<unknown> | null = null;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnDestroy(): void {
    this.detachPopover();
  }

  private attachPopover(): void {
    if (this.popoverView || !this.popoverTpl) return;
    this.popoverView = this.vcr.createEmbeddedView(this.popoverTpl);
    this.popoverView.detectChanges();
    this.popoverView.rootNodes.forEach(node => {
      if (node instanceof Node) document.body.appendChild(node);
    });
  }

  private detachPopover(): void {
    this.popoverView?.destroy();
    this.popoverView = null;
  }

  effectiveValue = computed<string>(() => this.internalValue() ?? this.value() ?? '');

  selectedOption = computed<SelectOption | null>(() => {
    const val = this.effectiveValue();
    const opts = this.options();
    return opts.find(o => o.value === val) || opts[0] || null;
  });

  protected optionId(index: number): string {
    return `${this.listboxId}-opt-${index}`;
  }

  protected optionClass(opt: SelectOption, index: number): string {
    if (this.effectiveValue() === opt.value) return 'bg-primary text-on-primary shadow-sm';
    return index === this.activeIndex()
      ? 'text-on-surface bg-surface-container-highest'
      : 'text-on-surface hover:bg-surface-container-highest';
  }

  toggleOpen(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    this.activeIndex.set(this.options().findIndex(o => o.value === this.effectiveValue()));
    this.updateRect();
    this.isOpen.set(true);
    this.attachPopover();
  }

  close(): void {
    this.isOpen.set(false);
    this.activeIndex.set(-1);
    this.detachPopover();
  }

  selectOption(val: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.internalValue.set(val);
    this.valueChange.emit(val);
    this.close();
    this.triggerRef?.nativeElement.focus();
  }

  private updateRect(): void {
    const el = this.triggerRef?.nativeElement;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - this.OFFSET - this.VIEWPORT_MARGIN;
    const spaceAbove = r.top - this.OFFSET - this.VIEWPORT_MARGIN;
    const preferred = 260;

    const openUp = spaceBelow < Math.min(preferred, 160) && spaceAbove > spaceBelow;
    const maxHeight = Math.max(140, Math.min(preferred, openUp ? spaceAbove : spaceBelow));

    const left = Math.min(
      Math.max(this.VIEWPORT_MARGIN, r.left),
      Math.max(this.VIEWPORT_MARGIN, window.innerWidth - r.width - this.VIEWPORT_MARGIN)
    );

    this.rect.set({
      top: openUp ? r.top - this.OFFSET - maxHeight : r.bottom + this.OFFSET,
      left,
      width: r.width,
      maxHeight
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.isOpen()) return;
    const target = event.target as Node;
    const insideHost = this.elementRef.nativeElement.contains(target);
    const insideList = !!document.getElementById(this.listboxId)?.contains(target);
    if (!insideHost && !insideList) this.close();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange(): void {
    if (this.isOpen()) this.updateRect();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    if (!count) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
          return;
        }
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        this.activeIndex.update(i => (i + delta + count) % count);
        break;
      }
      case 'Home':
        if (this.isOpen()) { event.preventDefault(); this.activeIndex.set(0); }
        break;
      case 'End':
        if (this.isOpen()) { event.preventDefault(); this.activeIndex.set(count - 1); }
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (!this.isOpen()) { this.open(); return; }
        const opt = this.options()[this.activeIndex()];
        if (opt) this.selectOption(opt.value);
        break;
      }
      case 'Escape':
        if (this.isOpen()) { event.preventDefault(); this.close(); }
        break;
      case 'Tab':
        this.close();
        break;
    }
  }
}
