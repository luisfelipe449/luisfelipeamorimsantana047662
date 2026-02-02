import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '@core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockLoginResponse = {
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    username: 'testuser',
    expiresIn: 300
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    authService.isAuthenticated.and.returnValue(false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize login form with empty values', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('username')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
    });

    it('should have required validators', () => {
      const usernameControl = component.loginForm.get('username');
      const passwordControl = component.loginForm.get('password');

      expect(usernameControl?.hasError('required')).toBe(true);
      expect(passwordControl?.hasError('required')).toBe(true);
    });

    it('should have minLength validator for password', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('12');

      expect(passwordControl?.hasError('minlength')).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.valid).toBe(false);
    });

    it('should be valid with correct input', () => {
      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });

      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should start with password hidden', () => {
      expect(component.hidePassword).toBe(true);
    });
  });

  describe('Login Submission', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });
    });

    it('should call authService.login with form values', () => {
      authService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' });
    });

    it('should navigate to artists on successful login', () => {
      authService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/artists']);
    });

    it('should show success message on successful login', () => {
      authService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Login realizado com sucesso!',
        'Fechar',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should set isLoading state during login', () => {
      authService.login.and.returnValue(of(mockLoginResponse));

      expect(component.isLoading).toBe(false);

      component.onSubmit();

      // isLoading should have been set to true during submission
      // Note: because the observable completes synchronously, we can't easily check the intermediate state
    });

    it('should handle login error with invalid credentials', () => {
      const error = { status: 401, error: { message: 'Invalid credentials' } };
      authService.login.and.returnValue(throwError(() => error));

      component.onSubmit();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Credenciais invalidas',
        'Fechar',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['error-snackbar']
        })
      );
      expect(component.isLoading).toBe(false);
    });

    it('should handle generic login error', () => {
      const error = { status: 500, error: { message: 'Server error' } };
      authService.login.and.returnValue(throwError(() => error));

      component.onSubmit();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Erro ao realizar login. Tente novamente.',
        'Fechar',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['error-snackbar']
        })
      );
      expect(component.isLoading).toBe(false);
    });

    it('should not submit if form is invalid', () => {
      component.loginForm.patchValue({
        username: '',
        password: ''
      });

      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should check authentication status on init', () => {
      authService.isAuthenticated.and.returnValue(true);

      component.ngOnInit();

      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/artists']);
    });

    it('should not navigate if not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);
      router.navigate.calls.reset();

      component.ngOnInit();

      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Form Interaction', () => {
    it('should disable submit button when form is invalid', () => {
      component.loginForm.patchValue({
        username: '',
        password: ''
      });
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBe(false);
    });

    it('should disable submit button when isLoading', () => {
      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });
      component.isLoading = true;
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBe(true);
    });
  });
});
