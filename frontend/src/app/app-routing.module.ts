import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'artists',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'artists',
    loadChildren: () => import('./features/artists/artists.module').then(m => m.ArtistsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'albums',
    loadChildren: () => import('./features/albums/albums.module').then(m => m.AlbumsModule),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'artists'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
