import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EventService, CalendarEvent, PressAccreditation } from '../../../core/services/event.service';
import { LayoutService } from '../../../core/services/layout.service';

interface InvitationVideo {
  title: string;
  bandName: string;
  url: string;
  type: 'local' | 'youtube';
  sanitizedUrl?: SafeResourceUrl;
}

interface LineupBand {
  name: string;
  genre: string;
  imageUrl: string;
  rating: number;
}

@Component({
  selector: 'app-firma-prensa',
  imports: [CommonModule],
  templateUrl: './firma-prensa.html',
  styleUrl: './firma-prensa.scss'
})
export class FirmaPrensa implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly layoutService = inject(LayoutService);
  private readonly sanitizer = inject(DomSanitizer);

  event = signal<CalendarEvent | null>(null);
  lineup = signal<LineupBand[]>([]);
  videos = signal<InvitationVideo[]>([]);

  // Accreditation states
  currentAccreditation = signal<PressAccreditation | null>(null);
  isAccreditationModalOpen = signal<boolean>(false);

  // Form signals
  applicantType = signal<'media' | 'independent'>('media');
  accredMedium = signal<string>('');
  accredName = signal<string>('');
  accredEmail = signal<string>('');
  accredId = signal<string>('');
  accredType = signal<string>('Prensa Escrita');

  ngOnInit() {
    this.layoutService.setPageTitle('DETALLE DE FIRMA Y PRENSA');

    this.route.queryParams.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        const id = parseInt(idParam, 10);
        const resolvedEvent = this.eventService.getEventById(id) || this.getFallbackEventById(id);
        
        this.event.set(resolvedEvent);
        this.loadLineup(resolvedEvent.title);
        this.loadVideos(resolvedEvent.title);
        
        // Load existing accreditation if any
        const accred = this.eventService.getAccreditation(resolvedEvent.id);
        if (accred) {
          this.currentAccreditation.set(accred);
          this.applicantType.set(accred.applicantType);
          this.accredMedium.set(accred.mediumName);
          this.accredName.set(accred.journalistName);
          this.accredEmail.set(accred.email);
          this.accredId.set(accred.cardId);
          this.accredType.set(accred.accredType);
        }
      } else {
        this.router.navigate(['/events']);
      }
    });
  }

  loadLineup(eventTitle: string) {
    if (eventTitle.includes('Banda Los Reyes')) {
      this.lineup.set([
        { name: 'Banda Los Reyes', genre: 'Banda Sinaloense', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop', rating: 4.9 }
      ]);
    } else if (eventTitle.includes('Grupo Firme')) {
      this.lineup.set([
        { name: 'Grupo Firme', genre: 'Norteño / Banda', imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=300&auto=format&fit=crop', rating: 4.8 }
      ]);
    } else if (eventTitle.includes('Nodal')) {
      this.lineup.set([
        { name: 'Christian Nodal', genre: 'Mariacheño', imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=300&auto=format&fit=crop', rating: 4.9 }
      ]);
    } else if (eventTitle.includes('Natanael Cano')) {
      this.lineup.set([
        { name: 'Natanael Cano', genre: 'Corridos Tumbados', imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop', rating: 4.7 }
      ]);
    } else {
      this.lineup.set([
        { name: 'Artistas Acordex', genre: 'Regional Mexicano', imageUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=300&auto=format&fit=crop', rating: 4.6 }
      ]);
    }
  }

  loadVideos(eventTitle: string) {
    const list: InvitationVideo[] = [];
    
    list.push({
      title: 'Invitación Oficial Directa (Subida por la Banda)',
      bandName: this.lineup()[0]?.name || 'Banda Oficial',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      type: 'local'
    });

    let youtubeEmbedUrl = 'https://www.youtube.com/embed/F77FwZq-7gE'; // default Grupo Firme
    if (eventTitle.includes('Nodal')) {
      youtubeEmbedUrl = 'https://www.youtube.com/embed/gJM7_Mv30tA';
    } else if (eventTitle.includes('Banda Los Reyes')) {
      youtubeEmbedUrl = 'https://www.youtube.com/embed/TfH73dnhfmg';
    } else if (eventTitle.includes('Natanael Cano')) {
      youtubeEmbedUrl = 'https://www.youtube.com/embed/D3sR1hU767E';
    }

    list.push({
      title: 'Video Promocional Alternativo (Redes Sociales)',
      bandName: this.lineup()[0]?.name || 'Banda Oficial',
      url: youtubeEmbedUrl,
      type: 'youtube',
      sanitizedUrl: this.sanitizer.bypassSecurityTrustResourceUrl(youtubeEmbedUrl)
    });

    this.videos.set(list);
  }

  getMapsIframeUrl(locationName: string | undefined): SafeResourceUrl {
    if (!locationName) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    const query = encodeURIComponent(locationName);
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
  }

  onGoBack() {
    this.router.navigate(['/events']);
  }

  openAccreditation() {
    this.isAccreditationModalOpen.set(true);
  }

  setApplicantType(type: 'media' | 'independent') {
    this.applicantType.set(type);
  }

  submitAccreditation(event: Event) {
    event.preventDefault();
    const ev = this.event();
    if (!ev) return;

    const accred: PressAccreditation = {
      eventId: ev.id,
      applicantType: this.applicantType(),
      mediumName: this.accredMedium() || (this.applicantType() === 'independent' ? 'Creador Independiente' : 'Medio General'),
      journalistName: this.accredName(),
      email: this.accredEmail(),
      cardId: this.accredId(),
      accredType: this.accredType(),
      status: 'pending' // Initial status is pending review!
    };

    this.eventService.saveAccreditation(accred);
    this.currentAccreditation.set(accred);
  }

  // Simulated tester actions
  simulateApproval() {
    const accred = this.currentAccreditation();
    if (accred) {
      const updated: PressAccreditation = {
        ...accred,
        status: 'approved'
      };
      this.eventService.saveAccreditation(updated);
      this.currentAccreditation.set(updated);
    }
  }

  simulateRejection() {
    const accred = this.currentAccreditation();
    if (accred) {
      const updated: PressAccreditation = {
        ...accred,
        status: 'rejected',
        rejectionReason: 'La carta de asignación provista no tiene sello oficial ni fecha vigente, o el enlace al canal independiente no está activo.'
      };
      this.eventService.saveAccreditation(updated);
      this.currentAccreditation.set(updated);
    }
  }

  resetAccreditation() {
    const ev = this.event();
    if (ev) {
      this.eventService.deleteAccreditation(ev.id);
      this.currentAccreditation.set(null);
      this.accredMedium.set('');
      this.accredName.set('');
      this.accredEmail.set('');
      this.accredId.set('');
      this.accredType.set('Prensa Escrita');
      this.applicantType.set('media');
    }
  }

  closeAccreditation() {
    this.isAccreditationModalOpen.set(false);
  }

  private getFallbackEventById(id: number): CalendarEvent {
    return {
      id: id,
      title: 'Firma de Autógrafos Banda Los Reyes',
      date: new Date(),
      color: '#3B82F6',
      description: 'Meet & Greet y Fotos con Fans • 16:00',
      type: 'firma',
      location: 'Plaza Patria'
    };
  }
}
