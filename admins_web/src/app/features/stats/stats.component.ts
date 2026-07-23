import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8 animate-fade-in">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display-xl text-2xl font-black text-on-surface">Estadísticas & Audiencia</h1>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Fan Demographics
            </span>
          </div>
          <p class="text-xs text-outline mt-1">Interacción social, demografía del público e inteligencia de audiencia</p>
        </div>
      </div>

      <!-- DEMOGRAPHICS & SOCIAL CARDS -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-on-surface">Rango de Edad Fanbase</h3>
            <span class="material-symbols-outlined text-primary text-xl">bar_chart</span>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <div class="flex justify-between font-semibold mb-1">
                <span>18 - 24 Años (Tumbado / Sierreño)</span>
                <span class="text-primary font-bold">48%</span>
              </div>
              <div class="w-full h-2.5 rounded-full bg-surface-bright overflow-hidden">
                <div class="h-full bg-primary rounded-full" style="width: 48%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between font-semibold mb-1">
                <span>25 - 34 Años (Norteño / Banda)</span>
                <span class="text-secondary font-bold">36%</span>
              </div>
              <div class="w-full h-2.5 rounded-full bg-surface-bright overflow-hidden">
                <div class="h-full bg-secondary rounded-full" style="width: 36%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between font-semibold mb-1">
                <span>35+ Años (Tradicional)</span>
                <span class="text-outline font-bold">16%</span>
              </div>
              <div class="w-full h-2.5 rounded-full bg-surface-bright overflow-hidden">
                <div class="h-full bg-outline rounded-full" style="width: 16%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-on-surface">Principales Ciudades</h3>
            <span class="material-symbols-outlined text-primary text-xl">location_city</span>
          </div>

          <div class="space-y-2 text-xs">
            <div class="p-2.5 rounded-xl bg-surface-container-high flex justify-between items-center">
              <span class="font-bold text-on-surface">1. Monterrey, NL</span>
              <span class="font-black text-emerald-400">42,500 Fans</span>
            </div>
            <div class="p-2.5 rounded-xl bg-surface-container-high flex justify-between items-center">
              <span class="font-bold text-on-surface">2. Guadalajara, JAL</span>
              <span class="font-black text-emerald-400">31,200 Fans</span>
            </div>
            <div class="p-2.5 rounded-xl bg-surface-container-high flex justify-between items-center">
              <span class="font-bold text-on-surface">3. Aguascalientes, AGS</span>
              <span class="font-black text-emerald-400">22,800 Fans</span>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-on-surface">Redes Sociales</h3>
            <span class="material-symbols-outlined text-primary text-xl">share</span>
          </div>

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
        </div>

      </div>

      <!-- AUTOMATED ENGAGEMENT SUGGESTIONS -->
      <div class="p-6 rounded-3xl bg-surface-container border border-primary/40 shadow-xl space-y-4">
        <h3 class="text-base font-bold text-on-surface flex items-center gap-2">
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
