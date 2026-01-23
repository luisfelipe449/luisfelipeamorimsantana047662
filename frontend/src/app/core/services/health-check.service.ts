import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of, timer } from 'rxjs';
import { catchError, map, retry, switchMap, tap, timeout } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface HealthStatus {
  isHealthy: boolean;
  lastCheck: Date | null;
  status?: string;
  components?: any;
  error?: string;
  retryCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HealthCheckService {
  private readonly API_URL = environment.apiUrl;
  private readonly HEALTH_ENDPOINT = '/actuator/health';
  private readonly CHECK_INTERVAL = 60000; // 1 minute
  private readonly TIMEOUT_MS = 5000; // 5 seconds
  private readonly MAX_RETRIES = 3;

  private healthStatus$ = new BehaviorSubject<HealthStatus>({
    isHealthy: false,
    lastCheck: null,
    retryCount: 0
  });

  private checkSubscription?: any;

  constructor(private http: HttpClient) {}

  /**
   * Get the current health status as an observable
   */
  getHealthStatus(): Observable<HealthStatus> {
    return this.healthStatus$.asObservable();
  }

  /**
   * Get the current health status value
   */
  getCurrentStatus(): HealthStatus {
    return this.healthStatus$.value;
  }

  /**
   * Perform a single health check
   */
  checkHealth(): Observable<HealthStatus> {
    return this.http.get<any>(`${this.API_URL}${this.HEALTH_ENDPOINT}`).pipe(
      timeout(this.TIMEOUT_MS),
      map(response => ({
        isHealthy: response.status === 'UP',
        lastCheck: new Date(),
        status: response.status,
        components: response.components,
        retryCount: 0
      })),
      retry({
        count: this.MAX_RETRIES,
        delay: (error, retryCount) => {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount - 1) * 1000;
          console.warn(`Health check retry ${retryCount}/${this.MAX_RETRIES} after ${delay}ms`);

          // Update status with retry count
          this.healthStatus$.next({
            ...this.healthStatus$.value,
            retryCount
          });

          return timer(delay);
        }
      }),
      catchError(error => {
        console.error('Health check failed:', error);
        return of({
          isHealthy: false,
          lastCheck: new Date(),
          error: this.getErrorMessage(error),
          retryCount: this.MAX_RETRIES
        });
      }),
      tap(status => this.healthStatus$.next(status))
    );
  }

  /**
   * Start periodic health checks
   */
  startPeriodicCheck(intervalMs: number = this.CHECK_INTERVAL): void {
    // Stop any existing check
    this.stopPeriodicCheck();

    // Initial check
    this.checkHealth().subscribe();

    // Schedule periodic checks
    this.checkSubscription = interval(intervalMs).pipe(
      switchMap(() => this.checkHealth())
    ).subscribe();
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicCheck(): void {
    if (this.checkSubscription) {
      this.checkSubscription.unsubscribe();
      this.checkSubscription = null;
    }
  }

  /**
   * Check if the backend is currently healthy
   */
  isHealthy(): boolean {
    return this.healthStatus$.value.isHealthy;
  }

  /**
   * Get human-readable error message
   */
  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'Unable to connect to server';
    } else if (error.status === 503) {
      return 'Service temporarily unavailable';
    } else if (error.status >= 500) {
      return 'Server error';
    } else if (error.status >= 400) {
      return 'Configuration error';
    } else if (error.name === 'TimeoutError') {
      return 'Connection timeout';
    } else {
      return 'Connection failed';
    }
  }

  /**
   * Force a health check immediately
   */
  forceCheck(): Observable<HealthStatus> {
    return this.checkHealth();
  }

  /**
   * Reset health status
   */
  reset(): void {
    this.healthStatus$.next({
      isHealthy: false,
      lastCheck: null,
      retryCount: 0
    });
  }
}