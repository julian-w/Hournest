import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfigService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load oauth config from the API', async () => {
    const loadPromise = service.loadConfig();

    const req = httpMock.expectOne('/api/auth/config');
    expect(req.request.method).toBe('GET');
    req.flush({
      data: {
        oauth_enabled: false,
        demo: {
          enabled: true,
          notice: 'Demo banner text',
          reference_date: '2026-04-06',
          password_change_allowed: false,
          login: {
            shared_password: 'public-demo-password',
            users: [
              {
                email: 'anna.admin@demo.hournest.local',
                display_name: 'Anna Admin',
                role: 'admin',
                login_hint: 'Admin user',
              },
            ],
          },
        },
      },
    });

    await loadPromise;

    expect(service.isOAuthEnabled()).toBeFalse();
    expect(service.isDemoEnabled()).toBeTrue();
    expect(service.demoNoticeText()).toBe('Demo banner text');
    expect(service.demoReferenceDateValue()).toBe('2026-04-06');
    expect(service.isPasswordChangeAllowed()).toBeFalse();
    expect(service.demoSharedPasswordValue()).toBe('public-demo-password');
    expect(service.demoLoginUsersValue().length).toBe(1);
  });

  it('should fall back to oauth enabled on request failure', async () => {
    const loadPromise = service.loadConfig();

    const req = httpMock.expectOne('/api/auth/config');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });

    await loadPromise;

    expect(service.isOAuthEnabled()).toBeTrue();
    expect(service.isDemoEnabled()).toBeFalse();
    expect(service.isPasswordChangeAllowed()).toBeTrue();
    expect(service.demoSharedPasswordValue()).toBeNull();
    expect(service.demoLoginUsersValue()).toEqual([]);
  });
});
