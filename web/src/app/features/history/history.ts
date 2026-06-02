import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventCard, EventCardMode } from '../../shared/event-card/event-card';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-history',
  imports: [CommonModule, EventCard],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class History implements OnInit {
  private readonly layoutService = inject(LayoutService);

  ngOnInit() {
    this.layoutService.setPageTitle('HISTORIAL DE EVENTOS');
  }
  historyEvents = [
    {
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACaDvKmSjK2lglHymQ5Unq9Zaqh0o2JNeiAME-gV5TcqxjNhMUNcirm25Xx34dQGbAkBKtP5Qt4dALz_NZw_XPT3tNU2UFoVPjWvdcjclSg1VP0ZdxYdgzdseTIwE55PBdZ4mB8pYTfGm7HZblKmAiZxRJBamjo-2MEPPMZ7BtlziBuMbg7pM-FfhJExpD-fXb7P3lkHB7n86ZmR_wl7GSVGEcyG3NQt2vNH9tqL4ISoxG7vllwaBzo43tWZ5hy1QiIFHb8TG_DTc',
      imageAlt: 'Gran Gala Sinaloense',
      date: '15 Oct 2023',
      title: 'Gran Gala Sinaloense',
      location: 'Arena Ciudad de México',
      mode: 'history_review' as EventCardMode,
      rating: 0
    },
    {
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5M4p1Igsc2udJJxuXpZln6YBNBqwQuq-8x5MZM2x2ui93WJ2jD2UR1efvr5dfcEAjQCyiYPGhfcHwGMOTZDAGbVm7bb0Hb040Or1TSiN0J8HiMlASg1szT9QjSLXd1qN_JluFXyJyKqHaZUTXR8bMacejcuAGs3x4IrCmgRjzfFGPNbs0iT_J0UxE_dWgLsZErw95SOT3CNjaoPKu6pmynQtcfpLlokZXhdGaBjKRvgQ8YnOSRb9hu-Rcb0koVpFKP-hN5etoMus',
      imageAlt: 'Noche VIP Norteña',
      date: '02 Sep 2023',
      title: 'Noche VIP Norteña',
      location: 'Auditorio Telmex',
      mode: 'history_done' as EventCardMode,
      rating: 4.0
    }
  ];
}
