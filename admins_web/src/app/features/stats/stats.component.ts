import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { PanelComponent } from '../../shared/ui/panel/panel.component';
import { ProgressBarComponent } from '../../shared/ui/progress-bar/progress-bar.component';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, BadgeComponent, PanelComponent, ProgressBarComponent],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-fade-in">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="font-display-xl text-xl sm:text-2xl font-black text-on-surface">Estadísticas & Audiencia</h1>
            <app-badge label="Fan Demographics" variant="secondary" />
          </div>
          <p class="text-xs text-outline mt-1">Interacción social, demografía del público e inteligencia de audiencia</p>
        </div>
      </div>

      <!-- DEMOGRAPHICS & SOCIAL CARDS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">

        <app-panel title="Rango de Edad Fanbase" icon="bar_chart">
          <div class="space-y-3.5">
            <app-progress-bar label="18 - 24 Años (Tumbado / Sierreño)" [percent]="48" valueLabel="48%" colorVariant="primary" />
            <app-progress-bar label="25 - 34 Años (Norteño / Banda)" [percent]="36" valueLabel="36%" colorVariant="secondary" />
            <app-progress-bar label="35+ Años (Tradicional)" [percent]="16" valueLabel="16%" colorVariant="neutral" />
          </div>
        </app-panel>

        <app-panel title="Principales Ciudades" icon="location_city">
          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-xl bg-surface-container-high flex justify-between items-center gap-2">
              <span class="font-bold text-on-surface truncate">1. Monterrey, NL</span>
              <span class="font-black text-emerald-400 shrink-0">42,500 Fans</span>
            </div>
            <div class="p-2.5 rounded-xl bg-surface-container-high flex justify-between items-center gap-2">
              <span class="font-bold text-on-surface truncate">2. Guadalajara, JAL</span>
              <span class="font-black text-emerald-400 shrink-0">31,200 Fans</span>
            </div>
            <div class="p-2.5 rounded-xl bg-surface-container-high flex justify-between items-center gap-2">
              <span class="font-bold text-on-surface truncate">3. Aguascalientes, AGS</span>
              <span class="font-black text-emerald-400 shrink-0">22,800 Fans</span>
            </div>
          </div>
        </app-panel>

        <app-panel title="Redes Sociales" icon="share">
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-3 rounded-2xl bg-surface-container-high text-center">
              <span class="text-[10px] text-outline font-bold uppercase block">Seguidores TikTok</span>
              <span class="text-lg font-black text-primary">1.2M</span>
            </div>
            <div class="p-3 rounded-2xl bg-surface-container-high text-center">
              <span class="text-[10px] text-outline font-bold uppercase block">Spotify Oyentes</span>
              <span class="text-lg font-black text-emerald-400">890K/mes</span>
            </div>
            <div class="p-3 rounded-2xl bg-surface-container-high text-center">
              <span class="text-[10px] text-outline font-bold uppercase block">Historias Compartidas</span>
              <span class="text-lg font-black text-secondary">45.2K</span>
            </div>
            <div class="p-3 rounded-2xl bg-surface-container-high text-center">
              <span class="text-[10px] text-outline font-bold uppercase block">Engagement Rate</span>
              <span class="text-lg font-black text-purple-300">8.4%</span>
            </div>
          </div>
        </app-panel>

      </div>

      <!-- AUTOMATED ENGAGEMENT SUGGESTIONS -->
      <div class="p-5 sm:p-6 rounded-3xl bg-surface-container border border-primary/40 shadow-xl space-y-4">
        <h3 class="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">auto_awesome</span> Sugerencias de Engagement Automatizadas
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-1">
            <span class="text-[10px] font-bold text-primary uppercase">Campaña TikTok Live</span>
            <p class="font-bold text-on-surface">Transmisión detrás de cámara en el ensayo general</p>
            <p class="text-outline">Transmitir 30 minutos antes de la firma de autógrafos en Monterrey incrementará el tráfico de venta de boletos en un 15%.</p>
          </div>

          <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-1">
            <span class="text-[10px] font-bold text-emerald-400 uppercase">Sorteo VIP en Spotify</span>
            <p class="font-bold text-on-surface">Pases Meet & Greet para top oyentes en Guadalajara</p>
            <p class="text-outline">Recompensar a los fans más activos en Spotify para impulsar el pre-save del nuevo sencillo en co-producción.</p>
          </div>
        </div>
      </div>

    </div>
  `
})
export class StatsComponent {}
