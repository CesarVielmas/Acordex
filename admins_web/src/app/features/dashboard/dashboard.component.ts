import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { EventState } from '../../core/models/event.models';
import { eventStateMeta } from '../../core/models/event-state.meta';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { KpiCardComponent } from '../../shared/ui/kpi-card/kpi-card.component';
import { ProgressBarComponent } from '../../shared/ui/progress-bar/progress-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeComponent, KpiCardComponent, ProgressBarComponent],
  template: `
    <div class="space-y-8 animate-fade-in">
      
      <!-- Welcome Banner -->
      <div class="p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-surface-container-high via-surface-container to-secondary-container/30 border border-outline-variant/30 relative overflow-hidden shadow-xl">
        <div class="absolute -right-8 -top-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">stars</span> Temporada 2026
              </span>
              <span class="text-xs text-outline font-medium">Acordex Records Admin</span>
            </div>
            <h1 class="font-display-xl text-2xl lg:text-3xl font-black text-on-surface tracking-tight">
              Bienvenido, {{ getUserTitle() }}
            </h1>
            <p class="text-sm text-on-surface-variant mt-1 max-w-xl">
              @if (roleService.isEncargado()) {
                Resumen ejecutivo financiero, solicitudes de cotizaciones enviadas por clientes y estado general de la disquera.
              } @else if (roleService.isAdminOrEncargado()) {
                Control operativo de eventos, revisión de cotizaciones recibidas de clientes y seguimiento de bandas.
              } @else {
                Panel de trabajo de campo. Tareas asignadas y evidencia de eventos solicitados por clientes.
              }
            </p>
          </div>

          <!-- Quick Action Button -->
          <div class="flex items-center gap-3">
            @if (roleService.isAdminOrEncargado()) {
              <a 
                routerLink="/quotes" 
                class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-lg">request_quote</span> Ver Cotizaciones
              </a>
            }
            <a 
              routerLink="/events" 
              class="px-4 py-2.5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-semibold text-xs border border-outline-variant/40 transition-all flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-lg">event</span> Ver Eventos
            </a>
          </div>
        </div>
      </div>

      <!-- KPI CARDS (ADAPTIVE BY ROLE) -->
      @if (roleService.isEncargado()) {
        <!-- ENCARGADO ROLE: FINANCIAL & HIGH LEVEL KPIS -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <app-kpi-card
            label="Ingresos Totales"
            [value]="'$' + (mockData.financialKpis().totalGrossRevenue | number:'1.0-0')"
            unit="MXN"
            icon="attach_money"
            trend="+18.4% vs mes anterior"
            trendIcon="trending_up"
            colorVariant="primary"
          />
          <app-kpi-card
            label="Ganancias Totales"
            [value]="'$' + (mockData.financialKpis().totalNetProfit | number:'1.0-0')"
            unit="MXN"
            icon="savings"
            trend="Margen estimado 25% global"
            colorVariant="success"
          />
          <app-kpi-card
            label="Ingresos Totales por Cotizaciones"
            [value]="'$' + (mockData.financialKpis().pendingQuotesAmount | number:'1.0-0')"
            unit="MXN"
            icon="pending_actions"
            [trend]="mockData.quotes().length + ' cotizaciones activas'"
            trendIcon="info"
            colorVariant="warning"
          />
          <app-kpi-card
            label="Audiencia Estimada"
            value="142,500"
            unit="Fans"
            icon="family_history"
            trend="4 Talentos activos"
            trendIcon="groups"
            colorVariant="secondary"
          />
        </div>
      } @else if (roleService.isAdminOrEncargado()) {
        <!-- ADMINISTRADOR ROLE: OPERATIONAL KPIS (NO FINANCES) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <app-kpi-card
            label="Eventos Próximos"
            [value]="mockData.events().length.toString()"
            unit="Fechas"
            icon="event_available"
            trend="2 Eventos No Publicados"
            colorVariant="primary"
          />
          <app-kpi-card
            label="Cotizaciones Pendientes"
            [value]="getPendingQuotesCount().toString()"
            unit="Pendientes"
            icon="pending_actions"
            [trend]="getUnrevisedQuotesCount() + ' Sin Revisar / ' + getRevisedQuotesCount() + ' Revisadas'"
            colorVariant="warning"
          />

          <div class="p-4 sm:p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden hover:border-primary/50 transition-all shadow-md group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Grupo Popular del Momento</span>
              <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <span class="material-symbols-outlined text-2xl">trending_up</span>
              </div>
            </div>
            <p class="text-base font-black text-on-surface mt-2 truncate">
              {{ getPopularGroup().name }}
            </p>
            <div class="mt-2 space-y-0.5 text-[11px] text-outline font-medium">
              <p class="flex items-center justify-between">
                <span>Me Gusta Promedio:</span> <strong class="text-primary">125K</strong>
              </p>
              <p class="flex items-center justify-between">
                <span>Seguidores:</span> <strong class="text-on-surface">450K</strong>
              </p>
              <p class="flex items-center justify-between">
                <span>Asistencia:</span> <strong class="text-emerald-400">95% Prom.</strong>
              </p>
            </div>
          </div>

          <app-kpi-card
            label="Tareas Pendientes"
            [value]="mockData.filteredTasks().length.toString()"
            unit="Asignadas"
            icon="checklist"
            trend="Operación sin datos privados"
            colorVariant="secondary"
          />
        </div>
      } @else {
        <!-- USUARIO ROLE: COMPACT TASK ASSIGNMENT, TASK VELOCITY ANALYTICS & RECENT EVIDENCE -->
        <div class="space-y-6">
          
          <!-- Top Grid: Compact Task Assignment (3 preview tasks) & Task Progress & Velocity Analytics -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- Compact Task Assignment Preview (3 active assigned tasks) -->
            <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md space-y-4 flex flex-col justify-between">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-bold text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">assignment</span>
                    Asignación de Tareas
                  </h3>
                  <p class="text-xs text-outline">Vista previa compacta ({{ mockData.filteredTasks().length }} tareas activas)</p>
                </div>
                <span class="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  3 Principales
                </span>
              </div>

              <!-- Compact List of 3 Active Tasks -->
              <div class="space-y-2.5">
                @for (task of getCompactTasksPreview(); track task.id) {
                  <div class="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-3 hover:border-primary/40 transition-all">
                    <div class="flex items-center gap-3 min-w-0">
                      <button 
                        (click)="toggleTaskState(task.id, task.status)"
                        class="w-5 h-5 rounded-md border border-outline flex items-center justify-center text-xs transition-colors shrink-0"
                        [class.bg-emerald-500]="task.status === 'Completada'"
                        [class.border-emerald-500]="task.status === 'Completada'"
                        [class.text-white]="task.status === 'Completada'"
                      >
                        @if (task.status === 'Completada') {
                          <span class="material-symbols-outlined text-xs">check</span>
                        }
                      </button>
                      <div class="min-w-0">
                        <h4 class="text-xs font-bold text-on-surface truncate" [class.line-through]="task.status === 'Completada'" [class.text-outline]="task.status === 'Completada'">
                          {{ task.title }}
                        </h4>
                        <p class="text-[11px] text-outline flex items-center gap-1 mt-0.5">
                          <span class="material-symbols-outlined text-xs text-amber-400">schedule</span>
                          <span>Vence: {{ task.dueDate }}</span>
                        </p>
                      </div>
                    </div>

                    <div class="shrink-0 flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                        [class]="task.priority === 'Alta' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'">
                        {{ task.priority }}
                      </span>
                    </div>
                  </div>
                }
              </div>

              <div class="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs font-medium text-outline">
                <span>Operación y logística de campo</span>
                <span class="text-emerald-400 font-bold flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs">check_circle</span> Al día
                </span>
              </div>
            </div>

            <!-- Task Progress & Velocity Section (1-Month Timeline Chart & Data Points) -->
            <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-bold text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-blue-400">speed</span>
                    Progreso y Velocidad de Tareas
                  </h3>
                  <p class="text-xs text-outline">Rendimiento mensual (últimos 30 días)</p>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Alta Velocidad
                </span>
              </div>

              <!-- Visual Metrics -->
              <div class="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-surface-container-high text-xs">
                <div>
                  <span class="text-[10px] text-outline uppercase font-bold block">Total Completadas</span>
                  <span class="font-black text-emerald-400 text-sm">12 Tareas</span>
                </div>
                <div>
                  <span class="text-[10px] text-outline uppercase font-bold block">Velocidad Promedio</span>
                  <span class="font-black text-blue-400 text-sm">1.2 días/tarea</span>
                </div>
                <div>
                  <span class="text-[10px] text-outline uppercase font-bold block">Velocidad Carga</span>
                  <span class="font-black text-primary text-xs flex items-center gap-1 mt-0.5">
                    <span class="material-symbols-outlined text-xs text-emerald-400">trending_up</span> 94% Eficiencia
                  </span>
                </div>
              </div>

              <!-- Timeline Chart over 1-Month Period with Individual Data Points -->
              <div class="pt-2 border-t border-outline-variant/20 space-y-2">
                <div class="flex items-center justify-between text-[10px] text-outline font-semibold">
                  <span>1 Jul</span>
                  <span>8 Jul</span>
                  <span>15 Jul</span>
                  <span>22 Jul</span>
                  <span>27 Jul</span>
                </div>

                <div class="relative">
                  <svg class="w-full h-14 overflow-visible" viewBox="0 0 300 50" fill="none">
                    <!-- Grid Lines -->
                    <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2 2" />
                    <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2 2" />

                    <!-- Curve Path -->
                    <path d="M 0 38 Q 45 35, 75 28 T 150 20 T 225 12 T 300 6 L 300 50 L 0 50 Z" fill="url(#velocityGradient)" opacity="0.35" />
                    <path d="M 0 38 Q 45 35, 75 28 T 150 20 T 225 12 T 300 6" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" fill="none" />

                    <!-- Plotted Data Points (Individual Completed Tasks) -->
                    <!-- Task 1 (Jul 3) -->
                    <circle cx="25" cy="36" r="4" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5" />
                    <!-- Task 2 (Jul 7) -->
                    <circle cx="65" cy="30" r="4" fill="#38bdf8" stroke="#0f172a" stroke-width="1.5" />
                    <!-- Task 3 (Jul 12) -->
                    <circle cx="115" cy="24" r="4" fill="#34d399" stroke="#0f172a" stroke-width="1.5" />
                    <!-- Task 4 (Jul 18) -->
                    <circle cx="175" cy="17" r="4" fill="#34d399" stroke="#0f172a" stroke-width="1.5" />
                    <!-- Task 5 (Jul 24) -->
                    <circle cx="240" cy="11" r="4" fill="#34d399" stroke="#0f172a" stroke-width="1.5" />
                    <!-- Task 6 (Jul 27 - Latest) -->
                    <circle cx="295" cy="6" r="5" fill="#a855f7" stroke="#0f172a" stroke-width="1.5" class="animate-pulse" />

                    <defs>
                      <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#34d399" stop-opacity="0.6"/>
                        <stop offset="100%" stop-color="#34d399" stop-opacity="0.0"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                <p class="text-[10px] text-outline text-right font-medium">
                  ● Puntos individuales: Tareas completadas trazadas en la línea de tiempo de 30 días
                </p>
              </div>

            </div>

          </div>

          <!-- Staff Top Banner: Recent Multimedia Evidence Uploads (USER ROLE ONLY) -->
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 class="text-base font-bold text-on-surface flex items-center gap-2">
                  <span class="material-symbols-outlined text-emerald-400">add_a_photo</span>
                  Últimas Cargas de Evidencia Multimedia
                </h3>
                <p class="text-xs text-outline">Archivos, fotografías y documentos subidos recientemente por el equipo de campo</p>
              </div>

              <a routerLink="/files" class="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0">
                Ver Todos los Archivos <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>

            <!-- Grid of 5 Clickable Evidence Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              @for (file of getRecentEvidenceUploads(); track file.id) {
                <a 
                  routerLink="/files" 
                  class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-emerald-400/60 hover:bg-surface-bright transition-all group shadow-sm flex flex-col justify-between cursor-pointer space-y-3"
                >
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {{ file.type }}
                    </span>
                    <span class="material-symbols-outlined text-outline group-hover:text-emerald-400 text-base transition-colors">
                      open_in_new
                    </span>
                  </div>

                  <div>
                    <h4 class="text-xs font-bold text-on-surface group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {{ file.eventName }}
                    </h4>
                    <p class="text-[11px] text-outline mt-0.5 truncate">{{ file.title }}</p>
                  </div>

                  <div class="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-outline">
                    <span class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">schedule</span> {{ file.timestamp }}
                    </span>
                  </div>
                </a>
              }
            </div>
          </div>

        </div>
      }

      <!-- MAIN CONTENT DASHBOARD GRID -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left 2 Cols: Quotes / Events Summary -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- Recent Events Status (Adaptive by Role) -->
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">analytics</span> 
                  @if (roleService.isEncargado()) {
                    Balance en Vivo de Eventos
                  } @else if (roleService.isAdmin()) {
                    Monitoreo Operativo de Eventos
                  } @else {
                    Eventos Próximos
                  }
                </h2>
                <p class="text-xs text-outline">
                  @if (roleService.isEncargado()) {
                    Métricas en tiempo real: Venta de boletos, vistas, costos operativos e ingresos actuales.
                  } @else if (roleService.isAdmin()) {
                    Métricas de aforo: Vistas de audiencia, boletos vendidos y boletos disponibles (Sin datos financieros).
                  } @else {
                    Fechas activas en cartelera y logística de producción
                  }
                </p>
              </div>
              <a routerLink="/events" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                Ver todos <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>

            @if (roleService.isEncargado()) {
              <!-- REAL-TIME FINANCIAL BALANCE CARDS FOR ENCARGADO ROLE ONLY -->
              <div class="space-y-5">
                @for (evt of getRealTimeEventsBalance(); track evt.id) {
                  <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-primary/50 transition-all shadow-sm space-y-4">
                    
                    <!-- Event Header Info -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div class="flex items-center gap-3">
                        <img [src]="evt.flyerUrl" [alt]="evt.title" class="w-12 h-12 rounded-xl object-cover ring-1 ring-primary/30" />
                        <div>
                          <div class="flex flex-wrap items-center gap-2">
                            <span class="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              {{ evt.groupName }}
                            </span>
                            @if (evt.isCoProduction) {
                              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-0.5">
                                <span class="material-symbols-outlined text-[10px]">handshake</span> Co-producción
                              </span>
                            }
                            <span class="text-[11px] font-semibold text-outline">{{ evt.date }}</span>
                            <span class="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> En Vivo
                            </span>
                          </div>
                          <h3 class="text-sm font-black text-on-surface mt-0.5">{{ evt.title }}</h3>
                        </div>
                      </div>

                      <div class="text-left sm:text-right">
                        <span class="text-[10px] font-bold text-outline uppercase block">Ingreso Total Actual Aprox.</span>
                        <span class="text-lg font-black text-emerald-400">
                          &#36;{{ evt.actualRevenue | number:'1.0-0' }} <span class="text-xs font-semibold text-outline">MXN</span>
                        </span>
                      </div>
                    </div>

                    <!-- Real-Time Metrics Grid (Tickets Sold, Fan Views, Operative Costs, Profit) -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-surface-container text-xs">
                      <div>
                        <span class="text-[10px] text-outline font-bold uppercase block">Boletos Vendidos</span>
                        <span class="font-black text-on-surface text-sm">{{ evt.ticketsSold | number }} / {{ evt.totalCapacity | number }}</span>
                        <span class="text-[10px] text-emerald-400 font-semibold block mt-0.5">({{ evt.ticketsPercentage }}% vendido)</span>
                      </div>

                      <div>
                        <span class="text-[10px] text-outline font-bold uppercase block">Alcance / Vistas</span>
                        <span class="font-black text-blue-400 text-sm flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">visibility</span> {{ evt.fanViews }}
                        </span>
                        <span class="text-[10px] text-outline block mt-0.5">Personas interesadas</span>
                      </div>

                      <div>
                        <span class="text-[10px] text-outline font-bold uppercase block">Costos Operativos</span>
                        <span class="font-black text-amber-400 text-sm">&#36;{{ evt.operativeCost | number:'1.0-0' }}</span>
                        <span class="text-[10px] text-outline block mt-0.5">Producción y recinto</span>
                      </div>

                      <div>
                        <span class="text-[10px] text-outline font-bold uppercase block">Ganancia Actual</span>
                        <span class="font-black text-emerald-400 text-sm">&#36;{{ evt.actualProfit | number:'1.0-0' }}</span>
                        <span class="text-[10px] text-emerald-400 font-semibold block mt-0.5">({{ evt.profitMargin }}% Margen)</span>
                      </div>
                    </div>

                    <!-- Ticket Sales Progress Bar -->
                    <div class="space-y-1 pt-1">
                      <div class="flex justify-between text-[11px] font-bold">
                        <span class="text-outline">Progreso Venta de Boletos</span>
                        <span class="text-primary">{{ evt.ticketsPercentage }}% Aforo Vendido</span>
                      </div>
                      <div class="w-full h-2.5 rounded-full bg-surface-bright overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500" [style.width.%]="evt.ticketsPercentage"></div>
                      </div>
                    </div>

                  </div>
                }
              </div>
            } @else if (roleService.isAdmin()) {
              <!-- OPERATIONAL MONITORING CARDS FOR ADMIN ROLE (NO FINANCES) -->
              <div class="space-y-5">
                @for (evt of getAdminEventsOverview(); track evt.id) {
                  <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-primary/50 transition-all shadow-sm space-y-4">
                    <!-- Event Header Info -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div class="flex items-center gap-3">
                        <img [src]="evt.flyerUrl" [alt]="evt.title" class="w-12 h-12 rounded-xl object-cover ring-1 ring-primary/30" />
                        <div>
                          <div class="flex flex-wrap items-center gap-2">
                            <span class="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              {{ evt.groupName }}
                            </span>
                            @if (evt.isCoProduction) {
                              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-0.5">
                                <span class="material-symbols-outlined text-[10px]">handshake</span> Co-producción
                              </span>
                            }
                            <span class="text-[11px] font-semibold text-outline">{{ evt.date }}</span>
                          </div>
                          <h3 class="text-sm font-black text-on-surface mt-0.5">{{ evt.title }}</h3>
                        </div>
                      </div>

                      <div class="text-left sm:text-right">
                        <span class="text-[10px] font-bold text-outline uppercase block">Estado Publicación</span>
                        <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {{ evt.status }}
                        </span>
                      </div>
                    </div>

                    <!-- Operational Metrics Grid (No Finances) -->
                    <div class="grid grid-cols-3 gap-3 p-3 rounded-xl bg-surface-container text-xs">
                      <div>
                        <span class="text-[10px] text-outline font-bold uppercase block">Boletos Vendidos</span>
                        <span class="font-black text-on-surface text-sm">{{ evt.ticketsSold | number }} / {{ evt.totalCapacity | number }}</span>
                        <span class="text-[10px] text-emerald-400 font-semibold block mt-0.5">({{ evt.ticketsPercentage }}% aforo)</span>
                      </div>

                      <div>
                        <span class="text-[10px] text-outline font-bold uppercase block">Boletos Disponibles</span>
                        <span class="font-black text-amber-400 text-sm">{{ evt.ticketsAvailable | number }}</span>
                        <span class="text-[10px] text-outline block mt-0.5">Disponibles en taquilla</span>
                      </div>

                      <div>
                        <span class="text-[10px] text-outline font-bold uppercase block">Alcance / Vistas</span>
                        <span class="font-black text-blue-400 text-sm flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">visibility</span> {{ evt.fanViews }}
                        </span>
                        <span class="text-[10px] text-outline block mt-0.5">Personas interesadas</span>
                      </div>
                    </div>

                    <!-- Ticket Sales Progress Bar -->
                    <div class="space-y-1 pt-1">
                      <div class="flex justify-between text-[11px] font-bold">
                        <span class="text-outline">Progreso Venta de Boletos</span>
                        <span class="text-primary">{{ evt.ticketsPercentage }}% Aforo Vendido</span>
                      </div>
                      <div class="w-full h-2.5 rounded-full bg-surface-bright overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500" [style.width.%]="evt.ticketsPercentage"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <!-- STANDARD EVENTS SUMMARY FOR STAFF / USER & OTHER ROLES -->
              <div class="space-y-4">
                @for (evt of mockData.events(); track evt.id) {
                  <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-all">
                    <div class="flex items-center gap-4">
                      <img [src]="evt.flyerUrl" [alt]="evt.title" class="w-14 h-14 rounded-xl object-cover ring-1 ring-primary/30" />
                      <div>
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {{ evt.groupName }}
                          </span>

                          <!-- Co-production Tag ONLY for ADMIN and MANAGER roles (Hidden from Staff) -->
                          @if (roleService.isAdminOrEncargado() && evt.isCoProduction) {
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-0.5">
                              <span class="material-symbols-outlined text-[10px]">handshake</span> Co-producción
                            </span>
                          }

                          <!-- Staff / User Specific Information & Evidence Completion Status Badge -->
                          @if (roleService.isUsuarioOnly()) {
                            <span 
                              [class]="evt.evidenceMedia && evt.evidenceMedia.length >= 2 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'"
                              class="text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1"
                            >
                              <span class="material-symbols-outlined text-[11px]">
                                {{ evt.evidenceMedia && evt.evidenceMedia.length >= 2 ? 'task_alt' : 'warning' }}
                              </span>
                              {{ evt.evidenceMedia && evt.evidenceMedia.length >= 2 ? 'Información Completa' : 'Falta Carga de Evidencia' }}
                            </span>
                          }
                        </div>
                        <h3 class="text-sm font-bold text-on-surface mt-1">{{ evt.title }}</h3>
                        <p class="text-xs text-outline flex items-center gap-1 mt-0.5">
                          <span class="material-symbols-outlined text-sm">location_on</span> {{ evt.venue }}, {{ evt.location }}
                        </p>
                      </div>
                    </div>

                    <div class="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-outline-variant/20">
                      <span class="text-xs font-bold text-on-surface bg-surface-bright px-2.5 py-1 rounded-lg">
                        {{ evt.date }}
                      </span>
                      <span
                        [class]="eventStateBadgeClass(evt.state)"
                        class="text-[11px] font-semibold px-2 py-0.5 rounded border"
                      >
                        {{ evt.state }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Section 2: Unrecorded Expenses for Encargado / Tasks for Other Roles -->
          @if (roleService.isEncargado()) {
            <!-- ENCARGADO ROLE: UNRECORDED EXPENSES / OFF-SYSTEM COSTS SECTION -->
            <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md space-y-6">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-bold text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-red-400">payments</span> Gastos No Registrados
                  </h2>
                  <p class="text-xs text-outline">Costos fuera del sistema automatizado asignados por dirección/encargados</p>
                </div>
                <span class="px-3 py-1 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                  Impacto Total: &#36;124,500 MXN
                </span>
              </div>

              <!-- Visual Financial Impact Chart & Data Summary -->
              <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-3">
                <div class="flex items-center justify-between text-xs font-bold">
                  <span class="text-on-surface">Distribución de Gastos Fuera de Sistema</span>
                  <span class="text-red-400 font-extrabold">-15.2% del Presupuesto Total</span>
                </div>

                <!-- Multi-segment Distribution Bar Chart -->
                <div class="w-full h-3.5 rounded-full bg-surface-bright flex overflow-hidden">
                  <div class="h-full bg-amber-400" style="width: 45%" title="Producción Directa Escénica (45%)"></div>
                  <div class="h-full bg-purple-400" style="width: 30%" title="Acuerdos de Palabra / Artistas (30%)"></div>
                  <div class="h-full bg-red-400" style="width: 25%" title="Imprevistos de Equipo (25%)"></div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                    <span class="text-outline">Producción: <strong class="text-on-surface">&#36;56,025</strong></span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0"></span>
                    <span class="text-outline">Acuerdos: <strong class="text-on-surface">&#36;37,350</strong></span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0"></span>
                    <span class="text-outline">Imprevistos: <strong class="text-on-surface">&#36;31,125</strong></span>
                  </div>
                </div>
              </div>

              <!-- List of Unrecorded Expense Items -->
              <div class="space-y-3">
                @for (item of getUnrecordedExpenses(); track item.id) {
                  <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-red-400/40 transition-all">
                    <div class="flex items-start gap-3">
                      <div class="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                        <span class="material-symbols-outlined text-lg">receipt_long</span>
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-bold text-on-surface">{{ item.category }}</span>
                          <span class="text-[10px] px-2 py-0.5 rounded bg-surface-bright text-outline border border-outline-variant/30">{{ item.date }}</span>
                        </div>
                        <h4 class="text-xs font-semibold text-on-surface mt-0.5">{{ item.description }}</h4>
                        <p class="text-[11px] text-outline mt-0.5">Asignado por: {{ item.assignedBy }} • Evento: {{ item.eventName }}</p>
                      </div>
                    </div>

                    <div class="text-left sm:text-right shrink-0">
                      <span class="text-sm font-black text-red-400 block">
                        -&#36;{{ item.amount | number:'1.0-0' }} MXN
                      </span>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {{ item.status }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else if (roleService.isAdmin()) {
            <!-- ADMIN ROLE: SYSTEM TASK OVERVIEW SECTION -->
            <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-lg font-bold text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">task_alt</span> Control General de Tareas Asignadas
                  </h2>
                  <p class="text-xs text-outline">Supervisión de actividades asignadas a encargados y equipo de staff</p>
                </div>
                <a routerLink="/tasks" class="text-xs font-bold text-primary hover:underline">Ir a Kanban</a>
              </div>

              <div class="space-y-3">
                @for (tsk of mockData.filteredTasks(); track tsk.id) {
                  <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-4">
                    <div class="flex items-start gap-3">
                      <button 
                        (click)="toggleTaskState(tsk.id, tsk.status)"
                        class="mt-0.5 text-outline hover:text-primary transition-colors"
                      >
                        <span class="material-symbols-outlined text-xl">
                          {{ tsk.status === 'Completada' ? 'check_circle' : 'radio_button_unchecked' }}
                        </span>
                      </button>
                      <div>
                        <div class="flex items-center gap-2">
                          <span 
                            [class]="tsk.privacy === 'Privada' ? 'bg-red-500/20 text-red-300 border-red-500/30' : tsk.privacy === 'Delicada' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'"
                            class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase"
                          >
                            {{ tsk.privacy }}
                          </span>
                          <span class="text-xs text-outline font-medium">Vence: {{ tsk.dueDate }}</span>
                        </div>
                        <h4 [class.line-through]="tsk.status === 'Completada'" class="text-sm font-bold text-on-surface mt-1">
                          {{ tsk.title }}
                        </h4>
                        <p class="text-xs text-outline mt-0.5">{{ tsk.description }}</p>
                      </div>
                    </div>

                    <span class="text-xs font-medium px-2.5 py-1 rounded-lg bg-surface-bright text-on-surface whitespace-nowrap">
                      {{ tsk.assignedTo }}
                    </span>
                  </div>
                }
              </div>
            </div>
          } @else {
            <!-- STAFF / USUARIO ROLE: PRESS ACCREDITATIONS & BADGE APPROVAL MANAGEMENT (SECTION 2) -->
            <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 class="text-lg font-bold text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-blue-400">badge</span> Gestión de Acreditaciones y Gafetes de Prensa
                  </h2>
                  <p class="text-xs text-outline">Revisión de identificaciones de periodistas, aprobación de pases e impresión de gafetes</p>
                </div>
                <span class="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 self-start sm:self-auto shrink-0">
                  5 Solicitudes Pendientes
                </span>
              </div>

              <!-- 5 Press Accreditation Metrics -->
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <!-- Card 1: Solicitudes Totales -->
                <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-1">
                  <span class="text-[10px] text-outline font-bold uppercase block">Solicitudes Totales</span>
                  <span class="text-base font-black text-on-surface">42 Pases</span>
                  <span class="text-[10px] text-outline block">Eventos de Firma y Ruedas</span>
                </div>

                <!-- Card 2: Gafetes Aprobados -->
                <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-1">
                  <span class="text-[10px] text-outline font-bold uppercase block">Gafetes Aprobados</span>
                  <span class="text-base font-black text-emerald-400">35 Listos</span>
                  <span class="text-[10px] text-emerald-400 font-semibold block">Acreditación válida</span>
                </div>

                <!-- Card 3: Pendientes de Revisión -->
                <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-1">
                  <span class="text-[10px] text-outline font-bold uppercase block">Por Revisar</span>
                  <span class="text-base font-black text-amber-400">5 Pendientes</span>
                  <span class="text-[10px] text-amber-400 font-semibold block">Requiere validación</span>
                </div>

                <!-- Card 4: Rechazados -->
                <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-1">
                  <span class="text-[10px] text-outline font-bold uppercase block">Sin Acreditar</span>
                  <span class="text-base font-black text-red-400">2 Rechazados</span>
                  <span class="text-[10px] text-red-400 font-semibold block">Identificación inválida</span>
                </div>

                <!-- Card 5: Cadenas de Medios -->
                <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-1">
                  <span class="text-[10px] text-outline font-bold uppercase block">Medios Registrados</span>
                  <span class="text-base font-black text-purple-400">18 Cadenas</span>
                  <span class="text-[10px] text-outline block">TV, Radio y Prensa</span>
                </div>
              </div>

              <!-- Press Accreditation Approval & Review Cards Grid -->
              <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-3">
                <div class="flex items-center justify-between text-xs font-bold">
                  <span class="text-on-surface flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-xs text-blue-400">rate_review</span>
                    Revisión y Aprobación de Credenciales Recientes
                  </span>
                  <span class="text-outline text-[11px]">Validación por Staff de Prensa</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <!-- Journalist 1 (Pending) -->
                  <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pendiente de Revisión
                      </span>
                      <span class="text-[10px] text-outline">TV / Foto</span>
                    </div>

                    <div>
                      <h4 class="text-xs font-bold text-on-surface">Carlos Mendoza</h4>
                      <p class="text-[11px] font-semibold text-blue-400">Milenio Noticias</p>
                      <p class="text-[10px] text-outline mt-0.5">Evento: Gala Norteña (Monterrey)</p>
                    </div>

                    <div class="pt-2 border-t border-outline-variant/20 flex items-center gap-2">
                      <button class="flex-1 py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 transition-colors flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-xs">check_circle</span> Aprobar
                      </button>
                      <button class="py-1 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold border border-red-500/20 transition-colors flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-xs">cancel</span> Rechazar
                      </button>
                    </div>
                  </div>

                  <!-- Journalist 2 (Approved) -->
                  <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ✅ Gafete Aprobado
                      </span>
                      <span class="text-[10px] text-outline">Entrevista VIP</span>
                    </div>

                    <div>
                      <h4 class="text-xs font-bold text-on-surface">Lucía Ramírez</h4>
                      <p class="text-[11px] font-semibold text-blue-400">TV Azteca Jalisco</p>
                      <p class="text-[10px] text-outline mt-0.5">Evento: Rueda Guadalajara</p>
                    </div>

                    <div class="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px]">
                      <span class="text-emerald-400 font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">print</span> Gafete #GF-892
                      </span>
                      <a routerLink="/files" class="text-primary hover:underline font-semibold">Ver Pase</a>
                    </div>
                  </div>

                  <!-- Journalist 3 (Pending) -->
                  <div class="p-3.5 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pendiente de Revisión
                      </span>
                      <span class="text-[10px] text-outline">Prensa Escrita</span>
                    </div>

                    <div>
                      <h4 class="text-xs font-bold text-on-surface">Roberto Gómez</h4>
                      <p class="text-[11px] font-semibold text-blue-400">Diario El Norte</p>
                      <p class="text-[10px] text-outline mt-0.5">Evento: Conferencia Acordex</p>
                    </div>

                    <div class="pt-2 border-t border-outline-variant/20 flex items-center gap-2">
                      <button class="flex-1 py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 transition-colors flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-xs">check_circle</span> Aprobar
                      </button>
                      <button class="py-1 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold border border-red-500/20 transition-colors flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-xs">cancel</span> Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

        <!-- Section 3: Press Conferences & Signing Events (Eventos de Firmas y Ruedas de Prensa - ALL ROLES) -->
        <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">newspaper</span> Eventos de Firmas y Ruedas de Prensa
                </h2>
                <p class="text-xs text-outline">
                  @if (roleService.isEncargado()) {
                    Trazabilidad de gastos operativos, asistencia de medios, prensa y aceptación de talento.
                  } @else if (roleService.isAdmin()) {
                    Monitoreo de asistencia de prensa, kits entregados y reseñas de medios de comunicación.
                  } @else {
                    Checklists de acreditación de medios, aforo de prensa y carga de evidencias oficiales.
                  }
                </p>
              </div>
              <span class="px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20 flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Medios y Prensa
              </span>
            </div>

            <!-- Press & Signing Event Cards Loop -->
            <div class="space-y-6">
              @for (pc of getPressConferencesAndSignings(); track pc.id) {
                <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-primary/50 transition-all shadow-sm space-y-5">
                  
                  <!-- Event Header Info -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <img [src]="pc.flyerUrl" [alt]="pc.title" class="w-12 h-12 rounded-xl object-cover ring-1 ring-primary/30" />
                      <div>
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {{ pc.groupName }}
                          </span>
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {{ pc.eventType }}
                          </span>
                          <span class="text-[11px] font-semibold text-outline">{{ pc.date }}</span>
                        </div>
                        <h3 class="text-sm font-black text-on-surface mt-1">{{ pc.title }}</h3>
                        <p class="text-xs text-outline flex items-center gap-1 mt-0.5">
                          <span class="material-symbols-outlined text-xs">location_on</span> {{ pc.venue }}
                        </p>
                      </div>
                    </div>

                    <!-- Role Adaptive Top Badge -->
                    @if (roleService.isEncargado()) {
                      <div class="text-left sm:text-right">
                        <span class="text-[10px] font-bold text-outline uppercase block">Gasto Operativo Real</span>
                        <span class="text-base font-black text-amber-400">
                          &#36;{{ pc.actualExpenses | number:'1.0-0' }} <span class="text-xs font-semibold text-outline">MXN</span>
                        </span>
                        <span class="text-[10px] text-emerald-400 font-semibold block">Presupuesto: &#36;{{ pc.assignedBudget | number:'1.0-0' }}</span>
                      </div>
                    } @else if (roleService.isAdmin()) {
                      <div class="text-left sm:text-right">
                        <span class="text-[10px] font-bold text-outline uppercase block">Sentimiento de Prensa</span>
                        <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {{ pc.mediaSentiment }} ({{ pc.positiveReviewsPercentage }}%)
                        </span>
                      </div>
                    } @else {
                      <div class="text-left sm:text-right">
                        <span class="text-[10px] font-bold text-outline uppercase block">Estatus de Evidencia</span>
                        <span [class]="pc.staffCompletionPercentage === 100 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'" class="text-xs font-bold px-2.5 py-1 rounded-lg border">
                          {{ pc.staffCompletionPercentage }}% Cargado
                        </span>
                      </div>
                    }
                  </div>

                  <!-- 1. FINANCIAL TRACKING (EXPENSES) - Available for Encargado (Detailed) & Admin (Budget) -->
                  @if (roleService.isEncargado()) {
                    <!-- Detailed Expenses Tracking for Encargado -->
                    <div class="p-4 rounded-xl bg-surface-container space-y-3">
                      <div class="flex items-center justify-between text-xs font-bold">
                        <span class="text-on-surface flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-xs text-amber-400">account_balance_wallet</span>
                          Seguimiento Financiero de Gastos Operativos
                        </span>
                        <span [class]="pc.expenseVariance <= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'">
                          {{ pc.expenseVariance <= 0 ? 'Bajo Presupuesto (-$' + (-pc.expenseVariance | number:'1.0-0') + ' MXN)' : 'Sobre Presupuesto (+$' + (pc.expenseVariance | number:'1.0-0') + ' MXN)' }}
                        </span>
                      </div>

                      <!-- Budget Consumption Progress Bar -->
                      <div class="space-y-1">
                        <div class="w-full h-2 rounded-full bg-surface-bright overflow-hidden">
                          <div class="h-full bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full" [style.width.%]="(pc.actualExpenses / pc.assignedBudget) * 100"></div>
                        </div>
                      </div>

                      <!-- Expense Itemized Breakdown Grid -->
                      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                        @for (item of pc.expenseBreakdown; track item.concept) {
                          <div class="p-2 rounded-lg bg-surface-container-high border border-outline-variant/20">
                            <span class="text-[10px] text-outline font-semibold block truncate">{{ item.concept }}</span>
                            <span class="font-bold text-on-surface text-xs">&#36;{{ item.amount | number:'1.0-0' }} MXN</span>
                          </div>
                        }
                      </div>
                    </div>
                  } @else if (roleService.isAdmin()) {
                    <!-- Presupuesto Operativo Asignado (Admin view: High-level budget tracking) -->
                    <div class="p-3 rounded-xl bg-surface-container flex items-center justify-between text-xs">
                      <span class="text-outline font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs text-primary">price_check</span> Presupuesto Asignado por Administración:
                      </span>
                      <span class="font-black text-on-surface">&#36;{{ pc.assignedBudget | number:'1.0-0' }} MXN</span>
                    </div>
                  }

                  <!-- 2. EVENT & PRESS METRICS GRID (ALL ROLES) -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-surface-container text-xs">
                    <!-- Attendance Analytics -->
                    <div>
                      <span class="text-[10px] text-outline font-bold uppercase block">Asistencia de Prensa</span>
                      <span class="font-black text-on-surface text-sm flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs text-primary">groups</span> {{ pc.pressAttendees }} Periodistas
                      </span>
                      <span class="text-[10px] text-outline block mt-0.5">{{ pc.mediaOutlets }} Cadenas de Medios</span>
                    </div>

                    <!-- Press Reviews & Coverage -->
                    <div>
                      <span class="text-[10px] text-outline font-bold uppercase block">Reseñas y Cobertura</span>
                      <span class="font-black text-emerald-400 text-sm flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">thumb_up</span> {{ pc.positiveReviewsPercentage }}% Positivas
                      </span>
                      <span class="text-[10px] text-outline block mt-0.5">{{ pc.featuredArticles }} Notas Destacadas</span>
                    </div>

                    <!-- Fan & Group Reception Stats -->
                    <div>
                      <span class="text-[10px] text-outline font-bold uppercase block">Recepción del Grupo</span>
                      <span class="font-black text-amber-400 text-sm flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">star</span> {{ pc.receptionRating }} / 5.0
                      </span>
                      <span class="text-[10px] text-outline block mt-0.5">{{ pc.autographsSigned }} Autógrafos</span>
                    </div>

                    <!-- Media Engagement -->
                    <div>
                      <span class="text-[10px] text-outline font-bold uppercase block">Interacción de Fans</span>
                      <span class="font-black text-blue-400 text-sm flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">favorite</span> {{ pc.fanEngagementRate }}
                      </span>
                      <span class="text-[10px] text-outline block mt-0.5">Aceptación general</span>
                    </div>
                  </div>

                  <!-- 3. STAFF EXECUTION SPECIFIC FOOTER FOR USUARIO/STAFF ROLE -->
                  @if (roleService.isUsuarioOnly()) {
                    <div class="p-3 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-on-surface flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-primary">checklist</span> Tarea de Evidencia Pendiente:
                        </span>
                        <span class="text-[10px] text-outline font-semibold">Coordinador: {{ pc.assignedStaffCoordinator }}</span>
                      </div>
                      <p class="text-[11px] text-outline">{{ pc.pendingStaffTask }}</p>
                      @if (pc.staffCompletionPercentage < 100) {
                        <a routerLink="/files" class="text-xs font-bold text-primary hover:underline flex items-center gap-1 pt-1">
                          <span class="material-symbols-outlined text-sm">cloud_upload</span> Subir Evidencias de Prensa
                        </a>
                      }
                    </div>
                  }

                </div>
              }
            </div>

          </div>

        </div>

        <!-- Right 1 Col: Audit Log & Quick Info (Adaptive by Role) -->
        <div class="space-y-8">
          
          @if (roleService.isUsuarioOnly()) {
            <!-- STAFF / USER ROLE SPECIFIC RIGHT COLUMN WIDGETS -->

            <!-- Staff Widget 1: Event Data & Evidence Completion Center -->
            <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md space-y-4">
              <div>
                <h2 class="text-base font-bold text-on-surface flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">cloud_sync</span> Carga de Información por Evento
                </h2>
                <p class="text-xs text-outline mt-0.5">Seguimiento de datos y evidencias requeridas por administración</p>
              </div>

              <div class="space-y-3">
                <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-on-surface">Noche de Gala Norteña 2026</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">80% Cargado</span>
                  </div>
                  <p class="text-[11px] text-outline">Pendiente: Subir fotografías de prueba de sonido y montaje de escenario.</p>
                  <a routerLink="/files" class="text-xs font-bold text-primary hover:underline flex items-center gap-1 pt-1">
                    <span class="material-symbols-outlined text-sm">cloud_upload</span> Subir Evidencia Faltante
                  </a>
                </div>

                <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-on-surface">Gran Palenque San Marcos 2026</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">50% Cargado</span>
                  </div>
                  <p class="text-[11px] text-outline">Pendiente: Carga de hoja de ruta de transporte y confirmación de accesos.</p>
                  <a routerLink="/files" class="text-xs font-bold text-primary hover:underline flex items-center gap-1 pt-1">
                    <span class="material-symbols-outlined text-sm">cloud_upload</span> Subir Evidencia Faltante
                  </a>
                </div>

                <div class="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-on-surface">Festival Tumbado Zapopan</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">100% Completo</span>
                  </div>
                  <p class="text-[11px] text-outline">Toda la documentación y archivos multimedia han sido entregados.</p>
                </div>
              </div>
            </div>

            <!-- Staff Widget 2: Detailed Workload Breakdown & Response Analytics (USER ROLE ONLY) -->
            <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md space-y-5">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-base font-bold text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">analytics</span> Análisis de Tiempos y Carga
                  </h2>
                  <p class="text-xs text-outline mt-0.5">Desglose descriptivo de tiempo invertido y velocidad por prioridad</p>
                </div>
                <a routerLink="/tasks" class="text-xs font-bold text-primary hover:underline">Ir a Kanban</a>
              </div>

              <!-- 1. General Workload Distribution by Category -->
              <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-3">
                <div class="flex items-center justify-between text-xs font-bold">
                  <span class="text-on-surface">Distribución por Categorías Generales</span>
                  <span class="text-primary font-extrabold">8.0 hrs/día</span>
                </div>

                <div class="space-y-2.5">
                  <!-- Category 1: Logistics & Field Ops -->
                  <div class="space-y-1">
                    <div class="flex justify-between text-[11px]">
                      <span class="text-on-surface font-bold flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-xs text-amber-400">build</span> Logística y Operaciones de Campo
                      </span>
                      <span class="text-amber-400 font-extrabold">45% (3.6 hrs)</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-surface-bright overflow-hidden">
                      <div class="h-full bg-amber-400 rounded-full" style="width: 45%"></div>
                    </div>
                    <span class="text-[10px] text-outline block">Montaje, pruebas de sonido, accesos a recintos y transporte</span>
                  </div>

                  <!-- Category 2: Documentation & Evidence -->
                  <div class="space-y-1">
                    <div class="flex justify-between text-[11px]">
                      <span class="text-on-surface font-bold flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-xs text-primary">folder_open</span> Documentación y Evidencias
                      </span>
                      <span class="text-primary font-extrabold">35% (2.8 hrs)</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-surface-bright overflow-hidden">
                      <div class="h-full bg-primary rounded-full" style="width: 35%"></div>
                    </div>
                    <span class="text-[10px] text-outline block">Carga de fotos de eventos, reportes de soporte y checklists</span>
                  </div>

                  <!-- Category 3: Coordination & Direction Support -->
                  <div class="space-y-1">
                    <div class="flex justify-between text-[11px]">
                      <span class="text-on-surface font-bold flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-xs text-purple-400">groups</span> Coordinación y Asistencia a Dirección
                      </span>
                      <span class="text-purple-400 font-extrabold">20% (1.6 hrs)</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-surface-bright overflow-hidden">
                      <div class="h-full bg-purple-400 rounded-full" style="width: 20%"></div>
                    </div>
                    <span class="text-[10px] text-outline block">Sincronización con Administradores y Encargados de evento</span>
                  </div>
                </div>
              </div>

              <!-- 2. Resolution Time Plot Curve by Priority -->
              <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 space-y-3">
                <div class="flex items-center justify-between text-xs font-bold">
                  <span class="text-on-surface">Tiempo Promedio de Resolución por Prioridad</span>
                  <span class="text-emerald-400 font-extrabold">Respuesta Rápida</span>
                </div>

                <!-- Resolution Speed SVG Curve Bar Plot -->
                <div class="grid grid-cols-3 gap-2 text-center pt-1">
                  <div class="p-2.5 rounded-xl bg-surface-container space-y-1">
                    <span class="text-[10px] font-bold text-red-400 uppercase block">Alta Prioridad</span>
                    <span class="text-sm font-black text-red-400">0.5 días</span>
                    <div class="w-full h-1.5 rounded-full bg-red-500/20 overflow-hidden">
                      <div class="h-full bg-red-400" style="width: 90%"></div>
                    </div>
                    <span class="text-[9px] text-outline block">Mismo día</span>
                  </div>

                  <div class="p-2.5 rounded-xl bg-surface-container space-y-1">
                    <span class="text-[10px] font-bold text-primary uppercase block">Normal</span>
                    <span class="text-sm font-black text-primary">1.8 días</span>
                    <div class="w-full h-1.5 rounded-full bg-primary/20 overflow-hidden">
                      <div class="h-full bg-primary" style="width: 60%"></div>
                    </div>
                    <span class="text-[9px] text-outline block">1 a 2 días</span>
                  </div>

                  <div class="p-2.5 rounded-xl bg-surface-container space-y-1">
                    <span class="text-[10px] font-bold text-outline uppercase block">Baja</span>
                    <span class="text-sm font-black text-on-surface">3.2 días</span>
                    <div class="w-full h-1.5 rounded-full bg-surface-bright overflow-hidden">
                      <div class="h-full bg-outline" style="width: 35%"></div>
                    </div>
                    <span class="text-[9px] text-outline block">Planificada</span>
                  </div>
                </div>
              </div>

              <!-- 3. Pending Approvals & Blockers (What Staff is waiting for from Admins/Managers) -->
              <div class="space-y-2">
                <span class="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-xs text-amber-400">pending_actions</span>
                  Pendientes de Revisión por Dirección
                </span>

                <div class="space-y-2">
                  <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-2 text-xs">
                    <div class="min-w-0">
                      <h4 class="font-bold text-on-surface truncate">Montaje de Cámara Escénica</h4>
                      <p class="text-[10px] text-outline truncate">Trabajo finalizado • En espera de aprobación de Ing. Mateo Rivas</p>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 shrink-0">
                      En Revisión
                    </span>
                  </div>

                  <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-2 text-xs">
                    <div class="min-w-0">
                      <h4 class="font-bold text-on-surface truncate">Verificación de Contrato Local</h4>
                      <p class="text-[10px] text-outline truncate">Evidencia entregada • En espera de validación de Lic. Claudia Morales</p>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 shrink-0">
                      Pendiente Validación
                    </span>
                  </div>
                </div>
              </div>

            </div>

          } @else {
            <!-- ADMIN & MANAGER ROLE RIGHT COLUMN WIDGETS -->

            <!-- Audit Log / Control History -->
            <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-base font-bold text-on-surface flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">admin_panel_settings</span> 
                  Historial de Operaciones y Control
                </h2>
                <div class="flex items-center gap-2">
                  <a routerLink="/users" class="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    Ver todos <span class="material-symbols-outlined text-sm">arrow_forward</span>
                  </a>
                </div>
              </div>
              <p class="text-xs text-outline mb-4">
                @if (roleService.isEncargado()) {
                  Registro global de movimientos ejecutivos, contratos y operaciones en todos los niveles.
                } @else {
                  Monitoreo de tareas, evidencias y operaciones ejecutadas exclusivamente por el personal de Staff.
                }
              </p>

              <div class="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/30">
                @for (log of getFilteredAuditLogs(); track log.id) {
                  <div class="pl-7 relative">
                    <div class="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-surface-container"></div>
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-bold text-primary">{{ log.userName }}</span>
                      <span class="text-[10px] text-outline">{{ log.timestamp }}</span>
                    </div>
                    <p class="text-xs font-semibold text-on-surface mt-0.5">{{ log.action }}</p>
                    <p class="text-[11px] text-outline leading-tight mt-0.5">{{ log.details }}</p>
                  </div>
                }
              </div>
            </div>

            <!-- Talent Quick Overview (Financial for Encargado, Operational for Admin) -->
            <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md space-y-4">
              <div>
                <h2 class="text-base font-bold text-on-surface flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">star</span> Talento en Cartelera
                </h2>
                @if (roleService.isEncargado()) {
                  <p class="text-xs text-outline mt-0.5">Rendimiento financiero, cotizaciones e ingresos por grupo</p>
                } @else {
                  <p class="text-xs text-outline mt-0.5">Métricas de gestión: Fechas confirmadas, cotizaciones activas y audiencia por talento</p>
                }
              </div>

              @if (roleService.isEncargado()) {
                <!-- RICH EXECUTIVE TALENT CARDS FOR MANAGER ROLE ONLY -->
                <div class="space-y-4">
                  @for (grp of getManagerTalentOverview(); track grp.id) {
                    <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-primary/40 transition-all space-y-3 shadow-sm">
                      <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                          <img [src]="grp.image" [alt]="grp.name" class="w-11 h-11 rounded-xl object-cover ring-1 ring-primary/30" />
                          <div>
                            <h4 class="text-xs font-black text-on-surface truncate">{{ grp.name }}</h4>
                            <span class="text-[10px] font-bold text-primary px-1.5 py-0.2 rounded bg-primary/10 border border-primary/20 inline-block mt-0.5">
                              {{ grp.disqueraType }}
                            </span>
                          </div>
                        </div>

                        <div class="text-right">
                          <span class="text-xs font-bold text-emerald-400">★ {{ grp.rating }}</span>
                        </div>
                      </div>

                      <div class="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface-container text-xs">
                        <div>
                          <span class="text-[10px] text-outline font-bold uppercase block">Cotizaciones</span>
                          <span class="font-black text-on-surface text-xs">{{ grp.signedQuotes }}/{{ grp.totalQuotes }} <span class="text-[9px] text-emerald-400 font-normal">Firmadas</span></span>
                        </div>
                        <div>
                          <span class="text-[10px] text-outline font-bold uppercase block">Ingreso Total</span>
                          <span class="font-black text-emerald-400 text-xs">&#36;{{ grp.totalRevenue | number:'1.0-0' }}</span>
                        </div>
                        <div>
                          <span class="text-[10px] text-outline font-bold uppercase block">Honorario Prom.</span>
                          <span class="font-black text-primary text-xs">&#36;{{ grp.averageFee | number:'1.0-0' }}</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <!-- OPERATIONAL TALENT CARDS FOR ADMIN ROLE ONLY (NO FINANCES) -->
                <div class="space-y-4">
                  @for (grp of getAdminTalentOverview(); track grp.id) {
                    <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-primary/40 transition-all space-y-3 shadow-sm">
                      <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                          <img [src]="grp.image" [alt]="grp.name" class="w-11 h-11 rounded-xl object-cover ring-1 ring-primary/30" />
                          <div>
                            <h4 class="text-xs font-black text-on-surface truncate">{{ grp.name }}</h4>
                            <span class="text-[10px] font-bold text-primary px-1.5 py-0.2 rounded bg-primary/10 border border-primary/20 inline-block mt-0.5">
                              {{ grp.disqueraType }}
                            </span>
                          </div>
                        </div>

                        <div class="text-right">
                          <span class="text-xs font-bold text-emerald-400">★ {{ grp.rating }}</span>
                        </div>
                      </div>

                      <div class="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface-container text-xs">
                        <div>
                          <span class="text-[10px] text-outline font-bold uppercase block">Fechas</span>
                          <span class="font-black text-emerald-400 text-xs">{{ grp.confirmedEvents }} Confirmadas</span>
                        </div>
                        <div>
                          <span class="text-[10px] text-outline font-bold uppercase block">Cotizaciones</span>
                          <span class="font-black text-amber-400 text-xs">{{ grp.activeQuotes }} Activas</span>
                        </div>
                        <div>
                          <span class="text-[10px] text-outline font-bold uppercase block">Seguidores</span>
                          <span class="font-black text-primary text-xs">{{ grp.followers }}</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

          }

        </div>

      </div>

    </div>
  `
})
export class DashboardComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  /** Color de la fase del evento, tomado de la misma fuente que usa el gestor de eventos. */
  eventStateBadgeClass(state: EventState): string {
    return eventStateMeta(state).badgeClass;
  }

  getUserTitle(): string {
    const role = this.roleService.activeRole();
    if (role === 'encargado') return 'Lic. Claudia Morales (Encargado)';
    if (role === 'administrador') return 'Ing. Mateo Rivas (Administrador)';
    return 'Jorge Staff Ruiz (Usuario)';
  }

  getPendingQuotesCount(): number {
    return this.mockData.quotes().filter(q => q.state === 'En revisión' || q.state === 'Propuesta enviada' || q.state === 'Negociación').length;
  }

  getUnrevisedQuotesCount(): number {
    return this.mockData.quotes().filter(q => q.state === 'En revisión').length;
  }

  getRevisedQuotesCount(): number {
    return this.mockData.quotes().filter(q => q.state !== 'En revisión').length;
  }

  getPopularGroup() {
    return this.mockData.groups()[0] || { name: 'Banda La Imperial' };
  }

  getManagerTalentOverview() {
    return [
      {
        id: 'mt1',
        name: 'Banda La Imperial',
        disqueraType: 'Exclusivo Disquera',
        rating: '4.9',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
        totalQuotes: 12,
        signedQuotes: 8,
        totalRevenue: 1450000,
        averageFee: 180000
      },
      {
        id: 'mt2',
        name: 'Los Reyes de Nuevo León',
        disqueraType: 'Co-gestión 50%',
        rating: '4.8',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
        totalQuotes: 10,
        signedQuotes: 6,
        totalRevenue: 1120000,
        averageFee: 160000
      },
      {
        id: 'mt3',
        name: 'Grupo Herencia Viva',
        disqueraType: 'En Desarrollo',
        rating: '4.7',
        image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80',
        totalQuotes: 7,
        signedQuotes: 4,
        totalRevenue: 680000,
        averageFee: 120000
      }
    ];
  }

  getAdminEventsOverview() {
    return [
      {
        id: 'ae1',
        title: 'Noche de Gala Norteña 2026',
        groupName: 'Banda La Imperial',
        isCoProduction: true,
        date: '15 Ago 2026',
        flyerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
        ticketsSold: 4250,
        totalCapacity: 5000,
        ticketsAvailable: 750,
        ticketsPercentage: 85,
        fanViews: '85.4K',
        status: 'Publicado'
      },
      {
        id: 'ae2',
        title: 'Gran Palenque San Marcos 2026',
        groupName: 'Los Reyes de Nuevo León',
        isCoProduction: false,
        date: '28 Sep 2026',
        flyerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
        ticketsSold: 6800,
        totalCapacity: 8000,
        ticketsAvailable: 1200,
        ticketsPercentage: 85,
        fanViews: '142.1K',
        status: 'Publicado'
      },
      {
        id: 'ae3',
        title: 'Festival Tumbado Zapopan',
        groupName: 'Grupo Herencia Viva',
        isCoProduction: true,
        date: '12 Oct 2026',
        flyerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80',
        ticketsSold: 3200,
        totalCapacity: 4500,
        ticketsAvailable: 1300,
        ticketsPercentage: 71,
        fanViews: '64.8K',
        status: 'En Revisión'
      }
    ];
  }

  getAdminTalentOverview() {
    return [
      {
        id: 'at1',
        name: 'Banda La Imperial',
        disqueraType: 'Exclusivo Disquera',
        rating: '4.9',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
        confirmedEvents: 5,
        activeQuotes: 4,
        followers: '450K'
      },
      {
        id: 'at2',
        name: 'Los Reyes de Nuevo León',
        disqueraType: 'Co-gestión 50%',
        rating: '4.8',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
        confirmedEvents: 4,
        activeQuotes: 3,
        followers: '320K'
      },
      {
        id: 'at3',
        name: 'Grupo Herencia Viva',
        disqueraType: 'En Desarrollo',
        rating: '4.7',
        image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80',
        confirmedEvents: 3,
        activeQuotes: 2,
        followers: '185K'
      }
    ];
  }

  getRealTimeEventsBalance() {
    return [
      {
        id: 'rt1',
        title: 'Noche de Gala Norteña 2026',
        groupName: 'Banda La Imperial',
        isCoProduction: true,
        date: '15 Ago 2026',
        flyerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
        ticketsSold: 4250,
        totalCapacity: 5000,
        ticketsPercentage: 85,
        fanViews: '85.4K',
        actualRevenue: 425000,
        operativeCost: 180000,
        actualProfit: 245000,
        profitMargin: 57.6
      },
      {
        id: 'rt2',
        title: 'Gran Palenque San Marcos 2026',
        groupName: 'Los Reyes de Nuevo León',
        date: '28 Sep 2026',
        flyerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
        ticketsSold: 6800,
        totalCapacity: 8000,
        ticketsPercentage: 85,
        fanViews: '142.1K',
        actualRevenue: 680000,
        operativeCost: 248000,
        actualProfit: 432000,
        profitMargin: 63.5
      },
      {
        id: 'rt3',
        title: 'Festival Tumbado Zapopan',
        groupName: 'Grupo Herencia Viva',
        date: '12 Oct 2026',
        flyerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80',
        ticketsSold: 3200,
        totalCapacity: 4500,
        ticketsPercentage: 71,
        fanViews: '64.8K',
        actualRevenue: 320000,
        operativeCost: 171000,
        actualProfit: 149000,
        profitMargin: 46.5
      }
    ];
  }

  getOperativeCostsBreakdown() {
    return [
      {
        id: 'op1',
        eventName: 'Noche de Gala Norteña 2026',
        groupName: 'Banda La Imperial',
        actualRevenue: 425000,
        totalOperativeCost: 180000,
        productionCost: 85000,
        venueCost: 60000,
        logisticsCost: 35000
      },
      {
        id: 'op2',
        eventName: 'Gran Palenque San Marcos 2026',
        groupName: 'Los Reyes de Nuevo León',
        actualRevenue: 680000,
        totalOperativeCost: 248000,
        productionCost: 115000,
        venueCost: 85000,
        logisticsCost: 48000
      },
      {
        id: 'op3',
        eventName: 'Festival Tumbado Zapopan',
        groupName: 'Grupo Herencia Viva',
        actualRevenue: 320000,
        totalOperativeCost: 171000,
        productionCost: 75000,
        venueCost: 56000,
        logisticsCost: 40000
      }
    ];
  }

  getUnrecordedExpenses() {
    return [
      {
        id: 'ue1',
        category: 'Producción Directa Escénica',
        description: 'Alquiler adicional de generador eléctrico de emergencia en recinto',
        amount: 56025,
        assignedBy: 'Lic. Claudia Morales',
        eventName: 'Noche de Gala Norteña 2026',
        date: '24 Jul 2026',
        status: 'Pendiente de Conciliación'
      },
      {
        id: 'ue2',
        category: 'Acuerdo Directo de Palabra',
        description: 'Bono en efectivo por extensión de tiempo en escenario principal',
        amount: 37350,
        assignedBy: 'Ing. Mateo Rivas',
        eventName: 'Gran Palenque San Marcos',
        date: '22 Jul 2026',
        status: 'Aprobado Fuera de Sistema'
      },
      {
        id: 'ue3',
        category: 'Imprevistos de Equipo',
        description: 'Reemplazo urgente de cableado y micrófonos inalámbricos',
        amount: 31125,
        assignedBy: 'Jorge Staff Ruiz',
        eventName: 'Festival Tumbado Zapopan',
        date: '20 Jul 2026',
        status: 'En Revisión'
      }
    ];
  }

  getLatestEvidenceUpload() {
    const eventsWithEvidence = this.mockData.events().filter(e => e.evidenceMedia && e.evidenceMedia.length > 0);
    if (eventsWithEvidence.length > 0 && eventsWithEvidence[0].evidenceMedia) {
      const latestMedia = eventsWithEvidence[0].evidenceMedia[eventsWithEvidence[0].evidenceMedia.length - 1];
      return {
        eventName: eventsWithEvidence[0].title,
        type: latestMedia.type === 'photo' ? 'Fotografía (JPG)' : latestMedia.type === 'video' ? 'Video (MP4)' : 'Documento',
        timestamp: latestMedia.uploadedAt || '2026-07-27 14:30'
      };
    }
    return {
      eventName: 'Noche de Gala Norteña 2026',
      type: 'Fotografía (JPG)',
      timestamp: '2026-07-27 14:30'
    };
  }

  getRecentEvidenceUploads() {
    return [
      { id: '1', eventName: 'Noche de Gala Norteña 2026', title: 'Prueba_de_Sonido_Escenario.jpg', type: 'Fotografía', timestamp: '2026-07-27 14:30' },
      { id: '2', eventName: 'Gran Palenque San Marcos 2026', title: 'Verificación_Iluminacion.mp4', type: 'Video', timestamp: '2026-07-26 18:15' },
      { id: '3', eventName: 'Festival Tumbado Zapopan', title: 'Checklist_Logistica.pdf', type: 'Documento', timestamp: '2026-07-25 11:00' },
      { id: '4', eventName: 'Noche de Gala Norteña 2026', title: 'Montaje_Camerinos.jpg', type: 'Fotografía', timestamp: '2026-07-24 16:45' },
      { id: '5', eventName: 'Gran Palenque San Marcos 2026', title: 'Prueba_Microfonos.mp4', type: 'Video', timestamp: '2026-07-23 09:20' }
    ];
  }

  getCompactTasksPreview() {
    const tasks = this.mockData.filteredTasks();
    if (tasks.length > 0) {
      return tasks.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate || 'Hoy, 18:00',
        priority: t.assignedRole === 'administrador' ? 'Alta' : 'Normal',
        status: t.status
      }));
    }
    return [
      { id: 't1', title: 'Subir prueba de sonido escenario', dueDate: 'Hoy, 18:00', priority: 'Alta', status: 'Pendiente' },
      { id: 't2', title: 'Revisión de transporte equipo', dueDate: 'Mañana, 12:00', priority: 'Normal', status: 'Pendiente' },
      { id: 't3', title: 'Verificación de accesos VIP', dueDate: '29 Jul, 15:30', priority: 'Normal', status: 'Completada' }
    ];
  }

  getTaskCompletionRate(): number {
    const tasks = this.mockData.filteredTasks();
    if (tasks.length === 0) return 100;
    const completed = tasks.filter(t => t.status === 'Completada').length;
    return Math.round((completed / tasks.length) * 100);
  }

  getCompletedTasksCount(): number {
    return this.mockData.filteredTasks().filter(t => t.status === 'Completada').length;
  }

  getPendingTasksCount(): number {
    return this.mockData.filteredTasks().filter(t => t.status !== 'Completada').length;
  }

  toggleTaskState(taskId: string, currentStatus: string): void {
    const nextStatus = currentStatus === 'Completada' ? 'Pendiente' : 'Completada';
    this.mockData.updateTaskStatus(taskId, nextStatus);
  }

  getPressConferencesAndSignings() {
    return [
      {
        id: 'pc1',
        title: 'Firma de Contrato Exclusivo y Conferencia de Prensa 2026',
        groupName: 'Banda La Imperial',
        date: '10 Ago 2026',
        venue: 'Hotel Fiesta Americana, Guadalajara',
        flyerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
        eventType: 'Firma y Rueda de Prensa',
        
        // Press & Media Attendance
        pressAttendees: 48,
        mediaOutlets: 16,
        pressKitsDelivered: 45,
        
        // Press Reviews & Media Coverage
        positiveReviewsPercentage: 94,
        featuredArticles: 18,
        mediaSentiment: 'Altamente Positivo',
        
        // Public & Fan Reception Stats
        receptionRating: 4.9,
        autographsSigned: 850,
        fanEngagementRate: '96%',
        
        // Financial Expenses (For Encargado/Manager & traceable budget for Admin)
        assignedBudget: 85000,
        actualExpenses: 78500,
        expenseVariance: -6500,
        expenseBreakdown: [
          { concept: 'Renta de Salón y Audiovisual', amount: 35000 },
          { concept: 'Catering y Atención a Prensa', amount: 22500 },
          { concept: 'Kits de Prensa y Merchandising', amount: 12000 },
          { concept: 'Seguridad y Logística de Firma', amount: 9000 }
        ],
        
        // Staff Execution Checklists (For Usuario/Staff role)
        staffCompletionPercentage: 85,
        pendingStaffTask: 'Subir fotografías oficiales del photocall y lista final de periodistas',
        assignedStaffCoordinator: 'Jorge Staff Ruiz'
      },
      {
        id: 'pc2',
        title: 'Lanzamiento Oficial de Disco y Convivencia con Fans',
        groupName: 'Los Reyes de Nuevo León',
        date: '22 Sep 2026',
        venue: 'Centro de Convenciones, Monterrey',
        flyerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
        eventType: 'Firma de Autógrafos',
        
        // Press & Media Attendance
        pressAttendees: 36,
        mediaOutlets: 12,
        pressKitsDelivered: 35,
        
        // Press Reviews & Media Coverage
        positiveReviewsPercentage: 91,
        featuredArticles: 14,
        mediaSentiment: 'Muy Positivo',
        
        // Public & Fan Reception Stats
        receptionRating: 4.8,
        autographsSigned: 1200,
        fanEngagementRate: '94%',
        
        // Financial Expenses
        assignedBudget: 110000,
        actualExpenses: 104200,
        expenseVariance: -5800,
        expenseBreakdown: [
          { concept: 'Producción de Escenario y Backstage', amount: 48000 },
          { concept: 'Atención a Medios y Logística', amount: 31200 },
          { concept: 'Seguridad de Vallas y Accesos', amount: 25000 }
        ],
        
        // Staff Execution Checklists
        staffCompletionPercentage: 100,
        pendingStaffTask: 'Evidencia e información 100% completada',
        assignedStaffCoordinator: 'Jorge Staff Ruiz'
      }
    ];
  }

  getFilteredAuditLogs() {
    const allLogs = this.mockData.auditLogs();
    if (this.roleService.isEncargado()) {
      return allLogs.slice(0, 5);
    }
    return allLogs
      .filter(log => log.role === 'usuario')
      .slice(0, 5);
  }
}
