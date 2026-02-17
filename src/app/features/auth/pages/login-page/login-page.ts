import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule
  ],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;
  errorMessage: string | null = null;
  returnUrl: string = '/dashboard';

  constructor() {
    // Pega a URL de retorno se houver (ex: tentou acessar dashboard sem logar)
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = null;

    const { email, password } = this.loginForm.value;

    try {
      const { error } = await this.authService.signInWithEmail(email!, password!);

      if (error) {
        if (error.code === 'email_not_confirmed') {
          this.errorMessage = this.translate.instant('AUTH.LOGIN.EMAIL_NOT_CONFIRMED');
          // Fallback caso a tradução falhe
          if (this.errorMessage === 'AUTH.LOGIN.EMAIL_NOT_CONFIRMED') {
            this.errorMessage = 'Email não confirmado. Por favor, verifique sua caixa de entrada.';
          }
        } else {
          this.errorMessage = this.translate.instant('AUTH.LOGIN.ERROR_MESSAGE');
        }
      } else {
        this.router.navigateByUrl(this.returnUrl);
      }
    } catch (err) {
      this.errorMessage = 'Ocorreu um erro inesperado.';
    } finally {
      this.loading = false;
    }
  }

  async loginWithGoogle() {
    try {
      const { error } = await this.authService.signInWithGoogle();
      if (error) throw error;
      // O redirecionamento acontece automaticamente pelo Supabase
    } catch (error) {
      this.errorMessage = 'Erro ao iniciar login com Google.';
    }
  }
}
