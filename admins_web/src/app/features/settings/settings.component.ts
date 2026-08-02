import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { PanelComponent } from '../../shared/ui/panel/panel.component';
import { FormFieldComponent } from '../../shared/ui/form-field/form-field.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, PanelComponent, FormFieldComponent, ModalShellComponent],
  template: `
    <div class="space-y-6 sm:space-y-8 max-w-4xl mx-auto animate-fade-in">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="font-display-xl text-xl sm:text-2xl font-black text-on-surface">Configuración de la Disquera</h1>
            <app-badge label="Perfil Corporativo" variant="primary" />
          </div>
          <p class="text-xs text-outline mt-1">Configuración global de Acordex Records y preferencias de cuenta</p>
        </div>
      </div>

      <!-- CORPORATE PROFILE SETTINGS -->
      <app-panel title="Datos de la Disquera / Agencia" icon="domain">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <app-form-field label="Nombre Comercial" [(value)]="form.agencyName" type="text" />
          <app-form-field label="RFC / Registro Fiscal" [(value)]="form.legalId" type="text" />
          <app-form-field label="Correo Electrónico Oficial" [(value)]="form.contactEmail" type="email" />
          <app-form-field label="Teléfono Corporativo" [(value)]="form.contactPhone" type="text" />
          <div class="sm:col-span-2">
            <app-form-field label="Dirección Matriz" [(value)]="form.address" type="text" />
          </div>
        </div>

        <div class="flex justify-end pt-3">
          <button (click)="saveSettings()" class="px-5 py-2.5 min-h-11 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:scale-105 transition-all">
            Guardar Cambios Corporativos
          </button>
        </div>
      </app-panel>

      <!-- LOGOUT & SESSION CONTROL -->
      <div class="p-5 sm:p-6 rounded-3xl bg-surface-container border border-red-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-red-400">logout</span> Cierre de Sesión
          </h3>
          <p class="text-xs text-outline mt-0.5">Finalizar sesión mock actual en el Panel Administrador Acordex</p>
        </div>

        <button
          (click)="showLogoutModal.set(true)"
          class="px-5 py-2.5 min-h-11 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white font-bold text-xs transition-all"
        >
          Cerrar Sesión
        </button>
      </div>

      <!-- LOGOUT SIMULATION MODAL -->
      @if (showLogoutModal()) {
        <app-modal-shell
          title="¿Cerrar Sesión Administrador?"
          icon="logout"
          size="sm"
          [hasFooter]="true"
          (closed)="showLogoutModal.set(false)"
        >
          <p class="text-xs text-outline text-center">Simulación: Tu sesión simulada se pausará. Los datos persistirán en localStorage.</p>

          <ng-container modal-footer>
            <button (click)="showLogoutModal.set(false)" class="px-4 py-2 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
            <button (click)="confirmLogout()" class="px-5 py-2 min-h-11 rounded-xl bg-red-500 text-white text-xs font-bold">Confirmar Salida</button>
          </ng-container>
        </app-modal-shell>
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
