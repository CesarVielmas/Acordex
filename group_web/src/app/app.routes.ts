import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) 
      },
      { 
        path: 'eventos-evidencias', 
        loadComponent: () => import('./features/eventos-evidencias/eventos-evidencias.component').then(m => m.EventosEvidenciasComponent) 
      },
      { 
        path: 'publicaciones', 
        loadComponent: () => import('./features/publicaciones/publicaciones.component').then(m => m.PublicacionesComponent) 
      },
      { 
        path: 'historias', 
        loadComponent: () => import('./features/historias/historias.component').then(m => m.HistoriasComponent) 
      },
      { 
        path: 'calendario', 
        loadComponent: () => import('./features/calendario/calendario.component').then(m => m.CalendarioComponent) 
      },
      { 
        path: 'chat', 
        loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent) 
      },
      { 
        path: 'notificaciones', 
        loadComponent: () => import('./features/notificaciones/notificaciones.component').then(m => m.NotificacionesComponent) 
      },
      { 
        path: 'multimedia', 
        redirectTo: 'editor-pagina'
      },
      { 
        path: 'integrantes', 
        redirectTo: 'editor-pagina'
      },
      { 
        path: 'editor-pagina', 
        loadComponent: () => import('./features/editor-pagina/editor-pagina.component').then(m => m.EditorPaginaComponent) 
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
