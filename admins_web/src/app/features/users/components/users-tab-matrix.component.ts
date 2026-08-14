import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ROLE_PERMISSION_MATRIX } from '../user-metrics';

@Component({
  selector: 'app-users-tab-matrix',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- Encabezado -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center material-symbols-outlined text-lg">
              policy
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Matriz de Permisos & Seguridad RBAC</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Control de privilegios por módulo operacional y nivel jerárquico</p>
        </div>
      </div>

      <!-- Tabla de Matriz -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4 overflow-x-auto">
        <table class="w-full text-left text-xs min-w-[700px]">
          <thead>
            <tr class="border-b border-outline-variant/30 text-outline text-[10px] uppercase font-bold tracking-wider">
              <th class="pb-3 px-3">Módulo / Función</th>
              <th class="pb-3 px-3 text-center">
                <span class="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 font-black">
                  👑 Encargado (Full)
                </span>
              </th>
              <th class="pb-3 px-3 text-center">
                <span class="px-2.5 py-1 rounded-lg bg-primary/20 text-primary border border-primary/40 font-black">
                  ⚡ Administrador
                </span>
              </th>
              <th class="pb-3 px-3 text-center">
                <span class="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-black">
                  👤 Operativo / Campo
                </span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/20">
            @for (m of matrix; track m.moduleName) {
              <tr class="hover:bg-surface-container-high/60 transition-colors">

                <!-- Módulo -->
                <td class="py-4 px-3 space-y-0.5">
                  <div class="flex items-center gap-2 font-bold text-on-surface">
                    <span class="material-symbols-outlined text-primary text-base">{{ m.icon }}</span>
                    <span>{{ m.moduleName }}</span>
                  </div>
                  <p class="text-[11px] text-outline pl-6">{{ m.description }}</p>
                </td>

                <!-- Encargado -->
                <td class="py-4 px-3 text-center">
                  <span class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {{ m.encargado }}
                  </span>
                </td>

                <!-- Administrador -->
                <td class="py-4 px-3 text-center">
                  <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold"
                    [class]="m.administrador.includes('Sin Acceso') ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-primary/20 text-primary border border-primary/40'">
                    {{ m.administrador }}
                  </span>
                </td>

                <!-- Usuario -->
                <td class="py-4 px-3 text-center">
                  <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold"
                    [class]="m.usuario.includes('Sin Acceso') ? 'bg-surface-container-highest text-outline border border-outline-variant/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'">
                    {{ m.usuario }}
                  </span>
                </td>

              </tr>
            }
          </tbody>
        </table>
      </div>

    </div>
  `
})
export class UsersTabMatrixComponent {
  matrix = ROLE_PERMISSION_MATRIX;
}
