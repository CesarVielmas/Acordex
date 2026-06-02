import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCard } from '../../shared/event-card/event-card';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-events',
  imports: [CommonModule, EventCard],
  templateUrl: './events.html',
  styleUrl: './events.scss'
})
export class Events implements OnInit {
  private readonly layoutService = inject(LayoutService);

  ngOnInit() {
    this.layoutService.setPageTitle('PRÓXIMOS EVENTOS');
  }
  events = [
    {
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn5YNsp8Swg0q0SGm8jeu6ZVz8b44-B9qtueXTHKEsUpFnI7e_9gllAAV_aCsHZHaiAVErKdwuzJM2YAcc9D-oS5mD8h1RMViV4ygLLhrdDICdoIuSwx7bgAwryuQYUYB_q-mVMx0as2Fa5Z1ac15xt0tEPFSuPUeuE1cENsVvyDipE4WTiCEMOz0Q58k8pGbChddOBHt8FEjAFqnXGYyQ2KusBph6WyCLRsuhcmRwGxTKyOJTgkCmN3o7iGcCkx4iiynHu6IWbxA',
      imageAlt: 'Gala Sinaloense VIP',
      date: '15 Nov 2024',
      title: 'Gala Sinaloense VIP',
      location: 'Arena Monterrey'
    },
    {
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcCmK2O8LiUrz8S3Z8rVYTF2KvBXNugSwQp78x6VCyEoSHOEjhrbgcxJDaEsUf7Lwp9h_TCu7wPAKDh3doMxxvZpXPCJ19JrqNChF33SdUI2oNL9jCtEkecmtWz8d5d3H8cLjWh8qI7Jw340gN8lfFIrwddsM5JkQS8cuKCCHs9Y3134SiAJizMLvK0Mfzo-OzpTM__OIBfOPa8neU8PlkQ1T5Cb9sJ0j2t8ch-Mb0Ize8Fn6_-OwXKtYpVy7-PoVFRGhnqI_0oLY',
      imageAlt: 'Noche de Metales',
      date: '28 Nov 2024',
      title: 'Noche de Metales',
      location: 'Auditorio Telmex'
    },
    {
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSaiVdHEIuUMBk7BlrExFEg9DWu9YUu0dxfBLM1x1KWq_ZczzEGVBp260xE9HXMjE4_i3xhe5TRGaP4WWyVwSULBOEkBEYE69Jc68Fm2TgYO1tLUTbDZku72AIvZ07aWSc3v-LoRYSuNZCpDBWZKC3M6z2p7QicQi1JlOLYL2f89vHfGe1nfmn3TJSoAVC0F2DDNALF7W8emRTb8jE3oc1L_FOp4F65o9IPSP1X978d_wBHfw6daRDUoT3R3Yoif4R5At0a5PgnC4',
      imageAlt: 'Encuentro de Bandas',
      date: '05 Dic 2024',
      title: 'Encuentro de Bandas',
      location: 'Plaza de Toros México'
    }
  ];
}
