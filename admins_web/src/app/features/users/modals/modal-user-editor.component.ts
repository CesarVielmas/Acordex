import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserItem, Role } from '../../../core/models/admin.models';

@Component({
  selector: 'app-modal-user-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div class="w-full max-w-lg rounded-3xl bg-surface-container border border-outline-variant/30 shadow-2xl p-6 space-y-5">

        <!-- Encabezado -->
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center material-symbols-outlined text-lg">
              {{ isEditing() ? 'manage_accounts' : 'person_add' }}
            </span>
            <div>
              <h3 class="text-base font-black text-on-surface">
                {{ isEditing() ? 'Editar Personal' : 'Registrar Nuevo Personal' }}
              </h3>
              <p class="text-xs text-outline">Datos de contacto, asignación de rol y departamento</p>
            </div>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-8 h-8 rounded-xl bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-all cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Formulario -->
        <div class="space-y-3.5 text-xs">

          <div class="space-y-1.5">
            <label class="font-bold text-on-surface">Nombre Completo <span class="text-rose-400">*</span></label>
            <input
              type="text"
              [(ngModel)]="formName"
              placeholder="Ej. Lic. Fernando Treviño"
              class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-bold text-on-surface">Correo Electrónico <span class="text-rose-400">*</span></label>
              <input
                type="email"
                [(ngModel)]="formEmail"
                placeholder="ftrevino@acordex.com"
                class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
              />
            </div>

            <div class="space-y-1.5">
              <label class="font-bold text-on-surface">Teléfono Celular</label>
              <input
                type="text"
                [(ngModel)]="formPhone"
                placeholder="+52 81 1234 5678"
                class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-bold text-on-surface">Rol en el Sistema</label>
              <select
                [(ngModel)]="formRole"
                class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
              >
                <option value="encargado">👑 Encargado (Acceso Total + Finanzas)</option>
                <option value="administrador">⚡ Administrador (Gestión Operativa)</option>
                <option value="usuario">👤 Operativo / Campo (Staff)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-bold text-on-surface">Departamento</label>
              <select
                [(ngModel)]="formDepartment"
                class="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary text-xs"
              >
                <option value="Dirección General">Dirección General</option>
                <option value="Producción & Logística">Producción & Logística</option>
                <option value="Finanzas & Cobranza">Finanzas & Cobranza</option>
                <option value="Talento & Booking">Talento & Booking</option>
                <option value="Marketing & Prensa">Marketing & Prensa</option>
                <option value="Operaciones de Campo">Operaciones de Campo</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input type="checkbox" [(ngModel)]="form2FA" id="chk2FA" class="rounded accent-primary" />
            <label for="chk2FA" class="text-xs text-on-surface font-medium cursor-pointer">
              Exigir Autenticación de Dos Factores (2FA)
            </label>
          </div>

        </div>

        <!-- Botones -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20 text-xs">
          <button
            type="button"
            (click)="closed.emit()"
            class="px-4 py-2 rounded-xl bg-surface-container-high text-outline hover:text-on-surface font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="submitForm()"
            [disabled]="!formName.trim() || !formEmail.trim()"
            class="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-black shadow-md hover:scale-105 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-base">save</span>
            {{ isEditing() ? 'Guardar Cambios' : 'Registrar Personal' }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class ModalUserEditorComponent {
  userToEdit = input<AdminUserItem | null>(null);

  saved = output<AdminUserItem>();
  closed = output<void>();

  isEditing = signal(false);

  formName = '';
  formEmail = '';
  formPhone = '';
  formRole: Role = 'administrador';
  formDepartment: any = 'Producción & Logística';
  form2FA = true;

  ngOnInit(): void {
    const edit = this.userToEdit();
    if (edit) {
      this.isEditing.set(true);
      this.formName = edit.name;
      this.formEmail = edit.email;
      this.formPhone = edit.phone || '';
      this.formRole = edit.role;
      this.formDepartment = edit.department || 'Producción & Logística';
      this.form2FA = edit.twoFactorEnabled ?? true;
    }
  }

  submitForm(): void {
    if (!this.formName.trim() || !this.formEmail.trim()) return;

    const user: AdminUserItem = {
      id: this.userToEdit()?.id || `USR-${Math.floor(10 + Math.random() * 90)}`,
      name: this.formName.trim(),
      email: this.formEmail.trim(),
      phone: this.formPhone.trim(),
      role: this.formRole,
      department: this.formDepartment,
      avatar: this.userToEdit()?.avatar || `https://images.unsplash.com/photo-${Math.floor(1500000000000 + Math.random() * 100000000)}?w=150&auto=format&fit=crop&q=80`,
      status: this.userToEdit()?.status || 'Activo',
      lastAccess: this.userToEdit()?.lastAccess || 'Nunca',
      twoFactorEnabled: this.form2FA,
      permissions: this.userToEdit()?.permissions || {
        canViewFinances: this.formRole === 'encargado',
        canEditEvents: this.formRole !== 'usuario',
        canManageUsers: this.formRole === 'encargado',
        canDispatchOffers: this.formRole !== 'usuario',
        canSignContracts: this.formRole === 'encargado',
        canDeleteFiles: this.formRole === 'encargado',
        canAuditLogs: this.formRole !== 'usuario',
        canExportReports: true
      }
    };

    this.saved.emit(user);
  }
}
