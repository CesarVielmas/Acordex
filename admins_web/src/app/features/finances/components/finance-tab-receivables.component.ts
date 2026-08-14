import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceivableItem } from '../../../core/models/finance.models';
import { money, calcPercent } from '../finance-metrics';

/**
 * Pestaña de Cuentas por Cobrar (C x C - Cobranza & Anticipos).
 *
 * Administra el cobro de anticipos del 50%, parcialidades e hitos moratorios
 * de contrataciones privadas y taquillas en consignación.
 */
@Component({
  selector: 'app-finance-tab-receivables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- KPIS DE COBRANZA -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total por Cobrar -->
        <div class="p-5 rounded-3xl bg-surface-container border border-amber-500/30 shadow-lg space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-400">Total por Cobrar (Saldos)</span>
          <p class="text-xl sm:text-2xl font-black text-amber-300 font-mono">{{ money(totalPending()) }}</p>
          <p class="text-[10px] text-outline">Anticipos y liquidaciones pendientes</p>
        </div>

        <!-- Cobrado Efectivo -->
        <div class="p-5 rounded-3xl bg-surface-container border border-emerald-500/30 shadow-lg space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400">Cobrado al Momento</span>
          <p class="text-xl sm:text-2xl font-black text-emerald-300 font-mono">{{ money(totalPaid()) }}</p>
          <p class="text-[10px] text-outline">{{ calcPercent(totalPaid(), totalGross()) }}% de cobranza efectiva</p>
        </div>

        <!-- En Mora / Vencido -->
        <div class="p-5 rounded-3xl bg-surface-container border border-rose-500/30 shadow-lg space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-rose-400">Cartera Vencida / Mora</span>
          <p class="text-xl sm:text-2xl font-black text-rose-400 font-mono">{{ money(totalOverdue()) }}</p>
          <p class="text-[10px] text-rose-400/80 font-bold">Requiere acción de tesorería</p>
        </div>

        <!-- Clientes Activos -->
        <div class="p-5 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-lg space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-primary">Cuentas en Cartera</span>
          <p class="text-xl sm:text-2xl font-black text-on-surface font-mono">{{ receivables().length }}</p>
          <p class="text-[10px] text-outline">Contratos en seguimiento activo</p>
        </div>
      </div>

      <!-- BARRA DE FILTROS -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 shadow-xl">
        <div class="flex bg-surface-container-high rounded-2xl p-1 border border-outline-variant/30 flex-wrap">
          <button
            type="button"
            (click)="statusFilter.set('todos')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            [class]="statusFilter() === 'todos' ? 'bg-surface-container-highest text-on-surface' : 'text-outline hover:text-on-surface'"
          >
            Todos ({{ receivables().length }})
          </button>
          <button
            type="button"
            (click)="statusFilter.set('al_corriente')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            [class]="statusFilter() === 'al_corriente' ? 'bg-emerald-500/20 text-emerald-300' : 'text-outline hover:text-on-surface'"
          >
            Al Corriente
          </button>
          <button
            type="button"
            (click)="statusFilter.set('por_vencer')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            [class]="statusFilter() === 'por_vencer' ? 'bg-amber-500/20 text-amber-300' : 'text-outline hover:text-on-surface'"
          >
            Por Vencer (&lt;7 días)
          </button>
          <button
            type="button"
            (click)="statusFilter.set('vencido_o_mora')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            [class]="statusFilter() === 'vencido_o_mora' ? 'bg-rose-500/20 text-rose-300' : 'text-outline hover:text-on-surface'"
          >
            Vencidos / Moratorios
          </button>
        </div>
      </div>

      <!-- LISTADO DE CUENTAS POR COBRAR -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (item of filteredReceivables(); track item.id) {
          <div class="p-5 rounded-3xl bg-surface-container border shadow-lg space-y-4 relative overflow-hidden transition-all hover:border-outline-variant/50"
            [class]="item.status === 'moratorio' ? 'border-rose-500/40 bg-rose-950/10' : item.status === 'vencido' ? 'border-amber-500/40 bg-amber-950/10' : 'border-outline-variant/30'">

            <!-- Encabezado de la cuenta -->
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-0.5 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-mono font-bold text-outline">{{ item.id }}</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                    [class]="item.status === 'moratorio'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : item.status === 'vencido'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'">
                    {{ item.status === 'moratorio' ? '⚠️ Cargo Moratorio' : item.status === 'vencido' ? 'Vencido' : item.status === 'por_vencer' ? 'Por Vencer' : 'Al Corriente' }}
                  </span>
                </div>
                <h4 class="text-sm font-black text-on-surface truncate">{{ item.concept }}</h4>
                <p class="text-xs text-outline truncate">👤 {{ item.clientOrAgency }}</p>
              </div>

              <!-- Saldo Pendiente -->
              <div class="text-right shrink-0">
                <span class="text-[10px] text-outline uppercase font-bold block">Saldo por Cobrar</span>
                <span class="text-base font-black text-amber-400 font-mono">{{ money(item.pendingAmount) }}</span>
              </div>
            </div>

            <!-- Alerta de Mora si aplica -->
            @if (item.hasMoratorio) {
              <div class="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs space-y-1">
                <div class="flex items-center justify-between font-bold text-rose-300">
                  <span>Recargo por atraso aplicado:</span>
                  <span class="font-mono">+{{ money(item.moratorioAmount || 0) }}</span>
                </div>
                <p class="text-[11px] text-rose-200/80">{{ item.moratorioReason }}</p>
              </div>
            }

            <!-- Barra de Avance de Pago -->
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs font-mono">
                <span class="text-emerald-400 font-bold">Cobrado: {{ money(item.paidAmount) }}</span>
                <span class="text-outline">Total: {{ money(item.totalAmount) }}</span>
              </div>
              <div class="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                <div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                  [style.width.%]="calcPercent(item.paidAmount, item.totalAmount)"></div>
              </div>
              <div class="flex justify-between text-[10px] text-outline">
                <span>Vence: {{ item.dueDate }}</span>
                <span class="font-bold text-emerald-400">{{ calcPercent(item.paidAmount, item.totalAmount) }}% liquidado</span>
              </div>
            </div>

            <!-- Botones de Acción -->
            <div class="pt-2 flex items-center justify-end gap-2 border-t border-outline-variant/20">
              <button
                type="button"
                (click)="sendReminder(item)"
                class="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition-all flex items-center gap-1"
              >
                <span class="material-symbols-outlined text-sm">send</span>
                Aviso Cobro
              </button>

              <button
                type="button"
                (click)="recordPayment.emit(item)"
                class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-on-primary text-xs font-black shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1"
              >
                <span class="material-symbols-outlined text-sm">payments</span>
                Registrar Cobro
              </button>
            </div>

          </div>
        } @empty {
          <div class="col-span-2 py-12 text-center text-outline text-xs">
            No hay cuentas por cobrar pendientes en esta categoría.
          </div>
        }
      </div>

    </div>
  `
})
export class FinanceTabReceivablesComponent {
  receivables = input.required<ReceivableItem[]>();
  recordPayment = output<ReceivableItem>();

  statusFilter = signal<'todos' | 'al_corriente' | 'por_vencer' | 'vencido_o_mora'>('todos');

  money = money;
  calcPercent = calcPercent;

  totalPending = computed(() => this.receivables().reduce((s, r) => s + r.pendingAmount, 0));
  totalPaid = computed(() => this.receivables().reduce((s, r) => s + r.paidAmount, 0));
  totalGross = computed(() => this.receivables().reduce((s, r) => s + r.totalAmount, 0));
  totalOverdue = computed(() =>
    this.receivables().filter(r => r.status === 'vencido' || r.status === 'moratorio').reduce((s, r) => s + r.pendingAmount, 0)
  );

  filteredReceivables = computed(() => {
    const filter = this.statusFilter();
    if (filter === 'al_corriente') return this.receivables().filter(r => r.status === 'al_corriente');
    if (filter === 'por_vencer') return this.receivables().filter(r => r.status === 'por_vencer');
    if (filter === 'vencido_o_mora') return this.receivables().filter(r => r.status === 'vencido' || r.status === 'moratorio');
    return this.receivables();
  });

  sendReminder(item: ReceivableItem): void {
    alert(`Aviso de cobro enviado con éxito al cliente ${item.clientOrAgency} (${item.contactEmail || item.contactPhone}) con el desglose del saldo pendiente de ${money(item.pendingAmount)}.`);
  }
}
