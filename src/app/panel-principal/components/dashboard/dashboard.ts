import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { RouterLink } from '@angular/router';
import {
  AuthUser,
  LoginService,
} from '../../../auth/components/service/login.service';
import {
  DashboardService,
  DashboardSummary,
} from '../../services/dashboard.service';

registerLocaleData(localeEs);

@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly loginService = inject(LoginService);
  private readonly dashboardService = inject(DashboardService);

  user: AuthUser | null = null;
  summary: DashboardSummary | null = null;
  errorMessage = '';
  loading = true;
  readonly today = new Date();
  readonly sampleAgenda = [
    {
      day: 'LUN',
      date: '23 NOV',
      time: '8:00 a. m.',
      course: 'Matemática I',
      topic: 'Funciones y límites',
      location: 'Aula 2',
    },
    {
      day: 'MAR',
      date: '24 NOV',
      time: '10:30 a. m.',
      course: 'Química',
      topic: 'Práctica de laboratorio',
      location: 'Laboratorio A',
    },
    {
      day: 'JUE',
      date: '26 NOV',
      time: '1:00 p. m.',
      course: 'Informática',
      topic: 'Introducción a bases de datos',
      location: 'Aula virtual',
    },
  ];
  readonly sampleDeliverables = [
    {
      title: 'Guía de ejercicios 4',
      course: 'Matemática I',
      due: '25 nov',
      status: 'Próxima entrega',
    },
    {
      title: 'Informe de laboratorio',
      course: 'Química',
      due: '27 nov',
      status: 'En preparación',
    },
    {
      title: 'Lectura: pensamiento científico',
      course: 'Formación integral',
      due: '30 nov',
      status: 'Pendiente',
    },
  ];

  get activityChart(): Array<{ date: string; label: string; count: number }> {
    return (this.summary?.actividad_semanal ?? []).map((day) => ({
      date: day.fecha,
      label: new Date(`${day.fecha}T12:00:00`).toLocaleDateString('es-VE', {
        weekday: 'short',
      }).replace('.', ''),
      count: day.cantidad,
    }));
  }

  get maxDailyActivity(): number {
    return Math.max(1, ...this.activityChart.map((day) => day.count));
  }

  get weeklyActivityTotal(): number {
    return this.activityChart.reduce((total, day) => total + day.count, 0);
  }

  activityBarHeight(count: number): number {
    return count ? Math.max(10, (count / this.maxDailyActivity) * 100) : 3;
  }

  get resourceChart(): Array<{ label: string; count: number; width: number; kind: string }> {
    const stats = this.summary?.estadisticas;
    const files = stats?.archivos ?? 0;
    const shared = stats?.compartidos ?? 0;
    const max = Math.max(files, shared, 1);

    return [
      { label: 'Mis archivos', count: files, width: (files / max) * 100, kind: 'owned' },
      { label: 'Compartidos', count: shared, width: (shared / max) * 100, kind: 'shared' },
    ];
  }

  ngOnInit(): void {
    this.loginService.usuarioActual().subscribe({
      next: ({ usuario }) => {
        this.user = usuario;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar tu sesión.';
        this.changeDetector.markForCheck();
      },
    });
    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el resumen académico.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const unit = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    return `${(bytes / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
  }

  greeting(): string {
    const hour = this.today.getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
