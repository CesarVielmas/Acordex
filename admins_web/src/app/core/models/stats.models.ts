/**
 * Modelos de datos para el módulo de Estadísticas & Inteligencia de Audiencia de Acordex.
 *
 * Integra datos de:
 * 1. Eventos masivos (Boletos, ocupación, zonas, velocidad de venta)
 * 2. Cotizaciones (Conversión, tipos de evento privado, ticket promedio)
 * 3. Talento (Popularidad, streaming Spotify, redes sociales, calificaciones)
 * 4. Demografía (Edades, género, canales de venta y ciudades)
 * 5. Tendencias y predicciones
 */

export interface GlobalStatsSummary {
  totalTicketsSold: number;
  totalLiveAttendance: number;
  totalMassiveEvents: number;
  totalPrivateBookings: number;
  conversionRatePercent: number;
  combinedDigitalAudience: number; // Spotify listeners + TikTok followers
  avgOccupancyPercent: number;
  topGenre: string;
  topCity: string;
}

export interface GenreDistribution {
  genre: string;
  eventsCount: number;
  quotesCount: number;
  totalAudience: number;
  percentShare: number;
  colorClass: string;
}

export interface MonthlyAttendancePeak {
  month: string;                     // 'Ene', 'Feb', 'Mar', ...
  monthFullName: string;
  attendance: number;
  eventsCount: number;
  isPeakSeason: boolean;             // ej. Feria San Marcos en Abr, Fiestas Patrias en Sep
  seasonLabel?: string;
}

export interface CityPerformance {
  city: string;
  state: string;
  eventsCount: number;
  privateQuotesCount: number;
  totalAudience: number;
  occupancyAvg: number;
  growthPercent: number;
}

export interface EventStatsDetail {
  eventId: string;
  title: string;
  date: string;
  venueName: string;
  city: string;
  state: string;
  capacity: number;
  ticketsSold: number;
  occupancyPercent: number;
  status: string;
  grossRevenue: number;
  zoneBreakdown: {
    zoneName: string;
    capacity: number;
    sold: number;
    price: number;
    occupancyPercent: number;
    soldOut: boolean;
  }[];
  peakSalesHour: string;
  daysToSellOut?: number;
  demographicDominantAge: string;
}

export interface QuoteConversionFunnel {
  stepName: string;
  count: number;
  percentFromPrevious: number;
  percentFromTotal: number;
  description: string;
}

export interface PrivateEventTypeStat {
  eventType: string;                 // 'Boda', 'XV Años', 'Empresarial', 'Fiesta Patronal', 'Cumpleaños'
  count: number;
  percentShare: number;
  avgAmount: number;
  totalRevenue: number;
  icon: string;
}

export interface ArtistStatsDetail {
  groupId: string;
  groupName: string;
  image: string;
  genre: string;
  disqueraType: string;
  totalShows: number;
  totalAudienceAttended: number;
  spotifyMonthlyListeners: number;
  tikTokFollowers: number;
  instagramFollowers: number;
  youtubeViewsMonthly: number;
  engagementRatePercent: number;
  publicRating: number;              // ej. 4.9
  satisfactionPercent: number;       // ej. 98%
  trendingScore: number;             // 1-100
  topSongs: { title: string; streams: number }[];
}

export interface AudienceDemographics {
  ageRanges: {
    label: string;
    percent: number;
    favoriteGenre: string;
    colorClass: string;
  }[];
  genderDistribution: {
    gender: string;
    percent: number;
    icon: string;
  }[];
  purchaseChannels: {
    channel: string;                 // 'En Línea (Web/App)' | 'Taquilla Recinto' | 'Puntos Físicos / Tiendas'
    percent: number;
    ticketsCount: number;
    icon: string;
  }[];
}

export interface TrendPrediction {
  id: string;
  title: string;
  category: 'temporada' | 'talento' | 'genero' | 'plaza';
  impactLevel: 'alto' | 'medio' | 'oportunidad';
  predictionText: string;
  recommendedAction: string;
  expectedGrowth: string;
}
