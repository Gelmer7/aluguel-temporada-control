import { Injectable, signal, effect } from '@angular/core';
import { AppColors, AppColorConfig } from '../shared/design/colors';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  private readonly STORAGE_KEY = 'app_custom_colors';
  
  private colorsSignal = signal<AppColorConfig>(this.loadColors());

  constructor() {
    // Persist changes to localStorage
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.colorsSignal()));
    });
  }

  get colors() {
    return this.colorsSignal.asReadonly();
  }

  updateColors(newColors: Partial<AppColorConfig>) {
    this.colorsSignal.update((current) => ({ ...current, ...newColors }));
  }

  resetToDefault() {
    this.colorsSignal.set(AppColors);
  }

  private loadColors(): AppColorConfig {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return { ...AppColors, ...JSON.parse(stored) };
      } catch (e) {
        console.error('Error parsing stored colors', e);
      }
    }
    return AppColors;
  }
}
