import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { FileItem } from '../../core/models/admin.models';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { EntityCardComponent } from '../../shared/ui/entity-card/entity-card.component';
import { TabPillsComponent, TabPillItem } from '../../shared/ui/tab-pills/tab-pills.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';
import { FormFieldComponent, FormFieldOption } from '../../shared/ui/form-field/form-field.component';
import { IconButtonComponent } from '../../shared/ui/icon-button/icon-button.component';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    EntityCardComponent,
    TabPillsComponent,
    ModalShellComponent,
    FormFieldComponent,
    IconButtonComponent
  ],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="font-display-xl text-xl sm:text-2xl font-black text-on-surface">Administrador de Archivos</h1>
            <app-badge label="Gestor por Talento" variant="primary" />
          </div>
          <p class="text-xs text-outline mt-1">Carpetas organizadas por grupo: Fotos, Videos, Contratos y Press Kits</p>
        </div>

        <button
          (click)="isUploading.set(true)"
          class="px-4 py-2.5 min-h-11 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 self-start"
        >
          <span class="material-symbols-outlined text-lg">upload_file</span> Cargar Archivo Mock
        </button>
      </div>

      <!-- CATEGORY TABS -->
      <app-tab-pills [tabs]="categoryTabs" [active]="selectedCategory()" (change)="selectedCategory.set($event)" />

      <!-- FILES GRID -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        @for (f of filteredFiles(); track f.id) {
          <app-entity-card [title]="f.fileName" [subtitle]="f.groupName" [hasStats]="true">
            <div card-visual class="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl">{{ getCategoryIcon(f.category) }}</span>
            </div>

            <ng-container card-badges>
              <app-badge [label]="f.size" variant="neutral" />
            </ng-container>

            <p card-stats class="text-[10px] text-outline">Cargado: {{ f.uploadDate }}</p>

            <div card-footer class="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
              <button
                (click)="downloadFile(f)"
                class="px-3 py-2 min-h-11 rounded-xl bg-surface-bright hover:bg-primary hover:text-on-primary font-bold text-[11px] transition-all flex items-center gap-1"
              >
                <span class="material-symbols-outlined text-sm">download</span> Descargar
              </button>

              @if (roleService.canEditEvents()) {
                <app-icon-button icon="delete" ariaLabel="Eliminar archivo" variant="ghost" (pressed)="deleteFile(f.id)" />
              }
            </div>
          </app-entity-card>
        }
      </div>

      <!-- UPLOAD MODAL -->
      @if (isUploading()) {
        <app-modal-shell
          title="Subir Archivo al Sistema"
          icon="upload_file"
          size="md"
          [hasFooter]="true"
          (closed)="isUploading.set(false)"
        >
          <div class="space-y-3.5">
            <app-form-field label="Nombre del Archivo" [(value)]="uploadForm.fileName" placeholder="Ej. Rider_Tecnico_2026.pdf" />
            <app-form-field label="Talento / Grupo Asignado" type="select" [(value)]="uploadForm.groupName" [options]="groupOptions()" />
            <app-form-field label="Categoría" type="select" [(value)]="uploadForm.category" [options]="categoryOptions" />
          </div>

          <ng-container modal-footer>
            <button (click)="isUploading.set(false)" class="px-4 py-2 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
            <button (click)="saveFile()" class="px-5 py-2 min-h-11 rounded-xl bg-primary text-on-primary text-xs font-bold">Subir Archivo</button>
          </ng-container>
        </app-modal-shell>
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

  readonly categoryTabs: TabPillItem[] = [
    { value: 'Todos', label: 'Todos los Archivos' },
    ...this.categories.map(cat => ({ value: cat, label: cat, icon: this.getCategoryIcon(cat) }))
  ];

  readonly categoryOptions: FormFieldOption[] = this.categories.map(cat => ({ label: cat, value: cat }));

  groupOptions = computed<FormFieldOption[]>(() =>
    this.mockData.groups().map(grp => ({ label: grp.name, value: grp.name }))
  );

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
