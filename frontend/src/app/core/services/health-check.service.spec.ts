import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HealthCheckService, HealthStatus } from './health-check.service';
import { environment } from '@env/environment';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let httpMock: HttpTestingController;
  const API_URL = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HealthCheckService]
    });
    service = TestBed.inject(HealthCheckService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.stopPeriodicCheck();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkHealth', () => {
    it('should return healthy status when backend responds with UP', (done) => {
      const mockResponse = {
        status: 'UP',
        components: {
          db: { status: 'UP' },
          diskSpace: { status: 'UP' }
        }
      };

      service.checkHealth().subscribe(status => {
        expect(status.isHealthy).toBe(true);
        expect(status.status).toBe('UP');
        expect(status.components).toEqual(mockResponse.components);
        expect(status.lastCheck).toBeTruthy();
        expect(status.retryCount).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/actuator/health`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return unhealthy status when backend responds with DOWN', (done) => {
      const mockResponse = {
        status: 'DOWN',
        components: {
          db: { status: 'DOWN' }
        }
      };

      service.checkHealth().subscribe(status => {
        expect(status.isHealthy).toBe(false);
        expect(status.status).toBe('DOWN');
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/actuator/health`);
      req.flush(mockResponse);
    });

    it('should handle network errors gracefully', (done) => {
      service.checkHealth().subscribe(status => {
        expect(status.isHealthy).toBe(false);
        expect(status.error).toBe('Unable to connect to server');
        expect(status.lastCheck).toBeTruthy();
        done();
      });

      // Simulate network error after retries
      for (let i = 0; i <= 3; i++) {
        const req = httpMock.expectOne(`${API_URL}/actuator/health`);
        req.error(new ErrorEvent('Network error'), { status: 0 });
      }
    });

    it('should handle 503 Service Unavailable', (done) => {
      service.checkHealth().subscribe(status => {
        expect(status.isHealthy).toBe(false);
        expect(status.error).toBe('Service temporarily unavailable');
        done();
      });

      // Simulate 503 error after retries
      for (let i = 0; i <= 3; i++) {
        const req = httpMock.expectOne(`${API_URL}/actuator/health`);
        req.flush({}, { status: 503, statusText: 'Service Unavailable' });
      }
    });

    it('should handle 500 Internal Server Error', (done) => {
      service.checkHealth().subscribe(status => {
        expect(status.isHealthy).toBe(false);
        expect(status.error).toBe('Server error');
        done();
      });

      // Simulate 500 error after retries
      for (let i = 0; i <= 3; i++) {
        const req = httpMock.expectOne(`${API_URL}/actuator/health`);
        req.flush({}, { status: 500, statusText: 'Internal Server Error' });
      }
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status as observable', (done) => {
      const initialStatus: HealthStatus = {
        isHealthy: false,
        lastCheck: null,
        retryCount: 0
      };

      service.getHealthStatus().subscribe(status => {
        expect(status).toEqual(initialStatus);
        done();
      });
    });

    it('should emit updated status after health check', (done) => {
      const mockResponse = {
        status: 'UP',
        components: {}
      };

      let emissionCount = 0;
      service.getHealthStatus().subscribe(status => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(status.isHealthy).toBe(true);
          expect(status.status).toBe('UP');
          done();
        }
      });

      service.checkHealth().subscribe();

      const req = httpMock.expectOne(`${API_URL}/actuator/health`);
      req.flush(mockResponse);
    });
  });

  describe('getCurrentStatus', () => {
    it('should return current status value', () => {
      const status = service.getCurrentStatus();
      expect(status).toBeDefined();
      expect(status.isHealthy).toBe(false);
      expect(status.lastCheck).toBeNull();
    });
  });

  describe('isHealthy', () => {
    it('should return false initially', () => {
      expect(service.isHealthy()).toBe(false);
    });

    it('should return true after successful health check', (done) => {
      const mockResponse = {
        status: 'UP',
        components: {}
      };

      service.checkHealth().subscribe(() => {
        expect(service.isHealthy()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/actuator/health`);
      req.flush(mockResponse);
    });
  });

  describe('forceCheck', () => {
    it('should trigger immediate health check', (done) => {
      const mockResponse = {
        status: 'UP',
        components: {}
      };

      service.forceCheck().subscribe(status => {
        expect(status.isHealthy).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/actuator/health`);
      req.flush(mockResponse);
    });
  });

  describe('reset', () => {
    it('should reset health status to initial state', (done) => {
      // First set a healthy status
      const mockResponse = {
        status: 'UP',
        components: {}
      };

      service.checkHealth().subscribe(() => {
        expect(service.isHealthy()).toBe(true);

        // Reset
        service.reset();

        // Check reset worked
        expect(service.isHealthy()).toBe(false);
        const status = service.getCurrentStatus();
        expect(status.lastCheck).toBeNull();
        expect(status.retryCount).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/actuator/health`);
      req.flush(mockResponse);
    });
  });

  describe('startPeriodicCheck', () => {
    it('should perform initial check immediately', () => {
      jasmine.clock().install();

      service.startPeriodicCheck(5000);

      // Should trigger immediate check
      const req = httpMock.expectOne(`${API_URL}/actuator/health`);
      expect(req.request.method).toBe('GET');
      req.flush({ status: 'UP' });

      jasmine.clock().uninstall();
    });

    it('should stop existing check when starting new one', () => {
      spyOn(service, 'stopPeriodicCheck');
      service.startPeriodicCheck(5000);

      expect(service.stopPeriodicCheck).toHaveBeenCalled();

      // Flush the initial check
      const req = httpMock.expectOne(`${API_URL}/actuator/health`);
      req.flush({ status: 'UP' });
    });
  });

  describe('stopPeriodicCheck', () => {
    it('should stop periodic health checks', () => {
      service.startPeriodicCheck(5000);

      // Flush initial check
      const req1 = httpMock.expectOne(`${API_URL}/actuator/health`);
      req1.flush({ status: 'UP' });

      service.stopPeriodicCheck();

      // No further requests should be made
      httpMock.expectNone(`${API_URL}/actuator/health`);
    });
  });
});