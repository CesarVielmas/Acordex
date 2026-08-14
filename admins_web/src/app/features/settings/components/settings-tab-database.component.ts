import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings-tab-database',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center material-symbols-outlined text-lg">
              database
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Base de Datos, Respaldo & Mantenimiento</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Exportación de respaldo en formato JSON, reinicio de datos de demostración y cierre de sesión</p>
        </div>
      </div>

      <!-- 1. EXPORTACIÓN DE RESPALDO JSON -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <h3 class="text-sm font-black text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">cloud_download</span>
            Exportar Respaldo Completo de la Plataforma
          </h3>
          <p class="text-xs text-outline max-w-xl leading-relaxed">
            Descarga una copia de seguridad en archivo .json con todos los eventos, cotizaciones, finanzas, tareas y clientes actuales.
          </p>
        </div>

        <button
          type="button"
          (click)="exportBackup.emit()"
          class="px-5 py-2.5 rounded-2xl bg-primary text-on-primary font-black text-xs shadow-md hover:scale-105 transition-all flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <span class="material-symbols-outlined text-base">download</span>
          Descargar JSON
        </button>
      </div>

      <!-- 2. REINICIO DE DATOS DE DEMOSTRACIÓN -->
      <div class="p-6 rounded-3xl bg-surface-container border border-amber-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <h3 class="text-sm font-black text-amber-300 flex items-center gap-2">
            <span class="material-symbols-outlined text-amber-400">restart_alt</span>
            Restablecer Datos de Fábrica
          </h3>
          <p class="text-xs text-outline max-w-xl leading-relaxed">
            Elimina las modificaciones locales y recarga el set de demostración oficial con eventos de Palenque San Marcos, finanzas y tareas de prueba.
          </p>
        </div>

        <button
          type="button"
          (click)="openResetModal.emit()"
          class="px-5 py-2.5 rounded-2xl bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black font-black text-xs border border-amber-500/40 transition-all shrink-0 cursor-pointer self-start sm:self-auto"
        >
          Restaurar Datos
        </button>
      </div>

      <!-- 3. CIERRE DE SESIÓN -->
      <div class="p-6 rounded-3xl bg-surface-container border border-rose-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <h3 class="text-sm font-black text-rose-300 flex items-center gap-2">
            <span class="material-symbols-outlined text-rose-400">logout</span>
            Cerrar Sesión Administrativa
          </h3>
          <p class="text-xs text-outline max-w-xl leading-relaxed">
            Finaliza la sesión actual y regresa al selector inicial del sistema Acordex.
          </p>
        </div>

        <button
          type="button"
          (click)="logout.emit()"
          class="px-5 py-2.5 rounded-2xl bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white font-black text-xs border border-rose-500/40 transition-all shrink-0 cursor-pointer self-start sm:self-auto"
        >
          Cerrar Sesión
        </button>
      </div>

    </div>
  `
})
export class SettingsTabDatabaseComponent {
  exportBackup = output<void>();
  openResetModal = output<void>();
  logout = output<void>();
}
