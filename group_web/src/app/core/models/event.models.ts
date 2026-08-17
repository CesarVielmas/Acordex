export interface EventEvidenceItem {
  id: string;
  url: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption: string;
  type: 'photo' | 'video';
  category: 'En Vivo' | 'Backstage' | 'Prueba de Sonido' | 'Meet & Greet' | 'Prensa';
  uploadedAt: string;
  uploadedByName: string;
}

export interface GroupEventItem {
  id: string;
  title: string;
  type: 'Concierto' | 'Festival Masivo' | 'Boda / Evento Privado' | 'Palenque' | 'Firma de Autógrafos' | 'Rueda de Prensa' | 'Ensayo General';
  date: string;
  callTime: string; // Hora de cita / soundcheck
  showTime: string; // Hora de inicio del show
  endTime: string;
  venue: string;
  city: string;
  state: string;
  address: string;
  googleMapsUrl?: string;
  wazeUrl?: string;
  capacity?: number;
  expectedAttendance?: number;
  status: 'Programado' | 'En Curso' | 'Completado' | 'Cancelado';
  dressCode?: string;
  notes?: string;
  logisticsNotes?: string;
  honorarios: number;
  artistFee?: number;
  paymentStatus: 'Pendiente' | 'Anticipo 50%' | 'Liquidado';
  contactPerson: string;
  contactPhone: string;
  audioEquipmentConfirmed: boolean;
  evidences: EventEvidenceItem[];
  performanceRating?: number;
  performanceNotes?: string;
}
