import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { AlbumsRoutingModule } from './albums-routing.module';

import { AlbumListComponent } from './components/album-list/album-list.component';
import { AlbumFormComponent } from './components/album-form/album-form.component';
import { AlbumDetailComponent } from './components/album-detail/album-detail.component';

import { AlbumsFacade } from './facades/albums.facade';
import { AlbumsService } from './services/albums.service';
import { TrackAudioService } from './services/track-audio.service';

@NgModule({
  declarations: [
    AlbumListComponent,
    AlbumFormComponent,
    AlbumDetailComponent
  ],
  imports: [
    SharedModule,
    AlbumsRoutingModule
  ],
  providers: [
    AlbumsService,
    AlbumsFacade,
    TrackAudioService
  ]
})
export class AlbumsModule { }
