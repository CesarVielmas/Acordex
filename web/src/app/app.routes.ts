import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Cotizaciones } from './features/cotizaciones/cotizaciones';
import { Events } from './features/events/events';
import { ComprarBoletos } from './features/events/comprar-boletos/comprar-boletos';
import { SeleccionAsientos } from './features/events/seleccion-asientos/seleccion-asientos';
import { FirmaPrensa } from './features/events/firma-prensa/firma-prensa';
import { History } from './features/history/history';
import { Profile } from './features/profile/profile';

export const routes: Routes = [
    { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    { path: 'inicio', component: Home },
    { path: 'cotizaciones', component: Cotizaciones },
    { path: 'events', component: Events },
    { path: 'events/comprar-boletos', component: ComprarBoletos },
    { path: 'events/seleccion-asientos', component: SeleccionAsientos },
    { path: 'events/firma-prensa', component: FirmaPrensa },
    { path: 'history', component: History },
    { path: 'profile', component: Profile }
];
