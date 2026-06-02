import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Cotizaciones } from './features/cotizaciones/cotizaciones';
import { Events } from './features/events/events';
import { History } from './features/history/history';
import { Profile } from './features/profile/profile';

export const routes: Routes = [
    { path: '', redirectTo: '/inicio', pathMatch: 'full' },
    { path: 'inicio', component: Home },
    { path: 'cotizaciones', component: Cotizaciones },
    { path: 'events', component: Events },
    { path: 'history', component: History },
    { path: 'profile', component: Profile }
];
