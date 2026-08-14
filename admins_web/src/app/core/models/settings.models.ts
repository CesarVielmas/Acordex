export interface CorporateSettings {
  agencyName: string;
  legalName: string;
  legalId: string; // RFC
  taxRegime: string;
  legalRepresentative: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  website: string;
  logoUrl: string;
  signatureUrl?: string;

  // Políticas Comerciales de Booking
  defaultCommissionPercent: number; // ej. 15%
  quoteValidityDays: number; // ej. 7 días
  requiredAdvancePercent: number; // ej. 50%
  cancellationPolicyTerms: string;
  defaultContractNotes: string;

  // Notificaciones & Alertas
  enableWhatsAppNotifications: boolean;
  enableEmailAlerts: boolean;
  notifyOnQuoteAccepted: boolean;
  notifyOnTaskOverdue: boolean;
  notifyOnPaymentReceived: boolean;

  // Cuentas Bancarias Receptoras
  receivingBankAccounts: {
    id: string;
    bankName: string;
    accountHolder: string;
    clabe: string;
    accountNumber: string;
    currency: string;
    isPrimary: boolean;
  }[];
}
