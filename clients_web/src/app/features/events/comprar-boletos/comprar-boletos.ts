import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EventService, CalendarEvent } from '../../../core/services/event.service';
import { LayoutService } from '../../../core/services/layout.service';

interface LineupBand {
  name: string;
  genre: string;
  imageUrl: string;
  rating: number;
}

interface InvitationVideo {
  title: string;
  bandName: string;
  url: string;
  type: 'local' | 'youtube';
  sanitizedUrl?: SafeResourceUrl;
}

@Component({
  selector: 'app-comprar-boletos',
  imports: [CommonModule, RouterModule],
  templateUrl: './comprar-boletos.html',
  styleUrl: './comprar-boletos.scss'
})
export class ComprarBoletos implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly layoutService = inject(LayoutService);
  private readonly sanitizer = inject(DomSanitizer);

  event = signal<CalendarEvent | null>(null);
  lineup = signal<LineupBand[]>([]);
  priceRange = signal<string>('$350 - $2,200 MXN');
  flyerUrl = signal<string>('');
  isFlyerZoomed = signal<boolean>(false);
  videos = signal<InvitationVideo[]>([]);
  isPastEvent = signal<boolean>(false);

  purchases = computed(() => {
    const ev = this.event();
    if (!ev) return [];
    return this.eventService.getPurchasesForEvent(ev.id);
  });

  onBandClick(bandName: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!bandName) return;
    const namePart = bandName.split('-')[0].trim();
    const slug = namePart.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    this.router.navigate(['/grupo', slug]);
  }

  onRefund() {
    const ev = this.event();
    if (ev) {
      this.eventService.cancelPurchase(ev.id);
    }
  }
  
  // Available ticket categories
  ticketCategories = [
    { name: 'VIP Oro', price: 2200, icon: 'workspace_premium', description: 'Primeras filas, acceso prioritario y bebida de cortesía.' },
    { name: 'Preferente', price: 1200, icon: 'star', description: 'Excelente vista central con asientos ergonómicos.' },
    { name: 'General A', price: 650, icon: 'groups', description: 'De pie frente al escenario, ambiente inigualable.' },
    { name: 'Grada General', price: 350, icon: 'event_seat', description: 'Asientos numerados en zona elevada de grada.' }
  ];

  ngOnInit() {
    this.layoutService.setPageTitle('DETALLE DE EVENTO');
    
    this.route.queryParams.subscribe(params => {
      const idParam = params['id'];
      const pastParam = params['past'];
      if (pastParam === 'true') {
        this.isPastEvent.set(true);
      }

      if (idParam) {
        const id = parseInt(idParam, 10);
        const resolvedEvent = this.eventService.getEventById(id);
        
        if (resolvedEvent) {
          this.event.set(resolvedEvent);
          if (resolvedEvent.date && new Date(resolvedEvent.date) < new Date()) {
            this.isPastEvent.set(true);
          }
          this.loadLineup(resolvedEvent.title);
          this.setPriceRange(resolvedEvent.type);
          this.setFlyerUrl(resolvedEvent.type);
          this.loadVideos(resolvedEvent.title);
        } else {
          // Fallback if not found in service (for static list events in calendar page)
          const fallbackEvent = this.getFallbackEventById(id);
          this.event.set(fallbackEvent);
          this.loadLineup(fallbackEvent.title);
          this.setPriceRange(fallbackEvent.type);
          this.setFlyerUrl(fallbackEvent.type);
          this.loadVideos(fallbackEvent.title);
        }
      } else {
        // Redirigir a eventos si no hay ID
        this.router.navigate(['/events']);
      }
    });
  }

  private loadVideos(eventTitle: string) {
    const list: InvitationVideo[] = [];
    
    // Add a Local MP4 Video (Direct Upload by the Group)
    list.push({
      title: 'Invitación Especial (Video Oficial del Grupo)',
      bandName: this.lineup()[0]?.name || 'Grupo Acordex',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      type: 'local'
    });

    // Add a YouTube Embed Video as fallback
    let youtubeEmbedUrl = 'https://www.youtube.com/embed/F77FwZq-7gE'; // default Grupo Firme
    if (eventTitle.toLowerCase().includes('nodal')) {
      youtubeEmbedUrl = 'https://www.youtube.com/embed/gJM7_Mv30tA';
    } else if (eventTitle.toLowerCase().includes('reyes')) {
      youtubeEmbedUrl = 'https://www.youtube.com/embed/TfH73dnhfmg';
    } else if (eventTitle.toLowerCase().includes('natanael')) {
      youtubeEmbedUrl = 'https://www.youtube.com/embed/D3sR1hU767E';
    }

    list.push({
      title: 'Video de Promoción (Enlace a Redes Sociales)',
      bandName: this.lineup()[0]?.name || 'Grupo Acordex',
      url: youtubeEmbedUrl,
      type: 'youtube',
      sanitizedUrl: this.sanitizer.bypassSecurityTrustResourceUrl(youtubeEmbedUrl)
    });

    this.videos.set(list);
  }

  // Load participating musical bands based on event name
  private loadLineup(eventTitle: string) {
    const title = eventTitle.toLowerCase();
    
    // Default bands list to pick from
    const bands: Record<string, LineupBand> = {
      reyes: {
        name: 'Banda Los Reyes',
        genre: 'Banda Sinaloense',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
        rating: 4.9
      },
      norteño: {
        name: 'Norteño del Sur',
        genre: 'Norteño',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
        rating: 4.7
      },
      sierreño: {
        name: 'Los Alegres Sierreños',
        genre: 'Sierreño',
        imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
        rating: 4.8
      },
      mariachi: {
        name: 'Mariachi Oro y Plata',
        genre: 'Mariachi',
        imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=600&auto=format&fit=crop',
        rating: 5.0
      }
    };

    if (title.includes('acordex fest') || title.includes('festival')) {
      this.lineup.set([bands['reyes'], bands['sierreño'], bands['norteño']]);
    } else if (title.includes('norteño')) {
      this.lineup.set([bands['norteño'], bands['sierreño']]);
    } else if (title.includes('gala') || title.includes('sinfónica') || title.includes('bellas artes')) {
      this.lineup.set([bands['mariachi'], bands['reyes']]);
    } else if (title.includes('ms') || title.includes('remedio') || title.includes('reyes')) {
      this.lineup.set([bands['reyes']]);
    } else if (title.includes('vargas') || title.includes('mariachi')) {
      this.lineup.set([bands['mariachi']]);
    } else {
      // Fallback: 2 random bands
      this.lineup.set([bands['sierreño'], bands['norteño']]);
    }
  }

  private setPriceRange(type: string) {
    if (type === 'festival') {
      this.priceRange.set('$450 - $2,800 MXN');
    } else if (type === 'concierto') {
      this.priceRange.set('$350 - $1,900 MXN');
    } else {
      this.priceRange.set('$250 - $950 MXN');
    }
  }

  private getFallbackEventById(id: number): CalendarEvent {
    // Generate fallback data in case query ID isn't registered in current month range
    const fallbacks: Record<number, any> = {
      101: {
        id: 101,
        title: 'Gala Sinaloense VIP',
        date: new Date(2026, 10, 15),
        color: '#10B981',
        description: 'Exclusiva Gala VIP Sinaloense con alfombra roja y cena de gala. • 20:00',
        type: 'concierto',
        location: 'Arena Monterrey',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn5YNsp8Swg0q0SGm8jeu6ZVz8b44-B9qtueXTHKEsUpFnI7e_9gllAAV_aCsHZHaiAVErKdwuzJM2YAcc9D-oS5mD8h1RMViV4ygLLhrdDICdoIuSwx7bgAwryuQYUYB_q-mVMx0as2Fa5Z1ac15xt0tEPFSuPUeuE1cENsVvyDipE4WTiCEMOz0Q58k8pGbChddOBHt8FEjAFqnXGYyQ2KusBph6WyCLRsuhcmRwGxTKyOJTgkCmN3o7iGcCkx4iiynHu6IWbxA'
      },
      102: {
        id: 102,
        title: 'Noche de Metales',
        date: new Date(2026, 10, 28),
        color: '#10B981',
        description: 'Una velada mágica de viento metal y sonoras sinaloenses en vivo. • 21:00',
        type: 'concierto',
        location: 'Auditorio Telmex',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcCmK2O8LiUrz8S3Z8rVYTF2KvBXNugSwQp78x6VCyEoSHOEjhrbgcxJDaEsUf7Lwp9h_TCu7wPAKDh3doMxxvZpXPCJ19JrqNChF33SdUI2oNL9jCtEkecmtWz8d5d3H8cLjWh8qI7Jw340gN8lfFIrwddsM5JkQS8cuKCCHs9Y3134SiAJizMLvK0Mfzo-OzpTM__OIBfOPa8neU8PlkQ1T5Cb9sJ0j2t8ch-Mb0Ize8Fn6_-OwXKtYpVy7-PoVFRGhnqI_0oLY'
      },
      103: {
        id: 103,
        title: 'Encuentro de Bandas',
        date: new Date(2026, 11, 5),
        color: '#8B5CF6',
        description: 'Duelo épico y encuentro musical de las agrupaciones del año. • 19:30',
        type: 'festival',
        location: 'Plaza de Toros México',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSaiVdHEIuUMBk7BlrExFEg9DWu9YUu0dxfBLM1x1KWq_ZczzEGVBp260xE9HXMjE4_i3he5TRGaP4WWyVwSULBOEkBEYE69Jc68Fm2TgYO1tLUTbDZku72AIvZ07aWSc3v-LoRYSuNZCpDBWZKC3M6z2p7QicQi1JlOLYL2f89vHfGe1nfmn3TJSoAVC0F2DDNALF7W8emRTb8jE3oc1L_FOp4F65o9IPSP1X978d_wBHfw6daRDUoT3R3Yoif4R5At0a5PgnC4'
      }
    };
    
    return fallbacks[id] || {
      id: id,
      title: 'Concierto Acordex',
      date: new Date(),
      color: '#10B981',
      description: 'Gran espectáculo musical patrocinado por Acordex. • 20:00',
      type: 'concierto',
      location: 'Auditorio Nacional',
      imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop'
    };
  }

  getFriendlyDate(date: Date | undefined): string {
    if (!date) return '';
    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${weekdays[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  }

  getMapsIframeUrl(locationName: string | undefined): SafeResourceUrl {
    if (!locationName) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    const query = encodeURIComponent(locationName);
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
  }

  onSelectSeats() {
    // Navigate to seat selection page
    const ev = this.event();
    if (ev) {
      this.router.navigate(['/events/seleccion-asientos'], { queryParams: { id: ev.id } });
    }
  }

  onGoBack() {
    this.router.navigate(['/events']);
  }

  setFlyerUrl(type: string) {
    if (type === 'festival') {
      this.flyerUrl.set('https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop');
    } else if (type === 'concierto') {
      this.flyerUrl.set('https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=600&auto=format&fit=crop');
    } else {
      this.flyerUrl.set('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop');
    }
  }
}
