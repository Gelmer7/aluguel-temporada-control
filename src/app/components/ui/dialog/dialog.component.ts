import { Component, ChangeDetectionStrategy, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';

export type ButtonSeverity = 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' | null | undefined;

@Component({
  selector: 'app-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DialogModule, ButtonModule, TranslateModule],
  templateUrl: './dialog.component.html',
})
export class DialogComponent {
  /** Visibility of the dialog */
  visible = model<boolean>(false);

  /** Title of the dialog */
  header = input<string>('');

  /** Icon for the header */
  icon = input<string>('');

  /** Label for the save button */
  saveLabel = input<string>('ACTIONS.SAVE');

  /** Label for the cancel button */
  cancelLabel = input<string>('ACTIONS.CANCEL');

  /** Severity for the save button */
  saveSeverity = input<ButtonSeverity>('primary');

  /** If the save button should be disabled */
  saveDisabled = input<boolean>(false);

  /** If the footer should be visible */
  showFooter = input<boolean>(true);

  /** Width of the dialog */
  width = input<string>('50vw');

  /** Max width of the dialog */
  maxWidth = input<string>('none');

  /** Breakpoints for responsiveness */
  breakpoints = input<{ [key: string]: string }>({ '960px': '75vw', '640px': '90vw' });

  /** Event emitted when save button is clicked */
  onSave = output<void>();

  /** Event emitted when cancel button is clicked or dialog is closed */
  onCancel = output<void>();

  close() {
    this.visible.set(false);
    this.onCancel.emit();
  }

  save() {
    this.onSave.emit();
  }
}
