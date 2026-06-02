import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BandCard } from '../../shared/band-card/band-card';
import { PostCard } from '../../shared/post-card/post-card';
import { StoryCard } from '../../shared/story-card/story-card';
import { LayoutService } from '../../core/services/layout.service';
import { ReviewCard } from '../../shared/review-card/review-card';

@Component({
  selector: 'app-home',
  imports: [CommonModule, BandCard, PostCard, ReviewCard, StoryCard],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  @ViewChild('storyScroll') storyScroll!: ElementRef<HTMLElement>;
  private readonly layoutService = inject(LayoutService);

  ngOnInit() {
    this.layoutService.setPageTitle('PANEL DE INICIO');
  }

  scrollStories(direction: number) {
    const scrollAmount = 400; // Desplaza unos 4 elementos a la vez
    this.storyScroll.nativeElement.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth'
    });
  }

  stories = [
    {
      authorName: 'Banda El Recodo',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3KjImT7Com_TZjPm3s_JEtoRMtGwTz2pIVXzBWkiphKKC3Hhvv0hFafpnAUBOx3Xh3Wg1rKU_WYF_9WEL3MkoT5q5euWVCvDP_sVxpr6J8PAtdHW2RTGrcGUjP4TABc_K-UJzABbaegjdl7Lgt-PHqkMImpEd6vo-oq4FkujU-PEBsFxtfLKOfrqSlKhqwZOmT9kHC-TL2z_33iV1zc4PyhckWglDGJQkTFo7F6clZQhFECh8P9WBo8vCUIEYETYVxk5IrGaxfc',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop',
      isVideo: true
    },
    {
      authorName: 'Mariachi Vargas',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9uqGh4gewnFEoovP1fuHPQMLAAo7DukmY0EkWYU2Cor_CdspwyW97x1d-MfyItGXH5ushLKk86XZ2gCBGK6C3_ediZiBnWTqXjRLY-CxNTwdjfrooE_c7-ctaFxlTAXXDaqhtpK4VCDC_1G8Z7z0Ylmvsx52D9sppnm0YumVh0DTRu0rQryqzOyOLN25obm16uWwblhXMbeir_hUfv2ShjwtqaG9x-HUnouaQ4CXMWMmBqCAl9NhwAQW9B5PU7JoEguyTttbBVr8',
      thumbnailUrl: 'https://images.unsplash.com/photo-1514525253344-f2546059a473?q=80&w=1964&auto=format&fit=crop',
      isVideo: false
    },
    {
      authorName: 'Los Tigres del Norte',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-pQpQ5q9YwQfH4J-0w9i2F5wOQ6H5zL6v7-X5k5R9g8-x5z-vR7w',
      thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
      isVideo: true
    },
    {
      authorName: 'Grupo Firme',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_p9uH-0w9i2F5wOQ6H5zL6v7-X5k5R9g8-x5z-vR7w',
      thumbnailUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2070&auto=format&fit=crop',
      isVideo: true
    },
    {
      authorName: 'Christian Nodal',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_p9uH-0w9i2F5wOQ6H5zL6v7-X5k5R9g8-x5z-vR7w',
      thumbnailUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop',
      isVideo: false
    },
    {
      authorName: 'Banda MS',
      authorAvatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop',
      isVideo: true
    },
    {
      authorName: 'Carin León',
      authorAvatar: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=2070&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecbb4ec?q=80&w=2070&auto=format&fit=crop',
      isVideo: true
    },
    {
      authorName: 'Natanael Cano',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=2070&auto=format&fit=crop',
      isVideo: true
    },
    {
      authorName: 'Peso Pluma',
      authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1974&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop',
      isVideo: true
    },
    {
      authorName: 'Julión Álvarez',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop',
      isVideo: false
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

  posts = [
    {
      authorName: 'Banda Los Reyes',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3KjImT7Com_TZjPm3s_JEtoRMtGwTz2pIVXzBWkiphKKC3Hhvv0hFafpnAUBOx3Xh3Wg1rKU_WYF_9WEL3MkoT5q5euWVCvDP_sVxpr6J8PAtdHW2RTGrcGUjP4TABc_K-UJzABbaegjdl7Lgt-PHqkMImpEd6vo-oq4FkujU-PEBsFxtfLKOfrqSlKhqwZOmT9kHC-TL2z_33iV1zc4PyhckWglDGJQkTFo7F6clZQhFECh8P9WBo8vCUIEYETYVxk5IrGaxfc',
      timeAgo: 'Hace 2 horas',
      content: '¡Increíble noche en la Arena Monterrey! Gracias a todos los que nos acompañaron, la energía estuvo a otro nivel. 🎺✨',
      mediaUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn5YNsp8Swg0q0SGm8jeu6ZVz8b44-B9qtueXTHKEsUpFnI7e_9gllAAV_aCsHZHaiAVErKdwuzJM2YAcc9D-oS5mD8h1RMViV4ygLLhrdDICdoIuSwx7bgAwryuQYUYB_q-mVMx0as2Fa5Z1ac15xt0tEPFSuPUeuE1cENsVvyDipE4WTiCEMOz0Q58k8pGbChddOBHt8FEjAFqnXGYyQ2KusBph6WyCLRsuhcmRwGxTKyOJTgkCmN3o7iGcCkx4iiynHu6IWbxA',
      likes: 1240,
      comments: 85
    }
  ];

  reviews = [
    {
      userName: 'Carlos Sánchez',
      userAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHmOKfsdeDk97RkFYA82JzuIe_TkK0xot_uMkINkxsobVv9lZln3uk5hy5nhpB71kyLOJzytl4SJggaFdNvA2H3mYv12flzxqody7GmSYbuGC1zhEyqOXOAZQmZqJ3ChDntHBQ6UuKwLFux4SfdbaJRTUDuMSU9gZgIlz-vse6ksoS6U2P7vBi_u1Lc1ErwyS3ciIrzGpfJ7V51r8hz6b6IOymxCHPv3BvrOMjbXIq8h6YhAgxoZbn_8gwnBtJvc6IrWfLJA6X3AY',
      eventName: 'Boda en Hacienda San Javier',
      bandName: 'Mariachi Oro y Plata',
      rating: 5,
      content: 'Contratamos al Mariachi Oro y Plata para nuestra boda y no podríamos estar más felices. Llegaron puntuales, lucían impecables y el repertorio fue espectacular. Todos los invitados quedaron encantados. ¡100% recomendados!',
      timeAgo: 'Hace 1 día'
    },
    {
      userName: 'María Fernanda',
      userAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUeSzZiUuYrE7_MxZkC0SwpquhmDGo3bokVZPPHVtxTjKdKBkVaiCk_jmwNQrBBm6_2_BC9dRZsvEYXKyuf2m34lBoU5LnMW3l7M548wUzjOwoCbXliXJyWDVtdFwr0CuhnnBnj40LAVpr_cQtXG_02lEvdPnpexnUmI85Pe1U5KdLIYnbzvL7VezcK9stA0GTTkEFDy5wRXMt-fTr4S41SiyCD4bhWywvJlyzlLMKkS3d-FZDXAGcK9G-joRTJ0sobLNE5dL07ZU',
      eventName: 'XV Años',
      bandName: 'Los Alegres Sierreños',
      rating: 4,
      content: 'Ambientaron súper bien la fiesta. Tienen mucho carisma y tocan excelente. Lo único es que hubo un ligero retraso al iniciar, pero lo compensaron con creces con su música.',
      timeAgo: 'Hace 3 días'
    }
  ];
}
