import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { ArtistListComponent } from './artist-list.component';
import { ArtistsFacade } from '../../facades/artists.facade';
import { Artist, ArtistType } from '../../models/artist.model';
import { PageResponse } from '@shared/models/pagination.model';

describe('ArtistListComponent', () => {
  let component: ArtistListComponent;
  let fixture: ComponentFixture<ArtistListComponent>;
  let facade: jasmine.SpyObj<ArtistsFacade>;

  const mockArtist: Artist = {
    id: 1,
    name: 'Test Artist',
    type: ArtistType.SOLO,
    country: 'USA',
    biography: 'Test biography',
    albumCount: 5,
    active: true,
    photoUrl: 'http://example.com/photo.jpg',
    albums: []
  };

  const mockPageResponse: PageResponse<Artist> = {
    content: [mockArtist],
    totalElements: 1,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 1,
    empty: false
  };

  const artistsSubject = new BehaviorSubject<Artist[]>([mockArtist]);
  const loadingSubject = new BehaviorSubject<boolean>(false);
  const errorSubject = new BehaviorSubject<string | null>(null);
  const paginationSubject = new BehaviorSubject<any>({
    totalElements: 1,
    totalPages: 1,
    currentPage: 0,
    pageSize: 10
  });

  beforeEach(async () => {
    const facadeSpy = jasmine.createSpyObj('ArtistsFacade', [
      'loadArtists',
      'searchArtists',
      'deleteArtist',
      'setFilters',
      'setSorting',
      'setPage',
      'setPageSize'
    ], {
      'artists$': artistsSubject.asObservable(),
      'loading$': loadingSubject.asObservable(),
      'error$': errorSubject.asObservable(),
      'pagination$': paginationSubject.asObservable(),
      'filters$': of({ name: '', type: null }),
      'sorting$': of({ sortBy: 'name', sortDir: 'asc' })
    });

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
        MatChipsModule
      ],
      providers: [
        { provide: ArtistsFacade, useValue: facadeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ArtistListComponent);
    component = fixture.componentInstance;
    facade = TestBed.inject(ArtistsFacade) as jasmine.SpyObj<ArtistsFacade>;
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
      expect(component.error).toBeNull();
    });

    it('should initialize filter controls', () => {
      fixture.detectChanges();

      expect(component.searchControl.value).toBe('');
      expect(component.typeControl.value).toBeNull();
    });
  });

  describe('Search functionality', () => {
    it('should search artists with debounce', (done) => {
      fixture.detectChanges();

      component.searchControl.setValue('Test');

      setTimeout(() => {
        expect(facade.setFilters).toHaveBeenCalledWith(
          jasmine.objectContaining({ name: 'Test' })
        );
        done();
      }, 600);
    });

    it('should not search with less than 2 characters', (done) => {
      fixture.detectChanges();
      facade.setFilters.calls.reset();

      component.searchControl.setValue('T');

      setTimeout(() => {
        expect(facade.setFilters).not.toHaveBeenCalled();
        done();
      }, 600);
    });

    it('should clear search when empty', (done) => {
      fixture.detectChanges();

      component.searchControl.setValue('');

      setTimeout(() => {
        expect(facade.setFilters).toHaveBeenCalledWith(
          jasmine.objectContaining({ name: '' })
        );
        done();
      }, 600);
    });
  });

  describe('Type filter', () => {
    it('should filter by artist type', () => {
      fixture.detectChanges();

      component.typeControl.setValue(ArtistType.BAND);

      expect(facade.setFilters).toHaveBeenCalledWith(
        jasmine.objectContaining({ type: ArtistType.BAND })
      );
    });

    it('should clear type filter when null', () => {
      fixture.detectChanges();

      component.typeControl.setValue(null);

      expect(facade.setFilters).toHaveBeenCalledWith(
        jasmine.objectContaining({ type: null })
      );
    });
  });

  describe('Sorting', () => {
    it('should toggle sort direction', () => {
      fixture.detectChanges();

      component.toggleSort();

      expect(facade.setSorting).toHaveBeenCalledWith({
        sortBy: 'name',
        sortDir: 'desc'
      });

      component.toggleSort();

      expect(facade.setSorting).toHaveBeenCalledWith({
        sortBy: 'name',
        sortDir: 'asc'
      });
    });

    it('should display correct sort icon', () => {
      fixture.detectChanges();

      expect(component.getSortIcon()).toBe('arrow_upward');

      component.sortDir = 'desc';
      expect(component.getSortIcon()).toBe('arrow_downward');
    });
  });

  describe('Pagination', () => {
    it('should handle page change', () => {
      fixture.detectChanges();

      const pageEvent = {
        pageIndex: 1,
        pageSize: 10,
        length: 20
      };

      component.onPageChange(pageEvent);

      expect(facade.setPage).toHaveBeenCalledWith(1);
    });

    it('should handle page size change', () => {
      fixture.detectChanges();

      const pageEvent = {
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

      component.viewArtist(1);

      expect(navigateSpy).toHaveBeenCalledWith(['/artists', 1]);
    });

    it('should navigate to edit artist', () => {
      const navigateSpy = spyOn(component['router'], 'navigate');
      fixture.detectChanges();

      component.editArtist(1);

      expect(navigateSpy).toHaveBeenCalledWith(['/artists', 1, 'edit']);
    });

    it('should delete artist with confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      facade.deleteArtist.and.returnValue(of(void 0));
      fixture.detectChanges();

      component.deleteArtist(mockArtist);

      expect(window.confirm).toHaveBeenCalledWith(
        `Are you sure you want to delete ${mockArtist.name}?`
      );
      expect(facade.deleteArtist).toHaveBeenCalledWith(1);
    });

    it('should not delete artist without confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      fixture.detectChanges();

      component.deleteArtist(mockArtist);

      expect(facade.deleteArtist).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(console, 'error');
      facade.deleteArtist.and.returnValue(
        throwError(() => new Error('Delete failed'))
      );
      fixture.detectChanges();

      component.deleteArtist(mockArtist);

      expect(console.error).toHaveBeenCalledWith(
        'Error deleting artist:',
        jasmine.any(Error)
      );
    });
  });

  describe('Display helpers', () => {
    it('should get artist type label', () => {
      expect(component.getTypeLabel(ArtistType.SOLO)).toBe('Solo');
      expect(component.getTypeLabel(ArtistType.BAND)).toBe('Band');
    });

    it('should get artist type color', () => {
      expect(component.getTypeColor(ArtistType.SOLO)).toBe('primary');
      expect(component.getTypeColor(ArtistType.BAND)).toBe('accent');
    });

    it('should get default photo when no URL', () => {
      const artist = { ...mockArtist, photoUrl: null };
      expect(component.getArtistPhoto(artist)).toContain('assets/images/default-artist.png');
    });

    it('should get artist photo URL', () => {
      expect(component.getArtistPhoto(mockArtist)).toBe('http://example.com/photo.jpg');
    });
  });

  describe('Error handling', () => {
    it('should display error message', () => {
      errorSubject.next('Failed to load artists');
      fixture.detectChanges();

      expect(component.error).toBe('Failed to load artists');

      const compiled = fixture.nativeElement;
      const errorElement = compiled.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Failed to load artists');
    });

    it('should clear error on successful load', () => {
      errorSubject.next('Error');
      fixture.detectChanges();
      expect(component.error).toBe('Error');

      errorSubject.next(null);
      fixture.detectChanges();
      expect(component.error).toBeNull();
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner', () => {
      loadingSubject.next(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const spinner = compiled.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should hide loading spinner', () => {
      loadingSubject.next(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const spinner = compiled.querySelector('mat-spinner');
      expect(spinner).toBeFalsy();
    });
  });

  describe('Empty state', () => {
    it('should show empty message when no artists', () => {
      artistsSubject.next([]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const emptyMessage = compiled.querySelector('.empty-state');
      expect(emptyMessage).toBeTruthy();
      expect(emptyMessage.textContent).toContain('No artists found');
    });

    it('should hide empty message when artists exist', () => {
      artistsSubject.next([mockArtist]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const emptyMessage = compiled.querySelector('.empty-state');
      expect(emptyMessage).toBeFalsy();
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