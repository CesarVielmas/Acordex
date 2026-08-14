/**
 * Derivaciones y cálculos financieros puros de Acordex.
 *
 * Integra y consolida en tiempo real la información de:
 * 1. Cotizaciones (Contrataciones privadas)
 * 2. Eventos masivos (Taquilla, producción técnica, recintos, finiquitos)
 * 3. Catálogo de Grupos / Talento (Honorarios, nómina y rentabilidad)
 * 4. Libro Diario de Tesorería (Flujo de caja y conciliación bancaria)
 */

import { Quote, GroupItem, EventItem, ReceivingCard, PaymentMilestone } from '../../core/models/admin.models';
import {
  FinanceTransaction,
  FinanceAccount,
  ReceivableItem,
  PayableItem,
  GroupFinancialPerformance,
  ManagerSettlementSummary,
  ManagerSettlementEventDetail,
  ProfitAndLossReport,
  FinancialSimulationParams,
  FinancialSimulationResult
} from '../../core/models/finance.models';
import {
  grossTicketRevenue,
  lineupTotalCost,
  slotCost,
  productionCost,
  totalExpenses,
  totalPayouts,
  netResult,
  participatingManagers
} from '../events/event-metrics';

/** Formatea números a moneda nacional con símbolo y sufijo MXN. */
export function money(amount: number): string {
  return '$' + Math.round(amount || 0).toLocaleString('es-MX') + ' MXN';
}

/** Formato compacto para gráficas y etiquetas cortas (ej. $1.4M / $350K). */
export function compactMoney(amount: number): string {
  const val = Math.abs(amount || 0);
  const sign = amount < 0 ? '-' : '';
  if (val >= 1_000_000) {
    return `${sign}$${(val / 1_000_000).toFixed(1)}M`;
  }
  if (val >= 1_000) {
    return `${sign}$${(val / 1_000).toFixed(0)}K`;
  }
  return `${sign}$${Math.round(val)}`;
}

/** Calcula porcentaje seguro evitando divisiones entre cero. */
export function calcPercent(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 100);
}

// ─── 1. ESTADO DE RESULTADOS (P&L) ──────────────────────────────────────────

export function calculateProfitAndLoss(
  quotes: Quote[],
  events: EventItem[],
  transactions: FinanceTransaction[],
  period: 'mes' | 'q3' | 'anual' | 'historico' = 'historico'
): ProfitAndLossReport {
  // Cotizaciones ganadas o activas comercialmente
  const activeQuotes = quotes.filter(q =>
    q.state === 'Aceptada' ||
    q.state === 'Contrato en espera de firma' ||
    q.state === 'Contrato firmado' ||
    q.state === 'Finalizada'
  );

  // Eventos con taquilla (Publicado, En Venta, Finalizada, Cerrado)
  const activeEvents = events.filter(e =>
    e.state === 'Publicado' ||
    e.state === 'En Venta' ||
    e.state === 'Finalizada' ||
    e.state === 'Cerrado'
  );

  // 1. Ingresos
  const eventsTickets = activeEvents.reduce((sum, e) => {
    if (e.closure?.grossRevenue) return sum + e.closure.grossRevenue;
    if (e.sales?.grossRevenue) return sum + e.sales.grossRevenue;
    return sum + grossTicketRevenue(e);
  }, 0);

  const privateQuotes = activeQuotes.reduce((sum, q) => sum + (q.totalAmount || 0), 0);

  // Ingresos extraordinarios del libro diario
  const sponsorships = transactions
    .filter(t => t.type === 'ingreso' && t.category === 'patrocinio')
    .reduce((sum, t) => sum + t.amount, 0) || 120_000;

  const barConcessions = transactions
    .filter(t => t.type === 'ingreso' && t.category === 'concesion_barra')
    .reduce((sum, t) => sum + t.amount, 0) || 55_000;

  const otherIncome = transactions
    .filter(t => t.type === 'ingreso' && t.category === 'otro_ingreso')
    .reduce((sum, t) => sum + t.amount, 0) || 30_000;

  const grossRevenueTotal = eventsTickets + privateQuotes + sponsorships + barConcessions + otherIncome;

  // 2. Costos de Venta / Directos (COGS)
  const quotesArtistFees = activeQuotes.reduce((sum, q) => sum + (q.artistFee || 0), 0);
  const eventsArtistFees = activeEvents.reduce((sum, e) => {
    if (e.closure?.payouts?.length) return sum + totalPayouts(e);
    return sum + lineupTotalCost(e);
  }, 0);
  const artistFeesTotal = quotesArtistFees + eventsArtistFees;

  const quotesSound = activeQuotes.reduce((sum, q) => sum + (q.soundCost || 0), 0);
  const eventsSoundAndStage = activeEvents.reduce((sum, e) => {
    if (e.closure?.expenses?.length) return sum + totalExpenses(e);
    return sum + productionCost(e);
  }, 0);
  const technicalProductionTotal = quotesSound + eventsSoundAndStage;

  const venueRentalsTotal = activeEvents.reduce((sum, e) => {
    const venueExp = (e.productionItems || [])
      .filter(p => p.category === 'Recinto')
      .reduce((s, p) => s + (p.amount || 0), 0);
    return sum + (venueExp || 45_000);
  }, 0);

  const quotesViaticos = activeQuotes.reduce((sum, q) => sum + (q.viaticosCost || 0), 0);
  const eventsViaticos = activeEvents.reduce((sum, e) => {
    const viatExp = (e.productionItems || [])
      .filter(p => p.category === 'Transporte y Logística')
      .reduce((s, p) => s + (p.amount || 0), 0);
    return sum + (viatExp || 25_000);
  }, 0);
  const viaticosLogisticsTotal = quotesViaticos + eventsViaticos;

  const costOfSalesTotal = artistFeesTotal + technicalProductionTotal + venueRentalsTotal + viaticosLogisticsTotal;
  const grossProfit = grossRevenueTotal - costOfSalesTotal;
  const grossMarginPercent = calcPercent(grossProfit, grossRevenueTotal);

  // 3. Gastos Operativos (OpEx)
  const marketingPress = 160_000;
  const staffPayroll = 195_000;
  const permitsInsurance = 75_000;
  const administrative = 90_000;
  const opExTotal = marketingPress + staffPayroll + permitsInsurance + administrative;

  const operatingIncomeEBITDA = grossProfit - opExTotal;
  const operatingMarginPercent = calcPercent(operatingIncomeEBITDA, grossRevenueTotal);

  // 4. Repartos / Splits a Managers Co-organizadores
  const managerSplitsExpense = activeEvents.reduce((sum, e) => {
    const net = netResult(e);
    if (net <= 0) return sum;
    const agrs = e.managerAgreements || [];
    const splits = agrs
      .filter(a => a.role === 'coorganizador')
      .reduce((s, a) => {
        if (a.settlementKind === 'porcentaje') return s + (net * ((a.percent || 0) / 100));
        return s + (a.fixedAmount || 0);
      }, 0);
    return sum + splits;
  }, 0);

  // 5. Utilidad Neta Definitiva para Acordex Records
  const taxesProvision = Math.max(0, Math.round((operatingIncomeEBITDA - managerSplitsExpense) * 0.16));
  const netProfitAcordex = operatingIncomeEBITDA - managerSplitsExpense - taxesProvision;
  const netMarginPercent = calcPercent(netProfitAcordex, grossRevenueTotal);

  const periodLabels: Record<string, string> = {
    mes: 'Mes Actual (Agosto 2026)',
    q3: 'Tercer Trimestre Q3 2026',
    anual: 'Ejercicio Fiscal 2026',
    historico: 'Consolidado Histórico Global'
  };

  return {
    periodLabel: periodLabels[period] || 'Consolidado General',
    dateRange: { start: '2026-01-01', end: '2026-12-31' },
    grossRevenue: {
      total: grossRevenueTotal,
      eventsTickets,
      privateQuotes,
      sponsorships,
      barConcessions,
      other: otherIncome
    },
    costOfSales: {
      total: costOfSalesTotal,
      artistFees: artistFeesTotal,
      technicalProduction: technicalProductionTotal,
      venueRentals: venueRentalsTotal,
      viaticosLogistics: viaticosLogisticsTotal
    },
    grossProfit,
    grossMarginPercent,
    operatingExpenses: {
      total: opExTotal,
      marketingPress,
      staffPayroll,
      permitsInsurance,
      administrative
    },
    operatingIncomeEBITDA,
    operatingMarginPercent,
    managerSplitsExpense,
    taxesProvision,
    netProfitAcordex,
    netMarginPercent
  };
}

// ─── 2. SALDOS EN CUENTAS BANCARIAS / TESORERÍA ─────────────────────────────

export function calculateAccounts(
  cards: ReceivingCard[],
  transactions: FinanceTransaction[]
): FinanceAccount[] {
  const baseBalances: Record<string, number> = {
    'card-bbva-01': 2_450_000,
    'card-banamex-02': 1_180_000,
    'card-banorte-03': 640_000,
    'caja-chica-04': 85_000
  };

  const accountDefs: FinanceAccount[] = [
    {
      id: 'card-bbva-01',
      name: 'BBVA Empresarial Maestra',
      bankName: 'BBVA México',
      accountNumber: '**** 4921',
      clabe: '012180001234567890',
      type: 'banco',
      balance: baseBalances['card-bbva-01'],
      colorVariant: 'primary',
      description: 'Cuenta Maestra de Operaciones'
    },
    {
      id: 'card-banamex-02',
      name: 'Citibanamex Taquilla & Producción',
      bankName: 'Citibanamex',
      accountNumber: '**** 8812',
      clabe: '002180009876543210',
      type: 'banco',
      balance: baseBalances['card-banamex-02'],
      colorVariant: 'cyan',
      description: 'Recaudación de Taquillas & Boletos'
    },
    {
      id: 'card-banorte-03',
      name: 'Banorte Nómina & Talento',
      bankName: 'Banorte',
      accountNumber: '**** 1042',
      clabe: '072180004567890123',
      type: 'banco',
      balance: baseBalances['card-banorte-03'],
      colorVariant: 'purple',
      description: 'Pago a Músicos & Cuadrillas'
    },
    {
      id: 'caja-chica-04',
      name: 'Caja Chica Efectivo Recintos',
      bankName: 'Tesorería Físico',
      accountNumber: 'CAJA-01',
      clabe: 'N/A Efectivo',
      type: 'caja_chica',
      balance: baseBalances['caja-chica-04'],
      colorVariant: 'warning',
      description: 'Efectivo en Mano para Gastos'
    }
  ];

  // Ajustar saldos dinámicamente con las transacciones registradas
  for (const acc of accountDefs) {
    const accTrx = transactions.filter(t => t.accountId === acc.id && t.status !== 'cancelado');
    const income = accTrx.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0);
    const expense = accTrx.filter(t => t.type === 'egreso').reduce((s, t) => s + t.amount, 0);
    acc.balance = Math.max(0, acc.balance + income - expense);
  }

  return accountDefs;
}

// ─── 3. CUENTAS POR COBRAR (C x C) ──────────────────────────────────────────

export function calculateReceivables(quotes: Quote[], events: EventItem[]): ReceivableItem[] {
  const list: ReceivableItem[] = [];

  // Cotizaciones con saldos pendientes
  for (const q of quotes) {
    if (q.state === 'Cancelada' || q.state === 'Cancelada con Imprevisto') continue;

    const total = q.totalAmount || 0;
    let paid = 0;

    if (q.paymentStatus === 'Pago Confirmado 100%') {
      paid = total;
    } else if (q.paymentStatus === 'Anticipo 50%') {
      paid = Math.round(total * 0.5);
    } else {
      paid = 0;
    }

    const pending = total - paid;
    if (pending > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = q.paymentDueDate ? new Date(q.paymentDueDate + 'T00:00:00') : new Date(q.proposedDate + 'T00:00:00');
      const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

      let status: ReceivableItem['status'] = 'al_corriente';
      if (diffDays < 0) {
        status = 'vencido';
      } else if (diffDays <= 7) {
        status = 'por_vencer';
      }

      // Revisar si algún milestone tiene mora
      const moratorioMilestone = (q.paymentMilestones || []).find(m => m.hasMoratorio || m.status === 'Moratorio');
      let moratorioAmount = 0;
      let moratorioReason = '';

      if (moratorioMilestone) {
        status = 'moratorio';
        moratorioAmount = moratorioMilestone.moratorioAmountCalculated || (moratorioMilestone.moratorioValue || 5000);
        moratorioReason = moratorioMilestone.moratorioReason || 'Retraso en liquidación de anticipo pactado';
      }

      list.push({
        id: `REC-${q.id}`,
        source: 'quote',
        concept: `Contratación ${q.eventType || 'Show'} · ${q.groupName}`,
        clientOrAgency: `${q.clientName} (${q.clientCompany || 'Particular'})`,
        totalAmount: total + moratorioAmount,
        paidAmount: paid,
        pendingAmount: pending + moratorioAmount,
        dueDate: q.paymentDueDate || q.proposedDate,
        status,
        hasMoratorio: !!moratorioMilestone,
        moratorioAmount,
        moratorioReason,
        relatedId: q.id,
        contactPhone: q.representativePhone || '+52 81 2345 6789',
        contactEmail: q.clientEmail,
        milestones: q.paymentMilestones
      });
    }
  }

  // Boletos en taquilla física por conciliar de eventos activos
  for (const e of events) {
    if (e.state === 'En Venta' || e.state === 'Publicado') {
      const totalPot = (e.ticketTiers || []).reduce((s, t) => s + (t.totalSeats || 0) * (t.price || 0), 0);
      const collected = grossTicketRevenue(e);
      const inBoxOffice = Math.round(totalPot * 0.15); // Estimación del 15% en consignación

      if (inBoxOffice > 0) {
        list.push({
          id: `REC-EVT-${e.id}`,
          source: 'event_boxoffice',
          concept: `Consignación Taquilla Física · ${e.title}`,
          clientOrAgency: `Puntos de Venta ${e.venue}`,
          totalAmount: inBoxOffice,
          paidAmount: Math.round(inBoxOffice * 0.4),
          pendingAmount: Math.round(inBoxOffice * 0.6),
          dueDate: e.date,
          status: 'al_corriente',
          relatedId: e.id
        });
      }
    }
  }

  return list.sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
}

// ─── 4. CUENTAS POR PAGAR (C x P) ──────────────────────────────────────────

export function calculatePayables(quotes: Quote[], events: EventItem[]): PayableItem[] {
  const list: PayableItem[] = [];

  // Honorarios de grupos en cotizaciones aceptadas/firmadas
  for (const q of quotes) {
    if (q.state === 'Contrato firmado' || q.state === 'Finalizada') {
      const fee = q.artistFee || 0;
      if (fee > 0) {
        list.push({
          id: `PAY-Q-${q.id}`,
          source: 'quote_artist',
          concept: `Honorarios por presentación privada (${q.venue})`,
          beneficiaryName: q.groupName,
          category: 'honorarios_artistas',
          totalAmount: fee,
          paidAmount: q.state === 'Finalizada' ? fee : Math.round(fee * 0.5),
          pendingAmount: q.state === 'Finalizada' ? 0 : Math.round(fee * 0.5),
          dueDate: q.proposedDate,
          status: q.state === 'Finalizada' ? 'pagado' : 'programado',
          relatedId: q.id,
          bankDetails: 'Banorte · Cuenta Concentradora de Talento'
        });
      }
    }
  }

  // Compromisos de eventos masivos (Artistas del cartel, Audio, Recinto, Seguridad)
  for (const e of events) {
    if (e.state === 'Publicado' || e.state === 'En Venta' || e.state === 'Finalizada' || e.state === 'Cerrado') {
      // 1. Grupos del cartel
      for (const slot of e.lineup || []) {
        const cost = slotCost(slot) || 180_000;
        const isPaid = e.state === 'Cerrado' || (e.closure?.payouts || []).some(p => p.groupName === slot.groupName && p.status === 'Pagado');
        const isConfirmed = slot.approval === 'Aprobado' || slot.approval === 'No Requiere';
        const paid = isPaid ? cost : (isConfirmed ? Math.round(cost * 0.5) : 0);

        list.push({
          id: `PAY-SLOT-${slot.id}`,
          source: 'event_lineup',
          concept: `Honorarios Cartel Masivo · ${e.title}`,
          beneficiaryName: slot.groupName,
          category: 'honorarios_artistas',
          totalAmount: cost,
          paidAmount: paid,
          pendingAmount: Math.max(0, cost - paid),
          dueDate: e.date,
          status: isPaid ? 'pagado' : (paid > 0 ? 'programado' : 'pendiente'),
          relatedId: e.id,
          bankDetails: 'SPEI Interbancario Registrado'
        });
      }

      // 2. Proveedores de Audio & Escenario
      const prodCost = productionCost(e);
      if (prodCost > 0) {
        const isClosed = e.state === 'Cerrado' || e.state === 'Finalizada';
        const paidAudio = isClosed ? prodCost : Math.round(prodCost * 0.6);

        list.push({
          id: `PAY-PROD-${e.id}`,
          source: 'production_vendor',
          concept: `Sistema de Audio, Iluminación & Pantallas LED (${e.sound?.providerName || 'ProAudio Bajío'})`,
          beneficiaryName: e.sound?.providerName || 'Audio & Escenarios del Norte S.A.',
          category: 'produccion_audio',
          totalAmount: prodCost,
          paidAmount: paidAudio,
          pendingAmount: Math.max(0, prodCost - paidAudio),
          dueDate: e.date,
          status: isClosed ? 'pagado' : 'programado',
          relatedId: e.id
        });
      }
    }
  }

  return list.sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
}

// ─── 5. RENTABILIDAD POR GRUPO / TALENTO ─────────────────────────────────────

export function calculateGroupPerformance(
  groups: GroupItem[],
  quotes: Quote[],
  events: EventItem[]
): GroupFinancialPerformance[] {
  return groups.map(g => {
    // Cotizaciones del grupo
    const gQuotes = quotes.filter(q =>
      q.groupName === g.name &&
      (q.state === 'Aceptada' || q.state === 'Contrato firmado' || q.state === 'Finalizada')
    );

    const quotesGross = gQuotes.reduce((s, q) => s + (q.totalAmount || 0), 0);
    const quotesFees = gQuotes.reduce((s, q) => s + (q.artistFee || 0), 0);
    const quotesViaticos = gQuotes.reduce((s, q) => s + (q.viaticosCost || 0), 0);
    const quotesMargin = gQuotes.reduce((s, q) => s + (q.marginAmount || 0), 0);

    // Eventos donde el grupo forma parte del cartel
    const gEvents = events.filter(e =>
      (e.state === 'Publicado' || e.state === 'En Venta' || e.state === 'Finalizada' || e.state === 'Cerrado') &&
      (e.lineup || []).some(s => s.groupName === g.name)
    );

    let eventsGrossAttributed = 0;
    let eventsFees = 0;
    let eventsProdCosts = 0;

    for (const e of gEvents) {
      const slot = (e.lineup || []).find(s => s.groupName === g.name);
      const slotFee = slot ? slotCost(slot) : 200_000;
      eventsFees += slotFee;

      const totalLineupFees = lineupTotalCost(e) || 1;
      const weight = slotFee / totalLineupFees;

      const eGross = e.closure?.grossRevenue ?? grossTicketRevenue(e);
      eventsGrossAttributed += Math.round(eGross * weight);
      eventsProdCosts += Math.round(productionCost(e) * weight);
    }

    const totalShows = gQuotes.length + gEvents.length;
    const grossRevenueTotal = quotesGross + eventsGrossAttributed;
    const artistFeesTotal = quotesFees + eventsFees;
    const viaticosTotal = quotesViaticos + (gEvents.length * 35_000);
    const productionCostsTotal = quotesViaticos + eventsProdCosts;

    // Ganancia neta retenida por Acordex
    const netDisqueraProfit = quotesMargin + Math.max(0, eventsGrossAttributed - eventsFees - eventsProdCosts);
    const profitMarginPercent = calcPercent(netDisqueraProfit, grossRevenueTotal);
    const avgTicketOrFee = totalShows > 0 ? Math.round(grossRevenueTotal / totalShows) : 0;
    const totalDirectCost = artistFeesTotal + productionCostsTotal + viaticosTotal;
    const roiPercent = totalDirectCost > 0 ? Math.round((netDisqueraProfit / totalDirectCost) * 100) : 0;

    return {
      groupId: g.id,
      groupName: g.name,
      image: g.image,
      genre: g.genre,
      disqueraType: g.disqueraType,
      totalShows,
      privateQuotesCount: gQuotes.length,
      massiveEventsCount: gEvents.length,
      grossRevenueGenerated: grossRevenueTotal,
      artistFeesReceived: artistFeesTotal,
      productionCostsAttributed: productionCostsTotal,
      viaticosSpent: viaticosTotal,
      netDisqueraProfit,
      profitMarginPercent,
      avgTicketOrFee,
      roiPercent
    };
  }).sort((a, b) => b.netDisqueraProfit - a.netDisqueraProfit);
}

// ─── 6. LIQUIDACIONES DE MANAGERS (SPLITS) ──────────────────────────────────

export function calculateManagerSettlements(events: EventItem[]): ManagerSettlementSummary[] {
  const managerMap = new Map<string, ManagerSettlementEventDetail[]>();

  for (const e of events) {
    const agrs = e.managerAgreements || [];
    const isRelevant = e.state === 'Publicado' || e.state === 'En Venta' || e.state === 'Finalizada' || e.state === 'Cerrado';
    if (!isRelevant) continue;

    const gross = e.closure?.grossRevenue ?? grossTicketRevenue(e);
    const prodExp = e.closure?.expenses?.length ? totalExpenses(e) : productionCost(e);
    const net = netResult(e);

    for (const agr of agrs) {
      if (agr.role === 'organizador' && agrs.length === 1) continue; // Organizador solo sin socios

      let mgrShare = 0;
      if (agr.settlementKind === 'porcentaje') {
        mgrShare = Math.max(0, Math.round(net * ((agr.percent || 0) / 100)));
      } else {
        mgrShare = agr.fixedAmount || 0;
      }
      const acordexShare = Math.max(0, net - mgrShare);

      const isConf = !!(e.closure?.managerConfirmations || []).some(c => c.managerName === agr.managerName);
      const isPaid = e.state === 'Cerrado';

      const detail: ManagerSettlementEventDetail = {
        eventId: e.id,
        title: e.title,
        date: e.date,
        grossRevenue: gross,
        productionExpenses: prodExp,
        netResult: net,
        agreementKind: agr.settlementKind,
        agreementValue: agr.settlementKind === 'porcentaje' ? (agr.percent || 0) : (agr.fixedAmount || 0),
        managerShareAmount: mgrShare,
        acordexShareAmount: acordexShare,
        isConfirmed: isConf,
        confirmedAt: isConf ? (e.closure?.sealedAt || '2026-08-11') : undefined,
        isPaid,
        paidAt: isPaid ? (e.closure?.sealedAt || '2026-08-11') : undefined,
        receiptReference: isPaid ? `FIN-MGR-${e.id.slice(-4)}` : undefined
      };

      const currentList = managerMap.get(agr.managerName) || [];
      currentList.push(detail);
      managerMap.set(agr.managerName, currentList);
    }
  }

  const summaries: ManagerSettlementSummary[] = [];

  for (const [managerName, evts] of managerMap.entries()) {
    const grossTotal = evts.reduce((s, d) => s + d.grossRevenue, 0);
    const prodTotal = evts.reduce((s, d) => s + d.productionExpenses, 0);
    const netTotal = evts.reduce((s, d) => s + d.netResult, 0);
    const mgrShareTotal = evts.reduce((s, d) => s + d.managerShareAmount, 0);
    const acordexShareTotal = evts.reduce((s, d) => s + d.acordexShareAmount, 0);
    const paidTotal = evts.filter(d => d.isPaid).reduce((s, d) => s + d.managerShareAmount, 0);
    const pendingTotal = mgrShareTotal - paidTotal;

    let status: ManagerSettlementSummary['status'] = 'al_dia';
    if (pendingTotal > 0) {
      status = evts.some(d => !d.isConfirmed) ? 'pendiente_firma' : 'pendiente_pago';
    } else if (mgrShareTotal > 0) {
      status = 'finiquitado';
    }

    summaries.push({
      managerName,
      totalEventsCoOrganized: evts.length,
      grossRevenueGenerated: grossTotal,
      productionExpensesCharged: prodTotal,
      netSharedProfit: netTotal,
      managerShareAmount: mgrShareTotal,
      acordexShareAmount: acordexShareTotal,
      paidAmount: paidTotal,
      pendingAmount: pendingTotal,
      status,
      events: evts
    });
  }

  return summaries.sort((a, b) => b.managerShareAmount - a.managerShareAmount);
}

// ─── 7. SIMULADOR DE ESCENARIOS Y PROYECCIONES ──────────────────────────────

export function runFinancialSimulation(
  basePL: ProfitAndLossReport,
  params: FinancialSimulationParams
): FinancialSimulationResult {
  // 1. Ingresos simulados
  const simulatedTickets = basePL.grossRevenue.eventsTickets * params.ticketPriceMultiplier * (params.occupancyTargetPercent / 75);
  const simulatedQuotes = basePL.grossRevenue.privateQuotes * params.quoteVolumeMultiplier;
  const simulatedGrossRevenue = Math.round(simulatedTickets + simulatedQuotes + basePL.grossRevenue.sponsorships + basePL.grossRevenue.other);

  // 2. Costos simulados
  const simulatedArtistFees = Math.round(basePL.costOfSales.artistFees * (1 - params.artistFeeNegotiationMargin));
  const simulatedProduction = Math.round(basePL.costOfSales.technicalProduction * (1 - params.productionCostReduction));
  const simulatedDirectCosts = simulatedArtistFees + simulatedProduction + basePL.costOfSales.venueRentals + basePL.costOfSales.viaticosLogistics;

  const simulatedGrossProfit = simulatedGrossRevenue - simulatedDirectCosts;
  const simulatedOpEx = basePL.operatingExpenses.total;

  const simulatedEBITDA = simulatedGrossProfit - simulatedOpEx;
  const simulatedTaxes = Math.max(0, Math.round(simulatedEBITDA * 0.16));
  const simulatedNetProfit = simulatedEBITDA - basePL.managerSplitsExpense - simulatedTaxes;
  const simulatedNetMarginPercent = calcPercent(simulatedNetProfit, simulatedGrossRevenue);

  const profitDeltaAmount = simulatedNetProfit - basePL.netProfitAcordex;
  const profitDeltaPercent = basePL.netProfitAcordex > 0
    ? Math.round((profitDeltaAmount / basePL.netProfitAcordex) * 100)
    : 0;

  let recommendationNote = '';
  if (profitDeltaAmount > 500_000) {
    recommendationNote = 'Escenario de Alto Rendimiento: El ajuste en precio de boletos y optimización de producción incrementa la utilidad neta en más de medio millón de pesos sin saturar la agenda.';
  } else if (profitDeltaAmount > 0) {
    recommendationNote = 'Escenario Positivo: Se proyecta una mejora constante en los márgenes de operación.';
  } else {
    recommendationNote = 'Escenario Conservador: Mantener los costos controlados es indispensable para evitar contracciones en el margen neto.';
  }

  return {
    simulatedGrossRevenue,
    simulatedDirectCosts,
    simulatedGrossProfit,
    simulatedOpEx,
    simulatedNetProfit,
    simulatedNetMarginPercent,
    profitDeltaAmount,
    profitDeltaPercent,
    recommendationNote
  };
}
