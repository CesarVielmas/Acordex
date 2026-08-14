import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-reset-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-md rounded-3xl bg-surface-container border border-rose-500/40 shadow-2xl p-6 space-y-4">

        <div class="flex items-center gap-3 text-rose-400">
          <div class="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl">warning</span>
          </div>
          <div>
            <h3 class="text-base font-black text-on-surface">¿Restablecer Datos de Demostración?</h3>
            <p class="text-xs text-outline">Esta acción reiniciará toda la base de datos local</p>
          </div>
        </div>

        <p class="text-xs text-on-surface/90 leading-relaxed bg-surface-container-high p-3.5 rounded-2xl border border-outline-variant/20">
          Se borrarán las cotizaciones nuevas, tareas, eventos y clientes creados en esta sesión y se volverán a cargar los datos originales de Acordex.
        </p>

        <div class="space-y-1.5 text-xs">
          <label class="text-outline">Para confirmar, escribe <strong class="text-rose-400 font-mono">REINICIAR</strong>:</label>
          <input
            type="text"
            [(ngModel)]="confirmText"
            placeholder="REINICIAR"
            class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface uppercase font-mono focus:outline-none focus:border-rose-500 text-xs"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20 text-xs">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2 rounded-xl bg-surface-container-high text-outline hover:text-on-surface font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="confirmReset()"
            [disabled]="confirmText.trim().toUpperCase() !== 'REINICIAR'"
            class="px-5 py-2 rounded-xl bg-rose-500 text-white font-black hover:bg-rose-600 disabled:opacity-40 transition-all cursor-pointer shadow-md"
          >
            Confirmar Reinicio
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalResetDataComponent {
  confirmed = output<void>();
  closed = output<void>();

  confirmText = '';

  confirmReset(): void {
    if (this.confirmText.trim().toUpperCase() === 'REINICIAR') {
      this.confirmed.emit();
    }
  }
}
