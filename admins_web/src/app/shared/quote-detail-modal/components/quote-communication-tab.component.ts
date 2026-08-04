import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Quote, NoticeItem, ChatMessage } from '../../../core/models/admin.models';
import { MockDataService } from '../../../core/services/mock-data.service';
import { LayoutStateService } from '../../../core/services/layout_state.service';

@Component({
  selector: 'app-quote-communication-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
      @if (incidentBanner) {
        <div class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-start gap-2.5 text-xs shadow-md">
          <span class="material-symbols-outlined text-lg text-rose-400 shrink-0">report_problem</span>
          <p class="text-rose-200/90 leading-relaxed">{{ incidentBanner }}</p>
        </div>
      }
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- SECCIÓN IZQUIERDA: BITÁCORA DE AVISOS INDEPENDIENTES -->
        <div class="p-4 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3.5 shadow-lg flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <span class="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base">notifications_active</span>
                BITÁCORA DE AVISOS INDEPENDIENTES
              </span>
            </div>

            <!-- FORMULARIO NUEVO AVISO -->
            <div class="mt-3 p-3 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-outline uppercase tracking-wider">Enviar Aviso Oficial A:</span>
                <div class="flex items-center gap-1 bg-surface-container-high p-0.5 rounded-lg border border-outline-variant/30">
                  <button
                    (click)="noticeTarget.set('Cliente')"
                    [class]="noticeTarget() === 'Cliente' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-outline'"
                    class="px-2 py-0.5 rounded-md text-[10px] transition-all"
                  >
                    Cliente
                  </button>
                  <button
                    (click)="noticeTarget.set('Grupo Musical')"
                    [class]="noticeTarget() === 'Grupo Musical' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-outline'"
                    class="px-2 py-0.5 rounded-md text-[10px] transition-all"
                  >
                    Grupo Musical
                  </button>
                </div>
              </div>

              <input
                type="text"
                [disabled]="isHistoricalPreview"
                [(ngModel)]="noticeTitleValue"
                placeholder="Título del aviso u homologación operativa..."
                class="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-1.5 text-xs text-on-surface focus:border-cyan-400 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />

              <textarea
                [disabled]="isHistoricalPreview"
                [(ngModel)]="noticeMessageValue"
                rows="2"
                placeholder="Escribe el cuerpo de la notificación oficial que se notificará..."
                class="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-3 py-1.5 text-xs text-on-surface focus:border-cyan-400 outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              ></textarea>

              <div class="flex items-center justify-between gap-2 pt-1">
                <div class="flex items-center gap-2 text-[10px] text-outline">
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" [disabled]="isHistoricalPreview" [(ngModel)]="noticeChannelsEmail" class="accent-cyan-400 rounded disabled:opacity-60 disabled:cursor-not-allowed" /> Email
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" [disabled]="isHistoricalPreview" [(ngModel)]="noticeChannelsWhatsApp" class="accent-cyan-400 rounded disabled:opacity-60 disabled:cursor-not-allowed" /> WhatsApp
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" [disabled]="isHistoricalPreview" [(ngModel)]="noticeChannelsPlatform" class="accent-cyan-400 rounded disabled:opacity-60 disabled:cursor-not-allowed" /> App Push
                  </label>
                </div>

                <button
                  [disabled]="isHistoricalPreview"
                  (click)="sendIndependentNotice()"
                  class="px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="material-symbols-outlined text-xs">send</span> Enviar Aviso
                </button>
              </div>
            </div>

            <!-- LISTA HISTÓRICA DE AVISOS -->
            <div class="mt-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              <span class="text-[10px] font-mono text-outline block uppercase">Avisos Registrados en Bitácora:</span>
              @for (notice of (noticeTarget() === 'Cliente' ? (quote?.clientNotices || []) : (quote?.groupNotices || [])); track notice.id) {
                <div class="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20 space-y-1">
                  <div class="flex items-center justify-between text-[11px]">
                    <strong class="text-cyan-300 font-bold">{{ notice.title }}</strong>
                    <span class="text-[10px] font-mono text-outline">{{ notice.sentAt }}</span>
                  </div>
                  <p class="text-xs text-on-surface/90 leading-relaxed">{{ notice.message }}</p>
                  <div class="flex items-center gap-2 text-[10px] font-mono text-outline pt-0.5">
                    <span>Canales: [{{ notice.channels.join(', ') }}]</span>
                    <span>Enviado por: {{ notice.sentBy }}</span>
                  </div>
                </div>
              } @empty {
                <p class="text-xs text-outline italic text-center py-3">No hay avisos registrados para {{ noticeTarget() }}.</p>
              }
            </div>
          </div>
        </div>

        <!-- SECCIÓN DERECHA: CHAT INTERACTIVO CRUZADO -->
        <div class="p-4 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3 shadow-lg flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <span class="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base">chat</span>
                CHAT INTERACTIVO CRUZADO DE OPERACIONES
              </span>
              <span class="text-[10px] font-mono text-outline">Cliente &harr; Grupo &harr; Admin</span>
            </div>

            <!-- HISTORIAL DE MENSAJES -->
            <div class="mt-3 space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              @for (msg of quote?.chatHistory || []; track msg.id) {
                <div
                  [class]="msg.senderRole === 'Admin' ? 'bg-emerald-500/10 border-emerald-500/30 ml-4' : (msg.senderRole === 'Cliente' ? 'bg-cyan-500/10 border-cyan-500/30 mr-4' : 'bg-amber-500/10 border-amber-500/30 ml-2 mr-2')"
                  class="p-3 rounded-2xl border space-y-1"
                >
                  <div class="flex items-center justify-between text-[11px]">
                    <div class="flex items-center gap-1.5">
                      <img [src]="msg.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'" class="w-4 h-4 rounded-full object-cover" />
                      <span class="font-bold text-on-surface">{{ msg.senderName }}</span>
                    </div>
                    <span class="text-[10px] font-mono text-outline">{{ msg.timestamp }}</span>
                  </div>
                  <p class="text-xs text-on-surface leading-relaxed">{{ msg.message }}</p>
                </div>
              } @empty {
                <p class="text-xs text-outline italic text-center py-6">No hay mensajes previos en el canal de chat.</p>
              }
            </div>
          </div>

          <!-- INPUT PARA NUEVO MENSAJE DE CHAT -->
          <div class="mt-3 pt-2 border-t border-outline-variant/20 space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-mono text-outline">Publicar como:</span>
              <select
                [(ngModel)]="chatSenderRole"
                class="bg-surface-container border border-outline-variant/30 rounded-lg px-2 py-0.5 text-[11px] text-on-surface outline-none"
              >
                <option value="Admin">Administración Disquera</option>
                <option value="Cliente">Cliente Contratante</option>
                <option value="Grupo Musical">Grupo Musical / Manager</option>
              </select>
            </div>

            <div class="flex items-center gap-2">
              <input
                type="text"
                [(ngModel)]="chatNewMessage"
                (keyup.enter)="sendChatMessage()"
                placeholder="Escribe un mensaje en el chat cruzado..."
                class="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-emerald-400 outline-none"
              />
              <button
                (click)="sendChatMessage()"
                class="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1"
              >
                <span class="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class QuoteCommunicationTabComponent {
  private mockData = inject(MockDataService);
  private layoutState = inject(LayoutStateService);

  @Input() quote: Quote | null = null;
  @Input() isHistoricalPreview: boolean = false;
  @Input() incidentBanner: string = '';

  noticeTarget = signal<'Cliente' | 'Grupo Musical'>('Cliente');
  noticeTitleValue = '';
  noticeMessageValue = '';
  noticeChannelsEmail = true;
  noticeChannelsWhatsApp = true;
  noticeChannelsPlatform = true;

  chatNewMessage = '';
  chatSenderRole: 'Admin' | 'Cliente' | 'Grupo Musical' = 'Admin';

  sendIndependentNotice(): void {
    const q = this.quote;
    if (!q || !this.noticeTitleValue.trim() || !this.noticeMessageValue.trim()) return;

    const channels: ('Email' | 'WhatsApp' | 'Platform')[] = [];
    if (this.noticeChannelsEmail) channels.push('Email');
    if (this.noticeChannelsWhatsApp) channels.push('WhatsApp');
    if (this.noticeChannelsPlatform) channels.push('Platform');

    const newNotice: NoticeItem = {
      id: 'not_' + Date.now(),
      target: this.noticeTarget(),
      title: this.noticeTitleValue.trim(),
      message: this.noticeMessageValue.trim(),
      sentBy: 'Lic. Sofía Ramírez',
      sentRole: 'administrador',
      sentAt: new Date().toLocaleString(),
      channels,
      priority: 'Normal'
    };

    const updated: Quote = {
      ...q,
      clientNotices: this.noticeTarget() === 'Cliente' ? [newNotice, ...(q.clientNotices || [])] : (q.clientNotices || []),
      groupNotices: this.noticeTarget() === 'Grupo Musical' ? [newNotice, ...(q.groupNotices || [])] : (q.groupNotices || [])
    };

    this.mockData.updateQuoteDetails(q.id, updated);
    this.mockData.addAudit(
      'Envío de Aviso Oficial al ' + this.noticeTarget(),
      'Comunicación',
      'Aviso "' + newNotice.title + '" enviado a ' + this.noticeTarget() + ' vía [' + channels.join(', ') + '].'
    );

    this.noticeTitleValue = '';
    this.noticeMessageValue = '';
    this.layoutState.openQuoteModal(updated);
  }

  sendChatMessage(): void {
    const q = this.quote;
    if (!q || !this.chatNewMessage.trim()) return;

    let senderName = 'Lic. Sofía Ramírez (Disquera)';
    let avatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';
    if (this.chatSenderRole === 'Cliente') {
      senderName = q.clientName + ' (Cliente)';
      avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    } else if (this.chatSenderRole === 'Grupo Musical') {
      senderName = 'Manager ' + q.groupName;
      avatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
    }

    const newMsg: ChatMessage = {
      id: 'chat_' + Date.now(),
      senderName,
      senderRole: this.chatSenderRole,
      avatar,
      message: this.chatNewMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated: Quote = {
      ...q,
      chatHistory: [...(q.chatHistory || []), newMsg]
    };

    this.mockData.updateQuoteDetails(q.id, updated);
    this.chatNewMessage = '';
    this.layoutState.openQuoteModal(updated);
  }
}
