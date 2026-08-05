import { Component, input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { buildSeries, hoverBandStart, hoverBandWidth } from './chart-geometry';

/** Una serie del sparkline: sus valores, su color y cómo nombrarla en el tooltip. */
export interface SparkSeries {
  /** Clave estable; se usa para el id del degradado y para el track del @for. */
  key: string;
  label: string;
  values: number[];
  /** Color del trazo, en formato CSS. */
  color: string;
  /** Sufijo del valor en el tooltip (ej. "cotizaciones"). */
  unit?: string;
}

/**
 * Sparkline compacto e interactivo.
 *
 * Nace de la tarjeta de grupo, que dibujaba una curva bonita pero muerta: no
 * se podía saber a qué día correspondía cada pico. Aquí la curva responde al
 * cursor con una guía vertical, un nodo por serie y un tooltip con las cifras
 * del día, que es la misma gramática de interacción del panel grande.
 *
 * Es presentacional y `OnPush`: recibe series ya calculadas y no conoce el
 * dominio (grupos, cotizaciones, etc.).
 */
@Component({
  selector: 'app-spark-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="relative w-full"
      [style.height.px]="height()"
      (mouseleave)="hoverIndex.set(null)"
    >
      <svg
        class="w-full h-full overflow-visible"
        [attr.viewBox]="'0 0 ' + VIEW_W + ' ' + VIEW_H"
        preserveAspectRatio="none"
        role="img"
        [attr.aria-label]="ariaLabel()"
      >
        <defs>
          @for (s of series(); track s.key) {
            <linearGradient [id]="gradientId(s.key)" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" [attr.stop-color]="s.color" stop-opacity="0.4" />
              <stop offset="100%" [attr.stop-color]="s.color" stop-opacity="0" />
            </linearGradient>
          }
        </defs>

        @for (s of resolvedSeries(); track s.key) {
          <path [attr.d]="s.areaPath" [attr.fill]="'url(#' + gradientId(s.key) + ')'" />
          <path
            [attr.d]="s.linePath"
            fill="none"
            [attr.stroke]="s.color"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        }

        <!-- Guía y nodos del punto bajo el cursor -->
        @if (hoverIndex() !== null) {
          <line
            [attr.x1]="hoverX()"
            y1="0"
            [attr.x2]="hoverX()"
            [attr.y2]="VIEW_H"
            stroke="currentColor"
            class="text-primary/70"
            stroke-width="1"
            stroke-dasharray="3,3"
          />
          @for (s of resolvedSeries(); track s.key) {
            <circle
              [attr.cx]="s.points[hoverIndex()!].x"
              [attr.cy]="s.points[hoverIndex()!].y"
              r="3.5"
              [attr.fill]="s.color"
              stroke="#ffffff"
              stroke-width="1.5"
            />
          }
        }

        <!-- Franjas invisibles: hacen que el gráfico responda en cualquier x -->
        @for (label of labels(); track $index) {
          <rect
            [attr.x]="bandStart($index)"
            y="0"
            [attr.width]="bandWidth()"
            [attr.height]="VIEW_H"
            fill="transparent"
            class="cursor-pointer"
            (mouseenter)="hoverIndex.set($index)"
          />
        }
      </svg>

      <!-- Tooltip. Se ancla al punto y se recorta contra los bordes del contenedor. -->
      @if (hoverIndex(); as idx) {
        <div
          class="absolute z-20 pointer-events-none rounded-xl bg-[#161325] border border-primary/50 shadow-[0_12px_30px_rgba(0,0,0,0.85)] px-2.5 py-2 space-y-1 whitespace-nowrap"
          [style.left.%]="tooltipLeftPercent()"
          [style.transform]="tooltipTransform()"
          style="top: 0"
        >
          <div class="text-[9px] font-black uppercase tracking-wider text-primary">
            {{ labels()[idx] }}
          </div>
          @for (s of series(); track s.key) {
            <div class="flex items-center gap-1.5 text-[10px] font-bold">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" [style.background]="s.color"></span>
              <span class="text-outline">{{ s.label }}:</span>
              <span class="text-on-surface font-black">{{ s.values[idx] }}{{ s.unit ? ' ' + s.unit : '' }}</span>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class SparkChartComponent {
  /** Sistema de coordenadas interno; el SVG escala solo al ancho real. */
  protected readonly VIEW_W = 200;
  protected readonly VIEW_H = 40;
  private readonly PADDING = 5;

  series = input.required<SparkSeries[]>();
  /** Etiqueta de cada punto en el eje x (ej. "Jue", "Vie"). */
  labels = input.required<string[]>();
  height = input<number>(48);
  /** Prefijo para los ids de degradado, para no colisionar entre instancias. */
  idPrefix = input<string>('spark');
  ariaLabel = input<string>('Gráfico de actividad');

  hoverIndex = signal<number | null>(null);

  /** Escala común a todas las series, para que sean comparables entre sí. */
  private scaleMax = computed(() => {
    const all = this.series().flatMap(s => s.values);
    return all.length ? Math.max(...all) : 1;
  });

  resolvedSeries = computed(() =>
    this.series().map(s => ({
      ...s,
      ...buildSeries(s.values, {
        width: this.VIEW_W,
        height: this.VIEW_H,
        padding: this.PADDING,
        max: this.scaleMax()
      })
    }))
  );

  gradientId(key: string): string {
    return `${this.idPrefix()}-${key}-grad`;
  }

  bandWidth(): number {
    return hoverBandWidth(this.labels().length, this.VIEW_W, this.PADDING);
  }

  bandStart(index: number): number {
    return hoverBandStart(index, this.labels().length, this.VIEW_W, this.PADDING);
  }

  hoverX(): number {
    const idx = this.hoverIndex();
    const first = this.resolvedSeries()[0];
    if (idx === null || !first) return 0;
    return first.points[idx]?.x ?? 0;
  }

  /** Posición horizontal del tooltip, en % del ancho del contenedor. */
  tooltipLeftPercent(): number {
    return (this.hoverX() / this.VIEW_W) * 100;
  }

  /**
   * Centra el tooltip sobre el punto, salvo en los extremos, donde lo alinea
   * al borde para que no se salga de la tarjeta.
   */
  tooltipTransform(): string {
    const pct = this.tooltipLeftPercent();
    if (pct < 25) return 'translateX(0)';
    if (pct > 75) return 'translateX(-100%)';
    return 'translateX(-50%)';
  }
}
