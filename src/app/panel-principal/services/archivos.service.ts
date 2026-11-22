import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ArchivoItem {
  uuid: string;
  nombre: string;
  tipo_mime: string;
  tamano_bytes: number;
  estado: string;
  creado_en: string;
}

@Injectable({ providedIn: 'root' })
export class ArchivosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl.replace(/\/$/, '')}/archivos`;

  listar(busqueda = ''): Observable<ArchivoItem[]> {
    const params = busqueda.trim()
      ? new HttpParams().set('q', busqueda.trim())
      : undefined;
    return this.http.get<ArchivoItem[]>(`${this.url}/`, { params });
  }

  subir(file: File): Observable<ArchivoItem> {
    const formData = new FormData();
    formData.append('archivo', file, file.name);
    return this.http.post<ArchivoItem>(`${this.url}/`, formData);
  }

  descargar(uuid: string): Observable<Blob> {
    return this.http.get(`${this.url}/${encodeURIComponent(uuid)}/`, {
      responseType: 'blob',
    });
  }

  eliminar(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(uuid)}/`);
  }
}
