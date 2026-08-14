import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileItem } from '../../../core/models/admin.models';
import { calculateStorageBreakdown, getFileCategoryIcon } from '../file-metrics';

@Component({
  selector: 'app-files-tab-storage',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center material-symbols-outlined text-lg">
              cloud_queue
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Almacenamiento en la Nube & Cuotas</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Diagnóstico de consumo de espacio en el servidor y desglose por categoría multimedia</p>
        </div>
      </div>

      <!-- BARRA DE USO GENERAL -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span class="text-xs text-outline uppercase font-bold tracking-wider">Espacio Utilizado en Servidor Acordex</span>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-2xl sm:text-3xl font-black text-on-surface font-mono">185.9 MB</span>
              <span class="text-xs text-outline font-bold">de 500.0 GB asignados (0.04% ocupado)</span>
            </div>
          </div>
          <span class="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold self-start sm:self-auto">
            Saludable · 499.8 GB Libres
          </span>
        </div>

        <!-- Barra Multilínea de Progreso -->
        <div class="w-full h-4 rounded-full bg-surface-container-high overflow-hidden flex">
          @for (item of breakdown(); track item.category) {
            <div
              [style.width.%]="item.percentage"
              [style.background-color]="item.color"
              class="h-full transition-all duration-500"
              [title]="item.category + ': ' + item.totalSizeFormatted + ' (' + item.percentage + '%)'"
            ></div>
          }
        </div>

        <!-- Leyenda de Categorías -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-outline-variant/20 text-xs">
          @for (item of breakdown(); track item.category) {
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full shrink-0" [style.background-color]="item.color"></span>
              <div class="min-w-0">
                <span class="text-on-surface font-bold truncate block text-[11px]">{{ item.category }}</span>
                <span class="text-outline text-[10px] font-mono">{{ item.totalSizeFormatted }} ({{ item.percentage }}%)</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- DESGLOSE DETALLADO EN TARJETAS -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        @for (item of breakdown(); track item.category) {
          <div class="p-5 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="w-9 h-9 rounded-xl flex items-center justify-center text-white material-symbols-outlined text-lg" [style.background-color]="item.color + '40'">
                  {{ getFileCategoryIcon(item.category) }}
                </span>
                <h4 class="text-xs font-black text-on-surface">{{ item.category }}</h4>
              </div>
              <span class="text-xs font-mono font-bold text-outline">{{ item.count }} archivos</span>
            </div>

            <div class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex justify-between items-center text-xs font-mono">
              <span class="text-outline">Espacio:</span>
              <span class="font-black text-on-surface">{{ item.totalSizeFormatted }}</span>
            </div>
          </div>
        }
      </div>

    </div>
  `
})
export class FilesTabStorageComponent {
  files = input<FileItem[]>([]);

  breakdown = computed(() => calculateStorageBreakdown(this.files()));

  getFileCategoryIcon = getFileCategoryIcon;
}
