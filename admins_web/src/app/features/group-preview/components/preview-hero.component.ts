import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupPreview } from '../group-preview.model';

/**
 * Cabecera del perfil público: portada a sangre, avatar, insignias y llamadas
 * a la acción. Replica la del portal de clientes, incluidos los botones de
 * seguir y cotizar, que aquí son decorativos porque la vista es una simulación.
 */
@Component({
  selector: 'app-preview-hero',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="relative w-full overflow-hidden bg-[#131313] pb-6 sm:pb-8 pt-20 sm:pt-28 font-['Be_Vietnam_Pro']">
      <!-- Full Background Cover Image with dual gradients -->
      <div class="absolute inset-0 z-0">
        <img [src]="data().coverUrl" [alt]="data().name" class="w-full h-full object-cover opacity-50 filter blur-[0.5px]" />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0b0b0d] via-[#0b0b0d]/60 to-transparent"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-[#0b0b0d]/90 via-transparent to-[#0b0b0d]/90"></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-6 sm:pt-10">
        <div class="relative flex flex-col md:flex-row items-center md:items-end gap-4 sm:gap-6 pb-6">

          <!-- Band Avatar -->
          <div class="relative w-28 h-28 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-2xl shrink-0 group bg-black">
            <img [src]="data().avatarUrl" [alt]="data().name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            @if (data().verified) {
              <span class="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-primary text-black rounded-full p-1 sm:p-1.5 shadow-lg flex items-center justify-center" title="Perfil Verificado por Acordex">
                <span class="material-symbols-outlined text-xs sm:text-base fill-current font-black">verified</span>
              </span>
            }
          </div>

          <!-- Band Info Summary -->
          <div class="flex-1 text-center md:text-left min-w-0 w-full">
            <!-- Badges Row -->
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2.5 mb-3 sm:mb-4">
              <span class="px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-[9.5px] sm:text-[11px] font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
                {{ data().tag }}
              </span>
              <span class="px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider">
                {{ data().availability }}
              </span>
              @if (data().verified) {
                <span class="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Perfil Verificado
                </span>
              }
            </div>

            <!-- Title -->
            <h1 class="font-['Epilogue'] font-black text-xl sm:text-4xl lg:text-5xl text-white uppercase tracking-tight leading-tight mb-2.5 break-words">
              {{ data().name }}
            </h1>

            <!-- Meta Data Grid -->
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-4 sm:gap-x-5 text-white/65 text-xs sm:text-sm font-light">
              <span class="flex items-center gap-1 text-primary">
                <span class="material-symbols-outlined text-sm sm:text-base fill-current">star</span>
                <strong class="text-white font-bold text-xs sm:text-sm">{{ data().rating }}</strong>
                <span class="text-[11px] sm:text-xs text-white/60">({{ data().reviewCount }} opiniones)</span>
              </span>

              <span class="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full text-xs font-bold text-primary shadow-sm backdrop-blur-md">
                <span class="material-symbols-outlined text-sm fill-current">groups</span>
                <span>{{ data().followersLabel }} seguidores</span>
              </span>

              <span class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm sm:text-base text-primary/80">pin_drop</span>
                <span class="text-[11px] sm:text-xs">{{ data().location }}</span>
              </span>

              @if (data().managerName) {
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm sm:text-base text-emerald-400">support_agent</span>
                  <span class="text-[11px] sm:text-xs">Rep: {{ data().managerName }}</span>
                </span>
              }
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row md:flex-col gap-2.5 sm:gap-3 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
            <button
              type="button"
              class="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-['Epilogue'] font-bold text-xs uppercase tracking-widest px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2"
            >
              <span class="material-symbols-outlined text-base text-primary">person_add</span>
              <span>Seguir Agrupación</span>
            </button>

            <button
              type="button"
              class="w-full bg-primary hover:bg-primary-fixed text-black font-['Epilogue'] font-black text-xs uppercase tracking-widest px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl transition-all duration-300 shadow-[0_4px_25px_rgba(242,202,80,0.25)] flex items-center justify-center gap-2"
            >
              <span class="material-symbols-outlined text-base">request_quote</span>
              <span>Cotizar este Grupo</span>
            </button>

            <button
              type="button"
              class="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-['Epilogue'] font-bold text-xs uppercase tracking-wider px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span class="material-symbols-outlined text-base text-emerald-400">chat</span>
              <span>WhatsApp Manager</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  `
})
export class PreviewHeroComponent {
  data = input.required<GroupPreview>();
}
