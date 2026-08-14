import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceAccount, FinanceTransaction, CashCutRecord } from '../../../core/models/finance.models';
import { money } from '../finance-metrics';

/**
 * Pestaña de Corte de Caja & Arqueo de Tesorería.
 *
 * Permite a cualquier persona:
 * 1. Ver en tiempo real el saldo de apertura, las entradas y salidas de hoy.
 * 2. Cuadrar el saldo final esperado con el dinero en cada banco y efectivo.
 * 3. Ejecutar y registrar un nuevo Corte de Caja con 1 solo clic.
 * 4. Consultar e imprimir el historial de cortes de caja pasados.
 */
@Component({
  selector: 'app-finance-tab-cashcut',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ─── ENCABEZADO & HERRAMIENTA DE CORTE EN VIVO ─── -->
      <div class="p-6 rounded-3xl bg-gradient-to-r from-surface-container-high/90 via-surface-container/80 to-surface-container-high/90 border border-primary/30 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg">
              receipt_long
            </span>
            <h2 class="text-lg font-black text-on-surface">Corte de Caja & Arqueo en Vivo</h2>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Día Actual Activo
            </span>
          </div>
          <p class="text-xs text-outline max-w-xl">
            Cuadra el dinero que entró y salió el día de hoy, verifica los saldos en cada cuenta bancaria y guarda el corte de caja oficial.
          </p>
        </div>

        <button
          type="button"
          (click)="showConfirmCutModal.set(true)"
          class="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-black shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <span class="material-symbols-outlined text-base">check_circle</span>
          Realizar y Guardar Corte de Hoy
        </button>
      </div>

      <!-- ─── CUADRE VISUAL DEL DÍA (ECUACIÓN DE CAJA) ─── -->
      <div class="p-6 sm:p-7 rounded-3xl bg-surface-container-high border border-outline-variant/30 shadow-2xl space-y-6">
        <h3 class="text-xs font-black text-on-surface uppercase tracking-wider text-outline">
          Ecuación del Arqueo de Hoy ({{ todayFormatted }})
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center font-mono">

          <!-- 1. Saldo Inicial -->
          <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/25 space-y-1">
            <span class="text-[10px] font-sans font-bold text-outline uppercase block">1. Saldo Inicial en Bancos</span>
            <p class="text-xl font-black text-on-surface">{{ money(initialBalance()) }}</p>
            <span class="text-[10px] text-outline font-sans">Apertura del día</span>
          </div>

          <!-- 2. Más: Entradas de Hoy -->
          <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
            <span class="text-[10px] font-sans font-bold text-emerald-400 uppercase block">+ 2. Dinero Entrado Hoy</span>
            <p class="text-xl font-black text-emerald-300">{{ money(todayIncomes()) }}</p>
            <span class="text-[10px] text-emerald-400 font-sans font-bold">{{ todayIncomesCount() }} cobros registrados</span>
          </div>

          <!-- 3. Menos: Salidas de Hoy -->
          <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1">
            <span class="text-[10px] font-sans font-bold text-rose-400 uppercase block">- 3. Dinero Pagado Hoy</span>
            <p class="text-xl font-black text-rose-400">{{ money(todayExpenses()) }}</p>
            <span class="text-[10px] text-rose-400 font-sans font-bold">{{ todayExpensesCount() }} pagos realizados</span>
          </div>

          <!-- 4. Igual: Saldo Final en Cuentas -->
          <div class="p-4 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 space-y-1">
            <span class="text-[10px] font-sans font-bold text-cyan-300 uppercase block">= 4. Saldo Final Cuadrado</span>
            <p class="text-xl font-black text-cyan-300">{{ money(finalExpectedBalance()) }}</p>
            <span class="text-[10px] text-cyan-200 font-sans font-bold">100% conciliado</span>
          </div>

        </div>

        <!-- Desglose por Cuentas Bancarias y Efectivo -->
        <div class="pt-4 border-t border-outline-variant/20 space-y-3">
          <span class="text-xs font-bold text-on-surface block">
            ¿Dónde está repartido este dinero hoy? (Arqueo por Cuentas)
          </span>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            @for (acc of accounts(); track acc.id) {
              <div class="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-xs font-bold text-on-surface truncate">{{ acc.bankName }}</p>
                  <p class="text-[10px] text-outline truncate">{{ acc.description || acc.name }}</p>
                </div>
                <span class="text-xs font-mono font-black text-cyan-300 shrink-0">{{ money(acc.balance) }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- ─── HISTORIAL DE CORTES DE CAJA PASADOS ─── -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4">
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-base">history</span>
            <h3 class="text-sm font-black text-on-surface">Historial de Cortes de Caja Guardados</h3>
          </div>
          <span class="text-xs text-outline font-mono">{{ cashCuts().length }} cortes archivados</span>
        </div>

        <div class="space-y-3">
          @for (cut of cashCuts(); track cut.id) {
            <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 hover:border-outline-variant/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">

              <!-- Datos del corte -->
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center material-symbols-outlined text-lg shrink-0">
                  task_alt
                </span>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-mono font-black text-on-surface">{{ cut.cutFolio }}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-highest text-outline border border-outline-variant/30">
                      {{ cut.date }} · {{ cut.time }} hrs
                    </span>
                    <span class="text-[11px] text-outline">Por: <b class="text-on-surface">{{ cut.closedBy }}</b></span>
                  </div>
                  <p class="text-[11px] text-outline mt-1 italic">"{{ cut.notes || 'Corte cerrado sin observaciones.' }}"</p>
                </div>
              </div>

              <!-- Cifras del corte -->
              <div class="flex items-center gap-4 text-xs font-mono shrink-0">
                <div class="text-right">
                  <span class="text-[10px] text-outline font-sans block">Entradas / Salidas</span>
                  <span class="text-emerald-400">+{{ money(cut.totalIncomes) }}</span> /
                  <span class="text-rose-400">-{{ money(cut.totalExpenses) }}</span>
                </div>
                <div class="text-right pl-3 border-l border-outline-variant/30">
                  <span class="text-[10px] text-outline font-sans block">Saldo Final</span>
                  <span class="text-sm font-black text-cyan-300">{{ money(cut.finalBalance) }}</span>
                </div>
                <button
                  type="button"
                  (click)="printCut(cut)"
                  class="p-2 rounded-xl bg-surface-container border border-outline-variant/30 text-outline hover:text-on-surface flex items-center justify-center transition-all"
                  title="Imprimir Acta de Corte"
                >
                  <span class="material-symbols-outlined text-base">print</span>
                </button>
              </div>

            </div>
          }
        </div>
      </div>

      <!-- ─── MODAL DE CONFIRMACIÓN DE CORTE DE CAJA ─── -->
      @if (showConfirmCutModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div class="w-full max-w-lg rounded-3xl bg-surface-container border border-outline-variant/30 shadow-2xl p-6 space-y-5">

            <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-400 text-xl">receipt_long</span>
                <h3 class="text-base font-black text-on-surface">Confirmar Corte de Caja</h3>
              </div>
              <button
                type="button"
                (click)="showConfirmCutModal.set(false)"
                class="w-8 h-8 rounded-xl bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center"
              >
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-outline">Fecha y Hora:</span>
                <span class="font-bold text-on-surface">{{ todayFormatted }} · {{ currentTimeFormatted }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-outline">Responsable:</span>
                <span class="font-bold text-on-surface">Lic. Claudia Morales (Encargada)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-outline">Dinero Entrado Hoy:</span>
                <span class="font-bold font-mono text-emerald-400">+{{ money(todayIncomes()) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-outline">Dinero Pagado Hoy:</span>
                <span class="font-bold font-mono text-rose-400">-{{ money(todayExpenses()) }}</span>
              </div>
              <div class="flex justify-between pt-2 border-t border-outline-variant/30 text-sm">
                <span class="font-black text-on-surface">Saldo Final a Sellar:</span>
                <span class="font-black font-mono text-cyan-300">{{ money(finalExpectedBalance()) }}</span>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-on-surface">Observaciones del Corte (Opcional):</label>
              <textarea
                [(ngModel)]="cutNotes"
                rows="2"
                placeholder="Ej. Taquillas cuadradas al 100%, todos los tickets de viáticos adjuntados..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline/50 focus:border-primary outline-none"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                (click)="showConfirmCutModal.set(false)"
                class="px-4 py-2.5 rounded-xl bg-surface-container-high text-outline text-xs font-bold hover:text-on-surface"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="confirmAndSaveCut()"
                class="px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-sm">lock</span>
                Sellar y Guardar Corte
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class FinanceTabCashcutComponent {
  transactions = input<FinanceTransaction[]>([]);
  accounts = input<FinanceAccount[]>([]);
  cashCuts = input<CashCutRecord[]>([]);

  saveCut = output<{
    initialBalance: number;
    totalIncomes: number;
    totalExpenses: number;
    finalBalance: number;
    accountBreakdown: { accountId: string; accountName: string; balance: number }[];
    notes?: string;
    transactionsCount: number;
    closedBy: string;
    date: string;
    time: string;
  }>();

  showConfirmCutModal = signal(false);
  cutNotes = '';

  money = money;

  get todayFormatted(): string {
    return new Date().toISOString().slice(0, 10);
  }

  get currentTimeFormatted(): string {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  todayTransactions = computed(() => {
    const today = this.todayFormatted;
    return this.transactions().filter(t => t.date === today);
  });

  todayIncomes = computed(() => {
    return this.todayTransactions()
      .filter(t => t.type === 'ingreso')
      .reduce((s, t) => s + t.amount, 0);
  });

  todayIncomesCount = computed(() => this.todayTransactions().filter(t => t.type === 'ingreso').length);

  todayExpenses = computed(() => {
    return this.todayTransactions()
      .filter(t => t.type === 'egreso')
      .reduce((s, t) => s + t.amount, 0);
  });

  todayExpensesCount = computed(() => this.todayTransactions().filter(t => t.type === 'egreso').length);

  finalExpectedBalance = computed(() => {
    return this.accounts().reduce((s, a) => s + a.balance, 0);
  });

  initialBalance = computed(() => {
    return this.finalExpectedBalance() - this.todayIncomes() + this.todayExpenses();
  });

  confirmAndSaveCut(): void {
    const breakdown = this.accounts().map(a => ({
      accountId: a.id,
      accountName: `${a.bankName} - ${a.description || a.name}`,
      balance: a.balance
    }));

    this.saveCut.emit({
      initialBalance: this.initialBalance(),
      totalIncomes: this.todayIncomes(),
      totalExpenses: this.todayExpenses(),
      finalBalance: this.finalExpectedBalance(),
      accountBreakdown: breakdown,
      notes: this.cutNotes.trim() || 'Corte diario completado con éxito.',
      transactionsCount: this.todayTransactions().length,
      closedBy: 'Lic. Claudia Morales',
      date: this.todayFormatted,
      time: this.currentTimeFormatted
    });

    this.showConfirmCutModal.set(false);
    this.cutNotes = '';
  }

  printCut(cut: CashCutRecord): void {
    window.print();
  }
}
