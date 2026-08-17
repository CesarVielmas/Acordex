export type QuoteState =
  | 'En revisión'
  | 'Propuesta enviada'
  | 'Negociación'
  | 'Aceptada'
  | 'Contrato en espera de firma'
  | 'Contrato firmado'
  | 'Finalizada'
  | 'Cancelada';

export interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: 'Grupo Musical' | 'Cliente' | 'Manager' | 'Admin';
  senderAvatar?: string;
  message: string;
  text?: string;
  timestamp: string;
  isMe?: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'audio' | 'document';
}

export interface QuoteItem {
  id: string;
  folio: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  groupName: string;
  groupId: string;
  eventType: string;
  proposedDate: string;
  eventDate?: string;
  eventTime?: string;
  venue: string;
  city: string;
  location?: string;
  durationHours: number;
  hoursRequested?: number;
  totalAmount: number;
  artistFee: number;
  budgetOffered?: number;
  state: QuoteState;
  paymentStatus: 'Pendiente' | 'Anticipo 50%' | 'Liquidado 100%';
  notes?: string;
  specialRequests?: string;
  createdAt: string;
  
  // Autorización de Chat Directo con el Cliente:
  isDirectChatAccepted: boolean;
  directChatAcceptedAt?: string;
  directChatAcceptedBy?: string; // Nombre del integrante que aceptó

  chatHistory?: ChatMessage[];
}
