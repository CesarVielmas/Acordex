import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-bank-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div class="w-full max-w-lg rounded-3xl bg-surface-container border border-outline-variant/30 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center material-symbols-outlined text-lg">
              account_balance
            </span>
            <div>
              <h3 class="text-base font-black text-on-surface">Agregar Cuenta Bancaria Receptora</h3>
              <p class="text-xs text-outline">Datos de transferencia SPEI para cotizaciones</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Formulario -->
        <div class="space-y-3.5 text-xs">

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Institución Bancaria <span class="text-rose-400">*</span></label>
            <select
              [(ngModel)]="formBankName"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            >
              <option value="BBVA Bancomer">BBVA Bancomer</option>
              <option value="Banorte">Banorte</option>
              <option value="Santander">Santander</option>
              <option value="Citibanamex">Citibanamex</option>
              <option value="HSBC">HSBC</option>
              <option value="Scotiabank">Scotiabank</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Nombre del Beneficiario / Titular <span class="text-rose-400">*</span></label>
            <input
              type="text"
              [(ngModel)]="formAccountHolder"
              placeholder="Acordex Records SA de CV"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            />
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">CLABE Interbancaria (18 dígitos) <span class="text-rose-400">*</span></label>
            <input
              type="text"
              [(ngModel)]="formClabe"
              placeholder="012 580 00123456789 0"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono focus:outline-none focus:border-primary text-xs"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-bold text-on-surface">Número de Cuenta</label>
              <input
                type="text"
                [(ngModel)]="formAccountNumber"
                placeholder="0123456789"
                class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono focus:outline-none focus:border-primary text-xs"
              />
            </div>

            <div class="space-y-1.5">
              <label class="font-bold text-on-surface">Moneda</label>
              <select
                [(ngModel)]="formCurrency"
                class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
              >
                <option value="MXN">MXN ($ Mexicanos)</option>
                <option value="USD">USD ($ Dólares)</option>
              </select>
            </div>
          </div>

        </div>

        <!-- Botones -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20 text-xs">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2 rounded-xl bg-surface-container-high text-outline hover:text-on-surface font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="submitForm()"
            [disabled]="!formClabe.trim() || !formAccountHolder.trim()"
            class="px-5 py-2 rounded-xl bg-primary text-on-primary font-black shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-base">save</span>
            Guardar Cuenta
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalBankEditorComponent {
  saved = output<{ bankName: string; accountHolder: string; clabe: string; accountNumber: string; currency: string; isPrimary: boolean }>();
  closed = output<void>();

  formBankName = 'BBVA Bancomer';
  formAccountHolder = 'Acordex Records SA de CV';
  formClabe = '';
  formAccountNumber = '';
  formCurrency = 'MXN';

  submitForm(): void {
    if (!this.formClabe.trim() || !this.formAccountHolder.trim()) return;

    this.saved.emit({
      bankName: this.formBankName,
      accountHolder: this.formAccountHolder.trim(),
      clabe: this.formClabe.trim(),
      accountNumber: this.formAccountNumber.trim() || this.formClabe.slice(-10),
      currency: this.formCurrency,
      isPrimary: false
    });
  }
}
