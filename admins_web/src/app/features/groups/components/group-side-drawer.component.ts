import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Panel lateral que se despliega dentro del modal de grupo.
 *
 * Existe para el caso de "quiero ver esto a fondo sin perder de vista lo que
 * estaba viendo": la ficha de un integrante, el desglose de un evento, los
 * comentarios de una publicación. En vez de apilar un modal sobre otro —que
 * obliga a cerrar para volver— el detalle entra por la derecha y el listado
 * sigue ahí al lado.
 *
 * Es presentacional puro: recibe título y contenido por proyección, y avisa
 * cuando se pide cerrar.
 */
@Component({
  selector: 'app-group-side-drawer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @if (open()) {
      <!-- Velo: en pantallas anchas solo atenúa; en angostas cubre todo. -->
      <div
        class="absolute inset-0 z-40 bg-black/70 backdrop-blur-md animate-fade-in"
        (click)="closed.emit()"
        aria-hidden="true"
      ></div>

      <aside
        class="absolute inset-y-0 right-0 z-50 w-full sm:w-[min(32rem,90%)] bg-[#151224]/98 backdrop-blur-3xl border-l border-primary/50 shadow-[-24px_0_80px_rgba(0,0,0,0.9)] flex flex-col animate-slide-in-right select-none"
        role="dialog"
        [attr.aria-label]="title()"
      >
        <header class="shrink-0 px-5 sm:px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between gap-3 bg-[#19152b] relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div class="min-w-0 relative">
            @if (eyebrow()) {
              <span class="block text-[10px] font-black uppercase tracking-wider text-primary">{{ eyebrow() }}</span>
            }
            <h3 class="text-base font-black text-on-surface truncate tracking-tight">{{ title() }}</h3>
          </div>

          <button
            type="button"
            (click)="closed.emit()"
            class="w-9 h-9 rounded-xl bg-surface-container-highest/80 hover:bg-rose-500 hover:text-white text-outline transition-all border border-outline-variant/30 shrink-0 flex items-center justify-center shadow-md relative"
            aria-label="Cerrar panel"
          >
            <span class="material-symbols-outlined text-lg font-bold">close</span>
          </button>
        </header>

        <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-4">
          <ng-content />
        </div>
      </aside>
    }
  `
})
export class GroupSideDrawerComponent {
  open = input<boolean>(false);
  title = input<string>('');
  eyebrow = input<string>('');
  closed = output<void>();
}
