import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state animate-fade-in">
      <mat-icon class="empty-state-icon">{{ icon }}</mat-icon>
      <h3 class="empty-state-title">{{ title }}</h3>
      <p class="empty-state-description">{{ description }}</p>
      <button
        *ngIf="actionText"
        mat-raised-button
        color="primary"
        (click)="actionClick.emit()">
        <mat-icon *ngIf="actionIcon">{{ actionIcon }}</mat-icon>
        {{ actionText }}
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl, 48px);
      text-align: center;
    }

    .empty-state-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: var(--color-gray-300, #d1d5db);
      margin-bottom: var(--spacing-lg, 24px);
    }

    .empty-state-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary, #111827);
      margin: 0 0 var(--spacing-sm, 8px);
    }

    .empty-state-description {
      font-size: 14px;
      color: var(--text-secondary, #4b5563);
      margin: 0 0 var(--spacing-lg, 24px);
      max-width: 400px;
      line-height: 1.6;
    }

    button {
      mat-icon {
        margin-right: var(--spacing-xs, 4px);
      }
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nenhum item encontrado';
  @Input() description = 'Não há dados para exibir no momento.';
  @Input() actionText?: string;
  @Input() actionIcon?: string;
  @Output() actionClick = new EventEmitter<void>();
}
