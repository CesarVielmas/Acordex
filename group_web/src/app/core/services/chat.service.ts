import { Injectable, inject, signal, computed } from '@angular/core';
import { GroupDataService } from './group-data.service';
import { StorageService } from './storage.service';
import { DirectConversation } from '../models/chat.models';
import { ChatMessage } from '../models/quote.models';

const STORAGE_MANAGER_CHAT = 'acordex_manager_chat_messages_v1';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly groupData = inject(GroupDataService);
  private readonly storage = inject(StorageService);

  private readonly INITIAL_MANAGER_MESSAGES: ChatMessage[] = [
    {
      id: 'mgr-msg-1',
      senderName: 'Don Pedro Reyes',
      senderRole: 'Manager',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      message: '¡Muchachos! El promotor de la Feria de Querétaro acaba de confirmar el horario estelar para el cierre. Necesito que revisen la lista de canciones para mandar el visto bueno a la producción.',
      timestamp: 'Ayer 14:30'
    },
    {
      id: 'mgr-msg-2',
      senderName: 'Mateo Reyes',
      senderRole: 'Grupo Musical',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      message: '¡Excelente noticia Don Pedro! Ya lo checamos con Santiago y le mandamos el setlist de 2 horas con los 3 temas nuevos incluidos.',
      timestamp: 'Ayer 15:10'
    },
    {
      id: 'mgr-msg-3',
      senderName: 'Don Pedro Reyes',
      senderRole: 'Manager',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      message: 'Perfecto. También recuerden que el anticipo de la Boda Familia Garza ya quedó reflejado en la tesorería de Acordex.',
      timestamp: 'Hoy 09:45'
    }
  ];

  readonly managerMessages = signal<ChatMessage[]>(
    this.storage.getItem(STORAGE_MANAGER_CHAT, this.INITIAL_MANAGER_MESSAGES)
  );

  readonly selectedConversationId = signal<string>('manager');

  // Computed list of conversations
  readonly conversations = computed<DirectConversation[]>(() => {
    const profile = this.groupData.activeProfile();
    const quotes = this.groupData.quotes();
    const mgrMsgs = this.managerMessages();
    const lastMgr = mgrMsgs[mgrMsgs.length - 1];

    const managerConv: DirectConversation = {
      id: 'manager',
      type: 'manager',
      title: `${profile.managerName} (Manager)`,
      subtitle: 'Coordinación Logística & Acordex Records',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
      badgeText: 'Disquera / Manager',
      isOnline: true,
      unreadCount: 0,
      lastMessage: lastMgr ? lastMgr.message : 'Canal directo con disquera',
      lastMessageTime: lastMgr ? lastMgr.timestamp : 'Hoy',
      messages: mgrMsgs
    };

    // Client accepted conversations
    const clientConvs: DirectConversation[] = quotes
      .filter(q => q.isDirectChatAccepted && (q.groupId === profile.id || q.groupName === profile.name))
      .map(q => {
        const msgs = q.chatHistory || [];
        const lastMsg = msgs[msgs.length - 1];
        return {
          id: `client-${q.id}`,
          type: 'client',
          title: q.clientName,
          subtitle: `${q.eventType} • ${q.proposedDate}`,
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
          badgeText: `Folio ${q.folio}`,
          quoteId: q.id,
          quoteFolio: q.folio,
          quoteStatus: q.state,
          isOnline: true,
          unreadCount: 0,
          lastMessage: lastMsg ? lastMsg.message : 'Cotización aceptada para chat directo',
          lastMessageTime: lastMsg ? lastMsg.timestamp : q.directChatAcceptedAt || 'Reciente',
          messages: msgs
        };
      });

    return [managerConv, ...clientConvs];
  });

  readonly activeConversation = computed<DirectConversation>(() => {
    const list = this.conversations();
    const id = this.selectedConversationId();
    const found = list.find(c => c.id === id) || list[0];
    return found || {
      id: 'manager',
      type: 'manager',
      title: 'Don Pedro Reyes (Manager)',
      subtitle: 'Coordinación Logística & Acordex Records',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
      badgeText: 'Disquera / Manager',
      isOnline: true,
      unreadCount: 0,
      lastMessage: 'Canal directo con disquera',
      lastMessageTime: 'Hoy',
      messages: []
    };
  });

  readonly activeMessages = computed<any[]>(() => {
    const conv = this.activeConversation();
    if (!conv || !Array.isArray(conv.messages)) return [];
    return conv.messages.map(m => ({
      ...m,
      text: (m as any).text || m.message,
      isMe: m.senderRole === 'Grupo Musical' || m.senderName === this.groupData.activeMember()?.name
    }));
  });

  selectConversation(id: string): void {
    this.selectedConversationId.set(id);
  }

  sendMessage(conversationId: string, text: string, attachmentUrl?: string, attachmentType?: 'image' | 'audio' | 'document'): void {
    const member = this.groupData.activeMember();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: member.name,
      senderRole: 'Grupo Musical',
      senderAvatar: member.photoUrl,
      message: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachmentUrl,
      attachmentType
    };

    if (conversationId === 'manager') {
      this.managerMessages.update(list => {
        const updated = [...list, newMsg];
        this.storage.setItem(STORAGE_MANAGER_CHAT, updated);
        return updated;
      });
    } else if (conversationId.startsWith('client-')) {
      const quoteId = conversationId.replace('client-', '');
      this.groupData.sendQuoteChatMessage(quoteId, text, attachmentUrl, attachmentType);
    }
  }
}
