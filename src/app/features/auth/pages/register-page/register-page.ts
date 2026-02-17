import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
  ],
  templateUrl: './register-page.html',
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { email, password, fullName } = this.registerForm.value;

    try {
      const { error } = await this.authService.signUpWithEmail(email!, password!, fullName!);

      if (error) {
        if (error.code === 'over_email_send_rate_limit') {
          this.errorMessage = this.translate.instant('AUTH.ERRORS.RATE_LIMIT');
          if (this.errorMessage === 'AUTH.ERRORS.RATE_LIMIT') {
             this.errorMessage = 'Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.';
          }
        } else {
           this.errorMessage = error.message;
        }
      } else {
        this.successMessage = this.translate.instant('AUTH.REGISTER.SUCCESS_MESSAGE');
        this.registerForm.reset();
      }
    } catch (err) {
      this.errorMessage = 'Erro inesperado ao criar conta.';
    } finally {
      this.loading = false;
    }
  }
}
