import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLog } from '../../../core/models/admin.models';
import { getRoleBadgeClass } from '../user-metrics';

@Component({
  selector: 'app-users-tab-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO Y FILTROS -->
      <div class="p-4 sm:p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg">
              receipt_long
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Bitácora de Auditoría del Sistema (Audit Trail)</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Registro inmutable de acciones, firmas de contratos, transacciones y cambios de roles</p>
        </div>

        <div class="flex items-center gap-2 text-xs">
          <!-- Filtro por Módulo -->
          <select
            [ngModel]="selectedModule()"
            (ngModelChange)="selectedModule.set($event)"
            class="px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          >
            <option value="ALL">Todos los Módulos</option>
            <option value="Cotizaciones">Cotizaciones</option>
            <option value="Eventos">Eventos</option>
            <option value="Finanzas">Finanzas</option>
            <option value="Tareas">Tareas</option>
            <option value="Clientes CRM">Clientes CRM</option>
            <option value="Usuarios">Usuarios</option>
            <option value="Archivos">Archivos</option>
            <option value="Configuración">Configuración</option>
          </select>
        </div>
      </div>

      <!-- TABLA DE AUDITORÍA -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4 overflow-x-auto">
        <table class="w-full text-left text-xs min-w-[700px]">
          <thead>
            <tr class="border-b border-outline-variant/30 text-outline text-[10px] uppercase font-bold tracking-wider">
              <th class="pb-3 px-3">Fecha / Hora</th>
              <th class="pb-3 px-3">Usuario</th>
              <th class="pb-3 px-3">Rol</th>
              <th class="pb-3 px-3">Módulo</th>
              <th class="pb-3 px-3">Acción</th>
              <th class="pb-3 px-3">Detalle del Registro</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/20">
            @for (log of filteredLogs(); track log.id) {
              <tr class="hover:bg-surface-container-high/60 transition-colors">
                <!-- Timestamp -->
                <td class="py-3.5 px-3 font-mono text-[11px] text-outline whitespace-nowrap">
                  {{ log.timestamp }}
                </td>

                <!-- Usuario -->
                <td class="py-3.5 px-3 font-bold text-on-surface whitespace-nowrap">
                  {{ log.userName }}
                </td>

                <!-- Rol -->
                <td class="py-3.5 px-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-black border uppercase" [class]="getRoleBadgeClass(log.role)">
                    {{ log.role }}
                  </span>
                </td>

                <!-- Módulo -->
                <td class="py-3.5 px-3">
                  <span class="px-2 py-0.5 rounded-lg bg-surface-container-highest text-on-surface font-bold text-[10px] border border-outline-variant/30">
                    {{ log.targetModule }}
                  </span>
                </td>

                <!-- Acción -->
                <td class="py-3.5 px-3 font-bold text-primary">
                  {{ log.action }}
                </td>

                <!-- Detalle -->
                <td class="py-3.5 px-3 text-outline text-[11px]">
                  {{ log.details }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

    </div>
  `
})
export class UsersTabAuditComponent {
  logs = input<AuditLog[]>([]);

  selectedModule = signal('ALL');

  filteredLogs(): AuditLog[] {
    const mod = this.selectedModule();
    if (mod === 'ALL') return this.logs();
    return this.logs().filter(l => l.targetModule === mod);
  }

  getRoleBadgeClass = getRoleBadgeClass;
}
