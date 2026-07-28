import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { Quote, QuoteState, PaymentStatus } from '../../core/models/admin.models';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-full">
      
      @if (roleService.activeRole() === 'usuario') {
        <!-- NEUTRAL ACCESS RESTRICTED SCREEN (NO ROLE EXPLANATIONS OR CAUSES) -->
        <div class="min-h-[500px] flex items-center justify-center p-6">
          <div class="max-w-md w-full p-8 rounded-3xl bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 text-center space-y-5 shadow-2xl">
            <div class="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant/30 text-outline flex items-center justify-center mx-auto shadow-inner">
              <span class="material-symbols-outlined text-3xl">lock</span>
            </div>
            
            <div class="space-y-1">
              <h2 class="text-xl font-black text-on-surface">Acceso Restringido</h2>
              <p class="text-xs text-outline">Sección no disponible.</p>
            </div>

            <div class="pt-2">
              <a 
                routerLink="/dashboard" 
                class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-surface-bright hover:bg-surface-container-highest text-on-surface font-bold text-xs transition-all shadow-md"
              >
                <span class="material-symbols-outlined text-base">arrow_back</span> Volver al inicio
              </a>
            </div>
          </div>
        </div>
      } @else {
        <!-- FULL COTIZACIONES MODULE FOR AUTHORIZED MANAGERS & ADMINISTRATORS -->

        <!-- TOP HEADER & VIEW TOGGLE (ULTRA MODERN GLASSMORPHISM) -->
        <div class="p-6 rounded-3xl bg-gradient-to-r from-surface-container-high/90 via-surface-container/80 to-surface-container-high/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div class="absolute -right-10 -top-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10">
            <div class="flex items-center gap-3 flex-wrap">
              <div class="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-inner">
                <span class="material-symbols-outlined text-2xl">request_quote</span>
              </div>
              <div>
                <h1 class="font-display-xl text-2xl sm:text-3xl font-black text-on-surface tracking-tight">Panel de Cotizaciones & Contrataciones Individuales</h1>
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
                class="px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all duration-300"
              >
                <span class="material-symbols-outlined text-base">view_kanban</span> Kanban Vertical
              </button>
              <button 
                (click)="viewMode.set('table')"
                [class]="viewMode() === 'table' ? 'bg-primary text-on-primary font-bold shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'"
                class="px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all duration-300"
              >
                <span class="material-symbols-outlined text-base">table_rows</span> Vista Tabla
              </button>
            </div>
          </div>
        </div>

        <!-- KPI SUMMARY METRIC STRIP -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 rounded-3xl bg-surface-container/70 backdrop-blur-md border border-outline-variant/30 shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 space-y-1.5 group">
            <span class="text-[10px] font-bold text-outline uppercase tracking-wider block">Tiempo Promedio Cierre</span>
            <div class="flex items-center justify-between">
              <span class="text-xl font-black text-on-surface group-hover:text-primary transition-colors">3.8 Días</span>
              <div class="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-lg">speed</span>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-3xl bg-surface-container/70 backdrop-blur-md border border-outline-variant/30 shadow-md hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 space-y-1.5 group">
            <span class="text-[10px] font-bold text-outline uppercase tracking-wider block">Tasa de Conversión</span>
            <div class="flex items-center justify-between">
              <span class="text-xl font-black text-emerald-400">78.5%</span>
              <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-lg">trending_up</span>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-3xl bg-surface-container/70 backdrop-blur-md border border-outline-variant/30 shadow-md hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 space-y-1.5 group">
            <span class="text-[10px] font-bold text-outline uppercase tracking-wider block">Riders Auditados</span>
            <div class="flex items-center justify-between">
              <span class="text-xl font-black text-blue-400">100% OK</span>
              <div class="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-lg">fact_check</span>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-3xl bg-surface-container/70 backdrop-blur-md border border-outline-variant/30 shadow-md hover:shadow-xl hover:border-purple-500/40 transition-all duration-300 space-y-1.5 group">
            <span class="text-[10px] font-bold text-outline uppercase tracking-wider block">
              @if (roleService.canViewFinances()) { Valuación Pipeline } @else { Aforo Acumulado }
            </span>
            <div class="flex items-center justify-between">
              @if (roleService.canViewFinances()) {
                <span class="text-xl font-black text-purple-400">&#36;{{ getTotalPipelineAmount() | number:'1.0-0' }}</span>
                <div class="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
                  <span class="material-symbols-outlined text-lg">payments</span>
                </div>
              } @else {
                <span class="text-xl font-black text-purple-300">48,500 Asist.</span>
                <div class="p-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 group-hover:scale-110 transition-transform">
                  <span class="material-symbols-outlined text-lg">groups</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- QUICK FILTER PILLS & SEARCH BAR -->
        <div class="p-5 rounded-3xl bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 shadow-lg space-y-3">
          
          <!-- State Filter Pills (14 States) -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <button 
              (click)="stateFilter.set('Todos')"
              [class]="stateFilter() === 'Todos' ? 'bg-primary text-on-primary font-bold shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'"
              class="px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all"
            >
              Todas las 14 Etapas ({{ mockData.quotes().length }})
            </button>

            @for (st of allStates; track st) {
              <button 
                (click)="stateFilter.set(st)"
                [class]="stateFilter() === st ? 'bg-primary text-on-primary font-bold shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'"
                class="px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all"
              >
                {{ st }}
              </button>
            }
          </div>

          <!-- Search Input & Dropdowns -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-outline-variant/20">
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3.5 top-2.5 text-outline text-lg">search</span>
              <input 
                [(ngModel)]="searchTerm" 
                type="text" 
                placeholder="Buscar por folio, cliente, empresa, grupo musical o ciudad..."
                class="w-full bg-surface-container-high/90 border border-outline-variant/30 rounded-2xl pl-10 pr-4 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/60 transition-all shadow-inner"
              />
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <!-- Payment Filter Dropdown -->
              <div class="flex items-center gap-2 text-xs">
                <span class="text-outline font-semibold">Estatus Pago:</span>
                <select 
                  [(ngModel)]="paymentFilter"
                  class="bg-surface-container-high/90 border border-outline-variant/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/60"
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
              <div class="p-6 rounded-3xl bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 shadow-xl space-y-5">
                
                <!-- State Header Banner -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                  <div class="flex items-center gap-3">
                    <span class="w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/20 shadow-sm"></span>
                    <h3 class="text-sm font-extrabold text-on-surface flex items-center gap-2">
                      <span class="material-symbols-outlined text-primary text-base">{{ getStateIcon(state) }}</span>
                      {{ state }}
                      <span class="text-xs font-bold px-3 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm">
                        {{ getFilteredQuotesByState(state).length }} Cotizaciones
                      </span>
                    </h3>
                  </div>

                  @if (roleService.canViewFinances()) {
                    <span class="text-xs font-semibold text-outline">
                      Subtotal del Estado: <strong class="text-emerald-400 font-black">&#36;{{ getStateSubtotal(state) | number:'1.0-0' }} MXN</strong>
                    </span>
                  } @else {
                    <span class="text-xs font-semibold text-purple-300 flex items-center gap-1">
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
                        <div class="flex items-center justify-between text-xs">
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

                          <span [class]="getPaymentStatusBadgeClass(q.paymentStatus)" class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold border">
                            {{ q.paymentStatus }}
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
                          <p class="text-[11px] text-outline pt-1 flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-primary">location_on</span> {{ q.venue }}, {{ q.city }} ({{ q.proposedDate }})
                          </p>
                        </div>

                        <!-- State Progress Stepper (14 States) -->
                        <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20 space-y-1">
                          <div class="flex items-center justify-between text-[10px] font-bold">
                            <span class="text-outline uppercase">Avance de Estado</span>
                            <span class="text-primary">Paso {{ getStateIndex(q.state) + 1 }} de {{ allStates.length }}</span>
                          </div>
                          <div class="w-full h-1.5 rounded-full bg-surface-bright overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full transition-all" [style.width.%]="((getStateIndex(q.state) + 1) / allStates.length) * 100"></div>
                          </div>
                        </div>

                        <!-- Proposal Amount (Financial) vs Operational Specs (Non-financial) -->
                        <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                          <div>
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
                            class="px-3.5 py-1.5 rounded-xl bg-surface-bright hover:bg-primary hover:text-on-primary text-on-surface text-xs font-bold transition-all flex items-center gap-1 shadow-sm hover:scale-105"
                          >
                            <span class="material-symbols-outlined text-xs">visibility</span> Abrir Solicitud
                          </button>
                        </div>

                        <!-- BIDIRECTIONAL STATE CONTROLS -->
                        <div class="flex items-center justify-between bg-surface-container/90 p-2 rounded-xl border border-outline-variant/20 text-xs">
                          <button 
                            [disabled]="isFirstState(q.state)"
                            (click)="moveState(q, -1)"
                            class="px-3 py-1 rounded-lg bg-surface-bright hover:bg-primary/20 text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 font-bold text-[11px]"
                            title="Retroceder estado"
                          >
                            <span class="material-symbols-outlined text-xs">arrow_back</span> Retroceder
                          </button>

                          <span class="font-semibold text-outline text-[10px] uppercase tracking-wider">Mover Estado</span>

                          <button 
                            [disabled]="isLastState(q.state)"
                            (click)="moveState(q, 1)"
                            class="px-3 py-1 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-on-primary disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 font-bold text-[11px]"
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
          <div class="p-6 rounded-3xl bg-surface-container/80 backdrop-blur-md border border-outline-variant/30 shadow-xl overflow-hidden">
            <div class="overflow-x-auto custom-scrollbar">
              <table class="w-full text-left border-collapse text-xs">
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
                        <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                          {{ q.state }}
                        </span>
                      </td>
                      <td class="py-3.5 px-3 whitespace-nowrap">
                        <span [class]="getPaymentStatusBadgeClass(q.paymentStatus)" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border">
                          {{ q.paymentStatus }}
                        </span>
                      </td>
                      <td class="py-3.5 px-3 text-right whitespace-nowrap">
                        <button 
                          (click)="openDetailModal(q)"
                          class="px-3 py-1.5 rounded-xl bg-primary/20 text-primary hover:bg-primary hover:text-on-primary font-bold text-xs transition-all flex items-center gap-1 ml-auto"
                        >
                          <span class="material-symbols-outlined text-sm">visibility</span> Abrir Solicitud
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="text-center py-8 text-xs text-outline">
                        No se encontraron cotizaciones con los filtros seleccionados.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- DISTINCT STATE-SPECIFIC DETAIL MODAL WINDOW SYSTEM (14 TAILORED MODAL DESIGNS PER STATE) -->
        @if (selectedQuote()) {
          <div 
            (wheel)="$event.stopPropagation()"
            (touchmove)="$event.stopPropagation()"
            class="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-2xl overflow-y-auto p-4 md:p-8 flex items-center justify-center custom-scrollbar"
          >
            
            <!-- MODAL CARD CONTAINER WITH DYNAMIC STATE ACCENT BORDER & SHADOW -->
            <div 
              [class]="getStateModalBorderClass(selectedQuote()!.state)"
              class="relative w-full max-w-6xl mx-auto bg-surface-container rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto border-2"
            >
              
              <!-- TOP HEADER ROW WITH DYNAMIC STATE COLOR BADGE -->
              <div class="space-y-4 border-b border-outline-variant/30 pb-4">
                
                <div class="flex items-center justify-between gap-4">
                  <div class="flex items-center gap-3.5">
                    <div [class]="getStateBadgeIconBg(selectedQuote()!.state)" class="p-3.5 rounded-2xl border text-white shadow-lg flex items-center justify-center">
                      <span class="material-symbols-outlined text-3xl">{{ getStateIcon(selectedQuote()!.state) }}</span>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-black px-3 py-1 rounded-full bg-surface-bright text-on-surface border border-outline-variant/30 shadow-sm font-mono">
                          FOLIO: {{ selectedQuote()?.id }}
                        </span>
                        <span class="text-xs font-bold text-outline">
                          Paso {{ getStateIndex(selectedQuote()!.state) + 1 }} de {{ allStates.length }}: 
                          <strong [class]="getStateTextColor(selectedQuote()!.state)" class="font-black ml-1 uppercase tracking-wider">{{ selectedQuote()?.state }}</strong>
                        </span>
                      </div>
                      <h3 class="text-xl sm:text-2xl font-black text-on-surface mt-1 tracking-tight">
                        {{ getStatePhaseTitle(selectedQuote()!.state) }}
                      </h3>
                    </div>
                  </div>

                  <button 
                    (click)="selectedQuote.set(null)" 
                    class="p-3 rounded-2xl bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface transition-all shadow-md shrink-0 border border-outline-variant/30"
                    title="Cerrar modal"
                  >
                    <span class="material-symbols-outlined text-2xl">close</span>
                  </button>
                </div>

                <!-- STATE SPECIFIC STEP NAVIGATION TABS -->
                <div class="p-1.5 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-between gap-2 text-xs">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <button 
                      (click)="modalTab.set('estado_actual')"
                      [class]="modalTab() === 'estado_actual' ? 'bg-primary text-on-primary font-black shadow-lg shadow-primary/20' : 'text-outline hover:text-on-surface'"
                      class="px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <span>⚡</span> Expediente de Fase {{ getStateIndex(selectedQuote()!.state) + 1 }}
                    </button>

                    <button 
                      (click)="modalTab.set('solicitud')"
                      [class]="modalTab() === 'solicitud' ? 'bg-primary text-on-primary font-black shadow-lg shadow-primary/20' : 'text-outline hover:text-on-surface'"
                      class="px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <span>📋</span> Solicitud Original del Cliente
                    </button>

                    <button 
                      (click)="modalTab.set('cobranza')"
                      [class]="modalTab() === 'cobranza' ? 'bg-primary text-on-primary font-black shadow-lg shadow-primary/20' : 'text-outline hover:text-on-surface'"
                      class="px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <span>💳</span> Control de Cobranza & Pagos
                    </button>

                    <button 
                      (click)="modalTab.set('contrato')"
                      [class]="modalTab() === 'contrato' ? 'bg-primary text-on-primary font-black shadow-lg shadow-primary/20' : 'text-outline hover:text-on-surface'"
                      class="px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <span>📜</span> Generador de Contrato PDF
                    </button>
                  </div>

                  <span class="text-[11px] font-bold text-outline pr-3 hidden lg:inline-block">
                    Contratación 1 a 1 Exclusiva
                  </span>
                </div>

              </div>

              <!-- DYNAMIC WORKFLOW ACTION CONTROL BAR -->
              <div class="p-4 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                <div class="space-y-0.5">
                  <span class="text-xs font-extrabold text-primary uppercase tracking-wider block">Acción Operativa para el Estado Actual</span>
                  <p class="text-xs text-outline">{{ getStateActionDescription(selectedQuote()!.state) }}</p>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  <button 
                    [disabled]="isFirstState(selectedQuote()!.state)"
                    (click)="moveState(selectedQuote()!, -1)"
                    class="px-4 py-2 rounded-xl bg-surface-bright hover:bg-primary/20 text-on-surface font-bold text-xs disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span class="material-symbols-outlined text-sm">arrow_back</span> Retroceder
                  </button>

                  <button 
                    [disabled]="isLastState(selectedQuote()!.state)"
                    (click)="moveState(selectedQuote()!, 1)"
                    class="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-hover font-extrabold text-xs shadow-lg shadow-primary/20 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-2"
                  >
                    Avanzar de Estado <span class="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>

              <!-- TAB: EXPEDIENTE DE FASE ACTUAL (DISTINCT CONTENT DESIGN FOR EACH OF THE 14 STATES) -->
              @if (modalTab() === 'estado_actual') {
                <div class="space-y-6">
                  
                  <!-- STATE 1: EN REVISIÓN -->
                  @if (selectedQuote()?.state === 'En revisión') {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div class="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/30 space-y-3">
                        <span class="text-xs font-black text-blue-400 uppercase tracking-wider block">1. Auditoría de Solicitud Pública</span>
                        <p class="text-xs text-outline">Revisión de solicitud recibida desde el portal público de contrataciones.</p>
                        <div class="p-3 rounded-2xl bg-surface-container text-xs space-y-1 font-mono">
                          <p class="text-on-surface">Tipo Evento: <strong>{{ selectedQuote()?.eventType || 'Boda' }}</strong></p>
                          <p class="text-on-surface">Fecha Solicitada: <strong>{{ selectedQuote()?.proposedDate }}</strong></p>
                        </div>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block">2. Verificación de Agenda Disquera</span>
                        <p class="text-xs text-outline">Estado de disponibilidad de la agrupación {{ selectedQuote()?.groupName }} para la fecha solicitada.</p>
                        <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                          ✓ Fecha 100% Disponible
                        </span>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-purple-300 uppercase tracking-wider block">3. Siguiente Paso Operativo</span>
                        <p class="text-xs text-outline">Elaboración y envío de propuesta comercial al correo del cliente.</p>
                        <button (click)="moveState(selectedQuote()!, 1)" class="w-full py-2.5 rounded-xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-400 transition-all">
                          Aprobar & Enviar Propuesta
                        </button>
                      </div>
                    </div>
                  }

                  <!-- STATE 2: PROPUESTA ENVIADA -->
                  @else if (selectedQuote()?.state === 'Propuesta enviada') {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div class="p-6 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 space-y-3">
                        <span class="text-xs font-black text-cyan-400 uppercase tracking-wider block">Seguimiento de Envío por Email</span>
                        <p class="text-xs text-outline">Propuesta comercial formal entregada al correo del cliente.</p>
                        <p class="text-xs font-bold text-emerald-400">✉️ Correo Entregado: {{ selectedQuote()?.clientEmail }}</p>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-on-surface uppercase tracking-wider block">Lectura del Cliente</span>
                        <p class="text-xs text-outline">El cliente ha abierto la cotización en su portal de cliente.</p>
                        <span class="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs">
                          👁️ Visto hace 15 minutos
                        </span>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block">Acción Recomendada</span>
                        <p class="text-xs text-outline">Iniciar contacto directo o llamada de seguimiento comercial.</p>
                        <button (click)="moveState(selectedQuote()!, 1)" class="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all">
                          Iniciar Negociación
                        </button>
                      </div>
                    </div>
                  }

                  <!-- STATE 3: NEGOCIACIÓN -->
                  @else if (selectedQuote()?.state === 'Negociación') {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div class="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                        <span class="text-xs font-black text-amber-400 uppercase tracking-wider block">Mesa de Negociación Comercial</span>
                        <p class="text-xs text-outline">Intercambio de acuerdos sobre horas de presentación y viáticos.</p>
                        <div class="p-3 rounded-2xl bg-surface-container text-xs font-mono">
                          <span class="text-amber-300 font-bold">Solicitud Cliente:</span> 1 Hora extra de show solicitada
                        </div>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Representante Asignado</span>
                        <p class="text-xs text-outline">Atención directa vía WhatsApp por el Ing. Luis Donaldo.</p>
                        <button (click)="contactWhatsApp()" class="w-full py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs">
                          💬 Abrir Chat WhatsApp
                        </button>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-blue-400 uppercase tracking-wider block">Aceptación de Acuerdos</span>
                        <p class="text-xs text-outline">Avanzar cotización tras acordar términos finales.</p>
                        <button (click)="moveState(selectedQuote()!, 1)" class="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs">
                          Marcar como Aceptada
                        </button>
                      </div>
                    </div>
                  }

                  <!-- STATE 4: ACEPTADA -->
                  @else if (selectedQuote()?.state === 'Aceptada') {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div class="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                        <span class="text-xs font-black text-emerald-400 uppercase tracking-wider block">Propuesta Aceptada 100%</span>
                        <p class="text-xs text-outline">El cliente ha aceptado la propuesta final y condiciones del show.</p>
                        <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                          ✓ Acuerdos Validados
                        </span>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-purple-300 uppercase tracking-wider block">Generación de Borrador</span>
                        <p class="text-xs text-outline">Borrador de contrato privado listo para previsualización legal.</p>
                        <button (click)="moveState(selectedQuote()!, 1)" class="w-full py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs">
                          Generar Borrador Legal
                        </button>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-primary uppercase tracking-wider block">Acción Operativa</span>
                        <p class="text-xs text-outline">Enviar cláusulas de borrador al cliente contratante.</p>
                        <button (click)="modalTab.set('contrato')" class="w-full py-2.5 rounded-xl bg-surface-bright text-on-surface font-bold text-xs border border-outline-variant/30">
                          📜 Ver Borrador
                        </button>
                      </div>
                    </div>
                  }

                  <!-- STATE 5: BORRADOR DE CONTRATO (NEW STATE #5) -->
                  @else if (selectedQuote()?.state === 'Borrador de contrato') {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div class="p-6 rounded-3xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                        <span class="text-xs font-black text-purple-300 uppercase tracking-wider block">Revision Legal de Cláusulas</span>
                        <p class="text-xs text-outline">Borrador de contrato legal ajustado según requerimientos del recinto.</p>
                        <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 font-mono text-xs font-bold">
                          DRAFT-ACORDEX-2026
                        </span>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block">Previsualización de Documento</span>
                        <p class="text-xs text-outline">Verificar cláusulas financieras y logística técnica antes de la firma.</p>
                        <button (click)="modalTab.set('contrato')" class="w-full py-2 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                          📜 Abrir Previsualizador
                        </button>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Suscripción de Firma</span>
                        <p class="text-xs text-outline">Solicitar firma electrónica a ambas partes contrayentes.</p>
                        <button (click)="moveState(selectedQuote()!, 1)" class="w-full py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs">
                          Enviar para Firma Digital
                        </button>
                      </div>
                    </div>
                  }

                  <!-- STATE 6: CONTRATO FIRMADO -->
                  @else if (selectedQuote()?.state === 'Contrato firmado') {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div class="p-6 rounded-3xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                        <span class="text-xs font-black text-purple-300 uppercase tracking-wider block">Firma Digital Registrada</span>
                        <p class="text-xs text-outline">Contrato suscrito con certificación de sello digital.</p>
                        <p class="text-xs font-mono text-purple-200">Hash: SIG-883921-HEX</p>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block">Solicitud de Anticipo 50%</span>
                        <p class="text-xs text-outline">Ficha de depósito enviada para congelar fecha oficial.</p>
                        <button (click)="moveState(selectedQuote()!, 1)" class="w-full py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-xs">
                          Pasar a Pago Pendiente
                        </button>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Descarga Oficial</span>
                        <p class="text-xs text-outline">Obtener copia en PDF con firmas de ambas partes.</p>
                        <button (click)="downloadMockPdf()" class="w-full py-2.5 rounded-xl bg-surface-bright text-on-surface font-bold text-xs border border-outline-variant/30">
                          📥 Descargar PDF Firmado
                        </button>
                      </div>
                    </div>
                  }

                  <!-- STATE 7: PAGO PENDIENTE -->
                  @else if (selectedQuote()?.state === 'Pago pendiente') {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div class="p-6 rounded-3xl bg-yellow-500/10 border border-yellow-500/30 space-y-3">
                        <span class="text-xs font-black text-yellow-400 uppercase tracking-wider block">Anticipo 50% Pendiente</span>
                        <p class="text-xs text-outline">Datos bancarios para transferencia SPEI del anticipo.</p>
                        <p class="text-xs font-mono text-on-surface">CLABE: 012180001234567890</p>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-blue-400 uppercase tracking-wider block">Subir Comprobante SPEI</span>
                        <p class="text-xs text-outline">Cargar imagen o PDF de la transferencia realizada.</p>
                        <button (click)="updatePaymentStatus('Anticipo 50%')" class="w-full py-2 rounded-xl bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
                          Registrar Anticipo 50%
                        </button>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Confirmación de Depósito</span>
                        <p class="text-xs text-outline">Transicionar a anticipo recibido tras validar fondos.</p>
                        <button (click)="moveState(selectedQuote()!, 1)" class="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs">
                          Confirmar Anticipo 50%
                        </button>
                      </div>
                    </div>
                  }

                  <!-- STATE 8: ANTICIPO 50% RECIBIDO (NEW STATE #8) -->
                  @else if (selectedQuote()?.state === 'Anticipo 50% recibido') {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div class="p-6 rounded-3xl bg-teal-500/10 border border-teal-500/30 space-y-3">
                        <span class="text-xs font-black text-teal-300 uppercase tracking-wider block">Anticipo 50% Acreditado</span>
                        <p class="text-xs text-outline">Fondos acreditados exitosamente en la cuenta bancaria de Acordex Records.</p>
                        <span class="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 font-mono text-xs font-bold">SPEI-884210-OK</span>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-orange-300 uppercase tracking-wider block">Iniciar Logística Técnica</span>
                        <p class="text-xs text-outline">Notificar a producción para apartado de transporte y viáticos.</p>
                        <button (click)="moveState(selectedQuote()!, 1)" class="w-full py-2.5 rounded-xl bg-orange-500 text-black font-bold text-xs">
                          Pasar a Logística & Soundcheck
                        </button>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Ficha de Depósito</span>
                        <p class="text-xs text-outline">Comprobante de depósito bancario registrado en contabilidad.</p>
                        <button (click)="modalTab.set('cobranza')" class="w-full py-2.5 rounded-xl bg-surface-bright text-on-surface font-bold text-xs border border-outline-variant/30">
                          💳 Ver Estado Financiero
                        </button>
                      </div>
                    </div>
                  }

                  <!-- STATE 9: LOGÍSTICA & SOUNDCHECK (NEW STATE #9) -->
                  @else if (selectedQuote()?.state === 'Logística & Soundcheck') {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div class="p-6 rounded-3xl bg-orange-500/10 border border-orange-500/30 space-y-3">
                        <span class="text-xs font-black text-orange-300 uppercase tracking-wider block">Coordinación de Soundcheck</span>
                        <p class="text-xs text-outline">Prueba de sonido programada a las 16:00 hrs con ingeniero de audio PA.</p>
                        <span class="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 font-bold text-xs">
                          🎛️ Rider de Audio Auditado 100%
                        </span>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-purple-300 uppercase tracking-wider block">Credenciales & Pases VIP</span>
                        <p class="text-xs text-outline">12 Gafetes VIP de acceso a camerino entregados al staff.</p>
                        <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs">
                          🎫 12 Pases Activos
                        </span>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Liquidación Final</span>
                        <p class="text-xs text-outline">Acreditar 50% restante antes de subir a escenario.</p>
                        <button (click)="moveState(selectedQuote()!, 1)" class="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs">
                          Confirmar Pago 100% Total
                        </button>
                      </div>
                    </div>
                  }

                  <!-- STATE 10: PAGO CONFIRMADO (FASE 4) -->
                  @else if (selectedQuote()?.state === 'Pago confirmado') {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <!-- Card 1: Estatus Financiero Verificado 100% -->
                      <div class="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 shadow-xl">
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-base">verified</span> Depósito Confirmado 100%
                          </span>
                          <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">TXN-994821-MXN</span>
                        </div>

                        <div class="space-y-1">
                          <p class="text-xs text-outline">Comprobante SPEI verificado por tesorería disquera.</p>
                          @if (roleService.canViewFinances()) {
                            <p class="text-2xl font-black text-on-surface">&#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN</p>
                            <p class="text-xs font-semibold text-emerald-400">Margen Liquidad: &#36;{{ selectedQuote()?.marginAmount | number:'1.0-0' }} MXN</p>
                          } @else {
                            <p class="text-xl font-black text-purple-300">Reserva de Agenda Confirmada</p>
                          }
                        </div>
                      </div>

                      <!-- Card 2: Logística de Camerino & Pases VIP -->
                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4 shadow-xl">
                        <span class="text-xs font-bold text-blue-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-base">badge</span> Pases VIP & Credenciales Emitidas
                        </span>
                        <div class="space-y-2 text-xs">
                          <div class="flex items-center justify-between py-1 border-b border-outline-variant/10">
                            <span class="text-outline">Credenciales Camerino:</span>
                            <span class="font-bold text-on-surface">12 Pases VIP Emitidos</span>
                          </div>
                          <div class="flex items-center justify-between py-1 border-b border-outline-variant/10">
                            <span class="text-outline">Prueba de Sonido:</span>
                            <span class="font-bold text-emerald-400">16:00 hrs Confirmada</span>
                          </div>
                        </div>
                      </div>

                      <!-- Card 3: Iniciar Show En Vivo -->
                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4 shadow-xl">
                        <span class="text-xs font-bold text-rose-300 uppercase tracking-wider block flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-base">graphic_eq</span> Inicio de Presentación
                        </span>
                        <p class="text-xs text-outline">Agrupación en llamada de escenario para iniciar el concierto.</p>
                        <button (click)="moveState(selectedQuote()!, 1)" class="w-full py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20">
                          Transicionar a "En presentación"
                        </button>
                      </div>

                    </div>
                  }

                  <!-- STATE 11: EN PRESENTACIÓN (NEW STATE #11) -->
                  @else if (selectedQuote()?.state === 'En presentación') {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div class="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                        <span class="text-xs font-black text-rose-300 uppercase tracking-wider block flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-base animate-pulse">graphic_eq</span> Show En Vivo En Escenario
                        </span>
                        <p class="text-xs text-outline">El grupo musical {{ selectedQuote()?.groupName }} se encuentra ejecutando su presentación en directo.</p>
                        <span class="px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 font-bold text-xs animate-pulse">
                          🔴 PRESENTACIÓN EN VIVO
                        </span>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-purple-300 uppercase tracking-wider block">Control de Camerino & Seguridad</span>
                        <p class="text-xs text-outline">Supervisión de accesos de camerino y seguridad del artista en el escenario.</p>
                        <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs">
                          🛡️ Accesos Controlados
                        </span>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Conclusión del Show</span>
                        <p class="text-xs text-outline">Registrar cierre de horario y finalizar presentación.</p>
                        <button (click)="moveState(selectedQuote()!, 1)" class="w-full py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-xs">
                          Marcar "Evento Realizado"
                        </button>
                      </div>
                    </div>
                  }

                  <!-- STATE 12: EVENTO REALIZADO -->
                  @else if (selectedQuote()?.state === 'Evento realizado') {
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div class="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 space-y-3">
                        <span class="text-xs font-black text-indigo-400 uppercase tracking-wider block">Auditoría Post-Evento</span>
                        <p class="text-xs text-outline">Presentación ejecutada en tiempo y forma según itinerario.</p>
                        <p class="text-xs font-bold text-emerald-400">✓ Horario Show Cumplido (3 Horas)</p>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-purple-300 uppercase tracking-wider block">Reporte de Aforo Real</span>
                        <p class="text-xs text-outline">Asistencia registrada en el recinto durante la presentación.</p>
                        <p class="text-lg font-black text-on-surface">14,200 Asistentes Registrados</p>
                      </div>

                      <div class="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                        <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Cierre de Expediente</span>
                        <p class="text-xs text-outline">Archivar expediente finalizado en el historial comercial.</p>
                        <button (click)="moveState(selectedQuote()!, 1)" class="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs">
                          Archivar Cotización Finalizada
                        </button>
                      </div>
                    </div>
                  }

                  <!-- STATE 13: FINALIZADA -->
                  @else if (selectedQuote()?.state === 'Finalizada') {
                    <div class="p-6 rounded-3xl bg-slate-800/40 border border-slate-500/40 space-y-4">
                      <div class="flex items-center justify-between">
                        <h4 class="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                          <span class="material-symbols-outlined text-base">task_alt</span> Expediente Completo Archivo Histórico
                        </h4>
                        <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">⭐ Satisfacción 5.0 / 5.0</span>
                      </div>
                      <p class="text-xs text-outline">Todos los pagos, contratos, firmas y logística fueron concluidos con éxito.</p>
                    </div>
                  }

                  <!-- STATE 14: CANCELADA -->
                  @else {
                    <div class="p-6 rounded-3xl bg-red-500/10 border border-red-500/30 space-y-4">
                      <h4 class="text-sm font-black text-red-400 uppercase tracking-wider flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">cancel</span> Expediente Cancelado & Fecha Liberada
                      </h4>
                      <p class="text-xs text-outline">Esta cotización fue cancelada. La fecha asignada en el calendario disquera ha sido liberada para nuevas contrataciones.</p>
                    </div>
                  }

                </div>
              }

              <!-- TAB 1: SOLICITUD ORIGINAL DEL CLIENTE (COMPACT PERFECTED FIT LAYOUT) -->
              @if (modalTab() === 'solicitud') {
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  <!-- LEFT COLUMN: DATOS FORMULARIO CLIENTE (7 COLS - COMPACT & SLEEK) -->
                  <div class="lg:col-span-7 space-y-3.5 bg-surface-container-high/60 p-5 rounded-3xl border border-outline-variant/30 shadow-xl">
                    
                    <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
                      <div>
                        <span class="text-[9px] font-black text-amber-400 uppercase tracking-widest block">ASISTENTE DIGITAL</span>
                        <h4 class="text-sm font-black text-on-surface">Solicitud Paso a Paso del Cliente</h4>
                      </div>
                      <span class="text-[10px] font-bold text-outline">Paso 1 de 3 Completado</span>
                    </div>

                    <!-- TIPO DE EVENTO SELECTOR (COMPACT GRID) -->
                    <div class="space-y-1.5">
                      <label class="text-[10px] font-bold text-outline uppercase tracking-wider block">Tipo de Evento Seleccionado</label>
                      <div class="grid grid-cols-5 gap-2">
                        @for (type of ['Boda', 'XV Años', 'Concierto', 'Fiesta', 'Otro']; track type) {
                          <div 
                            [class]="selectedQuote()?.eventType === type || (!selectedQuote()?.eventType && type === 'Boda') ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold shadow-md ring-1 ring-amber-400/50' : 'bg-surface-container/90 text-outline border-outline-variant/30'"
                            class="py-2.5 px-1.5 rounded-xl border text-center text-xs flex flex-col items-center justify-center gap-1 transition-all"
                          >
                            <span class="material-symbols-outlined text-base">
                              @if (type === 'Boda') { favorite }
                              @else if (type === 'XV Años') { cake }
                              @else if (type === 'Concierto') { festival }
                              @else if (type === 'Fiesta') { celebration }
                              @else { more_horiz }
                            </span>
                            <span class="text-[9px] font-bold uppercase tracking-wider">{{ type }}</span>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- 2-COLUMN GRID FOR FECHA & DIRECCIÓN GOOGLE MAPS -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <!-- FECHA DEL EVENTO -->
                      <div class="space-y-1">
                        <label class="text-[10px] font-bold text-outline uppercase tracking-wider block">Fecha Solicitada</label>
                        <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface flex items-center justify-between font-mono shadow-inner">
                          <span class="font-bold text-xs">{{ selectedQuote()?.proposedDate }}</span>
                          <span class="material-symbols-outlined text-primary text-base">calendar_today</span>
                        </div>
                      </div>

                      <!-- DIRECCIÓN DEL EVENTO -->
                      <div class="space-y-1">
                        <div class="flex items-center justify-between gap-1">
                          <label class="text-[10px] font-bold text-outline uppercase tracking-wider block flex items-center gap-0.5 truncate">
                            <span class="material-symbols-outlined text-[10px] text-amber-400">location_on</span>
                            Buscador Maps
                          </label>
                          <span class="text-[10px] text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5 shrink-0">
                            <span class="material-symbols-outlined text-[10px]">map</span> Mapa
                          </span>
                        </div>
                        <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-on-surface flex items-center justify-between shadow-inner">
                          <span class="truncate font-semibold text-[11px]">{{ selectedQuote()?.eventAddress || (selectedQuote()?.venue + ', ' + selectedQuote()?.city) }}</span>
                          <span class="material-symbols-outlined text-amber-400 text-base shrink-0 ml-1">my_location</span>
                        </div>
                      </div>
                    </div>

                    <!-- CLIENT CONTRACTING DETAILS -->
                    <div class="p-3 rounded-2xl bg-surface-container/90 border border-outline-variant/30 space-y-2 text-xs shadow-md">
                      <span class="text-[9px] font-bold text-blue-400 uppercase tracking-wider block">Datos del Cliente Contratante</span>
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span class="text-outline text-[9px]">Nombre Completo:</span>
                          <p class="font-black text-on-surface text-xs truncate">{{ selectedQuote()?.clientName }}</p>
                        </div>
                        <div>
                          <span class="text-outline text-[9px]">Empresa / Razón Social:</span>
                          <p class="font-black text-on-surface text-xs truncate">{{ selectedQuote()?.clientCompany }}</p>
                        </div>
                        <div class="col-span-2">
                          <span class="text-outline text-[9px]">Correo Electrónico:</span>
                          <p class="font-bold text-primary text-xs truncate">{{ selectedQuote()?.clientEmail }}</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  <!-- RIGHT COLUMN: RESUMEN DE CONTRATACIÓN (5 COLS - COMPACT MATCHING SCREENSHOT) -->
                  <div class="lg:col-span-5 space-y-4">
                    
                    <div class="p-5 rounded-3xl bg-surface-container-high/90 border border-outline-variant/30 shadow-2xl space-y-3.5 relative overflow-hidden">
                      <span class="text-[10px] font-extrabold text-outline uppercase tracking-wider block">RESUMEN DE CONTRATACIÓN</span>

                      <!-- ARTIST IMAGE & NAME COVER CARD -->
                      <div class="relative rounded-2xl overflow-hidden shadow-xl group border border-outline-variant/30">
                        <img 
                          [src]="selectedQuote()?.artistImage || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80'" 
                          alt="Artist Cover"
                          class="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>

                        <!-- Top Right "VER PERFIL" Button -->
                        <button class="absolute top-2.5 right-2.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-400 font-bold text-[9px] border border-amber-400/40 hover:bg-amber-400 hover:text-black transition-all flex items-center gap-1 shadow-lg">
                          <span class="material-symbols-outlined text-[10px]">open_in_new</span> VER PERFIL
                        </button>

                        <!-- Group Name on Bottom -->
                        <div class="absolute bottom-2.5 left-3 right-3">
                          <h4 class="text-lg font-black text-white uppercase tracking-wider drop-shadow-md truncate">
                            {{ selectedQuote()?.groupName }}
                          </h4>
                        </div>
                      </div>

                      <!-- GENRE & RATING CARDS (COMPACT) -->
                      <div class="grid grid-cols-2 gap-2.5 text-xs">
                        <div class="p-3 rounded-2xl bg-surface-container/90 border border-outline-variant/30 space-y-0.5 shadow-sm">
                          <span class="text-[8px] font-bold text-outline uppercase tracking-wider block">GÉNERO</span>
                          <span class="font-extrabold text-on-surface text-xs block truncate">{{ selectedQuote()?.genre || 'Norteño Sax' }}</span>
                        </div>

                        <div class="p-3 rounded-2xl bg-surface-container/90 border border-outline-variant/30 space-y-0.5 shadow-sm">
                          <span class="text-[8px] font-bold text-outline uppercase tracking-wider block">VALORACIÓN</span>
                          <span class="font-extrabold text-amber-400 text-xs flex items-center gap-1 block">
                            ⭐ {{ selectedQuote()?.rating || '4.8' }} / 5.0
                          </span>
                        </div>
                      </div>

                      <!-- DETALLES DEL EVENTO SUMMARY LIST -->
                      <div class="space-y-1.5 pt-1 border-t border-outline-variant/20 text-xs">
                        <span class="text-[9px] font-bold text-outline uppercase tracking-wider block">DETALLES DEL EVENTO</span>
                        
                        <div class="flex items-center justify-between py-0.5 border-b border-outline-variant/10 text-[11px]">
                          <span class="text-outline">Tipo:</span>
                          <span class="font-bold text-on-surface">{{ selectedQuote()?.eventType || 'Boda' }}</span>
                        </div>

                        <div class="flex items-center justify-between py-0.5 border-b border-outline-variant/10 text-[11px]">
                          <span class="text-outline">Fecha:</span>
                          <span class="font-bold text-on-surface font-mono">{{ selectedQuote()?.proposedDate }}</span>
                        </div>

                        <div class="flex items-center justify-between py-0.5 border-b border-outline-variant/10 text-[11px]">
                          <span class="text-outline">Duración:</span>
                          <span class="font-bold text-on-surface">{{ selectedQuote()?.durationHours || 3 }} Horas</span>
                        </div>
                      </div>

                      <!-- REPRESENTANTE DISQUERA BOX (COMPACT EMERALD BOX) -->
                      <div class="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center space-y-2 shadow-lg">
                        <span class="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
                          <span class="material-symbols-outlined text-xs">support_agent</span>
                          REPRESENTANTE: {{ selectedQuote()?.representativeName || 'ING. LUIS DONALDO' }}
                        </span>

                        <button 
                          (click)="contactWhatsApp()"
                          class="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <span class="material-symbols-outlined text-sm">chat</span> CONTACTAR POR WHATSAPP
                        </button>
                      </div>

                    </div>

                  </div>

                </div>
              }

              <!-- TAB 2: CONTROL DE COBRANZA & ANTICIPOS (ROLE-TAILORED FOR ENCARGADO VS ADMINISTRADOR) -->
              @if (modalTab() === 'cobranza') {
                <div class="space-y-5">
                  <div class="p-4 rounded-2xl bg-surface-container-highest border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                    <div>
                      <span class="text-xs font-bold text-primary uppercase tracking-wider block">Estado de Pago Independiente</span>
                      <p class="text-xs text-outline mt-0.5">Transiciona el estatus financiero sin cambiar el pipeline operativo</p>
                    </div>

                    <div class="flex items-center gap-2">
                      <button 
                        (click)="updatePaymentStatus('Pendiente')"
                        [class]="selectedQuote()?.paymentStatus === 'Pendiente' ? 'bg-amber-500 text-black font-bold ring-2 ring-amber-400 shadow-md' : 'bg-surface-bright text-outline'"
                        class="px-4 py-2 rounded-xl text-xs transition-all"
                      >
                        Pendiente
                      </button>
                      <button 
                        (click)="updatePaymentStatus('Anticipo 50%')"
                        [class]="selectedQuote()?.paymentStatus === 'Anticipo 50%' ? 'bg-blue-500 text-white font-bold ring-2 ring-blue-400 shadow-md' : 'bg-surface-bright text-outline'"
                        class="px-4 py-2 rounded-xl text-xs transition-all"
                      >
                        Anticipo 50%
                      </button>
                      <button 
                        (click)="updatePaymentStatus('Pago Confirmado 100%')"
                        [class]="selectedQuote()?.paymentStatus === 'Pago Confirmado 100%' ? 'bg-emerald-500 text-black font-bold ring-2 ring-emerald-400 shadow-md' : 'bg-surface-bright text-outline'"
                        class="px-4 py-2 rounded-xl text-xs transition-all"
                      >
                        Confirmado 100%
                      </button>
                    </div>
                  </div>

                  <!-- ENCARGADO ROLE FINANCIAL VIEW -->
                  @if (roleService.canViewFinances()) {
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div class="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/30 space-y-2 shadow-lg">
                        <span class="text-xs text-outline font-bold uppercase tracking-wider block">Monto Total de Propuesta Comercial</span>
                        <p class="text-3xl font-black text-on-surface">&#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN</p>
                        <p class="text-xs text-emerald-400">Incluye 50% anticipo al contrato y 50% prueba de sonido.</p>
                      </div>

                      <div class="bg-purple-500/10 p-6 rounded-2xl border border-purple-500/30 space-y-2 shadow-lg">
                        <span class="text-xs text-purple-300 font-bold uppercase tracking-wider block">Margen Neto Disquera (25%)</span>
                        <p class="text-3xl font-black text-purple-300">&#36;{{ selectedQuote()?.marginAmount | number:'1.0-0' }} MXN</p>
                        <p class="text-xs text-purple-200/80">Comisión líquida presupuestada por representación de artista.</p>
                      </div>
                    </div>
                  } @else {
                    <!-- ADMINISTRADOR ROLE LOGISTICAL & TECHNICAL RIDER VIEW (NO FINANCIAL REVENUE/MARGINS) -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                      <div class="p-6 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3.5 shadow-lg">
                        <span class="text-xs font-bold text-blue-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-base">fact_check</span>
                          Rider Técnico & Audio Auditado
                        </span>
                        <div class="space-y-2 text-on-surface text-xs">
                          <p class="flex items-center gap-2 text-emerald-400 font-semibold">
                            <span class="material-symbols-outlined text-sm">check_circle</span> Sistema de Audio PA: Auditado 100% OK
                          </p>
                          <p class="flex items-center gap-2 text-emerald-400 font-semibold">
                            <span class="material-symbols-outlined text-sm">check_circle</span> Escenario & Microfonía: Validado
                          </p>
                          <p class="flex items-center gap-2 text-emerald-400 font-semibold">
                            <span class="material-symbols-outlined text-sm">check_circle</span> Prueba de Sonido: Programada 16:00 hrs
                          </p>
                        </div>
                      </div>

                      <div class="p-6 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3.5 shadow-lg">
                        <span class="text-xs font-bold text-purple-300 uppercase tracking-wider block flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-base">groups</span>
                          Capacidad & Acreditación de Prensa
                        </span>
                        <div class="space-y-2 text-on-surface text-xs">
                          <p>Aforo Estimado: <strong class="text-purple-200 font-bold">12,500 Asistentes Proyectados</strong></p>
                          <p>Pases VIP Camerino: <strong class="text-purple-200 font-bold">12 Acreditaciones Asignadas</strong></p>
                          <p>Hospedaje & Transporte: <strong class="text-emerald-400 font-bold">5 Habitaciones Dobles + 2 Vans VIP</strong></p>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- TAB 3: GENERADOR DE CONTRATO PDF (TAILORED FOR ENCARGADO VS ADMINISTRADOR) -->
              @if (modalTab() === 'contrato') {
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-primary text-base">description</span>
                      Previsualizador / Generador de Contrato PDF (Mock)
                    </span>
                    <button 
                      (click)="downloadMockPdf()"
                      class="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:scale-105 transition-all flex items-center gap-1 shadow-md"
                    >
                      <span class="material-symbols-outlined text-sm">download</span> Descargar PDF
                    </button>
                  </div>

                  <div class="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 font-mono text-xs text-on-surface/90 space-y-3.5 shadow-inner">
                    <div class="text-center pb-3 border-b border-outline-variant/30">
                      <p class="font-bold text-primary text-sm">CONTRATO PRIVADO DE PRESENTACIÓN ARTÍSTICA INDIVIDUAL</p>
                      <p class="text-[10px] text-outline">FOLIO DE REGISTRO: {{ selectedQuote()?.id }} | ACORDEX RECORDS</p>
                    </div>

                    <p><strong>PARTES CONTRAYENTES:</strong> ACORDEX RECORDS SA DE CV en representación exclusiva del grupo musical <u>{{ selectedQuote()?.groupName }}</u>, y de otra parte {{ selectedQuote()?.clientName }} ({{ selectedQuote()?.clientCompany }}).</p>
                    <p><strong>OBJETO DEL CONTRATO:</strong> Presentación musical exclusiva de 1 grupo para el evento de tipo {{ selectedQuote()?.eventType || 'Boda' }} en {{ selectedQuote()?.venue }} ({{ selectedQuote()?.city }}) el día {{ selectedQuote()?.proposedDate }} por una duración de {{ selectedQuote()?.durationHours || 3 }} Horas.</p>
                    
                    @if (roleService.canViewFinances()) {
                      <p><strong>HONORARIOS Y MARGEN DISQUERA:</strong> Monto total pactado de &#36;{{ selectedQuote()?.totalAmount | number:'1.0-0' }} MXN con margen de disquera del 25% (&#36;{{ selectedQuote()?.marginAmount | number:'1.0-0' }} MXN).</p>
                    } @else {
                      <p><strong>CAPACIDAD Y RIDER TÉCNICO:</strong> Evento dimensionado para 12,500 asistentes con rider de audio y hospedaje VIP autorizado por producción.</p>
                    }

                    <p><strong>TÉRMINOS Y CONDICIONES DE SHOW:</strong> {{ selectedQuote()?.terms }}</p>
                    <p><strong>ESTADO DE PAGO REGISTRADO:</strong> {{ selectedQuote()?.paymentStatus }}</p>
                  </div>
                </div>
              }

              <!-- Modal Footer -->
              <div class="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/30">
                <button 
                  (click)="selectedQuote.set(null)"
                  class="px-6 py-2 rounded-xl bg-surface-bright text-on-surface font-bold text-xs hover:bg-surface-container-highest transition-colors shadow-md"
                >
                  Cerrar Modal
                </button>
              </div>

            </div>
          </div>
        }

      }

    </div>
  `
})
export class QuotesComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  viewMode = signal<'kanban' | 'table'>('kanban');
  selectedQuote = signal<Quote | null>(null);

  modalTab = signal<'estado_actual' | 'solicitud' | 'cobranza' | 'contrato'>('estado_actual');

  searchTerm = signal('');
  stateFilter = signal('Todos');
  paymentFilter = signal('Todos');

  constructor() {
    // Lock parent window and main content scrolling when detail modal is active
    effect(() => {
      const active = this.selectedQuote();
      if (typeof document !== 'undefined') {
        const mainEl = document.querySelector('main');
        if (active) {
          document.body.style.overflow = 'hidden';
          if (mainEl) mainEl.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
          if (mainEl) mainEl.style.overflow = '';
        }
      }
    });
  }

  readonly allStates: QuoteState[] = [
    'En revisión',
    'Propuesta enviada',
    'Negociación',
    'Aceptada',
    'Borrador de contrato',
    'Contrato firmado',
    'Pago pendiente',
    'Anticipo 50% recibido',
    'Logística & Soundcheck',
    'Pago confirmado',
    'En presentación',
    'Evento realizado',
    'Finalizada',
    'Cancelada'
  ];

  getStateIcon(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'history_edu';
      case 'Propuesta enviada': return 'send';
      case 'Negociación': return 'handshake';
      case 'Aceptada': return 'check_circle';
      case 'Borrador de contrato': return 'edit_note';
      case 'Contrato firmado': return 'draw';
      case 'Pago pendiente': return 'hourglass_empty';
      case 'Anticipo 50% recibido': return 'savings';
      case 'Logística & Soundcheck': return 'equalizer';
      case 'Pago confirmado': return 'verified';
      case 'En presentación': return 'graphic_eq';
      case 'Evento realizado': return 'theater_comedy';
      case 'Finalizada': return 'task_alt';
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
      case 'Borrador de contrato': return 'Fase 2: Elaboración de Borrador & Revisión Legal de Cláusulas';
      case 'Contrato firmado': return 'Fase 3: Contrato Privado Firmado Digitalmente';
      case 'Pago pendiente': return 'Fase 3: Pago de Anticipo 50% Pendiente de Recepción';
      case 'Anticipo 50% recibido': return 'Fase 3: Recepción Registrada de Anticipo del 50%';
      case 'Logística & Soundcheck': return 'Fase 4: Preparación Logística, Rider Técnico & Soundcheck';
      case 'Pago confirmado': return 'Fase 4: Verificación Financiera 100% & Reservas VIP';
      case 'En presentación': return 'Fase 4: Presentación Artística En Vivo En Escenario';
      case 'Evento realizado': return 'Fase 5: Presentación Artística Concluida en Recinto';
      case 'Finalizada': return 'Fase 5: Contratación Finalizada y Archivada en Histórico';
      case 'Cancelada': return 'Expediente Cancelado: Fecha Liberada en Calendario';
      default: return 'Expediente de Cotización';
    }
  }

  getStateModalBorderClass(state: QuoteState): string {
    switch (state) {
      case 'En revisión': return 'border-blue-500/50 shadow-blue-500/10';
      case 'Propuesta enviada': return 'border-cyan-500/50 shadow-cyan-500/10';
      case 'Negociación': return 'border-amber-500/50 shadow-amber-500/10';
      case 'Aceptada': return 'border-emerald-500/50 shadow-emerald-500/10';
      case 'Borrador de contrato': return 'border-purple-400/50 shadow-purple-400/10';
      case 'Contrato firmado': return 'border-purple-500/50 shadow-purple-500/10';
      case 'Pago pendiente': return 'border-yellow-500/50 shadow-yellow-500/10';
      case 'Anticipo 50% recibido': return 'border-teal-500/50 shadow-teal-500/10';
      case 'Logística & Soundcheck': return 'border-orange-500/50 shadow-orange-500/10';
      case 'Pago confirmado': return 'border-emerald-400 shadow-emerald-500/20';
      case 'En presentación': return 'border-rose-500/50 shadow-rose-500/10';
      case 'Evento realizado': return 'border-indigo-500/50 shadow-indigo-500/10';
      case 'Finalizada': return 'border-slate-500/50 shadow-slate-500/10';
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
      case 'Borrador de contrato': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Contrato firmado': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Pago pendiente': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Anticipo 50% recibido': return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'Logística & Soundcheck': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Pago confirmado': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'En presentación': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Evento realizado': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Finalizada': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
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
      case 'Borrador de contrato': return 'text-purple-300';
      case 'Contrato firmado': return 'text-purple-300';
      case 'Pago pendiente': return 'text-yellow-400';
      case 'Anticipo 50% recibido': return 'text-teal-300';
      case 'Logística & Soundcheck': return 'text-orange-300';
      case 'Pago confirmado': return 'text-emerald-300';
      case 'En presentación': return 'text-rose-300';
      case 'Evento realizado': return 'text-indigo-300';
      case 'Finalizada': return 'text-slate-300';
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
      case 'Borrador de contrato': return 'Revisar cláusulas legales y solicitar firma digital de las partes';
      case 'Contrato firmado': return 'Verificar firma de ambas partes y solicitar comprobante de anticipo';
      case 'Pago pendiente': return 'Validar transferencia de depósito del 50% enviada por el cliente';
      case 'Anticipo 50% recibido': return 'Acreditar anticipo en tesorería e iniciar logística técnica';
      case 'Logística & Soundcheck': return 'Coordinar prueba de sonido (16:00 hrs), rider de audio y pases VIP';
      case 'Pago confirmado': return 'Validar 100% de liquidación y preparar llamada a escenario';
      case 'En presentación': return 'Supervisar ejecución en vivo del concierto y seguridad en escenario';
      case 'Evento realizado': return 'Verificar cumplimiento de horas de show y registrar aforo real';
      case 'Finalizada': return 'Expediente histórico archivado y encuesta de satisfacción concluida';
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
    this.selectedQuote.set(q);
    this.modalTab.set('estado_actual');
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
