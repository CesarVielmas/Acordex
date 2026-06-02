import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BandCard } from '../../shared/band-card/band-card';
import { FilterPills } from '../../shared/filter-pills/filter-pills';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-cotizaciones',
  imports: [CommonModule, BandCard, FilterPills],
  templateUrl: './cotizaciones.html',
  styleUrl: './cotizaciones.scss'
})
export class Cotizaciones implements OnInit {
  private readonly layoutService = inject(LayoutService);

  ngOnInit() {
    this.layoutService.setPageTitle('CENTRO DE COTIZACIONES');
  }
  filters = ['Todos', 'Banda Sinaloense', 'Norteño', 'Sierreño', 'Mariachi'];
  activeFilter = 'Todos';

  featuredBand = {
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3KjImT7Com_TZjPm3s_JEtoRMtGwTz2pIVXzBWkiphKKC3Hhvv0hFafpnAUBOx3Xh3Wg1rKU_WYF_9WEL3MkoT5q5euWVCvDP_sVxpr6J8PAtdHW2RTGrcGUjP4TABc_K-UJzABbaegjdl7Lgt-PHqkMImpEd6vo-oq4FkujU-PEBsFxtfLKOfrqSlKhqwZOmT9kHC-TL2z_33iV1zc4PyhckWglDGJQkTFo7F6clZQhFECh8P9WBo8vCUIEYETYVxk5IrGaxfc',
    imageAlt: 'Banda Los Reyes',
    tag: 'Banda Sinaloense',
    rating: 4.9,
    name: 'Banda Los Reyes',
    location: 'Jalisco, MX',
    availability: 'Música Sinaloense',
    isFeatured: true
  };

  availableBands = [
    {
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGTzXGOwM0fUo8fobatQP_csh5xIPleLO5b57ApAqlX7TN1yWsrZTpnL-6SkHrpdk7NBQzz3DPS7BL4lBXftzw7VqzxkcSEWtdueklDc1nJiv1bvegapbwLxECTls6zwAX_5cfNGAHG58Ez4S4xVLs7mLq3jfA4nveJsdS8xVLzSNoB5QnQwJ3jK9eNEaDHJASVXRWrzWs-CQKUNfxcLWttCWz3DyGUU5pnsNZY18QhKC_7vkTtOh_kD3Zkp580SUKeJx5-UP7d2g',
      imageAlt: 'Banda Los Reyes',
      tag: 'Banda Sinaloense',
      rating: 4.9,
      name: 'Banda Los Reyes',
      location: 'Jalisco, MX',
      availability: 'Disponibilidad Alta',
      isFeatured: false
    },
    {
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkodu3Blt-cpZBXb0IfTTWiaKZZtN3aH1-Xv6ixlhPeE02PgrzoYpyavkCAoWsgcE9x6kEkZ65PvnYknoQdYC_y7pRktiV5jUfGfG8UPbUX3FRenWWH_kBnpgPMPw8NADWUBumks6n-04kx7a6ZSj-28VKrVx24L3tRSqKB-8l73rCglQxuWG3vTL1CWDetuScbjXQ4xBdda3ZT-YUkAG_cZQgdxZeE6ar3cDM6N9SZvOScE_bW6ltaWYH60yofxZG9IZj40ss6dU',
      imageAlt: 'Norteño del Sur',
      tag: 'Norteño',
      rating: 4.7,
      name: 'Norteño del Sur',
      location: 'Monterrey, MX',
      availability: 'Disponibilidad Media',
      isFeatured: false
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

  onFilterSelected(filter: string) {
    this.activeFilter = filter;
  }
}
