import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ArtistsRoutingModule } from './artists-routing.module';

import { ArtistListComponent } from './components/artist-list/artist-list.component';
import { ArtistDetailComponent } from './components/artist-detail/artist-detail.component';
import { ArtistFormComponent } from './components/artist-form/artist-form.component';

import { ArtistsFacade } from './facades/artists.facade';
import { ArtistsService } from './services/artists.service';

@NgModule({
  declarations: [
    ArtistListComponent,
    ArtistDetailComponent,
    ArtistFormComponent
  ],
  imports: [
    SharedModule,
    ArtistsRoutingModule
  ],
  providers: [
    ArtistsService,
    ArtistsFacade
  ]
})
export class ArtistsModule { }
