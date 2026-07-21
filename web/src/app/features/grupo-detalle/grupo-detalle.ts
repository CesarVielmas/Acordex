import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BandService, BandDetail, BandMember, Track, ReviewItem } from '../../core/services/band.service';
import { LayoutService } from '../../core/services/layout.service';
import { EventService } from '../../core/services/event.service';
import { PostCard } from '../../shared/post-card/post-card';

@Component({
  selector: 'app-grupo-detalle',
  imports: [CommonModule, FormsModule, RouterModule, PostCard],
  templateUrl: './grupo-detalle.html',
  styleUrl: './grupo-detalle.scss'
})
export class GrupoDetalle implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly bandService = inject(BandService);
  private readonly layoutService = inject(LayoutService);
  private readonly eventService = inject(EventService);
  private readonly sanitizer = inject(DomSanitizer);

  band = signal<BandDetail | null>(null);
  activeTab = signal<'general' | 'trayectoria' | 'musica' | 'galeria' | 'resenas' | 'publicaciones'>('general');

  // Posts tab state
  bandPosts = signal<any[]>([]);
  newPostContent = '';
  selectedPostImage = signal<string | null>(null);

  // Selected Member Modal State & Inner Tabs
  selectedMember = signal<BandMember | null>(null);
  memberModalTab = signal<'general' | 'media' | 'socials'>('general');

  // Full Screen Member Media Lightbox State
  selectedMemberMedia = signal<{ type: 'image' | 'video'; url: string; title?: string } | null>(null);

  // Music Player State for Top Tracks
  playingTrackId = signal<number | null>(null);
  
  // Music Player State for Repertoire Songs
  playingRepertoireSong = signal<string | null>(null);

  selectedMusicGenre = signal<string>('Todos');
  searchSongQuery = signal<string>('');

  // Gallery Modal Lightbox State
  selectedGalleryImage = signal<{ url: string; caption: string } | null>(null);

  // Quote Modal State
  isQuoteModalOpen = signal<boolean>(false);
  quoteStep = signal<number>(1);
  quoteFolio = signal<string>('');
  isContractSigned = signal<boolean>(false);

  // Quote Form Fields
  eventType = signal<string>('Boda');
  eventDate = signal<string>('');
  eventLocation = signal<string>('');
  durationHours = signal<number>(3);
  notes = signal<string>('');
  clientName = signal<string>('');
  clientEmail = signal<string>('');
  clientPhone = signal<string>('');

  // Location Autocomplete & Maps
  eventLocationQuery = signal<string>('');
  showLocationSuggestions = signal<boolean>(false);
  selectedLocationMapUrl = signal<SafeResourceUrl | null>(null);

  locationSuggestions = [
    { title: 'Hacienda San Javier, Zapopan, Jalisco', query: 'Hacienda+San+Javier,+Zapopan,+Jalisco' },
    { title: 'Arena Monterrey, Monterrey, Nuevo León', query: 'Arena+Monterrey,+Monterrey,+Nuevo+León' },
    { title: 'Salón Imperial, Culiacán, Sinaloa', query: 'Salón+Imperial,+Culiacán,+Sinaloa' },
    { title: 'Hacienda Tres Ríos, Mazatlán, Sinaloa', query: 'Hacienda+Tres+Ríos,+Mazatlán,+Sinaloa' },
    { title: 'Salón Las Flores, Guadalajara, Jalisco', query: 'Salón+Las+Flores,+Guadalajara,+Jalisco' }
  ];

  // Toast Feedback State
  showToast = signal<boolean>(false);
  toastMessage = signal<string>('');

  // Saved Scroll Position for Body Lock
  private savedScrollY = 0;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        const bandData = this.bandService.getBandById(id);
        this.band.set(bandData);
        this.layoutService.setPageTitle(bandData.name.toUpperCase());

        // Seed realistic band posts
        const mockPosts = [
          {
            authorName: bandData.name,
            authorAvatar: bandData.imageUrl,
            timeAgo: 'Hace 2 horas',
            content: `¡Familia de Acordex! Estamos totalmente listos y afinando detalles para nuestras próximas fechas. 🎺🔥 ¿Qué canción no puede faltar en nuestro repertorio de esta noche? Dejen sus comentarios 👇`,
            mediaUrl: bandData.heroCoverUrl,
            likes: 1420,
            comments: 42,
            tags: ['GiraOficial', 'EnVivo', 'AcordexLive'],
            isLiked: false,
            commentsList: [
              { userName: 'Carlos Mendoza', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop', text: '¡Tienen que tocar sus éxitos más sonados! Saludos desde Guadalajara 🔥', time: '1 h' },
              { userName: 'Sofía Morales', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop', text: 'Ya tengo mis boletos listos, nos vemos en primera fila. ❤️', time: '30 min' }
            ]
          },
          {
            authorName: bandData.name,
            authorAvatar: bandData.imageUrl,
            timeAgo: 'Ayer a las 21:15',
            content: `Agradecidos enormemente con todo el público por hacer de nuestra última presentación una noche totalmente inolvidable. ¡Son el mejor público del mundo! ❤️🇲🇽`,
            mediaUrl: bandData.imageUrl,
            likes: 2890,
            comments: 115,
            tags: ['SoldOut', 'Concierto', 'Tour2026'],
            isLiked: true,
            commentsList: [
              { userName: 'Jorge Ramírez', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop', text: '¡Qué ambientazo armaron ayer! Valieron totalmente la pena las 3 horas de show. 🎉', time: '5 h' }
            ]
          },
          {
            authorName: bandData.name,
            authorAvatar: bandData.imageUrl,
            timeAgo: 'Hace 3 días',
            content: `¡En el estudio de grabación afinando los últimos detalles de lo nuevo que se viene! 🎶✨ ¿Listos para el nuevo lanzamiento?`,
            mediaUrl: bandData.membersList && bandData.membersList[0] ? bandData.membersList[0].photoUrl : bandData.imageUrl,
            likes: 1950,
            comments: 68,
            tags: ['Estudio', 'NuevoLanzamiento', 'MúsicaMexicana'],
            isLiked: false,
            commentsList: []
          }
        ];
        this.bandPosts.set(mockPosts);
      }
    });
  }

  ngOnDestroy() {
    this.unlockBodyScroll();
  }

  goBack() {
    this.unlockBodyScroll();
    this.location.back();
  }

  navigateToEvent(internalRoute?: string) {
    const target = internalRoute || '/events';
    this.router.navigateByUrl(target);
  }

  getEventTheme(type: string) {
    const t = (type || '').toLowerCase();
    if (t.includes('firma') || t.includes('prensa') || t.includes('autógrafos') || t.includes('autografos')) {
      return {
        cardBorder: 'border-blue-500/20 hover:border-blue-400/50',
        hoverGlow: 'hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]',
        accentLine: 'via-blue-500/60',
        badgeBg: 'bg-blue-500/25 text-blue-200 border-blue-400/40',
        dateBg: 'bg-blue-500/10 border-blue-500/25 text-blue-300',
        statusBg: 'bg-blue-500/8 border-blue-500/15 text-blue-300',
        buttonBg: 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/30',
        iconColor: 'text-blue-400',
        dotColor: 'bg-blue-400',
        imageOverlay: 'from-blue-900/30',
        calendarBorder: 'border-blue-500/20',
        calendarMonthColor: 'text-blue-300'
      };
    }
    if (t.includes('festival')) {
      return {
        cardBorder: 'border-purple-500/20 hover:border-purple-400/50',
        hoverGlow: 'hover:shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)]',
        accentLine: 'via-purple-500/60',
        badgeBg: 'bg-purple-500/25 text-purple-200 border-purple-400/40',
        dateBg: 'bg-purple-500/10 border-purple-500/25 text-purple-300',
        statusBg: 'bg-purple-500/8 border-purple-500/15 text-purple-300',
        buttonBg: 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-purple-500/30',
        iconColor: 'text-purple-400',
        dotColor: 'bg-purple-400',
        imageOverlay: 'from-purple-900/30',
        calendarBorder: 'border-purple-500/20',
        calendarMonthColor: 'text-purple-300'
      };
    }
    // Concierto Estelar / Boletos (Golden #F2CA50)
    return {
      cardBorder: 'border-primary/20 hover:border-primary/50',
      hoverGlow: 'hover:shadow-[0_0_50px_-12px_rgba(242,202,80,0.25)]',
      accentLine: 'via-primary/60',
      badgeBg: 'bg-primary/20 text-primary border-primary/40',
      dateBg: 'bg-primary/10 border-primary/25 text-primary',
      statusBg: 'bg-emerald-500/8 border-emerald-500/15 text-emerald-400',
      buttonBg: 'bg-primary hover:brightness-110 text-black hover:shadow-primary/30',
      iconColor: 'text-primary',
      dotColor: 'bg-emerald-400',
      imageOverlay: 'from-amber-900/20',
      calendarBorder: 'border-primary/20',
      calendarMonthColor: 'text-primary'
    };
  }

  // Parse "24 OCT 2026" → day, month abbreviation, year
  parseEventDay(date: string): string {
    return date.split(' ')[0] || '';
  }
  parseEventMonth(date: string): string {
    return date.split(' ')[1] || '';
  }
  parseEventYear(date: string): string {
    return date.split(' ')[2] || '';
  }

  getEventButtonIcon(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('firma') || t.includes('prensa') || t.includes('autógrafos')) return 'stylus_note';
    if (t.includes('festival')) return 'confirmation_number';
    return 'confirmation_number';
  }

  setTab(tab: 'general' | 'trayectoria' | 'musica' | 'galeria' | 'resenas' | 'publicaciones') {
    this.activeTab.set(tab);
  }

  createBandPost() {
    const text = this.newPostContent.trim();
    if (!text || !this.band()) return;

    const newPost = {
      authorName: this.band()!.name,
      authorAvatar: this.band()!.imageUrl,
      timeAgo: 'Ahora mismo',
      content: text,
      mediaUrl: this.band()!.heroCoverUrl,
      likes: 1,
      comments: 0,
      tags: ['Oficial', 'Comunidad'],
      isLiked: true,
      commentsList: []
    };

    this.bandPosts.update(posts => [newPost, ...posts]);
    this.newPostContent = '';
    this.triggerToast('¡Publicación realizada con éxito!');
  }

  getInstrumentIcon(instrument: string): string {
    if (!instrument) return 'music_note';
    const ins = instrument.toLowerCase();
    if (ins.includes('voz') || ins.includes('vocal') || ins.includes('cantante')) return 'mic';
    if (ins.includes('acordeó') || ins.includes('acordeon')) return 'piano';
    if (ins.includes('bajo') || ins.includes('guitarra') || ins.includes('requinto')) return 'queue_music';
    if (ins.includes('bater') || ins.includes('tarola') || ins.includes('percus')) return 'equalizer';
    if (ins.includes('trompeta') || ins.includes('trombó') || ins.includes('sax') || ins.includes('clarinete')) return 'campaign';
    if (ins.includes('tuba') || ins.includes('charcheta')) return 'graphic_eq';
    return 'music_note';
  }

  private lockBodyScroll() {
    if (document.body.style.position !== 'fixed') {
      this.savedScrollY = window.scrollY || window.pageYOffset;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.savedScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    }
  }

  private unlockBodyScroll() {
    if (document.body.style.position === 'fixed') {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, this.savedScrollY);
    }
  }

  // Member Modal Controls
  openMemberModal(member: BandMember) {
    this.selectedMember.set(member);
    this.memberModalTab.set('general');
    this.lockBodyScroll();
    
    setTimeout(() => {
      const el = document.getElementById('memberTabContentArea');
      if (el) el.scrollTop = 0;
    }, 15);
  }

  closeMemberModal() {
    this.selectedMember.set(null);
    if (!this.isQuoteModalOpen() && !this.selectedGalleryImage() && !this.selectedMemberMedia()) {
      this.unlockBodyScroll();
    }
  }

  setMemberModalTab(tab: 'general' | 'media' | 'socials') {
    this.memberModalTab.set(tab);
    setTimeout(() => {
      const el = document.getElementById('memberTabContentArea');
      if (el) el.scrollTop = 0;
    }, 10);
  }

  openMemberMedia(type: 'image' | 'video', url: string, title?: string) {
    this.selectedMemberMedia.set({ type, url, title });
    this.lockBodyScroll();
  }

  closeMemberMedia() {
    this.selectedMemberMedia.set(null);
    if (!this.selectedMember() && !this.isQuoteModalOpen() && !this.selectedGalleryImage()) {
      this.unlockBodyScroll();
    }
  }

  // Audio Player Toggle for Top Tracks
  toggleTrack(trackId: number) {
    if (this.playingTrackId() === trackId) {
      this.playingTrackId.set(null);
    } else {
      this.playingTrackId.set(trackId);
      this.playingRepertoireSong.set(null);
    }
  }

  // Audio Player Toggle for Repertoire Catalog Songs
  toggleRepertoireSong(songName: string) {
    if (this.playingRepertoireSong() === songName) {
      this.playingRepertoireSong.set(null);
    } else {
      this.playingRepertoireSong.set(songName);
      this.playingTrackId.set(null);
    }
  }

  // Music Repertoire Filtered
  filteredTracks = computed(() => {
    const b = this.band();
    if (!b) return [];
    const genre = this.selectedMusicGenre();
    const query = this.searchSongQuery().toLowerCase().trim();

    return b.topTracks.filter(track => {
      const matchesGenre = genre === 'Todos' || track.genre.toLowerCase().includes(genre.toLowerCase());
      const matchesQuery = !query || track.title.toLowerCase().includes(query) || track.genre.toLowerCase().includes(query);
      return matchesGenre && matchesQuery;
    });
  });

  // Open Quote Modal
  openQuoteModal() {
    this.quoteStep.set(1);
    this.isContractSigned.set(false);
    this.isQuoteModalOpen.set(true);
    this.lockBodyScroll();
  }

  closeQuoteModal() {
    this.isQuoteModalOpen.set(false);
    if (!this.selectedMember() && !this.selectedGalleryImage() && !this.selectedMemberMedia()) {
      this.unlockBodyScroll();
    }
  }

  selectLocation(sug: { title: string; query: string }) {
    this.eventLocation.set(sug.title);
    this.eventLocationQuery.set(sug.title);
    this.showLocationSuggestions.set(false);
    
    const embedUrl = `https://maps.google.com/maps?q=${sug.query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    this.selectedLocationMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
  }

  onLocationInput(val: string) {
    this.eventLocation.set(val);
    this.eventLocationQuery.set(val);
    if (val.length > 2) {
      this.showLocationSuggestions.set(true);
      const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(val)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      this.selectedLocationMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
    } else {
      this.showLocationSuggestions.set(false);
      this.selectedLocationMapUrl.set(null);
    }
  }

  nextQuoteStep() {
    if (this.quoteStep() === 1) {
      if (!this.eventDate() || !this.eventLocation()) {
        this.triggerToast('Por favor completa la fecha y ubicación del evento');
        return;
      }
      this.quoteStep.set(2);
    } else if (this.quoteStep() === 2) {
      if (!this.clientName() || !this.clientEmail() || !this.clientPhone()) {
        this.triggerToast('Por favor ingresa tus datos de contacto');
        return;
      }
      
      const folio = 'ACX-' + Math.floor(1000 + Math.random() * 9000);
      this.quoteFolio.set(folio);

      const b = this.band();
      this.eventService.addSubmittedQuote({
        folio: folio,
        bandName: b ? b.name : 'Agrupación Musical',
        eventType: this.eventType(),
        eventDate: this.eventDate(),
        eventLocation: this.eventLocation(),
        durationHours: this.durationHours(),
        clientName: this.clientName(),
        clientEmail: this.clientEmail(),
        clientPhone: this.clientPhone(),
        status: 'pending'
      });

      this.quoteStep.set(3);
    }
  }

  signContract() {
    this.isContractSigned.set(true);
    const b = this.band();
    this.eventService.addSubmittedQuote({
      folio: this.quoteFolio(),
      bandName: b ? b.name : 'Agrupación Musical',
      eventType: this.eventType(),
      eventDate: this.eventDate(),
      eventLocation: this.eventLocation(),
      durationHours: this.durationHours(),
      clientName: this.clientName(),
      clientEmail: this.clientEmail(),
      clientPhone: this.clientPhone(),
      status: 'signed'
    });
    this.triggerToast('¡Contrato firmado con éxito! Guardado en tu Historial.');
  }

  copyShareLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      this.triggerToast('¡Enlace del perfil copiado al portapapeles!');
    } else {
      this.triggerToast('Enlace listo para compartir');
    }
  }

  triggerToast(msg: string) {
    this.toastMessage.set(msg);
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 3500);
  }

  get genreBadgeClass(): string {
    const b = this.band();
    if (!b) return 'bg-primary/20 text-primary border-primary/30';
    const t = b.tag.toLowerCase();
    if (t.includes('sinaloense') || t.includes('banda')) {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
    if (t.includes('norteño')) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
    if (t.includes('sierreño')) {
      return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    }
    if (t.includes('mariachi')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    return 'bg-primary/20 text-primary border-primary/30';
  }
}
