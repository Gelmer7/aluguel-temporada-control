import { Component, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { StyleClassModule } from 'primeng/styleclass';
import { DrawerModule } from 'primeng/drawer';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, ButtonModule, StyleClassModule, DrawerModule],
  templateUrl: './public-layout.component.html',
})
export class PublicLayoutComponent {
  private authService = inject(AuthService);
  user$ = this.authService.user$;
  currentYear = new Date().getFullYear();

  sidebarVisible: boolean = false;
  isScrolled = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Se o scroll for maior que 50px, muda o estado do header
    this.isScrolled.set(window.pageYOffset > 50);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    this.sidebarVisible = false; // Close sidebar after clicking
  }
}
