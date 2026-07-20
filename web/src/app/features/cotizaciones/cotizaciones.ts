import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BandCard } from '../../shared/band-card/band-card';
import { FilterPills } from '../../shared/filter-pills/filter-pills';
import { LayoutService } from '../../core/services/layout.service';
import { EventService } from '../../core/services/event.service';

@Component({
  selector: 'app-cotizaciones',
  imports: [CommonModule, FormsModule, BandCard, FilterPills],
  templateUrl: './cotizaciones.html',
  styleUrl: './cotizaciones.scss'
})
export class Cotizaciones implements OnInit {
  private readonly layoutService = inject(LayoutService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly eventService = inject(EventService);

  ngOnInit() {
    this.layoutService.setPageTitle('CENTRO DE COTIZACIONES');
  }

  filters = ['Todos', 'Banda Sinaloense', 'Norteño', 'Sierreño', 'Mariachi'];
  activeFilter = 'Todos';
  searchQuery = signal<string>('');

  // Advanced Filters State
  showAdvancedFilters = signal<boolean>(false);
  filterDateStart = signal<string>('');
  filterDateEnd = signal<string>('');

  // Hierarchical Location Dropdown Setup
  selectedCountry = signal<string>('Todos');
  selectedState = signal<string>('Todos');
  selectedMunicipality = signal<string>('Todos');

  countries = ['Todos', 'México', 'USA'];
  
  statesMap: { [key: string]: string[] } = {
    'México': ['Jalisco', 'Sinaloa', 'Nuevo León', 'CDMX', 'Querétaro', 'Quintana Roo'],
    'USA': ['Texas', 'California', 'Florida', 'New York', 'Nevada', 'Washington']
  };

  municipalitiesMap: { [key: string]: string[] } = {
    // México
    'Jalisco': ['Zapopan', 'Guadalajara', 'Tlaquepaque', 'Tlajomulco', 'Puerto Vallarta'],
    'Sinaloa': ['Mazatlán', 'Culiacán', 'Los Mochis', 'Guasave'],
    'Nuevo León': ['Monterrey', 'San Pedro', 'Guadalupe', 'San Nicolás', 'Apodaca'],
    'CDMX': ['Coyoacán', 'Cuauhtémoc', 'Miguel Hidalgo', 'Benito Juárez', 'Tlalpan'],
    'Querétaro': ['Santiago de Querétaro', 'San Juan del Río', 'Corregidora', 'El Marqués'],
    'Quintana Roo': ['Cancún', 'Playa del Carmen', 'Cozumel', 'Tulum', 'Chetumal'],
    // USA
    'Texas': ['Houston', 'Austin', 'Dallas', 'San Antonio', 'El Paso'],
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
    'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse'],
    'Nevada': ['Las Vegas', 'Reno', 'Carson City', 'Henderson', 'Sparks'],
    'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Bellevue', 'Olympia']
  };

  get availableStates() {
    const country = this.selectedCountry();
    return country !== 'Todos' ? this.statesMap[country] || [] : [];
  }

  get availableMunicipalities() {
    const state = this.selectedState();
    return state !== 'Todos' ? this.municipalitiesMap[state] || [] : [];
  }

  onCountryChange(country: string) {
    this.selectedCountry.set(country);
    this.selectedState.set('Todos');
    this.selectedMunicipality.set('Todos');
  }

  onStateChange(state: string) {
    this.selectedState.set(state);
    this.selectedMunicipality.set('Todos');
  }

  // Available Bands List
  availableBands = [
    {
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
      imageAlt: 'Banda Los Reyes',
      tag: 'Banda Sinaloense',
      rating: 4.9,
      name: 'Banda Los Reyes',
      country: 'México',
      state: 'Sinaloa',
      municipality: 'Mazatlán',
      location: 'Mazatlán, Sinaloa (México)',
      availability: 'Disponibilidad Alta',
      isFeatured: false,
      managerPhone: '523312345678',
      managerName: 'Don Pedro Reyes'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
      imageAlt: 'Norteño del Sur',
      tag: 'Norteño',
      rating: 4.7,
      name: 'Norteño del Sur',
      country: 'México',
      state: 'Nuevo León',
      municipality: 'Monterrey',
      location: 'Monterrey, Nuevo León (México)',
      availability: 'Disponibilidad Media',
      isFeatured: false,
      managerPhone: '528112345678',
      managerName: 'Ing. Luis Donaldo'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
      imageAlt: 'Los Alegres Sierreños',
      tag: 'Sierreño',
      rating: 4.8,
      name: 'Los Alegres Sierreños',
      country: 'México',
      state: 'Sinaloa',
      municipality: 'Culiacán',
      location: 'Culiacán, Sinaloa (México)',
      availability: 'Fechas Limitadas',
      isFeatured: false,
      managerPhone: '526671234567',
      managerName: 'Jaime Solís'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=600&auto=format&fit=crop',
      imageAlt: 'Mariachi Oro y Plata',
      tag: 'Mariachi',
      rating: 5.0,
      name: 'Mariachi Oro y Plata',
      country: 'México',
      state: 'Jalisco',
      municipality: 'Zapopan',
      location: 'Zapopan, Jalisco (México)',
      availability: 'Disponibilidad Alta',
      isFeatured: false,
      managerPhone: '523398765432',
      managerName: 'Lic. Fernando Ruiz'
    }
  ];

  // Interactive Quoting State Signals
  selectedBandToQuote = signal<any | null>(null);
  quoteStep = signal<number>(1);
  quoteFolio = signal<string>('');

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

  locationSuggestions = [
    { title: 'Hacienda San Javier, Zapopan, Jalisco', query: 'Hacienda+San+Javier,+Zapopan,+Jalisco' },
    { title: 'Arena Monterrey, Monterrey, Nuevo León', query: 'Arena+Monterrey,+Monterrey,+Nuevo+León' },
    { title: 'Salón Imperial, Culiacán, Sinaloa', query: 'Salón+Imperial,+Culiacán,+Sinaloa' },
    { title: 'Hacienda Tres Ríos, Mazatlán, Sinaloa', query: 'Hacienda+Tres+Ríos,+Mazatlán,+Sinaloa' },
    { title: 'Salón Las Flores, Guadalajara, Jalisco', query: 'Salón+Las+Flores,+Guadalajara,+Jalisco' }
  ];

  // Reactive Getter for Searching and Filtering
  filteredBands = computed(() => {
    const filter = this.activeFilter;
    const query = this.searchQuery().toLowerCase().trim();
    
    // Geographical filters
    const c = this.selectedCountry();
    const s = this.selectedState();
    const m = this.selectedMunicipality();

    return this.availableBands.filter(band => {
      // 1. Genre filter match
      const matchesFilter = filter === 'Todos' || band.tag === filter;
      
      // 2. Main query search match (name, genre, location)
      const matchesQuery = !query || 
                           band.name.toLowerCase().includes(query) || 
                           band.tag.toLowerCase().includes(query) || 
                           band.location.toLowerCase().includes(query);

      // 3. Hierarchical geography filters
      const matchesCountry = c === 'Todos' || band.country === c;
      const matchesState = s === 'Todos' || band.state === s;
      const matchesMunicipality = m === 'Todos' || band.municipality === m;

      return matchesFilter && matchesQuery && matchesCountry && matchesState && matchesMunicipality;
    });
  });

  onFilterSelected(filter: string) {
    this.activeFilter = filter;
  }

  // Interactive Modal Handlers
  openQuoteModal(band: any) {
    this.selectedBandToQuote.set(band);
    this.quoteStep.set(1);
    this.quoteFolio.set('');
    
    // Reset Form Fields
    this.eventType.set('Boda');
    this.eventDate.set('');
    this.eventLocation.set('');
    this.durationHours.set(3);
    this.notes.set('');
    this.clientName.set('');
    this.clientEmail.set('');
    this.clientPhone.set('');

    // Reset Map Selector fields
    this.eventLocationQuery.set('');
    this.showLocationSuggestions.set(false);
    this.selectedLocationMapUrl.set(null);
    this.isMapPickerOpen.set(false);
    this.realSuggestions.set([]);
  }

  closeQuoteModal() {
    this.selectedBandToQuote.set(null);
    this.isMapPickerOpen.set(false);
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

  // Search Address details dynamically and geocode format (Country, State, Zip, street, suburb etc)
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

    // Call free Nominatim search autocomplete API in Spanish
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

    // Fallback search map update
    if (q.length > 3) {
      const rawUrl = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      this.selectedLocationMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl));
    } else if (q.length === 0) {
      this.selectedLocationMapUrl.set(null);
    }
  }

  // Geolocation lookup + reverse geocoding to full address details (street, neighbourhood, postal, state, country)
  useCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          this.resolveAddressFromCoords(lat, lon);
        },
        () => {
          // Fallback if browser permission is denied/dismissed
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

  // Common address formatting helper
  private formatAddressDetails(addr: any, displayName: string): string {
    if (!addr) return displayName;
    
    // Check all potential OSM venue / building name fields
    const venueName = addr.amenity || addr.building || addr.hotel || addr.tourism || addr.historic || addr.office || addr.leisure || addr.shop || addr.club || addr.restaurant || addr.bar || addr.cafe || addr.place_of_worship || '';
    const road = addr.road || addr.pedestrian || addr.cycleway || addr.path || '';
    const houseNumber = addr.house_number || addr.street_number || addr.housenumber || addr.houseNumber || '';
    const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.village || addr.subdivision || '';
    const city = addr.city || addr.town || addr.municipality || addr.county || '';
    const state = addr.state || '';
    const postcode = addr.postcode || '';
    const country = addr.country || '';

    const parts: string[] = [];
    if (venueName) {
      parts.push(venueName);
    }
    if (road) {
      parts.push(road + (houseNumber ? ` No. ${houseNumber}` : ''));
    } else if (houseNumber) {
      parts.push(`No. ${houseNumber}`);
    }
    if (neighbourhood) {
      parts.push(`Col. ${neighbourhood}`);
    }
    if (city) {
      parts.push(city);
    }
    if (state) {
      parts.push(state);
    }
    if (postcode) {
      parts.push(`C.P. ${postcode}`);
    }
    if (country) {
      parts.push(country);
    }

    const finalAddress = parts.length > 2 ? parts.join(', ') : displayName;
    return finalAddress.replace(/\s+/g, ' ').replace(/, ,/g, ',').trim();
  }

  // Dynamic feedback according to hours duration
  get durationCategoryLabel() {
    const hours = this.durationHours();
    if (hours <= 2) return 'Show Corto (Ideal para recepciones o sets acústicos)';
    if (hours <= 4) return 'Evento Estándar (Recomendado para la mayoría de eventos)';
    if (hours <= 6) return 'Presentación Completa (Ideal para banquetes y bailes largos)';
    return 'Mega Evento (Festival o concierto extendido de larga duración)';
  }

  nextStep() {
    // Basic validation per step
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
    // Generate mock folio
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const folio = `ACX-${randomNum}`;
    this.quoteFolio.set(folio);

    // Save to EventService memory
    this.eventService.addQuote({
      folio,
      bandName: this.selectedBandToQuote()?.name || 'Banda Desconocida',
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
    const band = this.selectedBandToQuote();
    const bandName = band ? band.name : '';
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
