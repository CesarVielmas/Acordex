import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CorporateSettings } from '../../../core/models/admin.models';

@Component({
  selector: 'app-settings-tab-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">

      <!-- ENCABEZADO -->
      <div class="p-5 rounded-3xl bg-surface-container/80 border border-outline-variant/30 backdrop-blur-xl flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center material-symbols-outlined text-lg">
              notifications_active
            </span>
            <h2 class="text-base sm:text-lg font-black text-on-surface">Notificaciones & Automatización de Mensajería</h2>
          </div>
          <p class="text-xs text-outline mt-0.5">Configuración de recordatorios automáticos por WhatsApp, correo y alertas de cobranza</p>
        </div>
      </div>

      <!-- FORMULARIO DE NOTIFICACIONES -->
      <div class="p-6 rounded-3xl bg-surface-container border border-outline-variant/30 shadow-xl space-y-4 text-xs">

        <label class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between cursor-pointer hover:border-cyan-500/40 transition-all">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2 font-bold text-on-surface">
              <span class="material-symbols-outlined text-emerald-400 text-base">chat</span>
              <span>Integración con WhatsApp Business API</span>
            </div>
            <p class="text-[11px] text-outline pl-6">Envío automático de confirmaciones de apartado y fichas técnicas a empresarios</p>
          </div>
          <input type="checkbox" [(ngModel)]="settings().enableWhatsAppNotifications" class="w-4 h-4 rounded accent-primary cursor-pointer" />
        </label>

        <label class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between cursor-pointer hover:border-cyan-500/40 transition-all">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2 font-bold text-on-surface">
              <span class="material-symbols-outlined text-primary text-base">mail</span>
              <span>Alertas por Correo Electrónico</span>
            </div>
            <p class="text-[11px] text-outline pl-6">Notificar al director cuando una cotización mayor a $300,000 MXN sea aceptada</p>
          </div>
          <input type="checkbox" [(ngModel)]="settings().enableEmailAlerts" class="w-4 h-4 rounded accent-primary cursor-pointer" />
        </label>

        <label class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between cursor-pointer hover:border-cyan-500/40 transition-all">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2 font-bold text-on-surface">
              <span class="material-symbols-outlined text-amber-400 text-base">alarm</span>
              <span>Avisos de Tareas Críticas Vencidas</span>
            </div>
            <p class="text-[11px] text-outline pl-6">Alertar en rojo en el panel cuando falten menos de 48 hrs para montaje o permisos legales</p>
          </div>
          <input type="checkbox" [(ngModel)]="settings().notifyOnTaskOverdue" class="w-4 h-4 rounded accent-primary cursor-pointer" />
        </label>

        <label class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between cursor-pointer hover:border-cyan-500/40 transition-all">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2 font-bold text-on-surface">
              <span class="material-symbols-outlined text-purple-400 text-base">payments</span>
              <span>Notificación Inmediata de Depósitos SPEI</span>
            </div>
            <p class="text-[11px] text-outline pl-6">Avisar al equipo de finanzas y booking cuando ingrese un pago o anticipo</p>
          </div>
          <input type="checkbox" [(ngModel)]="settings().notifyOnPaymentReceived" class="w-4 h-4 rounded accent-primary cursor-pointer" />
        </label>

        <!-- BOTÓN GUARDAR -->
        <div class="flex justify-end pt-3 border-t border-outline-variant/20">
          <button
            type="button"
            (click)="save.emit()"
            class="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-black text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">save</span>
            Guardar Configuración de Alertas
          </button>
        </div>

      </div>

    </div>
  `
})
export class SettingsTabNotificationsComponent {
  settings = input.required<CorporateSettings>();
  save = output<void>();
}
