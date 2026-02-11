import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private readonly translate = inject(TranslateService);

  /**
   * Generates a PDF from the tithe data
   */
  generateTithePdf(data: {
    year: number;
    month: number;
    tithePercentage: number;
    offerPercentage: number;
    payments: any[];
    expenses: any[];
    history: any[];
    totals: {
      airbnb: number;
      expenses: number;
      tithe: number;
      offer: number;
      total: number;
    };
  }) {
    const doc = new jsPDF();
    const monthName = this.translate.instant(`MONTHS.${data.month}`);
    const title = `${this.translate.instant('TERMS.TITHE')} - ${monthName} / ${data.year}`;

    // Header
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    // Summary Info
    const summaryY = 30;
    doc.text(`${this.translate.instant('TITHE_MANAGEMENT.TITHE_PERCENTAGE')}: ${data.tithePercentage}%`, 14, summaryY);
    doc.text(`${this.translate.instant('TITHE_MANAGEMENT.OFFER_PERCENTAGE')}: ${data.offerPercentage}%`, 70, summaryY);

    // Financial Summary Table
    autoTable(doc, {
      startY: summaryY + 5,
      head: [[
        this.translate.instant('TITHE_MANAGEMENT.AIRBNB_PAYMENTS'),
        this.translate.instant('TITHE_MANAGEMENT.TOTAL_EXPENSES'),
        this.translate.instant('TITHE_MANAGEMENT.TITHE_VALUE', { percentage: data.tithePercentage }),
        this.translate.instant('TITHE_MANAGEMENT.OFFER_VALUE', { percentage: data.offerPercentage }),
        this.translate.instant('TITHE_MANAGEMENT.TOTAL_TO_PAY')
      ]],
      body: [[
        this.formatBRL(data.totals.airbnb),
        this.formatBRL(data.totals.expenses),
        this.formatBRL(data.totals.tithe),
        this.formatBRL(data.totals.offer),
        this.formatBRL(data.totals.total)
      ]],
      theme: 'striped',
      headStyles: { fillColor: [67, 56, 202] } // primary color
    });

    // Payments Table
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(this.translate.instant('TITHE_MANAGEMENT.PAYMENTS_LIST'), 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [[
        this.translate.instant('EXPENSES_FORM.DATE'),
        this.translate.instant('TERMS.GUEST'),
        this.translate.instant('TERMS.CONFIRMATION_CODE'),
        this.translate.instant('TERMS.TYPE'),
        this.translate.instant('TERMS.PAID')
      ]],
      body: data.payments.map(p => [
        this.formatDate(p.data),
        p.hospede,
        p.codigo_confirmacao,
        p.tipo,
        this.formatBRL(p.pago || p.valor)
      ]),
    });

    // Expenses Table
    doc.setFontSize(14);
    doc.text(this.translate.instant('TITHE_MANAGEMENT.EXPENSES_LIST'), 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [[
        this.translate.instant('EXPENSES_FORM.DATE'),
        this.translate.instant('EXPENSES_FORM.DESCRIPTION'),
        this.translate.instant('EXPENSES_FORM.TYPE'),
        this.translate.instant('EXPENSES_FORM.PRICE')
      ]],
      body: data.expenses.map(e => [
        this.formatDate(e.purchaseDate),
        e.description,
        this.translate.instant(`EXPENSES_FORM.TYPES.${e.type}`),
        this.formatBRL(e.price)
      ]),
    });

    // History Table
    doc.setFontSize(14);
    doc.text(this.translate.instant('TITHE_MANAGEMENT.HISTORY'), 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [[
        this.translate.instant('TERMS.MONTH'),
        this.translate.instant('TITHE_MANAGEMENT.AIRBNB_PAYMENTS'),
        this.translate.instant('TITHE_MANAGEMENT.TITHE_VALUE', { percentage: '' }),
        this.translate.instant('TITHE_MANAGEMENT.OFFER_VALUE', { percentage: '' }),
        this.translate.instant('TITHE_MANAGEMENT.TOTAL_TO_PAY')
      ]],
      body: data.history.map(h => [
        this.formatDateMonth(h.monthYear),
        this.formatBRL(h.airbnbGross),
        this.formatBRL(h.titheValue),
        this.formatBRL(h.offerValue),
        this.formatBRL(h.totalPaid)
      ]),
    });

    // Save
    doc.save(`Dizimo_${monthName}_${data.year}.pdf`);
  }

  private formatBRL(value: number): string {
    return formatCurrency(value, 'pt-BR', 'R$');
  }

  private formatDate(date: any): string {
    return formatDate(date, 'dd/MM/yyyy', 'en-US');
  }

  private formatDateMonth(date: any): string {
    return formatDate(date, 'MM/yyyy', 'en-US');
  }
}
