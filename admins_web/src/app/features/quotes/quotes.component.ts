import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { LayoutStateService } from '../../core/services/layout_state.service';
import { Quote, QuoteState, PaymentStatus } from '../../core/models/admin.models';
import { AccessRestrictedComponent } from '../../shared/ui/access-restricted/access-restricted.component';
import { KpiCardComponent } from '../../shared/ui/kpi-card/kpi-card.component';
import { TabPillsComponent, TabPillItem } from '../../shared/ui/tab-pills/tab-pills.component';
import { TableShellComponent } from '../../shared/ui/table-shell/table-shell.component';
import { ProgressBarComponent } from '../../shared/ui/progress-bar/progress-bar.component';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AccessRestrictedComponent,
    KpiCardComponent,
    TabPillsComponent,
    TableShellComponent,
    ProgressBarComponent,
    BadgeComponent
  ],
  template: `
    <div class="space-y-6 max-w-full">

      @if (roleService.activeRole() === 'usuario') {
        <!-- NEUTRAL ACCESS RESTRICTED SCREEN (NO ROLE EXPLANATIONS OR CAUSES) -->
        <app-access-restricted icon="lock" title="Acceso Restringido" message="Sección no disponible." [showBackLink]="true" />
      } @else {
        <!-- FULL COTIZACIONES MODULE FOR AUTHORIZED MANAGERS & ADMINISTRATORS -->

        <!-- TOP HEADER & VIEW TOGGLE (ULTRA MODERN GLASSMORPHISM) -->
        <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-surface-container-high/90 via-surface-container/80 to-surface-container-high/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div class="absolute -right-10 -top-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10">
            <div class="flex items-center gap-3 flex-wrap">
              <div class="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-inner shrink-0">
                <span class="material-symbols-outlined text-2xl">request_quote</span>
              </div>
              <div>
                <h1 class="font-display-xl text-xl sm:text-2xl lg:text-3xl font-black text-on-surface tracking-tight">Panel de Cotizaciones & Contrataciones Individuales</h1>
                <p class="text-xs text-outline mt-0.5">Gestión de contratación 1 a 1 por cliente y grupo musical, reserva de agenda y control de 14 estados comerciales</p>
              </div>
            </div>
          </div>

          <!-- View Mode Switcher: Kanban Vertical vs Tabla -->
          <div class="flex items-center gap-3 self-start md:self-auto relative z-10">
            <div class="p-1.5 rounded-2xl bg-surface-container-highest/60 border border-outline-variant/40 flex items-center gap-1.5 shadow-lg backdrop-blur-md">
              <button
                (click)="viewMode.set('kanban')"
                [class]="viewMode() === 'kanban' ? 'bg-primary text-on-primary font-bold shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'"
                class="px-4 py-2 min-h-11 rounded-xl text-xs flex items-center gap-2 transition-all duration-300"
              >
                <span class="material-symbols-outlined text-base">view_kanban</span> Kanban Vertical
              </button>
              <button
                (click)="viewMode.set('table')"
                [class]="viewMode() === 'table' ? 'bg-primary text-on-primary font-bold shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'"
                class="px-4 py-2 min-h-11 rounded-xl text-xs flex items-center gap-2 transition-all duration-300"
              >
                <span class="material-symbols-outlined text-base">table_rows</span> Vista Tabla
              </button>
            </div>
          </div>
        </div>

        <!-- KPI SUMMARY METRIC STRIP -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <app-kpi-card label="Tiempo Promedio Cierre" value="3.8 Días" icon="speed" colorVariant="primary" />
          <app-kpi-card label="Tasa de Conversión" value="78.5%" icon="trending_up" colorVariant="success" />
          <app-kpi-card label="Riders Auditados" value="100% OK" icon="fact_check" colorVariant="info" />
          @if (roleService.canViewFinances()) {
            <app-kpi-card
              label="Valuación Pipeline"
              [value]="'$' + (getTotalPipelineAmount() | number:'1.0-0')"
              icon="payments"
              colorVariant="secondary"
            />
          } @else {
            <app-kpi-card label="Aforo Acumulado" value="48,500 Asist." icon="groups" colorVariant="secondary" />
          }
        </div>

        <!-- QUICK FILTER PILLS & SEARCH BAR -->
        <div class="p-4 sm:p-5 rounded-3xl bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 shadow-lg space-y-3">

          <!-- State Filter Pills (14 States) -->
          <app-tab-pills [tabs]="stateFilterTabs()" [active]="stateFilter()" (change)="stateFilter.set($event)" />

          <!-- Search Input & Dropdowns -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-outline-variant/20">
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input
                [(ngModel)]="searchTerm"
                type="text"
                placeholder="Buscar por folio, cliente, empresa, grupo musical o ciudad..."
                class="w-full bg-surface-container-high/90 border border-outline-variant/30 rounded-2xl pl-10 pr-4 py-2.5 min-h-11 text-xs text-on-surface focus:outline-none focus:border-primary/60 transition-all shadow-inner"
              />
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <!-- Payment Filter Dropdown -->
              <div class="flex items-center gap-2 text-xs">
                <span class="text-outline font-semibold shrink-0">Estatus Pago:</span>
                <select
                  [(ngModel)]="paymentFilter"
                  class="bg-surface-container-high/90 border border-outline-variant/30 rounded-xl px-3.5 py-2 min-h-11 text-xs text-on-surface focus:outline-none focus:border-primary/60"
                >
                  <option value="Todos">Todos los Pagos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Anticipo 50%">Anticipo 50%</option>
                  <option value="Pago Confirmado 100%">Pago Confirmado 100%</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- KANBAN BOARD VIEW -->
        @if (viewMode() === 'kanban') {
          <div class="space-y-6">
            @for (state of getFilteredStates(); track state) {
              <div class="p-4 sm:p-6 rounded-3xl bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 shadow-xl space-y-5">

                <!-- State Header Banner -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/20 shadow-sm shrink-0"></span>
                    <h3 class="text-sm font-extrabold text-on-surface flex items-center gap-2 min-w-0 flex-wrap">
                      <span class="material-symbols-outlined text-primary text-base">{{ getStateIcon(state) }}</span>
                      {{ state }}
                      <span class="text-xs font-bold px-3 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm">
                        {{ getFilteredQuotesByState(state).length }} Cotizaciones
                      </span>
                    </h3>
                  </div>

                  @if (roleService.canViewFinances()) {
                    <span class="text-xs font-semibold text-outline shrink-0">
                      Subtotal del Estado: <strong class="text-emerald-400 font-black">&#36;{{ getStateSubtotal(state) | number:'1.0-0' }} MXN</strong>
                    </span>
                  } @else {
                    <span class="text-xs font-semibold text-purple-300 flex items-center gap-1 shrink-0">
                      <span class="material-symbols-outlined text-sm">groups</span> Aforo Acumulado: <strong class="text-purple-200 font-black">{{ getFilteredQuotesByState(state).length * 8500 | number:'1.0-0' }} Asistentes</strong>
                    </span>
                  }
                </div>

                <!-- Quote Cards Grid -->
                @if (getFilteredQuotesByState(state).length > 0) {
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    @for (q of getFilteredQuotesByState(state); track q.id) {
                      <div class="p-5 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 hover:border-primary/50 hover:shadow-xl transition-all duration-300 space-y-4 group relative border-l-4 border-l-primary">

                        <!-- Top Badge Bar -->
                        <div class="flex items-center justify-between gap-1.5 text-xs flex-wrap">
                          <button
                            (click)="copyFolio(q.id)"
                            class="font-black text-primary px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1"
                            title="Copiar folio"
                          >
                            {{ q.id }} <span class="material-symbols-outlined text-[10px]">content_copy</span>
                          </button>

                          <span class="px-2 py-0.5 rounded-md bg-surface-bright text-[10px] font-bold text-outline border border-outline-variant/20 flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-primary">person</span> Contrato 1 a 1
                          </span>

                          <span [class]="getPaymentStatusBadgeClass(q.paymentStatus, q)" class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1">
                            @if (q.state === 'Propuesta enviada' && (q.negotiationRound ?? 0) > 0) {
                              <span class="material-symbols-outlined text-[11px] text-amber-400">handshake</span>
                            }
                            {{ getPaymentStatusLabel(q) }}
                          </span>
                        </div>

                        <!-- COUPLED 1-TO-1 ARTIST & CLIENT CONTRACT INFORMATION -->
                        <div class="space-y-2">
                          <!-- Talent / Group Banner -->
                          <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-primary/20 text-primary font-black text-xs flex items-center justify-center shrink-0 border border-primary/30">
                              <span class="material-symbols-outlined text-sm">music_note</span>
                            </div>
                            <div class="overflow-hidden">
                              <span class="text-[9px] font-bold text-primary uppercase tracking-wider block">Grupo / Talento Solicitado</span>
                              <h4 class="text-xs font-black text-on-surface group-hover:text-primary transition-colors cursor-pointer truncate" (click)="openDetailModal(q)">
                                {{ q.groupName }}
                              </h4>
                            </div>
                          </div>

                          <!-- Client / Promoter Banner -->
                          <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-black text-xs flex items-center justify-center shrink-0 border border-blue-500/30">
                              <span class="material-symbols-outlined text-sm">badge</span>
                            </div>
                            <div class="overflow-hidden">
                              <span class="text-[9px] font-bold text-blue-400 uppercase tracking-wider block">Cliente / Contratante Único</span>
                              <p class="text-xs font-bold text-on-surface truncate">{{ q.clientName }}</p>
                              <p class="text-[10px] text-outline truncate">{{ q.clientCompany }}</p>
                            </div>
                          </div>

                          <!-- Venue & Date -->
                          <p class="text-[11px] text-outline pt-1 flex items-center gap-1 min-w-0">
                            <span class="material-symbols-outlined text-xs text-primary shrink-0">location_on</span> <span class="truncate">{{ q.venue }}, {{ q.city }} ({{ q.proposedDate }})</span>
                          </p>
                        </div>

                        <!-- State Progress Stepper (14 States) -->
                        <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20">
                          <app-progress-bar
                            label="Avance de Estado"
                            [valueLabel]="'Paso ' + (getStateIndex(q.state) + 1) + ' de ' + allStates.length"
                            [percent]="((getStateIndex(q.state) + 1) / allStates.length) * 100"
                            colorVariant="primary"
                          />
                        </div>

                        <!-- Proposal Amount (Financial) vs Operational Specs (Non-financial) -->
                        <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2 text-xs">
                          <div class="min-w-0">
                            @if (roleService.canViewFinances()) {
                              <span class="text-[10px] text-outline uppercase font-bold block">Monto Propuesto</span>
                              <span class="font-black text-on-surface text-base">&#36;{{ q.totalAmount | number:'1.0-0' }} MXN</span>
                            } @else {
                              <span class="text-[10px] text-purple-300 uppercase font-bold block flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">groups</span> Aforo Proyectado
                              </span>
                              <span class="font-bold text-on-surface text-xs">12,500 Asistentes</span>
                            }
                          </div>

                          <button
                            (click)="openDetailModal(q)"
                            class="px-3.5 py-1.5 min-h-11 rounded-xl bg-surface-bright hover:bg-primary hover:text-on-primary text-on-surface text-xs font-bold transition-all flex items-center gap-1 shadow-sm hover:scale-105 shrink-0"
                          >
                            <span class="material-symbols-outlined text-xs">visibility</span> Abrir Solicitud
                          </button>
                        </div>

                        <!-- BIDIRECTIONAL STATE CONTROLS -->
                        <div class="flex items-center justify-between bg-surface-container/90 p-2 rounded-xl border border-outline-variant/20 text-xs">
                          <button
                            [disabled]="isFirstState(q.state)"
                            (click)="moveState(q, -1)"
                            class="px-3 py-1 min-h-11 rounded-lg bg-surface-bright hover:bg-primary/20 text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 font-bold text-[11px]"
                            title="Retroceder estado"
                          >
                            <span class="material-symbols-outlined text-xs">arrow_back</span> Retroceder
                          </button>

                          <span class="font-semibold text-outline text-[10px] uppercase tracking-wider hidden sm:inline">Mover Estado</span>

                          <button
                            [disabled]="isLastState(q.state)"
                            (click)="moveState(q, 1)"
                            class="px-3 py-1 min-h-11 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-on-primary disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 font-bold text-[11px]"
                            title="Avanzar estado"
                          >
                            Avanzar <span class="material-symbols-outlined text-xs">arrow_forward</span>
                          </button>
                        </div>

                      </div>
                    }
                  </div>
                } @else {
                  <div class="py-5 text-center text-xs text-outline font-medium italic bg-surface-container-high/40 rounded-2xl border border-dashed border-outline-variant/20">
                    Sin cotizaciones en el estado "{{ state }}"
                  </div>
                }

              </div>
            }
          </div>
        } @else {
          <!-- TABLE VIEW -->
          <app-table-shell [isEmpty]="getFilteredQuotes().length === 0" emptyIcon="search_off" emptyMessage="No se encontraron cotizaciones con los filtros seleccionados.">

            <table desktop-table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-outline-variant/30 text-[11px] font-bold text-outline uppercase tracking-wider">
                  <th class="pb-3 px-3">Folio</th>
                  <th class="pb-3 px-3">Cliente Contratante</th>
                  <th class="pb-3 px-3">Talento Solicitado</th>
                  <th class="pb-3 px-3">Fecha & Recinto</th>
                  <th class="pb-3 px-3">
                    @if (roleService.canViewFinances()) { Monto Propuesto } @else { Aforo / Rider }
                  </th>
                  <th class="pb-3 px-3">Estado Pipeline</th>
                  <th class="pb-3 px-3">Estatus de Pago</th>
                  <th class="pb-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/20">
                @for (q of getFilteredQuotes(); track q.id) {
                  <tr class="hover:bg-surface-container-high/50 transition-colors">
                    <td class="py-3.5 px-3 font-bold text-primary whitespace-nowrap">{{ q.id }}</td>
                    <td class="py-3.5 px-3 font-semibold text-on-surface">
                      {{ q.clientName }}
                      <span class="text-[10px] text-outline block font-normal">{{ q.clientCompany }}</span>
                    </td>
                    <td class="py-3.5 px-3 text-on-surface font-bold whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-extrabold">
                        {{ q.groupName }}
                      </span>
                    </td>
                    <td class="py-3.5 px-3 text-outline text-xs">
                      {{ q.proposedDate }}
                      <span class="text-[10px] text-on-surface font-medium block">{{ q.venue }} ({{ q.city }})</span>
                    </td>
                    <td class="py-3.5 px-3 font-bold text-on-surface whitespace-nowrap">
                      @if (roleService.canViewFinances()) {
                        &#36;{{ q.totalAmount | number:'1.0-0' }} MXN
                      } @else {
                        <span class="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-[10px] font-bold">12.5k Aforo • Rider OK</span>
                      }
                    </td>
                    <td class="py-3.5 px-3 whitespace-nowrap">
                      <app-badge [label]="q.state" variant="primary" />
                    </td>
                    <td class="py-3.5 px-3 whitespace-nowrap">
                      <span [class]="getPaymentStatusBadgeClass(q.paymentStatus, q)" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 inline-flex">
                        @if (q.state === 'Propuesta enviada' && (q.negotiationRound ?? 0) > 0) {
                          <span class="material-symbols-outlined text-xs text-amber-400">handshake</span>
                        }
                        {{ getPaymentStatusLabel(q) }}
                      </span>
                    </td>
                    <td class="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        (click)="openDetailModal(q)"
                        class="px-3 py-1.5 min-h-11 rounded-xl bg-primary/20 text-primary hover:bg-primary hover:text-on-primary font-bold text-xs transition-all flex items-center gap-1 ml-auto"
                      >
                        <span class="material-symbols-outlined text-sm">visibility</span> Abrir Solicitud
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <div mobile-cards>
              @for (q of getFilteredQuotes(); track q.id) {
                <div class="p-4 space-y-3">
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-bold text-primary text-sm">{{ q.id }}</span>
                    <app-badge [label]="q.state" variant="primary" />
                  </div>

                  <div class="text-xs">
                    <p class="font-semibold text-on-surface">{{ q.clientName }} <span class="text-outline font-normal">— {{ q.clientCompany }}</span></p>
                    <p class="text-primary font-bold mt-1">{{ q.groupName }}</p>
                    <p class="text-outline mt-1">{{ q.proposedDate }} &middot; {{ q.venue }} ({{ q.city }})</p>
                  </div>

                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <span class="font-bold text-on-surface text-sm">
                      @if (roleService.canViewFinances()) {
                        &#36;{{ q.totalAmount | number:'1.0-0' }} MXN
                      } @else {
                        12.5k Aforo &middot; Rider OK
                      }
                    </span>
                    <span [class]="getPaymentStatusBadgeClass(q.paymentStatus, q)" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1">
                      {{ getPaymentStatusLabel(q) }}
                    </span>
                  </div>

                  <button
                    (click)="openDetailModal(q)"
                    class="w-full py-2.5 min-h-11 rounded-xl bg-primary/20 text-primary hover:bg-primary hover:text-on-primary font-bold text-xs transition-all flex items-center justify-center gap-1"
                  >
                    <span class="material-symbols-outlined text-sm">visibility</span> Abrir Solicitud
                  </button>
                </div>
              }
            </div>

          </app-table-shell>
        }

      }

    </div>
  `
})
export class QuotesComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);
  layoutState = inject(LayoutStateService);

  viewMode = signal<'kanban' | 'table'>('kanban');
  selectedQuote = signal<Quote | null>(null);

  modalTab = signal<'estado_actual' | 'solicitud' | 'cobranza' | 'contrato'>('estado_actual');

  searchTerm = signal('');
  stateFilter = signal('Todos');
  paymentFilter = signal('Todos');

  proposalSoundOption = signal<'cliente' | 'proveedor'>('proveedor');
  proposalSoundCost = signal<number>(15000);
  proposalViaticosCost = signal<number>(8500);
  proposalArtistFee = signal<number>(35000);
  proposalIncludeIva = signal<boolean>(false);

  getProposalSubtotal(): number {
    const sound = this.proposalSoundOption() === 'proveedor' ? (Number(this.proposalSoundCost()) || 0) : 0;
    const viaticos = Number(this.proposalViaticosCost()) || 0;
    const fee = Number(this.proposalArtistFee()) || 0;
    return fee + sound + viaticos;
  }

  getProposalIva(): number {
    return this.proposalIncludeIva() ? this.getProposalSubtotal() * 0.16 : 0;
  }

  getProposalTotal(): number {
    return this.getProposalSubtotal() + this.getProposalIva();
  }

  approveAndSendProposal(): void {
    const current = this.selectedQuote();
    if (!current) return;
    const total = this.getProposalTotal();
    const updates: Partial<Quote> = {
      totalAmount: total,
      state: 'Propuesta enviada',
      soundOption: this.proposalSoundOption(),
      soundCost: this.proposalSoundOption() === 'proveedor' ? (Number(this.proposalSoundCost()) || 0) : 0,
      viaticosCost: Number(this.proposalViaticosCost()) || 0,
      artistFee: Number(this.proposalArtistFee()) || 0,
      includeIva: this.proposalIncludeIva()
    };
    this.mockData.updateQuoteDetails(current.id, updates);
    this.selectedQuote.set({ ...current, ...updates });
  }

  constructor() {
    // When modal opens → hide header/sidebar via fullScreenModalActive (already wired in main-layout)
    effect(() => {
      const active = this.selectedQuote();
      this.layoutState.fullScreenModalActive.set(!!active);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = active ? 'hidden' : '';
      }
    });
  }

  readonly allStates: QuoteState[] = [
    'En revisión',
    'Propuesta enviada',
    'Negociación',
    'Aceptada',
    'Contrato en espera de firma',
    'Contrato firmado',
    'Cotización con Pagos Aplazados',
    'Pago pendiente',
    'Anticipo 50% recibido',
    'Logística & Soundcheck',
    'Pago confirmado',
    'En presentación',
    'Evento realizado',
    'Finalizada',
    'Cancelada con Imprevisto',
    'Imprevisto Enviado',
    'Cancelada'
  ];

  stateFilterTabs(): TabPillItem[] {
    return [
      { value: 'Todos', label: `Todas las 14 Etapas (${this.mockData.quotes().length})` },
      ...this.allStates.map(st => ({ value: st, label: st }))
    ];
  }

  getStateIcon(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'history_edu';
      case 'Propuesta enviada': return 'send';
      case 'Negociación': return 'handshake';
      case 'Aceptada': return 'check_circle';
      case 'Contrato en espera de firma': return 'edit_note';
      case 'Contrato firmado': return 'draw';
      case 'Cotización con Pagos Aplazados': return 'update';
      case 'Pago pendiente': return 'hourglass_empty';
      case 'Anticipo 50% recibido': return 'savings';
      case 'Logística & Soundcheck': return 'equalizer';
      case 'Pago confirmado': return 'verified';
      case 'En presentación': return 'graphic_eq';
      case 'Evento realizado': return 'theater_comedy';
      case 'Finalizada': return 'task_alt';
      case 'Cancelada con Imprevisto': return 'report_problem';
      case 'Imprevisto Enviado': return 'hourglass_top';
      case 'Cancelada': return 'cancel';
      default: return 'bookmark';
    }
  }

  getStatePhaseTitle(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'Fase 1: Evaluación Inicial & Revisión de Solicitud Pública';
      case 'Propuesta enviada': return 'Fase 1: Propuesta Comercial Enviada al Cliente';
      case 'Negociación': return 'Fase 2: Negociación Comercial & Ajuste de Cláusulas';
      case 'Aceptada': return 'Fase 2: Cotización Aceptada por el Cliente';
      case 'Contrato en espera de firma': return 'Fase 2: Contrato Enviado en Espera de Firma Digital del Cliente';
      case 'Contrato firmado': return 'Fase 4.5: Contrato Privado Firmado Digitalmente';
      case 'Cotización con Pagos Aplazados': return 'Fase 5.5: Cotización con Pagos Aplazados (En Reestructuración)';
      case 'Pago pendiente': return 'Fase 3: Pago de Anticipo 50% Pendiente de Recepción';
      case 'Anticipo 50% recibido': return 'Fase 3: Recepción Registrada de Anticipo del 50%';
      case 'Logística & Soundcheck': return 'Fase 4: Preparación Logística, Rider Técnico & Soundcheck';
      case 'Pago confirmado': return 'Fase 4: Verificación Financiera 100% & Reservas VIP';
      case 'En presentación': return 'Fase 4: Presentación Artística En Vivo En Escenario';
      case 'Evento realizado': return 'Fase 5: Conclusión de Show & Cierre Comercial de Evento';
      case 'Finalizada': return 'Fase 6: Cierre Definitivo de Cotización & Archivo Histórico';
      case 'Cancelada con Imprevisto': return 'Fase Excepcional: Cancelación por Imprevisto Grave';
      case 'Imprevisto Enviado': return 'Imprevisto: Propuesta de Resolución Enviada al Cliente';
      case 'Cancelada': return 'Cotización Cancelada o Inactiva';
      default: return 'Detalles de Cotización';
    }
  }

  getStateModalBorderClass(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'border-blue-500/50 shadow-blue-500/10';
      case 'Propuesta enviada': return 'border-cyan-500/50 shadow-cyan-500/10';
      case 'Negociación': return 'border-amber-500/50 shadow-amber-500/10';
      case 'Aceptada': return 'border-emerald-500/50 shadow-emerald-500/10';
      case 'Contrato en espera de firma': return 'border-purple-400/50 shadow-purple-400/10';
      case 'Contrato firmado': return 'border-purple-500/50 shadow-purple-500/10';
      case 'Cotización con Pagos Aplazados': return 'border-orange-500/50 shadow-orange-500/10';
      case 'Pago pendiente': return 'border-yellow-500/50 shadow-yellow-500/10';
      case 'Anticipo 50% recibido': return 'border-teal-500/50 shadow-teal-500/10';
      case 'Logística & Soundcheck': return 'border-orange-500/50 shadow-orange-500/10';
      case 'Pago confirmado': return 'border-emerald-400 shadow-emerald-500/20';
      case 'En presentación': return 'border-rose-500/50 shadow-rose-500/10';
      case 'Evento realizado': return 'border-indigo-500/50 shadow-indigo-500/10';
      case 'Finalizada': return 'border-slate-500/50 shadow-slate-500/10';
      case 'Cancelada con Imprevisto': return 'border-rose-600/50 shadow-rose-600/10';
      case 'Imprevisto Enviado': return 'border-cyan-500/50 shadow-cyan-500/10';
      case 'Cancelada': return 'border-red-500/50 shadow-red-500/10';
      default: return 'border-outline-variant/40';
    }
  }

  getStateBadgeIconBg(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Propuesta enviada': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Negociación': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Aceptada': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Contrato en espera de firma': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Contrato firmado': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Cotización con Pagos Aplazados': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Pago pendiente': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Anticipo 50% recibido': return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'Logística & Soundcheck': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Pago confirmado': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'En presentación': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Evento realizado': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Finalizada': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'Cancelada con Imprevisto': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Imprevisto Enviado': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'Cancelada': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  }

  getStateTextColor(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'text-blue-400';
      case 'Propuesta enviada': return 'text-cyan-400';
      case 'Negociación': return 'text-amber-400';
      case 'Aceptada': return 'text-emerald-400';
      case 'Contrato en espera de firma': return 'text-purple-300';
      case 'Contrato firmado': return 'text-purple-300';
      case 'Cotización con Pagos Aplazados': return 'text-orange-400';
      case 'Pago pendiente': return 'text-yellow-400';
      case 'Anticipo 50% recibido': return 'text-teal-300';
      case 'Logística & Soundcheck': return 'text-orange-300';
      case 'Pago confirmado': return 'text-emerald-300';
      case 'En presentación': return 'text-rose-300';
      case 'Evento realizado': return 'text-indigo-300';
      case 'Finalizada': return 'text-slate-300';
      case 'Cancelada con Imprevisto': return 'text-rose-400';
      case 'Imprevisto Enviado': return 'text-cyan-400';
      case 'Cancelada': return 'text-red-400';
      default: return 'text-primary';
    }
  }

  getStateActionDescription(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'Revisar datos de solicitud y verificar fecha en la agenda exclusiva del artista';
      case 'Propuesta enviada': return 'Hacer seguimiento a la lectura del correo con la propuesta comercial';
      case 'Negociación': return 'Ajustar cláusulas u honorarios según los acuerdos comercialmente pactados';
      case 'Aceptada': return 'Confirmar aceptación y redactar borrador preliminar de contrato';
      case 'Contrato en espera de firma': return 'Revisar cláusulas legales y solicitar firma digital de las partes';
      case 'Contrato firmado': return 'Verificar firma de ambas partes y solicitar comprobante de anticipo';
      case 'Cotización con Pagos Aplazados': return 'Gestionar reestructuración de hitos y acuerdos de mora con la administración';
      case 'Pago pendiente': return 'Validar transferencia de depósito del 50% enviada por el cliente';
      case 'Anticipo 50% recibido': return 'Acreditar anticipo en tesorería e iniciar logística técnica';
      case 'Logística & Soundcheck': return 'Coordinar prueba de sonido (16:00 hrs), rider de audio y pases VIP';
      case 'Pago confirmado': return 'Validar 100% de liquidación y preparar llamada a escenario';
      case 'En presentación': return 'Supervisar ejecución en vivo del concierto y seguridad en escenario';
      case 'Evento realizado': return 'Verificar cumplimiento de horas de show y registrar aforo real';
      case 'Finalizada': return 'Expediente histórico archivado y encuesta de satisfacción concluida';
      case 'Cancelada con Imprevisto': return 'Expediente cerrado con protocolo de imprevisto grave u opción de reembolso';
      case 'Imprevisto Enviado': return 'Dar seguimiento a la propuesta de resolución enviada, en espera de la decisión del cliente';
      case 'Cancelada': return 'Liberar fecha en el calendario disquera y verificar reembolsos';
      default: return 'Transicionar la cotización al siguiente paso del flujo comercial';
    }
  }

  getFilteredQuotes(): Quote[] {
    return this.mockData.quotes().filter(q => {
      const matchSearch = !this.searchTerm() ||
        q.id.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        q.clientName.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        q.clientCompany.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        q.groupName.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
        q.city.toLowerCase().includes(this.searchTerm().toLowerCase());

      const matchState = this.stateFilter() === 'Todos' || q.state === this.stateFilter();
      const matchPayment = this.paymentFilter() === 'Todos' || q.paymentStatus === this.paymentFilter();

      return matchSearch && matchState && matchPayment;
    });
  }

  getFilteredStates(): QuoteState[] {
    if (this.stateFilter() !== 'Todos') {
      return [this.stateFilter() as QuoteState];
    }
    return this.allStates;
  }

  getFilteredQuotesByState(state: QuoteState): Quote[] {
    return this.getFilteredQuotes().filter(q => q.state === state);
  }

  getStateIndex(state: QuoteState): number {
    return this.allStates.indexOf(state);
  }

  getStateSubtotal(state: QuoteState): number {
    return this.getFilteredQuotesByState(state).reduce((sum, q) => sum + q.totalAmount, 0);
  }

  getQuotesCountByPayment(paymentStatus: PaymentStatus): number {
    return this.mockData.quotes().filter(q => q.paymentStatus === paymentStatus).length;
  }

  getTotalPipelineAmount(): number {
    return this.mockData.quotes().reduce((sum, q) => sum + q.totalAmount, 0);
  }

  // 'Cancelada con Imprevisto' / 'Imprevisto Enviado' / 'Cancelada' no son parte de un pipeline
  // lineal (pueden ir y volver entre si segun la decision del cliente); la transicion real se
  // hace desde las acciones dedicadas dentro del modal, no con Avanzar/Retroceder del kanban.
  isNonLinearState(state: QuoteState): boolean {
    return state === 'Cancelada con Imprevisto' || state === 'Imprevisto Enviado' || state === 'Cancelada';
  }

  isFirstState(state: QuoteState): boolean {
    return this.allStates.indexOf(state) === 0 || this.isNonLinearState(state);
  }

  isLastState(state: QuoteState): boolean {
    return this.allStates.indexOf(state) === this.allStates.length - 1 || this.isNonLinearState(state);
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

  getPaymentStatusLabel(q: Quote): string {
    if (q.state === 'Propuesta enviada' && (q.negotiationRound ?? 0) > 0) {
      return `Negociación Pendiente (Ronda #${q.negotiationRound})`;
    }
    return q.paymentStatus;
  }

  getPaymentStatusBadgeClass(status: PaymentStatus, q?: Quote): string {
    if (q && q.state === 'Propuesta enviada' && (q.negotiationRound ?? 0) > 0) {
      return 'bg-amber-500/25 text-amber-300 border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.25)] font-black';
    }
    switch (status) {
      case 'Pago Confirmado 100%': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-sm';
      case 'Anticipo 50%': return 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-sm';
      case 'Pendiente': return 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-sm';
      default: return 'bg-surface-bright text-outline';
    }
  }

  copyFolio(folioId: string): void {
    navigator.clipboard?.writeText(folioId);
    alert('Folio ' + folioId + ' copiado al portapapeles.');
  }

  openDetailModal(q: Quote): void {
    this.layoutState.openQuoteModal(q);
  }

  contactWhatsApp(): void {
    const q = this.selectedQuote();
    const phone = q?.representativePhone || '+528112345678';
    const text = encodeURIComponent(`Hola ${q?.representativeName || 'Ing. Luis Donaldo'}, me interesa la cotización ${q?.id} para el grupo ${q?.groupName}.`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  }

  downloadMockPdf(): void {
    const id = this.selectedQuote()?.id || 'COT-000';
    alert('Simulación de Descarga: Se generó el archivo contrato_' + id + '.pdf correctamente en tu equipo.');
  }
}
