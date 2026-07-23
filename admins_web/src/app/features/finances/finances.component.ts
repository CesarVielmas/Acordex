import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-finances',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8 animate-fade-in">
      
      <!-- Permission Check -->
      @if (!roleService.canViewFinances()) {
        <div class="p-8 rounded-3xl bg-red-500/10 border-2 border-red-500/40 text-center space-y-4 max-w-xl mx-auto my-12">
          <span class="material-symbols-outlined text-5xl text-red-400">lock</span>
          <h2 class="text-xl font-bold text-red-300">Acceso Restringido - Exclusivo Encargado</h2>
          <p class="text-xs text-outline">
            El módulo financiero y desglose de utilidades netas solo está visible para el perfil de <strong>Encargado Global</strong>. Por favor cambia de rol en el selector del Header para probar.
          </p>
        </div>
      } @else {
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="font-display-xl text-2xl font-black text-on-surface">Finanzas & Economía Disquera</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Exclusivo Encargado
              </span>
            </div>
            <p class="text-xs text-outline mt-1">Balances netos, análisis de costos operativos y recomendaciones algorítmicas</p>
          </div>
        </div>

        <!-- TOP SUMMARY CARDS -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl">
            <span class="text-xs font-bold text-outline uppercase block">Ingresos Brutos por Boletos</span>
            <p class="text-3xl font-black text-on-surface mt-2">&#36;{{ mockData.financialKpis().totalGrossRevenue | number:'1.0-0' }} <span class="text-xs text-outline">MXN</span></p>
            <span class="text-xs text-emerald-400 mt-2 block font-medium">+14.2% proyectado Q3</span>
          </div>

          <div class="p-6 rounded-3xl bg-surface-container border border-emerald-500/30 shadow-xl">
            <span class="text-xs font-bold text-emerald-400 uppercase block">Utilidad Neta Acordex</span>
            <p class="text-3xl font-black text-emerald-400 mt-2">&#36;{{ mockData.financialKpis().totalNetProfit | number:'1.0-0' }} <span class="text-xs text-outline">MXN</span></p>
            <span class="text-xs text-outline mt-2 block font-medium">Margen real 25% neto</span>
          </div>

          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl">
            <span class="text-xs font-bold text-amber-400 uppercase block">Por Cobrar (Anticipos)</span>
            <p class="text-3xl font-black text-on-surface mt-2">&#36;{{ mockData.financialKpis().pendingQuotesAmount | number:'1.0-0' }} <span class="text-xs text-outline">MXN</span></p>
            <span class="text-xs text-amber-400 mt-2 block font-medium">Sujeto a contratos en negociación</span>
          </div>
        </div>

        <!-- HIGH CONSUMPTION COST ANALYSIS & RECOMMENDATIONS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Cost Breakdown Chart -->
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-6">
            <h3 class="text-base font-bold text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">pie_chart</span> Distribución de Gastos Operativos
            </h3>

            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-xs font-bold mb-1">
                  <span class="text-on-surface">Logística de Viáticos y Vuelos (42%)</span>
                  <span class="text-primary">&#36;380,000 MXN</span>
                </div>
                <div class="w-full h-3 rounded-full bg-surface-bright overflow-hidden">
                  <div class="h-full bg-primary rounded-full" style="width: 42%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs font-bold mb-1">
                  <span class="text-on-surface">Renta de Escenarios e Iluminación (28%)</span>
                  <span class="text-secondary">&#36;250,000 MXN</span>
                </div>
                <div class="w-full h-3 rounded-full bg-surface-bright overflow-hidden">
                  <div class="h-full bg-secondary rounded-full" style="width: 28%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs font-bold mb-1">
                  <span class="text-on-surface">Prensa, Marketing y Autógrafos (18%)</span>
                  <span class="text-purple-400">&#36;160,000 MXN</span>
                </div>
                <div class="w-full h-3 rounded-full bg-surface-bright overflow-hidden">
                  <div class="h-full bg-purple-400 rounded-full" style="width: 18%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Simulated Algorithmic Recommendations -->
          <div class="p-6 rounded-3xl bg-surface-container border border-primary/40 shadow-xl space-y-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-xl">psychology</span>
              </div>
              <h3 class="text-base font-bold text-on-surface">Recomendaciones Algoritmo Financiero Mock</h3>
            </div>

            <div class="space-y-3">
              <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-1">
                <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Optimización de Boletos</span>
                <p class="text-xs font-bold text-on-surface">Incrementar precio VIP en 8% para palenques</p>
                <p class="text-[11px] text-outline">La demanda acumulada en Banda La Imperial justifica una elasticidad de precio positiva sin afectar la velocidad de venta.</p>
              </div>

              <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-1">
                <span class="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Convenio Co-producción</span>
                <p class="text-xs font-bold text-on-surface">Renegociar split de viáticos con Fonovisa</p>
                <p class="text-[11px] text-outline">Se detectó una desviación del 12% en costos de transporte terrestre en el Festival Tumbado Zapopan.</p>
              </div>
            </div>
          </div>

        </div>

      }

    </div>
  `
})
export class FinancesComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);
}
