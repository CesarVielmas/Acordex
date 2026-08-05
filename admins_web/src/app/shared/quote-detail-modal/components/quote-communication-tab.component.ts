import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Quote, NoticeItem, ChatMessage } from '../../../core/models/admin.models';
import { MockDataService } from '../../../core/services/mock-data.service';
import { LayoutStateService } from '../../../core/services/layout_state.service';
import { CustomSelectComponent, SelectOption } from '../../ui/custom-select/custom-select.component';

@Component({
  selector: 'app-quote-communication-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
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

            <!-- Destinatario Selector Tabs -->
            <div class="flex items-center gap-1.5 pt-3">
              <span class="text-[11px] font-bold text-outline">Enviar aviso a:</span>
              <div class="flex items-center gap-1 p-0.5 rounded-xl bg-surface-container-highest border border-outline-variant/20">
                <button
                  type="button"
                  (click)="noticeTarget.set('Cliente')"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                  [ngClass]="noticeTarget() === 'Cliente' ? 'bg-cyan-500 text-on-primary shadow-sm' : 'text-outline hover:text-on-surface'"
                >
                  Cliente Contratante
                </button>
                <button
                  type="button"
                  (click)="noticeTarget.set('Grupo Musical')"
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                  [ngClass]="noticeTarget() === 'Grupo Musical' ? 'bg-amber-500 text-on-primary shadow-sm' : 'text-outline hover:text-on-surface'"
                >
                  Grupo Musical
                </button>
              </div>
            </div>

            <!-- Formulario para nuevo aviso -->
            <div class="mt-3 space-y-2.5 text-xs">
              <input
                type="text"
                [(ngModel)]="noticeTitleValue"
                placeholder="Título o asunto del aviso..."
                class="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-cyan-400 outline-none"
              />
              <textarea
                [(ngModel)]="noticeMessageValue"
                rows="3"
                placeholder="Escribe el cuerpo de la notificación oficial que se notificará..."
                class="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-cyan-400 outline-none resize-none"
              ></textarea>

              <div class="flex items-center justify-between text-[11px] text-outline pt-1">
                <span>Canales de envío:</span>
                <div class="flex items-center gap-2 font-semibold">
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="noticeChannelsEmail" class="accent-cyan-400 rounded" /> Email
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="noticeChannelsWhatsApp" class="accent-cyan-400 rounded" /> WhatsApp
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="noticeChannelsPlatform" class="accent-cyan-400 rounded" /> App
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            (click)="sendIndependentNotice()"
            class="w-full mt-3 py-2 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span class="material-symbols-outlined text-sm">send</span> Despachar Aviso Formal
          </button>
        </div>

        <!-- SECCIÓN DERECHA: CHAT CRUZADO EN TIEMPO REAL -->
        <div class="p-4 rounded-2xl bg-surface-container-high/90 border border-outline-variant/30 space-y-3 shadow-lg flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <span class="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base">forum</span>
                CHAT CRUZADO DE EXPEDIENTE
              </span>
              <span class="text-[10px] font-mono text-outline">Histórico en Vivo</span>
            </div>

            <!-- MESA DE MENSAJES DE CHAT -->
            <div class="mt-3 space-y-2.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
              @for (msg of (quote?.chatHistory || []); track msg.id) {
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
              <span class="text-[10px] font-mono text-outline shrink-0">Publicar como:</span>
              <div class="flex-1">
                <app-custom-select
                  placeholder="Seleccionar rol..."
                  [options]="senderOptions"
                  [value]="chatSenderRole"
                  (valueChange)="chatSenderRole = $any($event)"
                />
              </div>
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
  senderOptions: SelectOption[] = [
    { value: 'Admin', label: 'Administración Disquera', icon: 'shield' },
    { value: 'Cliente', label: 'Cliente Contratante', icon: 'person' },
    { value: 'Grupo Musical', label: 'Grupo Musical / Manager', icon: 'music_note' }
  ];

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

    const updatedNotices = [newNotice, ...(q.notices || [])];
    const updated: Quote = {
      ...q,
      notices: updatedNotices
    };

    this.mockData.updateQuoteDetails(q.id, updated);
    this.mockData.addAudit(
      'Emisión de Aviso Formal',
      'Comunicaciones',
      'Se despachó aviso independiente "' + newNotice.title + '" a ' + newNotice.target + ' para la cotización ' + q.id
    );

    this.noticeTitleValue = '';
    this.noticeMessageValue = '';
    this.layoutState.openQuoteModal(updated);
  }

  sendChatMessage(): void {
    const q = this.quote;
    if (!q || !this.chatNewMessage.trim()) return;

    const senderRole = this.chatSenderRole;
    let senderName = 'Lic. Sofía Ramírez';
    let avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

    if (senderRole === 'Cliente') {
      senderName = q.clientName;
      avatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
    } else if (senderRole === 'Grupo Musical') {
      senderName = (q.groupName || q.artistName || 'Grupo Musical') + ' (Manager)';
      avatar = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150';
    }

    const newChat: ChatMessage = {
      id: 'chat_' + Date.now(),
      senderName,
      senderRole,
      message: this.chatNewMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar
    };

    const updatedHistory = [...(q.chatHistory || []), newChat];
    const updated: Quote = {
      ...q,
      chatHistory: updatedHistory
    };

    this.mockData.updateQuoteDetails(q.id, updated);
    this.mockData.addAudit(
      'Mensaje de Chat Expediente',
      'Comunicaciones',
      'Nuevo mensaje publicado por ' + senderName + ' en cotización ' + q.id
    );

    this.chatNewMessage = '';
    this.layoutState.openQuoteModal(updated);
  }
}
