import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfitAndLossReport, FinanceAccount, ReceivableItem, PayableItem } from '../../../core/models/finance.models';
import { money, compactMoney } from '../finance-metrics';

/**
 * Tablero Ejecutivo de Indicadores Financieros Clave (KPIs) de Acordex.
 *
 * Muestra en métricas de alta precisión y diseño ejecutivo:
 * 1. Ingresos Brutos Totales (Facturación & Taquilla)
 * 2. Egresos y Costos Consolidados (Directos + Operativos)
 * 3. Utilidad Neta Consolidada (EBITDA Operativo)
 * 4. Disponibilidad en Tesorería & Cuentas Bancarias
 * 5. Balance de Cartera (Cuentas por Cobrar vs Cuentas por Pagar)
 */
@Component({
  selector: 'app-finance-kpis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

      <!-- 1. INGRESOS BRUTOS TOTALES -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-[#1E1E1E]/95 via-[#161616]/90 to-[#121212]/95 border border-primary/30 shadow-2xl relative overflow-hidden group hover:border-primary/60 transition-all duration-300">
        <div class="absolute -right-8 -bottom-8 w-28 h-28 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2 relative z-10">
          <span class="text-[10px] font-black text-primary uppercase tracking-widest font-['Epilogue']">Ingresos Brutos</span>
          <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
            trending_up
          </span>
        </div>
        <div class="space-y-1 relative z-10">
          <p class="text-xl sm:text-2xl font-black text-on-surface font-mono tracking-tight">{{ revenueFormatted() }}</p>
          <div class="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Taquillas + Contratos Privados</span>
          </div>
        </div>
      </div>

      <!-- 2. EGRESOS Y COSTOS DIRECTOS -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-[#1E1E1E]/95 via-[#161616]/90 to-[#121212]/95 border border-rose-500/30 shadow-2xl relative overflow-hidden group hover:border-rose-500/60 transition-all duration-300">
        <div class="absolute -right-8 -bottom-8 w-28 h-28 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2 relative z-10">
          <span class="text-[10px] font-black text-rose-400 uppercase tracking-widest font-['Epilogue']">Costos & Egresos</span>
          <span class="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
            payments
          </span>
        </div>
        <div class="space-y-1 relative z-10">
          <p class="text-xl sm:text-2xl font-black text-on-surface font-mono tracking-tight">{{ costsFormatted() }}</p>
          <div class="flex items-center gap-1 text-[11px] text-outline">
            <span>Talento, audio, recintos y logística</span>
          </div>
        </div>
      </div>

      <!-- 3. UTILIDAD NETA CONSOLIDADA -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-emerald-950/40 via-[#161616]/90 to-[#121212]/95 border border-emerald-500/40 shadow-2xl relative overflow-hidden group hover:border-emerald-500/70 transition-all duration-300">
        <div class="absolute -right-8 -bottom-8 w-28 h-28 bg-emerald-500/15 rounded-full blur-3xl group-hover:bg-emerald-500/25 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2 relative z-10">
          <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-['Epilogue']">Utilidad Neta (EBITDA)</span>
          <span class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
            savings
          </span>
        </div>
        <div class="space-y-1 relative z-10">
          <p class="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">{{ netProfitFormatted() }}</p>
          <div class="flex items-center gap-1.5 text-[11px] text-emerald-400 font-black">
            <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30">
              {{ pl()?.netMarginPercent || 0 }}% Margen Operativo
            </span>
          </div>
        </div>
      </div>

      <!-- 4. DISPONIBILIDAD EN TESORERÍA -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-[#1E1E1E]/95 via-[#161616]/90 to-[#121212]/95 border border-cyan-500/30 shadow-2xl relative overflow-hidden group hover:border-cyan-500/60 transition-all duration-300">
        <div class="absolute -right-8 -bottom-8 w-28 h-28 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2 relative z-10">
          <span class="text-[10px] font-black text-cyan-400 uppercase tracking-widest font-['Epilogue']">Saldos en Tesorería</span>
          <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
            account_balance
          </span>
        </div>
        <div class="space-y-1 relative z-10">
          <p class="text-xl sm:text-2xl font-black text-on-surface font-mono tracking-tight">{{ totalCashFormatted() }}</p>
          <div class="flex items-center gap-1 text-[11px] text-cyan-300">
            <span>{{ accounts().length }} Cuentas bancarias activas</span>
          </div>
        </div>
      </div>

      <!-- 5. BALANCE DE CARTERA: CxC vs CxP -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-[#1E1E1E]/95 via-[#161616]/90 to-[#121212]/95 border border-amber-500/30 shadow-2xl relative overflow-hidden group hover:border-amber-500/60 transition-all duration-300">
        <div class="absolute -right-8 -bottom-8 w-28 h-28 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2 relative z-10">
          <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest font-['Epilogue']">Posición de Cartera</span>
          <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center material-symbols-outlined text-lg shadow-inner">
            balance
          </span>
        </div>
        <div class="space-y-1 text-xs font-mono relative z-10">
          <div class="flex items-center justify-between">
            <span class="text-outline text-[11px] font-sans">CxC (Por Cobrar):</span>
            <span class="text-emerald-400 font-bold">{{ receivablesFormatted() }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-outline text-[11px] font-sans">CxP (Por Pagar):</span>
            <span class="text-rose-400 font-bold">{{ payablesFormatted() }}</span>
          </div>
          <p class="text-[10px] text-outline font-sans pt-0.5 border-t border-white/5">Trazabilidad de cobranza</p>
        </div>
      </div>

    </div>
  `
})
export class FinanceKpisComponent {
  pl = input<ProfitAndLossReport>();
  accounts = input<FinanceAccount[]>([]);
  receivables = input<ReceivableItem[]>([]);
  payables = input<PayableItem[]>([]);

  revenueFormatted = computed(() => money(this.pl()?.grossRevenue?.total || 0));
  costsFormatted = computed(() => money((this.pl()?.costOfSales?.total || 0) + (this.pl()?.operatingExpenses?.total || 0) + (this.pl()?.managerSplitsExpense || 0)));
  netProfitFormatted = computed(() => money(this.pl()?.netProfitAcordex || 0));

  totalCash = computed(() => this.accounts().reduce((sum, a) => sum + a.balance, 0));
  totalCashFormatted = computed(() => money(this.totalCash()));

  totalReceivables = computed(() => this.receivables().reduce((sum, r) => sum + r.pendingAmount, 0));
  receivablesFormatted = computed(() => compactMoney(this.totalReceivables()));

  totalPayables = computed(() => this.payables().reduce((sum, p) => sum + p.pendingAmount, 0));
  payablesFormatted = computed(() => compactMoney(this.totalPayables()));
}
