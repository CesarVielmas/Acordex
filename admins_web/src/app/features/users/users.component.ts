import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { AdminUserItem, Role } from '../../core/models/admin.models';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { TabPillsComponent, TabPillItem } from '../../shared/ui/tab-pills/tab-pills.component';
import { AccessRestrictedComponent } from '../../shared/ui/access-restricted/access-restricted.component';

import { calculateUsersKPIs } from './user-metrics';
import { UsersKpisComponent } from './components/users-kpis.component';
import { UsersTabDirectoryComponent } from './components/users-tab-directory.component';
import { UsersTabMatrixComponent } from './components/users-tab-matrix.component';
import { UsersTabAuditComponent } from './components/users-tab-audit.component';
import { ModalUserEditorComponent } from './modals/modal-user-editor.component';
import { ModalUserPermissionsComponent } from './modals/modal-user-permissions.component';

export type UsersTab = 'directory' | 'matrix' | 'audit';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    TabPillsComponent,
    AccessRestrictedComponent,
    UsersKpisComponent,
    UsersTabDirectoryComponent,
    UsersTabMatrixComponent,
    UsersTabAuditComponent,
    ModalUserEditorComponent,
    ModalUserPermissionsComponent
  ],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-fade-in pb-12">

      <!-- ─── CONTROL DE ACCESO RBAC ─── -->
      @if (!roleService.canManageUsers()) {
        <app-access-restricted
          icon="admin_panel_settings"
          title="Acceso Restringido - Exclusivo Encargado"
          message="La administración de personal, asignación de roles y control de privilegios de seguridad es exclusiva del perfil de Encargado Global."
          [showBackLink]="true"
        />
      } @else {

        <!-- ─── ENCABEZADO PRINCIPAL ─── -->
        <div class="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-surface-container-high/90 via-surface-container/80 to-surface-container-high/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div class="absolute -right-12 -top-12 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 min-w-0">
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-xl sm:text-2xl font-black text-on-surface tracking-tight">Gestión de Usuarios & Control RBAC</h1>
              <app-badge label="Seguridad & Permisos" variant="primary" />
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Encargado Global
              </span>
            </div>
            <p class="text-xs text-outline mt-1 max-w-2xl leading-relaxed">
              Administración de cuentas operativas, jerarquías de acceso, auditoría de eventos del personal y políticas de doble factor (2FA).
            </p>
          </div>

          <div class="relative z-10 flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              (click)="openCreateModal()"
              class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-black text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span class="material-symbols-outlined text-lg">person_add</span>
              Registrar Personal
            </button>
          </div>
        </div>

        <!-- ─── KPIS SUPERIORES ─── -->
        <app-users-kpis [kpis]="usersKPIs()" />

        <!-- ─── PESTAÑAS ─── -->
        <div class="border-b border-outline-variant/30 pb-2">
          <app-tab-pills
            [tabs]="tabOptions"
            [active]="activeTab()"
            (change)="setTab($event)"
          />
        </div>

        <!-- ─── VISTAS ─── -->

        <!-- 1. DIRECTORIO DE PERSONAL -->
        @if (activeTab() === 'directory') {
          <app-users-tab-directory
            [users]="mockData.users()"
            (changeRole)="onRoleChange($event.userId, $event.newRole)"
            (toggleStatus)="onToggleStatus($event)"
            (editUser)="onEditUser($event)"
            (openPermissions)="onOpenPermissions($event)"
          />
        }

        <!-- 2. MATRIZ DE PERMISOS RBAC -->
        @if (activeTab() === 'matrix') {
          <app-users-tab-matrix />
        }

        <!-- 3. BITÁCORA DE AUDITORÍA -->
        @if (activeTab() === 'audit') {
          <app-users-tab-audit [logs]="mockData.auditLogs()" />
        }

        <!-- ─── MODALES ─── -->

        <!-- Modal 1: Editor de Usuario -->
        @if (isEditorOpen()) {
          <app-modal-user-editor
            [userToEdit]="userBeingEdited()"
            (saved)="onSaveUser($event)"
            (closed)="closeEditorModal()"
          />
        }

        <!-- Modal 2: Permisos Granulares -->
        @if (userForPermissions()) {
          <app-modal-user-permissions
            [user]="userForPermissions()!"
            (saved)="onSavePermissions($event)"
            (closed)="userForPermissions.set(null)"
          />
        }

      }

    </div>
  `
})
export class UsersComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  activeTab = signal<UsersTab>('directory');

  isEditorOpen = signal(false);
  userBeingEdited = signal<AdminUserItem | null>(null);
  userForPermissions = signal<AdminUserItem | null>(null);

  readonly tabOptions: TabPillItem[] = [
    { value: 'directory', label: 'Personal & Cuentas', icon: 'badge' },
    { value: 'matrix', label: 'Matriz de Permisos (RBAC)', icon: 'policy' },
    { value: 'audit', label: 'Bitácora de Auditoría', icon: 'receipt_long' }
  ];

  setTab(tabId: string): void {
    this.activeTab.set(tabId as UsersTab);
  }

  usersKPIs = computed(() => {
    return calculateUsersKPIs(this.mockData.users());
  });

  openCreateModal(): void {
    this.userBeingEdited.set(null);
    this.isEditorOpen.set(true);
  }

  closeEditorModal(): void {
    this.isEditorOpen.set(false);
    this.userBeingEdited.set(null);
  }

  onRoleChange(userId: string, newRole: Role): void {
    this.mockData.updateUserRole(userId, newRole);
  }

  onToggleStatus(userId: string): void {
    this.mockData.toggleUserStatus(userId);
  }

  onEditUser(user: AdminUserItem): void {
    this.userBeingEdited.set(user);
    this.isEditorOpen.set(true);
  }

  onOpenPermissions(user: AdminUserItem): void {
    this.userForPermissions.set(user);
  }

  onSaveUser(user: AdminUserItem): void {
    if (this.userBeingEdited()) {
      this.mockData.updateUser(user);
    } else {
      this.mockData.addUser(user);
    }
    this.closeEditorModal();
  }

  onSavePermissions(user: AdminUserItem): void {
    this.mockData.updateUser(user);
    this.userForPermissions.set(null);
  }
}
