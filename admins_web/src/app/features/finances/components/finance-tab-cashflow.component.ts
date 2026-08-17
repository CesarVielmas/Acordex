import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceTransaction, FinanceAccount } from '../../../core/models/finance.models';
import { money } from '../finance-metrics';

/**
 * Pestaña de Flujo de Caja & Libro Diario de Tesorería.
 *
 * Muestra los saldos en vivo de cada cuenta bancaria receptora,
 * el historial cronológico de movimientos y opciones de conciliación SPEI.
 */
@Component({
  selector: 'app-finance-tab-cashflow',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- TARJETAS DE CUENTAS BANCARIAS & SALDOS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (acc of accounts(); track acc.id) {
          <div class="p-5 rounded-3xl bg-[#181818] border shadow-xl space-y-3 relative overflow-hidden transition-all duration-300 hover:scale-[1.01]"
            [class]="acc.id === selectedAccountId() ? 'border-primary shadow-primary/20 ring-2 ring-primary/40' : 'border-white/10'">

            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl flex items-center justify-center material-symbols-outlined text-base shadow-inner"
                  [class]="acc.type === 'caja_chica' ? 'bg-amber-500/20 text-amber-300' : 'bg-primary/20 text-primary'">
                  {{ acc.type === 'caja_chica' ? 'point_of_sale' : 'account_balance' }}
                </span>
                <div class="min-w-0">
                  <h4 class="text-xs font-black text-on-surface truncate font-['Epilogue']">{{ acc.name }}</h4>
                  <p class="text-[10px] text-outline font-mono">{{ acc.bankName }} · {{ acc.accountNumber }}</p>
                </div>
              </div>
            </div>

            <div>
              <span class="text-[10px] text-outline uppercase font-bold tracking-wider font-['Epilogue']">Saldo Disponible</span>
              <p class="text-xl font-black text-on-surface font-mono tracking-tight">{{ money(acc.balance) }}</p>
            </div>

            <div class="pt-2 flex items-center justify-between text-[10px] text-outline border-t border-white/5">
              <span class="font-mono">CLABE: {{ acc.clabe }}</span>
              <button
                type="button"
                (click)="filterByAccount(acc.id)"
                class="font-bold hover:underline cursor-pointer"
                [class]="selectedAccountId() === acc.id ? 'text-primary' : 'text-outline hover:text-on-surface'"
              >
                {{ selectedAccountId() === acc.id ? 'Mostrar todas' : 'Filtrar cuenta' }}
              </button>
            </div>
          </div>
        }
      </div>

      <!-- BARRA DE HERRAMIENTAS Y ACCIONES -->
      <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- BUSCADOR -->
        <div class="relative flex-1 max-w-md">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por folio, concepto, referencia SPEI o artista..."
            class="w-full bg-[#141414] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <!-- FILTROS Y BOTONES -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Filtro Tipo -->
          <div class="flex bg-[#141414] rounded-2xl p-1 border border-white/10">
            <button
              type="button"
              (click)="typeFilter.set('todos')"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-['Epilogue']"
              [class]="typeFilter() === 'todos' ? 'bg-[#222222] text-on-surface shadow-sm' : 'text-outline hover:text-on-surface'"
            >
              Todos
            </button>
            <button
              type="button"
              (click)="typeFilter.set('ingreso')"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-['Epilogue']"
              [class]="typeFilter() === 'ingreso' ? 'bg-emerald-500/20 text-emerald-300' : 'text-outline hover:text-on-surface'"
            >
              Ingresos
            </button>
            <button
              type="button"
              (click)="typeFilter.set('egreso')"
              class="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-['Epilogue']"
              [class]="typeFilter() === 'egreso' ? 'bg-rose-500/20 text-rose-300' : 'text-outline hover:text-on-surface'"
            >
              Egresos
            </button>
          </div>

          <!-- BOTÓN REGISTRAR MOVIMIENTO -->
          <button
            type="button"
            (click)="newTransaction.emit()"
            class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-on-primary text-xs font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-base">add_circle</span>
            Registrar Movimiento
          </button>

          <!-- BOTÓN CORTE DE CAJA -->
          <button
            type="button"
            (click)="auditCash.emit()"
            class="px-3.5 py-2.5 rounded-2xl bg-[#202020] border border-white/10 text-on-surface hover:bg-[#282828] text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-base">receipt_long</span>
            Arqueo Certificado
          </button>
        </div>
      </div>

      <!-- TABLA DE MOVIMIENTOS / LIBRO DIARIO -->
      <div class="rounded-3xl bg-[#181818] border border-white/10 shadow-xl overflow-hidden">
        <div class="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-lg">menu_book</span>
            <h3 class="text-xs sm:text-sm font-bold text-on-surface font-['Epilogue']">Libro Diario de Tesorería ({{ filteredTransactions().length }} asientos contables)</h3>
          </div>
          <span class="text-[11px] text-outline font-mono">Conciliación continua · Operación Principal</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#141414] text-outline border-b border-white/10 text-[10px] font-black uppercase tracking-wider font-mono">
              <tr>
                <th class="py-3 px-4">Folio / Fecha</th>
                <th class="py-3 px-4">Tipo & Categoría</th>
                <th class="py-3 px-4">Concepto / Entidad</th>
                <th class="py-3 px-4">Cuenta / Método</th>
                <th class="py-3 px-4 text-right">Monto (MXN)</th>
                <th class="py-3 px-4 text-center">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              @for (trx of filteredTransactions(); track trx.id) {
                <tr class="hover:bg-[#1E1E1E]/60 transition-colors">
                  <!-- Folio / Fecha -->
                  <td class="py-3.5 px-4 font-mono">
                    <span class="font-bold text-on-surface block">{{ trx.folio }}</span>
                    <span class="text-[10px] text-outline">{{ trx.date }}</span>
                  </td>

                  <!-- Tipo & Categoría -->
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider inline-block mb-1 font-mono"
                      [class]="trx.type === 'ingreso' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'">
                      {{ trx.type === 'ingreso' ? '+ Ingreso' : '- Egreso' }}
                    </span>
                    <span class="text-[10px] text-outline block capitalize">{{ trx.category.replace('_', ' ') }}</span>
                  </td>

                  <!-- Concepto / Entidad -->
                  <td class="py-3.5 px-4 max-w-xs">
                    <p class="font-medium text-on-surface truncate">{{ trx.concept }}</p>
                    @if (trx.relatedEntity) {
                      <span class="text-[10px] text-primary/90 font-bold block truncate">
                        🏷️ {{ trx.relatedEntity.name }}
                      </span>
                    }
                  </td>

                  <!-- Cuenta / Método -->
                  <td class="py-3.5 px-4">
                    <span class="text-on-surface block font-medium">{{ trx.accountName }}</span>
                    <span class="text-[10px] font-mono text-outline">{{ trx.receiptReference || 'Sin ref' }}</span>
                  </td>

                  <!-- Monto -->
                  <td class="py-3.5 px-4 text-right font-mono font-black text-sm"
                    [class]="trx.type === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'">
                    {{ trx.type === 'ingreso' ? '+' : '-' }}{{ money(trx.amount) }}
                  </td>

                  <!-- Estado -->
                  <td class="py-3.5 px-4 text-center">
                    <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold inline-flex items-center gap-1 border"
                      [class]="trx.status === 'conciliado'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'">
                      <span class="material-symbols-outlined text-[12px]">
                        {{ trx.status === 'conciliado' ? 'verified' : 'schedule' }}
                      </span>
                      {{ trx.status === 'conciliado' ? 'Conciliado' : 'Pendiente' }}
                    </span>
                  </td>

                  <!-- Acciones -->
                  <td class="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      (click)="viewReceipt.emit(trx)"
                      class="px-2.5 py-1.5 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] text-primary border border-white/10 text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer font-['Epilogue']"
                    >
                      <span class="material-symbols-outlined text-[13px]">visibility</span>
                      Comprobante
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="py-8 text-center text-outline text-xs font-['Epilogue']">
                    No se encontraron asientos contables con los filtros seleccionados.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class FinanceTabCashflowComponent {
  transactions = input.required<FinanceTransaction[]>();
  accounts = input.required<FinanceAccount[]>();

  newTransaction = output<void>();
  auditCash = output<void>();
  viewReceipt = output<FinanceTransaction>();

  searchQuery = signal('');
  typeFilter = signal<'todos' | 'ingreso' | 'egreso'>('todos');
  selectedAccountId = signal<string | null>(null);

  money = money;

  filterByAccount(accId: string): void {
    if (this.selectedAccountId() === accId) {
      this.selectedAccountId.set(null);
    } else {
      this.selectedAccountId.set(accId);
    }
  }

  filteredTransactions = computed(() => {
    let list = this.transactions();

    // Filtro por tipo
    if (this.typeFilter() !== 'todos') {
      list = list.filter(t => t.type === this.typeFilter());
    }

    // Filtro por cuenta
    if (this.selectedAccountId()) {
      list = list.filter(t => t.accountId === this.selectedAccountId());
    }

    // Filtro por texto
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(t =>
        t.folio.toLowerCase().includes(q) ||
        t.concept.toLowerCase().includes(q) ||
        (t.receiptReference && t.receiptReference.toLowerCase().includes(q)) ||
        (t.relatedEntity && t.relatedEntity.name.toLowerCase().includes(q))
      );
    }

    return list;
  });
}
