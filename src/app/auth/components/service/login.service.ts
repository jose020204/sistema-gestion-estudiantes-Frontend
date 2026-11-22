import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AuthUser {
  id: number;
  usuario: string;
  nombre: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  usuario: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authUrl = `${environment.apiUrl.replace(/\/$/, '')}/auth`;
  private readonly tokenKey = 'nexo-auth-token';
  private currentUser: AuthUser | null = null;
  private currentUserRequest: Observable<{ usuario: AuthUser }> | null = null;

  login(cedula: string, password: string): Observable<LoginResponse> {
    const url = `${this.authUrl}/login/`;
    const startedAt = Date.now();

    if (!environment.production) {
      console.info('[Nexo Auth] Solicitud de inicio de sesión', {
        method: 'POST',
        url,
      });
    }

    return this.http.post<LoginResponse>(url, { cedula, password }).pipe(
      tap({
        next: ({ token, usuario }) => {
          this.saveToken(token);
          this.currentUser = usuario;

          if (!environment.production) {
            console.info('[Nexo Auth] Inicio de sesión completado', {
              url,
              durationMs: Date.now() - startedAt,
              tokenStored: this.getToken() !== null,
            });
          }
        },
        error: (error: unknown) => {
          if (!environment.production) {
            console.error('[Nexo Auth] Error de inicio de sesión', {
              url,
              httpStatus:
                error instanceof HttpErrorResponse ? error.status : 'unknown',
              durationMs: Date.now() - startedAt,
            });
          }
        },
      }),
    );
  }

  solicitarCambioPassword(email: string): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(
      `${this.authUrl}/password-reset/`,
      { email },
    );
  }

  confirmarCambioPassword(
    uid: string,
    token: string,
    nueva_password: string,
    confirmar_password: string,
  ): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(
      `${this.authUrl}/password-reset-confirm/`,
      { uid, token, nueva_password, confirmar_password },
    );
  }

  usuarioActual(): Observable<{ usuario: AuthUser }> {
    if (this.currentUser) {
      return of({ usuario: this.currentUser });
    }

    if (!this.currentUserRequest) {
      this.currentUserRequest = this.http
        .get<{ usuario: AuthUser }>(`${this.authUrl}/me/`)
        .pipe(
          tap(({ usuario }) => (this.currentUser = usuario)),
          finalize(() => (this.currentUserRequest = null)),
          shareReplay({ bufferSize: 1, refCount: true }),
        );
    }

    return this.currentUserRequest;
  }

  cerrarSesion(): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/logout/`, {}).pipe(
      finalize(() => this.clearToken()),
    );
  }

  hasSession(): boolean {
    return this.getToken() !== null;
  }

  getToken(): string | null {
    return isPlatformBrowser(this.platformId)
      ? sessionStorage.getItem(this.tokenKey)
      : null;
  }

  clearToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.tokenKey);
    }
    this.currentUser = null;
    this.currentUserRequest = null;
  }

  private saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(this.tokenKey, token);
    }
  }
}
