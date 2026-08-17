import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'comisiones',
        loadComponent: () => import('./features/comisiones-grupos/comisiones-grupos.component').then(m => m.ComisionesGruposComponent)
      },
      {
        path: 'managers-tickets',
        loadComponent: () => import('./features/managers-tickets/managers-tickets.component').then(m => m.ManagersTicketsComponent)
      },
      {
        path: 'trafico',
        loadComponent: () => import('./features/trafico-audiencia/trafico-audiencia.component').then(m => m.TraficoAudienciaComponent)
      },
      {
        path: 'telemetria',
        loadComponent: () => import('./features/telemetria-sistema/telemetria-sistema.component').then(m => m.TelemetriaSistemaComponent)
      },
      {
        path: 'proyecciones',
        loadComponent: () => import('./features/proyecciones/proyecciones.component').then(m => m.ProyeccionesComponent)
      },
      {
        path: 'dev-tools',
        loadComponent: () => import('./features/dev-tools/dev-tools.component').then(m => m.DevToolsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
