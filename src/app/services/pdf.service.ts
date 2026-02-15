import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from '@angular/common';
import { DateUtils } from '../shared/utils/date.utils';

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
    months: number[];
    tithePercentage: number;
    offerPercentage: number;
    houseCode?: string;
    includeCarneLeao?: boolean;
    payments: any[];
    expenses: any[];
    history: any[];
    totals: {
      airbnb: number;
      expenses: number;
      earnings: number;
      tithe: number;
      offer: number;
      total: number;
    };
  }) {
    const doc = new jsPDF();
    const titheLabel = this.translate.instant('TERMS.TITHE');
    const monthsNames = data.months.map((m) => this.translate.instant(`MONTHS.${m}`)).join(', ');
    const yearLabel = data.year;

    // Header
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(titheLabel, 14, 15);

    // Generation Date and Time (Top Right)
    const now = new Date();
    const generationDate = formatDate(now, 'dd/MM/yyyy HH:mm', 'en-US');
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(generationDate, 196, 10, { align: 'right' });

    // House, Months and Year (Inline to save space)
    doc.setFontSize(9);
    doc.setTextColor(80);
    let subHeaderText = `${monthsNames} / ${yearLabel}`;
    if (data.houseCode) {
      subHeaderText = `${this.translate.instant('TERMS.HOUSE')}: ${data.houseCode} | ${subHeaderText}`;
    }
    doc.text(subHeaderText, 14, 21);

    // Summary Info (Inline)
    const summaryInfo = `${this.translate.instant('TITHE_MANAGEMENT.TITHE_PERCENTAGE')}: ${data.tithePercentage || 0}%  |  ${this.translate.instant('TITHE_MANAGEMENT.OFFER_PERCENTAGE')}: ${data.offerPercentage || 0}%`;
    doc.text(summaryInfo, 14, 26);

    // Financial Summary Table
    autoTable(doc, {
      startY: 29,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 1.5 },
      head: [
        [
          this.translate.instant('TITHE_MANAGEMENT.AIRBNB_PAYMENTS'),
          this.translate.instant('TITHE_MANAGEMENT.TOTAL_EXPENSES'),
          this.translate.instant('TITHE_MANAGEMENT.TOTAL_EARNINGS'),
          this.translate.instant('TITHE_MANAGEMENT.TITHE_VALUE', {
            percentage: data.tithePercentage || 0,
          }),
          this.translate.instant('TITHE_MANAGEMENT.OFFER_VALUE', {
            percentage: data.offerPercentage || 0,
          }),
          this.translate.instant('TITHE_MANAGEMENT.TOTAL_TO_PAY'),
        ],
      ],
      body: [
        [
          this.formatBRL(data.totals.airbnb),
          this.formatBRL(data.totals.expenses),
          this.formatBRL(data.totals.earnings),
          this.formatBRL(data.totals.tithe),
          this.formatBRL(data.totals.offer),
          {
            content: this.formatBRL(data.totals.total),
            styles: { fontStyle: 'bold', fontSize: 8 },
          },
        ],
      ],
      theme: 'striped',
      headStyles: { fillColor: [67, 56, 202] }, // primary color
    });

    // Payments Table
    const lastY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(this.translate.instant('TITHE_MANAGEMENT.PAYMENTS_LIST'), 14, lastY + 8);

    autoTable(doc, {
      startY: lastY + 11,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 7, cellPadding: 1 },
      head: [
        [
          this.translate.instant('EXPENSES_FORM.DATE'),
          this.translate.instant('TERMS.GUEST'),
          this.translate.instant('TERMS.CONFIRMATION_CODE'),
          this.translate.instant('TERMS.TYPE'),
          this.translate.instant('TERMS.PAID'),
        ],
      ],
      body: data.payments.map((p) => [
        this.formatDate(p.data),
        p.hospede,
        p.codigo_confirmacao,
        p.tipo,
        this.formatBRL(p.pago || p.valor),
      ]),
      foot: [['', '', '', 'Total:', this.formatBRL(data.totals.airbnb)]],
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7,
      },
    });

    // Expenses Table
    const lastY2 = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(11);
    doc.text(this.translate.instant('TITHE_MANAGEMENT.EXPENSES_LIST'), 14, lastY2 + 8);

    autoTable(doc, {
      startY: lastY2 + 11,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 7, cellPadding: 1 },
      head: [
        [
          this.translate.instant('EXPENSES_FORM.DATE'),
          this.translate.instant('EXPENSES_FORM.DESCRIPTION'),
          this.translate.instant('EXPENSES_FORM.TYPE'),
          this.translate.instant('EXPENSES_FORM.PRICE'),
        ],
      ],
      body: data.expenses.map((e) => [
        this.formatDate(e.purchaseDate),
        e.description,
        this.translate.instant(`EXPENSES_FORM.TYPES.${e.type}`),
        this.formatBRL(e.price),
      ]),
      didParseCell: (dataCell) => {
        // Se for uma linha do corpo e a despesa for do tipo CARNE_LEAO e o total de despesas for diferente da soma total
        // (indicando que algumas foram desconsideradas)
        if (dataCell.section === 'body') {
          const expense = data.expenses[dataCell.row.index];
          const includeCarneLeao = data.includeCarneLeao !== false;

          if (!includeCarneLeao && expense.type === 'CARNE_LEAO') {
            dataCell.cell.styles.textColor = [180, 180, 180]; // Cinza claro
            dataCell.cell.styles.fontStyle = 'italic';
          }
        }
      },
      foot: [['', '', 'Total:', this.formatBRL(data.totals.expenses)]],
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7,
      },
    });

    // History Table
    const lastY3 = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(11);
    doc.text(this.translate.instant('TITHE_MANAGEMENT.HISTORY'), 14, lastY3 + 8);

    autoTable(doc, {
      startY: lastY3 + 11,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 7, cellPadding: 1 },
      head: [
        [
          this.translate.instant('TERMS.MONTH'),
          this.translate.instant('TITHE_MANAGEMENT.AIRBNB_PAYMENTS'),
          this.translate.instant('TITHE_MANAGEMENT.TITHE_VALUE', { percentage: '' }),
          this.translate.instant('TITHE_MANAGEMENT.OFFER_VALUE', { percentage: '' }),
          this.translate.instant('TITHE_MANAGEMENT.TOTAL_TO_PAY'),
        ],
      ],
      body: data.history.map((h) => [
        this.formatDateMonth(h.monthYear),
        this.formatBRL(h.airbnbGross),
        this.formatBRL(h.titheValue),
        this.formatBRL(h.offerValue),
        { content: this.formatBRL(h.totalPaid), styles: { fontStyle: 'bold' } },
      ]),
    });

    // Save
    const fileNameMonths =
      data.months.length > 1 ? 'Multiplos' : this.translate.instant(`MONTHS.${data.months[0]}`);
    doc.save(`Dizimo_${fileNameMonths}_${data.year}.pdf`);
  }

  /**
   * Generates a PDF from the expenses data
   */
  generateExpensesPdf(data: {
    year: number | string;
    months: number[];
    types: string[];
    houseCode?: string;
    expenses: any[];
    total: number;
  }) {
    const doc = new jsPDF();
    const expensesLabel = this.translate.instant('TERMS.EXPENSES');
    const yearLabel = data.year === 'ALL' ? this.translate.instant('TERMS.ALL') : data.year;

    // Traduzir nomes dos meses
    const monthsNames = data.months.length === 12
      ? this.translate.instant('TERMS.ALL')
      : data.months.map((m) => this.translate.instant(`MONTHS.${m - 1}`)).join(', ');

    // Header
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(expensesLabel, 14, 15);

    // Generation Date and Time (Top Right)
    const now = new Date();
    const generationDate = formatDate(now, 'dd/MM/yyyy HH:mm', 'en-US');
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(generationDate, 196, 10, { align: 'right' });

    // House, Months and Year
    doc.setFontSize(9);
    doc.setTextColor(80);
    let subHeaderText = `${monthsNames} / ${yearLabel}`;
    if (data.houseCode) {
      subHeaderText = `${this.translate.instant('TERMS.HOUSE')}: ${data.houseCode} | ${subHeaderText}`;
    }
    doc.text(subHeaderText, 14, 21);

    // Types filter info
    if (data.types.length > 0) {
      const typesLabel = data.types.length === 8 // Total de tipos
        ? this.translate.instant('TERMS.ALL')
        : data.types.map(t => this.translate.instant(`EXPENSES_FORM.TYPES.${t}`)).join(', ');
      doc.text(`${this.translate.instant('TERMS.TYPE')}: ${typesLabel}`, 14, 26);
    }

    // Summary Table
    autoTable(doc, {
      startY: 30,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9, cellPadding: 2 },
      head: [
        [
          this.translate.instant('COMMON.QUANTITY'),
          this.translate.instant('TERMS.TOTAL')
        ]
      ],
      body: [
        [
          data.expenses.length.toString(),
          { content: this.formatBRL(data.total), styles: { fontStyle: 'bold' } }
        ]
      ],
      theme: 'striped',
      headStyles: { fillColor: [67, 56, 202] },
    });

    // Expenses List Table
    const lastY = (doc as any).lastAutoTable.finalY;
    autoTable(doc, {
      startY: lastY + 10,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 1.5 },
      head: [
        [
          this.translate.instant('EXPENSES_FORM.DATE'),
          this.translate.instant('EXPENSES_FORM.DESCRIPTION'),
          this.translate.instant('EXPENSES_FORM.TYPE'),
          this.translate.instant('EXPENSES_FORM.PRICE'),
        ],
      ],
      body: data.expenses.map((e) => [
        this.formatDate(e.purchaseDate),
        e.description,
        this.translate.instant(`EXPENSES_FORM.TYPES.${e.type}`),
        this.formatBRL(e.price),
      ]),
      foot: [['', '', 'Total:', this.formatBRL(data.total)]],
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
      },
    });

    // Save
    doc.save(`Gastos_${data.houseCode || ''}_${yearLabel}.pdf`);
  }

  /**
   * Generates a PDF from the manual rentals data
   */
  generateManualRentalsPdf(data: {
    year: number | string;
    months: number[];
    houseCode?: string;
    rentals: any[];
    total: number;
  }) {
    const doc = new jsPDF();
    const title = this.translate.instant('MANUAL_RENTALS_FORM.TITLE');
    const yearLabel = data.year === 'ALL' ? this.translate.instant('TERMS.ALL') : data.year;

    // Traduzir nomes dos meses
    const monthsNames = data.months.length === 12
      ? this.translate.instant('TERMS.ALL')
      : data.months.map((m) => this.translate.instant(`MONTHS.${m - 1}`)).join(', ');

    // Header
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(title, 14, 15);

    // Generation Date and Time (Top Right)
    const now = new Date();
    const generationDate = formatDate(now, 'dd/MM/yyyy HH:mm', 'en-US');
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(generationDate, 196, 10, { align: 'right' });

    // House, Months and Year
    doc.setFontSize(9);
    doc.setTextColor(80);
    let subHeaderText = `${monthsNames} / ${yearLabel}`;
    if (data.houseCode) {
      subHeaderText = `${this.translate.instant('TERMS.HOUSE')}: ${data.houseCode} | ${subHeaderText}`;
    }
    doc.text(subHeaderText, 14, 21);

    // Summary Table
    autoTable(doc, {
      startY: 25,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9, cellPadding: 2 },
      head: [
        [
          this.translate.instant('COMMON.QUANTITY'),
          this.translate.instant('TERMS.TOTAL')
        ]
      ],
      body: [
        [
          data.rentals.length.toString(),
          { content: this.formatBRL(data.total), styles: { fontStyle: 'bold' } }
        ]
      ],
      theme: 'striped',
      headStyles: { fillColor: [67, 56, 202] },
    });

    // Rentals List Table
    const lastY = (doc as any).lastAutoTable.finalY;
    autoTable(doc, {
      startY: lastY + 10,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 1.5 },
      head: [
        [
          this.translate.instant('MANUAL_RENTALS_FORM.GUEST'),
          this.translate.instant('MANUAL_RENTALS_FORM.HOUSE'),
          this.translate.instant('MANUAL_RENTALS_FORM.CHECKIN'),
          this.translate.instant('MANUAL_RENTALS_FORM.CHECKOUT'),
          this.translate.instant('MANUAL_RENTALS_FORM.VALUE'),
        ],
      ],
      body: data.rentals.map((r) => [
        r.guestName,
        r.houseName,
        this.formatDate(r.checkIn),
        this.formatDate(r.checkOut),
        this.formatBRL(r.totalValue),
      ]),
      foot: [['', '', '', 'Total:', this.formatBRL(data.total)]],
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
      },
    });

    // Save
    doc.save(`Alugueis_${data.houseCode || ''}_${yearLabel}.pdf`);
  }

  private formatBRL(value: number): string {
    return formatCurrency(value, 'pt-BR', 'R$');
  }

  private formatDate(date: any): string {
    const d = DateUtils.parseLocal(date);
    return formatDate(d, 'dd/MM/yyyy', 'en-US');
  }

  private formatDateMonth(date: any): string {
    const d = DateUtils.parseLocal(date);
    return formatDate(d, 'MM/yyyy', 'en-US');
  }
}
