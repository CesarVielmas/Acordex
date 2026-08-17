import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { GroupDataService } from '../../core/services/group-data.service';
import { QuoteItem } from '../../core/models/quote.models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  readonly chatService = inject(ChatService);
  readonly groupData = inject(GroupDataService);

  messageInput = signal<string>('');
  selectedTab = signal<'todos' | 'manager' | 'clientes'>('todos');
  selectedQuoteForReview = signal<QuoteItem | null>(null);
  selectedQuoteForAcceptance = this.selectedQuoteForReview;

  get activeConv() {
    return this.chatService.activeConversation();
  }

  get messages() {
    return this.chatService.activeMessages();
  }

  get pendingQuotes(): QuoteItem[] {
    const profile = this.groupData.activeProfile();
    return this.groupData.quotes().filter(q => 
      !q.isDirectChatAccepted && (q.groupId === profile.id || q.groupName === profile.name)
    );
  }

  get filteredConversations() {
    const list = this.chatService.conversations();
    const tab = this.selectedTab();
    if (tab === 'manager') return list.filter(c => c.type === 'manager');
    if (tab === 'clientes') return list.filter(c => c.type === 'client');
    return list;
  }

  selectConv(id: string): void {
    this.chatService.selectConversation(id);
  }

  sendMessage(textParam?: string): void {
    const text = (textParam !== undefined ? textParam : this.messageInput()).trim();
    if (!text) return;

    this.chatService.sendMessage(this.chatService.selectedConversationId(), text);
    this.messageInput.set('');
  }

  sendQuickPreset(text: string): void {
    this.chatService.sendMessage(this.chatService.selectedConversationId(), text);
  }

  openQuoteModal(quote: QuoteItem): void {
    this.selectedQuoteForReview.set(quote);
  }

  closeQuoteModal(): void {
    this.selectedQuoteForReview.set(null);
  }

  acceptQuote(quote: QuoteItem): void {
    this.groupData.acceptQuoteDirectChat(quote.id);
    this.chatService.selectConversation(`client-${quote.id}`);
    this.closeQuoteModal();
  }

  acceptDirectChat(quote: QuoteItem): void {
    this.acceptQuote(quote);
  }
}
