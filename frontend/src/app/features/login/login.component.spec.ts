import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { ConfigService } from '../../core/services/config.service';

describe('LoginComponent', () => {
  let authServiceStub: {
    login: jasmine.Spy;
    loginWithCredentials: jasmine.Spy;
    needsPasswordChange: jasmine.Spy;
    clearPasswordChangeRequired: jasmine.Spy;
  };
  let configServiceStub: {
    isOAuthEnabled: jasmine.Spy;
  };
  let dialogStub: {
    open: jasmine.Spy;
  };
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceStub = {
      login: jasmine.createSpy('login'),
      loginWithCredentials: jasmine.createSpy('loginWithCredentials').and.resolveTo(true),
      needsPasswordChange: jasmine.createSpy('needsPasswordChange').and.returnValue(false),
      clearPasswordChangeRequired: jasmine.createSpy('clearPasswordChangeRequired'),
    };

    configServiceStub = {
      isOAuthEnabled: jasmine.createSpy('isOAuthEnabled').and.returnValue(true),
    };

    dialogStub = {
      open: jasmine.createSpy('open').and.returnValue({
        afterClosed: () => of(true),
      }),
    };

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: ConfigService, useValue: configServiceStub },
        { provide: MatDialog, useValue: dialogStub },
        { provide: Router, useValue: router },
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => key,
            use: jasmine.createSpy('use'),
          },
        },
      ],
    }).compileComponents();
  });

  it('should not submit credentials when username or password is missing', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.username = 'user@example.com';
    component.password = '';

    await component.submitCredentials();

    expect(authServiceStub.loginWithCredentials).not.toHaveBeenCalled();
  });

  it('should submit credentials successfully without opening the password dialog', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.username = 'user@example.com';
    component.password = 'secret123';

    await component.submitCredentials();

    expect(authServiceStub.loginWithCredentials).toHaveBeenCalledWith('user@example.com', 'secret123');
    expect(dialogStub.open).not.toHaveBeenCalled();
    expect(component.error()).toBe('');
    expect(component.submitting()).toBeFalse();
  });

  it('should set an error when credential login fails', async () => {
    authServiceStub.loginWithCredentials.and.resolveTo(false);

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.username = 'user@example.com';
    component.password = 'wrong-password';

    await component.submitCredentials();

    expect(component.error()).toBe('login.error_invalid');
    expect(component.submitting()).toBeFalse();
  });

  it('should open the forced password change dialog and navigate after success', async () => {
    authServiceStub.needsPasswordChange.and.returnValue(true);

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.username = 'user@example.com';
    component.password = 'secret123';

    await component.submitCredentials();

    expect(dialogStub.open).toHaveBeenCalled();
    expect(authServiceStub.clearPasswordChangeRequired).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.submitting()).toBeFalse();
  });

  it('should keep password change state when the forced dialog closes without success', async () => {
    authServiceStub.needsPasswordChange.and.returnValue(true);
    dialogStub.open.and.returnValue({
      afterClosed: () => of(false),
    });

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.username = 'user@example.com';
    component.password = 'secret123';

    await component.submitCredentials();

    expect(dialogStub.open).toHaveBeenCalled();
    expect(authServiceStub.clearPasswordChangeRequired).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
