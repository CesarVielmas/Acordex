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

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AccessRestrictedComponent, BadgeComponent, PanelComponent, TableShellComponent],
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
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="font-display-xl text-xl sm:text-2xl font-black text-on-surface">Usuarios & Permisos del Sistema</h1>
              <app-badge label="Audit Trail Log" variant="primary" />
            </div>
            <p class="text-xs text-outline mt-1">Administración de personal, asignación de roles y bitácora de auditoría</p>
          </div>
        </div>

        <!-- USERS TABLE -->
        <app-panel title="Personal Registrado" icon="group">
          <app-table-shell [isEmpty]="mockData.users().length === 0" emptyIcon="group_off" emptyMessage="No hay usuarios registrados.">

            <table desktop-table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="border-b border-outline-variant/30 text-xs font-bold text-outline uppercase tracking-wider">
                  <th class="pb-3 px-3">Usuario</th>
                  <th class="pb-3 px-3">Correo Institucional</th>
                  <th class="pb-3 px-3">Rol Asignado</th>
                  <th class="pb-3 px-3">Estatus</th>
                  <th class="pb-3 px-3">Último Acceso</th>
                  <th class="pb-3 px-3 text-right">Cambiar Rol</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/20">
                @for (usr of mockData.users(); track usr.id) {
                  <tr class="hover:bg-surface-container-high/50 transition-colors">
                    <td class="py-3.5 px-3">
                      <div class="flex items-center gap-3">
                        <img [src]="usr.avatar" [alt]="usr.name" class="w-9 h-9 rounded-xl object-cover ring-1 ring-primary/30" />
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
                    <td class="py-3.5 px-3 text-right">
                      <select
                        [ngModel]="usr.role"
                        (ngModelChange)="onRoleChange(usr.id, $event)"
                        class="bg-surface-container-high border border-outline-variant/40 rounded-xl px-2.5 py-1.5 min-h-11 text-xs text-on-surface font-bold"
                      >
                        <option value="encargado">Encargado</option>
                        <option value="administrador">Administrador</option>
                        <option value="usuario">Usuario</option>
                      </select>
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

                  <select
                    [ngModel]="usr.role"
                    (ngModelChange)="onRoleChange(usr.id, $event)"
                    class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-2.5 py-2 min-h-11 text-xs text-on-surface font-bold"
                  >
                    <option value="encargado">Encargado</option>
                    <option value="administrador">Administrador</option>
                    <option value="usuario">Usuario</option>
                  </select>
                </div>
              }
            </div>

          </app-table-shell>
        </app-panel>

        <!-- FULL AUDIT TRAIL LOG -->
        <app-panel title="Bitácora de Auditoría (Audit Trail)" icon="receipt_long">
          <div class="space-y-3">
            @for (log of mockData.auditLogs(); track log.id) {
              <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-primary">{{ log.userName }}</span>
                    <span class="text-[10px] font-semibold px-2 py-0.2 rounded bg-surface-bright text-outline">
                      {{ roleService.getRoleLabel(log.role) }}
                    </span>
                    <span class="text-outline">• {{ log.targetModule }}</span>
                  </div>
                  <p class="font-bold text-on-surface mt-1">{{ log.action }}</p>
                  <p class="text-outline text-[11px] mt-0.5">{{ log.details }}</p>
                </div>

                <span class="text-[10px] text-outline font-semibold whitespace-nowrap self-end sm:self-center">
                  {{ log.timestamp }}
                </span>
              </div>
            }
          </div>
        </app-panel>

      }

    </div>
  `
})
export class UsersComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  onRoleChange(userId: string, newRole: Role | string): void {
    if (newRole === 'encargado' || newRole === 'administrador' || newRole === 'usuario') {
      this.mockData.updateUserRole(userId, newRole);
    }
  }
}
