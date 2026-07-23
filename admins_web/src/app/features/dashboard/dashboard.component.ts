import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
                Resumen ejecutivo financiero, cotizaciones críticas y estado general de la disquera.
              } @else if (roleService.isAdminOrEncargado()) {
                Control operativo de eventos, cotizaciones activas y seguimiento de bandas firmadas.
              } @else {
                Panel de trabajo de campo. Tareas asignadas y subida de evidencia multimedia.
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
                <span class="material-symbols-outlined text-lg">add_circle</span> Nueva Cotización
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
          
          <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden hover:border-primary/50 transition-all shadow-md group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Ingresos Confirmados</span>
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-2xl">attach_money</span>
              </div>
            </div>
            <p class="text-2xl font-black text-on-surface mt-3">
              &#36;{{ mockData.financialKpis().totalGrossRevenue | number:'1.0-0' }} <span class="text-xs font-medium text-outline">MXN</span>
            </p>
            <div class="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
              <span class="material-symbols-outlined text-sm">trending_up</span>
              <span>+18.4% vs mes anterior</span>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden hover:border-primary/50 transition-all shadow-md group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Ganancia Neta Disquera</span>
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-2xl">savings</span>
              </div>
            </div>
            <p class="text-2xl font-black text-emerald-400 mt-3">
              &#36;{{ mockData.financialKpis().totalNetProfit | number:'1.0-0' }} <span class="text-xs font-medium text-outline">MXN</span>
            </p>
            <div class="flex items-center gap-1.5 text-xs text-outline mt-2 font-medium">
              <span>Margen estimado 25% global</span>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden hover:border-primary/50 transition-all shadow-md group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Cotizaciones Pendientes</span>
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-2xl">pending_actions</span>
              </div>
            </div>
            <p class="text-2xl font-black text-on-surface mt-3">
              &#36;{{ mockData.financialKpis().pendingQuotesAmount | number:'1.0-0' }} <span class="text-xs font-medium text-outline">MXN</span>
            </p>
            <div class="flex items-center gap-1.5 text-xs text-amber-400 mt-2 font-medium">
              <span class="material-symbols-outlined text-sm">info</span>
              <span>{{ mockData.quotes().length }} cotizaciones activas</span>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden hover:border-primary/50 transition-all shadow-md group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Audiencia Estimada</span>
              <div class="w-10 h-10 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-2xl">family_history</span>
              </div>
            </div>
            <p class="text-2xl font-black text-on-surface mt-3">
              142,500 <span class="text-xs font-medium text-outline">Fans</span>
            </p>
            <div class="flex items-center gap-1.5 text-xs text-secondary mt-2 font-medium">
              <span class="material-symbols-outlined text-sm">groups</span>
              <span>4 Talentos activos</span>
            </div>
          </div>

        </div>
      } @else if (roleService.isAdminOrEncargado()) {
        <!-- ADMINISTRADOR ROLE: OPERATIONAL KPIS (NO FINANCES) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden hover:border-primary/50 transition-all shadow-md group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Eventos Próximos</span>
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-2xl">event_available</span>
              </div>
            </div>
            <p class="text-2xl font-black text-on-surface mt-3">
              {{ mockData.events().length }} <span class="text-xs font-medium text-outline">Fechas</span>
            </p>
            <p class="text-xs text-emerald-400 mt-2 font-medium">1 con Co-producción pendiente</p>
          </div>

          <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden hover:border-primary/50 transition-all shadow-md group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Cotizaciones en Pipeline</span>
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-2xl">ballot</span>
              </div>
            </div>
            <p class="text-2xl font-black text-on-surface mt-3">
              {{ mockData.quotes().length }} <span class="text-xs font-medium text-outline">Propuestas</span>
            </p>
            <p class="text-xs text-amber-400 mt-2 font-medium">Revisión operativa al día</p>
          </div>

          <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden hover:border-primary/50 transition-all shadow-md group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Grupos Firmados</span>
              <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-2xl">music_note</span>
              </div>
            </div>
            <p class="text-2xl font-black text-on-surface mt-3">
              {{ mockData.groups().length }} <span class="text-xs font-medium text-outline">Talentos</span>
            </p>
            <p class="text-xs text-outline mt-2 font-medium">Exclusivos y Co-gestionados</p>
          </div>

          <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden hover:border-primary/50 transition-all shadow-md group">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Tareas Pendientes</span>
              <div class="w-10 h-10 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-2xl">checklist</span>
              </div>
            </div>
            <p class="text-2xl font-black text-on-surface mt-3">
              {{ mockData.filteredTasks().length }} <span class="text-xs font-medium text-outline">Asignadas</span>
            </p>
            <p class="text-xs text-secondary mt-2 font-medium">Operación sin datos privados</p>
          </div>

        </div>
      } @else {
        <!-- USUARIO ROLE: FIELD KPIS & ASSIGNED TASKS ONLY -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden hover:border-primary/50 transition-all shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Tus Tareas Asignadas</span>
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">task</span>
              </div>
            </div>
            <p class="text-3xl font-black text-on-surface mt-3">
              {{ mockData.filteredTasks().length }}
            </p>
            <p class="text-xs text-primary mt-2 font-medium">Solo tareas públicas de campo</p>
          </div>

          <div class="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 relative overflow-hidden hover:border-primary/50 transition-all shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Carga de Evidencia Multimedia</span>
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <span class="material-symbols-outlined text-2xl">add_a_photo</span>
              </div>
            </div>
            <p class="text-sm font-bold text-on-surface mt-3">
              Subida habilitada en cada Evento
            </p>
            <p class="text-xs text-emerald-400 mt-2 font-medium">Fotos y videos de pruebas de sonido</p>
          </div>

        </div>
      }

      <!-- MAIN CONTENT DASHBOARD GRID -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left 2 Cols: Quotes / Events Summary -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- Recent Events Status -->
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">event_available</span> Eventos Próximos
                </h2>
                <p class="text-xs text-outline">Fechas activas en cartelera y logística de producción</p>
              </div>
              <a routerLink="/events" class="text-xs font-bold text-primary hover:underline">Ver todos</a>
            </div>

            <div class="space-y-4">
              @for (evt of mockData.events(); track evt.id) {
                <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-all">
                  <div class="flex items-center gap-4">
                    <img [src]="evt.flyerUrl" [alt]="evt.title" class="w-14 h-14 rounded-xl object-cover ring-1 ring-primary/30" />
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {{ evt.groupName }}
                        </span>
                        @if (evt.isCoProduction) {
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-0.5">
                            <span class="material-symbols-outlined text-[10px]">handshake</span> Co-producción
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
                      [class]="evt.status === 'Publicado' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'"
                      class="text-[11px] font-semibold px-2 py-0.5 rounded border border-current/20"
                    >
                      {{ evt.status }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Pending Tasks Section (Filtered by Role) -->
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">task_alt</span> Tareas Asignadas
                </h2>
                <p class="text-xs text-outline">Visualización según permisos del rol activo</p>
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

        </div>

        <!-- Right 1 Col: Audit Log & Quick Info -->
        <div class="space-y-8">
          
          <!-- Recent Audit Trail Log -->
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">history</span> Bitácora de Auditoría
              </h2>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Audit Trail</span>
            </div>
            <p class="text-xs text-outline mb-4">Registro en tiempo real de operaciones en sesión</p>

            <div class="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/30">
              @for (log of mockData.auditLogs().slice(0, 5); track log.id) {
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

          <!-- Talent Quick Overview -->
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-md">
            <h2 class="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">star</span> Talento en Cartelera
            </h2>

            <div class="space-y-3">
              @for (grp of mockData.isolatedGroups(); track grp.id) {
                <div class="p-3 rounded-2xl bg-surface-container-high flex items-center gap-3">
                  <img [src]="grp.image" [alt]="grp.name" class="w-10 h-10 rounded-xl object-cover" />
                  <div class="flex-1 min-w-0">
                    <h4 class="text-xs font-bold text-on-surface truncate">{{ grp.name }}</h4>
                    <p class="text-[10px] text-primary font-medium truncate">{{ grp.disqueraType }}</p>
                  </div>
                  <div class="text-right">
                    <span class="text-xs font-bold text-emerald-400">★ {{ grp.rating }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>

      </div>

    </div>
  `
})
export class DashboardComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  getUserTitle(): string {
    const role = this.roleService.activeRole();
    if (role === 'encargado') return 'Lic. Claudia Morales (Encargado)';
    if (role === 'administrador') return 'Ing. Mateo Rivas (Administrador)';
    return 'Jorge Staff Ruiz (Usuario)';
  }

  toggleTaskState(taskId: string, currentStatus: string): void {
    const nextStatus = currentStatus === 'Completada' ? 'Pendiente' : 'Completada';
    this.mockData.updateTaskStatus(taskId, nextStatus);
  }
}
