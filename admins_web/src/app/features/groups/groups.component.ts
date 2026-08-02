import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { GroupItem } from '../../core/models/admin.models';
import { BadgeComponent, BadgeVariant } from '../../shared/ui/badge/badge.component';
import { EntityCardComponent } from '../../shared/ui/entity-card/entity-card.component';
import { InfoBannerComponent } from '../../shared/ui/info-banner/info-banner.component';
import { ModalShellComponent } from '../../shared/ui/modal-shell/modal-shell.component';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, BadgeComponent, EntityCardComponent, InfoBannerComponent, ModalShellComponent],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="font-display-xl text-xl sm:text-2xl font-black text-on-surface">Catálogo de Grupos & Talento</h1>
            <app-badge label="Multi-Disquera" variant="purple" />
          </div>
          <p class="text-xs text-outline mt-1">Gestión de bandas exclusivas, co-gestionadas e independientes con aislamiento de datos</p>
        </div>
      </div>

      <!-- DATA ISOLATION NOTICE BANNER (CRITICAL REQUIREMENT #1) -->
      <app-info-banner icon="verified" title="Filtro de Sesión Activa: Acordex Records">
        Para bandas de tipo <strong class="text-purple-300">Co-gestionado</strong> o <strong class="text-amber-300">Independiente</strong>, el sistema aísla y presenta <u>únicamente</u> las cotizaciones, eventos y ganancias derivadas de los contratos celebrados bajo la firma de <strong>Acordex Records</strong>.
      </app-info-banner>

      <!-- GROUPS GRID -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        @for (grp of mockData.isolatedGroups(); track grp.id) {
          <app-entity-card [title]="grp.name" [subtitle]="grp.genre + ' • ' + grp.membersCount + ' Integrantes'" [description]="grp.description">
            <img card-visual [src]="grp.image" [alt]="grp.name" class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-primary/40 shadow-md" />

            <ng-container card-badges>
              <app-badge [label]="grp.disqueraType" [variant]="getContractBadgeVariant(grp.disqueraType)" />
              <span class="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5">★ {{ grp.rating }}</span>
            </ng-container>

            <div card-stats class="pt-2">
              <p class="text-[11px] text-outline/80 mb-3 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">domain</span> {{ grp.disqueraName }}
              </p>
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
            </div>

            <div card-footer>
              <button
                (click)="selectedGroup.set(grp)"
                class="w-full py-2.5 min-h-11 rounded-xl bg-surface-container-highest hover:bg-primary hover:text-on-primary font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <span class="material-symbols-outlined text-sm">info</span> Ver Ficha Completa & Eventos
              </button>
            </div>
          </app-entity-card>
        }
      </div>

      <!-- DETAIL GROUP MODAL -->
      @if (selectedGroup(); as group) {
        <app-modal-shell [title]="group.name" size="2xl" [hasFooter]="true" (closed)="selectedGroup.set(null)">
          <div class="space-y-5">
            <div class="flex items-center gap-3">
              <img [src]="group.image" [alt]="group.name" class="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary shrink-0" />
              <app-badge [label]="group.disqueraType" [variant]="getContractBadgeVariant(group.disqueraType)" />
            </div>

            <!-- Isolation Alert in Modal -->
            <div class="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs">
              <strong>Nota de Aislamiento Contractual:</strong>
              {{ group.description }}
            </div>

            <div class="space-y-3 text-xs">
              <h4 class="font-bold text-on-surface uppercase tracking-wider text-[11px] text-outline">Cotizaciones Asociadas a Acordex</h4>

              <div class="space-y-2">
                @for (q of getQuotesForGroup(group.name); track q.id) {
                  <div class="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between gap-2">
                    <div class="min-w-0">
                      <span class="font-bold text-primary">{{ q.id }}</span>
                      <span class="text-on-surface font-semibold ml-2">{{ q.venue }} ({{ q.city }})</span>
                      <span class="text-outline block text-[11px]">{{ q.proposedDate }}</span>
                    </div>

                    <app-badge [label]="q.state" variant="primary" />
                  </div>
                }
              </div>
            </div>
          </div>

          <ng-container modal-footer>
            <button (click)="selectedGroup.set(null)" class="px-5 py-2.5 min-h-11 rounded-xl bg-surface-bright text-on-surface font-semibold text-xs">
              Cerrar Ficha
            </button>
          </ng-container>
        </app-modal-shell>
      }

    </div>
  `
})
export class GroupsComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  selectedGroup = signal<GroupItem | null>(null);

  getContractBadgeVariant(type: string): BadgeVariant {
    switch (type) {
      case 'Firmado Exclusivo': return 'success';
      case 'Co-gestionado': return 'purple';
      case 'Independiente / Por Evento': return 'warning';
      default: return 'neutral';
    }
  }

  getQuotesForGroup(groupName: string) {
    return this.mockData.quotes().filter(q => q.groupName === groupName);
  }
}
