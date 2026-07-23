import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { FileItem } from '../../core/models/admin.models';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display-xl text-2xl font-black text-on-surface">Administrador de Archivos</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
              Gestor por Talento
            </span>
          </div>
          <p class="text-xs text-outline mt-1">Carpetas organizadas por grupo: Fotos, Videos, Contratos y Press Kits</p>
        </div>

        <button 
          (click)="isUploading.set(true)"
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 self-start"
        >
          <span class="material-symbols-outlined text-lg">upload_file</span> Cargar Archivo Mock
        </button>
      </div>

      <!-- CATEGORY TABS -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button 
          (click)="selectedCategory.set('Todos')"
          [class]="selectedCategory() === 'Todos' ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-high text-outline hover:text-on-surface'"
          class="px-4 py-2 rounded-xl text-xs transition-all"
        >
          Todos los Archivos
        </button>
        @for (cat of categories; track cat) {
          <button 
            (click)="selectedCategory.set(cat)"
            [class]="selectedCategory() === cat ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-high text-outline hover:text-on-surface'"
            class="px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-base">{{ getCategoryIcon(cat) }}</span> {{ cat }}
          </button>
        }
      </div>

      <!-- FILES GRID -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        @for (f of filteredFiles(); track f.id) {
          <div class="p-5 rounded-3xl bg-surface-container border border-outline-variant/30 hover:border-primary/50 transition-all duration-300 shadow-xl space-y-3 flex flex-col justify-between group">
            
            <div>
              <div class="flex items-center justify-between">
                <div class="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span class="material-symbols-outlined text-2xl">{{ getCategoryIcon(f.category) }}</span>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-bright text-outline">
                  {{ f.size }}
                </span>
              </div>

              <h4 class="text-xs font-bold text-on-surface mt-3 truncate group-hover:text-primary transition-colors" [title]="f.fileName">
                {{ f.fileName }}
              </h4>
              <p class="text-[11px] text-primary font-medium mt-0.5 truncate">{{ f.groupName }}</p>
              <p class="text-[10px] text-outline mt-1">Cargado: {{ f.uploadDate }}</p>
            </div>

            <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
              <button 
                (click)="downloadFile(f)"
                class="px-3 py-1.5 rounded-xl bg-surface-bright hover:bg-primary hover:text-on-primary font-bold text-[11px] transition-all flex items-center gap-1"
              >
                <span class="material-symbols-outlined text-sm">download</span> Descargar
              </button>

              @if (roleService.canEditEvents()) {
                <button 
                  (click)="deleteFile(f.id)"
                  class="text-outline hover:text-red-400 p-1 transition-colors"
                  title="Eliminar archivo"
                >
                  <span class="material-symbols-outlined text-lg">delete</span>
                </button>
              }
            </div>

          </div>
        }
      </div>

      <!-- UPLOAD MODAL -->
      @if (isUploading()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-surface-container p-6 rounded-3xl border border-outline-variant/30 max-w-md w-full space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 class="text-base font-bold text-on-surface">Subir Archivo al Sistema</h3>
              <button (click)="isUploading.set(false)" class="text-outline hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-outline font-medium mb-1">Nombre del Archivo</label>
                <input [(ngModel)]="uploadForm.fileName" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" placeholder="Ej. Rider_Tecnico_2026.pdf" />
              </div>

              <div>
                <label class="block text-outline font-medium mb-1">Talento / Grupo Asignado</label>
                <select [(ngModel)]="uploadForm.groupName" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface">
                  @for (grp of mockData.groups(); track grp.id) {
                    <option [value]="grp.name">{{ grp.name }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-outline font-medium mb-1">Categoría</label>
                <select [(ngModel)]="uploadForm.category" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface">
                  @for (cat of categories; track cat) {
                    <option [value]="cat">{{ cat }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button (click)="isUploading.set(false)" class="px-4 py-2 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
              <button (click)="saveFile()" class="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold">Subir Archivo</button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class FilesComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  selectedCategory = signal<string>('Todos');
  isUploading = signal(false);

  readonly categories: ('Fotos' | 'Videos' | 'Contratos' | 'Press Kits')[] = [
    'Fotos',
    'Videos',
    'Contratos',
    'Press Kits'
  ];

  uploadForm = {
    fileName: '',
    groupName: 'Los Elegantes del Norte',
    category: 'Contratos' as 'Fotos' | 'Videos' | 'Contratos' | 'Press Kits'
  };

  filteredFiles(): FileItem[] {
    const cat = this.selectedCategory();
    if (cat === 'Todos') return this.mockData.files();
    return this.mockData.files().filter(f => f.category === cat);
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'Fotos': return 'photo_library';
      case 'Videos': return 'video_library';
      case 'Contratos': return 'description';
      case 'Press Kits': return 'folder_zip';
      default: return 'insert_drive_file';
    }
  }

  downloadFile(f: FileItem): void {
    alert(`Descargando ${f.fileName} (${f.size}) simulado...`);
  }

  deleteFile(id: string): void {
    this.mockData.deleteFile(id);
  }

  saveFile(): void {
    if (!this.uploadForm.fileName) return;
    this.mockData.uploadFile({
      fileName: this.uploadForm.fileName,
      groupName: this.uploadForm.groupName,
      category: this.uploadForm.category,
      size: '3.8 MB',
      url: '#'
    });
    this.isUploading.set(false);
  }
}
