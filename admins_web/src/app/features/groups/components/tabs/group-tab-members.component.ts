import { Component, input, output, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupProfile, GroupMember, musicians, staff, defaultSectionVisibility } from '../../group-profile.model';
import { GroupProfileStore } from '../../group-profile.store';
import { GroupSectionComponent } from '../group-section.component';

/**
 * Sub-apartado INTEGRANTES.
 *
 * Separa a quien toca de quien opera (chofer, ingeniero, cargadores) porque son
 * dos lecturas distintas: la alineación artística es lo que el cliente ve en el
 * perfil público, y el staff es logística interna. Cada ficha abre en el panel
 * lateral para no perder el listado.
 */
@Component({
  selector: 'app-group-tab-members',
  standalone: true,
  imports: [CommonModule, GroupSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="space-y-6 select-none text-xs">

      <!-- ALINEACIÓN ARTÍSTICA -->
      <section
        class="p-5 sm:p-6 rounded-3xl bg-surface-container border transition-all duration-300 space-y-4"
        [class]="vis().showMembersSection ? 'border-outline-variant/30' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.2)] opacity-85'"
      >
        <header class="flex items-center justify-between gap-2 flex-wrap border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
              <span class="material-symbols-outlined text-base">music_note</span>
            </span>
            <div>
              <h3 class="text-xs font-black uppercase tracking-wider text-primary font-display-md">Alineación Artística</h3>
              <p class="text-[10px] text-outline">Sección "Integrantes del Grupo" expuesta en la Vista Previa del Cliente</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
              <button
                type="button"
                (click)="!vis().showMembersSection && store.toggleSectionVisibility('showMembersSection')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="vis().showMembersSection ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
              >
                VISIBLE
              </button>
              <button
                type="button"
                (click)="vis().showMembersSection && store.toggleSectionVisibility('showMembersSection')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="!vis().showMembersSection ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
              >
                OCULTAR
              </button>
            </div>

            <button
              type="button"
              (click)="openAddMemberModal()"
              class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-primary to-amber-400 text-on-primary font-black text-xs hover:scale-105 transition-all flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <span class="material-symbols-outlined text-sm font-bold">person_add</span> Añadir Integrante
            </button>
            <span class="text-xs font-black text-outline bg-surface-container px-3 py-1 rounded-xl border border-outline-variant/30">
              {{ bandMembers().length }} integrantes activos
            </span>
          </div>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (m of bandMembers(); track m.id) {
            <button
              type="button"
              (click)="openMember.emit(m)"
              class="group text-left rounded-3xl overflow-hidden bg-[#18152a] border border-outline-variant/30 hover:border-primary/60 hover:shadow-[0_0_30px_rgba(242,202,80,0.25)] transition-all duration-300 transform hover:-translate-y-1"
            >
              <div class="relative h-32 overflow-hidden bg-black">
                <img [src]="m.coverPhotoUrl || m.photoUrl" [alt]="m.name" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 filter brightness-90 group-hover:brightness-125 transition-all duration-500" />
                <div class="absolute inset-0 bg-gradient-to-t from-[#18152a] via-[#18152a]/40 to-transparent group-hover:from-[#18152a]/80 group-hover:via-transparent transition-all duration-500"></div>
                <span class="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-black text-amber-300 shadow-md">
                  {{ m.experienceYears }} años trayec.
                </span>
              </div>

              <div class="px-4 pb-4 -mt-10 relative space-y-2.5">
                <div class="flex items-end justify-between gap-2">
                  <img
                    [src]="m.photoUrl"
                    [alt]="m.name"
                    class="w-16 h-16 rounded-2xl object-cover ring-4 ring-[#18152a] shadow-xl group-hover:scale-105 transition-transform"
                  />
                  <span class="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                    {{ m.status }}
                  </span>
                </div>

                <div class="min-w-0">
                  <h4 class="text-base font-black text-on-surface truncate group-hover:text-primary transition-colors font-display-md">{{ m.name }}</h4>
                  <p class="text-xs font-black text-primary truncate">{{ m.role }}</p>
                </div>

                @if (m.instrument) {
                  <div class="flex flex-wrap gap-1">
                    @for (inst of instrumentList(m.instrument); track inst) {
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container border border-outline-variant/30 text-[10px] font-bold text-outline">
                        <span class="material-symbols-outlined text-xs text-primary">music_note</span> {{ inst }}
                      </span>
                    }
                  </div>
                }

                @if (m.quote) {
                  <p class="text-[11px] text-outline italic leading-relaxed line-clamp-2 font-medium">"{{ m.quote }}"</p>
                }

                <div class="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-[10px] font-extrabold">
                  <span class="text-outline">{{ m.age }} años · {{ m.hometown }}</span>
                  <span class="text-primary group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    Ver Ficha Completa <span class="material-symbols-outlined text-xs">chevron_right</span>
                  </span>
                </div>
              </div>
            </button>
          }
        </div>
      </section>

      <!-- STAFF / EQUIPO DE APOYO -->
      <section
        class="p-5 sm:p-6 rounded-3xl bg-surface-container border transition-all duration-300 space-y-4"
        [class]="vis().showStaffMembers ? 'border-outline-variant/30' : 'border-rose-500/60 bg-rose-950/20 shadow-[0_0_25px_rgba(244,63,94,0.2)] opacity-85'"
      >
        <header class="flex items-center justify-between gap-2 flex-wrap border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
              <span class="material-symbols-outlined text-base">engineering</span>
            </span>
            <div>
              <h3 class="text-xs font-black uppercase tracking-wider text-cyan-300 font-display-md">Equipo de Apoyo & Logística</h3>
              <p class="text-[10px] text-outline">Sección "Staff Técnico & Producción" expuesta en la Vista Previa del Cliente</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="inline-flex p-0.5 rounded-xl bg-[#131022] border border-white/15 shadow-inner">
              <button
                type="button"
                (click)="!vis().showStaffMembers && store.toggleSectionVisibility('showStaffMembers')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="vis().showStaffMembers ? 'bg-emerald-500 text-black font-black shadow-md' : 'text-white/50 hover:text-white font-bold'"
              >
                VISIBLE
              </button>
              <button
                type="button"
                (click)="vis().showStaffMembers && store.toggleSectionVisibility('showStaffMembers')"
                class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-all"
                [class]="!vis().showStaffMembers ? 'bg-rose-500 text-white font-black shadow-md animate-pulse' : 'text-white/50 hover:text-white font-bold'"
              >
                OCULTAR
              </button>
            </div>

            <span class="text-xs font-black text-outline bg-surface-container px-3 py-1 rounded-xl border border-outline-variant/30">
              {{ crew().length }} personas
            </span>
          </div>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          @for (m of crew(); track m.id) {
            <button
              type="button"
              (click)="openMember.emit(m)"
              class="group text-left p-3.5 rounded-2xl bg-[#18152a] border border-outline-variant/30 hover:border-cyan-400/60 hover:shadow-lg transition-all flex items-center gap-3.5"
            >
              <img [src]="m.photoUrl" [alt]="m.name" class="w-12 h-12 rounded-2xl object-cover ring-2 ring-cyan-500/40 shrink-0 group-hover:scale-105 transition-transform" />
              <div class="min-w-0 flex-1">
                <h4 class="text-xs font-black text-on-surface truncate group-hover:text-cyan-300 transition-colors">{{ m.name }}</h4>
                <p class="text-[11px] font-black text-cyan-400 truncate">{{ m.role }}</p>
                <p class="text-[10px] text-outline font-bold truncate">{{ m.hometown }}</p>
              </div>
              <span class="material-symbols-outlined text-base text-outline group-hover:text-cyan-300 group-hover:translate-x-1 transition-all shrink-0">chevron_right</span>
            </button>
          }
        </div>
      </section>

      <!-- EX INTEGRANTES. Salen de la alineación pero no del expediente. -->
      @if (formerMembers().length) {
        <app-group-section
          title="Ex Integrantes"
          icon="person_off"
          tone="rose"
          [subtitle]="formerMembers().length + ' persona(s) dadas de baja'"
          [collapsible]="true"
          [initiallyCollapsed]="true"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            @for (m of formerMembers(); track m.id) {
              <button
                type="button"
                (click)="openMember.emit(m)"
                class="group text-left p-3.5 rounded-2xl bg-surface-container border border-rose-500/25 hover:border-rose-400/60 transition-all flex items-center gap-3"
              >
                <img [src]="m.photoUrl" [alt]="m.name" class="w-12 h-12 rounded-xl object-cover grayscale opacity-70 shrink-0" />
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-black text-on-surface truncate">{{ m.name }}</h4>
                  <p class="text-[11px] font-bold text-rose-300 truncate">{{ m.role }}</p>
                  @if (m.leftAt) {
                    <p class="text-[10px] text-outline font-mono truncate">Baja: {{ m.leftAt }}</p>
                  }
                </div>
                <span class="material-symbols-outlined text-sm text-outline group-hover:text-rose-300 shrink-0">chevron_right</span>
              </button>
            }
          </div>
        </app-group-section>
      }

      <!-- BITÁCORA DE ALTAS Y BAJAS (COLLAPSIBLE ACCORDION) -->
      <app-group-section
        title="Bitácora de Alineación (Histórico)"
        icon="history"
        tone="neutral"
        subtitle="Registro interno de movimientos de personal"
        [collapsible]="true"
        [initiallyCollapsed]="true"
      >
        <ul class="space-y-2.5">
          @for (log of profile().rosterLog; track log.id) {
            <li
              class="p-3 rounded-2xl border flex items-start gap-3 shadow-sm"
              [class]="log.action === 'Alta'
                ? 'bg-emerald-500/8 border-emerald-500/30'
                : 'bg-rose-500/8 border-rose-500/30'"
            >
              <span
                class="material-symbols-outlined text-lg shrink-0 mt-0.5"
                [class]="log.action === 'Alta' ? 'text-emerald-400' : 'text-rose-400'"
              >
                {{ log.action === 'Alta' ? 'person_add' : 'person_remove' }}
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <span class="text-xs font-black text-on-surface">{{ log.memberName }}</span>
                  <span
                    class="text-[9px] font-black px-2.5 py-0.5 rounded-full border"
                    [class]="log.action === 'Alta'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'"
                  >
                    {{ log.action.toUpperCase() }}
                  </span>
                </div>
                <p class="text-[11px] text-outline font-bold">{{ log.role }}</p>
                <p class="text-[10px] text-outline font-mono mt-0.5">{{ log.at }}</p>
                @if (log.note) {
                  <p class="text-[11px] text-on-surface/80 italic mt-1 font-medium">{{ log.note }}</p>
                }
              </div>
            </li>
          }
        </ul>
      </app-group-section>

      <!-- MODAL POPUP: AÑADIR INTEGRANTE O STAFF (DAR DE ALTA SISTEMA) -->
      @if (showMemberModal()) {
        <div class="fixed inset-0 z-[99999999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in" (click)="showMemberModal.set(false)">
          <div class="w-full max-w-lg bg-gradient-to-b from-[#1c1836] via-[#141126] to-[#0d0b1a] border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_80px_rgba(242,202,80,0.2)] relative overflow-hidden space-y-6" (click)="$event.stopPropagation()">
            <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

            <header class="flex items-center justify-between border-b border-outline-variant/20 pb-4 relative z-10">
              <div class="flex items-center gap-3">
                <span class="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-emerald-500/20 text-primary border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span class="material-symbols-outlined text-xl">person_add</span>
                </span>
                <div>
                  <h3 class="text-sm font-black uppercase text-on-surface tracking-wider font-display-md">Añadir Integrante / Staff</h3>
                  <p class="text-[11px] text-outline font-medium">Registra un nuevo elemento y emite su alta automática en bitácora</p>
                </div>
              </div>
              <button type="button" (click)="showMemberModal.set(false)" class="w-8 h-8 rounded-full bg-surface-container/60 hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center transition-all hover:scale-110">✕</button>
            </header>

            <!-- TABS DE SELECCIÓN: ALINEACIÓN ARTÍSTICA VS STAFF -->
            <div class="grid grid-cols-2 p-1.5 bg-[#0d0a1a] rounded-2xl border border-outline-variant/30 relative z-10">
              <button
                type="button"
                (click)="newMemberCrewRole.set('Integrante')"
                class="py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                [class]="newMemberCrewRole() === 'Integrante' ? 'bg-primary text-on-primary shadow-md' : 'text-outline hover:text-on-surface'"
              >
                <span class="material-symbols-outlined text-base">music_note</span> Alineación Artística
              </button>
              <button
                type="button"
                (click)="newMemberCrewRole.set('Staff')"
                class="py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                [class]="newMemberCrewRole() === 'Staff' ? 'bg-emerald-500 text-black shadow-md' : 'text-outline hover:text-on-surface'"
              >
                <span class="material-symbols-outlined text-base">engineering</span> Apoyo & Logística
              </button>
            </div>

            <div class="space-y-4 relative z-10">
              <!-- NOMBRE COMPLETO -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Nombre Completo del Integrante</label>
                <input
                  #mNameInput
                  type="text"
                  [value]="newMemberName()"
                  (input)="newMemberName.set(mNameInput.value)"
                  placeholder="Ej. Roberto 'El Güero' Garza"
                  class="w-full bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-bold"
                />
              </div>

              <!-- SI ES MÚSICO ARTÍSTICO -->
              @if (newMemberCrewRole() === 'Integrante') {
                <div class="grid grid-cols-2 gap-3">
                  <!-- SELECTOR DE INSTRUMENTO -->
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Instrumento Principal</label>
                    <select
                      #instSelect
                      [value]="selectedInstrumentOption()"
                      (change)="handleInstrumentSelect(instSelect.value)"
                      class="w-full bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-bold"
                    >
                      @for (inst of presetInstruments; track inst) {
                        <option [value]="inst">{{ inst }}</option>
                      }
                    </select>
                  </div>

                  <!-- ROL ARTÍSTICO -->
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Rol / Posición Escénica</label>
                    <input
                      #mRoleInput
                      type="text"
                      [value]="newMemberRole()"
                      (input)="newMemberRole.set(mRoleInput.value)"
                      placeholder="Vocalista Principal"
                      class="w-full bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                @if (selectedInstrumentOption() === 'Otro / Personalizado') {
                  <div class="space-y-1.5 animate-fade-in">
                    <label class="text-[10px] font-bold text-primary uppercase tracking-wider block">Especifica el Instrumento Personalizado</label>
                    <input
                      #customInstInput
                      type="text"
                      [value]="customInstrumentText()"
                      (input)="customInstrumentText.set(customInstInput.value)"
                      placeholder="Ej. Acordeón de Botones de Madera"
                      class="w-full bg-[#0d0a1a] border border-primary/40 focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-medium"
                    />
                  </div>
                }
              }

              <!-- SI ES EQUIPO DE APOYO & LOGÍSTICA (STAFF) -->
              @if (newMemberCrewRole() === 'Staff') {
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Puesto / Cargo Operativo</label>
                  <select
                    #staffRoleSelect
                    [value]="selectedStaffOption()"
                    (change)="handleStaffSelect(staffRoleSelect.value)"
                    class="w-full bg-[#0d0a1a] border border-outline-variant/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-bold"
                  >
                    @for (role of presetStaffRoles; track role) {
                      <option [value]="role">{{ role }}</option>
                    }
                  </select>
                </div>

                @if (selectedStaffOption() === 'Otro Cargo') {
                  <div class="space-y-1.5 animate-fade-in">
                    <label class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Especifica el Cargo Personalizado</label>
                    <input
                      #customStaffInput
                      type="text"
                      [value]="customStaffText()"
                      (input)="customStaffText.set(customStaffInput.value)"
                      placeholder="Ej. Especialista en Pirotecnia"
                      class="w-full bg-[#0d0a1a] border border-emerald-500/40 focus:ring-2 focus:ring-emerald-400/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-medium"
                    />
                  </div>
                }
              }

              <div class="grid grid-cols-2 gap-3">
                <!-- EDAD -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Edad</label>
                  <input
                    #mAgeInput
                    type="number"
                    [value]="newMemberAge()"
                    (input)="newMemberAge.set(+mAgeInput.value || 28)"
                    placeholder="28"
                    class="w-full bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-mono font-bold"
                  />
                </div>

                <!-- ORIGEN -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Ciudad de Origen</label>
                  <input
                    #mHomeInput
                    type="text"
                    [value]="newMemberHometown()"
                    (input)="newMemberHometown.set(mHomeInput.value)"
                    placeholder="Monterrey, N.L."
                    class="w-full bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <!-- FOTO -->
              <div class="space-y-1.5">
                <label class="text-[11px] font-bold text-outline uppercase tracking-wider block">Fotografía Oficial HD</label>
                <div class="flex items-center gap-2">
                  <input
                    #mPhotoInput
                    type="url"
                    [value]="newMemberPhotoUrl()"
                    (input)="newMemberPhotoUrl.set(mPhotoInput.value)"
                    placeholder="https://..."
                    class="flex-1 bg-[#0d0a1a] border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl px-4 py-3 text-xs text-on-surface outline-none transition-all font-mono"
                  />
                  <label class="px-4 py-3 rounded-2xl bg-primary/20 hover:bg-primary text-primary hover:text-black border border-primary/40 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shrink-0 shadow-md">
                    <span class="material-symbols-outlined text-base">upload_file</span> Subir Foto
                    <input type="file" accept="image/*" class="hidden" (change)="handleMemberFileSelect($event)" />
                  </label>
                </div>
                @if (newMemberPhotoUrl()) {
                  <div class="mt-2.5 flex items-center gap-3 p-3 rounded-2xl bg-[#0d0a1a] border border-primary/30 shadow-md">
                    <img [src]="newMemberPhotoUrl()" alt="Vista previa" class="w-12 h-12 rounded-xl object-cover ring-2 ring-primary/40 shrink-0" />
                    <div class="min-w-0 flex-1">
                      <p class="text-xs font-bold text-on-surface truncate">{{ newMemberName() || 'Nuevo Integrante' }}</p>
                      <p class="text-[10px] text-outline truncate font-medium">{{ newMemberRole() }} • {{ newMemberHometown() }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>

            <footer class="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20 relative z-10">
              <button
                type="button"
                (click)="showMemberModal.set(false)"
                class="px-5 py-2.5 rounded-2xl bg-surface-container/60 hover:bg-surface-container text-outline hover:text-on-surface text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                (click)="submitNewMember()"
                [disabled]="!newMemberName().trim()"
                class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-black font-black text-xs hover:scale-105 transition-all shadow-[0_0_25px_rgba(52,211,153,0.4)] disabled:opacity-50 disabled:scale-100"
              >
                Registrar & Dar de Alta
              </button>
            </footer>
          </div>
        </div>
      }

    </div>
  `
})
export class GroupTabMembersComponent {
  profile = input.required<GroupProfile>();

  store = inject(GroupProfileStore);
  vis = computed(() => this.profile().sectionVisibility ?? defaultSectionVisibility());

  openMember = output<GroupMember>();
  addMember = output<void>();

  bandMembers = computed(() => musicians(this.profile()));
  crew = computed(() => staff(this.profile()));
  formerMembers = computed(() => this.profile().members.filter(m => m.status === 'Baja'));

  // Member Modal Signals
  showMemberModal = signal<boolean>(false);
  newMemberName = signal<string>('');
  newMemberRole = signal<string>('Vocalista Principal / Acordeón');
  newMemberCrewRole = signal<'Integrante' | 'Staff'>('Integrante');
  newMemberInstrument = signal<string>('Acordeón');
  newMemberAge = signal<number>(27);
  newMemberHometown = signal<string>('Monterrey, N.L.');
  newMemberPhotoUrl = signal<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400');

  presetInstruments = [
    'Acordeón',
    'Voz Principal & Acordeón',
    'Voz Principal',
    'Segunda Voz & Bajo Sexto',
    'Bajo Sexto',
    'Bajo Quinto',
    'Batería',
    'Saxofón',
    'Bajo Eléctrico',
    'Teclado / Piano',
    'Trombón',
    'Trompeta',
    'Tarolas & Percusiones',
    'Otro / Personalizado'
  ];

  presetStaffRoles = [
    'Ingeniero de Audio FOH (Sala)',
    'Ingeniero de Monitores',
    'Técnico de Iluminación & Pantallas',
    'Chofer de Autobús / Logística de Viaje',
    'Stage Manager (Jefe de Escenario)',
    'Roadie / Técnico de Instrumentos',
    'Personal de Seguridad & Staff',
    'Mánager de Gira',
    'Otro Cargo'
  ];

  selectedInstrumentOption = signal<string>('Acordeón');
  customInstrumentText = signal<string>('');

  selectedStaffOption = signal<string>('Ingeniero de Audio FOH (Sala)');
  customStaffText = signal<string>('');

  handleInstrumentSelect(val: string): void {
    this.selectedInstrumentOption.set(val);
    if (val !== 'Otro / Personalizado') {
      this.newMemberInstrument.set(val);
      this.newMemberRole.set(val);
    }
  }

  handleStaffSelect(val: string): void {
    this.selectedStaffOption.set(val);
    if (val !== 'Otro Cargo') {
      this.newMemberRole.set(val);
    }
  }

  instrumentList(inst?: string): string[] {
    if (!inst) return [];
    return inst.split(',').map(s => s.trim()).filter(Boolean);
  }

  createNewMember(): void {
    this.store.openAddMemberModal();
  }

  openAddMemberModal(): void {
    this.store.openAddMemberModal();
  }

  handleMemberFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      this.newMemberPhotoUrl.set(URL.createObjectURL(file));
    }
  }

  submitNewMember(): void {
    const name = this.newMemberName().trim();
    if (!name) return;

    let role = this.newMemberRole().trim();
    let instrument = this.newMemberInstrument().trim();

    if (this.newMemberCrewRole() === 'Integrante') {
      if (this.selectedInstrumentOption() === 'Otro / Personalizado') {
        instrument = this.customInstrumentText().trim() || 'Instrumento Musical';
      } else {
        instrument = this.selectedInstrumentOption();
      }
      if (!role) role = instrument;
    } else {
      if (this.selectedStaffOption() === 'Otro Cargo') {
        role = this.customStaffText().trim() || 'Staff de Producción';
      } else {
        role = this.selectedStaffOption();
      }
      instrument = 'Equipo de Producción';
    }

    const newMember: GroupMember = {
      id: 'm-' + Date.now(),
      name,
      role,
      crewRole: this.newMemberCrewRole(),
      status: 'Activo',
      joinedAt: new Date().toISOString().split('T')[0],
      instrument,
      photoUrl: this.newMemberPhotoUrl().trim(),
      quote: 'Dando el 100% en cada escenario.',
      bio: 'Músico / Staff integrante del grupo.',
      fullBio: 'Historial profesional y trayectoria destacada dentro de la agrupación.',
      age: this.newMemberAge() || 28,
      hometown: this.newMemberHometown().trim() || 'Monterrey, N.L.',
      experienceYears: 5,
      galleryPhotos: [],
      videos: [],
      socials: {}
    };

    this.store.addMember(newMember);
    this.showMemberModal.set(false);
  }
}
