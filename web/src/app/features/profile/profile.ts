import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '../../core/services/layout.service';

interface PaymentCard {
  id: string;
  type: 'visa' | 'mastercard';
  number: string;
  holder: string;
  expiry: string;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  private readonly layoutService = inject(LayoutService);

  // Active section tab
  activeSection = signal<string>('general');

  // Success message state
  successMsg = signal<string>('');

  // User details state
  user = signal({
    name: 'Alejandro Mendoza',
    email: 'alejandro.mendoza@ejemplo.com',
    phone: '811-345-6789',
    city: 'Monterrey, NL, México',
    profileUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHmOKfsdeDk97RkFYA82JzuIe_TkK0xot_uMkINkxsobVv9lZln3uk5hy5nhpB71kyLOJzytl4SJggaFdNvA2H3mYv12flzxqody7GmSYbuGC1zhEyqOXOAZQmZqJ3ChDntHBQ6UuKwLFux4SfdbaJRTUDuMSU9gZgIlz-vse6ksoS6U2P7vBi_u1Lc1ErwyS3ciIrzGpfJ7V51r8hz6b6IOymxCHPv3BvrOMjbXIq8h6YhAgxoZbn_8gwnBtJvc6IrWfLJA6X3AY',
    membership: 'Premium VIP',
    joinDate: '12 de Enero de 2024'
  });

  // Edit form model
  editForm = {
    name: '',
    phone: '',
    city: '',
    profileUrl: ''
  };

  // Payment cards list
  cards = signal<PaymentCard[]>([
    { id: '1', type: 'visa', number: '•••• •••• •••• 4912', holder: 'ALEJANDRO MENDOZA', expiry: '12/29' }
  ]);

  // Card form model
  newCard = {
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  };

  // Security password form model
  securityForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Two-Factor auth state
  twoFactor = signal<boolean>(true);

  ngOnInit() {
    this.layoutService.setPageTitle('MI PERFIL ACORDEX');
    this.resetEditForm();
  }

  setSection(section: string) {
    this.activeSection.set(section);
  }

  resetEditForm() {
    const current = this.user();
    this.editForm = {
      name: current.name,
      phone: current.phone,
      city: current.city,
      profileUrl: current.profileUrl
    };
  }

  saveProfile() {
    if (!this.editForm.name.trim()) {
      alert('El nombre es requerido.');
      return;
    }
    
    this.user.update(u => ({
      ...u,
      name: this.editForm.name,
      phone: this.editForm.phone,
      city: this.editForm.city,
      profileUrl: this.editForm.profileUrl
    }));

    this.showToast('¡Información de perfil actualizada exitosamente!');
  }

  addCard() {
    if (!this.newCard.number || !this.newCard.holder || !this.newCard.expiry) {
      alert('Por favor completa los datos de la tarjeta.');
      return;
    }

    const cleanedNum = this.newCard.number.replace(/\s+/g, '');
    const lastFour = cleanedNum.slice(-4) || '1111';
    
    this.cards.update(list => [
      ...list,
      {
        id: (list.length + 1).toString(),
        type: cleanedNum.startsWith('5') ? 'mastercard' : 'visa',
        number: `•••• •••• •••• ${lastFour}`,
        holder: this.newCard.holder.toUpperCase(),
        expiry: this.newCard.expiry
      }
    ]);

    this.newCard = { number: '', holder: '', expiry: '', cvv: '' };
    this.showToast('Tarjeta de crédito vinculada de forma segura.');
  }

  removeCard(id: string) {
    this.cards.update(list => list.filter(c => c.id !== id));
    this.showToast('Tarjeta desvinculada del perfil.');
  }

  changePassword() {
    if (!this.securityForm.currentPassword || !this.securityForm.newPassword || !this.securityForm.confirmPassword) {
      alert('Por favor completa todos los campos de contraseña.');
      return;
    }

    if (this.securityForm.newPassword !== this.securityForm.confirmPassword) {
      alert('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    this.securityForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.showToast('Tu contraseña ha sido actualizada.');
  }

  toggle2FA() {
    this.twoFactor.update(v => !v);
    this.showToast(this.twoFactor() ? 'Autenticación en dos pasos habilitada.' : 'Autenticación en dos pasos deshabilitada.');
  }

  logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión en Acordex?')) {
      alert('Sesión cerrada. Redirigiendo...');
      window.location.reload();
    }
  }

  private showToast(msg: string) {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 4000);
  }
}
