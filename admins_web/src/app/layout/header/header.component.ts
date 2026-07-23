import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../core/services/role.service';
import { LayoutStateService } from '../../core/services/layout_state.service';
import { Role } from '../../core/models/admin.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bg-[#121212]/95 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 px-4 sm:px-6 h-[72px] flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.8)] transition-all duration-300 select-none">
      
      <!-- Left Section: 2-Line Vertical Brand Identity -->
      <div class="flex items-center gap-3.5">
        
        <!-- Mobile Menu Toggle Button (Opens Drawer) -->
        <button 
          (click)="layoutState.toggleMobileMenu()" 
          class="md:hidden w-10 h-10 rounded-2xl bg-[#1A1A1A] text-primary hover:text-primary-container transition-all active:scale-95 border border-white/10 flex items-center justify-center shadow-md"
          aria-label="Abrir menú de navegación"
        >
          <span class="material-symbols-outlined text-xl">menu</span>
        </button>

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
        
        <!-- Role Selector Pill Bar -->
        <div class="flex items-center bg-[#0A0A0A] p-1.5 rounded-2xl border border-white/10 shadow-inner">
          <span class="text-[11px] font-extrabold text-primary px-2 hidden lg:flex items-center gap-1 uppercase tracking-wider font-['Epilogue']">
            <span class="material-symbols-outlined text-sm">badge</span> Rol:
          </span>

          <div class="flex items-center gap-1">
            <button 
              (click)="setRole('encargado')"
              [class]="roleService.activeRole() === 'encargado'
                ? 'bg-gradient-to-r from-primary via-amber-400 to-primary text-on-primary font-black shadow-[0_0_15px_rgba(242,202,80,0.35)] border border-amber-300/50'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5 font-medium'"
              class="px-2.5 sm:px-3.5 py-1 rounded-xl text-[11px] sm:text-xs transition-all duration-200 flex items-center gap-1"
              title="Acceso Total a Finanzas y Configuración"
            >
              <span class="material-symbols-outlined text-sm">shield_person</span>
              <span class="hidden sm:inline">Encargado</span>
            </button>

            <button 
              (click)="setRole('administrador')"
              [class]="roleService.activeRole() === 'administrador'
                ? 'bg-gradient-to-r from-primary via-amber-400 to-primary text-on-primary font-black shadow-[0_0_15px_rgba(242,202,80,0.35)] border border-amber-300/50'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5 font-medium'"
              class="px-2.5 sm:px-3.5 py-1 rounded-xl text-[11px] sm:text-xs transition-all duration-200 flex items-center gap-1"
              title="Acceso Operativo Completo"
            >
              <span class="material-symbols-outlined text-sm">admin_panel_settings</span>
              <span class="hidden sm:inline">Admin</span>
            </button>

            <button 
              (click)="setRole('usuario')"
              [class]="roleService.activeRole() === 'usuario'
                ? 'bg-gradient-to-r from-primary via-amber-400 to-primary text-on-primary font-black shadow-[0_0_15px_rgba(242,202,80,0.35)] border border-amber-300/50'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5 font-medium'"
              class="px-2.5 sm:px-3.5 py-1 rounded-xl text-[11px] sm:text-xs transition-all duration-200 flex items-center gap-1"
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
          class="relative w-10 h-10 rounded-2xl bg-[#1A1A1A] hover:bg-surface-bright text-primary flex items-center justify-center transition-all border border-white/10 hover:border-primary/50 hover:scale-105 active:scale-95 shadow-md"
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

      <!-- NOTIFICATIONS POPUP PANEL -->
      @if (showNotifications()) {
        <div class="fixed top-16 right-4 sm:right-6 w-[calc(100%-2rem)] max-w-sm bg-[#1E1E1E] border border-white/10 rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-scale-up">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <span class="font-['Epilogue'] font-bold text-sm text-on-surface flex items-center gap-1.5">
              <span class="material-symbols-outlined text-primary text-base">notifications</span> Notificaciones
            </span>
            <button (click)="showNotifications.set(false)" class="text-xs text-primary hover:underline font-semibold">Cerrar</button>
          </div>

          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
              <span class="font-bold text-primary block">Nuevo Aviso de Co-producción</span>
              <p class="text-on-surface-variant text-[11px]">Fonovisa solicitó cambio de fecha en Festival Tumbado Zapopan.</p>
            </div>
            <div class="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
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

  setRole(role: Role): void {
    this.roleService.setRole(role);
  }

  getUserName(): string {
    const role = this.roleService.activeRole();
    if (role === 'encargado') return 'Lic. Claudia Morales';
    if (role === 'administrador') return 'Ing. Mateo Rivas';
    return 'Jorge Staff Ruiz';
  }

  getUserAvatar(): string {
    const role = this.roleService.activeRole();
    if (role === 'encargado') return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80';
    if (role === 'administrador') return 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  }
}
