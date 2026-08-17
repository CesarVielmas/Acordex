import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { GroupDataService } from '../../core/services/group-data.service';
import { LayoutStateService } from '../../core/services/layout-state.service';
import { LiveActivityStatus } from '../../core/models/group.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly groupData = inject(GroupDataService);
  readonly layout = inject(LayoutStateService);
  private readonly router = inject(Router);

  isGroupDropdownOpen = signal<boolean>(false);
  isMemberDropdownOpen = signal<boolean>(false);
  isStatusDropdownOpen = signal<boolean>(false);
  isNotifDropdownOpen = signal<boolean>(false);

  readonly statusOptions: { label: LiveActivityStatus; color: string; icon: string }[] = [
    { label: 'Disponible', color: 'bg-emerald-500', icon: 'check_circle' },
    { label: 'En Gira', color: 'bg-primary', icon: 'tour' },
    { label: 'En Ensayo', color: 'bg-blue-400', icon: 'music_note' },
    { label: 'En Escenario', color: 'bg-rose-500 animate-pulse', icon: 'podium' },
    { label: 'Descanso', color: 'bg-neutral-500', icon: 'bedtime' }
  ];

  toggleGroupDropdown(): void {
    this.isGroupDropdownOpen.update(v => !v);
    this.isMemberDropdownOpen.set(false);
    this.isStatusDropdownOpen.set(false);
    this.isNotifDropdownOpen.set(false);
  }

  toggleMemberDropdown(): void {
    this.isMemberDropdownOpen.update(v => !v);
    this.isGroupDropdownOpen.set(false);
    this.isStatusDropdownOpen.set(false);
    this.isNotifDropdownOpen.set(false);
  }

  toggleStatusDropdown(): void {
    this.isStatusDropdownOpen.update(v => !v);
    this.isGroupDropdownOpen.set(false);
    this.isMemberDropdownOpen.set(false);
    this.isNotifDropdownOpen.set(false);
  }

  toggleNotifDropdown(): void {
    this.isNotifDropdownOpen.update(v => !v);
    this.isGroupDropdownOpen.set(false);
    this.isMemberDropdownOpen.set(false);
    this.isStatusDropdownOpen.set(false);
  }

  selectGroup(groupId: string): void {
    this.groupData.setActiveGroup(groupId);
    this.isGroupDropdownOpen.set(false);
  }

  selectMember(memberId: string): void {
    this.groupData.setActiveMember(memberId);
    this.isMemberDropdownOpen.set(false);
  }

  setStatus(status: LiveActivityStatus): void {
    this.groupData.setLiveActivityStatus(status);
    this.isStatusDropdownOpen.set(false);
  }

  markNotifAsRead(id: string, route?: string): void {
    this.groupData.markNotificationAsRead(id);
    if (route) {
      this.isNotifDropdownOpen.set(false);
      this.router.navigate([route]);
    }
  }

  closeAllDropdowns(): void {
    this.isGroupDropdownOpen.set(false);
    this.isMemberDropdownOpen.set(false);
    this.isStatusDropdownOpen.set(false);
    this.isNotifDropdownOpen.set(false);
  }
}
