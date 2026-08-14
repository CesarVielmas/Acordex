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
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg">
              auto_graph
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Calculadora de Ganancias Futuras (Simulador)</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Mueve los controles para ver cuánto dinero más ganarías si subes precios o llenas más los eventos</p>
        </div>

        <button
          type="button"
          (click)="resetParams()"
          class="px-3.5 py-2 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-xs font-bold text-outline hover:text-on-surface transition-all flex items-center gap-1 self-start sm:self-auto"
        >
          <span class="material-symbols-outlined text-sm">restart_alt</span>
          Volver a Valores Actuales
        </button>
      </div>

      <!-- GRID DE SLIDERS Y RESULTADOS EN TIEMPO REAL -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- PANEL IZQUIERDO: VARIABLES / SLIDERS (5 COLUMNAS) -->
        <div class="lg:col-span-5 space-y-4 p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl">
          <h3 class="text-xs font-black text-primary uppercase tracking-widest">¿Qué cambios quieres probar?</h3>

          <!-- Slider 1: Precio Boletos -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-on-surface">1. Ajuste Precio de Boletos</span>
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
            <p class="text-[10px] text-outline">Modifica el precio promedio en palenques y bailes masivos.</p>
          </div>

          <!-- Slider 2: Ocupación Recintos -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-on-surface">2. Meta de Ocupación de Recintos</span>
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
            <p class="text-[10px] text-outline">Porcentaje promedio de boletos vendidos por fecha.</p>
          </div>

          <!-- Slider 3: Volumen Cotizaciones -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-on-surface">3. Volumen Contratos Privados</span>
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
            <p class="text-[10px] text-outline">Shows cerrados por el equipo comercial.</p>
          </div>

          <!-- Slider 4: Reducción Costos Audio / Escenarios -->
          <div class="space-y-2 p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-on-surface">4. Ahorro en Producción & Audio</span>
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
            <p class="text-[10px] text-outline">Optimización de riders y proveedores de sonido.</p>
          </div>
        </div>

        <!-- PANEL DERECHO: COMPARATIVA BASE VS SIMULADO (7 COLUMNAS) -->
        <div class="lg:col-span-7 space-y-6">

          <!-- HERO DEL IMPACTO PROYECTADO -->
          <div class="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-surface-container-high to-surface-container border border-cyan-500/40 shadow-2xl space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-widest text-cyan-400">Impacto en Utilidad Neta Proyectada</span>
              <span class="px-2.5 py-1 rounded-full text-xs font-mono font-black"
                [class]="simResult().profitDeltaAmount >= 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'">
                {{ simResult().profitDeltaAmount >= 0 ? '+' : '' }}{{ money(simResult().profitDeltaAmount) }} ({{ simResult().profitDeltaPercent }}%)
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Escenario Base -->
              <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-1">
                <span class="text-[10px] text-outline uppercase font-bold block">Escenario Base Actual</span>
                <p class="text-xl font-black text-on-surface font-mono">{{ money(basePL().netProfitAcordex) }}</p>
                <p class="text-[11px] text-outline">{{ basePL().netMarginPercent }}% margen neto</p>
              </div>

              <!-- Escenario Simulado -->
              <div class="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 space-y-1">
                <span class="text-[10px] text-emerald-400 uppercase font-bold block">Escenario Proyectado</span>
                <p class="text-2xl font-black text-emerald-300 font-mono">{{ money(simResult().simulatedNetProfit) }}</p>
                <p class="text-[11px] text-emerald-400 font-bold">{{ simResult().simulatedNetMarginPercent }}% margen neto proyectado</p>
              </div>
            </div>
          </div>

          <!-- COMPARATIVA MATRICIAL DETALLADA -->
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-3">
            <h4 class="text-xs font-black text-on-surface uppercase tracking-wider">Desglose Comparativo Base vs Proyección</h4>

            <div class="space-y-2 text-xs font-mono">
              <div class="flex items-center justify-between p-3 rounded-xl bg-surface-container-high">
                <span class="font-sans text-outline">Ingresos Brutos:</span>
                <div class="flex items-center gap-4">
                  <span class="text-outline">{{ money(basePL().grossRevenue.total) }}</span>
                  <span class="text-on-surface">➔</span>
                  <span class="font-bold text-primary">{{ money(simResult().simulatedGrossRevenue) }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-surface-container-high">
                <span class="font-sans text-outline">Costos Directos (COGS):</span>
                <div class="flex items-center gap-4">
                  <span class="text-outline">{{ money(basePL().costOfSales.total) }}</span>
                  <span class="text-on-surface">➔</span>
                  <span class="font-bold text-rose-400">{{ money(simResult().simulatedDirectCosts) }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between p-3 rounded-xl bg-surface-container-high">
                <span class="font-sans text-outline">Utilidad Bruta:</span>
                <div class="flex items-center gap-4">
                  <span class="text-outline">{{ money(basePL().grossProfit) }}</span>
                  <span class="text-on-surface">➔</span>
                  <span class="font-bold text-cyan-300">{{ money(simResult().simulatedGrossProfit) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- RECOMENDACIÓN INTELIGENTE -->
          <div class="p-5 rounded-3xl bg-surface-container-high border border-primary/40 shadow-xl space-y-2">
            <div class="flex items-center gap-2 text-primary font-bold text-xs">
              <span class="material-symbols-outlined text-base">psychology</span>
              <span>Dictamen Algorítmico Acordex</span>
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
