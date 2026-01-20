import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  host: { class: 'block' },
  template: `
    <div class="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
      <mat-icon class="text-[72px] w-[72px] h-[72px] text-gray-300 mb-6">{{ icon }}</mat-icon>
      <h3 class="text-xl font-semibold text-gray-900 m-0 mb-2">{{ title }}</h3>
      <p class="text-sm text-gray-500 m-0 mb-6 max-w-[400px] leading-relaxed">{{ description }}</p>
      <button
        *ngIf="actionText"
        mat-raised-button
        color="primary"
        (click)="actionClick.emit()">
        <mat-icon *ngIf="actionIcon" class="mr-1">{{ actionIcon }}</mat-icon>
        {{ actionText }}
      </button>
    </div>
  `,
  styles: []
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nenhum item encontrado';
  @Input() description = 'Não há dados para exibir no momento.';
  @Input() actionText?: string;
  @Input() actionIcon?: string;
  @Output() actionClick = new EventEmitter<void>();
}
