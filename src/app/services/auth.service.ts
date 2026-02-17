import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  // Estado reativo do usuário
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  // Estado reativo da sessão
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  public session$ = this.sessionSubject.asObservable();

  // Estado do perfil
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  public profile$ = this.profileSubject.asObservable();

  // Estado de carregamento inicial
  private loadingSubject = new BehaviorSubject<boolean>(true);
  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.supabase = this.supabaseService.client;
    this.initSession();
  }

  /**
   * Inicializa a sessão verificando o estado atual e ouvindo mudanças
   */
  private async initSession() {
    try {
      // 1. Pegar sessão atual
      const { data } = await this.supabase.auth.getSession();
      this.updateState(data.session);
    } catch (error) {
      console.error('Erro ao inicializar sessão:', error);
      this.updateState(null);
    } finally {
      this.loadingSubject.next(false);
    }

    // 2. Ouvir mudanças de autenticação (Login, Logout, Token Refresh)
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Event:', event);
      this.updateState(session);

      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/auth/login']);
      } else if (event === 'SIGNED_IN') {
        // Redirecionamento opcional
      }
    });
  }

  /**
   * Atualiza os Subjects com os dados da sessão
   */
  private updateState(session: Session | null) {
    this.sessionSubject.next(session);
    this.userSubject.next(session?.user ?? null);
    
    if (session?.user) {
      this.loadProfile(session.user.id);
    } else {
      this.profileSubject.next(null);
    }
  }

  /**
   * Carrega o perfil do usuário da tabela 'profiles'
   */
  private async loadProfile(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        this.profileSubject.next(data as UserProfile);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  }

  // --- Métodos de Autenticação ---

  /**
   * Login com Email e Senha
   */
  async signInWithEmail(email: string, password: string): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }

  /**
   * Cadastro com Email e Senha
   */
  async signUpWithEmail(email: string, password: string, fullName: string): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  }

  /**
   * Login com Google
   */
  async signInWithGoogle(): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  }

  /**
   * Logout
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  /**
   * Verifica se está autenticado (Helper síncrono para Guards)
   */
  get isAuthenticated(): boolean {
    return !!this.sessionSubject.value;
  }
  
  /**
   * Retorna o ID do usuário atual ou null
   */
  get currentUserId(): string | null {
    return this.userSubject.value?.id ?? null;
  }
}
