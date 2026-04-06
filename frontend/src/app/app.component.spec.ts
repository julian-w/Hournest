import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { ConfigService } from './core/services/config.service';
import { MockService } from './core/mock/mock.service';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader, TranslateService } from '@ngx-translate/core';

describe('AppComponent', () => {
  let translateService: TranslateService;
  let currentUser: ReturnType<typeof signal<unknown | null>>;
  let isLoggedIn: ReturnType<typeof signal<boolean>>;
  let isAdmin: ReturnType<typeof signal<boolean>>;
  let oauthEnabled: ReturnType<typeof signal<boolean>>;
  let demoEnabled: ReturnType<typeof signal<boolean>>;
  let demoNotice: ReturnType<typeof signal<string>>;
  let passwordChangeAllowed: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    localStorage.clear();
    currentUser = signal(null);
    isLoggedIn = signal(false);
    isAdmin = signal(false);
    oauthEnabled = signal(true);
    demoEnabled = signal(false);
    demoNotice = signal('');
    passwordChangeAllowed = signal(true);

    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
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
        {
          provide: AuthService,
          useValue: {
            user: currentUser.asReadonly(),
            isLoggedIn: isLoggedIn.asReadonly(),
            isAdmin: isAdmin.asReadonly(),
            logout: jasmine.createSpy('logout'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            isOAuthEnabled: oauthEnabled.asReadonly(),
            isDemoEnabled: demoEnabled.asReadonly(),
            demoNoticeText: demoNotice.asReadonly(),
            isPasswordChangeAllowed: passwordChangeAllowed.asReadonly(),
          },
        },
        {
          provide: MockService,
          useValue: {
            isActive: signal(false).asReadonly(),
          },
        },
        {
          provide: BreakpointObserver,
          useValue: {
            observe: jasmine.createSpy('observe').and.returnValue(of({ matches: false })),
          },
        },
        {
          provide: MatDialog,
          useValue: {
            open: jasmine.createSpy('open'),
          },
        },
      ],
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    spyOn(translateService, 'use').and.callThrough();
    translateService.setTranslation('en', {});
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize language from local storage', () => {
    localStorage.setItem('hournest_lang', 'de');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(translateService.use).toHaveBeenCalledWith('de');
    expect(fixture.componentInstance.currentLang()).toBe('de');
  });

  it('should switch language and persist it', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    fixture.componentInstance.switchLanguage('de');

    expect(translateService.use).toHaveBeenCalledWith('de');
    expect(localStorage.getItem('hournest_lang')).toBe('de');
    expect(fixture.componentInstance.currentLang()).toBe('de');
  });

  it('should render the demo banner when demo mode is enabled', () => {
    demoEnabled.set(true);
    demoNotice.set('Public demo environment');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[data-testid="demo-banner"]');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('Public demo environment');
  });

  it('should render the change password button outside demo mode when local auth is enabled', () => {
    currentUser.set({ display_name: 'Anna Admin', role: 'admin' });
    isLoggedIn.set(true);
    isAdmin.set(true);
    oauthEnabled.set(false);
    demoEnabled.set(false);
    passwordChangeAllowed.set(true);

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('[data-testid="change-password-button"]');
    expect(button).not.toBeNull();
  });

  it('should hide the change password button when demo mode disables password changes', () => {
    currentUser.set({ display_name: 'Anna Admin', role: 'admin' });
    isLoggedIn.set(true);
    isAdmin.set(true);
    oauthEnabled.set(false);
    demoEnabled.set(true);
    demoNotice.set('Public demo environment');
    passwordChangeAllowed.set(false);

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[data-testid="demo-banner"]');
    const button = fixture.nativeElement.querySelector('[data-testid="change-password-button"]');

    expect(banner).not.toBeNull();
    expect(button).toBeNull();
  });
});
