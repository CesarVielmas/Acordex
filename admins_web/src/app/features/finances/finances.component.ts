import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { AccessRestrictedComponent } from '../../shared/ui/access-restricted/access-restricted.component';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { KpiCardComponent } from '../../shared/ui/kpi-card/kpi-card.component';
import { PanelComponent } from '../../shared/ui/panel/panel.component';
import { ProgressBarComponent } from '../../shared/ui/progress-bar/progress-bar.component';

@Component({
  selector: 'app-finances',
  standalone: true,
  imports: [CommonModule, AccessRestrictedComponent, BadgeComponent, KpiCardComponent, PanelComponent, ProgressBarComponent],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-fade-in">

      <!-- Permission Check -->
      @if (!roleService.canViewFinances()) {
        <app-access-restricted
          icon="lock"
          title="Acceso Restringido - Exclusivo Encargado"
          message="El módulo financiero y desglose de utilidades netas solo está visible para el perfil de Encargado Global. Por favor cambia de rol en el selector del Header para probar."
          [showBackLink]="true"
        />
      } @else {

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="font-display-xl text-xl sm:text-2xl font-black text-on-surface">Finanzas & Economía Disquera</h1>
              <app-badge label="Exclusivo Encargado" variant="success" />
            </div>
            <p class="text-xs text-outline mt-1">Balances netos, análisis de costos operativos y recomendaciones algorítmicas</p>
          </div>
        </div>

        <!-- TOP SUMMARY CARDS -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <app-kpi-card
            label="Ingresos Brutos por Boletos"
            [value]="'$' + (mockData.financialKpis().totalGrossRevenue | number:'1.0-0')"
            unit="MXN"
            icon="payments"
            trend="+14.2% proyectado Q3"
            trendIcon="trending_up"
            colorVariant="primary"
          />
          <app-kpi-card
            label="Utilidad Neta Acordex"
            [value]="'$' + (mockData.financialKpis().totalNetProfit | number:'1.0-0')"
            unit="MXN"
            icon="savings"
            trend="Margen real 25% neto"
            colorVariant="success"
          />
          <app-kpi-card
            label="Por Cobrar (Anticipos)"
            [value]="'$' + (mockData.financialKpis().pendingQuotesAmount | number:'1.0-0')"
            unit="MXN"
            icon="pending_actions"
            trend="Sujeto a contratos en negociación"
            colorVariant="warning"
          />
        </div>

        <!-- HIGH CONSUMPTION COST ANALYSIS & RECOMMENDATIONS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">

          <!-- Cost Breakdown Chart -->
          <app-panel title="Distribución de Gastos Operativos" icon="pie_chart">
            <div class="space-y-4">
              <app-progress-bar label="Logística de Viáticos y Vuelos (42%)" [percent]="42" valueLabel="$380,000 MXN" colorVariant="primary" />
              <app-progress-bar label="Renta de Escenarios e Iluminación (28%)" [percent]="28" valueLabel="$250,000 MXN" colorVariant="secondary" />
              <app-progress-bar label="Prensa, Marketing y Autógrafos (18%)" [percent]="18" valueLabel="$160,000 MXN" colorVariant="warning" />
            </div>
          </app-panel>

          <!-- Simulated Algorithmic Recommendations -->
          <div class="p-5 sm:p-6 rounded-3xl bg-surface-container border border-primary/40 shadow-xl space-y-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-xl">psychology</span>
              </div>
              <h3 class="text-sm sm:text-base font-bold text-on-surface">Recomendaciones Algoritmo Financiero Mock</h3>
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
