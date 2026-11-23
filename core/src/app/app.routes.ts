import { Route } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/components/login/login').then((module) => module.Login),
  },
  {
    path: 'restablecer/:uid/:token',
    loadComponent: () =>
      import('./auth/components/login/login').then((module) => module.Login),
  },
  {
    path: 'panel',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./panel-principal/layout/full/full').then(
        (module) => module.Full,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./panel-principal/components/dashboard/dashboard').then(
            (module) => module.Dashboard,
          ),
      },
      {
        path: 'archivos',
        loadComponent: () =>
          import('./panel-principal/components/archivos/archivos').then(
            (module) => module.Archivos,
          ),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
