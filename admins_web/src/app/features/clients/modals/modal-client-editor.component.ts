import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientItem } from '../../../core/models/admin.models';

/**
 * Modal de Creación y Edición Completa de Clientes CRM.
 */
@Component({
  selector: 'app-modal-client-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div class="w-full max-w-2xl rounded-3xl bg-[#1A1A1A] border border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-xl shadow-inner">
              {{ isEditing() ? 'edit' : 'person_add' }}
            </span>
            <div>
              <h3 class="text-base sm:text-lg font-black text-on-surface font-['Epilogue']">
                {{ isEditing() ? 'Editar Cuenta Comercial CRM' : 'Alta de Nuevo Cliente / Promotor' }}
              </h3>
              <p class="text-xs text-outline font-['Epilogue']">Expediente comercial, perfil tributario y condiciones preferenciales</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-[#222222] text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Formulario -->
        <div class="space-y-4 text-xs">

          <!-- 1. DATOS BÁSICOS -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Nombre Completo del Titular <span class="text-rose-400">*</span></label>
              <input
                type="text"
                [(ngModel)]="formName"
                placeholder="Ej. Roberto Gómez Garza"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
              />
            </div>

            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Razón Social / Empresa <span class="text-rose-400">*</span></label>
              <input
                type="text"
                [(ngModel)]="formCompany"
                placeholder="Ej. Promociones del Norte SA de CV"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
              />
            </div>
          </div>

          <!-- 2. SEGMENTO, TIER & STATUS -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Segmento Comercial</label>
              <select
                [(ngModel)]="formSegment"
                class="w-full px-3 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
              >
                <option value="Empresario de Palenque / Feria">Empresarios de Palenques & Ferias</option>
                <option value="Promotor de Bailes">Promotores de Espectáculos Masivos</option>
                <option value="Particular (Boda/XV)">Eventos Sociales Particulares</option>
                <option value="Corporativo / Empresa">Eventos Corporativos & Marcas</option>
                <option value="Gobierno / Municipio">Patronatos & Gobiernos Municipales</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Clasificación / Tier</label>
              <select
                [(ngModel)]="formTier"
                class="w-full px-3 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
              >
                <option value="Diamante">💎 Tier Diamante</option>
                <option value="Oro">🥇 Tier Oro</option>
                <option value="Plata">🥈 Tier Plata</option>
                <option value="Prospecto">🎯 Prospecto Comercial</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Estatus Operativo</label>
              <select
                [(ngModel)]="formStatus"
                class="w-full px-3 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
              >
                <option value="Frecuente">Frecuente (Alta Recurrencia)</option>
                <option value="Activo">Activo</option>
                <option value="Prospecto">En Prospección</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Lista Negra">Lista Negra / Restringido</option>
              </select>
            </div>
          </div>

          <!-- 3. CONTACTO & UBICACIÓN -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Correo Electrónico Corporativo</label>
              <input
                type="email"
                [(ngModel)]="formEmail"
                placeholder="contacto@empresa.com"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
              />
            </div>

            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Teléfono / WhatsApp Directo</label>
              <input
                type="text"
                [(ngModel)]="formPhone"
                placeholder="+52 81 8392 1029"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary text-xs font-mono shadow-inner"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Plaza / Ciudad Principal</label>
              <input
                type="text"
                [(ngModel)]="formCity"
                placeholder="Monterrey"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
              />
            </div>

            <div class="space-y-1.5">
              <label class="font-bold text-on-surface font-['Epilogue']">Estado / Región</label>
              <input
                type="text"
                [(ngModel)]="formState"
                placeholder="Nuevo León"
                class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
              />
            </div>
          </div>

          <!-- 4. DATOS FISCALES / FACTURACIÓN (COLAPSIBLE / OPCIONAL) -->
          <div class="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-3 shadow-inner">
            <h4 class="font-bold text-on-surface flex items-center gap-1.5 font-['Epilogue']">
              <span class="material-symbols-outlined text-primary text-base">receipt_long</span>
              Datos Fiscales de Facturación SAT (Opcional)
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <span class="text-[10px] text-outline uppercase font-bold font-['Epilogue']">RFC Tributario</span>
                <input
                  type="text"
                  [(ngModel)]="formRfc"
                  placeholder="PNO180412KJ9"
                  class="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary uppercase font-mono"
                />
              </div>

              <div class="space-y-1">
                <span class="text-[10px] text-outline uppercase font-bold font-['Epilogue']">Régimen Fiscal</span>
                <input
                  type="text"
                  [(ngModel)]="formTaxRegime"
                  placeholder="601 - General de Ley Personas Morales"
                  class="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
                />
              </div>
            </div>

            <div class="space-y-1">
              <span class="text-[10px] text-outline uppercase font-bold font-['Epilogue']">Domicilio Fiscal Completo</span>
              <input
                type="text"
                [(ngModel)]="formBillingAddress"
                placeholder="Av. Constitución 2400, Monterrey, NL, CP 64060"
                class="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-white/10 text-on-surface text-xs focus:outline-none focus:border-primary font-['Epilogue']"
              />
            </div>
          </div>

          <!-- 5. NOTAS DE SERVICIO -->
          <div class="space-y-1.5">
            <label class="font-bold text-on-surface font-['Epilogue']">Notas & Preferencias de Contratación</label>
            <textarea
              [(ngModel)]="formNotes"
              rows="2"
              placeholder="Condiciones de pago acordadas, requerimientos de hospedaje, preferencias de elenco..."
              class="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary text-xs font-['Epilogue'] shadow-inner"
            ></textarea>
          </div>

        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10 text-xs">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2.5 rounded-xl bg-[#222222] hover:bg-[#282828] text-outline hover:text-on-surface font-bold transition-all cursor-pointer font-['Epilogue']"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="submitForm()"
            [disabled]="!formName.trim() || !formCompany.trim()"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-on-primary font-black shadow-lg shadow-primary/20 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 font-['Epilogue']"
          >
            <span class="material-symbols-outlined text-base">save</span>
            {{ isEditing() ? 'Guardar Cambios' : 'Registrar Cliente' }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalClientEditorComponent {
  clientToEdit = input<ClientItem | null>(null);

  saved = output<ClientItem>();
  closed = output<void>();

  isEditing = signal(false);

  formName = '';
  formCompany = '';
  formSegment: any = 'Promotor de Bailes';
  formTier: any = 'Plata';
  formStatus: any = 'Activo';
  formEmail = '';
  formPhone = '';
  formCity = 'Monterrey';
  formState = 'Nuevo León';
  formNotes = '';

  formRfc = '';
  formTaxRegime = '';
  formBillingAddress = '';

  ngOnInit(): void {
    const edit = this.clientToEdit();
    if (edit) {
      this.isEditing.set(true);
      this.formName = edit.name;
      this.formCompany = edit.company;
      this.formSegment = edit.segment || 'Promotor de Bailes';
      this.formTier = edit.tier || 'Plata';
      this.formStatus = edit.status;
      this.formEmail = edit.email;
      this.formPhone = edit.phone;
      this.formCity = edit.city || 'Monterrey';
      this.formState = edit.state || 'Nuevo León';
      this.formNotes = edit.notes;

      if (edit.taxInfo) {
        this.formRfc = edit.taxInfo.rfc || '';
        this.formTaxRegime = edit.taxInfo.taxRegime || '';
        this.formBillingAddress = edit.taxInfo.billingAddress || '';
      }
    }
  }

  submitForm(): void {
    if (!this.formName.trim() || !this.formCompany.trim()) return;

    const client: ClientItem = {
      id: this.clientToEdit()?.id || `CLI-${Math.floor(510 + Math.random() * 90)}`,
      name: this.formName.trim(),
      company: this.formCompany.trim(),
      segment: this.formSegment,
      tier: this.formTier,
      status: this.formStatus,
      email: this.formEmail.trim(),
      phone: this.formPhone.trim(),
      whatsapp: this.formPhone.replace(/[^0-9+]/g, ''),
      city: this.formCity.trim(),
      state: this.formState.trim(),
      rating: this.clientToEdit()?.rating || 5,
      totalEvents: this.clientToEdit()?.totalEvents || 0,
      totalSpent: this.clientToEdit()?.totalSpent || 0,
      averageTicket: this.clientToEdit()?.averageTicket || 0,
      lastQuoteDate: this.clientToEdit()?.lastQuoteDate || new Date().toISOString().slice(0, 10),
      notes: this.formNotes.trim(),
      taxInfo: this.formRfc ? {
        rfc: this.formRfc.trim().toUpperCase(),
        taxName: this.formCompany.trim(),
        taxRegime: this.formTaxRegime.trim(),
        billingAddress: this.formBillingAddress.trim()
      } : this.clientToEdit()?.taxInfo,
      favoriteGenres: this.clientToEdit()?.favoriteGenres || ['Norteño Sax'],
      preferredArtists: this.clientToEdit()?.preferredArtists || [],
      interactions: this.clientToEdit()?.interactions || [],
      offersSent: this.clientToEdit()?.offersSent || []
    };

    this.saved.emit(client);
  }
}
