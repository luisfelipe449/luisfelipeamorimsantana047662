import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, BehaviorSubject } from 'rxjs';

import { ArtistListComponent } from './artist-list.component';
import { ArtistsFacade } from '../../facades/artists.facade';
import { Artist, ArtistType } from '../../models/artist.model';

describe('ArtistListComponent', () => {
  let component: ArtistListComponent;
  let fixture: ComponentFixture<ArtistListComponent>;
  let facade: jasmine.SpyObj<ArtistsFacade>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockArtist: Artist = {
    id: 1,
    name: 'Test Artist',
    type: 'SOLO' as ArtistType,
    country: 'USA',
    biography: 'Test biography',
    active: true,
    photoUrl: 'http://example.com/photo.jpg',
    albums: []
  };

  const artistsSubject = new BehaviorSubject<Artist[]>([mockArtist]);
  const loadingSubject = new BehaviorSubject<boolean>(false);
  const paginationSubject = new BehaviorSubject<any>({
    totalElements: 1,
    totalPages: 1,
    page: 0,
    size: 10
  });
  const filtersSubject = new BehaviorSubject<any>({
    name: '',
    type: null,
    sortDirection: 'asc'
  });

  beforeEach(async () => {
    const facadeSpy = jasmine.createSpyObj('ArtistsFacade', [
      'loadArtists',
      'setNameFilter',
      'setSortDirection',
      'setTypeFilter',
      'setPage',
      'setPageSize',
      'clearFilters',
      'deactivateArtist'
    ], {
      'artists$': artistsSubject.asObservable(),
      'loading$': loadingSubject.asObservable(),
      'pagination$': paginationSubject.asObservable(),
      'filters$': filtersSubject.asObservable()
    });

    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      declarations: [ArtistListComponent],
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        MatSnackBarModule,
        MatDialogModule
      ],
      providers: [
        { provide: ArtistsFacade, useValue: facadeSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ArtistListComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(ArtistsFacade) as jasmine.SpyObj<ArtistsFacade>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load artists on init', () => {
      fixture.detectChanges();
      expect(facade.loadArtists).toHaveBeenCalled();
    });

    it('should subscribe to facade observables', () => {
      fixture.detectChanges();

      expect(component.artists).toEqual([mockArtist]);
      expect(component.loading).toBe(false);
    });
  });

  describe('Search functionality', () => {
    it('should call setNameFilter with debounce', fakeAsync(() => {
      fixture.detectChanges();

      const event = { target: { value: 'Test' } } as unknown as Event;
      component.onSearch(event);

      tick(600);

      expect(facade.setNameFilter).toHaveBeenCalledWith('Test');
    }));

    it('should not search with less than 2 characters', fakeAsync(() => {
      fixture.detectChanges();
      facade.setNameFilter.calls.reset();

      const event = { target: { value: 'T' } } as unknown as Event;
      component.onSearch(event);

      tick(600);

      expect(facade.setNameFilter).not.toHaveBeenCalled();
    }));

    it('should clear search when empty', fakeAsync(() => {
      fixture.detectChanges();

      const event = { target: { value: '' } } as unknown as Event;
      component.onSearch(event);

      tick(600);

      expect(facade.setNameFilter).toHaveBeenCalledWith('');
    }));
  });

  describe('Type filter', () => {
    it('should filter by artist type', () => {
      fixture.detectChanges();

      component.onTypeFilterChange('BAND' as ArtistType);

      expect(facade.setTypeFilter).toHaveBeenCalledWith('BAND');
    });

    it('should clear type filter when null', () => {
      fixture.detectChanges();

      component.onTypeFilterChange(null);

      expect(facade.setTypeFilter).toHaveBeenCalledWith(null);
    });
  });

  describe('Sorting', () => {
    it('should toggle sort direction', () => {
      fixture.detectChanges();

      component.onSortChange();
      expect(facade.setSortDirection).toHaveBeenCalledWith('desc');

      component.onSortChange();
      expect(facade.setSortDirection).toHaveBeenCalledWith('asc');
    });
  });

  describe('Pagination', () => {
    it('should handle page change', () => {
      fixture.detectChanges();

      const pageEvent: PageEvent = {
        pageIndex: 1,
        pageSize: 10,
        length: 20
      };

      component.onPageChange(pageEvent);

      expect(facade.setPage).toHaveBeenCalledWith(1);
    });

    it('should handle page size change', () => {
      fixture.detectChanges();

      const pageEvent: PageEvent = {
        pageIndex: 0,
        pageSize: 25,
        length: 50
      };

      component.onPageChange(pageEvent);

      expect(facade.setPageSize).toHaveBeenCalledWith(25);
    });
  });

  describe('Artist actions', () => {
    it('should navigate to artist detail', () => {
      const navigateSpy = spyOn(component['router'], 'navigate');
      fixture.detectChanges();

      component.viewArtist(mockArtist);

      expect(navigateSpy).toHaveBeenCalledWith(['/artists', 1]);
    });

    it('should navigate to edit artist', () => {
      const navigateSpy = spyOn(component['router'], 'navigate');
      fixture.detectChanges();

      component.editArtist(mockArtist);

      expect(navigateSpy).toHaveBeenCalledWith(['/artists', 1, 'edit']);
    });

    it('should delete artist with confirmation', () => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialog.open.and.returnValue(dialogRefSpy);
      facade.deactivateArtist.and.returnValue(of(void 0));
      fixture.detectChanges();

      component.deleteArtist(mockArtist);

      expect(dialog.open).toHaveBeenCalled();
      expect(facade.deactivateArtist).toHaveBeenCalledWith(1);
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should not delete artist without confirmation', () => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialog.open.and.returnValue(dialogRefSpy);
      fixture.detectChanges();

      component.deleteArtist(mockArtist);

      expect(facade.deactivateArtist).not.toHaveBeenCalled();
    });
  });

  describe('Display helpers', () => {
    it('should get artist type label', () => {
      expect(component.getTypeLabel('SOLO' as ArtistType)).toBe('Solo');
      expect(component.getTypeLabel('BAND' as ArtistType)).toBe('Banda');
    });
  });

  describe('Loading state', () => {
    it('should update loading state', () => {
      loadingSubject.next(true);
      fixture.detectChanges();

      expect(component.loading).toBe(true);
    });
  });

  describe('Component cleanup', () => {
    it('should unsubscribe on destroy', () => {
      fixture.detectChanges();
      const unsubscribeSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
