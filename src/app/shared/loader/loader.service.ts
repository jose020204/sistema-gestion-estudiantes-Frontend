import { Injectable, signal } from '@angular/core';

export type LoaderCategory = 'general' | 'seguridad' | 'vacaciones' | 'asistencia';

export interface LoaderState {
  title: string;
  description: string;
  category: LoaderCategory;
}

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private readonly currentState = signal<LoaderState | null>(null);
  readonly state = this.currentState.asReadonly();

  show(
    title: string,
    description: string,
    category: LoaderCategory = 'general',
  ): void {
    this.currentState.set({ title, description, category });
  }

  showSeguridad(title: string, description: string): void {
    this.show(title, description, 'seguridad');
  }

  showVacaciones(title: string, description: string): void {
    this.show(title, description, 'vacaciones');
  }

  showAsistencia(title: string, description: string): void {
    this.show(title, description, 'asistencia');
  }

  hide(): void {
    this.currentState.set(null);
  }
}
