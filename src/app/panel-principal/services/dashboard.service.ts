import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardSummary {
  estadisticas: {
    archivos: number;
    compartidos: number;
    recientes: number;
    cursos: number;
    almacenamiento_bytes: number;
  };
  actividad_semanal: Array<{
    fecha: string;
    cantidad: number;
  }>;
  cursos: Array<{
    codigo: string;
    nombre: string;
    periodo: string;
  }>;
  archivos_recientes: Array<{
    uuid: string;
    nombre: string;
    curso: string;
    ultimo_acceso: string;
  }>;
  archivos_compartidos: Array<{
    uuid: string;
    nombre: string;
    compartido_por: string;
    nivel_acceso: string;
    creado_en: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl.replace(/\/$/, '')}/auth/dashboard/`;

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(this.url);
  }
}