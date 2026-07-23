import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../core/services/role.service';
import { LayoutStateService } from '../../core/services/layout_state.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
  roleFilter?: 'encargado' | 'adminOrEncargado' | 'all';
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside 
      class="h-full bg-[#161616] border-r border-white/10 flex flex-col justify-between transition-all duration-300 ease-in-out select-none relative z-30"
      [ngClass]="layoutState.isSidebarCollapsed() ? 'w-20' : 'w-64'"
    >
      
      <!-- FLOATING EDGE TOGGLE BUTTON (Centrado en la mera orilla del Sidebar, NUNCA RECORTADO) -->
      <button 
        (click)="layoutState.toggleSidebar()"
        class="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3.5 z-50 w-7 h-7 rounded-full bg-[#1E1E1E] border border-primary/50 text-primary hover:text-on-primary hover:bg-primary hover:border-primary transition-all duration-300 items-center justify-center shadow-[0_0_12px_rgba(0,0,0,0.9)] hover:scale-110 active:scale-95 cursor-pointer"
        [title]="layoutState.isSidebarCollapsed() ? 'Expandir menú lateral' : 'Plegar menú lateral'"
      >
        <span class="material-symbols-outlined text-base pointer-events-none">
          {{ layoutState.isSidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}
        </span>
      </button>

      <!-- Navigation Links Container (Usa no-scrollbar al colapsar para no recortar el botón flotante) -->
      <div 
        class="p-3 sm:p-4 space-y-4 flex-1 transition-all"
        [ngClass]="layoutState.isSidebarCollapsed() ? 'overflow-y-auto no-scrollbar' : 'overflow-y-auto custom-scrollbar'"
      >
        
        <!-- Role Status Indicator Banner (Visible when expanded) -->
        <div 
          *ngIf="!layoutState.isSidebarCollapsed()"
          class="p-3.5 rounded-2xl bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-primary/20 relative overflow-hidden shadow-lg transition-all duration-300 mb-2"
        >
          <span class="text-[10px] font-extrabold uppercase tracking-widest text-outline block mb-0.5 font-['Epilogue']">Sesión Activa</span>
          <p class="text-xs font-black text-primary leading-tight flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            {{ roleService.getRoleLabel() }}
          </p>
        </div>

        <!-- Menu Items List -->
        <nav class="space-y-1">
          @for (item of filteredMenuItems(); track item.route) {
            <a 
              [routerLink]="item.route" 
              (click)="onItemClick.emit()"
              routerLinkActive="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-primary font-bold border-r-4 border-primary shadow-[inset_0_0_12px_rgba(242,202,80,0.15)]"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              class="flex items-center py-3 rounded-xl text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-white/[0.04] transition-all duration-200 group relative"
              [ngClass]="layoutState.isSidebarCollapsed() ? 'justify-center px-0' : 'justify-between px-3.5'"
              [title]="layoutState.isSidebarCollapsed() ? item.label : ''"
            >
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-xl group-hover:scale-110 transition-transform duration-200 group-hover:text-primary shrink-0">
                  {{ item.icon }}
                </span>
                <span 
                  *ngIf="!layoutState.isSidebarCollapsed()" 
                  class="font-['Epilogue'] tracking-wide truncate"
                >
                  {{ item.label }}
                </span>
              </div>

              <!-- Badge when expanded -->
              <span 
                *ngIf="!layoutState.isSidebarCollapsed() && item.badge" 
                class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 shrink-0"
              >
                {{ item.badge }}
              </span>

              <!-- Hover Tooltip Popup when collapsed -->
              <div 
                *ngIf="layoutState.isSidebarCollapsed()"
                class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-[#1E1E1E] border border-primary/30 text-on-surface text-xs font-bold rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 flex items-center gap-2"
              >
                <span>{{ item.label }}</span>
                <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
              </div>
            </a>
          }
        </nav>
      </div>

      <!-- Bottom Status Footer -->
      <div 
        class="p-3.5 border-t border-white/10 bg-[#111111] transition-all"
        [ngClass]="layoutState.isSidebarCollapsed() ? 'text-center' : 'px-4'"
      >
        <div *ngIf="!layoutState.isSidebarCollapsed()" class="flex items-center justify-between text-[11px] text-outline font-medium">
          <span class="font-['Epilogue'] tracking-wider">Acordex Admin</span>
          <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            v2.4
          </span>
        </div>
        <div *ngIf="layoutState.isSidebarCollapsed()" class="flex justify-center text-[10px] font-black text-primary" title="Acordex Admin v2.4">
          v2.4
        </div>
      </div>

    </aside>
  `
})
export class SidebarComponent {
  roleService = inject(RoleService);
  layoutState = inject(LayoutStateService);

  @Output() onItemClick = new EventEmitter<void>();

  readonly allMenuItems: MenuItem[] = [
    { label: 'Panel General', route: '/dashboard', icon: 'grid_view', roleFilter: 'all' },
    { label: 'Cotizaciones', route: '/quotes', icon: 'request_quote', badge: '10 Est.', roleFilter: 'adminOrEncargado' },
    { label: 'Grupos / Talento', route: '/groups', icon: 'groups', roleFilter: 'all' },
    { label: 'Eventos', route: '/events', icon: 'event', badge: 'Avisos', roleFilter: 'all' },
    { label: 'Firmas / Prensa', route: '/press', icon: 'campaign', roleFilter: 'all' },
    { label: 'Finanzas', route: '/finances', icon: 'payments', badge: 'Encargado', roleFilter: 'encargado' },
    { label: 'Estadísticas', route: '/stats', icon: 'query_stats', roleFilter: 'adminOrEncargado' },
    { label: 'Tareas', route: '/tasks', icon: 'task_alt', badge: 'Kanban', roleFilter: 'all' },
    { label: 'Clientes (CRM)', route: '/clients', icon: 'contact_page', roleFilter: 'adminOrEncargado' },
    { label: 'Usuarios & Permisos', route: '/users', icon: 'manage_accounts', roleFilter: 'encargado' },
    { label: 'Archivos', route: '/files', icon: 'folder_open', roleFilter: 'all' },
    { label: 'Configuración', route: '/settings', icon: 'settings', roleFilter: 'all' }
  ];

  filteredMenuItems(): MenuItem[] {
    const role = this.roleService.activeRole();
    return this.allMenuItems.filter(item => {
      if (item.roleFilter === 'all') return true;
      if (item.roleFilter === 'encargado') return role === 'encargado';
      if (item.roleFilter === 'adminOrEncargado') return role === 'encargado' || role === 'administrador';
      return false;
    });
  }
}
