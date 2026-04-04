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
import { TranslateService } from '@ngx-translate/core';

describe('AppComponent', () => {
  let translateServiceStub: { use: jasmine.Spy };

  beforeEach(async () => {
    localStorage.clear();
    translateServiceStub = {
      use: jasmine.createSpy('use'),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: signal(null).asReadonly(),
            isLoggedIn: signal(false).asReadonly(),
            isAdmin: signal(false).asReadonly(),
            logout: jasmine.createSpy('logout'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            isOAuthEnabled: signal(true).asReadonly(),
          },
        },
        {
          provide: MockService,
          useValue: {
            isActive: signal(false).asReadonly(),
          },
        },
        { provide: TranslateService, useValue: translateServiceStub },
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

    expect(translateServiceStub.use).toHaveBeenCalledWith('de');
    expect(fixture.componentInstance.currentLang()).toBe('de');
  });

  it('should switch language and persist it', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    fixture.componentInstance.switchLanguage('de');

    expect(translateServiceStub.use).toHaveBeenCalledWith('de');
    expect(localStorage.getItem('hournest_lang')).toBe('de');
    expect(fixture.componentInstance.currentLang()).toBe('de');
  });
});
