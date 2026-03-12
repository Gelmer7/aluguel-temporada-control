import { Component, HostListener, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList, Inject, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { DatePickerModule } from 'primeng/datepicker';
import { GalleriaModule } from 'primeng/galleria';
import { SupabaseService } from '../../../../services/supabase.service';
import { House, HousePhoto } from '../../../../models/house.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, ImageModule, DatePickerModule, GalleriaModule],
  templateUrl: './home-page.html',
})
export class HomePage implements OnInit, AfterViewInit {
  private supabaseService = inject(SupabaseService);

  activeIndex: number = 0;
  numberOfMonths: number = 2;

  // Sinais para dados dinâmicos
  houses = signal<(House & { house_photos: HousePhoto[] })[]>([]);
  loading = signal(true);
  selectedProperty = signal<(House & { house_photos: HousePhoto[] }) | null>(null);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    this.updateCalendarView();
    this.loadPublicHouses();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupIntersectionObserver();
    }
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', 'translate-y-10');
            entry.target.classList.add('opacity-100', 'translate-y-0');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observer.observe(el));
  }

  @HostListener('window:resize')
  onResize() {
    this.updateCalendarView();
  }

  updateCalendarView() {
    if (isPlatformBrowser(this.platformId)) {
      this.numberOfMonths = window.innerWidth < 768 ? 1 : 2;
    }
  }

  async loadPublicHouses() {
    this.loading.set(true);
    const { data, error } = await this.supabaseService.getPublicHouses();

    if (!error && data) {
      this.houses.set(data);
      if (data.length > 0) {
        this.selectedProperty.set(data[0]);
      }
    }
    this.loading.set(false);
  }

  get propertyImages() {
    const current = this.selectedProperty();
    if (!current || !current.house_photos || current.house_photos.length === 0) {
      return [];
    }
    return current.house_photos.map(p => ({
      itemImageSrc: p.url,
      thumbnailImageSrc: p.url,
      alt: current.name,
      title: current.name,
      id: p.id
    }));
  }

  getCoverImage(house: House & { house_photos: HousePhoto[] }): string {
    const cover = house.house_photos?.find(p => p.is_cover);
    return cover ? cover.url : (house.house_photos?.[0]?.url || 'assets/images/placeholder-house.jpg');
  }

  onSelectHouse(house: House & { house_photos: HousePhoto[] }) {
    this.selectedProperty.set(house);
    // Rola para a seção de detalhes se necessário
  }

  responsiveOptions = [
    {
        breakpoint: '1024px',
        numVisible: 3
    },
    {
        breakpoint: '768px',
        numVisible: 2
    },
    {
        breakpoint: '560px',
        numVisible: 1
    }
  ];

  today = new Date();
  dateRange: Date[] | undefined;

  get numberOfNights(): number {
    if (this.dateRange && this.dateRange[0] && this.dateRange[1]) {
      const diffTime = Math.abs(this.dateRange[1].getTime() - this.dateRange[0].getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  }

  get formattedDateRange(): string {
    if (this.dateRange && this.dateRange[0] && this.dateRange[1]) {
      const start = this.dateRange[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
      const end = this.dateRange[1].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${start} - ${end}`;
    }
    return '';
  }

  clearDates() {
    this.dateRange = undefined;
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  openWhatsApp() {
    window.open('https://wa.me/55019996890439?text=Olá,%20quero%20reservar%20a%20casa', '_blank');
  }
}
