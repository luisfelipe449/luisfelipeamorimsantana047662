import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, LoginRequest, TokenResponse } from './auth.service';
import { environment } from '@env/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/v1/auth`;

  const mockLoginResponse: TokenResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 300
  };

  const mockRefreshResponse: TokenResponse = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    expiresIn: 300
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
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

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
      const credentials: LoginRequest = { username: 'testuser', password: 'password123' };

      service.login(credentials).subscribe(response => {
        expect(response).toEqual(mockLoginResponse);
        expect(localStorage.getItem('access_token')).toBe(mockLoginResponse.accessToken);
        expect(localStorage.getItem('refresh_token')).toBe(mockLoginResponse.refreshToken);
        expect(localStorage.getItem('username')).toBe('testuser');
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockLoginResponse);
    });

    it('should update authentication state on successful login', (done) => {
      const credentials: LoginRequest = { username: 'testuser', password: 'password' };

      service.login(credentials).subscribe(() => {
        service.isAuthenticated$.subscribe(isAuth => {
          expect(isAuth).toBe(true);
          done();
        });
      });

      const req = httpMock.expectOne(`${API_URL}/login`);
      req.flush(mockLoginResponse);
    });

    it('should handle login error', (done) => {
      const credentials: LoginRequest = { username: 'testuser', password: 'wrongpassword' };

      service.login(credentials).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          expect(localStorage.getItem('access_token')).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(`${API_URL}/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Setup logged in state
      localStorage.setItem('access_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh');
      localStorage.setItem('username', 'testuser');
    });

    it('should clear tokens', () => {
      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
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
      localStorage.setItem('refresh_token', 'old-refresh-token');
    });

    it('should refresh tokens successfully', (done) => {
      service.refreshToken().subscribe(response => {
        expect(response).toEqual(mockRefreshResponse);
        expect(localStorage.getItem('access_token')).toBe(mockRefreshResponse.accessToken);
        expect(localStorage.getItem('refresh_token')).toBe(mockRefreshResponse.refreshToken);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'old-refresh-token' });
      req.flush(mockRefreshResponse);
    });

    it('should handle refresh token error and logout', (done) => {
      service.refreshToken().subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          expect(localStorage.getItem('access_token')).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(`${API_URL}/refresh`);
      req.flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should return error if no refresh token available', (done) => {
      localStorage.removeItem('refresh_token');

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
      localStorage.setItem('access_token', 'test-token');
      expect(service.getAccessToken()).toBe('test-token');
    });

    it('should get refresh token', () => {
      localStorage.setItem('refresh_token', 'test-refresh');
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
      localStorage.setItem('access_token', validToken);

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
      localStorage.setItem('access_token', expiredToken);

      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false for invalid token format', () => {
      localStorage.setItem('access_token', 'invalid-token');
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
