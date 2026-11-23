import { Component, OnInit, inject } from '@angular/core';
import { isPlatformBrowser, TitleCasePipe } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthUser, LoginService } from '../../../auth/components/service/login.service';

interface MenuItem {
  label: string;
  icon: string;
  fragment: string;
  route?: string;
}

@Component({
  imports: [RouterLink, RouterOutlet, TitleCasePipe],
  selector: 'app-full',
  templateUrl: './full.html',
  styleUrl: './full.scss',
})
export class Full implements OnInit {
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly principal: MenuItem[] = [
    { label: 'Resumen', icon: '⌂', fragment: 'resumen' },
    {
      label: 'Mis archivos',
      icon: '▤',
      fragment: 'archivos',
      route: '/panel/archivos',
    },
    { label: 'Compartidos', icon: '⇄', fragment: 'compartidos' },
    { label: 'Recientes', icon: '◷', fragment: 'recientes' },
    { label: 'Cursos', icon: '▣', fragment: 'cursos' },
    { label: 'Registros', icon: '☰', fragment: 'registros' },
  ];

  readonly sistema: MenuItem[] = [
    { label: 'Configuración', icon: '⚙', fragment: 'configuracion' },
    { label: 'Centro de ayuda', icon: '?', fragment: 'ayuda' },
  ];

  user: AuthUser | null = null;
  activeSection = 'resumen';
  sidebarOpen = false;
  sidebarCollapsed = false;
  theme: 'light' | 'dark' = 'light';
  profileError = '';

  ngOnInit(): void {
    if (this.isBrowser) {
      this.theme = localStorage.getItem('nexo-theme') === 'dark' ? 'dark' : 'light';
      this.sidebarCollapsed = localStorage.getItem('nexo-sidebar-collapsed') === 'true';
    }

    this.router.routerState.root.fragment.subscribe((fragment) => {
      this.activeSection = this.router.url.startsWith('/panel/archivos')
        ? 'archivos'
        : fragment ?? 'resumen';
      this.sidebarOpen = false;
    });

    this.loginService.usuarioActual().subscribe({
      next: ({ usuario }) => (this.user = usuario),
      error: () => (this.profileError = 'No se pudo cargar el perfil.'),
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    if (this.isBrowser) {
      localStorage.setItem('nexo-sidebar-collapsed', String(this.sidebarCollapsed));
    }
  }

  toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    if (this.isBrowser) {
      localStorage.setItem('nexo-theme', this.theme);
    }
  }

  logout(): void {
    this.loginService.cerrarSesion().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => void this.router.navigateByUrl('/login'),
    });
  }

  initials(): string {
    return (this.user?.nombre ?? 'NA')
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  isActive(item: MenuItem): boolean {
    return item.route
      ? this.router.url.startsWith(item.route)
      : this.activeSection === item.fragment;
  }
}
