import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { PlayerFacade } from '../../facades/player.facade';
import { PlayerState, RepeatMode } from '../../models/player.model';
import { TrackDTO } from '@features/albums/models/track.model';

@Component({
  selector: 'app-player-bar',
  templateUrl: './player-bar.component.html',
  styleUrls: ['./player-bar.component.scss']
})
export class PlayerBarComponent implements OnInit, OnDestroy {
  playerState$: Observable<PlayerState>;
  RepeatMode = RepeatMode;

  isDraggingProgress = false;
  isDraggingVolume = false;
  showVolumeSlider = false;
  showQueue = false;

  private keyboardSubscription?: Subscription;

  constructor(public playerFacade: PlayerFacade) {
    this.playerState$ = this.playerFacade.state;
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    if (this.keyboardSubscription) {
      this.keyboardSubscription.unsubscribe();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Ignore if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case ' ':
        event.preventDefault();
        this.togglePlayPause();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.skipForward();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.skipBackward();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.increaseVolume();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.decreaseVolume();
        break;
      case 'n':
      case 'N':
        event.preventDefault();
        this.playerFacade.next();
        break;
      case 'p':
      case 'P':
        event.preventDefault();
        this.playerFacade.previous();
        break;
      case 'm':
      case 'M':
        event.preventDefault();
        this.playerFacade.toggleMute();
        break;
    }
  }

  async togglePlayPause(): Promise<void> {
    const state = await this.playerState$.toPromise();
    if (state?.isPlaying) {
      this.playerFacade.pause();
    } else {
      await this.playerFacade.play();
    }
  }

  onProgressMouseDown(event: MouseEvent): void {
    this.isDraggingProgress = true;
    this.updateProgress(event);
  }

  onProgressMouseMove(event: MouseEvent): void {
    if (this.isDraggingProgress) {
      this.updateProgress(event);
    }
  }

  onProgressMouseUp(event: MouseEvent): void {
    if (this.isDraggingProgress) {
      this.isDraggingProgress = false;
      this.updateProgress(event);
    }
  }

  onProgressClick(event: MouseEvent): void {
    this.updateProgress(event);
  }

  private async updateProgress(event: MouseEvent): Promise<void> {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

    const state = await this.playerState$.toPromise();
    if (state && state.duration) {
      const time = percent * state.duration;
      this.playerFacade.seek(time);
    }
  }

  onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const volume = parseFloat(input.value);
    this.playerFacade.setVolume(volume);
  }

  private skipForward(): void {
    this.playerState$.subscribe(state => {
      if (state.currentTime && state.duration) {
        const newTime = Math.min(state.currentTime + 5, state.duration);
        this.playerFacade.seek(newTime);
      }
    }).unsubscribe();
  }

  private skipBackward(): void {
    this.playerState$.subscribe(state => {
      if (state.currentTime) {
        const newTime = Math.max(state.currentTime - 5, 0);
        this.playerFacade.seek(newTime);
      }
    }).unsubscribe();
  }

  private increaseVolume(): void {
    this.playerState$.subscribe(state => {
      const newVolume = Math.min(state.volume + 0.1, 1);
      this.playerFacade.setVolume(newVolume);
    }).unsubscribe();
  }

  private decreaseVolume(): void {
    this.playerState$.subscribe(state => {
      const newVolume = Math.max(state.volume - 0.1, 0);
      this.playerFacade.setVolume(newVolume);
    }).unsubscribe();
  }

  formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) {
      return '0:00';
    }

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  getProgressPercent(state: PlayerState): number {
    if (!state.duration || !state.currentTime) {
      return 0;
    }
    return (state.currentTime / state.duration) * 100;
  }

  getVolumeIcon(state: PlayerState): string {
    if (state.isMuted || state.volume === 0) {
      return 'volume_off';
    } else if (state.volume < 0.5) {
      return 'volume_down';
    } else {
      return 'volume_up';
    }
  }

  getRepeatIcon(mode: RepeatMode): string {
    switch (mode) {
      case RepeatMode.ONE:
        return 'repeat_one';
      case RepeatMode.ALL:
      case RepeatMode.NONE:
        return 'repeat';
    }
  }
}