import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Barra flotante de la vista previa.
 *
 * Es el único elemento que no existe en la página real del cliente, así que se
 * anuncia como tal: deja claro que se está viendo una simulación y ofrece la
 * salida de vuelta al expediente. Va fija sobre todo el contenido porque la
 * página pública es larga y el regreso debe estar siempre a un clic.
 */
@Component({
  selector: 'app-preview-return-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="fixed inset-x-0 top-0 z-[99999] pointer-events-none">
      <div class="mx-auto max-w-7xl px-3 sm:px-5 pt-3 sm:pt-4">
        <div
          class="pointer-events-auto rounded-2xl border border-white/15 bg-[#131313]/95 backdrop-blur-xl shadow-[0_16px_50px_rgba(0,0,0,0.85)] px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 font-['Be_Vietnam_Pro']"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center shrink-0 shadow-md">
              <span class="material-symbols-outlined text-base font-bold">visibility</span>
            </span>

            <div class="min-w-0">
              <p class="text-[11px] sm:text-xs font-black text-white leading-tight truncate uppercase tracking-wider font-['Epilogue']">
                Vista previa del perfil público
              </p>
              <p class="text-[10px] text-white/50 truncate hidden sm:block">
                Así verá {{ groupName() }} un cliente en el portal. Los cambios sin guardar ya se reflejan aquí.
              </p>
            </div>

            @if (hasUnsavedChanges()) {
              <span class="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 text-[10px] font-black shrink-0">
                <span class="material-symbols-outlined text-[11px]">edit_note</span> Cambios sin guardar
              </span>
            }
          </div>

          <button
            type="button"
            (click)="back.emit()"
            class="px-4 py-2 rounded-xl bg-primary hover:bg-primary-fixed text-black text-[11px] sm:text-xs font-['Epilogue'] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_4px_20px_rgba(242,202,80,0.25)] shrink-0 active:scale-95"
          >
            <span class="material-symbols-outlined text-sm font-bold">arrow_back</span>
            <span class="hidden sm:inline">Regresar a Edición</span>
            <span class="sm:hidden">Editar</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class PreviewReturnBarComponent {
  groupName = input<string>('');
  hasUnsavedChanges = input<boolean>(false);
  back = output<void>();
}
