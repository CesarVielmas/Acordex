import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 max-w-4xl mx-auto animate-fade-in">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display-xl text-2xl font-black text-on-surface">Configuración de la Disquera</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
              Perfil Corporativo
            </span>
          </div>
          <p class="text-xs text-outline mt-1">Configuración global de Acordex Records y preferencias de cuenta</p>
        </div>
      </div>

      <!-- CORPORATE PROFILE SETTINGS -->
      <div class="p-6 sm:p-8 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-6">
        <h3 class="text-base font-bold text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">domain</span> Datos de la Disquera / Agencia
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block text-outline font-medium mb-1">Nombre Comercial</label>
            <input [(ngModel)]="form.agencyName" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-on-surface font-bold" />
          </div>

          <div>
            <label class="block text-outline font-medium mb-1">RFC / Registro Fiscal</label>
            <input [(ngModel)]="form.legalId" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-on-surface" />
          </div>

          <div>
            <label class="block text-outline font-medium mb-1">Correo Electrónico Oficial</label>
            <input [(ngModel)]="form.contactEmail" type="email" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-on-surface" />
          </div>

          <div>
            <label class="block text-outline font-medium mb-1">Teléfono Corporativo</label>
            <input [(ngModel)]="form.contactPhone" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-on-surface" />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-outline font-medium mb-1">Dirección Matriz</label>
            <input [(ngModel)]="form.address" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3.5 py-2.5 text-on-surface" />
          </div>
        </div>

        <div class="flex justify-end pt-3">
          <button (click)="saveSettings()" class="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:scale-105 transition-all">
            Guardar Cambios Corporativos
          </button>
        </div>
      </div>

      <!-- LOGOUT & SESSION CONTROL -->
      <div class="p-6 rounded-3xl bg-surface-container border border-red-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-red-400">logout</span> Cierre de Sesión
          </h3>
          <p class="text-xs text-outline mt-0.5">Finalizar sesión mock actual en el Panel Administrador Acordex</p>
        </div>

        <button 
          (click)="showLogoutModal.set(true)"
          class="px-5 py-2.5 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white font-bold text-xs transition-all"
        >
          Cerrar Sesión
        </button>
      </div>

      <!-- LOGOUT SIMULATION MODAL -->
      @if (showLogoutModal()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-surface-container p-6 rounded-3xl border border-outline-variant/30 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div class="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <span class="material-symbols-outlined text-3xl">logout</span>
            </div>
            <h3 class="text-lg font-bold text-on-surface">¿Cerrar Sesión Administrador?</h3>
            <p class="text-xs text-outline">Simulación: Tu sesión simulada se pausará. Los datos persistirán en localStorage.</p>

            <div class="flex items-center justify-center gap-3 pt-2">
              <button (click)="showLogoutModal.set(false)" class="px-4 py-2 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
              <button (click)="confirmLogout()" class="px-5 py-2 rounded-xl bg-red-500 text-white text-xs font-bold">Confirmar Salida</button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class SettingsComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  showLogoutModal = signal(false);

  form = { ...this.mockData.settings() };

  saveSettings(): void {
    this.mockData.updateSettings(this.form);
    alert('Configuración guardada correctamente.');
  }

  confirmLogout(): void {
    this.showLogoutModal.set(false);
    alert('Sesión simulada finalizada. Has regresado a la pantalla inicial.');
  }
}
