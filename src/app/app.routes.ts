import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · Lead Catcher',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
  },
  {
    // Public lead form, rendered on the server (see app.routes.server.ts).
    path: 'f/:source',
    title: 'Contacto',
    loadComponent: () =>
      import('./features/public-form/lead-form.page').then((m) => m.LeadFormPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Resumen · Lead Catcher',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'leads',
        title: 'Leads · Lead Catcher',
        loadComponent: () =>
          import('./features/leads/leads-list.page').then((m) => m.LeadsListPage),
      },
      {
        path: 'leads/:id',
        title: 'Detalle del lead · Lead Catcher',
        loadComponent: () =>
          import('./features/leads/lead-detail.page').then((m) => m.LeadDetailPage),
      },
      {
        path: 'integration',
        title: 'Integración · Lead Catcher',
        loadComponent: () =>
          import('./features/integration/integration.page').then((m) => m.IntegrationPage),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
