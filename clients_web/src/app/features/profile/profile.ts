import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '../../core/services/layout.service';
import { UserService } from '../../core/services/user.service';

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
  protected readonly layoutService = inject(LayoutService);
  protected readonly userService = inject(UserService);

  // Active section tab: 'general' | 'privacidad' | 'pagos' | 'seguridad'
  activeSection = signal<string>('general');

  // Success message state
  successMsg = signal<string>('');

  // Edit form model
  editForm = {
    name: '',
    phone: '',
    city: '',
    profileUrl: '',
    bio: ''
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

  // Subscription state (Private to current user settings only)
  subscription = signal({
    planName: 'Membresía Acordex VIP',
    price: '$199 MXN / mes',
    status: 'Activa',
    nextBillingDate: '12 de Agosto, 2026',
    paymentMethod: 'Visa •••• 4912',
    perks: [
      { title: 'Acceso Anticipado a Preventas', desc: 'Asegura tus boletos hasta 48 horas antes que el público general.', icon: 'bolt' },
      { title: 'Boletos Digitales VIP sin Filas', desc: 'Acceso prioritario con código QR acelerado en recintos.', icon: 'qr_code_2' },
      { title: 'Descuentos Exclusivos en Consumos', desc: '15% de descuento en bebidas y artículos de mercadería en eventos.', icon: 'local_offer' },
      { title: 'Atención & Soporte Prioritario 24/7', desc: 'Soporte prioritario e inmediato en cualquier cambio o aclaración.', icon: 'support_agent' }
    ]
  });

  ngOnInit() {
    this.layoutService.setPageTitle('MI PERFIL ACORDEX');
    this.resetEditForm();
  }

  setSection(section: string) {
    this.activeSection.set(section);
  }

  resetEditForm() {
    const current = this.userService.currentUser();
    this.editForm = {
      name: current.name,
      phone: current.phone,
      city: current.city,
      profileUrl: current.profileUrl,
      bio: current.bio
    };
  }

  saveProfile() {
    if (!this.editForm.name.trim()) {
      alert('El nombre es requerido.');
      return;
    }
    
    this.userService.updateProfileInfo({
      name: this.editForm.name,
      phone: this.editForm.phone,
      city: this.editForm.city,
      profileUrl: this.editForm.profileUrl,
      bio: this.editForm.bio
    });

    this.showToast('¡Perfil y biografía actualizados exitosamente!');
  }

  toggleBandPrivacy(bandId: string) {
    this.userService.toggleBandVisibility(bandId);
    this.showToast('Preferencia de privacidad de artista actualizada.');
  }

  toggleReviewPrivacy(reviewId: string) {
    this.userService.toggleReviewVisibility(reviewId);
    this.showToast('Preferencia de privacidad de reseña actualizada.');
  }

  toggleBandVisibility(bandId: string) {
    this.toggleBandPrivacy(bandId);
  }

  toggleReviewVisibility(reviewId: string) {
    this.toggleReviewPrivacy(reviewId);
  }

  previewPublicProfile() {
    this.layoutService.openUserProfile(this.userService.getPublicProfileData());
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
