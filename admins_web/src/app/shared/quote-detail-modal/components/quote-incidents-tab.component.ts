import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Quote, QuoteIncident, NoticeItem } from '../../../core/models/admin.models';
import { MockDataService } from '../../../core/services/mock-data.service';
import { LayoutStateService } from '../../../core/services/layout_state.service';

@Component({
  selector: 'app-quote-incidents-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 font-sans">

      @if (quote?.isCycleSealed) {
        <div class="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-between text-xs text-purple-200 shadow-lg">
          <span class="flex items-center gap-2 font-bold uppercase tracking-wider">
            <span class="material-symbols-outlined text-base text-purple-400">lock</span>
            EXPEDIENTE SELLADO EN MODO SOLO LECTURA
          </span>
          <span class="text-[10px] font-mono text-outline">Modificaciones Deshabilitadas</span>
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <!-- A. IMPREVISTO POR PARTE DEL GRUPO MUSICAL (FORMULARIO DE ADMINISTRACIÓN) -->
        <div class="p-5 rounded-3xl bg-surface-container-high/90 border border-rose-500/40 space-y-4 shadow-xl">
          <div class="flex items-center justify-between border-b border-rose-500/20 pb-2.5">
            <span class="text-xs font-black text-rose-300 uppercase tracking-wider flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-rose-400">group_off</span>
              A. IMPREVISTO DEL GRUPO MUSICAL (ADMINISTRACIÓN)
            </span>
            <span class="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-mono text-[9px] border border-rose-500/30">REGISTRO ADMIN</span>
          </div>

          <p class="text-xs text-outline leading-relaxed">
            Captura el inconveniente del grupo musical. Al registrar el imprevisto se notificará formalmente al cliente y el estado de la cotización cambiará <strong>automáticamente</strong>.
          </p>

          <div class="space-y-3.5 text-xs">
            <div>
              <label class="text-[11px] font-bold text-outline block mb-1 uppercase font-mono">
                Descripción Detallada del Imprevisto del Grupo:
              </label>
              <textarea
                [disabled]="!!quote?.isCycleSealed"
                [(ngModel)]="groupIncidentReason"
                rows="3"
                placeholder="Ej. Complicaciones médicas imprevistas del vocalista principal o contratiempo logístico grave de transporte..."
                class="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-rose-400 outline-none resize-none disabled:opacity-40"
              ></textarea>
            </div>

            <div>
              <label class="text-[11px] font-bold text-outline block mb-1 uppercase font-mono">
                Propuesta de Solución:
              </label>
              <select
                [disabled]="!!quote?.isCycleSealed"
                [(ngModel)]="groupIncidentSolutionType"
                class="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface font-bold focus:border-rose-400 outline-none disabled:opacity-40"
              >
                <option value="reschedule">Reprogramación de Fecha de Evento</option>
                <option value="substitute_group">Reasignación de Grupo Sustituto Disquera</option>
                <option value="apology_discount">Carta de Disculpa Formal + Bonificación de Descuento</option>
                <option value="refund">Cancelación con Reembolso Directo al Cliente</option>
              </select>
            </div>

            <div>
              <label class="text-[11px] font-bold text-outline block mb-1 uppercase font-mono">
                Mensaje Formal para el Cliente:
              </label>
              <textarea
                [disabled]="!!quote?.isCycleSealed"
                [(ngModel)]="groupIncidentClientMessage"
                rows="2"
                placeholder="Redacta la explicación oficial que recibirá el cliente en sus notificaciones..."
                class="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-rose-400 outline-none resize-none disabled:opacity-40"
              ></textarea>
            </div>

            <button
              [disabled]="!!quote?.isCycleSealed || !groupIncidentReason.trim()"
              (click)="submitGroupIncident()"
              class="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40"
            >
              <span class="material-symbols-outlined text-sm">send</span>
              <span>REGISTRAR IMPREVISTO Y CAMBIAR ESTADO AUTOMÁTICAMENTE</span>
            </button>
          </div>
        </div>

        <!-- B. IMPREVISTO POR PARTE DEL CLIENTE (VISTA INFORMATIVA + TEMPORIZADOR) -->
        <div class="p-5 rounded-3xl bg-surface-container-high/90 border border-amber-500/40 space-y-4 shadow-xl flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
              <span class="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-amber-400">person_alert</span>
                B. IMPREVISTO SOLICITADO POR EL CLIENTE
              </span>
              <span class="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[9px] border border-amber-500/30">VISTA INFORMATIVA</span>
            </div>

            <!-- TARJETA INFORMATIVA -->
            @if (quote?.incidents?.length) {
              @for (inc of quote?.incidents || []; track inc.id) {
                @if (inc.initiatedBy === 'Cliente') {
                  <div class="p-3.5 rounded-2xl bg-surface-container border border-amber-500/30 space-y-2 text-xs">
                    <div class="flex items-center justify-between font-bold">
                      <span class="text-amber-300 font-mono flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">account_circle</span> {{ quote?.clientName }} (Cliente)
                      </span>
                      <span class="text-outline text-[10px] font-mono">{{ inc.registeredAt }}</span>
                    </div>

                    <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-on-surface leading-relaxed text-xs">
                      <span class="text-[10px] font-bold text-amber-400 uppercase block mb-0.5 font-mono">Detalles Reportados por el Cliente:</span>
                      "{{ inc.reason }}"
                    </div>
                  </div>
                }
              }
            } @else {
              <div class="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 text-center text-xs text-outline space-y-1">
                <span class="material-symbols-outlined text-2xl text-outline/50">task_alt</span>
                <p>El cliente no ha registrado imprevistos activos en esta cotización.</p>
              </div>
            }
          </div>

          <!-- TARJETA PROMINENTE TEMPORIZADOR DE CUENTA REGRESIVA -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950/80 border-2 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] space-y-2 text-center">
            <span class="text-[10px] font-black text-amber-300 uppercase tracking-widest block font-mono">
              ⏳ CONTADOR DE TIEMPO LÍMITE (CAMBIO AUTOMÁTICO DE ESTADO)
            </span>

            <div class="text-3xl font-black font-mono text-amber-300 tracking-wider py-1 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse">
              {{ countdown }}
            </div>

            <p class="text-[11px] text-outline leading-tight max-w-xs mx-auto">
              Al expirar esta cuenta regresiva, la cotización cambiará automáticamente a <strong>"Cancelada con Imprevisto"</strong>.
            </p>

            @if (quote?.incidents?.length) {
              <div class="pt-1">
                <button
                  [disabled]="!!quote?.isCycleSealed"
                  (click)="revertClientIncident(quote?.incidents?.[0])"
                  class="w-full py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-sm">undo</span>
                  <span>Revertir Incidencia y Reanudar Cotización</span>
                </button>
              </div>
            }
          </div>

        </div>

      </div>
    </div>
  `
})
export class QuoteIncidentsTabComponent {
  private mockData = inject(MockDataService);
  private layoutState = inject(LayoutStateService);

  @Input() quote: Quote | null = null;
  @Input() countdown: string = '47:58:30';

  groupIncidentReason = '';
  groupIncidentSolutionType: 'reschedule' | 'substitute_group' | 'apology_discount' | 'refund' = 'reschedule';
  groupIncidentClientMessage = '';

  revertClientIncident(incident?: QuoteIncident): void {
    const q = this.quote;
    if (!q) return;

    const updatedIncidents = (q.incidents || []).map(inc => {
      if (!incident || inc.id === incident.id) {
        return {
          ...inc,
          status: 'Resuelto' as const,
          resolvedAt: new Date().toLocaleString(),
          resolutionNotes: 'Incidencia de cliente revertida por acuerdo común con la disquera. Cotización reanudada.'
        };
      }
      return inc;
    });

    const updated: Quote = {
      ...q,
      incidents: updatedIncidents,
      incidentStatus: 'Resuelto'
    };

    this.mockData.updateQuoteDetails(q.id, updated);
    this.mockData.addAudit(
      'Reversión de Incidencia de Cliente',
      'Excepciones',
      'Se revirtió la incidencia del cliente para la cotización ' + q.id + '. Proceso reanudado normalmente.'
    );
    this.layoutState.openQuoteModal(updated);
  }

  submitGroupIncident(): void {
    const q = this.quote;
    if (!q || !this.groupIncidentReason.trim()) return;

    const sol = this.groupIncidentSolutionType;
    let resNotes = '';
    if (sol === 'reschedule') resNotes = 'Solución propuesta por grupo: Reprogramación de fecha del evento.';
    else if (sol === 'substitute_group') resNotes = 'Solución propuesta por grupo: Reasignación de grupo sustituto disquera.';
    else if (sol === 'apology_discount') resNotes = 'Solución propuesta por grupo: Carta de disculpa formal e inclusión de bonificación/descuento.';
    else if (sol === 'refund') resNotes = 'Solución propuesta por grupo: Cancelación y reembolso directo.';

    const clientMsg = this.groupIncidentClientMessage.trim() || 'Estimado cliente, le informamos un imprevisto con la agrupación musical. Hemos preparado alternativas comerciales para resolver su evento.';

    const newIncident: QuoteIncident = {
      id: 'inc_grp_' + Date.now(),
      type: 'group_cancel',
      initiatedBy: 'Grupo Musical',
      reason: this.groupIncidentReason.trim(),
      resolutionNotes: resNotes,
      clientMessage: clientMsg,
      status: 'Imprevisto Grave',
      registeredAt: new Date().toLocaleString(),
      resolvedAt: new Date().toLocaleString()
    };

    const newNotice: NoticeItem = {
      id: 'not_grp_inc_' + Date.now(),
      target: 'Cliente',
      title: 'Notificación Oficial de Imprevisto de la Agrupación Musical',
      message: clientMsg,
      sentBy: 'Lic. Sofía Ramírez (Administración Disquera)',
      sentRole: 'administrador',
      sentAt: new Date().toLocaleString(),
      channels: ['Email', 'WhatsApp', 'Platform'],
      priority: 'Urgente'
    };

    const updated: Quote = {
      ...q,
      incidents: [newIncident, ...(q.incidents || [])],
      clientNotices: [newNotice, ...(q.clientNotices || [])],
      incidentStatus: 'Imprevisto',
      state: 'Cancelada con Imprevisto'
    };

    this.mockData.updateQuoteDetails(q.id, updated);
    this.mockData.updateQuoteState(q.id, 'Cancelada con Imprevisto');
    this.mockData.addAudit(
      'Imprevisto del Grupo Musical Registrado por Administración',
      'Excepciones',
      'Incidencia de grupo registrada para cotización ' + q.id + '. Se notificó al cliente y el estado cambió automáticamente a "Cancelada con Imprevisto".'
    );

    this.groupIncidentReason = '';
    this.groupIncidentClientMessage = '';
    this.layoutState.openQuoteModal(updated);
  }
}
