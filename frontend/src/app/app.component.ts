import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';
import { HealthCheckService, HealthStatus } from './core/services/health-check.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlayerFacade } from './features/player/facades/player.facade';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Artistas e Álbuns';
  isLoggedIn = false;
  username = '';
  showNavbar = true;
  healthStatus: HealthStatus | null = null;
  hasActivePlayer$: Observable<boolean>;
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private wsService: WebSocketService,
    public healthCheckService: HealthCheckService,
    private router: Router,
    private snackBar: MatSnackBar,
    private playerFacade: PlayerFacade
  ) {
    this.hasActivePlayer$ = this.playerFacade.state.pipe(
      map(state => state.currentTrack !== null)
    );
  }

  ngOnInit(): void {
    // Start health check monitoring
    this.healthCheckService.startPeriodicCheck();

    // Subscribe to health status changes
    this.subscriptions.add(
      this.healthCheckService.getHealthStatus().subscribe(status => {
        const previousStatus = this.healthStatus;
        this.healthStatus = status;

        // Show notification when status changes (only after a real previous check)
        if (previousStatus && previousStatus.lastCheck && previousStatus.isHealthy !== status.isHealthy) {
          if (status.isHealthy) {
            this.snackBar.open('Conexão com o servidor restaurada', 'OK', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          } else {
            this.snackBar.open('Conexão com o servidor perdida. Alguns recursos podem estar indisponíveis.', 'Reconectar', {
              duration: 0,  // Keep open until dismissed
              panelClass: ['error-snackbar']
            }).onAction().subscribe(() => {
              this.healthCheckService.forceCheck();
            });
          }
        }
      })
    );

    // Check route to show/hide navbar
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        this.showNavbar = !event.url.includes('/auth/');
      })
    );

    // Check initial route
    this.showNavbar = !this.router.url.includes('/auth/');

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
    this.healthCheckService.stopPeriodicCheck();
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
