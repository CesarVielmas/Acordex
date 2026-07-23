import { Injectable, signal, computed, inject } from '@angular/core';
import { Role } from '../models/admin.models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private storage = inject(StorageService);
  
  readonly activeRole = signal<Role>(
    this.storage.getItem<Role>('acordex_role', 'encargado')
  );

  readonly isEncargado = computed(() => this.activeRole() === 'encargado');
  readonly isAdminOrEncargado = computed(() => this.activeRole() === 'encargado' || this.activeRole() === 'administrador');
  readonly isUsuarioOnly = computed(() => this.activeRole() === 'usuario');

  readonly canViewFinances = computed(() => this.activeRole() === 'encargado');
  readonly canViewPrivateTasks = computed(() => this.activeRole() === 'encargado');
  readonly canViewDelicateTasks = computed(() => this.activeRole() === 'encargado' || this.activeRole() === 'administrador');
  readonly canViewQuotes = computed(() => this.activeRole() === 'encargado' || this.activeRole() === 'administrador');
  readonly canEditEvents = computed(() => this.activeRole() === 'encargado' || this.activeRole() === 'administrador');
  readonly canManageUsers = computed(() => this.activeRole() === 'encargado');
  readonly canManageSettings = computed(() => this.activeRole() === 'encargado');

  setRole(role: Role): void {
    this.activeRole.set(role);
    this.storage.setItem('acordex_role', role);
  }

  getRoleLabel(role?: Role): string {
    const target = role || this.activeRole();
    switch (target) {
      case 'encargado': return 'Encargado Global';
      case 'administrador': return 'Administrador Operativo';
      case 'usuario': return 'Usuario de Campo';
      default: return 'Desconocido';
    }
  }
}
