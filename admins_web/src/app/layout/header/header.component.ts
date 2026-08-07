import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../core/services/role.service';
import { LayoutStateService } from '../../core/services/layout_state.service';
import { Role } from '../../core/models/admin.models';
import { IconButtonComponent } from '../../shared/ui/icon-button/icon-button.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, IconButtonComponent],
  template: `
    <header class="bg-surface/95 backdrop-blur-2xl border-b border-white/10 px-2.5 sm:px-6 h-[72px] flex items-center justify-between gap-2 shadow-[0_4px_30px_rgba(0,0,0,0.8)] transition-all duration-300 select-none relative z-30">

      <!-- Left Section: 2-Line Vertical Brand Identity -->
      <div class="flex items-center gap-3.5">

        <!-- Mobile Menu Toggle Button (Opens Drawer) -->
        <app-icon-button
          class="md:hidden"
          icon="menu"
          ariaLabel="Abrir menú de navegación"
          variant="default"
          (pressed)="layoutState.toggleMobileMenu()"
        />

        <!-- Official Executive Brand Identity (Clean 2-Line Vertical Layout) -->
        <a routerLink="/dashboard" class="flex items-center gap-3 group">

          <!-- Logo Image -->
          <img src="acordex_without_bg.png" alt="Acordex Logo" class="w-10 h-10 sm:w-11 sm:h-11 object-contain transition-transform duration-300 group-hover:scale-105" />

          <!-- 2-Line Vertical Text Block -->
          <div class="flex flex-col justify-center">
            <!-- Line 1: ACORDEX Main Brand Title -->
            <h1 class="font-['Epilogue'] font-black text-xl sm:text-2xl text-primary tracking-tighter leading-none">
              ACORDEX
            </h1>

            <!-- Line 2: Panel de Administración Subtitle Below -->
            <span class="text-[10px] sm:text-[11px] font-bold text-outline tracking-wider uppercase font-['Epilogue'] mt-1 leading-none group-hover:text-primary transition-colors">
              Panel de Administración
            </span>
          </div>
        </a>

      </div>

      <!-- Right Section: Role Switcher & User Profile -->
      <div class="flex items-center gap-2 sm:gap-4">

        <!-- Role Switcher Pills Bar -->
        <div class="flex items-center gap-1 p-1 rounded-2xl bg-surface-container-low/80 border border-white/10 shadow-inner">
          <span class="text-[10px] font-bold text-outline uppercase px-2 hidden lg:inline">Rol:</span>

          <div class="flex items-center gap-1">
            <!-- Role 1: Encargado -->
            <button
              (click)="setRole('encargado')"
              [class]="getRoleButtonClass('encargado')"
              title="Acceso Encargado Global"
            >
              <span class="material-symbols-outlined text-sm">shield_person</span>
              <span class="hidden sm:inline">Encargado</span>
            </button>

            <!-- Role 2: Administrador -->
            <button
              (click)="setRole('administrador')"
              [class]="getRoleButtonClass('administrador')"
              title="Acceso Administración Disquera"
            >
              <span class="material-symbols-outlined text-sm">manage_accounts</span>
              <span class="hidden sm:inline">Admin</span>
            </button>

            <!-- Role 3: Usuario -->
            <button
              (click)="setRole('usuario')"
              [class]="getRoleButtonClass('usuario')"
              title="Acceso de Campo"
            >
              <span class="material-symbols-outlined text-sm">person</span>
              <span class="hidden sm:inline">Usuario</span>
            </button>
          </div>
        </div>

        <!-- Notifications Dropdown Button -->
        <button
          (click)="showNotifications.set(!showNotifications())"
          class="relative min-w-11 min-h-11 w-11 h-11 rounded-2xl bg-surface-container-low hover:bg-surface-bright text-primary flex items-center justify-center transition-all border border-white/10 hover:border-primary/50 hover:scale-105 active:scale-95 shadow-md"
          aria-label="Notificaciones"
        >
          <span class="material-symbols-outlined text-xl">notifications</span>
          <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-background animate-ping"></span>
          <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>

        <!-- User Profile Avatar & Status -->
        <div class="hidden sm:flex items-center gap-3 pl-2 border-l border-white/10">
          <img [src]="getUserAvatar()" [alt]="getUserName()" class="w-9 h-9 rounded-xl object-cover ring-2 ring-primary/60 shadow-[0_0_10px_rgba(242,202,80,0.2)]" />
          <div class="hidden xl:block text-left">
            <p class="text-xs font-bold text-on-surface leading-tight">{{ getUserName() }}</p>
            <span class="text-[10px] font-bold text-primary">
              {{ roleService.getRoleLabel() }}
            </span>
          </div>
        </div>

      </div>

      <!-- 100% SOLID OPAQUE NOTIFICATIONS POPUP PANEL (NO TRANSPARENCY/BLUR) -->
      @if (showNotifications()) {
        <div class="fixed top-16 right-4 sm:right-6 w-[calc(100%-2rem)] max-w-sm bg-[#18152a] border border-outline-variant/60 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-[999999] p-4 space-y-3 animate-scale-up opacity-100">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <span class="font-['Epilogue'] font-bold text-sm text-on-surface flex items-center gap-1.5">
              <span class="material-symbols-outlined text-primary text-base">notifications</span> Notificaciones
            </span>
            <button (click)="showNotifications.set(false)" class="text-xs text-primary hover:underline font-semibold">Cerrar</button>
          </div>

          <div class="space-y-2 text-xs">
            <div class="p-3 rounded-xl bg-surface-container-highest border border-white/10 space-y-0.5">
              <span class="font-bold text-primary block">Nuevo Aviso de Co-producción</span>
              <p class="text-on-surface-variant text-[11px]">Fonovisa solicitó cambio de fecha en Festival Tumbado Zapopan.</p>
            </div>
            <div class="p-3 rounded-xl bg-surface-container-highest border border-white/10 space-y-0.5">
              <span class="font-bold text-emerald-400 block">Pago Confirmado</span>
              <p class="text-on-surface-variant text-[11px]">Cotización COT-8904 liquidada al 100%.</p>
            </div>
          </div>
        </div>
      }

    </header>
  `
})
export class HeaderComponent {
  roleService = inject(RoleService);
  layoutState = inject(LayoutStateService);

  showNotifications = signal(false);

  private readonly activeRoleButtonClass =
    'bg-gradient-to-r from-primary via-amber-400 to-primary text-on-primary font-black shadow-[0_0_15px_rgba(242,202,80,0.35)] border border-amber-300/50';
  private readonly inactiveRoleButtonClass =
    'text-on-surface-variant hover:text-on-surface hover:bg-white/5 font-medium';

  getRoleButtonClass(role: Role): string {
    const stateClass = this.roleService.activeRole() === role ? this.activeRoleButtonClass : this.inactiveRoleButtonClass;
    return `px-2 sm:px-3.5 min-h-11 py-1.5 rounded-xl text-[11px] sm:text-xs transition-all duration-200 flex items-center gap-1 ${stateClass}`;
  }

  setRole(role: Role): void {
    this.roleService.setRole(role);
  }

  getUserName(): string {
    const role = this.roleService.activeRole();
    switch (role) {
      case 'encargado':
        return 'Don Raúl Treviño';
      case 'administrador':
        return 'Lic. Sofía Ramírez';
      case 'usuario':
        return 'Carlos Mendoza';
    }
  }

  getUserAvatar(): string {
    const role = this.roleService.activeRole();
    switch (role) {
      case 'encargado':
        return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
      case 'administrador':
        return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
      case 'usuario':
        return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150';
    }
  }
}
