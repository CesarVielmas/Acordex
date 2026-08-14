import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileItem } from '../../../core/models/admin.models';

@Component({
  selector: 'app-files-tab-contracts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-300 flex items-center justify-center material-symbols-outlined text-lg">
              description
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Expedientes Legales & Contratos de Exclusividad</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Contratos firmados de representación artística, pólizas de fianza y convenios de confidencialidad</p>
        </div>
      </div>

      <!-- LISTA DE CONTRATOS -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4">
        @for (file of contractFiles(); track file.id) {
          <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <div class="w-11 h-11 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-xl">gavel</span>
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-on-surface text-xs truncate">{{ file.fileName }}</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    {{ file.status || 'Vigente' }}
                  </span>
                </div>
                <p class="text-[11px] text-outline mt-0.5">{{ file.groupName }} · Subido por: {{ file.uploadedBy || 'Dirección Legal' }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2 font-mono text-xs shrink-0 self-end sm:self-auto">
              <span class="text-outline text-[11px]">{{ file.size }}</span>
              <button
                type="button"
                (click)="previewFile.emit(file)"
                class="px-3 py-1.5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold transition-all cursor-pointer"
              >
                Ver Expediente
              </button>
              <button
                type="button"
                (click)="downloadFile.emit(file)"
                class="p-2 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-all cursor-pointer shadow-md"
              >
                <span class="material-symbols-outlined text-base">download</span>
              </button>
            </div>
          </div>
        } @empty {
          <div class="text-center py-8 text-outline text-xs italic">
            No hay contratos registrados.
          </div>
        }
      </div>

    </div>
  `
})
export class FilesTabContractsComponent {
  files = input<FileItem[]>([]);
  previewFile = output<FileItem>();
  downloadFile = output<FileItem>();

  contractFiles(): FileItem[] {
    return this.files().filter(f => f.category === 'Contratos');
  }
}
