import { Component, inject } from '@angular/core';
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

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    this.sidebarVisible = false; // Close sidebar after clicking
  }
}
