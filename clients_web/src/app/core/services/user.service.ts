import { Injectable, signal } from '@angular/core';

export interface UserReviewPrivacy {
  id: string;
  bandName: string;
  eventName: string;
  rating: number;
  content: string;
  timeAgo: string;
  likes: number;
  isPublic: boolean;
}

export interface UserBandPrivacy {
  id: string;
  name: string;
  avatar: string;
  genre: string;
  rating: number;
  isPublic: boolean;
}

export interface CurrentUserProfile {
  name: string;
  handle: string;
  email: string;
  phone: string;
  city: string;
  profileUrl: string;
  membership: string;
  joinDate: string;
  bio: string;
  followedBands: UserBandPrivacy[];
  publishedReviews: UserReviewPrivacy[];
  attendedEvents: Array<{
    id?: number;
    name: string;
    date: string;
    location: string;
    imageUrl?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  readonly currentUser = signal<CurrentUserProfile>({
    name: 'Alejandro Mendoza',
    handle: '@alejandro_mendoza',
    email: 'alejandro.mendoza@ejemplo.com',
    phone: '811-345-6789',
    city: 'Monterrey, NL, México',
    profileUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    membership: 'Premium VIP',
    joinDate: '12 de Enero de 2024',
    bio: 'Melómano empedernido y seguidor de eventos en vivo. Disfruto evaluar la calidad del sonido, puntualidad y vibra de los conciertos de mariachi y bandas sinaloenses.',
    followedBands: [
      { id: '1', name: 'Mariachi Oro y Plata', avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop', genre: 'Mariachi Tradicional', rating: 5.0, isPublic: true },
      { id: '2', name: 'Banda Los Reyes', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3KjImT7Com_TZjPm3s_JEtoRMtGwTz2pIVXzBWkiphKKC3Hhvv0hFafpnAUBOx3Xh3Wg1rKU_WYF_9WEL3MkoT5q5euWVCvDP_sVxpr6J8PAtdHW2RTGrcGUjP4TABc_K-UJzABbaegjdl7Lgt-PHqkMImpEd6vo-oq4FkujU-PEBsFxtfLKOfrqSlKhqwZOmT9kHC-TL2z_33iV1zc4PyhckWglDGJQkTFo7F6clZQhFECh8P9WBo8vCUIEYETYVxk5IrGaxfc', genre: 'Banda Sinaloense', rating: 4.9, isPublic: true },
      { id: '3', name: 'Los Alegres Sierreños', avatar: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=200&auto=format&fit=crop', genre: 'Sierreño', rating: 4.7, isPublic: false }
    ],
    publishedReviews: [
      { id: 'r1', bandName: 'Mariachi Oro y Plata', eventName: 'Boda en Hacienda San Javier', rating: 5, content: 'Contratamos al Mariachi Oro y Plata para nuestra boda y no podríamos estar más felices. Llegaron puntuales y lucían impecables.', timeAgo: 'Hace 1 día', likes: 12, isPublic: true },
      { id: 'r2', bandName: 'Banda Los Reyes', eventName: 'Gala Sinaloense', rating: 5, content: 'Sonorización nítida y un ambiente fabuloso.', timeAgo: 'Hace 2 semanas', likes: 8, isPublic: true },
      { id: 'r3', bandName: 'Los Alegres Sierreños', eventName: 'XV Años de Valeria', rating: 4, content: 'Muy buena atención y repertorio variado.', timeAgo: 'Hace 1 mes', likes: 3, isPublic: false }
    ],
    attendedEvents: [
      { id: 1, name: 'Boda en Hacienda San Javier', date: '22 de Junio, 2026', location: 'Hacienda San Javier, Zapopan' },
      { id: 3, name: 'Vibras en Vivo', date: '18 de Junio, 2026', location: 'Auditorio Telmex, Guadalajara' },
      { id: 10, name: 'Gala Sinaloense Sinfónica', date: '22 de Mayo, 2026', location: 'Teatro Diana, Guadalajara' }
    ]
  });

  updateProfileInfo(newInfo: Partial<CurrentUserProfile>) {
    this.currentUser.update(curr => ({
      ...curr,
      ...newInfo
    }));
  }

  toggleBandVisibility(bandId: string) {
    this.currentUser.update(curr => ({
      ...curr,
      followedBands: curr.followedBands.map(b => b.id === bandId ? { ...b, isPublic: !b.isPublic } : b)
    }));
  }

  toggleReviewVisibility(reviewId: string) {
    this.currentUser.update(curr => ({
      ...curr,
      publishedReviews: curr.publishedReviews.map(r => r.id === reviewId ? { ...r, isPublic: !r.isPublic } : r)
    }));
  }

  isBandFollowed(bandName: string): boolean {
    return this.currentUser().followedBands.some(b => b.name.toLowerCase() === bandName.toLowerCase());
  }

  toggleFollowBand(bandData: { id?: string; name: string; avatar?: string; genre?: string; rating?: number }): boolean {
    const isCurrentlyFollowed = this.isBandFollowed(bandData.name);
    if (isCurrentlyFollowed) {
      this.currentUser.update(curr => ({
        ...curr,
        followedBands: curr.followedBands.filter(b => b.name.toLowerCase() !== bandData.name.toLowerCase())
      }));
      return false;
    } else {
      const newBand: UserBandPrivacy = {
        id: bandData.id || (this.currentUser().followedBands.length + 1).toString(),
        name: bandData.name,
        avatar: bandData.avatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop',
        genre: bandData.genre || 'Música En Vivo',
        rating: bandData.rating || 5.0,
        isPublic: true
      };
      this.currentUser.update(curr => ({
        ...curr,
        followedBands: [...curr.followedBands, newBand]
      }));
      return true;
    }
  }

  getPublicProfileData() {
    const curr = this.currentUser();
    const publicBands = curr.followedBands.filter(b => b.isPublic);
    const publicReviews = curr.publishedReviews.filter(r => r.isPublic);

    return {
      userName: curr.name,
      userAvatar: curr.profileUrl,
      handle: curr.handle,
      location: curr.city,
      memberSince: curr.joinDate,
      bio: curr.bio,
      stats: {
        eventsAttended: curr.attendedEvents.length,
        reviewsCount: publicReviews.length,
        followingCount: publicBands.length
      },
      followingBands: publicBands,
      attendedEvents: curr.attendedEvents,
      publishedReviews: publicReviews
    };
  }
}
