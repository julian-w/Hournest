import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let loginRedirect: ReturnType<Router['createUrlTree']>;
  let authServiceStub: {
    isLoggedIn: jasmine.Spy;
  };
  let routerStub: {
    createUrlTree: jasmine.Spy;
  };

  beforeEach(() => {
    loginRedirect = { redirectedTo: '/login' } as unknown as ReturnType<Router['createUrlTree']>;

    authServiceStub = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
    };

    routerStub = {
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue(loginRedirect),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
      ],
    });
  });

  it('allows navigation for logged-in users', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(authServiceStub.isLoggedIn).toHaveBeenCalled();
    expect(result).toBeTrue();
    expect(routerStub.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to login', () => {
    authServiceStub.isLoggedIn.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(authServiceStub.isLoggedIn).toHaveBeenCalled();
    expect(routerStub.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(loginRedirect);
  });
});
