import { Component, signal, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SupabaseService } from './services/supabase.service';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly title = signal('airbnb-web-angular');
  private supabaseService = inject(SupabaseService);
  private languageService = inject(LanguageService);

  async ngOnInit() {
    console.log('Initializing App...');
    // Language Service is automatically initialized by injection
    
    console.log('Testing Supabase connection...');
    const { data, error } = await this.supabaseService.checkConnection();
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connection successful! Session:', data);
    }
  }
}
