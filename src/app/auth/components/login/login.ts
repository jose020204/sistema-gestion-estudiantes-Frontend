import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LoginService } from '../service/login.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly loginService = inject(LoginService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.nonNullable.group({
    cedula: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly emailForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly passwordForm = this.formBuilder.nonNullable.group({
    nueva_password: ['', [Validators.required, Validators.minLength(8)]],
    confirmar_password: ['', Validators.required],
  });

  mode: 'login' | 'request' | 'reset' | 'complete' = 'login';
  uid = '';
  resetToken = '';
  showPassword = false;
  busy = false;
  errorMessage = '';
  successMessage = '';

  get isBack(): boolean {
    return this.mode !== 'login';
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const uid = params.get('uid');
      const token = params.get('token');
      if (uid && token) {
        this.uid = uid;
        this.resetToken = token;
        this.mode = 'reset';
      }
    });
  }

  submitLogin(): void {
    if (this.loginForm.invalid || this.busy) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.clearMessages();
    this.busy = true;
    const { cedula, password } = this.loginForm.getRawValue();

    this.loginService
      .login(cedula, password)
      .pipe(
        finalize(() => {
          this.busy = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/panel'),
        error: (error: unknown) => {
          this.errorMessage =
            error instanceof HttpErrorResponse && error.status === 0
              ? 'No se pudo conectar con el servidor. Inténtalo nuevamente.'
              : 'La cédula o la contraseña no son correctas.';
        },
      });
  }

  showPasswordRecovery(): void {
    this.clearMessages();
    this.mode = 'request';
  }

  backToLogin(): void {
    this.clearMessages();
    this.mode = 'login';
    void this.router.navigateByUrl('/login');
  }

  requestPasswordChange(): void {
    if (this.emailForm.invalid || this.busy) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.clearMessages();
    this.busy = true;
    this.loginService
      .solicitarCambioPassword(this.emailForm.controls.email.value)
      .pipe(
        finalize(() => {
          this.busy = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: ({ detail }) => (this.successMessage = detail),
        error: () => {
          this.errorMessage = 'No se pudo enviar la solicitud. Inténtalo de nuevo.';
        },
      });
  }

  confirmPasswordChange(): void {
    if (this.passwordForm.invalid || this.busy) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { nueva_password, confirmar_password } =
      this.passwordForm.getRawValue();
    if (nueva_password !== confirmar_password) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.clearMessages();
    this.busy = true;
    this.loginService
      .confirmarCambioPassword(
        this.uid,
        this.resetToken,
        nueva_password,
        confirmar_password,
      )
      .pipe(
        finalize(() => {
          this.busy = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: ({ detail }) => {
          this.successMessage = detail;
          this.mode = 'complete';
        },
        error: (error: unknown) => {
          this.errorMessage =
            error instanceof HttpErrorResponse &&
            typeof error.error?.nueva_password?.[0] === 'string'
              ? error.error.nueva_password[0]
              : error instanceof HttpErrorResponse &&
                  typeof error.error?.detail === 'string'
                ? error.error.detail
                : 'No se pudo cambiar la contraseña. Verifica los datos e inténtalo otra vez.';
        },
      });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
