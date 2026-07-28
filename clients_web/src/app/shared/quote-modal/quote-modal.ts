import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EventService } from '../../core/services/event.service';

@Component({
  selector: 'app-quote-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quote-modal.html',
  styleUrl: './quote-modal.scss'
})
export class QuoteModal {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);

  @Input() band: any | null = null;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  quoteStep = signal<number>(1);
  quoteFolio = signal<string>('');
  isQuoteModalClosing = signal<boolean>(false);

  // Contract Modal State Signals
  isContractModalOpen = signal<boolean>(false);
  isContractSigned = signal<boolean>(false);

  // Form Fields Signals
  eventType = signal<string>('Boda');
  eventDate = signal<string>('');
  eventLocation = signal<string>('');
  durationHours = signal<number>(3);
  notes = signal<string>('');
  clientName = signal<string>('');
  clientEmail = signal<string>('');
  clientPhone = signal<string>('');

  // Quoting Modal Maps Autocomplete State
  eventLocationQuery = signal<string>('');
  showLocationSuggestions = signal<boolean>(false);
  selectedLocationMapUrl = signal<SafeResourceUrl | null>(null);

  // Map Picker Pin Mode State
  isMapPickerOpen = signal<boolean>(false);
  mockPickedAddress = signal<string>('Hacienda La Moreda, Tlajomulco de Zúñiga, Jalisco');
  mockMapPickerUrl = signal<SafeResourceUrl | null>(null);
  mapPickerSearchQuery = signal<string>('');

  // Real suggestions resolved dynamically via Nominatim OpenStreetMap API
  realSuggestions = signal<{ title: string; query: string }[]>([]);

  goToBandProfile() {
    if (!this.band) return;
    const id = this.band.id || (this.band.name ? this.band.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'banda-los-reyes');
    this.closeModal();
    this.router.navigate(['/grupo', id]);
  }

  closeModal() {
    this.isQuoteModalClosing.set(true);
    setTimeout(() => {
      this.isMapPickerOpen.set(false);
      this.isQuoteModalClosing.set(false);
      this.close.emit();
    }, 280);
  }

  adjustHours(amount: number) {
    this.durationHours.update(h => Math.min(12, Math.max(1, h + amount)));
  }

  // Map Picker modal logic
  openMapPicker() {
    const rawPickerUrl = `https://maps.google.com/maps?q=20.671956,-103.344714&t=&z=13&ie=UTF8&iwloc=&output=embed`;
    this.mockMapPickerUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawPickerUrl));
    this.mockPickedAddress.set('Hacienda La Moreda, Tlajomulco de Zúñiga, Jalisco');
    this.mapPickerSearchQuery.set('');
    this.isMapPickerOpen.set(true);
  }

  closeMapPicker() {
    this.isMapPickerOpen.set(false);
  }

  searchInMapPicker() {
    const q = this.mapPickerSearchQuery().trim();
    if (!q) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=1`, {
      headers: {
        'Accept-Language': 'es'
      }
    })
      .then(res => res.json())
      .then(results => {
        if (results && results.length > 0) {
          const data = results[0];
          const fullAddress = this.formatAddressDetails(data.address, data.display_name);

          this.mockPickedAddress.set(fullAddress);

          const rawPickerUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
          this.mockMapPickerUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawPickerUrl));
        } else {
          this.mockPickedAddress.set(q);
          const rawPickerUrl = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
          this.mockMapPickerUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawPickerUrl));
        }
      })
      .catch(() => {
        this.mockPickedAddress.set(q);
        const rawPickerUrl = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        this.mockMapPickerUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawPickerUrl));
      });
  }

  confirmMapPickerLocation() {
    const address = this.mockPickedAddress();
    this.eventLocationQuery.set(address);
    this.eventLocation.set(address);
    this.showLocationSuggestions.set(false);

    const rawUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    this.selectedLocationMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl));
    this.isMapPickerOpen.set(false);
  }

  selectLocationSuggestion(loc: { title: string; query: string }) {
    this.eventLocationQuery.set(loc.title);
    this.eventLocation.set(loc.title);
    this.showLocationSuggestions.set(false);

    const rawUrl = `https://maps.google.com/maps?q=${loc.query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    this.selectedLocationMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl));
  }

  onLocationQueryChange(value: string) {
    this.eventLocationQuery.set(value);
    this.eventLocation.set(value);

    const q = value.trim();
    if (q.length < 2) {
      this.showLocationSuggestions.set(false);
      this.realSuggestions.set([]);
      return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=4`, {
      headers: {
        'Accept-Language': 'es'
      }
    })
      .then(res => res.json())
      .then(results => {
        if (results && results.length > 0) {
          const mapped = results.map((r: any) => {
            const display = this.formatAddressDetails(r.address, r.display_name);
            return {
              title: display,
              query: display
            };
          });
          this.realSuggestions.set(mapped);
          this.showLocationSuggestions.set(true);
        } else {
          this.realSuggestions.set([]);
        }
      })
      .catch(() => {
        this.realSuggestions.set([]);
      });

    if (q.length > 3) {
      const rawUrl = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      this.selectedLocationMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl));
    } else if (q.length === 0) {
      this.selectedLocationMapUrl.set(null);
    }
  }

  useCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this.resolveAddressFromCoords(lat, lon);
        },
        () => {
          const fallbackAddress = 'Guadalajara, Jalisco, México';
          this.eventLocationQuery.set(fallbackAddress);
          this.eventLocation.set(fallbackAddress);
          this.showLocationSuggestions.set(false);

          const rawUrl = `https://maps.google.com/maps?q=Guadalajara,+Jalisco&t=&z=15&ie=UTF8&iwloc=&output=embed`;
          this.selectedLocationMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl));
        }
      );
    } else {
      alert('La geolocalización no está soportada por su navegador.');
    }
  }

  resolveAddressFromCoords(lat: number, lon: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`, {
      headers: {
        'Accept-Language': 'es'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const fullAddress = this.formatAddressDetails(data.address, data.display_name);
          this.eventLocationQuery.set(fullAddress);
          this.eventLocation.set(fullAddress);

          const rawUrl = `https://maps.google.com/maps?q=${lat},${lon}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
          this.selectedLocationMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl));
        } else {
          const coordsText = `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`;
          this.eventLocationQuery.set(coordsText);
          this.eventLocation.set(coordsText);
        }
      })
      .catch(() => {
        const coordsText = `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`;
        this.eventLocationQuery.set(coordsText);
        this.eventLocation.set(coordsText);
      });
  }

  private formatAddressDetails(addr: any, displayName: string): string {
    if (!addr) return displayName;

    const venueName = addr.amenity || addr.building || addr.hotel || addr.tourism || addr.historic || addr.office || addr.leisure || addr.shop || addr.club || addr.restaurant || addr.bar || addr.cafe || addr.place_of_worship || '';
    const road = addr.road || addr.pedestrian || addr.cycleway || addr.path || '';
    const houseNumber = addr.house_number || addr.street_number || addr.housenumber || addr.houseNumber || '';
    const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.village || addr.subdivision || '';
    const city = addr.city || addr.town || addr.municipality || addr.county || '';
    const state = addr.state || '';
    const postcode = addr.postcode || '';
    const country = addr.country || '';

    const parts: string[] = [];
    if (venueName) parts.push(venueName);
    if (road) parts.push(road + (houseNumber ? ` No. ${houseNumber}` : ''));
    else if (houseNumber) parts.push(`No. ${houseNumber}`);
    if (neighbourhood) parts.push(`Col. ${neighbourhood}`);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (postcode) parts.push(`C.P. ${postcode}`);
    if (country) parts.push(country);

    const finalAddress = parts.length > 2 ? parts.join(', ') : displayName;
    return finalAddress.replace(/\s+/g, ' ').replace(/, ,/g, ',').trim();
  }

  get durationCategoryLabel() {
    const hours = this.durationHours();
    if (hours <= 2) return 'Show Corto (Ideal para recepciones o sets acústicos)';
    if (hours <= 4) return 'Evento Estándar (Recomendado para la mayoría de eventos)';
    if (hours <= 6) return 'Presentación Completa (Ideal para banquetes y bailes largos)';
    return 'Mega Evento (Festival o concierto extendido de larga duración)';
  }

  nextStep() {
    if (this.quoteStep() === 1) {
      if (!this.eventDate() || !this.eventLocation()) {
        alert('Por favor complete la fecha y lugar/dirección del evento.');
        return;
      }
    } else if (this.quoteStep() === 2) {
      if (!this.durationHours() || this.durationHours() <= 0) {
        alert('Ingrese una duración válida.');
        return;
      }
    } else if (this.quoteStep() === 3) {
      if (!this.clientName() || !this.clientEmail() || !this.clientPhone()) {
        alert('Por favor llene todos los campos de contacto.');
        return;
      }
    }
    this.quoteStep.update(s => s + 1);
  }

  prevStep() {
    this.quoteStep.update(s => Math.max(1, s - 1));
  }

  submitQuote() {
    if (!this.clientName() || !this.clientEmail() || !this.clientPhone()) {
      alert('Por favor llene todos los campos de contacto.');
      return;
    }
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const folio = `ACX-${randomNum}`;
    this.quoteFolio.set(folio);

    this.eventService.addQuote({
      folio,
      bandName: this.band?.name || 'Banda Desconocida',
      eventType: this.eventType(),
      eventDate: this.eventDate(),
      eventLocation: this.eventLocation(),
      durationHours: this.durationHours(),
      clientName: this.clientName(),
      clientEmail: this.clientEmail(),
      clientPhone: this.clientPhone(),
      status: 'pending'
    });

    this.quoteStep.set(4);
  }

  get whatsappSupportUrl() {
    const bandName = this.band ? this.band.name : '';
    const text = encodeURIComponent(`Hola Acordex, me gustaría dar seguimiento a mi solicitud de cotización folio ${this.quoteFolio()} para la agrupación ${bandName}.`);
    return `https://api.whatsapp.com/send?phone=521234567890&text=${text}`;
  }

  openContract() {
    this.isContractSigned.set(false);
    this.isContractModalOpen.set(true);
  }

  closeContract() {
    this.isContractModalOpen.set(false);
  }

  signContract() {
    this.isContractSigned.set(true);
  }
}
