import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupProfile, GroupMember, musicians, staff } from '../../group-profile.model';
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
      <section class="space-y-3.5">
        <header class="flex items-center justify-between gap-2 flex-wrap">
          <h3 class="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
            <span class="material-symbols-outlined text-base">music_note</span> Alineación Artística
          </h3>
          <span class="text-xs font-black text-outline bg-surface-container px-3 py-1 rounded-xl border border-outline-variant/30">
            {{ bandMembers().length }} integrantes activos
          </span>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (m of bandMembers(); track m.id) {
            <button
              type="button"
              (click)="openMember.emit(m)"
              class="group text-left rounded-3xl overflow-hidden bg-[#18152a] border border-outline-variant/30 hover:border-primary/60 hover:shadow-[0_0_30px_rgba(242,202,80,0.25)] transition-all duration-300 transform hover:-translate-y-1"
            >
              <div class="relative h-28">
                <img [src]="m.coverPhotoUrl || m.photoUrl" [alt]="m.name" class="w-full h-full object-cover opacity-60 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500" />
                <div class="absolute inset-0 bg-gradient-to-t from-[#18152a] via-[#18152a]/40 to-transparent"></div>
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
      <section class="space-y-3.5 pt-2">
        <header class="flex items-center justify-between gap-2 flex-wrap">
          <h3 class="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-base">engineering</span> Equipo de Apoyo & Logística
          </h3>
          <span class="text-xs font-black text-outline bg-surface-container px-3 py-1 rounded-xl border border-outline-variant/30">
            {{ crew().length }} personas
          </span>
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

    </div>
  `
})
export class GroupTabMembersComponent {
  profile = input.required<GroupProfile>();
  openMember = output<GroupMember>();

  bandMembers = computed(() => musicians(this.profile()));
  crew = computed(() => staff(this.profile()));

  instrumentList(inst?: string): string[] {
    if (!inst) return [];
    return inst.split(',').map(s => s.trim()).filter(Boolean);
  }
}
