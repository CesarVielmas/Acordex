import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ClientItem } from '../../core/models/admin.models';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { EntityCardComponent } from '../../shared/ui/entity-card/entity-card.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';
import { FormFieldComponent, FormFieldOption } from '../../shared/ui/form-field/form-field.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, EntityCardComponent, ModalShellComponent, FormFieldComponent],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="font-display-xl text-xl sm:text-2xl font-black text-on-surface">Directorio de Clientes & CRM</h1>
            <app-badge label="Organizadores Recurrentes" variant="primary" />
          </div>
          <p class="text-xs text-outline mt-1">Historial de cotizaciones por cliente y despacho de ofertas especiales</p>
        </div>
      </div>

      <!-- CLIENT CARDS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        @for (cli of mockData.clients(); track cli.id) {
          <app-entity-card [title]="cli.name" [subtitle]="cli.company" [hasVisual]="false">
            <ng-container card-badges>
              <app-badge [label]="cli.id" variant="neutral" />
              <app-badge [label]="cli.status" variant="success" />
            </ng-container>

            <div card-stats class="space-y-3">
              <div class="space-y-1 text-xs text-outline">
                <p class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">mail</span> <span class="truncate">{{ cli.email }}</span></p>
                <p class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">call</span> {{ cli.phone }}</p>
              </div>

              <div class="p-3 rounded-2xl bg-surface-container-high grid grid-cols-2 gap-2 text-center text-xs">
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

            <div card-footer class="pt-4 border-t border-outline-variant/20 flex gap-2">
              <button
                (click)="selectedClient.set(cli)"
                class="flex-1 py-2.5 min-h-11 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-bold text-xs transition-all"
              >
                Historial
              </button>
              <button
                (click)="openOfferModal(cli)"
                class="flex-1 py-2.5 min-h-11 rounded-xl bg-primary text-on-primary hover:scale-105 font-bold text-xs transition-all shadow-md"
              >
                Enviar Oferta
              </button>
            </div>
          </app-entity-card>
        }
      </div>

      <!-- CLIENT HISTORY MODAL -->
      @if (selectedClient(); as client) {
        <app-modal-shell
          [title]="client.name"
          [subtitle]="client.company"
          size="xl"
          [hasFooter]="true"
          (closed)="selectedClient.set(null)"
        >
          <div class="space-y-3 text-xs">
            <h4 class="font-bold text-on-surface uppercase tracking-wider text-[11px]">Notas de Servicio</h4>
            <p class="p-3 rounded-xl bg-surface-container-high text-on-surface border border-outline-variant/20">
              {{ client.notes }}
            </p>

            <h4 class="font-bold text-on-surface uppercase tracking-wider text-[11px] pt-2">Cotizaciones Históricas</h4>
            <div class="space-y-2">
              @for (q of getClientQuotes(client.name); track q.id) {
                <div class="p-3 rounded-xl bg-surface-container-high flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <span class="font-bold text-primary">{{ q.id }}</span>
                    <span class="text-on-surface ml-2 font-medium">{{ q.groupName }}</span>
                  </div>
                  <app-badge [label]="q.state" variant="primary" />
                </div>
              }
            </div>
          </div>

          <ng-container modal-footer>
            <button (click)="selectedClient.set(null)" class="px-4 py-2 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cerrar</button>
          </ng-container>
        </app-modal-shell>
      }

      <!-- SPECIAL OFFER DISPATCH MODAL -->
      @if (offerClientTarget(); as target) {
        <app-modal-shell
          title="Enviar Oferta Especial CRM"
          icon="local_offer"
          size="md"
          [hasFooter]="true"
          (closed)="offerClientTarget.set(null)"
        >
          <div class="space-y-3.5 text-xs">
            <p class="text-outline">Para: <strong class="text-on-surface">{{ target.name }}</strong> ({{ target.email }})</p>

            <app-form-field label="Porcentaje de Descuento Especial" type="select" [(value)]="offerForm.discountPercent" [options]="discountOptions" />
            <app-form-field label="Detalle de la Propuesta / Mensaje Custom" type="textarea" [(value)]="offerForm.details" placeholder="Escribe los detalles de la oferta especial..." />
          </div>

          <ng-container modal-footer>
            <button (click)="offerClientTarget.set(null)" class="px-4 py-2 min-h-11 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
            <button (click)="dispatchOffer()" class="px-5 py-2 min-h-11 rounded-xl bg-primary text-on-primary text-xs font-bold">Simular Envío</button>
          </ng-container>
        </app-modal-shell>
      }

    </div>
  `
})
export class ClientsComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  selectedClient = signal<ClientItem | null>(null);
  offerClientTarget = signal<ClientItem | null>(null);

  readonly discountOptions: FormFieldOption[] = [
    { label: '5% Descuento Cliente Frecuente', value: '5' },
    { label: '10% Descuento Promoción Temporada', value: '10' },
    { label: '15% Descuento Paquete 2 Fechas', value: '15' }
  ];

  offerForm = {
    discountPercent: '10',
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
