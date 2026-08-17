import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceAccount, ReceivableItem, PayableItem } from '../../../core/models/finance.models';
import { money } from '../finance-metrics';

/**
 * Modal unificado para registrar cobros (C x C) o dispersiones de pagos (C x P).
 */
@Component({
  selector: 'app-modal-record-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-lg rounded-3xl bg-[#1A1A1A] border border-white/10 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-2xl flex items-center justify-center material-symbols-outlined text-xl shadow-inner"
              [class]="mode() === 'cobro' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'">
              {{ mode() === 'cobro' ? 'point_of_sale' : 'send_money' }}
            </span>
            <div>
              <h3 class="text-base font-black text-on-surface font-['Epilogue']">
                {{ mode() === 'cobro' ? 'Registrar Cobranza de Cliente' : 'Dispersar Liquidación a Proveedor / Talento' }}
              </h3>
              <p class="text-[11px] text-outline font-mono">{{ targetId() }}</p>
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

        <!-- Resumen de la Cuenta -->
        <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-outline font-['Epilogue']">Concepto / Glosa:</span>
            <span class="font-bold text-on-surface text-right truncate max-w-xs">{{ concept() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-outline font-['Epilogue']">{{ mode() === 'cobro' ? 'Cliente / Deudor:' : 'Beneficiario:' }}</span>
            <span class="font-medium text-primary">{{ entityName() }}</span>
          </div>
          <div class="flex justify-between border-t border-white/10 pt-2 font-mono">
            <span class="text-outline font-['Epilogue']">Saldo Pendiente:</span>
            <span class="font-black text-sm" [class]="mode() === 'cobro' ? 'text-amber-300' : 'text-rose-400'">
              {{ money(pendingAmount()) }}
            </span>
          </div>
        </div>

        <!-- Formulario de Pago -->
        <div class="space-y-4 text-xs">
          <!-- Monto a Aplicar -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1 font-['Epilogue']">Monto a Aplicar (MXN)</label>
            <input
              type="number"
              [ngModel]="paymentAmount()"
              (ngModelChange)="paymentAmount.set($event)"
              placeholder="0.00"
              class="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-on-surface font-mono font-bold text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <!-- Cuenta Bancaria -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1 font-['Epilogue']">
              {{ mode() === 'cobro' ? 'Cuenta Receptora de Fondos' : 'Cuenta de Origen de Fondos' }}
            </label>
            <select
              [ngModel]="selectedAccountId()"
              (ngModelChange)="selectedAccountId.set($event)"
              class="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
            >
              @for (acc of accounts(); track acc.id) {
                <option [value]="acc.id">{{ acc.name }} · Saldo: {{ money(acc.balance) }}</option>
              }
            </select>
          </div>

          <!-- Clave SPEI / Comprobante -->
          <div>
            <label class="font-bold text-outline uppercase text-[10px] block mb-1 font-['Epilogue']">Clave de Rastreo SPEI / Folio Bancario</label>
            <input
              type="text"
              [ngModel]="reference()"
              (ngModelChange)="reference.set($event)"
              placeholder="Ej. SPEI-BANCO-2026-991"
              class="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-on-surface font-mono focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-[#222222] text-outline text-xs font-bold hover:text-on-surface cursor-pointer font-['Epilogue']"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="confirm()"
            [disabled]="!isValid()"
            class="px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-['Epilogue']"
            [class]="mode() === 'cobro'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black shadow-emerald-500/20'
              : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-rose-500/20'"
          >
            Confirmar y Aplicar {{ mode() === 'cobro' ? 'Cobro' : 'Dispersión' }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalRecordPaymentComponent implements OnInit {
  mode = input.required<'cobro' | 'pago'>();
  receivable = input<ReceivableItem>();
  payable = input<PayableItem>();
  accounts = input.required<FinanceAccount[]>();

  closed = output<void>();
  confirmed = output<{
    targetId: string;
    amount: number;
    accountId: string;
    reference: string;
  }>();

  paymentAmount = signal<number>(0);
  selectedAccountId = signal<string>('card-bbva-01');
  reference = signal<string>('');

  ngOnInit(): void {
    const pAmount = this.mode() === 'cobro' ? (this.receivable()?.pendingAmount || 0) : (this.payable()?.pendingAmount || 0);
    this.paymentAmount.set(pAmount);
    this.reference.set(`SPEI-${Date.now().toString().slice(-4)}`);
  }

  targetId = (): string => this.mode() === 'cobro' ? (this.receivable()?.id || '') : (this.payable()?.id || '');
  concept = (): string => this.mode() === 'cobro' ? (this.receivable()?.concept || '') : (this.payable()?.concept || '');
  entityName = (): string => this.mode() === 'cobro' ? (this.receivable()?.clientOrAgency || '') : (this.payable()?.beneficiaryName || '');
  pendingAmount = (): number => this.mode() === 'cobro' ? (this.receivable()?.pendingAmount || 0) : (this.payable()?.pendingAmount || 0);

  money = money;

  isValid(): boolean {
    return this.paymentAmount() > 0;
  }

  confirm(): void {
    if (!this.isValid()) return;
    this.confirmed.emit({
      targetId: this.targetId(),
      amount: this.paymentAmount(),
      accountId: this.selectedAccountId(),
      reference: this.reference().trim()
    });
  }
}
