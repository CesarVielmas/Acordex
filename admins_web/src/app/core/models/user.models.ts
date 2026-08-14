import { Role } from './admin.models';

export type UserDepartment =
  | 'Dirección General'
  | 'Producción & Logística'
  | 'Finanzas & Cobranza'
  | 'Talento & Booking'
  | 'Marketing & Prensa'
  | 'Operaciones de Campo';

export type UserStatus = 'Activo' | 'Suspendido' | 'Invitación Pendiente';

export interface UserGranularPermissions {
  canViewFinances: boolean;
  canEditEvents: boolean;
  canManageUsers: boolean;
  canDispatchOffers: boolean;
  canSignContracts: boolean;
  canDeleteFiles: boolean;
  canAuditLogs: boolean;
  canExportReports: boolean;
}

export interface DetailedAdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: UserDepartment;
  phone?: string;
  avatar: string;
  status: UserStatus;
  lastAccess: string;
  lastLoginIp?: string;
  twoFactorEnabled?: boolean;
  assignedGroups?: string[]; // IDs de grupos asignados o ['ALL'] para acceso total
  permissions?: UserGranularPermissions;
}

export interface RoleMatrixItem {
  moduleName: string;
  icon: string;
  description: string;
  encargado: string;
  administrador: string;
  usuario: string;
}
