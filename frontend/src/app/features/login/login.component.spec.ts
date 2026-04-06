import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';
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
    isDemoEnabled: jasmine.Spy;
    demoSharedPasswordValue: jasmine.Spy;
    demoLoginUsersValue: jasmine.Spy;
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
      isDemoEnabled: jasmine.createSpy('isDemoEnabled').and.returnValue(false),
      demoSharedPasswordValue: jasmine.createSpy('demoSharedPasswordValue').and.returnValue(null),
      demoLoginUsersValue: jasmine.createSpy('demoLoginUsersValue').and.returnValue([]),
    };

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateNoOpLoader,
          },
        }),
      ],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: ConfigService, useValue: configServiceStub },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {});
    translate.use('en');
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
    const dialogOpenSpy = spyOn((component as never as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(true),
    } as never);

    component.username = 'user@example.com';
    component.password = 'secret123';

    await component.submitCredentials();

    expect(authServiceStub.loginWithCredentials).toHaveBeenCalledWith('user@example.com', 'secret123');
    expect(dialogOpenSpy).not.toHaveBeenCalled();
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
    const dialogOpenSpy = spyOn((component as never as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(true),
    } as never);

    component.username = 'user@example.com';
    component.password = 'secret123';

    await component.submitCredentials();

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(authServiceStub.clearPasswordChangeRequired).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.submitting()).toBeFalse();
  });

  it('should keep password change state when the forced dialog closes without success', async () => {
    authServiceStub.needsPasswordChange.and.returnValue(true);

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    const dialogOpenSpy = spyOn((component as never as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(false),
    } as never);

    component.username = 'user@example.com';
    component.password = 'secret123';

    await component.submitCredentials();

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(authServiceStub.clearPasswordChangeRequired).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should render public demo credentials when demo mode is enabled', () => {
    configServiceStub.isOAuthEnabled.and.returnValue(false);
    configServiceStub.isDemoEnabled.and.returnValue(true);
    configServiceStub.demoSharedPasswordValue.and.returnValue('public-demo-password');
    configServiceStub.demoLoginUsersValue.and.returnValue([
      {
        email: 'anna.admin@demo.hournest.local',
        display_name: 'Anna Admin',
        role: 'admin',
        login_hint: 'Admin user',
      },
    ]);

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('[data-testid="demo-login-credentials"]');
    expect(card).not.toBeNull();
    expect(card.textContent).toContain('public-demo-password');
    expect(card.textContent).toContain('anna.admin@demo.hournest.local');
  });

  it('should fill username and password when choosing a demo user', () => {
    configServiceStub.demoSharedPasswordValue.and.returnValue('public-demo-password');

    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.fillDemoLogin('anna.admin@demo.hournest.local');

    expect(component.username).toBe('anna.admin@demo.hournest.local');
    expect(component.password).toBe('public-demo-password');
  });
});
