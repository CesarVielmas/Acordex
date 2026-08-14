import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfitAndLossReport, FinanceAccount, ReceivableItem, PayableItem } from '../../../core/models/finance.models';
import { money, compactMoney } from '../finance-metrics';

/**
 * Barra superior de KPIs Financieros de Acordex.
 *
 * Muestra en lenguaje 100% claro y visual:
 * 1. Total de Dinero que Entró
 * 2. Total de Dinero que se Gastó
 * 3. Ganancia Limpia en la Bolsa
 * 4. Dinero Disponible en Bancos y Caja
 * 5. Cuentas por Cobrar vs Cuentas por Pagar
 */
@Component({
  selector: 'app-finance-kpis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

      <!-- 1. DINERO QUE ENTRÓ -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-primary/30 shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all">
        <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Dinero que Entró</span>
          <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg">
            trending_up
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-xl sm:text-2xl font-black text-on-surface font-mono tracking-tight">{{ revenueFormatted() }}</p>
          <div class="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
            <span class="material-symbols-outlined text-sm">check_circle</span>
            <span>Taquilla + Contrataciones</span>
          </div>
        </div>
      </div>

      <!-- 2. DINERO QUE SE GASTÓ -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-rose-500/30 shadow-xl relative overflow-hidden group hover:border-rose-500/50 transition-all">
        <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-rose-400 uppercase tracking-widest">Dinero que se Gastó</span>
          <span class="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center material-symbols-outlined text-lg">
            payments
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-xl sm:text-2xl font-black text-on-surface font-mono tracking-tight">{{ costsFormatted() }}</p>
          <div class="flex items-center gap-1 text-[11px] text-outline">
            <span>Músicos, audio, recinto y staff</span>
          </div>
        </div>
      </div>

      <!-- 3. GANANCIA LIMPIA ACORDEX -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-emerald-500/40 shadow-xl relative overflow-hidden group hover:border-emerald-500/60 transition-all">
        <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Ganancia Limpia</span>
          <span class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center material-symbols-outlined text-lg">
            savings
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">{{ netProfitFormatted() }}</p>
          <div class="flex items-center gap-1.5 text-[11px] text-emerald-400 font-black">
            <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30">
              {{ pl()?.netMarginPercent || 0 }}% Ganancia Real
            </span>
          </div>
        </div>
      </div>

      <!-- 4. DINERO EN BANCOS Y CAJA -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-cyan-500/30 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all">
        <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Dinero en Bancos</span>
          <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center material-symbols-outlined text-lg">
            account_balance
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-xl sm:text-2xl font-black text-on-surface font-mono tracking-tight">{{ totalCashFormatted() }}</p>
          <div class="flex items-center gap-1 text-[11px] text-cyan-300">
            <span>{{ accounts().length }} cuentas con dinero hoy</span>
          </div>
        </div>
      </div>

      <!-- 5. NOS DEBEN vs DEBEMOS -->
      <div class="p-5 rounded-3xl bg-gradient-to-b from-surface-container-high/90 to-surface-container/70 border border-amber-500/30 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
        <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pendientes</span>
          <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center material-symbols-outlined text-lg">
            balance
          </span>
        </div>
        <div class="space-y-1 text-xs font-mono">
          <div class="flex items-center justify-between">
            <span class="text-emerald-400 font-bold">Nos deben: {{ receivablesFormatted() }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-rose-400 font-bold">Debemos: {{ payablesFormatted() }}</span>
          </div>
          <p class="text-[10px] text-outline font-sans pt-0.5">Control de cobros y pagos</p>
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
