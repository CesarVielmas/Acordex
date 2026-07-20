import { Component, inject, OnInit, ViewChild, ElementRef, ChangeDetectorRef, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PostCard } from '../../shared/post-card/post-card';
import { StoryCard } from '../../shared/story-card/story-card';
import { LayoutService } from '../../core/services/layout.service';
import { ReviewCard } from '../../shared/review-card/review-card';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, PostCard, ReviewCard, StoryCard],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  @ViewChild('storyScroll') storyScroll!: ElementRef<HTMLElement>;
  private readonly layoutService = inject(LayoutService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);

  ngOnInit() {
    this.layoutService.setPageTitle('PANEL DE INICIO');
    this.sortStories();

    // Initial mock comments pool
    const mockCommentsPool = [
      { userName: 'Andrés López', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop', text: '¡Excelente música! Un abrazo fuerte plebada 🤘🤠', time: '1 h' },
      { userName: 'Gabriela Ruiz', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop', text: 'Estuve ahí, fue una noche inolvidable. ¡Los mejores! 🔥❤️', time: '45 min' },
      { userName: 'Marcos R.', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop', text: 'Ya esperando con ansias el nuevo álbum. ¡Puro talento mexicano! 🎺🇲🇽', time: '10 min' }
    ];

    // Seed commentsList and isLiked for posts
    this.posts.forEach(post => {
      post.isLiked = false;
      post.commentsList = mockCommentsPool.slice(0, Math.min(post.comments || 3, mockCommentsPool.length));
    });
  }

  scrollStories(direction: number) {
    const scrollAmount = 400; // Desplaza unos 4 elementos a la vez
    this.storyScroll.nativeElement.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth'
    });
  }

  sortStories() {
    this.stories.sort((a, b) => {
      if (a.isFollowed && !b.isFollowed) return -1;
      if (!a.isFollowed && b.isFollowed) return 1;
      return 0;
    });
  }

  toggleFollow(story: any) {
    story.isFollowed = !story.isFollowed;
    this.sortStories();
  }

  stories = [
    {
      authorName: 'Banda El Recodo',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3KjImT7Com_TZjPm3s_JEtoRMtGwTz2pIVXzBWkiphKKC3Hhvv0hFafpnAUBOx3Xh3Wg1rKU_WYF_9WEL3MkoT5q5euWVCvDP_sVxpr6J8PAtdHW2RTGrcGUjP4TABc_K-UJzABbaegjdl7Lgt-PHqkMImpEd6vo-oq4FkujU-PEBsFxtfLKOfrqSlKhqwZOmT9kHC-TL2z_33iV1zc4PyhckWglDGJQkTFo7F6clZQhFECh8P9WBo8vCUIEYETYVxk5IrGaxfc',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop',
      isVideo: true,
      isFollowed: true,
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      caption: 'Calentando motores para el show de hoy. ¡Nos vemos al rato sinaloenses! 🎺',
      tags: ['#ElRecodo', '#Sinaloa', '#Concierto']
    },
    {
      authorName: 'Mariachi Vargas',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9uqGh4gewnFEoovP1fuHPQMLAAo7DukmY0EkWYU2Cor_CdspwyW97x1d-MfyItGXH5ushLKk86XZ2gCBGK6C3_ediZiBnWTqXjRLY-CxNTwdjfrooE_c7-ctaFxlTAXXDaqhtpK4VCDC_1G8Z7z0Ylmvsx52D9sppnm0YumVh0DTRu0rQryqzOyOLN25obm16uWwblhXMbeir_hUfv2ShjwtqaG9x-HUnouaQ4CXMWMmBqCAl9NhwAQW9B5PU7JoEguyTttbBVr8',
      thumbnailUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop',
      isVideo: true,
      isFollowed: false,
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      caption: 'Ensayando el son de la negra. El orgullo de México sonando fuerte. 🎻🇲🇽',
      tags: ['#MariachiVargas', '#Mariachi', '#Mexico']
    },
    {
      authorName: 'Los Tigres del Norte',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-pQpQ5q9YwQfH4J-0w9i2F5wOQ6H5zL6v7-X5k5R9g8-x5z-vR7w',
      thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
      isVideo: true,
      isFollowed: true,
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
      caption: 'Un saludo especial para todos nuestros jefes de jefes. ¡Los queremos! 🐅',
      tags: ['#LosTigresDelNorte', '#JefeDeJefes', '#MusicaNortena']
    },
    {
      authorName: 'Grupo Firme',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_p9uH-0w9i2F5wOQ6H5zL6v7-X5k5R9g8-x5z-vR7w',
      thumbnailUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2070&auto=format&fit=crop',
      isVideo: true,
      isFollowed: true,
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer-480p.mp4',
      caption: '¡Qué bonita es la vida! Puro Grupo Firme, disfrutando el backstage. 🍻🔥',
      tags: ['#GrupoFirme', '#EnVivo', '#Music']
    },
    {
      authorName: 'Christian Nodal',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_p9uH-0w9i2F5wOQ6H5zL6v7-X5k5R9g8-x5z-vR7w',
      thumbnailUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop',
      isVideo: true,
      isFollowed: true,
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      caption: 'Componiendo algo nuevo para el alma. Espero les guste pronto. 🤠💚',
      tags: ['#Nodal', '#Forajido', '#Mariacheno']
    },
    {
      authorName: 'Banda MS',
      authorAvatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop',
      isVideo: true,
      isFollowed: true,
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      caption: 'Preparando las románticas para enamorarlos esta noche. 🥰🎶',
      tags: ['#BandaMS', '#HermosaExperiencia', '#Sinaloense']
    },
    {
      authorName: 'Carin León',
      authorAvatar: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=2070&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecbb4ec?q=80&w=2070&auto=format&fit=crop',
      isVideo: true,
      isFollowed: true,
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
      caption: 'Alistando el rugido para hoy. ¡Que ruja el león, mi gente! 🦁🔥',
      tags: ['#CarinLeon', '#BocaChueca', '#RegionalMexicano']
    },
    {
      authorName: 'Natanael Cano',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=2070&auto=format&fit=crop',
      isVideo: true,
      isFollowed: false,
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer-480p.mp4',
      caption: 'Tumbado y bien enfocado. Gracias por el apoyo de siempre. 💎🎸',
      tags: ['#NatanaelCano', '#CorridosTumbados', '#CT']
    },
    {
      authorName: 'Peso Pluma',
      authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1974&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop',
      isVideo: true,
      isFollowed: false,
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      caption: '¡La doble P rompiendo fronteras! Saludos a toda la plebada. 🥷🔥',
      tags: ['#PesoPluma', '#DobleP', '#Tumbado']
    },
    {
      authorName: 'Julión Álvarez',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop',
      isVideo: true,
      isFollowed: false,
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      caption: 'Un ratito de descanso antes de subir al escenario. ¡Gracias Monterrey! 🎤✨',
      tags: ['#JulionAlvarez', '#ElReyDeLaTaquilla', '#NortenoBand']
    }
  ];

  recommendedBands = [
    {
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3KjImT7Com_TZjPm3s_JEtoRMtGwTz2pIVXzBWkiphKKC3Hhvv0hFafpnAUBOx3Xh3Wg1rKU_WYF_9WEL3MkoT5q5euWVCvDP_sVxpr6J8PAtdHW2RTGrcGUjP4TABc_K-UJzABbaegjdl7Lgt-PHqkMImpEd6vo-oq4FkujU-PEBsFxtfLKOfrqSlKhqwZOmT9kHC-TL2z_33iV1zc4PyhckWglDGJQkTFo7F6clZQhFECh8P9WBo8vCUIEYETYVxk5IrGaxfc',
      imageAlt: 'Banda Los Reyes',
      tag: 'Banda Sinaloense',
      rating: 4.9,
      name: 'Banda Los Reyes',
      location: 'Jalisco, MX',
      availability: 'Música Sinaloense',
      isFeatured: true
    },
    {
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9uqGh4gewnFEoovP1fuHPQMLAAo7DukmY0EkWYU2Cor_CdspwyW97x1d-MfyItGXH5ushLKk86XZ2gCBGK6C3_ediZiBnWTqXjRLY-CxNTwdjfrooE_c7-ctaFxlTAXXDaqhtpK4VCDC_1G8Z7z0Ylmvsx52D9sppnm0YumVh0DTRu0rQryqzOyOLN25obm16uWwblhXMbeir_hUfv2ShjwtqaG9x-HUnouaQ4CXMWMmBqCAl9NhwAQW9B5PU7JoEguyTttbBVr8',
      imageAlt: 'Los Alegres Sierreños',
      tag: 'Sierreño',
      rating: 4.8,
      name: 'Los Alegres Sierreños',
      location: 'Sinaloa, MX',
      availability: 'Fechas Limitadas',
      isFeatured: false
    }
  ];

  posts: any[] = [
    {
      authorName: 'Banda Los Reyes',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3KjImT7Com_TZjPm3s_JEtoRMtGwTz2pIVXzBWkiphKKC3Hhvv0hFafpnAUBOx3Xh3Wg1rKU_WYF_9WEL3MkoT5q5euWVCvDP_sVxpr6J8PAtdHW2RTGrcGUjP4TABc_K-UJzABbaegjdl7Lgt-PHqkMImpEd6vo-oq4FkujU-PEBsFxtfLKOfrqSlKhqwZOmT9kHC-TL2z_33iV1zc4PyhckWglDGJQkTFo7F6clZQhFECh8P9WBo8vCUIEYETYVxk5IrGaxfc',
      timeAgo: 'Hace 2 horas',
      content: '¡Increíble noche en la Arena Monterrey! Gracias a todos los que nos acompañaron, la energía estuvo a otro nivel. 🎺✨',
      mediaUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn5YNsp8Swg0q0SGm8jeu6ZVz8b44-B9qtueXTHKEsUpFnI7e_9gllAAV_aCsHZHaiAVErKdwuzJM2YAcc9D-oS5mD8h1RMViV4ygLLhrdDICdoIuSwx7bgAwryuQYUYB_q-mVMx0as2Fa5Z1ac15xt0tEPFSuPUeuE1cENsVvyDipE4WTiCEMOz0Q58k8pGbChddOBHt8FEjAFqnXGYyQ2KusBph6WyCLRsuhcmRwGxTKyOJTgkCmN3o7iGcCkx4iiynHu6IWbxA',
      likes: 1240,
      comments: 85,
      tags: ['#ArenaMonterrey', '#EnVivo', '#MusicaNacional']
    },
    {
      authorName: 'Banda MS',
      authorAvatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop',
      timeAgo: 'Hace 4 horas',
      content: '¡Listos para cantar con el alma en Guadalajara! Ya se siente la vibra tapatía. ¿Qué canción quieren escuchar hoy? 🎙️🤠',
      mediaUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop',
      likes: 850,
      comments: 42,
      tags: ['#Tour2026', '#Guadalajara', '#Jalisco'],
      isVideo: true
    },
    {
      authorName: 'Carin León',
      authorAvatar: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=2070&auto=format&fit=crop',
      timeAgo: 'Hace 6 horas',
      content: '¡Qué gran recibimiento mi gente de Hermosillo! Increíble cantar en casa. Puro rugido del león. 🦁🔥',
      mediaUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecbb4ec?q=80&w=2070&auto=format&fit=crop',
      likes: 2100,
      comments: 118,
      tags: ['#Hermosillo', '#PuroLeon', '#Concierto']
    }
  ];

  eventsData = [
    {
      id: 'hacienda-san-javier',
      name: 'Boda en Hacienda San Javier',
      bandName: 'Mariachi Oro y Plata',
      date: '22 de Junio, 2026',
      locationName: 'Hacienda San Javier, Zapopan, Jalisco',
      googleMapsUrl: 'https://maps.google.com/?q=Hacienda+San+Javier,+Zapopan',
      mapCoords: { lat: 20.7011, lng: -103.4150 },
      details: 'Un evento de gala en los hermosos jardines de la Hacienda San Javier. Mariachi Oro y Plata deleitó con sones clásicos y canciones románticas de primer nivel en una velada mágica.',
      genre: 'Mariachi Tradicional de Gala',
      capacity: '300 invitados (Social Privado)',
      ratingAvg: '5.0',
      upcomingEvents: [
        {
          name: 'Gran Gala del Mariachi 2026',
          bands: 'Mariachi Vargas & Mariachi Oro y Plata',
          date: '12 de Julio, 2026',
          price: '$1,200 - $2,500 MXN'
        },
        {
          name: 'Noche de Sones y Tequila',
          bands: 'Mariachi Oro y Plata',
          date: '28 de Julio, 2026',
          price: '$850 MXN (Cupo Limitado)'
        }
      ],
      reviews: [
        {
          userName: 'Carlos Sánchez',
          userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop',
          rating: 5,
          content: 'Contratamos al Mariachi Oro y Plata para nuestra boda y no podríamos estar más felices. Llegaron puntuales, lucían impecables y el repertorio fue espectacular. Todos los invitados quedaron encantados. ¡100% recomendados!',
          timeAgo: 'Hace 1 día',
          likes: 12,
          isLiked: false
        },
        {
          userName: 'Sofía Lara',
          userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
          rating: 5,
          content: '¡Espectacular! La novia lloró con el Son de la Negra. Tienen una afinación y presencia impecables en escena.',
          timeAgo: 'Hace 2 días',
          likes: 5,
          isLiked: false
        }
      ]
    },
    {
      id: 'xv-anos-salon-imperial',
      name: 'XV Años de Valeria',
      bandName: 'Los Alegres Sierreños',
      date: '20 de Junio, 2026',
      locationName: 'Salón Imperial, Culiacán, Sinaloa',
      googleMapsUrl: 'https://maps.google.com/?q=Salon+Imperial,+Culiacan',
      mapCoords: { lat: 24.8090, lng: -107.3940 },
      details: 'La celebración de XV años en el prestigiado Salón Imperial con la música en vivo y el ambiente sierreño por Los Alegres Sierreños que puso a bailar a toda la juventud.',
      genre: 'Sierreño Sinaloense / Norteño',
      capacity: '400 invitados (Fiesta de Gala)',
      ratingAvg: '4.5',
      upcomingEvents: [
        {
          name: 'Baile de Cierre de Verano',
          bands: 'Los Alegres Sierreños & Grupo Firme',
          date: '30 de Julio, 2026',
          price: '$500 MXN'
        },
        {
          name: 'Gran Tardeada Sierreña',
          bands: 'Los Alegres Sierreños',
          date: '15 de Agosto, 2026',
          price: '$300 MXN'
        }
      ],
      reviews: [
        {
          userName: 'María Fernanda',
          userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop',
          rating: 4,
          content: 'Ambientaron súper bien la fiesta. Tienen mucho carisma y tocan excelente. Lo único es que hubo un ligero retraso al iniciar, pero lo compensaron con creces con su música.',
          timeAgo: 'Hace 3 días',
          likes: 8,
          isLiked: false
        },
        {
          userName: 'Juan González',
          userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
          rating: 5,
          content: '¡Qué gran ambiente sierreño! Pusieron a bailar a todos los chavos. El requinto toca de manera increíble y tienen mucha energía.',
          timeAgo: 'Hace 4 días',
          likes: 15,
          isLiked: false
        }
      ]
    },
    {
      id: 'feria-monterrey-2026',
      name: 'Feria Monterrey 2026',
      bandName: 'Banda Los Reyes',
      date: '18 de Junio, 2026',
      locationName: 'Arena Monterrey, Monterrey, N.L.',
      googleMapsUrl: 'https://maps.google.com/?q=Arena+Monterrey',
      mapCoords: { lat: 25.6806, lng: -100.2872 },
      details: 'Concierto masivo en la Arena Monterrey como parte de su gira nacional. Con más de 15,000 asistentes que corearon todos sus éxitos de principio a fin.',
      genre: 'Banda Sinaloense de Viento',
      capacity: '15,000+ asistentes (Masivo)',
      ratingAvg: '5.0',
      upcomingEvents: [
        {
          name: 'Festival de la Banda Sinaloense',
          bands: 'Banda Los Reyes, Banda MS & Carin León',
          date: '05 de Agosto, 2026',
          price: '$700 - $3,800 MXN'
        },
        {
          name: 'Noche de Acordeones y Tuba',
          bands: 'Banda Los Reyes & Grupo Frontera',
          date: '22 de Agosto, 2026',
          price: '$600 - $2,900 MXN'
        }
      ],
      reviews: [
        {
          userName: 'Andrés López',
          userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop',
          rating: 5,
          content: 'La mejor noche de mi vida, tocaron más de 3 horas seguidas sin parar y la Arena Monterrey retumbaba con la tuba.',
          timeAgo: 'Hace 5 días',
          likes: 42,
          isLiked: false
        }
      ]
    }
  ];

  // Tab & Search States
  activeTab = signal<'posts' | 'reviews'>('posts');
  searchQuery = signal<string>('');
  searchExpanded = signal<boolean>(false);
  selectedEvent = signal<any | null>(null);

  // Filter States
  postsSortBy = signal<'popular' | 'newest' | 'comments'>('newest');
  postsDateFilter = signal<'all' | 'today' | 'week'>('all');
  postsMediaFilter = signal<'all' | 'image' | 'video'>('all');
  reviewsSortBy = signal<'stars' | 'newest'>('newest');
  reviewsCategoryFilter = signal<'all' | 'wedding' | 'xv' | 'concert'>('all');
  reviewsLocationFilter = signal<'all' | 'Guadalajara' | 'Monterrey' | 'CDMX'>('all');

  // Floating Recommendations Widget States
  showRecommendations = signal<boolean>(false);
  recommendedIndex = signal<number>(0);
  selectedRecommendedItem = signal<any | null>(null);

  recommendedEvents = [
    {
      name: 'Mariachi Monumental de Cocula',
      tag: 'Gala Mariachi',
      rating: 4.9,
      location: 'Teatro Degollado, Guadalajara',
      date: '15 de Julio, 2026',
      availability: 'Boletos en Taquilla',
      imageUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=600&auto=format&fit=crop',
      details: 'La gala anual del Mariachi Monumental en el majestuoso Teatro Degollado, presentando sones y jarabes tradicionales.'
    },
    {
      name: 'Carin León - Tour Rugido',
      tag: 'Regional Mexicano',
      rating: 5.0,
      location: 'Estadio Banorte, Monterrey',
      date: '28 de Julio, 2026',
      availability: 'Venta General Abierta',
      imageUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecbb4ec?q=80&w=600&auto=format&fit=crop',
      details: 'Un espectacular concierto masivo en Monterrey con todos los éxitos de Carin León en vivo.'
    }
  ];

  // Stories Modal / Live chat comments state (using signals for Zoneless compatibility)
  activeStory = signal<any>(null);
  activeLightboxPost = signal<any | null>(null); // Global post lightbox state
  isSideCommentsOpen = signal<boolean>(false);
  showFooterComments = signal<boolean>(false);
  activeStoryComments = signal<any[]>([]);
  newCommentText = signal<string>('');
  isStoryLiked = signal<boolean>(false);
  storyLikeCount = signal<number>(0);

  showComment = signal<boolean>(false);
  isCommentLeaving = signal<boolean>(false);
  currentFooterComment = signal<any>(null);
  footerCommentIndex = 0;

  videoActive = signal<boolean>(true);
  showNavigationHint = signal<boolean>(false);
  cardAnimationClass = signal<string>('card-anim-entry');
  slideDirection = signal<'next' | 'prev'>('next');
  private animToggle = false;

  hasLearnedNavigation = false; // Activates auto-advance once user has navigated 3 times forward
  manualNavigationCount = 0; // Counts sequential forward manual navigations
  hasPassedFirstStory = false; // Tracks if the user has navigated beyond the initial story view

  private commentsTimer: any = null;
  private commentsInterval: any = null;
  private navigationHintTimer: any = null;

  mockComments = [
    { userName: 'Juan González', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop', text: '¡Qué gran concierto! Estuvo espectacular 🚀🔥', likes: 245, time: '2 min', isLiked: false },
    { userName: 'Sofía Lara', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop', text: 'La mejor banda de México sin duda alguna 👑', likes: 189, time: '5 min', isLiked: false },
    { userName: 'Diego Mendoza', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop', text: 'Ya tengo mis boletos para la próxima fecha, ¡no puedo esperar!', likes: 154, time: '12 min', isLiked: false },
    { userName: 'Valeria Rubio', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop', text: 'El solo de trompeta en vivo es de otro mundo 🎺❤️', likes: 98, time: '15 min', isLiked: false },
    { userName: 'Carlos K.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop', text: 'Increíble producción, se escucha impecable.', likes: 72, time: '30 min', isLiked: false }
  ];

  // Keyboard Navigation: Esc to close, Left/Right arrow keys to navigate
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.activeStory()) {
      if (event.key === 'ArrowLeft') {
        this.navigateStory(-1);
      } else if (event.key === 'ArrowRight') {
        this.navigateStory(1);
      } else if (event.key === 'Escape') {
        this.closeStory();
      }
    } else if (this.activeLightboxPost()) {
      if (event.key === 'Escape') {
        this.closeGlobalLightbox();
      }
    } else if (this.selectedEvent()) {
      if (event.key === 'Escape') {
        this.closeEventDetails();
      }
    } else if (this.selectedRecommendedItem()) {
      if (event.key === 'Escape') {
        this.selectedRecommendedItem.set(null);
      }
    }
  }

  // Swipe Navigation (Mobile)
  private touchStartX = 0;
  private touchStartY = 0;

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    this.handleSwipe(this.touchStartX, touchEndX, this.touchStartY, touchEndY);
  }

  handleSwipe(startX: number, endX: number, startY: number, endY: number) {
    const thresholdX = 40; // minimum distance for horizontal swipe
    const thresholdY = 65; // maximum vertical movement allowed
    
    const diffX = endX - startX;
    const diffY = Math.abs(endY - startY);

    if (Math.abs(diffX) > thresholdX && diffY < thresholdY) {
      if (diffX > 0) {
        // Swipe Right -> Go to previous story
        this.navigateStory(-1);
      } else {
        // Swipe Left -> Go to next story
        this.navigateStory(1);
      }
    }
  }

  private clearAllTimers() {
    if (this.commentsTimer) {
      clearTimeout(this.commentsTimer);
      this.commentsTimer = null;
    }
    if (this.commentsInterval) {
      clearTimeout(this.commentsInterval);
      this.commentsInterval = null;
    }
    if (this.navigationHintTimer) {
      clearTimeout(this.navigationHintTimer);
      this.navigationHintTimer = null;
    }
  }

  openStory(story: any, fromNavigation = false) {
    this.videoActive.set(false); // Temporarily destroy video player to force reload
    this.showNavigationHint.set(false);

    if (!fromNavigation) {
      this.cardAnimationClass.set('card-anim-entry');
      this.hasLearnedNavigation = false;
      this.manualNavigationCount = 0;
      this.hasPassedFirstStory = false;
    }

    this.activeStory.set(story);
    this.isSideCommentsOpen.set(false);
    this.showFooterComments.set(false);
    this.showComment.set(false);
    this.isCommentLeaving.set(false);
    this.currentFooterComment.set(null);
    this.footerCommentIndex = 0;
    this.isStoryLiked.set(false);
    this.storyLikeCount.set(Math.floor(Math.random() * 200) + 120);
    
    // Copy default comments to avoid modifying the original globally
    this.activeStoryComments.set(JSON.parse(JSON.stringify(this.mockComments)));

    this.clearAllTimers();

    // After 2.5 seconds, start showing live chat footer comments 1-by-1
    this.commentsTimer = setTimeout(() => {
      this.showFooterComments.set(true);
      this.startStreamingComments();
    }, 2500);

    // After 20 seconds, show the navigation hint if they haven't learned it yet and haven't passed the first story
    this.navigationHintTimer = setTimeout(() => {
      if (!this.hasLearnedNavigation && !this.hasPassedFirstStory) {
        this.showNavigationHint.set(true);
      }
    }, 20000);

    // Recreate video player after a tiny delay
    setTimeout(() => {
      this.videoActive.set(true);
    }, 50);
  }

  startStreamingComments() {
    this.footerCommentIndex = 0;
    this.streamNextComment();
  }

  streamNextComment() {
    if (this.isSideCommentsOpen() || !this.activeStory()) {
      return;
    }

    const comments = this.activeStoryComments();
    if (!comments || comments.length === 0) {
      return;
    }

    const nextComment = comments[this.footerCommentIndex % comments.length];
    
    // Enter animation: set comment and show it
    this.currentFooterComment.set(nextComment);
    this.showComment.set(true);
    this.isCommentLeaving.set(false);
    this.footerCommentIndex++;

    this.clearAllTimers();

    // After 3.5 seconds, start exit animation (slide up and fade out)
    this.commentsTimer = setTimeout(() => {
      this.isCommentLeaving.set(true);
      
      // After 500ms (exit animation finishes), hide it completely
      this.commentsInterval = setTimeout(() => {
        this.showComment.set(false);
        this.currentFooterComment.set(null);
        
        // Wait a tiny bit (150ms) for Angular to remove the element from DOM, then display next comment
        this.commentsTimer = setTimeout(() => {
          this.streamNextComment();
        }, 150);
      }, 500);
    }, 3500);
  }

  openSideComments() {
    this.isSideCommentsOpen.set(true);
    this.showFooterComments.set(false);
    this.showComment.set(false);
    this.clearAllTimers();
  }

  closeSideComments() {
    this.isSideCommentsOpen.set(false);
    this.showFooterComments.set(false);
    this.showComment.set(false);
    this.currentFooterComment.set(null);
    this.clearAllTimers();
  }

  closeStory() {
    this.activeStory.set(null);
    this.isSideCommentsOpen.set(false);
    this.showFooterComments.set(false);
    this.showComment.set(false);
    this.clearAllTimers();
  }

  toggleStoryLike(event: Event) {
    event.stopPropagation();
    this.isStoryLiked.update(liked => !liked);
    if (this.isStoryLiked()) {
      this.storyLikeCount.update(count => count + 1);
    } else {
      this.storyLikeCount.update(count => count - 1);
    }
  }

  shareStory(event: Event) {
    event.stopPropagation();
    alert('¡Enlace de historia copiado al portapapeles!');
  }

  likeComment(comment: any) {
    this.activeStoryComments.update(comments => 
      comments.map(c => {
        if (c === comment) {
          const isLiked = !c.isLiked;
          return {
            ...c,
            isLiked,
            likes: isLiked ? c.likes + 1 : c.likes - 1
          };
        }
        return c;
      })
    );
  }

  submitComment(event: Event) {
    event.preventDefault();
    const text = this.newCommentText().trim();
    if (!text) return;
    
    const commentObj = {
      userName: 'Tú',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
      text: text,
      likes: 0,
      time: 'Ahora mismo',
      isLiked: false
    };

    this.activeStoryComments.update(comments => [...comments, commentObj]);
    this.newCommentText.set('');
  }

  navigateStory(direction: number, event?: Event, isAuto = false) {
    if (event) {
      event.stopPropagation();
    }

    this.hasPassedFirstStory = true; // Mark that user has moved beyond the first story view

    if (!isAuto) {
      if (direction === 1) {
        this.manualNavigationCount++;
        if (this.manualNavigationCount >= 3) {
          this.hasLearnedNavigation = true;
        }
      } else if (direction === -1) {
        this.manualNavigationCount = 0;
        this.hasLearnedNavigation = false; // Reset/deactivate auto-advance when going backward
      }
    }

    const current = this.activeStory();
    if (!current) return;

    const index = this.stories.indexOf(current);
    if (index === -1) return;

    let nextIndex = index + direction;
    if (nextIndex < 0) {
      nextIndex = this.stories.length - 1;
    } else if (nextIndex >= this.stories.length) {
      nextIndex = 0;
    }

    this.slideDirection.set(direction === 1 ? 'next' : 'prev');

    // Update card animation class with A/B suffixes to force animation refresh
    this.animToggle = !this.animToggle;
    const suffix = this.animToggle ? 'a' : 'b';
    const dir = direction === 1 ? 'next' : 'prev';
    this.cardAnimationClass.set(`card-anim-${dir}-${suffix}`);

    const nextStory = this.stories[nextIndex];
    this.openStory(nextStory, true);
  }

  onCardClick(event: MouseEvent) {
    // If the click is on an interactive element, do not navigate
    const target = event.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('form') ||
      target.closest('textarea') ||
      target.closest('.pointer-events-auto') ||
      target.closest('.material-symbols-outlined')
    ) {
      return;
    }

    // The learning flag will be managed inside navigateStory
    this.manualNavigationCount = this.manualNavigationCount;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;

    if (clickX < width * 0.3) {
      // Clicked left 30% -> Previous story
      this.navigateStory(-1);
    } else {
      // Clicked right 70% -> Next story
      this.navigateStory(1);
    }
  }

  onVideoEnded() {
    if (this.hasLearnedNavigation) {
      this.navigateStory(1, undefined, true); // Auto-advance!
    } else {
      this.showNavigationHint.set(true); // Show advice at the end of the video if they haven't learned yet!
    }
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

  onPostLikeToggle(post: any, isLiked: boolean) {
    post.isLiked = isLiked;
    post.likes = isLiked ? post.likes + 1 : post.likes - 1;
  }

  onPostCommentAdded(post: any, newComment: any) {
    if (!post.commentsList) {
      post.commentsList = [];
    }
    post.commentsList.push(newComment);
    post.comments = post.commentsList.length;
  }

  toggleLightboxLike() {
    const post = this.activeLightboxPost();
    if (!post) return;
    post.isLiked = !post.isLiked;
    post.likes = post.isLiked ? post.likes + 1 : post.likes - 1;
    // Re-set to trigger template updates
    this.activeLightboxPost.set({ ...post });
    
    // Update parent reference
    const index = this.posts.findIndex(p => p.authorName === post.authorName && p.content === post.content);
    if (index !== -1) {
      this.posts[index] = post;
    }
  }

  submitLightboxComment(event: Event) {
    event.preventDefault();
    const text = this.newCommentText().trim();
    if (!text) return;

    const post = this.activeLightboxPost();
    if (!post) return;

    const commentObj = {
      userName: 'Tú',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
      text: text,
      time: 'Ahora mismo'
    };

    if (!post.commentsList) {
      post.commentsList = [];
    }
    post.commentsList.push(commentObj);
    post.comments = post.commentsList.length;

    this.activeLightboxPost.set({ ...post });

    const index = this.posts.findIndex(p => p.authorName === post.authorName && p.content === post.content);
    if (index !== -1) {
      this.posts[index] = post;
    }

    this.newCommentText.set('');
  }

  // Getters for filtered and grouped feeds with sorting and filters
  get filteredPosts() {
    const query = this.searchQuery().trim().toLowerCase();
    
    // 1. Filter by query
    let result = this.posts.filter(post => {
      if (!query) return true;
      return (
        post.authorName.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        (post.tags && post.tags.some((t: string) => t.toLowerCase().includes(query)))
      );
    });

    // 2. Filter by date
    const dateFilter = this.postsDateFilter();
    if (dateFilter === 'today') {
      result = result.filter(post => {
        const time = post.timeAgo.toLowerCase();
        return time.includes('hora') || time.includes('minuto') || time.includes('ahora');
      });
    } else if (dateFilter === 'week') {
      result = result.filter(post => {
        const time = post.timeAgo.toLowerCase();
        return time.includes('hora') || time.includes('minuto') || time.includes('ahora') || time.includes('día');
      });
    }

    // 3. Filter by media format
    const mediaFilter = this.postsMediaFilter();
    if (mediaFilter === 'image') {
      result = result.filter(post => !post.isVideo);
    } else if (mediaFilter === 'video') {
      result = result.filter(post => post.isVideo);
    }

    // 4. Sort by popularity, newest or comments count
    const sortBy = this.postsSortBy();
    if (sortBy === 'popular') {
      result.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'comments') {
      result.sort((a, b) => b.comments - a.comments);
    }

    return result;
  }

  get groupedReviews() {
    const query = this.searchQuery().trim().toLowerCase();
    const allReviews: any[] = [];
    
    this.eventsData.forEach(event => {
      event.reviews.forEach(review => {
        allReviews.push({
          ...review,
          eventId: event.id,
          eventName: event.name,
          bandName: event.bandName,
          locationName: event.locationName,
          date: event.date
        });
      });
    });

    // 1. Filter by query
    let filtered = allReviews.filter(r => {
      if (!query) return true;
      return (
        r.userName.toLowerCase().includes(query) ||
        r.content.toLowerCase().includes(query) ||
        r.bandName.toLowerCase().includes(query) ||
        r.eventName.toLowerCase().includes(query)
      );
    });

    // 2. Filter by category
    const category = this.reviewsCategoryFilter();
    if (category !== 'all') {
      filtered = filtered.filter(r => {
        const name = r.eventName.toLowerCase();
        if (category === 'wedding') return name.includes('boda') || name.includes('hacienda');
        if (category === 'xv') return name.includes('xv') || name.includes('quince');
        if (category === 'concert') return name.includes('feria') || name.includes('concierto') || name.includes('arena');
        return true;
      });
    }

    // 3. Filter by location
    const location = this.reviewsLocationFilter();
    if (location !== 'all') {
      filtered = filtered.filter(r => {
        return r.locationName.toLowerCase().includes(location.toLowerCase());
      });
    }

    // 4. Sort by stars or newest
    const sortBy = this.reviewsSortBy();
    if (sortBy === 'stars') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    // 5. Group by band
    const groups: { [key: string]: { bandName: string; avatar: string; reviews: any[] } } = {};
    const bandAvatars: { [key: string]: string } = {
      'Mariachi Oro y Plata': 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9uqGh4gewnFEoovP1fuHPQMLAAo7DukmY0EkWYU2Cor_CdspwyW97x1d-MfyItGXH5ushLKk86XZ2gCBGK6C3_ediZiBnWTqXjRLY-CxNTwdjfrooE_c7-ctaFxlTAXXDaqhtpK4VCDC_1G8Z7z0Ylmvsx52D9sppnm0YumVh0DTRu0rQryqzOyOLN25obm16uWwblhXMbeir_hUfv2ShjwtqaG9x-HUnouaQ4CXMWMmBqCAl9NhwAQW9B5PU7JoEguyTttbBVr8',
      'Los Alegres Sierreños': 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9uqGh4gewnFEoovP1fuHPQMLAAo7DukmY0EkWYU2Cor_CdspwyW97x1d-MfyItGXH5ushLKk86XZ2gCBGK6C3_ediZiBnWTqXjRLY-CxNTwdjfrooE_c7-ctaFxlTAXXDaqhtpK4VCDC_1G8Z7z0Ylmvsx52D9sppnm0YumVh0DTRu0rQryqzOyOLN25obm16uWwblhXMbeir_hUfv2ShjwtqaG9x-HUnouaQ4CXMWMmBqCAl9NhwAQW9B5PU7JoEguyTttbBVr8',
      'Banda Los Reyes': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3KjImT7Com_TZjPm3s_JEtoRMtGwTz2pIVXzBWkiphKKC3Hhvv0hFafpnAUBOx3Xh3Wg1rKU_WYF_9WEL3MkoT5q5euWVCvDP_sVxpr6J8PAtdHW2RTGrcGUjP4TABc_K-UJzABbaegjdl7Lgt-PHqkMImpEd6vo-oq4FkujU-PEBsFxtfLKOfrqSlKhqwZOmT9kHC-TL2z_33iV1zc4PyhckWglDGJQkTFo7F6clZQhFECh8P9WBo8vCUIEYETYVxk5IrGaxfc'
    };

    filtered.forEach(review => {
      const band = review.bandName;
      if (!groups[band]) {
        groups[band] = {
          bandName: band,
          avatar: bandAvatars[band] || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=100&auto=format&fit=crop',
          reviews: []
        };
      }
      groups[band].reviews.push(review);
    });

    return Object.values(groups);
  }

  // Get active recommendations depending on tab
  get activeRecommendations() {
    if (this.activeTab() === 'posts') {
      return this.recommendedBands.map(item => ({
        type: 'band',
        name: item.name,
        tag: item.tag,
        rating: item.rating,
        location: item.location,
        availability: item.availability,
        imageUrl: item.imageUrl,
        details: `Disfruta del auténtico repertorio de ${item.name}. Disponible para presentaciones en todo el territorio nacional y giras internacionales.`,
        isFeatured: item.isFeatured
      }));
    } else {
      return this.recommendedEvents.map(item => ({
        type: 'event',
        name: item.name,
        tag: item.tag,
        rating: item.rating,
        location: item.location,
        availability: item.availability,
        imageUrl: item.imageUrl,
        details: item.details,
        isFeatured: true
      }));
    }
  }

  // Recommendations Popup navigation & swipe
  navigateRecommendation(direction: number) {
    const list = this.activeRecommendations;
    if (list.length === 0) return;
    let nextIndex = this.recommendedIndex() + direction;
    if (nextIndex < 0) {
      nextIndex = list.length - 1;
    } else if (nextIndex >= list.length) {
      nextIndex = 0;
    }
    this.recommendedIndex.set(nextIndex);
  }

  private recTouchStartX = 0;
  private recTouchStartY = 0;

  onTouchStartRec(event: TouchEvent) {
    this.recTouchStartX = event.touches[0].clientX;
    this.recTouchStartY = event.touches[0].clientY;
  }

  onTouchEndRec(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const thresholdX = 45;
    const thresholdY = 65;
    const diffX = touchEndX - this.recTouchStartX;
    const diffY = Math.abs(touchEndY - this.recTouchStartY);

    if (Math.abs(diffX) > thresholdX && diffY < thresholdY) {
      if (diffX > 0) {
        this.navigateRecommendation(-1);
      } else {
        this.navigateRecommendation(1);
      }
    }
  }

  selectRecommendedItem(item: any) {
    this.selectedRecommendedItem.set(item);
    this.showRecommendations.set(false);
  }

  // Event detail modal control methods
  openEventDetails(eventId: string) {
    const event = this.eventsData.find(e => e.id === eventId);
    if (event) {
      this.selectedEvent.set(event);
    }
  }

  closeEventDetails() {
    this.selectedEvent.set(null);
  }

  onReviewLikeToggle(review: any, isLiked: boolean) {
    const event = this.eventsData.find(e => e.id === review.eventId);
    if (event) {
      const r = event.reviews.find((rev: any) => rev.userName === review.userName && rev.content === review.content);
      if (r) {
        r.isLiked = isLiked;
        r.likes = isLiked ? (r.likes || 0) + 1 : Math.max(0, (r.likes || 0) - 1);
        
        // Update selectedEvent signal if it displays this event
        const currentEvent = this.selectedEvent();
        if (currentEvent && currentEvent.id === event.id) {
          this.selectedEvent.set({ ...event });
        }
      }
    }
  }

  getSafeMapUrl(url: string): SafeResourceUrl {
    const query = url.split('?q=')[1] || '';
    const embedUrl = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}
