import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  const user: User = {
    id: 1,
    email: 'user@example.com',
    display_name: 'Test User',
    role: 'employee',
    vacation_days_per_year: 30,
    remaining_vacation_days: 18,
    holidays_exempt: false,
    weekend_worker: false,
    must_change_password: false,
  };

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load the authenticated user successfully', async () => {
    const loadPromise = service.loadUser();

    const req = httpMock.expectOne('/api/user');
    expect(req.request.method).toBe('GET');
    req.flush({ data: user });

    await loadPromise;

    expect(service.user()).toEqual(user);
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.isLoaded()).toBeTrue();
    expect(service.needsPasswordChange()).toBeFalse();
  });

  it('should handle load user failure by clearing the session state', async () => {
    const loadPromise = service.loadUser();

    const req = httpMock.expectOne('/api/user');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await loadPromise;

    expect(service.user()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.isLoaded()).toBeTrue();
  });

  it('should log in with credentials and navigate when password change is not required', async () => {
    const loginPromise = service.loginWithCredentials('user@example.com', 'secret123');

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'user@example.com',
      password: 'secret123',
    });
    req.flush({
      data: user,
      message: 'Logged in successfully.',
      must_change_password: false,
    });

    await expectAsync(loginPromise).toBeResolvedTo(true);

    expect(service.user()).toEqual(user);
    expect(service.isLoaded()).toBeTrue();
    expect(service.needsPasswordChange()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should log in with credentials and require password change without navigating', async () => {
    const loginPromise = service.loginWithCredentials('user@example.com', 'secret123');

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({
      data: { ...user, must_change_password: true },
      message: 'Logged in successfully.',
      must_change_password: true,
    });

    await expectAsync(loginPromise).toBeResolvedTo(true);

    expect(service.user()?.email).toBe('user@example.com');
    expect(service.needsPasswordChange()).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should return false when credential login fails', async () => {
    const loginPromise = service.loginWithCredentials('user@example.com', 'wrong-password');

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ message: 'Invalid credentials.' }, { status: 401, statusText: 'Unauthorized' });

    await expectAsync(loginPromise).toBeResolvedTo(false);

    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should send the expected payload when changing password', () => {
    let responseBody: unknown;

    service.changePassword('old-pass', 'new-pass-123', 'new-pass-123').subscribe(response => {
      responseBody = response;
    });

    const req = httpMock.expectOne('/api/auth/change-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      current_password: 'old-pass',
      new_password: 'new-pass-123',
      new_password_confirmation: 'new-pass-123',
    });
    req.flush({ data: user, message: 'Password changed successfully.' });

    expect(responseBody).toEqual({
      data: user,
      message: 'Password changed successfully.',
    });
  });

  it('should clear password change state manually', async () => {
    const loginPromise = service.loginWithCredentials('user@example.com', 'secret123');

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({
      data: { ...user, must_change_password: true },
      message: 'Logged in successfully.',
      must_change_password: true,
    });

    await loginPromise;
    service.clearPasswordChangeRequired();

    expect(service.needsPasswordChange()).toBeFalse();
  });

  it('should clear session state and navigate on logout success', () => {
    service.logout();

    const req = httpMock.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Logged out successfully.' });

    expect(service.user()).toBeNull();
    expect(service.needsPasswordChange()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should still clear session state and navigate on logout error', () => {
    service.logout();

    const req = httpMock.expectOne('/api/auth/logout');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });

    expect(service.user()).toBeNull();
    expect(service.needsPasswordChange()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
