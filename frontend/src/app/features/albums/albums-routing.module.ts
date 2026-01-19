import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlbumListComponent } from './components/album-list/album-list.component';
import { AlbumFormComponent } from './components/album-form/album-form.component';
import { AlbumDetailComponent } from './components/album-detail/album-detail.component';

const routes: Routes = [
  {
    path: '',
    component: AlbumListComponent
  },
  {
    path: 'new',
    component: AlbumFormComponent
  },
  {
    path: ':id',
    component: AlbumDetailComponent
  },
  {
    path: ':id/edit',
    component: AlbumFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AlbumsRoutingModule { }
