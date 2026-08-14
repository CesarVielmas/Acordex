import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfitAndLossReport } from '../../../core/models/finance.models';
import { money, calcPercent } from '../finance-metrics';

/**
 * Pestaña de Ganancias & Pérdidas (Balance General).
 *
 * Explica en lenguaje cotidiano y visual:
 * - Cuánto dinero entró y de dónde vino
 * - Cuánto dinero se gastó y en qué se fue
 * - Cuánto dinero quedó libre de ganancia para la disquera
 */
@Component({
  selector: 'app-finance-tab-pl',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ─── SELECTOR DE PERIODO & ENCABEZADO ─── -->
      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-black text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
            ¿Cómo le está yendo a la Disquera? (Ganancias y Pérdidas)
          </h2>
          <p class="text-xs text-outline mt-0.5">
            Consulta cuánto dinero ha entrado a Acordex, cuánto se ha gastado en los eventos y grupos, y cuánto te quedó libre.
          </p>
        </div>

        <!-- Botones de Temporalidad -->
        <div class="flex items-center gap-1.5 p-1 bg-surface-container-highest/60 rounded-2xl border border-outline-variant/20 self-start md:self-auto overflow-x-auto">
          <button
            type="button"
            (click)="selectPeriod('mes')"
            [class]="selectedPeriod === 'mes' ? 'bg-primary text-on-primary font-black shadow-md' : 'text-outline hover:text-on-surface font-semibold'"
            class="px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap"
          >
            Este Mes
          </button>
          <button
            type="button"
            (click)="selectPeriod('q3')"
            [class]="selectedPeriod === 'q3' ? 'bg-primary text-on-primary font-black shadow-md' : 'text-outline hover:text-on-surface font-semibold'"
            class="px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap"
          >
            Trimestre Q3
          </button>
          <button
            type="button"
            (click)="selectPeriod('anual')"
            [class]="selectedPeriod === 'anual' ? 'bg-primary text-on-primary font-black shadow-md' : 'text-outline hover:text-on-surface font-semibold'"
            class="px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap"
          >
            Año 2026
          </button>
          <button
            type="button"
            (click)="selectPeriod('historico')"
            [class]="selectedPeriod === 'historico' ? 'bg-primary text-on-primary font-black shadow-md' : 'text-outline hover:text-on-surface font-semibold'"
            class="px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap"
          >
            Todo el Historial
          </button>
        </div>
      </div>

      <!-- ─── TARJETÓN VISUAL DE RESUMEN: ENTRÓ vs GASTÓ vs GANANCIA ─── -->
      <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-high border border-outline-variant/30 shadow-2xl relative overflow-hidden">
        <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center relative z-10">

          <!-- 1. Total Entrado -->
          <div class="p-5 rounded-2xl bg-surface-container-highest/60 border border-primary/20 space-y-1">
            <span class="text-xs font-bold text-primary uppercase tracking-wider flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">add_circle</span> Total Dinero Entrado
            </span>
            <p class="text-2xl sm:text-3xl font-black text-on-surface font-mono">{{ money(pl()?.grossRevenue?.total || 0) }}</p>
            <p class="text-[11px] text-outline">100% de los ingresos recibidos</p>
          </div>

          <!-- 2. Menos: Total Gastado -->
          <div class="p-5 rounded-2xl bg-surface-container-highest/60 border border-rose-500/20 space-y-1">
            <span class="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">remove_circle</span> Total Dinero Gastado
            </span>
            <p class="text-2xl sm:text-3xl font-black text-rose-400 font-mono">- {{ money(totalSpent()) }}</p>
            <p class="text-[11px] text-outline">Músicos + Producción + Gastos + Socios</p>
          </div>

          <!-- 3. Igual a: Ganancia Limpia -->
          <div class="p-5 rounded-2xl bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/40 space-y-1">
            <span class="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">trophy</span> Ganancia Limpia Acordex
            </span>
            <p class="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">{{ money(pl()?.netProfitAcordex || 0) }}</p>
            <p class="text-[11px] text-emerald-400 font-bold">¡Tu dinero libre en la bolsa! ({{ pl()?.netMarginPercent || 0 }}% de margen)</p>
          </div>

        </div>

        <!-- Barra Visual Comparativa -->
        <div class="mt-8 pt-6 border-t border-outline-variant/20 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-on-surface">Proporción del Dinero:</span>
            <div class="flex items-center gap-4 text-[11px]">
              <span class="flex items-center gap-1.5 text-rose-400">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Gastos: {{ spentPercent() }}%
              </span>
              <span class="flex items-center gap-1.5 text-emerald-400">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Ganancia Libre: {{ pl()?.netMarginPercent || 0 }}%
              </span>
            </div>
          </div>

          <div class="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden flex border border-outline-variant/30">
            <div
              class="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-700"
              [style.width.%]="spentPercent()"
            ></div>
            <div
              class="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
              [style.width.%]="pl()?.netMarginPercent || 0"
            ></div>
          </div>
        </div>
      </div>

      <!-- ─── DESGLOSE SENCILLO: DE DÓNDE VINO Y EN QUÉ SE FUE ─── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- 1. ¿DE DÓNDE VINO EL DINERO? (INGRESOS) -->
        <div class="p-6 rounded-3xl bg-surface-container border border-primary/30 shadow-xl space-y-5">
          <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg">
                point_of_sale
              </span>
              <div>
                <h3 class="text-sm font-black text-on-surface">¿De dónde vino el dinero?</h3>
                <p class="text-[11px] text-outline">Desglose de todo lo que se cobró</p>
              </div>
            </div>
            <span class="text-sm font-mono font-black text-primary">{{ money(pl()?.grossRevenue?.total || 0) }}</span>
          </div>

          <div class="space-y-3 text-xs">
            <!-- Boletos en Bailes y Palenques -->
            <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center material-symbols-outlined text-base">
                  confirmation_number
                </span>
                <div>
                  <p class="font-bold text-on-surface">Boletos de Bailes & Palenques</p>
                  <p class="text-[11px] text-outline">Entradas vendidas en taquilla y croquis</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-on-surface block">{{ money(pl()?.grossRevenue?.eventsTickets || 0) }}</span>
                <span class="text-[10px] text-purple-300 font-sans font-semibold">{{ calcPercent(pl()?.grossRevenue?.eventsTickets || 0, pl()?.grossRevenue?.total || 1) }}%</span>
              </div>
            </div>

            <!-- Contrataciones Privadas (Bodas/XV Años) -->
            <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center material-symbols-outlined text-base">
                  celebration
                </span>
                <div>
                  <p class="font-bold text-on-surface">Contrataciones de Bodas & Fiestas</p>
                  <p class="text-[11px] text-outline">Eventos privados cerrados en Cotizaciones</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-on-surface block">{{ money(pl()?.grossRevenue?.privateQuotes || 0) }}</span>
                <span class="text-[10px] text-cyan-300 font-sans font-semibold">{{ calcPercent(pl()?.grossRevenue?.privateQuotes || 0, pl()?.grossRevenue?.total || 1) }}%</span>
              </div>
            </div>

            <!-- Patrocinios de Marcas -->
            <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center material-symbols-outlined text-base">
                  handshake
                </span>
                <div>
                  <p class="font-bold text-on-surface">Patrocinios Comerciales</p>
                  <p class="text-[11px] text-outline">Marcas en escenario, lonas y boletaje</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-on-surface block">{{ money(pl()?.grossRevenue?.sponsorships || 0) }}</span>
                <span class="text-[10px] text-amber-300 font-sans font-semibold">{{ calcPercent(pl()?.grossRevenue?.sponsorships || 0, pl()?.grossRevenue?.total || 1) }}%</span>
              </div>
            </div>

            <!-- Venta de Cerveza y Barras -->
            <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center material-symbols-outlined text-base">
                  local_bar
                </span>
                <div>
                  <p class="font-bold text-on-surface">Barras de Bebidas & Concesiones</p>
                  <p class="text-[11px] text-outline">Venta de cerveza y consumo en recintos</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-on-surface block">{{ money(barConcessionsRevenue()) }}</span>
                <span class="text-[10px] text-emerald-300 font-sans font-semibold">{{ calcPercent(barConcessionsRevenue(), pl()?.grossRevenue?.total || 1) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. ¿EN QUÉ SE GASTÓ EL DINERO? (GASTOS) -->
        <div class="p-6 rounded-3xl bg-surface-container border border-rose-500/30 shadow-xl space-y-5">
          <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center material-symbols-outlined text-lg">
                receipt_long
              </span>
              <div>
                <h3 class="text-sm font-black text-on-surface">¿En qué se gastó el dinero?</h3>
                <p class="text-[11px] text-outline">Desglose de todo lo que se pagó</p>
              </div>
            </div>
            <span class="text-sm font-mono font-black text-rose-400">{{ money(totalSpent()) }}</span>
          </div>

          <div class="space-y-3 text-xs">
            <!-- Pago a los Músicos / Grupos -->
            <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center material-symbols-outlined text-base">
                  music_note
                </span>
                <div>
                  <p class="font-bold text-on-surface">Pago a Músicos & Grupos (Cachés)</p>
                  <p class="text-[11px] text-outline">Honorarios pagados al cartel y artistas</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-rose-400 block">{{ money(pl()?.costOfSales?.artistFees || 0) }}</span>
                <span class="text-[10px] text-outline font-sans">Principal costo del show</span>
              </div>
            </div>

            <!-- Sonido, Luces y Pantallas -->
            <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center material-symbols-outlined text-base">
                  speaker
                </span>
                <div>
                  <p class="font-bold text-on-surface">Sonido, Luces, Pantallas & Escenario</p>
                  <p class="text-[11px] text-outline">Renta de equipo técnico de producción</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-rose-400 block">{{ money(pl()?.costOfSales?.technicalProduction || 0) }}</span>
                <span class="text-[10px] text-outline font-sans">Producción técnica</span>
              </div>
            </div>

            <!-- Renta de Palenques y Recintos -->
            <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center material-symbols-outlined text-base">
                  stadium
                </span>
                <div>
                  <p class="font-bold text-on-surface">Renta de Recintos & Palenques</p>
                  <p class="text-[11px] text-outline">Arrendamiento de foros y lienzos charros</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-rose-400 block">{{ money(pl()?.costOfSales?.venueRentals || 0) }}</span>
                <span class="text-[10px] text-outline font-sans">Lugar del evento</span>
              </div>
            </div>

            <!-- Hoteles, Vuelos y Comidas (Viáticos) -->
            <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center material-symbols-outlined text-base">
                  flight
                </span>
                <div>
                  <p class="font-bold text-on-surface">Hoteles, Vuelos & Comidas (Viáticos)</p>
                  <p class="text-[11px] text-outline">Transportación y hospedaje de cuadrillas</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-rose-400 block">{{ money(pl()?.costOfSales?.viaticosLogistics || 0) }}</span>
                <span class="text-[10px] text-outline font-sans">Logística de viaje</span>
              </div>
            </div>

            <!-- Gastos Operativos y Permisos -->
            <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center material-symbols-outlined text-base">
                  campaign
                </span>
                <div>
                  <p class="font-bold text-on-surface">Publicidad, Permisos & Staff</p>
                  <p class="text-[11px] text-outline">Prensa, seguridad, vallas y ayuntamiento</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-rose-400 block">{{ money(pl()?.operatingExpenses?.total || 0) }}</span>
                <span class="text-[10px] text-outline font-sans">Operación del evento</span>
              </div>
            </div>

            <!-- Ganancia Repartida a Socios / Managers -->
            <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center material-symbols-outlined text-base">
                  group
                </span>
                <div>
                  <p class="font-bold text-on-surface">Reparto a Socios & Co-organizadores</p>
                  <p class="text-[11px] text-outline">Utilidades liquidadas a otros managers</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-rose-400 block">{{ money(pl()?.managerSplitsExpense || 0) }}</span>
                <span class="text-[10px] text-outline font-sans">Finiquito de convenios</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  `
})
export class FinanceTabPlComponent {
  pl = input<ProfitAndLossReport>();
  periodChange = output<'mes' | 'q3' | 'anual' | 'historico'>();

  selectedPeriod: 'mes' | 'q3' | 'anual' | 'historico' = 'historico';
  money = money;
  calcPercent = calcPercent;

  barConcessionsRevenue = computed(() => {
    return this.pl()?.grossRevenue?.barConcessions || 0;
  });

  totalSpent = computed(() => {
    const report = this.pl();
    if (!report) return 0;
    return (report.costOfSales?.total || 0) + (report.operatingExpenses?.total || 0) + (report.managerSplitsExpense || 0);
  });

  spentPercent = computed(() => {
    const totalRev = this.pl()?.grossRevenue?.total || 1;
    return calcPercent(this.totalSpent(), totalRev);
  });

  selectPeriod(p: 'mes' | 'q3' | 'anual' | 'historico'): void {
    this.selectedPeriod = p;
    this.periodChange.emit(p);
  }
}
