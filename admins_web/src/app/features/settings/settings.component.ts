import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { TabPillsComponent, TabPillItem } from '../../shared/ui/tab-pills/tab-pills.component';

import { SettingsTabProfileComponent } from './components/settings-tab-profile.component';
import { SettingsTabCommercialComponent } from './components/settings-tab-commercial.component';
import { SettingsTabNotificationsComponent } from './components/settings-tab-notifications.component';
import { SettingsTabBanksComponent } from './components/settings-tab-banks.component';
import { SettingsTabDatabaseComponent } from './components/settings-tab-database.component';
import { ModalBankEditorComponent } from './modals/modal-bank-editor.component';
import { ModalResetDataComponent } from './modals/modal-reset-data.component';

export type SettingsTab = 'profile' | 'commercial' | 'notifications' | 'banks' | 'database';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    TabPillsComponent,
    SettingsTabProfileComponent,
    SettingsTabCommercialComponent,
    SettingsTabNotificationsComponent,
    SettingsTabBanksComponent,
    SettingsTabDatabaseComponent,
    ModalBankEditorComponent,
    ModalResetDataComponent
  ],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-fade-in pb-12">

      <!-- ─── ENCABEZADO PRINCIPAL ─── -->
      <div class="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-surface-container-high/90 via-surface-container/80 to-surface-container-high/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-xl sm:text-2xl font-black text-on-surface tracking-tight">Configuración de la Disquera & Plataforma</h1>
            <app-badge label="Perfil Corporativo" variant="primary" />
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30">
              Acordex Records
            </span>
          </div>
          <p class="text-xs text-outline mt-1 max-w-2xl leading-relaxed">
            Parámetros globales de la agencia: datos fiscales (SAT), políticas comerciales de booking, cuentas receptoras SPEI, notificaciones y respaldos.
          </p>
        </div>
      </div>

      <!-- ─── PESTAÑAS DE CONFIGURACIÓN ─── -->
      <div class="border-b border-outline-variant/30 pb-2">
        <app-tab-pills
          [tabs]="tabOptions"
          [active]="activeTab()"
          (change)="setTab($event)"
        />
      </div>

      <!-- ─── VISTAS DE CONFIGURACIÓN ─── -->

      <!-- 1. PERFIL CORPORATIVO & FISCAL -->
      @if (activeTab() === 'profile') {
        <app-settings-tab-profile
          [settings]="mockData.settings()"
          (save)="onSaveSettings()"
        />
      }

      <!-- 2. POLÍTICAS COMERCIALES & BOOKING -->
      @if (activeTab() === 'commercial') {
        <app-settings-tab-commercial
          [settings]="mockData.settings()"
          (save)="onSaveSettings()"
        />
      }

      <!-- 3. NOTIFICACIONES & ALERTAS -->
      @if (activeTab() === 'notifications') {
        <app-settings-tab-notifications
          [settings]="mockData.settings()"
          (save)="onSaveSettings()"
        />
      }

      <!-- 4. CUENTAS BANCARIAS RECEPTORAS -->
      @if (activeTab() === 'banks') {
        <app-settings-tab-banks
          [settings]="mockData.settings()"
          (openAddModal)="isAddBankModalOpen.set(true)"
          (deleteAccount)="onDeleteBankAccount($event)"
        />
      }

      <!-- 5. BASE DE DATOS & RESPALDOS -->
      @if (activeTab() === 'database') {
        <app-settings-tab-database
          (exportBackup)="onExportBackup()"
          (openResetModal)="isResetModalOpen.set(true)"
          (logout)="onLogout()"
        />
      }

      <!-- ─── MODALES ─── -->

      <!-- Modal 1: Agregar Cuenta Bancaria -->
      @if (isAddBankModalOpen()) {
        <app-modal-bank-editor
          (saved)="onSaveBankAccount($event)"
          (closed)="isAddBankModalOpen.set(false)"
        />
      }

      <!-- Modal 2: Reset Demo Data -->
      @if (isResetModalOpen()) {
        <app-modal-reset-data
          (confirmed)="onConfirmResetData()"
          (closed)="isResetModalOpen.set(false)"
        />
      }

    </div>
  `
})
export class SettingsComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  activeTab = signal<SettingsTab>('profile');

  isAddBankModalOpen = signal(false);
  isResetModalOpen = signal(false);

  readonly tabOptions: TabPillItem[] = [
    { value: 'profile', label: 'Perfil de la Disquera', icon: 'domain' },
    { value: 'commercial', label: 'Políticas de Booking', icon: 'storefront' },
    { value: 'notifications', label: 'Notificaciones & Alertas', icon: 'notifications_active' },
    { value: 'banks', label: 'Cuentas Bancarias (SPEI)', icon: 'account_balance' },
    { value: 'database', label: 'Base de Datos & Respaldo', icon: 'database' }
  ];

  setTab(tabId: string): void {
    this.activeTab.set(tabId as SettingsTab);
  }

  onSaveSettings(): void {
    this.mockData.updateSettings(this.mockData.settings());
    alert('Configuración guardada exitosamente.');
  }

  onSaveBankAccount(account: any): void {
    this.mockData.addBankReceivingAccount(account);
    this.isAddBankModalOpen.set(false);
  }

  onDeleteBankAccount(accountId: string): void {
    this.mockData.deleteBankReceivingAccount(accountId);
  }

  onExportBackup(): void {
    const data = {
      agency: this.mockData.settings(),
      users: this.mockData.users(),
      clients: this.mockData.clients(),
      groups: this.mockData.groups(),
      events: this.mockData.events(),
      quotes: this.mockData.quotes(),
      tasks: this.mockData.tasks(),
      files: this.mockData.files(),
      financeTransactions: this.mockData.financeTransactions(),
      auditLogs: this.mockData.auditLogs(),
      exportDate: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acordex_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onConfirmResetData(): void {
    this.isResetModalOpen.set(false);
    this.mockData.resetAllMockData();
  }

  onLogout(): void {
    alert('Sesión administrativa cerrada. Redirigiendo a inicio.');
  }
}
