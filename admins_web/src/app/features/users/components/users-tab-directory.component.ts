import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserItem, Role } from '../../../core/models/admin.models';
import { getRoleBadgeClass, getUserStatusBadgeClass } from '../user-metrics';

@Component({
  selector: 'app-users-tab-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ─── BARRA DE BÚSQUEDA & FILTROS ─── -->
      <div class="p-4 sm:p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">

        <!-- Buscador -->
        <div class="relative flex-1 max-w-md">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por nombre, email o departamento..."
            class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <!-- Filtros Rápidos -->
        <div class="flex items-center gap-2 flex-wrap text-xs">
          <!-- Rol -->
          <select
            [ngModel]="selectedRole()"
            (ngModelChange)="selectedRole.set($event)"
            class="px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          >
            <option value="ALL">Todos los Roles</option>
            <option value="encargado">👑 Encargado</option>
            <option value="administrador">⚡ Administrador</option>
            <option value="usuario">👤 Operativo / Campo</option>
          </select>

          <!-- Departamento -->
          <select
            [ngModel]="selectedDepartment()"
            (ngModelChange)="selectedDepartment.set($event)"
            class="px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          >
            <option value="ALL">Todos los Deptos</option>
            <option value="Dirección General">Dirección General</option>
            <option value="Producción & Logística">Producción & Logística</option>
            <option value="Finanzas & Cobranza">Finanzas & Cobranza</option>
            <option value="Talento & Booking">Talento & Booking</option>
            <option value="Operaciones de Campo">Operaciones de Campo</option>
          </select>

          @if (searchQuery() || selectedRole() !== 'ALL' || selectedDepartment() !== 'ALL') {
            <button
              type="button"
              (click)="clearFilters()"
              class="px-3 py-2 rounded-xl bg-surface-container-highest text-outline hover:text-on-surface font-bold text-xs transition-all cursor-pointer"
            >
              Limpiar
            </button>
          }
        </div>

      </div>

      <!-- ─── GRID DE USUARIOS ─── -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        @for (usr of filteredUsers(); track usr.id) {
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4 hover:border-primary/50 transition-all relative overflow-hidden group">

            <!-- Encabezado con Avatar -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3.5 min-w-0">
                <img
                  [src]="usr.avatar"
                  [alt]="usr.name"
                  class="w-13 h-13 rounded-2xl object-cover ring-2 ring-primary/30 shrink-0"
                />

                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-container-highest text-outline border border-outline-variant/30">
                      {{ usr.id }}
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-black border uppercase" [class]="getRoleBadgeClass(usr.role)">
                      {{ usr.role }}
                    </span>
                  </div>
                  <h3 class="text-sm font-black text-on-surface truncate mt-1 group-hover:text-primary transition-colors">
                    {{ usr.name }}
                  </h3>
                  <p class="text-xs text-outline truncate">{{ usr.department || 'Personal Operativo' }}</p>
                </div>
              </div>

              <!-- Status -->
              <span class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0" [class]="getUserStatusBadgeClass(usr.status)">
                {{ usr.status }}
              </span>
            </div>

            <!-- Contacto & Sesión -->
            <div class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-1.5 text-xs">
              <p class="text-outline flex items-center gap-1.5 truncate text-[11px]">
                <span class="material-symbols-outlined text-xs">mail</span> {{ usr.email }}
              </p>
              <div class="flex items-center justify-between text-[11px] text-outline">
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs">schedule</span> {{ usr.lastAccess }}
                </span>
                @if (usr.twoFactorEnabled) {
                  <span class="text-emerald-400 font-bold flex items-center gap-0.5 text-[10px]">
                    <span class="material-symbols-outlined text-xs">lock</span> 2FA Activo
                  </span>
                }
              </div>
            </div>

            <!-- Cambio Rápido de Rol -->
            <div class="flex items-center justify-between gap-2 text-xs pt-1">
              <span class="text-[10px] text-outline font-bold uppercase">Rol en el Sistema:</span>
              <select
                [ngModel]="usr.role"
                (ngModelChange)="changeRole.emit({ userId: usr.id, newRole: $event })"
                class="px-2.5 py-1 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-xs focus:outline-none focus:border-primary"
              >
                <option value="encargado">👑 Encargado (Full)</option>
                <option value="administrador">⚡ Administrador</option>
                <option value="usuario">👤 Operativo / Campo</option>
              </select>
            </div>

            <!-- Botones de Acción -->
            <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                (click)="openPermissions.emit(usr)"
                class="flex-1 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span class="material-symbols-outlined text-sm">security</span>
                Permisos
              </button>

              <button
                type="button"
                (click)="toggleStatus.emit(usr.id)"
                class="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                [class]="usr.status === 'Activo' ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-black'"
              >
                {{ usr.status === 'Activo' ? 'Suspender' : 'Activar' }}
              </button>

              <button
                type="button"
                (click)="editUser.emit(usr)"
                title="Editar Usuario"
                class="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-outline hover:text-on-surface transition-all cursor-pointer"
              >
                <span class="material-symbols-outlined text-base">edit</span>
              </button>
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class UsersTabDirectoryComponent {
  users = input<AdminUserItem[]>([]);

  changeRole = output<{ userId: string; newRole: Role }>();
  toggleStatus = output<string>();
  editUser = output<AdminUserItem>();
  openPermissions = output<AdminUserItem>();

  searchQuery = signal('');
  selectedRole = signal('ALL');
  selectedDepartment = signal('ALL');

  filteredUsers(): AdminUserItem[] {
    return this.users().filter(u => {
      if (this.searchQuery()) {
        const q = this.searchQuery().toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchDept = u.department?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchDept) return false;
      }
      if (this.selectedRole() !== 'ALL' && u.role !== this.selectedRole()) return false;
      if (this.selectedDepartment() !== 'ALL' && u.department !== this.selectedDepartment()) return false;
      return true;
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedRole.set('ALL');
    this.selectedDepartment.set('ALL');
  }

  getRoleBadgeClass = getRoleBadgeClass;
  getUserStatusBadgeClass = getUserStatusBadgeClass;
}
