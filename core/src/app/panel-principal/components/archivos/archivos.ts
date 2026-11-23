import { DatePipe, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { finalize } from 'rxjs';
import { ArchivoItem, ArchivosService } from '../../services/archivos.service';

type ArchivoFiltro = 'todos' | 'pdf' | 'imagenes' | 'documentos' | 'otros';

@Component({
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  selector: 'app-archivos',
  styleUrl: './archivos.scss',
  templateUrl: './archivos.html',
})
export class Archivos implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly archivosService = inject(ArchivosService);

  files: ArchivoItem[] = [];
  selectedFile: File | null = null;
  searchTerm = '';
  selectedFilter: ArchivoFiltro = 'todos';
  readonly filters: Array<{ value: ArchivoFiltro; label: string }> = [
    { value: 'todos', label: 'Todos' },
    { value: 'pdf', label: 'PDF' },
    { value: 'documentos', label: 'Documentos' },
    { value: 'imagenes', label: 'Imágenes' },
    { value: 'otros', label: 'Otros' },
  ];
  loading = true;
  uploading = false;
  downloadingUuid: string | null = null;
  deletingUuid: string | null = null;
  errorMessage = '';
  successMessage = '';

  get filteredFiles(): ArchivoItem[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    return this.files.filter((file) => {
      const matchesName = file.nombre.toLocaleLowerCase().includes(query);
      const matchesType =
        this.selectedFilter === 'todos' ||
        this.category(file) === this.selectedFilter;
      return matchesName && matchesType;
    });
  }

  get totalSize(): number {
    return this.files.reduce((total, file) => total + file.tamano_bytes, 0);
  }

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.loading = true;
    this.errorMessage = '';
    this.archivosService
      .listar()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: (files) => {
          this.files = files;
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = this.errorText(
            error,
            'No se pudieron cargar tus archivos.',
          );
          this.changeDetector.markForCheck();
        },
      });
  }

  selectFile(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    this.selectedFile = input.files?.[0] ?? null;
    input.value = '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  updateSearch(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.searchTerm = input.value;
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  setFilter(filter: ArchivoFiltro): void {
    this.selectedFilter = filter;
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  dropFile(event: DragEvent): void {
    event.preventDefault();
    this.selectedFile = event.dataTransfer?.files.item(0) ?? null;
    this.successMessage = '';
    this.errorMessage = '';
  }

  uploadSelected(): void {
    if (!this.selectedFile || this.uploading) return;

    const file = this.selectedFile;
    this.uploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.archivosService
      .subir(file)
      .pipe(
        finalize(() => {
          this.uploading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: (uploaded) => {
          this.files = [uploaded, ...this.files];
          this.selectedFile = null;
          this.successMessage = `${uploaded.nombre} se agregó a tus archivos.`;
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = this.errorText(
            error,
            'No se pudo subir el archivo. Inténtalo nuevamente.',
          );
          this.changeDetector.markForCheck();
        },
      });
  }

  download(file: ArchivoItem): void {
    if (!isPlatformBrowser(this.platformId) || this.downloadingUuid) return;

    this.downloadingUuid = file.uuid;
    this.errorMessage = '';
    this.archivosService
      .descargar(file.uuid)
      .pipe(
        finalize(() => {
          this.downloadingUuid = null;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = this.document.createElement('a');
          link.href = url;
          link.download = file.nombre;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        error: (error: unknown) => {
          this.errorMessage = this.errorText(
            error,
            'No se pudo descargar el archivo.',
          );
          this.changeDetector.markForCheck();
        },
      });
  }

  delete(file: ArchivoItem): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      this.deletingUuid ||
      !globalThis.confirm(`¿Eliminar "${file.nombre}" de tus archivos?`)
    ) {
      return;
    }

    this.deletingUuid = file.uuid;
    this.errorMessage = '';
    this.archivosService
      .eliminar(file.uuid)
      .pipe(
        finalize(() => {
          this.deletingUuid = null;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.files = this.files.filter((item) => item.uuid !== file.uuid);
          this.successMessage = `${file.nombre} se quitó de tus archivos.`;
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = this.errorText(
            error,
            'No se pudo eliminar el archivo.',
          );
          this.changeDetector.markForCheck();
        },
      });
  }

  category(file: ArchivoItem): ArchivoFiltro {
    const mime = file.tipo_mime.toLocaleLowerCase();
    if (mime === 'application/pdf') return 'pdf';
    if (mime.startsWith('image/')) return 'imagenes';
    if (
      mime.startsWith('text/') ||
      /word|document|spreadsheet|presentation/.test(mime)
    ) {
      return 'documentos';
    }
    return 'otros';
  }

  typeLabel(file: ArchivoItem): string {
    const labels: Record<ArchivoFiltro, string> = {
      todos: 'Archivo',
      pdf: 'PDF',
      imagenes: 'Imagen',
      documentos: 'Documento',
      otros: 'Archivo',
    };
    return labels[this.category(file)];
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    const unit = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)) - 1,
      units.length - 1,
    );
    return `${(bytes / 1024 ** (unit + 1)).toFixed(1)} ${units[unit]}`;
  }

  private errorText(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    if (
      error instanceof HttpErrorResponse &&
      typeof error.error?.detail === 'string'
    ) {
      return error.error.detail;
    }
    return fallback;
  }
}
