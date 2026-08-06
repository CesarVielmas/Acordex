import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MockDataService } from '../../core/services/mock-data.service';
import { LayoutStateService } from '../../core/services/layout_state.service';
import { GroupProfileStore } from '../groups/group-profile.store';
import { buildGroupProfile } from '../groups/group-profile.mock';
import { toPreview } from './group-preview.model';

import { PreviewReturnBarComponent } from './components/preview-return-bar.component';
import { PreviewHeroComponent } from './components/preview-hero.component';
import {
  PreviewTabGeneralComponent,
  PreviewTabTrayectoriaComponent,
  PreviewTabMusicaComponent,
  PreviewTabPublicacionesComponent,
  PreviewTabGaleriaComponent,
  PreviewTabResenasComponent
} from './components/preview-sections.component';

type PreviewTab = 'general' | 'trayectoria' | 'musica' | 'publicaciones' | 'galeria' | 'resenas';

/**
 * Vista previa del perfil público de un grupo.
 *
 * Replica lo que un cliente ve en el portal (`/grupo/:id` de `clients_web`)
 * para que el administrador compruebe cómo queda el perfil **antes** de
 * publicar los cambios.
 *
 * Lee del mismo `GroupProfileStore` que el expediente, así que refleja también
 * las ediciones sin guardar: es justo el sentido de una vista previa, ver el
 * resultado de lo que se acaba de tocar.
 *
 * Va montada fuera del layout administrativo (ruta hermana, no hija) para que
 * no aparezcan la barra lateral ni la cabecera del panel, que romperían la
 * ilusión de estar viendo el portal público.
 */
@Component({
  selector: 'app-group-preview-page',
  standalone: true,
  imports: [
    CommonModule,
    PreviewReturnBarComponent,
    PreviewHeroComponent,
    PreviewTabGeneralComponent,
    PreviewTabTrayectoriaComponent,
    PreviewTabMusicaComponent,
    PreviewTabPublicacionesComponent,
    PreviewTabGaleriaComponent,
    PreviewTabResenasComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-screen bg-[#0b0b0d] text-white font-[\'Be_Vietnam_Pro\']' },
  template: `
    @if (preview(); as data) {
      <app-preview-return-bar
        [groupName]="data.name"
        [hasUnsavedChanges]="hasUnsavedChanges()"
        (back)="returnToEditor()"
      />

      <app-preview-hero [data]="data" />

      <!-- Navegación de pestañas interactiva idéntica a clients_web -->
      <nav class="sticky top-0 z-30 bg-[#131313]/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-2.5 sm:py-3 text-xs sm:text-sm font-['Epilogue'] font-bold uppercase tracking-wider">
            @for (t of tabs; track t.id) {
              <button
                type="button"
                (click)="activeTab.set(t.id)"
                [attr.aria-pressed]="activeTab() === t.id"
                class="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all duration-300 shrink-0 flex items-center gap-1.5 sm:gap-2"
                [class]="activeTab() === t.id
                  ? 'bg-primary text-black shadow-md font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5 font-bold'"
              >
                <span class="material-symbols-outlined text-sm sm:text-base">{{ t.icon }}</span>
                <span>{{ t.label }}</span>
              </button>
            }
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16">
        @switch (activeTab()) {
          @case ('general') { <app-preview-tab-general [data]="data" /> }
          @case ('trayectoria') { <app-preview-tab-trayectoria [data]="data" /> }
          @case ('musica') { <app-preview-tab-musica [data]="data" /> }
          @case ('publicaciones') { <app-preview-tab-publicaciones [data]="data" /> }
          @case ('galeria') { <app-preview-tab-galeria [data]="data" /> }
          @case ('resenas') { <app-preview-tab-resenas [data]="data" /> }
        }
      </main>

      <footer class="border-t border-white/10 py-8 text-center bg-[#0d0d0f]">
        <p class="text-[11px] text-white/35 font-['Epilogue'] tracking-wider uppercase font-bold">
          Vista previa del portal de cliente · Acordex
        </p>
      </footer>
    } @else {
      <div class="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span class="material-symbols-outlined text-5xl text-outline">search_off</span>
        <p class="text-sm text-white/70 font-bold">No encontramos ese grupo para previsualizar.</p>
        <button
          type="button"
          (click)="router.navigate(['/groups'])"
          class="px-4 py-2 rounded-xl bg-primary text-black text-xs font-['Epilogue'] font-black uppercase tracking-wider"
        >
          Volver al catálogo
        </button>
      </div>
    }
  `
})
export class GroupPreviewPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly mockData = inject(MockDataService);
  private readonly layoutState = inject(LayoutStateService);
  private readonly store = inject(GroupProfileStore);

  activeTab = signal<PreviewTab>('general');

  protected readonly tabs: { id: PreviewTab; label: string; icon: string }[] = [
    { id: 'general', label: 'Información General', icon: 'info' },
    { id: 'trayectoria', label: 'Trayectoria', icon: 'timeline' },
    { id: 'musica', label: 'Música & Repertorio', icon: 'library_music' },
    { id: 'publicaciones', label: 'Publicaciones', icon: 'dynamic_feed' },
    { id: 'galeria', label: 'Galería & Shows', icon: 'photo_library' },
    { id: 'resenas', label: 'Reseñas', icon: 'reviews' }
  ];

  /** Grupo del catálogo referido por la ruta. */
  private readonly group = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return this.mockData.groups().find(g => g.id === id) ?? null;
  });

  hasUnsavedChanges = computed(() => {
    const g = this.group();
    return g ? this.store.isDirty(g.id) : false;
  });

  /**
   * Perfil a previsualizar. Se prefiere el del store —que trae las ediciones en
   * curso— y solo si el expediente nunca se abrió se construye desde el mock.
   */
  preview = computed(() => {
    const g = this.group();
    if (!g) return null;
    const profile = this.store.profile(g.id) ?? buildGroupProfile(g);
    return toPreview(profile, g.agendaStatus);
  });

  /** Vuelve al catálogo y reabre el expediente del mismo grupo. */
  returnToEditor(): void {
    const g = this.group();
    this.router.navigate(['/groups']).then(() => {
      if (g) this.layoutState.openGroupModal(g);
    });
  }
}
