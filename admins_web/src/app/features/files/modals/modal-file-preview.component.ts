import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileItem } from '../../../core/models/admin.models';
import { getFileCategoryIcon, getFileCategoryBadgeClass } from '../file-metrics';

@Component({
  selector: 'app-modal-file-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div class="w-full max-w-xl rounded-3xl bg-surface-container border border-outline-variant/30 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-start justify-between gap-3 border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-2xl">{{ getFileCategoryIcon(file().category) }}</span>
            </div>
            <div class="min-w-0">
              <h3 class="text-sm sm:text-base font-black text-on-surface truncate">{{ file().fileName }}</h3>
              <p class="text-xs text-outline truncate">{{ file().groupName }} · {{ file().category }}</p>
            </div>
          </div>

          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Vista Previa Ficticia del Documento -->
        <div class="p-6 rounded-2xl bg-surface-container-high border border-outline-variant/30 text-center space-y-3">
          <div class="w-16 h-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <span class="material-symbols-outlined text-3xl">{{ getFileCategoryIcon(file().category) }}</span>
          </div>

          <div>
            <h4 class="text-xs font-bold text-on-surface">{{ file().fileName }}</h4>
            <p class="text-[11px] text-outline font-mono mt-0.5">{{ file().size }} · {{ file().uploadDate }}</p>
          </div>

          <span class="px-3 py-1 rounded-full text-[10px] font-bold border inline-block" [class]="getFileCategoryBadgeClass(file().category)">
            {{ file().category }} · {{ file().status || 'Vigente' }}
          </span>
        </div>

        <!-- Metadatos Detallados -->
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-0.5">
            <span class="text-[10px] text-outline uppercase font-bold">Subido por</span>
            <p class="font-bold text-on-surface">{{ file().uploadedBy || 'Dirección General' }}</p>
          </div>
          <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-0.5">
            <span class="text-[10px] text-outline uppercase font-bold">Descargas Registradas</span>
            <p class="font-bold text-primary font-mono">{{ file().downloadCount || 0 }} veces</p>
          </div>
        </div>

        @if (file().description) {
          <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-0.5 text-xs">
            <span class="text-[10px] text-outline uppercase font-bold">Descripción</span>
            <p class="text-on-surface leading-relaxed">{{ file().description }}</p>
          </div>
        }

        <!-- Botones de Acción -->
        <div class="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/20 text-xs">
          <button
            type="button"
            (click)="delete.emit(file().id)"
            class="px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">delete</span>
            Eliminar
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="copyLink()"
              class="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span class="material-symbols-outlined text-sm">link</span>
              Copiar Enlace
            </button>

            <button
              type="button"
              (click)="download.emit(file())"
              class="px-4 py-2 rounded-xl bg-primary text-on-primary font-black shadow-md hover:scale-105 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span class="material-symbols-outlined text-sm">download</span>
              Descargar
            </button>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ModalFilePreviewComponent {
  file = input.required<FileItem>();

  closed = output<void>();
  download = output<FileItem>();
  delete = output<string>();

  copyLink(): void {
    alert(`Enlace seguro de descarga copiado al portapapeles para ${this.file().fileName}`);
  }

  getFileCategoryIcon = getFileCategoryIcon;
  getFileCategoryBadgeClass = getFileCategoryBadgeClass;
}
