import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { BottomNav } from '../bottom-nav/bottom-nav';
import { UserProfileModal } from '../../shared/user-profile-modal/user-profile-modal';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, Header, Sidebar, BottomNav, UserProfileModal],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  protected readonly layoutService = inject(LayoutService);
}
