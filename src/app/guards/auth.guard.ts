import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter, switchMap } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Espera o carregamento inicial terminar antes de verificar
  return authService.loading$.pipe(
    filter(loading => !loading), // Aguarda até loading ser false
    take(1),
    switchMap(() => authService.user$),
    take(1), // Pega o estado atual do usuário
    map(user => {
      if (user) {
        return true; // Usuário logado, permite acesso
      } else {
        // Usuário não logado, redireciona para login com returnUrl
        router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }
    })
  );
};
