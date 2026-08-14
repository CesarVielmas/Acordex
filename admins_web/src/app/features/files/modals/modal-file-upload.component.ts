import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileItem, GroupItem } from '../../../core/models/admin.models';

@Component({
  selector: 'app-modal-file-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div class="w-full max-w-lg rounded-3xl bg-surface-container border border-outline-variant/30 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg">
              upload_file
            </span>
            <div>
              <h3 class="text-base font-black text-on-surface">Subir Archivo a la Bóveda</h3>
              <p class="text-xs text-outline">Almacenamiento seguro por talento y categoría</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Formulario -->
        <div class="space-y-3.5 text-xs">

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Nombre del Archivo <span class="text-rose-400">*</span></label>
            <input
              type="text"
              [(ngModel)]="formFileName"
              placeholder="Ej. Rider_Tecnico_Arena_Monterrey_2026.pdf"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-bold text-on-surface">Talento / Agrupación</label>
              <select
                [(ngModel)]="formGroupName"
                class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
              >
                @for (g of groups(); track g.id) {
                  <option [value]="g.name">{{ g.name }}</option>
                }
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-bold text-on-surface">Categoría</label>
              <select
                [(ngModel)]="formCategory"
                class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
              >
                <option value="Contratos">📜 Contratos</option>
                <option value="Riders Técnicos">🎛️ Riders Técnicos</option>
                <option value="Fotos">📸 Fotos</option>
                <option value="Videos">🎬 Videos</option>
                <option value="Reportes & Facturas">📊 Facturas & Reportes</option>
                <option value="Press Kits">📦 Press Kits</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Etiquetas (separadas por coma)</label>
            <input
              type="text"
              [(ngModel)]="formTags"
              placeholder="Audio, Iluminación, Monterrey, 2026"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            />
          </div>

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Descripción / Notas</label>
            <textarea
              [(ngModel)]="formDescription"
              rows="2"
              placeholder="Detalles sobre el archivo o requerimientos de uso..."
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary text-xs"
            ></textarea>
          </div>

        </div>

        <!-- Botones -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20 text-xs">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2 rounded-xl bg-surface-container-high text-outline hover:text-on-surface font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="submitForm()"
            [disabled]="!formFileName.trim()"
            class="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-black shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-base">cloud_upload</span>
            Subir Archivo
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalFileUploadComponent {
  groups = input<GroupItem[]>([]);

  uploaded = output<Omit<FileItem, 'id' | 'uploadDate'>>();
  closed = output<void>();

  formFileName = '';
  formGroupName = 'Los Elegantes del Norte';
  formCategory: any = 'Contratos';
  formTags = 'Documento, 2026';
  formDescription = '';

  submitForm(): void {
    if (!this.formFileName.trim()) return;

    const tags = this.formTags.split(',').map(t => t.trim()).filter(Boolean);

    this.uploaded.emit({
      fileName: this.formFileName.trim(),
      groupName: this.formGroupName,
      category: this.formCategory,
      size: '4.5 MB',
      url: '#',
      uploadedBy: 'Lic. Claudia Morales',
      status: 'Vigente',
      tags,
      description: this.formDescription.trim()
    });
  }
}
