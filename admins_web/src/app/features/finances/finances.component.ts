import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { AccessRestrictedComponent } from '../../shared/ui/access-restricted/access-restricted.component';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { TabPillsComponent, TabPillItem } from '../../shared/ui/tab-pills/tab-pills.component';

import {
  FinanceTransaction,
  FinanceCategory,
  FinanceTransactionType,
  ReceivableItem,
  PayableItem,
  GroupFinancialPerformance,
  ManagerSettlementSummary,
  ManagerSettlementEventDetail,
  CashCutRecord
} from '../../core/models/finance.models';

import {
  calculateProfitAndLoss,
  calculateAccounts,
  calculateReceivables,
  calculatePayables,
  calculateGroupPerformance,
  calculateManagerSettlements
} from './finance-metrics';

import { FinanceKpisComponent } from './components/finance-kpis.component';
import { FinanceTabPlComponent } from './components/finance-tab-pl.component';
import { FinanceTabCashcutComponent } from './components/finance-tab-cashcut.component';
import { FinanceTabCashflowComponent } from './components/finance-tab-cashflow.component';
import { FinanceTabReceivablesComponent } from './components/finance-tab-receivables.component';
import { FinanceTabPayablesComponent } from './components/finance-tab-payables.component';
import { FinanceTabTalentComponent } from './components/finance-tab-talent.component';
import { FinanceTabManagersComponent } from './components/finance-tab-managers.component';
import { FinanceTabSimulatorComponent } from './components/finance-tab-simulator.component';

import { ModalNewTransactionComponent } from './modals/modal-new-transaction.component';
import { ModalReconcileReceiptComponent } from './modals/modal-reconcile-receipt.component';
import { ModalRecordPaymentComponent } from './modals/modal-record-payment.component';
import { ModalCashAuditComponent } from './modals/modal-cash-audit.component';
import { ModalManagerSettlementComponent } from './modals/modal-manager-settlement.component';
import { ModalArtistStatementComponent } from './modals/modal-artist-statement.component';

export type FinanceTab =
  | 'pnl'
  | 'cashcut'
  | 'cashflow'
  | 'receivables'
  | 'payables'
  | 'talent'
  | 'managers'
  | 'simulator';

/**
 * Módulo de Finanzas & Economía de Acordex Records.
 *
 * Diseñado en lenguaje 100% comprensible, visual y sin tecnicismos:
 * 1. Ganancias & Pérdidas (Dinero que entró, dinero que se gastó y ganancia libre)
 * 2. Corte de Caja & Arqueo Diario (Cuadre de caja y guardado oficial del día)
 * 3. Dinero en Bancos & Movimientos (Saldos en vivo y entradas/salidas)
 * 4. Dinero por Cobrar (Clientes que nos deben anticipos y liquidaciones)
 * 5. Dinero por Pagar (Compromisos con agrupaciones y proveedores)
 * 6. ¿Qué Grupo deja más Dinero? (Ranking de rentabilidad por artista)
 * 7. Reparto con Socios y Managers (Finiquitos de co-producción)
 * 8. Calculadora de Ganancias Futuras (Simulador con deslizadores)
 */
@Component({
  selector: 'app-finances',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AccessRestrictedComponent,
    BadgeComponent,
    TabPillsComponent,
    FinanceKpisComponent,
    FinanceTabPlComponent,
    FinanceTabCashcutComponent,
    FinanceTabCashflowComponent,
    FinanceTabReceivablesComponent,
    FinanceTabPayablesComponent,
    FinanceTabTalentComponent,
    FinanceTabManagersComponent,
    FinanceTabSimulatorComponent,
    ModalNewTransactionComponent,
    ModalReconcileReceiptComponent,
    ModalRecordPaymentComponent,
    ModalCashAuditComponent,
    ModalManagerSettlementComponent,
    ModalArtistStatementComponent
  ],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-fade-in pb-12">

      <!-- Verificación de Permisos (Exclusivo Encargado) -->
      @if (!roleService.canViewFinances()) {
        <app-access-restricted
          icon="lock"
          title="Acceso Restringido - Exclusivo Encargado"
          message="El módulo de finanzas, cortes de caja, dinero en bancos y ganancias es exclusivo del perfil de Encargado Global."
          [showBackLink]="true"
        />
      } @else {

        <!-- ─── ENCABEZADO PRINCIPAL ─── -->
        <div class="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-surface-container-high/90 via-surface-container/80 to-surface-container-high/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div class="absolute -right-12 -top-12 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 min-w-0">
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-xl sm:text-2xl font-black text-on-surface tracking-tight">Finanzas & Ganancias de la Disquera</h1>
              <app-badge label="Control de Tesorería" variant="success" />
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30">
                Datos en Vivo Conectados
              </span>
            </div>
            <p class="text-xs text-outline mt-1 max-w-2xl leading-relaxed">
              Monitorea en tiempo real todo el dinero que entra por boletos y bodas, los gastos de músicos y sonido, y la ganancia libre para Acordex.
            </p>
          </div>

          <!-- Acciones Rápidas -->
          <div class="relative z-10 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              (click)="openNewTransactionModal.set(true)"
              class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-on-primary text-xs font-black shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-base">add_card</span>
              Registrar Entrada / Salida
            </button>

            <button
              type="button"
              (click)="setTab('cashcut')"
              class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-black shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-base">receipt_long</span>
              Hacer Corte de Caja
            </button>
          </div>
        </div>

        <!-- ─── KPIS FINANCIEROS DE CABECERA ─── -->
        <app-finance-kpis
          [pl]="currentPL()"
          [accounts]="accounts()"
          [receivables]="receivables()"
          [payables]="payables()"
        />

        <!-- ─── BARRA DE PESTAÑAS ─── -->
        <div class="border-b border-outline-variant/30 pb-2">
          <app-tab-pills
            [tabs]="tabOptions"
            [active]="activeTab()"
            (change)="setTab($event)"
          />
        </div>

        <!-- ─── CONTENIDO DE PESTAÑAS ─── -->

        <!-- 1. GANANCIAS & PÉRDIDAS (BALANCE GENERAL) -->
        @if (activeTab() === 'pnl') {
          <app-finance-tab-pl
            [pl]="currentPL()"
            (periodChange)="currentPeriod.set($event)"
          />
        }

        <!-- 2. CORTE DE CAJA & ARQUEO DIARIO -->
        @if (activeTab() === 'cashcut') {
          <app-finance-tab-cashcut
            [transactions]="mockData.financeTransactions()"
            [accounts]="accounts()"
            [cashCuts]="mockData.cashCuts()"
            (saveCut)="onSaveCashCut($event)"
          />
        }

        <!-- 3. DINERO EN BANCOS & MOVIMIENTOS -->
        @if (activeTab() === 'cashflow') {
          <app-finance-tab-cashflow
            [transactions]="mockData.financeTransactions()"
            [accounts]="accounts()"
            (newTransaction)="openNewTransactionModal.set(true)"
            (auditCash)="openCashAuditModal.set(true)"
            (viewReceipt)="onViewReceipt($event)"
          />
        }

        <!-- 4. DINERO POR COBRAR (CLIENTES QUE NOS DEBEN) -->
        @if (activeTab() === 'receivables') {
          <app-finance-tab-receivables
            [receivables]="receivables()"
            (recordPayment)="onRecordReceivablePayment($event)"
          />
        }

        <!-- 5. DINERO POR PAGAR (COMPROMISOS PENDIENTES) -->
        @if (activeTab() === 'payables') {
          <app-finance-tab-payables
            [payables]="payables()"
            (dispersePayment)="onDispersePayablePayment($event)"
          />
        }

        <!-- 6. ¿QUÉ GRUPO DEJA MÁS DINERO? (TALENTO) -->
        @if (activeTab() === 'talent') {
          <app-finance-tab-talent
            [performance]="groupPerformance()"
            (selectTalent)="onSelectTalent($event)"
          />
        }

        <!-- 7. REPARTO CON SOCIOS Y MANAGERS -->
        @if (activeTab() === 'managers') {
          <app-finance-tab-managers
            [settlements]="managerSettlements()"
            (openSettlementCaratula)="onOpenSettlementCaratula($event)"
          />
        }

        <!-- 8. CALCULADORA DE GANANCIAS FUTURAS -->
        @if (activeTab() === 'simulator') {
          <app-finance-tab-simulator
            [basePL]="currentPL()"
          />
        }

      }

      <!-- ─── MODALES INTERACTIVOS ─── -->

      <!-- Modal 1: Nuevo Movimiento -->
      @if (openNewTransactionModal()) {
        <app-modal-new-transaction
          [accounts]="accounts()"
          (closed)="openNewTransactionModal.set(false)"
          (saved)="onSaveNewTransaction($event)"
        />
      }

      <!-- Modal 2: Ver Comprobante y Conciliar SPEI -->
      @if (selectedTransactionForReceipt()) {
        <app-modal-reconcile-receipt
          [transaction]="selectedTransactionForReceipt()!"
          (closed)="selectedTransactionForReceipt.set(null)"
          (reconciled)="onReconcileTransaction($event)"
        />
      }

      <!-- Modal 3: Registrar Cobro o Dispersar Pago -->
      @if (paymentModalMode()) {
        <app-modal-record-payment
          [mode]="paymentModalMode()!"
          [receivable]="selectedReceivable() || undefined"
          [payable]="selectedPayable() || undefined"
          [accounts]="accounts()"
          (closed)="closePaymentModal()"
          (confirmed)="onConfirmPaymentModal($event)"
        />
      }

      <!-- Modal 4: Corte de Caja y Arqueo Certificado -->
      @if (openCashAuditModal()) {
        <app-modal-cash-audit
          [accounts]="accounts()"
          (closed)="openCashAuditModal.set(false)"
        />
      }

      <!-- Modal 5: Carátula de Finiquito a Manager -->
      @if (selectedSettlementForCaratula()) {
        <app-modal-manager-settlement
          [manager]="selectedSettlementForCaratula()!.manager"
          [event]="selectedSettlementForCaratula()!.event"
          (closed)="selectedSettlementForCaratula.set(null)"
          (payManager)="onPayManagerSettlement($event)"
        />
      }

      <!-- Modal 6: Ficha Financiera del Artista -->
      @if (selectedTalentForStatement()) {
        <app-modal-artist-statement
          [talent]="selectedTalentForStatement()!"
          (closed)="selectedTalentForStatement.set(null)"
        />
      }

    </div>
  `
})
export class FinancesComponent {
  roleService = inject(RoleService);
  mockData = inject(MockDataService);

  activeTab = signal<FinanceTab>('pnl');
  currentPeriod = signal<'mes' | 'q3' | 'anual' | 'historico'>('historico');

  // Modales
  openNewTransactionModal = signal(false);
  openCashAuditModal = signal(false);
  selectedTransactionForReceipt = signal<FinanceTransaction | null>(null);
  paymentModalMode = signal<'cobro' | 'pago' | null>(null);
  selectedReceivable = signal<ReceivableItem | null>(null);
  selectedPayable = signal<PayableItem | null>(null);
  selectedSettlementForCaratula = signal<{ manager: ManagerSettlementSummary; event: ManagerSettlementEventDetail } | null>(null);
  selectedTalentForStatement = signal<GroupFinancialPerformance | null>(null);

  readonly tabOptions: TabPillItem[] = [
    { value: 'pnl', label: 'Ganancias & Pérdidas', icon: 'query_stats' },
    { value: 'cashcut', label: 'Corte de Caja & Arqueo', icon: 'receipt_long' },
    { value: 'cashflow', label: 'Dinero en Bancos', icon: 'account_balance' },
    { value: 'receivables', label: 'Dinero por Cobrar', icon: 'point_of_sale' },
    { value: 'payables', label: 'Dinero por Pagar', icon: 'send_money' },
    { value: 'talent', label: '¿Qué Grupo deja más?', icon: 'stars' },
    { value: 'managers', label: 'Reparto con Socios', icon: 'handshake' },
    { value: 'simulator', label: 'Calculadora de Ganancias', icon: 'auto_graph' }
  ];

  setTab(tabId: string): void {
    this.activeTab.set(tabId as FinanceTab);
  }

  // Derivaciones Reactivas Integradas
  currentPL = computed(() => {
    return calculateProfitAndLoss(
      this.mockData.quotes(),
      this.mockData.events(),
      this.mockData.financeTransactions(),
      this.currentPeriod()
    );
  });

  accounts = computed(() => {
    return calculateAccounts(
      this.mockData.receivingCards(),
      this.mockData.financeTransactions()
    );
  });

  receivables = computed(() => {
    return calculateReceivables(
      this.mockData.quotes(),
      this.mockData.events()
    );
  });

  payables = computed(() => {
    return calculatePayables(
      this.mockData.quotes(),
      this.mockData.events()
    );
  });

  groupPerformance = computed(() => {
    return calculateGroupPerformance(
      this.mockData.groups(),
      this.mockData.quotes(),
      this.mockData.events()
    );
  });

  managerSettlements = computed(() => {
    return calculateManagerSettlements(
      this.mockData.events()
    );
  });

  // Handlers de Modales y Acciones
  onSaveCashCut(data: Omit<CashCutRecord, 'id' | 'cutFolio'>): void {
    this.mockData.saveCashCut(data);
  }

  onViewReceipt(trx: FinanceTransaction): void {
    this.selectedTransactionForReceipt.set(trx);
  }

  onReconcileTransaction(event: { trxId: string; reference?: string }): void {
    this.mockData.reconcileFinanceTransaction(event.trxId, event.reference);
    this.selectedTransactionForReceipt.set(null);
  }

  onSaveNewTransaction(data: {
    type: FinanceTransactionType;
    category: FinanceCategory;
    concept: string;
    amount: number;
    date: string;
    accountId: string;
    accountName: string;
    status: 'conciliado' | 'pendiente';
    receiptReference?: string;
  }): void {
    this.mockData.addFinanceTransaction(data);
    this.openNewTransactionModal.set(false);
  }

  onRecordReceivablePayment(item: ReceivableItem): void {
    this.selectedReceivable.set(item);
    this.selectedPayable.set(null);
    this.paymentModalMode.set('cobro');
  }

  onDispersePayablePayment(item: PayableItem): void {
    this.selectedPayable.set(item);
    this.selectedReceivable.set(null);
    this.paymentModalMode.set('pago');
  }

  closePaymentModal(): void {
    this.paymentModalMode.set(null);
    this.selectedReceivable.set(null);
    this.selectedPayable.set(null);
  }

  onConfirmPaymentModal(data: { targetId: string; amount: number; accountId: string; reference: string }): void {
    if (this.paymentModalMode() === 'cobro') {
      this.mockData.recordReceivablePayment(data.targetId, data.amount, data.accountId, data.reference);
    } else {
      this.mockData.dispersePayablePayment(data.targetId, data.amount, data.accountId, data.reference);
    }
    this.closePaymentModal();
  }

  onOpenSettlementCaratula(data: { manager: ManagerSettlementSummary; event: ManagerSettlementEventDetail }): void {
    this.selectedSettlementForCaratula.set(data);
  }

  onPayManagerSettlement(data: { manager: ManagerSettlementSummary; event: ManagerSettlementEventDetail }): void {
    this.mockData.recordManagerSettlementPayout(
      data.manager.managerName,
      data.event.eventId,
      data.event.managerShareAmount,
      'card-bbva-01',
      `SPEI-MGR-${Date.now().toString().slice(-4)}`
    );
    this.selectedSettlementForCaratula.set(null);
  }

  onSelectTalent(talent: GroupFinancialPerformance): void {
    this.selectedTalentForStatement.set(talent);
  }
}
