import { Injectable, signal, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private translate = inject(TranslateService);
  private primeng = inject(PrimeNG);

  // Signal to expose current language code
  currentLang = signal<string>('pt');

  // Available languages
  languages = [
    { name: 'Español', code: 'es', flag: '/assets/flags/es.png' },
    { name: 'English', code: 'en', flag: '/assets/flags/us.png' },
    { name: 'Português', code: 'pt', flag: '/assets/flags/br.png' },
  ];

  constructor() {
    this.initLanguage();
  }

  private initLanguage() {
    this.translate.addLangs(['es', 'en', 'pt']);

    // Check localStorage or browser lang
    const savedLang = localStorage.getItem('app-lang');
    const browserLang = this.translate.getBrowserLang();
    const defaultLang =
      savedLang || (browserLang && browserLang.match(/pt|es|en/) ? browserLang : 'pt');

    this.setLanguage(defaultLang);
  }

  setLanguage(lang: string) {
    this.translate.setDefaultLang(lang);
    this.translate.use(lang).subscribe({
      next: () => {
        this.translate.get('PRIMENG').subscribe((res: any) => {
          this.primeng.setTranslation(res);
        });
      },
      error: (err) => console.error('Error loading language:', err)
    });
    this.currentLang.set(lang);
    localStorage.setItem('app-lang', lang);
  }
}
