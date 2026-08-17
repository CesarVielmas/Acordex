import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceTransaction } from '../../../core/models/finance.models';
import { money } from '../finance-metrics';

/**
 * Modal para visualizar el comprobante bancario y conciliar transacciones SPEI.
 */
@Component({
  selector: 'app-modal-reconcile-receipt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-lg rounded-3xl bg-[#1A1A1A] border border-white/10 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center material-symbols-outlined text-xl shadow-inner">
              receipt_long
            </span>
            <div>
              <h3 class="text-base font-black text-on-surface font-['Epilogue']">Comprobante de Movimiento Contable</h3>
              <p class="text-[11px] font-mono text-outline">{{ transaction().folio }} · {{ transaction().date }}</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-[#222222] text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Voucher Visual de Tesorería -->
        <div class="p-5 rounded-2xl bg-[#141414] border border-white/5 space-y-4 relative overflow-hidden shadow-inner">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-md text-[10px] font-mono font-black uppercase tracking-wider border"
              [class]="transaction().type === 'ingreso'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'">
              {{ transaction().type === 'ingreso' ? 'Ingreso de Fondos' : 'Egreso / Liquidación' }}
            </span>

            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 font-mono"
              [class]="transaction().status === 'conciliado'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'">
              <span class="material-symbols-outlined text-[12px]">
                {{ transaction().status === 'conciliado' ? 'verified' : 'pending' }}
              </span>
              {{ transaction().status === 'conciliado' ? 'Conciliado Oficial' : 'Pendiente Conciliación' }}
            </span>
          </div>

          <div class="space-y-1">
            <span class="text-[10px] text-outline uppercase font-bold font-['Epilogue']">Monto Registrado</span>
            <p class="text-2xl font-black font-mono tracking-tight"
              [class]="transaction().type === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'">
              {{ transaction().type === 'ingreso' ? '+' : '-' }}{{ money(transaction().amount) }}
            </p>
          </div>

          <div class="space-y-2 text-xs border-t border-white/5 pt-3">
            <div class="flex justify-between">
              <span class="text-outline font-['Epilogue']">Concepto / Glosa:</span>
              <span class="font-bold text-on-surface text-right max-w-xs truncate">{{ transaction().concept }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-outline font-['Epilogue']">Cuenta Bancaria / Caja:</span>
              <span class="font-medium text-on-surface">{{ transaction().accountName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-outline font-['Epilogue']">Clave SPEI / Factura:</span>
              <span class="font-mono font-bold text-primary">{{ transaction().receiptReference || 'Sin referencia capturada' }}</span>
            </div>
            @if (transaction().reconciledBy) {
              <div class="flex justify-between">
                <span class="text-outline font-['Epilogue']">Conciliado Por:</span>
                <span class="text-emerald-400 font-medium">{{ transaction().reconciledBy }} ({{ transaction().reconciledAt }})</span>
              </div>
            }
          </div>
        </div>

        <!-- Conciliación si está pendiente -->
        @if (transaction().status !== 'conciliado') {
          <div class="space-y-2 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs">
            <label class="font-bold text-amber-300 block font-['Epilogue']">Clave de Rastreo SPEI / Referencia Bancaria:</label>
            <input
              type="text"
              [ngModel]="newRef()"
              (ngModelChange)="newRef.set($event)"
              placeholder="Ej. SPEI-BANORTE-88192"
              class="w-full bg-[#141414] border border-amber-500/40 rounded-xl px-3 py-2 text-on-surface font-mono focus:outline-none"
            />
          </div>
        }

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-[#222222] text-outline text-xs font-bold hover:text-on-surface cursor-pointer font-['Epilogue']"
          >
            Cerrar
          </button>
          @if (transaction().status !== 'conciliado') {
            <button
              type="button"
              (click)="reconcile()"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer font-['Epilogue']"
            >
              <span class="material-symbols-outlined text-sm">verified</span>
              Conciliar Movimiento
            </button>
          }
        </div>

      </div>
    </div>
  `
})
export class ModalReconcileReceiptComponent {
  transaction = input.required<FinanceTransaction>();

  closed = output<void>();
  reconciled = output<{ trxId: string; reference?: string }>();

  newRef = signal<string>('');
  money = money;

  reconcile(): void {
    this.reconciled.emit({
      trxId: this.transaction().id,
      reference: this.newRef().trim() || undefined
    });
  }
}
