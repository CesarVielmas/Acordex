import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileItem } from '../../../core/models/admin.models';

@Component({
  selector: 'app-files-tab-riders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg">
              tune
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Riders Técnicos, Audio & Stage Plots</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Especificaciones de microfonía, monitoreo in-ear, plantas de luz y consolas para empresarios</p>
        </div>
      </div>

      <!-- GRID DE RIDERS POR GRUPO -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        @for (file of riderFiles(); track file.id) {
          <div class="p-5 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">speaker</span>
                  </div>
                  <div>
                    <h3 class="text-xs font-black text-on-surface">{{ file.groupName }}</h3>
                    <span class="text-[10px] font-mono text-outline">{{ file.size }}</span>
                  </div>
                </div>

                <span class="px-2 py-0.5 rounded text-[9px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  Rider 2026
                </span>
              </div>

              <h4 class="text-xs font-bold text-on-surface mt-1">{{ file.fileName }}</h4>
              <p class="text-[11px] text-outline leading-relaxed">{{ file.description || 'Especificaciones técnicas oficiales.' }}</p>
            </div>

            <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2 text-xs">
              <span class="text-[10px] text-outline font-mono">Actualizado: {{ file.uploadDate }}</span>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="previewFile.emit(file)"
                  class="px-3 py-1.5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold transition-all cursor-pointer"
                >
                  Ver PDF
                </button>
                <button
                  type="button"
                  (click)="downloadFile.emit(file)"
                  class="px-3 py-1.5 rounded-xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-all flex items-center gap-1 cursor-pointer shadow-md"
                >
                  <span class="material-symbols-outlined text-sm">download</span> Descargar
                </button>
              </div>
            </div>
          </div>
        }
      </div>

    </div>
  `
})
export class FilesTabRidersComponent {
  files = input<FileItem[]>([]);
  previewFile = output<FileItem>();
  downloadFile = output<FileItem>();

  riderFiles(): FileItem[] {
    return this.files().filter(f => f.category === 'Riders Técnicos');
  }
}
