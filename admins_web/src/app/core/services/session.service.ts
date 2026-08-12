import { Injectable, signal, computed, inject } from '@angular/core';
import { ActorRef, OrgMember, OrgRank } from '../models/org.models';
import { Role } from '../models/admin.models';
import { StorageService } from './storage.service';

export const INITIAL_ORG_MEMBERS: OrgMember[] = [
  // Disquera Norte / Don Raúl Treviño
  { id: 'mem-101', name: 'Don Raúl Treviño', email: 'raul@disqueranorte.com', rank: 'manager', managerName: 'Don Raúl Treviño', active: true },
  { id: 'mem-102', name: 'Sofía Ramírez', email: 'sofia@disqueranorte.com', rank: 'administrador', managerName: 'Don Raúl Treviño', active: true },
  { id: 'mem-103', name: 'Luis Ibarra', email: 'luis@disqueranorte.com', rank: 'staff', managerName: 'Don Raúl Treviño', active: true },
  { id: 'mem-104', name: 'Carlos Méndez', email: 'carlos@disqueranorte.com', rank: 'staff', managerName: 'Don Raúl Treviño', active: true },

  // Sierreño Music / Beto Ramírez
  { id: 'mem-201', name: 'Beto Ramírez (Sierreño Music)', email: 'beto@sierrenomusic.com', rank: 'manager', managerName: 'Beto Ramírez (Sierreño Music)', active: true },
  { id: 'mem-202', name: 'Andrea Garza', email: 'andrea@sierrenomusic.com', rank: 'administrador', managerName: 'Beto Ramírez (Sierreño Music)', active: true },
  { id: 'mem-203', name: 'Juan Pérez', email: 'juan@sierrenomusic.com', rank: 'staff', managerName: 'Beto Ramírez (Sierreño Music)', active: true },

  // Garza Music / Lic. Gonzalo Garza
  { id: 'mem-301', name: 'Lic. Gonzalo Garza', email: 'gonzalo@garzamusic.com', rank: 'manager', managerName: 'Lic. Gonzalo Garza', active: true },
  { id: 'mem-302', name: 'Ricardo Vega', email: 'ricardo@garzamusic.com', rank: 'administrador', managerName: 'Lic. Gonzalo Garza', active: true },
  { id: 'mem-303', name: 'Mariana Solís', email: 'mariana@garzamusic.com', rank: 'staff', managerName: 'Lic. Gonzalo Garza', active: true },

  // Encargado Acordex
  { id: 'mem-401', name: 'Encargado Acordex', email: 'encargado@acordex.com', rank: 'manager', managerName: 'Encargado Acordex', active: true },
  { id: 'mem-402', name: 'Roberto Alanís', email: 'roberto@acordex.com', rank: 'administrador', managerName: 'Encargado Acordex', active: true },

  // DJ & Mtro. Samuel Vargas
  { id: 'mem-501', name: 'DJ & Mtro. Samuel Vargas', email: 'samuel@vargas.com', rank: 'manager', managerName: 'DJ & Mtro. Samuel Vargas', active: true },
  { id: 'mem-502', name: 'Esteban Reyes', email: 'esteban@vargas.com', rank: 'staff', managerName: 'DJ & Mtro. Samuel Vargas', active: true },

  // Valentina Morales
  { id: 'mem-601', name: 'Valentina Morales', email: 'valentina@morales.com', rank: 'manager', managerName: 'Valentina Morales', active: true },

  // Maestro Fernando Castillo
  { id: 'mem-701', name: 'Maestro Fernando Castillo', email: 'fernando@castillo.com', rank: 'manager', managerName: 'Maestro Fernando Castillo', active: true }
];

const DEFAULT_ACTOR: ActorRef = {
  name: 'Don Raúl Treviño',
  managerName: 'Don Raúl Treviño',
  rank: 'manager'
};

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private storage = inject(StorageService);

  readonly currentActor = signal<ActorRef>(
    this.storage.getItem<ActorRef>('acordex_session_actor', DEFAULT_ACTOR)
  );

  readonly members = signal<OrgMember[]>(
    this.storage.getItem<OrgMember[]>('acordex_org_members', INITIAL_ORG_MEMBERS)
  );

  actor(): ActorRef {
    return this.currentActor();
  }

  setActor(actor: ActorRef): void {
    this.currentActor.set(actor);
    this.storage.setItem('acordex_session_actor', actor);
  }

  /** Devuelve solo los miembros activos de la disquera dada. */
  membersOf(managerName: string): OrgMember[] {
    return this.members().filter(m => m.active && m.managerName === managerName);
  }

  isManager(): boolean {
    return this.actor().rank === 'manager';
  }

  belongsTo(managerName: string): boolean {
    return this.actor().managerName === managerName;
  }

  canDelegateFor(managerName: string): boolean {
    return this.isManager() && this.belongsTo(managerName);
  }

  /**
   * Mantiene sincronizada la sesión cuando se cambia el rol global en HeaderComponent.
   * encargado -> manager
   * administrador -> administrador
   * usuario -> staff
   */
  syncWithRole(role: Role): void {
    const current = this.actor();
    let newRank: OrgRank = 'manager';
    let newName = current.name;

    if (role === 'encargado') {
      newRank = 'manager';
      if (!newName || newName === 'Sofía Ramírez' || newName === 'Luis Ibarra') {
        newName = current.managerName || 'Don Raúl Treviño';
      }
    } else if (role === 'administrador') {
      newRank = 'administrador';
      if (current.managerName === 'Don Raúl Treviño') {
        newName = 'Sofía Ramírez';
      }
    } else if (role === 'usuario') {
      newRank = 'staff';
      if (current.managerName === 'Don Raúl Treviño') {
        newName = 'Luis Ibarra';
      }
    }

    const updated: ActorRef = {
      name: newName,
      managerName: current.managerName || 'Don Raúl Treviño',
      rank: newRank
    };

    this.setActor(updated);
  }
}
