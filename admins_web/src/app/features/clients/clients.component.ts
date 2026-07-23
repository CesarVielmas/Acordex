import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ClientItem } from '../../core/models/admin.models';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display-xl text-2xl font-black text-on-surface">Directorio de Clientes & CRM</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
              Organizadores Recurrentes
            </span>
          </div>
          <p class="text-xs text-outline mt-1">Historial de cotizaciones por cliente y despacho de ofertas especiales</p>
        </div>
      </div>

      <!-- CLIENT CARDS -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (cli of mockData.clients(); track cli.id) {
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 hover:border-primary/50 transition-all duration-300 shadow-xl space-y-4 flex flex-col justify-between group">
            
            <div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-primary">{{ cli.id }}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {{ cli.status }}
                </span>
              </div>

              <div class="mt-3">
                <h3 class="text-base font-bold text-on-surface group-hover:text-primary transition-colors">{{ cli.name }}</h3>
                <p class="text-xs text-outline font-medium">{{ cli.company }}</p>
              </div>

              <div class="mt-3 space-y-1 text-xs text-outline">
                <p class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">mail</span> {{ cli.email }}</p>
                <p class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">call</span> {{ cli.phone }}</p>
              </div>

              <div class="mt-4 p-3 rounded-2xl bg-surface-container-high grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <span class="text-[10px] text-outline font-bold uppercase block">Eventos</span>
                  <span class="font-black text-on-surface text-sm">{{ cli.totalEvents }} Realizados</span>
                </div>
                <div>
                  <span class="text-[10px] text-outline font-bold uppercase block">Inversión Acumulada</span>
                  @if (roleService.canViewFinances()) {
                    <span class="font-black text-emerald-400 text-sm">&#36;{{ cli.totalSpent | number:'1.0-0' }}</span>
                  } @else {
                    <span class="font-bold text-outline text-xs">Confidencial</span>
                  }
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="pt-4 border-t border-outline-variant/20 flex gap-2">
              <button 
                (click)="selectedClient.set(cli)"
                class="flex-1 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold text-xs transition-all"
              >
                Historial
              </button>
              <button 
                (click)="openOfferModal(cli)"
                class="flex-1 py-2 rounded-xl bg-primary text-on-primary hover:scale-105 font-bold text-xs transition-all shadow-md"
              >
                Enviar Oferta
              </button>
            </div>

          </div>
        }
      </div>

      <!-- CLIENT HISTORY MODAL -->
      @if (selectedClient()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-surface-container p-6 sm:p-8 rounded-3xl border border-outline-variant/30 max-w-xl w-full space-y-5 shadow-2xl">
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div>
                <h3 class="text-lg font-bold text-on-surface">{{ selectedClient()?.name }}</h3>
                <p class="text-xs text-outline">{{ selectedClient()?.company }}</p>
              </div>
              <button (click)="selectedClient.set(null)" class="text-outline hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <h4 class="font-bold text-on-surface uppercase tracking-wider text-[11px]">Notas de Servicio</h4>
              <p class="p-3 rounded-xl bg-surface-container-high text-on-surface border border-outline-variant/20">
                {{ selectedClient()?.notes }}
              </p>

              <h4 class="font-bold text-on-surface uppercase tracking-wider text-[11px] pt-2">Cotizaciones Históricas</h4>
              <div class="space-y-2">
                @for (q of getClientQuotes(selectedClient()?.name || ''); track q.id) {
                  <div class="p-3 rounded-xl bg-surface-container-high flex items-center justify-between">
                    <div>
                      <span class="font-bold text-primary">{{ q.id }}</span>
                      <span class="text-on-surface ml-2 font-medium">{{ q.groupName }}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {{ q.state }}
                    </span>
                  </div>
                }
              </div>
            </div>

            <div class="flex justify-end pt-3 border-t border-outline-variant/30">
              <button (click)="selectedClient.set(null)" class="px-4 py-2 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- SPECIAL OFFER DISPATCH MODAL -->
      @if (offerClientTarget()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-surface-container p-6 rounded-3xl border border-primary/40 max-w-md w-full space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 class="text-base font-bold text-on-surface">Enviar Oferta Especial CRM</h3>
              <button (click)="offerClientTarget.set(null)" class="text-outline hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <p class="text-outline">Para: <strong class="text-on-surface">{{ offerClientTarget()?.name }}</strong> ({{ offerClientTarget()?.email }})</p>

              <div>
                <label class="block text-outline font-medium mb-1">Porcentaje de Descuento Especial</label>
                <select [(ngModel)]="offerForm.discountPercent" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface font-bold text-primary">
                  <option [value]="5">5% Descuento Cliente Frecuente</option>
                  <option [value]="10">10% Descuento Promoción Temporada</option>
                  <option [value]="15">15% Descuento Paquete 2 Fechas</option>
                </select>
              </div>

              <div>
                <label class="block text-outline font-medium mb-1">Detalle de la Propuesta / Mensaje Custom</label>
                <textarea [(ngModel)]="offerForm.details" rows="3" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" placeholder="Escribe los detalles de la oferta especial..."></textarea>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button (click)="offerClientTarget.set(null)" class="px-4 py-2 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
              <button (click)="dispatchOffer()" class="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold">Simular Envío</button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class ClientsComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  selectedClient = signal<ClientItem | null>(null);
  offerClientTarget = signal<ClientItem | null>(null);

  offerForm = {
    discountPercent: 10,
    details: 'Propuesta preferencial para contratación de Banda La Imperial en paquete de fin de semana.'
  };

  getClientQuotes(clientName: string) {
    return this.mockData.quotes().filter(q => q.clientName === clientName);
  }

  openOfferModal(cli: ClientItem): void {
    this.offerClientTarget.set(cli);
  }

  dispatchOffer(): void {
    const target = this.offerClientTarget();
    if (target) {
      this.mockData.sendSpecialOfferToClient(target.id, Number(this.offerForm.discountPercent), this.offerForm.details);
      alert(`Oferta enviada con éxito a ${target.email}`);
      this.offerClientTarget.set(null);
    }
  }
}
