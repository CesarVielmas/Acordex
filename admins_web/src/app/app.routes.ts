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
        path: 'quotes', 
        loadComponent: () => import('./features/quotes/quotes.component').then(m => m.QuotesComponent) 
      },
      { 
        path: 'groups', 
        loadComponent: () => import('./features/groups/groups.component').then(m => m.GroupsComponent) 
      },
      { 
        path: 'events', 
        loadComponent: () => import('./features/events/events.component').then(m => m.EventsComponent) 
      },
      { 
        path: 'press', 
        loadComponent: () => import('./features/press/press.component').then(m => m.PressComponent) 
      },
      { 
        path: 'finances', 
        loadComponent: () => import('./features/finances/finances.component').then(m => m.FinancesComponent) 
      },
      { 
        path: 'stats', 
        loadComponent: () => import('./features/stats/stats.component').then(m => m.StatsComponent) 
      },
      { 
        path: 'tasks', 
        loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent) 
      },
      { 
        path: 'clients', 
        loadComponent: () => import('./features/clients/clients.component').then(m => m.ClientsComponent) 
      },
      { 
        path: 'users', 
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) 
      },
      { 
        path: 'files', 
        loadComponent: () => import('./features/files/files.component').then(m => m.FilesComponent) 
      },
      { 
        path: 'settings', 
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) 
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
