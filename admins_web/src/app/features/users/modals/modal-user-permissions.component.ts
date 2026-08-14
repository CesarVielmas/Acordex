import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserItem } from '../../../core/models/admin.models';
import { getRoleBadgeClass } from '../user-metrics';

@Component({
  selector: 'app-modal-user-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div class="w-full max-w-xl rounded-3xl bg-surface-container border border-outline-variant/30 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg">
              security
            </span>
            <div>
              <h3 class="text-base font-black text-on-surface">Permisos Granulares de Acceso</h3>
              <p class="text-xs text-outline">{{ user().name }} ({{ user().email }})</p>
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

        <!-- Banner de Rol Actual -->
        <div class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-black border uppercase" [class]="getRoleBadgeClass(user().role)">
              {{ user().role }}
            </span>
            <span class="text-outline">Hereda políticas base del rol</span>
          </div>
        </div>

        <!-- Toggles de Permisos Granulares -->
        <div class="space-y-2.5 text-xs">

          <label class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between cursor-pointer hover:border-outline-variant/40 transition-all">
            <div class="space-y-0.5">
              <span class="font-bold text-on-surface block">Ver Finanzas, Arqueos & P&L</span>
              <span class="text-[11px] text-outline">Acceso a balances, cortes de caja y cuentas de banco</span>
            </div>
            <input type="checkbox" [(ngModel)]="perms.canViewFinances" class="w-4 h-4 rounded accent-primary cursor-pointer" />
          </label>

          <label class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between cursor-pointer hover:border-outline-variant/40 transition-all">
            <div class="space-y-0.5">
              <span class="font-bold text-on-surface block">Crear y Editar Eventos Masivos</span>
              <span class="text-[11px] text-outline">Configurar zonas, precios y boletaje</span>
            </div>
            <input type="checkbox" [(ngModel)]="perms.canEditEvents" class="w-4 h-4 rounded accent-primary cursor-pointer" />
          </label>

          <label class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between cursor-pointer hover:border-outline-variant/40 transition-all">
            <div class="space-y-0.5">
              <span class="font-bold text-on-surface block">Firmar & Validar Contratos de Artistas</span>
              <span class="text-[11px] text-outline">Aprobación legal de fechas y anexos</span>
            </div>
            <input type="checkbox" [(ngModel)]="perms.canSignContracts" class="w-4 h-4 rounded accent-primary cursor-pointer" />
          </label>

          <label class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between cursor-pointer hover:border-outline-variant/40 transition-all">
            <div class="space-y-0.5">
              <span class="font-bold text-on-surface block">Despachar Ofertas Especiales CRM</span>
              <span class="text-[11px] text-outline">Enviar descuentos a promotores de palenques</span>
            </div>
            <input type="checkbox" [(ngModel)]="perms.canDispatchOffers" class="w-4 h-4 rounded accent-primary cursor-pointer" />
          </label>

          <label class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between cursor-pointer hover:border-outline-variant/40 transition-all">
            <div class="space-y-0.5">
              <span class="font-bold text-on-surface block">Eliminar Archivos de la Bóveda</span>
              <span class="text-[11px] text-outline">Borrado permanente de videos, fotos y contratos</span>
            </div>
            <input type="checkbox" [(ngModel)]="perms.canDeleteFiles" class="w-4 h-4 rounded accent-primary cursor-pointer" />
          </label>

          <label class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between cursor-pointer hover:border-outline-variant/40 transition-all">
            <div class="space-y-0.5">
              <span class="font-bold text-on-surface block">Acceso a Bitácora de Auditoría</span>
              <span class="text-[11px] text-outline">Ver historial de actividad de otros usuarios</span>
            </div>
            <input type="checkbox" [(ngModel)]="perms.canAuditLogs" class="w-4 h-4 rounded accent-primary cursor-pointer" />
          </label>

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
            (click)="savePermissions()"
            class="px-5 py-2 rounded-xl bg-primary text-on-primary font-black shadow-md hover:scale-105 transition-all cursor-pointer"
          >
            Guardar Permisos
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalUserPermissionsComponent {
  user = input.required<AdminUserItem>();

  saved = output<AdminUserItem>();
  closed = output<void>();

  perms = {
    canViewFinances: false,
    canEditEvents: false,
    canManageUsers: false,
    canDispatchOffers: false,
    canSignContracts: false,
    canDeleteFiles: false,
    canAuditLogs: false,
    canExportReports: true
  };

  ngOnInit(): void {
    if (this.user().permissions) {
      this.perms = { ...this.perms, ...this.user().permissions };
    }
  }

  savePermissions(): void {
    const updated: AdminUserItem = {
      ...this.user(),
      permissions: { ...this.perms }
    };
    this.saved.emit(updated);
  }

  getRoleBadgeClass = getRoleBadgeClass;
}
