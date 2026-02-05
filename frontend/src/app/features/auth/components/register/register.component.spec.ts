import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register', 'isAuthenticated']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    authServiceSpy.isAuthenticated.and.returnValue(false);

    await TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTooltipModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.registerForm.get('name')?.value).toBe('');
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('username')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
  });

  it('should require all fields', () => {
    component.registerForm.patchValue({
      name: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: ''
    });

    expect(component.registerForm.valid).toBeFalse();
    expect(component.registerForm.get('name')?.hasError('required')).toBeTrue();
    expect(component.registerForm.get('email')?.hasError('required')).toBeTrue();
    expect(component.registerForm.get('username')?.hasError('required')).toBeTrue();
    expect(component.registerForm.get('password')?.hasError('required')).toBeTrue();
    expect(component.registerForm.get('confirmPassword')?.hasError('required')).toBeTrue();
  });

  it('should validate email format', () => {
    component.registerForm.get('email')?.setValue('invalid-email');
    expect(component.registerForm.get('email')?.hasError('email')).toBeTrue();

    component.registerForm.get('email')?.setValue('valid@email.com');
    expect(component.registerForm.get('email')?.hasError('email')).toBeFalse();
  });

  it('should validate username minimum length', () => {
    component.registerForm.get('username')?.setValue('ab');
    expect(component.registerForm.get('username')?.hasError('minlength')).toBeTrue();

    component.registerForm.get('username')?.setValue('abc');
    expect(component.registerForm.get('username')?.hasError('minlength')).toBeFalse();
  });

  it('should validate password minimum length', () => {
    component.registerForm.get('password')?.setValue('12345');
    expect(component.registerForm.get('password')?.hasError('minlength')).toBeTrue();

    component.registerForm.get('password')?.setValue('123456');
    expect(component.registerForm.get('password')?.hasError('minlength')).toBeFalse();
  });

  it('should validate password confirmation match', () => {
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'different'
    });
    component.registerForm.updateValueAndValidity();

    expect(component.registerForm.get('confirmPassword')?.hasError('passwordMismatch')).toBeTrue();

    component.registerForm.patchValue({
      confirmPassword: 'password123'
    });
    component.registerForm.updateValueAndValidity();

    expect(component.registerForm.get('confirmPassword')?.hasError('passwordMismatch')).toBeFalse();
  });

  it('should not submit if form is invalid', () => {
    component.onSubmit();
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should call register service on valid form submission', () => {
    const tokenResponse = {
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresIn: 300
    };
    authServiceSpy.register.and.returnValue(of(tokenResponse));

    component.registerForm.patchValue({
      name: 'Test User',
      email: 'test@email.com',
      username: 'testuser',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@email.com',
      username: 'testuser',
      password: 'password123'
    });
  });

  it('should navigate to artists on successful registration', () => {
    const tokenResponse = {
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresIn: 300
    };
    authServiceSpy.register.and.returnValue(of(tokenResponse));

    component.registerForm.patchValue({
      name: 'Test User',
      email: 'test@email.com',
      username: 'testuser',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/artists']);
  });

  it('should show success message on successful registration', () => {
    const tokenResponse = {
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresIn: 300
    };
    authServiceSpy.register.and.returnValue(of(tokenResponse));

    component.registerForm.patchValue({
      name: 'Test User',
      email: 'test@email.com',
      username: 'testuser',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Cadastro realizado com sucesso!',
      'Fechar',
      jasmine.any(Object)
    );
  });

  it('should show error message on registration failure', () => {
    const error = { status: 400, error: { message: 'Username já está em uso' } };
    authServiceSpy.register.and.returnValue(throwError(() => error));

    component.registerForm.patchValue({
      name: 'Test User',
      email: 'test@email.com',
      username: 'existinguser',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();

    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
  });

  it('should set isLoading to true during submission', () => {
    authServiceSpy.register.and.returnValue(of({
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresIn: 300
    }));

    component.registerForm.patchValue({
      name: 'Test User',
      email: 'test@email.com',
      username: 'testuser',
      password: 'password123',
      confirmPassword: 'password123'
    });

    expect(component.isLoading).toBeFalse();
    component.onSubmit();
  });

  it('should redirect if already authenticated on init', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    component.ngOnInit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/artists']);
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword).toBeTrue();
    component.hidePassword = !component.hidePassword;
    expect(component.hidePassword).toBeFalse();
  });

  it('should toggle confirm password visibility', () => {
    expect(component.hideConfirmPassword).toBeTrue();
    component.hideConfirmPassword = !component.hideConfirmPassword;
    expect(component.hideConfirmPassword).toBeFalse();
  });

  it('should have valid form when all fields are filled correctly', () => {
    component.registerForm.patchValue({
      name: 'Test User',
      email: 'test@email.com',
      username: 'testuser',
      password: 'password123',
      confirmPassword: 'password123'
    });

    expect(component.registerForm.valid).toBeTrue();
  });
});
