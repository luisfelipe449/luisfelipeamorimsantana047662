import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArtistListComponent } from './components/artist-list/artist-list.component';
import { ArtistDetailComponent } from './components/artist-detail/artist-detail.component';
import { ArtistFormComponent } from './components/artist-form/artist-form.component';

const routes: Routes = [
  {
    path: '',
    component: ArtistListComponent
  },
  {
    path: 'new',
    component: ArtistFormComponent
  },
  {
    path: ':id',
    component: ArtistDetailComponent
  },
  {
    path: ':id/edit',
    component: ArtistFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ArtistsRoutingModule { }
