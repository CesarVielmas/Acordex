import { AdminUserItem, Role } from '../../core/models/admin.models';
import { RoleMatrixItem } from '../../core/models/user.models';

export function calculateUsersKPIs(users: AdminUserItem[]) {
  const total = users.length;
  const active = users.filter(u => u.status === 'Activo').length;
  const encargados = users.filter(u => u.role === 'encargado').length;
  const administradores = users.filter(u => u.role === 'administrador').length;
  const campo = users.filter(u => u.role === 'usuario').length;
  const with2FA = users.filter(u => u.twoFactorEnabled).length;

  return {
    total,
    active,
    encargados,
    administradores,
    campo,
    with2FA
  };
}

export function getRoleBadgeClass(role: Role): string {
  switch (role) {
    case 'encargado':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm';
    case 'administrador':
      return 'bg-primary/20 text-primary border-primary/40';
    case 'usuario':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    default:
      return 'bg-surface-container-highest text-outline border-outline-variant/30';
  }
}

export function getUserStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Activo':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'Suspendido':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    case 'Invitación Pendiente':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
    default:
      return 'bg-surface-container-highest text-outline border-outline-variant/30';
  }
}

export const ROLE_PERMISSION_MATRIX: RoleMatrixItem[] = [
  {
    moduleName: 'Finanzas & Arqueos de Caja',
    icon: 'payments',
    description: 'Acceso a balances, cuentas bancarias, P&L, cortes de caja y reparto a socios.',
    encargado: 'Acceso Total',
    administrador: 'Sin Acceso Financiero',
    usuario: 'Sin Acceso'
  },
  {
    moduleName: 'Eventos Masivos & Venta de Boletos',
    icon: 'stadium',
    description: 'Creación y edición de palenques, configuración de zonas y precios de taquilla.',
    encargado: 'Acceso Total',
    administrador: 'Lectura / Escritura',
    usuario: 'Solo Lectura'
  },
  {
    moduleName: 'Cotizaciones & Contrataciones Privadas',
    icon: 'request_quote',
    description: 'Emisión de cotizaciones, negociación multi-ronda y firma de contratos legales.',
    encargado: 'Acceso Total',
    administrador: 'Lectura / Escritura',
    usuario: 'Solo Lectura'
  },
  {
    moduleName: 'Catálogo de Talento & Agrupaciones',
    icon: 'music_note',
    description: 'Administración de tarifas, miembros, contratos de exclusividad y riders.',
    encargado: 'Acceso Total',
    administrador: 'Lectura / Escritura',
    usuario: 'Solo Lectura'
  },
  {
    moduleName: 'Gestión de Tareas & Operaciones',
    icon: 'task_alt',
    description: 'Asignación de actividades técnicas, verificación de catering y bitácora de montaje.',
    encargado: 'Acceso Total',
    administrador: 'Lectura / Escritura',
    usuario: 'Tareas Asignadas'
  },
  {
    moduleName: 'Bóveda de Archivos & Documentos',
    icon: 'folder_open',
    description: 'Subida y descarga de press kits, videos para pantallas, contratos y fotos.',
    encargado: 'Acceso Total',
    administrador: 'Lectura / Escritura',
    usuario: 'Lectura / Escritura'
  },
  {
    moduleName: 'Clientes & CRM Comercial',
    icon: 'contacts',
    description: 'Directorio de promotores de palenques, envío de ofertas y bitácora de llamadas.',
    encargado: 'Acceso Total',
    administrador: 'Lectura / Escritura',
    usuario: 'Solo Lectura'
  },
  {
    moduleName: 'Control de Usuarios & Permisos',
    icon: 'admin_panel_settings',
    description: 'Creación de cuentas, cambio de roles, suspensión de acceso y auditoría.',
    encargado: 'Acceso Total',
    administrador: 'Sin Acceso',
    usuario: 'Sin Acceso'
  }
];
