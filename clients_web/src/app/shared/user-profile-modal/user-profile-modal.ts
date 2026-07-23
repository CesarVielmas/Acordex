import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LayoutService } from '../../core/services/layout.service';
import { UserService } from '../../core/services/user.service';

export interface UserProfileData {
  userName: string;
  userAvatar: string;
  handle?: string;
  badge?: string;
  location?: string;
  memberSince?: string;
  bio?: string;
  stats?: {
    eventsAttended: number;
    reviewsCount: number;
    followingCount: number;
  };
  followingBands?: Array<{
    name: string;
    avatar: string;
    genre: string;
    rating: number;
  }>;
  attendedEvents?: Array<{
    id?: number;
    name: string;
    date: string;
    location: string;
    imageUrl?: string;
  }>;
  publishedReviews?: Array<{
    bandName: string;
    eventName: string;
    rating: number;
    content: string;
    timeAgo: string;
    likes: number;
    isLiked?: boolean;
  }>;
}

@Component({
  selector: 'app-user-profile-modal',
  imports: [CommonModule],
  templateUrl: './user-profile-modal.html',
  styleUrl: './user-profile-modal.scss'
})
export class UserProfileModal implements OnInit {
  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);
  private readonly userService = inject(UserService);

  @Input() user: UserProfileData | null = null;
  @Output() close = new EventEmitter<void>();

  activeTab = signal<'artistas' | 'eventos' | 'resenas'>('artistas');

  // Normalized profile data
  computedProfile = signal<UserProfileData | null>(null);

  ngOnInit() {
    if (this.user) {
      this.computedProfile.set(this.generateFullProfile(this.user));
    }
  }

  onClose(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.close.emit();
    this.layoutService.closeUserProfile();
  }

  onReviewLikeToggle(review: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    review.isLiked = !review.isLiked;
    review.likes = review.isLiked ? (review.likes || 0) + 1 : Math.max(0, (review.likes || 0) - 1);
  }

  onBandClick(bandName: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.onClose();
    const slug = bandName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    this.router.navigate(['/grupo', slug]);
  }

  private generateFullProfile(raw: UserProfileData): UserProfileData {
    const name = raw.userName || 'Usuario Acordex';
    const handle = raw.handle || `@${name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')}`;
    const avatar = raw.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop';

    // If viewing Alejandro Mendoza or if explicit live fields are passed
    if (name.includes('Alejandro') || (raw.followingBands && raw.publishedReviews)) {
      if (name.includes('Alejandro')) {
        return this.userService.getPublicProfileData();
      }
      return {
        userName: name,
        userAvatar: avatar,
        handle,
        location: raw.location || 'México',
        memberSince: raw.memberSince || 'Enero 2024',
        bio: raw.bio || '',
        stats: raw.stats || {
          eventsAttended: raw.attendedEvents?.length || 0,
          reviewsCount: raw.publishedReviews?.length || 0,
          followingCount: raw.followingBands?.length || 0
        },
        followingBands: raw.followingBands,
        attendedEvents: raw.attendedEvents || [],
        publishedReviews: raw.publishedReviews
      };
    }

    // Tailored preset profile for Carlos Sánchez
    if (name.includes('Carlos')) {
      return {
        userName: name,
        userAvatar: avatar,
        handle: '@carlos_sanchez',
        location: 'Guadalajara, Jalisco',
        memberSince: 'Marzo 2024',
        bio: 'Apasionado por la música mexicana tradicional y mariachi de gala. Me encanta asistir a presentaciones en vivo y recomendar agrupaciones de calidad.',
        stats: {
          eventsAttended: 14,
          reviewsCount: 8,
          followingCount: 6
        },
        followingBands: [
          { name: 'Mariachi Oro y Plata', avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop', genre: 'Mariachi Tradicional', rating: 5.0 },
          { name: 'Banda Los Reyes', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3KjImT7Com_TZjPm3s_JEtoRMtGwTz2pIVXzBWkiphKKC3Hhvv0hFafpnAUBOx3Xh3Wg1rKU_WYF_9WEL3MkoT5q5euWVCvDP_sVxpr6J8PAtdHW2RTGrcGUjP4TABc_K-UJzABbaegjdl7Lgt-PHqkMImpEd6vo-oq4FkujU-PEBsFxtfLKOfrqSlKhqwZOmT9kHC-TL2z_33iV1zc4PyhckWglDGJQkTFo7F6clZQhFECh8P9WBo8vCUIEYETYVxk5IrGaxfc', genre: 'Banda Sinaloense', rating: 4.9 },
          { name: 'Grupo Frontera', avatar: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=200&auto=format&fit=crop', genre: 'Norteño / Sierreño', rating: 4.8 }
        ],
        attendedEvents: [
          { id: 1, name: 'Boda en Hacienda San Javier', date: '22 de Junio, 2026', location: 'Hacienda San Javier, Zapopan' },
          { id: 3, name: 'Vibras en Vivo', date: '18 de Junio, 2026', location: 'Auditorio Telmex, Guadalajara' },
          { id: 10, name: 'Gala Sinaloense Sinfónica', date: '22 de Mayo, 2026', location: 'Teatro Diana, Guadalajara' }
        ],
        publishedReviews: [
          {
            bandName: 'Mariachi Oro y Plata',
            eventName: 'Boda en Hacienda San Javier',
            rating: 5,
            content: 'Contratamos al Mariachi Oro y Plata para nuestra boda y no podríamos estar más felices. Llegaron puntuales, lucían impecables y el repertorio fue espectacular.',
            timeAgo: 'Hace 1 día',
            likes: 12
          },
          {
            bandName: 'Banda Los Reyes',
            eventName: 'Aniversario Empresarial',
            rating: 5,
            content: 'Sonorización nítida y un ambiente que puso a bailar a todos los invitados. Recomendados al 100%.',
            timeAgo: 'Hace 2 semanas',
            likes: 8
          }
        ]
      };
    }

    // Tailored preset profile for Sofía Lara
    if (name.includes('Sofía') || name.includes('Sofia')) {
      return {
        userName: name,
        userAvatar: avatar,
        handle: '@sofia_lara',
        location: 'Monterrey, Nuevo León',
        memberSince: 'Enero 2024',
        bio: 'Seguidora fiel de conciertos y festivales sinaloenses. Me gusta calificar la puntualidad, calidad de audio y atención de las bandas.',
        stats: {
          eventsAttended: 22,
          reviewsCount: 12,
          followingCount: 9
        },
        followingBands: [
          { name: 'Banda MS', avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&auto=format&fit=crop', genre: 'Banda Sinaloense', rating: 5.0 },
          { name: 'Los Alegres Sierreños', avatar: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=200&auto=format&fit=crop', genre: 'Sierreño', rating: 4.7 }
        ],
        attendedEvents: [
          { id: 8, name: 'Banda MS en Concierto', date: '26 de Junio, 2026', location: 'Plaza de Toros México' },
          { id: 9, name: 'Acordex Fest 2026', date: '15 de Junio, 2026', location: 'Plaza de Toros México' }
        ],
        publishedReviews: [
          {
            bandName: 'Mariachi Oro y Plata',
            eventName: 'Boda en Hacienda San Javier',
            rating: 5,
            content: '¡Espectacular! La novia lloró con el Son de la Negra. Tienen una afinación y presencia impecables en escena.',
            timeAgo: 'Hace 2 días',
            likes: 5
          }
        ]
      };
    }

    // Default rich fallback profile for any other user
    return {
      userName: name,
      userAvatar: avatar,
      handle,
      location: raw.location || 'México',
      memberSince: raw.memberSince || 'Enero 2025',
      bio: raw.bio || 'Melómano y asistente verificado en la plataforma Acordex. Apasionado del talento musical en vivo.',
      stats: raw.stats || {
        eventsAttended: 9,
        reviewsCount: 4,
        followingCount: 5
      },
      followingBands: raw.followingBands || [
        { name: 'Mariachi Oro y Plata', avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop', genre: 'Mariachi', rating: 5.0 },
        { name: 'Banda Los Reyes', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3KjImT7Com_TZjPm3s_JEtoRMtGwTz2pIVXzBWkiphKKC3Hhvv0hFafpnAUBOx3Xh3Wg1rKU_WYF_9WEL3MkoT5q5euWVCvDP_sVxpr6J8PAtdHW2RTGrcGUjP4TABc_K-UJzABbaegjdl7Lgt-PHqkMImpEd6vo-oq4FkujU-PEBsFxtfLKOfrqSlKhqwZOmT9kHC-TL2z_33iV1zc4PyhckWglDGJQkTFo7F6clZQhFECh8P9WBo8vCUIEYETYVxk5IrGaxfc', genre: 'Banda Sinaloense', rating: 4.9 }
      ],
      attendedEvents: raw.attendedEvents || [
        { id: 1, name: 'Boda en Hacienda San Javier', date: '22 de Junio, 2026', location: 'Zapopan, Jalisco' },
        { id: 9, name: 'Acordex Fest 2026', date: '15 de Junio, 2026', location: 'Plaza de Toros México' }
      ],
      publishedReviews: raw.publishedReviews || [
        {
          bandName: 'Mariachi Oro y Plata',
          eventName: 'Evento Privado',
          rating: 5,
          content: 'Excelente interpretación musical y gran elegancia en su presentación. Totalmente recomendados.',
          timeAgo: 'Hace 1 mes',
          likes: 4
        }
      ]
    };
  }
}
