import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Artistas e Álbuns';
  isLoggedIn = false;
  username = '';
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private wsService: WebSocketService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.isAuthenticated$.subscribe(isAuth => {
        this.isLoggedIn = isAuth;
        if (isAuth) {
          this.username = this.authService.getUsername() || '';
          this.connectWebSocket();
        }
      })
    );

    this.subscriptions.add(
      this.wsService.albumNotifications$.subscribe(notification => {
        if (notification) {
          this.snackBar.open(notification.message, 'Ver', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.wsService.disconnect();
  }

  private connectWebSocket(): void {
    this.wsService.connect();
  }

  logout(): void {
    this.authService.logout();
    this.wsService.disconnect();
    this.router.navigate(['/auth/login']);
  }
}
