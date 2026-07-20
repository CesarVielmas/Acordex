import { Injectable, signal } from '@angular/core';

export interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  color: string;
  description: string;
  type: 'cotizacion' | 'concierto' | 'firma' | 'festival' | 'reunion';
  location?: string;
  imageUrl?: string;
}

export interface PurchasedSeat {
  id: string;
  categoryName: string;
  price: number;
}

export interface TicketPurchase {
  eventId: number;
  seats: PurchasedSeat[];
  totalPrice: number;
  purchaseDate: Date;
}

export interface PressAccreditation {
  eventId: number;
  mediumName: string;
  journalistName: string;
  email: string;
  cardId: string;
  accredType: string;
  applicantType: 'media' | 'independent';
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface QuoteItem {
  folio: string;
  bandName: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  durationHours: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  status: 'pending' | 'approved' | 'signed';
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  // Global Purchase Memory state signal
  purchases = signal<TicketPurchase[]>([
    {
      eventId: 101,
      seats: [
        { id: 'A-1', categoryName: 'VIP Oro', price: 2200 },
        { id: 'A-2', categoryName: 'VIP Oro', price: 2200 }
      ],
      totalPrice: 4400,
      purchaseDate: new Date('2024-11-15T20:30:00')
    }
  ]);

  // Press Accreditations state signal
  pressAccreditations = signal<Record<number, PressAccreditation>>({
    102: {
      eventId: 102,
      mediumName: 'El Horizonte',
      journalistName: 'Patricia Garza',
      email: 'patricia.garza@elhorizonte.mx',
      cardId: 'PRESS-ACX-492',
      accredType: 'Cobertura Completa y Backstage',
      applicantType: 'media',
      status: 'approved'
    }
  });

  // Quote items memory signal
  submittedQuotes = signal<QuoteItem[]>([
    {
      folio: 'ACX-4912',
      bandName: 'Banda Sinaloense Los Reyes',
      eventType: 'Boda / Evento Social',
      eventDate: '2024-11-20',
      eventLocation: 'Casino Monterrey, NL, México',
      durationHours: 5,
      clientName: 'Carlos Fuentes',
      clientEmail: 'carlos.fuentes@gmail.com',
      clientPhone: '811-234-5678',
      status: 'signed'
    }
  ]);

  addPurchase(purchase: TicketPurchase) {
    this.purchases.update(list => [...list.filter(p => p.eventId !== purchase.eventId), purchase]);
  }

  getPurchasesForEvent(eventId: number): TicketPurchase[] {
    return this.purchases().filter(p => p.eventId === eventId);
  }

  cancelPurchase(eventId: number) {
    this.purchases.update(list => list.filter(p => p.eventId !== eventId));
  }

  addQuote(quote: QuoteItem) {
    this.submittedQuotes.update(list => [...list.filter(q => q.folio !== quote.folio), quote]);
  }

  saveAccreditation(accred: PressAccreditation) {
    this.pressAccreditations.update(map => ({
      ...map,
      [accred.eventId]: accred
    }));
  }

  getAccreditation(eventId: number): PressAccreditation | null {
    return this.pressAccreditations()[eventId] || null;
  }

  deleteAccreditation(eventId: number) {
    this.pressAccreditations.update(map => {
      const next = { ...map };
      delete next[eventId];
      return next;
    });
  }

  getEventById(id: number): CalendarEvent | undefined {
    const year = new Date().getFullYear();
    for (let m = 0; m < 12; m++) {
      const list = this.getEventsForMonth(year, m);
      const found = list.find(e => e.id === id);
      if (found) return found;
    }
    return undefined;
  }

  getEventsForMonth(year: number, month: number): CalendarEvent[] {
    // June = 5, July = 6, August = 7 (0-indexed)
    if (month === 5) {
      return [
        {
          id: 1,
          title: 'Banda Los Reyes',
          date: new Date(year, month, 5),
          color: '#F2CA50',
          description: 'Cotización Aprobada • 18:00',
          type: 'cotizacion',
          location: 'Arena Monterrey',
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3KjImT7Com_TZjPm3s_JEtoRMtGwTz2pIVXzBWkiphKKC3Hhvv0hFafpnAUBOx3Xh3Wg1rKU_WYF_9WEL3MkoT5q5euWVCvDP_sVxpr6J8PAtdHW2RTGrcGUjP4TABc_K-UJzABbaegjdl7Lgt-PHqkMImpEd6vo-oq4FkujU-PEBsFxtfLKOfrqSlKhqwZOmT9kHC-TL2z_33iV1zc4PyhckWglDGJQkTFo7F6clZQhFECh8P9WBo8vCUIEYETYVxk5IrGaxfc'
        },
        {
          id: 3,
          title: 'Vibras en Vivo',
          date: new Date(year, month, 18),
          color: '#10B981',
          description: 'Concierto Estelar - Gira Nacional • 20:00',
          type: 'concierto',
          location: 'Auditorio Telmex',
          imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop'
        },
        {
          id: 4,
          title: 'Grupo Frontera',
          date: new Date(year, month, 18),
          color: '#F2CA50',
          description: 'Reserva Especial de Boda • 19:30',
          type: 'cotizacion',
          location: 'Salón Real Hacienda',
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 5,
          title: 'Rueda de Prensa Nodal',
          date: new Date(year, month, 18),
          color: '#3B82F6',
          description: 'Conferencia de Lanzamiento de Disco • 11:30',
          type: 'firma',
          location: 'Hotel Real Plaza'
        },
        {
          id: 6,
          title: 'Mariachi Vargas',
          date: new Date(year, month, 12),
          color: '#3B82F6',
          description: 'Firma de Autógrafos y Fotos • 15:30',
          type: 'firma',
          location: 'Centro Comercial Galerías'
        },
        {
          id: 8,
          title: 'Banda MS en Concierto',
          date: new Date(year, month, 26),
          color: '#10B981',
          description: 'Gran Concierto Sinaloense • 20:00',
          type: 'concierto',
          location: 'Plaza de Toros México',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 81,
          title: 'Mariachi Oro y Plata',
          date: new Date(year, month, 26),
          color: '#F2CA50',
          description: 'Cotización Aprobada - Coctel Empresarial • 18:00',
          type: 'cotizacion',
          location: 'Jardín de Eventos Bamboo',
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 9,
          title: 'Acordex Fest 2026',
          date: new Date(year, month, 15),
          color: '#8B5CF6',
          description: 'Gran Festival de Bandas Sinaloenses • 16:00',
          type: 'festival',
          location: 'Plaza de Toros México',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 10,
          title: 'Gala Sinaloense Sinfónica',
          date: new Date(year, month, 22),
          color: '#10B981',
          description: 'Concierto de Gala • 20:30',
          type: 'concierto',
          location: 'Teatro Diana',
          imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 101,
          title: 'Firma de Autógrafos Banda Los Reyes',
          date: new Date(year, month, 22),
          color: '#3B82F6',
          description: 'Meet & Greet y Fotos con Fans • 16:00',
          type: 'firma',
          location: 'Plaza Patria'
        },
        {
          id: 11,
          title: 'Norteño Fest 2026',
          date: new Date(year, month, 28),
          color: '#8B5CF6',
          description: 'Gran Festival de Música Norteña • 17:00',
          type: 'festival',
          location: 'Auditorio Telmex',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 111,
          title: 'Los Tigres del Norte',
          date: new Date(year, month, 28),
          color: '#3B82F6',
          description: 'Firma de Autógrafos Oficial • 15:00',
          type: 'firma',
          location: 'Centro Comercial Galerías'
        },
        {
          id: 12,
          title: 'Natanael Cano',
          date: new Date(year, month, 29),
          color: '#10B981',
          description: 'Tumbados Tour • 21:00',
          type: 'concierto',
          location: 'Arena Monterrey',
          imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop'
        },
        {
          id: 13,
          title: 'Christian Nodal',
          date: new Date(year, month, 21),
          color: '#10B981',
          description: 'Foraji2 Tour - Gira Nacional • 20:30',
          type: 'concierto',
          location: 'Foro Sol',
          imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop'
        },
        {
          id: 14,
          title: 'Banda El Recodo',
          date: new Date(year, month, 23),
          color: '#F2CA50',
          description: 'Cotización Aprobada - Evento Privado • 20:00',
          type: 'cotizacion',
          location: 'Hacienda San Javier',
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 15,
          title: 'Mariachi Vargas en Concierto',
          date: new Date(year, month, 24),
          color: '#10B981',
          description: 'Gala de Mariachi Sinfónico • 19:30',
          type: 'concierto',
          location: 'Teatro Degollado',
          imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 16,
          title: 'Rueda de Prensa Peso Pluma',
          date: new Date(year, month, 25),
          color: '#3B82F6',
          description: 'Lanzamiento de Álbum "Éxodo" • 12:00',
          type: 'firma',
          location: 'Hotel W Mexico City'
        },
        {
          id: 17,
          title: 'Grupo Frontera',
          date: new Date(year, month, 27),
          color: '#F2CA50',
          description: 'Cotización Aprobada - Boda Privada • 20:00',
          type: 'cotizacion',
          location: 'Salón Quinta Real',
          imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop'
        },
        {
          id: 18,
          title: 'Julión Álvarez',
          date: new Date(year, month, 30),
          color: '#F2CA50',
          description: 'Cotización Aprobada - Fiesta Charra • 19:00',
          type: 'cotizacion',
          location: 'Rancho El Pitayo',
          imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop'
        }
      ];
    } else if (month === 6) {
      return [
        {
          id: 20,
          title: 'Los Tigres del Norte',
          date: new Date(year, month, 3),
          color: '#10B981',
          description: 'Leyendas del Norte - Concierto • 20:30',
          type: 'concierto',
          location: 'Arena Ciudad de México',
          imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 21,
          title: 'Banda MS',
          date: new Date(year, month, 8),
          color: '#F2CA50',
          description: 'Cotización Aprobada - Evento Privado • 19:00',
          type: 'cotizacion',
          location: 'Hacienda Cocoyoc',
          imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 22,
          title: 'Grupo Firme',
          date: new Date(year, month, 12),
          color: '#10B981',
          description: 'La Última Peda Tour - Concierto • 21:00',
          type: 'concierto',
          location: 'Estadio Azteca',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 221,
          title: 'Mariachi Oro y Plata',
          date: new Date(year, month, 12),
          color: '#F2CA50',
          description: 'Cotización Aprobada - Boda VIP • 18:00',
          type: 'cotizacion',
          location: 'Hacienda San Angel',
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 222,
          title: 'Firma de Autógrafos Grupo Firme',
          date: new Date(year, month, 12),
          color: '#3B82F6',
          description: 'Meet & Greet de Fanáticos • 14:00',
          type: 'firma',
          location: 'Centro de Exposiciones WTC'
        },
        {
          id: 23,
          title: 'Rueda de Prensa Carin León',
          date: new Date(year, month, 17),
          color: '#3B82F6',
          description: 'Lanzamiento de Álbum y Colaboraciones • 12:00',
          type: 'firma',
          location: 'Hotel Camino Real'
        },
        {
          id: 24,
          title: 'Sierreño Fest 2026',
          date: new Date(year, month, 20),
          color: '#8B5CF6',
          description: 'Festival de Música Sierreña • 15:30',
          type: 'festival',
          location: 'Plaza de Toros México',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 241,
          title: 'Los Alegres Sierreños',
          date: new Date(year, month, 20),
          color: '#F2CA50',
          description: 'Cotización Aprobada - XV Años • 20:00',
          type: 'cotizacion',
          location: 'Salón Quinta San José',
          imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop'
        },
        {
          id: 25,
          title: 'Firma de Autógrafos Nodal',
          date: new Date(year, month, 25),
          color: '#3B82F6',
          description: 'Firma del Nuevo Álbum "Pa\'l Cora" • 16:00',
          type: 'firma',
          location: 'Plaza Satélite'
        },
        {
          id: 26,
          title: 'Carin León',
          date: new Date(year, month, 28),
          color: '#10B981',
          description: 'Boca Chueca Tour - Concierto • 20:30',
          type: 'concierto',
          location: 'Auditorio Telmex',
          imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop'
        },
        {
          id: 27,
          title: 'Firma de Grupo Firme',
          date: new Date(year, month, 1),
          color: '#3B82F6',
          description: 'Lanzamiento de Vinilo Edición Limitada • 16:30',
          type: 'firma',
          location: 'Mixup Zona Rosa'
        },
        {
          id: 28,
          title: 'Firma Sierreño Fest',
          date: new Date(year, month, 2),
          color: '#3B82F6',
          description: 'Meet & Greet de Artistas del Festival • 15:00',
          type: 'firma',
          location: 'Plaza Satélite'
        },
        {
          id: 29,
          title: 'Banda MS',
          date: new Date(year, month, 4),
          color: '#F2CA50',
          description: 'Cotización Aprobada - Gala de Graduación • 20:00',
          type: 'cotizacion',
          location: 'Jardín Las Fuentes',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 291,
          title: 'Firma de Autógrafos Natanael Cano',
          date: new Date(year, month, 5),
          color: '#3B82F6',
          description: 'Firma Oficial de Discos Tumbados • 16:00',
          type: 'firma',
          location: 'Mixup Monterrey'
        },
        {
          id: 292,
          title: 'Festival Tumbado 2026',
          date: new Date(year, month, 6),
          color: '#8B5CF6',
          description: 'Gran Festival de Corridos Tumbados • 16:00',
          type: 'festival',
          location: 'Arena Monterrey',
          imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop'
        },
        {
          id: 293,
          title: 'Mariachi Vargas',
          date: new Date(year, month, 10),
          color: '#F2CA50',
          description: 'Cotización Aprobada - Fiesta Cumpleaños VIP • 21:00',
          type: 'cotizacion',
          location: 'Hacienda de Cortés',
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 294,
          title: 'Julión Álvarez en Concierto',
          date: new Date(year, month, 15),
          color: '#10B981',
          description: 'Gira Prófugos del Anexo - Concierto • 21:00',
          type: 'concierto',
          location: 'Arena Ciudad de México',
          imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 295,
          title: 'Banda El Recodo en Concierto',
          date: new Date(year, month, 18),
          color: '#10B981',
          description: 'Gran Concierto Mexicano • 20:30',
          type: 'concierto',
          location: 'Auditorio Nacional',
          imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 296,
          title: 'Gala Mariachi Oro y Plata',
          date: new Date(year, month, 22),
          color: '#10B981',
          description: 'Gala Mexicana Sinfónica • 19:00',
          type: 'concierto',
          location: 'Palacio de Bellas Artes',
          imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop'
        }
      ];
    } else if (month === 7) {
      return [
        {
          id: 30,
          title: 'Mariachi Oro y Plata',
          date: new Date(year, month, 2),
          color: '#F2CA50',
          description: 'Cotización Aprobada - Boda Elegante • 20:00',
          type: 'cotizacion',
          location: 'Salón Las Flores',
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 31,
          title: 'Banda El Recodo',
          date: new Date(year, month, 7),
          color: '#10B981',
          description: 'Gira Mundial 80 Años - Concierto • 21:00',
          type: 'concierto',
          location: 'Arena Monterrey',
          imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 32,
          title: 'Mariachi Vargas de Tecalitlán',
          date: new Date(year, month, 14),
          color: '#10B981',
          description: 'Gala Mexicana Sinfónica - Concierto • 20:00',
          type: 'concierto',
          location: 'Teatro Degollado',
          imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 33,
          title: 'Festival de Verano Acordex',
          date: new Date(year, month, 18),
          color: '#8B5CF6',
          description: 'Gran Festival de Playa • 14:00',
          type: 'festival',
          location: 'Playa Mamitas, QR',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 331,
          title: 'Banda El Recodo',
          date: new Date(year, month, 18),
          color: '#F2CA50',
          description: 'Cotización Aprobada - Coctel de Bienvenida • 18:00',
          type: 'cotizacion',
          location: 'Mamitas Beach Club',
          imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 332,
          title: 'Rueda de Prensa Festival Playa',
          date: new Date(year, month, 18),
          color: '#3B82F6',
          description: 'Conferencia de Medios del Festival • 11:00',
          type: 'firma',
          location: 'Grand Hyatt Playa del Carmen'
        },
        {
          id: 34,
          title: 'Peso Pluma',
          date: new Date(year, month, 22),
          color: '#10B981',
          description: 'Éxodo Tour - Concierto • 20:30',
          type: 'concierto',
          location: 'Foro Sol',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 341,
          title: 'Firma de Autógrafos Peso Pluma',
          date: new Date(year, month, 22),
          color: '#3B82F6',
          description: 'Firma Oficial de Discos • 15:00',
          type: 'firma',
          location: 'Mixup Plaza Universidad'
        },
        {
          id: 35,
          title: 'Firma de Autógrafos Julión Álvarez',
          date: new Date(year, month, 27),
          color: '#3B82F6',
          description: 'Firma del Nuevo Sencillo • 17:00',
          type: 'firma',
          location: 'Centro Comercial Galerías'
        },
        {
          id: 36,
          title: 'Los Alegres Sierreños',
          date: new Date(year, month, 29),
          color: '#F2CA50',
          description: 'Cotización Aprobada - Fiesta XV Años • 19:30',
          type: 'cotizacion',
          location: 'Hacienda San Javier',
          imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop'
        },
        {
          id: 37,
          title: 'Festival Norteño de Verano',
          date: new Date(year, month, 4),
          color: '#8B5CF6',
          description: 'Festival de Acordeones y Bajosextos • 15:00',
          type: 'festival',
          location: 'Plaza de Toros México',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 38,
          title: 'Christian Nodal',
          date: new Date(year, month, 10),
          color: '#F2CA50',
          description: 'Cotización Aprobada - Graduación Universitaria • 21:00',
          type: 'cotizacion',
          location: 'Salón Country Club',
          imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 39,
          title: 'Grupo Frontera en Concierto',
          date: new Date(year, month, 12),
          color: '#10B981',
          description: 'El Comienzo Tour - Concierto • 20:30',
          type: 'concierto',
          location: 'Arena Monterrey',
          imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop'
        },
        {
          id: 40,
          title: 'Banda MS',
          date: new Date(year, month, 25),
          color: '#3B82F6',
          description: 'Firma Oficial de Autógrafos • 16:00',
          type: 'firma',
          location: 'Plaza Galerías'
        }
      ];
    }
    return [];
  }
}
