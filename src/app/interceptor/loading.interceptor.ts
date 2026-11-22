import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../shared/loader/loader.service';

export const LoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);

  // Si la petición tiene la cabecera 'X-Skip-Loader', omitir el loader
  if (req.headers.has('X-Skip-Loader')) {
    const cleanedReq = req.clone({ headers: req.headers.delete('X-Skip-Loader') });
    return next(cleanedReq);
  }

  const url = req.url.toLowerCase();

  // Detección contextual e inteligente del módulo
  if (url.includes('/token/') || url.includes('/login') || url.includes('/recuperar-acceso') || url.includes('/restablecer-password')) {
    loaderService.showSeguridad(
      'AUTENTICANDO ACCESO INSTITUCIONAL',
      'Validando credenciales, cifrado y control de identidad perimetral'
    );
  } else if (url.includes('/vacacion') || url.includes('/vacaciones')) {
    loaderService.showVacaciones(
      'GESTIONANDO VACACIONES LABORALES',
      'Procesando períodos, saldos acumulados y autorizaciones del MPPICN'
    );
  } else if (url.includes('/permiso')) {
    loaderService.showVacaciones(
      'VALIDANDO PERMISOS Y LICENCIAS',
      'Verificando justificaciones, días hábiles y firma de RRHH'
    );
  } else if (url.includes('/asistencia') || url.includes('/escaner') || url.includes('/escanear')) {
    loaderService.showAsistencia(
      'CONTROL DE ASISTENCIA LABORAL',
      'Validando marcas biométricas, control horario y jornada activa'
    );
  } else if (url.includes('/visitante') || url.includes('/visita')) {
    loaderService.showSeguridad(
      'SISTEMA DE CONTROL DE VISITAS',
      'Comprobando pases de seguridad, códigos QR y autorización de acceso'
    );
  } else if (url.includes('/usuario') || url.includes('/departamento') || url.includes('/rol')) {
    loaderService.show(
      'SINCRONIZANDO GESTIÓN INSTITUCIONAL',
      'Actualizando nómina, estructura de departamentos y permisos de rol',
      'general'
    );
  } else {
    loaderService.show(
      'PROCESANDO SOLICITUD SEGURA',
      'Sincronizando seguridad, asistencia laboral y vacaciones',
      'general'
    );
  }

  return next(req).pipe(
    finalize(() => {
      loaderService.hide();
    })
  );
};

