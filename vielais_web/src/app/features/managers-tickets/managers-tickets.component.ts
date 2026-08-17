import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetricsEngineService } from '../../core/services/metrics-engine.service';
import { ManagerItem, SupportTicketItem } from '../../core/models/vielais.models';

@Component({
  selector: 'app-managers-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './managers-tickets.component.html'
})
export class ManagersTicketsComponent {
  readonly metrics = inject(MetricsEngineService);

  activeTab = signal<'managers' | 'tickets'>('managers');
  ticketFilter = signal<string>('ALL');
  selectedTicket = signal<SupportTicketItem | null>(null);
  
  // Register Manager Modal State
  isRegisterModalOpen = signal<boolean>(false);
  newManagerName = signal<string>('');
  newManagerAgency = signal<string>('');
  newManagerEmail = signal<string>('');
  newManagerPhone = signal<string>('');
  newManagerClabe = signal<string>('');
  newManagerRfc = signal<string>('');
  newManagerGroup = signal<string>('Banda Los Reyes');
  newManagerSplit = signal<number>(15);
  onboardingLinkGenerated = signal<string | null>(null);

  // Ticket Response State
  replyText = signal<string>('');
  devNotesText = signal<string>('');
  statusFeedback = signal<string | null>(null);

  readonly availableGroups = [
    'Banda Los Reyes',
    'Mariachi Imperial de México',
    'Grupo Firmeza Sinaloense',
    'Sonora Dinamita del Sureste',
    'Los Cadetes de la Sierra',
    'Solista Regional Invitado'
  ];

  get filteredTickets(): SupportTicketItem[] {
    const list = this.metrics.tickets();
    const f = this.ticketFilter();
    if (f === 'ALL') return list;
    if (f === 'OPEN') return list.filter(t => t.status === 'Abierto' || t.status === 'En Revisión');
    if (f === 'RESOLVED') return list.filter(t => t.status === 'Resuelto' || t.status === 'Cerrado');
    if (f === 'CRITICAL') return list.filter(t => t.priority === 'Crítica' || t.priority === 'Alta');
    return list;
  }

  openRegisterModal(): void {
    this.onboardingLinkGenerated.set(null);
    this.isRegisterModalOpen.set(true);
  }

  closeRegisterModal(): void {
    this.isRegisterModalOpen.set(false);
  }

  submitNewManager(): void {
    if (!this.newManagerName().trim() || !this.newManagerEmail().trim()) return;

    const created = this.metrics.registerManager({
      fullName: this.newManagerName().trim(),
      agencyName: this.newManagerAgency().trim() || 'Agencia Independiente',
      email: this.newManagerEmail().trim(),
      phone: this.newManagerPhone().trim() || '+52 55 0000 0000',
      clabe: this.newManagerClabe().trim() || '012180000000000000',
      rfc: this.newManagerRfc().trim() || 'XAXX010101000',
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400`,
      assignedGroups: [this.newManagerGroup()],
      commissionSplitPercent: this.newManagerSplit(),
      status: 'Activo'
    });

    this.onboardingLinkGenerated.set(`https://acordex.app/manager/invite?token=mgr_jwt_${created.id}_${Date.now()}`);
    this.newManagerName.set('');
    this.newManagerAgency.set('');
    this.newManagerEmail.set('');
    this.newManagerPhone.set('');
    this.newManagerClabe.set('');
    this.newManagerRfc.set('');
  }

  selectTicket(ticket: SupportTicketItem): void {
    this.selectedTicket.set(ticket);
    this.devNotesText.set(ticket.internalDevNotes || '');
    this.replyText.set('');
  }

  sendTicketReply(): void {
    const current = this.selectedTicket();
    if (!current || !this.replyText().trim()) return;

    this.metrics.replyToTicket(current.id, this.replyText());
    
    // Refresh active ticket reference
    const updated = this.metrics.tickets().find(t => t.id === current.id);
    if (updated) this.selectedTicket.set(updated);

    this.replyText.set('');
    this.showFeedback('Respuesta enviada al Manager en tiempo real.');
  }

  changeTicketStatus(status: SupportTicketItem['status']): void {
    const current = this.selectedTicket();
    if (!current) return;

    this.metrics.updateTicketStatus(current.id, status, this.devNotesText());
    
    const updated = this.metrics.tickets().find(t => t.id === current.id);
    if (updated) this.selectedTicket.set(updated);

    this.showFeedback(`Ticket actualizado a: ${status}`);
  }

  saveDevNotes(): void {
    const current = this.selectedTicket();
    if (!current) return;

    this.metrics.updateTicketStatus(current.id, current.status, this.devNotesText());
    this.showFeedback('Notas privadas para Vielais guardadas.');
  }

  private showFeedback(msg: string): void {
    this.statusFeedback.set(msg);
    setTimeout(() => this.statusFeedback.set(null), 4000);
  }
}
