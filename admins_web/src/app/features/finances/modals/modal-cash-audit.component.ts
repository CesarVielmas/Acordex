import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceAccount } from '../../../core/models/finance.models';
import { money } from '../finance-metrics';

/**
 * Modal de Corte de Caja y Arqueo Oficial de Tesorería.
 */
@Component({
  selector: 'app-modal-cash-audit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-xl rounded-3xl bg-surface-container border border-outline-variant/30 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center material-symbols-outlined text-xl">
              verified_user
            </span>
            <div>
              <h3 class="text-base font-black text-on-surface">Acta de Corte de Caja & Arqueo de Tesorería</h3>
              <p class="text-[11px] text-outline">Conciliación de saldos de cuentas receptoras al corte</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-all"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Acta Oficial Certificada -->
        <div class="p-6 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-4 font-mono text-xs">

          <div class="flex justify-between items-center border-b border-outline-variant/20 pb-3">
            <div>
              <span class="font-sans font-black text-sm text-on-surface block">Acordex Records S.A. de C.V.</span>
              <span class="text-[10px] text-outline font-sans">Dirección General de Finanzas & Tesorería</span>
            </div>
            <span class="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
              ARQUEO CONCILIADO
            </span>
          </div>

          <!-- Desglose de Cuentas -->
          <div class="space-y-2 pt-1">
            @for (acc of accounts(); track acc.id) {
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                <div>
                  <span class="font-sans font-bold text-on-surface block">{{ acc.name }}</span>
                  <span class="text-[10px] text-outline">{{ acc.bankName }} · {{ acc.clabe }}</span>
                </div>
                <span class="text-sm font-black text-primary">{{ money(acc.balance) }}</span>
              </div>
            }
          </div>

          <!-- Total Global -->
          <div class="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/30 text-sm">
            <span class="font-sans font-black text-on-surface">Total Liquidez en Cuentas:</span>
            <span class="text-base font-black text-emerald-300 font-mono">{{ money(totalCash()) }}</span>
          </div>

          <!-- Sello Digital de Auditoría -->
          <div class="p-3 rounded-xl bg-black/40 border border-outline-variant/20 text-[10px] text-outline space-y-1">
            <div class="flex justify-between">
              <span>Sello Digital:</span>
              <span class="font-bold text-on-surface">ACX-FIN-SEC-{{ timestamp() }}</span>
            </div>
            <div class="flex justify-between">
              <span>Auditor Responsable:</span>
              <span class="text-on-surface">Lic. Claudia Morales (Encargado Global)</span>
            </div>
          </div>

        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-surface-container-high text-outline text-xs font-bold hover:text-on-surface"
          >
            Cerrar
          </button>
          <button
            type="button"
            (click)="printAudit()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-on-primary text-xs font-black shadow-lg shadow-primary/20 transition-all flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-sm">print</span>
            Imprimir Acta de Arqueo
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalCashAuditComponent {
  accounts = input.required<FinanceAccount[]>();
  closed = output<void>();

  timestamp = (): string => Date.now().toString().slice(-6);
  money = money;

  totalCash(): number {
    return this.accounts().reduce((s, a) => s + a.balance, 0);
  }

  printAudit(): void {
    window.print();
  }
}
