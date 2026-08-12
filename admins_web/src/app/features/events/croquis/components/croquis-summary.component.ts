import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CroquisPlan } from '../../../../core/models/croquis.models';
import { TicketTier } from '../../../../core/models/event.models';
import { croquisOverview, pesos, planInsights, tierInsights } from '../croquis-insights';
import { money } from '../../event-metrics';

/**
 * Todos los números del croquis, en un solo lugar.
 *
 * Vive aparte del editor porque hace falta en dos sitios distintos por razones
 * distintas: mientras se dibuja, para saber qué está costando cada decisión; y
 * en el expediente de un evento ya en venta —donde el croquis está bloqueado y
 * el editor no se abre— para saber cómo va la venta por zona y por categoría.
 * Duplicar las tablas habría garantizado que tarde o temprano dijeran cosas
 * distintas.
 */
@Component({
  selector: 'app-croquis-summary',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Container query y no breakpoints de pantalla: este resumen vive en dos
  // anchos muy distintos —el cajón del editor, que pierde 580px con los dos
  // rieles abiertos, y la pestaña del expediente, que los tiene completos— y
  // medir la pantalla haría que en el editor se apretaran seis columnas en el
  // espacio de tres.
  host: { class: 'block @container' },
  template: `
    <div class="space-y-4">

      <!-- ─── CIFRAS DEL EVENTO ─── -->
      <div class="grid grid-cols-2 @2xl:grid-cols-3 @6xl:grid-cols-6 gap-2.5">
        @for (kpi of cards(); track kpi.label) {
          <div class="p-3 rounded-2xl bg-surface-container-high/70 border border-outline-variant/25 min-w-0">
            <span class="block text-[9px] font-black uppercase tracking-wider text-outline truncate" [title]="kpi.label">
              {{ kpi.label }}
            </span>
            <span class="block text-base font-black font-mono truncate" [class]="kpi.tone" [title]="kpi.value">
              {{ kpi.value }}
            </span>
            <span class="block text-[9px] text-outline leading-snug">{{ kpi.hint }}</span>
          </div>
        }
      </div>

      <!-- ─── POR CATEGORÍA ─── -->
      <div class="rounded-2xl bg-surface-container-high/60 border border-outline-variant/25 overflow-hidden">
        <div class="px-3 py-2 border-b border-outline-variant/20 flex items-center gap-2">
          <span class="material-symbols-outlined text-[15px] text-cyan-300">confirmation_number</span>
          <span class="text-[10px] font-black uppercase tracking-wider text-cyan-300">Por categoría de boleto</span>
        </div>
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-[11px] min-w-[640px]">
            <thead>
              <tr class="text-[9px] font-black uppercase tracking-wider text-outline">
                <th class="text-left px-3 py-2">Categoría</th>
                <th class="text-right px-2 py-2">Precio</th>
                <th class="text-right px-2 py-2">Lugares</th>
                <th class="text-right px-2 py-2">Numerados</th>
                <th class="text-right px-2 py-2">Aforo libre</th>
                <th class="text-right px-2 py-2">Vendidos</th>
                <th class="text-right px-2 py-2">Libres</th>
                @if (canViewFinances()) {
                  <th class="text-right px-2 py-2">Taquilla</th>
                  <th class="text-right px-3 py-2">Cobrado</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of tierRows(); track row.tier.id) {
                <tr class="border-t border-outline-variant/15">
                  <td class="px-3 py-2 min-w-0 max-w-[16rem]">
                    <span class="flex items-center gap-2 min-w-0">
                      <span class="w-2.5 h-2.5 rounded-full shrink-0 border border-white/15" [style.background-color]="row.tier.color"></span>
                      <span class="font-black text-on-surface truncate" [title]="row.tier.name">{{ row.tier.name }}</span>
                      <span class="text-[9px] text-outline shrink-0 font-mono">{{ row.sharePercent | number:'1.0-0' }}%</span>
                    </span>
                    <span class="block text-[9px] text-outline truncate mt-0.5" [title]="row.planNames.join(', ')">
                      {{ row.planNames.length ? row.planNames.join(' · ') : 'Sin lugares en el croquis' }}
                    </span>
                  </td>
                  <td class="text-right px-2 py-2 font-mono text-on-surface-variant whitespace-nowrap">
                    &#36;{{ (row.tier.price || 0).toLocaleString('es-MX') }}
                  </td>
                  <td class="text-right px-2 py-2 font-mono font-black whitespace-nowrap"
                    [class]="row.capacity > 0 ? 'text-on-surface' : 'text-rose-300'">
                    {{ row.capacity.toLocaleString('es-MX') }}
                  </td>
                  <td class="text-right px-2 py-2 font-mono text-outline whitespace-nowrap">{{ row.seated.toLocaleString('es-MX') }}</td>
                  <td class="text-right px-2 py-2 font-mono text-outline whitespace-nowrap">{{ row.general.toLocaleString('es-MX') }}</td>
                  <td class="text-right px-2 py-2 font-mono text-emerald-400 whitespace-nowrap">{{ row.sold.toLocaleString('es-MX') }}</td>
                  <td class="text-right px-2 py-2 font-mono text-on-surface-variant whitespace-nowrap">{{ row.available.toLocaleString('es-MX') }}</td>
                  @if (canViewFinances()) {
                    <td class="text-right px-2 py-2 font-mono text-primary whitespace-nowrap">{{ money(row.potential) }}</td>
                    <td class="text-right px-3 py-2 font-mono text-emerald-400 whitespace-nowrap">{{ money(row.collected) }}</td>
                  }
                </tr>
              } @empty {
                <tr><td colspan="9" class="px-3 py-4 text-center text-outline italic text-[11px]">Sin categorías de boleto.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- ─── POR CROQUIS ─── -->
      @if (plans().length > 1) {
        <div class="rounded-2xl bg-surface-container-high/60 border border-outline-variant/25 overflow-hidden">
          <div class="px-3 py-2 border-b border-outline-variant/20 flex items-center gap-2">
            <span class="material-symbols-outlined text-[15px] text-primary">layers</span>
            <span class="text-[10px] font-black uppercase tracking-wider text-primary">Por croquis</span>
          </div>
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-[11px] min-w-[560px]">
              <thead>
                <tr class="text-[9px] font-black uppercase tracking-wider text-outline">
                  <th class="text-left px-3 py-2">Zona</th>
                  <th class="text-right px-2 py-2">Áreas</th>
                  <th class="text-right px-2 py-2">Escenarios</th>
                  <th class="text-right px-2 py-2">Lugares</th>
                  <th class="text-right px-2 py-2">Vendidos</th>
                  <th class="text-right px-2 py-2">Ocupación</th>
                  @if (canViewFinances()) {
                    <th class="text-right px-3 py-2">Taquilla</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of planRows(); track row.plan.id) {
                  <tr
                    class="border-t border-outline-variant/15 transition-colors"
                    [class.cursor-pointer]="clickablePlans()"
                    [class.hover:bg-surface-container-high]="clickablePlans()"
                    (click)="clickablePlans() ? planPicked.emit(row.plan.id) : null"
                  >
                    <td class="px-3 py-2 min-w-0 max-w-[16rem]">
                      <span class="font-black text-on-surface truncate block" [title]="row.plan.name">{{ row.plan.name }}</span>
                      <span class="block text-[9px] text-outline truncate">
                        {{ row.seatedAreas }} con butacas · {{ row.generalAreas }} de aforo libre
                      </span>
                    </td>
                    <td class="text-right px-2 py-2 font-mono text-on-surface-variant">{{ row.plan.areas.length }}</td>
                    <td class="text-right px-2 py-2 font-mono"
                      [class]="row.stageCount ? 'text-on-surface-variant' : 'text-rose-300'">{{ row.stageCount }}</td>
                    <td class="text-right px-2 py-2 font-mono font-black text-on-surface whitespace-nowrap">{{ row.capacity.toLocaleString('es-MX') }}</td>
                    <td class="text-right px-2 py-2 font-mono text-emerald-400 whitespace-nowrap">{{ row.sold.toLocaleString('es-MX') }}</td>
                    <td class="text-right px-2 py-2 font-mono text-on-surface-variant whitespace-nowrap">{{ row.occupancy | number:'1.0-1' }}%</td>
                    @if (canViewFinances()) {
                      <td class="text-right px-3 py-2 font-mono text-primary whitespace-nowrap">{{ money(row.potential) }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (canViewFinances()) {
        <p class="text-[10px] text-outline leading-relaxed flex items-start gap-1.5">
          <span class="material-symbols-outlined text-[13px] shrink-0 mt-0.5 text-primary">info</span>
          <span class="min-w-0">
            La <strong class="text-on-surface">taquilla</strong> es el ingreso si se vendiera todo lo dibujado. No incluye el
            cargo por servicio, que suma <strong class="text-on-surface font-mono">{{ money(overview().serviceFeeTotal) }}</strong>
            aparte, ni descuenta cortesías o butacas bloqueadas: esas ya están fuera del aforo.
          </span>
        </p>
      }
    </div>
  `
})
export class CroquisSummaryComponent {
  plans = input.required<CroquisPlan[]>();
  tiers = input<TicketTier[]>([]);
  serviceFee = input<number>(0);
  canViewFinances = input<boolean>(true);
  /** En el editor, un clic en la fila salta a ese croquis; en la ficha no. */
  clickablePlans = input<boolean>(false);

  planPicked = output<string>();

  money = money;

  overview = computed(() => croquisOverview(this.plans(), this.tiers(), this.serviceFee()));
  tierRows = computed(() => tierInsights(this.plans(), this.tiers()));
  planRows = computed(() => planInsights(this.plans(), this.tiers()));

  /**
   * Las tarjetas de cabecera.
   *
   * Se arman aquí y no en el template porque cuáles aparecen depende del rol y
   * del estado: a quien no puede ver finanzas no se le muestran tarjetas vacías
   * donde iban los importes, y "fuera de venta" solo aparece si de verdad hay
   * algo apartado o bloqueado.
   */
  cards = computed<{ label: string; value: string; hint: string; tone: string }[]>(() => {
    const o = this.overview();

    const list = [
      {
        label: 'Aforo a la venta',
        value: o.capacity.toLocaleString('es-MX'),
        hint: `${o.planCount} croquis · ${o.areaCount} áreas`,
        tone: 'text-on-surface'
      },
      {
        label: 'Vendidos',
        value: `${o.sold.toLocaleString('es-MX')} · ${o.occupancy.toFixed(0)}%`,
        hint: `${o.available.toLocaleString('es-MX')} libres`,
        tone: 'text-emerald-400'
      },
      {
        label: 'Numerados / libre',
        value: `${o.seatedCapacity.toLocaleString('es-MX')} / ${o.generalCapacity.toLocaleString('es-MX')}`,
        hint: `${o.seatCount.toLocaleString('es-MX')} butacas dibujadas`,
        tone: 'text-cyan-300'
      }
    ];

    if (o.held > 0 || o.blocked > 0) {
      list.push({
        label: 'Fuera de venta',
        value: (o.held + o.blocked).toLocaleString('es-MX'),
        hint: `${o.held} apartadas · ${o.blocked} bloqueadas`,
        tone: 'text-amber-300'
      });
    }

    if (this.canViewFinances()) {
      list.push(
        {
          label: 'Taquilla potencial',
          value: pesos(o.potential),
          hint: `Cobrado ${pesos(o.collected)}`,
          tone: 'text-primary'
        },
        {
          label: 'Boleto promedio',
          value: pesos(o.averagePrice),
          hint: o.minPrice ? `De ${pesos(o.minPrice)} a ${pesos(o.maxPrice)}` : 'Sin precios capturados',
          tone: 'text-on-surface'
        }
      );
    }

    return list;
  });
}
