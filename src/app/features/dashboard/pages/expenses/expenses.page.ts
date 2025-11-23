import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ExpenseFormComponent } from '../../components/expense-form/expense-form.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ExpenseFormComponent, ButtonModule],
  templateUrl: './expenses.page.html',
})
export class ExpensesPage {
  showExpenseForm = false;

  onSaveExpense(expense: any) {
    console.log('Expense saved:', expense);
    // TODO: Implement service call
  }
}