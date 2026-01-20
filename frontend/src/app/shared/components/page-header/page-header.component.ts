import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="mb-6 animate-fade-in">
      <div class="flex flex-wrap items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div class="flex items-center gap-2">
          <button
            *ngIf="showBackButton"
            mat-icon-button
            class="text-gray-500 hover:text-primary"
            (click)="backClick.emit()"
            matTooltip="Voltar">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1 class="text-3xl font-semibold text-gray-900 m-0 flex items-center gap-2 max-sm:text-2xl">
              <mat-icon *ngIf="icon" class="text-primary text-[32px] w-8 h-8 max-sm:text-[28px] max-sm:w-7 max-sm:h-7">{{ icon }}</mat-icon>
              {{ title }}
            </h1>
            <p *ngIf="subtitle" class="text-sm text-gray-500 mt-1 m-0">{{ subtitle }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 max-sm:w-full max-sm:[&_button]:flex-1">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() showBackButton = false;
  @Output() backClick = new EventEmitter<void>();
}
