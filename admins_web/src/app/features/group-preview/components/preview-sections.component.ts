import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupPreview, PreviewMember } from '../group-preview.model';

@Component({
  selector: 'app-preview-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section class="bg-[#1a1a1a] border border-white/10 rounded-3xl p-5 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl">
      <header class="border-b border-white/10 pb-3 sm:pb-4 flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-lg sm:text-xl">{{ icon() }}</span>
        <h2 class="font-['Epilogue'] font-black text-base sm:text-xl text-white uppercase tracking-wide">
          {{ title() }}
        </h2>
      </header>
      <div>
        <ng-content />
      </div>
    </section>
  `
})
export class PreviewBlockComponent {
  title = input.required<string>();
  icon = input.required<string>();
}

/** Pestaña "Información General" del perfil público. */
@Component({
  selector: 'app-preview-tab-general',
  standalone: true,
  imports: [CommonModule, PreviewBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-6 sm:space-y-8 font-['Be_Vietnam_Pro']">

      <!-- 4 Key Statistics Dashboard Grid (Identical to clients_web) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div class="bg-[#1a1a1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-xl hover:border-primary/40 transition-all shadow-lg">
          <div class="flex items-center gap-2.5 sm:gap-3">
            <div class="p-2.5 sm:p-3 bg-primary/10 rounded-xl text-primary shrink-0">
              <span class="material-symbols-outlined text-xl sm:text-2xl">event_available</span>
            </div>
            <div class="min-w-0">
              <p class="text-white/40 text-[9.5px] sm:text-xs font-medium uppercase tracking-wider truncate font-['Epilogue']">Eventos</p>
              <h3 class="font-['Epilogue'] font-black text-base sm:text-2xl text-white mt-0.5 leading-none">{{ getStatValue('eventos') }}</h3>
            </div>
          </div>
        </div>

        @if (data().visibility.showStatHours) {
          <div class="bg-[#1a1a1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-xl hover:border-primary/40 transition-all shadow-lg">
            <div class="flex items-center gap-2.5 sm:gap-3">
              <div class="p-2.5 sm:p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                <span class="material-symbols-outlined text-xl sm:text-2xl">schedule</span>
              </div>
              <div class="min-w-0">
                <p class="text-white/40 text-[9.5px] sm:text-xs font-medium uppercase tracking-wider truncate font-['Epilogue']">Horas</p>
                <h3 class="font-['Epilogue'] font-black text-base sm:text-2xl text-white mt-0.5 leading-none">{{ getStatValue('horas') }}</h3>
              </div>
            </div>
          </div>
        }

        <div class="bg-[#1a1a1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-xl hover:border-primary/40 transition-all shadow-lg">
          <div class="flex items-center gap-2.5 sm:gap-3">
            <div class="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
              <span class="material-symbols-outlined text-xl sm:text-2xl">sentiment_very_satisfied</span>
            </div>
            <div class="min-w-0">
              <p class="text-white/40 text-[9.5px] sm:text-xs font-medium uppercase tracking-wider truncate font-['Epilogue']">Satisfacción</p>
              <h3 class="font-['Epilogue'] font-black text-base sm:text-2xl text-white mt-0.5 leading-none">{{ getStatValue('satisfaccion') }}</h3>
            </div>
          </div>
        </div>

        <div class="bg-[#1a1a1a] border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-xl hover:border-primary/40 transition-all shadow-lg">
          <div class="flex items-center gap-2.5 sm:gap-3">
            <div class="p-2.5 sm:p-3 bg-purple-500/10 rounded-xl text-purple-400 shrink-0">
              <span class="material-symbols-outlined text-xl sm:text-2xl">group</span>
            </div>
            <div class="min-w-0">
              <p class="text-white/40 text-[9.5px] sm:text-xs font-medium uppercase tracking-wider truncate font-['Epilogue']">Integrantes</p>
              <h3 class="font-['Epilogue'] font-black text-base sm:text-2xl text-white mt-0.5 leading-none">{{ data().membersCount }} Músicos</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Bio & Technical Overview Grid (3 columns, identical to clients_web) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Main Description, Video Mix & Members (Left 2 columns) -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- About Section Card -->
          @if (data().visibility.showAbout) {
            <div class="bg-[#1a1a1a] border border-white/10 rounded-3xl p-5 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl">
              <h2 class="font-['Epilogue'] font-black text-lg sm:text-xl text-white uppercase tracking-wide flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">description</span>
                <span>Acerca de {{ data().name }}</span>
              </h2>
              <p class="text-white/80 text-xs sm:text-base leading-relaxed font-light">
                {{ data().about }}
              </p>

              @if (data().secondaryGenres.length) {
                <div class="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  @for (g of data().secondaryGenres; track g) {
                    <span class="px-3.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-['Epilogue'] font-bold text-xs uppercase tracking-wider">
                      {{ g }}
                    </span>
                  }
                </div>
              }
            </div>
          }

          <!-- Video Mix Player Card -->
          @if (data().visibility.showPresentationVideo) {
            <div class="bg-[#1a1a1a] border border-primary/30 rounded-3xl p-5 sm:p-8 backdrop-blur-xl space-y-4 shadow-[0_10px_40px_rgba(242,202,80,0.08)]">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <span class="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 font-['Epilogue']">
                    <span class="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    Mix de Canciones en Reproducción
                  </span>
                  <h3 class="font-['Epilogue'] font-black text-base sm:text-xl text-white uppercase tracking-wide mt-0.5">
                    {{ data().mixVideoTitle || 'Mix de Canciones de la Agrupación' }}
                  </h3>
                </div>
              </div>

              <!-- Video Player -->
              <div class="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl group cursor-pointer">
                <img [src]="data().mixVideoThumbnailUrl" [alt]="data().mixVideoTitle" class="w-full h-48 sm:h-80 md:h-96 object-cover" />
                <div class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 group-hover:bg-black/25 transition-all">
                  <span class="material-symbols-outlined text-6xl text-primary drop-shadow-[0_0_20px_rgba(242,202,80,0.6)] group-hover:scale-110 transition-transform">play_circle</span>
                  <p class="text-sm font-['Epilogue'] font-black text-white text-center px-4 uppercase tracking-wider">{{ data().mixVideoTitle }}</p>
                </div>
              </div>
            </div>
          }

          <!-- UPCOMING EVENTS SECTION (PRÓXIMOS EVENTOS - IDENTICAL TO CLIENTS_WEB) -->
          @if (data().visibility.showUpcomingEvents && data().events.length) {
            <div class="bg-[#141414] border border-white/10 rounded-3xl p-4 sm:p-7 backdrop-blur-2xl space-y-4 sm:space-y-6 shadow-2xl font-['Be_Vietnam_Pro']">
              <div class="border-b border-white/10 pb-3 sm:pb-4">
                <span class="text-[9.5px] sm:text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 mb-1 font-['Epilogue']">
                  <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Cartelera & Gira Acordex
                </span>
                <h2 class="font-['Epilogue'] font-black text-base sm:text-lg md:text-xl text-white uppercase tracking-wide flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-base sm:text-xl">calendar_month</span>
                  <span>Próximos Eventos</span>
                </h2>
              </div>

              <div class="space-y-3.5 sm:space-y-4">
                @for (evt of data().events; track evt.id) {
                  <div class="group relative rounded-2xl overflow-hidden border border-white/15 bg-[#161616] hover:border-primary/60 transition-all duration-500 cursor-pointer shadow-lg">
                    <div class="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 gap-4">
                      <div class="flex items-center gap-3.5 min-w-0">
                        <div class="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 text-primary flex flex-col items-center justify-center shrink-0">
                          <span class="material-symbols-outlined text-xl">confirmation_number</span>
                        </div>
                        <div class="min-w-0">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] font-['Epilogue'] font-black uppercase">
                              {{ evt.type }}
                            </span>
                            <span class="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs">calendar_today</span>
                              {{ evt.date }}
                            </span>
                          </div>
                          <h4 class="font-['Epilogue'] font-black text-base text-white uppercase tracking-wide truncate group-hover:text-primary transition-colors">
                            {{ evt.title }}
                          </h4>
                          <p class="text-xs text-white/60 truncate flex items-center gap-1 mt-0.5">
                            <span class="material-symbols-outlined text-xs text-primary/80">location_on</span>
                            {{ evt.venue }} · {{ evt.city }}
                          </p>
                        </div>
                      </div>

                      <button type="button" class="self-stretch sm:self-center font-['Epilogue'] font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl bg-primary text-black shadow-md shrink-0 flex items-center justify-center gap-1.5 hover:scale-105 transition-all">
                        <span>Ver Evento</span>
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Members Section -->
          @if (data().visibility.showMembersSection && data().members.length) {
            <div class="bg-[#1a1a1a] border border-white/10 rounded-3xl p-5 sm:p-8 backdrop-blur-xl space-y-4 sm:space-y-6 shadow-xl">
              <div class="border-b border-white/10 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 class="font-['Epilogue'] font-black text-lg sm:text-xl text-white uppercase tracking-wide flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">groups</span>
                  <span>Integrantes del Grupo</span>
                </h2>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                @for (member of data().members; track member.id) {
                  <div
                    (click)="selectedMember.set(member); memberModalTab.set('general')"
                    class="bg-gradient-to-b from-[#1c1c1c] via-[#141414] to-black border border-white/15 hover:border-primary/60 p-5 sm:p-7 rounded-3xl flex flex-col items-center text-center relative overflow-hidden group shadow-lg cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(242,202,80,0.2)]"
                  >
                    <div class="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-primary/40 p-1 shadow-2xl mb-4 bg-black group-hover:border-primary transition-all duration-500 shrink-0">
                      <img [src]="member.photoUrl" [alt]="member.name" class="w-full h-full rounded-full object-cover filter brightness-95 group-hover:brightness-105 transition-all" />
                      <span class="absolute bottom-1.5 right-1.5 bg-primary text-black p-1 rounded-full shadow-xl flex items-center justify-center text-xs">
                        <span class="material-symbols-outlined text-xs font-black">star</span>
                      </span>
                    </div>

                    <div class="space-y-2 relative z-10 w-full">
                      @if (member.instrument) {
                        <div class="flex items-center justify-center gap-2">
                          <span class="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-['Epilogue'] font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                            <span>{{ member.instrument }}</span>
                          </span>
                        </div>
                      }

                      <h3 class="font-['Epilogue'] font-black text-base sm:text-xl text-white uppercase tracking-wide group-hover:text-primary transition-colors">
                        {{ member.name }}
                      </h3>

                      <p class="text-white/50 text-[11px] sm:text-xs font-light">
                        {{ member.role }}
                      </p>

                      <button type="button" class="mt-3 w-full bg-white/5 hover:bg-primary hover:text-black border border-white/15 text-white font-['Epilogue'] font-bold text-[10px] sm:text-xs uppercase tracking-widest py-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-1 shadow-lg">
                        <span>Ver Perfil del Músico</span>
                        <span class="material-symbols-outlined text-xs">open_in_new</span>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Staff / Equipo de Apoyo & Logística Section -->
          @if (data().visibility.showStaffMembers && data().crew.length) {
            <div class="bg-[#1a1a1a] border border-white/10 rounded-3xl p-5 sm:p-8 backdrop-blur-xl space-y-4 sm:space-y-6 shadow-xl">
              <div class="border-b border-white/10 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 class="font-['Epilogue'] font-black text-lg sm:text-xl text-white uppercase tracking-wide flex items-center gap-2">
                  <span class="material-symbols-outlined text-cyan-400">engineering</span>
                  <span>Equipo de Apoyo & Logística (Staff)</span>
                </h2>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                @for (member of data().crew; track member.id) {
                  <div
                    (click)="selectedMember.set(member); memberModalTab.set('general')"
                    class="bg-gradient-to-b from-[#1c1c1c] via-[#141414] to-black border border-white/15 hover:border-cyan-400/60 p-5 rounded-3xl flex flex-col items-center text-center relative overflow-hidden group shadow-lg cursor-pointer transition-all duration-500 hover:-translate-y-1"
                  >
                    <div class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-cyan-400/40 p-1 shadow-2xl mb-3 bg-black group-hover:border-cyan-400 transition-all duration-500 shrink-0">
                      <img [src]="member.photoUrl" [alt]="member.name" class="w-full h-full rounded-full object-cover filter brightness-95 group-hover:brightness-105 transition-all" />
                    </div>

                    <div class="space-y-1 relative z-10 w-full">
                      <h3 class="font-['Epilogue'] font-black text-sm sm:text-base text-white uppercase tracking-wide group-hover:text-cyan-300 transition-colors">
                        {{ member.name }}
                      </h3>
                      <p class="text-cyan-400 text-xs font-bold">
                        {{ member.role }}
                      </p>
                      <p class="text-white/40 text-[10px]">
                        {{ member.hometown }}
                      </p>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

        </div>

        <!-- Right Side Specs & Contacts (1 column, identical to clients_web) -->
        <div class="space-y-6">
          
          <!-- General Specs Card -->
          @if (data().visibility.showTechnicalSpecs) {
            <div class="bg-[#1a1a1a] border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <h3 class="font-['Epilogue'] font-black text-base sm:text-lg text-white uppercase tracking-wide border-b border-white/10 pb-3">
                Ficha Técnica
              </h3>
              <ul class="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                @if (data().visibility.showOriginCity) {
                  <li class="flex justify-between items-center text-white/70">
                    <span>Ciudad de Origen:</span>
                    <strong class="text-white font-semibold">{{ data().originCity }}</strong>
                  </li>
                }
                @if (data().visibility.showFoundedYear) {
                  <li class="flex justify-between items-center text-white/70">
                    <span>Año de Fundación:</span>
                    <strong class="text-white font-semibold">{{ data().foundedYear }}</strong>
                  </li>
                }
                @if (data().visibility.showMusicalGenre) {
                  <li class="flex justify-between items-center text-white/70">
                    <span>Género Musical:</span>
                    <strong class="text-primary font-semibold">{{ data().tag }}</strong>
                  </li>
                }
                @if (data().visibility.showMembersCountSpec) {
                  <li class="flex justify-between items-center text-white/70">
                    <span>Total Integrantes:</span>
                    <strong class="text-white font-semibold">{{ data().membersCount }} Músicos</strong>
                  </li>
                }
                @if (data().visibility.showSenioritySpec) {
                  <li class="flex justify-between items-center text-white/70">
                    <span>Antigüedad:</span>
                    <strong class="text-white font-semibold inline-flex items-center gap-1">
                      @if (data().verified) {
                        <span class="material-symbols-outlined text-sm text-primary">verified</span>
                      }
                      {{ data().seniorityLabel }}
                    </strong>
                  </li>
                }
              </ul>
            </div>
          }

          <!-- Technical Rider Card -->
          @if (data().visibility.showAudioRider) {
            <div class="bg-[#1a1a1a] border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <h3 class="font-['Epilogue'] font-black text-base sm:text-lg text-white uppercase tracking-wide border-b border-white/10 pb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-base">tune</span>
                <span>Rider Técnico de Audio</span>
              </h3>
              <p class="text-[11px] font-bold mb-2" [class]="data().hasOwnAudio ? 'text-emerald-400' : 'text-amber-400'">
                {{ data().hasOwnAudio ? 'El grupo viaja con equipo de audio propio.' : 'El recinto debe cubrir el audio.' }}
              </p>
              <ul class="space-y-2.5">
                @for (item of data().riderRequirements; track item) {
                  <li class="flex items-start gap-2.5 text-xs text-white/70">
                    <span class="material-symbols-outlined text-primary text-sm shrink-0 mt-0.5">check_circle</span>
                    <span>{{ item }}</span>
                  </li>
                }
              </ul>
            </div>
          }

          <!-- Official Social Links -->
          @if (data().visibility.showSocials && data().socials.length) {
            <div class="bg-[#1a1a1a] border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-3">
              <h3 class="font-['Epilogue'] font-black text-[10px] sm:text-xs text-white/40 uppercase tracking-widest">
                Redes Sociales Oficiales
              </h3>
              
              <div class="grid grid-cols-2 gap-2 sm:gap-2.5 pt-1">
                @for (s of data().socials; track s.id) {
                  <a
                    [href]="s.url" target="_blank" rel="noopener noreferrer"
                    class="flex items-center gap-2 bg-white/5 hover:bg-white/15 border border-white/15 text-white px-3 sm:px-3.5 py-2.5 rounded-xl transition-all text-xs font-bold font-['Epilogue'] capitalize"
                  >
                    <span class="material-symbols-outlined text-sm text-primary">link</span>
                    <span class="truncate">{{ s.id }}</span>
                  </a>
                }
              </div>
            </div>
          }

          <!-- Contratación Contact Info Card -->
          @if (data().visibility.showDirectBooking) {
            <div class="bg-[#1a1a1a] border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <h3 class="font-['Epilogue'] font-black text-base sm:text-lg text-white uppercase tracking-wide border-b border-white/10 pb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-base">call</span>
                <span>Contratación Directa</span>
              </h3>
              <div class="space-y-3 text-xs">
                @if (data().visibility.showBookingPhone) {
                  <div>
                    <span class="block text-[10px] font-black uppercase tracking-wider text-white/40 font-['Epilogue']">Teléfono</span>
                    <span class="font-mono font-black text-primary text-sm">{{ data().bookingPhone }}</span>
                  </div>
                }
                @if (data().visibility.showBookingEmail) {
                  <div>
                    <span class="block text-[10px] font-black uppercase tracking-wider text-white/40 font-['Epilogue']">Correo</span>
                    <span class="font-bold text-white text-xs break-all">{{ data().bookingEmail }}</span>
                  </div>
                }
                @if (data().visibility.showOfficeAddress && data().officeAddress) {
                  <div>
                    <span class="block text-[10px] font-black uppercase tracking-wider text-white/40 font-['Epilogue']">Domicilio de Oficinas</span>
                    <a [href]="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(data().officeAddress)"
                       target="_blank" rel="noopener noreferrer"
                       title="Abrir ubicación en Google Maps"
                       class="group font-semibold text-white/90 text-xs flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer pt-0.5">
                      <span class="material-symbols-outlined text-xs text-primary shrink-0 group-hover:scale-110 transition-transform">location_on</span>
                      <span class="underline decoration-white/20 underline-offset-2 group-hover:decoration-primary">{{ data().officeAddress }}</span>
                      <span class="material-symbols-outlined text-xs text-primary shrink-0 opacity-70 group-hover:opacity-100">open_in_new</span>
                    </a>
                  </div>
                }
                @if (data().visibility.showMinimumHours) {
                  <div>
                    <span class="block text-[10px] font-black uppercase tracking-wider text-white/40 font-['Epilogue']">Tiempo Mínimo de Servicio</span>
                    <span class="font-black text-white text-sm font-mono">{{ data().minimumHoursLabel }}</span>
                  </div>
                }
              </div>
            </div>
          }

        </div>

      </div>

      <!-- MEMBER PROFILE MODAL WINDOW (EXACT REPLICA OF CLIENTS_WEB) -->
      @if (selectedMember(); as member) {
        <div (click)="selectedMember.set(null)"
             class="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden animate-fade-in font-['Be_Vietnam_Pro'] select-none">
          
          <div (click)="$event.stopPropagation()"
               class="relative w-full max-w-3xl max-h-[94vh] sm:max-h-[90vh] bg-[#161616] border-t border-x sm:border border-white/15 rounded-t-[32px] sm:rounded-3xl p-4 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col justify-between overflow-hidden mt-auto sm:mt-0">
            
            <!-- Mobile Handle Pill -->
            <div (click)="selectedMember.set(null)" class="w-12 h-1.5 bg-white/20 hover:bg-white/35 rounded-full mx-auto mb-2.5 shrink-0 sm:hidden cursor-pointer active:scale-90 transition-all"></div>

            <!-- Close Modal Button -->
            <button type="button" (click)="selectedMember.set(null)" 
                    class="absolute top-4 right-4 sm:top-5 sm:right-5 z-40 text-white/70 hover:text-white bg-black/80 border border-white/20 p-2 sm:p-2.5 rounded-full transition-all hover:scale-110 active:scale-95 shadow-2xl">
              <span class="material-symbols-outlined text-lg sm:text-xl">close</span>
            </button>

            <!-- Member Header Portrait Cover -->
            <div class="relative w-full h-56 sm:h-[380px] md:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-primary/50 shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-black shrink-0 group">
              <img [src]="member.coverPhotoUrl || member.photoUrl" [alt]="member.name" 
                   class="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-700" />
              
              <div class="absolute inset-0 bg-gradient-to-t from-[#161616] via-[#161616]/20 to-transparent"></div>
              
              <!-- Badges -->
              <div class="absolute top-2.5 left-2.5 right-12 z-20 flex items-center justify-start gap-1.5">
                <span class="px-2.5 py-1 rounded-full bg-black/80 border border-white/20 text-white font-['Epilogue'] font-bold text-[9px] sm:text-xs uppercase tracking-tight backdrop-blur-md shadow-md truncate">
                  {{ member.role }}
                </span>

                @if (member.instrument) {
                  <span class="px-2.5 py-1 rounded-full bg-primary text-black font-['Epilogue'] font-black text-[9px] sm:text-xs uppercase tracking-tight shadow-xl flex items-center gap-1 shrink-0">
                    <span class="material-symbols-outlined text-xs font-black">music_note</span>
                    <span>{{ member.instrument }}</span>
                  </span>
                }

                <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[9px] sm:text-xs uppercase tracking-tight flex items-center gap-1 backdrop-blur-md shadow-md shrink-0">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Verificado</span>
                </span>
              </div>

              <!-- Title -->
              <div class="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 z-20 space-y-0.5 sm:space-y-1">
                <h2 class="font-['Epilogue'] font-black text-xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight leading-none drop-shadow-xl">
                  {{ member.name }}
                </h2>
                <p class="text-white/80 text-[10px] sm:text-sm font-light truncate">
                  {{ data().name }} • {{ member.experienceYears }} años de trayectoria profesional
                </p>
              </div>
            </div>

            <!-- Tab Navigation Bar inside Modal -->
            <nav class="bg-black/60 p-1 sm:p-1.5 rounded-2xl border border-white/10 backdrop-blur-md mt-2.5 sm:mt-3 shrink-0">
              <div class="grid grid-cols-3 gap-1 text-center font-['Epilogue'] font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                <button type="button" (click)="memberModalTab.set('general')"
                        class="py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2"
                        [class]="memberModalTab() === 'general' ? 'bg-primary text-black shadow-lg font-black' : 'text-white/60 hover:text-white hover:bg-white/5'">
                  <span class="material-symbols-outlined text-xs sm:text-base">person</span>
                  <span>General</span>
                </button>

                <button type="button" (click)="memberModalTab.set('media')"
                        class="py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2"
                        [class]="memberModalTab() === 'media' ? 'bg-primary text-black shadow-lg font-black' : 'text-white/60 hover:text-white hover:bg-white/5'">
                  <span class="material-symbols-outlined text-xs sm:text-base">perm_media</span>
                  <span>Fotos & Videos</span>
                </button>

                <button type="button" (click)="memberModalTab.set('socials')"
                        class="py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2"
                        [class]="memberModalTab() === 'socials' ? 'bg-primary text-black shadow-lg font-black' : 'text-white/60 hover:text-white hover:bg-white/5'">
                  <span class="material-symbols-outlined text-xs sm:text-base">share</span>
                  <span>Redes</span>
                </button>
              </div>
            </nav>

            <!-- Scrollable Content Area -->
            <div class="flex-1 overflow-y-auto pr-1 space-y-3 sm:space-y-4 scrollbar-none mt-2.5 sm:mt-3 max-h-[35vh]">
              @switch (memberModalTab()) {
                @case ('general') {
                  <div class="space-y-3 sm:space-y-4">
                    <div class="grid grid-cols-3 gap-1.5 sm:gap-3">
                      <div class="bg-black/50 border border-white/10 rounded-2xl p-2.5 sm:p-3.5 text-center">
                        <span class="text-[8px] sm:text-[9px] text-white/40 uppercase font-bold tracking-widest block truncate font-['Epilogue']">Edad</span>
                        <strong class="font-['Epilogue'] font-black text-xs sm:text-lg text-white mt-0.5 block">{{ member.age || 28 }} Años</strong>
                      </div>

                      <div class="bg-black/50 border border-white/10 rounded-2xl p-2.5 sm:p-3.5 text-center">
                        <span class="text-[8px] sm:text-[9px] text-white/40 uppercase font-bold tracking-widest block truncate font-['Epilogue']">Origen</span>
                        <strong class="font-['Epilogue'] font-black text-[10.5px] sm:text-xs text-white mt-0.5 truncate block">{{ member.hometown }}</strong>
                      </div>

                      <div class="bg-black/50 border border-white/10 rounded-2xl p-2.5 sm:p-3.5 text-center">
                        <span class="text-[8px] sm:text-[9px] text-white/40 uppercase font-bold tracking-widest block truncate font-['Epilogue']">Trayectoria</span>
                        <strong class="font-['Epilogue'] font-black text-xs sm:text-lg text-white mt-0.5 block">{{ member.experienceYears }} Años</strong>
                      </div>
                    </div>

                    @if (member.quote) {
                      <div class="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/30 p-3 sm:p-4 rounded-2xl">
                        <span class="text-[9px] sm:text-[10px] text-primary uppercase font-bold tracking-widest block mb-1 flex items-center gap-1 font-['Epilogue']">
                          <span class="material-symbols-outlined text-xs sm:text-sm">format_quote</span>
                          Lema de Vida
                        </span>
                        <p class="text-white text-xs sm:text-sm font-medium italic leading-snug">
                          "{{ member.quote }}"
                        </p>
                      </div>
                    }

                    <div class="bg-gradient-to-b from-[#201f1f] via-[#1a1919] to-black/80 border border-primary/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3 shadow-xl">
                      <div class="flex items-center gap-2.5 border-b border-white/15 pb-3">
                        <div class="p-2 bg-primary text-black rounded-xl shadow-lg shrink-0">
                          <span class="material-symbols-outlined text-lg font-black">auto_stories</span>
                        </div>
                        <div>
                          <span class="text-[9px] font-bold text-primary uppercase tracking-widest block font-['Epilogue']">Sección Principal</span>
                          <h3 class="font-['Epilogue'] font-black text-sm sm:text-lg text-white uppercase tracking-wide">
                            Biografía Personal y Trayectoria Musical
                          </h3>
                        </div>
                      </div>

                      <p class="text-white/90 text-xs sm:text-sm leading-relaxed font-light bg-black/40 p-3 rounded-xl border border-white/5">
                        {{ member.bio || (member.name + ' es un destacado músico en la escena actual con una amplia trayectoria en palenques y escenarios masivos.') }}
                      </p>

                      <div class="pt-2 border-t border-white/10 text-white/80 text-xs leading-relaxed font-light flex items-start gap-2 bg-primary/5 p-3 rounded-xl border border-primary/20">
                        <span class="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">stars</span>
                        <div>
                          <strong class="text-primary font-bold uppercase tracking-wider block mb-0.5 font-['Epilogue']">Contribución Artística en Vivo:</strong>
                          Como {{ member.role }}, coordina la dinámica interpretativa de <strong>{{ data().name }}</strong>, participando en la estructura de arreglos musicales y garantizando un show inolvidable en cada contratación.
                        </div>
                      </div>
                    </div>
                  </div>
                }
                @case ('media') {
                  <div class="space-y-3">
                    <div class="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                      <h4 class="font-['Epilogue'] font-black text-xs sm:text-sm text-white uppercase tracking-wide flex items-center gap-2 border-b border-white/10 pb-2">
                        <span class="material-symbols-outlined text-primary text-base">photo_camera</span>
                        <span>Galería Fotográfica Personal</span>
                      </h4>

                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <div class="relative h-28 sm:h-36 rounded-2xl overflow-hidden border border-white/10 bg-black shadow-md">
                          <img [src]="member.photoUrl" [alt]="member.name" class="w-full h-full object-cover" />
                        </div>
                        @if (member.coverPhotoUrl) {
                          <div class="relative h-28 sm:h-36 rounded-2xl overflow-hidden border border-white/10 bg-black shadow-md">
                            <img [src]="member.coverPhotoUrl" [alt]="member.name" class="w-full h-full object-cover" />
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
                @case ('socials') {
                  <div class="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                    <h4 class="font-['Epilogue'] font-black text-xs sm:text-sm text-white uppercase tracking-wide flex items-center gap-2 border-b border-white/10 pb-2">
                      <span class="material-symbols-outlined text-primary text-base">share</span>
                      <span>Redes Sociales Oficiales de {{ member.name }}</span>
                    </h4>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <a href="#" target="_blank" (click)="$event.preventDefault()"
                         class="bg-[#1DB954]/10 border border-[#1DB954]/40 p-3 rounded-2xl flex items-center gap-3 transition-all hover:scale-[1.02]">
                        <div class="w-9 h-9 rounded-xl bg-[#1DB954] text-black flex items-center justify-center shrink-0">
                          <span class="material-symbols-outlined text-lg font-bold">music_note</span>
                        </div>
                        <div class="min-w-0">
                          <span class="text-[8.5px] font-bold text-[#1DB954] uppercase tracking-wider block font-['Epilogue']">Perfil Spotify</span>
                          <h5 class="font-['Epilogue'] font-bold text-xs text-white truncate">Spotify Oficial</h5>
                        </div>
                      </a>

                      <a href="#" target="_blank" (click)="$event.preventDefault()"
                         class="bg-[#E1306C]/10 border border-[#E1306C]/40 p-3 rounded-2xl flex items-center gap-3 transition-all hover:scale-[1.02]">
                        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                          <span class="material-symbols-outlined text-lg font-bold">photo_camera</span>
                        </div>
                        <div class="min-w-0">
                          <span class="text-[8.5px] font-bold text-[#E1306C] uppercase tracking-wider block font-['Epilogue']">Instagram Personal</span>
                          <h5 class="font-['Epilogue'] font-bold text-xs text-white truncate">Instagram Oficial</h5>
                        </div>
                      </a>
                    </div>
                  </div>
                }
              }
            </div>

          </div>
        </div>
      }
    </div>
  `
})
export class PreviewTabGeneralComponent {
  data = input.required<GroupPreview>();
  encodeURIComponent = encodeURIComponent;

  selectedMember = signal<PreviewMember | null>(null);
  memberModalTab = signal<'general' | 'media' | 'socials'>('general');

  protected getStatValue(key: 'eventos' | 'horas' | 'satisfaccion'): string {
    const found = this.data().stats.find(s => s.label.toLowerCase().includes(key));
    return found ? found.value : (key === 'eventos' ? '1+' : key === 'horas' ? '849 hrs' : '80%');
  }
}

/** Pestaña "Trayectoria". */
@Component({
  selector: 'app-preview-tab-trayectoria',
  standalone: true,
  imports: [CommonModule, PreviewBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-5">
      <app-preview-block [title]="'Historia y Trayectoria de ' + data().name" icon="auto_stories">
        <p class="text-sm text-white/80 leading-relaxed whitespace-pre-line">{{ data().history }}</p>
      </app-preview-block>

      @if (data().visibility.showMilestones && data().milestones.length) {
        <app-preview-block title="Hitos y Momentos Clave" icon="timeline">
          <ol class="relative border-l-2 border-primary/30 ml-2 space-y-6">
            @for (m of data().milestones; track m.year + m.title) {
              <li class="pl-5 relative">
                <span class="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-primary ring-4 ring-[#0d0b16]"></span>
                <span class="text-xs font-black text-primary font-mono">{{ m.year }}</span>
                <h3 class="text-sm font-black text-white">{{ m.title }}</h3>
                <p class="text-[12px] text-white/70 leading-relaxed">{{ m.description }}</p>
              </li>
            }
          </ol>
        </app-preview-block>
      }

      @if (data().awards.length) {
        <app-preview-block title="Premios y Reconocimientos Destacados" icon="emoji_events">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            @for (a of data().awards; track a) {
              <div class="rounded-2xl bg-amber-500/10 border border-amber-500/25 px-3.5 py-2.5 text-xs font-bold text-amber-200 flex items-center gap-2">
                <span class="material-symbols-outlined text-base">military_tech</span>
                {{ a }}
              </div>
            }
          </div>
        </app-preview-block>
      }
    </div>
  `
})
export class PreviewTabTrayectoriaComponent {
  data = input.required<GroupPreview>();
}

/** Pestaña "Música & Repertorio". */
@Component({
  selector: 'app-preview-tab-musica',
  standalone: true,
  imports: [CommonModule, PreviewBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-5">
      @if (data().visibility.showPopularTracks) {
        <app-preview-block title="Más Escuchadas" icon="local_fire_department">
          <div class="space-y-2">
            @for (t of popular(); track t.title; let i = $index) {
              <div class="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5">
                <span class="w-7 h-7 rounded-lg bg-primary/20 text-primary font-black text-xs flex items-center justify-center shrink-0">{{ i + 1 }}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-black text-white truncate">{{ t.title }}</p>
                  <p class="text-[11px] text-white/55 truncate">{{ t.genre }} · {{ t.year }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-[11px] font-black text-primary">{{ t.plays }}</p>
                  <p class="text-[10px] text-white/45 font-mono">{{ t.duration }}</p>
                </div>
              </div>
            }
          </div>
        </app-preview-block>
      }

      @if (data().visibility.showMusicCatalog) {
        @for (g of data().repertoireByGenre; track g.genre) {
          <app-preview-block [title]="g.genre" icon="library_music">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              @for (t of g.tracks; track t.title) {
                <div class="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/8 px-3 py-2">
                  <span class="material-symbols-outlined text-sm text-primary shrink-0">music_note</span>
                  <span class="text-xs font-bold text-white/85 truncate flex-1">{{ t.title }}</span>
                  <span class="text-[10px] text-white/45 font-mono shrink-0">{{ t.duration }}</span>
                </div>
              }
            </div>
          </app-preview-block>
        }
      }

      @if (!data().visibility.showPopularTracks && !data().visibility.showMusicCatalog) {
        <p class="text-center text-sm text-white/50 italic py-10">La sección de música está actualmente oculta en la vista previa.</p>
      }
    </div>
  `
})
export class PreviewTabMusicaComponent {
  data = input.required<GroupPreview>();
  popular = () => this.data().tracks.filter(t => t.isPopular);
}

/** Pestaña "Publicaciones". */
@Component({
  selector: 'app-preview-tab-publicaciones',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (data().visibility.showPosts) {
      @if (data().posts.length) {
        <div class="space-y-4 max-w-2xl mx-auto">
          @for (p of data().posts; track p.id) {
            <article class="rounded-3xl bg-white/[0.04] border border-white/10 overflow-hidden">
              <div class="p-4 flex items-center gap-2.5">
                <img [src]="data().avatarUrl" [alt]="data().name" class="w-10 h-10 rounded-xl object-cover" />
                <div class="min-w-0">
                  <p class="text-sm font-black text-white truncate">{{ data().name }}</p>
                  <p class="text-[10px] text-white/50 font-mono">{{ p.publishedAt }}</p>
                </div>
              </div>

              <p class="px-4 pb-3 text-sm text-white/85 leading-relaxed">{{ p.content }}</p>

              @if (p.imageUrl) {
                <img [src]="p.imageUrl" alt="" class="w-full max-h-96 object-cover" />
              }

              <div class="px-4 py-3 flex items-center gap-5 text-xs font-bold text-white/60 border-t border-white/10">
                <span class="inline-flex items-center gap-1.5"><span class="material-symbols-outlined text-base text-rose-400">favorite</span> {{ p.likes | number:'1.0-0' }}</span>
                <span class="inline-flex items-center gap-1.5"><span class="material-symbols-outlined text-base">chat_bubble</span> {{ p.comments }}</span>
              </div>
            </article>
          }
        </div>
      } @else {
        <p class="text-center text-sm text-white/50 italic py-10">Este grupo todavía no tiene publicaciones visibles.</p>
      }
    } @else {
      <p class="text-center text-sm text-white/50 italic py-10">La sección de publicaciones está actualmente oculta en la vista previa.</p>
    }
  `
})
export class PreviewTabPublicacionesComponent {
  data = input.required<GroupPreview>();
}

/** Pestaña "Galería & Shows". */
@Component({
  selector: 'app-preview-tab-galeria',
  standalone: true,
  imports: [CommonModule, PreviewBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-5">
      @if (data().visibility.showHighlightVideos && data().videos.length) {
        <app-preview-block title="Shows & Videos" icon="smart_display">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (v of data().videos; track v.title) {
              <div class="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10">
                <div class="relative h-40">
                  <img [src]="v.thumbnailUrl" [alt]="v.title" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span class="material-symbols-outlined text-5xl text-white drop-shadow-lg">play_circle</span>
                  </div>
                  <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-black font-mono">{{ v.duration }}</span>
                </div>
                <div class="p-3">
                  <p class="text-sm font-black text-white truncate">{{ v.title }}</p>
                  <p class="text-[11px] text-white/50">{{ v.views }} vistas</p>
                </div>
              </div>
            }
          </div>
        </app-preview-block>
      }

      @if (data().visibility.showPhotoGallery) {
        <app-preview-block title="Galería Fotográfica" icon="photo_library">
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            @for (img of data().gallery; track img.url + img.caption) {
              <figure class="relative rounded-2xl overflow-hidden aspect-square group">
                <img [src]="img.url" [alt]="img.caption" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <figcaption class="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                  <span class="text-[10px] font-bold text-white leading-snug">{{ img.caption }}</span>
                </figcaption>
              </figure>
            }
          </div>
        </app-preview-block>
      }

      @if (!data().visibility.showHighlightVideos && !data().visibility.showPhotoGallery) {
        <p class="text-center text-sm text-white/50 italic py-10">La sección de galería está actualmente oculta en la vista previa.</p>
      }
    </div>
  `
})
export class PreviewTabGaleriaComponent {
  data = input.required<GroupPreview>();
}

/** Pestaña "Reseñas". */
@Component({
  selector: 'app-preview-tab-resenas',
  standalone: true,
  imports: [CommonModule, PreviewBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (data().visibility.showReviews) {
      <div class="space-y-5">
        <app-preview-block title="Opinión del Público" icon="reviews">
          <div class="flex items-center gap-6 flex-wrap">
            <div class="text-center">
              <p class="text-4xl font-black text-primary">{{ data().rating }}</p>
              <p class="text-amber-300 text-sm">
                @for (s of stars; track s) {<span [class]="s <= data().rating ? '' : 'opacity-25'">★</span>}
              </p>
              <p class="text-[11px] text-white/55 mt-0.5">{{ data().reviewCount }} reseñas</p>
            </div>
            <div class="flex-1 min-w-[12rem]">
              <div class="flex items-center justify-between text-[11px] font-bold text-white/70 mb-1">
                <span>Aprobación general</span>
                <span class="text-emerald-300">{{ data().approvalPercent }}%</span>
              </div>
              <div class="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400" [style.width.%]="data().approvalPercent"></div>
              </div>
            </div>
          </div>
        </app-preview-block>

        <div class="space-y-3">
          @for (r of data().reviews; track r.id) {
            <article class="rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex gap-3.5">
              <img [src]="r.avatarUrl" [alt]="r.clientName" class="w-11 h-11 rounded-xl object-cover shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <p class="text-sm font-black text-white truncate">{{ r.clientName }}</p>
                  <span class="text-amber-300 text-sm shrink-0">
                    @for (s of stars; track s) {<span [class]="s <= r.rating ? '' : 'opacity-25'">★</span>}
                  </span>
                </div>
                <p class="text-[11px] text-white/50">{{ r.eventName }} · {{ r.eventDate }}</p>
                <p class="text-[13px] text-white/80 leading-relaxed mt-1.5">"{{ r.comment }}"</p>
              </div>
            </article>
          }
        </div>
      </div>
    } @else {
      <p class="text-center text-sm text-white/50 italic py-10">La sección de reseñas está actualmente oculta en la vista previa.</p>
    }
  `
})
export class PreviewTabResenasComponent {
  data = input.required<GroupPreview>();
  protected readonly stars = [1, 2, 3, 4, 5];
}
