import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { Role } from '../../core/models/admin.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 animate-fade-in">
      
      @if (!roleService.canManageUsers()) {
        <div class="p-8 rounded-3xl bg-red-500/10 border-2 border-red-500/40 text-center space-y-4 max-w-xl mx-auto my-12">
          <span class="material-symbols-outlined text-5xl text-red-400">admin_panel_settings</span>
          <h2 class="text-xl font-bold text-red-300">Acceso Restringido - Exclusivo Encargado</h2>
          <p class="text-xs text-outline">
            La gestión de personal y asignación de permisos solo está disponible para el perfil de <strong>Encargado Global</strong>.
          </p>
        </div>
      } @else {
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="font-display-xl text-2xl font-black text-on-surface">Usuarios & Permisos del Sistema</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                Audit Trail Log
              </span>
            </div>
            <p class="text-xs text-outline mt-1">Administración de personal, asignación de roles y bitácora de auditoría</p>
          </div>
        </div>

        <!-- USERS TABLE -->
        <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4">
          <h3 class="text-base font-bold text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">group</span> Personal Registrado
          </h3>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
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
                      <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {{ roleService.getRoleLabel(usr.role) }}
                      </span>
                    </td>
                    <td class="py-3.5 px-3">
                      <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {{ usr.status }}
                      </span>
                    </td>
                    <td class="py-3.5 px-3 text-xs text-outline">{{ usr.lastAccess }}</td>
                    <td class="py-3.5 px-3 text-right">
                      <select 
                        [ngModel]="usr.role" 
                        (ngModelChange)="onRoleChange(usr.id, $event)"
                        class="bg-surface-container-high border border-outline-variant/40 rounded-xl px-2.5 py-1 text-xs text-on-surface font-bold"
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
          </div>
        </div>

        <!-- FULL AUDIT TRAIL LOG -->
        <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">receipt_long</span> Bitácora de Auditoría (Audit Trail)
            </h3>
            <span class="text-xs text-outline">Historial de acciones registradas</span>
          </div>

          <div class="space-y-3">
            @for (log of mockData.auditLogs(); track log.id) {
              <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div class="flex items-center gap-2">
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
        </div>

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
