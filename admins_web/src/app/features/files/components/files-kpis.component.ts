import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-files-kpis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">

      <!-- 1. TOTAL ARCHIVOS -->
      <div class="p-4 rounded-3xl bg-surface-container/80 border border-primary/30 shadow-lg space-y-1">
        <div class="flex items-center justify-between text-primary">
          <span class="text-[10px] font-bold uppercase tracking-wider">Bóveda Digital</span>
          <span class="material-symbols-outlined text-lg">folder</span>
        </div>
        <p class="text-2xl font-black text-on-surface font-mono">{{ kpis()?.totalFiles || 0 }}</p>
        <p class="text-[10px] text-outline">Archivos activos</p>
      </div>

      <!-- 2. CONTRATOS -->
      <div class="p-4 rounded-3xl bg-surface-container/80 border border-purple-500/30 shadow-lg space-y-1">
        <div class="flex items-center justify-between text-purple-300">
          <span class="text-[10px] font-bold uppercase tracking-wider">Contratos</span>
          <span class="material-symbols-outlined text-lg">description</span>
        </div>
        <p class="text-2xl font-black text-purple-200 font-mono">{{ kpis()?.contractsCount || 0 }}</p>
        <p class="text-[10px] text-purple-300">Expedientes legales</p>
      </div>

      <!-- 3. RIDERS -->
      <div class="p-4 rounded-3xl bg-surface-container/80 border border-cyan-500/30 shadow-lg space-y-1">
        <div class="flex items-center justify-between text-cyan-300">
          <span class="text-[10px] font-bold uppercase tracking-wider">Riders Técnicos</span>
          <span class="material-symbols-outlined text-lg">tune</span>
        </div>
        <p class="text-2xl font-black text-cyan-200 font-mono">{{ kpis()?.ridersCount || 0 }}</p>
        <p class="text-[10px] text-cyan-300">Audio y stage plots</p>
      </div>

      <!-- 4. FOTOS Y VIDEOS -->
      <div class="p-4 rounded-3xl bg-surface-container/80 border border-emerald-500/30 shadow-lg space-y-1">
        <div class="flex items-center justify-between text-emerald-400">
          <span class="text-[10px] font-bold uppercase tracking-wider">Multimedia</span>
          <span class="material-symbols-outlined text-lg">perm_media</span>
        </div>
        <p class="text-2xl font-black text-emerald-300 font-mono">{{ kpis()?.mediaCount || 0 }}</p>
        <p class="text-[10px] text-emerald-400">Prensa y pantallas</p>
      </div>

      <!-- 5. DESCARGAS TOTALES -->
      <div class="p-4 rounded-3xl bg-surface-container/80 border border-amber-500/30 shadow-lg space-y-1">
        <div class="flex items-center justify-between text-amber-400">
          <span class="text-[10px] font-bold uppercase tracking-wider">Descargas</span>
          <span class="material-symbols-outlined text-lg">download</span>
        </div>
        <p class="text-2xl font-black text-amber-300 font-mono">{{ kpis()?.totalDownloads || 0 }}</p>
        <p class="text-[10px] text-amber-300">Accesos del equipo</p>
      </div>

    </div>
  `
})
export class FilesKpisComponent {
  kpis = input<any>();
}
