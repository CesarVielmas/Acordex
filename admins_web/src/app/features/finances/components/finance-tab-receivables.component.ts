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
    <div class="space-y-6">      <!-- KPIS DE COBRANZA -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total por Cobrar -->
        <div class="p-5 rounded-3xl bg-[#181818] border border-amber-500/30 shadow-xl space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-amber-400 font-['Epilogue']">Saldo Total por Cobrar</span>
          <p class="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight">{{ money(totalPending()) }}</p>
          <p class="text-[10px] text-outline font-['Epilogue']">Anticipos y liquidaciones pendientes</p>
        </div>

        <!-- Cobrado Efectivo -->
        <div class="p-5 rounded-3xl bg-[#181818] border border-emerald-500/30 shadow-xl space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-['Epilogue']">Recaudación Efectiva</span>
          <p class="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">{{ money(totalPaid()) }}</p>
          <p class="text-[10px] text-outline font-['Epilogue']">{{ calcPercent(totalPaid(), totalGross()) }}% de cobranza efectiva</p>
        </div>

        <!-- En Mora / Vencido -->
        <div class="p-5 rounded-3xl bg-[#181818] border border-rose-500/30 shadow-xl space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-rose-400 font-['Epilogue']">Cartera Vencida / En Mora</span>
          <p class="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight">{{ money(totalOverdue()) }}</p>
          <p class="text-[10px] text-rose-400/90 font-bold font-['Epilogue']">Atención prioritaria de tesorería</p>
        </div>

        <!-- Clientes Activos -->
        <div class="p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-primary font-['Epilogue']">Cuentas en Seguimiento</span>
          <p class="text-xl sm:text-2xl font-black text-on-surface font-mono tracking-tight">{{ receivables().length }} Contratos</p>
          <p class="text-[10px] text-outline font-['Epilogue']">Expedientes comerciales activos</p>
        </div>
      </div>

      <!-- BARRA DE FILTROS -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-[#181818] border border-white/10 shadow-xl">
        <div class="flex bg-[#141414] rounded-2xl p-1 border border-white/10 flex-wrap">
          <button
            type="button"
            (click)="statusFilter.set('todos')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-['Epilogue']"
            [class]="statusFilter() === 'todos' ? 'bg-[#222222] text-on-surface shadow-sm' : 'text-outline hover:text-on-surface'"
          >
            Todos ({{ receivables().length }})
          </button>
          <button
            type="button"
            (click)="statusFilter.set('al_corriente')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-['Epilogue']"
            [class]="statusFilter() === 'al_corriente' ? 'bg-emerald-500/20 text-emerald-300' : 'text-outline hover:text-on-surface'"
          >
            Al Corriente
          </button>
          <button
            type="button"
            (click)="statusFilter.set('por_vencer')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-['Epilogue']"
            [class]="statusFilter() === 'por_vencer' ? 'bg-amber-500/20 text-amber-300' : 'text-outline hover:text-on-surface'"
          >
            Próximos a Vencer (&lt;7 días)
          </button>
          <button
            type="button"
            (click)="statusFilter.set('vencido_o_mora')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-['Epilogue']"
            [class]="statusFilter() === 'vencido_o_mora' ? 'bg-rose-500/20 text-rose-300' : 'text-outline hover:text-on-surface'"
          >
            Vencidos & Moratorios
          </button>
        </div>
      </div>

      <!-- LISTADO DE CUENTAS POR COBRAR -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (item of filteredReceivables(); track item.id) {
          <div class="p-5 rounded-3xl bg-[#181818] border shadow-xl space-y-4 relative overflow-hidden transition-all duration-300 hover:border-primary/40"
            [class]="item.status === 'moratorio' ? 'border-rose-500/40 bg-rose-950/20' : item.status === 'vencido' ? 'border-amber-500/40 bg-amber-950/20' : 'border-white/10'">

            <!-- Encabezado de la cuenta -->
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-0.5 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-mono font-bold text-outline">{{ item.id }}</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border font-mono"
                    [class]="item.status === 'moratorio' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : item.status === 'vencido' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : item.status === 'por_vencer' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'">
                    {{ item.status === 'moratorio' ? '🚨 Cargo Moratorio' : item.status === 'vencido' ? '⚠️ Saldo Vencido' : item.status === 'por_vencer' ? '⏳ Por Vencer' : '✅ Al Corriente' }}
                  </span>
                </div>
                <h4 class="text-sm font-black text-on-surface truncate font-['Epilogue']">{{ item.concept }}</h4>
                <p class="text-xs text-primary font-bold truncate">{{ item.clientOrAgency }}</p>
              </div>

              <div class="text-right shrink-0">
                <span class="text-[10px] text-outline uppercase block font-['Epilogue']">Saldo Pendiente</span>
                <span class="text-lg font-black font-mono text-amber-300">{{ money(item.pendingAmount) }}</span>
                <span class="text-[10px] text-outline font-mono block">Total: {{ money(item.totalAmount) }}</span>
              </div>
            </div>

            <!-- Si tiene mora explicita -->
            @if (item.hasMoratorio && item.moratorioAmount) {
              <div class="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs space-y-1">
                <div class="flex items-center justify-between font-bold text-rose-300">
                  <span class="flex items-center gap-1 font-['Epilogue']">
                    <span class="material-symbols-outlined text-sm">warning</span> Cargo por Mora Aplicado:
                  </span>
                  <span class="font-mono">+{{ money(item.moratorioAmount) }}</span>
                </div>
                <p class="text-[11px] text-rose-200/90 italic">"{{ item.moratorioReason }}"</p>
              </div>
            }

            <!-- Barra de Avance de Pago -->
            <div class="space-y-1.5">
              <div class="flex justify-between text-[11px] font-mono">
                <span class="text-emerald-400 font-bold">Cobrado: {{ money(item.paidAmount) }}</span>
                <span class="text-outline">{{ calcPercent(item.paidAmount, item.totalAmount) }}%</span>
              </div>
              <div class="w-full h-2 rounded-full bg-[#141414] overflow-hidden border border-white/5">
                <div
                  class="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                  [style.width.%]="calcPercent(item.paidAmount, item.totalAmount)"
                ></div>
              </div>
            </div>

            <!-- Footer: Fecha límite y botón registrar cobro -->
            <div class="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <div class="flex items-center gap-1.5 text-outline">
                <span class="material-symbols-outlined text-sm">event</span>
                <span>Vence: <b class="text-on-surface font-mono">{{ item.dueDate }}</b></span>
              </div>

              <button
                type="button"
                (click)="recordPayment.emit(item)"
                class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer font-['Epilogue']"
              >
                <span class="material-symbols-outlined text-sm">price_check</span>
                Registrar Cobro
              </button>
            </div>

          </div>
        } @empty {
          <div class="col-span-2 p-12 text-center rounded-3xl bg-[#181818] border border-white/10 text-outline space-y-2">
            <span class="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
            <p class="text-sm font-bold text-on-surface font-['Epilogue']">No hay saldos pendientes en este filtro</p>
            <p class="text-xs">Todos los cobros de cotizaciones y taquillas se encuentran al corriente.</p>
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
