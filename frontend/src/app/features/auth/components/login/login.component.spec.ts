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
    username: 'testuser'
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

    it('should have minLength validator for username', () => {
      const usernameControl = component.loginForm.get('username');
      usernameControl?.setValue('a');

      expect(usernameControl?.hasError('minlength')).toBe(true);
    });

    it('should have minLength validator for password', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('123');

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

    it('should show validation errors when form is submitted invalid', () => {
      component.onSubmit();

      expect(component.loginForm.get('username')?.touched).toBe(true);
      expect(component.loginForm.get('password')?.touched).toBe(true);
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should start with password hidden', () => {
      expect(component.hidePassword).toBe(true);
    });

    it('should toggle password visibility', () => {
      component.togglePasswordVisibility();
      expect(component.hidePassword).toBe(false);

      component.togglePasswordVisibility();
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

      expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
    });

    it('should navigate to home on successful login', () => {
      authService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should show success message on successful login', () => {
      authService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Login realizado com sucesso!',
        'OK',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should set loading state during login', () => {
      authService.login.and.returnValue(of(mockLoginResponse));

      expect(component.loading).toBe(false);

      component.onSubmit();
      expect(component.loading).toBe(true);

      // After completion
      fixture.detectChanges();
      expect(component.loading).toBe(false);
    });

    it('should handle login error with invalid credentials', () => {
      const error = { status: 401, error: { message: 'Invalid credentials' } };
      authService.login.and.returnValue(throwError(() => error));

      component.onSubmit();

      expect(component.error).toBe('Usuário ou senha inválidos');
      expect(snackBar.open).toHaveBeenCalledWith(
        'Usuário ou senha inválidos',
        'OK',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['error-snackbar']
        })
      );
      expect(component.loading).toBe(false);
    });

    it('should handle generic login error', () => {
      const error = { status: 500, error: { message: 'Server error' } };
      authService.login.and.returnValue(throwError(() => error));

      component.onSubmit();

      expect(component.error).toBe('Erro ao fazer login. Tente novamente.');
      expect(component.loading).toBe(false);
    });

    it('should not submit if form is invalid', () => {
      component.loginForm.patchValue({
        username: '',
        password: ''
      });

      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should not submit if already loading', () => {
      component.loading = true;
      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should check authentication status on init', () => {
      authService.isAuthenticated.and.returnValue(true);

      component.ngOnInit();

      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should not navigate if not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);
      router.navigate.calls.reset();

      component.ngOnInit();

      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should clear error when form is modified', () => {
      component.error = 'Test error';

      component.loginForm.patchValue({ username: 'newuser' });

      expect(component.error).toBe('');
    });

    it('should display error message in template', () => {
      component.error = 'Test error message';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const errorElement = compiled.querySelector('.error-message');

      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error message');
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

    it('should disable submit button when loading', () => {
      component.loginForm.patchValue({
        username: 'testuser',
        password: 'password123'
      });
      component.loading = true;
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.disabled).toBe(true);
    });
  });

  describe('Helper Methods', () => {
    it('should get username error message for required', () => {
      component.loginForm.get('username')?.setValue('');
      component.loginForm.get('username')?.markAsTouched();

      expect(component.getUsernameErrorMessage()).toBe('Username is required');
    });

    it('should get username error message for minlength', () => {
      component.loginForm.get('username')?.setValue('ab');
      component.loginForm.get('username')?.markAsTouched();

      expect(component.getUsernameErrorMessage()).toBe('Username must be at least 3 characters');
    });

    it('should get password error message for required', () => {
      component.loginForm.get('password')?.setValue('');
      component.loginForm.get('password')?.markAsTouched();

      expect(component.getPasswordErrorMessage()).toBe('Password is required');
    });

    it('should get password error message for minlength', () => {
      component.loginForm.get('password')?.setValue('1234');
      component.loginForm.get('password')?.markAsTouched();

      expect(component.getPasswordErrorMessage()).toBe('Password must be at least 6 characters');
    });

    it('should return empty string when no error', () => {
      component.loginForm.get('username')?.setValue('validuser');
      component.loginForm.get('password')?.setValue('validpassword');

      expect(component.getUsernameErrorMessage()).toBe('');
      expect(component.getPasswordErrorMessage()).toBe('');
    });
  });
});