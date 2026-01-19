import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="page-header animate-fade-in">
      <div class="page-header-content">
        <div class="page-header-title-section">
          <button
            *ngIf="showBackButton"
            mat-icon-button
            class="back-button"
            (click)="backClick.emit()"
            matTooltip="Voltar">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1 class="page-title">
              <mat-icon *ngIf="icon">{{ icon }}</mat-icon>
              {{ title }}
            </h1>
            <p *ngIf="subtitle" class="page-subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <div class="page-actions">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: var(--spacing-lg, 24px);
    }

    .page-header-content {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md, 16px);
    }

    .page-header-title-section {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm, 8px);
    }

    .back-button {
      color: var(--text-secondary, #4b5563);

      &:hover {
        color: var(--color-primary, #305f99);
      }
    }

    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: var(--text-primary, #111827);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm, 8px);

      mat-icon {
        color: var(--color-primary, #305f99);
        font-size: 32px;
        width: 32px;
        height: 32px;
      }
    }

    .page-subtitle {
      font-size: 14px;
      color: var(--text-secondary, #4b5563);
      margin: var(--spacing-xs, 4px) 0 0;
    }

    .page-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm, 8px);
    }

    @media (max-width: 600px) {
      .page-header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .page-title {
        font-size: 24px;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }

      .page-actions {
        width: 100%;

        ::ng-deep button {
          flex: 1;
        }
      }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() showBackButton = false;
  @Output() backClick = new EventEmitter<void>();
}
