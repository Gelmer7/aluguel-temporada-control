import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { DatePickerModule } from 'primeng/datepicker';
import { GalleriaModule } from 'primeng/galleria';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, ImageModule, DatePickerModule, GalleriaModule],
  templateUrl: './home-page.html',
})
export class HomePage {
  activeIndex: number = 0;

  properties = [
    {
      name: 'Casa Dumont - Condomínio no Villa Flora de Sumaré',
      description: 'O sobrado fica localizado no condomínio dos Crisântemos, no bairro Villa Flora na cidade de Sumaré, a 21 km de Campinas - SP. \n\nO bairro é arborizado, com segurança 24h e localização estratégica na cidade.\n\nO Condomínio possui cancela e ótima localização: próxima a praça da fazenda, restaurantes, padaria, farmácia, mercados, etc.',
      image: 'assets/images/house-1/sala_01.avif'
    }
  ];

  images = [
    {
      itemImageSrc: 'assets/images/house-1/sala_01.avif',
      thumbnailImageSrc: 'assets/images/house-1/sala_01.avif',
      alt: 'Sala de Estar',
      title: 'Sala de Estar',
      id: '1'
    },
    {
      itemImageSrc: 'assets/images/house-1/sala_02.avif',
      thumbnailImageSrc: 'assets/images/house-1/sala_02.avif',
      alt: 'Detalhes da Sala',
      title: 'Detalhes da Sala',
      id: '2'
    },
    {
      itemImageSrc: 'assets/images/house-1/sala_03.avif',
      thumbnailImageSrc: 'assets/images/house-1/sala_03.avif',
      alt: 'Vista da Sala',
      title: 'Vista da Sala',
      id: '3'
    },
    {
      itemImageSrc: 'assets/images/house-1/cozinha_01.avif',
      thumbnailImageSrc: 'assets/images/house-1/cozinha_01.avif',
      alt: 'Cozinha Completa',
      title: 'Cozinha Completa',
      id: '4'
    },
    {
      itemImageSrc: 'assets/images/house-1/sala_01.avif',
      thumbnailImageSrc: 'assets/images/house-1/sala_01.avif',
      alt: 'Sala de Estar',
      title: 'Sala de Estar',
      id: '5'
    },
    {
      itemImageSrc: 'assets/images/house-1/sala_02.avif',
      thumbnailImageSrc: 'assets/images/house-1/sala_02.avif',
      alt: 'Detalhes da Sala',
      title: 'Detalhes da Sala',
      id: '6'
    }
  ];

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
