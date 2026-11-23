import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LoginService } from '../auth/components/service/login.service';

const publicEndpoints = [
  '/auth/login/',
  '/auth/password-reset/',
  '/auth/password-reset-confirm/',
];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  if (publicEndpoints.some((endpoint) => request.url.includes(endpoint))) {
    return next(request);
  }

  const token = loginService.getToken();
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Token ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        loginService.clearToken();
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
