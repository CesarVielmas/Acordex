import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { TabPillsComponent, TabPillItem } from '../../shared/ui/tab-pills/tab-pills.component';

import {
  EventStatsDetail,
  ArtistStatsDetail
} from '../../core/models/stats.models';

import {
  calculateGlobalStatsSummary,
  calculateGenreDistribution,
  calculateMonthlyAttendance,
  calculateCityPerformance,
  calculateEventStatsDetails,
  calculateQuoteFunnel,
  calculatePrivateEventTypes,
  calculateArtistStatsDetails,
  calculateAudienceDemographics,
  getTrendPredictions
} from './stats-metrics';

import { StatsKpisComponent } from './components/stats-kpis.component';
import { StatsTabOverviewComponent } from './components/stats-tab-overview.component';
import { StatsTabEventsComponent } from './components/stats-tab-events.component';
import { StatsTabQuotesComponent } from './components/stats-tab-quotes.component';
import { StatsTabTalentComponent } from './components/stats-tab-talent.component';
import { StatsTabDemographicsComponent } from './components/stats-tab-demographics.component';
import { StatsTabPredictionsComponent } from './components/stats-tab-predictions.component';

import { ModalEventStatsComponent } from './modals/modal-event-stats.component';
import { ModalArtistStatsComponent } from './modals/modal-artist-stats.component';

export type StatsTab =
  | 'overview'
  | 'events'
  | 'quotes'
  | 'talent'
  | 'demographics'
  | 'predictions';

/**
 * Módulo de Estadísticas & Inteligencia de Audiencia de Acordex.
 *
 * Integra en tiempo real datos de:
 * 1. Eventos masivos (Boletos, aforos, zonas VIP/General)
 * 2. Cotizaciones privadas (Embudo de conversión y tipos de fiesta)
 * 3. Talento (Streaming en Spotify, seguidores en TikTok, calificaciones)
 * 4. Demografía (Edades, género y canales de compra)
 * 5. Predicciones inteligentes de demanda
 */
@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    BadgeComponent,
    TabPillsComponent,
    StatsKpisComponent,
    StatsTabOverviewComponent,
    StatsTabEventsComponent,
    StatsTabQuotesComponent,
    StatsTabTalentComponent,
    StatsTabDemographicsComponent,
    StatsTabPredictionsComponent,
    ModalEventStatsComponent,
    ModalArtistStatsComponent
  ],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-fade-in pb-12">

      <!-- ─── ENCABEZADO PRINCIPAL ─── -->
      <div class="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#1A1A1A] via-[#161616] to-[#121212] backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div class="absolute -right-12 -top-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-xl sm:text-2xl font-black text-on-surface tracking-tight font-['Epilogue']">Inteligencia de Audiencia & Business Analytics</h1>
            <app-badge label="Métricas en Tiempo Real" variant="success" />
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30 shadow-sm">
              Live Data · Operación Principal
            </span>
          </div>
          <p class="text-xs text-outline mt-1 max-w-2xl leading-relaxed">
            Consolidación analítica de boletería vendida, aforos de recintos masivos, embudo de conversión en contrataciones privadas, streaming en Spotify y métricas demográficas.
          </p>
        </div>

        <!-- Botón de Exportar / Imprimir -->
        <div class="relative z-10 flex items-center gap-2">
          <button
            type="button"
            (click)="printAnalytics()"
            class="px-4 py-2.5 rounded-2xl bg-[#202020] hover:bg-[#282828] border border-white/10 text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-base">print</span>
            Imprimir Reporte Analítico
          </button>
        </div>
      </div>

      <!-- ─── KPIS SUPERIORES ─── -->
      <app-stats-kpis [summary]="globalSummary()" />

      <!-- ─── BARRA DE PESTAÑAS ─── -->
      <div class="border-b border-white/10 pb-2">
        <app-tab-pills
          [tabs]="tabOptions"
          [active]="activeTab()"
          (change)="setTab($event)"
        />
      </div>

      <!-- ─── CONTENIDO DE PESTAÑAS ─── -->

      <!-- 1. RESUMEN GENERAL -->
      @if (activeTab() === 'overview') {
        <app-stats-tab-overview
          [genres]="genreDistribution()"
          [monthly]="monthlyAttendance()"
          [cities]="cityPerformance()"
        />
      }

      <!-- 2. EVENTOS & TAQUILLA -->
      @if (activeTab() === 'events') {
        <app-stats-tab-events
          [events]="eventDetails()"
          (selectEvent)="onSelectEvent($event)"
        />
      }

      <!-- 3. COTIZACIONES & EMBUDO -->
      @if (activeTab() === 'quotes') {
        <app-stats-tab-quotes
          [funnel]="quoteFunnel()"
          [eventTypes]="privateEventTypes()"
        />
      }

      <!-- 4. ARTISTAS & REDES SOCIALES -->
      @if (activeTab() === 'talent') {
        <app-stats-tab-talent
          [artists]="artistDetails()"
          (selectArtist)="onSelectArtist($event)"
        />
      }

      <!-- 5. DEMOGRAFÍA & FANS -->
      @if (activeTab() === 'demographics') {
        <app-stats-tab-demographics
          [demographics]="demographics()"
        />
      }

      <!-- 6. PREDICCIONES & TENDENCIAS -->
      @if (activeTab() === 'predictions') {
        <app-stats-tab-predictions
          [predictions]="predictions()"
        />
      }

      <!-- ─── MODALES INTERACTIVOS ─── -->

      <!-- Modal 1: Detalle Estadístico por Evento -->
      @if (selectedEventForModal()) {
        <app-modal-event-stats
          [event]="selectedEventForModal()!"
          (closed)="selectedEventForModal.set(null)"
        />
      }

      <!-- Modal 2: Ficha Digital y Audiencia por Artista -->
      @if (selectedArtistForModal()) {
        <app-modal-artist-stats
          [artist]="selectedArtistForModal()!"
          (closed)="selectedArtistForModal.set(null)"
        />
      }

    </div>
  `
})
export class StatsComponent {
  mockData = inject(MockDataService);

  activeTab = signal<StatsTab>('overview');

  // Modales
  selectedEventForModal = signal<EventStatsDetail | null>(null);
  selectedArtistForModal = signal<ArtistStatsDetail | null>(null);

  readonly tabOptions: TabPillItem[] = [
    { value: 'overview', label: 'Panel Consolidado', icon: 'query_stats' },
    { value: 'events', label: 'Boletería & Aforos', icon: 'confirmation_number' },
    { value: 'quotes', label: 'Embudo de Contrataciones', icon: 'filter_alt' },
    { value: 'talent', label: 'Audiencia Digital & Streaming', icon: 'cell_tower' },
    { value: 'demographics', label: 'Segmentación Demográfica', icon: 'group' },
    { value: 'predictions', label: 'Modelado Predictivo', icon: 'auto_awesome' }
  ];

  setTab(tabId: string): void {
    this.activeTab.set(tabId as StatsTab);
  }

  // Derivaciones Reactivas Integradas
  globalSummary = computed(() => {
    return calculateGlobalStatsSummary(
      this.mockData.events(),
      this.mockData.quotes(),
      this.mockData.groups()
    );
  });

  genreDistribution = computed(() => {
    return calculateGenreDistribution(
      this.mockData.events(),
      this.mockData.quotes(),
      this.mockData.groups()
    );
  });

  monthlyAttendance = computed(() => {
    return calculateMonthlyAttendance(
      this.mockData.events()
    );
  });

  cityPerformance = computed(() => {
    return calculateCityPerformance(
      this.mockData.events(),
      this.mockData.quotes()
    );
  });

  eventDetails = computed(() => {
    return calculateEventStatsDetails(
      this.mockData.events()
    );
  });

  quoteFunnel = computed(() => {
    return calculateQuoteFunnel(
      this.mockData.quotes()
    );
  });

  privateEventTypes = computed(() => {
    return calculatePrivateEventTypes(
      this.mockData.quotes()
    );
  });

  artistDetails = computed(() => {
    return calculateArtistStatsDetails(
      this.mockData.groups(),
      this.mockData.events(),
      this.mockData.quotes()
    );
  });

  demographics = computed(() => {
    return calculateAudienceDemographics(
      this.mockData.events(),
      this.mockData.groups()
    );
  });

  predictions = computed(() => {
    return getTrendPredictions();
  });

  // Handlers
  onSelectEvent(event: EventStatsDetail): void {
    this.selectedEventForModal.set(event);
  }

  onSelectArtist(artist: ArtistStatsDetail): void {
    this.selectedArtistForModal.set(artist);
  }

  printAnalytics(): void {
    window.print();
  }
}
