import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileItem } from '../../../core/models/admin.models';
import { getFileCategoryIcon, getFileCategoryBadgeClass } from '../file-metrics';

@Component({
  selector: 'app-files-tab-vault',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ─── BARRA DE BÚSQUEDA & FILTROS ─── -->
      <div class="p-4 sm:p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">

        <!-- Buscador -->
        <div class="relative flex-1 max-w-md">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por nombre, artista o tag..."
            class="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-container-high border border-outline-variant/30 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
          />
        </div>

        <!-- Filtros Rápidos -->
        <div class="flex items-center gap-2 flex-wrap text-xs">

          <!-- Categoría -->
          <select
            [ngModel]="selectedCategory()"
            (ngModelChange)="selectedCategory.set($event)"
            class="px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="Contratos">📜 Contratos</option>
            <option value="Riders Técnicos">🎛️ Riders Técnicos</option>
            <option value="Fotos">📸 Fotos</option>
            <option value="Videos">🎬 Videos</option>
            <option value="Reportes & Facturas">📊 Facturas & Reportes</option>
            <option value="Press Kits">📦 Press Kits</option>
          </select>

          <!-- Talento -->
          <select
            [ngModel]="selectedGroup()"
            (ngModelChange)="selectedGroup.set($event)"
            class="px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
          >
            <option value="ALL">Todos los Talentos</option>
            <option value="Los Elegantes del Norte">Los Elegantes del Norte</option>
            <option value="Banda La Imperial">Banda La Imperial</option>
            <option value="Fuerza Norteña">Fuerza Norteña</option>
          </select>

          @if (searchQuery() || selectedCategory() !== 'ALL' || selectedGroup() !== 'ALL') {
            <button
              type="button"
              (click)="clearFilters()"
              class="px-3 py-2 rounded-xl bg-surface-container-highest text-outline hover:text-on-surface font-bold text-xs transition-all cursor-pointer"
            >
              Limpiar
            </button>
          }
        </div>

      </div>

      <!-- ─── GRID DE ARCHIVOS ─── -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        @for (file of filteredFiles(); track file.id) {
          <div class="p-5 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4 hover:border-primary/50 transition-all flex flex-col justify-between group">

            <!-- Encabezado con Icono y Categoría -->
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <span class="material-symbols-outlined text-2xl">{{ getFileCategoryIcon(file.category) }}</span>
                </div>

                <div class="text-right">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border" [class]="getFileCategoryBadgeClass(file.category)">
                    {{ file.category }}
                  </span>
                  <span class="block text-[10px] font-mono text-outline mt-1 font-bold">{{ file.size }}</span>
                </div>
              </div>

              <!-- Nombre y Talento -->
              <div>
                <h4 class="text-xs font-black text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                  {{ file.fileName }}
                </h4>
                <p class="text-[11px] text-outline truncate mt-0.5 font-medium">{{ file.groupName }}</p>
              </div>

              @if (file.description) {
                <p class="text-[11px] text-outline/80 line-clamp-2 leading-relaxed">
                  {{ file.description }}
                </p>
              }

              <!-- Tags -->
              @if (file.tags && file.tags.length > 0) {
                <div class="flex items-center gap-1 flex-wrap pt-1">
                  @for (tag of file.tags; track tag) {
                    <span class="px-2 py-0.5 rounded-md text-[9px] font-bold bg-surface-container-high text-outline">
                      #{{ tag }}
                    </span>
                  }
                </div>
              }
            </div>

            <!-- Footer con Descargas y Botones -->
            <div class="pt-3 border-t border-outline-variant/20 space-y-2">
              <div class="flex items-center justify-between text-[10px] text-outline font-mono">
                <span>{{ file.uploadDate }}</span>
                <span>{{ file.downloadCount || 0 }} descargas</span>
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  (click)="previewFile.emit(file)"
                  class="flex-1 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-sm">visibility</span>
                  Ver
                </button>

                <button
                  type="button"
                  (click)="downloadFile.emit(file)"
                  title="Descargar Archivo"
                  class="p-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:scale-105 transition-all flex items-center justify-center cursor-pointer shadow-md"
                >
                  <span class="material-symbols-outlined text-base">download</span>
                </button>

                <button
                  type="button"
                  (click)="deleteFile.emit(file.id)"
                  title="Eliminar Archivo"
                  class="p-2 rounded-xl bg-surface-container-high hover:bg-rose-500/20 text-outline hover:text-rose-400 transition-all cursor-pointer"
                >
                  <span class="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class FilesTabVaultComponent {
  files = input<FileItem[]>([]);

  previewFile = output<FileItem>();
  downloadFile = output<FileItem>();
  deleteFile = output<string>();

  searchQuery = signal('');
  selectedCategory = signal('ALL');
  selectedGroup = signal('ALL');

  filteredFiles(): FileItem[] {
    return this.files().filter(f => {
      if (this.searchQuery()) {
        const q = this.searchQuery().toLowerCase();
        const matchName = f.fileName.toLowerCase().includes(q);
        const matchGroup = f.groupName.toLowerCase().includes(q);
        const matchTag = f.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchGroup && !matchTag) return false;
      }
      if (this.selectedCategory() !== 'ALL' && f.category !== this.selectedCategory()) return false;
      if (this.selectedGroup() !== 'ALL' && f.groupName !== this.selectedGroup()) return false;
      return true;
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('ALL');
    this.selectedGroup.set('ALL');
  }

  getFileCategoryIcon = getFileCategoryIcon;
  getFileCategoryBadgeClass = getFileCategoryBadgeClass;
}
