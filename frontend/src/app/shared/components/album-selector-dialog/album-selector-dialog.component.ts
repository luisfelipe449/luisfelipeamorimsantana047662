import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';

export interface AlbumOption {
  id: number;
  title: string;
  releaseYear?: number;
  coverUrl?: string;
}

export interface AlbumSelectorDialogData {
  selectedAlbumIds: number[];
  availableAlbums: AlbumOption[];
  title?: string;
}

@Component({
  selector: 'app-album-selector-dialog',
  template: `
    <div class="album-selector-dialog">
      <div class="dialog-header">
        <mat-icon class="dialog-icon">album</mat-icon>
        <h2 mat-dialog-title>{{ data.title || 'Vincular Álbuns' }}</h2>
      </div>

      <mat-dialog-content>
        <!-- Search -->
        <mat-form-field appearance="outline" class="w-full mb-4">
          <mat-label>Buscar álbum</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput
                 [(ngModel)]="searchTerm"
                 placeholder="Digite o nome do álbum..."
                 (input)="filterAlbums()">
          <button mat-icon-button matSuffix *ngIf="searchTerm" (click)="clearSearch()">
            <mat-icon>close</mat-icon>
          </button>
        </mat-form-field>

        <!-- Album List -->
        <div class="album-list" *ngIf="filteredAlbums.length > 0">
          <div *ngFor="let album of filteredAlbums"
               class="album-item"
               [class.selected]="selection.isSelected(album.id)"
               (click)="toggleSelection(album.id)">
            <!-- Cover -->
            <div class="album-cover">
              <img *ngIf="album.coverUrl"
                   [src]="album.coverUrl"
                   [alt]="album.title">
              <div *ngIf="!album.coverUrl" class="no-cover">
                <mat-icon>album</mat-icon>
              </div>
            </div>
            <!-- Info -->
            <div class="album-info">
              <span class="album-title">{{ album.title }}</span>
              <span class="album-year" *ngIf="album.releaseYear">{{ album.releaseYear }}</span>
            </div>
            <!-- Checkbox -->
            <mat-checkbox
              [checked]="selection.isSelected(album.id)"
              (click)="$event.stopPropagation()"
              (change)="toggleSelection(album.id)">
            </mat-checkbox>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="filteredAlbums.length === 0">
          <mat-icon>search_off</mat-icon>
          <p *ngIf="searchTerm">Nenhum álbum encontrado para "{{ searchTerm }}"</p>
          <p *ngIf="!searchTerm">Nenhum álbum disponível</p>
        </div>

        <!-- Selection count -->
        <div class="selection-count" *ngIf="selection.selected.length > 0">
          {{ selection.selected.length }} álbum(ns) selecionado(s)
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancelar</button>
        <button mat-raised-button color="primary" (click)="onConfirm()">
          Confirmar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .album-selector-dialog {
      min-width: 400px;
      max-width: 500px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 24px 0;
    }

    .dialog-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #305f99;
    }

    h2[mat-dialog-title] {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    mat-dialog-content {
      padding: 16px 24px;
      max-height: 400px;
      overflow-y: auto;
    }

    .album-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .album-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.15s ease;
      border: 1px solid #e5e7eb;
    }

    .album-item:hover {
      background-color: #f3f4f6;
    }

    .album-item.selected {
      background-color: #eff6ff;
      border-color: #305f99;
    }

    .album-cover {
      width: 48px;
      height: 48px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      background-color: #f3f4f6;
    }

    .album-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .album-cover .no-cover {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
    }

    .album-cover .no-cover mat-icon {
      color: #9ca3af;
    }

    .album-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .album-title {
      font-weight: 500;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .album-year {
      font-size: 12px;
      color: #6b7280;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      color: #9ca3af;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }

    .empty-state p {
      margin: 0;
      text-align: center;
    }

    .selection-count {
      margin-top: 16px;
      padding: 8px 12px;
      background-color: #eff6ff;
      border-radius: 6px;
      font-size: 13px;
      color: #305f99;
      font-weight: 500;
      text-align: center;
    }

    mat-dialog-actions {
      padding: 8px 24px 16px;
      gap: 8px;
    }
  `]
})
export class AlbumSelectorDialogComponent implements OnInit {
  searchTerm = '';
  filteredAlbums: AlbumOption[] = [];
  selection = new SelectionModel<number>(true, []);

  constructor(
    public dialogRef: MatDialogRef<AlbumSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlbumSelectorDialogData
  ) {}

  ngOnInit(): void {
    this.filteredAlbums = [...this.data.availableAlbums];
    // Pre-select already linked albums
    if (this.data.selectedAlbumIds?.length > 0) {
      this.selection.select(...this.data.selectedAlbumIds);
    }
  }

  filterAlbums(): void {
    if (!this.searchTerm.trim()) {
      this.filteredAlbums = [...this.data.availableAlbums];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredAlbums = this.data.availableAlbums.filter(
        album => album.title.toLowerCase().includes(term)
      );
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterAlbums();
  }

  toggleSelection(albumId: number): void {
    this.selection.toggle(albumId);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    this.dialogRef.close(this.selection.selected);
  }
}
