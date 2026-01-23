import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '@env/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  const API_URL = environment.apiUrl;

  const mockLoginResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    username: 'testuser'
  };

  const mockRefreshResponse = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token'
  };

  // Mock JWT token payload
  const mockTokenPayload = {
    sub: 'testuser',
    exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
    iat: Math.floor(Date.now() / 1000)
  };

  // Create a mock JWT token
  const createMockToken = (payload: any): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const signature = 'mock-signature';
    return `${header}.${body}.${signature}`;
  };

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store tokens', (done) => {
      const username = 'testuser';
      const password = 'password123';

      service.login(username, password).subscribe(response => {
        expect(response).toEqual(mockLoginResponse);
        expect(localStorage.getItem('accessToken')).toBe(mockLoginResponse.accessToken);
        expect(localStorage.getItem('refreshToken')).toBe(mockLoginResponse.refreshToken);
        expect(localStorage.getItem('username')).toBe(mockLoginResponse.username);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/v1/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username, password });
      req.flush(mockLoginResponse);
    });

    it('should update authentication state on successful login', (done) => {
      service.login('testuser', 'password').subscribe(() => {
        service.isAuthenticated$.subscribe(isAuth => {
          expect(isAuth).toBe(true);
          done();
        });
      });

      const req = httpMock.expectOne(`${API_URL}/v1/auth/login`);
      req.flush(mockLoginResponse);
    });

    it('should handle login error', (done) => {
      service.login('testuser', 'wrongpassword').subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          expect(localStorage.getItem('accessToken')).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(`${API_URL}/v1/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle network error during login', (done) => {
      service.login('testuser', 'password').subscribe({
        error: (error) => {
          expect(error.error.type).toBe('error');
          done();
        }
      });

      const req = httpMock.expectOne(`${API_URL}/v1/auth/login`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Setup logged in state
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('refreshToken', 'test-refresh');
      localStorage.setItem('username', 'testuser');
    });

    it('should clear tokens and navigate to login', () => {
      service.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should update authentication state on logout', (done) => {
      service.logout();

      service.isAuthenticated$.subscribe(isAuth => {
        expect(isAuth).toBe(false);
        done();
      });
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      localStorage.setItem('refreshToken', 'old-refresh-token');
    });

    it('should refresh tokens successfully', (done) => {
      service.refreshToken().subscribe(response => {
        expect(response).toEqual(mockRefreshResponse);
        expect(localStorage.getItem('accessToken')).toBe(mockRefreshResponse.accessToken);
        expect(localStorage.getItem('refreshToken')).toBe(mockRefreshResponse.refreshToken);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/v1/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'old-refresh-token' });
      req.flush(mockRefreshResponse);
    });

    it('should handle refresh token error and logout', (done) => {
      service.refreshToken().subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          expect(localStorage.getItem('accessToken')).toBeNull();
          expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
          done();
        }
      });

      const req = httpMock.expectOne(`${API_URL}/v1/auth/refresh`);
      req.flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should return error if no refresh token available', (done) => {
      localStorage.removeItem('refreshToken');

      service.refreshToken().subscribe({
        error: (error) => {
          expect(error.message).toContain('No refresh token');
          done();
        }
      });
    });
  });

  describe('token management', () => {
    it('should get access token', () => {
      localStorage.setItem('accessToken', 'test-token');
      expect(service.getAccessToken()).toBe('test-token');
    });

    it('should get refresh token', () => {
      localStorage.setItem('refreshToken', 'test-refresh');
      expect(service.getRefreshToken()).toBe('test-refresh');
    });

    it('should get username', () => {
      localStorage.setItem('username', 'testuser');
      expect(service.getUsername()).toBe('testuser');
    });

    it('should return null when tokens are not set', () => {
      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
      expect(service.getUsername()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', () => {
      const validToken = createMockToken(mockTokenPayload);
      localStorage.setItem('accessToken', validToken);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false when token is expired', () => {
      const expiredPayload = {
        ...mockTokenPayload,
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      const expiredToken = createMockToken(expiredPayload);
      localStorage.setItem('accessToken', expiredToken);

      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false for invalid token format', () => {
      localStorage.setItem('accessToken', 'invalid-token');
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const validToken = createMockToken(mockTokenPayload);
      expect(service.isTokenExpired(validToken)).toBe(false);
    });

    it('should return true for expired token', () => {
      const expiredPayload = {
        ...mockTokenPayload,
        exp: Math.floor(Date.now() / 1000) - 3600
      };
      const expiredToken = createMockToken(expiredPayload);
      expect(service.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for null token', () => {
      expect(service.isTokenExpired(null)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(service.isTokenExpired('invalid')).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      const tokenWithoutExp = createMockToken({ sub: 'user' });
      expect(service.isTokenExpired(tokenWithoutExp)).toBe(true);
    });
  });

  describe('isRefreshTokenExpired', () => {
    it('should return false when refresh token exists and is valid', () => {
      const validToken = createMockToken({
        ...mockTokenPayload,
        exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
      });
      localStorage.setItem('refreshToken', validToken);

      expect(service.isRefreshTokenExpired()).toBe(false);
    });

    it('should return true when refresh token is expired', () => {
      const expiredToken = createMockToken({
        ...mockTokenPayload,
        exp: Math.floor(Date.now() / 1000) - 3600
      });
      localStorage.setItem('refreshToken', expiredToken);

      expect(service.isRefreshTokenExpired()).toBe(true);
    });

    it('should return true when no refresh token exists', () => {
      expect(service.isRefreshTokenExpired()).toBe(true);
    });
  });

  describe('decodeToken', () => {
    it('should decode valid token', () => {
      const token = createMockToken(mockTokenPayload);
      const decoded = service.decodeToken(token);

      expect(decoded).toEqual(mockTokenPayload);
    });

    it('should return null for invalid token', () => {
      expect(service.decodeToken('invalid')).toBeNull();
    });

    it('should return null for null token', () => {
      expect(service.decodeToken(null)).toBeNull();
    });

    it('should handle malformed base64 in token', () => {
      const malformedToken = 'header.malformed!@#$.signature';
      expect(service.decodeToken(malformedToken)).toBeNull();
    });
  });

  describe('checkAuthStatus', () => {
    it('should set authenticated to true if valid token exists', () => {
      const validToken = createMockToken(mockTokenPayload);
      localStorage.setItem('accessToken', validToken);

      service.checkAuthStatus();

      service.isAuthenticated$.subscribe(isAuth => {
        expect(isAuth).toBe(true);
      });
    });

    it('should set authenticated to false if token is expired', () => {
      const expiredToken = createMockToken({
        ...mockTokenPayload,
        exp: Math.floor(Date.now() / 1000) - 3600
      });
      localStorage.setItem('accessToken', expiredToken);

      service.checkAuthStatus();

      service.isAuthenticated$.subscribe(isAuth => {
        expect(isAuth).toBe(false);
      });
    });

    it('should set authenticated to false if no token exists', () => {
      service.checkAuthStatus();

      service.isAuthenticated$.subscribe(isAuth => {
        expect(isAuth).toBe(false);
      });
    });
  });
});