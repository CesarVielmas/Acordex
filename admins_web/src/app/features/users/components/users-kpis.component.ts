import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users-kpis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">

      <!-- 1. TOTAL USUARIOS -->
      <div class="p-4 rounded-3xl bg-surface-container/80 border border-primary/30 shadow-lg space-y-1">
        <div class="flex items-center justify-between text-primary">
          <span class="text-[10px] font-bold uppercase tracking-wider">Cuentas</span>
          <span class="material-symbols-outlined text-lg">group</span>
        </div>
        <p class="text-2xl font-black text-on-surface font-mono">{{ kpis()?.total || 0 }}</p>
        <p class="text-[10px] text-outline">Usuarios registrados</p>
      </div>

      <!-- 2. ACTIVOS -->
      <div class="p-4 rounded-3xl bg-surface-container/80 border border-emerald-500/30 shadow-lg space-y-1">
        <div class="flex items-center justify-between text-emerald-400">
          <span class="text-[10px] font-bold uppercase tracking-wider">Activos</span>
          <span class="material-symbols-outlined text-lg">check_circle</span>
        </div>
        <p class="text-2xl font-black text-emerald-300 font-mono">{{ kpis()?.active || 0 }}</p>
        <p class="text-[10px] text-emerald-400">Con sesión habilitada</p>
      </div>

      <!-- 3. ENCARGADOS -->
      <div class="p-4 rounded-3xl bg-surface-container/80 border border-purple-500/30 shadow-lg space-y-1">
        <div class="flex items-center justify-between text-purple-300">
          <span class="text-[10px] font-bold uppercase tracking-wider">Encargados</span>
          <span class="material-symbols-outlined text-lg">shield_person</span>
        </div>
        <p class="text-2xl font-black text-purple-200 font-mono">{{ kpis()?.encargados || 0 }}</p>
        <p class="text-[10px] text-purple-300">Control total y finanzas</p>
      </div>

      <!-- 4. ADMINISTRADORES -->
      <div class="p-4 rounded-3xl bg-surface-container/80 border border-cyan-500/30 shadow-lg space-y-1">
        <div class="flex items-center justify-between text-cyan-300">
          <span class="text-[10px] font-bold uppercase tracking-wider">Admins</span>
          <span class="material-symbols-outlined text-lg">manage_accounts</span>
        </div>
        <p class="text-2xl font-black text-cyan-200 font-mono">{{ kpis()?.administradores || 0 }}</p>
        <p class="text-[10px] text-cyan-300">Gestión de eventos</p>
      </div>

      <!-- 5. CAMPO / TÉCNICOS -->
      <div class="p-4 rounded-3xl bg-surface-container/80 border border-amber-500/30 shadow-lg space-y-1">
        <div class="flex items-center justify-between text-amber-400">
          <span class="text-[10px] font-bold uppercase tracking-wider">Operación</span>
          <span class="material-symbols-outlined text-lg">badge</span>
        </div>
        <p class="text-2xl font-black text-amber-300 font-mono">{{ kpis()?.campo || 0 }}</p>
        <p class="text-[10px] text-amber-300">Staff y técnicos</p>
      </div>

      <!-- 6. 2FA ACTIVO -->
      <div class="p-4 rounded-3xl bg-surface-container/80 border border-outline-variant/30 shadow-lg space-y-1">
        <div class="flex items-center justify-between text-primary">
          <span class="text-[10px] font-bold uppercase tracking-wider">2FA Activo</span>
          <span class="material-symbols-outlined text-lg">lock</span>
        </div>
        <p class="text-2xl font-black text-on-surface font-mono">{{ kpis()?.with2FA || 0 }}</p>
        <p class="text-[10px] text-outline">Doble factor verificado</p>
      </div>

    </div>
  `
})
export class UsersKpisComponent {
  kpis = input<any>();
}
