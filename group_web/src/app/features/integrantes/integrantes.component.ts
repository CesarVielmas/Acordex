import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupDataService } from '../../core/services/group-data.service';
import { GroupMember } from '../../core/models/group.models';

@Component({
  selector: 'app-integrantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './integrantes.component.html',
  styleUrl: './integrantes.component.scss'
})
export class IntegrantesComponent {
  readonly groupData = inject(GroupDataService);

  editingMember = signal<GroupMember | null>(null);

  // Form Fields
  formName = signal<string>('');
  formRole = signal<string>('');
  formInstrument = signal<string>('');
  formAge = signal<number>(30);
  formHometown = signal<string>('');
  formExperienceYears = signal<number>(10);
  formQuote = signal<string>('');
  formBio = signal<string>('');
  formFullBio = signal<string>('');
  formPhotoUrl = signal<string>('');
  formInstagram = signal<string>('');
  formSpotify = signal<string>('');
  formTiktok = signal<string>('');

  openEditModal(member: GroupMember): void {
    this.editingMember.set(member);
    this.formName.set(member.name);
    this.formRole.set(member.role);
    this.formInstrument.set(member.instrument || '');
    this.formAge.set(member.age);
    this.formHometown.set(member.hometown);
    this.formExperienceYears.set(member.experienceYears);
    this.formQuote.set(member.quote);
    this.formBio.set(member.bio);
    this.formFullBio.set(member.fullBio);
    this.formPhotoUrl.set(member.photoUrl);
    this.formInstagram.set(member.socials.instagram || '');
    this.formSpotify.set(member.socials.spotify || '');
    this.formTiktok.set(member.socials.tiktok || '');
  }

  closeEditModal(): void {
    this.editingMember.set(null);
  }

  saveMemberChanges(): void {
    const member = this.editingMember();
    if (!member) return;

    this.groupData.updateMemberInfo(member.id, {
      name: this.formName().trim(),
      role: this.formRole().trim(),
      instrument: this.formInstrument().trim() || undefined,
      age: Number(this.formAge()),
      hometown: this.formHometown().trim(),
      experienceYears: Number(this.formExperienceYears()),
      quote: this.formQuote().trim(),
      bio: this.formBio().trim(),
      fullBio: this.formFullBio().trim(),
      photoUrl: this.formPhotoUrl().trim() || member.photoUrl,
      socials: {
        ...member.socials,
        instagram: this.formInstagram().trim() || undefined,
        spotify: this.formSpotify().trim() || undefined,
        tiktok: this.formTiktok().trim() || undefined
      }
    });

    this.closeEditModal();
  }
}
