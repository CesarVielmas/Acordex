import { Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfitAndLossReport, FinancialSimulationParams } from '../../../core/models/finance.models';
import { money, runFinancialSimulation } from '../finance-metrics';

/**
 * Pestaña del Simulador Financiero Predictivo & Proyecciones.
 *
 * Permite a la gerencia simular escenarios de elasticidad de precios,
 * metas de ocupación de butacas, volumen de cotizaciones y optimizaciones de audio.
 */
@Component({
  selector: 'app-finance-tab-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
              auto_graph
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface font-['Epilogue'] tracking-tight">Simulador de Sensibilidad & Proyecciones Financieras</h2>
          </div>
          <p class="text-xs text-outline mt-0.5 font-['Epilogue']">Modelado cuantitativo de elasticidad en precio de boletería, tasa de aforo, volumen de contratación y optimización de producción</p>
        </div>

        <button
          type="button"
          (click)="resetParams()"
          class="px-3.5 py-2 rounded-2xl bg-[#202020] hover:bg-[#282828] border border-white/10 text-xs font-bold text-outline hover:text-on-surface transition-all flex items-center gap-1 self-start sm:self-auto cursor-pointer font-['Epilogue']"
        >
          <span class="material-symbols-outlined text-sm">restart_alt</span>
          Restablecer Parámetros Base
        </button>
      </div>

      <!-- GRID DE SLIDERS Y RESULTADOS EN TIEMPO REAL -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- PANEL IZQUIERDO: VARIABLES / SLIDERS (5 COLUMNAS) -->
        <div class="lg:col-span-5 space-y-4 p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl">
          <h3 class="text-xs font-black text-primary uppercase tracking-widest font-['Epilogue'] flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Variables de Sensibilidad Operativa
          </h3>

          <!-- Slider 1: Precio Boletos -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-[#141414] border border-white/5 shadow-sm">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-on-surface font-['Epilogue']">1. Variación en Precio de Boleto</span>
              <span class="font-mono font-black text-cyan-300">
                {{ ticketPricePercent() >= 0 ? '+' : '' }}{{ ticketPricePercent() }}%
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="30"
              step="1"
              [ngModel]="ticketPricePercent()"
              (ngModelChange)="ticketPricePercent.set($event)"
              class="w-full accent-primary cursor-pointer"
            />
            <p class="text-[10px] text-outline font-['Epilogue']">Elasticidad en ticket promedio para palenques y recintos masivos.</p>
          </div>

          <!-- Slider 2: Ocupación Recintos -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-[#141414] border border-white/5 shadow-sm">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-on-surface font-['Epilogue']">2. Meta de Ocupación de Aforos</span>
              <span class="font-mono font-black text-emerald-400">{{ occupancyTarget() }}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              [ngModel]="occupancyTarget()"
              (ngModelChange)="occupancyTarget.set($event)"
              class="w-full accent-emerald-500 cursor-pointer"
            />
            <p class="text-[10px] text-outline font-['Epilogue']">Porcentaje proyectado de butacas vendidas por cartelera.</p>
          </div>

          <!-- Slider 3: Volumen Cotizaciones -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-[#141414] border border-white/5 shadow-sm">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-on-surface font-['Epilogue']">3. Crecimiento en Contrataciones Privadas</span>
              <span class="font-mono font-black text-purple-300">
                {{ quoteVolumePercent() >= 0 ? '+' : '' }}{{ quoteVolumePercent() }}%
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="50"
              step="5"
              [ngModel]="quoteVolumePercent()"
              (ngModelChange)="quoteVolumePercent.set($event)"
              class="w-full accent-purple-500 cursor-pointer"
            />
            <p class="text-[10px] text-outline font-['Epilogue']">Incremento de cierres comerciales y contrataciones firmadas.</p>
          </div>

          <!-- Slider 4: Reducción Costos Audio / Escenarios -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-[#141414] border border-white/5 shadow-sm">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-on-surface font-['Epilogue']">4. Optimización en Producción & Audio</span>
              <span class="font-mono font-black text-amber-300">{{ prodCostReduction() }}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              [ngModel]="prodCostReduction()"
              (ngModelChange)="prodCostReduction.set($event)"
              class="w-full accent-amber-500 cursor-pointer"
            />
            <p class="text-[10px] text-outline font-['Epilogue']">Eficiencias en rider técnico, escenarios, pantallas y recintos.</p>
          </div>
        </div>

        <!-- PANEL DERECHO: COMPARATIVA BASE VS SIMULADO (7 COLUMNAS) -->
        <div class="lg:col-span-7 space-y-6">

          <!-- HERO DEL IMPACTO PROYECTADO -->
          <div class="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-[#181818] to-[#141414] border border-cyan-500/40 shadow-2xl space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-widest text-cyan-400 font-['Epilogue']">Impacto en Utilidad Neta Proyectada</span>
              <span class="px-2.5 py-1 rounded-full text-xs font-mono font-black shadow-sm"
                [class]="simResult().profitDeltaAmount >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'">
                {{ simResult().profitDeltaAmount >= 0 ? '+' : '' }}{{ money(simResult().profitDeltaAmount) }} ({{ simResult().profitDeltaPercent }}%)
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Escenario Base -->
              <div class="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-1 shadow-md">
                <span class="text-[10px] text-outline uppercase font-bold block font-['Epilogue']">Escenario Base Actual</span>
                <p class="text-xl font-black text-on-surface font-mono">{{ money(basePL().netProfitAcordex) }}</p>
                <p class="text-[11px] text-outline font-mono">{{ basePL().netMarginPercent }}% margen neto</p>
              </div>

              <!-- Escenario Simulado -->
              <div class="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/40 space-y-1 shadow-md">
                <span class="text-[10px] text-emerald-400 uppercase font-bold block font-['Epilogue']">Escenario Proyectado</span>
                <p class="text-2xl font-black text-emerald-300 font-mono tracking-tight">{{ money(simResult().simulatedNetProfit) }}</p>
                <p class="text-[11px] text-emerald-400 font-bold font-mono">{{ simResult().simulatedNetMarginPercent }}% margen neto proyectado</p>
              </div>
            </div>
          </div>

          <!-- COMPARATIVA MATRICIAL DETALLADA -->
          <div class="p-6 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-3">
            <h4 class="text-xs font-black text-on-surface uppercase tracking-wider font-['Epilogue']">Desglose Comparativo Base vs Proyección</h4>

            <div class="space-y-2 text-xs font-mono">
              <div class="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-white/5">
                <span class="font-sans text-outline font-['Epilogue']">Ingresos Brutos Facturados:</span>
                <div class="flex items-center gap-4">
                  <span class="text-outline">{{ money(basePL().grossRevenue.total) }}</span>
                  <span class="text-on-surface">➔</span>
                  <span class="font-bold text-primary">{{ money(simResult().simulatedGrossRevenue) }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-white/5">
                <span class="font-sans text-outline font-['Epilogue']">Costos Directos (COGS):</span>
                <div class="flex items-center gap-4">
                  <span class="text-outline">{{ money(basePL().costOfSales.total) }}</span>
                  <span class="text-on-surface">➔</span>
                  <span class="font-bold text-rose-400">{{ money(simResult().simulatedDirectCosts) }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-white/5">
                <span class="font-sans text-outline font-['Epilogue']">Utilidad Bruta:</span>
                <div class="flex items-center gap-4">
                  <span class="text-outline">{{ money(basePL().grossProfit) }}</span>
                  <span class="text-on-surface">➔</span>
                  <span class="font-bold text-cyan-300">{{ money(simResult().simulatedGrossProfit) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- RECOMENDACIÓN INTELIGENTE -->
          <div class="p-5 rounded-3xl bg-[#181818] border border-primary/40 shadow-xl space-y-2">
            <div class="flex items-center gap-2 text-primary font-bold text-xs">
              <span class="material-symbols-outlined text-base">psychology</span>
              <span class="font-['Epilogue']">Dictamen Algorítmico Financiero Acordex</span>
            </div>
            <p class="text-xs text-on-surface leading-relaxed">{{ simResult().recommendationNote }}</p>
          </div>

        </div>

      </div>

    </div>
  `
})
export class FinanceTabSimulatorComponent {
  basePL = input.required<ProfitAndLossReport>();

  ticketPricePercent = signal(5);
  occupancyTarget = signal(85);
  quoteVolumePercent = signal(15);
  prodCostReduction = signal(8);

  money = money;

  resetParams(): void {
    this.ticketPricePercent.set(0);
    this.occupancyTarget.set(75);
    this.quoteVolumePercent.set(0);
    this.prodCostReduction.set(0);
  }

  simResult = computed(() => {
    const params: FinancialSimulationParams = {
      ticketPriceMultiplier: 1 + (this.ticketPricePercent() / 100),
      occupancyTargetPercent: this.occupancyTarget(),
      quoteVolumeMultiplier: 1 + (this.quoteVolumePercent() / 100),
      productionCostReduction: this.prodCostReduction() / 100,
      artistFeeNegotiationMargin: 0
    };
    return runFinancialSimulation(this.basePL(), params);
  });
}
