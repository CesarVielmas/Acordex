import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { Role } from '../../core/models/admin.models';
import { AccessRestrictedComponent } from '../../shared/ui/access-restricted/access-restricted.component';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { PanelComponent } from '../../shared/ui/panel/panel.component';
import { TableShellComponent } from '../../shared/ui/table-shell/table-shell.component';
import { CustomSelectComponent, SelectOption } from '../../shared/ui/custom-select/custom-select.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AccessRestrictedComponent, BadgeComponent, PanelComponent, TableShellComponent, CustomSelectComponent],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-fade-in">

      @if (!roleService.canManageUsers()) {
        <app-access-restricted
          icon="admin_panel_settings"
          title="Acceso Restringido - Exclusivo Encargado"
          message="La gestión de personal y asignación de permisos solo está disponible para el perfil de Encargado Global."
          [showBackLink]="true"
        />
      } @else {

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="font-display-lg text-xl sm:text-2xl font-black text-on-surface">Gestión de Usuarios & Permisos</h1>
            <p class="text-xs sm:text-sm text-outline mt-1 font-semibold">Administra cuentas del sistema y asigna roles operacionales</p>
          </div>

          <button (click)="openCreateUserModal()" class="px-4 py-2.5 min-h-11 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-sm">person_add</span> Registrar Usuario
          </button>
        </div>

        <!-- Users Table -->
        <app-panel title="Personal del Sistema" subtitle="Control de accesos y roles activos">
          <app-table-shell>
            <table desktop-table class="w-full">
              <thead>
                <tr class="border-b border-outline-variant/30 text-[10px] font-black text-outline uppercase tracking-wider text-left">
                  <th class="py-3 px-4">Usuario</th>
                  <th class="py-3 px-3">Email</th>
                  <th class="py-3 px-3">Rol Actual</th>
                  <th class="py-3 px-3">Estado</th>
                  <th class="py-3 px-3">Último Acceso</th>
                  <th class="py-3 px-3 text-right">Cambiar Rol</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/20">
                @for (usr of mockData.users(); track usr.id) {
                  <tr class="hover:bg-surface-container-highest/40 transition-colors">
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        <img [src]="usr.avatar" [alt]="usr.name" class="w-9 h-9 rounded-xl object-cover ring-1 ring-primary/30 shrink-0" />
                        <div>
                          <span class="font-bold text-on-surface block leading-tight">{{ usr.name }}</span>
                          <span class="text-[10px] text-outline">{{ usr.id }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="py-3.5 px-3 text-xs text-outline">{{ usr.email }}</td>
                    <td class="py-3.5 px-3">
                      <app-badge [label]="roleService.getRoleLabel(usr.role)" variant="primary" />
                    </td>
                    <td class="py-3.5 px-3">
                      <app-badge [label]="usr.status" variant="success" />
                    </td>
                    <td class="py-3.5 px-3 text-xs text-outline">{{ usr.lastAccess }}</td>
                    <td class="py-3.5 px-3 text-right w-44">
                      <app-custom-select
                        placeholder="Asignar rol"
                        [options]="userRoleOptions"
                        [value]="usr.role"
                        (valueChange)="onRoleChange(usr.id, $any($event))"
                      />
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <div mobile-cards>
              @for (usr of mockData.users(); track usr.id) {
                <div class="p-4 space-y-3">
                  <div class="flex items-center gap-3">
                    <img [src]="usr.avatar" [alt]="usr.name" class="w-10 h-10 rounded-xl object-cover ring-1 ring-primary/30 shrink-0" />
                    <div class="min-w-0 flex-1">
                      <span class="font-bold text-on-surface block leading-tight truncate">{{ usr.name }}</span>
                      <span class="text-[10px] text-outline">{{ usr.id }} &middot; {{ usr.email }}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-wrap">
                    <app-badge [label]="roleService.getRoleLabel(usr.role)" variant="primary" />
                    <app-badge [label]="usr.status" variant="success" />
                    <span class="text-[10px] text-outline ml-auto">Último acceso: {{ usr.lastAccess }}</span>
                  </div>

                  <app-custom-select
                    label="Cambiar Rol:"
                    placeholder="Asignar rol"
                    [options]="userRoleOptions"
                    [value]="usr.role"
                    (valueChange)="onRoleChange(usr.id, $any($event))"
                  />
                </div>
              }
            </div>

          </app-table-shell>
        </app-panel>

      }

    </div>
  `
})
export class UsersComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  userRoleOptions: SelectOption[] = [
    { value: 'encargado', label: 'Encargado', icon: 'shield_person', badge: 'Full' },
    { value: 'administrador', label: 'Administrador', icon: 'manage_accounts', badge: 'Admin' },
    { value: 'usuario', label: 'Usuario', icon: 'person', badge: 'Campo' }
  ];

  onRoleChange(userId: string, newRole: Role): void {
    this.mockData.updateUserRole(userId, newRole);
  }

  openCreateUserModal(): void {
    alert('Modal para registrar nuevo usuario en desarrollo');
  }
}
