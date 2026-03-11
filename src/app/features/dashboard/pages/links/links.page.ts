import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';

type LinkItem = { key: string; url: string; icon: string };
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-links-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Card, Button, TranslateModule, DividerModule],
  templateUrl: './links.page.html',
})
export class LinksPage {
  links = signal<LinkItem[]>([
    { key: 'LINKS.FORM_GUESTS', url: 'https://forms.gle/2oYXZCBEt2rTsSkC9', icon: 'pi pi-external-link' },
    { key: 'LINKS.FORM_RESPONSES', url: 'https://docs.google.com/spreadsheets/d/1A1slIWsOqp3IW061X27OGnoT1j1n2L6HCQlsnkU6aKk/edit?usp=sharing', icon: 'pi pi-table' },
    { key: 'LINKS.AIRBNB_PAYMENTS', url: 'https://www.airbnb.com.br/users/transaction_history/380238068/paid', icon: 'pi pi-wallet' },
    { key: 'LINKS.AIRBNB_REPORTS', url: 'https://www.airbnb.com.br/users/transaction_history/380238068/reports', icon: 'pi pi-file' },
  ]);

  open(url: string) {
    window.open(url, '_blank', 'noopener');
  }
}
