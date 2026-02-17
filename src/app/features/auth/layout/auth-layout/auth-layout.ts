import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, CardModule],
  templateUrl: './auth-layout.html',
})
export class AuthLayout {
  currentYear = new Date().getFullYear();
}
