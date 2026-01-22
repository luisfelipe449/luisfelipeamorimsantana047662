import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';

import { PlayerBarComponent } from './components/player-bar/player-bar.component';
import { AudioService } from './services/audio.service';
import { PlayerFacade } from './facades/player.facade';

@NgModule({
  declarations: [
    PlayerBarComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSliderModule
  ],
  providers: [
    AudioService,
    PlayerFacade
  ],
  exports: [
    PlayerBarComponent
  ]
})
export class PlayerModule { }