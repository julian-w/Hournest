import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
  let dashboardRedirect: ReturnType<Router['createUrlTree']>;
  let authServiceStub: {
    isAdmin: jasmine.Spy;
  };
  let routerStub: {
    createUrlTree: jasmine.Spy;
  };

  beforeEach(() => {
    dashboardRedirect = { redirectedTo: '/dashboard' } as unknown as ReturnType<Router['createUrlTree']>;

    authServiceStub = {
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(true),
    };

    routerStub = {
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue(dashboardRedirect),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
      ],
    });
  });

  it('allows navigation for admins', () => {
    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(authServiceStub.isAdmin).toHaveBeenCalled();
    expect(result).toBeTrue();
    expect(routerStub.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects non-admin users to dashboard', () => {
    authServiceStub.isAdmin.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(authServiceStub.isAdmin).toHaveBeenCalled();
    expect(routerStub.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe(dashboardRedirect);
  });
});
