import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ClientItem } from '../../core/models/admin.models';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { TabPillsComponent, TabPillItem } from '../../shared/ui/tab-pills/tab-pills.component';

import { calculateClientsKPIs } from './client-metrics';

import { ClientsKpisComponent } from './components/clients-kpis.component';
import { ClientsTabDirectoryComponent } from './components/clients-tab-directory.component';
import { ClientsTabRankingComponent } from './components/clients-tab-ranking.component';
import { ClientsTabInteractionsComponent } from './components/clients-tab-interactions.component';
import { ClientsTabOffersComponent } from './components/clients-tab-offers.component';

import { ModalClientEditorComponent } from './modals/modal-client-editor.component';
import { ModalClientDetailComponent } from './modals/modal-client-detail.component';
import { ModalSendOfferComponent } from './modals/modal-send-offer.component';

export type ClientsTab = 'directory' | 'ranking' | 'interactions' | 'offers';

/**
 * Módulo de Gestión de Clientes & CRM de Acordex.
 *
 * Administra las relaciones comerciales con Empresarios de Palenques,
 * Patronatos de Ferias, Promotores de Bailes, Particulares y Gobiernos.
 */
@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    TabPillsComponent,
    ClientsKpisComponent,
    ClientsTabDirectoryComponent,
    ClientsTabRankingComponent,
    ClientsTabInteractionsComponent,
    ClientsTabOffersComponent,
    ModalClientEditorComponent,
    ModalClientDetailComponent,
    ModalSendOfferComponent
  ],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-fade-in pb-12">

      <!-- ─── ENCABEZADO PRINCIPAL ─── -->
      <div class="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#1A1A1A] via-[#161616] to-[#121212] backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-xl sm:text-2xl font-black text-on-surface tracking-tight font-['Epilogue']">Cartera Comercial & Gestión CRM</h1>
            <app-badge label="Inteligencia de Cuentas" variant="primary" />
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30 shadow-sm">
              Operación Comercial Conectada
            </span>
          </div>
          <p class="text-xs text-outline mt-1 max-w-2xl leading-relaxed">
            Directorio consolidado de empresarios de palenques, comités de ferias regionales, promotores de espectáculos y contratantes particulares con scoring comercial y trazabilidad de cotizaciones reales.
          </p>
        </div>

        <!-- Botones de Acción -->
        <div class="relative z-10 flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            (click)="printClients()"
            class="px-3.5 py-2.5 rounded-2xl bg-[#202020] hover:bg-[#282828] border border-white/10 text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-base">print</span>
            Imprimir
          </button>

          <button
            type="button"
            (click)="openCreateModal()"
            class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-on-primary font-black text-xs shadow-lg shadow-primary/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-lg">person_add</span>
            Nuevo Cliente
          </button>
        </div>
      </div>

      <!-- ─── KPIS SUPERIORES ─── -->
      <app-clients-kpis [kpis]="clientsKPIs()" />

      <!-- ─── NAVEGACIÓN DE PESTAÑAS ─── -->
      <div class="border-b border-white/10 pb-2">
        <app-tab-pills
          [tabs]="tabOptions"
          [active]="activeTab()"
          (change)="setTab($event)"
        />
      </div>

      <!-- ─── CONTENIDO DE VISTAS ─── -->

      <!-- 1. DIRECTORIO DE CLIENTES -->
      @if (activeTab() === 'directory') {
        <app-clients-tab-directory
          [clients]="mockData.clients()"
          (openDetail)="onOpenDetail($event)"
          (sendOffer)="onOpenSendOffer($event)"
          (editClient)="onEditClient($event)"
        />
      }

      <!-- 2. RANKING DE CLIENTES TOP -->
      @if (activeTab() === 'ranking') {
        <app-clients-tab-ranking
          [clients]="mockData.clients()"
          (openDetail)="onOpenDetail($event)"
        />
      }

      <!-- 3. BITÁCORA DE SEGUIMIENTO -->
      @if (activeTab() === 'interactions') {
        <app-clients-tab-interactions
          [clients]="mockData.clients()"
          (addInteraction)="onAddInteraction($event)"
        />
      }

      <!-- 4. CENTRO DE OFERTAS Y PROMOCIONES -->
      @if (activeTab() === 'offers') {
        <app-clients-tab-offers
          [clients]="mockData.clients()"
          (sendOffer)="onOpenSendOffer($event)"
        />
      }

      <!-- ─── MODALES INTERACTIVOS ─── -->

      <!-- Modal 1: Editor de Cliente -->
      @if (isEditorOpen()) {
        <app-modal-client-editor
          [clientToEdit]="clientBeingEdited()"
          (saved)="onSaveClient($event)"
          (closed)="closeEditorModal()"
        />
      }

      <!-- Modal 2: Expediente 360° del Cliente -->
      @if (selectedClientForDetail()) {
        <app-modal-client-detail
          [client]="selectedClientForDetail()!"
          [allQuotes]="mockData.quotes()"
          (closed)="selectedClientForDetail.set(null)"
          (edit)="onEditFromDetail($event)"
          (delete)="onDeleteClient($event)"
          (sendOffer)="onOpenSendOffer($event)"
          (addInteraction)="onAddInteraction($event)"
        />
      }

      <!-- Modal 3: Despacho de Oferta Especial -->
      @if (selectedClientForOffer()) {
        <app-modal-send-offer
          [client]="selectedClientForOffer()!"
          [groups]="mockData.groups()"
          (sent)="onDispatchOffer($event)"
          (closed)="selectedClientForOffer.set(null)"
        />
      }

    </div>
  `
})
export class ClientsComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  activeTab = signal<ClientsTab>('directory');

  // Modales
  isEditorOpen = signal(false);
  clientBeingEdited = signal<ClientItem | null>(null);
  selectedClientForDetail = signal<ClientItem | null>(null);
  selectedClientForOffer = signal<ClientItem | null>(null);

  readonly tabOptions: TabPillItem[] = [
    { value: 'directory', label: 'Directorio de Cuentas & CRM', icon: 'contacts' },
    { value: 'ranking', label: 'Ranking de Facturación Top Clientes', icon: 'leaderboard' },
    { value: 'interactions', label: 'Bitácora de Interacciones & Citas', icon: 'chat' },
    { value: 'offers', label: 'Propuestas Preferenciales & Fidelización', icon: 'local_offer' }
  ];

  setTab(tabId: string): void {
    this.activeTab.set(tabId as ClientsTab);
  }

  clientsKPIs = computed(() => {
    return calculateClientsKPIs(this.mockData.clients());
  });

  // Operaciones de Modales
  openCreateModal(): void {
    this.clientBeingEdited.set(null);
    this.isEditorOpen.set(true);
  }

  closeEditorModal(): void {
    this.isEditorOpen.set(false);
    this.clientBeingEdited.set(null);
  }

  onOpenDetail(client: ClientItem): void {
    this.selectedClientForDetail.set(client);
  }

  onEditClient(client: ClientItem): void {
    this.clientBeingEdited.set(client);
    this.isEditorOpen.set(true);
  }

  onEditFromDetail(client: ClientItem): void {
    this.selectedClientForDetail.set(null);
    this.clientBeingEdited.set(client);
    this.isEditorOpen.set(true);
  }

  onOpenSendOffer(client: ClientItem): void {
    this.selectedClientForOffer.set(client);
  }

  onSaveClient(client: ClientItem): void {
    if (this.clientBeingEdited()) {
      this.mockData.updateClient(client);
    } else {
      this.mockData.addClient(client);
    }
    this.closeEditorModal();
  }

  onDeleteClient(clientId: string): void {
    this.mockData.deleteClient(clientId);
    this.selectedClientForDetail.set(null);
  }

  onAddInteraction(data: { clientId: string; type: any; summary: string; authorName: string }): void {
    this.mockData.addClientInteraction(data.clientId, data.type, data.summary, data.authorName);
    // Refrescar modal de detalle si está abierto
    const current = this.selectedClientForDetail();
    if (current && current.id === data.clientId) {
      const updated = this.mockData.clients().find(c => c.id === data.clientId);
      if (updated) {
        this.selectedClientForDetail.set(updated);
      }
    }
  }

  onDispatchOffer(data: { clientId: string; discountPercent: number; details: string; suggestedGroupName?: string }): void {
    this.mockData.sendSpecialOfferToClient(data.clientId, data.discountPercent, data.details, data.suggestedGroupName);
    this.selectedClientForOffer.set(null);
  }

  printClients(): void {
    window.print();
  }
}
