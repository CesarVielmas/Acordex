/**
 * Modelos de datos para el módulo de Finanzas & Economía Disquera de Acordex.
 *
 * Centraliza las transacciones de tesorería, estados de resultados (P&L),
 * cuentas por cobrar (C x C), cuentas por pagar (C x P), rentabilidad por talento,
 * liquidaciones y finiquitos de co-organizadores, y parámetros de simulación financiera.
 */

import { PaymentMilestone } from './admin.models';

export type FinanceTransactionType = 'ingreso' | 'egreso';

export type FinanceCategory =
  // Ingresos
  | 'taquilla_evento'
  | 'contrato_privado'
  | 'anticipo_cotizacion'
  | 'patrocinio'
  | 'concesion_barra'
  | 'otro_ingreso'
  // Egresos
  | 'honorarios_artistas'
  | 'produccion_audio'
  | 'renta_recinto'
  | 'viaticos_logistica'
  | 'seguridad_vallas'
  | 'marketing_prensa'
  | 'permisos_impuestos'
  | 'finiquito_manager'
  | 'reembolso_cliente'
  | 'nomina_staff'
  | 'otro_egreso';

export type FinanceTransactionStatus = 'conciliado' | 'pendiente' | 'en_transito' | 'cancelado';

export interface FinanceTransaction {
  id: string;
  folio: string;                     // ej. "TRX-2026-0042"
  type: FinanceTransactionType;
  category: FinanceCategory;
  concept: string;
  amount: number;
  date: string;                      // ISO '2026-08-10'
  accountId: string;                 // ej. 'card-bbva-01'
  accountName: string;               // ej. 'BBVA México Empresarial'
  status: FinanceTransactionStatus;
  receiptReference?: string;         // Clave de rastreo SPEI / Factura
  receiptUrl?: string;
  relatedEntity?: {
    type: 'event' | 'quote' | 'group' | 'manager';
    id: string;
    name: string;
  };
  notes?: string;
  createdBy?: string;
  isAuditReconciled?: boolean;
  reconciledAt?: string;
  reconciledBy?: string;
}

export interface FinanceAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  clabe: string;
  type: 'banco' | 'caja_chica' | 'tarjeta_debito';
  balance: number;
  colorVariant: 'primary' | 'success' | 'warning' | 'cyan' | 'purple';
  description?: string;
}

export interface ReceivableItem {
  id: string;
  source: 'quote' | 'event_boxoffice';
  concept: string;
  clientOrAgency: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'al_corriente' | 'por_vencer' | 'vencido' | 'moratorio';
  hasMoratorio?: boolean;
  moratorioAmount?: number;
  moratorioReason?: string;
  relatedId: string;
  contactPhone?: string;
  contactEmail?: string;
  milestones?: PaymentMilestone[];
}

export interface PayableItem {
  id: string;
  source: 'event_lineup' | 'quote_artist' | 'production_vendor' | 'venue' | 'manager_split';
  concept: string;
  beneficiaryName: string;
  category: FinanceCategory;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'pendiente' | 'programado' | 'pagado' | 'vencido';
  relatedId: string;
  bankDetails?: string;
  receiptReference?: string;
  receiptUrl?: string;
}

export interface ManagerSettlementEventDetail {
  eventId: string;
  title: string;
  date: string;
  grossRevenue: number;
  productionExpenses: number;
  netResult: number;
  agreementKind: 'porcentaje' | 'fijo';
  agreementValue: number;            // ej. 40 (%) o 150000 ($)
  managerShareAmount: number;
  acordexShareAmount: number;
  isConfirmed: boolean;
  confirmedAt?: string;
  isPaid: boolean;
  paidAt?: string;
  receiptReference?: string;
}

export interface ManagerSettlementSummary {
  managerName: string;
  totalEventsCoOrganized: number;
  grossRevenueGenerated: number;
  productionExpensesCharged: number;
  netSharedProfit: number;
  managerShareAmount: number;
  acordexShareAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'al_dia' | 'pendiente_firma' | 'pendiente_pago' | 'finiquitado';
  events: ManagerSettlementEventDetail[];
}

export interface GroupFinancialPerformance {
  groupId: string;
  groupName: string;
  image: string;
  genre: string;
  disqueraType: string;
  totalShows: number;                // Cotizaciones cerradas + eventos
  privateQuotesCount: number;
  massiveEventsCount: number;
  grossRevenueGenerated: number;     // Total facturado o taquilla atribuible
  artistFeesReceived: number;        // Honorarios cobrados por el talento
  productionCostsAttributed: number;
  viaticosSpent: number;
  netDisqueraProfit: number;         // Ganancia neta retenida por Acordex
  profitMarginPercent: number;       // Margen %
  avgTicketOrFee: number;            // Promedio por presentación
  roiPercent: number;                // Retorno sobre costo directo
}

export interface ProfitAndLossReport {
  periodLabel: string;
  dateRange: { start: string; end: string };
  grossRevenue: {
    total: number;
    eventsTickets: number;
    privateQuotes: number;
    sponsorships: number;
    barConcessions: number;
    other: number;
  };
  costOfSales: {
    total: number;
    artistFees: number;
    technicalProduction: number;
    venueRentals: number;
    viaticosLogistics: number;
  };
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: {
    total: number;
    marketingPress: number;
    staffPayroll: number;
    permitsInsurance: number;
    administrative: number;
  };
  operatingIncomeEBITDA: number;
  operatingMarginPercent: number;
  managerSplitsExpense: number;
  taxesProvision: number;
  netProfitAcordex: number;
  netMarginPercent: number;
}

export interface FinancialSimulationParams {
  ticketPriceMultiplier: number;     // 1.00 base, 1.08 = +8%
  occupancyTargetPercent: number;    // 75 = 75%
  quoteVolumeMultiplier: number;     // 1.00 base, 1.15 = +15%
  productionCostReduction: number;   // 0.00 base, 0.05 = -5%
  artistFeeNegotiationMargin: number;// 0.00 base, 0.03 = +3%
}

export interface FinancialSimulationResult {
  simulatedGrossRevenue: number;
  simulatedDirectCosts: number;
  simulatedGrossProfit: number;
  simulatedOpEx: number;
  simulatedNetProfit: number;
  simulatedNetMarginPercent: number;
  profitDeltaAmount: number;
  profitDeltaPercent: number;
  recommendationNote: string;
}

export interface CashCutRecord {
  id: string;
  cutFolio: string;                  // ej. "CORTE-2026-08-13"
  date: string;
  time: string;
  closedBy: string;                  // ej. "Lic. Claudia Morales"
  initialBalance: number;
  totalIncomes: number;
  totalExpenses: number;
  finalBalance: number;
  accountBreakdown: {
    accountId: string;
    accountName: string;
    balance: number;
  }[];
  notes?: string;
  transactionsCount: number;
}

