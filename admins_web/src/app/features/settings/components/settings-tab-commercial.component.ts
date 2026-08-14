import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CorporateSettings } from '../../../core/models/admin.models';

@Component({
  selector: 'app-settings-tab-commercial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center material-symbols-outlined text-lg">
              storefront
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Políticas Comerciales & Reglas de Booking</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Parámetros predeterminados para nuevas cotizaciones, apartados de fecha y porcentajes de anticipo</p>
        </div>
      </div>

      <!-- FORMULARIO COMERCIAL -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-5">

        <!-- 1. PARÁMETROS NUMÉRICOS -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Comisión Base de Booking (%)</label>
            <div class="relative">
              <input
                type="number"
                [(ngModel)]="settings().defaultCommissionPercent"
                class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono font-bold focus:outline-none focus:border-primary text-xs"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-outline font-bold">%</span>
            </div>
            <span class="text-[10px] text-outline">Margen retenido por la agencia</span>
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Vigencia de Cotizaciones (Días)</label>
            <div class="relative">
              <input
                type="number"
                [(ngModel)]="settings().quoteValidityDays"
                class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono font-bold focus:outline-none focus:border-primary text-xs"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-outline font-bold">Días</span>
            </div>
            <span class="text-[10px] text-outline">Tiempo límite antes de expiración</span>
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Anticipo Obligatorio (%)</label>
            <div class="relative">
              <input
                type="number"
                [(ngModel)]="settings().requiredAdvancePercent"
                class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-mono font-bold focus:outline-none focus:border-primary text-xs"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-outline font-bold">%</span>
            </div>
            <span class="text-[10px] text-outline">Requerido para bloquear fecha en agenda</span>
          </div>
        </div>

        <!-- 2. CLÁUSULAS Y TÉRMINOS LEGALES PREDETERMINADOS -->
        <div class="space-y-4 text-xs">
          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Política de Cancelación & Reembolsos</label>
            <textarea
              [(ngModel)]="settings().cancellationPolicyTerms"
              rows="3"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface leading-relaxed focus:outline-none focus:border-primary text-xs"
            ></textarea>
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Cláusula Predeterminada de Viáticos & Hospedaje</label>
            <textarea
              [(ngModel)]="settings().defaultContractNotes"
              rows="3"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface leading-relaxed focus:outline-none focus:border-primary text-xs"
            ></textarea>
          </div>
        </div>

        <!-- BOTÓN GUARDAR -->
        <div class="flex justify-end pt-3 border-t border-outline-variant/20">
          <button
            type="button"
            (click)="save.emit()"
            class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-black text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">save</span>
            Guardar Políticas Comerciales
          </button>
        </div>

      </div>

    </div>
  `
})
export class SettingsTabCommercialComponent {
  settings = input.required<CorporateSettings>();
  save = output<void>();
}
