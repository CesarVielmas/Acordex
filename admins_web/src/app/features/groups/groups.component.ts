import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { GroupItem } from '../../core/models/admin.models';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display-xl text-2xl font-black text-on-surface">Catálogo de Grupos & Talento</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Multi-Disquera
            </span>
          </div>
          <p class="text-xs text-outline mt-1">Gestión de bandas exclusivas, co-gestionadas e independientes con aislamiento de datos</p>
        </div>
      </div>

      <!-- DATA ISOLATION NOTICE BANNER (CRITICAL REQUIREMENT #1) -->
      <div class="p-4 rounded-2xl bg-surface-container-high border border-primary/30 flex items-start gap-3 shadow-md">
        <span class="material-symbols-outlined text-2xl text-primary mt-0.5">verified</span>
        <div class="text-xs">
          <span class="font-bold text-on-surface block text-sm">Filtro de Sesión Activa: Acordex Records</span>
          <p class="text-outline mt-0.5">
            Para bandas de tipo <strong class="text-purple-300">Co-gestionado</strong> o <strong class="text-amber-300">Independiente</strong>, el sistema aísla y presenta <u>únicamente</u> las cotizaciones, eventos y ganancias derivadas de los contratos celebrados bajo la firma de <strong>Acordex Records</strong>.
          </p>
        </div>
      </div>

      <!-- GROUPS GRID -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        @for (grp of mockData.isolatedGroups(); track grp.id) {
          <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 hover:border-primary/50 transition-all duration-300 shadow-xl flex flex-col justify-between group">
            
            <div>
              <div class="flex items-start gap-4">
                <img [src]="grp.image" [alt]="grp.name" class="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary/40 shadow-md group-hover:scale-105 transition-transform" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span [class]="getContractBadgeClass(grp.disqueraType)" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border">
                      {{ grp.disqueraType }}
                    </span>
                    <span class="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5">
                      ★ {{ grp.rating }}
                    </span>
                  </div>

                  <h3 class="text-lg font-black text-on-surface mt-1 group-hover:text-primary transition-colors truncate">
                    {{ grp.name }}
                  </h3>
                  <p class="text-xs text-outline mt- my-0.5 font-medium">{{ grp.genre }} • {{ grp.membersCount }} Integrantes</p>
                  <p class="text-[11px] text-outline/80 mt-1 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">domain</span> {{ grp.disqueraName }}
                  </p>
                </div>
              </div>

              <p class="text-xs text-on-surface-variant mt-4 line-clamp-2 leading-relaxed">
                {{ grp.description }}
              </p>
            </div>

            <!-- ISOLATED METRICS DISPLAY -->
            <div class="mt-6 pt-4 border-t border-outline-variant/20 space-y-3">
              <div class="grid grid-cols-3 gap-2 bg-surface-container-high p-3 rounded-2xl text-center text-xs">
                <div>
                  <span class="text-[10px] text-outline uppercase block font-bold">Cotizaciones</span>
                  <span class="font-black text-on-surface text-sm">{{ grp.labelQuotesCount }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-outline uppercase block font-bold">Eventos Activos</span>
                  <span class="font-black text-primary text-sm">{{ grp.labelActiveEventsCount }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-outline uppercase block font-bold">Ingreso Acordex</span>
                  @if (roleService.canViewFinances()) {
                    <span class="font-black text-emerald-400 text-sm">&#36;{{ grp.labelRevenueAcordex | number:'1.0-0' }}</span>
                  } @else {
                    <span class="font-bold text-outline text-xs">Confidencial</span>
                  }
                </div>
              </div>

              <button 
                (click)="selectedGroup.set(grp)"
                class="w-full py-2.5 rounded-xl bg-surface-container-highest hover:bg-primary hover:text-on-primary font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <span class="material-symbols-outlined text-sm">info</span> Ver Ficha Completa & Eventos
              </button>
            </div>

          </div>
        }
      </div>

      <!-- DETAIL GROUP MODAL -->
      @if (selectedGroup()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-surface-container p-6 sm:p-8 rounded-3xl border border-outline-variant/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 shadow-2xl">
            
            <div class="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div class="flex items-center gap-3">
                <img [src]="selectedGroup()?.image" [alt]="selectedGroup()?.name" class="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary" />
                <div>
                  <h3 class="text-xl font-bold text-on-surface">{{ selectedGroup()?.name }}</h3>
                  <span [class]="getContractBadgeClass(selectedGroup()?.disqueraType || 'Firmado Exclusivo')" class="px-2.5 py-0.5 rounded-full text-xs font-bold border">
                    {{ selectedGroup()?.disqueraType }}
                  </span>
                </div>
              </div>

              <button (click)="selectedGroup.set(null)" class="text-outline hover:text-on-surface p-1 rounded-xl bg-surface-container-high">
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <!-- Isolation Alert in Modal -->
            <div class="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs">
              <strong>Nota de Aislamiento Contractual:</strong> 
              {{ selectedGroup()?.description }}
            </div>

            <div class="space-y-3 text-xs">
              <h4 class="font-bold text-on-surface uppercase tracking-wider text-[11px] text-outline">Cotizaciones Asociadas a Acordex</h4>

              <div class="space-y-2">
                @for (q of getQuotesForGroup(selectedGroup()?.name || ''); track q.id) {
                  <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between">
                    <div>
                      <span class="font-bold text-primary">{{ q.id }}</span>
                      <span class="text-on-surface font-semibold ml-2">{{ q.venue }} ({{ q.city }})</span>
                      <span class="text-outline block text-[11px]">{{ q.proposedDate }}</span>
                    </div>

                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {{ q.state }}
                    </span>
                  </div>
                }
              </div>
            </div>

            <div class="flex justify-end pt-4 border-t border-outline-variant/30">
              <button (click)="selectedGroup.set(null)" class="px-5 py-2.5 rounded-xl bg-surface-bright text-on-surface font-semibold text-xs">
                Cerrar Ficha
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class GroupsComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  selectedGroup = signal<GroupItem | null>(null);

  getContractBadgeClass(type: string): string {
    switch (type) {
      case 'Firmado Exclusivo': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Co-gestionado': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Independiente / Por Evento': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-surface-bright text-outline';
    }
  }

  getQuotesForGroup(groupName: string) {
    return this.mockData.quotes().filter(q => q.groupName === groupName);
  }
}
