import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorporateSettings } from '../../../core/models/admin.models';

@Component({
  selector: 'app-settings-tab-banks',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center material-symbols-outlined text-lg">
              account_balance
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Cuentas Bancarias Receptoras de Anticipos (SPEI)</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Cuentas oficiales que se imprimen en los contratos y cotizaciones para recibir transferencias</p>
        </div>

        <button
          type="button"
          (click)="openAddModal.emit()"
          class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-black text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span class="material-symbols-outlined text-base">add</span>
          Agregar Cuenta Receptora
        </button>
      </div>

      <!-- LISTA DE CUENTAS BANCARIAS -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        @for (acc of settings().receivingBankAccounts || []; track acc.id) {
          <div class="p-5 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">credit_card</span>
                  </div>
                  <div>
                    <h3 class="text-xs font-black text-on-surface">{{ acc.bankName }}</h3>
                    <span class="text-[10px] text-outline font-medium">{{ acc.accountHolder }}</span>
                  </div>
                </div>

                @if (acc.isPrimary) {
                  <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    Cuenta Principal
                  </span>
                }
              </div>

              <!-- CLABE y Número -->
              <div class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-1.5 text-xs font-mono">
                <div class="flex justify-between items-center">
                  <span class="text-outline text-[10px] font-sans uppercase">CLABE Interbancaria:</span>
                  <span class="font-black text-emerald-300">{{ acc.clabe }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-outline text-[10px] font-sans uppercase">Número de Cuenta:</span>
                  <span class="font-bold text-on-surface">{{ acc.accountNumber }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-outline text-[10px] font-sans uppercase">Moneda:</span>
                  <span class="font-bold text-primary">{{ acc.currency }}</span>
                </div>
              </div>
            </div>

            <!-- Botones -->
            <div class="pt-2 flex justify-end">
              @if (!acc.isPrimary) {
                <button
                  type="button"
                  (click)="deleteAccount.emit(acc.id)"
                  class="px-3 py-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <span class="material-symbols-outlined text-sm">delete</span> Eliminar Cuenta
                </button>
              }
            </div>
          </div>
        }
      </div>

    </div>
  `
})
export class SettingsTabBanksComponent {
  settings = input.required<CorporateSettings>();

  openAddModal = output<void>();
  deleteAccount = output<string>();
}
