/**
 * Modelos avanzados para el módulo de Clientes & CRM de Acordex.
 *
 * Clasifica organizadores de eventos en la industria musical mexicana:
 * 1. Empresarios de Palenques y Ferias
 * 2. Promotores de Bailes Masivos & Discotecas
 * 3. Particulares (Bodas, XV Años, Cumpleaños)
 * 4. Corporativos & Empresas
 * 5. Gobiernos Municipales & Estatales
 */

export type ClientSegment =
  | 'Empresario de Palenque / Feria'
  | 'Promotor de Bailes'
  | 'Particular (Boda/XV)'
  | 'Corporativo / Empresa'
  | 'Gobierno / Municipio';

export type ClientTier = 'Diamante' | 'Oro' | 'Plata' | 'Prospecto';

export type ClientStatus = 'Frecuente' | 'Activo' | 'Prospecto' | 'Inactivo' | 'Lista Negra';

export interface ClientInteraction {
  id: string;
  date: string; // ISO o 'YYYY-MM-DD HH:mm'
  type: 'llamada' | 'whatsapp' | 'reunion' | 'cotizacion' | 'oferta' | 'nota';
  summary: string;
  authorName: string;
}

export interface ClientOfferRecord {
  id: string;
  date: string;
  discountPercent: number;
  details: string;
  suggestedGroupName?: string;
  status: 'Enviada' | 'Aceptada' | 'Expirada';
}

export interface ClientTaxInfo {
  rfc?: string;
  taxName?: string;
  taxRegime?: string;
  cfdiUse?: string;
  billingAddress?: string;
}

export interface ClientDetailedItem {
  id: string;
  name: string;
  company: string;
  segment: ClientSegment;
  email: string;
  phone: string;
  whatsapp?: string;
  city: string;
  state: string;
  tier: ClientTier;
  status: ClientStatus;
  rating: number; // 1 a 5 estrellas
  totalEvents: number;
  totalSpent: number;
  averageTicket: number;
  lastQuoteDate: string;
  notes: string;
  taxInfo?: ClientTaxInfo;
  favoriteGenres?: string[];
  preferredArtists?: string[];
  interactions?: ClientInteraction[];
  offersSent?: ClientOfferRecord[];
}

export interface ClientsSummaryKPIs {
  totalClients: number;
  frequentClientsCount: number;
  diamondTierCount: number;
  totalRevenueGenerated: number;
  averageTicketGlobal: number;
  repeatBookingRatePercent: number;
}
