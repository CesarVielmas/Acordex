/**
 * Rango de una persona dentro de su disquera.
 *
 * No es el rol global del panel: es la posición dentro de la organización
 * que responde ante el evento. Un `manager` responde por lo que se le
 * encarga; sus `administrador` y `staff` lo ejecutan en su nombre.
 */
export type OrgRank = 'manager' | 'administrador' | 'staff';

export interface OrgMember {
  id: string;
  name: string;
  email?: string;
  rank: OrgRank;
  /** Disquera a la que pertenece. Un manager se pertenece a sí mismo. */
  managerName: string;
  active: boolean;
}

/** Quién hace el movimiento. Se sella en cada entrada de bitácora. */
export interface ActorRef {
  name: string;
  managerName: string;
  rank: OrgRank | 'sistema';
}
