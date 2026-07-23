import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { Quote, QuoteState, PaymentStatus } from '../../core/models/admin.models';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display-xl text-2xl font-black text-on-surface">Panel de Cotizaciones</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
              Pipeline 10 Estados
            </span>
          </div>
          <p class="text-xs text-outline mt-1">Gestión de propuestas, máquina de estados bidireccional y control de pago</p>
        </div>

        <div class="flex items-center gap-3">
          <button 
            (click)="viewMode.set('kanban')"
            [class]="viewMode() === 'kanban' ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'"
            class="px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span class="material-symbols-outlined text-lg">view_kanban</span> Kanban
          </button>
          <button 
            (click)="viewMode.set('table')"
            [class]="viewMode() === 'table' ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'"
            class="px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span class="material-symbols-outlined text-lg">table_rows</span> Tabla
          </button>

          <button 
            (click)="openCreateModal()"
            class="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-lg">add_circle</span> Nueva Cotización
          </button>
        </div>
      </div>

      <!-- Financial Restrictions Warning Banner for Admin Role -->
      @if (roleService.activeRole() === 'administrador') {
        <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <span class="material-symbols-outlined text-xl text-amber-400">visibility_off</span>
          <div>
            <span class="font-bold">Modo Administrador Operativo:</span> Los márgenes de ganancia internos y desglose de utilidades están ocultos por permisos de rol.
          </div>
        </div>
      }

      <!-- KANBAN VIEW -->
      @if (viewMode() === 'kanban') {
        <div class="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          @for (state of allStates; track state) {
            <div class="w-80 shrink-0 bg-surface-container/70 rounded-2xl p-4 border border-outline-variant/30 flex flex-col max-h-[750px]">
              
              <!-- Column Header -->
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-outline-variant/20">
                <span class="text-xs font-bold text-on-surface flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  {{ state }}
                </span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-bright text-primary">
                  {{ getQuotesByState(state).length }}
                </span>
              </div>

              <!-- Cards List -->
              <div class="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
                @for (q of getQuotesByState(state); track q.id) {
                  <div class="p-4 rounded-xl bg-surface-container-high border border-outline-variant/30 hover:border-primary/50 transition-all shadow-md group relative">
                    
                    <div class="flex items-center justify-between text-[11px] mb-2">
                      <span class="font-bold text-primary">{{ q.id }}</span>
                      <span [class]="getPaymentStatusBadgeClass(q.paymentStatus)" class="px-2 py-0.5 rounded font-bold border">
                        {{ q.paymentStatus }}
                      </span>
                    </div>

                    <h4 class="text-sm font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer" (click)="openDetailModal(q)">
                      {{ q.groupName }}
                    </h4>
                    <p class="text-xs text-outline mt-0.5">{{ q.clientCompany }} ({{ q.clientName }})</p>

                    <div class="mt-3 pt-2.5 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                      <div>
                        <span class="text-[10px] text-outline block">Monto Propuesto</span>
                        @if (roleService.canViewFinances()) {
                          <span class="font-black text-on-surface">&#36;{{ q.totalAmount | number:'1.0-0' }} MXN</span>
                        } @else {
                          <span class="font-bold text-on-surface">Confidencial</span>
                        }
                      </div>

                      <button 
                        (click)="openDetailModal(q)"
                        class="px-2.5 py-1 rounded-lg bg-surface-bright hover:bg-primary hover:text-on-primary text-on-surface text-[11px] font-bold transition-all"
                      >
                        Detalle
                      </button>
                    </div>

                    <!-- BIDIRECTIONAL STATE CONTROLS -->
                    <div class="mt-3 flex items-center justify-between bg-surface-container/80 p-1.5 rounded-lg border border-outline-variant/20 text-[10px]">
                      <button 
                        [disabled]="isFirstState(q.state)"
                        (click)="moveState(q, -1)"
                        class="px-2 py-0.5 rounded bg-surface-bright hover:bg-primary/20 text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-0.5 font-bold"
                        title="Retroceder estado"
                      >
                        <span class="material-symbols-outlined text-xs">arrow_back</span> Anterior
                      </button>

                      <span class="font-semibold text-outline text-[10px]">Estado</span>

                      <button 
                        [disabled]="isLastState(q.state)"
                        (click)="moveState(q, 1)"
                        class="px-2 py-0.5 rounded bg-primary/20 text-primary hover:bg-primary hover:text-on-primary disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-0.5 font-bold"
                        title="Avanzar estado"
                      >
                        Siguiente <span class="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>

                  </div>
                }
              </div>

            </div>
          }
        </div>
      } @else {
        <!-- TABLE VIEW -->
        <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="border-b border-outline-variant/30 text-xs font-bold text-outline uppercase tracking-wider">
                  <th class="pb-3 px-3">ID</th>
                  <th class="pb-3 px-3">Cliente / Empresa</th>
                  <th class="pb-3 px-3">Banda / Talento</th>
                  <th class="pb-3 px-3">Fecha Propuesta</th>
                  <th class="pb-3 px-3">Monto Propuesto</th>
                  <th class="pb-3 px-3">Estado Pipeline</th>
                  <th class="pb-3 px-3">Estado de Pago</th>
                  <th class="pb-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/20">
                @for (q of mockData.quotes(); track q.id) {
                  <tr class="hover:bg-surface-container-high/50 transition-colors">
                    <td class="py-3.5 px-3 font-bold text-primary">{{ q.id }}</td>
                    <td class="py-3.5 px-3 font-semibold text-on-surface">
                      {{ q.clientCompany }}
                      <span class="text-xs text-outline block">{{ q.clientName }}</span>
                    </td>
                    <td class="py-3.5 px-3 text-on-surface font-medium">{{ q.groupName }}</td>
                    <td class="py-3.5 px-3 text-outline text-xs">{{ q.proposedDate }} ({{ q.city }})</td>
                    <td class="py-3.5 px-3 font-bold text-on-surface">
                      @if (roleService.canViewFinances()) {
                        &#36;{{ q.totalAmount | number:'1.0-0' }} MXN
                      } @else {
                        <span class="text-outline text-xs">Reservado</span>
                      }
                    </td>
                    <td class="py-3.5 px-3">
                      <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {{ q.state }}
                      </span>
                    </td>
                    <td class="py-3.5 px-3">
                      <span [class]="getPaymentStatusBadgeClass(q.paymentStatus)" class="px-2.5 py-1 rounded-lg text-xs font-bold border">
                        {{ q.paymentStatus }}
                      </span>
                    </td>
                    <td class="py-3.5 px-3 text-right">
                      <button 
                        (click)="openDetailModal(q)"
                        class="px-3 py-1.5 rounded-xl bg-primary/20 text-primary hover:bg-primary hover:text-on-primary font-bold text-xs transition-all"
                      >
                        Ver Detalle / PDF
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- DETAIL MODAL WITH INDEPENDENT PAYMENT STATUS SELECTOR & MOCK PDF GENERATOR -->
      @if (selectedQuote()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-surface-container p-6 sm:p-8 rounded-3xl border border-outline-variant/30 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 shadow-2xl">
            
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    {{ selectedQuote()?.id }}
                  </span>
                  <h3 class="text-xl font-bold text-on-surface">Detalle de Cotización</h3>
                </div>
                <p class="text-xs text-outline mt-0.5">Generación de propuesta y control contractual</p>
              </div>

              <button (click)="selectedQuote.set(null)" class="text-outline hover:text-on-surface p-1 rounded-xl bg-surface-container-high">
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <!-- Client & Event Specs -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container-high p-4 rounded-2xl border border-outline-variant/20 text-xs">
              <div>
                <span class="text-outline font-medium">Cliente:</span>
                <p class="text-sm font-bold text-on-surface">{{ selectedQuote()?.clientName }}</p>
                <p class="text-outline">{{ selectedQuote()?.clientCompany }} ({{ selectedQuote()?.clientEmail }})</p>
              </div>

              <div>
                <span class="text-outline font-medium">Talento & Recinto:</span>
                <p class="text-sm font-bold text-primary">{{ selectedQuote()?.groupName }}</p>
                <p class="text-on-surface">{{ selectedQuote()?.venue }}, {{ selectedQuote()?.city }}</p>
              </div>
            </div>

            <!-- INDEPENDENT PAYMENT STATUS SELECTOR (CRITICAL REQUIREMENT) -->
            <div class="p-4 rounded-2xl bg-surface-container-highest border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span class="text-xs font-bold text-primary uppercase tracking-wider block">Estado de Pago Independiente</span>
                <p class="text-xs text-outline mt-0.5">Transiciona el estatus financiero sin cambiar el pipeline operativo</p>
              </div>

              <div class="flex items-center gap-2">
                <button 
                  (click)="updatePaymentStatus('Pendiente')"
                  [class]="selectedQuote()?.paymentStatus === 'Pendiente' ? 'bg-amber-500 text-black font-bold ring-2 ring-amber-400' : 'bg-surface-bright text-outline'"
                  class="px-3 py-1.5 rounded-xl text-xs transition-all"
                >
                  Pendiente
                </button>
                <button 
                  (click)="updatePaymentStatus('Anticipo 50%')"
                  [class]="selectedQuote()?.paymentStatus === 'Anticipo 50%' ? 'bg-blue-500 text-white font-bold ring-2 ring-blue-400' : 'bg-surface-bright text-outline'"
                  class="px-3 py-1.5 rounded-xl text-xs transition-all"
                >
                  Anticipo 50%
                </button>
                <button 
                  (click)="updatePaymentStatus('Pago Confirmado 100%')"
                  [class]="selectedQuote()?.paymentStatus === 'Pago Confirmado 100%' ? 'bg-emerald-500 text-black font-bold ring-2 ring-emerald-400' : 'bg-surface-bright text-outline'"
                  class="px-3 py-1.5 rounded-xl text-xs transition-all"
                >
                  Confirmado 100%
                </button>
              </div>
            </div>

            <!-- Financial breakdown (Encargado vs Admin visibility) -->
            @if (roleService.canViewFinances()) {
              <div class="grid grid-cols-2 gap-4 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30">
                <div>
                  <span class="text-xs text-outline font-medium">Monto Total de Propuesta:</span>
                  <p class="text-lg font-black text-on-surface">&#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN</p>
                </div>
                <div>
                  <span class="text-xs text-emerald-400 font-medium">Margen Estimado Disquera (25%):</span>
                  <p class="text-lg font-black text-emerald-400">&#36;{{ selectedQuote()?.marginAmount | number:'1.0-0' }} MXN</p>
                </div>
              </div>
            }

            <!-- MOCK PDF CONTRACT EDITABLE PREVIEW -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-primary text-base">description</span>
                  Previsualizador / Generador de Contrato PDF (Mock)
                </span>
                <button 
                  (click)="downloadMockPdf()"
                  class="px-3 py-1 rounded-xl bg-primary text-on-primary font-bold text-xs hover:scale-105 transition-all flex items-center gap-1"
                >
                  <span class="material-symbols-outlined text-sm">download</span> Descargar PDF
                </button>
              </div>

              <div class="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 font-mono text-xs text-on-surface/90 space-y-2">
                <div class="text-center pb-2 border-b border-outline-variant/30">
                  <p class="font-bold text-primary">CONTRATO DE PRESTACIÓN DE SERVICIOS MUSICALES</p>
                  <p class="text-[10px] text-outline">FOLIO: {{ selectedQuote()?.id }} | ACORDEX RECORDS</p>
                </div>

                <p><strong>REUNIDOS:</strong> De una parte, ACORDEX RECORDS SA DE CV y de otra {{ selectedQuote()?.clientName }} en representación de {{ selectedQuote()?.clientCompany }}.</p>
                <p><strong>OBJETO:</strong> Presentación artística de <u>{{ selectedQuote()?.groupName }}</u> en {{ selectedQuote()?.venue }} el día {{ selectedQuote()?.proposedDate }}.</p>
                <p><strong>TÉRMINOS Y CONDICIONES:</strong> {{ selectedQuote()?.terms }}</p>
                <p><strong>ESTADO DE PAGO ACTUAL:</strong> {{ selectedQuote()?.paymentStatus }}</p>
              </div>
            </div>

            <!-- Footer actions -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <button 
                (click)="selectedQuote.set(null)"
                class="px-5 py-2.5 rounded-xl bg-surface-bright text-on-surface font-semibold text-xs"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      }

      <!-- CREATE NEW QUOTE MODAL -->
      @if (isCreating()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-surface-container p-6 sm:p-8 rounded-3xl border border-outline-variant/30 max-w-xl w-full space-y-5 shadow-2xl">
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 class="text-lg font-bold text-on-surface">Crear Nueva Cotización</h3>
              <button (click)="isCreating.set(false)" class="text-outline hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="space-y-4 text-xs">
              <div>
                <label class="block text-outline font-medium mb-1">Nombre del Cliente</label>
                <input [(ngModel)]="newForm.clientName" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" placeholder="Ej. Roberto Gómez" />
              </div>

              <div>
                <label class="block text-outline font-medium mb-1">Empresa / Organizador</label>
                <input [(ngModel)]="newForm.clientCompany" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" placeholder="Ej. Espectáculos del Norte" />
              </div>

              <div>
                <label class="block text-outline font-medium mb-1">Grupo / Talento</label>
                <select [(ngModel)]="newForm.groupName" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface">
                  @for (grp of mockData.groups(); track grp.id) {
                    <option [value]="grp.name">{{ grp.name }} ({{ grp.disqueraType }})</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-outline font-medium mb-1">Fecha Propuesta</label>
                  <input [(ngModel)]="newForm.proposedDate" type="date" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" />
                </div>
                <div>
                  <label class="block text-outline font-medium mb-1">Ciudad</label>
                  <input [(ngModel)]="newForm.city" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" placeholder="Ej. Monterrey, NL" />
                </div>
              </div>

              <div>
                <label class="block text-outline font-medium mb-1">Recinto / Venue</label>
                <input [(ngModel)]="newForm.venue" type="text" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" placeholder="Ej. Arena Monterrey" />
              </div>

              <div>
                <label class="block text-outline font-medium mb-1">Monto Total (MXN)</label>
                <input [(ngModel)]="newForm.totalAmount" type="number" class="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-on-surface" placeholder="350000" />
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
              <button (click)="isCreating.set(false)" class="px-4 py-2 rounded-xl bg-surface-bright text-on-surface text-xs font-semibold">Cancelar</button>
              <button (click)="saveNewQuote()" class="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold">Guardar Cotización</button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class QuotesComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  viewMode = signal<'kanban' | 'table'>('kanban');
  selectedQuote = signal<Quote | null>(null);
  isCreating = signal(false);

  readonly allStates: QuoteState[] = [
    'En revisión',
    'Propuesta enviada',
    'Negociación',
    'Aceptada',
    'Contrato firmado',
    'Pago pendiente',
    'Pago confirmado',
    'Evento realizado',
    'Finalizada',
    'Cancelada'
  ];

  newForm = {
    clientName: '',
    clientCompany: '',
    clientEmail: 'cliente@ejemplo.com',
    groupName: 'Los Elegantes del Norte',
    proposedDate: '2026-09-15',
    venue: '',
    city: 'Monterrey, NL',
    totalAmount: 300000,
    terms: '50% de anticipo al firmar contrato.'
  };

  getQuotesByState(state: QuoteState): Quote[] {
    return this.mockData.quotes().filter(q => q.state === state);
  }

  isFirstState(state: QuoteState): boolean {
    return this.allStates.indexOf(state) === 0;
  }

  isLastState(state: QuoteState): boolean {
    return this.allStates.indexOf(state) === this.allStates.length - 1;
  }

  moveState(quote: Quote, delta: number): void {
    const currentIndex = this.allStates.indexOf(quote.state);
    const newIndex = currentIndex + delta;
    if (newIndex >= 0 && newIndex < this.allStates.length) {
      const newState = this.allStates[newIndex];
      this.mockData.updateQuoteState(quote.id, newState);
      if (this.selectedQuote()?.id === quote.id) {
        this.selectedQuote.update(q => q ? { ...q, state: newState } : null);
      }
    }
  }

  updatePaymentStatus(newStatus: PaymentStatus): void {
    const current = this.selectedQuote();
    if (current) {
      this.mockData.updateQuotePaymentStatus(current.id, newStatus);
      this.selectedQuote.set({ ...current, paymentStatus: newStatus });
    }
  }

  getPaymentStatusBadgeClass(status: PaymentStatus): string {
    switch (status) {
      case 'Pago Confirmado 100%': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Anticipo 50%': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Pendiente': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-surface-bright text-outline';
    }
  }

  openDetailModal(q: Quote): void {
    this.selectedQuote.set(q);
  }

  openCreateModal(): void {
    this.isCreating.set(true);
  }

  saveNewQuote(): void {
    if (!this.newForm.clientName || !this.newForm.venue) return;
    this.mockData.addQuote({
      clientName: this.newForm.clientName,
      clientCompany: this.newForm.clientCompany || 'Cliente Directo',
      clientEmail: this.newForm.clientEmail,
      groupName: this.newForm.groupName,
      proposedDate: this.newForm.proposedDate,
      venue: this.newForm.venue,
      city: this.newForm.city,
      totalAmount: Number(this.newForm.totalAmount),
      marginAmount: Number(this.newForm.totalAmount) * 0.25,
      state: 'En revisión',
      paymentStatus: 'Pendiente',
      terms: this.newForm.terms
    });
    this.isCreating.set(false);
  }

  downloadMockPdf(): void {
    const id = this.selectedQuote()?.id || 'COT-000';
    alert('Simulación de Descarga: Se generó el archivo contrato_' + id + '.pdf correctamente en tu equipo.');
  }
}
