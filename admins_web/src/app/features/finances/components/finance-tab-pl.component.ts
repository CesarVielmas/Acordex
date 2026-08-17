import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfitAndLossReport } from '../../../core/models/finance.models';
import { money, calcPercent } from '../finance-metrics';

/**
 * Pestaña de Estado de Resultados Consolidado (Profit & Loss / P&L).
 *
 * Muestra en estructura contable y lenguaje ejecutivo:
 * - Ingresos Brutos Totales (Venta de boletería, contratos de exclusividad y patrocinios)
 * - Costos Directos de Venta (COGS: Cachés de talento, audio, recintos y viáticos)
 * - Gastos Operativos y Administrativos (OpEx: Marketing, nómina y permisos)
 * - Utilidad Operativa Neta (EBITDA) y Rendimiento Definitivo de Acordex Records
 */
@Component({
  selector: 'app-finance-tab-pl',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ─── SELECTOR DE PERIODO & ENCABEZADO ─── -->
      <div class="p-6 rounded-3xl bg-gradient-to-r from-[#1A1A1A] via-[#161616] to-[#141414] border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-base sm:text-lg font-black text-on-surface flex items-center gap-2 font-['Epilogue'] tracking-tight">
            <span class="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
            Estado de Resultados Consolidado (P&L)
          </h2>
          <p class="text-xs text-outline mt-0.5 max-w-xl">
            Trazabilidad auditada del flujo de ingresos por espectáculos, costos directos de talento y producción, y margen operativo neto.
          </p>
        </div>

        <!-- Botones de Temporalidad -->
        <div class="flex items-center gap-1.5 p-1 bg-[#1E1E1E] rounded-2xl border border-white/10 self-start md:self-auto overflow-x-auto">
          <button
            type="button"
            (click)="selectPeriod('mes')"
            [class]="selectedPeriod === 'mes' ? 'bg-primary text-on-primary font-black shadow-md' : 'text-outline hover:text-on-surface font-semibold'"
            class="px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer"
          >
            Mes en Curso
          </button>
          <button
            type="button"
            (click)="selectPeriod('q3')"
            [class]="selectedPeriod === 'q3' ? 'bg-primary text-on-primary font-black shadow-md' : 'text-outline hover:text-on-surface font-semibold'"
            class="px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer"
          >
            Trimestre Q3
          </button>
          <button
            type="button"
            (click)="selectPeriod('anual')"
            [class]="selectedPeriod === 'anual' ? 'bg-primary text-on-primary font-black shadow-md' : 'text-outline hover:text-on-surface font-semibold'"
            class="px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer"
          >
            Ejercicio 2026
          </button>
          <button
            type="button"
            (click)="selectPeriod('historico')"
            [class]="selectedPeriod === 'historico' ? 'bg-primary text-on-primary font-black shadow-md' : 'text-outline hover:text-on-surface font-semibold'"
            class="px-3.5 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer"
          >
            Consolidado Histórico
          </button>
        </div>
      </div>

      <!-- ─── TARJETÓN VISUAL DE RESUMEN EJECUTIVO: INGRESOS vs COSTOS vs UTILIDAD ─── -->
      <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1B1B1B] via-[#161616] to-[#121212] border border-white/10 shadow-2xl relative overflow-hidden">
        <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center relative z-10">

          <!-- 1. Ingresos Brutos -->
          <div class="p-5 rounded-2xl bg-[#141414]/90 border border-primary/30 space-y-1.5 shadow-lg">
            <span class="text-xs font-black text-primary uppercase tracking-wider flex items-center justify-center gap-1.5 font-['Epilogue']">
              <span class="material-symbols-outlined text-sm">add_circle</span> Ingresos Brutos Facturados
            </span>
            <p class="text-2xl sm:text-3xl font-black text-on-surface font-mono tracking-tight">{{ money(pl()?.grossRevenue?.total || 0) }}</p>
            <p class="text-[11px] text-outline">100% de la facturación y taquilla registrada</p>
          </div>

          <!-- 2. Menos: Costos y Gastos Totales -->
          <div class="p-5 rounded-2xl bg-[#141414]/90 border border-rose-500/30 space-y-1.5 shadow-lg">
            <span class="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center justify-center gap-1.5 font-['Epilogue']">
              <span class="material-symbols-outlined text-sm">remove_circle</span> Costos Directos & Gastos
            </span>
            <p class="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight">- {{ money(totalSpent()) }}</p>
            <p class="text-[11px] text-outline">COGS de talento + Producción + OpEx</p>
          </div>

          <!-- 3. Igual a: Utilidad Neta Consolidada -->
          <div class="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-[#141414]/90 border border-emerald-500/50 space-y-1.5 shadow-lg">
            <span class="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1.5 font-['Epilogue']">
              <span class="material-symbols-outlined text-sm">verified</span> Utilidad Neta Consolidada
            </span>
            <p class="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight">{{ money(pl()?.netProfitAcordex || 0) }}</p>
            <p class="text-[11px] text-emerald-400 font-black">Margen Neto Retenido: {{ pl()?.netMarginPercent || 0 }}%</p>
          </div>

        </div>

        <!-- Barra Visual Comparativa de Distribución -->
        <div class="mt-8 pt-6 border-t border-white/10 space-y-2 relative z-10">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-on-surface font-['Epilogue']">Distribución Porcentual del Capital:</span>
            <div class="flex items-center gap-4 text-[11px]">
              <span class="flex items-center gap-1.5 text-rose-400">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Costos & Gastos: {{ spentPercent() }}%
              </span>
              <span class="flex items-center gap-1.5 text-emerald-400">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Margen Neto: {{ pl()?.netMarginPercent || 0 }}%
              </span>
            </div>
          </div>

          <div class="w-full h-4 bg-[#141414] rounded-full overflow-hidden flex border border-white/10 shadow-inner">
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

      <!-- ─── DESGLOSE AUDITADO: ORIGEN DE INGRESOS Y APLICACIÓN DE COSTOS ─── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- 1. ORIGEN DE INGRESOS -->
        <div class="p-6 rounded-3xl bg-[#181818] border border-primary/30 shadow-xl space-y-5">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
                point_of_sale
              </span>
              <div>
                <h3 class="text-sm font-black text-on-surface font-['Epilogue']">Estructura de Ingresos (Facturación)</h3>
                <p class="text-[11px] text-outline">Desglose de recaudación por línea de negocio</p>
              </div>
            </div>
            <span class="text-sm font-mono font-black text-primary">{{ money(pl()?.grossRevenue?.total || 0) }}</span>
          </div>

          <div class="space-y-3 text-xs">
            <!-- Boletos en Bailes y Palenques -->
            <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-all">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center material-symbols-outlined text-base">
                  confirmation_number
                </span>
                <div>
                  <p class="font-bold text-on-surface">Boletería en Palenques & Bailes Masivos</p>
                  <p class="text-[11px] text-outline">Boletos vendidos en taquillas y plataformas digitales</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-on-surface block">{{ money(pl()?.grossRevenue?.eventsTickets || 0) }}</span>
                <span class="text-[10px] text-purple-300 font-sans font-semibold">{{ calcPercent(pl()?.grossRevenue?.eventsTickets || 0, pl()?.grossRevenue?.total || 1) }}% de ingresos</span>
              </div>
            </div>

            <!-- Contrataciones Privadas (Bodas/XV Años) -->
            <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-between gap-3 hover:border-cyan-500/40 transition-all">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center material-symbols-outlined text-base">
                  celebration
                </span>
                <div>
                  <p class="font-bold text-on-surface">Contrataciones Privadas & Corporativas</p>
                  <p class="text-[11px] text-outline">Contratos cerrados en el módulo de Cotizaciones</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-on-surface block">{{ money(pl()?.grossRevenue?.privateQuotes || 0) }}</span>
                <span class="text-[10px] text-cyan-300 font-sans font-semibold">{{ calcPercent(pl()?.grossRevenue?.privateQuotes || 0, pl()?.grossRevenue?.total || 1) }}% de ingresos</span>
              </div>
            </div>

            <!-- Patrocinios de Marcas -->
            <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center material-symbols-outlined text-base">
                  handshake
                </span>
                <div>
                  <p class="font-bold text-on-surface">Patrocinios Comerciales & Activaciones</p>
                  <p class="text-[11px] text-outline">Presencia de marca en vallas, lonas y croquis</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-on-surface block">{{ money(pl()?.grossRevenue?.sponsorships || 0) }}</span>
                <span class="text-[10px] text-amber-300 font-sans font-semibold">{{ calcPercent(pl()?.grossRevenue?.sponsorships || 0, pl()?.grossRevenue?.total || 1) }}% de ingresos</span>
              </div>
            </div>

            <!-- Venta de Cerveza y Barras -->
            <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-all">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center material-symbols-outlined text-base">
                  local_bar
                </span>
                <div>
                  <p class="font-bold text-on-surface">Concesión de Barras & Bebidas</p>
                  <p class="text-[11px] text-outline">Regalías y venta directa en foros y palenques</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-on-surface block">{{ money(barConcessionsRevenue()) }}</span>
                <span class="text-[10px] text-emerald-300 font-sans font-semibold">{{ calcPercent(barConcessionsRevenue(), pl()?.grossRevenue?.total || 1) }}% de ingresos</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. APLICACIÓN DE COSTOS DIRECTOS Y OPERATIVOS -->
        <div class="p-6 rounded-3xl bg-[#181818] border border-rose-500/30 shadow-xl space-y-5">
          <div class="flex items-center justify-between border-b border-white/10 pb-3">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
                receipt_long
              </span>
              <div>
                <h3 class="text-sm font-black text-on-surface font-['Epilogue']">Estructura de Costos & Gastos</h3>
                <p class="text-[11px] text-outline">Desglose de dispersiones y compromisos liquidados</p>
              </div>
            </div>
            <span class="text-sm font-mono font-black text-rose-400">{{ money(totalSpent()) }}</span>
          </div>

          <div class="space-y-3 text-xs">
            <!-- Honorarios Artísticos -->
            <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-between gap-3 hover:border-rose-500/40 transition-all">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center material-symbols-outlined text-base">
                  music_note
                </span>
                <div>
                  <p class="font-bold text-on-surface">Honorarios de Talento Artístico (Cachés)</p>
                  <p class="text-[11px] text-outline">Pago directo a agrupaciones del cartel y eventos privados</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-rose-400 block">{{ money(pl()?.costOfSales?.artistFees || 0) }}</span>
                <span class="text-[10px] text-outline font-sans">Mayor rubro directo</span>
              </div>
            </div>

            <!-- Sonido, Luces y Pantallas -->
            <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center material-symbols-outlined text-base">
                  speaker
                </span>
                <div>
                  <p class="font-bold text-on-surface">Producción Técnica (Audio, Iluminación & Pantallas)</p>
                  <p class="text-[11px] text-outline">Arrendamiento de plantas, backline e ingeniería de sonido</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-rose-400 block">{{ money(pl()?.costOfSales?.technicalProduction || 0) }}</span>
                <span class="text-[10px] text-outline font-sans">Infraestructura técnica</span>
              </div>
            </div>

            <!-- Renta de Palenques y Recintos -->
            <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-between gap-3 hover:border-orange-500/40 transition-all">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center material-symbols-outlined text-base">
                  stadium
                </span>
                <div>
                  <p class="font-bold text-on-surface">Arrendamiento de Recintos & Foros</p>
                  <p class="text-[11px] text-outline">Renta de palenques, estadios y auditorios</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-rose-400 block">{{ money(pl()?.costOfSales?.venueRentals || 0) }}</span>
                <span class="text-[10px] text-outline font-sans">Espacio de presentación</span>
              </div>
            </div>

            <!-- Hoteles, Vuelos y Comidas (Viáticos) -->
            <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-between gap-3 hover:border-sky-500/40 transition-all">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center material-symbols-outlined text-base">
                  flight
                </span>
                <div>
                  <p class="font-bold text-on-surface">Logística de Transporte, Hospedaje & Viáticos</p>
                  <p class="text-[11px] text-outline">Vuelos, camionetas Suburban y catering de cuadrillas</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-rose-400 block">{{ money(pl()?.costOfSales?.viaticosLogistics || 0) }}</span>
                <span class="text-[10px] text-outline font-sans">Gasto logístico</span>
              </div>
            </div>

            <!-- Gastos Operativos y Permisos -->
            <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-all">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center material-symbols-outlined text-base">
                  campaign
                </span>
                <div>
                  <p class="font-bold text-on-surface">Prensa, Permisos Municipales & Staff Operativo</p>
                  <p class="text-[11px] text-outline">Protección civil, seguridad privada, marketing y ayuntamientos</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-rose-400 block">{{ money(pl()?.operatingExpenses?.total || 0) }}</span>
                <span class="text-[10px] text-outline font-sans">Gastos administrativos OpEx</span>
              </div>
            </div>

            <!-- Finiquitos de Coproducción -->
            <div class="p-3.5 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-between gap-3 hover:border-indigo-500/40 transition-all">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center material-symbols-outlined text-base">
                  group
                </span>
                <div>
                  <p class="font-bold text-on-surface">Liquidaciones a Coproductores & Managers</p>
                  <p class="text-[11px] text-outline">Reparto contractual pactado con promotores asociados</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <span class="font-bold text-rose-400 block">{{ money(pl()?.managerSplitsExpense || 0) }}</span>
                <span class="text-[10px] text-outline font-sans">Convenios de sociedad</span>
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
