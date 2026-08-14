import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { FileItem } from '../../core/models/admin.models';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { TabPillsComponent, TabPillItem } from '../../shared/ui/tab-pills/tab-pills.component';

import { calculateFilesKPIs } from './file-metrics';
import { FilesKpisComponent } from './components/files-kpis.component';
import { FilesTabVaultComponent } from './components/files-tab-vault.component';
import { FilesTabContractsComponent } from './components/files-tab-contracts.component';
import { FilesTabRidersComponent } from './components/files-tab-riders.component';
import { FilesTabStorageComponent } from './components/files-tab-storage.component';
import { ModalFileUploadComponent } from './modals/modal-file-upload.component';
import { ModalFilePreviewComponent } from './modals/modal-file-preview.component';

export type FilesTab = 'vault' | 'contracts' | 'riders' | 'storage';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    TabPillsComponent,
    FilesKpisComponent,
    FilesTabVaultComponent,
    FilesTabContractsComponent,
    FilesTabRidersComponent,
    FilesTabStorageComponent,
    ModalFileUploadComponent,
    ModalFilePreviewComponent
  ],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-fade-in pb-12">

      <!-- ─── ENCABEZADO PRINCIPAL ─── -->
      <div class="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-surface-container-high/90 via-surface-container/80 to-surface-container-high/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-xl sm:text-2xl font-black text-on-surface tracking-tight">Administrador de Archivos & Bóveda</h1>
            <app-badge label="Gestor Digital" variant="primary" />
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30">
              Nube Segura
            </span>
          </div>
          <p class="text-xs text-outline mt-1 max-w-2xl leading-relaxed">
            Repositorio centralizado por talento: contratos legales de exclusividad, riders de audio/escenario, press kits y multimedia para pantallas LED.
          </p>
        </div>

        <div class="relative z-10 flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            (click)="openUploadModal()"
            class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-black text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span class="material-symbols-outlined text-lg">cloud_upload</span>
            Subir Archivo
          </button>
        </div>
      </div>

      <!-- ─── KPIS SUPERIORES ─── -->
      <app-files-kpis [kpis]="filesKPIs()" />

      <!-- ─── PESTAÑAS ─── -->
      <div class="border-b border-outline-variant/30 pb-2">
        <app-tab-pills
          [tabs]="tabOptions"
          [active]="activeTab()"
          (change)="setTab($event)"
        />
      </div>

      <!-- ─── VISTAS ─── -->

      <!-- 1. EXPLORADOR & BÓVEDA -->
      @if (activeTab() === 'vault') {
        <app-files-tab-vault
          [files]="mockData.files()"
          (previewFile)="onOpenPreview($event)"
          (downloadFile)="onDownloadFile($event)"
          (deleteFile)="onDeleteFile($event)"
        />
      }

      <!-- 2. CONTRATOS LEGALES -->
      @if (activeTab() === 'contracts') {
        <app-files-tab-contracts
          [files]="mockData.files()"
          (previewFile)="onOpenPreview($event)"
          (downloadFile)="onDownloadFile($event)"
        />
      }

      <!-- 3. RIDERS TÉCNICOS -->
      @if (activeTab() === 'riders') {
        <app-files-tab-riders
          [files]="mockData.files()"
          (previewFile)="onOpenPreview($event)"
          (downloadFile)="onDownloadFile($event)"
        />
      }

      <!-- 4. ALMACENAMIENTO & CUOTAS -->
      @if (activeTab() === 'storage') {
        <app-files-tab-storage [files]="mockData.files()" />
      }

      <!-- ─── MODALES ─── -->

      <!-- Modal 1: Subida de Archivo -->
      @if (isUploadModalOpen()) {
        <app-modal-file-upload
          [groups]="mockData.groups()"
          (uploaded)="onSaveFileUpload($event)"
          (closed)="isUploadModalOpen.set(false)"
        />
      }

      <!-- Modal 2: Vista Previa de Archivo -->
      @if (fileToPreview()) {
        <app-modal-file-preview
          [file]="fileToPreview()!"
          (download)="onDownloadFile($event)"
          (delete)="onDeleteFromPreview($event)"
          (closed)="fileToPreview.set(null)"
        />
      }

    </div>
  `
})
export class FilesComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  activeTab = signal<FilesTab>('vault');

  isUploadModalOpen = signal(false);
  fileToPreview = signal<FileItem | null>(null);

  readonly tabOptions: TabPillItem[] = [
    { value: 'vault', label: 'Bóveda General', icon: 'folder' },
    { value: 'contracts', label: 'Contratos Legales', icon: 'description' },
    { value: 'riders', label: 'Riders & Stage Plots', icon: 'tune' },
    { value: 'storage', label: 'Almacenamiento & Cuotas', icon: 'cloud_queue' }
  ];

  setTab(tabId: string): void {
    this.activeTab.set(tabId as FilesTab);
  }

  filesKPIs = computed(() => {
    return calculateFilesKPIs(this.mockData.files());
  });

  openUploadModal(): void {
    this.isUploadModalOpen.set(true);
  }

  onOpenPreview(file: FileItem): void {
    this.fileToPreview.set(file);
  }

  onDownloadFile(file: FileItem): void {
    this.mockData.incrementFileDownloads(file.id);
    alert(`Descargando "${file.fileName}" (${file.size})`);
  }

  onDeleteFile(fileId: string): void {
    this.mockData.deleteFile(fileId);
  }

  onDeleteFromPreview(fileId: string): void {
    this.mockData.deleteFile(fileId);
    this.fileToPreview.set(null);
  }

  onSaveFileUpload(file: Omit<FileItem, 'id' | 'uploadDate'>): void {
    this.mockData.uploadFile(file);
    this.isUploadModalOpen.set(false);
  }
}
