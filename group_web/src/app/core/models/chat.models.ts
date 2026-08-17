import { ChatMessage } from './quote.models';

export type ConversationType = 'manager' | 'client';

export interface DirectConversation {
  id: string;
  type: ConversationType;
  title: string;
  subtitle: string;
  avatarUrl: string;
  badgeText?: string;
  quoteId?: string;
  quoteFolio?: string;
  quoteStatus?: string;
  isOnline?: boolean;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  messages: ChatMessage[];
}
