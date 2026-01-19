import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header" [class.warn]="data.confirmColor === 'warn'">
        <mat-icon class="dialog-icon">{{ data.icon || 'help_outline' }}</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>

      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button
          mat-raised-button
          [color]="data.confirmColor || 'primary'"
          (click)="onConfirm()">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 350px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm, 8px);
      padding: var(--spacing-md, 16px) var(--spacing-lg, 24px) 0;

      &.warn .dialog-icon {
        color: var(--color-error, #ef4444);
      }
    }

    .dialog-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: var(--color-primary, #305f99);
    }

    h2[mat-dialog-title] {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    mat-dialog-content {
      padding: var(--spacing-md, 16px) var(--spacing-lg, 24px);
      color: var(--text-secondary, #4b5563);
      font-size: 14px;
      line-height: 1.6;

      p {
        margin: 0;
      }
    }

    mat-dialog-actions {
      padding: var(--spacing-sm, 8px) var(--spacing-lg, 24px) var(--spacing-md, 16px);
      gap: var(--spacing-sm, 8px);
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
