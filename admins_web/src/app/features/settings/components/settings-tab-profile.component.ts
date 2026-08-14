import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CorporateSettings } from '../../../core/models/admin.models';

@Component({
  selector: 'app-settings-tab-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg">
              domain
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Datos Fiscales & Perfil de la Disquera</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Información legal, dirección matriz, logotipo y representante para la emisión de contratos</p>
        </div>
      </div>

      <!-- FORMULARIO CORPORATIVO -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-5">

        <!-- 1. IDENTIDAD COMERCIAL & LEGAL -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Nombre Comercial de la Disquera</label>
            <input
              type="text"
              [(ngModel)]="settings().agencyName"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            />
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Razón Social Legal</label>
            <input
              type="text"
              [(ngModel)]="settings().legalName"
              placeholder="Acordex Records SA de CV"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            />
          </div>
        </div>

        <!-- 2. RFC & REPRESENTANTE LEGAL -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">RFC / Identificación Fiscal</label>
            <input
              type="text"
              [(ngModel)]="settings().legalId"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary uppercase font-mono text-xs"
            />
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Régimen Fiscal</label>
            <input
              type="text"
              [(ngModel)]="settings().taxRegime"
              placeholder="601 - General de Ley Personas Morales"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            />
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Representante Legal</label>
            <input
              type="text"
              [(ngModel)]="settings().legalRepresentative"
              placeholder="Lic. Claudia Morales Valenzuela"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            />
          </div>
        </div>

        <!-- 3. CONTACTO & DIRECCIÓN -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Correo Electrónico Oficial</label>
            <input
              type="email"
              [(ngModel)]="settings().contactEmail"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            />
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Teléfono Conmutador</label>
            <input
              type="text"
              [(ngModel)]="settings().contactPhone"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div class="sm:col-span-2 space-y-1.5">
            <label class="font-bold text-on-surface">Dirección Matriz</label>
            <input
              type="text"
              [(ngModel)]="settings().address"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            />
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Ciudad / Estado</label>
            <input
              type="text"
              [ngModel]="(settings().city || 'Monterrey') + ', ' + (settings().state || 'NL')"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            />
          </div>
        </div>

        <!-- 4. LOGO Y BOTÓN GUARDAR -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-outline-variant/20">
          <div class="flex items-center gap-3">
            <img [src]="settings().logoUrl" alt="Logo" class="w-12 h-12 rounded-2xl object-cover ring-1 ring-primary/30" />
            <div class="text-xs">
              <span class="font-bold text-on-surface block">Logotipo Oficial de Acordex</span>
              <span class="text-[10px] text-outline">Se incluye en cotizaciones y contratos PDF</span>
            </div>
          </div>

          <button
            type="button"
            (click)="save.emit()"
            class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-black text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer self-end sm:self-auto"
          >
            <span class="material-symbols-outlined text-base">save</span>
            Guardar Cambios
          </button>
        </div>

      </div>

    </div>
  `
})
export class SettingsTabProfileComponent {
  settings = input.required<CorporateSettings>();
  save = output<void>();
}
