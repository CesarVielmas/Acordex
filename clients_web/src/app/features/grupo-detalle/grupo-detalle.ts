import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BandService, BandDetail, BandMember, Track, ReviewItem } from '../../core/services/band.service';
import { LayoutService } from '../../core/services/layout.service';
import { EventService } from '../../core/services/event.service';
import { UserService } from '../../core/services/user.service';
import { PostCard } from '../../shared/post-card/post-card';
import { ReviewCard } from '../../shared/review-card/review-card';

@Component({
  selector: 'app-grupo-detalle',
  imports: [CommonModule, FormsModule, RouterModule, PostCard, ReviewCard],
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
  private readonly userService = inject(UserService);
  private readonly sanitizer = inject(DomSanitizer);

  followersCount = signal<number>(18450);
  isFollowing = signal<boolean>(false);
  formattedFollowers = computed(() => {
    const count = this.followersCount();
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    return count.toString();
  });

  toggleFollowBand(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const currentBand = this.band();
    if (!currentBand) return;

    const nowFollowing = this.userService.toggleFollowBand({
      id: currentBand.id,
      name: currentBand.name,
      avatar: currentBand.imageUrl,
      genre: currentBand.tag,
      rating: currentBand.rating
    });

    this.isFollowing.set(nowFollowing);
    this.followersCount.update(c => nowFollowing ? c + 1 : Math.max(0, c - 1));
  }

  onUserClick(userName: string, userAvatar: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.layoutService.openUserProfile({
      userName,
      userAvatar
    });
  }

  goToEventInfo(evt: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!evt) return;
    const isFirma = evt.type === 'firma' || evt.type === 'prensa' || (evt.genre && evt.genre.toLowerCase().includes('firma'));
    const targetRoute = isFirma ? '/events/firma-prensa' : '/events/comprar-boletos';
    const isPast = evt.isPast || evt.status === 'past' || (evt.date && new Date(evt.date) < new Date());
    this.router.navigate([targetRoute], { queryParams: { id: evt.id || 101, past: isPast ? 'true' : 'false' } });
  }

  band = signal<BandDetail | null>(null);
  activeTab = signal<'general' | 'trayectoria' | 'musica' | 'galeria' | 'resenas' | 'publicaciones'>('general');

  // Posts tab state
  bandPosts = signal<any[]>([]);
  newPostContent = '';
  selectedPostImage = signal<string | null>(null);
  activeLightboxPost = signal<any | null>(null);
  lightboxCommentText = signal<string>('');

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

        const isFollowed = this.userService.isBandFollowed(bandData.name);
        this.isFollowing.set(isFollowed);
        this.followersCount.set(bandData.followersCount || 18450);

        // Seed realistic band posts matching Home feed format 1:1
        const mockPosts = [
          {
            authorName: bandData.name,
            authorAvatar: bandData.imageUrl,
            timeAgo: 'Hace 2 horas',
            content: `¡Increíble noche en la presentación con ${bandData.name}! Gracias a todos los que nos acompañaron, la energía estuvo a otro nivel. 🎺✨`,
            mediaUrl: bandData.heroCoverUrl || bandData.imageUrl,
            likes: 1240,
            comments: 85,
            tags: ['#ArenaMonterrey', '#EnVivo', '#MusicaNacional'],
            isLiked: false,
            commentsList: [
              { userName: 'Andrés López', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop', text: '¡Excelente música! Un abrazo fuerte plebada 🤘🤠', time: '1 h' },
              { userName: 'Gabriela Ruiz', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop', text: 'Estuve ahí, fue una noche inolvidable. ¡Los mejores! 🔥❤️', time: '45 min' },
              { userName: 'Marcos R.', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop', text: 'Ya esperando con ansias el nuevo álbum. ¡Puro talento mexicano! 🎺🇲🇽', time: '10 min' }
            ]
          },
          {
            authorName: bandData.name,
            authorAvatar: bandData.imageUrl,
            timeAgo: 'Hace 4 horas',
            content: `¡Listos para cantar con el alma en Guadalajara! Ya se siente la vibra tapatía. ¿Qué canción quieren escuchar hoy? 🎙️🤠`,
            mediaUrl: bandData.imageUrl,
            likes: 850,
            comments: 42,
            tags: ['#Tour2026', '#Guadalajara', '#Jalisco'],
            isLiked: true,
            commentsList: [
              { userName: 'Jorge Ramírez', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop', text: '¡Qué ambientazo armaron ayer! Valieron totalmente la pena las 3 horas de show. 🎉', time: '5 h' }
            ]
          },
          {
            authorName: bandData.name,
            authorAvatar: bandData.imageUrl,
            timeAgo: 'Hace 6 horas',
            content: `¡En el estudio de grabación afinando los últimos detalles de lo nuevo que se viene! 🎶✨ ¿Listos para el nuevo lanzamiento?`,
            mediaUrl: bandData.membersList && bandData.membersList[0] ? bandData.membersList[0].photoUrl : bandData.imageUrl,
            likes: 2100,
            comments: 68,
            tags: ['#Estudio', '#NuevoLanzamiento', '#MúsicaMexicana'],
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
  }

  onPostLikeToggle(post: any, isLiked: boolean) {
    post.isLiked = isLiked;
    post.likes = isLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
  }

  onPostCommentAdded(post: any, newComment: any) {
    if (!post.commentsList) post.commentsList = [];
    post.commentsList.push(newComment);
    post.comments = post.commentsList.length;
  }

  openGlobalLightbox(post: any) {
    this.activeLightboxPost.set(post);
  }

  closeGlobalLightbox(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.activeLightboxPost.set(null);
  }

  toggleLightboxLike() {
    const post = this.activeLightboxPost();
    if (!post) return;
    post.isLiked = !post.isLiked;
    post.likes = post.isLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
  }

  submitLightboxComment(event: Event) {
    event.preventDefault();
    const text = this.lightboxCommentText().trim();
    const post = this.activeLightboxPost();
    if (!text || !post) return;

    const newComment = {
      userName: 'Tú',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
      text: text,
      time: 'Ahora mismo'
    };

    if (!post.commentsList) post.commentsList = [];
    post.commentsList.push(newComment);
    post.comments = post.commentsList.length;

    this.lightboxCommentText.set('');
  }

  // Computed grouped reviews by Event for Reseñas tab
  groupedReviewsByEvent = computed(() => {
    const b = this.band();
    if (!b || !b.reviews) return [];

    const groupsMap: { [key: string]: {
      eventId: string;
      eventName: string;
      bandName: string;
      eventType: string;
      location: string;
      date: string;
      verifiedFolio: string;
      avgRating: number;
      reviews: any[];
    } } = {};

    b.reviews.forEach((rev: any, index: number) => {
      const eventKey = rev.eventType || rev.eventName || 'Evento de Gala';
      if (!groupsMap[eventKey]) {
        groupsMap[eventKey] = {
          eventId: rev.eventId || `evt-${b.id || 'band'}-${index + 1}`,
          eventName: rev.eventName || rev.eventType || 'Evento Privado Verificado',
          bandName: rev.bandName || b.name,
          eventType: rev.eventTypeTag || (eventKey.toLowerCase().includes('boda') ? 'Boda' : eventKey.toLowerCase().includes('xv') ? 'XV Años' : 'Concierto'),
          location: rev.location || b.location,
          date: rev.date,
          verifiedFolio: rev.verifiedFolio || ('ACX-' + (8400 + index * 137)),
          avgRating: rev.rating || 5,
          reviews: []
        };
      }
      groupsMap[eventKey].reviews.push(rev);
    });

    Object.values(groupsMap).forEach(g => {
      const sum = g.reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
      g.avgRating = parseFloat((sum / g.reviews.length).toFixed(1));
    });

    return Object.values(groupsMap);
  });

  selectedEvent = signal<any | null>(null);

  openEventDetails(eventId: string) {
    const evtGroup = this.groupedReviewsByEvent().find(g => g.eventId === eventId);
    if (evtGroup) {
      this.selectedEvent.set({
        id: evtGroup.eventId,
        name: evtGroup.eventName,
        bandName: this.band()?.name || evtGroup.bandName,
        date: evtGroup.date,
        locationName: evtGroup.location,
        googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(evtGroup.location || 'Guadalajara')}`,
        details: `Presentación exclusiva en vivo con asistencia de clientes e invitados verificados mediante contrato digital Acordex. Excelente ambientación, puntualidad e interpretación musical impecable.`,
        genre: evtGroup.eventType || 'Evento de Gala',
        capacity: '~300 Asistentes Verificados',
        ratingAvg: evtGroup.avgRating.toString(),
        reviews: evtGroup.reviews,
        upcomingEvents: [
          {
            name: `Próxima Fecha de ${this.band()?.name || 'Agrupación'}`,
            bands: this.band()?.name || 'Agrupación',
            date: '15 de Agosto, 2026',
            price: 'Boletos Disponibles en Acordex'
          }
        ]
      });
    } else {
      const b = this.band();
      this.selectedEvent.set({
        id: eventId,
        name: 'Presentación de Gala Verificada',
        bandName: b?.name || 'Agrupación',
        date: 'Reciente',
        locationName: b?.location || 'México',
        googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(b?.location || 'Mexico')}`,
        details: `Concierto y presentación en vivo verificada con contrato digital Acordex.`,
        genre: 'Evento de Gala',
        capacity: '~300 Asistentes',
        ratingAvg: b?.rating ? b.rating.toString() : '5.0',
        reviews: b?.reviews || [],
        upcomingEvents: []
      });
    }
  }

  closeEventDetails() {
    this.selectedEvent.set(null);
  }

  onReviewLikeToggle(review: any, isLiked: boolean) {
    review.isLiked = isLiked;
    review.likes = isLiked ? (review.likes || 0) + 1 : Math.max(0, (review.likes || 0) - 1);
  }

  getSafeMapUrl(url: string): SafeResourceUrl {
    const query = (url || '').split('?q=')[1] || 'Guadalajara';
    const embedUrl = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
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
