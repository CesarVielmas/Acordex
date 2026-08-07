import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { LayoutStateService } from '../../core/services/layout_state.service';
import { GroupItem } from '../../core/models/admin.models';

import { BadgeComponent } from '../../shared/ui/badge/badge.component';

// Modular Child Components
import { GroupKpiCardsComponent } from './components/group-kpi-cards.component';
import { GroupFiltersToolbarComponent, GroupFiltersState } from './components/group-filters-toolbar.component';
import { GroupCardComponent } from './components/group-card.component';
import { GroupInsightsPanelComponent } from './components/group-insights-panel.component';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    GroupKpiCardsComponent,
    GroupFiltersToolbarComponent,
    GroupCardComponent,
    GroupInsightsPanelComponent,
  ],
  template: `
    <div class="space-y-6 animate-fade-in pb-12">

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="font-display-xl text-xl sm:text-2xl font-black text-on-surface">Catálogo de Grupos & Talento</h1>
            <app-badge label="Multi-Disquera & Booking" variant="purple" />
          </div>
          <p class="text-xs text-outline mt-1">Gestión de bandas exclusivas, co-gestionadas e independientes con métricas avanzadas por agrupación</p>
        </div>
      </div>

      <!-- 1. GENERAL KPI CARDS HEADER -->
      <app-group-kpi-cards
        [topApprovedGroup]="mockData.topApprovedGroup()"
        [pendingContractsCount]="mockData.pendingContractGroupsCount()"
        [externalGroupsCount]="mockData.externalOrNonExclusiveCount()"
        [monthlyEventsStats]="mockData.monthlyEventsStats()"
        [monthlyQuotesStats]="mockData.monthlyQuotesStats()"
      />

      <!-- 2. MAIN WORKSPACE: TWO COLUMN LAYOUT WITH HIGH STACKING ORDER ON LEFT -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT COLUMN: Toolbar Filters + Group Cards Grid (7 Cols - High Z-Index) -->
        <div class="lg:col-span-7 space-y-4 relative z-20">
          
          <!-- Filters Toolbar (High Z-Index Container) -->
          <div class="relative z-30">
            <app-group-filters-toolbar
              (filtersChanged)="onFiltersChanged($event)"
            />
          </div>

          <!-- Group Cards Grid Section (Z-10 Container) -->
          <div class="space-y-4 relative z-10">
            <div class="flex items-center justify-between px-1">
              <span class="text-xs font-black uppercase tracking-wider text-outline">
                Mostrando {{ filteredGroups().length }} Agrupaciones Musicales
              </span>
            </div>

            <div class="grid grid-cols-1 gap-4">
              @for (group of filteredGroups(); track group.id) {
                <app-group-card
                  [group]="group"
                  [isSelectedForInsights]="selectedGroupForInsights()?.id === group.id"
                  (openDetail)="openGroupDetail($event)"
                  (selectForInsights)="selectGroupForInsights($event)"
                />
              } @empty {
                <div class="p-12 text-center bg-surface-container-high rounded-3xl border border-outline-variant/30 space-y-2">
                  <span class="material-symbols-outlined text-4xl text-outline">search_off</span>
                  <p class="text-sm text-outline font-bold">No se encontraron grupos que coincidan con los filtros.</p>
                  <button (click)="resetAllFilters()" class="text-xs text-primary font-bold hover:underline">Limpiar todos los filtros</button>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN: Dedicated Group Insights Panel (5 Cols - Lower Z-Index) -->
        <div class="lg:col-span-5 relative z-10">
          <app-group-insights-panel
            #insightsPanel
            [groups]="mockData.groups()"
          />
        </div>

      </div>

      <!-- El expediente del grupo se monta en main-layout, no aquí:
           dentro de <main> quedaría por debajo del sidebar. -->

    </div>
  `
})
export class GroupsComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);
  layoutState = inject(LayoutStateService);

  @ViewChild('insightsPanel') insightsPanel?: GroupInsightsPanelComponent;

  selectedGroupForInsights = signal<GroupItem | null>(null);

  filterState = signal<GroupFiltersState>({
    searchTerm: '',
    disqueraType: 'ALL',
    agendaStatus: 'ALL',
    platformStatus: 'ALL',
    genre: 'ALL'
  });

  filteredGroups = computed<GroupItem[]>(() => {
    const list = this.mockData.groups();
    const f = this.filterState();

    return list.filter(g => {
      // 1. Search term (Name, Genre, Leader)
      if (f.searchTerm.trim() !== '') {
        const term = f.searchTerm.toLowerCase();
        const matchName = g.name.toLowerCase().includes(term);
        const matchGenre = g.genre.toLowerCase().includes(term);
        const matchLeader = (g.groupLeaderName || '').toLowerCase().includes(term);
        if (!matchName && !matchGenre && !matchLeader) return false;
      }

      // 2. Disquera contract type
      if (f.disqueraType !== 'ALL' && g.disqueraType !== f.disqueraType) {
        return false;
      }

      // 3. Agenda availability status
      if (f.agendaStatus !== 'ALL' && g.agendaStatus !== f.agendaStatus) {
        return false;
      }

      // 4. Platform registration status
      if (f.platformStatus === 'REGISTERED' && !g.isPlatformRegistered) return false;
      if (f.platformStatus === 'EXTERNAL' && g.isPlatformRegistered) return false;

      // 5. Genre
      if (f.genre !== 'ALL' && g.genre !== f.genre) return false;

      return true;
    });
  });

  onFiltersChanged(state: GroupFiltersState): void {
    this.filterState.set(state);
  }

  resetAllFilters(): void {
    this.filterState.set({
      searchTerm: '',
      disqueraType: 'ALL',
      agendaStatus: 'ALL',
      platformStatus: 'ALL',
      genre: 'ALL'
    });
  }

  selectGroupForInsights(group: GroupItem): void {
    this.selectedGroupForInsights.set(group);
    if (this.insightsPanel) {
      this.insightsPanel.selectGroupById(group.id);
    }
  }

  openGroupDetail(group: GroupItem): void {
    this.layoutState.openGroupModal(group);
  }
}
